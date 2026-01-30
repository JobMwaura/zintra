# 🔧 FIX: Verified Vendors Redirected to Registration Instead of Post Forms

**Date**: 30 January 2026  
**Issue**: Verified vendors (SMS + Email verified) are redirected to `/vendor-registration` instead of `/careers/post-job` or `/careers/post-gig`  
**Root Cause**: `getEmployerRedirectPath()` only checks `profiles.is_employer` flag, doesn't verify vendor exists in `vendors` table  
**Status**: ✅ IDENTIFIED & SOLUTION READY  

---

## 🐛 Problem Breakdown

### Current Flow (Broken)
```
User clicks "Post a Job" 
    ↓
HeroSearch calls getEmployerRedirectPath('job')
    ↓
Checks: Is user logged in? ✅ Yes
Checks: Is user role 'employer'? ✅ Yes (in profiles table)
    ↓
Returns: '/careers/post-job' ✅ CORRECT
    ↓
BUT... User might not exist in vendors table
    ↓
If vendor not in vendors table → Registration form shown ❌ WRONG
```

### What Should Happen
```
User clicks "Post a Job"
    ↓
Checks: Is user logged in? 
    ↓
Checks: Does vendor exist in vendors table?
    ↓
Checks: Is vendor phone_verified AND email_verified?
    ↓
If ALL YES → Go to /careers/post-job ✅
If NO → Go to /vendor-registration or verification modal
```

---

## 📊 Current System Architecture

### Tables Involved

**1. profiles table**
```sql
id (auth.users.id)
is_employer BOOLEAN
is_candidate BOOLEAN
-- Problem: Only tracks role, not completion status
```

**2. vendors table**
```sql
id UUID
user_id (auth.users.id)
company_name TEXT
email_verified BOOLEAN
phone_verified BOOLEAN
phone_verified_at TIMESTAMP
email_verified_at TIMESTAMP
-- This is the REAL authority on vendor status!
```

### Current Function: `checkAuthStatus()`
**Location**: `lib/auth-helpers.js` (lines 1-66)

```javascript
export async function checkAuthStatus() {
  // ✅ Gets user from auth
  // ✅ Gets profile to check is_employer
  // ❌ MISSING: Check if vendor exists AND is verified
}
```

### Current Function: `getEmployerRedirectPath()`
**Location**: `lib/auth-helpers.js` (lines 67-82)

```javascript
export async function getEmployerRedirectPath(postType) {
  const { isLoggedIn, userRole } = await checkAuthStatus();
  
  if (!isLoggedIn) return '/vendor-registration';
  if (userRole === 'employer') return postType === 'job' ? '/careers/post-job' : '/careers/post-gig';
  return '/vendor-registration';
  
  // ❌ MISSING: Verify vendor is actually in vendors table
  // ❌ MISSING: Check phone_verified and email_verified flags
}
```

---

## ✅ Solution: Enhance `getEmployerRedirectPath()`

### Updated Function

```javascript
/**
 * Get the appropriate redirect path based on vendor's verification status
 * For posting jobs/gigs (employer action)
 * 
 * Logic:
 * 1. Not logged in → /vendor-registration
 * 2. Not an employer → /vendor-registration
 * 3. Employer but vendor doesn't exist → /vendor-registration
 * 4. Vendor exists but not phone verified → Show verification modal
 * 5. Vendor exists but not email verified → Show verification modal
 * 6. Vendor fully verified → Go to /careers/post-job or /careers/post-gig
 */
export async function getEmployerRedirectPath(postType) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. NOT LOGGED IN
    if (!user) {
      return '/vendor-registration';
    }

    // 2. Check if user is employer in profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, is_employer')
      .eq('id', user.id)
      .single();

    if (!profile?.is_employer) {
      // Not an employer - send to registration
      return '/vendor-registration';
    }

    // 3. CHECK IF VENDOR EXISTS IN VENDORS TABLE
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('id, company_name, phone_verified, email_verified')
      .eq('user_id', user.id)
      .single();

    // 3a. VENDOR DOESN'T EXIST
    if (error || !vendor) {
      console.log('Vendor not found in vendors table, redirecting to registration');
      return '/vendor-registration';
    }

    // 4. VENDOR EXISTS - CHECK VERIFICATION STATUS
    // Both phone AND email must be verified to post
    if (vendor.phone_verified && vendor.email_verified) {
      // ✅ FULLY VERIFIED - Go to posting form
      return postType === 'job' ? '/careers/post-job' : '/careers/post-gig';
    }

    // 5. PARTIALLY VERIFIED OR UNVERIFIED
    // This is the key fix: Instead of silently redirecting to registration,
    // we should return a special path that the post-job page can detect
    // and show a verification modal instead of the full registration form
    
    if (!vendor.phone_verified && !vendor.email_verified) {
      // Neither verified - needs full verification before posting
      return `/vendor-registration?source=post-${postType}&redirect-after=true`;
    }
    
    if (!vendor.phone_verified) {
      // Phone not verified - go to post but show phone verification modal
      return `/careers/post-${postType}?verify=phone`;
    }
    
    if (!vendor.email_verified) {
      // Email not verified - go to post but show email verification modal
      return `/careers/post-${postType}?verify=email`;
    }

  } catch (error) {
    console.error('Error in getEmployerRedirectPath:', error);
    return '/vendor-registration';
  }
}
```

