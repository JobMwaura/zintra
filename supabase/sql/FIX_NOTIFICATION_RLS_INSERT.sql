-- ============================================================================
-- FIX: Notification RLS Policy - Allow API to Insert Notifications
-- ============================================================================
-- 
-- PROBLEM: 
-- The INSERT policy requires auth.uid() = user_id, but the API uses SERVICE_ROLE
-- to insert notifications on behalf of users.
--
-- SOLUTION:
-- Allow both authenticated users AND service role to insert notifications
-- ============================================================================

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Allow authenticated to insert notifications" ON public.notifications;

-- Create new INSERT policy that allows:
-- 1. SERVICE_ROLE (API) to insert ANY notification
-- 2. Authenticated users to insert notifications for themselves
CREATE POLICY "Allow insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (
    -- Allow SERVICE_ROLE (API) to insert
    auth.jwt() ->> 'role' = 'service_role'
    -- OR allow authenticated users to insert for themselves
    OR auth.uid() = user_id
  );

-- Verify the policy was created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications' AND policyname = 'Allow insert notifications'
ORDER BY policyname;
