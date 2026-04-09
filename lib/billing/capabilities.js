'use server';

/**
 * Zintra Billing — Unified Capability Resolver
 * 
 * Resolves what a user can do based on:
 *   1. Active subscription (Stripe) OR
 *   2. Active pass (M-Pesa prepaid) OR
 *   3. Free tier fallback
 * 
 * Uses the highest tier if multiple are active.
 */

import { createClient } from '@/lib/supabase/server';

const TIER_RANK = { free: 0, pro: 1, premium: 2 };

// ─── Public API ──────────────────────────────────────────────────

/**
 * Resolve all capabilities for a user.
 * Returns a structured object with per-scope tier + limits.
 */
export async function resolveCapabilities(userId) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // 1. Expire stale passes first
  await supabase.rpc('expire_billing_passes').catch(() => {});

  // 2. Get active passes
  const { data: passes } = await supabase
    .from('billing_passes')
    .select('id, product_id, starts_at, ends_at, billing_products(product_code, scope, tier)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('ends_at', now);

  // 3. Get active subscriptions
  const { data: subs } = await supabase
    .from('billing_subscriptions')
    .select('id, product_id, current_period_end, billing_products(product_code, scope, tier)')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing']);

  // 4. Pick highest tier per scope
  const bestByScope = {};

  const allActive = [
    ...(passes || []).map(p => ({
      source_type: 'pass',
      source_id: p.id,
      scope: p.billing_products.scope,
      tier: p.billing_products.tier,
      product_code: p.billing_products.product_code,
      product_id: p.product_id,
      ends_at: p.ends_at,
    })),
    ...(subs || []).map(s => ({
      source_type: 'subscription',
      source_id: s.id,
      scope: s.billing_products.scope,
      tier: s.billing_products.tier,
      product_code: s.billing_products.product_code,
      product_id: s.product_id,
      ends_at: s.current_period_end,
    })),
  ];

  for (const item of allActive) {
    const existing = bestByScope[item.scope];
    if (!existing || TIER_RANK[item.tier] > TIER_RANK[existing.tier]) {
      bestByScope[item.scope] = item;
    }
  }

  // 5. For scopes without active entitlement, fall back to free
  const { data: freeProducts } = await supabase
    .from('billing_products')
    .select('id, product_code, scope, tier')
    .eq('tier', 'free')
    .eq('active', true);

  for (const fp of (freeProducts || [])) {
    if (!bestByScope[fp.scope]) {
      bestByScope[fp.scope] = {
        source_type: 'free',
        source_id: null,
        scope: fp.scope,
        tier: 'free',
        product_code: fp.product_code,
        product_id: fp.id,
        ends_at: null,
      };
    }
  }

  // 6. Load entitlements for the chosen products
  const productIds = Object.values(bestByScope).map(b => b.product_id);
  const { data: entitlements } = await supabase
    .from('billing_entitlements')
    .select('product_id, capability_key, capability_value')
    .in('product_id', productIds);

  // 7. Build resolved capabilities
  const capabilities = {};
  const sources = {};

  for (const [scope, best] of Object.entries(bestByScope)) {
    const scopeKey = scope === 'marketplace_vendor' ? 'marketplace' : 'zcc';
    const roleKey = scope === 'marketplace_vendor' ? 'vendor' : 'employer';

    capabilities[scopeKey] = {
      [roleKey]: { tier: best.tier },
      limits: {},
      included: {},
      features: {},
    };

    sources[scopeKey] = {
      source_type: best.source_type,
      source_id: best.source_id,
      product_code: best.product_code,
      ends_at: best.ends_at,
    };

    // Map entitlements
    const scopeEntitlements = (entitlements || []).filter(e => e.product_id === best.product_id);
    for (const ent of scopeEntitlements) {
      const val = ent.capability_value;
      const key = ent.capability_key;

      if (val.type === 'number') {
        // Classify into limits vs included
        if (key.includes('max_active') || key.includes('max_')) {
          capabilities[scopeKey].limits[key] = val.value;
        } else if (key.includes('included')) {
          capabilities[scopeKey].included[key] = val.value;
        } else {
          capabilities[scopeKey].limits[key] = val.value;
        }
      } else if (val.type === 'boolean') {
        capabilities[scopeKey].features[key] = val.value;
      } else if (val.type === 'string') {
        // tier already set above
      }
    }
  }

  // 8. Cache it
  await supabase
    .from('user_capabilities_cache')
    .upsert({
      user_id: userId,
      capabilities,
      source: sources,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .catch(() => {}); // Non-critical

  return { capabilities, sources };
}

/**
 * Get cached capabilities (fast path).
 * Falls back to full resolution if cache is stale or missing.
 */
export async function getCapabilities(userId) {
  const supabase = await createClient();

  const { data: cached } = await supabase
    .from('user_capabilities_cache')
    .select('capabilities, source, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  // Cache hit: use if updated within last hour
  if (cached) {
    const age = Date.now() - new Date(cached.updated_at).getTime();
    if (age < 60 * 60 * 1000) {
      return { capabilities: cached.capabilities, sources: cached.source, cached: true };
    }
  }

  // Cache miss or stale: resolve fresh
  const result = await resolveCapabilities(userId);
  return { ...result, cached: false };
}

/**
 * Get the user's tier for a specific scope.
 */
export async function getUserTier(userId, scope = 'zcc_employer') {
  const { capabilities } = await getCapabilities(userId);
  const scopeKey = scope === 'marketplace_vendor' ? 'marketplace' : 'zcc';
  const roleKey = scope === 'marketplace_vendor' ? 'vendor' : 'employer';
  return capabilities?.[scopeKey]?.[roleKey]?.tier || 'free';
}

/**
 * Check a specific capability limit.
 * e.g. getCapabilityLimit(userId, 'zcc.posts.job.max_active')
 */
export async function getCapabilityLimit(userId, capabilityKey) {
  const { capabilities } = await getCapabilities(userId);

  // Search all scopes for the key
  for (const scope of Object.values(capabilities || {})) {
    if (scope.limits?.[capabilityKey] !== undefined) return scope.limits[capabilityKey];
    if (scope.included?.[capabilityKey] !== undefined) return scope.included[capabilityKey];
  }

  return 0;
}

/**
 * Check a specific boolean feature flag.
 */
export async function hasFeature(userId, featureKey) {
  const { capabilities } = await getCapabilities(userId);

  for (const scope of Object.values(capabilities || {})) {
    if (scope.features?.[featureKey] !== undefined) return scope.features[featureKey];
  }

  return false;
}

/**
 * Force refresh the capabilities cache (call after purchase or webhook).
 */
export async function refreshCapabilities(userId) {
  return resolveCapabilities(userId);
}
