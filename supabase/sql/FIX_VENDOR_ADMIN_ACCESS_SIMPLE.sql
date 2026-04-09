-- ============================================================================
-- VENDOR ADMIN ACCESS FIX - SIMPLIFIED VERSION (COPY THIS!)
-- ============================================================================
-- Date: January 15, 2026
-- Issue: Admin panel showing 11 vendors instead of 13
-- Fix: Add admin RLS policies to vendors table
-- Time: 30 seconds
-- ============================================================================

-- Step 1: Drop existing policies (if any)
DROP POLICY IF EXISTS "admins_select_all_vendors" ON public.vendors;
DROP POLICY IF EXISTS "admins_update_all_vendors" ON public.vendors;
DROP POLICY IF EXISTS "super_admins_delete_vendors" ON public.vendors;
DROP POLICY IF EXISTS "admins_insert_vendors" ON public.vendors;

-- Step 2: Create admin SELECT policy (THIS FIXES THE VENDOR COUNT ISSUE)
CREATE POLICY "admins_select_all_vendors" ON public.vendors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Step 3: Create admin UPDATE policy
CREATE POLICY "admins_update_all_vendors" ON public.vendors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Step 4: Create super admin DELETE policy
CREATE POLICY "super_admins_delete_vendors" ON public.vendors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'super_admin'
      AND admin_users.status = 'active'
    )
  );

-- Step 5: Create admin INSERT policy
CREATE POLICY "admins_insert_vendors" ON public.vendors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Step 6: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id_status 
ON public.admin_users(user_id, status)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_vendors_status 
ON public.vendors(status);

-- ============================================================================
-- DONE! Now test in admin panel at /admin/vendors
-- Expected: 13 active vendors including "Narok Cement"
-- ============================================================================
