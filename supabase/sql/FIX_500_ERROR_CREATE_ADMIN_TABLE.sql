-- ============================================================================
-- IMMEDIATE FIX FOR 500 ERROR - CREATE ADMIN_USERS TABLE
-- ============================================================================
-- Issue: Admin policies check admin_users table, but table doesn't exist
-- Result: 500 Internal Server Error on vendors endpoint
-- Solution: Create admin_users table OR drop admin policies
-- ============================================================================

-- OPTION A: CREATE ADMIN_USERS TABLE (RECOMMENDED)
-- This allows the admin policies to work properly
-- ============================================================================

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  permissions JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read admin_users (needed for policy checks)
DROP POLICY IF EXISTS "admin_users_select_all" ON public.admin_users;
CREATE POLICY "admin_users_select_all" ON public.admin_users
  FOR SELECT
  USING (true);

-- Allow admins to update their own record
DROP POLICY IF EXISTS "admin_users_update_own" ON public.admin_users;
CREATE POLICY "admin_users_update_own" ON public.admin_users
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow super admins to manage all admin users
DROP POLICY IF EXISTS "super_admins_manage_admins" ON public.admin_users;
CREATE POLICY "super_admins_manage_admins" ON public.admin_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'super_admin'
      AND admin_users.status = 'active'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON public.admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id_status ON public.admin_users(user_id, status) WHERE status = 'active';

-- Add yourself as super admin
INSERT INTO public.admin_users (user_id, email, role, status, created_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'jmwaura@strathmore.edu' LIMIT 1),
  'jmwaura@strathmore.edu',
  'super_admin',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET status = 'active', role = 'super_admin', updated_at = NOW();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check admin_users table was created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'admin_users';

-- Verify you're in the table
SELECT 
  user_id,
  email,
  role,
  status
FROM public.admin_users
WHERE email = 'jmwaura@strathmore.edu';

-- Test vendor access (should work now!)
SELECT COUNT(*) as total_vendors FROM public.vendors;
SELECT COUNT(*) as active_vendors FROM public.vendors WHERE status = 'active';

-- ============================================================================
-- EXPECTED RESULT:
-- After running this SQL:
-- 1. admin_users table created ✅
-- 2. You added as super_admin ✅
-- 3. Vendors query returns 13 ✅
-- 4. No more 500 error ✅
-- 5. Admin panel shows all vendors ✅
-- ============================================================================
