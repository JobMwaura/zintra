-- ============================================================================
-- MIGRATION: Add is_favorite column to rfqs table
-- ============================================================================
-- Adds the missing is_favorite column to track user favorites
-- ============================================================================

ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create index for faster filtering of favorites
CREATE INDEX IF NOT EXISTS idx_rfqs_is_favorite ON public.rfqs(user_id, is_favorite)
WHERE is_favorite = true;

-- ============================================================================
-- Summary
-- ============================================================================
-- New column: is_favorite BOOLEAN (default: false)
-- New index: idx_rfqs_is_favorite (for fast favorite queries)
-- ============================================================================
