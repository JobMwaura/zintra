-- ============================================================================
-- VENDOR REPORTING & IMAGE MODERATION SYSTEM
-- ============================================================================
-- Purpose: Enable users to report vendors and admins to moderate content
-- Features: Report management, image moderation, vendor suspension, appeals
-- ============================================================================

-- Step 1: Create vendor_reports table
CREATE TABLE IF NOT EXISTS public.vendor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL, -- 'inappropriate_images' | 'fake_business' | 'scam' | 'offensive_content' | 'other'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  images_violated TEXT[], -- Array of image URLs or IDs that triggered report
  status TEXT DEFAULT 'pending', -- 'pending' | 'reviewed' | 'dismissed' | 'action_taken'
  severity TEXT DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
  
  -- Admin review info
  reviewed_by_admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  action_taken TEXT, -- 'none' | 'image_disabled' | 'images_deleted' | 'vendor_suspended' | 'vendor_banned'
  
  -- Appeal info
  appeal_requested BOOLEAN DEFAULT false,
  appeal_reason TEXT,
  appeal_reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create vendor_image_violations table
CREATE TABLE IF NOT EXISTS public.vendor_image_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  image_id UUID NOT NULL, -- Reference to image in vendor profile or products
  image_url TEXT NOT NULL,
  violation_reason TEXT NOT NULL, -- 'inappropriate' | 'misleading' | 'offensive' | 'violates_terms' | 'low_quality'
  violation_details TEXT,
  
  action_status TEXT DEFAULT 'pending', -- 'pending' | 'disabled' | 'deleted' | 'restored'
  disabled_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  restored_at TIMESTAMPTZ,
  
  -- Admin action
  action_by_admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action_timestamp TIMESTAMPTZ,
  admin_reason TEXT, -- Reason shown to vendor
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create vendor_suspensions table
CREATE TABLE IF NOT EXISTS public.vendor_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL UNIQUE REFERENCES public.vendors(id) ON DELETE CASCADE,
  suspension_reason TEXT NOT NULL,
  suspension_type TEXT DEFAULT 'temporary', -- 'temporary' | 'permanent'
  suspension_duration_days INTEGER DEFAULT 30, -- NULL for permanent
  
  -- Admin action
  suspended_by_admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE SET NULL,
  suspended_at TIMESTAMPTZ DEFAULT NOW(),
  suspension_end_date TIMESTAMPTZ,
  
  -- Appeal process
  appeal_submitted BOOLEAN DEFAULT false,
  appeal_submitted_at TIMESTAMPTZ,
  appeal_message TEXT,
  appeal_reviewed_at TIMESTAMPTZ,
  appeal_approved BOOLEAN,
  appeal_reviewed_by_admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  
  -- Unsuspension
  unsuspended_at TIMESTAMPTZ,
  unsuspended_by_admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  unsuspension_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create vendor_appeal_history table (for tracking appeals)
CREATE TABLE IF NOT EXISTS public.vendor_appeal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  suspension_id UUID REFERENCES public.vendor_suspensions(id) ON DELETE CASCADE,
  appeal_message TEXT NOT NULL,
  appeal_evidence TEXT[], -- Array of URLs to evidence/documents
  
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'denied'
  reviewed_by_admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_decision TEXT,
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create moderation_queue table
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.vendor_reports(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  queue_type TEXT NOT NULL, -- 'report' | 'appeal' | 'image_violation'
  priority TEXT DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
  
  status TEXT DEFAULT 'pending', -- 'pending' | 'in_review' | 'completed'
  assigned_to_admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_reports_status ON public.vendor_reports(status);
CREATE INDEX IF NOT EXISTS idx_vendor_reports_vendor_id ON public.vendor_reports(reported_vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reports_created_at ON public.vendor_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_reports_severity ON public.vendor_reports(severity);

CREATE INDEX IF NOT EXISTS idx_vendor_image_violations_vendor_id ON public.vendor_image_violations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_image_violations_status ON public.vendor_image_violations(action_status);
CREATE INDEX IF NOT EXISTS idx_vendor_image_violations_created_at ON public.vendor_image_violations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_suspensions_vendor_id ON public.vendor_suspensions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_suspensions_active ON public.vendor_suspensions(suspension_end_date) WHERE unsuspended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON public.moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON public.moderation_queue(priority);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_assigned ON public.moderation_queue(assigned_to_admin_id);

-- Step 7: Enable RLS on new tables
ALTER TABLE public.vendor_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_image_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_appeal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

-- Step 8: RLS Policies for vendor_reports
-- Users can view their own reports
CREATE POLICY "users_view_own_reports" ON public.vendor_reports
FOR SELECT
USING (reporter_user_id = auth.uid());

-- Admins can view all reports
CREATE POLICY "admins_view_all_reports" ON public.vendor_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- Users can create reports
CREATE POLICY "users_create_reports" ON public.vendor_reports
FOR INSERT
WITH CHECK (auth.uid()::uuid = reporter_user_id);

-- Only admins can update reports
CREATE POLICY "admins_update_reports" ON public.vendor_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- Step 9: RLS Policies for vendor_image_violations
-- Admins can view and manage violations
CREATE POLICY "admins_manage_violations" ON public.vendor_image_violations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- Vendors can view violations on their own images
CREATE POLICY "vendors_view_own_violations" ON public.vendor_image_violations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_id AND v.user_id = auth.uid()
  )
);

-- Step 10: RLS Policies for vendor_suspensions
-- Admins can manage suspensions
CREATE POLICY "admins_manage_suspensions" ON public.vendor_suspensions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- Vendors can view their own suspension
CREATE POLICY "vendors_view_own_suspension" ON public.vendor_suspensions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_id AND v.user_id = auth.uid()
  )
);

