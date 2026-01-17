-- Zintra Career Centre - Database Schema
-- Execute these migrations in Supabase SQL Editor

-- 1. PROFILES TABLE (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  
  -- Role flags
  is_candidate BOOLEAN DEFAULT FALSE,
  is_employer BOOLEAN DEFAULT FALSE,
  
  -- Basic info (shared)
  full_name TEXT,
  phone TEXT,
  location TEXT, -- County/Region
  avatar_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. CANDIDATE PROFILES
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id UUID PRIMARY KEY REFERENCES profiles (id) ON DELETE CASCADE,
  
  -- Skills & availability
  skills TEXT[], -- Array of skill tags
  availability TEXT, -- "Available now", "2 weeks", etc
  rate_per_day DECIMAL(10, 2), -- KES per day
  
  -- Portfolio/badges
  verified_id BOOLEAN DEFAULT FALSE,
  verified_references BOOLEAN DEFAULT FALSE,
  tools_ready BOOLEAN DEFAULT FALSE,
  
  -- Bio
  bio TEXT,
  experience_years INT DEFAULT 0,
  
  -- Metrics (calculated)
  completed_gigs INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  no_shows INT DEFAULT 0,
  
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. EMPLOYER PROFILES
CREATE TABLE IF NOT EXISTS employer_profiles (
  id UUID PRIMARY KEY REFERENCES profiles (id) ON DELETE CASCADE,
  
  -- Company info
  company_name TEXT NOT NULL,
  company_registration TEXT, -- KRA PIN
  verification_level TEXT DEFAULT 'unverified', -- unverified, verified, trusted
  
  -- Contact & location
  company_phone TEXT,
  company_email TEXT,
  county TEXT,
  location TEXT, -- Business location / office location
  
  -- Branding
  company_logo_url TEXT,
  company_description TEXT,
  
  -- Metrics
  jobs_posted INT DEFAULT 0,
  gigs_posted INT DEFAULT 0,
  total_hires INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. LISTINGS (jobs + gigs)
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  
  -- Content
  type TEXT NOT NULL CHECK (type IN ('job', 'gig')), -- job or gig
  title TEXT NOT NULL,
  description TEXT,
  role_category TEXT, -- Mason, Electrician, etc
  
  -- Location & duration
  location TEXT NOT NULL, -- County
  start_date DATE,
  duration TEXT, -- "1 week", "3 days", etc (for gigs)
  
  -- Pay
  pay_min DECIMAL(10, 2),
  pay_max DECIMAL(10, 2),
  pay_currency TEXT DEFAULT 'KES',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'filled')),
  
  -- Visibility & boosts
  featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP,
  urgent_badge BOOLEAN DEFAULT FALSE,
  
  -- Counts
  views INT DEFAULT 0,
  applicants_count INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  
  -- Status pipeline
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'interview', 'hired', 'rejected')),
  
  -- Candidate answers (JSON)
  answers JSONB DEFAULT '{}',
  
  -- Employer notes
  employer_notes TEXT,
  employer_rating DECIMAL(3, 2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (listing_id, candidate_id) -- Can't apply twice to same listing
);

-- 6. MONETIZATION: SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  
  -- Plan
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  
  -- Billing
  started_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP,
  
  UNIQUE (employer_id) -- One active subscription per employer
);

-- 7. MONETIZATION: LISTING BOOSTS
CREATE TABLE IF NOT EXISTS listing_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  
  -- Boost type
  boost_type TEXT NOT NULL CHECK (boost_type IN ('featured', 'urgent', 'extra_reach')),
  
  -- Duration
  starts_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP NOT NULL,
  expired_at TIMESTAMP,
  
  -- Cost (for analytics)
  cost_kes DECIMAL(10, 2),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. MONETIZATION: CREDITS LEDGER
CREATE TABLE IF NOT EXISTS credits_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  
  -- Credit type
  credit_type TEXT NOT NULL CHECK (credit_type IN ('purchase', 'bonus', 'promotional', 'contact_unlock', 'outreach_message', 'boost', 'boost_refund', 'expired_credits', 'plan_allocation')),
  
  -- Ledger
  amount INT NOT NULL, -- Positive for additions, negative for deductions
  balance_before INT DEFAULT 0,
  balance_after INT DEFAULT 0,
  reference_id TEXT, -- Link to boost/unlock/etc
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. MONETIZATION: CONTACT UNLOCKS
CREATE TABLE IF NOT EXISTS contact_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings (id) ON DELETE SET NULL,
  
  -- When was contact unlocked
  unlocked_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (employer_id, candidate_id, listing_id)
);

-- 10. MESSAGING: CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings (id) ON DELETE SET NULL,
  
  initiated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (employer_id, candidate_id, listing_id)
);

-- 11. MESSAGING: MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 12. RATINGS & REVIEWS
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  
  -- Context
  listing_id UUID REFERENCES listings (id) ON DELETE SET NULL,
  context TEXT, -- "employer_to_worker", "worker_to_employer"
  
  -- Rating
  score DECIMAL(3, 2) NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES (for performance)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (is_candidate, is_employer);
CREATE INDEX IF NOT EXISTS idx_listings_employer ON listings (employer_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings (status);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings (featured, featured_until) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_applications_listing ON applications (listing_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications (candidate_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_employer ON subscriptions (employer_id);
CREATE INDEX IF NOT EXISTS idx_boosts_listing ON listing_boosts (listing_id);
CREATE INDEX IF NOT EXISTS idx_boosts_employer ON listing_boosts (employer_id);
CREATE INDEX IF NOT EXISTS idx_boosts_active ON listing_boosts (ends_at) WHERE expired_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contact_unlocks_employer ON contact_unlocks (employer_id);
CREATE INDEX IF NOT EXISTS idx_contact_unlocks_candidate ON contact_unlocks (candidate_id);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_employer ON credits_ledger (employer_id);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_date ON credits_ledger (employer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user ON ratings (to_user_id);

-- RLS POLICIES (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Anyone can read public listings
CREATE POLICY "anyone_read_listings" ON listings
  FOR SELECT USING (status = 'active');

-- Policy: Employers can create listings
CREATE POLICY "employers_create_listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = employer_id);

-- Policy: Employers can update own listings
CREATE POLICY "employers_update_own_listings" ON listings
  FOR UPDATE USING (auth.uid() = employer_id);

-- (More RLS policies as needed for applications, messages, etc)

-- SAMPLE VERIFICATION VIEW (optional, for checking capabilities)
CREATE OR REPLACE VIEW employer_capabilities AS
SELECT
  s.employer_id,
  s.plan,
  CASE
    WHEN s.plan = 'free' THEN 2 -- 1 job + 1 gig
    WHEN s.plan = 'pro' THEN 10
    WHEN s.plan = 'premium' THEN 999
  END AS max_active_listings,
  CASE
    WHEN s.plan = 'free' THEN 0
    WHEN s.plan = 'pro' THEN 5
    WHEN s.plan = 'premium' THEN 999
  END AS contact_unlocks_included,
  CASE
    WHEN s.plan = 'free' THEN FALSE
    WHEN s.plan = 'pro' THEN TRUE
    WHEN s.plan = 'premium' THEN TRUE
  END AS can_use_filters,
  CASE
    WHEN s.plan = 'free' THEN FALSE
    WHEN s.plan = 'pro' THEN TRUE
    WHEN s.plan = 'premium' THEN TRUE
  END AS can_shortlist
FROM subscriptions s;
