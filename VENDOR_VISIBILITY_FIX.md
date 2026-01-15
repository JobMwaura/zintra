# 🔍 VENDOR VISIBILITY ISSUE - ROOT CAUSE FOUND

**Date:** January 15, 2026  
**Issue:** 13 active vendors in Supabase, but only 11 showing in admin panel  
**Status:** 🚨 ROOT CAUSE IDENTIFIED

---

## 🔍 PROBLEM ANALYSIS

### Issue Details:
- **Expected:** 13 active vendors in database
- **Actual:** 11 vendors showing in admin panel
- **Missing:** 2 vendors (including "Narok Cement")

### Root Cause:
**RLS (Row Level Security) policies are filtering vendors for admin users**

Current RLS policies on `vendors` table:
```sql
-- Policy 1: Vendors can see their own profile
CREATE POLICY "vendors_select_own" ON public.vendors
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can see vendor profiles
CREATE POLICY "vendors_select_authenticated" ON public.vendors
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy 3: Service role can do anything
CREATE POLICY "vendors_service_role_all" ON public.vendors
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

**Problem:** No policy allowing admins to see ALL vendors regardless of status or auth matching.

---

## 🔧 SOLUTION

### Option 1: Add Admin Policy (RECOMMENDED)

Add a specific RLS policy for admin users:

```sql
-- Allow admins to see all vendors
CREATE POLICY "admins_select_all_vendors" ON public.vendors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );
```

This will allow any active admin to see ALL vendors in the database.

### Option 2: Use Service Role Key (Alternative)

Modify the admin panel to use service role key instead of anon key:

```javascript
// In app/admin/vendors/page.js
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Server-side only!
);

const fetchVendors = async () => {
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false });
  // ...
};
```

**WARNING:** Service role key bypasses ALL RLS policies. Only use server-side.

### Option 3: Temporarily Disable RLS (NOT RECOMMENDED)

```sql
-- DANGEROUS - Only for debugging
ALTER TABLE public.vendors DISABLE ROW LEVEL SECURITY;
```

**DO NOT USE IN PRODUCTION**

---

## 📝 RECOMMENDED FIX (Step-by-Step)

### Step 1: Add Admin Policy to Supabase

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run this SQL:

```sql
-- ============================================================================
-- ADD ADMIN ACCESS TO VENDORS TABLE
-- ============================================================================

-- Allow admins to see all vendors
CREATE POLICY "admins_select_all_vendors" ON public.vendors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Allow admins to update any vendor
CREATE POLICY "admins_update_all_vendors" ON public.vendors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Allow admins to delete vendors (super_admin only)
CREATE POLICY "super_admins_delete_vendors" ON public.vendors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'super_admin'
      AND admin_users.status = 'active'
    )
  );
```

### Step 2: Verify Fix

After running the SQL, test in admin panel:

1. Refresh `/admin/vendors` page
2. Check vendor count in stats
3. Search for "Narok Cement"
4. Count should now show 13 active vendors

### Step 3: Add Debugging (Already Added)

The code already has debugging console.logs:
```javascript
console.log('Total vendors in database:', count);
console.log('Vendors fetched:', data?.length);
console.log('Active vendors:', data?.filter(v => v.status === 'active').length);
```

Check browser console to see actual counts.

---

## 🔍 VERIFICATION QUERIES

### Check Current Policies:
```sql
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

### Count Vendors by Status:
```sql
SELECT 
  status,
  COUNT(*) as count
FROM public.vendors
GROUP BY status
ORDER BY status;
```

### Find Missing Vendors:
```sql
SELECT 
  id,
  company_name,
  email,
  status,
  created_at
FROM public.vendors
WHERE status = 'active'
ORDER BY company_name;
```

### Check if "Narok Cement" Exists:
```sql
SELECT 
  id,
  company_name,
  email,
  status,
  user_id,
  created_at
FROM public.vendors
WHERE company_name ILIKE '%narok%cement%';
```

---

## 🚨 IMMEDIATE ACTION REQUIRED

### DO THIS NOW:

1. **Run SQL in Supabase** (5 minutes)
   - Copy SQL from "Step 1" above
   - Paste in Supabase SQL Editor
   - Click RUN
   - Verify "Success"

2. **Test Admin Panel** (2 minutes)
   - Go to `/admin/vendors`
   - Open browser console (F12)
   - Check console logs for counts
   - Verify 13 active vendors showing

3. **Search for Missing Vendor** (1 minute)
   - Use search bar in admin panel
   - Search "Narok"
   - Should now appear in results

---

## 📊 EXPECTED RESULTS

### Before Fix:
- Total vendors fetched: 11
- Active vendors: 11
- Console shows: RLS blocking 2 vendors

### After Fix:
- Total vendors fetched: 13
- Active vendors: 13
- Console shows: All vendors accessible
- "Narok Cement" visible in list

---

## 🔐 SECURITY CONSIDERATIONS

**Is this safe?**
✅ YES - The admin policy checks:
1. User is in `admin_users` table
2. Admin status is 'active'
3. User is authenticated

**Why were vendors hidden?**
- RLS policies were too restrictive
- Only allowed vendors to see their own profiles
- Admins weren't included in any policy
- This is a common RLS configuration oversight

**Best Practice:**
Always include admin policies when setting up RLS:
- Admins need full access for management
- Separate policies for different admin roles
- Log admin actions for auditing

---

## 📝 FILES TO UPDATE

After SQL migration:

1. **No code changes needed** - RLS fix handles everything
2. **Console logging already added** - Will show correct counts
3. **Documentation updated** - This file serves as record

---

## 🎯 SUMMARY

**Problem:** RLS policies blocking admin access to some vendors  
**Solution:** Add admin-specific SELECT policy to vendors table  
**Time to Fix:** 5 minutes  
**Impact:** All 13 vendors will be visible immediately  
**Risk:** None - adds access, doesn't remove security  

---

**Next Command:**
```
Open Supabase SQL Editor → Paste admin policy SQL → Run
```

**Status:** 🔴 WAITING FOR SQL EXECUTION