---

## 🔄 Updated Post-Job Page Logic

### File: `app/careers/employer/post-job/page.js`

**Add at the top to check verification status:**

```javascript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PostJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendorAndCheckVerification();
  }, []);

  async function loadVendorAndCheckVerification() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Get vendor profile
      const { data: vendorData, error } = await supabase
        .from('vendors')
        .select('id, company_name, phone_verified, email_verified, phone, email')
        .eq('user_id', user.id)
        .single();

      if (error || !vendorData) {
        // Vendor doesn't exist - redirect to registration
        router.push('/vendor-registration');
        return;
      }

      setVendor(vendorData);

      // Check verification status from URL params
      const verifyParam = searchParams.get('verify');
      
      if (verifyParam === 'phone' && !vendorData.phone_verified) {
        setShowPhoneVerification(true);
      } else if (verifyParam === 'email' && !vendorData.email_verified) {
        setShowEmailVerification(true);
      } else if (!vendorData.phone_verified || !vendorData.email_verified) {
        // If verification params not set but still unverified, show what's needed
        if (!vendorData.phone_verified) {
          setShowPhoneVerification(true);
        } else if (!vendorData.email_verified) {
          setShowEmailVerification(true);
        }
      }

    } catch (err) {
      console.error('Error loading vendor:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  // Show verification modals if needed
  if (showPhoneVerification) {
    return (
      <PhoneVerificationModal
        vendor={vendor}
        onSuccess={() => {
          setShowPhoneVerification(false);
          // Check if email also needs verification
          if (!vendor.email_verified) {
            setShowEmailVerification(true);
          }
        }}
      />
    );
  }

  if (showEmailVerification) {
    return (
      <EmailVerificationModal
        vendor={vendor}
        onSuccess={() => {
          setShowEmailVerification(false);
          // Reload vendor data to confirm both verified
          loadVendorAndCheckVerification();
        }}
      />
    );
  }

  // All verified - show job posting form
  return (
    <div>
      {/* Existing job posting form code */}
    </div>
  );
}
```

---

## 🎯 Implementation Steps

### Step 1: Update `getEmployerRedirectPath()` Function
**File**: `lib/auth-helpers.js`

**Action**: Replace lines 67-82 with the enhanced version above

**Key Changes**:
- ✅ Check if vendor exists in vendors table
- ✅ Return URL with verification params if needed
- ✅ Return direct posting URL if fully verified

### Step 2: Update Post-Job Page
**File**: `app/careers/employer/post-job/page.js`

**Action**: Add verification check logic at top of component

**Key Changes**:
- ✅ Read verification params from URL
- ✅ Show verification modals if needed
- ✅ Redirect to registration if vendor doesn't exist

### Step 3: Apply Same Logic to Post-Gig Page
**File**: `app/careers/employer/post-gig/page.js`

**Action**: Same changes as post-job page

### Step 4: Test All Scenarios

**Test Case 1: Fully Verified Vendor**
```
Vendor: phone_verified = true, email_verified = true
Click: "Post a Job"
Expected: Goes directly to /careers/post-job form
Result: ✅ Should work
```

**Test Case 2: Phone Not Verified**
```
Vendor: phone_verified = false, email_verified = true
Click: "Post a Job"
Expected: Shows phone verification modal first
Result: ✅ Should work after verification
```

**Test Case 3: Email Not Verified**
```
Vendor: phone_verified = true, email_verified = false
Click: "Post a Job"
Expected: Shows email verification modal first
Result: ✅ Should work after verification
```

**Test Case 4: Neither Verified**
```
Vendor: phone_verified = false, email_verified = false
Click: "Post a Job"
Expected: Goes to registration or shows phone verification first
Result: ✅ Should work
```

**Test Case 5: Vendor Doesn't Exist**
```
User: is_employer = true, but no vendor record
Click: "Post a Job"
Expected: Redirects to /vendor-registration
Result: ✅ Should work
```

---

## 📝 Related Issues This Fixes

1. **Verified vendors get registration form** ← Main issue
2. **UX friction** - Users who already verified are asked again
3. **Data consistency** - posts redirects to registration when vendor exists
4. **Mobile experience** - Multiple redirect hops hurt mobile UX

