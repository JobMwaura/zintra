-- ============================================================================
-- SECURITY FIX: admin_users Table - Enable RLS (Row-Level Security)
-- ============================================================================
--
-- Issue: Table public.admin_users has 3 RLS policies defined but RLS is 
--        NOT ENABLED on the table. This means policies have no effect and 
--        access control is based on GRANT permissions only.
--
-- Policies without RLS enabled are inert and provide no protection.
-- This fix enables RLS and verifies/corrects the policies.
--
-- ============================================================================

-- STEP 1: Check current state (diagnostic)
-- Run this first to see what's currently set up:
/*
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'admin_users';

SELECT 
  policyname,
  permissive,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'admin_users'
ORDER BY policyname;
*/

-- ============================================================================
-- STEP 2: ENABLE RLS ON admin_users TABLE
-- ============================================================================
-- This is the critical fix - enables Row-Level Security so policies take effect
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: DROP EXISTING POLICIES AND RECREATE WITH CORRECT LOGIC
-- ============================================================================
-- Drop existing policies to ensure we have clean, correct ones
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only authenticated users who are admins can update" ON public.admin_users;
DROP POLICY IF EXISTS "Users can read their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_service_role" ON public.admin_users;

-- ============================================================================
-- STEP 4: CREATE CORRECT RLS POLICIES FOR admin_users
-- ============================================================================

-- Policy 1: Admins can SELECT (view) all admin users
-- This allows admins to see the full admin roster
CREATE POLICY "Admins can view all admin users" 
  ON public.admin_users 
  FOR SELECT 
  TO authenticated 
  USING (
    -- Check if current user is an admin
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Policy 2: Users can SELECT their own admin record
-- This allows authenticated users to view their own record if they're an admin
CREATE POLICY "Users can read their own admin record" 
  ON public.admin_users 
  FOR SELECT 
  TO authenticated 
  USING (
    -- Allow user to see their own admin record
    user_id = auth.uid()
  );

-- Policy 3: Only authenticated admins can UPDATE admin users
-- This ensures only admins can modify admin records
CREATE POLICY "Only authenticated users who are admins can update" 
  ON public.admin_users 
  FOR UPDATE 
  TO authenticated 
  USING (
    -- Check if current user is an admin (for the UPDATE operation)
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Ensure the same condition for INSERT/UPDATE
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Policy 4: Allow INSERT for admins only
-- This ensures new admin users can only be added by existing admins
CREATE POLICY "Only admins can insert new admin users" 
  ON public.admin_users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Policy 5: Service role bypass (for backend operations)
-- Service role can perform any operation on this table
CREATE POLICY "Service role can access all" 
  ON public.admin_users 
  FOR ALL 
  TO authenticated 
  USING (
    (auth.jwt() ->> 'role') = 'service_role'
  );

-- ============================================================================
-- STEP 5: GRANT APPROPRIATE PERMISSIONS
-- ============================================================================
-- Ensure authenticated users have permission to execute SELECT, INSERT, UPDATE
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_users TO authenticated;

-- Service role should have full access
-- Note: Service role bypasses RLS entirely, so this is safe

-- ============================================================================
-- STEP 6: VERIFY THE FIX
-- ============================================================================
-- Run these verification queries to confirm RLS is enabled and policies exist:

-- Check RLS status (should show rowsecurity = true)
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'admin_users';

-- Check all policies (should show 5 policies)
SELECT 
  policyname,
  permissive,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'admin_users'
ORDER BY policyname;

-- Count total policies
SELECT COUNT(*) as total_admin_user_policies 
FROM pg_policies 
WHERE tablename = 'admin_users';

-- ============================================================================
-- STEP 7: TESTING (Run these as a super-admin to test)
-- ============================================================================

-- Test 1: Non-admin user trying to SELECT (should fail/see nothing)
-- Run as: SELECT * FROM public.admin_users;
-- Expected: 0 rows or permission error

-- Test 2: Non-admin trying to UPDATE (should fail)
-- Run as: UPDATE public.admin_users SET role = 'viewer' WHERE id = 'some-id';
-- Expected: Permission error

-- Test 3: Admin user SELECT (should succeed)
-- Run as admin: SELECT * FROM public.admin_users;
-- Expected: Full list of admin users

-- Test 4: Admin INSERT (should succeed)
-- Run as admin: INSERT INTO public.admin_users (user_id, role) VALUES ('new-user-id', 'admin');
-- Expected: Insert successful

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- 1. SERVICE ROLE BYPASS
--    Service role (used server-side only) bypasses all RLS policies.
--    This is safe because service role keys should never be exposed to clients.
--
-- 2. PERFORMANCE IMPACT
--    RLS policies add a small overhead to queries. If performance becomes
--    an issue, check:
--    - Indexes on frequently used columns (user_id, role)
--    - Query plans in the slow log
--
-- 3. ROLLBACK
--    If you need to revert:
--    ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
--    DROP POLICY "..." ON public.admin_users; (drop each policy)
--
-- 4. COLUMN-LEVEL SECURITY
--    Consider adding column-level security for sensitive columns
--    (though this fix covers row-level access control)
--
-- 5. AUDIT LOGGING
--    Consider adding audit logging to track who modifies admin records:
--    - Track INSERT/UPDATE/DELETE in a separate audit table
--    - Use triggers with SECURITY DEFINER for audit logging
--
-- ============================================================================
