-- Add Attachments Support to Messages Table
-- This migration adds image attachment capability to admin-vendor messages
-- Images will be stored in AWS S3 with URLs stored in the database

-- Add attachments column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Comment explaining the structure
COMMENT ON COLUMN public.messages.attachments IS 
'Array of attachment objects: [{"type": "image", "url": "https://...", "name": "file.jpg", "size": 12345, "uploaded_at": "2026-01-15T..."}]';

-- Create index for faster queries on messages with attachments
CREATE INDEX IF NOT EXISTS idx_messages_has_attachments 
ON public.messages((attachments != '[]'::jsonb)) 
WHERE attachments != '[]'::jsonb;

-- Update the updated_at trigger if it exists
-- (This ensures conversation timestamps update when attachments are added)
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS messages_update_conversation_timestamp ON public.messages;

-- Create trigger to update conversation timestamp
CREATE TRIGGER messages_update_conversation_timestamp
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Grant necessary permissions (adjust if needed based on your RLS setup)
-- Allow authenticated users to read messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to insert messages with attachments (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'admins_insert_messages'
  ) THEN
    CREATE POLICY admins_insert_messages ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Create policy for admins to view all messages (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'admins_select_messages'
  ) THEN
    CREATE POLICY admins_select_messages ON public.messages
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Create policy for vendors to view their messages (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'vendors_select_own_messages'
  ) THEN
    CREATE POLICY vendors_select_own_messages ON public.messages
    FOR SELECT
    TO authenticated
    USING (
      sender_id = auth.uid() OR recipient_id = auth.uid()
    );
  END IF;
END $$;

-- Verification query
SELECT 
  'messages' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'messages'
  AND column_name = 'attachments';

-- Sample query to verify structure works
SELECT 
  id,
  body,
  attachments,
  jsonb_array_length(attachments) as attachment_count,
  created_at
FROM public.messages
WHERE attachments != '[]'::jsonb
LIMIT 5;

-- ✅ Migration Complete
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Create API endpoint for image uploads: /api/messages/upload-image
-- 3. Update message modal to include image upload UI
-- 4. Test uploading images and viewing them in Messages Management
