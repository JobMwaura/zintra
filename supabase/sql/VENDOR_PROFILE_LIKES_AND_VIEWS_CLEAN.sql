-- ============================================================================
-- VENDOR PROFILE LIKES AND VIEWS TRACKING - CLEAN VERSION
-- ============================================================================
-- This adds:
-- 1. Vendor Profile Likes - Users can like vendor profiles
-- 2. Profile Like Counts - Track total likes per vendor
-- ============================================================================

-- Drop existing functions and tables if they exist (clean slate)
DROP FUNCTION IF EXISTS public.decrement_profile_likes() CASCADE;
DROP FUNCTION IF EXISTS public.increment_profile_likes() CASCADE;
DROP TABLE IF EXISTS public.vendor_profile_stats CASCADE;
DROP TABLE IF EXISTS public.vendor_profile_likes CASCADE;

-- ============================================================================
-- PART 1: VENDOR PROFILE LIKES TABLE
-- ============================================================================
-- Track who liked which vendor profiles

CREATE TABLE public.vendor_profile_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(vendor_id, user_id) -- Prevent duplicate likes
);

-- Create indexes for performance
CREATE INDEX idx_vendor_profile_likes_vendor_id ON public.vendor_profile_likes(vendor_id);
CREATE INDEX idx_vendor_profile_likes_user_id ON public.vendor_profile_likes(user_id);

COMMENT ON TABLE public.vendor_profile_likes IS 'Tracks likes on vendor profiles';

-- ============================================================================
-- PART 2: VENDOR PROFILE STATS TABLE
-- ============================================================================
-- Store profile view and like counts for vendors

CREATE TABLE public.vendor_profile_stats (
  vendor_id uuid PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
  likes_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  last_viewed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_vendor_profile_stats_vendor_id ON public.vendor_profile_stats(vendor_id);
CREATE INDEX idx_vendor_profile_stats_likes_count ON public.vendor_profile_stats(likes_count DESC);
CREATE INDEX idx_vendor_profile_stats_views_count ON public.vendor_profile_stats(views_count DESC);

COMMENT ON TABLE public.vendor_profile_stats IS 'Cached statistics for vendor profile likes and views';

-- ============================================================================
-- PART 3: HELPER FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to increment profile likes count
CREATE FUNCTION public.increment_profile_likes()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update the stats row
  INSERT INTO public.vendor_profile_stats (vendor_id, likes_count, views_count)
  VALUES (NEW.vendor_id, 1, 0)
  ON CONFLICT (vendor_id)
  DO UPDATE SET 
    likes_count = vendor_profile_stats.likes_count + 1,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for incrementing likes
CREATE TRIGGER trigger_increment_profile_likes
AFTER INSERT ON public.vendor_profile_likes
FOR EACH ROW
EXECUTE FUNCTION public.increment_profile_likes();

-- Function to decrement profile likes
CREATE FUNCTION public.decrement_profile_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vendor_profile_stats
  SET likes_count = GREATEST(likes_count - 1, 0),
      updated_at = now()
  WHERE vendor_id = OLD.vendor_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for decrementing likes
CREATE TRIGGER trigger_decrement_profile_likes
AFTER DELETE ON public.vendor_profile_likes
FOR EACH ROW
EXECUTE FUNCTION public.decrement_profile_likes();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on vendor_profile_likes
ALTER TABLE public.vendor_profile_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read profile likes" ON public.vendor_profile_likes;
DROP POLICY IF EXISTS "Allow insert profile likes" ON public.vendor_profile_likes;
DROP POLICY IF EXISTS "Allow delete own profile likes" ON public.vendor_profile_likes;

-- Policy: Allow SELECT for all
CREATE POLICY "Allow read profile likes" ON public.vendor_profile_likes
FOR SELECT USING (true);

-- Policy: Allow INSERT for authenticated users
CREATE POLICY "Allow insert profile likes" ON public.vendor_profile_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Allow DELETE only by the user who liked
CREATE POLICY "Allow delete own profile likes" ON public.vendor_profile_likes
FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on vendor_profile_stats
ALTER TABLE public.vendor_profile_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read profile stats" ON public.vendor_profile_stats;
DROP POLICY IF EXISTS "Allow update own profile stats" ON public.vendor_profile_stats;
DROP POLICY IF EXISTS "Allow update own profile stats update" ON public.vendor_profile_stats;

-- Policy: Allow SELECT for all (everyone can see stats)
CREATE POLICY "Allow read profile stats" ON public.vendor_profile_stats
FOR SELECT USING (true);

-- Policy: Allow INSERT/UPDATE only by vendor owner
CREATE POLICY "Allow update own profile stats" ON public.vendor_profile_stats
FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.vendors WHERE id = vendor_id));

CREATE POLICY "Allow update own profile stats update" ON public.vendor_profile_stats
FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.vendors WHERE id = vendor_id))
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.vendors WHERE id = vendor_id));

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.vendor_profile_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vendor_profile_stats TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
