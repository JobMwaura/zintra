-- ============================================================================
-- QUICK FIX: Add Email Verification Columns
-- ============================================================================
-- Run this SQL in Supabase SQL Editor to enable email verification tracking
-- Location: Supabase Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);

-- ✅ If you see "success. no rows returned." the migration worked!
