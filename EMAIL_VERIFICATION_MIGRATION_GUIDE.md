# 📊 Add Email Verification Columns to Supabase

## ✅ What This Does

Adds two new columns to your `users` table in Supabase to track email verification:
- `email_verified` - Boolean flag (true/false) indicating if email is verified
- `email_verified_at` - Timestamp showing when email was verified
- Index for faster queries on email_verified

## 🚀 How to Run the Migration

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com and login
2. Select your **Zintra** project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Create New Query
1. Click **New Query** button (or "+" icon)
2. Copy the SQL below
3. Paste it into the editor

### Step 3: Run the SQL

```sql
-- ============================================================================
-- ADD EMAIL VERIFICATION COLUMNS TO USERS TABLE
-- ============================================================================
-- Purpose: Add email verification tracking to the users table
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add email verification columns if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster email verification lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('email_verified', 'email_verified_at')
ORDER BY column_name;
```

### Step 4: Verify Success

You should see output like:
```
column_name       | data_type                  | is_nullable | column_default
------------------|----------------------------|-------------|----------------
email_verified    | boolean                    | YES         | false
email_verified_at | timestamp with time zone   | YES         | 
```

## ✨ What's New

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `email_verified` | BOOLEAN | false | Track if email is verified |
| `email_verified_at` | TIMESTAMP WITH TIME ZONE | NULL | When email was verified |

## 🔄 What Gets Updated in the App

After running this migration, the app will:
- ✅ Allow email verification via OTP
- ✅ Store verification timestamp in database
- ✅ Track verification status alongside phone verification
- ✅ Support future email-based features

## 📝 Database Changes After Migration

| Item | Status |
|------|--------|
| `email_verified` column | ✅ Added |
| `email_verified_at` column | ✅ Added |
| Index on `email_verified` | ✅ Added |
| User dashboard email verification | ✅ Ready to use |

## 🎯 Next Steps

After running this migration:
1. Go to https://zintra-sandy.vercel.app/user-dashboard
2. Test the email verification feature
3. Enter your email and OTP
4. Check if email_verified is set to true in the database

## ❓ Troubleshooting

**Error: "Column already exists"**
- This is fine - the `IF NOT EXISTS` clause prevents duplicates
- The migration is idempotent (safe to run multiple times)

**Error: "Could not find table 'users'"**
- Make sure you're in the correct Supabase project
- Check the table name is exactly `users` (case-sensitive)

## 📚 Related Files

- SQL Migration: `ADD_EMAIL_VERIFICATION_COLUMNS.sql`
- Code using these columns: `app/user-dashboard/page.js` (EmailVerificationModal)
- OTP Verification API: `app/api/otp/verify/route.ts`

---

**Status**: Ready to run ✅  
**Impact**: Adds 2 columns and 1 index  
**Risk**: Low (uses IF NOT EXISTS, fully reversible)  
**Time**: < 1 second
