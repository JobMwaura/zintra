-- ============================================================================
-- VENDOR STATUS UPDATES AND RFQ INBOX FEATURES
-- ============================================================================
-- This migration adds:
-- 1. Vendor Status Updates - Facebook-like feed for vendors to post updates
-- 2. RFQ Inbox - Unified interface for tracking all RFQ types received
-- ============================================================================

-- ============================================================================
-- PART 1: VENDOR STATUS UPDATES TABLE
-- ============================================================================
-- Allows vendors to post status updates with text and photos (like Facebook)

CREATE TABLE IF NOT EXISTS public.vendor_status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  content text NOT NULL,
  images text[] DEFAULT ARRAY[]::text[], -- Array of image URLs
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_status_updates_vendor_id ON public.vendor_status_updates(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_status_updates_created_at ON public.vendor_status_updates(created_at DESC);

-- Add comment for clarity
COMMENT ON TABLE public.vendor_status_updates IS 'Vendor status updates - similar to Facebook posts. Vendors can post text, photos, and updates about their business.';
COMMENT ON COLUMN public.vendor_status_updates.content IS 'Main text content of the status update';
COMMENT ON COLUMN public.vendor_status_updates.images IS 'Array of image URLs for the status update';
COMMENT ON COLUMN public.vendor_status_updates.likes_count IS 'Total number of likes on this update';

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_status_updates TO authenticated;

-- ============================================================================
-- PART 2: VENDOR STATUS UPDATES LIKES TABLE
-- ============================================================================
-- Track who liked which status updates

CREATE TABLE IF NOT EXISTS public.vendor_status_update_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id uuid NOT NULL REFERENCES public.vendor_status_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(update_id, user_id) -- Prevent duplicate likes
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendor_status_update_likes_update_id ON public.vendor_status_update_likes(update_id);
CREATE INDEX IF NOT EXISTS idx_vendor_status_update_likes_user_id ON public.vendor_status_update_likes(user_id);

COMMENT ON TABLE public.vendor_status_update_likes IS 'Tracks likes on vendor status updates';

GRANT SELECT, INSERT, DELETE ON public.vendor_status_update_likes TO authenticated;

-- ============================================================================
-- PART 3: VENDOR STATUS UPDATES COMMENTS TABLE
-- ============================================================================
-- Allow comments on status updates

CREATE TABLE IF NOT EXISTS public.vendor_status_update_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id uuid NOT NULL REFERENCES public.vendor_status_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendor_status_update_comments_update_id ON public.vendor_status_update_comments(update_id);
CREATE INDEX IF NOT EXISTS idx_vendor_status_update_comments_user_id ON public.vendor_status_update_comments(user_id);

COMMENT ON TABLE public.vendor_status_update_comments IS 'Comments on vendor status updates';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_status_update_comments TO authenticated;

-- ============================================================================
-- PART 4: RFQ INBOX VIEW
-- ============================================================================
-- Unified view of all RFQ types a vendor received (Direct, Public, Matched, Wizard)

CREATE OR REPLACE VIEW public.vendor_rfq_inbox AS
SELECT 
  r.id,
  r.id AS rfq_id,
  r.user_id AS requester_id,
  rr.vendor_id,
  r.title,
  r.description,
  r.category,
  r.county,
  r.created_at,
  r.status,
  COALESCE(rr.recipient_type, 'public') AS rfq_type, -- direct, matched, wizard, public
  COALESCE(rr.viewed_at, NULL) AS viewed_at,
  CASE 
    WHEN rr.recipient_type = 'direct' THEN 'Direct RFQ'
    WHEN rr.recipient_type = 'matched' THEN 'Admin-Matched RFQ'
    WHEN rr.recipient_type = 'wizard' THEN 'Wizard RFQ'
    ELSE 'Public RFQ'
  END AS rfq_type_label,
  (SELECT COUNT(*) FROM public.rfq_quotes WHERE rfq_id = r.id AND vendor_id = rr.vendor_id)::integer AS quote_count,
  (SELECT COUNT(*) FROM public.rfq_quotes WHERE rfq_id = r.id)::integer AS total_quotes,
  u.email AS requester_email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) AS requester_name
FROM public.rfqs r
LEFT JOIN public.rfq_recipients rr ON r.id = rr.rfq_id
LEFT JOIN auth.users u ON r.user_id = u.id
WHERE rr.vendor_id IS NOT NULL OR r.type = 'public'
ORDER BY r.created_at DESC;

COMMENT ON VIEW public.vendor_rfq_inbox IS 'Unified view of all RFQs received by a vendor, including direct, matched, wizard, and public RFQs';

-- ============================================================================
-- PART 5: RFQ INBOX STATS TABLE (For Performance)
-- ============================================================================
-- Cache stats about RFQs for each vendor to avoid expensive queries

