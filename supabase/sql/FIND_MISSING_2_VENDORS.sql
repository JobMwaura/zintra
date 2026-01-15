-- ============================================================================
-- FIND THE 2 MISSING VENDORS - STATUS INVESTIGATION
-- ============================================================================
-- We have 13 total vendors, but only 11 are "active"
-- Let's find the 2 vendors that have a different status
-- ============================================================================

-- Query 1: Count vendors by status
SELECT 
  status,
  COUNT(*) as count
FROM public.vendors
GROUP BY status
ORDER BY count DESC;

-- Expected results:
-- active: 11
-- pending: 2 (or some other status)

-- Query 2: Find the 2 non-active vendors
SELECT 
  id,
  company_name,
  email,
  status,
  phone,
  county,
  category,
  subscription_plan,
  created_at,
  updated_at
FROM public.vendors
WHERE status != 'active' OR status IS NULL
ORDER BY created_at DESC;

-- Query 3: List ALL vendors with their status
SELECT 
  id,
  company_name,
  email,
  status,
  county,
  created_at
FROM public.vendors
ORDER BY 
  CASE 
    WHEN status = 'active' THEN 1
    WHEN status = 'pending' THEN 2
    WHEN status IS NULL THEN 3
    ELSE 4
  END,
  company_name;

-- Query 4: Check if "Narok Cement" is one of the non-active vendors
SELECT 
  id,
  company_name,
  email,
  status,
  phone,
  county
FROM public.vendors
WHERE (company_name ILIKE '%narok%' OR company_name ILIKE '%cement%')
ORDER BY company_name;

-- ============================================================================
-- SOLUTION: If the 2 vendors should be active, update them
-- ============================================================================

-- First, identify which vendors need to be updated from Query 2 above
-- Then update them to 'active' status:

/*
UPDATE public.vendors
SET status = 'active', updated_at = NOW()
WHERE status != 'active' OR status IS NULL;
*/

-- Or update specific vendors by ID:
/*
UPDATE public.vendors
SET status = 'active', updated_at = NOW()
WHERE id IN ('vendor-id-1', 'vendor-id-2');
*/

-- ============================================================================
-- VERIFICATION AFTER UPDATE
-- ============================================================================

-- Check count again
SELECT 
  status,
  COUNT(*) as count
FROM public.vendors
GROUP BY status;

-- Should now show: active = 13
