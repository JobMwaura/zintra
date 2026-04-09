-- ============================================================================
-- MIGRATION: Add description column to credits_ledger
-- Purpose: Track human-readable descriptions for credit transactions (job postings, etc)
-- Run this in Supabase SQL Editor if not using COMPLETE_ZCC_SETUP.sql
-- ============================================================================

-- Add description column if it doesn't exist
ALTER TABLE credits_ledger ADD COLUMN IF NOT EXISTS description TEXT;

-- Update the CHECK constraint to include new credit types
ALTER TABLE credits_ledger DROP CONSTRAINT IF EXISTS credits_ledger_credit_type_check;
ALTER TABLE credits_ledger ADD CONSTRAINT credits_ledger_credit_type_check 
  CHECK (credit_type IN ('purchase', 'bonus', 'promotional', 'contact_unlock', 'outreach_message', 'boost', 'boost_refund', 'expired_credits', 'plan_allocation', 'job_posting', 'admin_gift'));

-- Verification: Check the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'credits_ledger'
ORDER BY ordinal_position;
