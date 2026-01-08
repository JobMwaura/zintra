-- ============================================================================
-- VENDOR TABLE: Populate Missing Fields (Safe, Validated, Production-Ready)
-- ============================================================================
--
-- PURPOSE:
--   Safely populate NULL/empty vendor fields with sensible defaults
--   Only updates target vendors, only fills empty fields, creates audit trail
--
-- SAFETY:
--   ✅ Only updates specific vendor IDs (whitelist approach)
--   ✅ Only fills NULL/empty fields (preserves existing data)
--   ✅ Creates before/after snapshots for audit
--   ✅ Includes rollback instructions
--   ✅ Non-destructive (no data loss)
--
-- EXECUTION:
--   1. Review the vendor list below
--   2. Create backup (included)
--   3. Preview changes (included)
--   4. Apply updates (main query)
--   5. Verify results (included)
--
-- ============================================================================

-- ============================================================================
-- STEP 0: VERIFY TARGET VENDORS EXIST & SHOW CURRENT STATE
-- ============================================================================

-- Show target vendor IDs and their current data state
SELECT 
  id,
  company_name,
  user_id,
  category,
  primary_category_slug,
  secondary_categories,
  email,
  phone,
  whatsapp,
  location,
  county,
  rating,
  description,
  CASE
    WHEN user_id IS NULL THEN '❌ user_id'
    WHEN email IS NULL OR email = '' THEN '❌ email'
    WHEN phone IS NULL OR phone = '' THEN '❌ phone'
    WHEN primary_category_slug IS NULL OR primary_category_slug = '' THEN '❌ primary_category_slug'
    WHEN location IS NULL OR location = '' THEN '❌ location'
    ELSE '✅ OK'
  END as status,
  updated_at
FROM vendors
WHERE id IN (
  'd4695f1a-498d-4a47-8861-dffabe176426'::uuid,
  '61b12f52-9f79-49e0-a1f2-d145b52fa25d'::uuid,
  'ed3e73f7-358d-49da-a2a3-847c84dfe360'::uuid,
  'f3a72a11-91b8-4a90-8b82-24b35bfc9801'::uuid,
  '2cb95bde-4e5a-4b7c-baa4-7d50978b7a33'::uuid,
  'cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11'::uuid,
  '8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11'::uuid,
  'aa64bff8-7e1b-4a9f-9b09-775b9d78e201'::uuid,
  '3b72d211-3a11-4b45-b7a5-3212c4219e08'::uuid,
  '52c837c7-e0e0-4315-b5ea-5c4fda5064b8'::uuid,
  'ba1c65ad-cb98-4c55-9442-89b44c71403e'::uuid,
  'f089b49d-77e3-4549-b76d-4568d6cc4f94'::uuid,
  'b4f2c6ef-81b3-45d7-b42b-8036cbf210d4'::uuid,
  '3688f0ab-4c1d-4a5e-9345-2df1da846544'::uuid
)
ORDER BY company_name;

-- Count missing fields by type
SELECT 
  COUNT(*) as total_target_vendors,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as missing_user_id,
  COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as missing_email,
  COUNT(CASE WHEN phone IS NULL OR phone = '' THEN 1 END) as missing_phone,
  COUNT(CASE WHEN primary_category_slug IS NULL OR primary_category_slug = '' THEN 1 END) as missing_primary_category_slug,
  COUNT(CASE WHEN location IS NULL OR location = '' THEN 1 END) as missing_location,
  COUNT(CASE WHEN county IS NULL OR county = '' THEN 1 END) as missing_county
FROM vendors
WHERE id IN (
  'd4695f1a-498d-4a47-8861-dffabe176426'::uuid,
  '61b12f52-9f79-49e0-a1f2-d145b52fa25d'::uuid,
  'ed3e73f7-358d-49da-a2a3-847c84dfe360'::uuid,
  'f3a72a11-91b8-4a90-8b82-24b35bfc9801'::uuid,
  '2cb95bde-4e5a-4b7c-baa4-7d50978b7a33'::uuid,
  'cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11'::uuid,
  '8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11'::uuid,
  'aa64bff8-7e1b-4a9f-9b09-775b9d78e201'::uuid,
  '3b72d211-3a11-4b45-b7a5-3212c4219e08'::uuid,
  '52c837c7-e0e0-4315-b5ea-5c4fda5064b8'::uuid,
  'ba1c65ad-cb98-4c55-9442-89b44c71403e'::uuid,
  'f089b49d-77e3-4549-b76d-4568d6cc4f94'::uuid,
  'b4f2c6ef-81b3-45d7-b42b-8036cbf210d4'::uuid,
  '3688f0ab-4c1d-4a5e-9345-2df1da846544'::uuid
);

