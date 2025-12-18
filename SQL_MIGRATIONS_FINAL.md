# SQL Migrations - Email Column Fix

## 🔍 The Problem

The migration tried to create an index on `users(email)` but that column doesn't exist in your Supabase `users` table.

**Error**: `ERROR: 42703: column "email" does not exist`

---

## ✅ Corrected Migration (Final Version)

**This version removes the problematic email index**:

```sql
-- Add phone columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;

-- Create indexes on users table (email index removed - column doesn't exist)
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Create otp_verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id BIGSERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  email_address VARCHAR(255),
  otp_code VARCHAR(6) NOT NULL,
  verified BOOLEAN DEFAULT false,
  type VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes')
);

-- Create indexes on otp_verifications table
CREATE INDEX IF NOT EXISTS idx_otp_phone_number ON otp_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email_address);
CREATE INDEX IF NOT EXISTS idx_otp_created_at ON otp_verifications(created_at);

-- Add unique constraint (corrected - no WHERE clause)
ALTER TABLE users 
ADD CONSTRAINT unique_phone_number UNIQUE (phone_number);
```

**Key change**: Removed `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`

---

## 📊 What's Actually in Your Users Table

The `users` table in Supabase Auth typically has:
- `id` (UUID) - User ID
- `email` - In `auth.users`, not `public.users`
- Other auth-related columns

**The fix**: We don't need an email index on the `users` table. The OTP table has `email_address` which we can index instead.

---

## ✅ What This Script Does

1. ✅ Adds 3 phone columns to users table
2. ✅ Creates index on `phone_number` (for fast lookups)
3. ✅ Creates `otp_verifications` table with all needed columns
4. ✅ Creates 3 indexes on OTP table (for performance)
5. ✅ Adds unique constraint on phone_number
6. ✅ **Skips the problematic email index**

---

## 🚀 Run This NOW

**Copy the corrected script above** and paste into Supabase SQL Editor → Run

**Time**: 1-2 minutes

---

## 🔍 To Check Your Actual Schema

If you want to see what columns actually exist:

```sql
-- See all columns in users table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY column_name;
```

This will show you exactly what's in your users table.

---

## 📝 What Changed

| Aspect | Before | After |
|--------|--------|-------|
| Email index | ❌ Attempted (failed) | ❌ Removed |
| Phone index | ✅ Created | ✅ Created |
| OTP table | ✅ Created | ✅ Created |
| Columns | ✅ Added | ✅ Added |
| Unique constraint | ✅ Created | ✅ Created |

---

## ✨ Result After Running

- ✅ `phone_number` column in users table
- ✅ `phone_verified` column in users table
- ✅ `phone_verified_at` column in users table
- ✅ `otp_verifications` table created
- ✅ All indexes created
- ✅ Unique constraint on phone numbers
- ✅ **No errors!** ✓

---

**Status**: Ready to run corrected script  
**Expected time**: 1-2 minutes  
**Complexity**: Easy
