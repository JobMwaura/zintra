-- ============================================================================
-- SUPABASE MIGRATION: Fix Foreign Key Constraint for rfq_requests
-- Date: 2026-01-03
-- ============================================================================

-- First, let's check what constraints exist on rfq_requests
SELECT constraint_name, constraint_type, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public' AND table_name = 'rfq_requests';

-- Check foreign key constraints specifically
SELECT 
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.referential_constraints
WHERE table_schema = 'public' AND table_name = 'rfq_requests';

-- List all tables to understand the schema
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Check vendor-related tables
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('vendors', 'vendor_profiles')
ORDER BY table_name, ordinal_position;
