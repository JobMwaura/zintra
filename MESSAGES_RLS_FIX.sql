-- ============================================================================
-- SECURITY FIX: messages Table - Enable RLS (Row-Level Security)
-- ============================================================================
--
-- Issue: Table public.messages has 3 RLS policies defined but RLS is 
--        NOT ENABLED on the table. This means policies have no effect and 
--        access control is based on GRANT permissions only.
--
-- Policies without RLS enabled are inert and provide no protection.
-- This fix enables RLS and verifies/corrects the policies.
--
-- ============================================================================

-- STEP 1: Check current state (diagnostic)
-- Run this first to see what's currently set up:
/*
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'messages';

SELECT 
  policyname,
  permissive,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY policyname;
*/

-- ============================================================================
-- STEP 2: ENABLE RLS ON messages TABLE
-- ============================================================================
-- This is the critical fix - enables Row-Level Security so policies take effect
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: DROP EXISTING POLICIES AND RECREATE WITH CORRECT LOGIC
-- ============================================================================
-- Drop existing policies to ensure we have clean, correct ones
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Service role can access all messages" ON public.messages;

-- ============================================================================
-- STEP 4: CREATE CORRECT RLS POLICIES FOR messages
-- ============================================================================

-- Policy 1: Users can SELECT (view) their own messages
-- This allows users to view messages they sent or received
CREATE POLICY "Users can view their own messages" 
  ON public.messages 
  FOR SELECT 
  TO authenticated 
  USING (
    -- User is sender or recipient
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- Policy 2: Users can INSERT their own messages
-- This allows authenticated users to send messages (where they are the sender)
CREATE POLICY "Users can insert their own messages" 
  ON public.messages 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    -- Can only insert if user is the sender
    auth.uid() = sender_id
  );

-- Policy 3: Users can UPDATE their own messages (mark as read, etc)
-- This allows users to update messages they own
CREATE POLICY "Users can update their own messages" 
  ON public.messages 
  FOR UPDATE 
  TO authenticated 
  USING (
    -- User is sender or recipient
    auth.uid() = sender_id OR auth.uid() = recipient_id
  )
  WITH CHECK (
    -- User is sender or recipient
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- Policy 4: Service role bypass (for backend operations)
-- Service role can perform any operation on this table
CREATE POLICY "Service role can access all messages" 
  ON public.messages 
  FOR ALL 
  TO authenticated 
  USING (
    (auth.jwt() ->> 'role') = 'service_role'
  );

-- ============================================================================
-- STEP 5: GRANT APPROPRIATE PERMISSIONS
-- ============================================================================
-- Ensure authenticated users have permission to execute SELECT, INSERT, UPDATE
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

-- Service role should have full access
-- Note: Service role bypasses RLS entirely, so this is safe

-- ============================================================================
-- STEP 6: VERIFY THE FIX
-- ============================================================================
-- Run these verification queries to confirm RLS is enabled and policies exist:

-- Check RLS status (should show rowsecurity = true)
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'messages';

-- Check all policies (should show 4 policies)
SELECT 
  policyname,
  permissive,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY policyname;

-- Count total policies
SELECT COUNT(*) as total_message_policies 
FROM pg_policies 
WHERE tablename = 'messages';

-- ============================================================================
-- SUCCESS INDICATORS
-- ============================================================================
-- After running this script, verify:
-- 1. RLS status shows: rowsecurity = true ✅
-- 2. Total policies = 4 ✅
-- 3. Test as non-owner user - should get permission denied for others' messages ✅
-- 4. Test as sender/recipient - should be able to view/update ✅