CREATE TABLE IF NOT EXISTS public.vendor_rfq_inbox_stats (
  vendor_id uuid PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
  total_rfqs integer DEFAULT 0,
  direct_rfqs integer DEFAULT 0,
  matched_rfqs integer DEFAULT 0,
  wizard_rfqs integer DEFAULT 0,
  public_rfqs integer DEFAULT 0,
  unread_rfqs integer DEFAULT 0,
  pending_rfqs integer DEFAULT 0,
  accepted_rfqs integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendor_rfq_inbox_stats_vendor_id ON public.vendor_rfq_inbox_stats(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_rfq_inbox_stats_last_updated ON public.vendor_rfq_inbox_stats(last_updated);

COMMENT ON TABLE public.vendor_rfq_inbox_stats IS 'Cached statistics for vendor RFQ inbox to improve performance';

GRANT SELECT, INSERT, UPDATE ON public.vendor_rfq_inbox_stats TO authenticated;

-- ============================================================================
-- PART 6: HELPER FUNCTIONS
-- ============================================================================

-- Function to update vendor status update stats when liked
CREATE OR REPLACE FUNCTION public.increment_status_update_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vendor_status_updates
  SET likes_count = likes_count + 1
  WHERE id = NEW.update_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for incrementing likes
DROP TRIGGER IF EXISTS trigger_increment_status_update_likes ON public.vendor_status_update_likes;
CREATE TRIGGER trigger_increment_status_update_likes
AFTER INSERT ON public.vendor_status_update_likes
FOR EACH ROW
EXECUTE FUNCTION public.increment_status_update_likes();

-- Function to decrement likes when unliked
CREATE OR REPLACE FUNCTION public.decrement_status_update_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vendor_status_updates
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = OLD.update_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for decrementing likes
DROP TRIGGER IF EXISTS trigger_decrement_status_update_likes ON public.vendor_status_update_likes;
CREATE TRIGGER trigger_decrement_status_update_likes
AFTER DELETE ON public.vendor_status_update_likes
FOR EACH ROW
EXECUTE FUNCTION public.decrement_status_update_likes();

-- Function to increment comment count
CREATE OR REPLACE FUNCTION public.increment_status_update_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vendor_status_updates
  SET comments_count = comments_count + 1
  WHERE id = NEW.update_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for incrementing comment count
DROP TRIGGER IF EXISTS trigger_increment_status_update_comments ON public.vendor_status_update_comments;
CREATE TRIGGER trigger_increment_status_update_comments
AFTER INSERT ON public.vendor_status_update_comments
FOR EACH ROW
EXECUTE FUNCTION public.increment_status_update_comments();

-- Function to decrement comment count
CREATE OR REPLACE FUNCTION public.decrement_status_update_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vendor_status_updates
  SET comments_count = GREATEST(comments_count - 1, 0)
  WHERE id = OLD.update_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for decrementing comment count
DROP TRIGGER IF EXISTS trigger_decrement_status_update_comments ON public.vendor_status_update_comments;
CREATE TRIGGER trigger_decrement_status_update_comments
AFTER DELETE ON public.vendor_status_update_comments
FOR EACH ROW
EXECUTE FUNCTION public.decrement_status_update_comments();

-- ============================================================================
-- PART 7: RFQ TYPES REFERENCE
-- ============================================================================
-- This explains the RFQ types supported:
--
-- 1. DIRECT RFQ:
--    - User sends RFQ directly to specific vendor
--    - Stored in rfq_recipients with recipient_type = 'direct'
--    - Only the selected vendor receives this RFQ
--
-- 2. PUBLIC RFQ:
--    - Posted to all vendors in the marketplace
--    - NOT in rfq_recipients (or recipient_type = 'public')
--    - Any vendor can view and submit quotes
--
-- 3. ADMIN-MATCHED RFQ:
--    - Admin selects specific vendors for RFQ
--    - Stored in rfq_recipients with recipient_type = 'matched'
--    - Only selected vendors receive notification
--
-- 4. WIZARD RFQ:
--    - Auto-matched by system based on category and location
--    - Stored in rfq_recipients with recipient_type = 'wizard'
--    - Only matched vendors receive notification

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

-- Get all RFQs for a specific vendor (all types combined)
-- SELECT * FROM public.vendor_rfq_inbox WHERE vendor_id = 'VENDOR_UUID';

-- Get only unread RFQs
-- SELECT * FROM public.vendor_rfq_inbox WHERE vendor_id = 'VENDOR_UUID' AND viewed_at IS NULL;

-- Get RFQs by type
-- SELECT * FROM public.vendor_rfq_inbox WHERE vendor_id = 'VENDOR_UUID' AND rfq_type = 'direct';

-- Get vendor's recent status updates
-- SELECT * FROM public.vendor_status_updates WHERE vendor_id = 'VENDOR_UUID' ORDER BY created_at DESC LIMIT 20;

-- Get most liked status updates
-- SELECT * FROM public.vendor_status_updates ORDER BY likes_count DESC LIMIT 10;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
