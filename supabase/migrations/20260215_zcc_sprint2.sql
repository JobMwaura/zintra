-- ============================================
-- ZCC Sprint 2: Application Pipeline + Contact Unlock + Job Orders
-- Run this in Supabase SQL Editor AFTER Sprint 1 migration
-- ============================================

-- 1. EXPAND application status enum to include 'screened' and 'offer'
-- PostgreSQL CHECK constraints must be dropped and re-created
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check 
  CHECK (status IN ('applied', 'screened', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'));

-- 2. Add status tracking columns to applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]';

-- 3. Add cover_letter column (candidates can include a note)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter TEXT;

-- 4. Index for pipeline queries
CREATE INDEX IF NOT EXISTS idx_applications_listing_status 
  ON applications(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_candidate 
  ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status_updated 
  ON applications(status_updated_at DESC);

-- 5. RPC: Update application status (with history tracking)
CREATE OR REPLACE FUNCTION zcc_update_application_status(
  p_application_id uuid,
  p_employer_id uuid,
  p_new_status text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app RECORD;
  v_listing RECORD;
  v_old_status text;
  v_history jsonb;
BEGIN
  -- Get the application
  SELECT a.*, l.employer_id as listing_employer_id
  INTO v_app
  FROM applications a
  JOIN listings l ON l.id = a.listing_id
  WHERE a.id = p_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found');
  END IF;

  -- Verify the employer owns this listing
  IF v_app.listing_employer_id != p_employer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: not your listing');
  END IF;

  v_old_status := v_app.status;

  -- Build history entry
  v_history := COALESCE(v_app.status_history, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'from', v_old_status,
      'to', p_new_status,
      'at', now()::text,
      'notes', COALESCE(p_notes, '')
    )
  );

  -- Update the application
  UPDATE applications
  SET 
    status = p_new_status,
    status_updated_at = now(),
    status_history = v_history,
    employer_notes = CASE WHEN p_notes IS NOT NULL THEN p_notes ELSE employer_notes END,
    updated_at = now()
  WHERE id = p_application_id;

  RETURN jsonb_build_object(
    'success', true,
    'old_status', v_old_status,
    'new_status', p_new_status,
    'application_id', p_application_id
  );
END;
$$;
