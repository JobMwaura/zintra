-- ============================================================================
-- VERIFY VENDOR ACCESS IS RESTORED
-- ============================================================================
-- The policy already exists, so access should be working now
-- Run these queries to verify everything is back to normal
-- ============================================================================

-- Query 1: Check all policies on vendors table
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;

-- Expected policies:
-- 1. admins_insert_vendors (INSERT)
-- 2. admins_select_all_vendors (SELECT)
-- 3. admins_update_all_vendors (UPDATE)
-- 4. super_admins_delete_vendors (DELETE)
-- 5. vendors_select_authenticated (SELECT) ✅ THIS ONE RESTORES ACCESS
-- 6. vendors_select_own (SELECT)
-- 7. vendors_update_own (UPDATE)

-- Query 2: Count all vendors
SELECT COUNT(*) as total_vendors FROM public.vendors;

-- Query 3: Count active vendors (should be 13)
SELECT COUNT(*) as active_vendors FROM public.vendors WHERE status = 'active';

-- Query 4: List all active vendors
SELECT 
  id,
  company_name,
  email,
  status,
  subscription_plan,
  county,
  created_at
FROM public.vendors
WHERE status = 'active'
ORDER BY company_name;

-- Query 5: Search for "Narok Cement"
SELECT 
  id,
  company_name,
  email,
  status
FROM public.vendors
WHERE company_name ILIKE '%narok%' OR company_name ILIKE '%cement%';

-- ============================================================================
-- IF VENDORS STILL NOT SHOWING:
-- ============================================================================

-- Check 1: Verify you're authenticated
SELECT 
  auth.uid() as my_user_id,
  auth.role() as my_role,
  auth.email() as my_email;

-- Should return:
-- my_user_id: <your-uuid>
-- my_role: authenticated
-- my_email: jmwaura@strathmore.edu

-- Check 2: Test policy directly
SELECT 
  (auth.role() = 'authenticated') as policy_check;

-- Should return: true

-- ============================================================================
-- CONCLUSION:
-- ============================================================================
-- If Query 2 returns vendors and Query 3 returns 13, then access is restored!
-- Refresh your admin panel at /admin/vendors to see all vendors
-- ============================================================================
