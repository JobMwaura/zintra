# 🔍 Quick SQL Query - Check If New Vendor Exists

**Run this in Supabase SQL Editor:**

```sql
-- Step 1: Switch to postgres role to bypass RLS
SET ROLE postgres;

-- Step 2: Check recent vendors (ordered by creation date)
SELECT 
  id, 
  company_name, 
  email, 
  user_id, 
  created_at,
  updated_at
FROM vendors
ORDER BY created_at DESC
LIMIT 10;
```

---

## What This Does:

1. `SET ROLE postgres;` - Bypasses Row Level Security so you can see ALL vendors
2. `SELECT ... FROM vendors` - Gets vendor data
3. `ORDER BY created_at DESC` - Newest vendors first
4. `LIMIT 10` - Shows last 10 vendors created

---

## What to Look For:

### ✅ **If Your Vendor APPEARS:**

You'll see something like:

```
id                                    | company_name  | email           | user_id        | created_at
--------------------------------------|---------------|-----------------|----------------|-------------------
abc-123-def-456...                   | My Company    | me@example.com  | user-789...    | 2026-01-16 10:30:00
```

**This means:**
- ✅ Vendor was created successfully
- ✅ It's in the database
- ❌ But RLS is hiding it from normal view

**Next step:** Run the RLS fix below

---

### ❌ **If Your Vendor DOESN'T APPEAR:**

**This means:**
- ❌ Vendor creation failed
- ❌ It never got saved to database

**Next steps:**
1. Check browser console for errors
2. Check Network tab for API response
3. Try creating vendor again and watch for errors

---

## If Vendor Exists - Fix RLS Policy

**Run this SQL to allow viewing:**

```sql
-- Allow all authenticated users to view vendors
DROP POLICY IF EXISTS "vendors_select_authenticated" ON public.vendors;

CREATE POLICY "vendors_select_authenticated" ON public.vendors
  FOR SELECT
  USING (true);
```

---

## If You Want to See Just YOUR Vendor

```sql
-- Replace 'your@email.com' with your actual email
SET ROLE postgres;
SELECT 
  id, 
  company_name, 
  email, 
  user_id, 
  created_at
FROM vendors
WHERE email = 'your@email.com';
```

---

## Complete RLS Fix (If Needed)

If vendors exist but you can't see them, run this complete fix:

```sql
-- Step 1: Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Step 2: Allow viewing
DROP POLICY IF EXISTS "vendors_select_authenticated" ON public.vendors;
CREATE POLICY "vendors_select_authenticated" ON public.vendors
  FOR SELECT
  USING (true);

-- Step 3: Allow service role to insert
DROP POLICY IF EXISTS "vendors_insert_service_role" ON public.vendors;
CREATE POLICY "vendors_insert_service_role" ON public.vendors
  FOR INSERT
  WITH CHECK (true);

-- Step 4: Allow vendors to update their own profile
DROP POLICY IF EXISTS "vendors_update_own" ON public.vendors;
CREATE POLICY "vendors_update_own" ON public.vendors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 5: Verify policies exist
SELECT 
  policyname, 
  cmd, 
  tablename
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;
```

---

## Summary

**Just run these two lines first:**

```sql
SET ROLE postgres;
SELECT id, company_name, email, user_id, created_at FROM vendors ORDER BY created_at DESC LIMIT 10;
```

Then tell me:
- **Do you see your vendor?** (Yes/No)
- **What's the company_name?**
- **What's the email?**

This will tell us if it's an RLS issue or a creation failure! 🎯
