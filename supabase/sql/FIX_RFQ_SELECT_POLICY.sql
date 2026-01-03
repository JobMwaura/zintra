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

-- ============================================================================
-- REVERT: Restore the original rfqs_select_own policy
-- ============================================================================
-- The issue is not the rfqs policy, but recursive policies between
-- rfqs and rfq_recipients tables.
--
-- SOLUTION: Use simple, non-recursive policies:
-- - RFQ creators can view their own RFQs (simple comparison, no joins)
-- - Do NOT use joins to other tables in policies to avoid recursion
-- ============================================================================

-- Drop any problematic policies
DROP POLICY IF EXISTS "rfqs_select_own" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select_as_recipient" ON public.rfqs;

-- Restore simple, non-recursive policy: only RFQ creators can view
CREATE POLICY "rfqs_select_own" ON public.rfqs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Also allow service_role to view all (for backend operations)
-- This should already exist but making sure
CREATE POLICY IF NOT EXISTS "rfqs_service_role" ON public.rfqs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ⚠️  NOTE: For vendors to view RFQs they've responded to, we need to handle
--     this at the APPLICATION level, not in the database policy layer.
--     The frontend should query based on the current user's vendor ID.
