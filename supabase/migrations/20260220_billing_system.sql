-- ============================================================================
-- ZINTRA BILLING SYSTEM — Sprint A: Products, Entitlements, Passes
-- Run in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. BILLING_PRODUCTS — What you sell (catalog)
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL CHECK (scope IN ('marketplace_vendor', 'zcc_employer')),
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'premium')),
  billing_mode TEXT NOT NULL CHECK (billing_mode IN ('pass', 'subscription', 'both')),
  duration_days INT, -- e.g. 30 for a pass
  price_kes INT NOT NULL DEFAULT 0,
  price_usd NUMERIC(10,2), -- optional for Stripe
  stripe_price_id TEXT, -- Stripe Price ID for subscriptions
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billing_products_scope ON billing_products(scope);
CREATE INDEX idx_billing_products_active ON billing_products(active);

-- ============================================================================
-- 2. BILLING_ENTITLEMENTS — Maps products → capabilities
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES billing_products(id) ON DELETE CASCADE,
  capability_key TEXT NOT NULL,
  capability_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, capability_key)
);

CREATE INDEX idx_billing_entitlements_product ON billing_entitlements(product_id);

-- ============================================================================
-- 3. BILLING_PASSES — M-Pesa prepaid time-based access
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES billing_products(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  purchase_ref TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billing_passes_user ON billing_passes(user_id);
CREATE INDEX idx_billing_passes_status ON billing_passes(status);
CREATE INDEX idx_billing_passes_ends ON billing_passes(ends_at);

-- ============================================================================
-- 4. BILLING_PASS_PURCHASES — Payment attempts for passes
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_pass_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES billing_products(id) ON DELETE CASCADE,
  amount_kes INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'paid', 'failed', 'cancelled')),
  provider TEXT NOT NULL DEFAULT 'mpesa' CHECK (provider IN ('mpesa', 'manual')),
  provider_checkout_id TEXT,
  provider_receipt TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billing_pass_purchases_user ON billing_pass_purchases(user_id);
CREATE INDEX idx_billing_pass_purchases_checkout ON billing_pass_purchases(provider_checkout_id);

-- ============================================================================
-- 5. BILLING_SUBSCRIPTIONS — Stripe recurring (future)
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES billing_products(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe')),
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billing_subscriptions_user ON billing_subscriptions(user_id);
CREATE INDEX idx_billing_subscriptions_status ON billing_subscriptions(status);

-- ============================================================================
-- 6. BILLING_SUBSCRIPTION_EVENTS — Stripe webhook audit log
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES billing_subscriptions(id) ON DELETE SET NULL,
  provider_event_id TEXT,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. USER_CAPABILITIES_CACHE — Resolved capabilities per user
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_capabilities_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  capabilities JSONB NOT NULL DEFAULT '{}',
  source JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. BILLING_INCLUDED_USAGE — Track included quota consumption
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_included_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('zcc_employer', 'marketplace_vendor')),
  product_id UUID NOT NULL REFERENCES billing_products(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id, period_start, metric_key)
);

CREATE INDEX idx_billing_included_usage_user ON billing_included_usage(user_id);
CREATE INDEX idx_billing_included_usage_period ON billing_included_usage(period_start, period_end);

-- ============================================================================
-- 9. RLS POLICIES
-- ============================================================================

ALTER TABLE billing_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_pass_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_capabilities_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_included_usage ENABLE ROW LEVEL SECURITY;

-- Products + entitlements: public read
CREATE POLICY "anyone_read_products" ON billing_products FOR SELECT USING (true);
CREATE POLICY "anyone_read_entitlements" ON billing_entitlements FOR SELECT USING (true);

-- Passes: user reads own
CREATE POLICY "users_read_own_passes" ON billing_passes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service_insert_passes" ON billing_passes FOR INSERT WITH CHECK (true);
CREATE POLICY "service_update_passes" ON billing_passes FOR UPDATE USING (true);

-- Pass purchases: user reads own
CREATE POLICY "users_read_own_purchases" ON billing_pass_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_purchases" ON billing_pass_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "service_update_purchases" ON billing_pass_purchases FOR UPDATE USING (true);

