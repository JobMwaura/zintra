-- ============================================================================
-- QUICK FIX: Add missing columns to credits_ledger table
-- Run this NOW in Supabase SQL Editor to fix credit deduction errors
-- ============================================================================

-- Step 1: Add description column (for human-readable credit transaction details)
ALTER TABLE credits_ledger ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 2: Update the credit_type enum to include new types
-- This allows credit_type = 'job_posting' and 'admin_gift'
ALTER TABLE credits_ledger DROP CONSTRAINT IF EXISTS credits_ledger_credit_type_check;
ALTER TABLE credits_ledger ADD CONSTRAINT credits_ledger_credit_type_check 
  CHECK (credit_type IN (
    'purchase',           -- Manual credit purchase
    'bonus',              -- Bonus credits given
    'promotional',        -- Promotional credits
    'contact_unlock',     -- Unlock contact to reach candidate
    'outreach_message',   -- Send message to candidate
    'boost',              -- Boost job listing
    'boost_refund',       -- Refund boost credits
    'expired_credits',    -- Monthly credits expiring
    'plan_allocation',    -- Credits allocated from plan
    'job_posting',        -- Credits for posting a job (NEW)
    'admin_gift'          -- Admin-gifted credits (NEW)
  ));

-- Step 3: Verification query - check the updated table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'credits_ledger'
ORDER BY ordinal_position;

-- Expected output:
-- column_name | data_type | is_nullable | column_default
-- id          | uuid      | NO          | gen_random_uuid()
-- employer_id | uuid      | NO          | 
-- credit_type | text      | NO          | 
-- amount      | integer   | NO          | 
-- balance_before | integer | YES       | 0
-- balance_after | integer | YES       | 0
-- reference_id | text     | YES       | 
-- description | text      | YES       | (should be here now)
-- created_at | timestamp | YES       | now()

-- ============================================================================
-- DONE! You can now post jobs without credit deduction errors.
-- The form will:
-- 1. Show verification checkbox
-- 2. Require vendor to confirm it's a real opportunity
-- 3. Deduct 1000 KES from zcc_credits.used_credits on submit
-- ============================================================================
