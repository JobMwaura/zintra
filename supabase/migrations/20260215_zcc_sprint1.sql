-- ============================================
-- ZCC Sprint 1: Foundation + Credits + Featured
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. WALLETS (replaces old zcc_credits single-row approach)
-- One wallet per user (not per employer). Supports candidate credits too.
CREATE TABLE IF NOT EXISTS zcc_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. CREDIT PRODUCTS (admin-configurable packs & SKUs)
CREATE TABLE IF NOT EXISTS zcc_credit_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  role_scope text NOT NULL DEFAULT 'employer' CHECK (role_scope IN ('employer', 'candidate', 'both')),
  credits_amount integer NOT NULL,
  price_kes integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. CREDIT TRANSACTIONS (full ledger — every topup, spend, refund)
CREATE TABLE IF NOT EXISTS zcc_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('topup', 'spend', 'refund', 'bonus', 'promo')),
  sku text,  -- which product was purchased (for topups)
  credits_delta integer NOT NULL,  -- positive = add, negative = deduct
  balance_after integer NOT NULL,
  amount_kes integer,  -- money involved (null for bonus/promo)
  reference text,  -- payment ref, mpesa code, etc.
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. CREDIT SPENDS (what credits were spent on — granular tracking)
CREATE TABLE IF NOT EXISTS zcc_credit_spends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spend_type text NOT NULL CHECK (spend_type IN (
    'job_post', 'gig_post', 'featured_job', 'featured_gig',
    'contact_unlock', 'invite_to_apply', 'boost_post',
    'verification_bundle', 'featured_profile', 'application_boost', 'extra_applications'
  )),
  related_id uuid,  -- post_id, application_id, candidate_id, etc.
  credits_spent integer NOT NULL,
  transaction_id uuid REFERENCES zcc_credit_transactions(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. FEATURED POSTS (time-limited paid placements)
CREATE TABLE IF NOT EXISTS zcc_featured_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,  -- references listings.id
  employer_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'featured' CHECK (label IN ('featured', 'sponsored', 'urgent')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  spend_id uuid REFERENCES zcc_credit_spends(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. CONTACT UNLOCKS (employer reveals candidate contact)
CREATE TABLE IF NOT EXISTS zcc_contact_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL,  -- user_id of employer
  candidate_id uuid NOT NULL, -- user_id of candidate
  post_id uuid,               -- optional: which listing context
  application_id uuid,        -- optional: which application context
  spend_id uuid REFERENCES zcc_credit_spends(id),
  unlocked_at timestamptz NOT NULL DEFAULT now()
);
-- Prevent duplicate unlocks
CREATE UNIQUE INDEX IF NOT EXISTS idx_zcc_contact_unlocks_pair 
  ON zcc_contact_unlocks(employer_id, candidate_id);

-- 7. JOB ORDERS (post-acceptance structured work agreement)
CREATE TABLE IF NOT EXISTS zcc_job_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  application_id uuid NOT NULL,
  employer_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  agreed_amount integer,
  agreed_terms jsonb DEFAULT '{}',
  start_date date,
  county text,
  town text,
  site_pin text,  -- Google Maps pin or coordinates
  milestones jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'disputed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. REQUIREMENTS CHECKLIST (Fiverr-inspired pre-work requirements)
CREATE TABLE IF NOT EXISTS zcc_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  application_id uuid NOT NULL,
  requested_by uuid NOT NULL,  -- employer user_id
  checklist jsonb NOT NULL DEFAULT '[]',
  -- Example checklist: [{"key":"id_upload","label":"Upload ID","done":false}, ...]
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. ZCC NOTIFICATIONS
CREATE TABLE IF NOT EXISTS zcc_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  channel text NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'sms', 'email', 'whatsapp')),
  title text,
  body text,
  payload jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'read')),
  provider_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_zcc_wallets_user ON zcc_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_zcc_transactions_user ON zcc_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_zcc_transactions_created ON zcc_credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zcc_spends_user ON zcc_credit_spends(user_id);
