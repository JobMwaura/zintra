-- ============================================================================
-- ADD EMAIL VERIFICATION COLUMNS TO USERS TABLE
-- ============================================================================
-- Purpose: Add email verification tracking to the users table
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add email verification columns if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster email verification lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('email_verified', 'email_verified_at')
ORDER BY column_name;
