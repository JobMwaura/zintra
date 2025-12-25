-- ============================================================================
-- VENDOR MESSAGING SYSTEM
-- ============================================================================
-- Enables users to send direct messages to vendors
-- Vendors can view and respond to user messages

-- ============================================================================
-- PART 1: MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vendor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type varchar(10) NOT NULL CHECK (sender_type IN ('user', 'vendor')),
  message_text text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_messages_vendor_id ON public.vendor_messages(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_user_id ON public.vendor_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_conversation ON public.vendor_messages(vendor_id, user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_created_at ON public.vendor_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_is_read ON public.vendor_messages(is_read);

COMMENT ON TABLE public.vendor_messages IS 'Stores direct messages between users and vendors';

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.vendor_messages TO authenticated;

-- ============================================================================
-- PART 2: RLS POLICIES
-- ============================================================================

ALTER TABLE public.vendor_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to read their own messages" ON public.vendor_messages;
DROP POLICY IF EXISTS "Allow vendors to read messages to their profile" ON public.vendor_messages;
DROP POLICY IF EXISTS "Allow users to send messages to vendors" ON public.vendor_messages;
DROP POLICY IF EXISTS "Allow vendors to respond to users" ON public.vendor_messages;
DROP POLICY IF EXISTS "Allow users to mark messages as read" ON public.vendor_messages;

-- Policy 1: Users can read messages in their conversations with vendors
CREATE POLICY "Allow users to read their own messages" ON public.vendor_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Vendors can read messages sent to them
CREATE POLICY "Allow vendors to read messages to their profile" ON public.vendor_messages
FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.vendors WHERE id = vendor_id));

-- Policy 3: Authenticated users can send messages to vendors
CREATE POLICY "Allow users to send messages to vendors" ON public.vendor_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  sender_type = 'user'
);

-- Policy 4: Vendors can send responses to users
CREATE POLICY "Allow vendors to respond to users" ON public.vendor_messages
FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.vendors WHERE id = vendor_id) AND
  sender_type = 'vendor'
);

-- Policy 5: Users can mark their own received messages as read
CREATE POLICY "Allow users to mark messages as read" ON public.vendor_messages
FOR UPDATE
USING (auth.uid() = user_id AND sender_type = 'vendor')
WITH CHECK (auth.uid() = user_id AND sender_type = 'vendor');

-- Policy 6: Vendors can mark received messages as read
CREATE POLICY "Allow vendors to mark messages as read" ON public.vendor_messages
FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM public.vendors WHERE id = vendor_id) AND sender_type = 'user')
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.vendors WHERE id = vendor_id) AND sender_type = 'user');

-- ============================================================================
-- PART 3: HELPER FUNCTION TO GET CONVERSATION LIST
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_vendor_conversations(p_user_id uuid)
RETURNS TABLE (
  vendor_id uuid,
  vendor_name varchar,
  last_message text,
  last_message_at timestamp with time zone,
  unread_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vm.vendor_id,
    v.company_name,
    vm.message_text,
    vm.created_at,
    COUNT(CASE WHEN vm.is_read = false AND vm.sender_type = 'vendor' THEN 1 END)
  FROM public.vendor_messages vm
  JOIN public.vendors v ON vm.vendor_id = v.id
  WHERE vm.user_id = p_user_id
  GROUP BY vm.vendor_id, v.company_name, vm.message_text, vm.created_at
  ORDER BY vm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 4: HELPER FUNCTION TO GET VENDOR MESSAGE LIST
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_vendor_user_conversations(p_vendor_id uuid)
RETURNS TABLE (
  user_id uuid,
  user_email varchar,
  last_message text,
  last_message_at timestamp with time zone,
  unread_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vm.user_id,
    u.email,
    vm.message_text,
    vm.created_at,
    COUNT(CASE WHEN vm.is_read = false AND vm.sender_type = 'user' THEN 1 END)
  FROM public.vendor_messages vm
  JOIN auth.users u ON vm.user_id = u.id
  WHERE vm.vendor_id = p_vendor_id
  GROUP BY vm.user_id, u.email, vm.message_text, vm.created_at
  ORDER BY vm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
