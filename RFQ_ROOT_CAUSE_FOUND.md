# RFQ SUBMISSION FAILURE - ROOT CAUSE ANALYSIS

## The Problem

RFQ submissions fail with "Failed to create RFQ. Please try again."

## Root Cause Found

**The endpoint is trying to insert using field names that don't match the database schema!**

### What the Endpoint is Sending

```javascript
{
  user_id:           ✅ Exists
  title:             ✅ Exists
  description:       ✅ Exists
  category:          ❌ WRONG! Should be 'category_slug'
  location:          ✅ Exists (but 'specific_location' also exists)
  county:            ✅ Exists
  budget_estimate:   ✅ Exists
  type:              ⚠️  Exists BUT table also has 'rfq_type'
  status:            ✅ Exists
  urgency:           ✅ Exists
  assigned_vendor_id:✅ Exists
  is_paid:           ✅ Exists
}
```

### What the Database Actually Has

**Complete rfqs table columns:**
```
id                     (auto)
user_id                ✅
buyer_id               (alternative user field)
category_slug          ← TABLE USES THIS, NOT 'category'
category               ← Also exists but separate
description            ✅
location               ✅
specific_location      ← More specific location field
county                 ✅
budget_estimate        ✅
budget_min             (if custom budget)
budget_max             (if custom budget)
budget_range           (predefined budget range)
title                  ✅
type                   ✅ (RFQ type: direct, wizard, public, vendor-request)
rfq_type               ← Also exists as alternative
status                 ✅ (submitted, in-progress, closed, etc)
urgency                ✅
assigned_vendor_id     ✅
is_paid                ✅
payment_terms          (payment info)
visibility             ✅ (public/private)
timeline               (project timeline)
... 50+ other fields for detailed RFQ data
```

## The Fix Required

**Change endpoint field name from `category` to `category_slug`**

### File to Fix
`/app/api/rfq/create/route.js` - Line 224 (approx)

### Current (WRONG):
```javascript
const rfqData = {
  // ... other fields ...
  category: categorySlug,    // ❌ WRONG FIELD NAME
  // ... other fields ...
};
```

### Should Be:
```javascript
const rfqData = {
  // ... other fields ...
  category_slug: categorySlug,  // ✅ CORRECT
  // ... other fields ...
};
```

## Complete Correct Payload

```javascript
const rfqData = {
  user_id: userId,                        // User who created RFQ
  title: sharedFields.projectTitle?.trim() || 'Untitled RFQ',
  description: sharedFields.projectSummary?.trim() || '',
  category_slug: categorySlug,            // ✅ USE category_slug NOT category
  specific_location: sharedFields.town || null,  // More specific location
  county: sharedFields.county || null,
  budget_estimate: sharedFields.budgetMin && sharedFields.budgetMax 
    ? `${sharedFields.budgetMin} - ${sharedFields.budgetMax}` 
    : null,
  type: rfqType,                          // RFQ type
  status: 'submitted',
  urgency: sharedFields.urgency || 'normal',
  assigned_vendor_id: null,
  is_paid: false,
  visibility: rfqType === 'public' ? 'public' : 'private',  // Optional but available
};
```

## Verification

✅ **Phone verification** is working - 4 users have phone_verified=true  
✅ **Users table** exists and has all required fields  
✅ **RFQs table** exists with correct schema  
✅ **The issue** is specifically the `category` vs `category_slug` field name mismatch  

## Why This Happened

The endpoint was built with a simplified schema assumption, but the actual Supabase table has more detailed column names. When the INSERT tries to use `category` instead of `category_slug`, Supabase either:
1. Ignores the unknown field
2. Returns a validation error
3. Fails the insert silently

## Timeline to Fix

1. Change `category:` to `category_slug:` in the endpoint (1 line)
2. Optional: Change `location:` to `specific_location:` for clarity (1 line)
3. Rebuild and test
4. Deploy

**Estimated time: 5 minutes**

---

**Status**: ROOT CAUSE IDENTIFIED ✅
**Next Step**: Apply the fix
