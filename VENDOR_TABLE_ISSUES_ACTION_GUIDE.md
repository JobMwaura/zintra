# 🚨 CRITICAL: Vendor Table Database Issues Found

## Issues Summary

Your vendor table has **CRITICAL ISSUES** that break the category system:

### ❌ Issue 1: Wrong Category Slugs
- Vendors have OLD slugs like `"plumber"` instead of canonical `"plumbing_drainage"`
- Affects: Every vendor's primary category
- Impact: Category filtering, RFQ matching, vendor search all broken

### ❌ Issue 2: Wrong Secondary Categories  
- Every vendor has `["equipment_rental"]` which doesn't exist
- Should be canonical slug: `["equipment_hire"]`
- Impact: Secondary category filtering broken

### ❌ Issue 3: Missing Data
- Most vendors missing `user_id`
- Some vendors missing `email`
- Impact: Vendor-user relationship broken

### ❌ Issue 4: Test Data
- "Test Vendor Company" still in production
- Should be removed

---

## What You Need To Do

### Step 1: Review the Audit
Read: `VENDOR_TABLE_AUDIT_CRITICAL_ISSUES.md`
- See detailed analysis of every issue
- Understand impact on system

### Step 2: Run Migration
Open **Supabase SQL Editor** and run `VENDOR_TABLE_MIGRATION.sql`:
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Click "New Query"
4. Copy entire contents of `VENDOR_TABLE_MIGRATION.sql`
5. Run it

**The migration will:**
- Create backup table (safe!)
- Fix all primary category slugs
- Fix all secondary categories
- Remove test data
- Verify all changes

### Step 3: Verify Results
After migration runs, check the verification queries show:
- ✅ All primary_category_slug are canonical (20 valid values)
- ✅ No vendor has "equipment_rental" in secondary_categories
- ✅ Test vendor is gone

### Step 4: Test in App
After migration:
1. Try vendor search by category
2. Try filtering vendors by category
3. Try creating RFQ - should match vendors correctly
4. Try vendor profile - should show correct category

---

## Migration Details

**File:** `VENDOR_TABLE_MIGRATION.sql`  
**Backup Created:** `vendors_backup_2026_01_08` (if needed to rollback)  
**Duration:** < 1 minute  
**Risk:** LOW (has backup)  
**Breaking Changes:** No (only fixes data)

---

## After Migration Checklist

- [ ] Run migration script in Supabase SQL Editor
- [ ] Verify: All primary_category_slug are canonical
- [ ] Verify: No "equipment_rental" in database
- [ ] Verify: Test vendor removed
- [ ] Test: Vendor search by category works
- [ ] Test: RFQ matching works
- [ ] Test: Vendor profiles show correct category
- [ ] Restart application (if needed)

---

## Rollback (If Needed)

If something goes wrong:
```sql
DROP TABLE vendors;
ALTER TABLE vendors_backup_2026_01_08 RENAME TO vendors;
```

Then run migration again or contact support.

---

## Categories That Are Wrong

### Primary Categories (Examples)
```
OLD → NEW
plumber → plumbing_drainage
painter → painting_decorating
carpenter → carpentry_joinery
welder → special_structures
hardware_store → doors_windows_glass
landscaper → landscaping_outdoor
solar_installer → electrical_solar
```

### Secondary Categories
```
WRONG: ["equipment_rental"]
CORRECT: ["equipment_hire"] (canonical)
```

---

## Files You Need

1. **`VENDOR_TABLE_AUDIT_CRITICAL_ISSUES.md`**
   - Full analysis of all issues
   - Migration plan
   - Verification steps

2. **`VENDOR_TABLE_MIGRATION.sql`**
   - SQL script to fix everything
   - Run in Supabase SQL Editor

---

## Status

**Urgency:** 🔴 CRITICAL  
**Impact:** Category system broken  
**Time to Fix:** ~5 minutes  
**Effort:** LOW (just run SQL script)

---

**ACTION:** Run the migration ASAP to fix vendor categories!

