# SQL Migration Cheat Sheet - Phone OTP

## ⚡ Copy & Paste Ready

### The Complete Migration (Single Script)

Copy this entire block and paste into **Supabase SQL Editor** → Run:

```sql
-- ============================================
-- PHONE OTP DATABASE MIGRATIONS
-- ============================================

-- Add phone columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;

-- Create indexes on users table
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

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

-- Add unique constraint for phone numbers
ALTER TABLE users 
ADD CONSTRAINT unique_phone_number UNIQUE (phone_number) 
WHERE phone_number IS NOT NULL;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
```

---

## ✅ Verify Migrations Worked

Run these queries to confirm:

```sql
-- Check users table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('phone_number', 'phone_verified', 'phone_verified_at')
ORDER BY column_name;

-- Expected output:
-- phone_number | character varying | YES
-- phone_verified | boolean | YES
-- phone_verified_at | timestamp without time zone | YES

-- Check indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('users', 'otp_verifications')
ORDER BY tablename, indexname;

-- Expected output should include:
-- idx_users_email | users
-- idx_users_phone_number | users
-- idx_otp_phone_number | otp_verifications
-- idx_otp_email | otp_verifications
-- idx_otp_created_at | otp_verifications

-- Check otp_verifications table structure
\d otp_verifications;
```

---

## 📊 What Was Added

| Item | Table | Type | Purpose |
|------|-------|------|---------|
| phone_number | users | VARCHAR(20) | Store user phone |
| phone_verified | users | BOOLEAN | Track verification status |
| phone_verified_at | users | TIMESTAMP | When phone was verified |
| idx_users_phone | users | INDEX | Speed up phone lookups |
| idx_users_email | users | INDEX | Speed up email lookups |
| otp_verifications | (new) | TABLE | Store OTP codes |
| idx_otp_phone | otp_verifications | INDEX | Speed up OTP retrieval |

---

## 🔧 Common Queries After Migration

### Find user's phone status
```sql
SELECT id, email, phone_number, phone_verified, phone_verified_at
FROM users
WHERE email = 'user@example.com';
```

### Get latest OTP for a phone number
```sql
SELECT phone_number, otp_code, verified, created_at
FROM otp_verifications
WHERE phone_number = '+254712345678'
ORDER BY created_at DESC
LIMIT 1;
```

### Find unverified phones
```sql
SELECT id, email, phone_number
FROM users
WHERE phone_number IS NOT NULL AND phone_verified = false;
```

### Delete expired OTP codes
```sql
DELETE FROM otp_verifications
WHERE expires_at < CURRENT_TIMESTAMP;
```

### Update user phone verification
```sql
UPDATE users
SET phone_verified = true, phone_verified_at = CURRENT_TIMESTAMP
WHERE id = 'user-uuid-here';
```

---

## 🚀 Quick Steps

1. **Open Supabase Dashboard**
2. **Click SQL Editor**
3. **Click New Query**
4. **Copy the complete migration script above**
5. **Paste into editor**
6. **Click Run**
7. **Wait for completion**
8. **Run verify queries to confirm**
9. **Done!**

---

## ⚠️ If Something Goes Wrong

### Undo Changes
```sql
-- Remove new columns
ALTER TABLE users DROP COLUMN IF EXISTS phone_number;
ALTER TABLE users DROP COLUMN IF EXISTS phone_verified;
ALTER TABLE users DROP COLUMN IF EXISTS phone_verified_at;

-- Drop constraints and indexes (auto-dropped with columns)
-- Restore from backup if needed
```

### Check Backup
- Supabase Dashboard → Settings → Backups
- Request manual backup before migrating
- Can restore if needed

---

## 📋 What Each Part Does

### Users Table Columns
```sql
phone_number VARCHAR(20)
  ↳ Stores: +254721829148, +1234567890, etc.
  
phone_verified BOOLEAN DEFAULT false
  ↳ Stores: true/false (is phone verified?)
  
phone_verified_at TIMESTAMP
  ↳ Stores: When phone was verified (2024-12-18 10:30:45)
```

### OTP Verifications Table
```sql
phone_number VARCHAR(20)
  ↳ Stores: Phone being verified
  
otp_code VARCHAR(6)
  ↳ Stores: 6-digit code (123456)
  
verified BOOLEAN
  ↳ Stores: Whether code was verified
  
type VARCHAR(20)
  ↳ Stores: 'registration' or 'password-reset'
  
expires_at TIMESTAMP
  ↳ Stores: When code expires (auto 10 min)
```

### Indexes
```sql
idx_users_phone_number
  ↳ Speeds up: SELECT * WHERE phone_number = '...'
  
idx_otp_phone_number
  ↳ Speeds up: SELECT * WHERE phone_number = '...'
  
idx_otp_created_at
  ↳ Speeds up: Cleanup of old records
```

---

## ⏱️ Timing

- **Backup**: 5 minutes
- **Run migrations**: 1-2 minutes
- **Verify**: 1 minute
- **Total**: ~10 minutes

---

## 📞 Support

**Full documentation**: `DATABASE_MIGRATIONS_PHONE_OTP.md`  
**Questions**: Refer to the full migration guide or comments in the SQL

---

**Status**: Ready to run immediately  
**Complexity**: Low  
**Risk**: Low (IF operations are safe to re-run)
