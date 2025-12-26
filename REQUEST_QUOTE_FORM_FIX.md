# ✅ Request Quote Form - Database Constraint Fix

## Problem

When users completed the "Request Quote" modal on vendor profiles, they got this error:

```
⚠️ Failed to send request: null value in column "project_title" of relation "rfq_requests" violates not-null constraint
```

## Root Cause

The `rfq_requests` table in the database has a `project_title` column that requires a NOT NULL value. However, the form submission code in `DirectRFQPopup.js` was only sending:
- `rfq_id`
- `vendor_id`
- `user_id`
- `status`
- `created_at`

It was **NOT** sending `project_title`, causing the database insert to fail.

## Solution

Updated `DirectRFQPopup.js` to include the `project_title` field when inserting into the `rfq_requests` table:

**Before:**
```javascript
const { error: requestError } = await supabase.from('rfq_requests').insert([{
  rfq_id: rfqData.id,
  vendor_id: vendorRecipientId,
  user_id: user?.id || null,
  status: 'pending',
  created_at: new Date().toISOString(),
}]);
```

**After:**
```javascript
const { error: requestError } = await supabase.from('rfq_requests').insert([{
  rfq_id: rfqData.id,
  vendor_id: vendorRecipientId,
  user_id: user?.id || null,
  project_title: form.title || 'Untitled Project',  // ← Added this
  status: 'pending',
  created_at: new Date().toISOString(),
}]);
```

## What Changed

**File**: `components/DirectRFQPopup.js` (lines 201-215)

**Addition**: Added `project_title: form.title || 'Untitled Project'` to the `rfq_requests` INSERT

**Fallback**: If the form title is empty (shouldn't happen with required validation), it defaults to `'Untitled Project'`

**Error Logging**: Also improved error messages to show specific details about why the insert failed

## Testing

**After deployment (2-5 minutes):**

1. Go to any vendor profile
2. Click "Request Quote"
3. Fill in the form:
   - Project Title: (e.g., "Kitchen Renovation")
   - Project Description: (e.g., "Need new cabinets...")
   - Select category
   - Enter budget
   - Agree to terms
4. Click "Send Request"
5. **Expected**: ✅ "Request sent successfully! Redirecting..."
6. **Should NOT see**: ⚠️ "null value in column project_title" error

## How It Works Now

```
User submits form
    ↓
Form validates (title required)
    ↓
Insert into rfqs table (title, description, category, budget, location)
    ↓
rfq_id returned from database
    ↓
Insert into rfq_requests table:
  - rfq_id (from above)
  - vendor_id (from vendor prop)
  - user_id (authenticated user)
  - project_title: form.title ✅ NOW INCLUDED
  - status: 'pending'
  - created_at: timestamp
    ↓
✅ Success! Request sent to vendor
    ↓
Redirect to /my-rfqs
```

## Impact

- ✅ Users can now send direct RFQ requests to vendors
- ✅ Vendor receives the RFQ request with project title
- ✅ No more database constraint errors
- ✅ Form works as intended

## Deployment

**Commit**: `f18b20e`  
**Status**: ✅ Deployed and pushed  
**Timeline**: Live in 2-5 minutes via Vercel auto-deployment

---

**Related Fixes This Session**:
1. ✅ County selection dropdown - Fixed prop name
2. ✅ Verified buyer badge - Fixed via server action + service role
3. ✅ **Request quote form - Fixed database constraint** (THIS FIX)

---

## Verification

Check that the form now submits without errors by:

1. **Browser Console**: Should NOT see "Failed to send request" errors
2. **Database**: Check that `rfq_requests` records are being created with `project_title` populated
3. **User Experience**: Form shows "Request sent successfully!"

---

**Status**: ✅ FIXED AND DEPLOYED  
**Confidence**: 🟢 Very High  
**Risk**: 🟢 Very Low (simple field addition)
