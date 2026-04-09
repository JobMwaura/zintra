-- ============================================================================
-- DIAGNOSE AND FIX: Accept Quote RLS Issues
-- Run this script in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Check current RLS policies on rfq_responses
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'rfq_responses'
ORDER BY policyname;

-- STEP 2: Check if RLS is enabled
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'rfq_responses';

-- ============================================================================
-- STEP 3: DROP AND RECREATE THE UPDATE POLICY (if needed)
-- ============================================================================

-- Drop the potentially broken policy
DROP POLICY IF EXISTS "RFQ creators can accept/reject quotes" ON public.rfq_responses;

-- Recreate with a simpler, more permissive approach
CREATE POLICY "RFQ creators can accept/reject quotes"
  ON public.rfq_responses
  FOR UPDATE
  USING (
    -- Check if current user is the RFQ creator
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_responses.rfq_id
      AND rfqs.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 4: Also ensure there's a general SELECT policy for RFQ creators
-- ============================================================================

DROP POLICY IF EXISTS "RFQ creators can view all responses" ON public.rfq_responses;

CREATE POLICY "RFQ creators can view all responses"
  ON public.rfq_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_responses.rfq_id
      AND rfqs.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 5: Verify policies were created
-- ============================================================================

SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'rfq_responses'
ORDER BY policyname;

-- ============================================================================
-- STEP 6: Test the update manually
-- Replace the UUIDs with actual values:
--   - YOUR_USER_ID: The buyer's auth.uid()
--   - YOUR_QUOTE_ID: The quote ID to accept
--   - YOUR_RFQ_ID: The RFQ ID
-- ============================================================================

-- First, check the current quote status:
-- SELECT id, status, rfq_id FROM public.rfq_responses WHERE id = 'YOUR_QUOTE_ID';

-- Then, check if user owns the RFQ:
-- SELECT user_id FROM public.rfqs WHERE id = 'YOUR_RFQ_ID';

-- If the user_id matches YOUR_USER_ID, the update should work
-- Try updating directly:
-- UPDATE public.rfq_responses SET status = 'accepted' WHERE id = 'YOUR_QUOTE_ID';

-- Verify the update:
-- SELECT id, status FROM public.rfq_responses WHERE id = 'YOUR_QUOTE_ID';
