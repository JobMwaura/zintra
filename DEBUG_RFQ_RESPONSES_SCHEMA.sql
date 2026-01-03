-- DEBUG: Check rfq_responses table structure
-- Run this in Supabase SQL Editor to see all columns and constraints

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'rfq_responses'
ORDER BY ordinal_position;

-- Check for any unique/foreign key constraints
SELECT
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'rfq_responses';

-- Check if there are any RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'rfq_responses'
  AND schemaname = 'public';
