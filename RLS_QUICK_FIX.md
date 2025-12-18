# 🚀 RLS Policy Fix - Quick Copy-Paste Solution

## The Problem
`❌ Error updating profile: new row violates row-level security policy for table "users"`

## The Solution
Copy and paste this entire SQL block into Supabase SQL Editor and click Run:

```sql
-- ============================================
-- FIX RLS POLICIES FOR USER REGISTRATION
-- ============================================

-- Step 1: Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- Step 3: Create new policies that allow registration

-- Policy 1: Users can INSERT their own row during registration
CREATE POLICY "Users can insert own data"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 2: Users can VIEW their own profile
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 3: Users can UPDATE their own profile
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Anyone can VIEW all public profiles (for vendor browsing)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.users
  FOR SELECT
  USING (true);

-- Step 4: Verify policies were created
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

## 📋 Instructions

1. **Open Supabase Dashboard**
2. **Go to SQL Editor** (left sidebar)
3. **Click "New Query"**
4. **Copy the entire SQL block above**
5. **Paste it into the SQL Editor**
6. **Click "Run"**
7. **See "Success. No rows returned."** ✅

## ✅ Verification

The last query in the SQL block will show you 4 policies:
- `Public profiles are viewable by everyone`
- `Users can insert own data`
- `Users can update own data`
- `Users can view own data`

If you see these 4, you're done! ✨

## 🎉 Result

After running this SQL:
✅ Users can insert their own profile during registration
✅ Users can update their own profile
✅ Users can only see their own private data
✅ Anyone can browse public profiles
✅ Registration works end-to-end!

## 🧪 Test It

Go to: https://zintra-sandy.vercel.app/user-registration

Complete all 4 steps - should work now! 🚀
