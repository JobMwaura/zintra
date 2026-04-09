-- ============================================================================
-- ADMIN PANEL FIXES - DATABASE MIGRATIONS
-- ============================================================================
-- Date: January 15, 2026
-- Purpose: Add missing columns and tables for admin panel fixes
-- ============================================================================

-- MIGRATION 1: Add Flag Columns to Reviews Table
-- Required for: Testimonials flag fake reviews feature
-- ============================================================================

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- Create index for performance (partial index - only flagged reviews)
CREATE INDEX IF NOT EXISTS idx_reviews_is_flagged 
ON public.reviews(is_flagged) WHERE is_flagged = true;

-- Create index for flagged_at for sorting
CREATE INDEX IF NOT EXISTS idx_reviews_flagged_at 
ON public.reviews(flagged_at) WHERE flagged_at IS NOT NULL;

COMMENT ON COLUMN public.reviews.is_flagged IS 'Admin flagged this review as fake/spam';
COMMENT ON COLUMN public.reviews.flagged_at IS 'Timestamp when review was flagged';
COMMENT ON COLUMN public.reviews.flagged_by IS 'Admin user who flagged the review';
COMMENT ON COLUMN public.reviews.flag_reason IS 'Reason for flagging (optional)';

-- ============================================================================
-- MIGRATION 2: Security Audit Logs Table (OPTIONAL - Future Enhancement)
-- Required for: Security settings page advanced features
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_success',
    'login_failed',
    'logout',
    'password_reset',
    'suspicious_activity',
    'ip_blocked',
    'session_expired',
    'unauthorized_access',
    'admin_action',
    'security_setting_changed'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at 
ON public.security_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type 
ON public.security_audit_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id 
ON public.security_audit_logs(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_severity 
ON public.security_audit_logs(severity) WHERE severity IN ('error', 'critical');

COMMENT ON TABLE public.security_audit_logs IS 'Security audit trail for admin panel';

-- Enable RLS
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only super_admins can view security logs
CREATE POLICY "Super admins can view security logs"
  ON public.security_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'super_admin'
      AND admin_users.status = 'active'
    )
  );

-- RLS Policy: System can insert logs (service role)
CREATE POLICY "System can insert security logs"
  ON public.security_audit_logs
  FOR INSERT
  WITH CHECK (true); -- Allow service role to insert

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if flag columns were added to reviews
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'reviews' 
AND column_name IN ('is_flagged', 'flagged_at', 'flagged_by', 'flag_reason');
-- Expected: 4 rows

-- Check if security_audit_logs table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'security_audit_logs';
-- Expected: 1 row

-- Count flagged reviews (should be 0 initially)
SELECT COUNT(*) as flagged_reviews_count
FROM public.reviews 
WHERE is_flagged = true;

-- View all indexes on reviews table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'reviews' 
AND schemaname = 'public'
ORDER BY indexname;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To remove flag columns from reviews:
-- ALTER TABLE public.reviews 
-- DROP COLUMN IF EXISTS is_flagged,
-- DROP COLUMN IF EXISTS flagged_at,
-- DROP COLUMN IF EXISTS flagged_by,
-- DROP COLUMN IF EXISTS flag_reason;

-- To remove security_audit_logs table:
-- DROP TABLE IF EXISTS public.security_audit_logs CASCADE;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
MIGRATION 1 (Flag Reviews) - REQUIRED
- Adds 4 new columns to reviews table
- Creates performance indexes
- No breaking changes to existing data
- Safe to run in production

MIGRATION 2 (Security Logs) - OPTIONAL
- Creates new table for future security features
- Not required for current admin panel functionality
- Can be added later when implementing advanced security features

EXECUTION ORDER:
1. Run Migration 1 (required for testimonials flag feature)
2. Run Migration 2 (optional, for future security enhancements)
3. Run verification queries to confirm success

DEPLOYMENT:
- No downtime required
- Backward compatible
- Existing reviews continue to work normally
*/
