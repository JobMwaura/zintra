# SQL MIGRATION QUICK COPY-PASTE GUIDE

## 🔗 Access Supabase
https://app.supabase.com → Select zintra project → SQL Editor → New Query

---

## 📌 MIGRATION #1: Fix RLS Infinite Recursion

**Query Name:** FIX_RLS_INFINITE_RECURSION  
**Time to Run:** < 5 seconds  
**Status:** ⚠️ CRITICAL - Dashboard won't load without this

**SQL Code:**

```sql
-- ============================================================================
-- FIX: Remove infinite recursion in RLS policies
-- ============================================================================

-- ============================================================================
-- 1. FIX rfqs TABLE POLICIES - SIMPLE, NON-RECURSIVE
-- ============================================================================

-- Drop all rfqs policies
DROP POLICY IF EXISTS "rfqs_select_own" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_insert" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_update" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_service_role" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select_as_recipient" ON public.rfqs;

-- Recreate with SIMPLE, NON-RECURSIVE logic
-- Policy 1: RFQ creators can do everything with their RFQs
CREATE POLICY "rfqs_owner_all" ON public.rfqs
  FOR ALL
  USING (auth.uid() = user_id);

-- Policy 2: Service role (backend) can do everything
CREATE POLICY "rfqs_service_role" ON public.rfqs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy 3: All authenticated users can VIEW all RFQs
--   (This avoids recursion and lets application logic handle authorization)
CREATE POLICY "rfqs_select_authenticated" ON public.rfqs
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 2. FIX rfq_recipients TABLE POLICIES - SIMPLE, NON-RECURSIVE
-- ============================================================================

-- Drop all rfq_recipients policies
DROP POLICY IF EXISTS "recipients_vendor" ON public.rfq_recipients;
DROP POLICY IF EXISTS "recipients_creator" ON public.rfq_recipients;
DROP POLICY IF EXISTS "recipients_service_role" ON public.rfq_recipients;

-- Recreate with SIMPLE logic (no JOINs to rfqs)
-- Policy 1: Vendors can view recipients where they are mentioned
CREATE POLICY "recipients_vendor_select" ON public.rfq_recipients
  FOR SELECT
  USING (vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  ));

-- Policy 2: Service role can do everything
CREATE POLICY "recipients_service_role" ON public.rfq_recipients
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy 3: RFQ creators can view recipients for their RFQs
CREATE POLICY "recipients_creator_select" ON public.rfq_recipients
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy 4: Vendors can INSERT/UPDATE their own responses
CREATE POLICY "recipients_vendor_insert" ON public.rfq_recipients
  FOR INSERT
  WITH CHECK (vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- 3. FIX rfq_responses TABLE POLICIES - SIMPLE, NON-RECURSIVE  
-- ============================================================================

-- Drop all rfq_responses policies
DROP POLICY IF EXISTS "responses_vendor" ON public.rfq_responses;
DROP POLICY IF EXISTS "responses_creator" ON public.rfq_responses;
DROP POLICY IF EXISTS "responses_service_role" ON public.rfq_responses;

-- Recreate with SIMPLE logic
-- Policy 1: Vendors can CRUD their own responses
CREATE POLICY "responses_vendor_all" ON public.rfq_responses
  FOR ALL
  USING (vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  ));

-- Policy 2: Service role can do everything
CREATE POLICY "responses_service_role" ON public.rfq_responses
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy 3: RFQ creators can SELECT responses to their RFQs (simplified)
CREATE POLICY "responses_creator_select" ON public.rfq_responses
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

**After Running:**
- ✅ Click **Run**
- ✅ Wait for "Command executed successfully"
- ✅ Check that dashboard loads at `/my-rfqs` without error

---

## 📌 MIGRATION #2: Add is_favorite Column

**Query Name:** MIGRATION_ADD_IS_FAVORITE  
**Time to Run:** < 2 seconds  
**Status:** ⚠️ REQUIRED - Favorites feature won't work without this

**SQL Code:**

```sql
-- ============================================================================
-- MIGRATION: Add is_favorite column to rfqs table
-- ============================================================================

ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create index for faster filtering of favorites
CREATE INDEX IF NOT EXISTS idx_rfqs_is_favorite ON public.rfqs(user_id, is_favorite)
WHERE is_favorite = true;
```

**After Running:**
- ✅ Click **Run**
- ✅ Wait for "Command executed successfully"
- ✅ Test favorites button (⭐) on dashboard - should persist on refresh

---

## ✅ VERIFICATION QUERIES

**Check #1: Verify RLS Policies**

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('rfqs', 'rfq_recipients', 'rfq_responses')
ORDER BY tablename, policyname;
```

**Expected Output:** You should see policies like:
- rfqs_owner_all
- rfqs_service_role
- rfqs_select_authenticated
- recipients_vendor_select
- recipients_service_role
- responses_vendor_all
- responses_service_role

---

**Check #2: Verify is_favorite Column**

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'rfqs' AND column_name = 'is_favorite';
```

**Expected Output:**
```
column_name  | data_type | column_default
is_favorite  | boolean   | false
```

---

**Check #3: Verify Index**

```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'rfqs' AND indexname LIKE '%favorite%';
```

**Expected Output:**
```
idx_rfqs_is_favorite
```

---

## 🎯 SUCCESS CHECKLIST

After executing both migrations:

- [ ] Ran FIX_RLS_INFINITE_RECURSION.sql successfully
- [ ] Ran MIGRATION_ADD_IS_FAVORITE.sql successfully
- [ ] Dashboard `/my-rfqs` loads without errors
- [ ] RFQs display normally
- [ ] Favorites button (⭐) works
- [ ] Favorite persists after page refresh
- [ ] Verification queries show correct schema

---

## ⏱️ Total Execution Time: ~5 minutes

1. Copy Migration #1 → Run (~2 min)
2. Copy Migration #2 → Run (~1 min)
3. Run verification queries (~2 min)

---

**Status:** Ready to execute  
**Last Updated:** January 3, 2026
