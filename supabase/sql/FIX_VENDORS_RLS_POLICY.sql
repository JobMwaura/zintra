-- ============================================================================
-- FIX: Vendors Table RLS Policy - Allow Self-Lookup
-- ============================================================================
-- Issue: 406 error when querying vendors table with SELECT
-- Root Cause: RLS policy may be missing or malformed
-- Solution: Recreate RLS policies with proper authentication check
-- ============================================================================

-- Step 1: Drop existing vendor policies to avoid conflicts
DROP POLICY IF EXISTS "vendor_select" ON public.vendors;
DROP POLICY IF EXISTS "vendor_service_role" ON public.vendors;

-- Step 2: Re-enable RLS (in case it was disabled)
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Step 3: Create SELECT policy - Users can SELECT their own vendor profile
CREATE POLICY "vendor_select_own" ON public.vendors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 4: Create INSERT policy - Users can INSERT their own vendor profile
CREATE POLICY "vendor_insert_own" ON public.vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Step 5: Create UPDATE policy - Users can UPDATE their own vendor profile
CREATE POLICY "vendor_update_own" ON public.vendors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uuid() = user_id);

-- Step 6: Service role can do anything (for admin operations)
CREATE POLICY "vendor_service_role" ON public.vendors
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify the fix works:

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'vendors';
-- Expected: rowsecurity = true

-- Check policies exist:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'vendors' ORDER BY policyname;
-- Expected: 4 policies (vendor_select_own, vendor_insert_own, vendor_update_own, vendor_service_role)

-- Test the query that was failing:
-- SELECT * FROM public.vendors WHERE user_id = auth.uid();
-- Expected: Should return vendor row if it exists

-- ============================================================================
-- TESTING INSTRUCTIONS
-- ============================================================================
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Go back to the quote form page: https://zintra-sandy.vercel.app/vendor/rfq/bfcfe125-faee-41f6-9ac5-56fd9b94618e/respond
-- 3. Form should load without 406 error
-- 4. Check browser console - should see vendor profile loaded
-- 5. All 3 form sections should be visible
