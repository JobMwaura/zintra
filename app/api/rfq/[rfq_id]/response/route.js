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
 * Supports comprehensive quote form with 3 sections:
 * - Section 1: Quote Overview
 * - Section 2: Pricing & Breakdown
 * - Section 3: Inclusions/Exclusions
 * 
 * Request body includes:
 * {
 *   // SECTION 1: Quote Overview
 *   quote_title: string (required),
 *   intro_text: string (required),
 *   validity_days: number (7, 14, 30, or custom date),
 *   validity_custom_date: string (optional, ISO date),
 *   earliest_start_date: string (optional, ISO date),
 *   
 *   // SECTION 2: Pricing & Breakdown
 *   pricing_model: 'fixed' | 'range' | 'per_unit' | 'per_day' (required),
 *   price_min: number (for range model),
 *   price_max: number (for range model),
 *   unit_type: string (for per_unit model),
 *   unit_price: number (for per_unit/per_day models),
 *   estimated_units: number (for per_unit/per_day models),
 *   vat_included: boolean,
 *   line_items: array of objects (optional breakdown),
 *   transport_cost: number (optional),
 *   labour_cost: number (optional),
 *   other_charges: number (optional),
 *   vat_amount: number (calculated),
 *   total_price_calculated: number (calculated grand total),
 *   
 *   // SECTION 3: Inclusions/Exclusions
 *   inclusions: string (required),
 *   exclusions: string (required),
 *   client_responsibilities: string (optional),
 *   
 *   // OLD FIELDS (backward compatibility)
 *   quoted_price: number (optional, for legacy),
 *   currency: string (default 'KES'),
 *   delivery_timeline: string (required),
 *   description: string (required, min 20 chars),
 *   warranty: string (optional),
 *   payment_terms: string (optional),
 *   attachments: array of strings (optional)
 * }
 * 
 * Response: {
 *   success: true,
 *   response: {
 *     id: uuid,
 *     rfq_id: uuid,
 *     vendor_id: uuid,
 *     quote_title: string,
 *     pricing_model: string,
 *     total_price_calculated: number,
 *     status: 'submitted',
 *     created_at: timestamp,
 *     ... all other fields
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
    // Await params - in Next.js 15, params is a Promise
    const { rfq_id } = await params;

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

    // Validate RFQ ID format
    if (!rfq_id || rfq_id.length !== 36) {
      return NextResponse.json(
        { error: 'Invalid RFQ ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const {
      // SECTION 1: Quote Overview
      quote_title,
      intro_text,
      validity_days,
      validity_custom_date,
      earliest_start_date,
      
      // SECTION 2: Pricing & Breakdown
      pricing_model,
      price_min,
      price_max,
      unit_type,
      unit_price,
      estimated_units,
      vat_included,
      line_items,
      transport_cost,
      labour_cost,
      other_charges,
      vat_amount,
      total_price_calculated,
      
      // SECTION 3: Inclusions/Exclusions
      inclusions,
      exclusions,
      client_responsibilities,
      
      // Metadata
      quote_status,
      submitted_at,
      expires_at,
      
      // OLD FIELDS (backward compatibility)
      quoted_price,
      currency = 'KES',
      delivery_timeline,
      description,
      attachments = [],
      warranty,
      payment_terms
    } = await request.json();

    // Validation - SECTION 1
    if (!quote_title || typeof quote_title !== 'string' || quote_title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Quote title is required' },
        { status: 400 }
      );
    }

    if (!intro_text || typeof intro_text !== 'string' || intro_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Brief introduction is required' },
        { status: 400 }
      );
    }

    // Validation - SECTION 2
    if (!pricing_model || !['fixed', 'range', 'per_unit', 'per_day'].includes(pricing_model)) {
      return NextResponse.json(
        { error: 'Valid pricing model is required' },
        { status: 400 }
      );
    }

    // Validation - SECTION 3
    if (!inclusions || typeof inclusions !== 'string' || inclusions.trim().length === 0) {
      return NextResponse.json(
        { error: 'Inclusions are required' },
        { status: 400 }
      );
    }

    if (!exclusions || typeof exclusions !== 'string' || exclusions.trim().length === 0) {
      return NextResponse.json(
        { error: 'Exclusions are required' },
        { status: 400 }
      );
    }

    // Validation - OLD FIELDS (still needed for backward compatibility)
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

    // Get vendor profile - query vendors table (not vendor_profiles)
    const { data: vendorProfile } = await supabase
      .from('vendors')
      .select('id, company_name, rating')
      .eq('user_id', user.id)
      .maybeSingle();

    // Use vendor profile ID - required for vendor to submit quotes
    const vendorId = vendorProfile?.id;
    
    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor profile not found. Please complete your vendor registration first.' },
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

    // Check if RFQ is still open for responses
    // Allows: submitted (default), open (user can quote), pending (awaiting approval)
    // Prevents: closed, completed, cancelled, archived
    const acceptableStatuses = ['submitted', 'open', 'pending', 'assigned', 'in_review'];
    if (!acceptableStatuses.includes(rfq.status)) {
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

    // Check if vendor is eligible to respond
    // For DIRECT RFQs: vendor must be explicitly assigned
    // For WIZARD/PUBLIC RFQs: vendor must have been auto-matched
    if (rfq.type === 'direct' || rfq.type === 'wizard') {
      const { data: recipient } = await supabase
        .from('rfq_recipients')
        .select('id, vendor_id, recipient_type')
        .eq('rfq_id', rfq_id)
        .eq('vendor_id', vendorId)
        .maybeSingle();

      if (!recipient) {
        const errorMsg = rfq.type === 'direct' 
          ? 'You are not assigned to this direct RFQ' 
          : 'You were not matched to this wizard RFQ. Only vendors matched by the system can submit quotes.';
        return NextResponse.json(
          { error: errorMsg },
          { status: 403 }
        );
      }
    }

    // For PUBLIC RFQs: any vendor in the same category can respond
    if (rfq.type === 'public') {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, primary_category, secondary_categories')
        .eq('id', vendorId)
        .single();

      if (!vendorData) {
        return NextResponse.json(
          { error: 'Vendor information not found' },
          { status: 404 }
        );
      }

      // Check if vendor is in the RFQ category
      const inCategory = vendorData.primary_category === rfq.category || 
        (vendorData.secondary_categories && vendorData.secondary_categories.includes(rfq.category));
      
      if (!inCategory) {
        return NextResponse.json(
          { error: 'You are not in the required category for this public RFQ' },
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
          vendor_id: vendorId,
          
          // SECTION 1: Quote Overview
          quote_title: quote_title,
          intro_text: intro_text,
          validity_days: validity_days || 7,
          validity_custom_date: validity_custom_date || null,
          earliest_start_date: earliest_start_date || null,
          
          // SECTION 2: Pricing & Breakdown
          pricing_model: pricing_model,
          price_min: price_min || null,
          price_max: price_max || null,
          unit_type: unit_type || null,
          unit_price: unit_price || null,
          estimated_units: estimated_units || null,
          vat_included: vat_included || false,
          line_items: line_items || null,
          transport_cost: transport_cost || 0,
          labour_cost: labour_cost || 0,
          other_charges: other_charges || 0,
          vat_amount: vat_amount || 0,
          total_price_calculated: total_price_calculated || null,
          
          // SECTION 3: Inclusions/Exclusions
          inclusions: inclusions,
          exclusions: exclusions,
          client_responsibilities: client_responsibilities || null,
          
          // Metadata
          quote_status: 'submitted',
          submitted_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          
          // OLD FIELDS (backward compatibility)
          quoted_price: quoted_price || null,
          currency: currency,
          delivery_timeline: delivery_timeline,
          description: description,
          attachments: attachments,
          warranty: warranty || null,
          payment_terms: payment_terms || null,
          status: 'submitted',
          vendor_name: vendorProfile?.company_name || 'Vendor',
          vendor_rating: vendorProfile?.rating || 0
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
    await supabase
      .from('rfq_recipients')
      .update({ status: 'responded' })
      .eq('rfq_id', rfq_id)
      .eq('vendor_id', vendorProfile.id);

    // =========================================================================
    // NOTIFICATION 1: Notify the BUYER (RFQ requester) — quote has been submitted
    // The buyer sees the vendor name but not the other way around
    // =========================================================================
    const { error: notifError } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: rfq.user_id,
          type: 'rfq_response',
          title: 'New Quote Received',
          body: `${vendorProfile?.company_name || 'A vendor'} submitted a quote for "${rfq.title}"`,
          related_type: 'rfq',
          related_id: rfq_id,
          metadata: {
            rfq_id: rfq_id,
            response_id: response.id,
            vendor_name: vendorProfile?.company_name || 'Vendor',
            quoted_price: total_price_calculated || quoted_price,
            currency: currency
          }
        }
      ]);

    if (notifError) {
      console.error('Error creating buyer notification:', notifError);
    }

    // =========================================================================
    // NOTIFICATION 2: Notify all ADMINS — vendor has submitted a quote
    // Admin sees: which vendor, which RFQ, and that it went to the user
    // =========================================================================
    try {
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins?.length) {
        const adminNotifs = admins.map(a => ({
          user_id: a.user_id,
          type: 'admin_quote_submitted',
          title: '📩 Vendor Quote Submitted',
          body: `${vendorProfile?.company_name || 'A vendor'} submitted a quote for RFQ "${rfq.title}". The quote has been delivered to the requester.`,
          related_type: 'rfq',
          related_id: rfq_id,
          metadata: {
            rfq_id: rfq_id,
            response_id: response.id,
            vendor_id: vendorProfile.id,
            vendor_name: vendorProfile?.company_name || 'Vendor',
            quoted_price: total_price_calculated || quoted_price,
            rfq_type: rfq.type,
          }
        }));

        await supabase.from('notifications').insert(adminNotifs);
        console.log('[QUOTE SUBMIT] ✅ Notified', admins.length, 'admin(s) about vendor quote submission');
      }
    } catch (adminErr) {
      console.error('Admin notification error (non-critical):', adminErr.message);
    }

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
            vendor_name: vendorProfile?.company_name,
            quoted_price: total_price_calculated || quoted_price,
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
        message: 'Quote submitted successfully! The buyer will be notified.',
        rfq_info: {
          rfq_title: rfq.title,
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
