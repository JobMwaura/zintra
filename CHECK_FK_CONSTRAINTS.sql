-- ============================================================================
-- CHECK FOREIGN KEY CONSTRAINTS
-- Date: 2026-01-11
-- ============================================================================

-- Check all foreign key constraints on PortfolioProjectImage table
SELECT 
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_name = kcu.table_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'PortfolioProjectImage';

-- Check PortfolioProject table ID type
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'PortfolioProject'
  AND column_name = 'id';
