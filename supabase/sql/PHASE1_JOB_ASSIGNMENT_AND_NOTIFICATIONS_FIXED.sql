-- Phase 1: Job Assignment & Notifications System (FIXED FOR ZINTRA)
-- This migration creates the foundation for marketplace job assignment and real-time notifications
-- IMPORTANT: This version works with Zintra's actual schema (no profiles table, uses vendor_id/user_id directly)

-- =============================================================================
-- 1. CREATE PROJECTS TABLE (for tracking assigned jobs)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  assigned_vendor_id UUID NOT NULL,
  -- Note: vendor_id is stored as UUID directly (no foreign key to profiles table)
  assigned_by_user_id UUID NOT NULL,
  -- Note: user_id is stored as UUID directly (buyer who assigned the job)
  status VARCHAR(20) DEFAULT 'pending',
  -- Statuses: pending (vendor not yet confirmed), confirmed, in_progress, completed, cancelled
  start_date DATE NOT NULL,
  expected_end_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_vendor ON public.projects(assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_rfq ON public.projects(rfq_id);
CREATE INDEX IF NOT EXISTS idx_projects_created ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_by ON public.projects(assigned_by_user_id);

-- =============================================================================
-- 2. ALTER RFQS TABLE (to track assignment)
-- =============================================================================

ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS assigned_vendor_id UUID;

ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;

-- Create index for assignment queries
CREATE INDEX IF NOT EXISTS idx_rfqs_assigned_vendor ON public.rfqs(assigned_vendor_id);

-- =============================================================================
-- 3. CREATE NOTIFICATIONS TABLE (for user/vendor updates)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  -- Note: user_id is stored as UUID directly (recipient)
  type VARCHAR(50) NOT NULL,
  -- Types: rfq_sent, quote_accepted, quote_rejected, job_assigned, job_accepted, job_declined, message_received, job_completed
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_rfq_id UUID REFERENCES public.rfqs(id) ON DELETE CASCADE,
  related_project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  related_user_id UUID,
  -- Note: related_user_id is UUID directly (can be removed if notification is deleted)
  is_read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

-- =============================================================================
-- 4. VERIFY RFQ_RESPONSES TABLE HAS NUMERIC AMOUNT
-- =============================================================================

-- Check if amount column exists and is numeric
DO $$
BEGIN
  -- Check if amount column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfq_responses' AND column_name = 'amount'
  ) THEN
    -- If column doesn't exist, create it
    ALTER TABLE public.rfq_responses ADD COLUMN amount NUMERIC(12,2);
  ELSE
    -- If it exists, ensure it's numeric (this is safe as-is if already numeric)
    -- If it's VARCHAR, the migration will need manual intervention
    NULL;
  END IF;
END $$;

-- Create index for sorting quotes by amount
CREATE INDEX IF NOT EXISTS idx_rfq_responses_amount ON public.rfq_responses(amount);

-- =============================================================================
-- 5. ENABLE RLS POLICIES
-- =============================================================================

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see projects they created or are assigned to
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_can_view_own_projects' AND tablename = 'projects'
  ) THEN
    CREATE POLICY "users_can_view_own_projects" ON public.projects
      FOR SELECT
      USING (
        auth.uid()::UUID = assigned_by_user_id 
        OR auth.uid()::UUID = assigned_vendor_id
      );
  END IF;
END $$;

-- Policy: Only RFQ creator can create project assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'only_rfq_creator_can_assign' AND tablename = 'projects'
  ) THEN
    CREATE POLICY "only_rfq_creator_can_assign" ON public.projects
      FOR INSERT
      WITH CHECK (
        auth.uid()::UUID = (SELECT user_id FROM public.rfqs WHERE id = rfq_id)
        AND auth.uid()::UUID = assigned_by_user_id
      );
  END IF;
END $$;

-- Policy: Only assigned vendor can update their project status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'assigned_vendor_can_update_status' AND tablename = 'projects'
  ) THEN
    CREATE POLICY "assigned_vendor_can_update_status" ON public.projects
      FOR UPDATE
      USING (auth.uid()::UUID = assigned_vendor_id)
      WITH CHECK (auth.uid()::UUID = assigned_vendor_id);
  END IF;
END $$;

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_can_view_own_notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "users_can_view_own_notifications" ON public.notifications
      FOR SELECT
      USING (auth.uid()::UUID = user_id);
  END IF;
END $$;

-- Policy: System can insert notifications for users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'anyone_can_create_notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "anyone_can_create_notifications" ON public.notifications
      FOR INSERT
      WITH CHECK (TRUE);
  END IF;
END $$;

-- Policy: Users can update their own notifications (mark as read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_can_update_own_notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "users_can_update_own_notifications" ON public.notifications
      FOR UPDATE
      USING (auth.uid()::UUID = user_id)
      WITH CHECK (auth.uid()::UUID = user_id);
  END IF;
END $$;

-- =============================================================================
-- 6. CREATE TRIGGER FOR UPDATED_AT (projects table)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at_trigger ON public.projects;
CREATE TRIGGER update_projects_updated_at_trigger
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_projects_updated_at();

-- =============================================================================
-- 7. CREATE HELPER FUNCTION FOR SENDING NOTIFICATIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_related_rfq_id UUID DEFAULT NULL,
  p_related_project_id UUID DEFAULT NULL,
  p_related_user_id UUID DEFAULT NULL,
  p_action_url VARCHAR(255) DEFAULT NULL
)
RETURNS public.notifications AS $$
DECLARE
  v_notification public.notifications;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_rfq_id,
    related_project_id,
    related_user_id,
    action_url
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_related_rfq_id,
    p_related_project_id,
    p_related_user_id,
    p_action_url
  )
  RETURNING * INTO v_notification;
  
  RETURN v_notification;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to execute this function
GRANT EXECUTE ON FUNCTION public.create_notification(UUID, VARCHAR(50), VARCHAR(255), TEXT, UUID, UUID, UUID, VARCHAR(255)) 
  TO authenticated, anon;

-- =============================================================================
-- 8. VERIFICATION QUERIES (Run these to verify migrations)
-- =============================================================================

-- Verify projects table exists
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'projects';

-- Verify notifications table exists
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'notifications';

-- Verify columns on rfqs
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'rfqs' 
-- AND column_name IN ('assigned_vendor_id', 'assigned_at');

-- Verify amount field is numeric
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'rfq_responses' 
-- AND column_name = 'amount';

-- Verify RLS is enabled
-- SELECT tablename FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename IN ('projects', 'notifications');

-- Verify indexes exist
-- SELECT indexname FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('projects', 'notifications', 'rfqs', 'rfq_responses')
-- ORDER BY indexname;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
