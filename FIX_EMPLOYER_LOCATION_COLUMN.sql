-- Fix: Add missing 'location' column to employer_profiles table
-- Error: "Could not find the 'location' column of 'employer_profiles' in the schema cache"
-- This column is needed for storing the employer's business location
-- and is used when auto-filling data from vendor profiles

ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS location TEXT;

CREATE INDEX IF NOT EXISTS idx_employer_profiles_location ON employer_profiles(location);
