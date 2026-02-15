-- ============================================
-- FIX: Add RLS policies for candidate_profiles
-- The table has RLS enabled but NO policies were ever created,
-- so all client-side operations (INSERT, UPDATE, SELECT) are denied.
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Anyone can READ candidate profiles (public talent directory)
DROP POLICY IF EXISTS "anyone_read_candidate_profiles" ON candidate_profiles;
CREATE POLICY "anyone_read_candidate_profiles" ON candidate_profiles
  FOR SELECT USING (true);

-- 2. Users can INSERT their own candidate profile
DROP POLICY IF EXISTS "users_insert_own_candidate_profile" ON candidate_profiles;
CREATE POLICY "users_insert_own_candidate_profile" ON candidate_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Users can UPDATE their own candidate profile
DROP POLICY IF EXISTS "users_update_own_candidate_profile" ON candidate_profiles;
CREATE POLICY "users_update_own_candidate_profile" ON candidate_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Users can DELETE their own candidate profile
DROP POLICY IF EXISTS "users_delete_own_candidate_profile" ON candidate_profiles;
CREATE POLICY "users_delete_own_candidate_profile" ON candidate_profiles
  FOR DELETE USING (auth.uid() = id);

-- Done!
