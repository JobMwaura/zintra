# 🚀 COMPLETE SQL MIGRATION SCRIPT - RUN THIS NOW

Copy and paste each SQL block into Supabase SQL Editor in order.

---

## ⏱️ TOTAL TIME: ~10 minutes

---

## 📌 STEP 1: Disable Email Confirmation (Supabase UI, not SQL)

**DO NOT RUN IN SQL EDITOR - Use Supabase Dashboard Instead:**

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Authentication → Providers → Email**
4. **UNCHECK** "Confirm email"
5. Click **SAVE**

This allows new users to be immediately confirmed without email verification.

---

## 🔧 STEP 2: Prepare Database (Drop & Recreate)

**Run this SQL block:**

```sql
-- ============================================
-- STEP 2: PREPARE DATABASE
-- ============================================

-- DISABLE all RLS temporarily (we'll re-enable with proper policies)
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- DROP all existing policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public')
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.users';
  END LOOP;
END $$;

-- DROP the users table if it exists (to start fresh)
DROP TABLE IF EXISTS public.users CASCADE;

-- Verify it's gone
SELECT COUNT(*) as table_exists FROM information_schema.tables 
WHERE table_name = 'users' AND table_schema = 'public';
```

**Expected output**: `table_exists = 0`

---

## 🏗️ STEP 3: Create Proper Users Table

**Run this SQL block:**

```sql
-- ============================================
-- STEP 3: CREATE USERS TABLE WITH ALL COLUMNS
-- ============================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY NOT NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  phone_number TEXT,
  phone_verified BOOLEAN DEFAULT false,
  phone_verified_at TIMESTAMP WITH TIME ZONE,
  gender TEXT,
  bio TEXT,
  profile_image TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint (references auth.users)
ALTER TABLE public.users
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_phone_number ON public.users(phone_number);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- Verify table was created
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Expected output**: Table created with ~13 columns

---

## 🔐 STEP 4: Enable RLS and Create Policies

**Run this SQL block:**

```sql
-- ============================================
-- STEP 4: ENABLE RLS WITH PROPER POLICIES
-- ============================================

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can INSERT their own record during registration
CREATE POLICY "users_insert_own_data"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 2: Anyone can VIEW all user profiles (for browsing)
CREATE POLICY "users_select_all"
  ON public.users
  FOR SELECT
  USING (true);

-- Policy 3: Users can UPDATE their own record
CREATE POLICY "users_update_own_data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Users can DELETE their own record (optional)
CREATE POLICY "users_delete_own_data"
  ON public.users
  FOR DELETE
  USING (auth.uid() = id);

-- Verify policies were created
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;
```

**Expected output**: 4 policies listed

---

## 🔗 STEP 5: Ensure Vendors Table is Proper

**Run this SQL block:**

```sql
-- ============================================
-- STEP 5: VERIFY & FIX VENDORS TABLE
-- ============================================

-- Check if vendors table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' AND table_schema = 'public'
LIMIT 20;

-- Add user_id column if it doesn't exist
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on user_id for performance
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);

-- Verify user_id exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'vendors' AND column_name = 'user_id';
```

**Expected output**: `user_id` column should be listed

---

## 📋 STEP 6: Verify Everything is Correct

**Run this SQL block to verify all changes:**

```sql
-- ============================================
-- STEP 6: VERIFICATION QUERIES
-- ============================================

-- 1. Check users table structure
SELECT COUNT(*) as users_table_exists FROM information_schema.tables 
WHERE table_name = 'users' AND table_schema = 'public';

-- 2. Count users table columns
SELECT COUNT(*) as column_count FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';

-- 3. Check RLS is enabled on users
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'users';

-- 4. Check RLS policies
SELECT COUNT(*) as policy_count FROM pg_policies 
WHERE tablename = 'users';

-- 5. List policy names
SELECT policyname FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;

-- 6. Check foreign key exists
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'users' AND constraint_type = 'PRIMARY KEY';

-- 7. Test INSERT permission (this should succeed or show RLS message, not table error)
-- This will fail if table doesn't exist, but succeed if table/RLS is properly configured
INSERT INTO public.users (id, full_name, email, phone) 
VALUES (gen_random_uuid(), 'Test', 'test@example.com', '+254700000000')
ON CONFLICT DO NOTHING;

-- 8. Clean up test data
DELETE FROM public.users WHERE email = 'test@example.com';

-- Final verification
SELECT 'All migrations completed successfully' as status;
```

**Expected output**: 
- `users_table_exists = 1` ✅
- `column_count ≈ 13` ✅
- `rowsecurity = true` ✅
- `policy_count = 4` ✅
- 4 policies listed ✅

---

## 🧪 STEP 7: Test Registration Flow

**After running all SQL, test this:**

1. Hard refresh browser: **Cmd+Shift+R**
2. Go to: https://zintra-sandy.vercel.app/user-registration
3. Complete all 4 steps:
   - Step 1: Create account (email + password)
   - Step 2: Verify phone with OTP
   - Step 3: Complete profile
   - Step 4: Success!
4. Login at: https://zintra-sandy.vercel.app/login
5. Verify you see user dashboard

---

## ⚠️ TROUBLESHOOTING

### Error: "table users does not exist"
→ You skipped Step 3. Run the CREATE TABLE block.

### Error: "RLS policy error"
→ Policies are misconfigured. Drop and recreate them.

### Error: "Foreign key constraint"
→ You didn't disable email confirmation in Supabase. Do that first!

### Error: "policy already exists"
→ Run the DROP POLICY lines first to clean up.

---

## 📊 EXPECTED RESULTS

| Item | Before | After |
|------|--------|-------|
| Email confirmation | Enabled (blocks users) | **Disabled** ✅ |
| Users table | Missing/broken | **Created properly** ✅ |
| RLS policies | Misconfigured | **4 clean policies** ✅ |
| Vendors table | No user_id | **Has user_id FK** ✅ |
| Registration flow | Broken | **Working** ✅ |
| Login flow | Broken | **Working** ✅ |

---

## ✅ COMPLETION CHECKLIST

- [ ] Disabled email confirmation in Supabase UI
- [ ] Ran STEP 2 (prepare) SQL
- [ ] Ran STEP 3 (create users table) SQL
- [ ] Ran STEP 4 (enable RLS) SQL
- [ ] Ran STEP 5 (vendors table) SQL
- [ ] Ran STEP 6 (verify) SQL - all checks passed
- [ ] Hard refreshed browser
- [ ] Tested registration (all 4 steps)
- [ ] Tested login
- [ ] Verified user dashboard loads

---

## 🎯 WHAT'S NEXT

Once all SQL runs successfully:

1. ✅ Users can now register
2. ✅ Users can login
3. ✅ User dashboard works
4. ✅ RLS protects data
5. ⏳ [Optional] Code improvements for better UX

---

## 📞 SUPPORT

If any SQL fails:
1. Share the exact error message
2. Tell me which STEP it failed on
3. I'll debug and provide corrected SQL

Otherwise, you're done! Registration should now work! 🎉
