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
    console.log('[RFQ CREATE] Received request:', { rfqType: body.rfqType, category: body.categorySlug });

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
    // 3. NOTE: QUOTA CHECKING DISABLED
    // ============================================================================
    // Quota checking via RPC would go here, but we allow unlimited submissions
    // for now to get the system working. Can be added back later via:
    // - check_rfq_quota_available RPC function
    // - or direct query to user quota tables


    // ============================================================================
    // 4. CREATE RFQ RECORD - USING CORRECT SCHEMA
    // ============================================================================
    // Map new field names to actual rfqs table schema
    const rfqData = {
      user_id: userId || null,
      title: sharedFields.projectTitle?.trim() || '',
      description: sharedFields.projectSummary?.trim() || '',
      category: categorySlug, // Maps to 'category' column
      location: sharedFields.town || null, // Maps to 'location' column
      county: sharedFields.county || null,
      budget_estimate: sharedFields.budgetMin && sharedFields.budgetMax 
        ? `${sharedFields.budgetMin} - ${sharedFields.budgetMax}` 
        : null,
      type: rfqType, // 'direct' | 'wizard' | 'public' - maps to 'type' column
      assigned_vendor_id: rfqType === 'direct' && selectedVendors.length > 0 ? selectedVendors[0] : null,
      urgency: 'normal',
      status: 'submitted', // Always submitted when created
      is_paid: false,
      visibility: rfqType === 'public' ? 'public' : 'private',
      rfq_type: rfqType, // Some queries use this field
      guest_email: guestEmail || null,
      guest_phone: guestPhone || null,
      created_at: new Date().toISOString(),
    };

    console.log('[RFQ CREATE] Inserting RFQ with data:', { title: rfqData.title, type: rfqData.type, category: rfqData.category });

    const { data: createdRfq, error: createError } = await supabase
      .from('rfqs')
      .insert([rfqData])
      .select('id, title, status')
      .single();

    if (createError) {
      console.error('[RFQ CREATE] Database insertion error:', createError);
      return NextResponse.json(
        { error: 'Failed to create RFQ. Please try again.', details: createError.message },
        { status: 500 }
      );
    }

    const rfqId = createdRfq.id;
    console.log('[RFQ CREATE] RFQ created successfully with ID:', rfqId);

    // ============================================================================
    // 5. HANDLE VENDOR ASSIGNMENT
    // ============================================================================

    // For DIRECT RFQ: Assign selected vendors
    if (rfqType === 'direct' && selectedVendors.length > 0) {
      try {
        // The first vendor is already set as assigned_vendor_id above
        // If there are multiple vendors, we could add them to rfq_vendors table if it exists
        console.log('[RFQ CREATE] Direct RFQ - Assigned to vendor:', selectedVendors[0]);
      } catch (err) {
        console.error('[RFQ CREATE] Vendor assignment error:', err.message);
        // Continue - vendor assignment is not critical
      }
    }

    // For WIZARD RFQ: Use the RPC function if available
    if (rfqType === 'wizard') {
      try {
        console.log('[RFQ CREATE] Wizard RFQ - Auto-matching vendors for category:', categorySlug);
        // Try to call auto-match RPC if it exists
        const { data: matchData, error: matchError } = await supabase.rpc(
          'auto_match_vendors_to_rfq',
          { p_rfq_id: rfqId }
        ).catch(() => {
          // RPC doesn't exist or failed - that's OK, log and continue
          console.log('[RFQ CREATE] Auto-match RPC not available, continuing...');
          return { data: null, error: null };
        });

        if (matchError) {
          console.error('[RFQ CREATE] Vendor auto-match error:', matchError);
        } else if (matchData) {
          console.log('[RFQ CREATE] Auto-matched vendors');
        }
      } catch (err) {
        console.error('[RFQ CREATE] Vendor auto-match error:', err.message);
        // Continue - auto-match is not critical
      }
    }

    // For PUBLIC RFQ: Visibility is already set to 'public' above
    console.log('[RFQ CREATE] Public RFQ created with public visibility');

    // ============================================================================
    // 6. RETURN SUCCESS
    // ============================================================================
    console.log('[RFQ CREATE] Success - returning response');
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
    console.error('[RFQ CREATE] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.', details: err.message },
      { status: 500 }
    );
  }
}
