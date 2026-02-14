// /api/admin/rfq/close-unsuccessful
// Admin action: Close an RFQ as unsuccessful (no/low vendor match) and notify the buyer
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { rfqId, reason, adminMessage, adminUserId } = body;

    if (!rfqId) {
      return NextResponse.json({ error: 'rfqId is required' }, { status: 400 });
    }

    // 1. Fetch the RFQ details
    const { data: rfq, error: rfqErr } = await supabase
      .from('rfqs')
      .select('id, title, description, user_id, status, rfq_type, category_slug, category, county')
      .eq('id', rfqId)
      .single();

    if (rfqErr || !rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    }

    // 2. Update RFQ status to 'unsuccessful'
    const { error: updateErr } = await supabase
      .from('rfqs')
      .update({
        status: 'unsuccessful',
        closed_at: new Date().toISOString(),
        admin_close_reason: reason || 'no_vendor_match',
        admin_close_message: adminMessage || null,
      })
      .eq('id', rfqId);

    if (updateErr) {
      console.error('[CLOSE-UNSUCCESSFUL] Update error:', updateErr);
      return NextResponse.json({ error: 'Failed to update RFQ status' }, { status: 500 });
    }

    // 3. Build notification message for the buyer/user
    const reasonLabels = {
      no_vendor_match: 'no vendors were found matching your requirements',
      low_vendor_match: 'we could not find enough qualified vendors for your project',
      no_vendor_response: 'no vendors responded to your request',
      category_unavailable: 'there are currently no vendors available in your requested category',
      location_unavailable: 'there are no vendors available in your specified location',
      custom: adminMessage || 'your RFQ could not be fulfilled at this time',
    };

    const reasonText = reasonLabels[reason] || reasonLabels.no_vendor_match;
    const category = rfq.category_slug || rfq.category || 'your category';
    const county = rfq.county || '';

    let notificationBody = `Unfortunately, your RFQ "${rfq.title}" has been marked as unsuccessful because ${reasonText}.`;

    if (adminMessage && reason !== 'custom') {
      notificationBody += `\n\nMessage from Zintra team: ${adminMessage}`;
    }

    notificationBody += '\n\nYou can submit a new RFQ with broader criteria, or try a different category. Our team is working to onboard more vendors in all regions.';

    // 4. Send notification to the buyer/user
    if (rfq.user_id) {
      const { error: notifErr } = await supabase
        .from('notifications')
        .insert({
          user_id: rfq.user_id,
          type: 'rfq_unsuccessful',
          title: 'RFQ Not Successful — No Vendor Match',
          body: notificationBody,
          metadata: {
            rfq_id: rfqId,
            rfq_title: rfq.title,
            reason: reason || 'no_vendor_match',
            admin_message: adminMessage || null,
            category: category,
            county: county,
          },
          related_id: rfqId,
          related_type: 'rfq',
        });

      if (notifErr) {
        console.error('[CLOSE-UNSUCCESSFUL] Notification insert error:', notifErr);
      } else {
        console.log('[CLOSE-UNSUCCESSFUL] ✅ Sent rfq_unsuccessful notification to user:', rfq.user_id);
      }
    }

    // 5. Log admin action for audit trail
    console.log('[CLOSE-UNSUCCESSFUL] Admin', adminUserId, 'closed RFQ', rfqId, 'as unsuccessful. Reason:', reason);

    return NextResponse.json({
      success: true,
      message: `RFQ "${rfq.title}" marked as unsuccessful. User has been notified.`,
      rfqId,
      status: 'unsuccessful',
    });
  } catch (err) {
    console.error('[CLOSE-UNSUCCESSFUL] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
