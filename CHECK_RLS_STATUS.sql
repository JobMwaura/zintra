-- ============================================================================
-- CHECK RLS STATUS ON PORTFOLIO TABLES
-- Date: 2026-01-11
-- ============================================================================

-- Check if RLS is enabled or disabled on both tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('PortfolioProjectImage', 'PortfolioProject')
ORDER BY tablename;

-- If rowsecurity = true, RLS is ENABLED (blocking access)
-- If rowsecurity = false, RLS is DISABLED (allowing access)