-- Subscriptions: user reads own
CREATE POLICY "users_read_own_subscriptions" ON billing_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Capabilities cache: user reads own
CREATE POLICY "users_read_own_capabilities" ON user_capabilities_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service_upsert_capabilities" ON user_capabilities_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "service_update_capabilities" ON user_capabilities_cache FOR UPDATE USING (true);

-- Included usage: user reads own
CREATE POLICY "users_read_own_usage" ON billing_included_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service_manage_usage" ON billing_included_usage FOR ALL USING (true);

-- ============================================================================
-- 10. SEED DATA — Products + Entitlements
-- ============================================================================

-- VENDOR PRODUCTS
INSERT INTO billing_products (product_code, name, description, scope, tier, billing_mode, duration_days, price_kes, price_usd)
VALUES
  ('VENDOR_FREE', 'Vendor Free', 'Basic marketplace listing — always free', 'marketplace_vendor', 'free', 'pass', NULL, 0, NULL),
  ('VENDOR_PRO', 'Vendor Pro', '30-day Pro access — more visibility, analytics, more RFQ responses', 'marketplace_vendor', 'pro', 'both', 30, 2500, 25.00),
  ('VENDOR_PREMIUM', 'Vendor Premium', '30-day Premium — featured slots, priority ranking, unlimited responses', 'marketplace_vendor', 'premium', 'both', 30, 5000, 50.00)
ON CONFLICT (product_code) DO NOTHING;

-- EMPLOYER PRODUCTS
INSERT INTO billing_products (product_code, name, description, scope, tier, billing_mode, duration_days, price_kes, price_usd)
VALUES
  ('EMPLOYER_FREE', 'Employer Free', 'Basic Career Centre access — always free', 'zcc_employer', 'free', 'pass', NULL, 0, NULL),
  ('EMPLOYER_PRO', 'Employer Pro', '30-day Pro — more listings, contact unlocks, analytics', 'zcc_employer', 'pro', 'both', 30, 3000, 30.00),
  ('EMPLOYER_PREMIUM', 'Employer Premium', '30-day Premium — unlimited listings, featured slots, team accounts', 'zcc_employer', 'premium', 'both', 30, 7500, 75.00)
ON CONFLICT (product_code) DO NOTHING;

-- ENTITLEMENTS: Free tier (vendor)
INSERT INTO billing_entitlements (product_id, capability_key, capability_value)
SELECT id, key, value::jsonb FROM billing_products,
  (VALUES
    ('marketplace.vendor.tier', '{"type":"string","value":"free"}'),
    ('marketplace.rfq.responses.max_active', '{"type":"number","value":3}'),
    ('marketplace.visibility.priority_ranking', '{"type":"boolean","value":false}'),
    ('marketplace.analytics.enabled', '{"type":"boolean","value":false}'),
    ('marketplace.featured.included_per_month', '{"type":"number","value":0}')
  ) AS ent(key, value)
WHERE product_code = 'VENDOR_FREE'
ON CONFLICT (product_id, capability_key) DO NOTHING;

-- ENTITLEMENTS: Pro tier (vendor)
INSERT INTO billing_entitlements (product_id, capability_key, capability_value)
SELECT id, key, value::jsonb FROM billing_products,
  (VALUES
    ('marketplace.vendor.tier', '{"type":"string","value":"pro"}'),
    ('marketplace.rfq.responses.max_active', '{"type":"number","value":15}'),
    ('marketplace.visibility.priority_ranking', '{"type":"boolean","value":true}'),
    ('marketplace.analytics.enabled', '{"type":"boolean","value":true}'),
    ('marketplace.featured.included_per_month', '{"type":"number","value":1}')
  ) AS ent(key, value)
WHERE product_code = 'VENDOR_PRO'
ON CONFLICT (product_id, capability_key) DO NOTHING;

-- ENTITLEMENTS: Premium tier (vendor)
INSERT INTO billing_entitlements (product_id, capability_key, capability_value)
SELECT id, key, value::jsonb FROM billing_products,
  (VALUES
    ('marketplace.vendor.tier', '{"type":"string","value":"premium"}'),
    ('marketplace.rfq.responses.max_active', '{"type":"number","value":999}'),
    ('marketplace.visibility.priority_ranking', '{"type":"boolean","value":true}'),
    ('marketplace.analytics.enabled', '{"type":"boolean","value":true}'),
    ('marketplace.featured.included_per_month', '{"type":"number","value":3}')
  ) AS ent(key, value)
