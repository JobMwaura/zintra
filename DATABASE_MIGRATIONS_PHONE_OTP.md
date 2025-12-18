# SQL Database Migrations - Phone OTP Implementation

## Overview
Based on recent changes to implement phone OTP verification for user registration and upcoming password reset, your Supabase database needs the following schema updates.

---

## 🚨 Required Migrations

### 1. Add Phone Columns to Users Table (CRITICAL)

```sql
-- Add phone verification columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;

-- Create index for faster lookups during password reset
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

**Purpose**: Store user phone numbers and verification status  
**Why needed**: 
- User registration stores phone after verification
- Password reset requires phone lookup and verification
- Indexes speed up lookups during password reset flow

**What it does**:
- `phone_number`: Stores the verified phone number (e.g., "+254721829148")
- `phone_verified`: Boolean flag (true = verified via OTP)
- `phone_verified_at`: Timestamp of when phone was verified
- Indexes: Speed up lookups by email and phone

---

### 2. Verify/Create OTP Verifications Table (Should Already Exist)

```sql
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS otp_verifications (
  id BIGSERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  email_address VARCHAR(255),
  otp_code VARCHAR(6) NOT NULL,
  verified BOOLEAN DEFAULT false,
  type VARCHAR(20), -- 'registration' or 'password-reset'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes')
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_phone_number ON otp_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email_address);
CREATE INDEX IF NOT EXISTS idx_otp_created_at ON otp_verifications(created_at);
```

**Purpose**: Store OTP codes temporarily for verification  
**Status**: Should already exist from OTP system implementation  
**What it does**:
- `phone_number`: Phone number being verified
- `otp_code`: 6-digit code sent via SMS
- `verified`: Whether code has been verified
- `type`: Tracks if for registration or password reset
- `expires_at`: Code expires after 10 minutes (prevents reuse)

---

### 3. Add Security Constraints (Optional but Recommended)

```sql
-- Ensure phone numbers are unique per user
ALTER TABLE users 
ADD CONSTRAINT unique_phone_number UNIQUE (phone_number) 
WHERE phone_number IS NOT NULL;

-- Add check constraint for phone format
ALTER TABLE users
ADD CONSTRAINT check_phone_format 
CHECK (phone_number IS NULL OR phone_number ~ '^\+[0-9]{1,15}$');
```

**Purpose**: Prevent duplicate phone numbers and validate format  
**Optional**: Yes, but recommended for data quality

---

## 📋 Step-by-Step Migration Guide

### Step 1: Backup Your Database
```bash
# In Supabase Dashboard:
# 1. Go to Settings → Backups
# 2. Click "Request a backup"
# 3. Wait for backup completion
# 4. Proceed with migrations
```

### Step 2: Run Migrations in Supabase

**Using Supabase Dashboard SQL Editor**:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Create a **New Query**
3. Copy and paste the SQL below
4. Click **Run**

```sql
-- MIGRATION 1: Add phone columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;

-- MIGRATION 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- MIGRATION 3: Verify OTP table exists (create if needed)
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

-- MIGRATION 4: Create indexes on OTP table
CREATE INDEX IF NOT EXISTS idx_otp_phone_number ON otp_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email_address);
CREATE INDEX IF NOT EXISTS idx_otp_created_at ON otp_verifications(created_at);

-- MIGRATION 5: Add unique constraint (optional)
ALTER TABLE users 
ADD CONSTRAINT unique_phone_number UNIQUE (phone_number) 
WHERE phone_number IS NOT NULL;

-- Migration complete!
```

### Step 3: Verify Migrations

Run these queries to verify everything worked:

```sql
-- Check users table has new columns
\d users;

-- Or use this query to check specific columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('phone_number', 'phone_verified', 'phone_verified_at');

-- Check otp_verifications table exists
\d otp_verifications;

-- Check indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('users', 'otp_verifications');
```

---

## 🔄 Alternative: Using Supabase Migrations CLI

If you use Supabase migrations CLI:

```bash
# Create a new migration file
supabase migration new add_phone_otp_columns

# Copy the SQL into the generated file
# Then apply:
supabase db push
```

---

## 📊 Database Schema After Migrations

### Users Table (Modified)

| Column | Type | Null | Default | Index | Notes |
|--------|------|------|---------|-------|-------|
| id | UUID | NO | | PK | Existing |
| email | VARCHAR | NO | | idx_users_email | Existing |
| phone_number | VARCHAR(20) | YES | NULL | idx_users_phone_number | **NEW** |
| phone_verified | BOOLEAN | YES | false | | **NEW** |
| phone_verified_at | TIMESTAMP | YES | NULL | | **NEW** |
| ... | ... | ... | ... | ... | Other columns |

### OTP Verifications Table (Verified/Created)

| Column | Type | Null | Default | Index | Notes |
|--------|------|------|---------|-------|-------|
| id | BIGSERIAL | NO | | PK | |
| phone_number | VARCHAR(20) | NO | | idx_otp_phone | For lookups |
| email_address | VARCHAR(255) | YES | | idx_otp_email | For lookups |
| otp_code | VARCHAR(6) | NO | | | 6-digit code |
| verified | BOOLEAN | YES | false | | Verification status |
| type | VARCHAR(20) | YES | | | 'registration' or 'password-reset' |
| created_at | TIMESTAMP | YES | now() | idx_otp_created_at | For cleanup |
| expires_at | TIMESTAMP | YES | now + 10min | | Auto-expire |

---

## 🔐 Security Features

### Phone Number Uniqueness
- Each user has one phone number
- Prevents duplicate phone number registration
- Enforced at database level (constraint)

### Phone Verification Tracking
- `phone_verified` = true means OTP was verified
- `phone_verified_at` = timestamp when verified
- Used for password reset validation

### OTP Code Expiration
- Codes expire after 10 minutes
- Prevents code reuse/guessing
- App should cleanup expired codes

### Data Validation
- Phone numbers must match format: +[0-9]{1,15}
- Only 6-digit codes stored
- Type field tracks purpose (registration vs reset)

---

## ⚠️ Important Considerations

### 1. Existing Users
```sql
-- If you have existing users, they will have NULL phone_number
-- This is fine - they'll need to verify phone on next login or registration

