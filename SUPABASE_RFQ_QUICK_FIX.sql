-- =============================================================================
-- RFQ SYSTEM QUICK FIX - COPY & PASTE INTO SUPABASE SQL EDITOR
-- =============================================================================
-- Run this FIRST to fix the PGRST201 relationship ambiguity error
-- Date: January 24, 2026
-- =============================================================================

-- STEP 1: Add missing columns to rfqs table
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS assigned_vendor_id uuid;
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS type text DEFAULT 'direct';
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS budget_range text;

-- STEP 2: Add foreign key constraint for assigned_vendor_id (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'rfqs_assigned_vendor_id_fkey'
    AND table_name = 'rfqs'
  ) THEN
    ALTER TABLE public.rfqs 
    ADD CONSTRAINT rfqs_assigned_vendor_id_fkey 
    FOREIGN KEY (assigned_vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- STEP 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rfqs_assigned_vendor_id ON public.rfqs(assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_type ON public.rfqs(type);
CREATE INDEX IF NOT EXISTS idx_rfqs_user_id ON public.rfqs(user_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON public.rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_rfq_id ON public.rfq_responses(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_vendor_id ON public.rfq_responses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rfq_requests_vendor_id ON public.rfq_requests(vendor_id);

-- STEP 4: Verify the changes
SELECT 'rfqs columns:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'rfqs' AND column_name IN ('assigned_vendor_id', 'type', 'budget_range');

SELECT 'FK constraints on rfq_responses:' as info;
SELECT tc.constraint_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'rfq_responses' AND tc.constraint_type = 'FOREIGN KEY';
