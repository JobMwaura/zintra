## Vendor Redirect Issue - Console Message Decoder

### What to Look For in the Browser Console

When you visit https://zintra-sandy.vercel.app/careers while logged in, you should see console messages that tell you exactly what's happening with the redirect logic.

---

## Console Message Decoder

### 🟢 SUCCESS - Full Redirect Chain (User Should Be Able to Post Jobs)

```
[HeroSearch] Starting to load redirect paths...
User logged in: 550e8400-e29b-41d4-a716-446655440000
User is employer, checking vendors table...
Vendor found: {
  id: "xyz123",
  company_name: "John's Construction",
  phone_verified: true,
  email_verified: true
}
Vendor fully verified, redirecting to: /careers/post-job
[HeroSearch] Loaded paths: {jobPath: '/careers/post-job', gigPath: '/careers/post-gig'}
```

**Meaning**: ✅ Everything working! Verified vendor will be sent to the job posting form.

**Action**: Click "Post a Job" button - it should go to `/careers/post-job`

---

### 🟠 PARTIAL - Phone Verification Missing

```
[HeroSearch] Starting to load redirect paths...
User logged in: 550e8400-e29b-41d4-a716-446655440000
User is employer, checking vendors table...
Vendor found: {
  id: "xyz123",
  company_name: "John's Construction",
  phone_verified: false,
  email_verified: true
}
Phone not verified, redirecting to: /careers/post-job?verify=phone
[HeroSearch] Loaded paths: {jobPath: '/careers/post-job?verify=phone', gigPath: '/careers/post-gig'}
```

**Meaning**: ⚠️ Vendor exists and email is verified, but phone number isn't verified yet.

**Action**: Click "Post a Job" → See phone verification modal → Verify phone → Then post

---

### 🟠 PARTIAL - Email Verification Missing

```
[HeroSearch] Starting to load redirect paths...
User logged in: 550e8400-e29b-41d4-a716-446655440000
User is employer, checking vendors table...
Vendor found: {
  id: "xyz123",
  company_name: "John's Construction",
  phone_verified: true,
  email_verified: false
}
Email not verified, redirecting to: /careers/post-job?verify=email
[HeroSearch] Loaded paths: {jobPath: '/careers/post-job?verify=email', gigPath: '/careers/post-gig'}
```

**Meaning**: ⚠️ Vendor exists and phone is verified, but email isn't verified yet.

**Action**: Click "Post a Job" → See email verification modal → Verify email → Then post

---

### 🔴 FAILURE - No User Logged In

```
[HeroSearch] Starting to load redirect paths...
No user logged in, returning /vendor-registration
[HeroSearch] Loaded paths: {jobPath: '/vendor-registration', gigPath: '/vendor-registration'}
```

**Meaning**: ❌ Supabase auth couldn't find a logged-in user

**Cause**: 
- User is not authenticated
- Session cookie expired
- Auth context not loaded

**Fix**:
1. Log out completely
2. Log back in
3. Wait 2-3 seconds before clicking the button
4. Try again

**To Test**: Log out first, then try accessing the page

---

### 🔴 FAILURE - User Not Marked as Employer

```
[HeroSearch] Starting to load redirect paths...
User logged in: 550e8400-e29b-41d4-a716-446655440000
User is not employer, returning /vendor-registration
[HeroSearch] Loaded paths: {jobPath: '/vendor-registration', gigPath: '/vendor-registration'}
```

**Meaning**: ❌ User is logged in but profile doesn't have `is_employer = true`

**Cause**:
- Registration flow didn't set the employer flag
- User was created as candidate, not employer
- Profile record is incomplete

**Fix**: Check database
```sql
-- Check current employer status
SELECT id, is_employer FROM public.profiles WHERE id = auth.uid();

-- If is_employer is false/null, update it:
UPDATE public.profiles SET is_employer = true WHERE id = auth.uid();
```

---

### 🔴 FAILURE - No Vendor Record Found

```
[HeroSearch] Starting to load redirect paths...
User logged in: 550e8400-e29b-41d4-a716-446655440000
User is employer, checking vendors table...
Vendor query error: {code: "PGRST116", message: "..." }
No vendor record found (PGRST116), redirecting to registration
[HeroSearch] Loaded paths: {jobPath: '/vendor-registration', gigPath: '/vendor-registration'}
```

**Meaning**: ❌ User is marked as employer, but no vendor record exists in the database

