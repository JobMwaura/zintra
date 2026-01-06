-- ============================================================================
-- WIZARD RFQ DIAGNOSIS - Run These Tests in Supabase SQL Editor
-- ============================================================================
-- Copy and paste each section one at a time to diagnose wizard RFQ issues

-- ============================================================================
-- TEST 1: Check which columns actually exist in rfqs table
-- ============================================================================
-- Run this first to see what columns are in your rfqs table
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'rfqs'
ORDER BY ordinal_position;

-- ============================================================================
-- TEST 2: Check if specific columns exist (the ones causing issues)
-- ============================================================================
-- This will show if category_slug, location, visibility exist
SELECT 
  'category_slug' as field,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfqs' AND column_name = 'category_slug'
  ) THEN 'EXISTS ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
  'location' as field,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfqs' AND column_name = 'location'
  ) THEN 'EXISTS ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
  'visibility' as field,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfqs' AND column_name = 'visibility'
  ) THEN 'EXISTS ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
  'type' as field,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfqs' AND column_name = 'type'
  ) THEN 'EXISTS ✅' ELSE 'MISSING ❌' END as status;

-- ============================================================================
-- TEST 3: Check if RLS is enabled on rfqs table
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'rfqs';

-- Expected result: rowsecurity should be 't' (true)

-- ============================================================================
-- TEST 4: List all RLS policies on rfqs table
-- ============================================================================
SELECT 
  policyname,
  CASE WHEN permissive THEN 'ALLOW ✅' ELSE 'DENY ❌' END as policy_type,
  cmd as operation,
  qual as select_condition,
  with_check as insert_update_condition
FROM pg_policies
WHERE tablename = 'rfqs'
ORDER BY policyname;

-- ============================================================================
-- TEST 5: Check if service role policy exists (should bypass RLS)
-- ============================================================================
SELECT COUNT(*) as service_role_policy_count
FROM pg_policies
WHERE tablename = 'rfqs' 
  AND policyname LIKE '%service_role%';

-- Expected result: count should be >= 1
-- If 0, that's the problem - service role can't bypass RLS

-- ============================================================================
-- TEST 6: Check rfq_recipients table exists and has correct columns
-- ============================================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'rfq_recipients'
ORDER BY ordinal_position;

-- ============================================================================
-- TEST 7: Count existing wizard RFQs
-- ============================================================================
SELECT 
  type,
  COUNT(*) as count
FROM public.rfqs
GROUP BY type;

-- This shows how many RFQs of each type exist
-- If 'wizard' count is 0, then user hasn't created one yet

-- ============================================================================
-- TEST 8: Check if any RFQs failed insertion (review recent RFQs)
-- ============================================================================
SELECT 
  id,
  user_id,
  title,
  type,
  status,
  created_at
FROM public.rfqs
ORDER BY created_at DESC
LIMIT 10;

-- Look at the most recent RFQs to see if wizard RFQs were created

-- ============================================================================
-- TEST 9: Test manual INSERT with wizard type (simulate what API does)
-- ============================================================================
-- ⚠️  IMPORTANT: Replace YOUR_USER_ID with the actual UUID from your users table
-- Get your user ID first:

SELECT id FROM auth.users LIMIT 1;

-- Then run this INSERT test (replace 'YOUR_USER_ID' with actual UUID):
INSERT INTO public.rfqs (
  user_id,
  title,
  description,
  type,
  category_slug,
  location,
  county,
  status,
  budget_min,
  budget_max
) VALUES (
  'YOUR_USER_ID'::uuid,
  'Test Wizard RFQ',
  'This is a test to diagnose wizard RFQ issues',
  'wizard',
  'roofing',
  'Nairobi',
  'Nairobi',
  'submitted',
  10000,
  50000
)
RETURNING id, title, type, status;

-- If this succeeds: Schema and RLS are OK ✅
-- If it fails: You'll see the exact error (column not found, RLS violation, etc.)

-- ============================================================================
-- TEST 10: Check rfq_recipients table - can vendors be added?
-- ============================================================================
-- First create a test RFQ (if test 9 succeeded, get the ID)
-- Then try to add a vendor recipient:

INSERT INTO public.rfq_recipients (
  rfq_id,
  vendor_id,
  recipient_type
) VALUES (
  'WIZARD_RFQ_ID_FROM_TEST_9'::uuid,
  'ANY_VENDOR_ID_FROM_VENDORS_TABLE'::uuid,
  'wizard'
)
RETURNING id, rfq_id, vendor_id;

-- If this works: Recipient table is OK ✅

-- ============================================================================
-- TEST 11: Check if there are any vendors to match
-- ============================================================================
SELECT 
  COUNT(*) as total_vendors,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_vendors
FROM public.vendors;

-- If total_vendors is 0 or very small: Auto-match might fail

-- ============================================================================
-- TEST 12: Check category_slug values in existing RFQs
-- ============================================================================
SELECT DISTINCT category_slug
FROM public.rfqs
WHERE category_slug IS NOT NULL
LIMIT 10;

-- This shows what category values exist - compare with 'roofing' from your test

-- ============================================================================
-- TROUBLESHOOTING GUIDE
-- ============================================================================

-- If TEST 2 shows "MISSING" for category_slug or location:
--   → Run: supabase/sql/MIGRATION_ADD_RFQ_COLUMNS.sql
--   → Wait 2-3 minutes for schema to sync with frontend

-- If TEST 3 shows rowsecurity = 'f':
--   → Run: ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

-- If TEST 4 shows no policies:
--   → Run: supabase/sql/RFQ_SYSTEM_COMPLETE.sql (just the policies section)

-- If TEST 5 shows count 0:
--   → Service role policy missing - RLS might be blocking the API
--   → Run this: CREATE POLICY "rfqs_service_role" ON public.rfqs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- If TEST 9 fails with "column doesn't exist":
--   → You need to run the migration to add missing columns

-- If TEST 9 fails with "42501: new row violates row-level security policy":
--   → RLS policy is blocking INSERT, add service role policy (TEST 5 fix)

-- If TEST 11 shows 0 vendors:
--   → No vendors in database - auto-match will find nothing
--   → Create test vendors first

-- ============================================================================
-- SUMMARY: What Should Happen for Wizard RFQs
-- ============================================================================

-- 1. User clicks "Create Wizard RFQ"
-- 2. Frontend sends selectedVendors array (should be empty for wizard - auto-matching only)
-- 3. API route receives request with rfqType='wizard'
-- 4. API inserts into rfqs table with type='wizard'
--    - Must use correct column names: category_slug, location, visibility
--    - Must use correct field values from sharedFields
-- 5. API calls autoMatchVendors() to find matching vendors
-- 6. autoMatchVendors() inserts into rfq_recipients with recipient_type='wizard'
-- 7. API returns success with RFQ ID
-- 8. Frontend shows "RFQ created successfully"
-- 9. Vendors matching criteria receive notifications

-- If ANY of these steps fail, user gets "Failed to create RFQ" error
