-- ============================================================================
-- LIST ALL TABLES IN PUBLIC SCHEMA
-- Date: 2026-01-11
-- ============================================================================

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
