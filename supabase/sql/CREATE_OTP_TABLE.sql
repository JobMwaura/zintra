-- ========================================
-- OTP VERIFICATION TABLE MIGRATION
-- Purpose: Store OTP codes for SMS and email verification
-- Run this in Supabase SQL Editor
-- ========================================

-- Create OTP verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text,
  email_address text,
  otp_code text UNIQUE NOT NULL,
  method text CHECK (method IN ('sms', 'email')) NOT NULL,
  verified boolean DEFAULT false,
  attempts int DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  expires_at timestamptz NOT NULL,
  verified_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_email ON public.otp_verifications(email_address);
CREATE INDEX IF NOT EXISTS idx_otp_code ON public.otp_verifications(otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_verified ON public.otp_verifications(verified);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_user ON public.otp_verifications(user_id);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view their own OTP records (read-only)
CREATE POLICY "Users can view own OTP records"
  ON public.otp_verifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow authenticated users to verify OTP
CREATE POLICY "Authenticated users can update own OTP"
  ON public.otp_verifications FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow anon users to insert OTP (for signup flow)
CREATE POLICY "Anyone can insert OTP"
  ON public.otp_verifications FOR INSERT
  WITH CHECK (true);

-- ========================================
-- UPDATE USERS TABLE (if not already done)
-- ========================================

-- Add verification status columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

-- Create indexes for verification status
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON public.users(phone_verified);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);

-- ========================================
-- AUTO-CLEANUP FUNCTION (Optional)
-- ========================================

-- Create function to clean up expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_verifications
  WHERE expires_at < NOW() OR (verified = true AND verified_at < NOW() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (run this in a separate cron job)
-- SELECT cron.schedule('cleanup-expired-otps', '0 * * * *', 'SELECT cleanup_expired_otps()');

-- ========================================
-- SAMPLE DATA (Optional - for testing)
-- ========================================

-- Insert test OTP for development (expires in 10 minutes)
-- INSERT INTO public.otp_verifications (
--   id,
--   phone_number,
--   otp_code,
--   method,
--   expires_at
-- ) VALUES (
--   'otp_test_' || gen_random_uuid()::text,
--   '+254712345678',
--   '123456',
--   'sms',
--   NOW() + INTERVAL '10 minutes'
-- );

-- ========================================
-- END OF MIGRATION
-- ========================================
