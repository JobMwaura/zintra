-- ====================================================================
-- TEMP FIX: Create vendor profile for test user
-- ====================================================================
-- Replace the UUIDs/strings below with your actual user/vendor info.
-- Ensure id matches the vendor_id seen in the FK error log.
-- ====================================================================

INSERT INTO vendors (
  id,
  user_id,
  company_name,
  category,
  rating,
  review_count,
  status,
  active,
  approved,
  created_at,
  updated_at
)
VALUES (
  '52c837c7-e0e0-4315-b5ea-5c4fda5064b8', -- your vendor ID
  '52c837c7-e0e0-4315-b5ea-5c4fda5064b8', -- your user ID
  'Your Company Name',
  'general-contractor',
  4.5,
  0,
  'active',
  true,
  true,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- After running:
-- 1. Submit vendor response again
-- 2. FK constraint will no longer fail
-- ====================================================================
