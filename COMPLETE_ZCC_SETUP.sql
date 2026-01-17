-- ============================================================================
-- COMPLETE ZCC (ZINTRA CAREER CENTRE) SETUP
-- Run this entire script in Supabase SQL Editor to set up all tables, policies, and data
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE ENUMS
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE payment_method_enum AS ENUM ('mpesa', 'card', 'pesapal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE job_post_status_enum AS ENUM ('draft', 'active', 'paused', 'closed', 'filled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- STEP 2: ALTER employer_profiles (if columns don't exist)
-- ============================================================================
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS is_vendor_employer BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- STEP 3: CREATE employer_payments TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS employer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  
  -- Payment details
  amount_kes DECIMAL(10, 2) NOT NULL,
  payment_method payment_method_enum NOT NULL,
  status payment_status_enum DEFAULT 'pending',
  
  -- Reference
  reference_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- ============================================================================
-- STEP 4: CREATE zcc_credits TABLE (Primary credit tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS zcc_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  
  -- Credit balance tracking
  total_credits INT DEFAULT 0,
  used_credits INT DEFAULT 0,
  balance INT GENERATED ALWAYS AS (total_credits - used_credits) STORED,
  
  -- Breakdown of how credits were obtained
  purchased_credits INT DEFAULT 0,
  free_credits INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (employer_id)
);

-- ============================================================================
-- STEP 5: CREATE employer_spending TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS employer_spending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  
  -- Period tracking
  period_month DATE NOT NULL,
  
  -- Spending breakdown
  posting_spent INT DEFAULT 0,
  unlocks_spent INT DEFAULT 0,
  boosts_spent INT DEFAULT 0,
  messaging_spent INT DEFAULT 0,
  total_spent INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (employer_id, period_month)
);

-- ============================================================================
-- STEP 6: CREATE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_employer_payments_employer ON employer_payments(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_payments_vendor ON employer_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_employer_payments_status ON employer_payments(status);
CREATE INDEX IF NOT EXISTS idx_zcc_credits_employer ON zcc_credits(employer_id);
CREATE INDEX IF NOT EXISTS idx_zcc_credits_vendor ON zcc_credits(vendor_id);
CREATE INDEX IF NOT EXISTS idx_employer_spending_employer ON employer_spending(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_spending_period ON employer_spending(employer_id, period_month);

-- ============================================================================
-- STEP 7: ENABLE RLS AND CREATE POLICIES for zcc_credits
-- ============================================================================
ALTER TABLE zcc_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employers_read_own_zcc_credits" ON zcc_credits;
CREATE POLICY "employers_read_own_zcc_credits" ON zcc_credits
  FOR SELECT USING (auth.uid() = employer_id);

DROP POLICY IF EXISTS "employers_update_own_zcc_credits" ON zcc_credits;
CREATE POLICY "employers_update_own_zcc_credits" ON zcc_credits
  FOR UPDATE USING (auth.uid() = employer_id);

DROP POLICY IF EXISTS "employers_insert_zcc_credits" ON zcc_credits;
CREATE POLICY "employers_insert_zcc_credits" ON zcc_credits
  FOR INSERT WITH CHECK (auth.uid() = employer_id);

-- ============================================================================
-- STEP 8: ENABLE RLS AND CREATE POLICIES for employer_payments
-- ============================================================================
ALTER TABLE employer_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employers_insert_own_payments" ON employer_payments;
CREATE POLICY "employers_insert_own_payments" ON employer_payments
  FOR INSERT WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "employers_read_own_payments" ON employer_payments;
CREATE POLICY "employers_read_own_payments" ON employer_payments
  FOR SELECT USING (auth.uid() = employer_id);

DROP POLICY IF EXISTS "service_update_payments" ON employer_payments;
CREATE POLICY "service_update_payments" ON employer_payments
  FOR UPDATE USING (auth.uid() = employer_id);

-- ============================================================================
-- STEP 9: ENABLE RLS for employer_spending
-- ============================================================================
ALTER TABLE employer_spending ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employers_read_own_spending" ON employer_spending;
CREATE POLICY "employers_read_own_spending" ON employer_spending
  FOR SELECT USING (auth.uid() = employer_id);

-- ============================================================================
-- STEP 10: INITIALIZE CREDITS FOR EXISTING VENDORS
-- ============================================================================

-- 10A: Create employer profiles for vendors with valid user_ids
INSERT INTO employer_profiles (
  id,
  company_name,
  company_email,
  vendor_id,
  is_vendor_employer,
  verification_level
)
SELECT 
  v.user_id,
  COALESCE(NULLIF(v.name, ''), 'Vendor ' || SUBSTRING(v.id::text, 1, 8)),
  COALESCE(v.email, ''),
  v.id,
  true,
  'verified'
FROM vendors v
INNER JOIN auth.users au ON au.id = v.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM employer_profiles ep WHERE ep.id = v.user_id
)
ON CONFLICT (id) DO NOTHING;

-- 10B: Create ZCC credits for vendor employers (2000 free credits each)
INSERT INTO zcc_credits (
  employer_id,
  vendor_id,
  total_credits,
  used_credits,
  free_credits,
  purchased_credits
)
SELECT 
  ep.id,
  ep.vendor_id,
  2000,
  0,
  2000,
  0
FROM employer_profiles ep
WHERE ep.is_vendor_employer = true
  AND NOT EXISTS (
    SELECT 1 FROM zcc_credits zc WHERE zc.employer_id = ep.id
  )
ON CONFLICT (employer_id) DO NOTHING;

-- ============================================================================
-- STEP 11: VERIFICATION QUERIES
-- ============================================================================

-- Check which vendors have invalid user_ids (for troubleshooting)
SELECT 
  v.id as vendor_id,
  v.name as vendor_name,
  v.user_id,
  CASE WHEN au.id IS NULL THEN 'INVALID USER_ID' ELSE 'Valid' END as user_id_status
FROM vendors v
LEFT JOIN auth.users au ON au.id = v.user_id
WHERE v.user_id IS NOT NULL
  AND au.id IS NULL
ORDER BY v.created_at DESC;

-- Check credit initialization results
SELECT 
  v.id as vendor_id,
  v.name as vendor_name,
  v.user_id,
  ep.id as employer_id,
  COALESCE(ep.is_vendor_employer, false) as is_vendor_employer,
  COALESCE(zc.balance, 0) as credit_balance,
  COALESCE(zc.free_credits, 0) as free_credits,
  COALESCE(zc.purchased_credits, 0) as purchased_credits,
  zc.created_at as credits_created_at
FROM vendors v
LEFT JOIN auth.users au ON au.id = v.user_id
LEFT JOIN employer_profiles ep ON ep.id = v.user_id
LEFT JOIN zcc_credits zc ON zc.employer_id = ep.id
WHERE au.id IS NOT NULL
ORDER BY v.created_at DESC
LIMIT 20;
