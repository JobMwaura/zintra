'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/vendor/rfq/decline
 * 
 * Allows a vendor to decline/opt-out of an RFQ they've received.
 * Creates an rfq_response record with status 'declined' so the vendor
 * won't see this RFQ in their active opportunities anymore.
 * 
 * Body: {
 *   rfq_id: string (required),
 *   reason: string (required - predefined reason),
 *   additional_notes: string (optional - custom explanation)
 * }
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get vendor profile
    const { data: vendorProfile, error: vendorError } = await supabase
      .from('vendors')
      .select('id, company_name, user_id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendorProfile) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 403 }
      );
    }

    // Parse request body
    const { rfq_id, reason, additional_notes } = await request.json();

    if (!rfq_id) {
      return NextResponse.json(
        { error: 'rfq_id is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'A reason for declining is required' },
        { status: 400 }
      );
    }

    // Verify the RFQ exists
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('id, title, user_id, status, expires_at')
      .eq('id', rfq_id)
      .single();

    if (rfqError || !rfq) {
      return NextResponse.json(
        { error: 'RFQ not found' },
        { status: 404 }
      );
    }

    // Check if vendor already responded (submitted a quote)
    const { data: existingResponse } = await supabase
      .from('rfq_responses')
      .select('id, status')
      .eq('rfq_id', rfq_id)
      .eq('vendor_id', vendorProfile.id)
      .maybeSingle();

    if (existingResponse) {
      if (existingResponse.status === 'declined') {
        return NextResponse.json(
          { error: 'You have already declined this RFQ' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'You have already submitted a quote for this RFQ. You cannot decline after submitting.' },
        { status: 400 }
      );
    }

    // Insert a declined response record
    const { data: declineRecord, error: declineError } = await supabase
      .from('rfq_responses')
      .insert({
        rfq_id: rfq_id,
        vendor_id: vendorProfile.id,
        quoted_price: 0,
        currency: 'KES',
        delivery_timeline: null,
        description: `Decline reason: ${reason}${additional_notes ? ` — ${additional_notes}` : ''}`,
        status: 'declined'
      })
      .select()
      .single();

    if (declineError) {
      console.error('Error creating decline record:', declineError);
      return NextResponse.json(
        { error: 'Failed to decline RFQ', details: declineError.message },
        { status: 500 }
      );
    }

    // Update rfq_recipients status if there's a matching record
    await supabase
      .from('rfq_recipients')
      .update({ status: 'declined' })
      .eq('rfq_id', rfq_id)
      .eq('vendor_id', vendorProfile.id);

    // Notify the buyer that a vendor has declined
    // (Keeping it neutral — buyer just knows a vendor passed)
    try {
      await supabase.from('notifications').insert({
        user_id: rfq.user_id,
        type: 'rfq_vendor_declined',
        title: 'Vendor Declined RFQ',
        body: `${vendorProfile.company_name || 'A vendor'} has opted out of "${rfq.title}"`,
        related_type: 'rfq',
        related_id: rfq_id,
        metadata: {
          rfq_id: rfq_id,
          vendor_name: vendorProfile.company_name || 'Vendor',
          decline_reason: reason,
          declined_at: new Date().toISOString()
        }
      });
    } catch (notifErr) {
      // Don't fail the decline if notification fails
      console.error('Failed to send decline notification:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'RFQ declined successfully',
      decline_id: declineRecord.id
    });

  } catch (error) {
    console.error('Vendor RFQ decline error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
