-- ============================================================================
-- Task 10: Quote Negotiation System - SAFE RE-RUN VERSION
-- Fixes: Uses DROP POLICY IF EXISTS before every CREATE POLICY
-- Fixes: Uses DROP TRIGGER IF EXISTS before every CREATE TRIGGER
-- Fixes: Uses CREATE TABLE IF NOT EXISTS throughout
-- Fixes: Uses gen_random_uuid() instead of uuid_generate_v4()
--
-- Run this in Supabase SQL Editor.
-- ============================================================================


-- ═══════════════════════════════════════════════════════════════
-- 1. negotiation_threads
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS negotiation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_quote_id UUID NOT NULL,
  user_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'accepted', 'rejected', 'cancelled', 'expired')),
  total_counter_offers INTEGER DEFAULT 0,
  current_price DECIMAL(12,2),
  original_price DECIMAL(12,2),
  final_price DECIMAL(12,2),
  final_scope TEXT,
  -- Phase 2 columns
  round_count INTEGER DEFAULT 0,
  max_rounds INTEGER DEFAULT 3,
  accepted_offer_id UUID,
  closed_at TIMESTAMP,
  rfq_id UUID,
  -- Phase 3 column
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add columns if table already exists (safe for re-runs)
ALTER TABLE negotiation_threads ADD COLUMN IF NOT EXISTS round_count INTEGER DEFAULT 0;
ALTER TABLE negotiation_threads ADD COLUMN IF NOT EXISTS max_rounds INTEGER DEFAULT 3;
ALTER TABLE negotiation_threads ADD COLUMN IF NOT EXISTS accepted_offer_id UUID;
ALTER TABLE negotiation_threads ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;
ALTER TABLE negotiation_threads ADD COLUMN IF NOT EXISTS rfq_id UUID;
ALTER TABLE negotiation_threads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update status constraint to include all valid statuses
ALTER TABLE negotiation_threads DROP CONSTRAINT IF EXISTS negotiation_threads_status_check;
ALTER TABLE negotiation_threads
  ADD CONSTRAINT negotiation_threads_status_check
  CHECK (status IN ('active', 'closed', 'accepted', 'rejected', 'cancelled', 'expired'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_negotiation_threads_rfq_quote_id ON negotiation_threads(rfq_quote_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_threads_user_id ON negotiation_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_threads_vendor_id ON negotiation_threads(vendor_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_threads_status ON negotiation_threads(status);

-- RLS
ALTER TABLE negotiation_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their negotiations" ON negotiation_threads;
CREATE POLICY "Users can view their negotiations" ON negotiation_threads
  FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = vendor_id
  );

DROP POLICY IF EXISTS "Users can create negotiations" ON negotiation_threads;
CREATE POLICY "Users can create negotiations" ON negotiation_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Participants can update negotiations" ON negotiation_threads;
CREATE POLICY "Participants can update negotiations" ON negotiation_threads
  FOR UPDATE USING (
    auth.uid() = user_id OR auth.uid() = vendor_id
  );

-- Service role full access (needed for API routes using service_role key)
DROP POLICY IF EXISTS "Service role full access to negotiations" ON negotiation_threads;
CREATE POLICY "Service role full access to negotiations" ON negotiation_threads
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- ═══════════════════════════════════════════════════════════════
-- 2. counter_offers
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS counter_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES negotiation_threads(id) ON DELETE CASCADE,
  rfq_quote_id UUID NOT NULL,
  proposed_by UUID NOT NULL,
  proposed_price DECIMAL(12,2) NOT NULL,
  scope_changes TEXT,
  delivery_date DATE,
  payment_terms TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'cancelled', 'expired')),
  response_by_date TIMESTAMP,
  rejected_reason TEXT,
  round_number INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add columns if table already exists
ALTER TABLE counter_offers ADD COLUMN IF NOT EXISTS round_number INTEGER DEFAULT 1;

-- Update status constraint
ALTER TABLE counter_offers DROP CONSTRAINT IF EXISTS counter_offers_status_check;
ALTER TABLE counter_offers
  ADD CONSTRAINT counter_offers_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'cancelled', 'expired'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_counter_offers_negotiation_id ON counter_offers(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_counter_offers_rfq_quote_id ON counter_offers(rfq_quote_id);
CREATE INDEX IF NOT EXISTS idx_counter_offers_proposed_by ON counter_offers(proposed_by);
CREATE INDEX IF NOT EXISTS idx_counter_offers_status ON counter_offers(status);

-- RLS
ALTER TABLE counter_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view counter offers in their negotiations" ON counter_offers;
CREATE POLICY "Users can view counter offers in their negotiations" ON counter_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM negotiation_threads
      WHERE negotiation_threads.id = counter_offers.negotiation_id
      AND (auth.uid() = negotiation_threads.user_id OR auth.uid() = negotiation_threads.vendor_id)
    )
  );

DROP POLICY IF EXISTS "Users can create counter offers" ON counter_offers;
CREATE POLICY "Users can create counter offers" ON counter_offers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM negotiation_threads
      WHERE negotiation_threads.id = counter_offers.negotiation_id
      AND (auth.uid() = negotiation_threads.user_id OR auth.uid() = negotiation_threads.vendor_id)
    )
  );

DROP POLICY IF EXISTS "Users can update their counter offers" ON counter_offers;
CREATE POLICY "Users can update their counter offers" ON counter_offers
  FOR UPDATE USING (
    auth.uid() = proposed_by OR
    EXISTS (
      SELECT 1 FROM negotiation_threads
      WHERE negotiation_threads.id = counter_offers.negotiation_id
      AND auth.uid() = negotiation_threads.vendor_id AND counter_offers.status = 'pending'
    )
  );

