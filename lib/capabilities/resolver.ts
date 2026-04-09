/**
 * Capabilities Resolver
 * Determines what features a user can access based on their plan/role
 * This is the KEY to clean monetization without hardcoding plan checks everywhere
 */

import { supabase } from '@/lib/supabase/client';
import type { EmployerCapabilities, CandidateCapabilities, PlanType } from '@/types/careers';

/**
 * Get capabilities for an employer based on their subscription plan
 */
export async function getEmployerCapabilities(
  employerId: string
): Promise<EmployerCapabilities> {
  // Fetch current subscription
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('employer_id', employerId)
    .eq('status', 'active')
    .single();

  if (error) {
    console.error('Error fetching subscription:', error);
    // Default to free plan if no subscription found
    return getCapabilitiesByPlan('free');
  }

  return getCapabilitiesByPlan(subscription?.plan || 'free');
}

/**
 * Map plan type to capabilities
 */
function getCapabilitiesByPlan(plan: PlanType): EmployerCapabilities {
  const capabilities: Record<PlanType, EmployerCapabilities> = {
    free: {
      plan: 'free',
      max_active_listings: 2, // 1 job + 1 gig
      contact_unlocks_included: 0, // Must purchase
      can_use_filters: false,
      can_shortlist: false,
      can_bulk_outreach: false,
      can_invite_to_apply: false,
      can_view_analytics: false,
      can_team_accounts: false,
    },
    pro: {
      plan: 'pro',
      max_active_listings: 10,
      contact_unlocks_included: 5, // Per month
      can_use_filters: true,
      can_shortlist: true,
      can_bulk_outreach: false,
      can_invite_to_apply: true,
      can_view_analytics: false,
      can_team_accounts: false,
    },
    premium: {
      plan: 'premium',
      max_active_listings: 999,
      contact_unlocks_included: 50, // Per month
      can_use_filters: true,
      can_shortlist: true,
      can_bulk_outreach: true,
      can_invite_to_apply: true,
      can_view_analytics: true,
      can_team_accounts: true,
    },
  };

  return capabilities[plan];
}

/**
 * Check if employer can create a new listing
 */
export async function canCreateListing(employerId: string): Promise<boolean> {
  const capabilities = await getEmployerCapabilities(employerId);

  // Count active listings
  const { count, error } = await supabase
    .from('listings')
    .select('id', { count: 'exact' })
    .eq('employer_id', employerId)
    .eq('status', 'active');

  if (error) {
    console.error('Error counting listings:', error);
    return false;
  }

  return (count || 0) < capabilities.max_active_listings;
}

/**
 * Check if employer can contact a candidate
 * (either through unlock or included in plan)
 */
export async function canContactCandidate(
  employerId: string,
  candidateId: string
): Promise<{ can_contact: boolean; reason: string }> {
  const capabilities = await getEmployerCapabilities(employerId);

  // Check if already unlocked
  const { data: unlock, error: unlockError } = await supabase
    .from('contact_unlocks')
    .select('id')
    .eq('employer_id', employerId)
    .eq('candidate_id', candidateId)
    .single();

  if (!unlockError && unlock) {
    return { can_contact: true, reason: 'already_unlocked' };
  }

  // Check if plan includes unlocks
  if (capabilities.contact_unlocks_included > 0) {
    // Check if they have remaining unlocks for the month
    const { data: ledger, error: ledgerError } = await supabase
      .from('credits_ledger')
      .select('balance')
      .eq('employer_id', employerId)
      .eq('credit_type', 'contact_unlock')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!ledgerError && ledger && ledger.balance > 0) {
      return { can_contact: true, reason: 'plan_includes' };
    }
  }

  return { can_contact: false, reason: 'needs_purchase_or_unlock' };
}

/**
 * Check if employer can use advanced filters
 */
export async function canUseFilters(employerId: string): Promise<boolean> {
  const capabilities = await getEmployerCapabilities(employerId);
  return capabilities.can_use_filters;
}

/**
 * Check if employer can shortlist candidates
 */
export async function canShortlist(employerId: string): Promise<boolean> {
  const capabilities = await getEmployerCapabilities(employerId);
  return capabilities.can_shortlist;
}

/**
 * Get candidate capabilities
 */
export async function getCandidateCapabilities(
  candidateId: string
): Promise<CandidateCapabilities> {
  // Fetch candidate profile
  const { data: candidate, error } = await supabase
    .from('candidate_profiles')
    .select('verified_id, verified_references')
    .eq('id', candidateId)
    .single();

  if (error) {
    console.error('Error fetching candidate profile:', error);
    return {
      can_apply: true, // Always can apply
      can_message: false,
      has_premium_visibility: false,
      verification_level: 'unverified',
    };
  }

  let verification_level: 'unverified' | 'id_verified' | 'references_verified' = 'unverified';
  if (candidate?.verified_references) {
    verification_level = 'references_verified';
  } else if (candidate?.verified_id) {
    verification_level = 'id_verified';
  }

  return {
    can_apply: true, // Always can apply (free)
    can_message: true, // Always can message (free, but limited)
    has_premium_visibility: false, // For future Premium tier
    verification_level,
  };
}

/**
 * Utility: Check if feature is available
 * Use this in UI to conditionally render features
 */
export async function hasFeature(
  userId: string,
  featureName: keyof EmployerCapabilities | keyof CandidateCapabilities,
  userType: 'employer' | 'candidate'
): Promise<boolean> {
  if (userType === 'employer') {
    const caps = await getEmployerCapabilities(userId);
    return (caps[featureName as keyof EmployerCapabilities] as any) === true;
  } else {
    const caps = await getCandidateCapabilities(userId);
    return (caps[featureName as keyof CandidateCapabilities] as any) === true;
  }
}
