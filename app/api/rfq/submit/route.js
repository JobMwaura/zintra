'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/rfq/submit
 * 
 * Submit an RFQ request
 * - Validates user authentication
 * - Checks free RFQ quota
 * - If quota exceeded, returns payment requirement
 * - If quota available OR user has paid, creates RFQ
 * - Auto-matches vendors for wizard RFQs
 * 
 * Request body:
 * {
 *   title: string,
 *   description: string,
 *   category: string,
 *   location?: string,
 *   county?: string,
 *   budget_estimate?: string,
 *   type: 'direct' | 'wizard' | 'public',
 *   assigned_vendor_id?: uuid (only for 'direct' type),
 *   urgency?: 'low' | 'normal' | 'high' | 'critical'
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    // ============================================================================
    // 1. AUTHENTICATION CHECK
    // ============================================================================
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
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

    // ============================================================================
    // 2. INPUT VALIDATION
    // ============================================================================
    const { title, description, category, location, county, budget_estimate, type, assigned_vendor_id, urgency } = body;

    if (!title || !description || !category || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category, type' },
        { status: 400 }
      );
    }

    if (!['direct', 'wizard', 'public'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid RFQ type. Must be: direct, wizard, or public' },
        { status: 400 }
      );
    }

    if (type === 'direct' && !assigned_vendor_id) {
      return NextResponse.json(
        { error: 'Direct RFQ requires assigned_vendor_id' },
        { status: 400 }
      );
    }

    // ============================================================================
    // 3. CHECK RFQ QUOTA
    // ============================================================================
    const { data: quotaData, error: quotaError } = await supabase.rpc(
      'check_rfq_quota_available',
      {
        p_user_id: user.id,
        p_rfq_type: type
      }
    );

    if (quotaError) {
      console.error('Quota check error:', quotaError);
      return NextResponse.json(
        { error: 'Error checking RFQ quota' },
        { status: 500 }
      );
    }

    const quota = quotaData[0];

    // ============================================================================
    // 4. QUOTA CHECK RESULT
    // ============================================================================
    if (!quota.can_submit) {
      // User has exceeded free quota - requires payment
      return NextResponse.json(
        {
          error: 'Free RFQ quota exhausted',
          requires_payment: true,
          payment_required: {
            amount: 300,
            currency: 'KES',
            description: 'Additional RFQ submission (1 RFQ = KES 300)'
          },
          message: quota.message
        },
        { status: 402 } // 402 Payment Required
      );
    }

    // ============================================================================
    // 5. USER PHONE & EMAIL VERIFICATION CHECK (Optional but recommended)
    // ============================================================================
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone_verified, email_verified')
      .eq('id', user.id)
      .single();

    // Warning if not verified (but allow submission)
    const unverified_fields = [];
    if (!profile?.email_verified) unverified_fields.push('email');
    if (!profile?.phone_verified) unverified_fields.push('phone');

    // ============================================================================
    // 6. CREATE RFQ RECORD
    // ============================================================================
    const rfqData = {
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
      location: location?.trim() || null,
      county: county?.trim() || null,
      budget_estimate: budget_estimate?.trim() || null,
      type,
      assigned_vendor_id: type === 'direct' ? assigned_vendor_id : null,
      urgency: urgency || 'normal',
      status: 'submitted',
      is_paid: false
    };

    const { data: newRFQ, error: createError } = await supabase
      .from('rfqs')
      .insert([rfqData])
      .select()
      .single();

    if (createError) {
      console.error('RFQ creation error:', createError);
      return NextResponse.json(
        { error: 'Failed to create RFQ', details: createError.message },
        { status: 500 }
      );
    }

    // ============================================================================
    // 7. INCREMENT RFQ USAGE
    // ============================================================================
    const { error: incrementError } = await supabase.rpc(
      'increment_rfq_usage',
      {
        p_user_id: user.id,
        p_rfq_type: type
      }
    );

    if (incrementError) {
      console.error('Error incrementing usage:', incrementError);
      // Not critical - RFQ is created, just log the error
    }

    // ============================================================================
    // 8. AUTO-MATCH VENDORS (for Wizard RFQs)
    // ============================================================================
    let matched_vendors = 0;
    if (type === 'wizard') {
      const { data: matchData, error: matchError } = await supabase.rpc(
        'auto_match_vendors_to_rfq',
        { p_rfq_id: newRFQ.id }
      );

      if (!matchError && matchData) {
        matched_vendors = matchData[0]?.matched_vendor_count || 0;
      }
    }

    // ============================================================================
    // 9. CREATE AUDIT LOG
    // ============================================================================
    await supabase
      .from('rfq_admin_audit')
      .insert([{
        action: 'rfq_created',
        resource_type: 'rfq',
        resource_id: newRFQ.id,
        details: {
          user_id: user.id,
          type,
          category,
          is_verified_user: !unverified_fields.length
        }
      }]);

    // ============================================================================
    // 10. SEND CONFIRMATION EMAIL (Optional)
    // ============================================================================
    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // Send RFQ confirmation email to user
    console.log(`RFQ ${newRFQ.id} created for user ${user.id}`);

    // ============================================================================
    // 11. RETURN SUCCESS RESPONSE
    // ============================================================================
    return NextResponse.json(
      {
        success: true,
        rfq: {
          id: newRFQ.id,
          title: newRFQ.title,
          type: newRFQ.type,
          status: newRFQ.status,
          created_at: newRFQ.created_at
        },
        message: 'RFQ submitted successfully',
        matched_vendors: type === 'wizard' ? matched_vendors : null,
        warnings: unverified_fields.length ? {
          unverified: unverified_fields,
          message: `For better vendor matching, please verify your ${unverified_fields.join(' and ')}`
        } : null,
        remaining_free_quota: quota.free_remaining - 1
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('RFQ submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
