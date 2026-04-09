import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

/**
 * GET /api/vendor/check-suspension
 * Checks if current vendor is suspended and returns suspension details
 */
export async function GET(request) {
  try {
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
      // Not a vendor
      return NextResponse.json({
        isSuspended: false,
        isVendor: false
      });
    }

    // Check for active suspension
    const { data: suspension, error: suspensionError } = await supabase
      .from('vendor_suspensions')
      .select('*')
      .eq('vendor_id', vendor.id)
      .is('unsuspended_at', null)
      .single();

    if (suspensionError && suspensionError.code !== 'PGRST116') {
      throw suspensionError;
    }

    // Check if suspension is still active (not expired)
    if (suspension) {
      const isExpired = suspension.suspension_end_date && new Date(suspension.suspension_end_date) < new Date();
      
      if (isExpired && !suspension.unsuspended_at) {
        // Auto-unsuspend if temporary suspension expired
        await supabase
          .from('vendor_suspensions')
          .update({
            unsuspended_at: new Date().toISOString(),
            unsuspension_reason: 'Temporary suspension period expired'
          })
          .eq('id', suspension.id);

        return NextResponse.json({
          isSuspended: false,
          isVendor: true,
          message: 'Your suspension period has ended. Your account is now active.'
        });
      }

      return NextResponse.json({
        isSuspended: true,
        isVendor: true,
        vendorId: vendor.id,
        suspensionId: suspension.id,
        reason: suspension.suspension_reason,
        type: suspension.suspension_type,
        endDate: suspension.suspension_end_date,
        canAppeal: !suspension.appeal_submitted,
        appealSubmitted: suspension.appeal_submitted,
        daysRemaining: suspension.suspension_end_date 
          ? Math.ceil((new Date(suspension.suspension_end_date) - new Date()) / (1000 * 60 * 60 * 24))
          : null
      });
    }

    return NextResponse.json({
      isSuspended: false,
      isVendor: true
    });
  } catch (error) {
    console.error('Error checking suspension:', error);
    return NextResponse.json(
      { error: 'Failed to check suspension status: ' + error.message },
      { status: 500 }
    );
  }
}
