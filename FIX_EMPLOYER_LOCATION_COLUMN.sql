-- Fix: Add missing 'location' column to employer_profiles table
-- Error: "Could not find the 'location' column of 'employer_profiles' in the schema cache"
-- This column is needed for storing the employer's business location
-- and is used when auto-filling data from vendor profiles

-- 1. Add the location column if it doesn't exist
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. Create index for location-based queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_employer_profiles_location ON employer_profiles(location);

-- 3. Verify the column was added successfully
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'employer_profiles' AND column_name = 'location';

-- Note: The enableEmployerRole function in /app/actions/vendor-zcc.js 
-- expects to set this column when creating employer profiles for vendors
