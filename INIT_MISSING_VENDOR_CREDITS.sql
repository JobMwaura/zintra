-- Initialize missing ZCC credits for vendors who don't have employer profiles yet
-- Run this in Supabase SQL Editor

-- 1. Create employer profiles for vendors that don't have them
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
  v.name,
  v.email,
  v.id,
  true,
  'verified'
FROM vendors v
WHERE NOT EXISTS (
  SELECT 1 FROM employer_profiles ep WHERE ep.id = v.user_id
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create ZCC credits for employers that don't have them (2000 free credits for vendors)
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

-- 3. Verify the data
SELECT 
  v.id as vendor_id,
  v.name as vendor_name,
  v.user_id,
  ep.id as employer_id,
  ep.is_vendor_employer,
  zc.balance as credit_balance,
  zc.free_credits,
  zc.purchased_credits
FROM vendors v
LEFT JOIN employer_profiles ep ON ep.id = v.user_id
LEFT JOIN zcc_credits zc ON zc.employer_id = ep.id
ORDER BY v.created_at DESC
LIMIT 20;