CREATE INDEX IF NOT EXISTS idx_zcc_spends_type ON zcc_credit_spends(spend_type);
CREATE INDEX IF NOT EXISTS idx_zcc_featured_posts_active ON zcc_featured_posts(ends_at DESC);
CREATE INDEX IF NOT EXISTS idx_zcc_featured_posts_post ON zcc_featured_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_zcc_contact_unlocks_employer ON zcc_contact_unlocks(employer_id);
CREATE INDEX IF NOT EXISTS idx_zcc_notifications_user ON zcc_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_zcc_notifications_unread ON zcc_notifications(user_id) WHERE status != 'read';
CREATE INDEX IF NOT EXISTS idx_zcc_job_orders_employer ON zcc_job_orders(employer_id);
CREATE INDEX IF NOT EXISTS idx_zcc_job_orders_candidate ON zcc_job_orders(candidate_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Wallets: users can only see their own
ALTER TABLE zcc_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON zcc_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert wallets" ON zcc_wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can update own wallet" ON zcc_wallets FOR UPDATE USING (auth.uid() = user_id);

-- Credit products: everyone can read active products
ALTER TABLE zcc_credit_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active products" ON zcc_credit_products FOR SELECT USING (active = true);

-- Transactions: users can only see their own
ALTER TABLE zcc_credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON zcc_credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON zcc_credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Spends: users can only see their own
ALTER TABLE zcc_credit_spends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own spends" ON zcc_credit_spends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own spends" ON zcc_credit_spends FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Featured posts: everyone can read (shown on public pages)
ALTER TABLE zcc_featured_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view featured posts" ON zcc_featured_posts FOR SELECT USING (true);
CREATE POLICY "Employers can insert featured posts" ON zcc_featured_posts FOR INSERT WITH CHECK (auth.uid() = employer_id);

-- Contact unlocks: employer can see their own unlocks
ALTER TABLE zcc_contact_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employers can view own unlocks" ON zcc_contact_unlocks FOR SELECT USING (auth.uid() = employer_id);
CREATE POLICY "Employers can insert own unlocks" ON zcc_contact_unlocks FOR INSERT WITH CHECK (auth.uid() = employer_id);

-- Job orders: both parties can see
ALTER TABLE zcc_job_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties can view own orders" ON zcc_job_orders FOR SELECT 
  USING (auth.uid() = employer_id OR auth.uid() = candidate_id);
CREATE POLICY "Employers can create orders" ON zcc_job_orders FOR INSERT WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "Parties can update own orders" ON zcc_job_orders FOR UPDATE 
  USING (auth.uid() = employer_id OR auth.uid() = candidate_id);

-- Requirements: both parties can see
ALTER TABLE zcc_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties can view requirements" ON zcc_requirements FOR SELECT USING (true);
CREATE POLICY "Employers can create requirements" ON zcc_requirements FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- Notifications: users can only see their own
ALTER TABLE zcc_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON zcc_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON zcc_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON zcc_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ATOMIC SPEND RPC (prevents double-spend)
-- ============================================
CREATE OR REPLACE FUNCTION zcc_spend_credits(
  p_user_id uuid,
  p_amount integer,
  p_spend_type text,
  p_related_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
  v_tx_id uuid;
  v_spend_id uuid;
BEGIN
  -- Lock the wallet row to prevent concurrent spends
  SELECT balance INTO v_current_balance
  FROM zcc_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Insufficient credits. Balance: %s, Required: %s', v_current_balance, p_amount),
      'balance', v_current_balance
    );
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- Deduct from wallet
  UPDATE zcc_wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO zcc_credit_transactions (user_id, type, credits_delta, balance_after, description)
  VALUES (p_user_id, 'spend', -p_amount, v_new_balance, p_description)
  RETURNING id INTO v_tx_id;

  -- Create spend record
  INSERT INTO zcc_credit_spends (user_id, spend_type, related_id, credits_spent, transaction_id)
  VALUES (p_user_id, p_spend_type, p_related_id, p_amount, v_tx_id)
  RETURNING id INTO v_spend_id;

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_new_balance,
    'transaction_id', v_tx_id,
    'spend_id', v_spend_id
  );
END;
$$;

