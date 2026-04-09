-- ============================================================================
-- FIX: Applications table RLS policies
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Allow candidates to INSERT applications (auth.uid() must match candidate_id)
DROP POLICY IF EXISTS "candidates_create_applications" ON applications;
CREATE POLICY "candidates_create_applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = candidate_id);

-- Allow candidates to read their own applications + employers to see apps for their listings
DROP POLICY IF EXISTS "anyone_read_applications" ON applications;
CREATE POLICY "anyone_read_applications" ON applications
  FOR SELECT USING (
    auth.uid() = candidate_id
    OR
    auth.uid() IN (SELECT employer_id FROM listings WHERE id = listing_id)
  );

-- Allow candidates to update their own applications (e.g., withdraw)
DROP POLICY IF EXISTS "candidates_update_own_applications" ON applications;
CREATE POLICY "candidates_update_own_applications" ON applications
  FOR UPDATE USING (auth.uid() = candidate_id);

-- Allow employers to update applications for their listings (e.g., shortlist, hire, reject)
DROP POLICY IF EXISTS "employers_update_listing_applications" ON applications;
CREATE POLICY "employers_update_listing_applications" ON applications
  FOR UPDATE USING (
    auth.uid() IN (SELECT employer_id FROM listings WHERE id = listing_id)
  );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE tablename = 'applications';
