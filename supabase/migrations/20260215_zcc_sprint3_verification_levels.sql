-- ============================================
-- ZCC SPRINT 3: Candidate Verification + Featured Profiles + Worker Levels
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Candidate Verification Documents Table
CREATE TABLE IF NOT EXISTS zcc_candidate_verifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('id_document', 'references', 'certificates')),
  file_url    TEXT,  -- Supabase storage URL or external URL
  notes       TEXT,  -- Candidate notes / reference details
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  reject_reason TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_candidate_verifications_user ON zcc_candidate_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_verifications_status ON zcc_candidate_verifications(status);

-- Unique constraint: one verification per type per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidate_verifications_unique
  ON zcc_candidate_verifications(user_id, verification_type);

-- 2. Add level and featured_until columns to candidate_profiles
DO $$
BEGIN
  -- Add level column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'level'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN level TEXT NOT NULL DEFAULT 'new';
  END IF;

  -- Add featured_until column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'featured_until'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN featured_until TIMESTAMPTZ;
  END IF;
END $$;

-- 3. RLS Policies for zcc_candidate_verifications

ALTER TABLE zcc_candidate_verifications ENABLE ROW LEVEL SECURITY;

-- Candidates can read their own verifications
CREATE POLICY "Candidates read own verifications"
  ON zcc_candidate_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Candidates can insert their own verifications
CREATE POLICY "Candidates insert own verifications"
  ON zcc_candidate_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Candidates can update their own pending verifications
CREATE POLICY "Candidates update own pending verifications"
  ON zcc_candidate_verifications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Service role / admins can read all (for admin review panel)
CREATE POLICY "Service role reads all verifications"
  ON zcc_candidate_verifications FOR SELECT
  USING (auth.role() = 'service_role');

-- Service role can update any verification (for approval/rejection)
CREATE POLICY "Service role updates verifications"
  ON zcc_candidate_verifications FOR UPDATE
  USING (auth.role() = 'service_role');

-- 4. RPC: Calculate worker level based on completed_gigs and rating
CREATE OR REPLACE FUNCTION zcc_calculate_worker_level(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed INT;
  v_rating DECIMAL;
  v_level TEXT;
BEGIN
  SELECT COALESCE(completed_gigs, 0), COALESCE(rating, 0)
  INTO v_completed, v_rating
  FROM candidate_profiles
  WHERE id = p_user_id;

  -- Determine level based on thresholds
  IF v_completed >= 25 AND v_rating >= 4.5 THEN
    v_level := 'top_rated';
  ELSIF v_completed >= 10 AND v_rating >= 4.0 THEN
    v_level := 'trusted';
  ELSIF v_completed >= 3 AND v_rating >= 3.5 THEN
    v_level := 'rising';
  ELSE
    v_level := 'new';
  END IF;

  -- Update the candidate's level
  UPDATE candidate_profiles SET level = v_level WHERE id = p_user_id;

  RETURN v_level;
END;
$$;

-- 5. RPC: Get verification summary for a candidate (used by server actions)
CREATE OR REPLACE FUNCTION zcc_get_verification_summary(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'id_document', (
      SELECT json_build_object('status', COALESCE(status, 'none'), 'updated_at', updated_at)
      FROM zcc_candidate_verifications
      WHERE user_id = p_user_id AND verification_type = 'id_document'
    ),
    'references', (
      SELECT json_build_object('status', COALESCE(status, 'none'), 'updated_at', updated_at)
      FROM zcc_candidate_verifications
      WHERE user_id = p_user_id AND verification_type = 'references'
    ),
    'certificates', (
      SELECT json_build_object('status', COALESCE(status, 'none'), 'updated_at', updated_at)
      FROM zcc_candidate_verifications
      WHERE user_id = p_user_id AND verification_type = 'certificates'
    ),
    'verified_id', (SELECT verified_id FROM candidate_profiles WHERE id = p_user_id),
    'verified_references', (SELECT verified_references FROM candidate_profiles WHERE id = p_user_id),
    'level', (SELECT level FROM candidate_profiles WHERE id = p_user_id),
    'completed_gigs', (SELECT COALESCE(completed_gigs, 0) FROM candidate_profiles WHERE id = p_user_id),
    'rating', (SELECT COALESCE(rating, 0) FROM candidate_profiles WHERE id = p_user_id),
    'featured_until', (SELECT featured_until FROM candidate_profiles WHERE id = p_user_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 6. RPC: Admin approve/reject verification
CREATE OR REPLACE FUNCTION zcc_review_verification(
  p_verification_id UUID,
  p_status TEXT,
  p_reviewed_by UUID,
  p_reject_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_type TEXT;
BEGIN
  -- Get the verification record
  SELECT user_id, verification_type INTO v_user_id, v_type
  FROM zcc_candidate_verifications
  WHERE id = p_verification_id;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Verification not found');
  END IF;

  -- Update the verification record
  UPDATE zcc_candidate_verifications
  SET status = p_status,
      reviewed_by = p_reviewed_by,
      reviewed_at = now(),
      reject_reason = p_reject_reason,
      updated_at = now()
  WHERE id = p_verification_id;

  -- If approved, update the candidate_profiles flags
  IF p_status = 'approved' THEN
    IF v_type = 'id_document' THEN
      UPDATE candidate_profiles SET verified_id = true WHERE id = v_user_id;
    ELSIF v_type = 'references' THEN
      UPDATE candidate_profiles SET verified_references = true WHERE id = v_user_id;
    ELSIF v_type = 'certificates' THEN
      UPDATE candidate_profiles SET tools_ready = true WHERE id = v_user_id;
    END IF;
  END IF;

  -- Recalculate worker level
  PERFORM zcc_calculate_worker_level(v_user_id);

  -- Insert notification
  INSERT INTO zcc_notifications (user_id, event, title, body, metadata)
  VALUES (
    v_user_id,
    CASE WHEN p_status = 'approved' THEN 'verification_approved' ELSE 'verification_rejected' END,
    CASE WHEN p_status = 'approved'
      THEN 'Verification Approved ✓'
      ELSE 'Verification Update'
    END,
    CASE WHEN p_status = 'approved'
      THEN 'Your ' || v_type || ' verification has been approved!'
      ELSE 'Your ' || v_type || ' verification was not approved. Reason: ' || COALESCE(p_reject_reason, 'N/A')
    END,
    json_build_object('verification_type', v_type, 'status', p_status)::jsonb
  );

  RETURN json_build_object('success', true);
END;
$$;

-- Done!
-- After running this migration, deploy the server actions and UI code.
