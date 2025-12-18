# User Registration SQL Fix - Complete Schema Setup

## 🎯 Purpose
Set up the `users` table schema properly to support user registration with phone OTP verification and profile completion.

## ⚠️ Current Problem
Registration fails because columns referenced in the code don't exist in the users table:
- ❌ `email` - "Could not find the 'email' column"
- ❌ `updated_at` - "Could not find the 'updated_at' column"
- ❌ `phone_number` - Not in schema
- ❌ `phone_verified` - Not in schema
- ❌ `phone_verified_at` - Not in schema

## ✅ Solution: Run This SQL

### Step 1: Add Missing Columns to Users Table

Copy and paste this entire SQL block into **Supabase SQL Editor** and click **Run**:

```sql
-- ============================================
-- USER REGISTRATION SCHEMA FIX
-- Add missing columns for phone OTP verification
-- ============================================

-- Add email column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add phone-related columns if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number);

-- Create a trigger to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- Create the trigger
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

### Step 2: Verify the Schema

After running the SQL above, run this verification query to confirm all columns exist:

```sql
-- Check if all required columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('email', 'full_name', 'phone', 'phone_number', 'phone_verified', 'phone_verified_at', 'updated_at', 'bio')
ORDER BY column_name;
```

**Expected output**: 8 rows with columns:
- bio
- email
- full_name
- phone
- phone_number
- phone_verified
- phone_verified_at
- updated_at

## 🚀 Instructions

1. **Open Supabase Dashboard**
2. **Go to SQL Editor** (left sidebar)
3. **Click "New Query"**
4. **Paste the SQL code above** (the ALTER TABLE block)
5. **Click "Run"**
6. ✅ **Success!** You should see "Success. No rows returned."

## 📊 What This Does

| Column | Type | Purpose |
|--------|------|---------|
| `email` | TEXT | User's email (for future reference) |
| `phone` | TEXT | User's phone number |
| `phone_number` | VARCHAR(20) | Standardized phone format (e.g., +254721829148) |
| `phone_verified` | BOOLEAN | Whether phone is verified via OTP |
| `phone_verified_at` | TIMESTAMPTZ | When phone was verified |
| `updated_at` | TIMESTAMPTZ | When profile was last updated |

## ✨ Result After Running

✅ Users can now register without schema errors
✅ Phone OTP verification data saved
✅ Profile completion data saved
✅ timestamps tracked automatically
✅ All 4 registration steps work

## 🔧 Troubleshooting

### If you get "relation does not exist"
The users table hasn't been created yet. Run this first:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  bio TEXT,
  phone_number VARCHAR(20),
  phone_verified BOOLEAN DEFAULT false,
  phone_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### If you get "column already exists"
That's fine! The `IF NOT EXISTS` clause prevents errors. The query will skip columns that already exist.

### If indexes fail to create
Also fine! If an index already exists, it will skip it.

## 📝 Next Steps

After running this SQL:
1. ✅ SQL schema is ready
2. ✅ Users can now register
3. ✅ Phone OTP verification will work
4. ✅ Profiles can be saved

Test the registration flow on: https://zintra-sandy.vercel.app/user-registration
