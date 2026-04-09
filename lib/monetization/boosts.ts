/**
 * Listing Boost Mechanics
 * Handles boosted listings: featured, urgent, extra_reach
 * This is the FIRST monetization layer to implement
 */

import { supabase } from '@/lib/supabase/client';
import type { ListingBoost, BoostType } from '@/types/careers';

/**
 * Boost pricing (in KES)
 * These are examples - adjust based on market validation
 */
export const BOOST_PRICING: Record<BoostType, { price: number; duration_days: number }> = {
  featured: { price: 1000, duration_days: 7 }, // Top of search results
  urgent: { price: 500, duration_days: 3 }, // "Urgent" badge + higher ranking
  extra_reach: { price: 300, duration_days: 7 }, // Broader audience targeting
};

/**
 * Apply a boost to a listing
 * Deducts credits from employer's account and creates boost record
 */
export async function applyBoost(
  employerId: string,
  listingId: string,
  boostType: BoostType,
  credits_available: number
): Promise<{ success: boolean; message: string; boost?: ListingBoost }> {
  const boost_price = BOOST_PRICING[boostType].price;

  // Check if employer has enough credits
  if (credits_available < boost_price) {
    return {
      success: false,
      message: `Insufficient credits. You have ${credits_available} but need ${boost_price}.`,
    };
  }

  const now = new Date();
  const duration_days = BOOST_PRICING[boostType].duration_days;
  const starts_at = now;
  const ends_at = new Date(now.getTime() + duration_days * 24 * 60 * 60 * 1000);

  // Create boost record
  const { data: boost, error: boostError } = await supabase
    .from('listing_boosts')
    .insert({
      listing_id: listingId,
      employer_id: employerId,
      boost_type: boostType,
      starts_at: starts_at.toISOString(),
      ends_at: ends_at.toISOString(),
      cost_kes: boost_price,
    })
    .select()
    .single();

  if (boostError) {
    console.error('Error creating boost:', boostError);
    return { success: false, message: 'Failed to create boost. Please try again.' };
  }

  // Deduct credits from ledger
  const { error: ledgerError } = await supabase.from('credits_ledger').insert({
    employer_id: employerId,
    credit_type: 'boost',
    amount: -boost_price, // Negative = deduction
    balance_before: credits_available,
    balance_after: credits_available - boost_price,
    reference_id: boost.id,
  });

  if (ledgerError) {
    console.error('Error deducting credits:', ledgerError);
    // TODO: Rollback boost creation
    return { success: false, message: 'Failed to deduct credits. Please try again.' };
  }

  return {
    success: true,
    message: `Boost applied for ${duration_days} days!`,
    boost,
  };
}

/**
 * Get active boosts for a listing
 */
export async function getListingBoosts(listingId: string): Promise<ListingBoost[]> {
  const now = new Date();

  const { data: boosts, error } = await supabase
    .from('listing_boosts')
    .select('*')
    .eq('listing_id', listingId)
    .gt('ends_at', now.toISOString())
    .order('starts_at', { ascending: true });

  if (error) {
    console.error('Error fetching boosts:', error);
    return [];
  }

  return boosts || [];
}

/**
 * Calculate ranking boost factor based on active boosts
 * Returns a multiplier: 1.0 = no boost, 2.0 = featured, etc.
 */
export function getBoostMultiplier(boosts: ListingBoost[]): number {
  if (boosts.length === 0) return 1.0;

  // Featured is strongest, then urgent, then extra_reach
  const has_featured = boosts.some((b) => b.boost_type === 'featured');
  const has_urgent = boosts.some((b) => b.boost_type === 'urgent');
  const has_extra_reach = boosts.some((b) => b.boost_type === 'extra_reach');

  let multiplier = 1.0;
  if (has_featured) multiplier *= 2.5;
  if (has_urgent) multiplier *= 1.8;
  if (has_extra_reach) multiplier *= 1.3;

  return Math.min(multiplier, 5.0); // Cap at 5x
}

/**
 * Get employer's boost history and spending
 */
export async function getBoostHistory(
  employerId: string,
  limit: number = 10
): Promise<{
  boosts: (ListingBoost & { listing_title?: string })[];
  total_spent: number;
}> {
  const { data: boosts, error: boostError } = await supabase
    .from('listing_boosts')
    .select('*')
    .eq('employer_id', employerId)
    .order('starts_at', { ascending: false })
    .limit(limit);

  if (boostError) {
    console.error('Error fetching boost history:', boostError);
    return { boosts: [], total_spent: 0 };
  }

  // Calculate total spent
  const total_spent = (boosts || []).reduce((sum, b) => sum + b.cost_kes, 0);

  return { boosts: boosts || [], total_spent };
}

/**
 * Cancel an active boost (refund credits)
 */
export async function cancelBoost(
  boostId: string,
  employerId: string
): Promise<{ success: boolean; message: string }> {
  // Fetch boost
  const { data: boost, error: fetchError } = await supabase
    .from('listing_boosts')
    .select('*')
    .eq('id', boostId)
    .eq('employer_id', employerId)
    .single();

  if (fetchError || !boost) {
    return { success: false, message: 'Boost not found.' };
  }

  // Check if boost is still active
  const now = new Date();
  if (new Date(boost.ends_at) <= now) {
    return { success: false, message: 'Boost has already expired.' };
  }

  // Calculate refund (pro-rata)
  const total_ms = new Date(boost.ends_at).getTime() - new Date(boost.starts_at).getTime();
  const remaining_ms = new Date(boost.ends_at).getTime() - now.getTime();
  const refund = Math.ceil((remaining_ms / total_ms) * boost.cost_kes);

  // Delete boost
  const { error: deleteError } = await supabase
    .from('listing_boosts')
    .delete()
    .eq('id', boostId);

  if (deleteError) {
    console.error('Error deleting boost:', deleteError);
    return { success: false, message: 'Failed to cancel boost.' };
  }

  // Add refund to credits ledger
  const { error: ledgerError } = await supabase.from('credits_ledger').insert({
    employer_id: employerId,
    credit_type: 'boost_refund',
    amount: refund,
    reference_id: boostId,
  });

  if (ledgerError) {
    console.error('Error adding refund:', ledgerError);
  }

  return { success: true, message: `Boost cancelled. ${refund} KES refunded.` };
}

/**
 * Expire boosts that have reached their end date
 * Run this as a cron job or trigger from admin panel
 */
export async function expireBoosts(): Promise<{ expired_count: number }> {
  const now = new Date();

  const { data: expired, error } = await supabase
    .from('listing_boosts')
    .select('id')
    .lt('ends_at', now.toISOString())
    .is('expired_at', null);

  if (error) {
    console.error('Error fetching expired boosts:', error);
    return { expired_count: 0 };
  }

  if (!expired || expired.length === 0) {
    return { expired_count: 0 };
  }

  // Mark as expired
  const { error: updateError } = await supabase
    .from('listing_boosts')
    .update({ expired_at: now.toISOString() })
    .lt('ends_at', now.toISOString())
    .is('expired_at', null);

  if (updateError) {
    console.error('Error marking boosts as expired:', updateError);
    return { expired_count: 0 };
  }

  return { expired_count: expired.length };
}
