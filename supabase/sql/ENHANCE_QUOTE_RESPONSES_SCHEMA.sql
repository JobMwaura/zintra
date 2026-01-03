-- ============================================================================
-- ENHANCE rfq_responses TABLE: Add fields for comprehensive quote form
-- Phase 1: Sections 1-3 (Quote Overview, Pricing & Breakdown, Inclusions)
-- ============================================================================
-- CRITICAL: Run this FIRST in Supabase SQL Editor before frontend changes
-- Safe: Uses IF NOT EXISTS, can be run multiple times
-- ============================================================================

-- ============================================================================
-- SECTION 1: Quote Overview Fields
-- ============================================================================

ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS quote_title TEXT;
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS intro_text TEXT;
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 7;
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS validity_custom_date DATE;
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS earliest_start_date DATE;

-- ============================================================================
-- SECTION 2: Pricing & Breakdown Fields
-- ============================================================================

ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS pricing_model VARCHAR(20) DEFAULT 'fixed';
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS price_min DECIMAL(10, 2);
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS price_max DECIMAL(10, 2);
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS unit_type VARCHAR(50);
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2);
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS estimated_units INTEGER;
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS vat_included BOOLEAN DEFAULT false;
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]';
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS transport_cost DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS labour_cost DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS other_charges DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS total_price_calculated DECIMAL(10, 2);

-- ============================================================================
-- SECTION 3: Inclusions / Exclusions Fields
-- ============================================================================

ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS inclusions TEXT;
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS exclusions TEXT;
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS client_responsibilities TEXT;

-- ============================================================================
-- METADATA: Status tracking and timestamps
-- ============================================================================

ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS quote_status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- CREATE INDEXES for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_rfq_responses_status 
  ON public.rfq_responses(rfq_id, quote_status);

CREATE INDEX IF NOT EXISTS idx_rfq_responses_pricing_model 
  ON public.rfq_responses(pricing_model);

CREATE INDEX IF NOT EXISTS idx_rfq_responses_submitted 
  ON public.rfq_responses(submitted_at DESC);

-- ============================================================================
-- COMPLETION: All Phase 1 columns added successfully
-- ============================================================================
-- Next: Frontend components can now handle these fields
-- Verify by checking column list: SELECT * FROM information_schema.columns 
--        WHERE table_name = 'rfq_responses' AND column_name LIKE '%quote_%' OR column_name LIKE '%pricing_%'