-- Check how many users have phone verified:
SELECT phone_verified, COUNT(*) 
FROM users 
GROUP BY phone_verified;
```

### 2. Data Migration (Optional)
If migrating existing user phone data:

```sql
-- Example: If phone numbers are in auth.users metadata
UPDATE users u
SET phone_number = u.raw_user_meta_data->>'phone'
WHERE raw_user_meta_data->>'phone' IS NOT NULL;
```

### 3. Rollback Plan
If something goes wrong:

```sql
-- Remove the new columns
ALTER TABLE users DROP COLUMN IF EXISTS phone_number;
ALTER TABLE users DROP COLUMN IF EXISTS phone_verified;
ALTER TABLE users DROP COLUMN IF EXISTS phone_verified_at;

-- Restore from backup if needed
```

---

## 📈 Performance Indexes

### Why These Indexes?

1. **idx_users_email** - Fast user lookup during password reset
2. **idx_users_phone_number** - Fast phone lookup for duplicate prevention
3. **idx_otp_phone_number** - Fast OTP retrieval by phone
4. **idx_otp_email** - Fast OTP retrieval by email
5. **idx_otp_created_at** - Fast cleanup of expired codes

### Query Performance Impact

Before migrations (without indexes):
```
SELECT * FROM otp_verifications WHERE phone_number = '+254...' 
→ Full table scan (slow with many records)
```

After migrations (with indexes):
```
SELECT * FROM otp_verifications WHERE phone_number = '+254...' 
→ Index lookup (fast, even with thousands of records)
```

---

## 🧪 Testing Queries

Run these after migrations to verify everything:

```sql
-- Test 1: Insert test phone OTP
INSERT INTO otp_verifications (phone_number, email_address, otp_code, type, verified)
VALUES ('+254712345678', 'test@example.com', '123456', 'registration', false);

-- Test 2: Retrieve test OTP by phone
SELECT * FROM otp_verifications WHERE phone_number = '+254712345678';

-- Test 3: Verify index on phone number
EXPLAIN ANALYZE 
SELECT * FROM otp_verifications WHERE phone_number = '+254712345678';
-- Should show "Index Scan" not "Sequential Scan"

-- Test 4: Check users table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY column_name;

-- Test 5: Try updating user phone
UPDATE users SET phone_number = '+254712345678', phone_verified = true
WHERE id = (SELECT id FROM users LIMIT 1);

-- Clean up test data
DELETE FROM otp_verifications WHERE phone_number = '+254712345678';
```

---

## 🚀 What Happens After Migrations

### User Registration Flow
```
1. User enters phone in Step 2
2. OTP sent → stored in otp_verifications table
3. User verifies code
4. phone_number stored in users table
5. phone_verified set to true
6. phone_verified_at set to current timestamp
```

### Password Reset Flow (When Implemented)
```
1. User enters email
2. Look up phone_number from users table
3. Send OTP to phone_number
4. User verifies code
5. Update password
```

---

## ✅ Validation Checklist

After running migrations, verify:

- [ ] `users.phone_number` column exists (VARCHAR 20, NULL)
- [ ] `users.phone_verified` column exists (BOOLEAN, default false)
- [ ] `users.phone_verified_at` column exists (TIMESTAMP, NULL)
- [ ] `otp_verifications` table exists
- [ ] All indexes are created
- [ ] Can insert test data in users table
- [ ] Can insert test data in otp_verifications table
- [ ] Unique constraint on phone_number works
- [ ] Phone format validation works

---

## 📝 Migration SQL Summary

**All migrations in one script** (copy and paste into Supabase SQL Editor):

```sql
-- Add phone columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create otp_verifications table if not exists
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

-- Create otp_verifications indexes
CREATE INDEX IF NOT EXISTS idx_otp_phone_number ON otp_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email_address);
CREATE INDEX IF NOT EXISTS idx_otp_created_at ON otp_verifications(created_at);

-- Add unique constraint for phone numbers
ALTER TABLE users 
ADD CONSTRAINT unique_phone_number UNIQUE (phone_number) 
WHERE phone_number IS NOT NULL;
```

---

## 🎯 Summary

**What you need to do**:
1. Open Supabase Dashboard SQL Editor
2. Copy the migration script above
3. Run it
4. Verify with the testing queries
5. Done! Your database is ready for phone OTP

**Time required**: 5 minutes  
**Difficulty**: Easy  
**Risk**: Low (IF operations used, safe to re-run)

---

**Status**: Ready to run  
**Last Updated**: December 2024
