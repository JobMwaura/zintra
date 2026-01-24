import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * POST /api/quote/accept
 * 
 * Accept a vendor quote (update status to 'accepted')
 * Uses service role to bypass RLS restrictions
 * 
 * Request body:
 * {
 *   quoteId: string (UUID of the quote to accept)
 *   rfqId: string (UUID of the RFQ - for verification)
 *   userId: string (UUID of the user accepting - for verification)
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { quoteId, rfqId, userId } = body;

    console.log('API: Accept Quote called with:', { quoteId, rfqId, userId });

    // Validate required fields
    if (!quoteId || !rfqId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: quoteId, rfqId, userId' },
        { status: 400 }
      );
    }

    // STEP 1: Verify the RFQ exists and belongs to the user
    const { data: rfq, error: rfqError } = await supabaseAdmin
      .from('rfqs')
      .select('id, user_id, title')
      .eq('id', rfqId)
      .single();

    console.log('API: RFQ verification:', { rfq, rfqError });

    if (rfqError || !rfq) {
      return NextResponse.json(
        { error: 'RFQ not found' },
        { status: 404 }
      );
    }

    // Verify the user is the RFQ creator
    if (rfq.user_id !== userId) {
      console.log('API: User mismatch - rfq.user_id:', rfq.user_id, 'userId:', userId);
      return NextResponse.json(
        { error: 'Only the RFQ creator can accept quotes' },
        { status: 403 }
      );
    }

    // STEP 2: Verify the quote exists and belongs to this RFQ
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('rfq_responses')
      .select('id, rfq_id, vendor_id, status')
      .eq('id', quoteId)
      .single();

    console.log('API: Quote verification:', { quote, quoteError });

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    if (quote.rfq_id !== rfqId) {
      return NextResponse.json(
        { error: 'Quote does not belong to this RFQ' },
        { status: 400 }
      );
    }

    // STEP 3: Update the quote status to 'accepted'
    const { data: updatedQuote, error: updateError } = await supabaseAdmin
      .from('rfq_responses')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select()
      .single();

    console.log('API: Update result:', { updatedQuote, updateError });

    if (updateError) {
      console.error('API: Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update quote status: ' + updateError.message },
        { status: 500 }
      );
    }

    // STEP 4: Optionally update the RFQ status
    await supabaseAdmin
      .from('rfqs')
      .update({ 
        status: 'assigned',
        assigned_vendor_id: quote.vendor_id,
        assigned_at: new Date().toISOString()
      })
      .eq('id', rfqId);

    console.log('API: Quote accepted successfully');

    return NextResponse.json({
      success: true,
      message: 'Quote accepted successfully',
      quote: updatedQuote
    });

  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quote/reject
 * 
 * Reject a vendor quote (update status to 'rejected')
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { quoteId, rfqId, userId } = body;

    console.log('API: Reject Quote called with:', { quoteId, rfqId, userId });

    if (!quoteId || !rfqId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify RFQ ownership
    const { data: rfq, error: rfqError } = await supabaseAdmin
      .from('rfqs')
      .select('id, user_id')
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq || rfq.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update quote status to rejected
    const { data: updatedQuote, error: updateError } = await supabaseAdmin
      .from('rfq_responses')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to reject quote' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quote rejected',
      quote: updatedQuote
    });

  } catch (error) {
    console.error('API: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
