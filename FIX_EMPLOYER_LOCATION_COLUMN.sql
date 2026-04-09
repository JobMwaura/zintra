-- Fix: Add missing columns to employer_profiles table
-- This migration ONLY adds missing columns, does not touch RLS policies
-- Error 1: "Could not find the 'location' column of 'employer_profiles' in the schema cache"
-- Error 2: "Could not find the 'user_id' column of 'employer_profiles' in the schema cache"

-- Add user_id column for consistency with candidate_profiles
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add location column for storing the employer's business location
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_employer_profiles_user_id ON employer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_location ON employer_profiles(location);
