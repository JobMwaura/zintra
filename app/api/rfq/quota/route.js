'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function buildQuotaFallback(userId, quotaResetsOn) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: userRfqs, error } = await supabase
    .from('rfqs')
    .select('type')
    .eq('user_id', userId)
    .eq('status', 'submitted')
    .gte('created_at', monthStart.toISOString());

  if (error) {
    throw error;
  }

  const byType = { direct: 0, wizard: 0, public: 0 };

  for (const rfq of userRfqs || []) {
    if (rfq.type === 'direct') {
      byType.direct += 1;
    } else if (rfq.type === 'wizard' || rfq.type === 'matched') {
      byType.wizard += 1;
    } else if (rfq.type === 'public') {
      byType.public += 1;
    }
  }

  const totalThisMonth = byType.direct + byType.wizard + byType.public;
  const freeRemaining = Math.max(0, 3 - totalThisMonth);

  return {
    free_remaining: freeRemaining,
    total_this_month: totalThisMonth,
    by_type: byType,
    can_submit_free: freeRemaining > 0,
    quota_resets_on: quotaResetsOn,
    source: 'rfqs_fallback'
  };
}

/**
 * GET /api/rfq/quota
 * 
 * Get current RFQ quota for authenticated user
 * Returns: {
 *   free_remaining: number,
 *   total_this_month: number,
 *   by_type: { direct: 0, wizard: 0, public: 0 },
 *   can_submit_free: boolean,
 *   quota_resets_on: string (date)
 * }
 */
export async function GET(request) {
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

    // Get current quota
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const nextMonth = new Date(new Date().setMonth(new Date().getMonth() + 1))
      .toISOString()
      .slice(0, 7);

    const { data: quotaRecord, error: quotaError } = await supabase
      .from('users_rfq_quota')
      .select('*')
      .eq('user_id', user.id)
      .eq('month_year', currentMonth)
      .single();

    if (quotaError && quotaError.code !== 'PGRST116') {
      console.error('Error fetching quota:', quotaError);
      const fallback = await buildQuotaFallback(user.id, `${nextMonth}-01`);
      return NextResponse.json(fallback);
    }

    // If no quota record, create one
    if (!quotaRecord) {
      const { data: newQuota, error: createError } = await supabase
        .from('users_rfq_quota')
        .insert([{ user_id: user.id, month_year: currentMonth }])
        .select()
        .single();

      if (!createError && newQuota) {
        return NextResponse.json({
          free_remaining: 3,
          total_this_month: 0,
          by_type: { direct: 0, wizard: 0, public: 0 },
          can_submit_free: true,
          quota_resets_on: `${nextMonth}-01`,
          message: 'Fresh quota for this month'
        });
      }

      if (createError) {
        console.error('Error creating quota record:', createError);
        const fallback = await buildQuotaFallback(user.id, `${nextMonth}-01`);
        return NextResponse.json(fallback);
      }
    }

    return NextResponse.json({
      free_remaining: quotaRecord.free_quota_remaining,
      total_this_month: quotaRecord.total_rfqs_this_month,
      by_type: {
        direct: quotaRecord.direct_rfqs_used,
        wizard: quotaRecord.wizard_rfqs_used,
        public: quotaRecord.public_rfqs_used
      },
      can_submit_free: quotaRecord.free_quota_remaining > 0,
      quota_resets_on: `${nextMonth}-01`,
      last_reset_at: quotaRecord.last_reset_at
    });

  } catch (error) {
    console.error('Quota endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
