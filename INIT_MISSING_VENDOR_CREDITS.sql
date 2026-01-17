-- Initialize missing ZCC credits for vendors who don't have employer profiles yet
-- Run this in Supabase SQL Editor

-- STEP 1: Check which vendors have invalid user_ids (not in auth.users)
-- Run this first to see what vendors have issues
SELECT 
  v.id as vendor_id,
  v.name as vendor_name,
  v.user_id,
  CASE WHEN au.id IS NULL THEN 'INVALID USER_ID' ELSE 'Valid' END as user_id_status
FROM vendors v
LEFT JOIN auth.users au ON au.id = v.user_id
WHERE v.user_id IS NOT NULL
  AND au.id IS NULL
ORDER BY v.created_at DESC;

-- STEP 2: Create employer profiles ONLY for vendors with valid user_ids
INSERT INTO employer_profiles (
  id,
  company_name,
  company_email,
  vendor_id,
  is_vendor_employer,
  verification_level
)
SELECT 
  v.user_id,
  COALESCE(NULLIF(v.name, ''), 'Vendor ' || SUBSTRING(v.id::text, 1, 8)),
  COALESCE(v.email, ''),
  v.id,
  true,
  'verified'
FROM vendors v
INNER JOIN auth.users au ON au.id = v.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM employer_profiles ep WHERE ep.id = v.user_id
)
ON CONFLICT (id) DO NOTHING;

-- STEP 3: Create ZCC credits for employers that don't have them (2000 free credits)
INSERT INTO zcc_credits (
  employer_id,
  vendor_id,
  total_credits,
  used_credits,
  free_credits,
  purchased_credits
)
SELECT 
  ep.id,
  ep.vendor_id,
  2000,
  0,
  2000,
  0
FROM employer_profiles ep
WHERE ep.is_vendor_employer = true
  AND NOT EXISTS (
    SELECT 1 FROM zcc_credits zc WHERE zc.employer_id = ep.id
  )
ON CONFLICT (employer_id) DO NOTHING;

-- STEP 4: Verify the results
SELECT 
  v.id as vendor_id,
  v.name as vendor_name,
  v.user_id,
  ep.id as employer_id,
  COALESCE(ep.is_vendor_employer, false) as is_vendor_employer,
  COALESCE(zc.balance, 0) as credit_balance,
  COALESCE(zc.free_credits, 0) as free_credits,
  COALESCE(zc.purchased_credits, 0) as purchased_credits
FROM vendors v
LEFT JOIN auth.users au ON au.id = v.user_id
LEFT JOIN employer_profiles ep ON ep.id = v.user_id
LEFT JOIN zcc_credits zc ON zc.employer_id = ep.id
ORDER BY v.created_at DESC
LIMIT 20;
