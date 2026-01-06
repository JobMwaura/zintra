# 🔍 WIZARD RFQ SCHEMA & RLS AUDIT - COMPLETE FINDINGS

**Date**: January 6, 2026  
**Status**: 🟡 SCHEMA FIXES APPLIED, RLS VERIFICATION REQUIRED  
**Commit**: `69885a4` - Schema column name fixes applied

---

## 📋 EXECUTIVE SUMMARY

**What We Audited**:
- Supabase rfqs table schema
- RLS policies for wizard RFQ support
- API code field name mappings
- Data flow from frontend → API → database

**What We Found**:
1. ✅ Frontend field name bug: FIXED (selectedVendorIds override removed)
2. ✅ API schema mismatch: FIXED (specific_location → location)
3. ⚠️ RLS policies: Need verification
4. ⚠️ Vendor auto-matching: Need error visibility

**Status**: 2 critical bugs fixed, 2 areas need verification

---

## 🔴 ISSUES FOUND & FIXED

### BUG #1: WizardRFQModal sending wrong field (FIXED)
**Status**: ✅ FIXED in previous commit

**File**: `/components/WizardRFQModal.js`  
**Line**: 169 (original)

**The Problem**:
```javascript
// BEFORE (WRONG):
body: JSON.stringify({
  ...formData,                  // Already includes selectedVendors
  selectedVendorIds: selectedVendors,  // ❌ Wrong field name - OVERRIDE!
  guestPhone: guestPhone,
  guestPhoneVerified: guestPhoneVerified,
})

// AFTER (CORRECT):
body: JSON.stringify({
  ...formData,  // ✅ selectedVendors from context automatically included
  guestPhone: guestPhone,
  guestPhoneVerified: guestPhoneVerified,
})
```

**Root Cause**: Field name mismatch between component and API expectation  
**Impact**: API never received vendor data, RFQ creation failed  
**Fix Applied**: Removed the incorrect `selectedVendorIds` override  
**Commit**: Earlier (previous session)

---

### BUG #2: API using wrong column name for location (FIXED)
**Status**: ✅ FIXED in commit 69885a4

**File**: `/app/api/rfq/create/route.js`  
**Line**: 187

**The Problem**:
```javascript
// BEFORE (WRONG):
const rfqData = {
  category_slug: categorySlug,        // ✅ Correct
  specific_location: sharedFields.town,  // ❌ Wrong column name!
  county: sharedFields.county,        // ✅ Correct
  ...
};

// AFTER (CORRECT):
const rfqData = {
  category_slug: categorySlug,        // ✅ Correct
  location: sharedFields.town,        // ✅ Fixed to match actual column
  county: sharedFields.county,        // ✅ Correct
  ...
};
```

**Root Cause**: 
- Migration MIGRATION_ADD_RFQ_COLUMNS.sql added `location` column
- Code was using `specific_location` which doesn't exist
- This caused Supabase INSERT to fail with "column not found" error

**Impact**: All wizard RFQs failed at database insertion step  
**Evidence**:
- MIGRATION_ADD_RFQ_COLUMNS.sql line 98: `ADD COLUMN IF NOT EXISTS location TEXT`
- route.js line 187 was using `specific_location` (doesn't exist)
- Supabase would return: `column "specific_location" does not exist`

**Fix Applied**: Changed `specific_location` → `location`  
**Commit**: `69885a4`

---

## ⚠️ ISSUES IDENTIFIED (Need Verification)

### ISSUE #3: RLS Policies Need Verification
**Status**: ⚠️ NEEDS VERIFICATION

**Concern**: Are RLS policies properly allowing service role to bypass RLS?

**Current Policy** (RFQ_SYSTEM_COMPLETE.sql):
```sql
CREATE POLICY "rfqs_insert" ON public.rfqs 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rfqs_service_role" ON public.rfqs 
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

**Why This Matters**:
- API uses `SUPABASE_SERVICE_ROLE_KEY` which should bypass RLS
- But if the policy is misconfigured, INSERT could still fail
- User would get generic "Failed to create RFQ" error

**How to Verify**: Run tests in `WIZARD_RFQ_DIAGNOSIS_SQL.sql`
- Test 3: Check if RLS is enabled
- Test 4: List all policies
- Test 5: Verify service role policy exists
- Test 9: Manual INSERT test

---

### ISSUE #4: Vendor Auto-Matching Failure Handling
**Status**: ⚠️ INCOMPLETE ERROR HANDLING

**Location**: `/app/api/rfq/create/route.js` lines 281-292

**Current Code**:
```javascript
if (rfqType === 'wizard') {
  try {
    const matched = await autoMatchVendors(rfqId, categorySlug, sharedFields.county);
    console.log('[RFQ CREATE] Wizard RFQ - Matched', matched.length, 'vendors');
  } catch (err) {
    console.error('[RFQ CREATE] Vendor auto-match error:', err.message);
    // ⚠️ Continue - auto-match is not critical
  }
}
```

**The Problem**:
- If vendor auto-matching fails, error is logged but NOT reported to user
- User sees success message but no vendors were actually matched
- For wizard RFQs, matching is CRITICAL (not optional)

**Why This Matters for Wizard RFQs**:
- Wizard RFQ = auto-matching only (no vendor selection)
- If auto-match fails, RFQ has NO VENDORS
- RFQ is created but completely useless
- User doesn't know anything went wrong

**Recommended Fix**:
```javascript
if (rfqType === 'wizard') {
  try {
    const matched = await autoMatchVendors(rfqId, categorySlug, sharedFields.county);
    if (matched.length === 0) {
      console.warn('[RFQ CREATE] WARNING: Wizard RFQ created but NO vendors matched');
      // Could return warning in response
    }
  } catch (err) {
    console.error('[RFQ CREATE] CRITICAL: Wizard RFQ auto-match failed:', err.message);
    // For wizard, maybe this should be a failure instead of continuing
  }
}
```

---

## 📊 SCHEMA VERIFICATION CHECKLIST

**Run these tests in Supabase SQL Editor to verify the fix worked**:

### Test 1: Column Existence
```sql
SELECT 
  'location' as field,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfqs' AND column_name = 'location'
  ) THEN 'EXISTS ✅' ELSE 'MISSING ❌' END as status;
