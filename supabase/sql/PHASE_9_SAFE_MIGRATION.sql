-- ============================================================================
-- PHASE 9: NEGOTIATION SCHEMA - SAFE MIGRATION
-- Handles existing tables/indexes gracefully
-- ============================================================================

-- Drop existing indexes if they exist (to recreate cleanly)
DROP INDEX IF EXISTS idx_rfq_quotes_rfq_id;
DROP INDEX IF EXISTS idx_rfq_quotes_vendor_id;
DROP INDEX IF EXISTS idx_rfq_quotes_status;
DROP INDEX IF EXISTS idx_rfq_quotes_submitted_at;
DROP INDEX IF EXISTS idx_rfq_messages_rfq_id;
DROP INDEX IF EXISTS idx_rfq_messages_quote_id;
DROP INDEX IF EXISTS idx_rfq_messages_sender_id;
DROP INDEX IF EXISTS idx_rfq_messages_created_at;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_validate_quote_submission ON public.rfq_quotes;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS validate_quote_submission();

-- ============================================================================
-- TABLE 1: rfq_quotes (CREATE IF NOT EXISTS handles existing table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rfq_quotes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Quote Basics
  amount_total numeric(15, 2) NOT NULL,
  quote_type text NOT NULL,
  pricing_mode text NOT NULL,
  amount_min numeric(15, 2),
  amount_max numeric(15, 2),
  currency text DEFAULT 'KES' NOT NULL,
  
  -- Price Confidence
  price_confidence text NOT NULL,
  valid_until timestamp NOT NULL,
  
  -- Site Visit
  site_visit_required boolean DEFAULT false NOT NULL,
  site_visit_pricing_type text,
  site_visit_fee numeric(15, 2),
  site_visit_date_earliest date,
  site_visit_date_latest date,
  site_visit_covers jsonb,
  estimation_basis text,
  
  -- Timeline & Availability
  earliest_start_date date NOT NULL,
  duration_value integer NOT NULL,
  duration_unit text NOT NULL,
  team_availability text NOT NULL,
  team_availability_date date,
  working_hours_preference text NOT NULL,
  
  -- Materials & Standards
  materials_supplied_by text NOT NULL,
  preferred_brands_specs text,
  compliance_standards jsonb,
  
  -- Payment & Terms
  payment_model text NOT NULL,
  deposit_percent integer DEFAULT 0,
  payment_terms_text text,
  payment_milestones jsonb,
  payment_inclusions jsonb,
  payment_exclusions text,
  
  -- Warranty & Aftercare
  warranty_offered boolean DEFAULT false NOT NULL,
  warranty_duration text,
  warranty_covers jsonb,
  
  -- Cost Breakdown
  cost_breakdown_type text NOT NULL DEFAULT 'simple',
  cost_breakdown_json jsonb,
  line_items_json jsonb,
  
  -- Attachments & Portfolio
  attachments_json jsonb,
  
  -- Status & Metadata
  status text DEFAULT 'draft' NOT NULL,
  submitted_at timestamp,
  revised_at timestamp,
  withdrawn_at timestamp,
  
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- TABLE 2: rfq_messages
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rfq_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.rfq_quotes(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type text NOT NULL,
  
  message_text text NOT NULL,
  attachments_json jsonb,
  
  is_question boolean DEFAULT false NOT NULL,
  question_context text,
  answered_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  answered_at timestamp,
  answer_text text,
  
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- RECREATE INDEXES
-- ============================================================================

CREATE INDEX idx_rfq_quotes_rfq_id ON public.rfq_quotes(rfq_id);
CREATE INDEX idx_rfq_quotes_vendor_id ON public.rfq_quotes(vendor_id);
CREATE INDEX idx_rfq_quotes_status ON public.rfq_quotes(status);
CREATE INDEX idx_rfq_quotes_submitted_at ON public.rfq_quotes(submitted_at);

CREATE INDEX idx_rfq_messages_rfq_id ON public.rfq_messages(rfq_id);
CREATE INDEX idx_rfq_messages_quote_id ON public.rfq_messages(quote_id);
CREATE INDEX idx_rfq_messages_sender_id ON public.rfq_messages(sender_id);
CREATE INDEX idx_rfq_messages_created_at ON public.rfq_messages(created_at);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.rfq_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES (to recreate cleanly)
-- ============================================================================

DROP POLICY IF EXISTS "rfq_quotes_vendor_insert" ON public.rfq_quotes;
DROP POLICY IF EXISTS "rfq_quotes_vendor_select" ON public.rfq_quotes;
DROP POLICY IF EXISTS "rfq_quotes_vendor_update" ON public.rfq_quotes;
DROP POLICY IF EXISTS "rfq_quotes_buyer_select" ON public.rfq_quotes;
DROP POLICY IF EXISTS "rfq_quotes_buyer_update" ON public.rfq_quotes;
DROP POLICY IF EXISTS "rfq_quotes_service_role_all" ON public.rfq_quotes;

DROP POLICY IF EXISTS "rfq_messages_insert" ON public.rfq_messages;
DROP POLICY IF EXISTS "rfq_messages_select" ON public.rfq_messages;
DROP POLICY IF EXISTS "rfq_messages_service_role_all" ON public.rfq_messages;

-- ============================================================================
-- RLS POLICIES FOR rfq_quotes
-- ============================================================================

-- Vendors can insert their own quotes
CREATE POLICY "rfq_quotes_vendor_insert" ON public.rfq_quotes
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND vendor_id = (
      SELECT id FROM public.vendors 
      WHERE user_id = auth.uid() 
      LIMIT 1
    )
  );

-- Vendors can view their own quotes
CREATE POLICY "rfq_quotes_vendor_select" ON public.rfq_quotes
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND vendor_id = (
      SELECT id FROM public.vendors 
      WHERE user_id = auth.uid() 
      LIMIT 1
    )
  );

