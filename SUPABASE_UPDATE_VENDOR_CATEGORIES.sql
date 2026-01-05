/**
 * Supabase SQL Script: Update Existing Vendors' Primary Categories
 * 
 * This script maps existing vendors to one of the 22 valid primary categories
 * based on their company name, location, or other characteristics.
 * 
 * Usage:
 * 1. Go to Supabase Dashboard → SQL Editor
 * 2. Create a new query
 * 3. Paste this script
 * 4. Review the mapping logic and adjust as needed
 * 5. Click "Run"
 * 
 * The script updates vendors that don't have a primaryCategorySlug set,
 * or allows you to override existing categories.
 */

-- ============================================================================
-- OPTION 1: VIEW - See current vendor categories before updating
-- ============================================================================

SELECT 
  id,
  company_name,
  primaryCategorySlug,
  secondaryCategories,
  county,
  created_at
FROM vendors
ORDER BY created_at DESC;

-- ============================================================================
-- OPTION 2: UPDATE - Assign categories based on company name patterns
-- ============================================================================

-- Update vendors based on keywords in their company name
BEGIN;

-- Electricians
UPDATE vendors
SET primaryCategorySlug = 'electrician'
WHERE (
  LOWER(company_name) LIKE '%electric%' 
  OR LOWER(company_name) LIKE '%electrical%'
  OR LOWER(company_name) LIKE '%electro%'
)
AND primaryCategorySlug IS NULL;

-- Plumbers
UPDATE vendors
SET primaryCategorySlug = 'plumber'
WHERE (
  LOWER(company_name) LIKE '%plumb%'
  OR LOWER(company_name) LIKE '%water%'
)
AND primaryCategorySlug IS NULL;

-- Carpenters
UPDATE vendors
SET primaryCategorySlug = 'carpenter'
WHERE (
  LOWER(company_name) LIKE '%carpenter%'
  OR LOWER(company_name) LIKE '%wood%'
  OR LOWER(company_name) LIKE '%timber%'
)
AND primaryCategorySlug IS NULL;

-- Painters
UPDATE vendors
SET primaryCategorySlug = 'painter'
WHERE (
  LOWER(company_name) LIKE '%paint%'
  OR LOWER(company_name) LIKE '%decorator%'
)
AND primaryCategorySlug IS NULL;

-- Masons/Bricklayers
UPDATE vendors
SET primaryCategorySlug = 'mason'
WHERE (
  LOWER(company_name) LIKE '%mason%'
  OR LOWER(company_name) LIKE '%brick%'
  OR LOWER(company_name) LIKE '%stone%'
)
AND primaryCategorySlug IS NULL;

-- Roofers
UPDATE vendors
SET primaryCategorySlug = 'roofer'
WHERE (
  LOWER(company_name) LIKE '%roof%'
)
AND primaryCategorySlug IS NULL;

-- General Contractors
UPDATE vendors
SET primaryCategorySlug = 'general_contractor'
WHERE (
  LOWER(company_name) LIKE '%contractor%'
  OR LOWER(company_name) LIKE '%construction%'
  OR LOWER(company_name) LIKE '%build%'
)
AND primaryCategorySlug IS NULL;

-- Architects
UPDATE vendors
SET primaryCategorySlug = 'architect'
WHERE (
  LOWER(company_name) LIKE '%architect%'
  OR LOWER(company_name) LIKE '%design%'
)
AND primaryCategorySlug IS NULL;

-- HVAC Technicians
UPDATE vendors
SET primaryCategorySlug = 'hvac_technician'
WHERE (
  LOWER(company_name) LIKE '%hvac%'
  OR LOWER(company_name) LIKE '%air%condition%'
  OR LOWER(company_name) LIKE '%cooling%'
)
AND primaryCategorySlug IS NULL;

-- Welders
UPDATE vendors
SET primaryCategorySlug = 'welder'
WHERE (
  LOWER(company_name) LIKE '%weld%'
  OR LOWER(company_name) LIKE '%metal%'
  OR LOWER(company_name) LIKE '%fabricat%'
)
AND primaryCategorySlug IS NULL;

-- Landscapers
UPDATE vendors
SET primaryCategorySlug = 'landscaper'
WHERE (
  LOWER(company_name) LIKE '%landscape%'
  OR LOWER(company_name) LIKE '%garden%'
  OR LOWER(company_name) LIKE '%lawn%'
)
AND primaryCategorySlug IS NULL;

