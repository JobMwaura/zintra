-- Add missing RLS policies for employer_profiles table
-- Error: "new row violates row-level security policy for table employer_profiles"
-- This occurs because employer_profiles has RLS enabled but no INSERT/SELECT/UPDATE policies

-- RLS POLICIES FOR EMPLOYER_PROFILES
-- Policy: Users can insert their own employer profile
DROP POLICY IF EXISTS "users_insert_own_employer_profile" ON employer_profiles;
CREATE POLICY "users_insert_own_employer_profile" ON employer_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Users can read their own employer profile
DROP POLICY IF EXISTS "users_read_own_employer_profile" ON employer_profiles;
CREATE POLICY "users_read_own_employer_profile" ON employer_profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own employer profile
DROP POLICY IF EXISTS "users_update_own_employer_profile" ON employer_profiles;
CREATE POLICY "users_update_own_employer_profile" ON employer_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Note: employer_profiles now uses id (auth.users.id) as PRIMARY KEY
-- This matches the pattern used in candidate_profiles and eliminates need for separate UUID generation
