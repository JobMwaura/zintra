-- ============================================================================
-- PHASE 2: Add missing negotiation columns
-- The Phase 1 API code references columns that may not exist yet.
-- Run this migration in Supabase SQL Editor.
-- ============================================================================

-- 1. negotiation_threads: add round_count, max_rounds, accepted_offer_id, closed_at, rfq_id
ALTER TABLE negotiation_threads
  ADD COLUMN IF NOT EXISTS round_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_rounds INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS accepted_offer_id UUID REFERENCES counter_offers(id),
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rfq_id UUID;

-- 2. counter_offers: add round_number (if missing)
ALTER TABLE counter_offers
  ADD COLUMN IF NOT EXISTS round_number INTEGER DEFAULT 1;

-- 3. Update negotiation_threads status check to include 'cancelled' and 'expired'
-- Drop old constraint and add new one
ALTER TABLE negotiation_threads DROP CONSTRAINT IF EXISTS negotiation_threads_status_check;
ALTER TABLE negotiation_threads
  ADD CONSTRAINT negotiation_threads_status_check
  CHECK (status IN ('active', 'closed', 'accepted', 'rejected', 'cancelled', 'expired'));

-- 4. Update counter_offers status check to include 'cancelled' and 'expired'
ALTER TABLE counter_offers DROP CONSTRAINT IF EXISTS counter_offers_status_check;
ALTER TABLE counter_offers
  ADD CONSTRAINT counter_offers_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'cancelled', 'expired'));

-- 5. Create job_orders table for post-acceptance workflow
CREATE TABLE IF NOT EXISTS job_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES negotiation_threads(id) ON DELETE CASCADE,
  rfq_id UUID,
  rfq_quote_id UUID,
  buyer_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  
  -- Deal details (snapshot at acceptance time)
  agreed_price NUMERIC(15, 2) NOT NULL,
  payment_terms TEXT,
  delivery_date DATE,
  scope_summary TEXT,
  
  -- Job order status
  status TEXT DEFAULT 'created' CHECK (status IN (
    'created',        -- Just generated from accepted negotiation
    'confirmed',      -- Both parties confirmed
    'in_progress',    -- Work has started
    'completed',      -- Work finished
    'disputed',       -- Issue raised
    'cancelled'       -- Cancelled
  )),
  
  -- Tracking
  confirmed_by_buyer BOOLEAN DEFAULT FALSE,
  confirmed_by_vendor BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for job_orders
CREATE INDEX IF NOT EXISTS idx_job_orders_negotiation_id ON job_orders(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_job_orders_rfq_id ON job_orders(rfq_id);
CREATE INDEX IF NOT EXISTS idx_job_orders_buyer_id ON job_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_job_orders_vendor_id ON job_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_job_orders_status ON job_orders(status);

-- RLS for job_orders
ALTER TABLE job_orders ENABLE ROW LEVEL SECURITY;

-- Participants can view their job orders
CREATE POLICY "Users can view their job orders" ON job_orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = vendor_id);

-- Only system (service role) creates job orders from accepted negotiations
CREATE POLICY "Service role can manage job orders" ON job_orders
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Participants can update their job orders (for confirmations)
CREATE POLICY "Participants can update job orders" ON job_orders
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = vendor_id);

-- ============================================================================
-- DONE. After running this, the Phase 1 + Phase 2 APIs will work correctly.
-- ============================================================================
