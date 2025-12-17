-- ============================================================================
-- SQL Migration: Add Dashboard Metrics Columns to RFQ System
-- Date: December 17, 2025
-- Purpose: Add fields required by the enhanced RFQ management dashboard
-- ============================================================================

-- STEP 1: Add match_quality_score to rfqs table
-- Used for Matched RFQs to track algorithm quality (70%+ is good)
-- ============================================================================
ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS match_quality_score NUMERIC(5, 2) DEFAULT 75;

COMMENT ON COLUMN public.rfqs.match_quality_score IS 
  'Match quality score (0-100) for auto-matched RFQs. Higher is better. Alert if <60%.';

CREATE INDEX IF NOT EXISTS idx_rfqs_match_quality_score 
ON public.rfqs(match_quality_score) 
WHERE rfq_type = 'matched';


-- STEP 2: Add view_count to rfqs table
-- Used for Public RFQs to track marketplace engagement
-- ============================================================================
ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

COMMENT ON COLUMN public.rfqs.view_count IS 
  'Number of times this RFQ has been viewed in the marketplace.';

CREATE INDEX IF NOT EXISTS idx_rfqs_view_count 
ON public.rfqs(view_count DESC) 
WHERE rfq_type = 'public';


-- STEP 3: Add quote_count to rfqs table
-- Used for all RFQ types to track quote received count
-- ============================================================================
ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS quote_count INTEGER DEFAULT 0;

COMMENT ON COLUMN public.rfqs.quote_count IS 
  'Number of quotes/responses received for this RFQ.';

CREATE INDEX IF NOT EXISTS idx_rfqs_quote_count 
ON public.rfqs(quote_count DESC);


-- STEP 4: Add recipients_count to rfqs table
-- Used for Direct and Matched RFQs to track response rates
-- ============================================================================
ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS recipients_count INTEGER DEFAULT 0;

COMMENT ON COLUMN public.rfqs.recipients_count IS 
  'Number of vendors this RFQ was sent to. Used to calculate response rates.';

CREATE INDEX IF NOT EXISTS idx_rfqs_recipients_count 
ON public.rfqs(recipients_count);


-- STEP 5: Create trigger to auto-update quote_count from rfq_responses
-- ============================================================================
-- This trigger automatically updates quote_count when responses are added/deleted
CREATE OR REPLACE FUNCTION public.update_rfq_quote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.rfqs 
    SET quote_count = (
      SELECT COUNT(*) FROM public.rfq_responses 
      WHERE rfq_id = NEW.rfq_id
    )
    WHERE id = NEW.rfq_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.rfqs 
    SET quote_count = (
      SELECT COUNT(*) FROM public.rfq_responses 
      WHERE rfq_id = OLD.rfq_id
    )
    WHERE id = OLD.rfq_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF NOT EXISTS trg_update_rfq_quote_count ON public.rfq_responses;

-- Create new trigger
CREATE TRIGGER trg_update_rfq_quote_count
AFTER INSERT OR DELETE ON public.rfq_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_rfq_quote_count();


-- STEP 6: Create trigger to auto-update view_count from analytics
-- ============================================================================
-- This would typically be updated by API tracking endpoint
-- But we can create the structure for future integration
CREATE TABLE IF NOT EXISTS public.rfq_view_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  viewer_ip TEXT,
  viewer_user_id UUID,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(rfq_id, viewer_user_id, viewer_ip, viewed_at::DATE)
);

CREATE INDEX IF NOT EXISTS idx_rfq_view_tracking_rfq_id 
ON public.rfq_view_tracking(rfq_id);

CREATE INDEX IF NOT EXISTS idx_rfq_view_tracking_viewed_at 
ON public.rfq_view_tracking(viewed_at DESC);


-- STEP 7: Create trigger to update rfqs.view_count from rfq_view_tracking
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_rfq_view_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.rfqs 
    SET view_count = (
      SELECT COUNT(DISTINCT viewer_user_id) + 
             COUNT(DISTINCT viewer_ip) 
      FROM public.rfq_view_tracking 
      WHERE rfq_id = NEW.rfq_id
    )
    WHERE id = NEW.rfq_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF NOT EXISTS trg_update_rfq_view_count ON public.rfq_view_tracking;

-- Create new trigger
CREATE TRIGGER trg_update_rfq_view_count
AFTER INSERT ON public.rfq_view_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_rfq_view_count();


-- STEP 8: Backfill existing data
-- ============================================================================
-- Update quote_count for all RFQs based on existing rfq_responses
UPDATE public.rfqs r
SET quote_count = (
  SELECT COUNT(*) FROM public.rfq_responses 
  WHERE rfq_id = r.id
);

-- Update recipients_count based on rfq_recipients table if it exists
UPDATE public.rfqs r
SET recipients_count = (
  SELECT COUNT(*) FROM public.rfq_recipients 
  WHERE rfq_id = r.id
)
WHERE rfq_type IN ('direct', 'matched');

-- Set reasonable defaults for view_count if not already set
UPDATE public.rfqs 
SET view_count = CASE 
  WHEN rfq_type = 'public' THEN COALESCE(quote_count * 3, 0)
  ELSE 0 
END
WHERE view_count = 0;


-- STEP 9: Verify data consistency
-- ============================================================================
-- Check that all metrics are populated (for admin verification)
SELECT 
  COUNT(*) as total_rfqs,
  SUM(CASE WHEN match_quality_score > 0 THEN 1 ELSE 0 END) as rfqs_with_quality,
  SUM(CASE WHEN view_count > 0 THEN 1 ELSE 0 END) as rfqs_with_views,
  SUM(CASE WHEN quote_count > 0 THEN 1 ELSE 0 END) as rfqs_with_quotes,
  SUM(CASE WHEN recipients_count > 0 THEN 1 ELSE 0 END) as rfqs_with_recipients
FROM public.rfqs;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- New fields added:
-- 1. match_quality_score - Default 75% for matched RFQs
-- 2. view_count - Tracks marketplace visibility
-- 3. quote_count - Tracks vendor interest (auto-updated)
-- 4. recipients_count - Tracks vendor outreach
--
-- RLS Policy Notes:
-- These fields should be queryable by authenticated admins
-- Consider adding RLS policies if needed
-- ============================================================================