WHERE product_code = 'VENDOR_PREMIUM'
ON CONFLICT (product_id, capability_key) DO NOTHING;

-- ENTITLEMENTS: Free tier (employer)
INSERT INTO billing_entitlements (product_id, capability_key, capability_value)
SELECT id, key, value::jsonb FROM billing_products,
  (VALUES
    ('zcc.employer.tier', '{"type":"string","value":"free"}'),
    ('zcc.posts.job.max_active', '{"type":"number","value":2}'),
    ('zcc.posts.gig.max_active', '{"type":"number","value":2}'),
    ('zcc.unlocks.contact.included', '{"type":"number","value":0}'),
    ('zcc.analytics.enabled', '{"type":"boolean","value":false}'),
    ('zcc.shortlist.enabled', '{"type":"boolean","value":false}'),
    ('zcc.bulk_outreach.enabled', '{"type":"boolean","value":false}'),
    ('zcc.featured.included_per_month', '{"type":"number","value":0}'),
    ('zcc.team_accounts.enabled', '{"type":"boolean","value":false}')
  ) AS ent(key, value)
WHERE product_code = 'EMPLOYER_FREE'
ON CONFLICT (product_id, capability_key) DO NOTHING;

-- ENTITLEMENTS: Pro tier (employer)
INSERT INTO billing_entitlements (product_id, capability_key, capability_value)
SELECT id, key, value::jsonb FROM billing_products,
  (VALUES
    ('zcc.employer.tier', '{"type":"string","value":"pro"}'),
    ('zcc.posts.job.max_active', '{"type":"number","value":10}'),
    ('zcc.posts.gig.max_active', '{"type":"number","value":10}'),
    ('zcc.unlocks.contact.included', '{"type":"number","value":5}'),
    ('zcc.analytics.enabled', '{"type":"boolean","value":true}'),
    ('zcc.shortlist.enabled', '{"type":"boolean","value":true}'),
    ('zcc.bulk_outreach.enabled', '{"type":"boolean","value":false}'),
    ('zcc.featured.included_per_month', '{"type":"number","value":1}'),
    ('zcc.team_accounts.enabled', '{"type":"boolean","value":false}')
  ) AS ent(key, value)
WHERE product_code = 'EMPLOYER_PRO'
ON CONFLICT (product_id, capability_key) DO NOTHING;

-- ENTITLEMENTS: Premium tier (employer)
INSERT INTO billing_entitlements (product_id, capability_key, capability_value)
SELECT id, key, value::jsonb FROM billing_products,
  (VALUES
    ('zcc.employer.tier', '{"type":"string","value":"premium"}'),
    ('zcc.posts.job.max_active', '{"type":"number","value":999}'),
    ('zcc.posts.gig.max_active', '{"type":"number","value":999}'),
    ('zcc.unlocks.contact.included', '{"type":"number","value":50}'),
    ('zcc.analytics.enabled', '{"type":"boolean","value":true}'),
    ('zcc.shortlist.enabled', '{"type":"boolean","value":true}'),
    ('zcc.bulk_outreach.enabled', '{"type":"boolean","value":true}'),
    ('zcc.featured.included_per_month', '{"type":"number","value":3}'),
    ('zcc.team_accounts.enabled', '{"type":"boolean","value":true}')
  ) AS ent(key, value)
WHERE product_code = 'EMPLOYER_PREMIUM'
ON CONFLICT (product_id, capability_key) DO NOTHING;

-- ============================================================================
-- 11. RPC: Expire stale passes (call via cron or on login)
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_billing_passes()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected INT;
BEGIN
  UPDATE billing_passes
  SET status = 'expired'
  WHERE status = 'active' AND ends_at < NOW();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- ============================================================================
-- DONE — Verify
-- ============================================================================

SELECT 'billing_products' AS tbl, count(*) FROM billing_products
UNION ALL SELECT 'billing_entitlements', count(*) FROM billing_entitlements
UNION ALL SELECT 'billing_passes', count(*) FROM billing_passes
UNION ALL SELECT 'billing_pass_purchases', count(*) FROM billing_pass_purchases
UNION ALL SELECT 'billing_subscriptions', count(*) FROM billing_subscriptions;
