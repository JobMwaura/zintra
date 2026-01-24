-- VERIFY: Check all existing RLS policies on rfq_responses table
-- Run this to see what policies are currently in place

SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'rfq_responses' 
ORDER BY policyname;

-- Expected output (5 policies total):
-- 1. RFQ creators can accept/reject quotes (UPDATE) ← The one we needed
-- 2. RFQ creators can view responses to their RFQs (SELECT)
-- 3. Vendors can insert their own responses (INSERT)
-- 4. Vendors can update their own responses (UPDATE)
-- 5. Vendors can view their own responses (SELECT)

-- If all 5 are present, the RLS is properly configured ✅
-- If fewer than 5, some policies are missing
