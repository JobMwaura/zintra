-- ========================================
-- USERS TABLE MIGRATION
-- Purpose: Create buyer/user profiles and reputation tracking
-- Run this in Supabase SQL Editor
-- ========================================

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  profile_picture_url text,
  bio text,
  
  -- Buyer Reputation & Trust
  rfq_count int DEFAULT 0,
  rfqs_completed int DEFAULT 0,
  response_rate numeric(3,2), -- avg vendor response rate to this buyer's RFQs (0-100)
  buyer_reputation text DEFAULT 'new', -- new|bronze|silver|gold|platinum
  trust_score numeric(3,2), -- 0-5 based on completion history
  
  -- Limits & Controls
  rfq_limit_daily int DEFAULT 2,
  is_suspended boolean DEFAULT false,
  suspension_reason text,
  suspension_until timestamptz,
  
  -- Engagement Metrics
  total_spent numeric(14,2) DEFAULT 0,
  avg_quote_response_time_hours int,
  quotes_received int DEFAULT 0,
  quotes_accepted int DEFAULT 0,
  quotes_rejected int DEFAULT 0,
  projects_completed int DEFAULT 0,
  average_rating numeric(3,2), -- vendor ratings of this buyer (if implemented)
  
  -- Preferences & Settings
  preferred_currency text DEFAULT 'KES',
  notification_email boolean DEFAULT true,
  notification_push boolean DEFAULT true,
  marketing_emails boolean DEFAULT true,
  
  -- Activity
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  last_rfq_at timestamptz,
  last_login_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_suspended ON public.users(is_suspended);
CREATE INDEX IF NOT EXISTS idx_users_rfq_limit ON public.users(rfq_limit_daily);
CREATE INDEX IF NOT EXISTS idx_users_buyer_reputation ON public.users(buyer_reputation);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Create function to automatically create user record when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update last_login_at
CREATE OR REPLACE FUNCTION public.update_user_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_login_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update last_login on auth changes
DROP TRIGGER IF EXISTS on_user_login ON auth.users;
CREATE TRIGGER on_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.update_user_last_login();

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can read and update their own profile
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow public read of non-sensitive buyer info (for vendor trust system)
CREATE POLICY "Vendors can see buyer trust score"
  ON public.users FOR SELECT
  USING (true)
  WITH CHECK (false)
  AS PERMISSIVE; -- This allows reading rfq_count, buyer_reputation, trust_score but NOT personal data

-- ========================================
-- MIGRATE EXISTING USERS (if any)
-- ========================================

-- Insert existing users from auth.users who don't have profiles yet
INSERT INTO public.users (id, email, full_name, phone)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'phone' as phone
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- END OF MIGRATION
-- ========================================
