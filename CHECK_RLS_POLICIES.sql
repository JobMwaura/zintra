-- ============================================================================
-- CHECK RLS POLICIES ON PORTFOLIO TABLES
-- Date: 2026-01-11
-- ============================================================================

-- List all RLS policies on PortfolioProjectImage
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'PortfolioProjectImage';

-- List all RLS policies on PortfolioProject
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'PortfolioProject';
