-- Fix foreign key constraint for listings table
-- listings.employer_id should reference employer_profiles(id), not profiles(id)

-- Step 1: Drop the old foreign key constraint
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_employer_id_fkey;

-- Step 2: Add the correct foreign key constraint
ALTER TABLE listings ADD CONSTRAINT listings_employer_id_fkey 
  FOREIGN KEY (employer_id) REFERENCES employer_profiles(id) ON DELETE CASCADE;

-- Verify the constraint was updated
SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
FROM information_schema.key_column_usage
WHERE table_name = 'listings' AND column_name = 'employer_id';
