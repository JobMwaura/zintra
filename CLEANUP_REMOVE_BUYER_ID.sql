-- ============================================================================
-- CLEANUP: Remove buyer_id references and use only user_id
-- ============================================================================
-- This script removes the old "Buyers can insert their own RFQs" policy
-- and keeps only the "Users can create RFQs" policy
-- ============================================================================

-- Drop the old buyer_id RLS policy (redundant with user_id policy)
DROP POLICY IF EXISTS "Buyers can insert their own RFQs" ON rfqs;

-- Verify the correct policy is still there
-- SELECT policyname FROM pg_policies WHERE tablename = 'rfqs' AND policyname = 'Users can create RFQs';

-- ============================================================================
-- SCHEMA UPDATE: Remove buyer_id column from rfqs if it exists
-- ============================================================================
-- WARNING: Only run this if you're sure no data depends on buyer_id

-- Uncomment if you want to remove the column entirely:
-- ALTER TABLE rfqs DROP COLUMN IF EXISTS buyer_id;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ Dropped "Buyers can insert their own RFQs" RLS policy
-- ✅ Keeping "Users can create RFQs" (checks auth.uid() = user_id)
-- ✅ Now using ONLY user_id column for user association
-- 
-- This eliminates redundancy and confusion between buyer_id and user_id
-- All RFQ operations now consistently use user_id column
