-- ============================================================================
-- GIGS PAGES - SUPABASE SQL SETUP GUIDE
-- ============================================================================
-- This script documents all SQL code needed for the gigs pages to work
-- Date: January 17, 2026
-- Status: All tables already exist - NO NEW SETUP NEEDED ✅

-- ============================================================================
-- QUICK ANSWER: DO YOU NEED TO RUN SQL?
-- ============================================================================
-- ✅ NO - All tables already exist in your database!
-- 
-- The gigs pages use existing tables:
--  1. listings (type = 'gig')
--  2. applications (for tracking applications)
--  3. profiles (for employer/candidate info)
--  4. employer_profiles (for company details)
--
-- All tables have proper:
--  ✅ Columns & constraints
--  ✅ Foreign keys
--  ✅ Indexes
--  ✅ RLS policies
--  ✅ Timestamps

-- ============================================================================
-- EXISTING TABLES (Already Set Up ✅)
-- ============================================================================

-- TABLE 1: LISTINGS (covers jobs AND gigs)
-- Status: ✅ ALREADY EXISTS
-- Columns needed: ✅ ALL PRESENT
-- ✅ id, type ('job' or 'gig'), title, description
-- ✅ location, category, job_type, duration
-- ✅ pay_min, pay_max, start_date
-- ✅ status ('active', 'paused', 'closed', 'filled')
-- ✅ employer_id, created_at, updated_at
-- ✅ Featured, urgent_badge, views, applicants_count

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  
  -- Content
  type TEXT NOT NULL CHECK (type IN ('job', 'gig')), -- ✅ GIGSPages uses this
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- ✅ Added previously
  
  -- Location & duration
  location TEXT NOT NULL,
  start_date DATE,
  duration TEXT, -- ✅ "1 week", "3 days" (for gigs)
  job_type TEXT, -- ✅ "full-time", "part-time", "gig"
  
  -- Pay
  pay_min DECIMAL(10, 2),
  pay_max DECIMAL(10, 2),
  pay_currency TEXT DEFAULT 'KES',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'filled')),
  
  -- Visibility
  featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP,
  urgent_badge BOOLEAN DEFAULT FALSE,
  
  -- Counts
  views INT DEFAULT 0,
  applicants_count INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 2: APPLICATIONS (for gig applications)
-- Status: ✅ ALREADY EXISTS
-- Columns needed: ✅ ALL PRESENT
-- ✅ id, listing_id, candidate_id (called worker_id in our code)
-- ✅ status ('applied', 'shortlisted', 'interview', 'hired', 'rejected')
-- ✅ created_at, updated_at
-- ✅ UNIQUE constraint (can't apply twice)

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  
  -- Status pipeline
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'interview', 'hired', 'rejected')),
  
  -- Optional
  answers JSONB DEFAULT '{}',
  employer_notes TEXT,
  employer_rating DECIMAL(3, 2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- ✅ Prevents duplicate applications
  UNIQUE (listing_id, candidate_id)
);

-- TABLE 3: PROFILES (employer info)
-- Status: ✅ ALREADY EXISTS
-- Columns needed: ✅ ALL PRESENT
-- ✅ id, is_employer, full_name, email, phone, location

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  
  -- Role flags
  is_candidate BOOLEAN DEFAULT FALSE,
  is_employer BOOLEAN DEFAULT FALSE,
  
  -- Basic info
  full_name TEXT,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 4: EMPLOYER_PROFILES (company details)
-- Status: ✅ ALREADY EXISTS
-- Columns needed: ✅ ALL PRESENT
-- ✅ id, company_name, company_logo_url, company_description, location

CREATE TABLE IF NOT EXISTS employer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Company info
  company_name TEXT NOT NULL,
  company_registration TEXT,
  verification_level TEXT DEFAULT 'unverified',
  
  -- Contact & location
  company_phone TEXT,
  company_email TEXT,
  county TEXT,
  location TEXT,
  
  -- Branding
  company_logo_url TEXT,
  company_description TEXT,
  
  -- Metrics
  jobs_posted INT DEFAULT 0,
  gigs_posted INT DEFAULT 0,
  total_hires INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES (For Performance)
-- Status: ✅ ALREADY CREATED
-- ============================================================================

