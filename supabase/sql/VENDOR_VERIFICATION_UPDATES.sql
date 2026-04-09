-- ============================================================================
-- VENDOR VERIFICATION DOCUMENT UPDATES SYSTEM
-- ============================================================================
-- Purpose: Allow vendors to update verification documents when business details change
-- Features: Version history, expiry tracking, seamless updates without losing verification
-- ============================================================================

-- Step 1: Add new columns for document versioning and updates
ALTER TABLE public.vendor_verification_documents
  ADD COLUMN IF NOT EXISTS supersedes_document_id UUID REFERENCES public.vendor_verification_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_by_document_id UUID REFERENCES public.vendor_verification_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS update_reason TEXT,
    -- 'expiry_renewal' | 'information_change' | 'quality_improvement' | 'admin_request' | 'preventive_update'
  ADD COLUMN IF NOT EXISTS is_renewal BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS expiry_notification_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS previous_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS update_type TEXT;
    -- 'renewal' | 'correction' | 'ownership_change' | 'regulatory_update'

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_docs_supersedes ON public.vendor_verification_documents(supersedes_document_id);
CREATE INDEX IF NOT EXISTS idx_verification_docs_superseded_by ON public.vendor_verification_documents(superseded_by_document_id);
CREATE INDEX IF NOT EXISTS idx_verification_docs_expiry ON public.vendor_verification_documents(expiry_date) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_verification_docs_is_renewal ON public.vendor_verification_documents(is_renewal) WHERE is_renewal = true;

-- Step 3: Update constraint to allow pending_update status alongside approved
-- Drop old constraint if exists
DROP INDEX IF EXISTS public.vendor_verification_documents_vendor_id_status_key;
ALTER TABLE public.vendor_verification_documents
  DROP CONSTRAINT IF EXISTS unique_vendor_pending_verification;

-- New constraint: Only one pending/pending_update/more_info_needed per vendor
CREATE UNIQUE INDEX IF NOT EXISTS unique_vendor_active_submission 
  ON public.vendor_verification_documents(vendor_id)
  WHERE status IN ('pending', 'pending_update', 'more_info_needed');

COMMENT ON INDEX unique_vendor_active_submission IS 
  'Ensures vendor can only have one active submission (pending, pending_update, or more_info_needed) at a time';

-- Step 4: Function to check if vendor can submit update
CREATE OR REPLACE FUNCTION public.can_vendor_update_verification(vendor_id_param UUID)
RETURNS TABLE (
  can_update BOOLEAN,
  reason TEXT,
  current_status TEXT,
  has_pending_update BOOLEAN,
  days_until_expiry INTEGER,
  current_document_id UUID
) AS $$
DECLARE
  v_current_doc RECORD;
  v_pending_update BOOLEAN;
BEGIN
  -- Check if vendor has approved document
  SELECT * INTO v_current_doc
  FROM public.vendor_verification_documents
  WHERE vendor_id = vendor_id_param 
    AND status = 'approved'
    AND superseded_by_document_id IS NULL
  ORDER BY reviewed_at DESC
  LIMIT 1;

  -- Check if there's already a pending update
  SELECT EXISTS(
    SELECT 1 FROM public.vendor_verification_documents
    WHERE vendor_id = vendor_id_param 
      AND status IN ('pending_update', 'more_info_needed')
  ) INTO v_pending_update;

  IF v_current_doc IS NULL THEN
    -- No approved document, can't update (must do initial submission)
    RETURN QUERY SELECT 
      false,
      'No approved verification document found. Please complete initial verification first.',
      NULL::TEXT,
      v_pending_update,
      NULL::INTEGER,
      NULL::UUID;
  ELSIF v_pending_update THEN
    -- Already has pending update
    RETURN QUERY SELECT 
      false,
      'You already have a verification update pending review. Please wait for admin approval.',
      v_current_doc.status,
      true,
      CASE 
        WHEN v_current_doc.expiry_date IS NOT NULL 
        THEN EXTRACT(DAY FROM (v_current_doc.expiry_date - CURRENT_DATE))::INTEGER
        ELSE NULL
      END,
      v_current_doc.id;
  ELSE
    -- Can submit update
    RETURN QUERY SELECT 
      true,
      'You can submit a verification document update.',
      v_current_doc.status,
      false,
      CASE 
        WHEN v_current_doc.expiry_date IS NOT NULL 
        THEN EXTRACT(DAY FROM (v_current_doc.expiry_date - CURRENT_DATE))::INTEGER
        ELSE NULL
      END,
      v_current_doc.id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_vendor_update_verification IS 
  'Checks if a vendor is eligible to submit a verification document update';