-- Solar Installers
UPDATE vendors
SET primaryCategorySlug = 'solar_installer'
WHERE (
  LOWER(company_name) LIKE '%solar%'
  OR LOWER(company_name) LIKE '%photovoltaic%'
)
AND primaryCategorySlug IS NULL;

-- Interior Designers
UPDATE vendors
SET primaryCategorySlug = 'interior_designer'
WHERE (
  LOWER(company_name) LIKE '%interior%'
  OR LOWER(company_name) LIKE '%designer%'
)
AND primaryCategorySlug IS NULL;

-- Materials Suppliers
UPDATE vendors
SET primaryCategorySlug = 'materials_supplier'
WHERE (
  LOWER(company_name) LIKE '%supplier%'
  OR LOWER(company_name) LIKE '%materials%'
  OR LOWER(company_name) LIKE '%hardware%'
)
AND primaryCategorySlug IS NULL;

-- Equipment Rental
UPDATE vendors
SET primaryCategorySlug = 'equipment_rental'
WHERE (
  LOWER(company_name) LIKE '%rental%'
  OR LOWER(company_name) LIKE '%hire%'
  OR LOWER(company_name) LIKE '%equipment%'
)
AND primaryCategorySlug IS NULL;

-- Assign "other" to any remaining vendors with no category
UPDATE vendors
SET primaryCategorySlug = 'other'
WHERE primaryCategorySlug IS NULL;

COMMIT;

-- ============================================================================
-- VERIFICATION: Check the results
-- ============================================================================

SELECT 
  primaryCategorySlug,
  COUNT(*) as vendor_count
FROM vendors
WHERE primaryCategorySlug IS NOT NULL
GROUP BY primaryCategorySlug
ORDER BY vendor_count DESC;

-- List all vendors with their new categories
SELECT 
  id,
  company_name,
  primaryCategorySlug,
  county,
  created_at
FROM vendors
ORDER BY primaryCategorySlug, company_name;

-- ============================================================================
-- OPTION 3: MANUAL - Update specific vendor by ID
-- ============================================================================

-- Replace 'VENDOR_ID_HERE' with actual vendor UUID
-- Replace 'electrician' with desired category slug

UPDATE vendors
SET primaryCategorySlug = 'electrician'
WHERE id = 'VENDOR_ID_HERE';

-- ============================================================================
-- OPTION 4: OVERRIDE ALL - Start fresh with specific mapping
-- ============================================================================

-- If you want to completely override and set all vendors to test categories:

-- First, reset all to NULL (optional)
-- UPDATE vendors SET primaryCategorySlug = NULL;

-- Then assign specific vendors to different categories for testing

-- Test Electrician category
UPDATE vendors
SET primaryCategorySlug = 'electrician'
WHERE id = (SELECT id FROM vendors LIMIT 1);

-- Test Plumber category
UPDATE vendors
SET primaryCategorySlug = 'plumber'
WHERE id = (SELECT id FROM vendors OFFSET 1 LIMIT 1);

-- Test Carpenter category
UPDATE vendors
SET primaryCategorySlug = 'carpenter'
WHERE id = (SELECT id FROM vendors OFFSET 2 LIMIT 1);

-- Test Mason category
UPDATE vendors
SET primaryCategorySlug = 'mason'
WHERE id = (SELECT id FROM vendors OFFSET 3 LIMIT 1);

-- Test Painter category
UPDATE vendors
SET primaryCategorySlug = 'painter'
WHERE id = (SELECT id FROM vendors OFFSET 4 LIMIT 1);

-- Test General Contractor category
UPDATE vendors
SET primaryCategorySlug = 'general_contractor'
WHERE id = (SELECT id FROM vendors OFFSET 5 LIMIT 1);

-- ============================================================================
-- CATEGORY REFERENCE (All 22 Valid Categories)
-- ============================================================================

/*

Valid primaryCategorySlug values:
1. general_contractor
2. architect
3. engineer
4. quantity_surveyor
5. interior_designer
6. electrician
7. plumber
8. carpenter
9. mason
10. painter
11. tiler
12. roofer
13. welder
14. landscaper
15. solar_installer
16. hvac_technician
17. waterproofing
18. security_installer
19. materials_supplier
20. equipment_rental
21. hardware_store
22. other

*/

-- ============================================================================
-- CLEANUP: Check for any vendors still without a category
-- ============================================================================

SELECT 
  id,
  company_name,
  primaryCategorySlug,
  created_at
FROM vendors
WHERE primaryCategorySlug IS NULL;

-- If any exist, assign them to 'other'
UPDATE vendors
SET primaryCategorySlug = 'other'
WHERE primaryCategorySlug IS NULL;
