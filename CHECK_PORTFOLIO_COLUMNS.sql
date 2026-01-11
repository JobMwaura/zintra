-- ============================================================================
-- CHECK ACTUAL COLUMN NAMES IN PORTFOLIO TABLES
-- Date: 2026-01-11
-- ============================================================================

-- List all columns and their exact names
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'PortfolioProject'
ORDER BY ordinal_position;