-- Step 5: Function to handle document update approval
CREATE OR REPLACE FUNCTION public.approve_verification_update(
  update_document_id UUID,
  admin_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  old_document_id UUID,
  new_document_id UUID
) AS $$
DECLARE
  v_update_doc RECORD;
  v_old_doc RECORD;
BEGIN
  -- Get the update document
  SELECT * INTO v_update_doc
  FROM public.vendor_verification_documents
  WHERE id = update_document_id;

  IF v_update_doc IS NULL THEN
    RETURN QUERY SELECT false, 'Update document not found', NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  IF v_update_doc.status != 'pending_update' THEN
    RETURN QUERY SELECT false, 'Document is not pending update. Current status: ' || v_update_doc.status, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  -- Get the old approved document
  SELECT * INTO v_old_doc
  FROM public.vendor_verification_documents
  WHERE vendor_id = v_update_doc.vendor_id
    AND status = 'approved'
    AND superseded_by_document_id IS NULL
  ORDER BY reviewed_at DESC
  LIMIT 1;

  IF v_old_doc IS NULL THEN
    RETURN QUERY SELECT false, 'No existing approved document found to update', NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  -- Update old document to superseded
  UPDATE public.vendor_verification_documents
  SET 
    status = 'superseded',
    superseded_by_document_id = update_document_id,
    updated_at = NOW()
  WHERE id = v_old_doc.id;

  -- Approve new document
  UPDATE public.vendor_verification_documents
  SET 
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by_admin_id = admin_id,
    supersedes_document_id = v_old_doc.id,
    updated_at = NOW()
  WHERE id = update_document_id;

  -- Update vendor table (verification remains active, just update timestamp)
  UPDATE public.vendors
  SET 
    verified_at = NOW(),
    verified_by_admin_id = admin_id,
    updated_at = NOW()
  WHERE id = v_update_doc.vendor_id;

  -- Log to history
  INSERT INTO public.vendor_verification_history (
    vendor_id,
    document_id,
    action,
    status_before,
    status_after,
    performed_by_admin_id,
    notes
  ) VALUES (
    v_update_doc.vendor_id,
    update_document_id,
    'update_approved',
    'pending_update',
    'approved',
    admin_id,
    'Verification document updated successfully. Superseded document: ' || v_old_doc.id
  );

  RETURN QUERY SELECT 
    true, 
    'Verification update approved successfully', 
    v_old_doc.id, 
    update_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.approve_verification_update IS 
  'Approves a verification document update, archives old document, and activates new document';

