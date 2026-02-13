'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/job-orders — List job orders for current user (buyer or vendor)
 * Query params: ?userId=xxx&role=buyer|vendor|all
 * 
 * POST /api/job-orders — Create job order from accepted negotiation (internal use)
 * 
 * PATCH /api/job-orders — Update job order status
 * Body: { jobOrderId, action: 'confirm'|'start'|'complete'|'cancel', userId, reason? }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role') || 'all';

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    let query = supabase
      .from('job_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (role === 'buyer') {
      query = query.eq('buyer_id', userId);
    } else if (role === 'vendor') {
      query = query.eq('vendor_id', userId);
    } else {
      query = query.or(`buyer_id.eq.${userId},vendor_id.eq.${userId}`);
    }

    const { data: orders, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch job orders', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orders: orders || [] });

  } catch (error) {
    console.error('Get job orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch job orders', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { negotiationId, rfqId, rfqQuoteId, buyerId, vendorId, agreedPrice, paymentTerms, deliveryDate, scopeSummary } = body;

    if (!negotiationId || !buyerId || !vendorId || !agreedPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: negotiationId, buyerId, vendorId, agreedPrice' },
        { status: 400 }
      );
    }

    // Check for existing job order for this negotiation
    const { data: existing } = await supabase
      .from('job_orders')
      .select('id')
      .eq('negotiation_id', negotiationId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, jobOrder: existing, existing: true });
    }

    // Create job order
    const { data: jobOrder, error: createError } = await supabase
      .from('job_orders')
      .insert({
        negotiation_id: negotiationId,
        rfq_id: rfqId || null,
        rfq_quote_id: rfqQuoteId || null,
        buyer_id: buyerId,
        vendor_id: vendorId,
        agreed_price: agreedPrice,
        payment_terms: paymentTerms || null,
        delivery_date: deliveryDate || null,
        scope_summary: scopeSummary || null,
        status: 'created'
      })
      .select()
      .single();

    if (createError) {
      console.error('Create job order error:', createError);
      return NextResponse.json({ error: 'Failed to create job order', details: createError.message }, { status: 500 });
    }

    // Notify both parties
    const notifications = [
      {
        user_id: buyerId,
        type: 'job_order_created',
        title: 'Job Order Created 📋',
        body: `A job order for KSh ${parseFloat(agreedPrice).toLocaleString()} has been generated. Please review and confirm.`,
        metadata: { job_order_id: jobOrder.id, negotiation_id: negotiationId, rfq_id: rfqId },
        related_id: jobOrder.id,
        related_type: 'job_order'
      },
      {
        user_id: vendorId,
        type: 'job_order_created',
        title: 'Job Order Created 📋',
        body: `A job order for KSh ${parseFloat(agreedPrice).toLocaleString()} has been generated from your accepted quote. Please review and confirm.`,
        metadata: { job_order_id: jobOrder.id, negotiation_id: negotiationId, rfq_id: rfqId },
        related_id: jobOrder.id,
        related_type: 'job_order'
      }
    ];

    await supabase.from('notifications').insert(notifications);

    return NextResponse.json({ success: true, jobOrder, existing: false });

  } catch (error) {
    console.error('Create job order error:', error);
    return NextResponse.json({ error: 'Failed to create job order', details: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { jobOrderId, action, userId, reason } = body;

    if (!jobOrderId || !action || !userId) {
      return NextResponse.json({ error: 'Missing required: jobOrderId, action, userId' }, { status: 400 });
    }

    // Fetch job order
    const { data: jobOrder, error: fetchError } = await supabase
      .from('job_orders')
      .select('*')
      .eq('id', jobOrderId)
      .single();

    if (fetchError || !jobOrder) {
      return NextResponse.json({ error: 'Job order not found' }, { status: 404 });
    }

    // Verify participant
    if (userId !== jobOrder.buyer_id && userId !== jobOrder.vendor_id) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const isBuyer = userId === jobOrder.buyer_id;
    const otherPartyId = isBuyer ? jobOrder.vendor_id : jobOrder.buyer_id;
    const now = new Date().toISOString();

    // ── CONFIRM ──
    if (action === 'confirm') {
      const updates = { updated_at: now };
      if (isBuyer) {
        updates.confirmed_by_buyer = true;
      } else {
        updates.confirmed_by_vendor = true;
      }

      // Check if both confirmed → auto-move to confirmed
      const otherConfirmed = isBuyer ? jobOrder.confirmed_by_vendor : jobOrder.confirmed_by_buyer;
      if (otherConfirmed) {
        updates.status = 'confirmed';
      }

      await supabase.from('job_orders').update(updates).eq('id', jobOrderId);

      await supabase.from('notifications').insert({
        user_id: otherPartyId,
        type: 'job_order_confirmed',
        title: `Job Order ${otherConfirmed ? 'Fully Confirmed ✅' : 'Confirmation Received'}`,
        body: otherConfirmed
          ? 'Both parties have confirmed the job order. Work can now begin!'
          : `The ${isBuyer ? 'buyer' : 'vendor'} has confirmed the job order. Please confirm from your side.`,
        metadata: { job_order_id: jobOrderId, rfq_id: jobOrder.rfq_id },
        related_id: jobOrderId,
        related_type: 'job_order'
      });

      return NextResponse.json({ success: true, action: 'confirmed', bothConfirmed: !!otherConfirmed });
    }

    // ── START WORK ──
    if (action === 'start') {
      if (jobOrder.status !== 'confirmed') {
        return NextResponse.json({ error: 'Job order must be confirmed before starting' }, { status: 400 });
      }

      await supabase.from('job_orders').update({
        status: 'in_progress',
        started_at: now,
        updated_at: now
      }).eq('id', jobOrderId);

      await supabase.from('notifications').insert({
        user_id: otherPartyId,
        type: 'job_order_started',
        title: 'Work Has Started 🚀',
        body: `The ${isBuyer ? 'buyer' : 'vendor'} has marked the job as started.`,
        metadata: { job_order_id: jobOrderId, rfq_id: jobOrder.rfq_id },
        related_id: jobOrderId,
        related_type: 'job_order'
      });

      return NextResponse.json({ success: true, action: 'started' });
    }

    // ── COMPLETE ──
    if (action === 'complete') {
      if (jobOrder.status !== 'in_progress') {
        return NextResponse.json({ error: 'Job must be in progress to complete' }, { status: 400 });
      }

      await supabase.from('job_orders').update({
        status: 'completed',
        completed_at: now,
        updated_at: now
      }).eq('id', jobOrderId);

      await supabase.from('notifications').insert({
        user_id: otherPartyId,
        type: 'job_order_completed',
        title: 'Job Completed ✅',
        body: `The job has been marked as completed by the ${isBuyer ? 'buyer' : 'vendor'}.`,
        metadata: { job_order_id: jobOrderId, rfq_id: jobOrder.rfq_id },
        related_id: jobOrderId,
        related_type: 'job_order'
      });

      return NextResponse.json({ success: true, action: 'completed' });
    }

    // ── CANCEL ──
    if (action === 'cancel') {
      await supabase.from('job_orders').update({
        status: 'cancelled',
        cancelled_at: now,
        cancellation_reason: reason || null,
        updated_at: now
      }).eq('id', jobOrderId);

      await supabase.from('notifications').insert({
        user_id: otherPartyId,
        type: 'job_order_cancelled',
        title: 'Job Order Cancelled',
        body: `The job order has been cancelled by the ${isBuyer ? 'buyer' : 'vendor'}.${reason ? ` Reason: ${reason}` : ''}`,
        metadata: { job_order_id: jobOrderId, rfq_id: jobOrder.rfq_id, reason },
        related_id: jobOrderId,
        related_type: 'job_order'
      });

      return NextResponse.json({ success: true, action: 'cancelled' });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    console.error('Job order PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update job order', details: error.message }, { status: 500 });
  }
}
