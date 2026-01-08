# Code Fixes for Vendor Authentication Issues

## Fix #1: User Dashboard - Add Vendor Detection & Redirect

**File:** `/app/user-dashboard/page.js`

**Location:** After the existing `useEffect` hooks, before the `fetchUserData` function (around line 40)

**Add this new useEffect hook:**

```javascript
// ============================================================================
// NEW: Redirect vendors to their vendor profile instead of user dashboard
// ============================================================================
useEffect(() => {
  const checkIfVendor = async () => {
    // Only run if user is loaded and authenticated
    if (authLoading || !user) {
      return;
    }

    try {
      console.log('🔹 UserDashboard: Checking if user is vendor...');
      
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // PGRST116 is the normal "0 rows found" error - this means user is NOT a vendor
      if (vendorError && vendorError.code !== 'PGRST116') {
        console.error('⚠️ Error checking vendor status:', vendorError);
        return;
      }

      // If vendor record exists, user is a vendor - redirect them
      if (vendor?.id) {
        console.warn('⚠️ Vendor user accessed user-dashboard, redirecting to vendor profile...');
        window.location.href = `/vendor-profile/${vendor.id}`;
        return;
      }

      // If we get here: user is NOT a vendor, proceed with user dashboard
      console.log('✅ User is not a vendor, user dashboard is correct');
    } catch (error) {
      console.error('❌ Error in vendor redirect check:', error);
      // Don't block user dashboard if check fails
    }
  };

  checkIfVendor();
}, [user, authLoading, supabase]);
```

---

## Fix #2: Vendor Registration - Better Error Handling

**File:** `/app/vendor-registration/page.js`

**Location:** Replace the vendor creation section (lines ~450-480)

**Find this code:**

```javascript
const response = await fetch('/api/vendor/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    company_name: formData.businessName,
    description: formData.businessDescription || null,
    phone: formData.phone || null,
    phone_verified: phoneVerified,
    // ... other fields ...
  })
});

const responseData = await response.json();

if (!response.ok) {
  setMessage('Error creating vendor profile: ' + responseData.error);
}

// Success message and redirect (ISSUE: always executes even on error!)
setMessage(
  user?.id
    ? '✅ Vendor profile created successfully!'
    : '✅ Account created. Check your email to verify and activate your profile.'
);
setCurrentStep(6);

const createdId = responseData?.data?.[0]?.id;
if (createdId) {
  setTimeout(() => {
    router.push(`/vendor-profile/${createdId}`);
  }, 1200);
}
```

**Replace with this:**

```javascript
const response = await fetch('/api/vendor/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    company_name: formData.businessName,
    description: formData.businessDescription || null,
    phone: formData.phone || null,
    phone_verified: phoneVerified,
    email: formData.email.trim(),
    county: formData.county || null,
    location: formData.location || null,
    category: formData.category || null,
    primary_category_slug: formData.primaryCategorySlug || null,
    secondary_categories: formData.secondaryCategories || null,
    website_url: formData.websiteUrl || null,
    whatsapp_number: formData.whatsappNumber || null,
    services: formData.services || null,
    selected_plan: formData.selectedPlan || 'free',
  })
});

const responseData = await response.json();

// ============================================================================
// ✅ FIX: Check response status FIRST before proceeding
// ============================================================================
if (!response.ok) {
  const errorMessage = responseData?.error || response.statusText || 'Unknown error';
  console.error('❌ Vendor creation failed:', { status: response.status, error: errorMessage });
  
  setMessage('❌ Error creating vendor profile: ' + errorMessage);
  setIsLoading(false);
  return; // ✅ CRITICAL: Return here on error!
}

// ============================================================================
// Verify we got valid data back
// ============================================================================
if (!responseData.data || !Array.isArray(responseData.data) || responseData.data.length === 0) {
  console.error('❌ Vendor creation returned invalid data:', responseData);
  setMessage('❌ Error: Vendor profile creation returned no data');
  setIsLoading(false);
  return;
}

const createdVendor = responseData.data[0];
if (!createdVendor?.id) {
  console.error('❌ Vendor created but no ID returned:', createdVendor);
  setMessage('❌ Error: No vendor ID received from server');
  setIsLoading(false);
  return;
}

// ============================================================================
// ✅ Only reaches here on success
// ============================================================================
console.log('✅ Vendor profile created successfully:', createdVendor);

const successMessage = user?.id
  ? '✅ Vendor profile created successfully!'
  : '✅ Account created. Check your email to verify and activate your profile.';

setMessage(successMessage);
setCurrentStep(6);

setTimeout(() => {
  console.log('🔹 Redirecting to vendor profile:', createdVendor.id);
  router.push(`/vendor-profile/${createdVendor.id}`);
}, 1200);
```

