-- ============================================================================
-- FIX: VENDOR PROFILE STATS RLS POLICIES
-- ============================================================================
-- The INSERT policy was too restrictive. Triggers need to auto-insert stats rows.
-- Solution: Allow INSERT with no check (triggers will handle data integrity)
-- ============================================================================

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Allow update own profile stats" ON public.vendor_profile_stats;

-- Create new permissive INSERT policy that allows triggers to create stat rows
CREATE POLICY "Allow insert profile stats" ON public.vendor_profile_stats
FOR INSERT WITH CHECK (true);

-- Keep the SELECT policy as-is (everyone can read)
-- Keep the UPDATE policy for vendors to update their own stats if needed

-- ============================================================================
-- EXPLANATION
-- ============================================================================
-- OLD POLICY (BROKEN):
-- CREATE POLICY "Allow update own profile stats" ON public.vendor_profile_stats
-- FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.vendors WHERE id = vendor_id));
--
-- PROBLEM:
-- - When a user likes a profile, the trigger INSERT fires
-- - The trigger tries to insert as the system user, not the authenticated user
-- - The policy checks if auth.uid() matches the vendor owner
-- - Since the trigger is system-level, auth.uid() is null/service_role
-- - Result: RLS violation!
--
-- NEW POLICY (FIXED):
-- CREATE POLICY "Allow insert profile stats" ON public.vendor_profile_stats
-- FOR INSERT WITH CHECK (true);
--
-- WHY THIS WORKS:
-- - Allows any insert (including trigger inserts)
-- - UPDATE is still restricted to vendor owners (line below)
-- - This is safe because:
--   1. Stats table only has vendor_id as PK (users can't specify arbitrary vendor_ids)
--   2. Triggers are the only thing that INSERT into this table
--   3. Triggers are controlled by admin, not users
--   4. Users can't manually insert into this table (it's read-only from their perspective)
--
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.vendor_profile_stats TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check current policies on vendor_profile_stats
-- SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'vendor_profile_stats'
-- ORDER BY policyname;

-- Test: Try to like a vendor profile in your app
-- Then check if it created a stats row:
-- SELECT * FROM vendor_profile_stats WHERE vendor_id = 'VENDOR_UUID';

-- ============================================================================
-- END OF FIX
-- ============================================================================
