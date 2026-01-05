-- ============================================================================
-- SUPABASE SQL: UPDATE VENDOR CATEGORIES FOR RFQ TEMPLATES
-- ============================================================================
-- Date: January 5, 2026
-- Purpose: Assign each vendor to primary & optional secondary categories
-- Schema: vendors table with primaryCategorySlug (VARCHAR) and 
--         secondaryCategories (JSONB array) columns
-- ============================================================================

-- Valid vendor categories (22 total):
-- general_contractor, architect, engineer, quantity_surveyor, interior_designer,
-- electrician, plumber, carpenter, mason, painter, tiler, roofer, welder,
-- landscaper, solar_installer, hvac_technician, waterproofing, security_installer,
-- materials_supplier, equipment_rental, hardware_store, other

BEGIN;

-- Step 1: Add columns if they don't exist (safe to run multiple times)
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS primary_category_slug VARCHAR(50),
ADD COLUMN IF NOT EXISTS secondary_categories JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- VENDOR CATEGORIES MAPPING (16 vendors with known categories)
-- ============================================================================
-- These vendors have been identified and mapped to their appropriate categories.
-- Format: Company Name → Primary Category (+ Secondary Categories)

-- 1. AquaTech Borehole Services → Plumber (primary), Pools/Water Features (secondary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'plumber',
  secondary_categories = '["equipment_rental"]'::jsonb
WHERE id = '8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11'
  AND company_name LIKE '%AquaTech%' OR primary_category_slug IS NULL;

-- 2. BrightBuild Contractors → General Contractor (primary), Project Management (secondary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'general_contractor',
  secondary_categories = '["engineer", "quantity_surveyor"]'::jsonb
WHERE id = 'f3a72a11-91b8-4a90-8b82-24b35bfc9801'
  AND company_name LIKE '%BrightBuild%' OR primary_category_slug IS NULL;

-- 3. EcoSmart Landscapes → Landscaper (primary), Equipment Rental (secondary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'landscaper',
  secondary_categories = '["equipment_rental"]'::jsonb
WHERE id = '2cb95bde-4e5a-4b7c-baa4-7d50978b7a33'
  AND company_name LIKE '%EcoSmart%' OR primary_category_slug IS NULL;

-- 4. PaintPro Interiors → Painter (primary), Interior Designer (secondary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'painter',
  secondary_categories = '["interior_designer"]'::jsonb
WHERE id = 'cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11'
  AND company_name LIKE '%PaintPro%' OR primary_category_slug IS NULL;

-- 5. Royal Glass & Aluminum Works → Hardware Store (primary), General Contractor (secondary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'hardware_store',
  secondary_categories = '["general_contractor"]'::jsonb
WHERE id = 'aa64bff8-7e1b-4a9f-9b09-775b9d78e201'
  AND company_name LIKE '%Royal%Glass%' OR primary_category_slug IS NULL;

-- 6. SolarOne Energy Solutions → Solar Installer (primary), Electrician (secondary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'solar_installer',
  secondary_categories = '["electrician", "hvac_technician"]'::jsonb
WHERE id = '3b72d211-3a11-4b45-b7a5-3212c4219e08'
  AND company_name LIKE '%SolarOne%' OR primary_category_slug IS NULL;

-- 7. SteelPro Fabricators Ltd → Welder (primary), General Contractor (secondary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'welder',
  secondary_categories = '["general_contractor"]'::jsonb
WHERE id = 'b4f2c6ef-81b3-45d7-b42b-8036cbf210d4'
  AND company_name LIKE '%SteelPro%' OR primary_category_slug IS NULL;

-- 8. Timber Masters Kenya → Carpenter (primary), Interior Designer (secondary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'carpenter',
  secondary_categories = '["interior_designer"]'::jsonb
WHERE id = '3688f0ab-4c1d-4a5e-9345-2df1da846544'
  AND company_name LIKE '%Timber%' OR primary_category_slug IS NULL;

-- 9. Unknown Vendor (Building Materials) → Materials Supplier (primary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'materials_supplier',
  secondary_categories = '[]'::jsonb
WHERE id = 'ed3e73f7-358d-49da-a2a3-847c84dfe360' AND primary_category_slug IS NULL;

-- 10. Unknown Vendor (Plumbing) → Plumber (primary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'plumber',
  secondary_categories = '[]'::jsonb
WHERE id = '61b12f52-9f79-49e0-a1f2-d145b52fa25d' AND primary_category_slug IS NULL;

-- 11. Unknown Vendor (Electrical) → Electrician (primary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'electrician',
  secondary_categories = '[]'::jsonb
WHERE id = 'd4695f1a-498d-4a47-8861-dffabe176426' AND primary_category_slug IS NULL;

-- 12. Unknown Vendor (Plumbing) → Plumber (primary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'plumber',
  secondary_categories = '[]'::jsonb
WHERE id = '759a761e-b5f5-4d4c-9b02-1174df11ead8' AND primary_category_slug IS NULL;

-- 13. Unknown Vendor (Roofing/Waterproofing) → Roofer (primary), Waterproofing (secondary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'roofer',
  secondary_categories = '["waterproofing"]'::jsonb
WHERE id = 'fa0f326d-9463-499d-b13e-980762267c12' AND primary_category_slug IS NULL;

-- 14. Unknown Vendor (Plumbing) → Plumber (primary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'plumber',
  secondary_categories = '[]'::jsonb
WHERE id = 'f089b49d-77e3-4549-b76d-4568d6cc4f94' AND primary_category_slug IS NULL;

-- 15. Unknown Vendor (General Contractor) → General Contractor (primary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'general_contractor',
  secondary_categories = '["quantity_surveyor"]'::jsonb
WHERE id = '24c2cba6-f16c-4d44-ad08-53af20ca471c' AND primary_category_slug IS NULL;

-- 16. Unknown Vendor (Masonry) → Mason (primary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'mason',
  secondary_categories = '[]'::jsonb
WHERE id = '52c837c7-e0e0-4315-b5ea-5c4fda5064b8' AND primary_category_slug IS NULL;

-- 17. Unknown Vendor (Building) → General Contractor (primary)
UPDATE public.vendors 
SET 
  primary_category_slug = 'general_contractor',
  secondary_categories = '[]'::jsonb
WHERE id = 'ba1c65ad-cb98-4c55-9442-89b44c71403e' AND primary_category_slug IS NULL;

-- ============================================================================
-- STEP 2: VERIFY UPDATES
-- ============================================================================
-- Run this to see what was updated:

SELECT 
  id,
  company_name,
  primary_category_slug,
  secondary_categories,
  county
FROM public.vendors
WHERE primary_category_slug IS NOT NULL
ORDER BY primary_category_slug, company_name;

-- ============================================================================
-- STEP 3: CATEGORY DISTRIBUTION (Summary)
-- ============================================================================

SELECT 
  primary_category_slug,
  COUNT(*) as vendor_count
FROM public.vendors
WHERE primary_category_slug IS NOT NULL
GROUP BY primary_category_slug
ORDER BY vendor_count DESC, primary_category_slug;

COMMIT;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- If you need to undo these changes, run:
-- 
-- UPDATE public.vendors 
-- SET primary_category_slug = NULL, secondary_categories = '[]'::jsonb
-- WHERE id IN (
--   '8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11',
--   'f3a72a11-91b8-4a90-8b82-24b35bfc9801',
--   '2cb95bde-4e5a-4b7c-baa4-7d50978b7a33',
--   'cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11',
--   'aa64bff8-7e1b-4a9f-9b09-775b9d78e201',
--   '3b72d211-3a11-4b45-b7a5-3212c4219e08',
--   'b4f2c6ef-81b3-45d7-b42b-8036cbf210d4',
--   '3688f0ab-4c1d-4a5e-9345-2df1da846544',
--   'ed3e73f7-358d-49da-a2a3-847c84dfe360',
--   '61b12f52-9f79-49e0-a1f2-d145b52fa25d',
--   'd4695f1a-498d-4a47-8861-dffabe176426',
--   '759a761e-b5f5-4d4c-9b02-1174df11ead8',
--   'fa0f326d-9463-499d-b13e-980762267c12',
--   'f089b49d-77e3-4549-b76d-4568d6cc4f94',
--   '24c2cba6-f16c-4d44-ad08-53af20ca471c',
--   '52c837c7-e0e0-4315-b5ea-5c4fda5064b8',
--   'ba1c65ad-cb98-4c55-9442-89b44c71403e'
-- );
