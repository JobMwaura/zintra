-- ============================================
-- FIX: Add missing RLS policies for candidate_profiles AND profiles
-- Run in Supabase SQL Editor
-- ============================================

-- ======== PROFILES TABLE ========
-- The profiles table only had SELECT + UPDATE policies.
-- Users who sign up via Career Centre need INSERT to create their base profile row.

-- INSERT own profile
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
CREATE POLICY "users_insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ======== CANDIDATE_PROFILES TABLE ========

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
