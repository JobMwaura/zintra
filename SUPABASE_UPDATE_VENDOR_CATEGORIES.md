# Supabase Category Update Instructions

**Status:** Ready to Execute  
**Date:** January 4, 2026  
**Action:** Update existing vendors to match 20 RFQ template categories

---

## 📋 YOUR EXISTING VENDORS

You have 13 vendors that need their categories updated to match the 20 RFQ template system:

| Business Name | Current Category | New Category | Slug |
|---------------|------------------|--------------|------|
| AquaTech Borehole Services | Water & Borehole Drilling | Plumbing & Drainage | plumbing_drainage |
| BrightBuild Contractors | General Construction | Building & Masonry | building_masonry |
| EcoSmart Landscapes | Landscaping & Gardening | Landscaping & Outdoor | landscaping_outdoor |
| PaintPro Interiors | Painting & Finishing | Painting & Decorating | painting_decorating |
| Royal Glass & Aluminum Works | Windows & Aluminum Fabrication | Doors, Windows & Glass | doors_windows_glass |
| SolarOne Energy Solutions | Solar & Renewable Energy | Electrical & Solar | electrical_solar |
| SteelPro Fabricators Ltd | Steel & Metal Works | Special Structures | special_structures |
| Timber Masters Kenya | Wood & Timber Solutions | Carpentry & Joinery | carpentry_joinery |
| (4 vendors with missing names) | Building & Structural Materials | Building & Masonry | building_masonry |
| (4 vendors with missing names) | Plumbing & Sanitation | Plumbing & Drainage | plumbing_drainage |
| (1 vendor with missing name) | Electrical & Lighting | Electrical & Solar | electrical_solar |
| (2 vendors with missing names) | Plumbing & Sanitation / Roofing | Roofing & Waterproofing | roofing_waterproofing |
| (1 vendor with missing name) | Plumbing | Plumbing & Drainage | plumbing_drainage |
| (1 vendor with missing name) | general-contractor | Building & Masonry | building_masonry |
| (5 vendors with missing data) | (empty) | Needs Review | (see below) |
| (1 vendor with missing name) | Kitchen & Interior Fittings | Kitchens & Wardrobes | kitchens_wardrobes |

---

## 🔧 SQL TO UPDATE VENDORS

Copy and paste this SQL into Supabase SQL Editor:

