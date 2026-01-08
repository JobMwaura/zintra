# 🔴 CRITICAL: 422 Unprocessable Content Error During Vendor Signup

## The Problem

**Error:** `POST https://zeomgqlnztcdqtespsjx.supabase.co/auth/v1/signup 422 (Unprocessable Content)`

**What it means:**
- Supabase received your signup request
- But the data you sent was **invalid or malformed**
- Status 422 = "I understand the request, but it contains invalid data"

---

## Root Causes of 422 Errors

### Cause #1: Missing Required Fields
```javascript
// ❌ WRONG: Missing required fields
await supabase.auth.signUp({
  email: formData.email,  // ✅ Present
  // password: missing!    // ❌ MISSING - Required!
});

// ✅ CORRECT: Both required fields
await supabase.auth.signUp({
  email: formData.email,     // ✅ Must be valid email
  password: formData.password // ✅ Must be 8+ characters
});
```

### Cause #2: Invalid Email Format
```javascript
// ❌ WRONG: Email format invalid
email: "not-an-email"        // ❌ Missing @ and domain
email: " test@example.com "  // ❌ Whitespace (unfixed)
email: ""                     // ❌ Empty

// ✅ CORRECT: Valid email
email: "test@example.com"    // ✅ Standard format
email: formData.email.trim() // ✅ Whitespace removed (already doing this!)
```

### Cause #3: Weak Password
```javascript
// ❌ WRONG: Password too weak
password: "123"              // ❌ Too short
password: "abcdefgh"         // ❌ No uppercase/numbers/symbols (if policy requires)

// ✅ CORRECT: Strong password
password: "MyPassword123!"   // ✅ 8+ chars, uppercase, number, symbol
```

### Cause #4: Supabase Config Issue
```javascript
// If email confirmation is REQUIRED in Supabase settings
// AND you're trying to sign up with a secondary email
// OR your Supabase provider settings don't allow signup
// → 422 error

// Solution: Check Supabase Authentication settings
```

---

## How to Debug This

### Step 1: Check Browser Console
```
Open DevTools: F12 or Cmd+Option+I
Go to Console tab
Look for error details
```

