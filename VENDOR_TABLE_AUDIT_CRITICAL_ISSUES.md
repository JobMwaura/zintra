# 🔍 Vendor Table Data Audit - Issues Found

**Date:** 8 January 2026  
**Status:** ⚠️ CRITICAL ISSUES IDENTIFIED

---

## Major Issues Found

### ❌ Issue 1: CRITICAL - Wrong Category Slugs in `primary_category_slug`

**Problem:** Multiple vendors have WRONG primary category slugs that don't match the canonical system.

**Examples:**
```
Mwanainchi Electricians
  Canonical: electrical_solar
  Database: "plumber" ❌ WRONG

Jembe Plumbing
  Canonical: plumbing_drainage
  Database: "plumber" ❌ WRONG

Karibu Supplies Ltd
  Canonical: building_masonry (or similar)
  Database: "plumber" ❌ WRONG

BrightBuild Contractors
  Canonical: building_masonry
  Database: "general_contractor" ⚠️ CLOSE but should be canonical

EcoSmart Landscapes
  Canonical: landscaping_outdoor
  Database: "landscaper" ❌ WRONG (not canonical)

PaintPro Interiors
  Canonical: painting_decorating
  Database: "painter" ❌ WRONG (not canonical)

AquaTech Borehole Services
  Canonical: plumbing_drainage (or special_structures)
  Database: "plumber" ❌ WRONG

Royal Glass & Aluminum
  Canonical: doors_windows_glass
  Database: "hardware_store" ❌ WRONG

SolarOne Energy
  Canonical: electrical_solar
  Database: "solar_installer" ❌ WRONG (not canonical)

SteelPro Fabricators
  Canonical: special_structures
  Database: "welder" ❌ WRONG

Timber Masters
  Canonical: carpentry_joinery
  Database: "carpenter" ❌ WRONG
```

### ❌ Issue 2: CRITICAL - Secondary Categories Are All "equipment_rental"

**Problem:** Every single vendor has `secondary_categories: ["equipment_rental"]`

**This is WRONG because:**
1. `equipment_rental` is NOT a canonical category slug
2. Canonical slug is `equipment_hire` (not `equipment_rental`)
3. No vendor should have identical secondary categories
4. These should be diverse based on actual vendor services

**Examples:**
```
ALL vendors show: ["equipment_rental"] ❌

Should be varied:
- Electricians: ["electrical_solar", "hvac_climate"]
- Plumbers: ["plumbing_drainage", "hvac_climate"]
- Contractors: ["project_management_qs", "carpentry_joinery"]
- etc.
```

### ❌ Issue 3: Missing/Inconsistent Data

**Missing Fields (should have values):**
- `user_id` - Most vendors have empty/null user_id
- `email` - Should be required, some are empty
- `category` - Old field, should be deprecated but some are inconsistent
- `phone` - Should be required
- `phone_verified` - Should be true for active vendors

**Inconsistent Examples:**
```
Mwanainchi Electricians
  user_id: (empty) ❌
  email: (empty) ❌
  phone: (empty) ❌

Test Vendor Company
  user_id: f089b49d-77e3-4549-b76d-4568d6cc4f94 ✅ (has it!)
  company_name: "Test Vendor Company" (test data?)
  category: "general-contractor" (old format)
```

### ⚠️ Issue 4: Overlapping Old and New Category Systems

**The table has BOTH:**
- Old slugs: "plumber", "general_contractor", "painter", "carpenter", etc.
- New canonical slugs: Should be "plumbing_drainage", "building_masonry", etc.

**Currently mixed:**
```
primary_category_slug column contains:
- Some old format: "plumber", "painter", "welder"
- Some canonical: "general_contractor" (close to canonical)
- Some missing: should all be canonical

category column contains:
- Old text values: "Electrical & Lighting", "Plumbing & Sanitation"
- This is the OLD system!
```

### ⚠️ Issue 5: Data Quality Issues

**Plan Column Issues:**
```
Most vendors: plan: "premium" (but subscription_plan: "Free")
  - This is contradictory!
  
Should be:
  - plan: "free", "basic", "premium", or "diamond"
  - subscription_plan: Should be same
  - Currently conflicting values
```

**Status Issues:**
```
Most: status: "active" ✅
One: status: "suspended" (Karibu Supplies) ⚠️
  - Should be monitored

approval_issues:
- approved: mostly false (f)
- is_approved: mostly false (f)
- These should be in sync
```

**Empty/Dummy Data:**
```
Test Vendor Company (f089b49d-77e3-4549-b76d-4568d6cc4f94)
  - Appears to be test data
  - Still in production database
  - Should be removed or marked as test
```

---

## Root Cause Analysis

### Why This Happened

1. **Migration from Old System**
   - Old system used slugs: "plumber", "painter", "carpenter"
   - New canonical system uses: "plumbing_drainage", "painting_decorating", "carpentry_joinery"
   - Database was never migrated from old to new

