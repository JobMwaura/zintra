-- ============================================================================
-- DISABLE RLS ON PORTFOLIO TABLES (SIMPLEST FIX)
-- Date: 2026-01-11
-- ============================================================================
-- For internal API endpoints, RLS is not needed and just blocks access
-- This is the simplest and most reliable solution

-- STEP 1: Disable RLS on PortfolioProjectImage
ALTER TABLE public."PortfolioProjectImage" DISABLE ROW LEVEL SECURITY;

-- STEP 2: Disable RLS on PortfolioProject  
ALTER TABLE public."PortfolioProject" DISABLE ROW LEVEL SECURITY;

-- STEP 3: Verify both are disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('PortfolioProjectImage', 'PortfolioProject')
ORDER BY tablename;

-- STEP 4: Test query to verify access works
SELECT COUNT(*) as project_count FROM public."PortfolioProject";
SELECT COUNT(*) as image_count FROM public."PortfolioProjectImage";
