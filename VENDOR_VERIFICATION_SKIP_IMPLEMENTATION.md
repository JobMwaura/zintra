# ✅ Skip Phone & Email Verification for Verified Vendors

**Date**: 30 January 2026  
**Status**: Ready to implement  
**Scope**: Vendors posting jobs/gigs, don't ask for verification if already done

---

## Problem Statement

Currently, when a vendor tries to post a job or gig, the system asks them to verify:
- ✗ Phone number (SMS OTP)
- ✗ Email address (Email OTP)

**But if the vendor is already:**
- ✅ Logged in
- ✅ Has previously verified their phone
- ✅ Has previously verified their email

**Then we should:**
- ✅ Skip these verification steps
- ✅ Let them proceed directly to posting

---

## Solution Architecture

### 1. Database Tracking

The `vendors` table should already have these fields:
```sql
-- Existing columns in vendors table
phone_verified BOOLEAN DEFAULT false;
phone_verified_at TIMESTAMP WITH TIME ZONE;
email_verified BOOLEAN DEFAULT false;
email_verified_at TIMESTAMP WITH TIME ZONE;
```

**Verify with:**
```sql
SELECT * FROM vendors LIMIT 1;
-- Should show: phone_verified, phone_verified_at, email_verified, email_verified_at
```

### 2. Check Verification Status on Page Load

When vendor navigates to `/careers/employer/post-job`:

**Step 1**: Get current user
```javascript
const { data: { user } } = await supabase.auth.getUser();
```

**Step 2**: Get vendor profile
```javascript
const { data: vendor } = await supabase
  .from('vendors')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

**Step 3**: Check verification flags
```javascript
const needsPhoneVerification = !vendor?.phone_verified;
const needsEmailVerification = !vendor?.email_verified;
```

### 3. Conditional UI

**If both verified:**
```
✅ Skip verification steps
→ Show job posting form directly
```

**If only phone unverified:**
```
⚠️ Show phone verification modal
→ After verification, show job posting form
```

**If only email unverified:**
```
⚠️ Show email verification modal
→ After verification, show job posting form
```

**If both unverified:**
```
⚠️ Show phone verification first
→ Then email verification
→ Then job posting form
```

---

## Implementation Steps

### Step 1: Update Post-Job Page (app/careers/employer/post-job/page.js)

**Current:** Always shows form  
**New:** Check verification first

```javascript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  
  // Verification state
  const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  async function checkVerificationStatus() {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Get vendor profile
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, phone_verified, email_verified, phone, email')
        .eq('user_id', user.id)
        .single();

      if (vendorError || !vendorData) {
        router.push('/vendor-registration');
        return;
      }

      setVendor(vendorData);

      // Check what needs verification
      const phoneNeedsVerification = !vendorData.phone_verified && vendorData.phone;
      const emailNeedsVerification = !vendorData.email_verified && vendorData.email;

      setNeedsPhoneVerification(phoneNeedsVerification);
      setNeedsEmailVerification(emailNeedsVerification);

      // Show first unverified modal
      if (phoneNeedsVerification) {
        setShowPhoneVerification(true);
      } else if (emailNeedsVerification) {
        setShowEmailVerification(true);
      }

    } catch (err) {
      console.error('Error checking verification:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneVerificationSuccess() {
    setPhoneVerified(true);
    setShowPhoneVerification(false);

    // Update database
    const supabase = createClient();
    await supabase
      .from('vendors')
      .update({
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
      })
      .eq('id', vendor.id);

    // Check if email also needs verification
    if (needsEmailVerification) {
      setShowEmailVerification(true);
    }
  }

  async function handleEmailVerificationSuccess() {
    setEmailVerified(true);
    setShowEmailVerification(false);

    // Update database
    const supabase = createClient();
    await supabase
      .from('vendors')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .eq('id', vendor.id);
  }

  // Show loading
  if (loading) {
    return <LoadingSpinner />;
  }

  // If verification needed, show modals
  if (showPhoneVerification) {
    return (
      <PhoneVerificationModal
        vendor={vendor}
        onSuccess={handlePhoneVerificationSuccess}
        onClose={() => setShowPhoneVerification(false)}
      />
    );
  }

  if (showEmailVerification) {
    return (
      <EmailVerificationModal
        vendor={vendor}
        onSuccess={handleEmailVerificationSuccess}
        onClose={() => setShowEmailVerification(false)}
      />
    );
  }

  // If both verified, show job posting form
  return (
    <div>
      {/* Verification complete message (optional) */}
      {(phoneVerified || emailVerified) && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
          <CheckCircle className="w-5 h-5 text-green-600 inline mr-2" />
          <span className="text-green-900">✓ Verification complete!</span>
        </div>
      )}

      {/* Existing job posting form */}
      {/* ... rest of your form code ... */}
    </div>
  );
}
```

---

## Database Query to Check Verification Status

```sql
-- Check if a vendor is fully verified
SELECT 
  id,
  company_name,
  phone,
  phone_verified,
  phone_verified_at,
  email,
  email_verified,
  email_verified_at,
  user_id
