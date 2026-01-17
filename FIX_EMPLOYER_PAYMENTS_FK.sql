-- Fix: Change employer_payments and employer_spending foreign keys
-- Error: "violates foreign key constraint employer_payments_employer_id_fkey"
-- 
-- The issue: These tables reference profiles(id), but we're inserting 
-- employer_profiles.id (which is auth.users.id), causing a foreign key mismatch
--
-- Solution: Change the foreign keys to reference employer_profiles(id) instead

-- Fix employer_payments table
ALTER TABLE employer_payments 
  DROP CONSTRAINT IF EXISTS employer_payments_employer_id_fkey;

ALTER TABLE employer_payments 
  ADD CONSTRAINT employer_payments_employer_id_fkey 
  FOREIGN KEY (employer_id) REFERENCES employer_profiles(id) ON DELETE CASCADE;

-- Fix employer_spending table
ALTER TABLE employer_spending 
  DROP CONSTRAINT IF EXISTS employer_spending_employer_id_fkey;

ALTER TABLE employer_spending 
  ADD CONSTRAINT employer_spending_employer_id_fkey 
  FOREIGN KEY (employer_id) REFERENCES employer_profiles(id) ON DELETE CASCADE;

