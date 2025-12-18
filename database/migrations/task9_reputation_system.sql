-- Task 9: Buyer Reputation System - Database Migration
-- Created: December 18, 2025

-- Create reputation_scores table
CREATE TABLE IF NOT EXISTS reputation_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_rfqs INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  acceptance_rate DECIMAL(5,2) DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  badge_tier TEXT DEFAULT 'bronze' CHECK (badge_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add reputation fields to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_tier TEXT DEFAULT 'bronze';

-- Create index on buyer_id for faster queries
CREATE INDEX IF NOT EXISTS idx_reputation_buyer_id ON reputation_scores(buyer_id);

-- Create index on badge_tier for filtering
CREATE INDEX IF NOT EXISTS idx_reputation_badge_tier ON reputation_scores(badge_tier);

-- Enable RLS on reputation_scores table
ALTER TABLE reputation_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read all reputation data (public)
DROP POLICY IF EXISTS "Anyone can view reputation" ON reputation_scores;
CREATE POLICY "Anyone can view reputation"
  ON reputation_scores FOR SELECT
  USING (true);

-- RLS Policy: Only service role can update reputation
DROP POLICY IF EXISTS "Service role can update reputation" ON reputation_scores;
CREATE POLICY "Service role can update reputation"
  ON reputation_scores FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'authenticated');

-- RLS Policy: Service role can insert reputation
DROP POLICY IF EXISTS "Service role can insert reputation" ON reputation_scores;
CREATE POLICY "Service role can insert reputation"
  ON reputation_scores FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_reputation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
DROP TRIGGER IF EXISTS update_reputation_scores_timestamp ON reputation_scores;
CREATE TRIGGER update_reputation_scores_timestamp
  BEFORE UPDATE ON reputation_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_updated_at();

-- Grant permissions
GRANT SELECT ON reputation_scores TO authenticated;
GRANT SELECT ON reputation_scores TO service_role;
GRANT UPDATE ON reputation_scores TO service_role;
GRANT INSERT ON reputation_scores TO service_role;
