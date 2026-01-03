-- ============================================================================
-- SIMPLE FIX FOR VENDOR_ID FOREIGN KEY ERROR
-- Copy and paste this entire block into Supabase SQL Editor and RUN
-- ============================================================================

-- FIRST: Check what constraint exists (run this first to see the name)
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'rfq_requests'
  AND constraint_type = 'FOREIGN KEY';

-- You'll see something like: rfq_requests_vendor_id_fkey

-- SECOND: Drop the existing constraint if it exists (REPLACE constraint_name below)
-- Copy the constraint_name from above and replace rfq_requests_vendor_id_fkey
ALTER TABLE public.rfq_requests
DROP CONSTRAINT IF EXISTS rfq_requests_vendor_id_fkey;

-- THIRD: Add the correct foreign key constraint
-- This ensures vendor_id in rfq_requests references id in vendors table
ALTER TABLE public.rfq_requests
ADD CONSTRAINT rfq_requests_vendor_id_fkey
FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

-- VERIFY: Check the constraint is now correct
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'rfq_requests'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Expected result:
-- rfq_requests_vendor_id_fkey | rfq_requests | vendor_id | vendors | id
