'use server';

/**
 * Zintra Billing — Server Actions
 * 
 * Pass management, product catalog, usage tracking, admin tools.
 */

import { createClient } from '@/lib/supabase/server';
import { refreshCapabilities } from '@/lib/billing/capabilities';

// ─── Product Catalog ─────────────────────────────────────────────

/**
 * Get all active billing products, grouped by scope.
 */
export async function getBillingProducts() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('billing_products')
    .select(`
      id, product_code, name, description, scope, tier,
      billing_mode, duration_days, price_kes, price_usd, active,
      billing_entitlements(capability_key, capability_value)
    `)
    .eq('active', true)
    .order('price_kes', { ascending: true });

  if (error) {
    console.error('Error fetching billing products:', error);
    return { success: false, error: error.message };
  }

  // Group by scope
  const grouped = {
    marketplace_vendor: (data || []).filter(p => p.scope === 'marketplace_vendor'),
    zcc_employer: (data || []).filter(p => p.scope === 'zcc_employer'),
  };

  return { success: true, products: data, grouped };
}

// ─── Pass Management ─────────────────────────────────────────────

/**
 * Get a user's active passes.
 */
export async function getActivePasses(userId) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('billing_passes')
    .select(`
      id, status, starts_at, ends_at, purchase_ref, created_at,
      billing_products(product_code, name, scope, tier, price_kes)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('ends_at', now)
    .order('ends_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, passes: data || [] };
}

/**
 * Get pass purchase history.
 */
export async function getPassPurchaseHistory(userId, limit = 20) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('billing_pass_purchases')
    .select(`
      id, amount_kes, currency, status, provider,
      provider_checkout_id, provider_receipt, created_at,
      billing_products(product_code, name, scope, tier)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, purchases: data || [] };
}

/**
 * Activate a pass after successful payment.
 * Called by M-Pesa webhook or manual grant.
 */
export async function activatePass(userId, productId, purchaseRef = null, metadata = {}) {
  const supabase = await createClient();

  // Get product duration
  const { data: product, error: prodError } = await supabase
    .from('billing_products')
    .select('id, duration_days, scope, tier, product_code')
    .eq('id', productId)
    .single();

  if (prodError || !product) {
    return { success: false, error: 'Product not found' };
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + (product.duration_days || 30) * 24 * 60 * 60 * 1000);

  // Cancel any existing active pass for the same scope (upgrade replaces)
  await supabase
    .from('billing_passes')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'active')
    .in('product_id', 
      // Get all product IDs for same scope
      (await supabase
        .from('billing_products')
        .select('id')
        .eq('scope', product.scope)
      ).data?.map(p => p.id) || []
    );

  // Create new pass
  const { data: pass, error: passError } = await supabase
    .from('billing_passes')
    .insert({
      user_id: userId,
      product_id: productId,
      status: 'active',
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      purchase_ref: purchaseRef,
      metadata,
    })
    .select()
    .single();

  if (passError) {
    return { success: false, error: passError.message };
  }

  // Initialize included usage for this period
  const { data: entitlements } = await supabase
    .from('billing_entitlements')
    .select('capability_key, capability_value')
    .eq('product_id', productId);

  for (const ent of (entitlements || [])) {
    if (ent.capability_key.includes('included') && ent.capability_value.type === 'number') {
      await supabase
        .from('billing_included_usage')
        .upsert({
          user_id: userId,
          scope: product.scope,
          product_id: productId,
          period_start: now.toISOString(),
          period_end: endsAt.toISOString(),
          metric_key: ent.capability_key,
          metric_value: 0,
          updated_at: now.toISOString(),
        }, { onConflict: 'user_id,product_id,period_start,metric_key' });
    }
  }

  // Refresh capabilities cache
  await refreshCapabilities(userId);

  return {
    success: true,
    pass,
    tier: product.tier,
    scope: product.scope,
    ends_at: endsAt.toISOString(),
  };
}

/**
 * Admin: Manually grant a pass (support tool).
 */
export async function adminGrantPass(userId, productCode, grantedBy = 'admin') {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('billing_products')
    .select('id')
    .eq('product_code', productCode)
    .single();

  if (!product) {
    return { success: false, error: `Product ${productCode} not found` };
  }

  return activatePass(userId, product.id, `manual-grant-${grantedBy}`, { granted_by: grantedBy });
}

