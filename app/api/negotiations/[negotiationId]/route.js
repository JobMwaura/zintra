'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/negotiations/[negotiationId]
 * Fetch complete negotiation thread with counter offers, Q&A, and revisions
 * 
 * PATCH /api/negotiations/[negotiationId]
 * Accept or reject a counter offer, or close/cancel the negotiation
 * Body: { action: 'accept_offer' | 'reject_offer' | 'close' | 'cancel', offerId?, reason? }
 */
export async function GET(request, { params }) {
  try {
    const { negotiationId } = await params;

    if (!negotiationId) {
      return NextResponse.json(
        { error: 'Missing negotiation ID' },
        { status: 400 }
      );
    }

    // Fetch thread
    const { data: thread, error: threadError } = await supabase
      .from('negotiation_threads')
      .select('*')
      .eq('id', negotiationId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Negotiation thread not found' },
        { status: 404 }
      );
    }

    // Fetch counter offers (most recent first)
    const { data: counterOffers } = await supabase
      .from('counter_offers')
      .select('*')
      .eq('negotiation_id', negotiationId)
      .order('created_at', { ascending: false });

    // Fetch Q&A items (oldest first)
    const { data: qaItems } = await supabase
      .from('negotiation_qa')
      .select('*')
      .eq('negotiation_id', negotiationId)
      .order('created_at', { ascending: true });

    // Fetch quote revisions
    const { data: revisions } = await supabase
      .from('quote_revisions')
      .select('*')
      .eq('rfq_quote_id', thread.rfq_quote_id)
      .order('created_at', { ascending: false });

    // Stats
    const offers = counterOffers || [];
    const questions = qaItems || [];
    const acceptedOffers = offers.filter(co => co.status === 'accepted');
    const pendingOffers = offers.filter(co => co.status === 'pending');

    return NextResponse.json({
      thread: {
        ...thread,
        stats: {
          totalCounterOffers: offers.length,
          acceptedOffers: acceptedOffers.length,
          pendingOffers: pendingOffers.length,
          totalQuestions: questions.length,
          answeredQuestions: questions.filter(qa => qa.answer).length,
          unansweredQuestions: questions.filter(qa => !qa.answer).length,
          totalRevisions: (revisions || []).length
        }
      },
      counterOffers: offers,
      qaItems: questions,
      revisions: revisions || []
    });

  } catch (error) {
    console.error('Fetch negotiation error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch negotiation', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH — Accept/Reject an offer, or close/cancel the negotiation
 */
export async function PATCH(request, { params }) {
  try {
    const { negotiationId } = await params;
    const body = await request.json();
    const { action, offerId, reason, userId } = body;

    if (!negotiationId || !action || !userId) {
      return NextResponse.json(
        { error: 'Missing required: negotiationId, action, userId' },
        { status: 400 }
      );
    }

    // Fetch thread
    const { data: thread, error: threadError } = await supabase
      .from('negotiation_threads')
      .select('*')
      .eq('id', negotiationId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Negotiation not found' },
        { status: 404 }
      );
    }

    // Verify user is participant
    if (userId !== thread.user_id && userId !== thread.vendor_id) {
      return NextResponse.json(
        { error: 'User is not a participant in this negotiation' },
        { status: 403 }
      );
    }

    const isFromBuyer = userId === thread.user_id;

    // ── ACCEPT OFFER ──
    if (action === 'accept_offer') {
      if (!offerId) {
        return NextResponse.json(
          { error: 'offerId is required to accept an offer' },
          { status: 400 }
        );
      }

      // Update the offer status
      const { data: offer, error: offerError } = await supabase
        .from('counter_offers')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', offerId)
        .eq('negotiation_id', negotiationId)
        .select()
        .single();

      if (offerError || !offer) {
        return NextResponse.json(
          { error: 'Offer not found or already resolved' },
          { status: 400 }
        );
      }

      // Also update the underlying quote (rfq_responses) status to 'accepted'
      await supabase
        .from('rfq_responses')
        .update({
          status: 'accepted',
          quoted_price: offer.proposed_price,
          updated_at: new Date().toISOString()
        })
        .eq('id', thread.rfq_quote_id);

      // Close the negotiation thread
      await supabase
        .from('negotiation_threads')
        .update({
          status: 'accepted',
          current_price: offer.proposed_price,
          accepted_offer_id: offerId,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', negotiationId);

      // Cancel any other pending offers on this thread
      await supabase
        .from('counter_offers')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('negotiation_id', negotiationId)
        .eq('status', 'pending')
        .neq('id', offerId);

      // Notify the other party
      const notifiedUserId = isFromBuyer ? thread.vendor_id : thread.user_id;
      await supabase.from('notifications').insert({
        user_id: notifiedUserId,
        type: 'offer_accepted',
        title: 'Your Offer Has Been Accepted! 🎉',
        body: `The offer of KSh ${offer.proposed_price.toLocaleString()} has been accepted. You can now proceed with the job.`,
        metadata: {
          thread_id: negotiationId,
          offer_id: offerId,
          accepted_price: offer.proposed_price,
          rfq_id: thread.rfq_id
        },
        related_id: negotiationId,
        related_type: 'negotiation'
      });

      // ── AUTO-GENERATE JOB ORDER ──
      let jobOrder = null;
      try {
        const { data: newJobOrder, error: jobError } = await supabase
          .from('job_orders')
          .insert({
            negotiation_id: negotiationId,
            rfq_id: thread.rfq_id || null,
            rfq_quote_id: thread.rfq_quote_id || null,
            buyer_id: thread.user_id,
            vendor_id: thread.vendor_id,
            agreed_price: offer.proposed_price,
            payment_terms: offer.payment_terms || null,
            delivery_date: offer.delivery_date || null,
            scope_summary: offer.scope_changes || null,
            status: 'created'
          })
          .select()
          .single();

        if (!jobError && newJobOrder) {
          jobOrder = newJobOrder;

          // Notify both parties about the job order
          await supabase.from('notifications').insert([
            {
              user_id: thread.user_id,
              type: 'job_order_created',
              title: 'Job Order Created 📋',
              body: `A job order for KSh ${offer.proposed_price.toLocaleString()} has been generated. Please review and confirm.`,
              metadata: { job_order_id: newJobOrder.id, negotiation_id: negotiationId, rfq_id: thread.rfq_id },
              related_id: newJobOrder.id,
              related_type: 'job_order'
            },
            {
              user_id: thread.vendor_id,
              type: 'job_order_created',
              title: 'Job Order Created 📋',
              body: `A job order for KSh ${offer.proposed_price.toLocaleString()} has been generated. Please review and confirm.`,
              metadata: { job_order_id: newJobOrder.id, negotiation_id: negotiationId, rfq_id: thread.rfq_id },
              related_id: newJobOrder.id,
              related_type: 'job_order'
            }
          ]);
        } else {
          console.error('Failed to create job order (non-blocking):', jobError?.message);
        }
      } catch (jobErr) {
        console.error('Job order creation error (non-blocking):', jobErr.message);
      }

      return NextResponse.json({
        success: true,
        action: 'accepted',
        offer,
        jobOrder,
        message: 'Offer accepted successfully'
      });
    }

    // ── REJECT OFFER ──
    if (action === 'reject_offer') {
      if (!offerId) {
        return NextResponse.json(
          { error: 'offerId is required to reject an offer' },
          { status: 400 }
        );
      }

      const { data: offer, error: offerError } = await supabase
        .from('counter_offers')
        .update({
          status: 'rejected',
          rejected_reason: reason || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .eq('negotiation_id', negotiationId)
        .select()
        .single();

      if (offerError || !offer) {
        return NextResponse.json(
          { error: 'Offer not found or already resolved' },
          { status: 400 }
        );
      }

      // Notify the other party
      const notifiedUserId = isFromBuyer ? thread.vendor_id : thread.user_id;
      await supabase.from('notifications').insert({
        user_id: notifiedUserId,
        type: 'offer_rejected',
        title: 'Counter Offer Declined',
        body: `Your offer of KSh ${offer.proposed_price.toLocaleString()} was declined.${reason ? ` Reason: ${reason}` : ' They may submit a new counter offer.'}`,
        metadata: {
          thread_id: negotiationId,
          offer_id: offerId,
          rejected_price: offer.proposed_price,
          reason: reason || null,
          rfq_id: thread.rfq_id
        },
        related_id: negotiationId,
        related_type: 'negotiation'
      });

      return NextResponse.json({
        success: true,
        action: 'rejected',
        offer,
        message: 'Offer rejected'
      });
    }

    // ── CANCEL NEGOTIATION ──
    if (action === 'cancel') {
      await supabase
        .from('negotiation_threads')
        .update({
          status: 'cancelled',
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', negotiationId);

      // Reject all pending offers
      await supabase
        .from('counter_offers')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('negotiation_id', negotiationId)
        .eq('status', 'pending');

      // Notify the other party
      const notifiedUserId = isFromBuyer ? thread.vendor_id : thread.user_id;
      await supabase.from('notifications').insert({
        user_id: notifiedUserId,
        type: 'negotiation_cancelled',
        title: 'Negotiation Cancelled',
        body: `The negotiation has been cancelled by the ${isFromBuyer ? 'buyer' : 'vendor'}.${reason ? ` Reason: ${reason}` : ''}`,
        metadata: { thread_id: negotiationId, reason: reason || null, rfq_id: thread.rfq_id },
        related_id: negotiationId,
        related_type: 'negotiation'
      });

      return NextResponse.json({
        success: true,
        action: 'cancelled',
        message: 'Negotiation cancelled'
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}. Use: accept_offer, reject_offer, cancel` },
      { status: 400 }
    );

  } catch (error) {
    console.error('Negotiation PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update negotiation', details: error.message },
      { status: 500 }
    );
  }
}
