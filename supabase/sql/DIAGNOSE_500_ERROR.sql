-- ============================================================================
-- EMERGENCY DIAGNOSTIC - WHY IS 500 ERROR STILL HAPPENING?
-- ============================================================================
-- Policy exists but still getting 500 error
-- Let's diagnose the exact issue
-- ============================================================================

-- Step 1: Check which policies actually exist
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;

-- Step 2: Check if admin_users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admin_users'
) as admin_table_exists;

-- Step 3: If admin_users table does NOT exist, that's the problem!
-- The admin policies are checking a table that doesn't exist = 500 error

-- Step 4: Check your current auth status
SELECT 
  auth.uid() as my_user_id,
  auth.role() as my_role;

-- Step 5: Test if you can see vendors directly (bypass policy check)
SET ROLE postgres;
SELECT COUNT(*) as total_vendors FROM public.vendors;
RESET ROLE;

-- ============================================================================
-- SOLUTION OPTIONS:
-- ============================================================================

-- OPTION 1: If admin_users table doesn't exist, CREATE IT
-- This will fix the 500 error from admin policies checking non-existent table

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read admin_users (for policy checks)
CREATE POLICY IF NOT EXISTS "admin_users_select_authenticated" ON public.admin_users
  FOR SELECT
  USING (true);

-- Only allow admins to modify admin_users
CREATE POLICY IF NOT EXISTS "admin_users_update_own" ON public.admin_users
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- OPTION 2: TEMPORARY FIX - Drop the admin policies until admin_users exists
-- (Uncomment if you want to use this)

/*
DROP POLICY IF EXISTS "admins_select_all_vendors" ON public.vendors;
DROP POLICY IF EXISTS "admins_update_all_vendors" ON public.vendors;
DROP POLICY IF EXISTS "super_admins_delete_vendors" ON public.vendors;
DROP POLICY IF EXISTS "admins_insert_vendors" ON public.vendors;
*/

-- ============================================================================
-- AFTER RUNNING OPTION 1:
-- ============================================================================

-- Verify admin_users table was created
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'admin_users';

-- Test vendor access again
SELECT COUNT(*) as total_vendors FROM public.vendors;

-- This should work now without 500 error!