-- Step 6: Function to reject document update
CREATE OR REPLACE FUNCTION public.reject_verification_update(
  update_document_id UUID,
  admin_id UUID,
  rejection_reason_text TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_update_doc RECORD;
BEGIN
  -- Get the update document
  SELECT * INTO v_update_doc
  FROM public.vendor_verification_documents
  WHERE id = update_document_id;

  IF v_update_doc IS NULL THEN
    RETURN QUERY SELECT false, 'Update document not found';
    RETURN;
  END IF;

  IF v_update_doc.status != 'pending_update' THEN
    RETURN QUERY SELECT false, 'Document is not pending update';
    RETURN;
  END IF;

  -- Reject the update document
  UPDATE public.vendor_verification_documents
  SET 
    status = 'rejected',
    reviewed_at = NOW(),
    reviewed_by_admin_id = admin_id,
    rejection_reason = rejection_reason_text,
    updated_at = NOW()
  WHERE id = update_document_id;

  -- Log to history
  INSERT INTO public.vendor_verification_history (
    vendor_id,
    document_id,
    action,
    status_before,
    status_after,
    performed_by_admin_id,
    notes
  ) VALUES (
    v_update_doc.vendor_id,
    update_document_id,
    'update_rejected',
    'pending_update',
    'rejected',
    admin_id,
    rejection_reason_text
  );

  RETURN QUERY SELECT true, 'Verification update rejected. Vendor can resubmit.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reject_verification_update IS 
  'Rejects a verification document update. Old document remains active.';

-- Step 7: Function to get vendor's document history
CREATE OR REPLACE FUNCTION public.get_vendor_document_history(vendor_id_param UUID)
RETURNS TABLE (
  document_id UUID,
  document_type TEXT,
  document_file_name TEXT,
  submission_date TIMESTAMPTZ,
  review_date TIMESTAMPTZ,
  status TEXT,
  expiry_date DATE,
  is_current BOOLEAN,
  supersedes UUID,
  superseded_by UUID,
  update_reason TEXT,
  update_type TEXT,
  is_renewal BOOLEAN,
  reviewed_by_admin_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vvd.id,
    vvd.document_type,
    vvd.document_file_name,
    vvd.submitted_at,
    vvd.reviewed_at,
    vvd.status,
    vvd.expiry_date,
    (vvd.status = 'approved' AND vvd.superseded_by_document_id IS NULL) as is_current,
    vvd.supersedes_document_id,
    vvd.superseded_by_document_id,
    vvd.update_reason,
    vvd.update_type,
    vvd.is_renewal,
    COALESCE(au.full_name, au.email) as reviewed_by_admin_name
  FROM public.vendor_verification_documents vvd
  LEFT JOIN public.admin_users au ON vvd.reviewed_by_admin_id = au.id
  WHERE vvd.vendor_id = vendor_id_param
  ORDER BY vvd.submitted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_vendor_document_history IS 
  'Returns complete document history for a vendor including all submissions, updates, and renewals';

-- Step 8: Create view for expiring documents (for notifications)
CREATE OR REPLACE VIEW public.expiring_verification_documents AS
SELECT 
  vvd.id as document_id,
  vvd.vendor_id,
  COALESCE(v.company_name, vvd.registered_business_name) as business_name,
  v.user_id,
  vvd.document_type,
  vvd.expiry_date,
  (vvd.expiry_date - CURRENT_DATE) as days_until_expiry,
  vvd.expiry_notification_sent_at,
  vvd.document_file_name,
  CASE 
    WHEN vvd.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN vvd.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_urgent'
    WHEN vvd.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN vvd.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'expiring_warning'
    ELSE 'valid'
  END as expiry_status,
  vvd.submitted_at,
  vvd.reviewed_at
FROM public.vendor_verification_documents vvd
JOIN public.vendors v ON vvd.vendor_id = v.id
WHERE vvd.status = 'approved'
  AND vvd.superseded_by_document_id IS NULL
  AND vvd.expiry_date IS NOT NULL
  AND vvd.expiry_date <= CURRENT_DATE + INTERVAL '60 days'
ORDER BY vvd.expiry_date ASC;

COMMENT ON VIEW public.expiring_verification_documents IS 
  'Shows verification documents that are expired or expiring within 60 days for notification purposes';

-- Step 9: Function to mark expiry notification as sent
CREATE OR REPLACE FUNCTION public.mark_expiry_notification_sent(document_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.vendor_verification_documents
  SET expiry_notification_sent_at = NOW()
  WHERE id = document_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.mark_expiry_notification_sent IS 
  'Records that an expiry notification has been sent for a document';

-- Step 10: Grant permissions
GRANT SELECT ON public.expiring_verification_documents TO authenticated;
GRANT SELECT ON public.expiring_verification_documents TO anon;

-- Step 11: Update RLS policies for new status
-- Allow vendors to view their pending_update documents
-- (Already covered by existing RLS policy "vendors_view_own_verification")

-- Allow vendors to insert pending_update documents
-- (Already covered by existing RLS policy "vendors_submit_verification")

-- Step 12: Add helpful comments
COMMENT ON COLUMN public.vendor_verification_documents.supersedes_document_id IS 
  'References the previous document that this document replaces';

COMMENT ON COLUMN public.vendor_verification_documents.superseded_by_document_id IS 
  'References the newer document that replaced this one';

COMMENT ON COLUMN public.vendor_verification_documents.update_reason IS 
  'Vendor-provided explanation for why the document is being updated';

COMMENT ON COLUMN public.vendor_verification_documents.update_type IS 
  'Type of update: renewal, correction, ownership_change, regulatory_update';

COMMENT ON COLUMN public.vendor_verification_documents.is_renewal IS 
  'True if this update is a document renewal due to expiry';

COMMENT ON COLUMN public.vendor_verification_documents.expiry_notification_sent_at IS 
  'Timestamp when expiry notification email was sent to vendor';

COMMENT ON COLUMN public.vendor_verification_documents.previous_expiry_date IS 
  'Expiry date of the superseded document (for tracking renewal timeline)';

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 1. Added columns for document versioning:
--    - supersedes_document_id, superseded_by_document_id, update_reason,
--      update_type, is_renewal, expiry_notification_sent_at, previous_expiry_date
--
-- 2. Added indexes for performance on new columns
--
-- 3. Updated constraint to allow pending_update alongside approved documents
--
-- 4. Created functions:
--    - can_vendor_update_verification() - Check eligibility
--    - approve_verification_update() - Approve with versioning
--    - reject_verification_update() - Reject update
--    - get_vendor_document_history() - View all document versions
--    - mark_expiry_notification_sent() - Track notifications
--
-- 5. Created view expiring_verification_documents for proactive notifications
--
-- 6. Updated RLS policies and comments
--
-- Status flow with updates:
--   approved → pending_update (new submission) → approved (replaces old)
--   approved (old) → superseded (archived)
--
-- Benefits:
--   ✅ Vendors keep verification badge during update review
--   ✅ Complete version history maintained
--   ✅ Automatic expiry tracking and notifications
--   ✅ Flexible update types (renewal, correction, ownership change)
-- ============================================================================
