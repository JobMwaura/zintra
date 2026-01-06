# Authentication Validation Fix for RFQ Submission

## Problem Description

**Error Message**: `⚠️ User not found or invalid userId`

**When It Occurred**: After filling in the Direct RFQ form and attempting to submit

**Root Cause**: 

1. The RFQ submission flow requires user authentication
2. Users were somehow reaching the submit step without being properly authenticated
3. When `handleSubmit` was called, `currentUser?.id` was `null`
4. The API received `userId: null` and tried to look it up in the `profiles` table
5. Since `null` is not a valid user ID, the lookup failed with "User not found or invalid userId"

## What Was Fixed

### 1. **Frontend Validation Enhancement** (`/components/RFQModal/RFQModal.jsx`)

#### Before:
```javascript
const handleSubmit = async () => {
  // ...
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  const submissionData = {
    // ...
    userId: currentUser?.id || null,  // ❌ Could be null!
    // ...
  };
```

#### After:
```javascript
const handleSubmit = async () => {
  // ...
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // ✅ EXPLICIT CHECK: Prevent submission without authentication
  if (!currentUser || !currentUser.id) {
    setError('You must be logged in to submit an RFQ. Please complete the authentication step.');
    setIsSubmitting(false);
    return;
  }

  const submissionData = {
    // ...
    userId: currentUser.id,  // ✅ Always a valid user ID
    // ...
  };
```

**Key Improvement**: Added explicit authentication check before attempting submission. This prevents any possibility of sending a `null` userId to the API.

### 2. **Review Step Validation** (`/components/RFQModal/RFQModal.jsx`)

#### Before:
```javascript
if (currentStep === 'review') {
  // Data already validated
}
```

#### After:
```javascript
if (currentStep === 'review') {
  // ✅ Final safety check: ensure user is still authenticated before review
  if (!user) newErrors.review = 'Session expired. Please go back to the auth step and log in again.';
}
```

**Key Improvement**: Added safety check to catch edge case where user's session might have expired while on the review step.

### 3. **API Validation Improvement** (`/app/api/rfq/create/route.js`)

#### Before:
```javascript
// Validate user (authenticated or guest)
if (!userId && !guestEmail && !guestPhone) {
  return NextResponse.json(
    { error: 'Either userId (authenticated) or guestEmail/guestPhone (guest) required' },
    { status: 400 }
  );
}

if (userId) {
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id, email, phone_verified, email_verified')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    return NextResponse.json(
      { error: 'User not found or invalid userId' },  // ❌ Vague error message
      { status: 401 }
    );
  }
}
```

#### After:
```javascript
// ✅ EXPLICIT REQUIREMENT: userId is now required (not optional)
if (!userId) {
  return NextResponse.json(
    { error: 'You must be logged in to submit an RFQ. Please complete the authentication step and try again.' },
    { status: 401 }
  );
}

// ============================================================================
// 2. USER AUTHENTICATION CHECK
// ============================================================================
const { data: userData, error: userError } = await supabase
  .from('profiles')
  .select('id, email, phone_verified, email_verified')
  .eq('id', userId)
  .single();

if (userError || !userData) {
  console.error('[RFQ CREATE] User lookup failed:', { userId, userError });
  return NextResponse.json(
    { error: 'Your account could not be found. Please log out and log in again.' },  // ✅ Better error message
    { status: 401 }
  );
}
```

**Key Improvements**:
- Now explicitly requires `userId` to be present (not null)
- Better error message for unauthenticated submissions
- Better error message when user lookup fails (guides user to re-login)

## Testing the Fix

### To Test Direct RFQ Submission:

1. **Navigate to Direct RFQ**: Go to `/post-rfq/direct`
2. **Fill in All Required Fields**:
   - Select a category
   - Complete template details
   - Fill project information (title, summary, county, town, budget, etc.)
   - Select at least one vendor
3. **Verify Authentication Step**:
   - Before reaching the review step, you MUST be logged in
   - If not logged in, the system will show: "Please log in or create account"
   - You should NOT be able to proceed to review without authenticating
4. **Submit**:
   - After authentication, you should be able to submit
   - Should see success message: "RFQ created successfully!"

### Expected Behavior Now:

✅ **If Unauthenticated**:
- Cannot proceed past auth step
- Clear error message: "Please log in or create account"
- Cannot submit without authentication

✅ **If Authenticated**:
- Can complete all steps
- Submit successfully
- RFQ created and saved to database

✅ **If Session Expires During Fill**:
- Review step validation will catch it
- Error message: "Session expired. Please go back to the auth step and log in again."

## Files Modified

1. **`/components/RFQModal/RFQModal.jsx`**
   - Added authentication check in `handleSubmit()`
   - Added session check in review step validation

2. **`/app/api/rfq/create/route.js`**
   - Changed userId from optional to required
   - Improved error messages for clarity

## Deployment Checklist

- [x] Code changes made
- [x] Changes committed to git
- [x] Changes pushed to GitHub (commit: b3ef1f3)
- [ ] Deploy to Vercel
- [ ] Test in production
- [ ] Monitor for errors

## Troubleshooting

If users still encounter "User not found" errors:

1. **Check Browser Console**: Look for any JavaScript errors
2. **Verify Supabase Connection**: Ensure `supabase.auth.getUser()` is returning a user
3. **Check User Profile**: Verify the user exists in the `profiles` table in Supabase
4. **Clear Session**: Ask user to:
   - Clear browser cache
   - Log out completely
   - Log in again
   - Try submitting again

## Future Improvements

1. **Guest Submission Support**: Currently all RFQs require authentication. In future, we could support guest submissions with email/phone verification.

2. **Session Management**: Add explicit session timeout handling with countdown timer before expiration.

3. **Error Recovery**: Add "Go back to auth" button that automatically appears if authentication fails.

4. **Audit Logging**: Log failed authentication attempts for security monitoring.

## Summary

This fix ensures that:
- ✅ Users MUST be authenticated before submitting RFQs
- ✅ Clear error messages guide users to authenticate
- ✅ No null userId values are sent to the API
- ✅ Edge cases like session expiry are handled
- ✅ Better error messages for debugging
