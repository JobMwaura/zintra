-- ============================================================================
-- CHECK PORTFOLIO IMAGE COLUMNS
-- Date: 2026-01-11
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'PortfolioProjectImage'
ORDER BY ordinal_position;
