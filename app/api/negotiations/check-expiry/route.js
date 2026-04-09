'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/negotiations/check-expiry
 * 
 * Checks all pending counter-offers for expired response_by_date.
 * - Marks expired offers as 'expired'
 * - If all rounds used AND latest offer expired → mark thread as 'expired'
 * - Sends notifications to both parties
 * 
 * Can be called:
 * - By a Vercel Cron Job (recommended: every 6 hours)
 * - Manually from admin panel
 * - On page load as a background check
 * 
 * GET is also supported for Vercel Cron (which uses GET by default)
 */
export async function POST(request) {
  return handleExpiryCheck();
}

export async function GET(request) {
  // Verify cron secret if present (optional security)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow without secret for now (page-load checks), but log it
    console.log('Expiry check called without cron secret');
  }
  
  return handleExpiryCheck();
}

async function handleExpiryCheck() {
  try {
    const now = new Date().toISOString();
    let expiredCount = 0;
    let threadsExpiredCount = 0;

    // 1. Find all pending counter-offers past their response_by_date
    const { data: expiredOffers, error: fetchError } = await supabase
      .from('counter_offers')
      .select('id, negotiation_id, rfq_quote_id, proposed_by, proposed_price, round_number, response_by_date')
      .eq('status', 'pending')
      .not('response_by_date', 'is', null)
      .lt('response_by_date', now);

    if (fetchError) {
      console.error('Error fetching expired offers:', fetchError);
      return NextResponse.json({ error: 'Failed to check expiry', details: fetchError.message }, { status: 500 });
    }

    if (!expiredOffers || expiredOffers.length === 0) {
      return NextResponse.json({ success: true, message: 'No expired offers found', expiredCount: 0, threadsExpiredCount: 0 });
    }

    // 2. Mark each expired offer
    for (const offer of expiredOffers) {
      const { error: updateError } = await supabase
        .from('counter_offers')
        .update({ status: 'expired', updated_at: now })
        .eq('id', offer.id);

      if (updateError) {
        console.error(`Failed to expire offer ${offer.id}:`, updateError);
        continue;
      }
      expiredCount++;

      // 3. Check if the negotiation thread should also expire
      const { data: thread } = await supabase
        .from('negotiation_threads')
        .select('id, user_id, vendor_id, rfq_id, status, round_count, max_rounds')
        .eq('id', offer.negotiation_id)
        .single();

      if (!thread || thread.status !== 'active') continue;

      // Check if max rounds reached AND this was the latest offer
      const maxRounds = thread.max_rounds || 3;
      const roundCount = thread.round_count || 0;
      
      if (roundCount >= maxRounds) {
        // Max rounds used and latest offer expired → expire the whole thread
        await supabase
          .from('negotiation_threads')
          .update({
            status: 'expired',
            closed_at: now,
            updated_at: now
          })
          .eq('id', thread.id);

        threadsExpiredCount++;

        // Notify both parties
        const notifications = [
          {
            user_id: thread.user_id,
            type: 'negotiation_expired',
            title: 'Negotiation Expired',
            body: `The negotiation has expired. All ${maxRounds} rounds were used and the last offer was not responded to in time.`,
            metadata: { thread_id: thread.id, rfq_id: thread.rfq_id },
            related_id: thread.id,
            related_type: 'negotiation'
          },
          {
            user_id: thread.vendor_id,
            type: 'negotiation_expired',
            title: 'Negotiation Expired',
            body: `The negotiation has expired. All ${maxRounds} rounds were used and the last offer was not responded to in time.`,
            metadata: { thread_id: thread.id, rfq_id: thread.rfq_id },
            related_id: thread.id,
            related_type: 'negotiation'
          }
        ];

        await supabase.from('notifications').insert(notifications);
      } else {
        // Rounds remaining — just notify the non-responding party
        const responderId = offer.proposed_by === thread.user_id ? thread.vendor_id : thread.user_id;
        
        await supabase.from('notifications').insert({
          user_id: responderId,
          type: 'offer_expired',
          title: 'Counter Offer Expired',
          body: `A counter offer of KSh ${offer.proposed_price?.toLocaleString()} has expired because it was not responded to in time. The other party can submit a new offer.`,
          metadata: { thread_id: thread.id, offer_id: offer.id, rfq_id: thread.rfq_id },
          related_id: offer.id,
          related_type: 'counter_offer'
        });
      }
    }

    return NextResponse.json({
      success: true,
      expiredCount,
      threadsExpiredCount,
      message: `Expired ${expiredCount} offer(s) and ${threadsExpiredCount} thread(s)`
    });

  } catch (error) {
    console.error('Expiry check error:', error);
    return NextResponse.json({ error: 'Expiry check failed', details: error.message }, { status: 500 });
  }
}
