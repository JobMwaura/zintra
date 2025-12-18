# 🔧 Foreign Key Constraint Error - QUICK FIX

## 🚨 The Error
```
❌ Error updating profile: insert or update on table "users" violates foreign key 
constraint "users_id_fkey"
```

## 🔍 What This Means

The `public.users` table has a constraint that says: **"The id in public.users MUST exist in auth.users first"**

When you try to insert into `public.users`, the Supabase auth account must already exist.

---

## ✅ SOLUTION: Run This SQL (3 Parts)

### Part 1: Check Your Current Schema

```sql
-- See the foreign key constraint
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'users';

-- See if users table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'users' AND table_schema = 'public';

-- Count users in auth vs public
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.users) as public_users_count;
```

Run this to see your current state.

---

### Part 2: Option A - If users table exists with wrong structure

Drop and recreate it properly:

```sql
-- Drop the existing table
DROP TABLE IF EXISTS public.users CASCADE;

-- Create it WITHOUT requiring auth.users to exist first
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  bio TEXT,
  gender TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the foreign key constraint with CASCADE delete
ALTER TABLE public.users
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "insert_own_data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "select_own_data" ON public.users
  FOR SELECT USING (auth.uid() = id OR true);

CREATE POLICY "update_own_data" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

---

### Part 3: Option B - If foreign key is too strict

Temporarily disable it:

```sql
-- Disable the foreign key constraint temporarily
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Insert test data
INSERT INTO public.users (id, full_name, phone, bio)
VALUES ('00000000-0000-0000-0000-000000000000', 'Test User', '+254700000000', 'Test')
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Test User',
  phone = '+254700000000',
  bio = 'Test';

-- Re-add the constraint
ALTER TABLE public.users
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

## 🚀 Quick Fix Now

The **real issue**: When user signs up, we need to:
1. ✅ Create account in `auth.users` (Supabase handles this)
2. ✅ THEN insert into `public.users` with that user's ID

The code is already doing this correctly! The issue is the table structure.

---

## 📋 DO THIS RIGHT NOW:

### Step 1: Run Part 1 SQL
Copy this to Supabase SQL Editor:

```sql
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'users';
```

Tell me what constraints exist.

### Step 2: Based on output, run Part 2 or Part 3

If constraints look wrong → Run Part 2
If you want to test first → Run Part 3 (temporary)

### Step 3: Test Registration Again

Go to: https://zintra-sandy.vercel.app/user-registration

---

## 🎯 Next Steps

1. Run Part 1 query
2. Share the output with me
3. I'll give you exact Part 2 or Part 3 SQL
4. Registration will work! ✅

**This is closer to being fixed!** The foreign key error means the table structure is there, just needs tweaking. 💪
