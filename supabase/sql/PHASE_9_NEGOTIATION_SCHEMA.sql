-- ============================================================================
-- PHASE 9: NEGOTIATION & QUOTE RESPONSE SYSTEM
-- Database Schema: RFQ Quotes & Messaging
-- ============================================================================

-- ============================================================================
-- TABLE 1: rfq_quotes
-- Stores structured quote data from vendors responding to RFQs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rfq_quotes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Quote Basics
  amount_total numeric(15, 2) NOT NULL, -- Total quote amount in KES
  quote_type text NOT NULL, -- labour_only, materials_only, labour_materials, consultation_only
  pricing_mode text NOT NULL, -- firm, estimate, range
  amount_min numeric(15, 2), -- Only for range mode
  amount_max numeric(15, 2), -- Only for range mode
  currency text DEFAULT 'KES' NOT NULL,
  
  -- Price Confidence
  price_confidence text NOT NULL, -- firm, estimate, range
  valid_until timestamp NOT NULL, -- 7, 14, or 30 days from submission
  
  -- Site Visit
  site_visit_required boolean DEFAULT false NOT NULL,
  site_visit_pricing_type text, -- free, charged_deductible, charged_nonrefundable
  site_visit_fee numeric(15, 2), -- Only if charged
  site_visit_date_earliest date,
  site_visit_date_latest date,
  site_visit_covers jsonb, -- ['measurements', 'condition_assessment', etc]
  estimation_basis text, -- based_on_rfq_only, based_on_drawings, similar_previous_project
  
  -- Timeline & Availability
  earliest_start_date date NOT NULL,
  duration_value integer NOT NULL, -- e.g., 5
  duration_unit text NOT NULL, -- days, weeks
  team_availability text NOT NULL, -- available_now, available_soon, scheduled
  team_availability_date date, -- Only if scheduled
  working_hours_preference text NOT NULL, -- weekdays, weekends, flexible
  
  -- Materials & Standards
  materials_supplied_by text NOT NULL, -- vendor_supplies, buyer_supplies, either
  preferred_brands_specs text, -- Free text for now
  compliance_standards jsonb, -- ['kebs_compliant', 'epra_compliant', 'nca_compliant', 'warranty_backed']
  
  -- Payment & Terms
  payment_model text NOT NULL, -- deposit_balance, milestone_payments, pay_on_delivery, pay_on_completion
  deposit_percent integer DEFAULT 0, -- 0, 20, 30, 50
  payment_terms_text text, -- Structured payment info
  payment_milestones jsonb, -- [{'name': 'Design', 'amount': 50000, 'percentage': null}, ...]
  payment_inclusions jsonb, -- ['labour', 'materials', 'transport', 'installation', 'cleanup']
  payment_exclusions text, -- Free text describing what's NOT included
  
  -- Warranty & Aftercare
  warranty_offered boolean DEFAULT false NOT NULL,
  warranty_duration text, -- 1_month, 3_months, 6_months, 12_months, 24_months
  warranty_covers jsonb, -- Warranty coverage details
  
  -- Cost Breakdown
  cost_breakdown_type text NOT NULL DEFAULT 'simple', -- simple or line_items
  cost_breakdown_json jsonb, -- {'labour': 50000, 'materials': 30000, 'transport': 5000, 'other': 0, 'notes': '...'}
  line_items_json jsonb, -- [{'name': 'Roofing', 'unit': 'sqm', 'qty': 100, 'unit_price': 500, 'total': 50000}, ...]
  
  -- Attachments & Portfolio
  attachments_json jsonb, -- [{'type': 'quotation_pdf', 'url': '...', 'uploaded_at': '...'}, ...]
  
  -- Status & Metadata
  status text DEFAULT 'draft' NOT NULL, -- draft, submitted, revised, withdrawn, accepted, rejected
  submitted_at timestamp,
  revised_at timestamp,
  withdrawn_at timestamp,
  
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  
  -- Constraints
  CHECK (pricing_mode IN ('firm', 'estimate', 'range')),
  CHECK (price_confidence IN ('firm', 'estimate', 'range')),
  CHECK (quote_type IN ('labour_only', 'materials_only', 'labour_materials', 'consultation_only')),
  CHECK (site_visit_pricing_type IN ('free', 'charged_deductible', 'charged_nonrefundable') OR site_visit_pricing_type IS NULL),
  CHECK (estimation_basis IN ('based_on_rfq_only', 'based_on_drawings', 'similar_previous_project') OR estimation_basis IS NULL),
  CHECK (duration_unit IN ('days', 'weeks')),
  CHECK (team_availability IN ('available_now', 'available_soon', 'scheduled')),
  CHECK (working_hours_preference IN ('weekdays', 'weekends', 'flexible')),
  CHECK (materials_supplied_by IN ('vendor_supplies', 'buyer_supplies', 'either')),
  CHECK (payment_model IN ('deposit_balance', 'milestone_payments', 'pay_on_delivery', 'pay_on_completion')),
  CHECK (deposit_percent IN (0, 20, 30, 50)),
  CHECK (warranty_duration IN ('1_month', '3_months', '6_months', '12_months', '24_months') OR warranty_duration IS NULL),
  CHECK (cost_breakdown_type IN ('simple', 'line_items')),
  CHECK (status IN ('draft', 'submitted', 'revised', 'withdrawn', 'accepted', 'rejected'))
);

