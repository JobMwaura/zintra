-- =============================================================================
-- ADD 3 FREE RFQ CREDITS TO ALL USERS
-- =============================================================================
-- Run this in Supabase SQL Editor
-- Date: January 24, 2026
-- =============================================================================

-- STEP 1: Add rfq_count column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rfq_count integer DEFAULT 0;

-- STEP 2: Add last_rfq_at column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_rfq_at timestamptz;

-- STEP 3: Reset everyone's rfq_count to 0 (gives all users 3 free RFQs)
UPDATE public.users SET rfq_count = 0;

-- Verify the update
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN rfq_count = 0 THEN 1 END) as users_with_zero_count
FROM public.users;

-- Show sample of updated users
SELECT id, full_name, email, rfq_count 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;

SELECT '=== Successfully reset RFQ count - all users now have 3 free RFQs ===' as status;