---

## Optional Fix #3: Better Error Messages in API (For Reference)

**File:** `/app/api/vendor/create/route.js`

This is optional - the current API error handling is already decent. But if you want to improve it, look for the duplicate vendor check section (around line 30) and ensure error messages are clear:

```javascript
// Check for duplicate vendor
const { data: existingVendor } = await supabase
  .from('vendors')
  .select('id, email')
  .eq('email', body.email.trim())
  .maybeSingle();

if (existingVendor) {
  console.warn('⚠️ Duplicate vendor attempt:', { email: body.email, existingId: existingVendor.id });
  return NextResponse.json(
    { 
      error: `A vendor with this email (${body.email}) already exists. Please sign in to your existing account.`,
      vendorId: existingVendor.id // Include ID for potential recovery
    },
    { status: 409 }
  );
}

// Insert vendor record
const { data, error } = await supabase
  .from('vendors')
  .insert([vendorPayload])
  .select();

if (error) {
  console.error('❌ Vendor insert error:', { code: error.code, message: error.message, details: error.details });
  
  let friendlyError = 'Failed to create vendor profile. ';
  
  // Handle specific database errors
  if (error.code === '23505') {
    // Unique constraint violation
    friendlyError += 'A vendor with this email already exists. Please try signing in.';
  } else if (error.code === '23503') {
    // Foreign key violation
    friendlyError += 'Invalid user reference. Please try registering again.';
  } else if (error.message && error.message.includes('row-level security')) {
    // RLS policy violation
    friendlyError += 'You do not have permission to create a vendor profile. Contact support if this persists.';
  } else if (error.message && error.message.includes('timeout')) {
    // Timeout
    friendlyError += 'Request timed out. Please try again.';
  } else {
    // Generic error
    friendlyError += error.message || 'Please try again later.';
  }
  
  return NextResponse.json(
    { error: friendlyError },
    { status: 400 }
  );
}
```

---

## Summary

| Fix | File | Lines | Type | Priority |
|-----|------|-------|------|----------|
| #1 | `/app/user-dashboard/page.js` | ~40-50 (new hook) | Add new useEffect | 🔴 **CRITICAL** |
| #2 | `/app/vendor-registration/page.js` | ~450-480 | Replace section | 🔴 **CRITICAL** |
| #3 | `/app/api/vendor/create/route.js` | ~30-80 | Optional improve | 🟡 Optional |

---

## Application Order

1. **Apply Fix #1** to user dashboard first (redirect vendors away from user dashboard)
2. **Apply Fix #2** to vendor registration (show errors properly)
3. **Test** both vendor login and vendor registration
4. **If issues persist**, apply optional Fix #3 for better API error messages

---

## Testing Commands

After applying fixes:

```bash
# In one terminal, start the dev server
cd /Users/macbookpro2/Desktop/zintra-platform
npm run dev

# In another terminal, watch for errors
npm run lint
```

Then:
1. Sign in as vendor → check browser console → should redirect
2. Vendor signup → should show real errors if API fails
3. Retry incomplete signup → should auto-sign-in and create vendor

---

## Related Files

- `FIX_VENDOR_REGISTRATION_RLS.md` - RLS policy fix (do this first!)
- `CRITICAL_BUG_VENDOR_AUTH_ROUTING.md` - Detailed issue analysis
- `VENDOR_SIGNUP_FIX_COMPLETE.md` - Previous vendor signup fix (reference)

---

## Questions?

If any of these fixes don't apply cleanly:
1. Check line numbers - file may have changed
2. Look for similar code patterns
3. Refer to the detailed bug report in `CRITICAL_BUG_VENDOR_AUTH_ROUTING.md`

Ready to implement!
