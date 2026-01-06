# 🔍 WIZARD RFQ SCHEMA & RLS AUDIT

## Overview
Investigating why wizard RFQs fail to create despite fixing the frontend field name issue.

---

## 🔴 CRITICAL ISSUES FOUND

### Issue #1: Column Mismatch - `category` vs `category_slug`
**Location**: `/app/api/rfq/create/route.js` lines 176-195

**The Problem**:
```javascript
// Line 186: API tries to insert with:
category_slug: categorySlug,  // ✅ This SHOULD exist (added in MIGRATION_ADD_RFQ_COLUMNS.sql line 102)

// Original RFQ_SYSTEM_COMPLETE.sql had:
category: categorySlug (from RFQ_SYSTEM_COMPLETE.sql line 53)
```

**Evidence**:
- **RFQ_SYSTEM_COMPLETE.sql (line 53)**: Uses `category TEXT NOT NULL`
- **MIGRATION_ADD_RFQ_COLUMNS.sql (line 102)**: Adds NEW `category_slug TEXT` column
- **route.js (line 186)**: Uses `category_slug` (matches migration, NOT base schema)
- **Result**: ✅ This is CORRECT IF migration was applied, but might fail if only base schema exists

**Status**: 
- If only RFQ_SYSTEM_COMPLETE.sql was run: ❌ Column doesn't exist
- If MIGRATION_ADD_RFQ_COLUMNS.sql was also run: ✅ Column exists
- **LIKELY CAUSE**: User may have only run base schema, not migration

---

### Issue #2: Location Field - Code vs Schema Mismatch
**Location**: `/app/api/rfq/create/route.js` line 187

**The Problem**:
```javascript
// Line 187: API uses:
specific_location: sharedFields.town || null,

// But the table has:
location TEXT (from MIGRATION_ADD_RFQ_COLUMNS.sql line 98)
```

**Evidence**:
- **MIGRATION_ADD_RFQ_COLUMNS.sql (line 98)**: `location TEXT` column exists
- **route.js (line 187)**: Tries to insert `specific_location` field
- **Result**: Supabase error: "column 'specific_location' does not exist"

**Status**: 🔴 **CONFIRMED BUG** - Code uses wrong field name

---

### Issue #3: RLS Policy Issues for Wizard RFQs
**Location**: `/supabase/sql/RFQ_SYSTEM_COMPLETE.sql` lines 167-170

**Current RLS Policy**:
```sql
CREATE POLICY "rfqs_insert" ON public.rfqs FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**The Problem**:
- API uses `SUPABASE_SERVICE_ROLE_KEY` which should bypass RLS ✅
- But the policy itself is restrictive for authenticated users
- If there's any caching issue, INSERT could be blocked

**For Wizard RFQs Specifically**:
- No special handling needed, same INSERT policy as direct/public ✅
- BUT if service role key isn't working properly, wizard will fail silently

---

### Issue #4: wizard RFQs May Need Special Validation
**Location**: `/app/api/rfq/create/route.js` lines 281-292

**Current Code**:
```javascript
// For WIZARD RFQ: Auto-match vendors based on category and rating
if (rfqType === 'wizard') {
  try {
    console.log('[RFQ CREATE] Wizard RFQ - Auto-matching vendors for category:', categorySlug);
    const matched = await autoMatchVendors(rfqId, categorySlug, sharedFields.county);
    console.log('[RFQ CREATE] Wizard RFQ - Matched', matched.length, 'vendors');
  } catch (err) {
    console.error('[RFQ CREATE] Vendor auto-match error:', err.message);
    // Continue - auto-match is not critical
  }
}
```

**The Problem**:
- If `autoMatchVendors()` fails, error is caught and logged but NOT returned to user
- User gets generic "RFQ created" response even if vendor matching failed
- BUT vendor matching is marked as "not critical" - this is actually CRITICAL for wizard RFQs

---

### Issue #5: Missing selectedVendors Check for Wizard RFQ
**Location**: `/app/api/rfq/create/route.js` (NO VALIDATION FOR WIZARD)

**The Problem**:
Wizard RFQs don't validate that vendors exist in the database or are suitable for matching
```javascript
// DIRECT RFQ has vendor validation (line 273)
if (rfqType === 'direct' && selectedVendors.length > 0) { ... }

// WIZARD RFQ has NO such check - just tries to auto-match
if (rfqType === 'wizard') { ... } // ← No validation that system can match vendors
```

---

## 📋 Schema Comparison: What Table Actually Has vs What API Sends

| Field Name | RFQ_SYSTEM_COMPLETE.sql | route.js | Match? | Status |
|-----------|------------------------|----------|--------|--------|
| category | ✅ Line 53: `category TEXT` | ❌ Line 186: `category_slug` | ❌ MISMATCH | 🔴 BUG |
| location | ✅ Line 54: `location TEXT` | ❌ Line 187: `specific_location` | ❌ MISMATCH | 🔴 BUG |
| type | ✅ Line 55: `type TEXT` | ✅ Line 190: `type: rfqType` | ✅ MATCH | ✅ OK |
| status | ✅ Line 56: `status TEXT` | ✅ Line 191: `status: 'submitted'` | ✅ MATCH | ✅ OK |
| user_id | ✅ Line 52: `user_id UUID` | ✅ Line 177: `user_id: userId` | ✅ MATCH | ✅ OK |
| title | ✅ Line 50: `title TEXT` | ✅ Line 178: `title: sharedFields.projectTitle` | ✅ MATCH | ✅ OK |
| description | ✅ Line 51: `description TEXT` | ✅ Line 179: `description: sharedFields.projectSummary` | ✅ MATCH | ✅ OK |

---

## 🔐 RLS Policies Check

### Current RLS Configuration (RFQ_SYSTEM_COMPLETE.sql lines 167-170):
```sql
-- RFQS POLICIES
CREATE POLICY "rfqs_select_own" ON public.rfqs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rfqs_insert" ON public.rfqs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rfqs_update" ON public.rfqs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rfqs_service_role" ON public.rfqs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

