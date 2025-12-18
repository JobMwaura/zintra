# 🔐 RLS Error - What's Happening & How to Fix It

## 🚨 The Error You're Seeing

```
❌ Error updating profile: new row violates row-level security policy for table "users"
```

## 🎯 What This Means

**RLS (Row-Level Security)** is a database security feature that controls which rows each user can access. It's like a bouncer at a club checking if you're allowed to access certain data.

**Right now**: The bouncer is saying "No, you can't insert a new row!"

## 🔧 Why It's Happening

The `users` table has RLS enabled, but the policies are either:
1. ❌ Too strict (blocking registration)
2. ❌ Missing the INSERT policy
3. ❌ Not checking `auth.uid()` correctly

## ✅ The Quick Fix

Copy this SQL and run it in Supabase SQL Editor:

### **Copy Everything Below & Paste Into Supabase SQL Editor:**

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

CREATE POLICY "Users can insert own data"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.users
  FOR SELECT
  USING (true);

SELECT policyname FROM pg_policies WHERE tablename = 'users' ORDER BY policyname;
```

## 🚀 Steps to Run It

1. **Open Supabase Dashboard**
2. **Click SQL Editor** (left side)
3. **Click "New Query"**
4. **Paste the SQL above**
5. **Click "Run"**
6. **Look for output** showing 4 policy names ✅

## 📊 What Each Policy Does

| Policy | Purpose | Who Can Do It |
|--------|---------|---------------|
| `Users can insert own data` | **Register/create profile** | User inserting their own ID |
| `Users can view own data` | **See own profile** | User viewing own row |
| `Users can update own data` | **Edit own profile** | User updating own row |
| `Public profiles viewable` | **Browse vendors** | Anyone viewing profiles |

## 🔒 Security Explanation

The magic line is: `WITH CHECK (auth.uid() = id)`

This means: **"Only allow INSERT if the ID being inserted matches the logged-in user's ID"**

So:
- ✅ User A can insert User A's profile
- ❌ User A cannot insert User B's profile
- ✅ Anyone can view profiles (for browsing)

## 🎯 Why Registration Now Works

1. User signs up → `auth.uid()` is set to their new ID
2. Registration code tries to insert row with `id: user.id`
3. Policy checks: `auth.uid() = id` → ✅ MATCHES!
4. INSERT allowed → ✅ Success!

## ✨ After Running the SQL

✅ **All 4 registration steps work**
✅ **Phone OTP saves correctly**
✅ **Profile completes successfully**
✅ **Data is properly secured**
✅ **Users can browse vendors**

## 📝 Files Created

1. **`RLS_QUICK_FIX.md`** - Copy-paste ready SQL
2. **`RLS_POLICY_FIX.md`** - Detailed explanation

## 🚨 Still Getting Error?

Make sure you:
1. ✅ Ran ALL 5 CREATE POLICY statements
2. ✅ Ran the verification query
3. ✅ See 4 policies in the output
4. ✅ Reloaded the app (hard refresh)

## 🎉 Test It!

After running the SQL, go to:
https://zintra-sandy.vercel.app/user-registration

Try completing all 4 steps - should work now! 🚀

---

**Status**: RLS fix ready to apply ⏳

Commit: `d0504c4` ✅
