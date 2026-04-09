-- ============================================================================
-- VENDOR VERIFICATION SYSTEM
-- ============================================================================
-- Purpose: Enable vendors to verify their businesses for trust and credibility
-- Features: Document upload, admin review, verification badges, priority listing
-- ============================================================================

-- Step 1: Add verification columns to vendors table
ALTER TABLE public.vendors 
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified', 
    -- 'unverified' | 'pending' | 'approved' | 'rejected' | 'expired'
  ADD COLUMN IF NOT EXISTS verification_badge_type TEXT DEFAULT 'none',
    -- 'none' | 'business' | 'premium' | 'enterprise' (for future tiers)
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by_admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ, -- Optional: for renewal
  ADD COLUMN IF NOT EXISTS verification_score INTEGER DEFAULT 0; -- 0-100 trust score

-- Step 2: Create vendor_verification_documents table
CREATE TABLE IF NOT EXISTS public.vendor_verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Document info
  document_type TEXT NOT NULL, 
    -- 'business_registration' | 'tax_id' | 'business_license' | 'trade_license' | 'other'
  document_url TEXT NOT NULL, -- S3 URL to uploaded document
  document_file_name TEXT,
  document_number TEXT, -- Registration/License number
  
  -- Business details submitted by vendor
  registered_business_name TEXT NOT NULL,
  registration_number TEXT,
  country_of_registration TEXT NOT NULL,
  business_address TEXT,
  issue_date DATE,
  expiry_date DATE,
  
  -- Review status
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'more_info_needed'
  submission_number INTEGER DEFAULT 1, -- Track resubmissions
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by_admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  
  -- Admin review feedback
  admin_notes TEXT,
  rejection_reason TEXT,
  requested_additional_info TEXT,
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_vendor_pending_verification UNIQUE(vendor_id, status) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Step 3: Create vendor_verification_history table (audit trail)
CREATE TABLE IF NOT EXISTS public.vendor_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.vendor_verification_documents(id) ON DELETE SET NULL,
  
  action TEXT NOT NULL, -- 'submitted' | 'approved' | 'rejected' | 'info_requested' | 'resubmitted'
  status_before TEXT,
  status_after TEXT,
  
  performed_by_admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_is_verified ON public.vendors(is_verified);
CREATE INDEX IF NOT EXISTS idx_vendors_verification_status ON public.vendors(verification_status);
CREATE INDEX IF NOT EXISTS idx_vendors_verification_score ON public.vendors(verification_score DESC);

CREATE INDEX IF NOT EXISTS idx_verification_docs_vendor ON public.vendor_verification_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_verification_docs_status ON public.vendor_verification_documents(status);
CREATE INDEX IF NOT EXISTS idx_verification_docs_submitted ON public.vendor_verification_documents(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_history_vendor ON public.vendor_verification_history(vendor_id);
CREATE INDEX IF NOT EXISTS idx_verification_history_created ON public.vendor_verification_history(created_at DESC);

-- Step 5: Enable RLS on new tables
ALTER TABLE public.vendor_verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_verification_history ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS Policies for vendor_verification_documents
-- Vendors can view their own verification documents
CREATE POLICY "vendors_view_own_verification" 
ON public.vendor_verification_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_id AND v.user_id = auth.uid()
  )
);

-- Vendors can submit their own verification documents
CREATE POLICY "vendors_submit_verification" 
ON public.vendor_verification_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_id AND v.user_id = auth.uid()
  )
);

-- Vendors can update only pending documents (for resubmission)
CREATE POLICY "vendors_update_pending_verification" 
ON public.vendor_verification_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_id AND v.user_id = auth.uid()
  )
  AND status IN ('pending', 'more_info_needed')
);

-- Admins can view and manage all verification documents
CREATE POLICY "admins_manage_verification" 
ON public.vendor_verification_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- Step 7: RLS Policies for vendor_verification_history
-- Vendors can view their own verification history
CREATE POLICY "vendors_view_own_history" 
ON public.vendor_verification_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_id AND v.user_id = auth.uid()
  )
);

-- Admins can view all verification history
CREATE POLICY "admins_view_all_history" 
ON public.vendor_verification_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- System can insert history (no user restrictions)
CREATE POLICY "system_insert_history" 
ON public.vendor_verification_history
FOR INSERT
WITH CHECK (true);

-- Step 8: Create trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_verification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_verification_docs_timestamp ON public.vendor_verification_documents;
CREATE TRIGGER update_verification_docs_timestamp
BEFORE UPDATE ON public.vendor_verification_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_verification_timestamp();

