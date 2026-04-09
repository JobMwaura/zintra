-- ============================================================================
-- EMERGENCY FIX - RESTORE VENDOR ACCESS IMMEDIATELY
-- ============================================================================
-- Issue: All vendors disappeared after adding admin policies
-- Cause: User not in admin_users table, RLS blocking all access
-- Solution: Temporarily allow authenticated users OR add user to admin_users
-- ============================================================================

-- OPTION 1: QUICK FIX - Add back the authenticated user policy (RECOMMENDED)
-- This will restore vendor visibility for all authenticated users

DROP POLICY IF EXISTS "vendors_select_authenticated" ON public.vendors;

CREATE POLICY "vendors_select_authenticated" ON public.vendors
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- This policy allows ANY authenticated user to view vendors
-- Combined with admin policies, both admins and regular users can see vendors

-- ============================================================================
-- OPTION 2: Add your user to admin_users table
-- ============================================================================

-- First, check if admin_users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admin_users'
) as admin_table_exists;

-- If admin_users table exists, add yourself as admin
-- Replace 'your-user-id-here' with your actual auth.uid()

-- Get your current user ID:
SELECT auth.uid() as my_user_id;

-- Then insert yourself into admin_users (uncomment and run):
/*
INSERT INTO public.admin_users (user_id, email, role, status, created_at, updated_at)
VALUES (
  auth.uid(),
  'jmwaura@strathmore.edu',
  'super_admin',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET status = 'active', role = 'super_admin', updated_at = NOW();
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check all policies on vendors table
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;

-- Test vendor access
SELECT COUNT(*) as vendor_count FROM public.vendors;

-- Check if you're in admin_users
SELECT * FROM public.admin_users WHERE user_id = auth.uid();
