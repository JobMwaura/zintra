-- FIX: Add RLS Policy to Allow RFQ Creators to Accept/Reject Quotes
-- 
-- PROBLEM: RFQ creators couldn't update quote status because there was no
-- RLS policy allowing them to UPDATE rows in rfq_responses table.
-- The update appeared to succeed (error: null) but returned data: [] because
-- RLS silently blocked the operation.
--
-- SOLUTION: Add a new UPDATE policy that allows RFQ creators to update
-- the status field of responses for their own RFQs.

-- Add the missing UPDATE policy for RFQ creators
CREATE POLICY "RFQ creators can accept/reject quotes"
  ON public.rfq_responses
  FOR UPDATE
  USING (
    -- RFQ creator can update if they own the RFQ
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_responses.rfq_id
      AND rfqs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Same check for the updated row
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_responses.rfq_id
      AND rfqs.user_id = auth.uid()
    )
  );

-- Verification: Check that the policy was created
-- SELECT policyname, cmd FROM pg_policies 
-- WHERE tablename = 'rfq_responses' 
-- ORDER BY policyname;
--
-- Expected output should include:
-- - Vendors can insert their own responses (INSERT)
-- - Vendors can view their own responses (SELECT)
-- - Vendors can update their own responses (UPDATE)
-- - RFQ creators can view responses to their RFQs (SELECT)
-- - RFQ creators can accept/reject quotes (UPDATE) ← NEW POLICY
