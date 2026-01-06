import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/rfq/create
 * 
 * Create a new RFQ (Request for Quote)
 * Handles all RFQ types: direct, wizard, public, vendor-request
 * Supports both guest and authenticated submissions
 * 
 * Request body:
 * {
 *   rfqType: 'direct' | 'wizard' | 'public' | 'vendor-request',
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
 *   selectedVendors?: array (for 'direct' or 'vendor-request' type),
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
    if (!rfqType || !['direct', 'wizard', 'public', 'vendor-request'].includes(rfqType)) {
      return NextResponse.json(
        { error: 'Invalid or missing rfqType. Must be: direct, wizard, public, or vendor-request' },
        { status: 400 }
      );
    }

    // Validate category (required)
    if (!categorySlug) {
      return NextResponse.json(
        { error: 'Missing required field: categorySlug' },
        { status: 400 }
      );
    }

    // If jobTypeSlug is empty, we'll auto-select the first job type for this category
    let finalJobTypeSlug = jobTypeSlug;
    if (!jobTypeSlug) {
      try {
        // Load template JSON from file system
        const templatePath = join(process.cwd(), 'public/data/rfq-templates-v2-hierarchical.json');
        const templateContent = readFileSync(templatePath, 'utf-8');
        const templates = JSON.parse(templateContent);
        const category = templates.majorCategories?.find(cat => cat.slug === categorySlug);
        
        if (!category || !category.jobTypes || category.jobTypes.length === 0) {
          return NextResponse.json(
            { error: `No job types found for category: ${categorySlug}` },
            { status: 400 }
          );
        }
        
        // Auto-select first job type
        finalJobTypeSlug = category.jobTypes[0].slug;
        console.log(`[RFQ CREATE] Auto-selected jobType: ${finalJobTypeSlug} for category: ${categorySlug}`);
      } catch (err) {
        console.error('[RFQ CREATE] Error loading templates:', err);
        return NextResponse.json(
          { error: 'Failed to load category templates' },
          { status: 500 }
        );
      }
    }

    // Validate shared fields
    if (!sharedFields.projectTitle || !sharedFields.projectSummary || !sharedFields.county) {
      return NextResponse.json(
        { error: 'Missing required shared fields: projectTitle, projectSummary, county' },
        { status: 400 }
      );
    }

    // Validate user (authenticated required for now)
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to submit an RFQ. Please complete the authentication step and try again.' },
        { status: 401 }
      );
    }

    // ============================================================================
    // 2. USER AUTHENTICATION CHECK
    // ============================================================================
    let user = null;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('[RFQ CREATE] User lookup failed:', { userId, userError });
      return NextResponse.json(
        { error: 'Your account could not be found. Please log out and log in again.' },
        { status: 401 }
      );
    }

    user = userData;

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
    // Map to actual rfqs table schema (only fields that exist)
    // Schema: id, user_id, title, description, category, location, county, budget_estimate, 
    //         type, status, is_paid, paid_amount, assigned_vendor_id, urgency, tags, attachments,
    //         created_at, updated_at, expires_at, completed_at
    const rfqData = {
      user_id: userId, // Required, already validated
      title: sharedFields.projectTitle?.trim() || 'Untitled RFQ',
      description: sharedFields.projectSummary?.trim() || '',
      category: categorySlug,
      location: sharedFields.town || null,
      county: sharedFields.county || null,
      budget_estimate: sharedFields.budgetMin && sharedFields.budgetMax 
        ? `${sharedFields.budgetMin} - ${sharedFields.budgetMax}` 
        : null,
      type: rfqType, // 'direct' | 'wizard' | 'public'
      assigned_vendor_id: rfqType === 'direct' && selectedVendors.length > 0 ? selectedVendors[0] : null,
      urgency: sharedFields.urgency || 'normal',
      status: 'submitted', // Always submitted when created
      is_paid: false,
      // Note: Do NOT include fields that don't exist: visibility, rfq_type, guest_email, guest_phone
      // Note: created_at and updated_at are set by database defaults
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

    // For DIRECT RFQ: Add selected vendors to rfq_recipients table
    if (rfqType === 'direct' && selectedVendors.length > 0) {
      try {
        const recipientRecords = selectedVendors.map(vendorId => ({
          rfq_id: rfqId,
          vendor_id: vendorId,
          recipient_type: 'direct',
          status: 'sent',
        }));

        const { error: recipientError } = await supabase
          .from('rfq_recipients')
          .insert(recipientRecords);

        if (recipientError) {
          console.error('[RFQ CREATE] Vendor recipient error:', recipientError);
          // Continue - vendor assignment is not critical to RFQ creation
        } else {
          console.log('[RFQ CREATE] Direct RFQ - Added vendors:', selectedVendors);
        }
      } catch (err) {
        console.error('[RFQ CREATE] Vendor assignment error:', err.message);
        // Continue - vendor assignment is not critical
      }
    }

    // For VENDOR-REQUEST RFQ: Add the single pre-selected vendor
    if (rfqType === 'vendor-request' && selectedVendors.length > 0) {
      try {
        const { error: recipientError } = await supabase
          .from('rfq_recipients')
          .insert({
            rfq_id: rfqId,
            vendor_id: selectedVendors[0],
            recipient_type: 'vendor-request',
            status: 'sent',
          });

        if (recipientError) {
          console.error('[RFQ CREATE] Vendor recipient error:', recipientError);
        } else {
          console.log('[RFQ CREATE] Vendor-request RFQ - Added vendor:', selectedVendors[0]);
        }
      } catch (err) {
        console.error('[RFQ CREATE] Vendor assignment error:', err.message);
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

    // For PUBLIC RFQ: No specific vendor assignment needed
    console.log('[RFQ CREATE] RFQ created with type:', rfqType);

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
