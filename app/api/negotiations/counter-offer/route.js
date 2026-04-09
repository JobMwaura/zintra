'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/negotiations/counter-offer
 * Submit a counter offer with optional scope changes, delivery date, payment terms
 * Enforces max rounds (default 3)
 * 
 * Request body:
 * {
 *   negotiationId: string (UUID),
 *   quoteId: string (UUID),
 *   proposedBy: string (UUID),
 *   proposedPrice: number,
 *   scopeChanges: string (optional),
 *   deliveryDate: string (ISO date, optional),
 *   paymentTerms: string (optional),
 *   notes: string (optional),
 *   responseByDays: number (default: 3)
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      negotiationId,
      quoteId,
      proposedBy,
      proposedPrice,
      scopeChanges,
      deliveryDate,
      paymentTerms,
      notes,
      responseByDays = 3
    } = body;

    // Validate required fields
    if (!negotiationId || !quoteId || !proposedBy || proposedPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: negotiationId, quoteId, proposedBy, proposedPrice' },
        { status: 400 }
      );
    }

    if (typeof proposedPrice !== 'number' || proposedPrice < 0) {
      return NextResponse.json(
        { error: 'Invalid price: must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof responseByDays !== 'number' || responseByDays < 1 || responseByDays > 30) {
      return NextResponse.json(
        { error: 'Invalid responseByDays: must be between 1 and 30' },
        { status: 400 }
      );
    }

    // Calculate response deadline
    const responseByDate = new Date();
    responseByDate.setDate(responseByDate.getDate() + responseByDays);

    // Verify negotiation exists, get thread details
    const { data: negotiation, error: negotiationError } = await supabase
      .from('negotiation_threads')
      .select('id, user_id, vendor_id, rfq_quote_id, rfq_id, status, round_count, max_rounds, original_price')
      .eq('id', negotiationId)
      .single();

    if (negotiationError || !negotiation) {
      return NextResponse.json(
        { error: 'Negotiation not found' },
        { status: 404 }
      );
    }

    // Verify quote matches
    if (negotiation.rfq_quote_id !== quoteId) {
      return NextResponse.json(
        { error: 'Quote ID does not match this negotiation' },
        { status: 400 }
      );
    }

    // Check negotiation is still active
    if (negotiation.status !== 'active') {
      return NextResponse.json(
        { error: `Negotiation is ${negotiation.status}. Cannot submit new offers.` },
        { status: 400 }
      );
    }

    // Verify user is participant
    if (proposedBy !== negotiation.user_id && proposedBy !== negotiation.vendor_id) {
      return NextResponse.json(
        { error: 'User is not a participant in this negotiation' },
        { status: 403 }
      );
    }

    // Enforce max rounds
    const maxRounds = negotiation.max_rounds || 3;
    if ((negotiation.round_count || 0) >= maxRounds) {
      return NextResponse.json(
        { error: `Maximum negotiation rounds (${maxRounds}) reached. Please accept or decline the current offer.` },
        { status: 400 }
      );
    }

    // Create counter offer
    const newRoundCount = (negotiation.round_count || 0) + 1;
    const { data: counterOffer, error: offerError } = await supabase
      .from('counter_offers')
      .insert({
        negotiation_id: negotiationId,
        rfq_quote_id: quoteId,
        proposed_by: proposedBy,
        proposed_price: proposedPrice,
        scope_changes: scopeChanges || null,
        delivery_date: deliveryDate || null,
        payment_terms: paymentTerms || null,
        notes: notes || null,
        status: 'pending',
        round_number: newRoundCount,
        response_by_date: responseByDate.toISOString()
      })
      .select()
      .single();

    if (offerError) {
      console.error('Counter offer insert error:', offerError);
      return NextResponse.json(
        { error: 'Failed to create counter offer', details: offerError.message },
        { status: 500 }
      );
    }

    // Update negotiation thread (price + round count)
    await supabase
      .from('negotiation_threads')
      .update({
        current_price: proposedPrice,
        round_count: newRoundCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', negotiationId);

    // Create quote revision (non-blocking)
    await supabase
      .from('quote_revisions')
      .insert({
        rfq_quote_id: quoteId,
        price: proposedPrice,
        delivery_date: deliveryDate || null,
        payment_terms: paymentTerms || null,
        changed_by: proposedBy,
        change_reason: `Counter offer round ${newRoundCount}`,
        revision_notes: notes || null
      });

    // Notify the other party
    const isFromBuyer = proposedBy === negotiation.user_id;
    const notifiedUserId = isFromBuyer ? negotiation.vendor_id : negotiation.user_id;

    await supabase.from('notifications').insert({
      user_id: notifiedUserId,
      type: 'counter_offer',
      title: 'New Counter Offer Received',
      body: `A counter offer of KSh ${proposedPrice.toLocaleString()} has been submitted (Round ${newRoundCount}/${maxRounds})`,
      metadata: {
        thread_id: negotiationId,
        counter_offer_id: counterOffer.id,
        proposed_price: proposedPrice,
        round: newRoundCount,
        rfq_id: negotiation.rfq_id
      },
      related_id: counterOffer.id,
      related_type: 'counter_offer'
    });

    return NextResponse.json({
      success: true,
      counterOffer,
      roundCount: newRoundCount,
      maxRounds
    });

  } catch (error) {
    console.error('Submit counter offer error:', error);
    return NextResponse.json(
      { error: 'Failed to submit counter offer', details: error.message },
      { status: 500 }
    );
  }
}
