# 🔧 VENDOR MISSING FIELDS - Populate Script Guide

## What This Does

Safely populates NULL/empty vendor fields with intelligent defaults. Only updates 14 specific vendors, only fills empty fields, preserves all existing data.

---

## Key Improvements Over Original

### ✅ What Was Better in Original
- Good category mapping logic
- Location-based county inference
- Realistic default values
- Only updates NULL/empty fields

### ✅ What We Improved
1. **Helper Functions** - Category mapping & county inference are now reusable functions
2. **Dry Run Preview** - See exactly what will change before applying
3. **Backup Creation** - Automatic backup before any updates
4. **Verification Queries** - Multiple checks to ensure integrity
5. **Rollback Instructions** - Easy to undo if needed
6. **Better Organization** - 6 clear steps with comments
7. **Removed Unnecessary Fields** - No gallery, portfolio_images, business_hours, etc. (not core data)
8. **Production Safe** - Ready for real data (uses COALESCE wisely)

---

## How to Use

### Step 1: Review Target Vendors
```sql
-- Copy the verification queries from STEP 0
-- Run them to see what vendors will be updated
-- Check if any are unexpected
```

### Step 2: Back Up Your Data
```sql
-- STEP 1 creates a backup automatically
-- The backup table: vendors_backup_before_missing_fields
-- Contains snapshots of all 14 vendors before any changes
```

### Step 3: Preview Changes
```sql
-- STEP 3 shows "before and after"
-- See exactly what will change for each vendor
-- Review the output - if it looks good, proceed
```

### Step 4: Apply Updates
```sql
-- STEP 4 does the actual UPDATE
-- Takes ~2 seconds
-- Only touches the 14 target vendors
-- Only fills NULL/empty fields
```

### Step 5: Verify Results
```sql
-- STEP 5 shows updated records
-- Validation query checks all critical fields are populated
-- Look for all ✅ marks
```

---

## What Fields Get Populated

| Field | Current | Gets Filled With | Why |
|-------|---------|------------------|-----|
| `user_id` | NULL | vendor.id | Links vendor to auth.users |
| `primary_category_slug` | EMPTY | Mapped from category | Canonical category system |
| `secondary_categories` | NULL | '[]'::jsonb | Default empty array |
| `location` | EMPTY | 'Nairobi' | Safe default (most vendors) |
| `county` | EMPTY | Inferred from location | Geographic data |
| `email` | EMPTY | vendor+{id}@zintra.test | Test/placeholder email |
| `phone` | EMPTY | +254700{random6} | Test/placeholder phone |
| `whatsapp` | EMPTY | Same as phone | WhatsApp contact |
| `description` | EMPTY | Auto-generated from category | Professional description |
| `rating` | NULL | 3.5 - 5.0 (random) | Realistic score |
| `response_time` | EMPTY | 1-8 hours (random) | Realistic value |
| `website` | EMPTY | https://zintra.../vendor/{id} | Profile URL |

---

## Fields NOT Changed

These are preserved if already filled, or left NULL if empty:
- `company_name` - Never changed
- `category` - Left for reference (primary_category_slug takes precedence)
- `verified` - Not auto-filled
- `status` - Not auto-filled
- `logo_url`, `banner_url` - Not added by this script
- `certifications` - Not added by this script
- Gallery, portfolio_images, business_hours - Not touched

**Why?** These require manual verification or user input.

---

## Rollback (If Needed)

If something goes wrong:

```sql
-- Option 1: Restore from backup (clean)
DELETE FROM vendors 
WHERE id IN (list of 14 vendor IDs);

INSERT INTO vendors 
SELECT * FROM vendors_backup_before_missing_fields;

-- Option 2: Manual review
SELECT * FROM vendors_backup_before_missing_fields
WHERE id = 'vendor-id-here';
-- Then compare with current vendors table
```

---

## Execution Flow

```
┌─────────────────────────────────────────────────────────┐
│ STEP 0: VERIFY (Check-only)                             │
│ - Show target vendors                                   │
│ - Count missing fields by type                          │
│ - Identify which vendors need updates                   │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 1: BACKUP (Safety First)                           │
│ - Create vendors_backup_before_missing_fields          │
│ - Snapshot current state                                │
│ - Enable rollback if needed                             │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: CREATE FUNCTIONS (Reusable Logic)              │
│ - map_category_to_slug()                               │
│ - infer_county_from_location()                         │
│ - Makes code DRY and testable                          │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: PREVIEW (Dry Run - See Changes)                │
│ - Show before/after for each field                      │
│ - No data modified yet                                  │
│ - Review output before committing                       │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼ (If preview looks good, continue)
┌─────────────────────────────────────────────────────────┐
│ STEP 4: UPDATE (Apply Changes)                          │
│ - Run the main UPDATE query                             │
│ - Fill NULL/empty fields only                           │
│ - Preserve existing data                                │
│ - ~2 seconds total                                      │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 5: VERIFY (Post-Update Check)                      │
│ - Show updated records                                  │
│ - Validate all critical fields are populated            │
│ - Check for ❌ marks (issues)                           │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
             DONE ✅
```

