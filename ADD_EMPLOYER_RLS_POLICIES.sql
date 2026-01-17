-- Add missing RLS policies for employer_profiles table
-- Error: "new row violates row-level security policy for table employer_profiles"
-- This occurs because employer_profiles has RLS enabled but no INSERT/SELECT/UPDATE policies

-- RLS POLICIES FOR EMPLOYER_PROFILES
-- Policy: Users can insert their own employer profile
DROP POLICY IF EXISTS "users_insert_own_employer_profile" ON employer_profiles;
CREATE POLICY "users_insert_own_employer_profile" ON employer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can read their own employer profile
DROP POLICY IF EXISTS "users_read_own_employer_profile" ON employer_profiles;
CREATE POLICY "users_read_own_employer_profile" ON employer_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own employer profile
DROP POLICY IF EXISTS "users_update_own_employer_profile" ON employer_profiles;
CREATE POLICY "users_update_own_employer_profile" ON employer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Note: The enableEmployerRole function in /app/actions/vendor-zcc.js
-- uses the server-side Supabase client which bypasses RLS when using the service role key
-- However, it's good practice to have these policies in place for consistency
