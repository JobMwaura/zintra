# 🔐 FIX: Vendor Registration RLS Policy Error

## Problem

When vendors try to complete registration and create their vendor profile, they get:

```
❌ Error: new row violates row-level security policy for table "vendors"
```

This happens because the `vendors` table has RLS enabled, but the policy only allows:
- `SELECT` (read own profile)
- `UPDATE` (update own profile)

**Missing:** `INSERT` policy (create new vendor record)

---

## Root Cause

Current RLS policies on `vendors` table:

```sql
CREATE POLICY "Vendors update own profile" ON vendors FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Vendors see own profile" ON vendors FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "See approved vendors" ON vendors FOR SELECT 
  USING (is_approved = true);
```

**Missing:** Policy for INSERT operation

---

## Solution

Add INSERT policy to allow vendors to create their own profile:

```sql
-- Allow vendors to INSERT their own profile during registration
CREATE POLICY "Vendors can create own profile" 
  ON public.vendors FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

---

## How to Fix (Supabase Dashboard)

### Option 1: GUI (Easier)

1. Go to **Supabase Dashboard**
2. Click **Table Editor** → Select `vendors` table
3. Click **RLS Policies** tab
4. Click **New Policy** button
5. Fill in:
   - **Policy Name:** `Vendors can create own profile`
   - **Target roles:** `authenticated`
   - **Operation:** `INSERT`
   - **Check:** `user_id = auth.uid()`
6. Click **Review** → **Save policy**

### Option 2: SQL (Faster)

Copy and paste this into **Supabase SQL Editor**:

```sql
-- ============================================================================
-- FIX: Add missing INSERT policy to vendors table
-- ============================================================================

-- Allow vendors to create their own profile during registration
CREATE POLICY "Vendors can create own profile" 
  ON public.vendors FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Verify policy was created
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;

-- Expected output: Should show the new policy plus existing ones
```

---

## Verification

After adding the policy, run this query to verify:

```sql
-- Check all RLS policies on vendors table
SELECT 
  policyname as policy_name,
  permissive,
  (SELECT string_agg(rolname, ', ') FROM pg_roles WHERE oid = ANY(roles)) as applicable_roles,
  qual as select_condition,
  with_check as insert_condition
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;
```

**Expected output:**

```
                    policy_name                    | permissive |    applicable_roles    | select_condition | insert_condition
────────────────────────────────────────────────────┼────────────┼───────────────────────┼──────────────────┼─────────────────
See approved vendors                               | t          | authenticated          | is_approved = true | (null)
Vendors can create own profile                     | t          | authenticated          | (null)           | (auth.uid() = user_id)
Vendors see own profile                            | t          | authenticated          | (auth.uid() = user_id) | (null)
Vendors update own profile                         | t          | authenticated          | (auth.uid() = user_id) | (null)
```

**Key points:**
- ✅ 4 policies total (was 3)
- ✅ "Vendors can create own profile" exists
- ✅ `insert_condition` = `(auth.uid() = user_id)`
- ✅ All have `permissive = true`

---

## Test the Fix

After applying the policy:

1. **Sign out** (if currently logged in)
2. **Go to:** https://yoursitecom/vendor-signup
3. **Fill in form** and click **Complete Registration**
4. **Expected:** Should successfully create vendor profile ✅
5. **If error still appears:** Clear browser cache and try again

---

## Why This Fix Works

### Before (Broken)
```
User fills vendor form → Submit → API tries: INSERT INTO vendors...
                                    ↓
                        RLS checks: "Is there a policy for INSERT?"
                                    ↓
                        "NO POLICY FOUND"
                                    ↓
                    ❌ Access Denied: "violates row-level security policy"
```

### After (Fixed)
```
User fills vendor form → Submit → API tries: INSERT INTO vendors...
                                    ↓
                        RLS checks: "Is there a policy for INSERT?"
                                    ↓
                        "YES - Vendors can create own profile"
                                    ↓
                        Checks: auth.uid() = user_id ?
                                    ↓
                        ✅ YES → INSERT succeeds → Vendor created
```

---

## What This Policy Allows

```sql
WITH CHECK (auth.uid() = user_id)
```

This means:

- ✅ Authenticated users CAN insert a vendor record where `user_id = their auth ID`
- ❌ Authenticated users CANNOT insert vendor records for other users
- ❌ Unauthenticated users CANNOT insert any records

**Security:** This is safe! Users can only create a vendor profile for themselves.

---

## Complete RLS Policy Set for Vendors Table

After fix, your vendors table should have these 4 policies:

```sql
-- Policy 1: Vendors can see their own profile
CREATE POLICY "Vendors see own profile" 
  ON public.vendors FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy 2: Vendors can update their own profile
CREATE POLICY "Vendors update own profile" 
  ON public.vendors FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy 3: ✨ NEW - Vendors can create their own profile (FIX)
CREATE POLICY "Vendors can create own profile" 
  ON public.vendors FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Everyone can see approved/public vendors
CREATE POLICY "See approved vendors" 
  ON public.vendors FOR SELECT 
  USING (is_approved = true);
```

---

## FAQ

**Q: Why do we need the `is_approved` policy if INSERT is restricted?**  
A: For the Browse/Search page. Users need to see all vendors, but each vendor can only edit their own. The `is_approved` policy is separate.

**Q: Is this safe?**  
A: Yes! The `WITH CHECK (auth.uid() = user_id)` means users can ONLY create a vendor record for themselves, not for others.

**Q: Will this affect existing vendors?**  
A: No! This only affects new registrations (INSERT operations). Existing vendors' UPDATE/SELECT policies unchanged.

**Q: Do I need to restart the app?**  
A: No! RLS policies take effect immediately in Supabase.

**Q: What if I want to delete the policy later?**  
A: You can drop it:
```sql
DROP POLICY IF EXISTS "Vendors can create own profile" ON public.vendors;
```

---

## Related Documentation

- **Similar Issue:** `RLS_FIX_GUIDE.md` - RLS policies for quote submissions
- **Security Overview:** `SUPABASE_EXECUTION_GUIDE.md` - Complete RLS setup
- **Vendor Registration:** `app/vendor-registration/page.js` - Frontend code

---

## Summary

| Item | Status |
|------|--------|
| **Problem** | ❌ Missing INSERT policy on vendors table |
| **Impact** | Vendor registration fails |
| **Fix** | Add 1 RLS policy (2 lines of SQL) |
| **Time** | <1 minute |
| **Risk** | NONE (only adds missing security) |
| **Breaking** | NO (existing policies unchanged) |

---

**Status: Ready to Apply** ✅

Apply this fix now to enable vendor registration!

