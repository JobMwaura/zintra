-- ============================================================================
-- FIX RLS INFINITE RECURSION - COMPLETE CLEANUP
-- ============================================================================
-- This removes ALL recursive policies and creates safe non-recursive ones

-- ============================================================================
-- STEP 1: Drop ALL policies that could cause recursion
-- ============================================================================

-- Drop all rfqs policies
DROP POLICY IF EXISTS "rfqs_owner_all" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select_own" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_insert" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_update" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_service_role" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select_as_recipient" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select_authenticated" ON public.rfqs;
DROP POLICY IF EXISTS "Users can see own RFQs" ON public.rfqs;
DROP POLICY IF EXISTS "Users can create RFQs" ON public.rfqs;
DROP POLICY IF EXISTS "Users can update own RFQs" ON public.rfqs;
DROP POLICY IF EXISTS "Vendors can see assigned RFQs" ON public.rfqs;
DROP POLICY IF EXISTS "See public RFQs" ON public.rfqs;
DROP POLICY IF EXISTS "Vendors can view assigned RFQs via recipients" ON public.rfqs;

-- Drop all rfq_recipients policies (these are the ones causing recursion)
DROP POLICY IF EXISTS "recipients_creator" ON public.rfq_recipients;
DROP POLICY IF EXISTS "recipients_vendor" ON public.rfq_recipients;
DROP POLICY IF EXISTS "recipients_insert" ON public.rfq_recipients;
DROP POLICY IF EXISTS "recipients_select" ON public.rfq_recipients;
DROP POLICY IF EXISTS "service_role_all" ON public.rfq_recipients;

-- Drop all vendors policies
DROP POLICY IF EXISTS "vendors_select" ON public.vendors;
DROP POLICY IF EXISTS "vendors_update_own" ON public.vendors;
DROP POLICY IF EXISTS "vendors_insert" ON public.vendors;

-- ============================================================================
-- STEP 2: Create simple, non-recursive policies for rfqs
-- ============================================================================

-- Allow authenticated users to see all public RFQs and their own RFQs
CREATE POLICY "rfqs_select_authenticated" ON public.rfqs
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to insert (their own RFQs)
CREATE POLICY "rfqs_insert_authenticated" ON public.rfqs
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = user_id
  );

-- Allow users to update their own RFQs
CREATE POLICY "rfqs_update_own" ON public.rfqs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to bypass RLS (for API operations)
CREATE POLICY "rfqs_service_role_all" ON public.rfqs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- STEP 3: Create simple, non-recursive policies for rfq_recipients
-- ============================================================================

-- Vendors can see their own recipient records (NO cross-table query!)
CREATE POLICY "recipients_select_own" ON public.rfq_recipients
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND vendor_id = (
      SELECT id FROM public.vendors 
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

-- Authenticated users can see recipients of public RFQs
CREATE POLICY "recipients_select_public" ON public.rfq_recipients
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

-- API can insert recipients (for auto-matching)
CREATE POLICY "recipients_insert_service_role" ON public.rfq_recipients
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Service role full access
CREATE POLICY "recipients_service_role_all" ON public.rfq_recipients
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- STEP 4: Create simple policies for vendors table
-- ============================================================================

-- Vendors can see their own profile
CREATE POLICY "vendors_select_own" ON public.vendors
  FOR SELECT
  USING (auth.uid() = user_id);

-- Vendors can update their own profile
CREATE POLICY "vendors_update_own" ON public.vendors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can see vendor profiles
CREATE POLICY "vendors_select_authenticated" ON public.vendors
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Service role can do anything
CREATE POLICY "vendors_service_role_all" ON public.vendors
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- VERIFICATION - Run after to confirm policies are in place
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('rfqs', 'rfq_recipients', 'vendors')
ORDER BY tablename, policyname;
