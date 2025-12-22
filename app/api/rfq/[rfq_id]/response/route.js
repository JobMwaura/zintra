'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/rfq/:rfq_id/response
 * 
 * Vendor submits a quote/response to an RFQ
 * 
 * Request body:
 * {
 *   quoted_price: number (in KES),
 *   currency: string (default 'KES'),
 *   delivery_timeline: string (e.g., '3-5 days', '1 week'),
 *   description: string (vendor's proposal/notes),
 *   attachments?: string[] (URLs to files/images),
 *   warranty?: string (optional warranty offered),
 *   payment_terms?: string (optional payment terms)
 * }
 * 
 * Response: {
 *   success: true,
 *   response: {
 *     id: uuid,
 *     rfq_id: uuid,
 *     vendor_id: uuid,
 *     quoted_price: number,
 *     status: 'submitted',
 *     created_at: timestamp
 *   },
 *   message: 'Quote submitted successfully',
 *   rfq_info: {
 *     requester_name: string,
 *     total_responses: number
 *   }
 * }
 */
export async function POST(request, { params }) {
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

    const { rfq_id } = params;

    // Validate RFQ ID format
    if (!rfq_id || rfq_id.length !== 36) {
      return NextResponse.json(
        { error: 'Invalid RFQ ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const {
      quoted_price,
      currency = 'KES',
      delivery_timeline,
      description,
      attachments = [],
      warranty,
      payment_terms
    } = await request.json();

    // Validation
    if (!quoted_price || typeof quoted_price !== 'number' || quoted_price <= 0) {
      return NextResponse.json(
        { error: 'Valid quoted price required' },
        { status: 400 }
      );
    }

    if (!delivery_timeline || typeof delivery_timeline !== 'string' || delivery_timeline.trim().length === 0) {
      return NextResponse.json(
        { error: 'Delivery timeline is required' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || description.trim().length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Get vendor profile
    const { data: vendorProfile, error: vendorError } = await supabase
      .from('vendor_profiles')
      .select('id, business_name, rating')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendorProfile) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 403 }
      );
    }

    // Check if RFQ exists and is eligible for response
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('id, title, user_id, status, type, expires_at, category')
      .eq('id', rfq_id)
      .single();

    if (rfqError || !rfq) {
      return NextResponse.json(
        { error: 'RFQ not found' },
        { status: 404 }
      );
    }

    // Check if RFQ is still open
    if (!['submitted', 'assigned', 'in_review'].includes(rfq.status)) {
      return NextResponse.json(
        { error: `RFQ is ${rfq.status} and cannot accept responses` },
        { status: 410 }
      );
    }

    // Check if RFQ has expired
    const expiresAt = new Date(rfq.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'RFQ has expired' },
        { status: 410 }
      );
    }

    // Check if vendor already responded
    const { data: existingResponse } = await supabase
      .from('rfq_responses')
      .select('id, status')
      .eq('rfq_id', rfq_id)
      .eq('vendor_id', vendorProfile.id)
      .maybeSingle();

    if (existingResponse) {
      return NextResponse.json(
        {
          error: 'You have already submitted a response to this RFQ',
          existing_response_status: existingResponse.status,
          message: 'You can only submit one quote per RFQ. Contact admin to modify existing response.'
        },
        { status: 409 }
      );
    }

    // Check if vendor is eligible to respond (for direct RFQs)
    if (rfq.type === 'direct') {
      const { data: recipient } = await supabase
        .from('rfq_recipients')
        .select('id, vendor_id')
        .eq('rfq_id', rfq_id)
        .eq('vendor_id', vendorProfile.id)
        .maybeSingle();

      if (!recipient) {
        return NextResponse.json(
          { error: 'You are not assigned to this direct RFQ' },
          { status: 403 }
        );
      }
    }

    // Create response record
    const { data: response, error: responseError } = await supabase
      .from('rfq_responses')
      .insert([
        {
          rfq_id: rfq_id,
          vendor_id: vendorProfile.id,
          quoted_price: quoted_price,
          currency: currency,
          delivery_timeline: delivery_timeline,
          description: description,
          attachments: attachments,
          warranty: warranty || null,
          payment_terms: payment_terms || null,
          status: 'submitted',
          vendor_name: vendorProfile.business_name,
          vendor_rating: vendorProfile.rating || 0
        }
      ])
      .select()
      .single();

    if (responseError) {
      console.error('Error creating response:', responseError);
      return NextResponse.json(
        { error: 'Failed to submit response' },
        { status: 500 }
      );
    }

    // Update RFQ status if first response
    const { data: responseCount } = await supabase
      .from('rfq_responses')
      .select('id', { count: 'exact' })
      .eq('rfq_id', rfq_id)
      .eq('status', 'submitted');

    if (responseCount === 1) {
      await supabase
        .from('rfqs')
        .update({ status: 'in_review' })
        .eq('id', rfq_id);
    }

    // Update RFQ recipient status if applicable
    if (rfq.type === 'direct') {
      await supabase
        .from('rfq_recipients')
        .update({ status: 'responded' })
        .eq('rfq_id', rfq_id)
        .eq('vendor_id', vendorProfile.id);
    }

    // Fetch requester info for notification
    const { data: requester } = await supabase
      .from('users')
      .select('email, user_metadata->>first_name')
      .eq('id', rfq.user_id)
      .single();

    // Create notification (can be enhanced with actual email/SMS)
    const { error: notifError } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: rfq.user_id,
          type: 'rfq_response',
          title: 'New Quote Received',
          message: `${vendorProfile.business_name} submitted a quote for "${rfq.title}"`,
          resource_type: 'rfq_response',
          resource_id: response.id,
          data: {
            rfq_id: rfq_id,
            vendor_name: vendorProfile.business_name,
            quoted_price: quoted_price,
            currency: currency
          }
        }
      ]);

    // Log audit trail
    await supabase
      .from('rfq_admin_audit')
      .insert([
        {
          action: 'response_submitted',
          resource_type: 'rfq_response',
          resource_id: response.id,
          user_id: user.id,
          details: {
            rfq_id: rfq_id,
            vendor_id: vendorProfile.id,
            quoted_price: quoted_price,
            timestamp: new Date().toISOString()
          }
        }
      ]);

    return NextResponse.json(
      {
        success: true,
        response: {
          id: response.id,
          rfq_id: response.rfq_id,
          vendor_id: response.vendor_id,
          quoted_price: response.quoted_price,
          status: response.status,
          created_at: response.created_at
        },
        message: 'Quote submitted successfully',
        rfq_info: {
          rfq_title: rfq.title,
          requester_name: requester?.user_metadata?.first_name || 'Customer',
          total_responses: responseCount + 1
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('RFQ response error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
