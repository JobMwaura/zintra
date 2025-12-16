-- Engagement Metrics Tables
-- Track RFQ views, quote submissions, and vendor profile views
-- Run this in Supabase SQL Editor

-- Table 1: RFQ Views Tracking
CREATE TABLE IF NOT EXISTS public.rfq_views (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  viewed_by_user_id uuid references auth.users(id) on delete set null, -- NULL for anonymous views
  viewed_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_rfq_views_rfq_id ON public.rfq_views(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_views_viewed_by ON public.rfq_views(viewed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_rfq_views_created_at ON public.rfq_views(created_at);

-- Table 2: Quote Submissions (aggregated counts)
-- This stores a summary count per RFQ to avoid querying rfq_responses every time
CREATE TABLE IF NOT EXISTS public.rfq_quote_stats (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null unique references public.rfqs(id) on delete cascade,
  total_quotes int default 0,
  last_quote_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_rfq_quote_stats_rfq_id ON public.rfq_quote_stats(rfq_id);

-- Table 3: Vendor Profile Views Tracking
CREATE TABLE IF NOT EXISTS public.vendor_profile_views (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  viewed_by_user_id uuid references auth.users(id) on delete set null, -- NULL for anonymous views
  viewed_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_vendor_profile_views_vendor_id ON public.vendor_profile_views(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profile_views_viewed_by ON public.vendor_profile_views(viewed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profile_views_created_at ON public.vendor_profile_views(created_at);

-- Table 4: Vendor Profile Stats (aggregated counts)
-- This stores a summary count per vendor to avoid querying vendor_profile_views every time
CREATE TABLE IF NOT EXISTS public.vendor_profile_stats (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null unique references public.vendors(id) on delete cascade,
  total_profile_views int default 0,
  total_quotes_sent int default 0,
  last_view_at timestamptz,
  last_quote_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_vendor_profile_stats_vendor_id ON public.vendor_profile_stats(vendor_id);

-- ============================================================================
-- RLS POLICIES FOR METRICS TABLES
-- ============================================================================

-- RLS for rfq_views
ALTER TABLE public.rfq_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for tracking views)
CREATE POLICY "Anyone can track RFQ views"
  ON public.rfq_views
  FOR INSERT
  WITH CHECK (true);

-- Anyone can view aggregated stats (SELECT COUNT aggregations)
-- but through views/functions, not direct table access
CREATE POLICY "RFQ viewers cannot see individual view details"
  ON public.rfq_views
  FOR SELECT
  USING (false); -- Restrict direct SELECT; use functions instead

-- RLS for rfq_quote_stats
ALTER TABLE public.rfq_quote_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can view quote stats (non-sensitive data)
CREATE POLICY "Anyone can view RFQ quote stats"
  ON public.rfq_quote_stats
  FOR SELECT
  USING (true);

-- Only service role can update stats (via triggers/functions)
CREATE POLICY "Only service role can update quote stats"
  ON public.rfq_quote_stats
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- RLS for vendor_profile_views
ALTER TABLE public.vendor_profile_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for tracking views)
CREATE POLICY "Anyone can track vendor profile views"
  ON public.vendor_profile_views
  FOR INSERT
  WITH CHECK (true);

-- Restrict direct SELECT; use functions instead
CREATE POLICY "Viewers cannot see individual profile view details"
  ON public.vendor_profile_views
  FOR SELECT
  USING (false);

-- RLS for vendor_profile_stats
ALTER TABLE public.vendor_profile_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can view vendor profile stats (non-sensitive data)
CREATE POLICY "Anyone can view vendor profile stats"
  ON public.vendor_profile_stats
  FOR SELECT
  USING (true);

-- Only service role can update stats
CREATE POLICY "Only service role can update profile stats"
  ON public.vendor_profile_stats
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- TRIGGER FUNCTION: Update rfq_quote_stats when new quote is inserted
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_rfq_quote_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert stats
  INSERT INTO public.rfq_quote_stats (rfq_id, total_quotes, last_quote_at)
  VALUES (NEW.rfq_id, 1, NOW())
  ON CONFLICT (rfq_id)
  DO UPDATE SET 
    total_quotes = rfq_quote_stats.total_quotes + 1,
    last_quote_at = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update stats when quote is inserted
DROP TRIGGER IF EXISTS trg_increment_rfq_quote_count ON public.rfq_responses;
CREATE TRIGGER trg_increment_rfq_quote_count
AFTER INSERT ON public.rfq_responses
FOR EACH ROW
EXECUTE FUNCTION public.increment_rfq_quote_count();

-- ============================================================================
-- TRIGGER FUNCTION: Update vendor_profile_stats when new view is recorded
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_vendor_profile_views()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert stats
  INSERT INTO public.vendor_profile_stats (vendor_id, total_profile_views, last_view_at)
  VALUES (NEW.vendor_id, 1, NOW())
  ON CONFLICT (vendor_id)
  DO UPDATE SET 
    total_profile_views = vendor_profile_stats.total_profile_views + 1,
    last_view_at = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update stats when profile view is recorded
DROP TRIGGER IF EXISTS trg_increment_vendor_profile_views ON public.vendor_profile_views;
CREATE TRIGGER trg_increment_vendor_profile_views
AFTER INSERT ON public.vendor_profile_views
FOR EACH ROW
EXECUTE FUNCTION public.increment_vendor_profile_views();

-- ============================================================================
-- HELPER FUNCTION: Get RFQ view count
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_rfq_view_count(p_rfq_id uuid)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COALESCE(total_quotes, 0) INTO v_count
  FROM public.rfq_quote_stats
  WHERE rfq_id = p_rfq_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- HELPER FUNCTION: Get vendor profile view count
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_vendor_profile_view_count(p_vendor_id uuid)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COALESCE(total_profile_views, 0) INTO v_count
  FROM public.vendor_profile_stats
  WHERE vendor_id = p_vendor_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After running this script, verify tables were created:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%views%' OR tablename LIKE '%stats%';

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('rfq_views', 'vendor_profile_views', 'rfq_quote_stats', 'vendor_profile_stats');

-- Check policies:
-- SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('rfq_views', 'vendor_profile_views', 'rfq_quote_stats', 'vendor_profile_stats');
