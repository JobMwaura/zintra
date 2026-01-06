import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { autoMatchVendors, createPublicRFQRecipients, triggerNotifications } from '@/lib/vendorMatching';

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
    console.log('[RFQ CREATE] Verifying user:', userId);

    // ============================================================================
    // 3. VERIFICATION CHECK (phone must be verified)
    // ============================================================================
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, phone_verified')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('[RFQ CREATE] User verification error:', userError);
      return NextResponse.json(
        { error: 'User not found or verification failed' },
        { status: 404 }
      );
    }

    if (!user.phone_verified) {
      console.warn('[RFQ CREATE] User phone not verified:', {
        user_id: userId,
        phone_verified: user.phone_verified
      });
      return NextResponse.json(
        { 
          error: 'You must verify your phone number before submitting an RFQ',
          details: {
            phone_verified: user.phone_verified
          }
        },
        { status: 403 }
      );
    }

    console.log('[RFQ CREATE] User verified, proceeding');

    // ============================================================================
    // 4. RE-CHECK USAGE LIMIT (server-side, never trust frontend)
    // ============================================================================
    const FREE_RFQ_LIMIT = 3;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const { count: rfqCount, error: countError } = await supabase
      .from('rfqs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'submitted')
      .gte('created_at', thisMonth.toISOString());

    if (countError) {
      console.error('[RFQ CREATE] RFQ count error:', countError);
      return NextResponse.json(
        { error: 'Failed to check RFQ quota' },
        { status: 500 }
      );
    }

    const current_count = rfqCount || 0;
    if (current_count >= FREE_RFQ_LIMIT) {
      console.warn('[RFQ CREATE] User over quota:', { user_id: userId, count: current_count, limit: FREE_RFQ_LIMIT });
      return NextResponse.json(
        { 
          error: 'You have reached your monthly RFQ limit. Please pay KES 300 to submit additional RFQs.',
          code: 'QUOTA_EXCEEDED',
          current_count,
          limit: FREE_RFQ_LIMIT
        },
        { status: 402 } // 402 Payment Required
      );
    }

    console.log('[RFQ CREATE] Quota check passed:', { current_count, limit: FREE_RFQ_LIMIT });

    // ============================================================================
    // 5. INPUT SANITIZATION (optional - for extra security)
    // ============================================================================
    const sanitizeInput = (str) => {
      if (typeof str !== 'string') return str;
      // Remove HTML tags and trim
      return str.replace(/<[^>]*>/g, '').trim();
    };

    // ============================================================================
    // 6. CREATE RFQ RECORD - USING CORRECT SCHEMA
    // ============================================================================
    // Map to actual rfqs table schema (only fields that exist)
    // Don't set assigned_vendor_id if we're not sure the vendor exists
    const rfqData = {
      user_id: userId, // Required, already validated
      title: sharedFields.projectTitle?.trim() || 'Untitled RFQ',
      description: sharedFields.projectSummary?.trim() || '',
      category_slug: categorySlug, // ✅ CORRECT FIELD NAME (was 'category')
      specific_location: sharedFields.town || null, // ✅ Use specific_location
      county: sharedFields.county || null,
      budget_estimate: sharedFields.budgetMin && sharedFields.budgetMax 
        ? `${sharedFields.budgetMin} - ${sharedFields.budgetMax}` 
        : null,
      type: rfqType, // 'direct' | 'wizard' | 'public' | 'vendor-request'
      assigned_vendor_id: null, // Don't set here - let rfq_recipients table handle vendor links
      urgency: sharedFields.urgency || 'normal',
      status: 'submitted', // Always submitted when created
      is_paid: false,
      visibility: rfqType === 'public' ? 'public' : 'private', // Set visibility based on type
    };

    console.log('[RFQ CREATE] Inserting RFQ with data:', { 
      title: rfqData.title, 
      type: rfqData.type, 
      category: rfqData.category,
      user_id: rfqData.user_id 
    });

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
    // 7. HANDLE VENDOR ASSIGNMENT (type-specific)
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

    // For WIZARD RFQ: Auto-match vendors based on category and rating
    if (rfqType === 'wizard') {
      try {
        console.log('[RFQ CREATE] Wizard RFQ - Auto-matching vendors for category:', categorySlug);
        const matched = await autoMatchVendors(rfqId, categorySlug, sharedFields.county);
        console.log('[RFQ CREATE] Wizard RFQ - Matched', matched.length, 'vendors');
      } catch (err) {
        console.error('[RFQ CREATE] Vendor auto-match error:', err.message);
        // Continue - auto-match is not critical
      }
    }

    // For PUBLIC RFQ: Create recipients with top vendors
    if (rfqType === 'public') {
      try {
        console.log('[RFQ CREATE] Public RFQ - Finding top vendors for category:', categorySlug);
        await createPublicRFQRecipients(rfqId, categorySlug, sharedFields.county);
      } catch (err) {
        console.error('[RFQ CREATE] Public RFQ recipient error:', err.message);
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

    // ============================================================================
    // 8. TRIGGER NOTIFICATIONS (async, non-blocking)
    // ============================================================================
    // Send notifications to vendors in background (don't wait for response)
    triggerNotifications(rfqId, rfqType, userId, createdRfq.title).catch(err => {
      console.error('[RFQ CREATE] Notification error (non-critical):', err.message);
    });

    console.log('[RFQ CREATE] Vendor assignment and notifications triggered');

    // For old code reference - this is what was here before
    // if (rfqType === 'wizard') {
    //   try {
    //     console.log('[RFQ CREATE] Wizard RFQ - Auto-matching vendors for category:', categorySlug);
    //     // Try to call auto-match RPC if it exists
    //     const { data: matchData, error: matchError } = await supabase.rpc(
    //       'auto_match_vendors_to_rfq',
    //       { p_rfq_id: rfqId }
    //     ).catch(() => {
    //       // RPC doesn't exist or failed - that's OK, log and continue
    //       console.log('[RFQ CREATE] Auto-match RPC not available, continuing...');
    //       return { data: null, error: null };
    //     });
    //
    //     if (matchError) {
    //       console.error('[RFQ CREATE] Vendor auto-match error:', matchError);
    //     } else if (matchData) {
    //       console.log('[RFQ CREATE] Auto-matched vendors');
    //     }
    //   } catch (err) {
    //     console.error('[RFQ CREATE] Vendor auto-match error:', err.message);
    //     // Continue - auto-match is not critical
    //   }
    // }

    // For PUBLIC RFQ: No specific vendor assignment needed
    console.log('[RFQ CREATE] RFQ created with type:', rfqType);

    // ============================================================================
    // 9. RETURN SUCCESS
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
