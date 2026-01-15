-- ============================================================================
-- SUPABASE SCHEMA VERIFICATION & MISSING TABLES
-- ============================================================================
-- This file checks what needs to be added to Supabase for the new admin pages
-- ============================================================================

-- CHECK 1: Admin Roles System
-- Required for: /admin/roles page
-- Status: ✅ SQL file exists (ADMIN_MANAGEMENT_SYSTEM.sql)
-- Action: NEEDS TO BE EXECUTED IN SUPABASE

/*
The following tables need to exist:
1. admin_users (with role column) - Already exists, needs ALTER
2. admin_roles - Needs to be created
3. admin_action_logs - Needs to be created
*/

-- Run this in Supabase SQL Editor:
-- File: supabase/sql/ADMIN_MANAGEMENT_SYSTEM.sql
-- This will add:
--   - role column to admin_users (super_admin, admin, moderator)
--   - admin_roles table for permission management
--   - admin_action_logs table for audit trail
--   - RLS policies for security

-- CHECK 2: Settings Table
-- Required for: /admin/settings page
-- Status: ❌ NO SQL FILE - NEEDS TO BE CREATED

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  setting_type TEXT DEFAULT 'general' CHECK (setting_type IN ('general', 'email', 'system', 'security')),
  description TEXT,
  updated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_type ON public.platform_settings(setting_type);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can read/write settings
CREATE POLICY "Admins can manage settings"
  ON public.platform_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Insert default settings
INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description) VALUES
  ('site_name', '"Zintra Platform"'::jsonb, 'general', 'Platform display name'),
  ('maintenance_mode', 'false'::jsonb, 'general', 'Enable/disable maintenance mode'),
  ('allow_new_vendors', 'true'::jsonb, 'general', 'Allow new vendor registration'),
  ('require_email_verification', 'true'::jsonb, 'email', 'Require email verification for users'),
  ('enable_notifications', 'true'::jsonb, 'email', 'Send email notifications'),
  ('max_upload_size', '10'::jsonb, 'system', 'Maximum file upload size in MB'),
  ('session_timeout', '30'::jsonb, 'system', 'User session timeout in minutes')
ON CONFLICT (setting_key) DO NOTHING;

-- CHECK 3: Existing Tables Status
-- The following tables ALREADY EXIST and are being used:
-- ✅ categories - Used by /admin/categories
-- ✅ vendor_products - Used by /admin/products
-- ✅ reviews - Used by /admin/testimonials
-- ✅ vendor_portfolio_projects - Used by /admin/projects
-- ✅ conversations - Used by /admin/messages
-- ✅ messages - Used by /admin/messages
-- ✅ vendors - Used by /admin/reports
-- ✅ rfq_requests - Used by /admin/reports
-- ✅ users - Used by /admin/reports

-- ============================================================================
-- MIGRATION CHECKLIST
-- ============================================================================

/*
TO DEPLOY THE NEW ADMIN PAGES, RUN THESE IN ORDER:

1. ✅ Run ADMIN_MANAGEMENT_SYSTEM.sql (for /admin/roles)
   - Adds role column to admin_users
   - Creates admin_roles table
   - Creates admin_action_logs table
   - Sets up RLS policies

2. ✅ Run the platform_settings creation above (for /admin/settings)
   - Creates platform_settings table
   - Inserts default settings
   - Sets up RLS policies

3. ❌ No migration needed for /admin/messages (tables exist)

4. ❌ No migration needed for /admin/reports (queries existing tables)

COMMANDS TO RUN IN SUPABASE SQL EDITOR:

Step 1: Copy and paste contents of:
  supabase/sql/ADMIN_MANAGEMENT_SYSTEM.sql

Step 2: Copy and paste the platform_settings creation above

Step 3: Verify all tables exist:
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN (
    'admin_users', 'admin_roles', 'admin_action_logs', 
    'platform_settings', 'conversations', 'messages'
  );

Expected result: All 6 tables should be listed.
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if admin_users has role column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
AND column_name IN ('role', 'status', 'permissions');

-- Check if admin_roles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admin_roles'
);

-- Check if platform_settings table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'platform_settings'
);

-- Count admin users by role
SELECT role, COUNT(*) 
FROM public.admin_users 
GROUP BY role;

-- View platform settings
SELECT setting_key, setting_value, setting_type 
FROM public.platform_settings 
ORDER BY setting_type, setting_key;