---

## Key Features

### 🔒 Safety
- ✅ Whitelist approach (only 14 vendors)
- ✅ Automatic backup created
- ✅ Only fills NULL/empty (never overwrites)
- ✅ Easy rollback instructions
- ✅ Verification queries included

### 📊 Intelligence
- ✅ Category mapping uses CASE/WHEN
- ✅ County inference from location text
- ✅ Realistic default ratings (3.5-5.0)
- ✅ Response times varied (1-8 hours)
- ✅ Email/phone use vendor ID (unique)

### 📝 Transparency
- ✅ Step-by-step comments
- ✅ Preview before applying
- ✅ Before/after comparison
- ✅ Validation output
- ✅ Clear status indicators (✅ / ❌)

### 🛠️ Maintainability
- ✅ Reusable functions
- ✅ Well-organized code
- ✅ Easy to extend for more vendors
- ✅ Clear naming conventions
- ✅ Production-ready structure

---

## Important Notes

### Email & Phone Values

Filled with **test/placeholder values**:
- Email: `vendor+{uuid_first_8_chars}@zintra.test`
- Phone: `+254700{random_6_digits}`

**These should be replaced with real data when vendors verify their details.**

### Category Mapping

Uses intelligent logic to map text categories to canonical slugs:
- "Plumber" → `plumbing_drainage`
- "Painter" → `painting_decorating`
- "Electrician" → `electrical_solar`
- etc.

**If mapping is wrong for a vendor**, update `primary_category_slug` manually after script runs.

### County Inference

Looks for city names in location field:
- "Thika area" → County: `Kiambu`
- "Nairobi CBD" → County: `Nairobi`
- Unknown → Defaults to `Nairobi`

**If inference is wrong**, update `county` manually after script runs.

---

## Execution Time

| Step | Duration | Notes |
|------|----------|-------|
| STEP 0 (Verify) | ~1s | Check-only, read queries |
| STEP 1 (Backup) | ~1s | Creates snapshot |
| STEP 2 (Functions) | ~1s | Creates helper functions |
| STEP 3 (Preview) | ~1s | Dry run, shows changes |
| STEP 4 (Update) | ~2s | Actual UPDATE query |
| STEP 5 (Verify) | ~1s | Post-update checks |
| **TOTAL** | **~7s** | Very fast |

---

## Success Criteria

After running, you should see:
```
✅ All 14 vendors have user_id
✅ All 14 vendors have primary_category_slug
✅ All 14 vendors have email
✅ All 14 vendors have phone
✅ All 14 vendors have location
✅ All 14 vendors have county
✅ All vendors show in STEP 5 validation query
❌ ZERO validation errors in STEP 5
```

---

## Next Steps After This Script

1. **Review manually** - Check each vendor's data looks reasonable
2. **Upload real contact info** - Replace test phone/email with real ones
3. **Add logo/banner** - Vendors need images for professional look
4. **Verify certifications** - Add real certifications if applicable
5. **Test in app** - Ensure vendor profiles display correctly

---

## Questions?

**Q: Can I run this multiple times?**  
A: Yes! It uses `COALESCE`, so running twice is safe (second run does nothing).

**Q: Will this overwrite my data?**  
A: No! It only fills NULL/empty fields. Existing data is preserved.

**Q: Can I add more vendors?**  
A: Yes! Just add their IDs to the WHERE clauses in all steps.

**Q: What if category mapping is wrong?**  
A: Fix it manually after. Or update the `map_category_to_slug()` function.

---

## Comparison: Before & After

### BEFORE
```
Vendor: BrightBuild Contractors
├── user_id: NULL ❌
├── email: NULL ❌
├── phone: NULL ❌
├── primary_category_slug: NULL ❌
├── county: NULL ❌
└── description: NULL ❌
```

### AFTER
```
Vendor: BrightBuild Contractors
├── user_id: f3a72a11-91b8-4a90-8b82-24b35bfc9801 ✅
├── email: vendor+f3a72a11@zintra.test ✅
├── phone: +254700453892 ✅
├── primary_category_slug: building_masonry ✅
├── county: Nairobi ✅
└── description: Professional building services... ✅
```

---

**Status: Ready to Run** ✅  
**Risk Level: MINIMAL** (Backup included, only fills NULL)  
**Time to Execute: ~7 seconds**

Ready to proceed? Follow the steps in `VENDOR_MISSING_FIELDS_POPULATE.sql`!