---

## 🚀 Benefits of This Fix

✅ **Better UX**: Verified vendors go directly to posting form  
✅ **Consistent**: Uses vendor table as source of truth  
✅ **Flexible**: Can show verification modal without full registration  
✅ **Safe**: Still checks all necessary conditions  
✅ **Scalable**: Same pattern can be reused for other features  

---

## 🔗 Related Files to Update

| File | Lines | Change | Priority |
|------|-------|--------|----------|
| `lib/auth-helpers.js` | 67-82 | Replace `getEmployerRedirectPath()` | 🔴 CRITICAL |
| `app/careers/employer/post-job/page.js` | 1-50 | Add verification checks | 🔴 CRITICAL |
| `app/careers/employer/post-gig/page.js` | 1-50 | Add verification checks | 🔴 CRITICAL |
| `components/careers/HeroSearch.js` | 33-34 | Already calls updated function | ✅ OK |
| `components/careers/EmployerTestimonial.js` | 26-27 | Already calls updated function | ✅ OK |

---

## 📊 User Journey - Before vs After

### Before (Current - Broken)
```
Verified Vendor ✅
    ↓
Clicks "Post a Job"
    ↓
getEmployerRedirectPath() checks only profiles.is_employer ❌
    ↓
Returns '/careers/post-job'
    ↓
But post-job page doesn't know vendor exists in vendors table
    ↓
Shows registration form ❌ WRONG!
```

### After (Fixed)
```
Verified Vendor ✅ (phone_verified=true, email_verified=true)
    ↓
Clicks "Post a Job"
    ↓
getEmployerRedirectPath() checks:
  - profiles.is_employer ✅
  - vendors table exists ✅
  - phone_verified ✅
  - email_verified ✅
    ↓
Returns '/careers/post-job'
    ↓
Post-job page receives URL without verify params
    ↓
Shows job posting form directly ✅ CORRECT!
```

---

## 🔍 Testing Strategy

### Manual Testing

1. **Test with Verified Vendor**
   - Create vendor account via registration
   - Complete phone + email verification
   - Log out and back in
   - Click "Post a Job" → Should go directly to form

2. **Test with Partially Verified**
   - Create vendor
   - Verify phone only
   - Click "Post a Job" → Should show email verification modal

3. **Test with Unverified**
   - Create vendor but don't verify
   - Click "Post a Job" → Should show phone verification first

### Automated Testing

```javascript
// test/auth-helpers.test.js

describe('getEmployerRedirectPath', () => {
  test('Fully verified vendor goes to /careers/post-job', async () => {
    // Setup: Create vendor with both verified = true
    const path = await getEmployerRedirectPath('job');
    expect(path).toBe('/careers/post-job');
  });

  test('Unverified vendor goes to /vendor-registration', async () => {
    // Setup: Create vendor with both verified = false
    const path = await getEmployerRedirectPath('job');
    expect(path).toBe('/vendor-registration');
  });

  test('Phone unverified includes verify param', async () => {
    // Setup: phone_verified=false, email_verified=true
    const path = await getEmployerRedirectPath('job');
    expect(path).toContain('verify=phone');
  });
});
```

---

## 💡 Why This Happens

The current implementation has a **separation of concerns issue**:

1. **`checkAuthStatus()`** only checks the `profiles` table
2. **`getEmployerRedirectPath()`** trusts checkAuthStatus blindly
3. **`vendors` table** is the actual source of truth but never checked

This is why verified vendors still get sent to registration - the redirect function never confirms they actually exist in the vendors table.

---

## 🎯 Success Criteria

After implementation:
- ✅ Fully verified vendor clicks "Post a Job" → Goes directly to form
- ✅ Partially verified vendor → Shows verification modal first
- ✅ Unverified vendor → Shows registration form or verification prompts
- ✅ No vendor record → Redirects to registration
- ✅ Not logged in → Redirects to login/registration
- ✅ Works on both job and gig posting

---

## 📞 Questions This Raises

1. **Should we show a verification modal or full registration form?**
   - Answer: Modal for existing vendors needing verification, registration for new users

2. **What if vendor table has no record but is_employer=true?**
   - Answer: Send them to registration to complete vendor profile

3. **Should we update profiles.is_employer in real-time?**
   - Answer: Keep both flags - profiles.is_employer = role, vendors table = completion status

4. **Can vendor post before email verification?**
   - Answer: No - should require both phone AND email verified (or update requirement)

---

**Status**: Ready to implement  
**Estimated time**: 30 minutes  
**Testing time**: 20 minutes  
**Total**: ~50 minutes  

---

Next: Implement this fix and test all scenarios!
