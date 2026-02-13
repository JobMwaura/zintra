'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/negotiations/create
 * Creates a new negotiation thread for an RFQ quote
 * 
 * Request body:
 * {
 *   rfqQuoteId: string (UUID) — the rfq_responses.id,
 *   rfqId: string (UUID) — the rfq.id,
 *   userId: string (UUID) — buyer user id,
 *   vendorId: string (UUID),
 *   originalPrice: number
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { rfqQuoteId, rfqId, userId, vendorId, originalPrice } = body;

    // Validate input
    if (!rfqQuoteId || !userId || !vendorId || originalPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: rfqQuoteId, userId, vendorId, originalPrice' },
        { status: 400 }
      );
    }

    if (typeof originalPrice !== 'number' || originalPrice < 0) {
      return NextResponse.json(
        { error: 'Invalid price: must be a positive number' },
        { status: 400 }
      );
    }

    // Check if negotiation already exists for this quote
    const { data: existingThread } = await supabase
      .from('negotiation_threads')
      .select('id, status')
      .eq('rfq_quote_id', rfqQuoteId)
      .maybeSingle();

    if (existingThread) {
      return NextResponse.json({
        success: true,
        thread: existingThread,
        existing: true
      });
    }

    // Create new negotiation thread
    const { data: thread, error: createError } = await supabase
      .from('negotiation_threads')
      .insert({
        rfq_quote_id: rfqQuoteId,
        rfq_id: rfqId || null,
        user_id: userId,
        vendor_id: vendorId,
        original_price: originalPrice,
        current_price: originalPrice,
        status: 'active',
        round_count: 0,
        max_rounds: 3
      })
      .select()
      .single();

    if (createError) {
      console.error('Database insert error:', createError);
      return NextResponse.json(
        { error: 'Failed to create negotiation thread', details: createError.message },
        { status: 500 }
      );
    }

    // Notify vendor that buyer wants to negotiate
    await supabase.from('notifications').insert({
      user_id: vendorId,
      type: 'negotiation_started',
      title: 'Negotiation Started on Your Quote',
      body: `The buyer has started a negotiation on your quote of KSh ${originalPrice.toLocaleString()}`,
      metadata: { thread_id: thread.id, rfq_quote_id: rfqQuoteId, rfq_id: rfqId },
      related_id: thread.id,
      related_type: 'negotiation'
    });

    return NextResponse.json({
      success: true,
      thread,
      existing: false
    });

  } catch (error) {
    console.error('Create negotiation error:', error);
    return NextResponse.json(
      { error: 'Failed to create negotiation', details: error.message },
      { status: 500 }
    );
  }
}
