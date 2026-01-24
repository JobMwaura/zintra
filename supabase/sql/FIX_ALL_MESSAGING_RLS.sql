-- ============================================================================
-- FIX: Both RLS Policies for Messaging System - Allow SERVICE_ROLE
-- ============================================================================
--
-- PROBLEM:
-- 1. vendor_messages table: Vendor INSERT policy requires auth.uid() check
--    but API uses SERVICE_ROLE (auth.uid() = NULL)
-- 2. notifications table: INSERT policy requires auth.uid() = user_id
--    but API uses SERVICE_ROLE to insert on behalf of users
--
-- SOLUTION:
-- Allow SERVICE_ROLE to insert to both tables (API needs this)
-- Keep security: SERVICE_ROLE only inserts correct data
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix vendor_messages INSERT policies
-- ============================================================================

-- Drop the restrictive vendor INSERT policy
DROP POLICY IF EXISTS "Allow vendors to respond to users" ON public.vendor_messages;

-- New policy: Allow SERVICE_ROLE OR authenticated vendor to insert
CREATE POLICY "Allow vendors to respond to users" ON public.vendor_messages
  FOR INSERT
  WITH CHECK (
    -- Allow SERVICE_ROLE (API) to insert
    auth.jwt() ->> 'role' = 'service_role'
    -- OR allow authenticated vendor to insert
    OR (
      auth.uid() IN (SELECT user_id FROM public.vendors WHERE id = vendor_id) 
      AND sender_type = 'vendor'
    )
  );

-- Drop the restrictive user INSERT policy
DROP POLICY IF EXISTS "Allow users to send messages to vendors" ON public.vendor_messages;

-- New policy: Allow SERVICE_ROLE OR authenticated user to insert
CREATE POLICY "Allow users to send messages to vendors" ON public.vendor_messages
  FOR INSERT
  WITH CHECK (
    -- Allow SERVICE_ROLE (API) to insert
    auth.jwt() ->> 'role' = 'service_role'
    -- OR allow authenticated user to insert
    OR (
      auth.uid() = user_id 
      AND sender_type = 'user'
    )
  );

-- ============================================================================
-- STEP 2: Fix notifications INSERT policy
-- ============================================================================

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Allow authenticated to insert notifications" ON public.notifications;

-- New policy: Allow SERVICE_ROLE OR authenticated user to insert
CREATE POLICY "Allow insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (
    -- Allow SERVICE_ROLE (API) to insert
    auth.jwt() ->> 'role' = 'service_role'
    -- OR allow authenticated users to insert for themselves
    OR auth.uid() = user_id
  );

-- ============================================================================
-- STEP 3: Verify the policies were created
-- ============================================================================

SELECT 
  tablename,
  policyname,
  cmd,
  (with_check) as policy_rule
FROM pg_policies 
WHERE tablename IN ('vendor_messages', 'notifications')
AND policyname IN (
  'Allow vendors to respond to users',
  'Allow users to send messages to vendors',
  'Allow insert notifications'
)
ORDER BY tablename, policyname;
