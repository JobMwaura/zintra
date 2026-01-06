// POST /api/rfq/check-eligibility
// Fast eligibility check before RFQ submission
// Returns: eligibility status, remaining free RFQs, payment requirement

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration
const FREE_RFQ_LIMIT = 3;
const EXTRA_RFQ_COST = 300; // KES

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, rfq_type } = body;

    console.log('[CHECK-ELIGIBILITY] Request:', { user_id, rfq_type });

    // ============================================================================
    // 1. AUTH CHECK
    // ============================================================================
    if (!user_id) {
      console.warn('[CHECK-ELIGIBILITY] Missing user_id');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // ============================================================================
    // 2. VERIFICATION CHECK
    // ============================================================================
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, phone_verified, email_verified')
      .eq('id', user_id)
      .single();

    if (userError) {
      console.error('[CHECK-ELIGIBILITY] User query error:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user) {
      console.warn('[CHECK-ELIGIBILITY] User not found:', user_id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if both email and phone are verified
    if (!user.phone_verified || !user.email_verified) {
      console.log('[CHECK-ELIGIBILITY] User not verified:', {
        user_id,
        phone_verified: user.phone_verified,
        email_verified: user.email_verified
      });
      return NextResponse.json({
        eligible: false,
        reason: 'Must verify phone and email before submitting RFQs',
        phone_verified: user.phone_verified,
        email_verified: user.email_verified
      }, { status: 200 });
    }

    // ============================================================================
    // 3. COUNT RFQs THIS MONTH (submitted status only)
    // ============================================================================
    // Get first day of current month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const { count: rfqCount, error: countError } = await supabase
      .from('rfqs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('status', 'submitted')
      .gte('created_at', thisMonth.toISOString());

    if (countError) {
      console.error('[CHECK-ELIGIBILITY] Count RFQs error:', countError);
      return NextResponse.json(
        { error: 'Server error' },
        { status: 500 }
      );
    }

    // ============================================================================
    // 4. DETERMINE ELIGIBILITY
    // ============================================================================
    const current_count = rfqCount || 0;
    const remaining_free = Math.max(0, FREE_RFQ_LIMIT - current_count);
    const requires_payment = remaining_free === 0;

    const response_data = {
      eligible: true,
      remaining_free,
      requires_payment,
      amount: requires_payment ? EXTRA_RFQ_COST : 0,
      current_count,
      free_limit: FREE_RFQ_LIMIT,
      message: remaining_free > 0
        ? `You have ${remaining_free} free RFQ${remaining_free === 1 ? '' : 's'} remaining this month`
        : `You have used your ${FREE_RFQ_LIMIT} free RFQs this month. Each additional RFQ costs KES ${EXTRA_RFQ_COST}.`
    };

    console.log('[CHECK-ELIGIBILITY] Success:', response_data);

    return NextResponse.json(response_data, { status: 200 });

  } catch (err) {
    console.error('[CHECK-ELIGIBILITY] Unexpected error:', {
      message: err.message,
      stack: err.stack
    });
    return NextResponse.json(
      { 
        error: 'Server error', 
        details: err.message 
      },
      { status: 500 }
    );
  }
}
