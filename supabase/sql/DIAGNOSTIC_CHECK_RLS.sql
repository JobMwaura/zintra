-- ============================================================================
-- DIAGNOSTIC: Check Current RLS Policies on Messaging Tables
-- ============================================================================
-- Run this to see what policies are currently in place

-- Check vendor_messages policies
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'vendor_messages'
ORDER BY policyname;

-- Check notifications policies
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('vendor_messages', 'notifications')
ORDER BY tablename;