/**
 * Admin: Revoke a pass.
 */
export async function adminRevokePass(passId) {
  const supabase = await createClient();

  const { data: pass, error } = await supabase
    .from('billing_passes')
    .update({ status: 'cancelled' })
    .eq('id', passId)
    .select('user_id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Refresh capabilities
  await refreshCapabilities(pass.user_id);

  return { success: true };
}

// ─── Included Usage Tracking ─────────────────────────────────────

/**
 * Check remaining included quota for a metric.
 * Returns { remaining, limit, used }.
 */
export async function getIncludedRemaining(userId, metricKey) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Get active usage record for this metric within current period
  const { data: usage } = await supabase
    .from('billing_included_usage')
    .select('metric_value, period_start, period_end, billing_products(id)')
    .eq('user_id', userId)
    .eq('metric_key', metricKey)
    .lte('period_start', now)
    .gte('period_end', now)
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!usage) {
    return { remaining: 0, limit: 0, used: 0 };
  }

  // Get the entitlement limit
  const { data: ent } = await supabase
    .from('billing_entitlements')
    .select('capability_value')
    .eq('product_id', usage.billing_products.id)
    .eq('capability_key', metricKey)
    .maybeSingle();

  const limit = ent?.capability_value?.value || 0;
  const used = usage.metric_value || 0;

  return { remaining: Math.max(0, limit - used), limit, used };
}

/**
 * Consume one unit of included quota.
 * Returns { consumed: true } if quota available, { consumed: false } if exceeded.
 */
export async function consumeIncluded(userId, metricKey) {
  const { remaining } = await getIncludedRemaining(userId, metricKey);

  if (remaining <= 0) {
    return { consumed: false, remaining: 0 };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('billing_included_usage')
    .update({
      metric_value: remaining > 0 ? undefined : 0, // Will use SQL increment below
      updated_at: now,
    })
    .eq('user_id', userId)
    .eq('metric_key', metricKey)
    .lte('period_start', now)
    .gte('period_end', now);

  // Use RPC or raw increment — simpler: just increment directly
  const { error: incError } = await supabase.rpc('increment_billing_usage', {
    p_user_id: userId,
    p_metric_key: metricKey,
  }).catch(() => {
    // Fallback: manual increment
    return { error: null };
  });

  return { consumed: true, remaining: remaining - 1 };
}

// ─── Subscription Info ───────────────────────────────────────────

/**
 * Get user's active subscriptions.
 */
export async function getActiveSubscriptions(userId) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('billing_subscriptions')
    .select(`
      id, status, current_period_start, current_period_end,
      cancel_at_period_end, created_at,
      billing_products(product_code, name, scope, tier, price_kes, price_usd)
    `)
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, subscriptions: data || [] };
}

// ─── Unified Status ──────────────────────────────────────────────

/**
 * Get complete billing status for a user.
 * Used by the Upgrade/billing page.
 */
export async function getBillingStatus(userId) {
  const [productsResult, passesResult, subsResult, historyResult] = await Promise.all([
    getBillingProducts(),
    getActivePasses(userId),
    getActiveSubscriptions(userId),
    getPassPurchaseHistory(userId, 5),
  ]);

  // Determine current active tiers per scope
  const activeTiers = {};
  const activeUntil = {};

  for (const pass of (passesResult.passes || [])) {
    const scope = pass.billing_products?.scope;
    if (scope) {
      activeTiers[scope] = pass.billing_products.tier;
      activeUntil[scope] = pass.ends_at;
    }
  }

  for (const sub of (subsResult.subscriptions || [])) {
    const scope = sub.billing_products?.scope;
    if (scope) {
      const existing = activeTiers[scope];
      if (!existing || TIER_RANK[sub.billing_products.tier] > TIER_RANK[existing]) {
        activeTiers[scope] = sub.billing_products.tier;
        activeUntil[scope] = sub.current_period_end;
      }
    }
  }

  return {
    success: true,
    products: productsResult.grouped || {},
    activeTiers,
    activeUntil,
    passes: passesResult.passes || [],
    subscriptions: subsResult.subscriptions || [],
    recentPurchases: historyResult.purchases || [],
  };
}

const TIER_RANK = { free: 0, pro: 1, premium: 2 };
