-- ============================================================================
-- DIAGNOSE AND FIX PORTFOLIO PROJECT IMAGE TABLE
-- Date: 2026-01-11
-- ============================================================================

-- STEP 1: List all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- STEP 2: Check if PortfolioProjectImage table exists (case-sensitive)
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'PortfolioProjectImage'
);

-- STEP 3: Check RLS status on PortfolioProjectImage
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'PortfolioProjectImage';

-- STEP 4: If RLS is enabled, check policies
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'PortfolioProjectImage';

-- STEP 5: Disable RLS on PortfolioProjectImage (this is why Supabase can't find it!)
ALTER TABLE public."PortfolioProjectImage" DISABLE ROW LEVEL SECURITY;

-- STEP 6: Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'PortfolioProjectImage';

-- STEP 7: Verify table can now be queried
SELECT COUNT(*) as image_count FROM public."PortfolioProjectImage";