**Cause**:
- Registration form didn't create the vendor record
- Vendor record was deleted
- User was marked as employer without going through vendor registration

**Fix**: Create vendor record
```sql
-- Create missing vendor record
INSERT INTO public.vendors (user_id, company_name, phone_verified, email_verified)
VALUES (
  auth.uid(),
  'Your Company Name Here',
  false,
  false
);
```

Then go through phone and email verification process.

---

### 🔴 FAILURE - Vendor Query Blocked (RLS Policy Issue)

```
[HeroSearch] Starting to load redirect paths...
User logged in: 550e8400-e29b-41d4-a716-446655440000
User is employer, checking vendors table...
Vendor query error: {code: "PGRST100", message: "relation \"vendors\" does not exist" }
Vendor query failed, assuming vendor not setup: relation "vendors" does not exist
[HeroSearch] Loaded paths: {jobPath: '/vendor-registration', gigPath: '/vendor-registration'}
```

**Meaning**: ❌ Database query failed - either RLS policy is blocking or table doesn't exist

**Cause**:
- RLS (Row Level Security) policy on vendors table is too restrictive
- Database table doesn't exist (unlikely)
- Missing permissions

**Fix**: Check RLS policy in Supabase
```sql
-- View all RLS policies on vendors table
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;
```

The policy should allow authenticated users to read their own vendor record:
```sql
-- Example of good RLS policy
CREATE POLICY "Allow users to select own vendor"
ON public.vendors
FOR SELECT
USING (auth.uid() = user_id);
```

---

### 🔴 FAILURE - Auth Error During Session Check

```
[HeroSearch] Starting to load redirect paths...
Auth error in getEmployerRedirectPath: {code: "..." }
[HeroSearch] Loaded paths: {jobPath: '/vendor-registration', gigPath: '/vendor-registration'}
```

**Meaning**: ❌ Supabase returned an auth error when checking session

**Cause**:
- Session is invalid/expired
- Auth service is down
- Network issue
- Supabase keys are misconfigured

**Fix**:
1. Clear browser cookies: DevTools → Application → Cookies → Delete all
2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Log in again
4. Try the button again

---

## Full Error Diagnosis Flowchart

```
Start: Click "Post a Job" button
  ↓
[Check Console Logs]
  ├─ No logs at all?
  │  └─ Components may not be loaded. Wait 2-3 seconds and try again.
  │
  ├─ "No user logged in"?
  │  └─ GO TO: "User Not Logged In" fix above
  │
  ├─ "User is not employer"?
  │  └─ GO TO: "User Not Marked as Employer" fix above
  │
  ├─ "No vendor record found (PGRST116)"?
  │  └─ GO TO: "No Vendor Record Found" fix above
  │
  ├─ "Vendor query failed"?
  │  └─ GO TO: "Vendor Query Blocked (RLS)" fix above
  │
  ├─ "Auth error"?
  │  └─ GO TO: "Auth Error During Session Check" fix above
  │
  ├─ "Vendor fully verified, redirecting to: /careers/post-job"?
  │  └─ ✅ SUCCESS - Everything is working!
  │
  └─ Something else?
     └─ Copy the exact console message and share it for debugging
```

---

## Quick Diagnostic Checklist

Run these in browser console while on /careers page:

```javascript
// 1. Check if user is logged in
const { data } = await (await import('@/lib/supabase/client')).createClient().auth.getUser();
console.log('Current user:', data?.user?.id);

// 2. Check if user is marked as employer
const profiles = await (await import('@/lib/supabase/client')).createClient()
  .from('profiles')
  .select('is_employer')
  .eq('id', data?.user?.id)
  .single();
console.log('Is employer:', profiles.data?.is_employer);

// 3. Check if vendor record exists
const vendors = await (await import('@/lib/supabase/client')).createClient()
  .from('vendors')
  .select('*')
  .eq('user_id', data?.user?.id)
  .single();
console.log('Vendor record:', vendors.data);
console.log('Vendor error:', vendors.error);
```

---

## Video Guide (if applicable)

When testing, record the following:
1. Browser console output (F12 → Console tab)
2. The URL you're redirected to
3. Whether verification modal appears (for partial verification cases)
4. Error messages if any appear in red

---

## Contact Support

If you see an error message that's not listed above, please:
1. Take a screenshot of the console output
2. Note the exact error message
3. Share your user ID or username
4. Provide the browser you're using (Chrome, Safari, Firefox, etc.)

This will help debug the specific issue quickly!

