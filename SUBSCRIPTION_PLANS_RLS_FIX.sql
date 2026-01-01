-- ============================================================================
-- SECURITY FIX: subscription_plans Table - Enable RLS (Row-Level Security)
-- ============================================================================
--
-- Issue: Table public.subscription_plans has 2 RLS policies defined but RLS is 
--        NOT ENABLED on the table. This means policies have no effect.
--
-- Policies:
--   1. "Anyone can view subscription plans"
--   2. "Public can view plans"
--
-- These policies suggest intentional public read access, so enabling RLS
-- will make them effective while maintaining current access patterns.
--
-- ============================================================================

-- STEP 1: Check current state (diagnostic - optional)
/*
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'subscription_plans';

SELECT 
  policyname,
  permissive,
  roles,
  qual as using_clause
FROM pg_policies 
WHERE tablename = 'subscription_plans'
ORDER BY policyname;
*/

-- ============================================================================
-- STEP 2: ENABLE RLS ON subscription_plans TABLE
-- ============================================================================
-- This enables Row-Level Security so the existing policies take effect
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: DROP AND RECREATE POLICIES (OPTIONAL)
-- ============================================================================
-- The existing policies appear reasonable (public read access),
-- but we can drop and recreate them to ensure they're correct.
-- Uncomment if you want to refresh the policies:

/*
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Public can view plans" ON public.subscription_plans;

-- Allow anyone to view subscription plans
CREATE POLICY "Anyone can view subscription plans" 
  ON public.subscription_plans 
  FOR SELECT 
  USING (true);

-- Grant permissions
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
*/

-- ============================================================================
-- STEP 4: VERIFY THE FIX
-- ============================================================================
-- Check RLS status (should show rowsecurity = true)
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'subscription_plans';

-- Check all policies (should show 2 policies)
SELECT 
  policyname,
  permissive,
  roles,
  qual as using_clause
FROM pg_policies 
WHERE tablename = 'subscription_plans'
ORDER BY policyname;

-- Count total policies
SELECT COUNT(*) as total_subscription_policies 
FROM pg_policies 
WHERE tablename = 'subscription_plans';

-- ============================================================================
-- SUCCESS INDICATORS
-- ============================================================================
-- After running this script, verify:
-- 1. RLS status shows: rowsecurity = true ✅
-- 2. Total policies = 2 ✅
-- 3. Public/anonymous can still view plans ✅
-- 4. No application errors related to subscription plans ✅
