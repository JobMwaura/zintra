-- ============================================================================
-- FIX: Allow vendors to read buyer information from users table
-- Run this in Supabase SQL Editor if Contact Buyer shows "Could not load buyer details"
-- ============================================================================

-- Step 1: Check current policies on users table
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 2: Ensure there's a SELECT policy allowing authenticated users to read user data
-- This is needed for vendors to see buyer info (name, email, phone)

-- Drop existing policy if it exists (to recreate cleanly)
DROP POLICY IF EXISTS "Authenticated can view users" ON public.users;

-- Create policy allowing any authenticated user to read from users table
CREATE POLICY "Authenticated can view users"
  ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Alternative: If you want everyone (including anonymous) to see basic profile info
-- DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
-- CREATE POLICY "Public profiles are viewable by everyone"
--   ON public.users
--   FOR SELECT
--   USING (true);

-- Step 3: Verify policies
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- ============================================================================
-- EXPECTED RESULT:
-- After running this, vendors should be able to fetch buyer info when clicking
-- "Contact Buyer" on an accepted quote.
-- ============================================================================
