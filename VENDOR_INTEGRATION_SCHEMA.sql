-- Zintra Career Centre - Vendor Integration Schema
-- Execute these migrations in Supabase SQL Editor

-- 1. CREATE ENUMS for payment and status
CREATE TYPE payment_method_enum AS ENUM ('mpesa', 'card', 'pesapal');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE job_post_status_enum AS ENUM ('draft', 'active', 'paused', 'closed', 'filled');

-- 2. ALTER employer_profiles to link to vendors
ALTER TABLE employer_profiles ADD COLUMN vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE employer_profiles ADD COLUMN is_vendor_employer BOOLEAN DEFAULT FALSE;

-- 3. EMPLOYER PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS employer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  
  -- Payment details
  amount_kes DECIMAL(10, 2) NOT NULL,
  payment_method payment_method_enum NOT NULL,
  status payment_status_enum DEFAULT 'pending',
  
  -- Reference
  reference_id TEXT, -- M-Pesa receipt, Stripe transaction, Pesapal reference
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 4. EMPLOYER SPENDING TRACKER
CREATE TABLE IF NOT EXISTS employer_spending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  
  -- Period tracking
  period_month DATE NOT NULL, -- First day of month
  
  -- Spending breakdown
  posting_spent DECIMAL(10, 2) DEFAULT 0, -- Job postings
  unlocks_spent DECIMAL(10, 2) DEFAULT 0, -- Contact unlocks
  boosts_spent DECIMAL(10, 2) DEFAULT 0, -- Featured/Urgent/Extra Reach
  messaging_spent DECIMAL(10, 2) DEFAULT 0, -- Outreach messages (future)
  total_spent DECIMAL(10, 2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (employer_id, period_month)
);

-- 5. EMPLOYER ANALYTICS VIEW (for dashboard stats)
CREATE OR REPLACE VIEW employer_dashboard_stats AS
SELECT
  ep.id as employer_id,
  ep.company_name,
  ep.verification_level,
  
  -- Credits balance (from credits_ledger)
  COALESCE(SUM(CASE WHEN cl.credit_type IN ('purchase', 'bonus', 'plan_allocation') THEN cl.amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN cl.credit_type IN ('contact_unlock', 'boost', 'outreach_message') THEN ABS(cl.amount) ELSE 0 END), 0) as credits_balance,
  
  -- Current month spending
  COALESCE(es.total_spent, 0) as month_spending,
  COALESCE(es.posting_spent, 0) as posting_spent,
  COALESCE(es.unlocks_spent, 0) as unlocks_spent,
  COALESCE(es.boosts_spent, 0) as boosts_spent,
  
  -- Job stats
  (SELECT COUNT(*) FROM listings WHERE employer_id = ep.id AND status = 'active') as active_jobs,
  (SELECT COUNT(*) FROM listings WHERE employer_id = ep.id) as total_jobs_posted,
  (SELECT COUNT(*) FROM applications WHERE listing_id IN (SELECT id FROM listings WHERE employer_id = ep.id) AND status IN ('applied', 'shortlisted')) as pending_applications,
  (SELECT COUNT(*) FROM contact_unlocks WHERE employer_id = ep.id) as candidates_unlocked,
  
  -- Hiring stats
  (SELECT COUNT(*) FROM applications WHERE listing_id IN (SELECT id FROM listings WHERE employer_id = ep.id) AND status = 'hired') as total_hired,
  COALESCE((SELECT AVG(score) FROM ratings WHERE to_user_id IN (SELECT candidate_id FROM applications WHERE listing_id IN (SELECT id FROM listings WHERE employer_id = ep.id) AND status = 'hired')), 0) as avg_hire_rating,
  
  -- Plan info
  s.plan as current_plan,
  s.status as plan_status
  
FROM employer_profiles ep
LEFT JOIN subscriptions s ON ep.id = s.employer_id
LEFT JOIN credits_ledger cl ON ep.id = cl.employer_id
LEFT JOIN employer_spending es ON ep.id = es.employer_id AND es.period_month = DATE_TRUNC('month', NOW())::DATE
GROUP BY ep.id, ep.company_name, ep.verification_level, es.total_spent, es.posting_spent, es.unlocks_spent, es.boosts_spent, s.plan, s.status;

-- 6. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_employer_payments_employer ON employer_payments(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_payments_vendor ON employer_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_employer_payments_status ON employer_payments(status);
CREATE INDEX IF NOT EXISTS idx_employer_spending_employer ON employer_spending(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_spending_period ON employer_spending(employer_id, period_month);

-- 7. RLS POLICIES for employer payments
ALTER TABLE employer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_spending ENABLE ROW LEVEL SECURITY;

-- Policy: Employers can only see their own payment history
CREATE POLICY "employers_read_own_payments" ON employer_payments
  FOR SELECT USING (auth.uid() = employer_id);

-- Policy: Only admins can insert payments (via payment webhook)
CREATE POLICY "admins_insert_payments" ON employer_payments
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service');

-- Policy: Employers can see their spending
CREATE POLICY "employers_read_own_spending" ON employer_spending
  FOR SELECT USING (auth.uid() = employer_id);

-- Policy: System can update spending
CREATE POLICY "system_update_spending" ON employer_spending
  FOR UPDATE USING (auth.jwt()->>'role' = 'service');