-- Step 11: RLS Policies for vendor_appeal_history
-- Admins can view and manage appeals
CREATE POLICY "admins_manage_appeals" ON public.vendor_appeal_history
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- Vendors can view and create their own appeals
CREATE POLICY "vendors_manage_own_appeals" ON public.vendor_appeal_history
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_id AND v.user_id = auth.uid()
  )
);

-- Step 12: RLS Policies for moderation_queue
-- Only admins can view and manage queue
CREATE POLICY "admins_manage_queue" ON public.moderation_queue
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- Step 13: Create trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_moderation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vendor_reports_timestamp ON public.vendor_reports;
CREATE TRIGGER update_vendor_reports_timestamp
BEFORE UPDATE ON public.vendor_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_moderation_timestamp();

DROP TRIGGER IF EXISTS update_vendor_image_violations_timestamp ON public.vendor_image_violations;
CREATE TRIGGER update_vendor_image_violations_timestamp
BEFORE UPDATE ON public.vendor_image_violations
FOR EACH ROW
EXECUTE FUNCTION public.update_moderation_timestamp();

DROP TRIGGER IF EXISTS update_vendor_suspensions_timestamp ON public.vendor_suspensions;
CREATE TRIGGER update_vendor_suspensions_timestamp
BEFORE UPDATE ON public.vendor_suspensions
FOR EACH ROW
EXECUTE FUNCTION public.update_moderation_timestamp();

DROP TRIGGER IF EXISTS update_moderation_queue_timestamp ON public.moderation_queue;
CREATE TRIGGER update_moderation_queue_timestamp
BEFORE UPDATE ON public.moderation_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_moderation_timestamp();

-- Step 14: Create function to check if vendor is suspended
CREATE OR REPLACE FUNCTION public.is_vendor_suspended(vendor_id_param UUID)
RETURNS TABLE (is_suspended BOOLEAN, suspension_reason TEXT, can_appeal BOOLEAN, suspension_end_date TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN vs.id IS NOT NULL AND vs.unsuspended_at IS NULL 
        AND (vs.suspension_end_date IS NULL OR vs.suspension_end_date > NOW())
      THEN true
      ELSE false
    END as is_suspended,
    vs.suspension_reason,
    CASE 
      WHEN vs.id IS NOT NULL AND vs.unsuspended_at IS NULL AND vs.appeal_submitted = false
      THEN true
      ELSE false
    END as can_appeal,
    vs.suspension_end_date
  FROM public.vendor_suspensions vs
  WHERE vs.vendor_id = vendor_id_param
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Step 15: Create function to auto-check suspension on vendor login
CREATE OR REPLACE FUNCTION public.check_vendor_suspension_status()
RETURNS TABLE (is_suspended BOOLEAN, reason TEXT, end_date TIMESTAMPTZ) AS $$
DECLARE
  vendor_id_var UUID;
BEGIN
  -- Get vendor ID from current user
  SELECT id INTO vendor_id_var FROM public.vendors WHERE user_id = auth.uid() LIMIT 1;
  
  IF vendor_id_var IS NULL THEN
    RETURN QUERY SELECT false::BOOLEAN, 'Not a vendor'::TEXT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    CASE 
      WHEN vs.id IS NOT NULL AND vs.unsuspended_at IS NULL 
        AND (vs.suspension_end_date IS NULL OR vs.suspension_end_date > NOW())
      THEN true
      ELSE false
    END,
    COALESCE(vs.suspension_reason, 'Account suspended due to policy violations'),
    vs.suspension_end_date
  FROM public.vendor_suspensions vs
  WHERE vs.vendor_id = vendor_id_var;
END;
$$ LANGUAGE plpgsql;

-- Step 16: Create audit logging for moderation actions
CREATE OR REPLACE FUNCTION public.log_moderation_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Log to admin_action_logs when reports are reviewed or actions are taken
  IF TG_OP = 'UPDATE' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.action_taken IS DISTINCT FROM OLD.action_taken) THEN
    INSERT INTO public.admin_action_logs (admin_user_id, action_type, target_admin_id, changes)
    VALUES (
      auth.uid()::uuid,
      'moderation_action',
      NEW.reviewed_by_admin_id,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'action', NEW.action_taken)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_moderation_actions ON public.vendor_reports;
CREATE TRIGGER log_moderation_actions
AFTER UPDATE ON public.vendor_reports
FOR EACH ROW
EXECUTE FUNCTION public.log_moderation_action();

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 1. Created vendor_reports table:
--    - Report types: inappropriate_images | fake_business | scam | offensive_content | other
--    - Status tracking: pending | reviewed | dismissed | action_taken
--    - Severity levels: low | medium | high | critical
--    - Admin review and notes
--    - Appeal system
--
-- 2. Created vendor_image_violations table:
--    - Track which images violate policies
--    - Actions: disabled | deleted | restored
--    - Admin reasons for actions
--    - Timeline of violations
--
-- 3. Created vendor_suspensions table:
--    - Temporary and permanent suspensions
--    - Duration tracking
--    - Appeal process
--    - Auto-unsuspension for temporary
--
-- 4. Created vendor_appeal_history table:
--    - Track all appeals from vendors
--    - Evidence submission
--    - Admin decision tracking
--
-- 5. Created moderation_queue table:
--    - Priority-based queue for admins
--    - Assignment tracking
--    - Status management
--
-- 6. Created helper functions:
--    - is_vendor_suspended() - Check suspension status
--    - check_vendor_suspension_status() - For login checks
--    - log_moderation_action() - Audit logging
--
-- 7. Implemented RLS policies:
--    - Users can report vendors
--    - Admins can manage all moderation
--    - Vendors can view their violations/suspensions
--
-- ============================================================================