-- Vendors can update their own draft quotes
CREATE POLICY "rfq_quotes_vendor_update" ON public.rfq_quotes
  FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND vendor_id = (
      SELECT id FROM public.vendors 
      WHERE user_id = auth.uid() 
      LIMIT 1
    )
    AND status = 'draft'
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND vendor_id = (
      SELECT id FROM public.vendors 
      WHERE user_id = auth.uid() 
      LIMIT 1
    )
  );

-- RFQ buyers can view all quotes for their RFQs
CREATE POLICY "rfq_quotes_buyer_select" ON public.rfq_quotes
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND rfq_id IN (
      SELECT id FROM public.rfqs 
      WHERE user_id = auth.uid()
    )
  );

-- RFQ buyers can update quote status (accept/reject)
CREATE POLICY "rfq_quotes_buyer_update" ON public.rfq_quotes
  FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND rfq_id IN (
      SELECT id FROM public.rfqs 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND rfq_id IN (
      SELECT id FROM public.rfqs 
      WHERE user_id = auth.uid()
    )
  );

-- Service role can do anything
CREATE POLICY "rfq_quotes_service_role_all" ON public.rfq_quotes
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- RLS POLICIES FOR rfq_messages
-- ============================================================================

-- Authenticated users can insert messages for RFQs they're involved with
CREATE POLICY "rfq_messages_insert" ON public.rfq_messages
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.rfq_quotes
        WHERE rfq_id = rfq_messages.rfq_id
        AND vendor_id = (SELECT id FROM public.vendors WHERE user_id = auth.uid())
      )
      OR
      EXISTS (
        SELECT 1 FROM public.rfqs
        WHERE id = rfq_messages.rfq_id
        AND user_id = auth.uid()
      )
    )
  );

-- Users can view messages for RFQs they're involved with
CREATE POLICY "rfq_messages_select" ON public.rfq_messages
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      rfq_id IN (
        SELECT rfq_id FROM public.rfq_quotes
        WHERE vendor_id = (SELECT id FROM public.vendors WHERE user_id = auth.uid())
      )
      OR
      rfq_id IN (
        SELECT id FROM public.rfqs
        WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can do anything
CREATE POLICY "rfq_messages_service_role_all" ON public.rfq_messages
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- VALIDATION FUNCTION & TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_quote_submission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount_total IS NULL OR NEW.amount_total <= 0 THEN
    RAISE EXCEPTION 'Quote amount must be greater than 0';
  END IF;
  
  IF NEW.earliest_start_date IS NULL THEN
    RAISE EXCEPTION 'Earliest start date is required';
  END IF;
  
  IF NEW.payment_model IS NULL THEN
    RAISE EXCEPTION 'Payment model is required';
  END IF;
  
  IF NEW.pricing_mode = 'range' THEN
    IF NEW.amount_min IS NULL OR NEW.amount_max IS NULL THEN
      RAISE EXCEPTION 'Range mode requires both min and max amounts';
    END IF;
    IF NEW.amount_min >= NEW.amount_max THEN
      RAISE EXCEPTION 'Min amount must be less than max amount';
    END IF;
  END IF;
  
  IF NEW.site_visit_required AND NEW.site_visit_pricing_type IN ('charged_deductible', 'charged_nonrefundable') THEN
    IF NEW.site_visit_fee IS NULL OR NEW.site_visit_fee <= 0 THEN
      RAISE EXCEPTION 'Site visit fee is required when charging';
    END IF;
  END IF;
  
  IF NEW.status = 'submitted' AND NEW.submitted_at IS NULL THEN
    NEW.submitted_at = now();
  END IF;
  
  IF NEW.status = 'revised' AND NEW.revised_at IS NULL THEN
    NEW.revised_at = now();
  END IF;
  
  IF NEW.status = 'withdrawn' AND NEW.withdrawn_at IS NULL THEN
    NEW.withdrawn_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_quote_submission
BEFORE INSERT OR UPDATE ON public.rfq_quotes
FOR EACH ROW
EXECUTE FUNCTION validate_quote_submission();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Phase 9 Schema deployed successfully!' as status;

SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('rfq_quotes', 'rfq_messages');
