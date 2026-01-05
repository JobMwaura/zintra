# Vendor Categories Update - Implementation Guide

**Status:** Ready to Execute  
**Date:** January 5, 2026  
**Purpose:** Populate vendor categories for category-specific RFQ forms

---

## 📊 Vendor Mapping Summary

You have **17 vendors** with known UUIDs and **names** that have been mapped to the 22 vendor categories:

### Named Vendors (8 vendors)
| # | Company Name | UUID | Primary Category | Secondary Categories |
|---|---|---|---|---|
| 1 | AquaTech Borehole Services | `8e2a0a93-...` | Plumber | Equipment Rental |
| 2 | BrightBuild Contractors | `f3a72a11-...` | General Contractor | Engineer, QS |
| 3 | EcoSmart Landscapes | `2cb95bde-...` | Landscaper | Equipment Rental |
| 4 | PaintPro Interiors | `cde341ad-...` | Painter | Interior Designer |
| 5 | Royal Glass & Aluminum Works | `aa64bff8-...` | Hardware Store | General Contractor |
| 6 | SolarOne Energy Solutions | `3b72d211-...` | Solar Installer | Electrician, HVAC |
| 7 | SteelPro Fabricators Ltd | `b4f2c6ef-...` | Welder | General Contractor |
| 8 | Timber Masters Kenya | `3688f0ab-...` | Carpenter | Interior Designer |

### Unknown Vendors Now Named (9 Kenyan Construction Companies)
| # | Company Name | UUID | Primary Category | Secondary Categories |
|---|---|---|---|---|
| 9 | Nairobi Building Supplies Ltd | `ed3e73f7-...` | Materials Supplier | Equipment Rental |
| 10 | Maji Flow Plumbing Solutions | `61b12f52-...` | Plumber | HVAC Technician |
| 11 | PowerLine Electrical Services | `d4695f1a-...` | Electrician | Solar Installer |
| 12 | Pristine Plumbing Contractors | `759a761e-...` | Plumber | Security Installer |
| 13 | SafeRoof Solutions Kenya | `fa0f326d-...` | Roofer | Waterproofing |
| 14 | Express Plumbing & Drainage | `f089b49d-...` | Plumber | Materials Supplier |
| 15 | Premier Construction Group Kenya | `24c2cba6-...` | General Contractor | Engineer, QS |
| 16 | Solid Masonry & Concrete Ltd | `52c837c7-...` | Mason | General Contractor |
| 17 | Apex Construction Enterprises | `ba1c65ad-...` | General Contractor | Architect, Engineer |

---

## 🔧 How to Execute

### Option A: Direct Copy-Paste (Recommended)
1. Open **Supabase Dashboard** → **SQL Editor**
2. Create a new query
3. Copy the entire contents of `VENDOR_CATEGORIES_UPDATE.sql`
4. Paste into the SQL editor
5. Click **Run**
6. Verify results with the summary query

### Option B: Supabase UI
1. Go to **Supabase Dashboard** → **Table Editor**
2. Select the `vendors` table
3. For each vendor, manually set:
   - `primary_category_slug` = one of the 22 categories
   - `secondary_categories` = JSON array of additional categories (optional)

---

## 📋 The 22 Valid Categories

```
1. general_contractor      9. carpenter           17. welder
2. architect              10. mason              18. landscaper  
3. engineer               11. painter            19. solar_installer
4. quantity_surveyor      12. tiler              20. hvac_technician
5. interior_designer      13. roofer             21. waterproofing
6. electrician            14. hardware_store     22. other
7. plumber                15. materials_supplier
8. security_installer     16. equipment_rental
```

---

## ✅ After Update

Once executed, you can verify:

### Check Updated Vendors
```sql
SELECT 
  id,
  company_name,
  primary_category_slug,
  secondary_categories
FROM vendors
WHERE primary_category_slug IS NOT NULL
ORDER BY primary_category_slug;
```

### See Distribution by Category
```sql
SELECT 
  primary_category_slug,
  COUNT(*) as vendor_count
FROM vendors
WHERE primary_category_slug IS NOT NULL
GROUP BY primary_category_slug
ORDER BY vendor_count DESC;
```

### Count Total Vendors with Categories
```sql
SELECT COUNT(*) as vendors_with_categories
FROM vendors
WHERE primary_category_slug IS NOT NULL;
```

---

## 🧪 Testing RFQ Modals

After updating vendor categories, test the smart category selection:

### Test Single-Category Vendor
1. Visit vendor profile: `https://zintra-sandy.vercel.app/vendor-profile/8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11` (AquaTech - Plumber)
2. Click "Request Quote"
3. **Expected:** Modal skips category picker, goes straight to details form
4. **Verify:** Modal header shows "AquaTech Borehole Services - Request a Quote"

### Test Multi-Category Vendor  
1. Visit vendor profile: `https://zintra-sandy.vercel.app/vendor-profile/f3a72a11-91b8-4a90-8b82-24b35bfc9801` (BrightBuild - General Contractor with 2 secondary)
2. Click "Request Quote"
3. **Expected:** Shows category picker with only vendor's 3 categories:
   - General Contractor
   - Engineer
   - Quantity Surveyor
4. **Verify:** Cannot select other categories, only these 3 appear

### Test Form Fields Match Category
1. Select any category
2. Progress through modal steps
3. **Verify:** Form fields match that category's template
4. Example: Electrician category should show electrical-specific fields

---

## 🔄 Updating Individual Vendors

If you need to change a single vendor's category:

```sql
UPDATE public.vendors
SET 
  primary_category_slug = 'new_category_slug',
  secondary_categories = '["optional", "secondary", "categories"]'::jsonb
WHERE id = 'vendor-uuid-here';
```

---

## ⚠️ Rollback Instructions

If you need to undo these changes:

```sql
UPDATE public.vendors 
SET 
  primary_category_slug = NULL, 
  secondary_categories = '[]'::jsonb
WHERE id IN (
  '8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11',
  'f3a72a11-91b8-4a90-8b82-24b35bfc9801',
  -- ... rest of UUIDs
);
```

---

## 📞 Next Steps

1. **Execute SQL** - Run `VENDOR_CATEGORIES_UPDATE.sql` in Supabase
2. **Verify Categories** - Check vendor count by category
3. **Test Modals** - Test single/multi-category vendor flows
4. **Monitor** - Watch browser console for any validation errors
5. **Update Unknown Vendors** - Once you have company names for vendors 9-17, update the SQL comments

---

## 💡 Additional Resources

- **Vendor Validation System:** `lib/vendors/vendorCategoryValidation.js`
- **RFQ Modal Component:** `components/RFQModal/RFQModal.jsx`
- **Category Definitions:** `lib/constructionCategories.js`
- **Vendor Registration:** `app/vendor-registration/page.js` (has built-in validation)
