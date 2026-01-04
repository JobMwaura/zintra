# 🎯 QUICK COPY-PASTE FOR SUPABASE

**Just copy everything below and paste into Supabase SQL Editor → Click Run**

---

```sql
BEGIN;

-- FIRST: Add category columns if they don't exist
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS primary_category_slug VARCHAR(50),
ADD COLUMN IF NOT EXISTS secondary_categories JSONB DEFAULT '[]'::jsonb;

UPDATE public.vendors SET primary_category_slug = 'plumbing_drainage', secondary_categories = '["pools_water_features"]'::jsonb WHERE id = '8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11';
UPDATE public.vendors SET primary_category_slug = 'building_masonry', secondary_categories = '["project_management_qs"]'::jsonb WHERE id = 'f3a72a11-91b8-4a90-8b82-24b35bfc9801';
UPDATE public.vendors SET primary_category_slug = 'landscaping_outdoor', secondary_categories = '["pools_water_features"]'::jsonb WHERE id = '2cb95bde-4e5a-4b7c-baa4-7d50978b7a33';
UPDATE public.vendors SET primary_category_slug = 'painting_decorating', secondary_categories = '["interior_decor", "flooring_wall_finishes"]'::jsonb WHERE id = 'cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11';
UPDATE public.vendors SET primary_category_slug = 'doors_windows_glass', secondary_categories = '["security_smart"]'::jsonb WHERE id = 'aa64bff8-7e1b-4a9f-9b09-775b9d78e201';
UPDATE public.vendors SET primary_category_slug = 'electrical_solar', secondary_categories = '["security_smart", "hvac_climate"]'::jsonb WHERE id = '3b72d211-3a11-4b45-b7a5-3212c4219e08';
UPDATE public.vendors SET primary_category_slug = 'special_structures', secondary_categories = '["building_masonry"]'::jsonb WHERE id = 'b4f2c6ef-81b3-45d7-b42b-8036cbf210d4';
UPDATE public.vendors SET primary_category_slug = 'carpentry_joinery', secondary_categories = '["kitchens_wardrobes", "interior_decor"]'::jsonb WHERE id = '3688f0ab-4c1d-4a5e-9345-2df1da846544';
UPDATE public.vendors SET primary_category_slug = 'building_masonry', secondary_categories = '[]'::jsonb WHERE id = 'ed3e73f7-358d-49da-a2a3-847c84dfe360' AND (company_name IS NULL OR company_name = '');
UPDATE public.vendors SET primary_category_slug = 'plumbing_drainage', secondary_categories = '[]'::jsonb WHERE id = '61b12f52-9f79-49e0-a1f2-d145b52fa25d' AND (company_name IS NULL OR company_name = '');
UPDATE public.vendors SET primary_category_slug = 'electrical_solar', secondary_categories = '[]'::jsonb WHERE id = 'd4695f1a-498d-4a47-8861-dffabe176426' AND (company_name IS NULL OR company_name = '');
UPDATE public.vendors SET primary_category_slug = 'plumbing_drainage', secondary_categories = '[]'::jsonb WHERE id = '759a761e-b5f5-4d4c-9b02-1174df11ead8' AND (company_name IS NULL OR company_name = '');
UPDATE public.vendors SET primary_category_slug = 'roofing_waterproofing', secondary_categories = '["building_masonry"]'::jsonb WHERE id = 'fa0f326d-9463-499d-b13e-980762267c12' AND (company_name IS NULL OR company_name = '');
UPDATE public.vendors SET primary_category_slug = 'plumbing_drainage', secondary_categories = '[]'::jsonb WHERE id = 'f089b49d-77e3-4549-b76d-4568d6cc4f94' AND (company_name IS NULL OR company_name = '');
UPDATE public.vendors SET primary_category_slug = 'building_masonry', secondary_categories = '["project_management_qs"]'::jsonb WHERE id = '24c2cba6-f16c-4d44-ad08-53af20ca471c' AND (company_name IS NULL OR company_name = '');
UPDATE public.vendors SET primary_category_slug = 'building_masonry', secondary_categories = '[]'::jsonb WHERE id = '52c837c7-e0e0-4315-b5ea-5c4fda5064b8' AND (company_name IS NULL OR company_name = '');
UPDATE public.vendors SET primary_category_slug = 'building_masonry', secondary_categories = '[]'::jsonb WHERE id = 'ba1c65ad-cb98-4c55-9442-89b44c71403e' AND (company_name IS NULL OR company_name = '');
UPDATE public.vendors SET primary_category_slug = 'kitchens_wardrobes', secondary_categories = '["interior_decor"]'::jsonb WHERE (company_name IS NULL OR company_name = '') AND id NOT IN ('8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11', 'f3a72a11-91b8-4a90-8b82-24b35bfc9801', '2cb95bde-4e5a-4b7c-baa4-7d50978b7a33', 'cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11', 'aa64bff8-7e1b-4a9f-9b09-775b9d78e201', '3b72d211-3a11-4b45-b7a5-3212c4219e08', 'b4f2c6ef-81b3-45d7-b42b-8036cbf210d4', '3688f0ab-4c1d-4a5e-9345-2df1da846544', 'ed3e73f7-358d-49da-a2a3-847c84dfe360', '61b12f52-9f79-49e0-a1f2-d145b52fa25d', 'd4695f1a-498d-4a47-8861-dffabe176426', '759a761e-b5f5-4d4c-9b02-1174df11ead8', 'fa0f326d-9463-499d-b13e-980762267c12', 'f089b49d-77e3-4549-b76d-4568d6cc4f94', '24c2cba6-f16c-4d44-ad08-53af20ca471c', '52c837c7-e0e0-4315-b5ea-5c4fda5064b8', 'ba1c65ad-cb98-4c55-9442-89b44c71403e');

COMMIT;
```

---

## ✅ AFTER RUNNING

Run this to verify:

```sql
SELECT 
  primary_category_slug,
  COUNT(*) as count
FROM public.vendors
GROUP BY primary_category_slug
ORDER BY count DESC;
```

Should show 11 categories with 18 vendors total. ✅

---

**Done!** You're ready for Phase 1 testing! 🎉
