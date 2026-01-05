# 🚀 Quick Reference: Update Vendor Categories

## TL;DR - 30 Seconds

1. Go to **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Copy the smart auto-detection script from `SUPABASE_UPDATE_VENDOR_CATEGORIES.sql` (lines 28-95)
3. Paste and click **Run**
4. ✅ Done! All vendors now have categories

## The 4 Options in the SQL File

### 🤖 Option 1: Smart Auto-Detection (BEST FOR TESTING)
```sql
-- Automatically assigns categories based on company name keywords
-- "ABC Electric" → electrician
-- "XYZ Plumbing" → plumber
-- "John Carpentry" → carpenter
```
**Use when:** You want realistic test data quickly

### 📝 Option 2: Manual by Vendor ID
```sql
UPDATE vendors
SET primaryCategorySlug = 'electrician'
WHERE id = 'VENDOR_ID_HERE';
```
**Use when:** You want to update specific vendors

### 🧪 Option 3: Test Distribution
```sql
-- Vendor 1 → electrician
-- Vendor 2 → plumber
-- Vendor 3 → carpenter
-- Vendor 4 → mason
-- ... etc for 6 vendors across different categories
```
**Use when:** You want to test all categories systematically

### 🔄 Option 4: Complete Override
```sql
-- Resets all vendors and assigns them to test categories
```
**Use when:** Starting from scratch

## The 22 Categories

```
1. general_contractor       12. roofer
2. architect                13. welder
3. engineer                 14. landscaper
4. quantity_surveyor        15. solar_installer
5. interior_designer        16. hvac_technician
6. electrician              17. waterproofing
7. plumber                  18. security_installer
8. carpenter                19. materials_supplier
9. mason                    20. equipment_rental
10. painter                 21. hardware_store
11. tiler                   22. other
```

## Verify It Worked

Run these to check:

```sql
-- Count vendors by category
SELECT primaryCategorySlug, COUNT(*) as count
FROM vendors
GROUP BY primaryCategorySlug
ORDER BY count DESC;

-- List all vendors with their categories
SELECT company_name, primaryCategorySlug
FROM vendors
ORDER BY primaryCategorySlug;
```

## Test the RFQ Modals

### Single-Category Vendor
- Click "Request Quote"
- ✅ Should skip category picker
- ✅ Should show vendor name in header
- ✅ Should go straight to form

### Multi-Category Vendor
- Click "Request Quote"
- ✅ Should show category picker (Step 1)
- ✅ Only vendor's categories shown
- ✅ After picking category, form updates with that category's fields

## Rollback

```sql
-- Reset all to NULL
UPDATE vendors SET primaryCategorySlug = NULL;

-- Or specific category
UPDATE vendors SET primaryCategorySlug = NULL
WHERE primaryCategorySlug = 'electrician';
```

## Related Files

- `SUPABASE_UPDATE_VENDOR_CATEGORIES.sql` - Full SQL with all 4 options
- `UPDATE_VENDOR_CATEGORIES_GUIDE.md` - Detailed instructions
- `VENDOR_CATEGORY_VALIDATION.md` - Category validation system
- `RFQ_SMART_CATEGORY_SELECTION_COMPLETE.md` - How the RFQ modal works

---

**Status:** ✅ Ready to test with real data
**Updated:** January 5, 2026
