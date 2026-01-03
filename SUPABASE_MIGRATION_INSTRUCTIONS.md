# Supabase SQL Migration Instructions

**Date:** January 3, 2026  
**Critical:** YES - Blocks dashboard from functioning

---

## 🚨 CRITICAL MIGRATIONS REQUIRED

Two SQL migrations must be executed in Supabase to fix critical issues:

1. **FIX_RLS_INFINITE_RECURSION.sql** → Fixes "infinite recursion detected in policy" error
2. **MIGRATION_ADD_IS_FAVORITE.sql** → Enables favorites feature persistence

---

## ✅ Step-by-Step Execution Instructions

### Step 1: Access Supabase SQL Editor

1. Go to **Supabase Dashboard** → [https://app.supabase.com](https://app.supabase.com)
2. Select your **zintra project**
3. In the left sidebar, click **SQL Editor**
4. Click **New Query** (top right)

---

### Step 2: Run FIX_RLS_INFINITE_RECURSION.sql

**Purpose:** Remove circular RLS policy dependencies that cause "infinite recursion" error

**Steps:**
1. Create a new SQL query
2. Copy ALL the SQL from: `/supabase/sql/FIX_RLS_INFINITE_RECURSION.sql`
3. Paste into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for success message (should see "Success" or green checkmark)

**What it does:**
- Drops problematic RLS policies with circular dependencies
- Creates simple, non-recursive policies:
  - `rfqs_owner_all`: Creators can do everything with their RFQs
  - `rfqs_service_role`: Backend service role bypasses
  - `rfqs_select_authenticated`: Authenticated users can VIEW all RFQs
- Similar fixes for `rfq_recipients` and `rfq_responses` tables

**Expected Output:**
```
Command executed successfully
```

---

### Step 3: Run MIGRATION_ADD_IS_FAVORITE.sql

**Purpose:** Add `is_favorite` column to enable favorites feature

**Steps:**
1. Create a NEW SQL query (don't reuse the previous one)
2. Copy ALL the SQL from: `/supabase/sql/MIGRATION_ADD_IS_FAVORITE.sql`
3. Paste into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for success message

**What it does:**
- Adds `is_favorite BOOLEAN DEFAULT false` column to `rfqs` table
- Creates index `idx_rfqs_is_favorite` for fast favorite queries
- Non-breaking: Uses `IF NOT EXISTS` so safe to run multiple times

**Expected Output:**
```
Command executed successfully
```

---

## 🔍 Verification Steps

After running both migrations, verify they worked:

### Check 1: Dashboard Loads Without Error

1. Go to your app and visit `/my-rfqs` page
2. **Before:** Should see "infinite recursion detected in policy for relation rfqs"
3. **After:** Should load RFQs normally without errors
4. ✅ If this works, RLS fix is successful

### Check 2: Favorites Column Exists

In Supabase SQL Editor, run this verification query:

```sql
-- Verify is_favorite column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'rfqs' AND column_name = 'is_favorite';
```

**Expected Result:**
```
column_name    | data_type | column_default
is_favorite    | boolean   | false
```

### Check 3: Favorites Feature Works

1. Visit dashboard at `/my-rfqs`
2. Click the ⭐ (favorite) button on any RFQ
3. Refresh the page
4. **Expected:** Star remains filled (favorite persists to database)
5. ✅ If this works, favorites feature is successful

---

## 📋 SQL Files Reference

### File 1: FIX_RLS_INFINITE_RECURSION.sql
- **Location:** `supabase/sql/FIX_RLS_INFINITE_RECURSION.sql`
- **Lines:** 134
- **Tables Modified:** `rfqs`, `rfq_recipients`, `rfq_responses`
- **Policies:** Drops 8 recursive policies, creates 9 simple policies

### File 2: MIGRATION_ADD_IS_FAVORITE.sql
- **Location:** `supabase/sql/MIGRATION_ADD_IS_FAVORITE.sql`
- **Lines:** 21
- **Tables Modified:** `rfqs`
- **Changes:** Adds 1 column + 1 index

---

## ⚠️ If Migration Fails

### Error: "Column already exists"
```
error: column "is_favorite" of relation "rfqs" already exists
```
**Solution:** This is fine - the migration uses `IF NOT EXISTS` so it's idempotent. The column was already added in a previous migration.

### Error: "Policy already exists"
```
error: policy "rfqs_owner_all" for table "rfqs" already exists
```
**Solution:** This might mean an older version of the fix was applied. Try running the migration again - the `DROP POLICY IF EXISTS` should clean up old policies first.

### Error: "Infinite recursion detected"
```
error: infinite recursion detected in policy for relation "rfqs"
```
**Solution:** This is the error you're trying to fix! Make sure you run the `FIX_RLS_INFINITE_RECURSION.sql` first.

---

## 🎯 Success Criteria

After both migrations are complete:

- ✅ Dashboard `/my-rfqs` loads without "infinite recursion" error
- ✅ RFQs display normally with all data visible
- ✅ Favorite button (⭐) works and persists on page refresh
- ✅ Database verification query shows `is_favorite` column
- ✅ All other features (filters, tabs, stats) work correctly

---

## 📝 Timeline

- **Execution Time:** ~2 minutes (both migrations run instantly)
- **Testing Time:** ~5 minutes
- **Total Time:** ~10 minutes

---

## 🚀 Next Steps After Migration

1. ✅ Run both SQL migrations (2 min)
2. ✅ Verify dashboard loads and favorites work (3 min)
3. ⏳ **Coming Soon:** Integrate Phase 1 UX improvements
   - ImprovedDashboardLayout component (simplified filters)
   - EmptyRFQState component (onboarding for new users)
   - Estimated effort: 1-2 hours

---

## 📞 Need Help?

If migrations fail:
1. Check error message carefully (usually explains what went wrong)
2. Verify you're in the correct Supabase project
3. Make sure you have Editor or Owner role in Supabase
4. Check that `rfqs` table exists (it should)
5. Try running verification query to see current schema

---

**Last Updated:** January 3, 2026  
**Created by:** Agent  
**Status:** Ready to Execute