### Step 2: Log the Form Data Before Signup
Add this to `/app/vendor-registration/page.js` right before the signup call:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateStep()) return;
  setIsLoading(true);
  setMessage('');

  try {
    let userId = user?.id || null;
    let userEmail = user?.email || null;

    if (!user?.id) {
      // ============================================================================
      // DEBUG: Log what we're sending to Supabase
      // ============================================================================
      console.log('🔹 DEBUG: About to call auth.signUp with:', {
        email: formData.email.trim(),
        password: '***' + (formData.password.length > 3 ? formData.password.slice(-3) : '***'),
        emailLength: formData.email.trim().length,
        passwordLength: formData.password.length,
        hasAtSign: formData.email.includes('@'),
      });

      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (error) {
        console.error('❌ SIGNUP ERROR:', {
          message: error.message,
          status: error.status,
          code: error.code,
          details: error.details,
        });
        
        // ... rest of error handling
      }
```

### Step 3: Check Form Validation
Verify your validation function:

```javascript
const validateStep = () => {
  const errors = {};

  // ✅ Check email
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = 'Invalid email format';
  }

  // ✅ Check password
  if (!formData.password) {
    errors.password = 'Password required';
  } else if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  // ✅ Check confirm password
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  setErrors(errors);
  return Object.keys(errors).length === 0;
};
```

---

## Quick Fixes to Try

### Fix #1: Ensure Email is Valid & Trimmed
```javascript
// Current code (should be fine):
email: formData.email.trim()  // ✅ This removes whitespace

// But verify in form that email IS a valid email format
// Check: Does it have @ and a domain?
```

### Fix #2: Ensure Password Meets Requirements
```javascript
// Supabase usually requires:
// - At least 6 characters (you're doing 8+, good!)
// - No other specific requirements (usually)

// But some Supabase projects have stronger policies
// If you get 422 on password, try:
password: "SimplePassword123"  // Even simpler, still strong
```

### Fix #3: Check Supabase Email Provider Settings
**Go to:**
1. Supabase Dashboard
2. Authentication → Providers → Email
3. Look for:
   - ☑️ "Confirm email" - uncheck if causing issues
   - ☑️ "Enable email provider" - should be checked
   - Double-check email domain allowlist (if any)

### Fix #4: Verify API Is Receiving Correct Data
If you get past signup, the vendor creation might also throw 422.

Check `/app/api/vendor/create/route.js`:

```javascript
const body = await request.json();

// Log what we received
console.log('🔹 API received body:', {
  user_id: body.user_id,
  company_name: body.company_name,
  email: body.email,
  // ... check all required fields exist
});

// Validate required fields
if (!body.company_name || !body.email) {
  return NextResponse.json(
    { error: 'Company name and email are required' },
    { status: 400 }
  );
}
```

---

## Testing Steps

### Step 1: Test with Simple Credentials
```
Email: testvendor123@example.com
Password: TestPassword123!
Confirm: TestPassword123!

If this works → problem is with your form data
If this fails → problem is with Supabase config
```

### Step 2: Check Console Logs
After clicking "Complete Registration":
1. Open DevTools (F12)
2. Go to Console tab
3. Look for:
   - `🔹 DEBUG: About to call auth.signUp with:`
   - `❌ SIGNUP ERROR:` with details
4. Screenshot the exact error

### Step 3: Check Network Tab
In DevTools:
1. Go to Network tab
2. Filter for "signup"
3. Click the POST request to `/auth/v1/signup`
4. Look at:
   - Request body (what was sent)
   - Response body (what Supabase said)

---

## What to Check in Supabase

### Check #1: Email Provider Enabled
```
Supabase Dashboard
→ Authentication
→ Providers
→ Email
→ Make sure "Enabled" is toggled ON
```

### Check #2: Email Configuration
```
→ Email Auth
→ Confirm email: OFF (for development)
→ Confirm signup: OFF (for development)
→ Click "Save"
```

### Check #3: API Settings
```
→ API
→ Service Role Key: Check it's properly set in `.env.local`
→ Anon Key: Check it's in your public config
```

---

## The Exact Fix for Your Code

**File:** `/app/vendor-registration/page.js`

**Add debugging BEFORE the signup call:**

```javascript
if (!user?.id) {
  // Validate email and password BEFORE sending to Supabase
  const trimmedEmail = formData.email.trim().toLowerCase();
  
  if (!trimmedEmail || !formData.password) {
    setMessage('❌ Email and password are required');
    setIsLoading(false);
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    setMessage('❌ Please enter a valid email address');
    setIsLoading(false);
    return;
  }

  if (formData.password.length < 8) {
    setMessage('❌ Password must be at least 8 characters');
    setIsLoading(false);
    return;
  }

  console.log('🔹 Validation passed, attempting signup with:', {
    email: trimmedEmail,
    passwordLength: formData.password.length,
  });

  const { data, error } = await supabase.auth.signUp({
    email: trimmedEmail,        // ✅ Clean email
    password: formData.password, // ✅ Already validated
  });

  // ... rest of error handling
}
```

---

## If Still Getting 422

**Next Steps:**

1. **Clear browser cache:** Cmd+Shift+Delete
2. **Hard refresh:** Cmd+Shift+R
3. **Restart dev server:** Kill and `npm run dev`
4. **Check `.env.local`** for correct Supabase credentials
5. **Verify in Supabase Dashboard** that your project is active and not in readonly mode

---

## Common 422 Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Unable to parse" | Malformed JSON body | Ensure valid JSON |
| "Email missing" | No email in request | Add email field |
| "Password missing" | No password in request | Add password field |
| "Invalid email format" | Bad email | Use valid format: user@domain.com |
| "Password too weak" | Weak password | Use 8+ chars, mix of types |
| "Email already in use" | Account exists | Try signin instead |
| "Signup not allowed" | Provider disabled | Enable Email provider in Supabase |

---

## Summary

**422 means:** Your request body has invalid data

**Check:**
1. ✅ Email is trimmed and valid format
2. ✅ Password exists and is 8+ characters
3. ✅ No extra/invalid fields being sent
4. ✅ Supabase email provider is enabled
5. ✅ Email confirmation setting allows signups

**Test:** Try with `testvendor123@example.com` / `TestPassword123!`

**If still failing:** Share the exact error from DevTools console and we'll fix it together! 🚀
