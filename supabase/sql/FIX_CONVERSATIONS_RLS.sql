-- Fix RLS Policies for Conversations Table
-- This allows admins to create and view conversations with vendors

-- Enable RLS on conversations table (if not already enabled)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS admins_insert_conversations ON public.conversations;
DROP POLICY IF EXISTS admins_select_conversations ON public.conversations;
DROP POLICY IF EXISTS admins_update_conversations ON public.conversations;
DROP POLICY IF EXISTS vendors_select_own_conversations ON public.conversations;

-- Policy 1: Admins can insert conversations
CREATE POLICY admins_insert_conversations ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: Admins can view all conversations
CREATE POLICY admins_select_conversations ON public.conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Policy 3: Admins can update all conversations
CREATE POLICY admins_update_conversations ON public.conversations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Policy 4: Vendors can view their own conversations
CREATE POLICY vendors_select_own_conversations ON public.conversations
FOR SELECT
TO authenticated
USING (
  vendor_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE user_id = auth.uid() AND id = conversations.vendor_id
  )
);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'conversations'
ORDER BY policyname;

-- Test query (should work for admins now)
SELECT 
  c.id,
  c.subject,
  c.admin_id,
  c.vendor_id,
  c.created_at,
  v.company_name as vendor_name
FROM public.conversations c
LEFT JOIN public.vendors v ON v.id = c.vendor_id
ORDER BY c.created_at DESC
LIMIT 5;

-- ✅ Migration Complete
-- This should fix the 403 Forbidden and 406 Not Acceptable errors
-- Admins can now create conversations and send messages to vendors
