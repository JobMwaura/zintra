-- Diagnostic: Check actual table structures
-- Run this to see what columns actually exist

-- Check messages table columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Check vendor_messages table columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'vendor_messages'
ORDER BY ordinal_position;

-- Check conversations table columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;
