# 🔐 RLS Policy Fix - User Registration

## 🚨 The Problem

Error: `❌ Error updating profile: new row violates row-level security policy for table "users"`

**What this means**: The database has Row-Level Security (RLS) enabled on the users table, and it's blocking the INSERT/UPDATE operation because:
1. The policy is too strict
2. The user doesn't have permission to insert their own row
3. Missing policy for the INSERT operation

## ✅ The Solution

Row-Level Security needs to be **configured properly for registration**, not disabled.

### Option 1: Check Current RLS Policies (Recommended First)

Run this query to see what RLS policies exist:

```sql
-- Check RLS status on users table
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- Check what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

**Expected output**: Shows if RLS is enabled and what policies exist

---

### Option 2: Disable RLS Temporarily (Quick Fix)

If you want to get registration working immediately, disable RLS:

```sql
-- Disable RLS on users table temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

⚠️ **Warning**: This removes all row-level security restrictions. Only use temporarily for testing.

---

### Option 3: Fix RLS with Proper Policies (Recommended)

This is the **correct solution** - allows users to insert/update their own rows:

```sql
-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies (if any)
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- Create policy: Users can insert their own row during registration
CREATE POLICY "Users can insert own data"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policy: Users can view their own data
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policy: Anyone can view all users (for browsing)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.users
  FOR SELECT
  USING (true);
```

---

## 🚀 Which Option to Choose?

| Option | Use Case | Security |
|--------|----------|----------|
| **Option 1** | Just checking what's there | ✅ Safe, read-only |
| **Option 2** | Quick testing/debugging | ❌ Low (temporary only) |
| **Option 3** | Production use | ✅ High (recommended) |

### **For Registration to Work**: Use **Option 3**

---

## 📋 Step-by-Step Instructions

### Step 1: Check Current Policies (Recommended)

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Run the queries from **Option 1** above
4. See what policies already exist
5. Note any existing policy names

### Step 2: Remove Old Policies

If any policies exist, you may need to drop them first:

```sql
-- List all policies
SELECT policyname FROM pg_policies WHERE tablename = 'users';

-- Drop each one (replace POLICY_NAME with actual names)
DROP POLICY IF EXISTS "POLICY_NAME" ON public.users;
```

### Step 3: Run the Proper RLS Setup

Copy the **Option 3** SQL above and run it in the SQL Editor.

### Step 4: Verify Policies

Run this to confirm policies are set:

```sql
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

**Expected**: Should see 4 policies:
- `Users can insert own data`
- `Users can view own data`
- `Users can update own data`
- `Public profiles are viewable by everyone`

### Step 5: Test Registration

Go to: https://zintra-sandy.vercel.app/user-registration

Try the full flow - should work now!

---

## 🔍 Why This Happens

**RLS (Row-Level Security)** is a PostgreSQL feature that restricts which rows users can access:

- ✅ **Good for**: Protecting sensitive data, ensuring privacy
- ❌ **Problem for registration**: Default policies might block new user inserts

**The fix**: Create a policy that says "Users can insert a row where the ID matches their auth ID"

```sql
WITH CHECK (auth.uid() = id)
```

This means: "Only insert allowed if the row's ID = the logged-in user's ID"

---

## ✨ After Running SQL

✅ Users can now insert their own row during registration
✅ Users can update their own profile  
✅ Users can only see their own data (privacy protected)
✅ Anyone can view basic public profiles (for browsing)

---

## 🆘 Troubleshooting

### Error: "policy already exists"
Drop the existing policy first, then create the new one:
```sql
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
```

### Error: "relation not found"
The users table might not exist. Create it first:
```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  bio TEXT
);
```

### Still getting RLS error after running SQL?
Make sure you ran **all 5 CREATE POLICY statements**. You need all of them for registration to work.

---

## 📊 Summary

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check current policies | See what exists |
| 2 | Drop old policies | Clean slate |
| 3 | Run Option 3 SQL | Create new policies |
| 4 | Verify with query | 4 policies visible |
| 5 | Test registration | ✅ Works! |

---

## 🎯 Next Steps

1. **Run Option 1** (check current policies)
2. **Run Option 3** (create proper policies)
3. **Run verification** (confirm 4 policies exist)
4. **Test registration** (should work now!)

Let me know the output from Option 1 and I can give you the exact SQL to run! 🚀
