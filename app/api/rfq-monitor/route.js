'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Simple monitoring endpoint to be called by a cron (e.g., Vercel scheduled job)
// Rules:
// - After 1h with 0 quotes: mark needs_attention and insert notification
// - After 3d with <3 quotes: notify user
// - After 7d with 0 quotes: mark no_interest
// - After 30d: close RFQ

export async function GET() {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Service role key missing' }), { status: 500 });
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch open RFQs
  const { data: rfqs, error } = await supabaseAdmin
    .from('rfqs')
    .select('id, user_id, created_at, status, title, budget_range, category, county, location')
    .in('status', ['open', 'active']);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const ids = rfqs.map((r) => r.id);
  const { data: responses } = await supabaseAdmin
    .from('rfq_responses')
    .select('rfq_id');
  const respCount = (responses || []).reduce((acc, r) => {
    acc[r.rfq_id] = (acc[r.rfq_id] || 0) + 1;
    return acc;
  }, {});

  const { data: reqs } = await supabaseAdmin.from('rfq_requests').select('rfq_id, vendor_id');
  const existingByRfq = (reqs || []).reduce((acc, r) => {
    if (!acc[r.rfq_id]) acc[r.rfq_id] = new Set();
    acc[r.rfq_id].add(r.vendor_id);
    return acc;
  }, {});

  const updates = [];
  const notifications = [];
  const widenList = [];

  rfqs.forEach((rfq) => {
    const created = new Date(rfq.created_at);
    const count = respCount[rfq.id] || 0;

    if (created.toISOString() < thirtyDaysAgo) {
      updates.push({ id: rfq.id, payload: { status: 'closed', validation_status: 'expired' } });
      notifications.push({
        user_id: rfq.user_id,
        type: 'rfq_status',
        title: 'RFQ closed',
        body: `${rfq.title} has been closed after 30 days.`,
        metadata: { rfq_id: rfq.id },
      });
      return;
    }

    if (count === 0 && created.toISOString() < sevenDaysAgo) {
      updates.push({ id: rfq.id, payload: { status: 'no_interest' } });
      notifications.push({
        user_id: rfq.user_id,
        type: 'rfq_status',
        title: 'No quotes received',
        body: `No vendors responded to "${rfq.title}". Consider adjusting budget or location.`,
        metadata: { rfq_id: rfq.id },
      });
      return;
    }

    if (count < 3 && created.toISOString() < threeDaysAgo) {
      notifications.push({
        user_id: rfq.user_id,
        type: 'rfq_status',
        title: 'Few quotes so far',
        body: `Only ${count} quotes received for "${rfq.title}". We can invite more vendors.`,
        metadata: { rfq_id: rfq.id },
      });
    }

    if (count === 0 && created.toISOString() < oneHourAgo) {
      updates.push({ id: rfq.id, payload: { status: 'needs_attention' } });
      notifications.push({
        user_id: rfq.user_id,
        type: 'rfq_status',
        title: 'We are expanding vendor search',
        body: `No quotes yet for "${rfq.title}". We will widen the vendor radius.`,
        metadata: { rfq_id: rfq.id },
      });
      widenList.push(rfq);
    }
  });

  const newRequests = [];
  for (const rfq of widenList) {
    const existingVendors = existingByRfq[rfq.id] || new Set();
    const { data: vendors } = await supabaseAdmin
      .from('vendors')
      .select('id, user_id, rating, verified, status, rfqs_completed, response_time')
      .eq('status', 'active')
      .eq('category', rfq.category);
    const picks = (vendors || [])
      .filter((v) => !existingVendors.has(v.user_id || v.id))
      .filter((v) => (v.rating || 0) >= 4.0 && (v.verified || false))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    picks.forEach((v) => {
      newRequests.push({
        rfq_id: rfq.id,
        vendor_id: v.user_id || v.id,
        status: 'pending',
      });
      notifications.push({
        user_id: v.user_id || v.id,
        type: 'rfq_match',
        title: `New RFQ: ${rfq.title}`,
        body: `${rfq.category} • ${rfq.county || rfq.location || 'Location provided'}`,
        metadata: { rfq_id: rfq.id, budget: rfq.budget_range },
      });
    });
  }

  for (const u of updates) {
    await supabaseAdmin.from('rfqs').update(u.payload).eq('id', u.id);
  }
  if (newRequests.length) {
    await supabaseAdmin.from('rfq_requests').insert(newRequests);
  }
  if (notifications.length) {
    await supabaseAdmin.from('notifications').insert(notifications);
  }

  return new Response(JSON.stringify({ processed: rfqs.length, updates: updates.length, notifications: notifications.length }), { status: 200 });
}
