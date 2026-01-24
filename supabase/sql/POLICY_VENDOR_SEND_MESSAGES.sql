-- ============================================================================
-- RLS POLICY: Allow Vendors to Send Messages to Users
-- ============================================================================
-- 
-- This policy allows vendors (authenticated users who own a vendor profile)
-- to insert messages into the vendor_messages table with sender_type = 'vendor'
--
-- Security:
-- - Only vendors can send vendor messages (verified by vendor ownership)
-- - Only messages where vendor is owned by current user are allowed
-- - SERVICE_ROLE (API) is also allowed for automated messages
--
-- ============================================================================

-- Step 1: Ensure RLS is enabled on vendor_messages
ALTER TABLE public.vendor_messages ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policy if it exists
DROP POLICY IF EXISTS "Vendors can send messages to users" ON public.vendor_messages;

-- Step 3: Create the new policy
CREATE POLICY "Vendors can send messages to users" ON public.vendor_messages
  FOR INSERT
  WITH CHECK (
    -- Allow SERVICE_ROLE (API) to insert
    auth.jwt() ->> 'role' = 'service_role'
    -- OR allow authenticated vendor to send message if:
    OR (
      -- They own the vendor sending the message
      auth.uid() IN (
        SELECT user_id FROM public.vendors WHERE id = vendor_id
      )
      -- AND the message is marked as sent by vendor
      AND sender_type = 'vendor'
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Query 1: Verify the policy exists
SELECT 
  policyname,
  tablename,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'vendor_messages' 
AND policyname = 'Vendors can send messages to users'
ORDER BY policyname;

-- Query 2: List all policies on vendor_messages to see the complete picture
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'vendor_messages'
ORDER BY policyname;

-- ============================================================================
-- WHAT THIS POLICY DOES
-- ============================================================================
--
-- ALLOWS:
-- ✅ Vendor user sends message where sender_type = 'vendor'
-- ✅ API (SERVICE_ROLE) inserts messages on behalf of vendors
-- ✅ Message references vendor_id that vendor owns
--
-- BLOCKS:
-- ❌ Non-vendor sending vendor messages
-- ❌ Vendor sending message for vendor they don't own
-- ❌ Incorrect sender_type for vendor messages
--
-- ============================================================================
-- EXAMPLE USE CASES
-- ============================================================================
--
-- CASE 1: Vendor sends response via frontend
-- - User logs in as vendor owner
-- - User clicks "Send" in inbox
-- - Frontend calls API with vendor_id and sender_type='vendor'
-- - Policy checks: auth.uid() owns this vendor_id? YES → INSERT allowed ✅
--
-- CASE 2: API sends message on behalf of vendor
-- - System wants to send automated message
-- - API uses SERVICE_ROLE key
-- - API inserts with vendor_id and sender_type='vendor'
-- - Policy checks: auth.jwt() ->> 'role' = 'service_role'? YES → INSERT allowed ✅
--
-- CASE 3: User tries to send vendor message
-- - User (non-vendor) tries to send message
-- - Frontend calls API with vendor_id and sender_type='vendor'
-- - Policy checks: auth.uid() owns vendor_id? NO → INSERT blocked ❌
--
-- ============================================================================
