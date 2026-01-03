-- ============================================================================
-- COMPREHENSIVE FIX FOR RFQ_REQUESTS FOREIGN KEY CONSTRAINT
-- Date: 2026-01-03
-- ============================================================================

-- STEP 1: Check current vendor_id foreign key constraint
-- Run this first to see what exists
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public' 
  AND table_name = 'rfq_requests' 
  AND column_name = 'vendor_id';

-- STEP 2: If there's a foreign key that references the wrong table, drop it
-- REPLACE rfq_requests_vendor_id_fkey with the actual constraint name from Step 1
-- ALTER TABLE public.rfq_requests
-- DROP CONSTRAINT IF EXISTS rfq_requests_vendor_id_fkey;

-- STEP 3: Add/Fix the foreign key constraint to point to vendors table
-- First, let's verify vendors table exists and has id column
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'vendors'
ORDER BY ordinal_position;

-- STEP 4: If vendors table exists, add the proper foreign key
-- Delete this if vendors table doesn't exist or has different structure
ALTER TABLE public.rfq_requests
ADD CONSTRAINT rfq_requests_vendor_id_fkey 
FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE
ON CONFLICT DO NOTHING;

-- STEP 5: Verify the constraint is correct
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name 
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name 
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'rfq_requests'
  AND kcu.column_name = 'vendor_id';

-- Expected output:
-- constraint_name: rfq_requests_vendor_id_fkey
-- table_name: rfq_requests
-- column_name: vendor_id
-- referenced_table: vendors
-- referenced_column: id
