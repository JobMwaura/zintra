import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/rfq/create
 * 
 * Create a new RFQ (Request for Quote)
 * Handles all three RFQ types: direct, wizard, public
 * Supports both guest and authenticated submissions
 * 
 * Request body:
 * {
 *   rfqType: 'direct' | 'wizard' | 'public',
 *   categorySlug: string (required),
 *   jobTypeSlug: string (required),
 *   templateFields: object,
 *   sharedFields: {
 *     projectTitle: string (required),
 *     projectSummary: string (required),
 *     county: string (required),
 *     town?: string,
 *     budgetMin?: number,
 *     budgetMax?: number,
 *     desiredStartDate?: string,
 *     directions?: string
 *   },
 *   selectedVendors?: array (for 'direct' type),
 *   userId?: string (if authenticated),
 *   guestEmail?: string (if guest),
 *   guestPhone?: string (if guest),
 *   guestPhoneVerified?: boolean (if guest)
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // ============================================================================
    // 1. VALIDATE REQUIRED FIELDS
    // ============================================================================
    const {
      rfqType,
      categorySlug,
      jobTypeSlug,
      templateFields = {},
      sharedFields = {},
      selectedVendors = [],
      userId,
      guestEmail,
      guestPhone,
      guestPhoneVerified = false,
    } = body;

    // Validate RFQ type
    if (!rfqType || !['direct', 'wizard', 'public'].includes(rfqType)) {
      return NextResponse.json(
        { error: 'Invalid or missing rfqType. Must be: direct, wizard, or public' },
        { status: 400 }
      );
    }

    // Validate category and job type
    if (!categorySlug || !jobTypeSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: categorySlug, jobTypeSlug' },
        { status: 400 }
      );
    }

    // Validate shared fields
    if (!sharedFields.projectTitle || !sharedFields.projectSummary || !sharedFields.county) {
      return NextResponse.json(
        { error: 'Missing required shared fields: projectTitle, projectSummary, county' },
        { status: 400 }
      );
    }

    // Validate user (authenticated or guest)
    if (!userId && !guestEmail && !guestPhone) {
      return NextResponse.json(
        { error: 'Either userId (authenticated) or guestEmail/guestPhone (guest) required' },
        { status: 400 }
      );
    }

    // ============================================================================
    // 2. USER AUTHENTICATION CHECK (if userId provided)
    // ============================================================================
    let user = null;
    if (userId) {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, phone_verified, email_verified')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return NextResponse.json(
          { error: 'User not found or invalid userId' },
          { status: 401 }
        );
      }

      user = userData;
    }

    // ============================================================================
    // 3. CHECK RFQ QUOTA (for authenticated users)
    // ============================================================================
    if (userId) {
      try {
        const { data: quotaData, error: quotaError } = await supabase.rpc(
          'check_rfq_quota_available',
          {
            p_user_id: userId,
            p_rfq_type: rfqType,
          }
        );

        if (quotaError) {
          console.error('Quota check error:', quotaError);
          // Log but don't fail - allow submission even if quota check fails
        } else if (quotaData && quotaData[0] && !quotaData[0].can_submit) {
          const quota = quotaData[0];
          return NextResponse.json(
            {
              error: 'Free RFQ quota exhausted',
              requires_payment: true,
              payment_required: {
                amount: 300,
                currency: 'KES',
                description: 'Additional RFQ submission (1 RFQ = KES 300)',
              },
              message: quota.message || 'You have reached your monthly RFQ limit',
            },
            { status: 402 } // 402 Payment Required
          );
        }
      } catch (err) {
        console.warn('Quota check failed (non-blocking):', err.message);
        // Continue - quota check is not critical for submission
      }
    }

    // ============================================================================
    // 4. CREATE RFQ RECORD
    // ============================================================================
    const rfqData = {
      user_id: userId || null,
      title: sharedFields.projectTitle.trim(),
      description: sharedFields.projectSummary.trim(),
      category: categorySlug,
      job_type: jobTypeSlug,
      template_fields: templateFields,
      shared_fields: sharedFields,
      rfq_type: rfqType,
      status: 'open',
      visibility: rfqType === 'public' ? 'public' : 'private',
      guest_email: guestEmail || null,
      guest_phone: guestPhone || null,
      guest_phone_verified: guestPhoneVerified,
      county: sharedFields.county || null,
      location: sharedFields.town || null,
      directions: sharedFields.directions || null,
      budget_min: sharedFields.budgetMin ? parseInt(sharedFields.budgetMin) : null,
      budget_max: sharedFields.budgetMax ? parseInt(sharedFields.budgetMax) : null,
      desired_start_date: sharedFields.desiredStartDate || null,
      created_at: new Date().toISOString(),
    };

    const { data: createdRfq, error: createError } = await supabase
      .from('rfqs')
      .insert([rfqData])
      .select('id, title, status')
      .single();

    if (createError) {
      console.error('RFQ creation error:', createError);
      return NextResponse.json(
        { error: 'Failed to create RFQ. Please try again.' },
        { status: 500 }
      );
    }

    const rfqId = createdRfq.id;

    // ============================================================================
    // 5. HANDLE VENDOR ASSIGNMENT
    // ============================================================================

    // For DIRECT RFQ: Assign selected vendors
    if (rfqType === 'direct' && selectedVendors.length > 0) {
      try {
        const vendorAssignments = selectedVendors.map((vendorId) => ({
          rfq_id: rfqId,
          vendor_id: vendorId,
          status: 'sent',
          sent_at: new Date().toISOString(),
        }));

        const { error: vendorError } = await supabase
          .from('rfq_vendors')
          .insert(vendorAssignments);

        if (vendorError) {
          console.error('Vendor assignment error:', vendorError);
          // Log but don't fail - RFQ is created even if vendor assignment fails
        }
      } catch (err) {
        console.error('Vendor assignment error:', err.message);
        // Continue - vendor assignment is not critical
      }
    }

    // For WIZARD RFQ: Auto-match vendors by category
    if (rfqType === 'wizard') {
      try {
        // Query vendors by category
        const { data: vendorsData, error: vendorQueryError } = await supabase
          .from('vendor_categories')
          .select('vendor_id')
          .eq('category', categorySlug)
          .limit(10); // Limit to first 10 matching vendors

        if (!vendorQueryError && vendorsData && vendorsData.length > 0) {
          const matchedVendors = vendorsData.map((vc) => ({
            rfq_id: rfqId,
            vendor_id: vc.vendor_id,
            status: 'matched',
            sent_at: new Date().toISOString(),
          }));

          const { error: vendorError } = await supabase
            .from('rfq_vendors')
            .insert(matchedVendors);

          if (vendorError) {
            console.error('Vendor auto-match error:', vendorError);
            // Log but don't fail
          }
        }
      } catch (err) {
        console.error('Vendor auto-match error:', err.message);
        // Continue - auto-match is not critical
      }
    }

    // For PUBLIC RFQ: Mark visibility as public (already set above)
    // All vendors matching the category will see this RFQ

    // ============================================================================
    // 6. RETURN SUCCESS
    // ============================================================================
    return NextResponse.json(
      {
        success: true,
        rfqId: rfqId,
        rfqTitle: createdRfq.title,
        message: `RFQ created successfully! (${rfqType} type)`,
        rfqType: rfqType,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('RFQ creation error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
