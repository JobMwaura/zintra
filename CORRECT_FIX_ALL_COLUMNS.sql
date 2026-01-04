-- ====================================================================
-- CORRECT FIX: ADD ALL MISSING COLUMNS TO rfq_responses TABLE
-- ====================================================================
-- 
-- These 5 columns are being used in the code but don't exist in the table:
-- 1. currency
-- 2. quoted_price
-- 3. warranty
-- 4. payment_terms
-- 5. vendor_rating
--
-- ====================================================================

-- Add currency column
ALTER TABLE rfq_responses
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'KES';

-- Add quoted_price column
ALTER TABLE rfq_responses
ADD COLUMN IF NOT EXISTS quoted_price DECIMAL(15, 2);

-- Add warranty column
ALTER TABLE rfq_responses
ADD COLUMN IF NOT EXISTS warranty TEXT;

-- Add payment_terms column
ALTER TABLE rfq_responses
ADD COLUMN IF NOT EXISTS payment_terms TEXT;

-- Add vendor_rating column
ALTER TABLE rfq_responses
ADD COLUMN IF NOT EXISTS vendor_rating NUMERIC(3, 2) DEFAULT 0;

-- ====================================================================
-- DONE! After running this:
-- 1. Deploy the code again to clear cache
-- 2. Test the vendor response form
-- 3. Should work now!
-- ====================================================================
