-- ============================================================================
-- FIX: Add RLS Policies for vendor_status_updates table
-- ============================================================================
-- The table was created with RLS enabled but NO policies defined,
-- blocking all access. This migration adds properly designed policies
-- following the pattern used in vendor_profile_likes and vendor_services.
-- ============================================================================

-- ============================================================================
-- PART 1: vendor_status_updates TABLE POLICIES
-- ============================================================================

-- Enable RLS on main table
ALTER TABLE IF EXISTS public.vendor_status_updates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on vendor status updates" ON public.vendor_status_updates;
DROP POLICY IF EXISTS "Allow all on status updates" ON public.vendor_status_updates;
DROP POLICY IF EXISTS "status_updates_read_all" ON public.vendor_status_updates;
DROP POLICY IF EXISTS "status_updates_insert_own" ON public.vendor_status_updates;
DROP POLICY IF EXISTS "status_updates_update_own" ON public.vendor_status_updates;
DROP POLICY IF EXISTS "status_updates_delete_own" ON public.vendor_status_updates;

-- Policy 1: Allow SELECT for all authenticated users (like vendor_profile_likes)
-- Anyone can view all status updates
CREATE POLICY "status_updates_read_all"
  ON public.vendor_status_updates
  FOR SELECT
  USING (true);

-- Policy 2: Allow INSERT for authenticated users creating updates for their vendor
-- Only vendors can create updates for their own vendor profile
CREATE POLICY "status_updates_insert_own"
  ON public.vendor_status_updates
  FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM public.vendors 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Allow UPDATE only for vendor who created the update
-- Only the vendor owner can edit their own updates
CREATE POLICY "status_updates_update_own"
  ON public.vendor_status_updates
  FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 4: Allow DELETE only for vendor who created the update
-- Only the vendor owner can delete their own updates
CREATE POLICY "status_updates_delete_own"
  ON public.vendor_status_updates
  FOR DELETE
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors 
      WHERE user_id = auth.uid()
    )
  );

-- Grant full permissions to roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_status_updates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_status_updates TO service_role;

-- ============================================================================
-- PART 2: vendor_status_update_likes TABLE POLICIES
-- ============================================================================

ALTER TABLE IF EXISTS public.vendor_status_update_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on status update likes" ON public.vendor_status_update_likes;
DROP POLICY IF EXISTS "likes_read_all" ON public.vendor_status_update_likes;
DROP POLICY IF EXISTS "likes_insert_own" ON public.vendor_status_update_likes;
DROP POLICY IF EXISTS "likes_delete_own" ON public.vendor_status_update_likes;

-- Policy 1: Allow SELECT for all (like vendor_profile_likes pattern)
-- Anyone can see who liked what
CREATE POLICY "likes_read_all"
  ON public.vendor_status_update_likes
  FOR SELECT
  USING (true);

-- Policy 2: Allow INSERT only by the user who is liking
-- Only authenticated users can like, and they must use their own user_id
CREATE POLICY "likes_insert_own"
  ON public.vendor_status_update_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow DELETE only by the user who liked
-- Only the user who liked can unlike
CREATE POLICY "likes_delete_own"
  ON public.vendor_status_update_likes
  FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.vendor_status_update_likes TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.vendor_status_update_likes TO service_role;

-- ============================================================================
-- PART 3: vendor_status_update_comments TABLE POLICIES
-- ============================================================================

ALTER TABLE IF EXISTS public.vendor_status_update_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on status update comments" ON public.vendor_status_update_comments;
DROP POLICY IF EXISTS "comments_read_all" ON public.vendor_status_update_comments;
DROP POLICY IF EXISTS "comments_insert_authenticated" ON public.vendor_status_update_comments;
DROP POLICY IF EXISTS "comments_update_own" ON public.vendor_status_update_comments;
DROP POLICY IF EXISTS "comments_delete_own" ON public.vendor_status_update_comments;

-- Policy 1: Allow SELECT for all (anyone can read comments)
CREATE POLICY "comments_read_all"
  ON public.vendor_status_update_comments
  FOR SELECT
  USING (true);

-- Policy 2: Allow INSERT for authenticated users
-- Any authenticated user can comment
CREATE POLICY "comments_insert_authenticated"
  ON public.vendor_status_update_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow UPDATE only for comment author
-- Only the user who commented can edit their comment
CREATE POLICY "comments_update_own"
  ON public.vendor_status_update_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy 4: Allow DELETE only for comment author
-- Only the user who commented can delete their comment
CREATE POLICY "comments_delete_own"
  ON public.vendor_status_update_comments
  FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_status_update_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_status_update_comments TO service_role;

-- ============================================================================
-- EXPLANATION: Why This Design Pattern?
-- ============================================================================
--
-- COMPARISON WITH EXISTING PATTERNS:
--
-- 1. vendor_profile_likes (VENDOR_PROFILE_LIKES_AND_VIEWS.sql):
--    - SELECT: true (anyone can see likes) ✓
--    - INSERT: auth.uid() = user_id (only you can like) ✓
--    - DELETE: auth.uid() = user_id (only you can unlike) ✓
--
-- 2. vendor_services (VENDOR_PROFILE_IMPROVEMENTS.sql):
--    - SELECT: true (anyone can see services) ✓
--    - INSERT: vendor_id IN (your vendors) ✓
--    - UPDATE: vendor_id IN (your vendors) ✓
--    - DELETE: vendor_id IN (your vendors) ✓
--
-- 3. vendor_status_updates (NEW - following both patterns):
--    - SELECT: true (anyone can see updates) ✓ [like vendor_profile_likes]
--    - INSERT: vendor_id IN (your vendors) ✓ [like vendor_services]
--    - UPDATE: vendor_id IN (your vendors) ✓ [like vendor_services]
--    - DELETE: vendor_id IN (your vendors) ✓ [like vendor_services]
--
-- KEY INSIGHT:
-- The vendor_status_updates table is like vendor_services:
-- - It belongs to a vendor (vendor_id foreign key)
-- - Only that vendor owner should be able to create/edit/delete
-- - But anyone should be able to READ them (for browsing)
--
-- PROBLEM THAT WAS HAPPENING:
-- - Table had RLS ENABLED but NO POLICIES
-- - Supabase blocks ALL access when RLS is on with no policies
-- - INSERT failed silently → updates not saved
-- - SELECT returned empty → no updates visible
-- - Updates appeared initially but disappeared on refresh (stale cache)
--
-- SOLUTION:
-- - Added specific RLS policies following established patterns
-- - Allows proper access control
-- - Uses auth.uid() and vendor relationships for security
-- - Opens SELECT to everyone (public browsing)
-- - Restricts INSERT/UPDATE/DELETE to vendors who own the updates
-- ============================================================================
