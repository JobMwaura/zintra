-- ============================================================================
-- CRITICAL FIX: Add 'wizard' and 'vendor-request' to rfqs type constraint
-- ============================================================================
-- Problem: API tries to insert type='wizard' but constraint only allows 'direct', 'matched', 'public'
-- Solution: Update the CHECK constraint to include new RFQ types

-- Step 1: Drop the old constraint
ALTER TABLE public.rfqs DROP CONSTRAINT IF EXISTS rfqs_type_check;

-- Step 2: Add new constraint that includes all RFQ types
ALTER TABLE public.rfqs 
ADD CONSTRAINT rfqs_type_check CHECK (type IN ('direct', 'matched', 'public', 'wizard', 'vendor-request'));

-- Verify the constraint was created
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'rfqs' AND constraint_name LIKE '%type%';

-- Expected result: rfqs_type_check should appear with CHECK constraint type