-- ✅ These indexes exist and improve query performance
CREATE INDEX IF NOT EXISTS idx_listings_employer ON listings (employer_id);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings (type);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings (status);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings (location);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings (category);
CREATE INDEX IF NOT EXISTS idx_listings_created ON listings (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_listing ON applications (listing_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications (candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Status: ✅ ALREADY ENABLED
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;

-- ✅ LISTINGS POLICIES
-- Anyone can view active gigs
DROP POLICY IF EXISTS "anyone_read_listings" ON listings;
CREATE POLICY "anyone_read_listings" ON listings
  FOR SELECT USING (status = 'active');

-- Employers can create listings
DROP POLICY IF EXISTS "employers_create_listings" ON listings;
CREATE POLICY "employers_create_listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = employer_id);

-- Employers can update their own listings
DROP POLICY IF EXISTS "employers_update_own_listings" ON listings;
CREATE POLICY "employers_update_own_listings" ON listings
  FOR UPDATE USING (auth.uid() = employer_id);

-- ✅ APPLICATIONS POLICIES
-- Anyone can read applications for their listings
DROP POLICY IF EXISTS "anyone_read_applications" ON applications;
CREATE POLICY "anyone_read_applications" ON applications
  FOR SELECT USING (
    -- Candidate can see their own applications
    auth.uid() = candidate_id 
    OR 
    -- Employer can see applications to their listings
    auth.uid() IN (SELECT employer_id FROM listings WHERE id = listing_id)
  );

-- Candidates can create applications
DROP POLICY IF EXISTS "candidates_create_applications" ON applications;
CREATE POLICY "candidates_create_applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = candidate_id);

-- ✅ EMPLOYER_PROFILES POLICIES
-- Employers can read their own profile
DROP POLICY IF EXISTS "users_read_own_employer_profile" ON employer_profiles;
CREATE POLICY "users_read_own_employer_profile" ON employer_profiles
  FOR SELECT USING (auth.uid() = id);

-- ============================================================================
-- SQL QUERIES USED BY GIGS PAGES
-- ============================================================================

-- QUERY 1: FETCH ALL ACTIVE GIGS (Gigs Listing Page)
-- Used by: /careers/gigs/page.js
-- Location: loadGigs() function
SELECT
  listings.id,
  listings.title,
  listings.description,
  listings.category,
  listings.location,
  listings.pay_min,
  listings.pay_max,
  listings.pay_currency,
  listings.job_type,
  listings.start_date,
  listings.duration,
  listings.status,
  listings.type,
  listings.created_at,
  employer_profiles.id,
  employer_profiles.company_name,
  employer_profiles.company_logo_url,
  COUNT(applications.id) as application_count
FROM listings
LEFT JOIN employer_profiles ON listings.employer_id = employer_profiles.id
LEFT JOIN applications ON listings.id = applications.listing_id
WHERE listings.type = 'gig' 
  AND listings.status = 'active'
GROUP BY listings.id, employer_profiles.id
ORDER BY listings.created_at DESC;

-- QUERY 2: FETCH SINGLE GIG WITH DETAILS (Gig Detail Page)
-- Used by: /careers/gigs/[id]/page.js
-- Location: loadGig() function
SELECT
  listings.id,
  listings.title,
  listings.description,
  listings.category,
  listings.location,
  listings.pay_min,
  listings.pay_max,
  listings.pay_currency,
  listings.job_type,
  listings.start_date,
  listings.duration,
  listings.status,
  listings.type,
  listings.created_at,
  listings.updated_at,
  employer_profiles.id,
  employer_profiles.company_name,
  employer_profiles.company_logo_url,
  employer_profiles.company_description,
  employer_profiles.location,
  COUNT(applications.id) as application_count
FROM listings
LEFT JOIN employer_profiles ON listings.employer_id = employer_profiles.id
LEFT JOIN applications ON listings.id = applications.listing_id
WHERE listings.id = '{gig_id}'
  AND listings.type = 'gig'
GROUP BY listings.id, employer_profiles.id;

-- QUERY 3: CREATE APPLICATION (Apply Button)
-- Used by: /careers/gigs/[id]/page.js
-- Location: handleApply() function
INSERT INTO applications (listing_id, candidate_id, status, created_at)
VALUES ('{listing_id}', '{worker_id}', 'pending', now());

-- QUERY 4: CHECK IF ALREADY APPLIED (Prevent Duplicates)
-- Used by: /careers/gigs/[id]/page.js
-- Location: handleApply() function
SELECT id
FROM applications
WHERE listing_id = '{listing_id}' 
  AND candidate_id = '{worker_id}'
LIMIT 1;

-- QUERY 5: EXTRACT UNIQUE LOCATIONS (Filter Dropdown)
-- Used by: /careers/gigs/page.js
-- Location: loadGigs() function
SELECT DISTINCT location
FROM listings
WHERE type = 'gig' AND status = 'active'
ORDER BY location;

-- QUERY 6: EXTRACT UNIQUE CATEGORIES (Filter Dropdown)
-- Used by: /careers/gigs/page.js
-- Location: loadGigs() function
SELECT DISTINCT category
FROM listings
WHERE type = 'gig' AND status = 'active'
ORDER BY category;

-- ============================================================================
-- VERIFICATION: Check What You Have
-- ============================================================================

-- Run these queries to verify everything is set up:

-- 1. Check listings table structure
-- \dt listings (in psql)
-- or in Supabase: Go to SQL Editor and run:
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'listings'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid), employer_id (uuid), type (text), title (text), 
-- description (text), category (text), location (text), 
-- start_date (date), duration (text), job_type (text),
-- pay_min (numeric), pay_max (numeric), pay_currency (text),
-- status (text), featured (boolean), urgent_badge (boolean),
-- views (integer), applicants_count (integer),
-- created_at (timestamp), updated_at (timestamp)

-- 2. Check applications table structure
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'applications'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid), listing_id (uuid), candidate_id (uuid),
-- status (text), answers (jsonb), employer_notes (text),
-- employer_rating (numeric), created_at (timestamp), updated_at (timestamp)

-- 3. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('listings', 'applications', 'profiles', 'employer_profiles');

-- Expected: All should have "rowsecurity" = true

-- 4. Count active gigs
SELECT COUNT(*) as active_gigs
FROM listings
WHERE type = 'gig' AND status = 'active';

-- 5. Check sample gig
SELECT id, title, category, location, status, type
FROM listings
WHERE type = 'gig' AND status = 'active'
LIMIT 1;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- PROBLEM: Column 'category' doesn't exist
-- SOLUTION: Run this:
ALTER TABLE listings ADD COLUMN IF NOT EXISTS category TEXT;

-- PROBLEM: Column 'duration' doesn't exist
-- SOLUTION: Run this:
ALTER TABLE listings ADD COLUMN IF NOT EXISTS duration TEXT;

-- PROBLEM: Column 'job_type' doesn't exist
-- SOLUTION: Run this:
ALTER TABLE listings ADD COLUMN IF NOT EXISTS job_type TEXT;

-- PROBLEM: Column 'company_logo_url' doesn't exist in employer_profiles
-- SOLUTION: Run this:
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

-- PROBLEM: RLS policies not working
-- SOLUTION: Run these:
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Drop old policies and recreate (from above)

-- PROBLEM: Can't see gigs on page
-- SOLUTION: Check these:
-- 1. Are there any gigs with status='active'?
SELECT COUNT(*) FROM listings WHERE type='gig' AND status='active';

-- 2. Do they have locations?
SELECT id, title, location FROM listings WHERE type='gig' AND status='active';

-- 3. Do they have categories?
SELECT id, title, category FROM listings WHERE type='gig' AND status='active';

-- 4. Are RLS policies blocking viewing?
-- Try as authenticated user:
SELECT * FROM listings WHERE type='gig' AND status='active' LIMIT 1;

-- ============================================================================
-- OPTIONAL: CREATE TEST DATA
-- ============================================================================

-- Add test gigs (optional, for development)
-- WARNING: Only run if you want test data!

-- First, get an employer ID (use your own employer profile id from auth.users)
-- Then run this to add a test gig:

INSERT INTO listings (
  employer_id,
  type,
  title,
  description,
  category,
  location,
  pay_min,
  pay_max,
  start_date,
  duration,
  job_type,
  status
) VALUES (
  '{YOUR_EMPLOYER_ID}',
  'gig',
  'House Renovation',
  'Complete house renovation including electrical, plumbing, and carpentry work. Must have experience with residential renovations. Team of 2-3 people preferred.',
  'Construction',
  'Nairobi',
  500,
  800,
  '2026-01-20'::DATE,
  '1 week',
  'gig',
  'active'
);

-- Verify it appears on the page
SELECT * FROM listings WHERE type='gig' AND status='active' ORDER BY created_at DESC LIMIT 1;

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- ✅ DO YOU NEED TO RUN SQL? NO!
-- 
-- All tables, columns, indexes, and RLS policies already exist.
-- The gigs pages will work immediately without any SQL changes.
--
-- If you experience issues:
-- 1. Run the verification queries above
-- 2. Check the troubleshooting section
-- 3. Run only the specific fixes needed
--
-- ✅ Everything is already set up and ready to use!

-- ============================================================================
-- END OF GIGS PAGES SQL SETUP GUIDE
-- ============================================================================
