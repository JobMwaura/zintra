-- ============================================
-- SEPARATE CAREER CENTRE PROFILE FROM ZINTRA PLATFORM PROFILE
-- Career Centre uses candidate_profiles for its own contact details
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Add career-specific contact/identity columns to candidate_profiles
DO $$
BEGIN
  -- Full name (may differ from platform profile)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN full_name TEXT;
  END IF;

  -- Email for career purposes (may differ from login email)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN email TEXT;
  END IF;

  -- Phone for career purposes (may differ from platform phone)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN phone TEXT;
  END IF;

  -- Avatar specific to career profile
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN avatar_url TEXT;
  END IF;

  -- City / location for career
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN city TEXT;
  END IF;

  -- Primary role (e.g. Electrician, Mason)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN role TEXT;
  END IF;

  -- Certifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'certifications'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN certifications TEXT[];
  END IF;

  -- Hourly rate (alias for rate_per_day, some pages use this)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN hourly_rate DECIMAL(10, 2);
  END IF;

  -- Phone verified flag for career profile
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
  END IF;

  -- Email verified flag for career profile
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;

  -- Created at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 2. Backfill existing candidate_profiles from profiles table where data exists
UPDATE candidate_profiles cp
SET
  full_name = COALESCE(cp.full_name, p.full_name),
  email = COALESCE(cp.email, p.email),
  phone = COALESCE(cp.phone, p.phone),
  avatar_url = COALESCE(cp.avatar_url, p.avatar_url),
  city = COALESCE(cp.city, p.location)
FROM profiles p
WHERE cp.id = p.id
  AND cp.full_name IS NULL;

-- Done!
