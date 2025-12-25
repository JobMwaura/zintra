-- ============================================================================
-- NOTIFICATIONS SYSTEM
-- ============================================================================
-- Real-time notifications for messages and other events
-- Users receive notifications when they get new messages

-- ============================================================================
-- PART 1: NOTIFICATIONS TABLE
-- ============================================================================

-- Note: Table may already exist. This just ensures it has the right columns.
-- ALTER TABLE will add missing columns if they don't exist.

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text,
  title text,
  body text,
  metadata jsonb,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Add missing columns if they don't exist
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_type text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at);

COMMENT ON TABLE public.notifications IS 'Stores user notifications for messages, RFQs, quotes, and system events';

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- ============================================================================
-- PART 2: RLS POLICIES
-- ============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to read their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated to insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow users to update their own notifications" ON public.notifications;

-- Policy 1: Users can only read their own notifications
CREATE POLICY "Allow users to read their own notifications" ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can insert notifications (via triggers/functions)
CREATE POLICY "Allow authenticated to insert notifications" ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own notifications (mark as read)
CREATE POLICY "Allow users to update their own notifications" ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PART 3: FUNCTION TO CREATE MESSAGE NOTIFICATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_message_notification(
  p_user_id uuid,
  p_vendor_id uuid,
  p_message_id uuid,
  p_vendor_name varchar,
  p_message_preview text
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    related_id,
    related_type
  ) 
  VALUES (
    p_user_id,
    'message',
    'New message from ' || COALESCE(p_vendor_name, 'a vendor'),
    p_message_preview,
    p_message_id,
    'vendor_message'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 4: TRIGGER TO AUTO-CREATE NOTIFICATION ON MESSAGE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_on_message_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_name varchar;
  v_user_email varchar;
  v_message_preview text;
  v_vendor_user_id uuid;
BEGIN
  -- Truncate message preview to 100 characters
  v_message_preview := SUBSTRING(NEW.message_text, 1, 100);
  
  IF NEW.sender_type = 'vendor' THEN
    -- Vendor sent message to user - notify the user
    SELECT company_name INTO v_vendor_name FROM public.vendors WHERE id = NEW.vendor_id;
    
    PERFORM create_message_notification(
      NEW.user_id,
      NEW.vendor_id,
      NEW.id,
      v_vendor_name,
      v_message_preview
    );
  ELSE
    -- User sent message to vendor - notify the vendor owner
    -- Get vendor's user_id first
    SELECT user_id INTO v_vendor_user_id FROM public.vendors WHERE id = NEW.vendor_id;
    
    -- Only create notification if vendor exists
    IF v_vendor_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        body,
        related_id,
        related_type
      ) VALUES (
        v_vendor_user_id,
        'message',
        'New message from a customer',
        v_message_preview,
        NEW.id,
        'vendor_message'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_notify_on_message ON public.vendor_messages;

-- Create trigger
CREATE TRIGGER trigger_notify_on_message
AFTER INSERT ON public.vendor_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_message_insert();

-- ============================================================================
-- PART 5: FUNCTION TO GET UNREAD NOTIFICATION COUNT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id uuid)
RETURNS bigint AS $$
BEGIN
  RETURN COUNT(*)::bigint FROM public.notifications
  WHERE user_id = p_user_id AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 6: FUNCTION TO GET RECENT NOTIFICATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_recent_notifications(p_user_id uuid, p_limit int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  type text,
  title text,
  body text,
  read_at timestamp with time zone,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    notifications.id,
    notifications.user_id,
    notifications.type,
    notifications.title,
    notifications.body,
    notifications.read_at,
    notifications.created_at
  FROM public.notifications
  WHERE notifications.user_id = p_user_id
  ORDER BY notifications.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXECUTION VERIFICATION
-- ============================================================================

-- Run these to verify:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications';
-- SELECT COUNT(*) FROM public.notifications LIMIT 1;
-- SELECT proname FROM pg_proc WHERE proname LIKE 'create_message_%' OR proname LIKE 'get_%notification%';
