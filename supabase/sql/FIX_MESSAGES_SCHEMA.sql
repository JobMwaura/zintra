-- Fix Messages and Vendor Messages Tables Schema
-- Align columns between messages and vendor_messages tables
-- Ensures admin messages sync properly to vendor inbox

-- ============================================================================
-- STEP 1: Add missing columns to messages table
-- ============================================================================

-- Add sender_id column if missing (references auth.users)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add recipient_id column if missing (references auth.users)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add message_type column if missing
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';

-- Add attachments column if missing (for file/image storage)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- ============================================================================
-- STEP 2: Add missing columns to vendor_messages table
-- ============================================================================

-- Add sender_id column if missing
ALTER TABLE public.vendor_messages 
ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add conversation_id column if missing
ALTER TABLE public.vendor_messages 
ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Add is_read column if missing (for marking messages as read)
ALTER TABLE public.vendor_messages 
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT FALSE;

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

-- Indexes for vendor_messages
CREATE INDEX IF NOT EXISTS idx_vendor_messages_vendor_id 
ON public.vendor_messages(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_messages_sender_id 
ON public.vendor_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_vendor_messages_is_read 
ON public.vendor_messages(vendor_id, is_read);

CREATE INDEX IF NOT EXISTS idx_vendor_messages_conversation_id 
ON public.vendor_messages(conversation_id);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
ON public.messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
ON public.messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_id 
ON public.messages(recipient_id);

-- ============================================================================
-- STEP 4: Verify the schema (diagnostic query)
-- ============================================================================

-- Check messages table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Check vendor_messages table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'vendor_messages'
ORDER BY ordinal_position;

-- ✅ Schema alignment complete
-- Messages table now has: sender_id, recipient_id, message_type, attachments, conversation_id
-- Vendor_messages table now has: sender_id, conversation_id, is_read
-- Both tables are properly indexed for performance
