-- DEBUG SCRIPT: Check RLS policies on vendors table
-- Run this in Supabase SQL Editor to diagnose the redirect issue

-- 1. Check if vendors table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'vendors' AND table_schema = 'public'
) as "vendors_table_exists";

-- 2. Check RLS status for vendors table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'vendors' AND schemaname = 'public';

-- 3. List all RLS policies on vendors table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'vendors' AND schemaname = 'public'
ORDER BY policyname;

-- 4. Check vendor records in database
SELECT 
  id,
  user_id,
  company_name,
  phone_verified,
  email_verified,
  created_at
FROM public.vendors
LIMIT 10;

-- 5. Check if current authenticated user can query vendors
-- This will FAIL if RLS blocks it
SELECT 
  id,
  company_name,
  phone_verified,
  email_verified
FROM public.vendors
WHERE user_id = auth.uid()
LIMIT 1;

-- 6. Debug: Check auth context
SELECT auth.uid() as "current_user_id", auth.jwt() as "jwt_claims";

-- 7. Sample of profiles that are employers
SELECT 
  id,
  is_employer,
  created_at
FROM public.profiles
WHERE is_employer = true
LIMIT 5;

-- 8. Check if there are vendor records for employer profiles
SELECT 
  p.id as profile_id,
  p.is_employer,
  v.id as vendor_id,
  v.company_name,
  v.phone_verified,
  v.email_verified
FROM public.profiles p
LEFT JOIN public.vendors v ON p.id = v.user_id
WHERE p.is_employer = true
LIMIT 10;