-- Step 9: Create function to log verification actions
CREATE OR REPLACE FUNCTION public.log_verification_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Log to verification history when status changes
  IF TG_OP = 'UPDATE' AND (NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.vendor_verification_history (
      vendor_id,
      document_id,
      action,
      status_before,
      status_after,
      performed_by_admin_id,
      notes
    ) VALUES (
      NEW.vendor_id,
      NEW.id,
      CASE NEW.status
        WHEN 'approved' THEN 'approved'
        WHEN 'rejected' THEN 'rejected'
        WHEN 'more_info_needed' THEN 'info_requested'
        ELSE 'status_changed'
      END,
      OLD.status,
      NEW.status,
      NEW.reviewed_by_admin_id,
      NEW.admin_notes
    );
    
    -- Update vendor verification status
    IF NEW.status = 'approved' THEN
      UPDATE public.vendors
      SET 
        is_verified = true,
        verification_status = 'approved',
        verified_at = NOW(),
        verified_by_admin_id = NEW.reviewed_by_admin_id,
        verification_score = 85, -- Base score for verified vendors
        verification_badge_type = 'business'
      WHERE id = NEW.vendor_id;
    ELSIF NEW.status = 'rejected' THEN
      UPDATE public.vendors
      SET 
        is_verified = false,
        verification_status = 'rejected',
        verification_score = 0
      WHERE id = NEW.vendor_id;
    END IF;
  END IF;
  
  -- Log initial submission
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.vendor_verification_history (
      vendor_id,
      document_id,
      action,
      status_after
    ) VALUES (
      NEW.vendor_id,
      NEW.id,
      'submitted',
      NEW.status
    );
    
    -- Update vendor status to pending
    UPDATE public.vendors
    SET verification_status = 'pending'
    WHERE id = NEW.vendor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_verification_actions ON public.vendor_verification_documents;
CREATE TRIGGER log_verification_actions
AFTER INSERT OR UPDATE ON public.vendor_verification_documents
FOR EACH ROW
EXECUTE FUNCTION public.log_verification_action();

-- Step 10: Create function to get vendor verification status
CREATE OR REPLACE FUNCTION public.get_vendor_verification_status(vendor_id_param UUID)
RETURNS TABLE (
  is_verified BOOLEAN,
  status TEXT,
  badge_type TEXT,
  verified_at TIMESTAMPTZ,
  verification_score INTEGER,
  pending_submission BOOLEAN,
  can_resubmit BOOLEAN,
  latest_rejection_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.is_verified,
    v.verification_status,
    v.verification_badge_type,
    v.verified_at,
    v.verification_score,
    EXISTS(
      SELECT 1 FROM public.vendor_verification_documents vd
      WHERE vd.vendor_id = vendor_id_param AND vd.status = 'pending'
    ) as pending_submission,
    (
      v.verification_status = 'rejected' OR 
      v.verification_status = 'unverified' OR
      EXISTS(
        SELECT 1 FROM public.vendor_verification_documents vd
        WHERE vd.vendor_id = vendor_id_param AND vd.status = 'more_info_needed'
      )
    ) as can_resubmit,
    (
      SELECT vd.rejection_reason 
      FROM public.vendor_verification_documents vd
      WHERE vd.vendor_id = vendor_id_param AND vd.status = 'rejected'
      ORDER BY vd.reviewed_at DESC
      LIMIT 1
    ) as latest_rejection_reason
  FROM public.vendors v
  WHERE v.id = vendor_id_param;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create function to calculate vendor listing priority
CREATE OR REPLACE FUNCTION public.calculate_vendor_priority_score(vendor_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  priority_score INTEGER := 0;
  vendor_record RECORD;
BEGIN
  SELECT 
    v.is_verified,
    v.verification_score,
    v.logo_url IS NOT NULL as has_logo,
    v.cover_image IS NOT NULL as has_cover,
    v.description IS NOT NULL AND LENGTH(v.description) > 100 as has_description,
    v.rating,
    v.total_reviews,
    v.created_at
  INTO vendor_record
  FROM public.vendors v
  WHERE v.id = vendor_id_param;
  
  -- Verified vendors get highest priority (1000 points)
  IF vendor_record.is_verified THEN
    priority_score := priority_score + 1000;
    priority_score := priority_score + (vendor_record.verification_score * 5); -- Add verification score
  END IF;
  
  -- Profile completeness (300 points max)
  IF vendor_record.has_logo THEN
    priority_score := priority_score + 150;
  END IF;
  
  IF vendor_record.has_cover THEN
    priority_score := priority_score + 100;
  END IF;
  
  IF vendor_record.has_description THEN
    priority_score := priority_score + 50;
  END IF;
  
  -- Rating and reviews (200 points max)
  IF vendor_record.rating IS NOT NULL THEN
    priority_score := priority_score + (vendor_record.rating * 20)::INTEGER;
  END IF;
  
  IF vendor_record.total_reviews > 0 THEN
    priority_score := priority_score + LEAST(vendor_record.total_reviews * 2, 100);
  END IF;
  
  -- Activity bonus (newer vendors get slight boost)
  IF vendor_record.created_at > NOW() - INTERVAL '30 days' THEN
    priority_score := priority_score + 50;
  END IF;
  
  RETURN priority_score;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create view for vendor listing with priority
CREATE OR REPLACE VIEW public.vendors_with_priority AS
SELECT 
  v.*,
  CASE 
    WHEN v.is_verified THEN 1
    WHEN v.logo_url IS NOT NULL THEN 2
    ELSE 3
  END as listing_priority_tier,
  calculate_vendor_priority_score(v.id) as priority_score
FROM public.vendors v
WHERE v.status = 'active';

-- Step 13: Grant permissions
GRANT SELECT ON public.vendors_with_priority TO authenticated;
GRANT SELECT ON public.vendors_with_priority TO anon;

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 1. Added verification columns to vendors table:
--    - is_verified, verification_status, badge_type, verified_at, verification_score
--
-- 2. Created vendor_verification_documents table:
--    - Store uploaded business documents
--    - Track submission and review status
--    - Admin review feedback and notes
--
-- 3. Created vendor_verification_history table:
--    - Complete audit trail of verification actions
--    - Track status changes and admin actions
--
-- 4. Created automatic triggers:
--    - Auto-log verification actions to history
--    - Auto-update vendor verification status on approval/rejection
--
-- 5. Created helper functions:
--    - get_vendor_verification_status() - Get full verification info
--    - calculate_vendor_priority_score() - Smart listing priority
--
-- 6. Created vendors_with_priority view:
--    - Tier 1: Verified vendors (priority_score 1000+)
--    - Tier 2: Vendors with profile images (priority_score 150-300)
--    - Tier 3: Basic vendors (priority_score 0-149)
--
-- 7. Implemented RLS policies:
--    - Vendors can submit and view their own documents
--    - Admins can review and manage all verifications
--
-- ============================================================================
