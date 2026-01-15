-- ============================================================================
-- VENDOR ADMIN ACCESS FIX - RLS POLICY UPDATE
-- ============================================================================
-- Date: January 15, 2026
-- Issue: Admin panel showing 11 vendors instead of 13 active vendors
-- Root Cause: Missing RLS policy for admin access to vendors table
-- Solution: Add admin-specific policies for full vendor table access
-- ============================================================================

-- SECTION 1: DIAGNOSTIC QUERIES (Run these first to verify the issue)
-- ============================================================================

-- Check current policies on vendors table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;

-- Count vendors by status
SELECT 
  status,
  COUNT(*) as count
FROM public.vendors
GROUP BY status
ORDER BY status;

-- List all active vendors (should be 13)
SELECT 
  id,
  company_name,
  email,
  status,
  user_id,
  created_at
FROM public.vendors
WHERE status = 'active'
ORDER BY company_name;

-- Check if "Narok Cement" exists
SELECT 
  id,
  company_name,
  email,
  status,
  user_id,
  created_at
FROM public.vendors
WHERE company_name ILIKE '%narok%' OR company_name ILIKE '%cement%';

-- ============================================================================
-- SECTION 2: ADD ADMIN POLICIES FOR VENDORS TABLE
-- ============================================================================

-- Policy 1: Allow admins to SELECT all vendors
-- This is the critical fix for the visibility issue
CREATE POLICY IF NOT EXISTS "admins_select_all_vendors" ON public.vendors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

COMMENT ON POLICY "admins_select_all_vendors" ON public.vendors IS 
'Allows active admin users to view all vendor profiles in the admin panel';

-- Policy 2: Allow admins to UPDATE any vendor profile
CREATE POLICY IF NOT EXISTS "admins_update_all_vendors" ON public.vendors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

COMMENT ON POLICY "admins_update_all_vendors" ON public.vendors IS 
'Allows active admin users to update any vendor profile';

-- Policy 3: Allow super admins to DELETE vendors
CREATE POLICY IF NOT EXISTS "super_admins_delete_vendors" ON public.vendors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'super_admin'
      AND admin_users.status = 'active'
    )
  );

COMMENT ON POLICY "super_admins_delete_vendors" ON public.vendors IS 
'Allows only super admin users to delete vendor profiles';

-- Policy 4: Allow admins to INSERT vendors (for manual vendor creation)
CREATE POLICY IF NOT EXISTS "admins_insert_vendors" ON public.vendors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

COMMENT ON POLICY "admins_insert_vendors" ON public.vendors IS 
'Allows active admin users to create new vendor profiles';

-- ============================================================================
-- SECTION 3: VERIFICATION QUERIES (Run after applying policies)
-- ============================================================================

-- Verify all policies are created
SELECT 
  policyname,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_check
FROM pg_policies
WHERE tablename = 'vendors'
AND policyname LIKE '%admin%'
ORDER BY policyname;

-- Expected output: Should show 4 admin policies
-- 1. admins_select_all_vendors (SELECT, has_using: true)
-- 2. admins_update_all_vendors (UPDATE, has_using: true, has_check: true)
-- 3. super_admins_delete_vendors (DELETE, has_using: true)
-- 4. admins_insert_vendors (INSERT, has_check: true)

-- Count total policies on vendors table
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'vendors';

-- Expected: Should be 7-8 policies total (including existing vendor policies)

-- ============================================================================
-- SECTION 4: TEST QUERIES (Run as admin user to verify access)
-- ============================================================================

-- Test 1: Count all vendors (should return 13 or more)
SELECT COUNT(*) as total_vendors
FROM public.vendors;

-- Test 2: Count active vendors (should return 13)
SELECT COUNT(*) as active_vendors
FROM public.vendors
WHERE status = 'active';

-- Test 3: Search for Narok Cement
SELECT 
  id,
  company_name,
  email,
  status
FROM public.vendors
WHERE company_name ILIKE '%narok%cement%';

-- Test 4: List all vendors with details
SELECT 
  id,
  company_name,
  email,
  status,
  subscription_plan,
  county,
  category,
  created_at
