-- ============================================================================
-- FIXED: CREATE ADMIN_USERS TABLE AND ADD YOUR USER
-- ============================================================================
-- Previous error: Column order mismatch in INSERT statement
-- Fixed: Explicitly specify all column names in correct order
-- ============================================================================

-- Step 1: Create admin_users table (if not exists)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT
);

-- Step 2: Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policy to allow reading admin_users (needed for RLS policy checks)
DROP POLICY IF EXISTS "admin_users_select_all" ON public.admin_users;
CREATE POLICY "admin_users_select_all" ON public.admin_users
  FOR SELECT
  USING (true);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id_status 
ON public.admin_users(user_id, status)
WHERE status = 'active';

-- Step 5: Add yourself as super admin (FIXED - with explicit column names)
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
)
ON CONFLICT (user_id) DO UPDATE
SET 
  status = 'active', 
  role = 'super_admin',
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify table exists
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'admin_users'
ORDER BY ordinal_position;

-- Verify you're in the table
SELECT 
  id,
  user_id,
  email,
  role,
  status,
  created_at
FROM public.admin_users
WHERE email = 'jmwaura@strathmore.edu';

-- Test vendor access (should work now!)
SELECT COUNT(*) as total_vendors FROM public.vendors;
SELECT COUNT(*) as active_vendors FROM public.vendors WHERE status = 'active';

-- ============================================================================
-- SUCCESS!
-- After running this:
-- 1. admin_users table created ✅
-- 2. You added as super_admin ✅
-- 3. Vendors should load without 500 error ✅
-- 4. Refresh /admin/vendors to see all 13 vendors ✅
-- ============================================================================
