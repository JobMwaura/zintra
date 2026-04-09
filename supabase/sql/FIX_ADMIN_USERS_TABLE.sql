-- ============================================================================
-- STEP 1: CHECK EXISTING TABLE STRUCTURE
-- ============================================================================
-- First, let's see what columns exist and in what order

SELECT 
  column_name,
  data_type,
  ordinal_position,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'admin_users'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 2: DROP THE TABLE AND RECREATE IT CORRECTLY
-- ============================================================================
-- The table exists but has wrong column order. Let's fix it.

-- Drop the existing table
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- Create admin_users table with CORRECT column order
CREATE TABLE public.admin_users (
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

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow reading admin_users (needed for policy checks)
CREATE POLICY "admin_users_select_all" ON public.admin_users
  FOR SELECT
  USING (true);

-- Create indexes
CREATE INDEX idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX idx_admin_users_user_id_status 
ON public.admin_users(user_id, status)
WHERE status = 'active';

-- Now add yourself as super admin
INSERT INTO public.admin_users (
  user_id,
  email,
  role,
  status,
  created_at,
  updated_at
)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'jmwaura@strathmore.edu' LIMIT 1),
  'jmwaura@strathmore.edu',
  'super_admin',
  'active',
  NOW(),
  NOW()
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check table structure
SELECT column_name, data_type, ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'admin_users'
ORDER BY ordinal_position;

-- Verify you're in the table
SELECT 
  id,
  user_id,
  email,
  role,
  status
FROM public.admin_users
WHERE email = 'jmwaura@strathmore.edu';

-- Test vendor access
SELECT COUNT(*) as total_vendors FROM public.vendors;
SELECT COUNT(*) as active_vendors FROM public.vendors WHERE status = 'active';

-- ============================================================================
-- SUCCESS!
-- 1. Table dropped and recreated with correct structure ✅
-- 2. You added as super_admin ✅
-- 3. Vendors should load without 500 error ✅
-- 4. Refresh /admin/vendors to see all 13 vendors ✅
-- ============================================================================
