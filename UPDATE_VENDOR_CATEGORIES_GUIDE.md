# 🔧 Update Vendor Categories for Testing RFQ Modals

## Quick Start

### Step 1: Go to Supabase Dashboard
1. Visit: https://app.supabase.com
2. Select your Zintra project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Choose Your Approach

Copy one of the options from `SUPABASE_UPDATE_VENDOR_CATEGORIES.sql`:

#### **Option 1: Smart Auto-Detection (RECOMMENDED)** ✅
Uses keywords in vendor company names to assign categories intelligently.

**What it does:**
- Looks for "electric" in company name → assigns to `electrician`
- Looks for "plumb" in company name → assigns to `plumber`
- Looks for "paint" in company name → assigns to `painter`
- And so on for all 22 categories
- Any remaining vendors get `other`

**Best for:** Testing with realistic vendor data

#### **Option 2: Manual by Vendor ID**
Manually set a specific vendor to a specific category.

**Example:**
```sql
UPDATE vendors
SET primaryCategorySlug = 'electrician'
WHERE id = 'some-vendor-id-here';
```

**Best for:** Updating one or two specific vendors

#### **Option 3: Test Distribution**
Assigns each vendor to a different category for comprehensive testing.

**What it does:**
- Vendor 1 → `electrician`
- Vendor 2 → `plumber`
- Vendor 3 → `carpenter`
- Vendor 4 → `mason`
- Vendor 5 → `painter`
- Vendor 6 → `general_contractor`

**Best for:** Testing all categories systematically

## Step-by-Step Instructions

### Using Option 1 (Smart Auto-Detection)

1. **View current state** - Run this first to see what you have:
```sql
SELECT 
  id,
  company_name,
  primaryCategorySlug,
  secondaryCategories,
  county,
  created_at
FROM vendors
ORDER BY created_at DESC;
```

2. **Run the update script** - Copy and paste Option 2 from the SQL file (lines 28-95)

3. **Verify results** - Run the verification queries:
```sql
-- Count vendors by category
SELECT 
  primaryCategorySlug,
  COUNT(*) as vendor_count
FROM vendors
WHERE primaryCategorySlug IS NOT NULL
GROUP BY primaryCategorySlug
ORDER BY vendor_count DESC;

-- List all vendors with their categories
SELECT 
  id,
  company_name,
  primaryCategorySlug,
  county
FROM vendors
ORDER BY primaryCategorySlug, company_name;
```

## Testing the RFQ Modals

Once vendors have categories, test like this:

### Test 1: Single-Category Vendor
1. Find a vendor with only `primaryCategorySlug` set (no `secondaryCategories`)
2. Click "Request Quote" on their profile
3. **Expected:** Modal should skip category selection, show vendor name, go straight to form

**Example vendor to find:**
```sql
SELECT * FROM vendors 
WHERE primaryCategorySlug IS NOT NULL 
AND (secondaryCategories IS NULL OR array_length(secondaryCategories, 1) = 0)
LIMIT 1;
```

### Test 2: Multi-Category Vendor
1. Find a vendor with multiple categories
2. Click "Request Quote" on their profile
3. **Expected:** Modal shows category picker with only vendor's categories
4. Select a category
5. **Expected:** Form updates with category-specific fields

**Example vendor to find:**
```sql
SELECT * FROM vendors 
WHERE secondaryCategories IS NOT NULL 
AND array_length(secondaryCategories, 1) > 0
LIMIT 1;
```

### Test 3: All 22 Categories
1. For each of the 22 categories, find a vendor
2. Click "Request Quote"
3. **Expected:** Different form fields for each category

**Find sample vendors for all categories:**
```sql
SELECT DISTINCT primaryCategorySlug, COUNT(*) as count
FROM vendors
WHERE primaryCategorySlug IS NOT NULL
GROUP BY primaryCategorySlug
ORDER BY primaryCategorySlug;
```

## The 22 Categories Explained

