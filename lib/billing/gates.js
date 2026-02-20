'use server';

/**
 * Zintra Billing — Gate Checks
 * 
 * Central helpers that enforce posting limits, contact unlock quotas,
 * and feature access based on the user's billing tier.
 * 
 * Flow for a gated action:
 *   1. Check included quota first (billing_included_usage)
 *   2. If quota available → consume 1 unit, allow action (free)
 *   3. If quota exhausted → fall back to credits (ZCC wallet)
 *   4. If no credits → block and prompt upgrade
 * 
 * Usage:
 *   const gate = await checkPostingGate(userId, 'job');
 *   if (!gate.allowed) return { error: gate.reason, upgrade: gate.upgrade };
 *   // ... do the action ...
 *   if (gate.source === 'included') await consumePostingQuota(userId, 'job');
 */

import { createClient } from '@/lib/supabase/server';
import { getCapabilities } from '@/lib/billing/capabilities';

// ─── Capability key mappings ────────────────────────────────────

const POSTING_LIMITS = {
  job: 'zcc.posts.job.max_active',
  gig: 'zcc.posts.gig.max_active',
};

const INCLUDED_KEYS = {
  contact_unlock: 'zcc.unlocks.contact.included',
  featured_listing: 'zcc.featured.included_per_month',
};

const VENDOR_LIMITS = {
  rfq_responses: 'marketplace.rfq.responses.max_active',
  featured_listing: 'marketplace.featured.included_per_month',
};

// ─── Employer Posting Gate ──────────────────────────────────────

/**
 * Check if employer can post a listing (job or gig).
 * 
 * @param {string} userId
 * @param {'job'|'gig'} listingType
 * @returns {{ allowed: boolean, source: 'included'|'credits'|'blocked', reason?: string, upgrade?: boolean, limit?: number, active?: number }}
 */
export async function checkPostingGate(userId, listingType = 'job') {
  const supabase = await createClient();
  const capKey = POSTING_LIMITS[listingType];

  if (!capKey) {
    return { allowed: true, source: 'credits' }; // Unknown type, fall through to credits
  }

  // Get capabilities
  const { capabilities } = await getCapabilities(userId);
  const limit = capabilities?.zcc?.limits?.[capKey] ?? 2; // Free default: 2

  // -1 or 999 = unlimited
  if (limit === -1 || limit >= 999) {
    return { allowed: true, source: 'included', limit, active: 0 };
  }

  // Count current active listings of this type
  const { count, error } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('employer_id', userId)
    .eq('type', listingType)
    .eq('status', 'active');

  const active = count || 0;

  if (active >= limit) {
    // Over the limit — still allow if they pay with credits
    return {
      allowed: true,
      source: 'credits',
      limit,
      active,
      overLimit: true,
      message: `You've used ${active} of ${limit} included ${listingType} slots. This posting will cost credits.`,
    };
  }

  return {
    allowed: true,
    source: 'included',
    limit,
    active,
    remaining: limit - active,
  };
}

/**
 * After a successful posting, consume one unit from included quota.
 * Only call this if checkPostingGate returned source === 'included'.
 */
export async function consumePostingQuota(userId, listingType) {
  const capKey = POSTING_LIMITS[listingType];
  if (!capKey) return;

  const supabase = await createClient();
  await supabase.rpc('increment_billing_usage', {
    p_user_id: userId,
    p_metric_key: capKey,
  }).catch(() => {}); // Best-effort; active count is the real source of truth
}

// ─── Contact Unlock Gate ────────────────────────────────────────

/**
 * Check if employer can unlock a contact.
 * Flow: included quota → credits fallback → blocked.
 * 
 * @param {string} userId
 * @returns {{ allowed: boolean, source: 'included'|'credits'|'blocked', reason?: string }}
 */
