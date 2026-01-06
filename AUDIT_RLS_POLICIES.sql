-- ============================================================================
-- SUPABASE RLS POLICIES AUDIT
-- ============================================================================
-- This script inspects ALL RLS policies to identify which ones
-- might be blocking RFQ submissions and other operations
-- ============================================================================

-- ============================================================================
-- 1. VIEW ALL RLS POLICIES
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 2. CHECK RLS STATUS ON EACH TABLE
-- ============================================================================

SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 3. TEST: Try to INSERT into rfqs as authenticated user
-- ============================================================================
-- NOTE: This will fail if policies block it, showing the exact error
-- Uncomment to test:

/*
INSERT INTO rfqs (
  title,
  user_id,
  category_slug,
  budget_min,
  budget_max,
  status,
  description
) VALUES (
  'Test RFQ',
  auth.uid(),
  'test-category',
  1000,
  5000,
  'submitted',
  'Test description'
);
*/

-- ============================================================================
-- 4. CHECK SPECIFIC POLICY BLOCKING RFQ INSERT
-- ============================================================================

SELECT 
  policyname,
  permissive,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'rfqs' AND permissive = false
ORDER BY policyname;

-- ============================================================================
-- 5. LIST ALL POLICIES ON RFQ-RELATED TABLES
-- ============================================================================

SELECT 
  tablename,
  policyname,
  CASE 
    WHEN permissive THEN 'ALLOW'
    ELSE 'DENY'
  END as policy_type,
  roles::text as user_roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has SELECT condition'
    ELSE 'No SELECT condition'
  END as select_condition,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has INSERT/UPDATE condition'
    ELSE 'No INSERT/UPDATE condition'
  END as insert_update_condition
FROM pg_policies
WHERE tablename IN ('rfqs', 'rfq_recipients', 'users', 'categories')
ORDER BY tablename, policyname;

-- ============================================================================
-- 6. COUNT POLICIES PER TABLE
-- ============================================================================

SELECT 
  tablename,
  COUNT(*) as total_policies,
  SUM(CASE WHEN permissive THEN 1 ELSE 0 END) as allow_policies,
  SUM(CASE WHEN NOT permissive THEN 1 ELSE 0 END) as deny_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 7. DETAILED RFQs TABLE POLICIES
-- ============================================================================

SELECT 
  policyname as "Policy Name",
  CASE 
    WHEN permissive THEN '✅ ALLOW'
    ELSE '❌ DENY'
  END as "Type",
  format('When: %s', COALESCE(qual, 'All rows')) as "Condition",
  format('Then can: %s', COALESCE(with_check, 'All columns')) as "Check"
FROM pg_policies
WHERE tablename = 'rfqs'
ORDER BY policyname;

-- ============================================================================
-- 8. POLICIES THAT AFFECT INSERT OPERATIONS
-- ============================================================================

SELECT 
  tablename,
  policyname,
  'INSERT' as operation,
  CASE 
    WHEN permissive THEN '✅ ALLOW'
    ELSE '❌ DENY'
  END as effect,
  COALESCE(with_check, 'No constraint') as "Constraint"
FROM pg_policies
WHERE schemaname = 'public' 
  AND with_check IS NOT NULL
ORDER BY tablename, policyname;

-- ============================================================================
-- 9. CHECK FOR RESTRICTIVE POLICIES THAT MIGHT BLOCK INSERTS
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as policy_mode,
  CASE 
    WHEN with_check IS NULL THEN 'No INSERT check'
    WHEN with_check LIKE '%false%' THEN '⚠️ MIGHT BLOCK INSERT'
    ELSE 'Has INSERT validation'
  END as insert_status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, permissive DESC;

-- ============================================================================
-- 10. MOST IMPORTANT: RFQ INSERT POLICY ANALYSIS
-- ============================================================================

SELECT 
  'rfqs' as table_name,
  policyname,
  CASE 
    WHEN with_check IS NULL THEN '⚠️ NO INSERT POLICY - Will block INSERTs!'
    WHEN with_check = 'false' THEN '❌ EXPLICIT DENY - Blocks all INSERTs'
    WHEN with_check LIKE '%auth.uid()%user_id%' THEN '✅ Allows user to insert own RFQ'
    ELSE '⚠️ Check manually: ' || with_check
  END as assessment
FROM pg_policies
WHERE tablename = 'rfqs' AND permissive = true
ORDER BY policyname;

-- ============================================================================
-- SUMMARY AND RECOMMENDATIONS
-- ============================================================================
/*

COMMON RFQ INSERT BLOCKING ISSUES:

1. ❌ NO INSERT POLICY exists
   - Policy for SELECT exists but no INSERT
   - Solution: Create INSERT policy

2. ❌ INSERT policy has WITH CHECK (false)
   - Explicitly denies all inserts
   - Solution: Change to WITH CHECK (auth.uid() = user_id)

3. ❌ INSERT policy checks wrong column
   - WITH CHECK (some_other_column = value)
   - Solution: Use WITH CHECK (auth.uid() = user_id)

4. ❌ RLS not enabled on table
   - RLS should be enabled: ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY
   - Solution: Enable RLS

5. ✅ CORRECT RFQ INSERT POLICY:

   CREATE POLICY "Users can create RFQs"
     ON rfqs FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   This allows:
   - Users to insert RFQs
   - Only if they set user_id to their own UUID
   - RLS will reject if they try user_id = someone else

*/
