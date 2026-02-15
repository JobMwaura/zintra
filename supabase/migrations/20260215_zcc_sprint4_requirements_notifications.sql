-- ============================================
-- ZCC SPRINT 4: Requirements Checklist + Notification Log + Job Order Enhancements
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Add indexes to zcc_requirements for faster lookup
CREATE INDEX IF NOT EXISTS idx_zcc_requirements_post ON zcc_requirements(post_id);
CREATE INDEX IF NOT EXISTS idx_zcc_requirements_application ON zcc_requirements(application_id);
CREATE INDEX IF NOT EXISTS idx_zcc_requirements_requested_by ON zcc_requirements(requested_by);

-- 2. Add candidate_id to zcc_requirements for candidate self-service
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'zcc_requirements' AND column_name = 'candidate_id'
  ) THEN
    ALTER TABLE zcc_requirements ADD COLUMN candidate_id UUID REFERENCES profiles(id);
  END IF;

  -- Add updated_at to zcc_requirements
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'zcc_requirements' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE zcc_requirements ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  -- Add title column to zcc_requirements
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'zcc_requirements' AND column_name = 'title'
  ) THEN
    ALTER TABLE zcc_requirements ADD COLUMN title TEXT;
  END IF;

  -- Add notes column to zcc_requirements
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'zcc_requirements' AND column_name = 'notes'
  ) THEN
    ALTER TABLE zcc_requirements ADD COLUMN notes TEXT;
  END IF;
END $$;

-- 3. RLS policy: candidates can view and update their own requirements
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Candidates can view own requirements' AND tablename = 'zcc_requirements'
  ) THEN
    CREATE POLICY "Candidates can view own requirements"
      ON zcc_requirements FOR SELECT
      USING (auth.uid() = candidate_id OR auth.uid() = requested_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Candidates can update own requirements' AND tablename = 'zcc_requirements'
  ) THEN
    CREATE POLICY "Candidates can update own requirements"
      ON zcc_requirements FOR UPDATE
      USING (auth.uid() = candidate_id)
      WITH CHECK (auth.uid() = candidate_id);
  END IF;
END $$;

-- 4. RPC: Create requirements checklist for a hired candidate
CREATE OR REPLACE FUNCTION zcc_create_requirements(
  p_employer_id UUID,
  p_application_id UUID,
  p_title TEXT,
  p_checklist JSONB,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app RECORD;
  v_req_id UUID;
BEGIN
  -- Get application details
  SELECT a.id, a.listing_id, a.candidate_id, a.status, l.employer_id
  INTO v_app
  FROM applications a
  JOIN listings l ON l.id = a.listing_id
  WHERE a.id = p_application_id;

  IF v_app IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Application not found');
  END IF;

  -- Verify employer owns the listing
  IF v_app.employer_id != p_employer_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- App must be in hired or offer status
  IF v_app.status NOT IN ('hired', 'offer') THEN
    RETURN json_build_object('success', false, 'error', 'Application must be in hired or offer status');
  END IF;

  -- Create requirements checklist
  INSERT INTO zcc_requirements (post_id, application_id, requested_by, candidate_id, title, checklist, notes)
  VALUES (v_app.listing_id, p_application_id, p_employer_id, v_app.candidate_id, p_title, p_checklist, p_notes)
  RETURNING id INTO v_req_id;

  -- Notify candidate
  INSERT INTO zcc_notifications (user_id, event_type, channel, title, body, payload)
  VALUES (
    v_app.candidate_id,
    'requirements_sent',
    'in_app',
    'Requirements Checklist Received',
    'Your employer has sent a pre-work requirements checklist. Please complete it before starting.',
    json_build_object('requirements_id', v_req_id, 'application_id', p_application_id)::jsonb
  );

  RETURN json_build_object('success', true, 'id', v_req_id);
END;
$$;

-- 5. RPC: Candidate marks a checklist item as done
CREATE OR REPLACE FUNCTION zcc_update_requirement_item(
  p_requirements_id UUID,
  p_item_key TEXT,
  p_done BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_checklist JSONB;
  v_new_checklist JSONB;
  v_item JSONB;
  v_found BOOLEAN := false;
  v_all_done BOOLEAN := true;
  v_req RECORD;
BEGIN
  -- Get the requirements record
  SELECT id, candidate_id, checklist, requested_by, application_id
  INTO v_req
  FROM zcc_requirements
  WHERE id = p_requirements_id;

  IF v_req IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Requirements not found');
  END IF;

  -- Only the candidate can update
  IF v_req.candidate_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  v_checklist := v_req.checklist;
  v_new_checklist := '[]'::jsonb;

  -- Update the specific item
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_checklist)
  LOOP
    IF (v_item->>'key') = p_item_key THEN
      v_found := true;
      v_new_checklist := v_new_checklist || jsonb_build_array(
        v_item || jsonb_build_object('done', p_done, 'updated_at', now()::text)
      );
      IF NOT p_done THEN v_all_done := false; END IF;
    ELSE
      v_new_checklist := v_new_checklist || jsonb_build_array(v_item);
      IF NOT COALESCE((v_item->>'done')::boolean, false) THEN v_all_done := false; END IF;
    END IF;
  END LOOP;

  IF NOT v_found THEN
    RETURN json_build_object('success', false, 'error', 'Checklist item not found');
  END IF;

  -- Update the checklist
  UPDATE zcc_requirements
  SET checklist = v_new_checklist,
      updated_at = now(),
      status = CASE WHEN v_all_done THEN 'completed' ELSE 'pending' END,
      completed_at = CASE WHEN v_all_done THEN now() ELSE NULL END
  WHERE id = p_requirements_id;

  -- If all done, notify employer
  IF v_all_done THEN
    INSERT INTO zcc_notifications (user_id, event_type, channel, title, body, payload)
    VALUES (
      v_req.requested_by,
      'requirements_completed',
      'in_app',
      'Requirements Completed ✓',
      'Your candidate has completed all pre-work requirements.',
      json_build_object('requirements_id', p_requirements_id, 'application_id', v_req.application_id)::jsonb
    );
  END IF;

  RETURN json_build_object('success', true, 'all_done', v_all_done);
END;
$$;

-- 6. RPC: Send ZCC notification with optional SMS fallback
CREATE OR REPLACE FUNCTION zcc_send_notification(
  p_user_id UUID,
  p_event_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_channel TEXT DEFAULT 'in_app'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notif_id UUID;
BEGIN
  INSERT INTO zcc_notifications (user_id, event_type, channel, title, body, payload, status)
  VALUES (p_user_id, p_event_type, p_channel, p_title, p_body, p_payload, 'queued')
  RETURNING id INTO v_notif_id;

  RETURN json_build_object('success', true, 'notification_id', v_notif_id);
END;
$$;

-- Done!