| Slug | Label | Sample Keywords |
|------|-------|-----------------|
| general_contractor | General Contractor | contractor, construction, build |
| architect | Architect | architect, design |
| engineer | Structural Engineer | engineer, structural |
| quantity_surveyor | Quantity Surveyor | surveyor, quantity |
| interior_designer | Interior Designer | interior, designer |
| electrician | Electrician | electric, electrical |
| plumber | Plumber | plumb, water |
| carpenter | Carpenter | carpenter, wood, timber |
| mason | Mason/Bricklayer | mason, brick, stone |
| painter | Painter & Decorator | paint, decorator |
| tiler | Tiler | tile, tiling |
| roofer | Roofer | roof, roofing |
| welder | Welder/Metal Fabricator | weld, metal, fabricate |
| landscaper | Landscaper | landscape, garden, lawn |
| solar_installer | Solar Installer | solar, photovoltaic |
| hvac_technician | HVAC Technician | hvac, air condition, cooling |
| waterproofing | Waterproofing Specialist | waterproof, waterproofing |
| security_installer | Security System Installer | security, alarm |
| materials_supplier | Building Materials Supplier | supplier, materials |
| equipment_rental | Equipment Rental | rental, hire, equipment |
| hardware_store | Hardware Store | hardware, store |
| other | Other | (fallback for unmatched) |

## Sample SQL Queries for Testing

### Find vendors by category
```sql
SELECT * FROM vendors 
WHERE primaryCategorySlug = 'electrician'
LIMIT 5;
```

### Find vendors without a category (edge case)
```sql
SELECT * FROM vendors 
WHERE primaryCategorySlug IS NULL;
```

### Find vendors with secondary categories
```sql
SELECT 
  id,
  company_name,
  primaryCategorySlug,
  secondaryCategories,
  array_length(secondaryCategories, 1) as secondary_count
FROM vendors 
WHERE secondaryCategories IS NOT NULL 
AND array_length(secondaryCategories, 1) > 0
ORDER BY secondary_count DESC;
```

### Count vendors per category
```sql
SELECT 
  primaryCategorySlug,
  COUNT(*) as count
FROM vendors
GROUP BY primaryCategorySlug
ORDER BY count DESC, primaryCategorySlug;
```

## Rollback Instructions

If you need to revert the changes:

```sql
-- Reset all vendors' primary categories to NULL
UPDATE vendors
SET primaryCategorySlug = NULL;

-- Or reset just specific ones
UPDATE vendors
SET primaryCategorySlug = NULL
WHERE primaryCategorySlug = 'electrician';
```

## Troubleshooting

### No vendors being updated
```sql
-- Check if vendors table is empty
SELECT COUNT(*) FROM vendors;

-- Check if primaryCategorySlug column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'vendors' AND column_name = 'primaryCategorySlug';
```

### Update command not executing
- Make sure you have write permissions on the vendors table
- Check that the SQL syntax is correct (no missing semicolons)
- Verify column names match exactly (including case sensitivity)

### Seeing duplicate categories
```sql
-- This is normal! Each vendor can have one primary category
-- If you see a vendor listed multiple times, you may have a data issue
SELECT primaryCategorySlug, COUNT(*) 
FROM vendors 
GROUP BY primaryCategorySlug
HAVING COUNT(*) > 1;
```

## Next Steps

After updating vendor categories:

1. ✅ Visit vendor profile pages
2. ✅ Click "Request Quote"
3. ✅ Verify smart category selection works
   - Single category → skip picker
   - Multiple categories → show filtered picker
4. ✅ Test each category has correct form fields
5. ✅ Submit test RFQs for each category

## File Reference

- **SQL Script:** `SUPABASE_UPDATE_VENDOR_CATEGORIES.sql`
- **Validation Guide:** `VENDOR_CATEGORY_VALIDATION.md`
- **RFQ Modal Guide:** `RFQ_SMART_CATEGORY_SELECTION_COMPLETE.md`

---

**Created:** January 5, 2026
**Status:** ✅ READY TO USE