```sql
-- Update vendor categories to match 20 RFQ template categories
-- This matches your existing vendors to the new category system

BEGIN;

-- 1. AquaTech Borehole Services
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'plumbing_drainage',
  secondary_categories = '["pools_water_features"]'::jsonb
WHERE id = '8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11';

-- 2. BrightBuild Contractors
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'building_masonry',
  secondary_categories = '["project_management_qs"]'::jsonb
WHERE id = 'f3a72a11-91b8-4a90-8b82-24b35bfc9801';

-- 3. EcoSmart Landscapes
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'landscaping_outdoor',
  secondary_categories = '["pools_water_features"]'::jsonb
WHERE id = '2cb95bde-4e5a-4b7c-baa4-7d50978b7a33';

-- 4. PaintPro Interiors
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'painting_decorating',
  secondary_categories = '["interior_decor", "flooring_wall_finishes"]'::jsonb
WHERE id = 'cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11';

-- 5. Royal Glass & Aluminum Works
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'doors_windows_glass',
  secondary_categories = '["security_smart"]'::jsonb
WHERE id = 'aa64bff8-7e1b-4a9f-9b09-775b9d78e201';

-- 6. SolarOne Energy Solutions
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'electrical_solar',
  secondary_categories = '["security_smart", "hvac_climate"]'::jsonb
WHERE id = '3b72d211-3a11-4b45-b7a5-3212c4219e08';

-- 7. SteelPro Fabricators Ltd
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'special_structures',
  secondary_categories = '["building_masonry"]'::jsonb
WHERE id = 'b4f2c6ef-81b3-45d7-b42b-8036cbf210d4';

-- 8. Timber Masters Kenya
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'carpentry_joinery',
  secondary_categories = '["kitchens_wardrobes", "interior_decor"]'::jsonb
WHERE id = '3688f0ab-4c1d-4a5e-9345-2df1da846544';

-- 9. Building & Structural Materials vendor (missing name)
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'building_masonry',
  secondary_categories = '[]'::jsonb,
  business_name = 'Building Materials Supplier' -- Add placeholder name
WHERE id = 'ed3e73f7-358d-49da-a2a3-847c84dfe360'
AND (business_name IS NULL OR business_name = '');

-- 10. Plumbing & Sanitation vendor (missing name)
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'plumbing_drainage',
  secondary_categories = '[]'::jsonb,
  business_name = 'Plumbing Services' -- Add placeholder name
WHERE id = '61b12f52-9f79-49e0-a1f2-d145b52fa25d'
AND (business_name IS NULL OR business_name = '');

-- 11. Electrical & Lighting vendor (missing name)
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'electrical_solar',
  secondary_categories = '[]'::jsonb,
  business_name = 'Electrical Solutions' -- Add placeholder name
WHERE id = 'd4695f1a-498d-4a47-8861-dffabe176426'
AND (business_name IS NULL OR business_name = '');

-- 12. Plumbing & Sanitation vendor (missing name) - variant 1
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'plumbing_drainage',
  secondary_categories = '[]'::jsonb,
  business_name = 'Plumbing & Drainage Services' -- Add placeholder name
WHERE id = '759a761e-b5f5-4d4c-9b02-1174df11ead8'
AND (business_name IS NULL OR business_name = '');

-- 13. Roofing & Waterproofing vendor (missing name)
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'roofing_waterproofing',
  secondary_categories = '["building_masonry"]'::jsonb,
  business_name = 'Roofing Solutions' -- Add placeholder name
WHERE id = 'fa0f326d-9463-499d-b13e-980762267c12'
AND (business_name IS NULL OR business_name = '');

-- 14. Plumbing vendor (missing name)
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'plumbing_drainage',
  secondary_categories = '[]'::jsonb,
  business_name = 'Plumbing Experts' -- Add placeholder name
WHERE id = 'f089b49d-77e3-4549-b76d-4568d6cc4f94'
AND (business_name IS NULL OR business_name = '');

-- 15. general-contractor vendor (missing name)
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'building_masonry',
  secondary_categories = '["project_management_qs"]'::jsonb,
  business_name = 'General Construction Services' -- Add placeholder name
WHERE id = '24c2cba6-f16c-4d44-ad08-53af20ca471c'
AND (business_name IS NULL OR business_name = '');

-- 16. Unknown vendor 1 (IDs without names)
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'building_masonry',
  secondary_categories = '[]'::jsonb
WHERE id = '52c837c7-e0e0-4315-b5ea-5c4fda5064b8'
AND (business_name IS NULL OR business_name = '');

-- 17. Unknown vendor 2 (IDs without names)
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'building_masonry',
  secondary_categories = '[]'::jsonb
WHERE id = 'ba1c65ad-cb98-4c55-9442-89b44c71403e'
AND (business_name IS NULL OR business_name = '');

-- 18. Kitchen & Interior Fittings vendor (missing name)
UPDATE public.vendor_profiles 
SET 
  primary_category_slug = 'kitchens_wardrobes',
  secondary_categories = '["interior_decor"]'::jsonb,
  business_name = 'Kitchen & Interior Fittings' -- Add placeholder name
WHERE id = (
  SELECT id FROM public.vendor_profiles 
  WHERE business_name = '' OR business_name IS NULL
  LIMIT 1
)
AND (business_name IS NULL OR business_name = '');

COMMIT;

-- ==========================================
-- VERIFICATION QUERIES (Run after updates)
-- ==========================================

-- Check all vendors now have categories
SELECT 
  id,
  business_name,
  primary_category_slug,
  secondary_categories
FROM public.vendor_profiles
ORDER BY primary_category_slug, business_name;

-- Count vendors by category
SELECT 
  primary_category_slug,
  COUNT(*) as vendor_count,
  STRING_AGG(business_name, ', ') as vendors
FROM public.vendor_profiles
GROUP BY primary_category_slug
ORDER BY primary_category_slug;

-- Find any vendors without categories (should be empty after update)
SELECT 
  id,
  business_name
FROM public.vendor_profiles
WHERE primary_category_slug IS NULL OR primary_category_slug = '';
```

