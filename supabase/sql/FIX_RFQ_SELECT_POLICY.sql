-- ============================================================================
-- FIX: RFQ SELECT Policy to Allow Vendors to View RFQs They've Responded To
-- ============================================================================
-- ISSUE: The current policy only allows RFQ creators to SELECT their own RFQs
--        Vendors cannot view RFQs they've submitted quotes for
--
-- SOLUTION: Update the policy to also allow:
--   1. RFQ creators to view their own RFQs
--   2. Vendors who have submitted a response to view the RFQ
--   3. Service role (backend) to view all RFQs
-- ============================================================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "rfqs_select_own" ON public.rfqs;

-- Create a new policy that allows:
-- 1. Users to view their own RFQs (auth.uid() = user_id)
-- 2. Vendors to view RFQs they've responded to
CREATE POLICY "rfqs_select" ON public.rfqs
  FOR SELECT
  USING (
    auth.uid() = user_id  -- RFQ creator can view their own RFQs
    OR
    -- Vendors can view RFQs they've submitted a response to
    EXISTS (
      SELECT 1 FROM public.rfq_responses
      WHERE rfq_responses.rfq_id = rfqs.id
        AND rfq_responses.vendor_id IN (
          SELECT id FROM public.vendors WHERE user_id = auth.uid()
        )
    )
  );

-- Keep the service_role policy for backend operations
-- (It's already in RFQ_SYSTEM_COMPLETE.sql)
