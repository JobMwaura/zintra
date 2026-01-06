-- ============================================================================
-- SIMPLE RLS POLICIES CHECK - Fixed version
-- ============================================================================
-- Check what RLS policies exist on rfqs table and if they allow/block RFQ creation
-- ============================================================================

-- QUICK CHECK: See all policies on rfqs table
SELECT 
  policyname,
  permissive as "Allow/Deny",
  CASE 
    WHEN with_check IS NOT NULL THEN 'INSERT/UPDATE'
    ELSE 'SELECT only'
  END as operation,
  with_check as "INSERT Condition"
FROM pg_policies
WHERE tablename = 'rfqs'
ORDER BY policyname;

-- ============================================================================
-- DETAILED: See all policies with full details
-- ============================================================================

SELECT 
  tablename,
  policyname,
  permissive,
  qual as "SELECT condition",
  with_check as "INSERT condition"
FROM pg_policies
WHERE tablename IN ('rfqs', 'rfq_recipients', 'users', 'categories')
ORDER BY tablename, policyname;

-- ============================================================================
-- COUNT: How many policies per table
-- ============================================================================

SELECT 
  tablename,
  COUNT(*) as total_policies,
  SUM(CASE WHEN permissive::text = 'true' THEN 1 ELSE 0 END) as allow_policies,
  SUM(CASE WHEN permissive::text = 'false' THEN 1 ELSE 0 END) as deny_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- RLS STATUS: Is RLS enabled on tables?
-- ============================================================================

SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('rfqs', 'rfq_recipients', 'users', 'vendors', 'categories')
ORDER BY tablename;

-- ============================================================================
-- CRITICAL: Check INSERT policies on rfqs
-- ============================================================================
-- This is what allows/blocks RFQ creation

SELECT 
  policyname,
  permissive as "Allows INSERT?",
  with_check as "Condition (must check auth.uid() = user_id)"
FROM pg_policies
WHERE tablename = 'rfqs' 
  AND with_check IS NOT NULL
ORDER BY policyname;

-- ============================================================================
-- ANALYSIS: What's blocking RFQ submission?
-- ============================================================================

-- If the query above returns nothing: ❌ NO INSERT POLICY (blocks creation)
-- If with_check = 'false': ❌ EXPLICIT DENY (blocks creation)
-- If with_check like '%auth.uid()%user_id%': ✅ CORRECT (allows creation)
-- If permissive = 'false': ❌ DENY policy (blocks creation)
