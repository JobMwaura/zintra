-- ============================================================================
-- FINAL VERIFICATION - CHECK IF EVERYTHING IS FIXED
-- ============================================================================

-- Query 1: Verify admin_users table was created correctly
SELECT 
  column_name,
  data_type,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'admin_users'
ORDER BY ordinal_position;

-- Query 2: Verify you're in the admin_users table as super_admin
SELECT 
  id,
  user_id,
  email,
  role,
  status,
  created_at
FROM public.admin_users
WHERE email = 'jmwaura@strathmore.edu';

-- Query 3: Check all policies on vendors table
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;

-- Query 4: Test vendor access - should return 13+
SELECT COUNT(*) as total_vendors FROM public.vendors;

-- Query 5: Test active vendors - should return exactly 13
SELECT COUNT(*) as active_vendors FROM public.vendors WHERE status = 'active';

-- Query 6: List all 13 active vendors
SELECT 
  id,
  company_name,
  email,
  status,
  county
FROM public.vendors
WHERE status = 'active'
ORDER BY company_name;

-- Query 7: Search for "Narok Cement" specifically
SELECT 
  id,
  company_name,
  email,
  status,
  phone,
  county
FROM public.vendors
WHERE company_name ILIKE '%narok%' OR company_name ILIKE '%cement%';

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- Query 1: Should show admin_users table structure (10 columns)
-- Query 2: Should show YOUR admin record with role='super_admin'
-- Query 3: Should show 7-8 policies including admin policies
-- Query 4: Should return total_vendors = 13 or more
-- Query 5: Should return active_vendors = 13
-- Query 6: Should list all 13 vendors including "Narok Cement"
-- Query 7: Should find "Narok Cement" vendor
-- ============================================================================

-- ✅ IF ALL QUERIES RETURN DATA: Refresh /admin/vendors - vendors will appear!
-- ❌ IF QUERY 4-5 RETURN 0: Still RLS issue, check authentication
-- ============================================================================