export async function checkContactUnlockGate(userId) {
  const supabase = await createClient();
  const metricKey = INCLUDED_KEYS.contact_unlock;

  // Get capabilities
  const { capabilities } = await getCapabilities(userId);
  const included = capabilities?.zcc?.included?.[metricKey] ?? 0;

  if (included <= 0) {
    // No included unlocks — go straight to credits
    return { allowed: true, source: 'credits', included: 0 };
  }

  // Check remaining quota
  const now = new Date().toISOString();
  const { data: usage } = await supabase
    .from('billing_included_usage')
    .select('metric_value')
    .eq('user_id', userId)
    .eq('metric_key', metricKey)
    .lte('period_start', now)
    .gte('period_end', now)
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  const used = usage?.metric_value || 0;
  const remaining = Math.max(0, included - used);

  if (remaining > 0) {
    return {
      allowed: true,
      source: 'included',
      included,
      used,
      remaining,
      message: `Using included unlock (${remaining} remaining this period)`,
    };
  }

  // Quota exhausted — fall through to credits
  return {
    allowed: true,
    source: 'credits',
    included,
    used,
    remaining: 0,
    message: 'Included unlocks used up — this will cost credits.',
  };
}

/**
 * Consume one included contact unlock.
 */
export async function consumeContactUnlockQuota(userId) {
  const supabase = await createClient();
  await supabase.rpc('increment_billing_usage', {
    p_user_id: userId,
    p_metric_key: INCLUDED_KEYS.contact_unlock,
  }).catch(() => {});
}

// ─── Vendor RFQ Response Gate ───────────────────────────────────

/**
 * Check if vendor can respond to an RFQ.
 * Gate: active responses ≤ marketplace.rfq.responses.max_active
 * 
 * @param {string} vendorId — vendor profile ID (from vendors table)
 * @param {string} userId — auth user ID for capability lookup
 * @returns {{ allowed: boolean, source: string, reason?: string }}
 */
export async function checkRfqResponseGate(vendorId, userId) {
  const supabase = await createClient();
  const capKey = VENDOR_LIMITS.rfq_responses;

  const { capabilities } = await getCapabilities(userId);
  const limit = capabilities?.marketplace?.limits?.[capKey] ?? 3; // Free default: 3

  if (limit === -1 || limit >= 999) {
    return { allowed: true, source: 'included', limit };
  }

  // Count active responses (pending + submitted, not rejected/expired)
  const { count } = await supabase
    .from('rfq_responses')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .in('status', ['pending', 'submitted', 'accepted']);

  const active = count || 0;

  if (active >= limit) {
    return {
      allowed: false,
      source: 'blocked',
      limit,
      active,
      reason: `You've reached your limit of ${limit} active RFQ responses. Upgrade to Pro or Premium for more.`,
      upgrade: true,
    };
  }

  return {
    allowed: true,
    source: 'included',
    limit,
    active,
    remaining: limit - active,
  };
}

// ─── Feature Gate ───────────────────────────────────────────────

/**
 * Check if a user has a specific boolean feature enabled.
 * 
 * @param {string} userId
 * @param {string} featureKey — e.g. 'zcc.analytics.enabled'
 * @returns {{ allowed: boolean, reason?: string }}
 */
export async function checkFeatureGate(userId, featureKey) {
  const { capabilities } = await getCapabilities(userId);

  // Check ZCC scope
  if (capabilities?.zcc?.features?.[featureKey]) {
    return { allowed: true };
  }

  // Check marketplace scope
  if (capabilities?.marketplace?.features?.[featureKey]) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `This feature requires a Pro or Premium plan.`,
    upgrade: true,
  };
}

// ─── Tier Check ─────────────────────────────────────────────────

/**
 * Quick check: is the user at least the given tier?
 * 
 * @param {string} userId
 * @param {'free'|'pro'|'premium'} requiredTier
 * @param {'zcc_employer'|'marketplace_vendor'} scope
 * @returns {{ allowed: boolean, currentTier: string }}
 */
export async function checkTierGate(userId, requiredTier, scope = 'zcc_employer') {
  const RANK = { free: 0, pro: 1, premium: 2 };
  const { capabilities } = await getCapabilities(userId);

  const scopeKey = scope === 'marketplace_vendor' ? 'marketplace' : 'zcc';
  const roleKey = scope === 'marketplace_vendor' ? 'vendor' : 'employer';
  const currentTier = capabilities?.[scopeKey]?.[roleKey]?.tier || 'free';

  return {
    allowed: (RANK[currentTier] || 0) >= (RANK[requiredTier] || 0),
    currentTier,
    requiredTier,
    upgrade: (RANK[currentTier] || 0) < (RANK[requiredTier] || 0),
  };
}