2. **Incomplete Migration**
   - Only NEW signups get canonical slugs
   - Old vendor records still have old slugs
   - Mixing of both systems in same table

3. **Batch Secondary Category Issue**
   - Someone set ALL secondary_categories to `["equipment_rental"]`
   - Didn't use canonical slug `equipment_hire`
   - Mass update went wrong

4. **Duplicate Column Issue**
   - Old `category` column (text) still has old values
   - New `primary_category_slug` column has old slugs
   - Should only use `primary_category_slug`

---

## Impact Assessment

### Critical (Must Fix)
- ❌ Primary category slugs are mostly WRONG (old format)
- ❌ Secondary categories all point to non-canonical `equipment_rental`
- ❌ Vendor lookups by category will fail

### High (Should Fix)
- ⚠️ Missing user_id for most vendors
- ⚠️ Missing email for some vendors
- ⚠️ Inconsistent plan vs subscription_plan

### Medium (Can Fix Later)
- ⚠️ Test data still in production
- ⚠️ Old category column still in use
- ⚠️ Some vendors marked suspended

---

## Migration Plan

### Step 1: Map Old Slugs to New Canonical Slugs

```
Old Slug → New Canonical Slug
plumber → plumbing_drainage
painter → painting_decorating
carpenter → carpentry_joinery
welder → special_structures
hardware_store → doors_windows_glass
general_contractor → building_masonry
landscaper → landscaping_outdoor
electrician → electrical_solar
solar_installer → electrical_solar
```

### Step 2: Fix Primary Category Slugs

```sql
-- Example migrations:
UPDATE vendors 
SET primary_category_slug = 'plumbing_drainage'
WHERE primary_category_slug = 'plumber'
  AND (company_name = 'Jembe Plumbing' OR company_name = 'Franshoek Plumbers');

UPDATE vendors 
SET primary_category_slug = 'painting_decorating'
WHERE primary_category_slug = 'painter';

UPDATE vendors 
SET primary_category_slug = 'carpentry_joinery'
WHERE primary_category_slug = 'carpenter';

-- ... etc for all mappings
```

### Step 3: Fix Secondary Categories

```sql
-- Remove non-canonical "equipment_rental"
UPDATE vendors
SET secondary_categories = NULL
WHERE secondary_categories = '["equipment_rental"]'::jsonb
  OR secondary_categories LIKE '%equipment_rental%';

-- Then manually set appropriate secondary categories per vendor
UPDATE vendors 
SET secondary_categories = '["project_management_qs"]'::jsonb
WHERE primary_category_slug = 'building_masonry';

-- ... etc
```

### Step 4: Validate Canonical Categories

```sql
-- Check all primary_category_slug values are canonical
SELECT DISTINCT primary_category_slug, COUNT(*) 
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
GROUP BY primary_category_slug;

-- Should return 0 rows if all are canonical
```

### Step 5: Clean Up Old Data

```sql
-- Remove test vendor
DELETE FROM vendors 
WHERE company_name = 'Test Vendor Company'
  AND id = 'f089b49d-77e3-4549-b76d-4568d6cc4f94';

-- Populate missing user_id if possible
-- (requires linking to auth users by email)

-- Validate all required fields are present
SELECT id, company_name, email, phone, primary_category_slug 
FROM vendors 
WHERE email IS NULL 
  OR email = ''
  OR phone IS NULL
  OR phone = '';
```

---

## Quick Fixes Needed

### URGENT - Fix Secondary Categories
All vendors wrongly have `["equipment_rental"]` which doesn't exist in canonical system. This breaks:
- Category filtering
- RFQ matching
- Vendor search

### HIGH - Fix Primary Category Slugs
Most vendors have old slug format. Need to update to canonical format.

### MEDIUM - Add Missing user_id
Most vendors missing user_id link to auth users.

---

## Verification Checklist

After migration, verify:
- [ ] All primary_category_slug values are in 20 canonical categories
- [ ] No vendor has non-canonical secondary categories
- [ ] No "equipment_rental" appears in any database (should be "equipment_hire")
- [ ] Test vendor removed
- [ ] All active vendors have valid email + phone
- [ ] Plan and subscription_plan are consistent
- [ ] Vendor filters work by category
- [ ] RFQ matching works correctly

---

## Affected Components

When you fix these issues, ensure to:
1. **Vendor search/filter** - Will now show correct categories
2. **RFQ matching** - Will match vendors by correct categories
3. **Category pages** - Will show correct vendors
4. **Vendor profiles** - Will display correct category info
5. **API endpoints** - Filter by category will work properly

---

## Summary

**Critical Issues:** 3 (category slugs wrong, secondary categories wrong, data missing)  
**High Issues:** 3 (user_id, email, plan consistency)  
**Medium Issues:** 3 (test data, old columns, status)  

**Action Required:** Yes, database migration needed  
**Urgency:** HIGH (category system broken)  
**Estimated Effort:** 1-2 hours  