-- ============================================
-- TOPUP RPC (add credits to wallet)
-- ============================================
CREATE OR REPLACE FUNCTION zcc_topup_credits(
  p_user_id uuid,
  p_amount integer,
  p_sku text DEFAULT NULL,
  p_amount_kes integer DEFAULT NULL,
  p_reference text DEFAULT NULL,
  p_type text DEFAULT 'topup'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance integer;
  v_tx_id uuid;
BEGIN
  -- Upsert wallet (create if doesn't exist)
  INSERT INTO zcc_wallets (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = zcc_wallets.balance + p_amount, updated_at = now()
  RETURNING balance INTO v_new_balance;

  -- Create transaction record
  INSERT INTO zcc_credit_transactions (user_id, type, sku, credits_delta, balance_after, amount_kes, reference)
  VALUES (p_user_id, p_type, p_sku, p_amount, v_new_balance, p_amount_kes, p_reference)
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_new_balance,
    'transaction_id', v_tx_id
  );
END;
$$;

-- ============================================
-- SEED: Credit Products (Kenya-friendly packs)
-- ============================================

-- Employer packs
INSERT INTO zcc_credit_products (sku, name, description, role_scope, credits_amount, price_kes, sort_order, metadata) VALUES
  ('emp_starter', 'Starter Hiring Pack', '1 job post + 5 contact unlocks', 'employer', 150, 800, 1, '{"includes": {"job_posts": 1, "contact_unlocks": 5}}'),
  ('emp_gig_pack', 'Gig Pack', '3 gig posts + 10 contact unlocks + 1 featured gig (24h)', 'employer', 400, 2000, 2, '{"includes": {"gig_posts": 3, "contact_unlocks": 10, "featured_gig_24h": 1}, "popular": true}'),
  ('emp_pro', 'Pro Hiring Pack', '5 job posts + 30 contact unlocks + 2 featured jobs (7d)', 'employer', 1200, 5000, 3, '{"includes": {"job_posts": 5, "contact_unlocks": 30, "featured_job_7d": 2}}'),
  ('emp_enterprise', 'Enterprise Pack', '20 job posts + 100 contact unlocks + 5 featured + priority support', 'employer', 5000, 18000, 4, '{"includes": {"job_posts": 20, "contact_unlocks": 100, "featured_job_7d": 5}, "popular": false}')
ON CONFLICT (sku) DO NOTHING;

-- Candidate packs
INSERT INTO zcc_credit_products (sku, name, description, role_scope, credits_amount, price_kes, sort_order, metadata) VALUES
  ('cand_verify', 'Verification Bundle', 'Get verified: ID + references + certificates check', 'candidate', 50, 300, 10, '{"type": "verification_bundle"}'),
  ('cand_featured', 'Featured Profile (7 days)', 'Appear in Featured Workers section for 7 days', 'candidate', 80, 500, 11, '{"type": "featured_profile", "duration_days": 7}'),
  ('cand_apply_pack', 'Apply Pack (10 extra)', '10 extra job/gig applications', 'candidate', 30, 200, 12, '{"type": "extra_applications", "applications": 10}'),
  ('cand_pro', 'Pro Worker Pack', 'Verification bundle + 7-day featured profile', 'candidate', 120, 700, 13, '{"type": "pro_bundle", "includes": ["verification_bundle", "featured_profile_7d"], "popular": true}')
ON CONFLICT (sku) DO NOTHING;

-- ============================================
-- SEED: Credit costs (individual actions)
-- These are reference values used by server actions
-- ============================================
INSERT INTO zcc_credit_products (sku, name, description, role_scope, credits_amount, price_kes, sort_order, active, metadata) VALUES
  ('action_job_post', 'Post a Job', 'Cost to publish one job listing', 'employer', 30, 0, 100, true, '{"is_action": true}'),
  ('action_gig_post', 'Post a Gig', 'Cost to publish one gig listing', 'employer', 20, 0, 101, true, '{"is_action": true}'),
  ('action_featured_job_7d', 'Feature Job (7 days)', 'Pin job to featured section for 7 days', 'employer', 50, 0, 102, true, '{"is_action": true, "duration_days": 7}'),
  ('action_featured_job_14d', 'Feature Job (14 days)', 'Pin job to featured section for 14 days', 'employer', 80, 0, 103, true, '{"is_action": true, "duration_days": 14}'),
  ('action_featured_job_30d', 'Feature Job (30 days)', 'Pin job to featured section for 30 days', 'employer', 120, 0, 104, true, '{"is_action": true, "duration_days": 30}'),
  ('action_featured_gig_24h', 'Feature Gig (24h)', 'Pin gig to featured section for 24 hours', 'employer', 15, 0, 105, true, '{"is_action": true, "duration_hours": 24}'),
  ('action_featured_gig_72h', 'Feature Gig (72h)', 'Pin gig to featured section for 72 hours', 'employer', 30, 0, 106, true, '{"is_action": true, "duration_hours": 72}'),
  ('action_contact_unlock', 'Unlock Contact', 'Reveal candidate phone/WhatsApp', 'employer', 10, 0, 107, true, '{"is_action": true}'),
  ('action_boost_24h', 'Boost Post (24h)', 'Push listing to top of search for 24 hours', 'employer', 20, 0, 108, true, '{"is_action": true, "duration_hours": 24}')
ON CONFLICT (sku) DO NOTHING;
