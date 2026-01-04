-- Phase 1: Job Assignment & Notifications System
-- This migration creates the foundation for marketplace job assignment and real-time notifications

-- =============================================================================
-- 1. CREATE PROJECTS TABLE (for tracking assigned jobs)
-- =============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  assigned_vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  assigned_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status VARCHAR(20) DEFAULT 'pending',
  -- Statuses: pending (vendor not yet confirmed), confirmed, in_progress, completed, cancelled
  start_date DATE NOT NULL,
  expected_end_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_vendor ON projects(assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_rfq ON projects(rfq_id);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);

-- =============================================================================
-- 2. ALTER RFQS TABLE (to track assignment)
-- =============================================================================

ALTER TABLE rfqs 
ADD COLUMN IF NOT EXISTS assigned_vendor_id UUID REFERENCES profiles(id);

ALTER TABLE rfqs 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;

-- Create index for assignment queries
CREATE INDEX IF NOT EXISTS idx_rfqs_assigned_vendor ON rfqs(assigned_vendor_id);

-- =============================================================================
-- 3. CREATE NOTIFICATIONS TABLE (for user/vendor updates)
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  -- Types: rfq_sent, quote_accepted, quote_rejected, job_assigned, job_accepted, job_declined, message_received, job_completed
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  related_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- =============================================================================
-- 4. ALTER RFQ_RESPONSES TABLE (fix amount field type)
-- =============================================================================

-- Check if amount is already numeric, if not, migrate it
DO $$
BEGIN
  -- First, add a new numeric column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfq_responses' AND column_name = 'amount_numeric'
  ) THEN
    ALTER TABLE rfq_responses ADD COLUMN amount_numeric NUMERIC(12,2);
    
    -- Migrate existing data (remove non-numeric characters and convert)
    UPDATE rfq_responses 
    SET amount_numeric = CAST(REGEXP_REPLACE(amount, '[^0-9.]', '', 'g') AS NUMERIC)
    WHERE amount IS NOT NULL AND amount ~ '^[0-9]+';
    
    -- Drop old column and rename new one
    ALTER TABLE rfq_responses DROP COLUMN amount CASCADE;
    ALTER TABLE rfq_responses RENAME COLUMN amount_numeric TO amount;
  END IF;
  
  -- Make amount required
  ALTER TABLE rfq_responses ALTER COLUMN amount SET NOT NULL;
END $$;

-- Create index for sorting quotes by amount
CREATE INDEX IF NOT EXISTS idx_rfq_responses_amount ON rfq_responses(amount);

-- =============================================================================
-- 5. ENABLE RLS POLICIES
-- =============================================================================

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see projects they created or are assigned to
CREATE POLICY "users_can_view_own_projects" ON projects
  FOR SELECT
  USING (
    auth.uid() = assigned_by_user_id 
    OR auth.uid() = assigned_vendor_id
  );

-- Policy: Only RFQ creator can create project assignments
CREATE POLICY "only_rfq_creator_can_assign" ON projects
  FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM rfqs WHERE id = rfq_id)
    AND auth.uid() = assigned_by_user_id
  );

-- Policy: Only assigned vendor can update their project status
CREATE POLICY "assigned_vendor_can_update_status" ON projects
  FOR UPDATE
  USING (auth.uid() = assigned_vendor_id)
  WITH CHECK (auth.uid() = assigned_vendor_id);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "users_can_view_own_notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: System can insert notifications for users
CREATE POLICY "anyone_can_create_notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "users_can_update_own_notifications" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 6. CREATE TRIGGER FOR UPDATED_AT (projects table)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at_trigger
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_projects_updated_at();

-- =============================================================================
-- 7. CREATE HELPER FUNCTION FOR SENDING NOTIFICATIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_related_rfq_id UUID DEFAULT NULL,
  p_related_project_id UUID DEFAULT NULL,
  p_related_user_id UUID DEFAULT NULL,
  p_action_url VARCHAR(255) DEFAULT NULL
)
RETURNS notifications AS $$
DECLARE
  v_notification notifications;
BEGIN
  INSERT INTO notifications (
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
GRANT EXECUTE ON FUNCTION create_notification(UUID, VARCHAR(50), VARCHAR(255), TEXT, UUID, UUID, UUID, VARCHAR(255)) 
  TO authenticated;

-- =============================================================================
-- VERIFICATION QUERIES (Run these to verify migrations)
-- =============================================================================

-- Verify tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name IN ('projects', 'notifications');

-- Verify columns on rfqs
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'rfqs' AND column_name IN ('assigned_vendor_id', 'assigned_at');

-- Verify amount field is numeric
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'rfq_responses' AND column_name = 'amount';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
