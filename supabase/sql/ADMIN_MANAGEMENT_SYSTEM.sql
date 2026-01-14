-- ============================================================================
-- ADMIN MANAGEMENT SYSTEM - ROLE-BASED ACCESS CONTROL
-- ============================================================================
-- Purpose: Enable super admins to manage other admins with different roles
-- Roles: super_admin (all rights) | admin (vendor/RFQ management) | moderator (content review)
-- ============================================================================

-- Step 1: Alter admin_users table to add role and status columns
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 2: Create audit log table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'add_admin', 'remove_admin', 'update_role', 'suspend_admin', etc.
  target_admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  changes JSONB, -- Track what was changed
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create admin roles table for permission management
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb, -- List of permissions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON public.admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin_id ON public.admin_action_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created_at ON public.admin_action_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_roles_name ON public.admin_roles(role_name);

-- Step 5: Insert default roles and their permissions
INSERT INTO public.admin_roles (role_name, description, permissions) VALUES
  (
    'super_admin',
    'Super Administrator with all permissions',
    '{
      "vendors": {
        "view": true,
        "approve": true,
        "reject": true,
        "suspend": true,
        "delete": true
      },
      "rfqs": {
        "view": true,
        "approve": true,
        "reject": true,
        "close": true,
        "delete": true
      },
      "users": {
        "view": true,
        "suspend": true,
        "ban": true,
        "delete": true
      },
      "admin": {
        "add_admin": true,
        "remove_admin": true,
        "edit_role": true,
        "suspend_admin": true,
        "view_logs": true
      },
      "subscriptions": {
        "create_plan": true,
        "edit_plan": true,
        "delete_plan": true,
        "manage": true
      },
      "categories": {
        "create": true,
        "edit": true,
        "delete": true
      },
      "reports": {
        "view": true,
        "export": true
      }
    }'::jsonb
  ),
  (
    'admin',
    'Administrator with vendor and RFQ management',
    '{
      "vendors": {
        "view": true,
        "approve": true,
        "reject": true,
        "suspend": true,
        "delete": false
      },
      "rfqs": {
        "view": true,
        "approve": true,
        "reject": true,
        "close": true,
        "delete": false
      },
      "users": {
        "view": true,
        "suspend": true,
        "ban": false,
        "delete": false
      },
      "admin": {
        "add_admin": false,
        "remove_admin": false,
        "edit_role": false,
        "suspend_admin": false,
        "view_logs": false
      },
      "subscriptions": {
        "create_plan": false,
        "edit_plan": false,
        "delete_plan": false,
        "manage": false
      },
      "categories": {
        "create": false,
        "edit": false,
        "delete": false
      },
      "reports": {
        "view": true,
        "export": false
      }
    }'::jsonb
  ),
  (
    'moderator',
    'Content moderator with review-only permissions',
    '{
      "vendors": {
        "view": true,
        "approve": false,
        "reject": false,
        "suspend": false,
        "delete": false
      },
      "rfqs": {
        "view": true,
        "approve": false,
        "reject": false,
        "close": false,
        "delete": false
      },
      "users": {
        "view": true,
        "suspend": false,
        "ban": false,
        "delete": false
      },
      "admin": {
        "add_admin": false,
        "remove_admin": false,
        "edit_role": false,
        "suspend_admin": false,
        "view_logs": false
      },
      "subscriptions": {
        "create_plan": false,
        "edit_plan": false,
        "delete_plan": false,
        "manage": false
      },
      "categories": {
        "create": false,
        "edit": false,
        "delete": false
      },
      "reports": {
        "view": true,
        "export": false
      }
    }'::jsonb
  )
ON CONFLICT (role_name) DO NOTHING;

-- Step 6: Enable RLS on all new tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS Policies for admin_users
-- Super admins can manage all admins
CREATE POLICY "super_admins_manage_all" ON public.admin_users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.status = 'active'
  )
);

-- Admins can view other admins (but not edit)
CREATE POLICY "admins_view_other_admins" ON public.admin_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- Users can view their own admin record
CREATE POLICY "users_view_own_admin_record" ON public.admin_users
FOR SELECT
USING (user_id = auth.uid());

-- Public can't access
CREATE POLICY "deny_public_access" ON public.admin_users
FOR ALL
USING (false)
WITH CHECK (false);

-- Step 8: Create RLS Policies for admin_action_logs
-- Only admins and above can view logs
CREATE POLICY "admins_view_logs" ON public.admin_action_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- Only super admins can insert logs (via triggers)
CREATE POLICY "super_admins_insert_logs" ON public.admin_action_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.status = 'active'
  )
);

-- Step 9: Create RLS Policies for admin_roles
-- All admins can view roles
CREATE POLICY "admins_view_roles" ON public.admin_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- Only super admins can modify roles
CREATE POLICY "super_admins_manage_roles" ON public.admin_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.status = 'active'
  )
);

-- Step 10: Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_admin_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create trigger on admin_users table
DROP TRIGGER IF EXISTS update_admin_users_timestamp ON public.admin_users;
CREATE TRIGGER update_admin_users_timestamp
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_admin_users_timestamp();

-- Step 12: Create trigger function for audit logging
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_action_logs (admin_user_id, action_type, changes)
    VALUES (auth.uid()::uuid, 'add_admin', row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.admin_action_logs (admin_user_id, action_type, target_admin_id, changes)
    VALUES (auth.uid()::uuid, 'update_admin', NEW.id, jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_action_logs (admin_user_id, action_type, target_admin_id, changes)
    VALUES (auth.uid()::uuid, 'remove_admin', OLD.id, row_to_json(OLD));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 13: Create trigger on admin_users for audit logging
DROP TRIGGER IF EXISTS log_admin_changes ON public.admin_users;
CREATE TRIGGER log_admin_changes
AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.log_admin_action();

-- Step 14: Verification queries
-- Run these to verify setup:
-- SELECT COUNT(*) FROM public.admin_roles; -- Should return 3
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'admin_users';
-- SELECT policyname FROM pg_policies WHERE tablename = 'admin_users';

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 1. Enhanced admin_users table with:
--    - role column: super_admin | admin | moderator
--    - status column: active | inactive | suspended
--    - permissions JSONB for granular control
--    - created_by and updated_at for audit trail
-- 2. Created admin_roles table with detailed permissions per role
-- 3. Created admin_action_logs for complete audit trail
-- 4. Implemented role-based RLS policies
-- 5. Added triggers for automatic audit logging
-- ============================================================================