FROM vendors
WHERE user_id = 'YOUR_USER_ID'
  AND phone_verified = true
  AND email_verified = true;

-- Returns: Vendor if both verified, NULL otherwise
```

---

## Update Vendor Profile After Verification

When verification succeeds, update the vendor record:

```javascript
// After phone verification succeeds
const { error } = await supabase
  .from('vendors')
  .update({
    phone_verified: true,
    phone_verified_at: new Date().toISOString(),
  })
  .eq('id', vendorId);

// After email verification succeeds
const { error } = await supabase
  .from('vendors')
  .update({
    email_verified: true,
    email_verified_at: new Date().toISOString(),
  })
  .eq('id', vendorId);
```

---

## Files to Update

### 1. Post-Job Page
**File**: `/app/careers/employer/post-job/page.js`

**Changes**:
- Add verification status check on mount
- Conditionally show modals
- Skip form display if unverified
- Update vendor record after verification

### 2. Post-Gig Page
**File**: `/app/careers/employer/post-gig/page.js` or `/app/careers/post-gig/page.js`

**Changes**: Same as post-job page

### 3. Phone Verification Modal (Existing)
**File**: Likely already exists in components

**If needed**: Reuse existing `PhoneVerificationModal` component

### 4. Email Verification Modal (Existing)
**File**: Likely already exists in components

**If needed**: Reuse existing `EmailVerificationModal` component

---

## Implementation Order

### Phase 1: Post-Job Page (15 minutes)
1. Add verification state variables
2. Add `checkVerificationStatus()` on mount
3. Conditionally show verification modals
4. Update database after verification succeeds
5. Test with unverified vendor

### Phase 2: Post-Gig Page (10 minutes)
1. Copy logic from post-job page
2. Customize for gig posting
3. Test with unverified vendor

### Phase 3: Testing (15 minutes)
Test scenarios:
- ✅ Vendor with both verified → Goes directly to form
- ✅ Vendor with phone unverified → Shows phone modal, then form
- ✅ Vendor with email unverified → Shows email modal, then form
- ✅ Vendor with both unverified → Shows phone modal, then email modal, then form
- ✅ New vendor (not registered) → Redirects to registration

---

## Code Example: Verification Modal Wrapper

```javascript
// PhoneVerificationModal.jsx (if doesn't exist)
export function PhoneVerificationModal({ vendor, onSuccess, onClose }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    try {
      // Call your OTP verification API
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: vendor.phone,
          code: otp,
        }),
      });

      if (response.ok) {
        onSuccess(); // Update database in parent
      } else {
        setError('Invalid OTP code');
      }
    } catch (err) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Verify Your Phone Number</h2>
        <p className="text-gray-600 mb-4">We sent an OTP to {vendor.phone}</p>
        
        <input
          type="text"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4"
        />

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </div>
    </div>
  );
}
```

---

## Testing Checklist

- [ ] Create test vendor account (unverified)
- [ ] Navigate to `/careers/employer/post-job`
- [ ] ✓ Should see phone verification modal
- [ ] Verify phone with OTP
- [ ] ✓ Phone verification completes
- [ ] ✓ Should see email verification modal
- [ ] Verify email with OTP
- [ ] ✓ Email verification completes
- [ ] ✓ Should see job posting form directly
- [ ] Login with verified vendor
- [ ] ✓ Should skip all modals, show form directly
- [ ] Post a job successfully
- [ ] Verify job appears in dashboard

---

## Benefits

✅ **Better UX**: No annoying re-verification for already verified vendors  
✅ **Faster Flow**: Verified vendors can post immediately  
✅ **Security**: Still requires verification first time  
✅ **Database**: Tracks verification status for future use  
✅ **Flexible**: Can be reused for other features needing verification

---

## Future Enhancements

1. **Require Re-verification**: After X months, require verification again
2. **Phone/Email Change**: If vendor changes phone/email, require re-verification
3. **Separate Verification Page**: Move to `/vendor/verify` for better organization
4. **Bulk Verification**: Admin can verify multiple vendors at once
5. **Verification Status Dashboard**: Show vendors which fields are verified

---

## Database Migration (if needed)

```sql
-- Check if columns exist
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'vendors' 
  AND column_name = 'phone_verified'
);

-- If they don't exist, add them:
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendors_phone_verified 
ON vendors(phone_verified);

CREATE INDEX IF NOT EXISTS idx_vendors_email_verified 
ON vendors(email_verified);
```

---

## Summary

This implementation ensures that:
1. ✅ Vendors already verified on registration don't get asked again
2. ✅ New vendors are required to verify before posting
3. ✅ Verification status is tracked in database
4. ✅ User experience is smooth and fast
5. ✅ Security standards are maintained

**Ready to implement!**
