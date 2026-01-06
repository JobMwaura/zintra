-- ============================================================================
-- CHECK CURRENT RLS POLICIES - Run this to see what policies exist NOW
-- ============================================================================

-- See all policies on rfqs table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'rfqs'
ORDER BY policyname;

-- See all policies on rfq_recipients table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'rfq_recipients'
ORDER BY policyname;

-- See all policies on vendors table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;