-- ============================================================================
-- STEP 1: CREATE AUDIT BACKUP (Safety First!)
-- ============================================================================

-- Backup current state (before any updates)
CREATE TABLE IF NOT EXISTS vendors_backup_before_missing_fields AS
SELECT * FROM vendors
WHERE id IN (
  'd4695f1a-498d-4a47-8861-dffabe176426'::uuid,
  '61b12f52-9f79-49e0-a1f2-d145b52fa25d'::uuid,
  'ed3e73f7-358d-49da-a2a3-847c84dfe360'::uuid,
  'f3a72a11-91b8-4a90-8b82-24b35bfc9801'::uuid,
  '2cb95bde-4e5a-4b7c-baa4-7d50978b7a33'::uuid,
  'cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11'::uuid,
  '8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11'::uuid,
  'aa64bff8-7e1b-4a9f-9b09-775b9d78e201'::uuid,
  '3b72d211-3a11-4b45-b7a5-3212c4219e08'::uuid,
  '52c837c7-e0e0-4315-b5ea-5c4fda5064b8'::uuid,
  'ba1c65ad-cb98-4c55-9442-89b44c71403e'::uuid,
  'f089b49d-77e3-4549-b76d-4568d6cc4f94'::uuid,
  'b4f2c6ef-81b3-45d7-b42b-8036cbf210d4'::uuid,
  '3688f0ab-4c1d-4a5e-9345-2df1da846544'::uuid
);

-- Verify backup created
SELECT COUNT(*) as backup_count FROM vendors_backup_before_missing_fields;

-- ============================================================================
-- STEP 2: DEFINE HELPER FUNCTIONS (Cleaner, More Maintainable)
-- ============================================================================

