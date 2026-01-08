-- ============================================================================
-- VENDOR TABLE MIGRATION - Fix Category Slugs and Secondary Categories
-- ============================================================================
-- 
-- This migration fixes:
-- 1. Primary category slugs (from old format to canonical)
-- 2. Secondary categories (remove invalid "equipment_rental", add canonical)
-- 3. Data cleanup (remove test records)
--
-- IMPORTANT: Run in Supabase SQL Editor with appropriate permissions
-- ============================================================================

-- Step 1: Verify current state (check-only, safe to run)
-- ============================================================================
SELECT 
  COUNT(*) as total_vendors,
  COUNT(DISTINCT primary_category_slug) as unique_primary_slugs,
  COUNT(CASE WHEN secondary_categories LIKE '%equipment_rental%' THEN 1 END) as vendors_with_equipment_rental,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as vendors_missing_user_id,
  COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as vendors_missing_email
FROM vendors;

-- Show vendors with non-canonical primary categories
SELECT id, company_name, primary_category_slug, category 
FROM vendors 
WHERE primary_category_slug NOT IN (
  'architectural_design',
  'building_masonry',
  'roofing_waterproofing',
  'doors_windows_glass',
  'flooring_wall_finishes',
  'plumbing_drainage',
  'electrical_solar',
  'hvac_climate',
  'carpentry_joinery',
  'kitchens_wardrobes',
  'painting_decorating',
  'pools_water_features',
  'landscaping_outdoor',
  'fencing_gates',
  'security_smart',
  'interior_decor',
  'project_management_qs',
  'equipment_hire',
  'waste_cleaning',
  'special_structures'
)
  AND primary_category_slug IS NOT NULL
  AND primary_category_slug != ''
ORDER BY company_name;

-- ============================================================================
-- Step 2: CREATE BACKUP (Important!)
-- ============================================================================
-- This creates a backup table before any modifications
CREATE TABLE vendors_backup_2026_01_08 AS 
SELECT * FROM vendors;

-- ============================================================================
-- Step 3: FIX PRIMARY CATEGORY SLUGS
-- ============================================================================
-- Map old slugs to new canonical slugs

-- Fix: plumber → plumbing_drainage
UPDATE vendors
SET primary_category_slug = 'plumbing_drainage'
WHERE primary_category_slug = 'plumber'
  AND primary_category_slug IS NOT NULL;

-- Fix: painter → painting_decorating
UPDATE vendors
SET primary_category_slug = 'painting_decorating'
WHERE primary_category_slug = 'painter'
  AND primary_category_slug IS NOT NULL;

-- Fix: carpenter → carpentry_joinery
UPDATE vendors
SET primary_category_slug = 'carpentry_joinery'
WHERE primary_category_slug = 'carpenter'
  AND primary_category_slug IS NOT NULL;

-- Fix: welder → special_structures
UPDATE vendors
SET primary_category_slug = 'special_structures'
WHERE primary_category_slug = 'welder'
  AND primary_category_slug IS NOT NULL;

-- Fix: hardware_store → doors_windows_glass
UPDATE vendors
SET primary_category_slug = 'doors_windows_glass'
WHERE primary_category_slug = 'hardware_store'
  AND primary_category_slug IS NOT NULL;

-- Fix: landscaper → landscaping_outdoor
UPDATE vendors
SET primary_category_slug = 'landscaping_outdoor'
WHERE primary_category_slug = 'landscaper'
  AND primary_category_slug IS NOT NULL;

-- Fix: solar_installer → electrical_solar
UPDATE vendors
SET primary_category_slug = 'electrical_solar'
WHERE primary_category_slug = 'solar_installer'
  AND primary_category_slug IS NOT NULL;

-- Fix: electrician → electrical_solar (if exists)
UPDATE vendors
SET primary_category_slug = 'electrical_solar'
WHERE primary_category_slug = 'electrician'
  AND primary_category_slug IS NOT NULL;

