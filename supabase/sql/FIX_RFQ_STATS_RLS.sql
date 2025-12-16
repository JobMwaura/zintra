-- FIX: RLS Policy for rfq_quote_stats - Allow Triggers
-- The issue: Triggers cannot bypass RLS policies by default
-- The solution: Use SECURITY DEFINER to allow trigger operations
-- Run this in Supabase SQL Editor to fix the error

-- ============================================================================
-- DROP OLD POLICIES THAT BLOCK TRIGGERS
-- ============================================================================

DROP POLICY IF EXISTS "Only service role can update quote stats" ON public.rfq_quote_stats;
DROP POLICY IF EXISTS "Only service role can update profile stats" ON public.vendor_profile_stats;

-- ============================================================================
-- NEW APPROACH: Use SECURITY DEFINER Functions
-- These functions run with elevated privileges and bypass RLS
-- ============================================================================

-- Re-create the trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.increment_rfq_quote_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- This function runs with elevated privileges (can bypass RLS)
  INSERT INTO public.rfq_quote_stats (rfq_id, total_quotes, last_quote_at)
  VALUES (NEW.rfq_id, 1, NOW())
  ON CONFLICT (rfq_id)
  DO UPDATE SET 
    total_quotes = rfq_quote_stats.total_quotes + 1,
    last_quote_at = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Re-create the vendor profile stats trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.increment_vendor_profile_views()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- This function runs with elevated privileges (can bypass RLS)
  INSERT INTO public.vendor_profile_stats (vendor_id, total_profile_views, last_view_at)
  VALUES (NEW.vendor_id, 1, NOW())
  ON CONFLICT (vendor_id)
  DO UPDATE SET 
    total_profile_views = vendor_profile_stats.total_profile_views + 1,
    last_view_at = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- UPDATE RLS POLICIES: Allow SELECT for everyone, disable UPDATE/INSERT
-- ============================================================================

-- Update rfq_quote_stats policies
ALTER TABLE public.rfq_quote_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_quote_stats ENABLE ROW LEVEL SECURITY;

-- Allow anyone to SELECT (view stats)
DROP POLICY IF EXISTS "Anyone can view RFQ quote stats" ON public.rfq_quote_stats;
CREATE POLICY "Anyone can view RFQ quote stats"
  ON public.rfq_quote_stats
  FOR SELECT
  USING (true);

-- Block direct INSERT (only triggers can insert via SECURITY DEFINER)
DROP POLICY IF EXISTS "Only triggers can update quote stats" ON public.rfq_quote_stats;
CREATE POLICY "Block direct INSERT on quote stats"
  ON public.rfq_quote_stats
  FOR INSERT
  WITH CHECK (false);

-- Block direct UPDATE (only triggers can update via SECURITY DEFINER)
DROP POLICY IF EXISTS "Block direct update quote stats" ON public.rfq_quote_stats;
CREATE POLICY "Block direct UPDATE on quote stats"
  ON public.rfq_quote_stats
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- Update vendor_profile_stats policies
ALTER TABLE public.vendor_profile_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profile_stats ENABLE ROW LEVEL SECURITY;

-- Allow anyone to SELECT (view stats)
DROP POLICY IF EXISTS "Anyone can view vendor profile stats" ON public.vendor_profile_stats;
CREATE POLICY "Anyone can view vendor profile stats"
  ON public.vendor_profile_stats
  FOR SELECT
  USING (true);

-- Block direct INSERT (only triggers can insert via SECURITY DEFINER)
DROP POLICY IF EXISTS "Only triggers can insert profile stats" ON public.vendor_profile_stats;
CREATE POLICY "Block direct INSERT on profile stats"
  ON public.vendor_profile_stats
  FOR INSERT
  WITH CHECK (false);

-- Block direct UPDATE (only triggers can update via SECURITY DEFINER)
DROP POLICY IF EXISTS "Block direct update profile stats" ON public.vendor_profile_stats;
CREATE POLICY "Block direct UPDATE on profile stats"
  ON public.vendor_profile_stats
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After running this script, verify functions have SECURITY DEFINER:
-- SELECT proname, prosecdef FROM pg_proc WHERE proname IN ('increment_rfq_quote_count', 'increment_vendor_profile_views');
-- Expected result: prosecdef = true for both functions

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('rfq_quote_stats', 'vendor_profile_stats');

-- Check policies exist:
-- SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('rfq_quote_stats', 'vendor_profile_stats');

-- Test: Submit a quote and verify count increases
-- 1. Go to marketplace, click "View & Quote"
-- 2. Submit a quote
-- 3. Go back to marketplace and refresh
-- 4. Quote count should have increased by 1

-- If still getting RLS errors, check:
-- SELECT * FROM public.rfq_quote_stats LIMIT 5;  -- Should show data
-- SELECT * FROM public.rfq_responses LIMIT 5;    -- Should show submitted quotes