-- Function: Map category text to canonical slug
CREATE OR REPLACE FUNCTION map_category_to_slug(category_text TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN category_text ILIKE ANY(ARRAY['%Architect%','%Design%']) THEN 'architectural_design'
    WHEN category_text ILIKE ANY(ARRAY['%Masonry%','%Building%','%Structural%']) THEN 'building_masonry'
    WHEN category_text ILIKE ANY(ARRAY['%Roof%','%Waterproof%']) THEN 'roofing_waterproofing'
    WHEN category_text ILIKE ANY(ARRAY['%Doors%','%Windows%','%Glass%','%Aluminum%']) THEN 'doors_windows_glass'
    WHEN category_text ILIKE ANY(ARRAY['%Floor%','%Tiles%','%Wall Finishes%']) THEN 'flooring_wall_finishes'
    WHEN category_text ILIKE ANY(ARRAY['%Plumb%','%Drain%','%Sanitation%']) THEN 'plumbing_drainage'
    WHEN category_text ILIKE ANY(ARRAY['%Electric%','%Lighting%','%Solar%']) THEN 'electrical_solar'
    WHEN category_text ILIKE ANY(ARRAY['%HVAC%','%Climate%','%Air%']) THEN 'hvac_climate'
    WHEN category_text ILIKE ANY(ARRAY['%Carpentry%','%Joinery%','%Timber%','%Wood%']) THEN 'carpentry_joinery'
    WHEN category_text ILIKE ANY(ARRAY['%Kitchen%','%Wardrobe%','%Interior Fittings%']) THEN 'kitchens_wardrobes'
    WHEN category_text ILIKE ANY(ARRAY['%Paint%','%Finishing%','%Decorating%']) THEN 'painting_decorating'
    WHEN category_text ILIKE ANY(ARRAY['%Pool%','%Water Feature%']) THEN 'pools_water_features'
    WHEN category_text ILIKE ANY(ARRAY['%Landscape%','%Garden%','%Outdoor%']) THEN 'landscaping_outdoor'
    WHEN category_text ILIKE ANY(ARRAY['%Fence%','%Gate%']) THEN 'fencing_gates'
    WHEN category_text ILIKE ANY(ARRAY['%Security%','%Smart%','%CCTV%']) THEN 'security_smart'
    WHEN category_text ILIKE ANY(ARRAY['%Interior Design%','%Décor%','%Decor%']) THEN 'interior_decor'
    WHEN category_text ILIKE ANY(ARRAY['%Project Management%','%QS%']) THEN 'project_management_qs'
    WHEN category_text ILIKE ANY(ARRAY['%Equipment%','%Scaffold%','%Hire%']) THEN 'equipment_hire'
    WHEN category_text ILIKE ANY(ARRAY['%Waste%','%Cleaning%','%Site Cleaning%']) THEN 'waste_cleaning'
    WHEN category_text ILIKE ANY(ARRAY['%Steel%','%Metal%','%Borehole%','%Water%']) THEN 'special_structures'
    ELSE 'special_structures'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Infer county from location text
CREATE OR REPLACE FUNCTION infer_county_from_location(location_text TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN location_text ILIKE '%Nairobi%' OR location_text ILIKE '%Westlands%' THEN 'Nairobi'
    WHEN location_text ILIKE '%Mombasa%' THEN 'Mombasa'
    WHEN location_text ILIKE '%Kisumu%' THEN 'Kisumu'
    WHEN location_text ILIKE '%Thika%' THEN 'Kiambu'
    WHEN location_text ILIKE '%Naivasha%' THEN 'Nakuru'
    WHEN location_text ILIKE '%Kisii%' THEN 'Kisii'
    WHEN location_text ILIKE '%Machakos%' THEN 'Machakos'
    WHEN location_text ILIKE '%Meru%' THEN 'Meru'
    WHEN location_text ILIKE '%Eldoret%' THEN 'Uasin Gishu'
    WHEN location_text ILIKE '%Nakuru%' THEN 'Nakuru'
    ELSE 'Nairobi'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 3: PREVIEW CHANGES (Before applying)
-- ============================================================================

-- Show what will be updated (dry run)
WITH target_vendors AS (
  SELECT id FROM vendors
  WHERE id IN (
    'd4695f1a-498d-4a47-8861-dffabe176426'::uuid,
    '61b12f52-9f79-49e0-a1f2-d145b52fa25d'::uuid,
    'ed3e73f7-358d-49da-a2a3-847c84dfe360'::uuid,
    'f3a72a11-91b8-4a90-8b82-24b35bfc9801'::uuid,
    '2cb95bde-4e5a-4b7c-baa4-7d50978b7a33'::uuid,
    'cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11'::uuid,
    '8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11'::uuid,
    'aa64bff8-7e1b-4a9f-9b09-775b9d78e201'::uuid,
    '3b72d211-3a11-4b45-b7a5-3212c4219e08'::uuid,
    '52c837c7-e0e0-4315-b5ea-5c4fda5064b8'::uuid,
    'ba1c65ad-cb98-4c55-9442-89b44c71403e'::uuid,
    'f089b49d-77e3-4549-b76d-4568d6cc4f94'::uuid,
    'b4f2c6ef-81b3-45d7-b42b-8036cbf210d4'::uuid,
    '3688f0ab-4c1d-4a5e-9345-2df1da846544'::uuid
  )
)
SELECT
  v.id,
  v.company_name,
  '--- BEFORE ---' as action,
  COALESCE(v.user_id::text, '[NULL]') as current_user_id,
  COALESCE(v.primary_category_slug, '[EMPTY]') as current_category_slug,
  COALESCE(v.email, '[EMPTY]') as current_email,
  COALESCE(v.county, '[EMPTY]') as current_county,
  '--- WILL BE ---' as will_be,
  COALESCE(v.user_id::text, v.id::text) as new_user_id,
  map_category_to_slug(v.category) as new_category_slug,
  COALESCE(NULLIF(v.email,''), 'vendor+' || substring(v.id::text,1,8) || '@zintra.test') as new_email,
  COALESCE(NULLIF(v.county,''), infer_county_from_location(v.location)) as new_county
FROM vendors v
JOIN target_vendors t ON v.id = t.id
ORDER BY v.company_name;

-- ============================================================================
-- STEP 4: APPLY UPDATES (Main operation)
-- ============================================================================

UPDATE vendors v
SET
  -- ✅ Essential linking
  user_id = COALESCE(v.user_id, v.id),

  -- ✅ Category system
  primary_category_slug = COALESCE(
    NULLIF(v.primary_category_slug, ''),
    map_category_to_slug(v.category)
  ),
  secondary_categories = COALESCE(v.secondary_categories, '[]'::jsonb),

  -- ✅ Location
  location = COALESCE(NULLIF(v.location, ''), 'Nairobi'),
  county = COALESCE(
    NULLIF(v.county, ''),
    infer_county_from_location(COALESCE(v.location, 'Nairobi'))
  ),

  -- ✅ Essential contact info
  phone = COALESCE(
    NULLIF(v.phone, ''),
    '+254700' || lpad((100000 + floor(random()*899999))::text, 6, '0')
  ),
  email = COALESCE(
    NULLIF(v.email, ''),
    'vendor+' || substring(v.id::text, 1, 8) || '@zintra.test'
  ),
  whatsapp = COALESCE(
    NULLIF(v.whatsapp, ''),
    COALESCE(NULLIF(v.phone, ''), '+254700' || lpad((100000 + floor(random()*899999))::text, 6, '0'))
  ),

  -- ✅ Profile content
  description = COALESCE(
    NULLIF(v.description, ''),
    'Professional ' || COALESCE(v.category, 'construction') || ' services. '
    || 'Experienced team with clear pricing and fast response times. '
    || 'Contact us for a quote today!'
  ),

  -- ✅ Reputation (realistic defaults)
  rating = COALESCE(v.rating, ROUND((3.5 + random() * 1.5)::numeric, 2)),
  response_time = COALESCE(
    NULLIF(v.response_time, ''),
    (ARRAY['1 hour','2 hours','3 hours','5 hours','8 hours'])[1 + floor(random()*5)::int]
  ),

  -- ✅ Website/portfolio
  website = COALESCE(
    NULLIF(v.website, ''),
    'https://zintra-sandy.vercel.app/vendor/' || v.id::text
  ),

  -- ✅ Updated timestamp
  updated_at = now()

WHERE id IN (
  'd4695f1a-498d-4a47-8861-dffabe176426'::uuid,
  '61b12f52-9f79-49e0-a1f2-d145b52fa25d'::uuid,
  'ed3e73f7-358d-49da-a2a3-847c84dfe360'::uuid,
  'f3a72a11-91b8-4a90-8b82-24b35bfc9801'::uuid,
  '2cb95bde-4e5a-4b7c-baa4-7d50978b7a33'::uuid,
  'cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11'::uuid,
  '8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11'::uuid,
  'aa64bff8-7e1b-4a9f-9b09-775b9d78e201'::uuid,
  '3b72d211-3a11-4b45-b7a5-3212c4219e08'::uuid,
  '52c837c7-e0e0-4315-b5ea-5c4fda5064b8'::uuid,
  'ba1c65ad-cb98-4c55-9442-89b44c71403e'::uuid,
  'f089b49d-77e3-4549-b76d-4568d6cc4f94'::uuid,
  'b4f2c6ef-81b3-45d7-b42b-8036cbf210d4'::uuid,
  '3688f0ab-4c1d-4a5e-9345-2df1da846544'::uuid
);

-- ============================================================================
-- STEP 5: VERIFY RESULTS
-- ============================================================================

-- Show updated data
SELECT 
  id,
  company_name,
  user_id,
  primary_category_slug,
  email,
  phone,
  location,
  county,
  rating,
  response_time,
  updated_at
FROM vendors
WHERE id IN (
  'd4695f1a-498d-4a47-8861-dffabe176426'::uuid,
  '61b12f52-9f79-49e0-a1f2-d145b52fa25d'::uuid,
  'ed3e73f7-358d-49da-a2a3-847c84dfe360'::uuid,
  'f3a72a11-91b8-4a90-8b82-24b35bfc9801'::uuid,
  '2cb95bde-4e5a-4b7c-baa4-7d50978b7a33'::uuid,
  'cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11'::uuid,
  '8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11'::uuid,
  'aa64bff8-7e1b-4a9f-9b09-775b9d78e201'::uuid,
  '3b72d211-3a11-4b45-b7a5-3212c4219e08'::uuid,
  '52c837c7-e0e0-4315-b5ea-5c4fda5064b8'::uuid,
  'ba1c65ad-cb98-4c55-9442-89b44c71403e'::uuid,
  'f089b49d-77e3-4549-b76d-4568d6cc4f94'::uuid,
  'b4f2c6ef-81b3-45d7-b42b-8036cbf210d4'::uuid,
  '3688f0ab-4c1d-4a5e-9345-2df1da846544'::uuid
)
ORDER BY company_name;

-- Verify no NULL critical fields
SELECT 
  company_name,
  CASE
    WHEN user_id IS NULL THEN '❌ Missing user_id'
    WHEN email IS NULL OR email = '' THEN '❌ Missing email'
    WHEN phone IS NULL OR phone = '' THEN '❌ Missing phone'
    WHEN primary_category_slug IS NULL OR primary_category_slug = '' THEN '❌ Missing category slug'
    WHEN location IS NULL OR location = '' THEN '❌ Missing location'
    ELSE '✅ All critical fields present'
  END as validation
FROM vendors
WHERE id IN (
  'd4695f1a-498d-4a47-8861-dffabe176426'::uuid,
  '61b12f52-9f79-49e0-a1f2-d145b52fa25d'::uuid,
  'ed3e73f7-358d-49da-a2a3-847c84dfe360'::uuid,
  'f3a72a11-91b8-4a90-8b82-24b35bfc9801'::uuid,
  '2cb95bde-4e5a-4b7c-baa4-7d50978b7a33'::uuid,
  'cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11'::uuid,
  '8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11'::uuid,
  'aa64bff8-7e1b-4a9f-9b09-775b9d78e201'::uuid,
  '3b72d211-3a11-4b45-b7a5-3212c4219e08'::uuid,
  '52c837c7-e0e0-4315-b5ea-5c4fda5064b8'::uuid,
  'ba1c65ad-cb98-4c55-9442-89b44c71403e'::uuid,
  'f089b49d-77e3-4549-b76d-4568d6cc4f94'::uuid,
  'b4f2c6ef-81b3-45d7-b42b-8036cbf210d4'::uuid,
  '3688f0ab-4c1d-4a5e-9345-2df1da846544'::uuid
)
ORDER BY company_name;

-- ============================================================================
-- STEP 6: ROLLBACK INSTRUCTIONS (If needed)
-- ============================================================================

-- IF YOU NEED TO UNDO THESE CHANGES, RUN:
/*
DELETE FROM vendors 
WHERE id IN (
  'd4695f1a-498d-4a47-8861-dffabe176426'::uuid,
  '61b12f52-9f79-49e0-a1f2-d145b52fa25d'::uuid,
  'ed3e73f7-358d-49da-a2a3-847c84dfe360'::uuid,
  'f3a72a11-91b8-4a90-8b82-24b35bfc9801'::uuid,
  '2cb95bde-4e5a-4b7c-baa4-7d50978b7a33'::uuid,
  'cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11'::uuid,
  '8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11'::uuid,
  'aa64bff8-7e1b-4a9f-9b09-775b9d78e201'::uuid,
  '3b72d211-3a11-4b45-b7a5-3212c4219e08'::uuid,
  '52c837c7-e0e0-4315-b5ea-5c4fda5064b8'::uuid,
  'ba1c65ad-cb98-4c55-9442-89b44c71403e'::uuid,
  'f089b49d-77e3-4549-b76d-4568d6cc4f94'::uuid,
  'b4f2c6ef-81b3-45d7-b42b-8036cbf210d4'::uuid,
  '3688f0ab-4c1d-4a5e-9345-2df1da846544'::uuid
);

INSERT INTO vendors SELECT * FROM vendors_backup_before_missing_fields;

DROP TABLE vendors_backup_before_missing_fields;
*/

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