-- Indexes for performance
CREATE INDEX idx_rfq_quotes_rfq_id ON public.rfq_quotes(rfq_id);
CREATE INDEX idx_rfq_quotes_vendor_id ON public.rfq_quotes(vendor_id);
CREATE INDEX idx_rfq_quotes_status ON public.rfq_quotes(status);
CREATE INDEX idx_rfq_quotes_submitted_at ON public.rfq_quotes(submitted_at);

-- ============================================================================
-- TABLE 2: rfq_messages
-- Q&A thread between vendor and buyer for specific RFQ
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rfq_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.rfq_quotes(id) ON DELETE CASCADE, -- Links to specific quote if relevant
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type text NOT NULL, -- buyer, vendor
  
  message_text text NOT NULL,
  
  -- Attachments in message
  attachments_json jsonb, -- [{'type': 'image', 'url': '...', 'name': '...', 'size': 1024}, ...]
  
  -- Message status
  is_question boolean DEFAULT false NOT NULL, -- True if vendor asking buyer a question
  question_context text, -- e.g., 'drawings', 'access', 'brands', 'timeline'
  answered_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  answered_at timestamp,
  answer_text text,
  
  -- Thread context
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  
  CHECK (sender_type IN ('buyer', 'vendor'))
);

-- Indexes
CREATE INDEX idx_rfq_messages_rfq_id ON public.rfq_messages(rfq_id);
CREATE INDEX idx_rfq_messages_quote_id ON public.rfq_messages(quote_id);
CREATE INDEX idx_rfq_messages_sender_id ON public.rfq_messages(sender_id);
CREATE INDEX idx_rfq_messages_created_at ON public.rfq_messages(created_at);

-- ============================================================================
-- RLS POLICIES FOR rfq_quotes
-- ============================================================================

ALTER TABLE public.rfq_quotes ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE public.rfq_messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert messages for RFQs they're involved with
CREATE POLICY "rfq_messages_insert" ON public.rfq_messages
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND sender_id = auth.uid()
    AND (
      -- Vendor sending message to RFQ they quoted
      EXISTS (
        SELECT 1 FROM public.rfq_quotes
        WHERE rfq_id = rfq_messages.rfq_id
        AND vendor_id = (SELECT id FROM public.vendors WHERE user_id = auth.uid())
      )
      OR
      -- Buyer sending message to their own RFQ
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
      -- Vendor involved in quote for this RFQ
      rfq_id IN (
        SELECT rfq_id FROM public.rfq_quotes
        WHERE vendor_id = (SELECT id FROM public.vendors WHERE user_id = auth.uid())
      )
      OR
      -- Buyer of this RFQ
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
-- VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate quote before submission
CREATE OR REPLACE FUNCTION validate_quote_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Check required fields
  IF NEW.amount_total IS NULL OR NEW.amount_total <= 0 THEN
    RAISE EXCEPTION 'Quote amount must be greater than 0';
  END IF;
  
  IF NEW.earliest_start_date IS NULL THEN
    RAISE EXCEPTION 'Earliest start date is required';
  END IF;
  
  IF NEW.payment_model IS NULL THEN
    RAISE EXCEPTION 'Payment model is required';
  END IF;
  
  -- If pricing_mode is range, ensure min/max are set
  IF NEW.pricing_mode = 'range' THEN
    IF NEW.amount_min IS NULL OR NEW.amount_max IS NULL THEN
      RAISE EXCEPTION 'Range mode requires both min and max amounts';
    END IF;
    IF NEW.amount_min >= NEW.amount_max THEN
      RAISE EXCEPTION 'Min amount must be less than max amount';
    END IF;
  END IF;
  
  -- If site visit is required and charged, fee must be > 0
  IF NEW.site_visit_required AND NEW.site_visit_pricing_type IN ('charged_deductible', 'charged_nonrefundable') THEN
    IF NEW.site_visit_fee IS NULL OR NEW.site_visit_fee <= 0 THEN
      RAISE EXCEPTION 'Site visit fee is required and must be greater than 0 when charging';
    END IF;
  END IF;
  
  -- Set timestamps appropriately
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

-- Trigger validation on insert/update
CREATE TRIGGER trigger_validate_quote_submission
BEFORE INSERT OR UPDATE ON public.rfq_quotes
FOR EACH ROW
EXECUTE FUNCTION validate_quote_submission();

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

/*
PHASE 9: NEGOTIATION & QUOTE RESPONSE SYSTEM

New Tables:
1. rfq_quotes - Stores structured vendor quotes with all negotiation details
2. rfq_messages - Q&A thread between vendor and buyer

Key Features:
- Structured quote data instead of free-form messages
- Site visit negotiation (yes/no, pricing, dates, coverage)
- Cost breakdown (simple or detailed line items)
- Payment terms with milestone support
- Warranty information
- Draft/Submit workflow with auto-save
- Q&A messaging tied to RFQs and quotes

RLS Security:
- Vendors can only see/edit their own quotes
- Buyers can view all quotes for their RFQs
- Messages visible only to involved parties (buyer + vendors quoted on RFQ)
- Service role bypasses all RLS

Next Steps:
1. Create /app/api/rfq/[rfq_id]/quote/submit endpoint
2. Build VendorRFQResponseForm with 9 accordion sections
3. Build buyer quote review page with comparison
4. Build messaging/Q&A interface
*/