-- ============================================================================
-- Step 4: FIX SECONDARY CATEGORIES
-- ============================================================================
-- Remove "equipment_rental" (non-canonical, should be "equipment_hire")

-- First, fix equipment_rental to equipment_hire where it appears
UPDATE vendors
SET secondary_categories = jsonb_set(
  secondary_categories,
  '{0}',
  '"equipment_hire"'::jsonb
)
WHERE secondary_categories @> '"equipment_rental"'::jsonb;

-- Actually, let's set more appropriate secondary categories per vendor type:

-- For plumbing vendors: add hvac_climate as secondary
UPDATE vendors
SET secondary_categories = '["hvac_climate"]'::jsonb
WHERE primary_category_slug = 'plumbing_drainage'
  AND (secondary_categories IS NULL OR secondary_categories = 'null'::jsonb);

-- For building/construction: add project_management_qs
UPDATE vendors
SET secondary_categories = '["project_management_qs"]'::jsonb
WHERE primary_category_slug IN ('building_masonry', 'special_structures', 'carpentry_joinery')
  AND (secondary_categories IS NULL OR secondary_categories = 'null'::jsonb);

-- For electrical: add hvac_climate or solar
UPDATE vendors
SET secondary_categories = '["hvac_climate"]'::jsonb
WHERE primary_category_slug = 'electrical_solar'
  AND (secondary_categories IS NULL OR secondary_categories = 'null'::jsonb);

-- For landscaping: add fencing_gates
UPDATE vendors
SET secondary_categories = '["fencing_gates"]'::jsonb
WHERE primary_category_slug = 'landscaping_outdoor'
  AND (secondary_categories IS NULL OR secondary_categories = 'null'::jsonb);

-- For painting: add interior_decor
UPDATE vendors
SET secondary_categories = '["interior_decor"]'::jsonb
WHERE primary_category_slug = 'painting_decorating'
  AND (secondary_categories IS NULL OR secondary_categories = 'null'::jsonb);

-- ============================================================================
-- Step 5: CLEANUP DATA
-- ============================================================================

-- Remove test vendor if it exists
DELETE FROM vendors 
WHERE company_name = 'Test Vendor Company'
  AND id = 'f089b49d-77e3-4549-b76d-4568d6cc4f94';

-- ============================================================================
-- Step 6: VERIFY FIXES
-- ============================================================================

-- Check all primary_category_slug are now canonical
SELECT 
  primary_category_slug,
  COUNT(*) as vendor_count
FROM vendors
WHERE primary_category_slug IS NOT NULL
GROUP BY primary_category_slug
ORDER BY vendor_count DESC;

-- Should show only canonical slugs!

-- Check for any remaining invalid slugs
SELECT id, company_name, primary_category_slug 
FROM vendors 
WHERE primary_category_slug NOT IN (
  'architectural_design',
  'building_masonry',
  'roofing_waterproofing',
  'doors_windows_glass',
  'flooring_wall_finishes',
  'plumbing_drainage',
  'electrical_solar',
  'hvac_climate',
  'carpentry_joinery',
  'kitchens_wardrobes',
  'painting_decorating',
  'pools_water_features',
  'landscaping_outdoor',
  'fencing_gates',
  'security_smart',
  'interior_decor',
  'project_management_qs',
  'equipment_hire',
  'waste_cleaning',
  'special_structures'
)
  AND primary_category_slug IS NOT NULL
  AND primary_category_slug != '';

-- Should return 0 rows if all fixed!

-- Check secondary categories no longer have "equipment_rental"
SELECT id, company_name, secondary_categories
FROM vendors
WHERE secondary_categories LIKE '%equipment_rental%'
  OR secondary_categories LIKE '%"equipment_rental"%';

-- Should return 0 rows if all fixed!

-- ============================================================================
-- END MIGRATION
-- ============================================================================
-- 
-- If anything goes wrong, restore from backup:
-- DROP TABLE vendors;
-- ALTER TABLE vendors_backup_2026_01_08 RENAME TO vendors;
--
-- ============================================================================
