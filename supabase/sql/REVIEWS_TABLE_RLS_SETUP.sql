-- ============================================================================
-- REVIEWS TABLE - SETUP AND RLS POLICIES
-- ============================================================================
-- Ensures the reviews table has proper RLS policies for the review system to work

-- ============================================================================
-- PART 1: Ensure reviews table has all required columns
-- ============================================================================

-- Add any missing columns to the reviews table
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS vendor_id uuid NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS author text DEFAULT 'Anonymous',
ADD COLUMN IF NOT EXISTS rating integer,
ADD COLUMN IF NOT EXISTS comment text,
ADD COLUMN IF NOT EXISTS vendor_response text,
ADD COLUMN IF NOT EXISTS responded_at timestamptz,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Create index for vendor lookups
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON public.reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- ============================================================================
-- PART 2: Enable and Configure RLS for Reviews Table
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anyone to view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow authenticated users to create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow users to update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow vendors to update responses" ON public.reviews;

-- Policy 1: Anyone can read reviews (no authentication needed)
CREATE POLICY "Allow anyone to view reviews" ON public.reviews
FOR SELECT
USING (true);

-- Policy 2: Authenticated users can create reviews
CREATE POLICY "Allow authenticated users to create reviews" ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: Users can read all reviews
-- (This is redundant with the first policy, but explicitly allows it)
CREATE POLICY "Allow users to read all reviews" ON public.reviews
FOR SELECT
USING (true);

-- ============================================================================
-- PART 3: Grant Permissions
-- ============================================================================

-- Allow authenticated users to select and insert
GRANT SELECT, INSERT ON public.reviews TO authenticated;

-- Allow anonymous users to read (if needed)
GRANT SELECT ON public.reviews TO anon;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if reviews table exists and has the right columns:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'reviews' ORDER BY ordinal_position;

-- Check RLS policies:
-- SELECT policyname, permissive, roles, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'reviews';

-- Test inserting a review:
-- INSERT INTO public.reviews (vendor_id, author, rating, comment, created_at)
-- VALUES ('vendor-uuid-here', 'Test User', 5, 'Great vendor!', now());

-- ============================================================================
-- END OF SETUP
-- ============================================================================
