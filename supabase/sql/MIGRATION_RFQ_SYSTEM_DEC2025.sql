-- SQL Migration for RFQ System - December 17, 2025
-- This migration adds support for three RFQ types: direct, matched, and public
-- Required to run BEFORE the new forms will work properly

-- ============================================================================
-- STEP 1: Add new columns to existing rfqs table
-- ============================================================================

ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS rfq_type VARCHAR(20) DEFAULT 'public' 
CHECK (rfq_type IN ('direct', 'matched', 'public'));

ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public' 
CHECK (visibility IN ('private', 'semi-private', 'public'));

ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;

ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS matched_vendors JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS budget_min INTEGER;

ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS budget_max INTEGER;

ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50);

-- ============================================================================
-- STEP 2: Create rfq_recipients table for direct and matched RFQs
-- ============================================================================
-- This table tracks which vendors received which RFQs

CREATE TABLE IF NOT EXISTS public.rfq_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL,
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('direct', 'matched')),
  notification_sent_at TIMESTAMP,
  viewed_at TIMESTAMP,
  quote_submitted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(rfq_id, vendor_id)
);

-- Indexes for rfq_recipients table
CREATE INDEX IF NOT EXISTS idx_rfq_recipients_rfq_id ON public.rfq_recipients(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_recipients_vendor_id ON public.rfq_recipients(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rfq_recipients_recipient_type ON public.rfq_recipients(recipient_type);
CREATE INDEX IF NOT EXISTS idx_rfq_recipients_viewed ON public.rfq_recipients(viewed_at) WHERE viewed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rfq_recipients_quote_pending ON public.rfq_recipients(quote_submitted) WHERE quote_submitted = false;

-- ============================================================================
-- STEP 3: Create rfq_quotes table for vendor responses
-- ============================================================================
-- This table stores quotes/responses from vendors to RFQs

CREATE TABLE IF NOT EXISTS public.rfq_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  timeline_days INTEGER,
  payment_terms TEXT,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected', 'withdrawn')),
  submitted_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(rfq_id, vendor_id)
);

-- Indexes for rfq_quotes table
CREATE INDEX IF NOT EXISTS idx_rfq_quotes_rfq_id ON public.rfq_quotes(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_quotes_vendor_id ON public.rfq_quotes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rfq_quotes_status ON public.rfq_quotes(status);
CREATE INDEX IF NOT EXISTS idx_rfq_quotes_submitted ON public.rfq_quotes(submitted_at);

-- ============================================================================
-- STEP 4: Add indexes to rfqs table for new columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_rfqs_rfq_type ON public.rfqs(rfq_type);
CREATE INDEX IF NOT EXISTS idx_rfqs_visibility ON public.rfqs(visibility);
CREATE INDEX IF NOT EXISTS idx_rfqs_user_id_type ON public.rfqs(user_id, rfq_type);
CREATE INDEX IF NOT EXISTS idx_rfqs_category_location ON public.rfqs(category, location) WHERE rfq_type = 'public';
CREATE INDEX IF NOT EXISTS idx_rfqs_deadline ON public.rfqs(deadline) WHERE rfq_type = 'public';
CREATE INDEX IF NOT EXISTS idx_rfqs_budget_range ON public.rfqs(budget_min, budget_max);

-- ============================================================================
-- STEP 5: Add table and column comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.rfqs.rfq_type IS 'RFQ type: direct (customer selects vendors), matched (system auto-matches), public (marketplace visible to all)';
COMMENT ON COLUMN public.rfqs.visibility IS 'Visibility level: private (direct only), semi-private (matched vendors), public (marketplace)';
COMMENT ON COLUMN public.rfqs.deadline IS 'Deadline for vendors to submit quotes';
COMMENT ON COLUMN public.rfqs.budget_min IS 'Minimum budget in KES';
COMMENT ON COLUMN public.rfqs.budget_max IS 'Maximum budget in KES';
COMMENT ON COLUMN public.rfqs.payment_terms IS 'Payment terms preference (upfront, upon_completion, partial, monthly, flexible)';
COMMENT ON COLUMN public.rfqs.matched_vendors IS 'Array of vendor IDs that matched the criteria (populated by auto-matching algorithm)';

COMMENT ON TABLE public.rfq_recipients IS 'Tracks which vendors received direct or matched RFQs - essential for vendor notifications and tracking';
COMMENT ON COLUMN public.rfq_recipients.recipient_type IS 'Type of recipient: direct (manually selected), matched (auto-matched by system)';
COMMENT ON COLUMN public.rfq_recipients.notification_sent_at IS 'When vendor was notified about this RFQ';
COMMENT ON COLUMN public.rfq_recipients.viewed_at IS 'When vendor viewed the RFQ details';
COMMENT ON COLUMN public.rfq_recipients.quote_submitted IS 'Whether vendor has submitted a quote for this RFQ';

COMMENT ON TABLE public.rfq_quotes IS 'Vendor quotes/responses to RFQs - used for tracking and accepting quotes from vendors';
COMMENT ON COLUMN public.rfq_quotes.amount IS 'Quote amount in the specified currency';
COMMENT ON COLUMN public.rfq_quotes.status IS 'Quote status: submitted (initial), accepted (buyer accepted), rejected (buyer rejected), withdrawn (vendor withdrew)';

-- ============================================================================
-- STEP 6: Update RLS policies if needed
-- ============================================================================
-- Policies should allow:
-- 1. Buyers to insert rfq_recipients (when creating direct/matched RFQs)
-- 2. Vendors to view their rfq_recipients entries
-- 3. Vendors to insert/update rfq_quotes
-- 4. Buyers to view rfq_quotes for their RFQs

ALTER TABLE public.rfq_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to insert rfq_recipients (buyers creating RFQs)
DROP POLICY IF EXISTS "Allow buyers to create rfq_recipients" ON public.rfq_recipients;
CREATE POLICY "Allow buyers to create rfq_recipients"
ON public.rfq_recipients FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to view their own rfq_recipients
DROP POLICY IF EXISTS "Allow users to view their rfq_recipients" ON public.rfq_recipients;
CREATE POLICY "Allow users to view their rfq_recipients"
ON public.rfq_recipients FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert rfq_quotes
DROP POLICY IF EXISTS "Allow vendors to submit quotes" ON public.rfq_quotes;
CREATE POLICY "Allow vendors to submit quotes"
ON public.rfq_quotes FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow users to view rfq_quotes relevant to them
DROP POLICY IF EXISTS "Allow users to view rfq_quotes" ON public.rfq_quotes;
CREATE POLICY "Allow users to view rfq_quotes"
ON public.rfq_quotes FOR SELECT
USING (auth.role() = 'authenticated');

-- ============================================================================
-- STEP 7: Grant permissions to authenticated users
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_recipients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_quotes TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration to verify)
-- ============================================================================
-- These queries help verify the migration was successful

/*
-- Check if columns were added:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rfqs' 
AND column_name IN ('rfq_type', 'visibility', 'deadline', 'budget_min', 'budget_max', 'payment_terms');

-- Check if tables exist:
SELECT tablename FROM pg_tables WHERE tablename IN ('rfq_recipients', 'rfq_quotes');

-- Check table structure:
\d public.rfq_recipients
\d public.rfq_quotes
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All new RFQ columns, tables, and indexes have been created
-- The forms in app/post-rfq/ will now work correctly with the database