DROP POLICY IF EXISTS "Service role full access to counter offers" ON counter_offers;
CREATE POLICY "Service role full access to counter offers" ON counter_offers
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- ═══════════════════════════════════════════════════════════════
-- 3. negotiation_qa
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS negotiation_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES negotiation_threads(id) ON DELETE CASCADE,
  rfq_quote_id UUID NOT NULL,
  asked_by UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMP,
  answered_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_negotiation_qa_negotiation_id ON negotiation_qa(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_qa_rfq_quote_id ON negotiation_qa(rfq_quote_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_qa_asked_by ON negotiation_qa(asked_by);
CREATE INDEX IF NOT EXISTS idx_negotiation_qa_answered ON negotiation_qa(answered_at);

-- RLS
ALTER TABLE negotiation_qa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view Q&A in their negotiations" ON negotiation_qa;
CREATE POLICY "Users can view Q&A in their negotiations" ON negotiation_qa
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM negotiation_threads
      WHERE negotiation_threads.id = negotiation_qa.negotiation_id
      AND (auth.uid() = negotiation_threads.user_id OR auth.uid() = negotiation_threads.vendor_id)
    )
  );

DROP POLICY IF EXISTS "Users can create questions" ON negotiation_qa;
CREATE POLICY "Users can create questions" ON negotiation_qa
  FOR INSERT WITH CHECK (
    auth.uid() = asked_by AND
    EXISTS (
      SELECT 1 FROM negotiation_threads
      WHERE negotiation_threads.id = negotiation_qa.negotiation_id
      AND (auth.uid() = negotiation_threads.user_id OR auth.uid() = negotiation_threads.vendor_id)
    )
  );

DROP POLICY IF EXISTS "Users can answer questions" ON negotiation_qa;
CREATE POLICY "Users can answer questions" ON negotiation_qa
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM negotiation_threads
      WHERE negotiation_threads.id = negotiation_qa.negotiation_id
      AND (
        (negotiation_threads.vendor_id = auth.uid() AND negotiation_qa.asked_by = negotiation_threads.user_id) OR
        (negotiation_threads.user_id = auth.uid() AND negotiation_qa.asked_by = negotiation_threads.vendor_id)
      )
    )
  );

DROP POLICY IF EXISTS "Service role full access to negotiation qa" ON negotiation_qa;
CREATE POLICY "Service role full access to negotiation qa" ON negotiation_qa
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- ═══════════════════════════════════════════════════════════════
-- 4. quote_revisions
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS quote_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_quote_id UUID NOT NULL,
  revision_number INTEGER DEFAULT 1,
  price DECIMAL(12,2),
  scope_summary TEXT,
  delivery_date DATE,
  payment_terms TEXT,
  changed_by UUID NOT NULL,
  change_reason TEXT NOT NULL,
  revision_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quote_revisions_rfq_quote_id ON quote_revisions(rfq_quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_revisions_changed_by ON quote_revisions(changed_by);
CREATE INDEX IF NOT EXISTS idx_quote_revisions_created_at ON quote_revisions(created_at);

-- RLS
ALTER TABLE quote_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view quote revisions" ON quote_revisions;
CREATE POLICY "Users can view quote revisions" ON quote_revisions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role full access to quote revisions" ON quote_revisions;
CREATE POLICY "Service role full access to quote revisions" ON quote_revisions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- ═══════════════════════════════════════════════════════════════
-- 5. job_orders (Phase 2)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS job_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES negotiation_threads(id) ON DELETE CASCADE,
  rfq_id UUID,
  rfq_quote_id UUID,
  buyer_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  agreed_price NUMERIC(15, 2) NOT NULL,
  payment_terms TEXT,
  delivery_date DATE,
  scope_summary TEXT,
  status TEXT DEFAULT 'created' CHECK (status IN (
    'created', 'confirmed', 'in_progress', 'completed', 'disputed', 'cancelled'
  )),
  confirmed_by_buyer BOOLEAN DEFAULT FALSE,
  confirmed_by_vendor BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_orders_negotiation_id ON job_orders(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_job_orders_rfq_id ON job_orders(rfq_id);
CREATE INDEX IF NOT EXISTS idx_job_orders_buyer_id ON job_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_job_orders_vendor_id ON job_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_job_orders_status ON job_orders(status);

-- RLS
ALTER TABLE job_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their job orders" ON job_orders;
CREATE POLICY "Users can view their job orders" ON job_orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Service role can manage job orders" ON job_orders;
CREATE POLICY "Service role can manage job orders" ON job_orders
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Participants can update job orders" ON job_orders;
CREATE POLICY "Participants can update job orders" ON job_orders
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = vendor_id);


-- ═══════════════════════════════════════════════════════════════
-- 6. Triggers (auto-update timestamps)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_negotiation_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE negotiation_threads
  SET updated_at = NOW()
  WHERE id = NEW.negotiation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS counter_offers_update_negotiation_timestamp ON counter_offers;
CREATE TRIGGER counter_offers_update_negotiation_timestamp
  AFTER INSERT OR UPDATE ON counter_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_negotiation_threads_updated_at();

DROP TRIGGER IF EXISTS negotiation_qa_update_negotiation_timestamp ON negotiation_qa;
CREATE TRIGGER negotiation_qa_update_negotiation_timestamp
  AFTER INSERT OR UPDATE ON negotiation_qa
  FOR EACH ROW
  EXECUTE FUNCTION update_negotiation_threads_updated_at();


-- ═══════════════════════════════════════════════════════════════
-- DONE. This migration is idempotent — safe to run multiple times.
-- It covers Phase 1 (tables), Phase 2 (columns + job_orders), 
-- and Phase 3 (metadata column on negotiation_threads).
-- ═══════════════════════════════════════════════════════════════