---

## 🚀 HOW TO EXECUTE

### Step 1: Verify Your Vendor IDs
Before running, verify these are your actual vendor IDs:

```sql
-- Check if these vendors exist
SELECT id, business_name, primary_category_slug 
FROM public.vendor_profiles
WHERE business_name IN (
  'AquaTech Borehole Services',
  'BrightBuild Contractors',
  'EcoSmart Landscapes',
  'PaintPro Interiors',
  'Royal Glass & Aluminum Works',
  'SolarOne Energy Solutions',
  'SteelPro Fabricators Ltd',
  'Timber Masters Kenya'
);
```

If the IDs don't match, update the UUIDs in the SQL above.

### Step 2: Copy the SQL
1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire SQL block above (lines under "SQL TO UPDATE VENDORS")
3. Paste into the editor

### Step 3: Run It
Click "Run" button

**Expected result:** 
- "18 rows affected" message (or similar)
- No errors

### Step 4: Verify
Run the verification queries at the bottom to confirm:

1. **First query:** Shows all vendors with their new categories
2. **Second query:** Shows count of vendors per category
3. **Third query:** Should be empty (no vendors without categories)

---

## 📊 EXPECTED RESULTS AFTER UPDATE

### By Category (you should see):
```
building_masonry             | 3  | BrightBuild, Building Materials..., General Contractors...
carpentry_joinery            | 1  | Timber Masters Kenya
doors_windows_glass          | 1  | Royal Glass & Aluminum Works
electrical_solar             | 2  | SolarOne Energy Solutions, Electrical Solutions
interior_decor               | 1  | (if any pure interior)
kitchens_wardrobes           | 1  | Kitchen & Interior Fittings
landscaping_outdoor          | 1  | EcoSmart Landscapes
painting_decorating          | 1  | PaintPro Interiors
plumbing_drainage            | 5  | AquaTech Borehole..., Plumbing Services...
roofing_waterproofing        | 1  | Roofing Solutions
special_structures           | 1  | SteelPro Fabricators Ltd
```

**Total: 18 vendors across 11 categories** ✅

---

## ⚠️ IMPORTANT NOTES

1. **Backup First:** These IDs are from your list. If they're not exact matches, the UPDATE won't find the vendors.
   
2. **Missing Names:** Some vendors have empty `business_name` fields. The SQL adds placeholder names.

3. **Secondary Categories:** Each vendor has 1-2 secondary categories related to their primary work. This helps with matching.

4. **After Update:** 
   - Vendors will show correctly on homepage (all 20 categories visible)
   - RFQ matching will work when creating RFQs
   - Job assignment can happen in Phase 1 testing

---

## 🧪 AFTER SUPABASE UPDATE

Once complete:

1. ✅ Homepage shows all 20 categories (just updated)
2. ✅ All existing vendors have correct categories
3. ✅ You're ready to test Phase 1 flow:
   - Create RFQ with category "electrical_solar"
   - System finds "SolarOne Energy Solutions"
   - Assign to vendor
   - Notification created
   - ✅ Phase 1 works!

---

## 💡 IF SOME VENDORS DON'T UPDATE

If you run the query and some vendors don't get updated:

1. Check the IDs are correct:
```sql
SELECT * FROM public.vendor_profiles LIMIT 20;
```

2. Find the correct ID:
```sql
SELECT id, business_name FROM public.vendor_profiles 
WHERE business_name = 'AquaTech Borehole Services';
```

3. Update the SQL with correct ID and re-run

Let me know if you need help troubleshooting! 🎯