```

**Expected**: `EXISTS ✅`

### Test 2: RLS Enabled
```sql
SELECT rowsecurity 
FROM pg_tables
WHERE tablename = 'rfqs';
```

**Expected**: `t` (true)

### Test 3: Service Role Policy Exists
```sql
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'rfqs' 
  AND policyname LIKE '%service_role%';
```

**Expected**: `>= 1`

### Test 4: Manual Wizard RFQ Insert
```sql
INSERT INTO public.rfqs (
  user_id,
  title,
  description,
  type,
  category_slug,
  location,
  county,
  status,
  budget_min,
  budget_max
) VALUES (
  'YOUR_USER_UUID'::uuid,
  'Test Wizard RFQ',
  'Test description',
  'wizard',
  'roofing',
  'Nairobi',
  'Nairobi',
  'submitted',
  10000,
  50000
)
RETURNING id, type, status;
```

**Expected**: Inserts successfully with type='wizard'

---

## 📋 DATA FLOW NOW (After Fixes)

```
1. User fills wizard RFQ form
   ↓
2. RfqContext.getAllFormData() returns:
   {
     rfqType: 'wizard',
     selectedVendors: [],  // ✅ Correct field name
     categorySlug: 'roofing',
     sharedFields: {...}
   }
   ↓
3. WizardRFQModal.submitRfq() sends:
   {
     ...formData,  // ✅ Spreads getAllFormData (no override)
     guestPhone: '...',
     guestPhoneVerified: true
   }
   ↓
4. API /rfq/create receives request
   ↓
5. API creates rfqData:
   {
     type: 'wizard',
     category_slug: 'roofing',
     location: 'Nairobi',  // ✅ FIXED - correct column name
     county: 'Nairobi',
     ...
   }
   ↓
6. API inserts into rfqs table:
   INSERT INTO rfqs (type, category_slug, location, county, ...) ✅
   ↓
7. API calls autoMatchVendors() to match vendors
   ↓
8. Vendors with 'roofing' category get recipient records
   ↓
9. API returns success
   ↓
10. User sees "RFQ created successfully!"
```

---

## ✅ VERIFICATION STEPS

**1. Check if fixes are deployed**:
```bash
# In your VS Code terminal
git log --oneline -5
# Should show commit: "Fix: Correct rfqs table column name..."
```

**2. Run SQL tests in Supabase**:
- Open Supabase Dashboard
- Click SQL Editor
- Run tests from WIZARD_RFQ_DIAGNOSIS_SQL.sql
- Verify all columns exist and RLS is properly configured

**3. Test wizard RFQ creation**:
- Login to your app
- Try creating a wizard RFQ
- Should now succeed without "Failed to create RFQ" error
- Check that vendors were matched (review in database)

**4. Monitor logs**:
- Check Vercel logs for any new errors
- Check browser console for frontend errors

---

## 🎯 NEXT ACTIONS

### Immediate (Now):
1. ✅ Review the 2 bugs fixed
2. ⏳ Run SQL verification tests
3. ⏳ Test wizard RFQ creation

### If Tests Fail:
- If columns missing: Run `supabase/sql/MIGRATION_ADD_RFQ_COLUMNS.sql`
- If RLS issue: Run RLS policy section from `supabase/sql/RFQ_SYSTEM_COMPLETE.sql`
- Check actual error message in Vercel logs

### If Tests Pass:
1. ✅ Confirm wizard RFQs now work
2. ✅ Continue with remaining audit phases
3. ⏳ Add vendor auto-match error handling improvement

---

## 📚 Related Documents

- `WIZARD_RFQ_SCHEMA_AUDIT.md` - Detailed schema analysis
- `WIZARD_RFQ_DIAGNOSIS_SQL.sql` - SQL tests to run in Supabase
- Commit `8b27ec0` - Fixed quote response endpoint (vendor table name)
- Commit `69885a4` - Fixed API location column name

---

## Summary Table

| Issue | Location | Status | Impact |
|-------|----------|--------|--------|
| selectedVendorIds override | WizardRFQModal.js:169 | ✅ FIXED | Vendor data not sent |
| specific_location column | route.js:187 | ✅ FIXED | INSERT fails: column not found |
| RLS policy validation | RFQ_SYSTEM_COMPLETE.sql | ⚠️ VERIFY | Might block INSERT |
| Auto-match error handling | route.js:281-292 | ⚠️ IMPROVE | Silent failures |

---

**Generated**: January 6, 2026, 12:45 PM UTC  
**Session**: Critical Bug Investigation & Schema Audit  
**Total Bugs Found**: 4 (2 fixed, 2 need verification/improvement)  
**Ready for Testing**: YES ✅
