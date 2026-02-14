-- ============================================================================
-- Task 9: User Reputation System - SAFE RE-RUN VERSION
-- Fixes: Renames buyer_id → user_id if table was created with old column name
-- Fixes: Uses DROP POLICY IF EXISTS before CREATE POLICY
-- Fixes: Checks for users table existence before ALTER TABLE
-- 
-- Run this in Supabase SQL Editor.
-- ============================================================================

-- Step 1: Create reputation_scores table (only if it doesn't exist)
-- Uses buyer_id initially — will be renamed to user_id in Step 2
CREATE TABLE IF NOT EXISTS reputation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_rfqs INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  acceptance_rate DECIMAL(5,2) DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  badge_tier TEXT DEFAULT 'bronze' CHECK (badge_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: If table was created with old "buyer_id" column, rename it to "user_id"
-- This handles the case where the original migration ran with buyer_id
DO $$
BEGIN
  -- Check if buyer_id exists (old column name)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reputation_scores' 
    AND column_name = 'buyer_id'
  ) THEN
    -- Check if user_id does NOT exist yet
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'reputation_scores' 
      AND column_name = 'user_id'
    ) THEN
      -- Drop old FK constraint if it exists
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reputation_scores_buyer_id_fkey' 
        AND table_name = 'reputation_scores'
      ) THEN
        ALTER TABLE reputation_scores DROP CONSTRAINT reputation_scores_buyer_id_fkey;
      END IF;

      -- Drop old unique constraint if it exists
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reputation_scores_buyer_id_key' 
        AND table_name = 'reputation_scores'
      ) THEN
        ALTER TABLE reputation_scores DROP CONSTRAINT reputation_scores_buyer_id_key;
      END IF;

      -- Rename column
      ALTER TABLE reputation_scores RENAME COLUMN buyer_id TO user_id;
      
      -- Re-add unique constraint
      ALTER TABLE reputation_scores ADD CONSTRAINT reputation_scores_user_id_key UNIQUE (user_id);

      RAISE NOTICE 'Renamed buyer_id → user_id on reputation_scores';
    ELSE
      RAISE NOTICE 'Both buyer_id and user_id exist — dropping buyer_id';
      ALTER TABLE reputation_scores DROP COLUMN buyer_id;
    END IF;
  ELSE
    RAISE NOTICE 'Column user_id already exists on reputation_scores — no rename needed';
  END IF;
END $$;

-- Step 3: Add foreign key constraint only if public.users exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- Add FK if not already present
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'reputation_scores_user_id_fkey' 
      AND table_name = 'reputation_scores'
    ) THEN
      ALTER TABLE reputation_scores 
        ADD CONSTRAINT reputation_scores_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Add reputation columns to users table
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_tier TEXT DEFAULT 'bronze';
  ELSE
    RAISE NOTICE 'Skipping FK and ALTER TABLE users — public.users table not found.';
  END IF;
END $$;

-- Step 4: Indexes (drop old buyer_id index if it exists, create user_id index)
DROP INDEX IF EXISTS idx_reputation_buyer_id;
CREATE INDEX IF NOT EXISTS idx_reputation_user_id ON reputation_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_badge_tier ON reputation_scores(badge_tier);

-- Step 5: RLS
ALTER TABLE reputation_scores ENABLE ROW LEVEL SECURITY;

-- Use DROP IF EXISTS to make this safely re-runnable
DROP POLICY IF EXISTS "Anyone can view reputation" ON reputation_scores;
CREATE POLICY "Anyone can view reputation"
  ON reputation_scores FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can update reputation" ON reputation_scores;
CREATE POLICY "Service role can update reputation"
  ON reputation_scores FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'authenticated');

DROP POLICY IF EXISTS "Service role can insert reputation" ON reputation_scores;
CREATE POLICY "Service role can insert reputation"
  ON reputation_scores FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'authenticated');

-- Step 6: Trigger for updated_at
CREATE OR REPLACE FUNCTION update_reputation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reputation_scores_timestamp ON reputation_scores;
CREATE TRIGGER update_reputation_scores_timestamp
  BEFORE UPDATE ON reputation_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_updated_at();

-- Step 7: Grants
GRANT SELECT ON reputation_scores TO authenticated;
GRANT SELECT ON reputation_scores TO service_role;
GRANT UPDATE ON reputation_scores TO service_role;
GRANT INSERT ON reputation_scores TO service_role;

-- ============================================================================
-- DONE. This version is safe to re-run multiple times.
-- ============================================================================
