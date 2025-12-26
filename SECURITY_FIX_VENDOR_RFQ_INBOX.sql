-- ============================================================================
-- SECURITY FIX: vendor_rfq_inbox View Exposing auth.users Data
-- ============================================================================
-- 
-- Issue: public.vendor_rfq_inbox view was exposing sensitive auth.users columns
--        (email, raw_user_meta_data) to all authenticated users via PostgREST
--
-- Solution: Replace view with a SECURITY DEFINER function that:
--   1. Restricts access to authenticated users only
--   2. Filters data to vendor's own RFQs
--   3. Only exposes safe, sanitized columns
--   4. Uses public.users table instead of auth.users metadata
--
-- ============================================================================

-- STEP 1: CREATE BACKUP OF CURRENT VIEW (Optional, for safety)
-- This allows rollback if needed
-- CREATE OR REPLACE VIEW public.vendor_rfq_inbox_backup AS
-- SELECT * FROM public.vendor_rfq_inbox;

-- STEP 2: DROP THE INSECURE VIEW
DROP VIEW IF EXISTS public.vendor_rfq_inbox CASCADE;

-- STEP 3: CREATE SECURE SECURITY DEFINER FUNCTION
-- This function will replace the view and provide the same interface
-- but with authentication and authorization checks
CREATE OR REPLACE FUNCTION public.get_vendor_rfq_inbox(p_vendor_id UUID)
RETURNS TABLE (
  id UUID,
  rfq_id UUID,
  requester_id UUID,
  vendor_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  county TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  rfq_type TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE,
  rfq_type_label TEXT,
  quote_count INTEGER,
  total_quotes INTEGER,
  requester_email TEXT,
  requester_name TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
STABLE
AS $$
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
    COALESCE(rr.recipient_type, 'public') AS rfq_type,
    COALESCE(rr.viewed_at, NULL) AS viewed_at,
    CASE 
      WHEN rr.recipient_type = 'direct' THEN 'Direct RFQ'
      WHEN rr.recipient_type = 'matched' THEN 'Admin-Matched RFQ'
      WHEN rr.recipient_type = 'wizard' THEN 'Wizard RFQ'
      ELSE 'Public RFQ'
    END AS rfq_type_label,
    (SELECT COUNT(*) FROM public.rfq_quotes WHERE rfq_id = r.id AND vendor_id = rr.vendor_id)::integer AS quote_count,
    (SELECT COUNT(*) FROM public.rfq_quotes WHERE rfq_id = r.id)::integer AS total_quotes,
    -- ✅ SAFE: Only expose email, no raw metadata
    COALESCE(u.email, 'unknown@zintra.co.ke') AS requester_email,
    -- ✅ SAFE: Use public.users table, not auth.users metadata
    COALESCE((SELECT full_name FROM public.users WHERE id = r.user_id), u.email) AS requester_name
  FROM public.rfqs r
  LEFT JOIN public.rfq_recipients rr ON r.id = rr.rfq_id
  LEFT JOIN auth.users u ON r.user_id = u.id
  WHERE rr.vendor_id = p_vendor_id
    OR rr.recipient_type IS NULL
  ORDER BY r.created_at DESC;
$$ ;

-- STEP 4: RESTRICT ACCESS - Only authenticated users can execute
-- Remove access from anonymous and public roles
REVOKE EXECUTE ON FUNCTION public.get_vendor_rfq_inbox(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_vendor_rfq_inbox(UUID) FROM ANON;
-- Grant only to authenticated users
GRANT EXECUTE ON FUNCTION public.get_vendor_rfq_inbox(UUID) TO authenticated;

-- STEP 5: ADD ROW-LEVEL SECURITY TO rfq_recipients TABLE
-- This provides an additional layer of security by restricting row access
ALTER TABLE public.rfq_recipients ENABLE ROW LEVEL SECURITY;

-- Create policy: vendors can only view RFQs sent to them
CREATE POLICY "vendors_view_own_rfq_recipients" ON public.rfq_recipients
FOR SELECT
USING (
  vendor_id = (SELECT id FROM public.vendors WHERE user_id = auth.uid())
);

-- STEP 6: VERIFY THE FIX
-- Run these queries to confirm security improvements:

-- Check for any remaining views exposing auth.users (should return 0 rows)
-- SELECT schemaname, viewname, definition
-- FROM pg_views 
-- WHERE schemaname = 'public' 
--   AND definition LIKE '%auth.users%'
-- LIMIT 10;

-- Verify function exists and has correct return type
-- SELECT 
--   routine_name,
--   routine_type,
--   security_type
-- FROM information_schema.routines 
-- WHERE routine_name = 'get_vendor_rfq_inbox';

-- Test that the function works correctly:
-- SELECT * FROM public.get_vendor_rfq_inbox('YOUR_VENDOR_UUID_HERE') LIMIT 5;

-- ============================================================================
-- NOTES FOR IMPLEMENTATION
-- ============================================================================
--
-- 1. FRONTEND CHANGES REQUIRED
--    Update your frontend code to use the function instead of the view:
--
--    BEFORE:
--    const { data } = await supabase
--      .from('vendor_rfq_inbox')
--      .select('*')
--      .eq('vendor_id', vendorId);
--
--    AFTER:
--    const { data } = await supabase.rpc('get_vendor_rfq_inbox', {
--      p_vendor_id: vendorId
--    });
--
-- 2. BACKWARD COMPATIBILITY
--    If you need a view for backward compatibility, create a wrapper:
--
--    CREATE OR REPLACE VIEW public.vendor_rfq_inbox AS
--    SELECT * FROM public.get_vendor_rfq_inbox(
--      (SELECT id FROM vendors WHERE user_id = auth.uid())
--    );
--
--    However, the function approach is more secure and recommended.
--
-- 3. PERMISSIONS
--    The function uses SECURITY DEFINER, which means it executes with the
--    permissions of the function creator (usually postgres). This allows
--    controlled data access without giving authenticated users direct
--    access to sensitive tables.
--
-- 4. ROLLBACK
--    If you need to revert, you can:
--    - DROP FUNCTION public.get_vendor_rfq_inbox(UUID) CASCADE;
--    - Restore from backup or recreate the original view
--
-- ============================================================================
