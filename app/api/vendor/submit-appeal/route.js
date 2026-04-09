import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

/**
 * POST /api/vendor/submit-appeal
 * Vendor submits appeal for their suspension
 */
export async function POST(request) {
  try {
    const { suspensionId, appealMessage, evidenceUrls } = await request.json();

    if (!suspensionId || !appealMessage?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: suspensionId, appealMessage' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get vendor for this user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Not a vendor' },
        { status: 403 }
      );
    }

    // Get suspension to verify it belongs to this vendor
    const { data: suspension, error: suspensionError } = await supabase
      .from('vendor_suspensions')
      .select('id')
      .eq('id', suspensionId)
      .eq('vendor_id', vendor.id)
      .single();

    if (suspensionError || !suspension) {
      return NextResponse.json(
        { error: 'Suspension not found or does not belong to your account' },
        { status: 404 }
      );
    }

    // Check if already appealed
    const { data: existingAppeal } = await supabase
      .from('vendor_suspensions')
      .select('appeal_submitted')
      .eq('id', suspensionId)
      .single();

    if (existingAppeal?.appeal_submitted) {
      return NextResponse.json(
        { error: 'You have already submitted an appeal for this suspension' },
        { status: 400 }
      );
    }

    // Create appeal record
    const { error: appealError } = await supabase
      .from('vendor_appeal_history')
      .insert({
        vendor_id: vendor.id,
        suspension_id: suspensionId,
        appeal_message: appealMessage,
        appeal_evidence: evidenceUrls || null,
        status: 'pending'
      });

    if (appealError) throw appealError;

    // Update suspension to mark appeal as submitted
    const { error: updateError } = await supabase
      .from('vendor_suspensions')
      .update({
        appeal_submitted: true,
        appeal_submitted_at: new Date().toISOString()
      })
      .eq('id', suspensionId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Appeal submitted successfully. Our moderation team will review your appeal within 5 business days.',
      suspensionId: suspensionId
    });
  } catch (error) {
    console.error('Error submitting appeal:', error);
    return NextResponse.json(
      { error: 'Failed to submit appeal: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vendor/check-appeal-status/:suspensionId
 * Check status of vendor's appeal
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const suspensionId = searchParams.get('suspensionId');

    if (!suspensionId) {
      return NextResponse.json(
        { error: 'Missing suspensionId parameter' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get vendor for this user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Not a vendor' },
        { status: 403 }
      );
    }

    // Get appeal status
    const { data: appeal, error: appealError } = await supabase
      .from('vendor_appeal_history')
      .select('*')
      .eq('suspension_id', suspensionId)
      .eq('vendor_id', vendor.id)
      .single();

    if (appealError && appealError.code !== 'PGRST116') {
      throw appealError;
    }

    if (!appeal) {
      return NextResponse.json({
        hasAppeal: false
      });
    }

    return NextResponse.json({
      hasAppeal: true,
      status: appeal.status,
      submittedAt: appeal.created_at,
      reviewedAt: appeal.reviewed_at,
      decision: appeal.admin_decision,
      adminNotes: appeal.admin_notes
    });
  } catch (error) {
    console.error('Error checking appeal status:', error);
    return NextResponse.json(
      { error: 'Failed to check appeal status: ' + error.message },
      { status: 500 }
    );
  }
}
