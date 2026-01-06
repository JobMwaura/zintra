# 🔍 WIZARD RFQ SCHEMA & RLS AUDIT - SUMMARY

**Date**: January 6, 2026  
**Time**: 30 minutes investigation + fixes  
**Commits**: 69885a4 (schema fixes)  

---

## 📊 WHAT WE CHECKED

✅ **Supabase rfqs table schema** - Looked at all columns and what the API expects  
✅ **RLS policies** - Reviewed row-level security configuration  
✅ **Frontend field names** - Checked what WizardRFQModal sends  
✅ **API field mapping** - Verified /api/rfq/create matches table schema  
✅ **Data flow** - Traced complete journey from frontend → API → database  

---

## 🔴 BUGS FOUND & FIXED

### Bug #1: WizardRFQModal sending `selectedVendorIds` instead of using spread data
**Status**: ✅ FIXED (previous session)  
**File**: `/components/WizardRFQModal.js` line 169  
**Problem**: Sending extra field that overrides correct vendor data  
**Fix**: Removed the override, let spread operator handle data

### Bug #2: API trying to insert `specific_location` column that doesn't exist
**Status**: ✅ FIXED (commit 69885a4)  
**File**: `/app/api/rfq/create/route.js` line 187  
**Problem**: Supabase table has `location` column, not `specific_location`  
**Fix**: Changed `specific_location` → `location`  
**Evidence**: MIGRATION_ADD_RFQ_COLUMNS.sql line 98 adds `location TEXT` column

---

## ⚠️ ISSUES TO VERIFY

### Issue #1: RLS Policies
**Current Status**: Need verification in Supabase  
**What to Check**: 
- Is RLS enabled on rfqs table?
- Does service role policy exist?
- Are INSERT policies blocking the API?

**How to Verify**: Run SQL tests in `WIZARD_RFQ_DIAGNOSIS_SQL.sql`

### Issue #2: Vendor Auto-Matching Error Handling
**Current Status**: Errors are logged but not shown to user  
**What Happens**: If auto-match fails, RFQ still created with no vendors  
**Improvement Needed**: Better error visibility for wizard RFQs

---

## ✅ SCHEMA FIXES DETAILED

### Change #1: Location Column Name
```javascript
// File: /app/api/rfq/create/route.js
// Line: 187

// BEFORE:
specific_location: sharedFields.town || null,

// AFTER:
location: sharedFields.town || null,

// Why: The migration added 'location' column (line 98 of MIGRATION_ADD_RFQ_COLUMNS.sql)
// API was trying to use 'specific_location' which doesn't exist
// Result: "column 'specific_location' does not exist" error from Supabase
```

### Verification
```sql
-- To verify the fix works, run in Supabase SQL Editor:
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'rfqs' 
AND column_name IN ('location', 'specific_location');

-- Expected: Only 'location' should appear (not specific_location)
```

---

## 🧪 TESTING CHECKLIST

### 1. Verify Schema (Run in Supabase)
```
✅ Check if 'location' column exists
✅ Check if 'category_slug' column exists
✅ Check if 'visibility' column exists
✅ Check if 'type' column exists
✅ Verify RLS is enabled
✅ Verify service role policy exists
```

**File with all tests**: `WIZARD_RFQ_DIAGNOSIS_SQL.sql`

### 2. Test Wizard RFQ Creation
```
✅ Login to app
✅ Click "Create Wizard RFQ"
✅ Fill out form completely
✅ Submit
✅ Should see "RFQ created successfully!" (not "Failed to create RFQ")
✅ RFQ should appear in database with type='wizard'
✅ Vendors should be auto-matched and assigned to RFQ
✅ Vendors should receive notifications
```

### 3. Verify in Database
```sql
-- Check that wizard RFQ was created
SELECT id, type, title, category_slug, location, status 
FROM rfqs 
WHERE type = 'wizard' 
ORDER BY created_at DESC 
LIMIT 1;

-- Check that vendors were matched
SELECT * 
FROM rfq_recipients 
WHERE rfq_id = 'RFQ_ID_FROM_ABOVE'
ORDER BY created_at DESC;
```

---

## 📚 FILES CREATED/UPDATED

**New Files**:
- `WIZARD_RFQ_SCHEMA_AUDIT.md` - Detailed issue analysis
- `WIZARD_RFQ_DIAGNOSIS_SQL.sql` - SQL tests to run in Supabase
- `WIZARD_RFQ_COMPREHENSIVE_AUDIT.md` - Full audit report
- `WIZARD_RFQ_SCHEMA_RLS_AUDIT_SUMMARY.md` - This file

**Modified Files**:
- `/app/api/rfq/create/route.js` - Fixed column name (line 187)

**Commits**:
- `69885a4` - Fix: Correct rfqs table column name (specific_location → location)

---

## 🎯 NEXT STEPS

### Immediate
1. Run SQL verification tests in Supabase (WIZARD_RFQ_DIAGNOSIS_SQL.sql)
2. If all tests pass → Test wizard RFQ creation
3. If any test fails → Apply recommended fix

### If Verification Passes
1. ✅ Confirm wizard RFQs work
2. ✅ Move to testing vendor auto-matching
3. ✅ Continue remaining audit phases

### If Verification Fails
1. **Columns missing**: Run `supabase/sql/MIGRATION_ADD_RFQ_COLUMNS.sql`
2. **RLS blocking**: Run RLS policy section from `supabase/sql/RFQ_SYSTEM_COMPLETE.sql`
3. **Other errors**: Check Vercel logs for actual error messages

---

## 💡 KEY FINDINGS

| Issue | Root Cause | Impact | Status |
|-------|-----------|--------|--------|
| Wizard RFQ fails | Frontend: selectedVendorIds override | Vendor data lost | ✅ FIXED |
| Wizard RFQ fails | API: specific_location column | INSERT fails | ✅ FIXED |
| RLS might block | Service role policy missing? | API can't insert | ⚠️ VERIFY |
| Auto-match fails silently | Error handling | No vendors matched | ⚠️ IMPROVE |

---

## 🔐 RLS VERIFICATION

The API uses `SUPABASE_SERVICE_ROLE_KEY` which should bypass RLS, BUT:
- If service role policy is missing, INSERT might be blocked
- If RLS is misconfigured, all RFQ types would fail (not just wizard)
- Since direct RFQs work, RLS is likely OK

**Check this**:
```sql
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'rfqs' 
  AND policyname LIKE '%service_role%';
  
-- Should return: >= 1
```

---

## 📋 SUMMARY

**Problems Found**: 4
- Frontend field override: ✅ FIXED
- API column name: ✅ FIXED
- RLS policies: ⚠️ VERIFY
- Error handling: ⚠️ IMPROVE

**Fixes Applied**: 2 (field name bugs)

**Code Quality Improvements**: Now we have:
- Detailed audit documents
- SQL diagnostic tests
- Clear mapping of schema ↔ API ↔ Frontend

**Ready for Testing**: YES ✅

---

## 🚀 EXPECTED OUTCOME

After these fixes:
1. **Wizard RFQ creation** should succeed (no more "Failed to create RFQ" error)
2. **Vendors auto-matched** based on category and county
3. **Notifications sent** to matched vendors
4. **RFQ appears** in vendor inbox as "Wizard RFQ"
5. **Vendors can submit** quotes/responses

---

**Investigation Complete**: ✅  
**Fixes Deployed**: ✅  
**Verification Pending**: ⏳ (User needs to run SQL tests)  
**Testing Pending**: ⏳ (User needs to test creation)
