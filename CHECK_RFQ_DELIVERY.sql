-- =============================================================================
-- CHECK RFQ DELIVERY TO VENDOR
-- =============================================================================
-- Run this in Supabase SQL Editor to verify the RFQ was properly delivered
-- RFQ ID: a8d981a5-2c3a-4c72-8ff6-8b3c7f4e6dee
-- =============================================================================

-- Check 1: Is the RFQ in the main rfqs table?
SELECT 'RFQs Table:' as check_type;
SELECT id, title, user_id, assigned_vendor_id, type, status, created_at
FROM public.rfqs 
WHERE id = 'a8d981a5-2c3a-4c72-8ff6-8b3c7f4e6dee';

-- Check 2: Is there an entry in rfq_requests table (vendor inbox)?
SELECT 'RFQ Requests Table (Vendor Inbox):' as check_type;
SELECT id, rfq_id, vendor_id, user_id, project_title, status, created_at
FROM public.rfq_requests 
WHERE rfq_id = 'a8d981a5-2c3a-4c72-8ff6-8b3c7f4e6dee';

-- Check 3: Show all recent rfq_requests for debugging
SELECT 'All Recent RFQ Requests:' as check_type;
SELECT id, rfq_id, vendor_id, user_id, project_title, status, created_at
FROM public.rfq_requests 
ORDER BY created_at DESC 
LIMIT 5;

-- Check 4: Show all recent rfqs for debugging
SELECT 'All Recent RFQs:' as check_type;
SELECT id, title, user_id, assigned_vendor_id, type, status, created_at
FROM public.rfqs 
ORDER BY created_at DESC 
LIMIT 5;
