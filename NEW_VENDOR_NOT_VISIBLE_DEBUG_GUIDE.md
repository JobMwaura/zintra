# 🔍 New Vendor Not Visible in Supabase - Diagnostic Guide

**Issue:** Created a new vendor profile but it doesn't appear in the vendors table in Supabase

---

## 🎯 Quick Diagnosis Steps

### **Step 1: Check if Vendor Was Actually Created**

Run this SQL in Supabase SQL Editor:

```sql
-- Check if vendor exists (bypassing RLS)
SET ROLE postgres;
SELECT id, company_name, email, user_id, created_at
FROM vendors
ORDER BY created_at DESC
LIMIT 10;
```

**Results:**

✅ **Vendor APPEARS** → RLS policy is hiding it from you (go to Step 2)  
❌ **Vendor DOESN'T APPEAR** → Creation failed (go to Step 3)

---

### **Step 2: Check RLS Policies (If Vendor Exists)**

```sql
-- Check current RLS policies on vendors table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;
```

**Look for these policies:**

✅ `vendors_select_authenticated` - Allows all authenticated users to see vendors  
✅ `vendors_insert_service_role` - Allows service role to create vendors  
✅ `admins_select_all_vendors` - Allows admins to see all vendors

**If missing** → Run the fix SQL (Step 2b below)

---

### **Step 2b: Fix RLS Policies**

```sql
-- Ensure authenticated users can view vendors
DROP POLICY IF EXISTS "vendors_select_authenticated" ON public.vendors;
CREATE POLICY "vendors_select_authenticated" ON public.vendors
  FOR SELECT
  USING (true);  -- Everyone can view vendors

-- Ensure service role can insert vendors
DROP POLICY IF EXISTS "vendors_insert_service_role" ON public.vendors;
CREATE POLICY "vendors_insert_service_role" ON public.vendors
  FOR INSERT
  WITH CHECK (true);  -- Service role can insert any vendor

-- Refresh and check again
```

---

### **Step 3: Check if Creation Failed (If Vendor Doesn't Exist)**

#### **A. Check Browser Console**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors during registration
4. Take screenshot of any red errors

#### **B. Check Network Tab**

1. Open DevTools → Network tab
2. Try creating vendor again
3. Look for `/api/vendor/create` request
4. Click on it → Check "Response" tab
5. Look for error message

**Common errors:**

```json
{
  "error": "A vendor with this email already exists"
}
```
→ Vendor already created, check Step 1 again

```json
{
  "error": "duplicate key value violates unique constraint"
}
```
→ Email or user_id already used

```json
{
  "error": "new row violates row-level security policy"
}
```
→ RLS policy blocking creation (go to Step 4)

---

### **Step 4: Check API is Using SERVICE_ROLE_KEY**

The API must use the service role key to bypass RLS.

**Check `/app/api/vendor/create/route.js`:**

```javascript
// ✅ CORRECT - Uses SERVICE_ROLE_KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // ← Should be SERVICE_ROLE
);

// ❌ WRONG - Uses ANON_KEY (RLS will block)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // ← Wrong key!
);
```

**If using ANON_KEY** → You need to change it to SERVICE_ROLE_KEY

---

## 🐛 Common Issues & Solutions

### **Issue 1: RLS Hiding Vendor from You**

**Symptom:**
- Vendor exists in database (Step 1 shows it)
- But you can't see it in Supabase table view
- Or can't see it in your app

**Cause:** RLS policy not allowing you to view

**Solution:**

```sql
-- Option A: Temporarily disable RLS (for testing only!)
ALTER TABLE public.vendors DISABLE ROW LEVEL SECURITY;

-- Option B: Add policy to allow viewing (recommended)
CREATE POLICY "vendors_select_authenticated" ON public.vendors
  FOR SELECT
  USING (true);

-- Option C: View as postgres role (bypasses RLS)
SET ROLE postgres;
SELECT * FROM vendors;
```

---

### **Issue 2: API Using Wrong Supabase Key**

**Symptom:**
- Browser console shows vendor creation success
- But vendor doesn't appear in database
- Or you get "new row violates row-level security policy" error

**Cause:** API using ANON_KEY instead of SERVICE_ROLE_KEY

**Solution:** Update `/app/api/vendor/create/route.js`:

```javascript
// Change from:
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// To:
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

---

### **Issue 3: Service Role Key Not Set**

**Symptom:**
- Server error 500
- Console shows: "Invalid API key" or "supabase client initialization failed"

**Cause:** `SUPABASE_SERVICE_ROLE_KEY` environment variable not set

**Solution:**

1. Get your service role key from Supabase:
   - Go to Supabase dashboard
   - Settings → API
   - Copy "service_role" key (secret)

2. Add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Restart your dev server:
   ```bash
   # Kill server
   Ctrl+C
   
   # Start again
   npm run dev
   ```

4. For production (Vercel):
   - Go to Vercel dashboard
   - Project → Settings → Environment Variables
   - Add `SUPABASE_SERVICE_ROLE_KEY`
   - Redeploy

---

### **Issue 4: Email Already Exists**

**Symptom:**
- Error: "A vendor with this email already exists"
- But you don't see the vendor in Supabase

**Cause:** Vendor was created previously but RLS is hiding it

**Solution:**

```sql
-- Find vendor with this email (bypass RLS)
SET ROLE postgres;
SELECT id, company_name, email, user_id, created_at
FROM vendors
WHERE email = 'your@email.com';

-- If you want to delete it and start fresh:
DELETE FROM vendors WHERE email = 'your@email.com';

