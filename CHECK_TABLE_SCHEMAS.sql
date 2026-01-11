-- ============================================================================
-- CHECK PORTFOLIO TABLE SCHEMAS
-- Date: 2026-01-11
-- ============================================================================

-- Check PortfolioProject table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'PortfolioProject'
ORDER BY ordinal_position;

-- Check PortfolioProjectImage table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'PortfolioProjectImage'
ORDER BY ordinal_position;
