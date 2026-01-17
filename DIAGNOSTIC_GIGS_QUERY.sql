-- DIAGNOSTIC: Check what gigs exist in the database
-- Run this in Supabase SQL Editor to diagnose the gigs issue

-- Query 1: Count all listings by type and status
SELECT 
  type,
  status,
  COUNT(*) as count
FROM listings
GROUP BY type, status
ORDER BY type, status;

-- Query 2: Show all gigs (regardless of status)
SELECT 
  id,
  title,
  type,
  job_type,
  status,
  employer_id,
  created_at,
  (SELECT company_name FROM employer_profiles WHERE id = listings.employer_id) as employer_name
FROM listings
WHERE type = 'gig'
ORDER BY created_at DESC;

-- Query 3: Show all active gigs (what the page should fetch)
SELECT 
  id,
  title,
  type,
  job_type,
  status,
  employer_id,
  location,
  pay_min,
  pay_max,
  duration,
  start_date,
  created_at,
  (SELECT company_name FROM employer_profiles WHERE id = listings.employer_id) as employer_name
FROM listings
WHERE type = 'gig' AND status = 'active'
ORDER BY created_at DESC;

-- Query 4: Check if employer_profiles exist for Narok Cement Vendor
SELECT 
  id,
  company_name,
  company_registration,
  verification_level,
  created_at
FROM employer_profiles
WHERE company_name ILIKE '%narok%' OR company_name ILIKE '%cement%'
ORDER BY created_at DESC;

-- Query 5: Show all listings for Narok Cement (whatever type they have)
SELECT 
  id,
  title,
  type,
  job_type,
  status,
  created_at
FROM listings
WHERE employer_id IN (
  SELECT id FROM employer_profiles 
  WHERE company_name ILIKE '%narok%' OR company_name ILIKE '%cement%'
)
ORDER BY created_at DESC;

-- Query 6: Check what job_type values exist in database
SELECT DISTINCT job_type FROM listings ORDER BY job_type;

-- Query 7: Check what type values exist in database
SELECT DISTINCT type FROM listings ORDER BY type;

-- Query 8: Check what status values exist in database
SELECT DISTINCT status FROM listings ORDER BY status;