-- Or update the user_id if you want to keep it:
UPDATE vendors 
SET user_id = 'your-current-user-id'
WHERE email = 'your@email.com';
```

---

### **Issue 5: user_id Not Set Correctly**

**Symptom:**
- Vendor created successfully
- But you can't see or edit it in your app
- Console shows: `canEdit: false`

**Cause:** vendor.user_id doesn't match your auth user ID

**Solution:**

```sql
-- Check what user_id was saved
SET ROLE postgres;
SELECT id, company_name, email, user_id
FROM vendors
WHERE email = 'your@email.com';

-- Get your actual user ID
SELECT id, email
FROM auth.users
WHERE email = 'your@email.com';

-- If they don't match, update vendor:
UPDATE vendors
SET user_id = 'correct-user-id-from-auth-users'
WHERE email = 'your@email.com';
```

---

## 📋 Complete Diagnostic Checklist

Run through these in order:

- [ ] **Step 1:** Check if vendor exists (SET ROLE postgres; SELECT * FROM vendors)
- [ ] **Step 2:** If exists, check RLS policies (SELECT * FROM pg_policies WHERE tablename='vendors')
- [ ] **Step 3:** If doesn't exist, check browser console for errors
- [ ] **Step 4:** Check Network tab for API response
- [ ] **Step 5:** Verify API uses SERVICE_ROLE_KEY
- [ ] **Step 6:** Verify SUPABASE_SERVICE_ROLE_KEY env var is set
- [ ] **Step 7:** Check if email already exists in auth.users
- [ ] **Step 8:** Verify user_id matches auth.users.id

---

## 🔧 Quick Fix Script

Run this SQL to fix the most common RLS issues:

```sql
-- Fix 1: Ensure vendors table has RLS enabled
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Fix 2: Allow all authenticated users to view vendors
DROP POLICY IF EXISTS "vendors_select_authenticated" ON public.vendors;
CREATE POLICY "vendors_select_authenticated" ON public.vendors
  FOR SELECT
  USING (true);

-- Fix 3: Allow service role to insert vendors
DROP POLICY IF EXISTS "vendors_insert_service_role" ON public.vendors;
CREATE POLICY "vendors_insert_service_role" ON public.vendors
  FOR INSERT
  WITH CHECK (true);

-- Fix 4: Allow vendors to update their own profile
DROP POLICY IF EXISTS "vendors_update_own" ON public.vendors;
CREATE POLICY "vendors_update_own" ON public.vendors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix 5: Allow admins to see all vendors
DROP POLICY IF EXISTS "admins_select_all_vendors" ON public.vendors;
CREATE POLICY "admins_select_all_vendors" ON public.vendors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Verify policies were created
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'vendors';
```

---

## 🎯 What Should Happen (Expected Behavior)

### **During Vendor Creation:**

1. User fills out vendor registration form
2. Frontend sends POST to `/api/vendor/create`
3. API uses SERVICE_ROLE_KEY to bypass RLS
4. Vendor inserted into database with:
   - `user_id` = current user's ID
   - `email` = user's email
   - `company_name`, etc.
5. API returns success with vendor ID
6. User redirected to their vendor profile

### **After Creation:**

1. Vendor appears in Supabase vendors table
2. You can view it as any authenticated user
3. You can edit it if your user_id matches vendor.user_id
4. Admins can see and edit it
5. Other users can view it but not edit

---

## 📊 Debug Output Examples

### **✅ WORKING - Vendor Created Successfully**

**Browser Console:**
```
POST /api/vendor/create 200 OK
Response: {
  "success": true,
  "message": "Vendor profile created successfully",
  "data": [{
    "id": "abc-123-...",
    "company_name": "My Company",
    "email": "me@example.com",
    "user_id": "user-456-..."
  }]
}
```

**Supabase SQL:**
```sql
SET ROLE postgres;
SELECT * FROM vendors WHERE email = 'me@example.com';

-- Result: 1 row showing your vendor ✅
```

---

### **❌ NOT WORKING - RLS Blocking**

**Browser Console:**
```
POST /api/vendor/create 400 Bad Request
Response: {
  "error": "new row violates row-level security policy for table \"vendors\""
}
```

**Solution:** API needs to use SERVICE_ROLE_KEY

---

### **❌ NOT WORKING - Email Exists**

**Browser Console:**
```
POST /api/vendor/create 409 Conflict
Response: {
  "error": "A vendor with this email already exists. Please sign in...",
  "vendorId": "existing-vendor-id"
}
```

**Solution:** Either login to existing vendor or use different email

---

## 📞 When to Contact Support

Contact support if:

- ✅ Ran all diagnostic steps
- ✅ Vendor doesn't appear in database (even with SET ROLE postgres)
- ✅ No errors in browser console
- ✅ API returns 200 success
- ✅ SERVICE_ROLE_KEY is set correctly
- ✅ But vendor still not in database

**Include in support request:**
1. Screenshot of browser console (Network tab showing API response)
2. Result of: `SET ROLE postgres; SELECT * FROM vendors WHERE email = 'your@email.com';`
3. Your email address used for registration
4. Timestamp of when you tried to register

---

## 🎉 Summary

**Most common cause:** RLS policy hiding vendor from you in Supabase UI

**Quick check:**
```sql
SET ROLE postgres;
SELECT * FROM vendors ORDER BY created_at DESC LIMIT 5;
```

**If vendor appears** → RLS issue, run the Quick Fix Script above  
**If vendor doesn't appear** → Creation failed, check API logs and browser console

---

**Last Updated:** January 16, 2026  
**Status:** Created to diagnose vendor visibility issues