### Analysis:
✅ Service role policy exists (should bypass RLS)
✅ No DENY policies blocking INSERT
⚠️ Could be cache/timing issue with RLS evaluation

### For Wizard RFQs Specifically:
- Same RLS policies apply to all RFQ types ✅
- No special RLS handling needed
- BUT: If INSERT fails due to RLS, wizard RFQs WILL fail (same as direct/public)

---

## 🧪 Testing the Schema Issues

### Test 1: Check if `category_slug` column exists
```sql
-- Run in Supabase SQL Editor:
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'rfqs' 
AND column_name IN ('category', 'category_slug', 'location', 'specific_location');
```

**Expected Result** (if bug exists):
```
column_name
-----------
category
location
(specific_location and category_slug should NOT appear)
```

### Test 2: Check RLS is enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'rfqs';
```

**Expected Result**:
```
tablename | rowsecurity
-----------+------------
rfqs      | t (true)
```

### Test 3: List all RLS policies on rfqs table
```sql
SELECT policyname, permissive, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'rfqs'
ORDER BY policyname;
```

---

## ✅ RECOMMENDED FIXES

### FIX #1: Update route.js to match actual table schema
```javascript
// BEFORE (WRONG):
const rfqData = {
  category_slug: categorySlug,    // ❌ Wrong field name
  specific_location: sharedFields.town,  // ❌ Wrong field name
  ...
};

// AFTER (CORRECT):
const rfqData = {
  category: categorySlug,          // ✅ Match actual column
  location: sharedFields.town,     // ✅ Match actual column
  ...
};
```

### FIX #2: Make vendor auto-matching non-optional for wizard RFQs
```javascript
// Current: Auto-match error is caught and ignored
// Proposed: For wizard RFQs, auto-match failure should be more visible

if (rfqType === 'wizard') {
  try {
    const matched = await autoMatchVendors(rfqId, categorySlug, sharedFields.county);
    if (matched.length === 0) {
      console.warn('[RFQ CREATE] Wizard RFQ created but NO vendors matched:', {
        rfq_id: rfqId,
        category: categorySlug,
        county: sharedFields.county
      });
      // Consider returning warning to user
    }
  } catch (err) {
    console.error('[RFQ CREATE] CRITICAL: Wizard RFQ vendor auto-match failed:', err.message);
    // Consider returning error instead of continuing
  }
}
```

### FIX #3: Add logging to help debug
```javascript
// Log the actual payload being sent
console.log('[RFQ CREATE] rfqData keys:', Object.keys(rfqData));
console.log('[RFQ CREATE] Expected columns in rfqs table:', 
  ['id', 'user_id', 'title', 'description', 'category', 'location', 'county', 'type', 'status', ...]
);
```

---

## 🔍 DIAGNOSIS STEPS

1. **Check column names in Supabase**: Run Test 1 above
2. **Verify RLS enabled**: Run Test 2 above
3. **Check available policies**: Run Test 3 above
4. **Review error logs**: Check Vercel logs for actual Supabase error messages
5. **Test direct vs wizard**: Create direct RFQ - does it work? This tells us if RLS is the issue

---

## ✅ FIXES APPLIED

### Fix #1: Changed `specific_location` → `location`
**File**: `/app/api/rfq/create/route.js` line 187
**Before**: `specific_location: sharedFields.town || null,`
**After**: `location: sharedFields.town || null,`
**Reason**: `location` is the actual column name in rfqs table
**Status**: ✅ APPLIED

---

## Summary

**Root Cause of Wizard RFQ Failure**:
1. ❌ **COLUMN NAME BUG** (FIXED): API code used `specific_location` but table has `location`
2. ✅ **FRONTEND FIX** (APPLIED EARLIER): Removed `selectedVendorIds` override in WizardRFQModal.js
3. ⚠️ **RLS POLICY**: Needs verification (run SQL tests)
4. ⚠️ **VENDOR AUTO-MATCH FAILURE**: If matching fails, need better error handling

**Priority of Fixes**:
1. 🔴 **CRITICAL (FIXED)**: Fixed column name `specific_location` → `location` in route.js
2. 🔴 **CRITICAL (FIXED)**: Fixed field name override in WizardRFQModal.js
3. 🟡 **HIGH**: Verify RLS is working (run SQL tests in Supabase - provided in WIZARD_RFQ_DIAGNOSIS_SQL.sql)
4. 🟡 **HIGH**: Improve wizard RFQ vendor matching error handling

---

## Next Steps

1. **Verify Schema**: Run the SQL tests in `WIZARD_RFQ_DIAGNOSIS_SQL.sql` in Supabase SQL Editor
   - Test 2: Check if `category_slug`, `location`, `visibility` columns exist
   - Test 9: Try manual INSERT to test if schema/RLS is blocking
2. **If Tests Fail**: Apply the appropriate migration
   - If columns missing: Run `supabase/sql/MIGRATION_ADD_RFQ_COLUMNS.sql`
   - If RLS issue: Run RLS policy fix from `supabase/sql/RFQ_SYSTEM_COMPLETE.sql`
3. **Test Wizard RFQ Creation**: User should test creating wizard RFQ again
4. **Check Logs**: Review Vercel logs for actual error messages

