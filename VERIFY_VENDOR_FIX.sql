-- ============================================================================
-- VERIFICATION STEP - Run these queries to confirm the fix worked
-- ============================================================================

-- Query 1: Verify all 4 admin policies were created
SELECT 
  policyname,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_check
FROM pg_policies
WHERE tablename = 'vendors'
AND policyname LIKE '%admin%'
ORDER BY policyname;

-- Expected output: Should show 4 policies
-- 1. admins_insert_vendors (INSERT)
-- 2. admins_select_all_vendors (SELECT) - THIS ONE FIXES THE COUNT!
-- 3. admins_update_all_vendors (UPDATE)
-- 4. super_admins_delete_vendors (DELETE)

-- Query 2: Count total vendors (should be 13 or more)
SELECT COUNT(*) as total_vendors
FROM public.vendors;

-- Query 3: Count active vendors (should be exactly 13)
SELECT COUNT(*) as active_vendors
FROM public.vendors
WHERE status = 'active';

-- Query 4: List all active vendors to see "Narok Cement"
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

-- Query 5: Search specifically for "Narok Cement"
SELECT 
  id,
  company_name,
  email,
  status,
  phone,
  county
FROM public.vendors
WHERE company_name ILIKE '%narok%' OR company_name ILIKE '%cement%';