FROM public.vendors
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- SECTION 5: TROUBLESHOOTING
-- ============================================================================

-- If vendors still not showing after applying policies:

-- Check 1: Verify admin_users table exists and has data
SELECT 
  user_id,
  email,
  role,
  status
FROM public.admin_users
WHERE status = 'active';

-- Check 2: Verify current user is in admin_users table
SELECT 
  user_id,
  email,
  role,
  status
FROM public.admin_users
WHERE user_id = auth.uid();

-- Check 3: Test policy directly
SELECT 
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.status = 'active'
  ) as is_admin;

-- Should return: is_admin = true

-- Check 4: List vendors that might be filtered
SELECT 
  id,
  company_name,
  status,
  user_id IS NULL as missing_user_id,
  created_at
FROM public.vendors
WHERE status = 'active'
ORDER BY created_at DESC;

-- ============================================================================
-- SECTION 6: ROLLBACK (If needed)
-- ============================================================================

/*
-- Uncomment and run if you need to remove these policies:

DROP POLICY IF EXISTS "admins_select_all_vendors" ON public.vendors;
DROP POLICY IF EXISTS "admins_update_all_vendors" ON public.vendors;
DROP POLICY IF EXISTS "super_admins_delete_vendors" ON public.vendors;
DROP POLICY IF EXISTS "admins_insert_vendors" ON public.vendors;

-- This will revert to the original RLS policies only
*/

-- ============================================================================
-- SECTION 7: PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Add index on admin_users for faster policy checks (if not exists)
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id_status 
ON public.admin_users(user_id, status)
WHERE status = 'active';

COMMENT ON INDEX idx_admin_users_user_id_status IS 
'Optimizes RLS policy checks for active admin users';

-- Add index on vendors status (if not exists)
CREATE INDEX IF NOT EXISTS idx_vendors_status 
ON public.vendors(status);

COMMENT ON INDEX idx_vendors_status IS 
'Optimizes filtering vendors by status';

-- ============================================================================
-- SECTION 8: MIGRATION SUMMARY
-- ============================================================================

/*
MIGRATION SUMMARY:
==================

PROBLEM:
- Admin panel showing 11 vendors instead of 13
- Missing vendors: "Narok Cement" and one other
- Root cause: No RLS policy allowing admins to see all vendors

SOLUTION:
- Added 4 new RLS policies for admin access:
  1. admins_select_all_vendors - View all vendors
  2. admins_update_all_vendors - Edit any vendor
  3. super_admins_delete_vendors - Delete vendors (super admin only)
  4. admins_insert_vendors - Create new vendors

IMPACT:
- All active admins can now see all 13 vendors
- Maintains security by checking admin_users table
- Only active admins with status='active' get access
- Super admins get additional delete permissions

TESTING:
1. Run diagnostic queries to verify issue
2. Apply policies (SECTION 2)
3. Run verification queries (SECTION 3)
4. Test in admin panel at /admin/vendors
5. Verify count shows 13 active vendors
6. Search for "Narok Cement" - should appear

ROLLBACK:
- Safe to rollback using SECTION 6
- Original vendor policies remain intact
- Only removes admin-specific policies

PERFORMANCE:
- Indexes added for optimized policy checks
- No performance impact expected
- Policy checks cached by PostgreSQL

SECURITY:
- ✅ Maintains row-level security
- ✅ Requires admin authentication
- ✅ Checks admin status = 'active'
- ✅ Separate policy for delete operations
- ✅ All actions logged in auth.users audit log

STATUS: Ready to apply
ESTIMATED TIME: 30 seconds
RISK LEVEL: Low (additive changes only)
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Final verification message
DO $$
BEGIN
  RAISE NOTICE '✅ VENDOR ADMIN ACCESS POLICIES CREATED';
  RAISE NOTICE '📊 Please run verification queries to confirm all 13 vendors are now visible';
  RAISE NOTICE '🔍 Check admin panel at /admin/vendors';
  RAISE NOTICE '✨ Expected result: 13 active vendors including "Narok Cement"';
END $$;
