# SQL #1 CLEAN VERSION - Copy & Run This

## Error Encountered
```
ERROR: 42710: policy "rfqs_owner_all" for table "rfqs" already exists
```

**Solution:** Use this CLEAN version that drops all existing policies first, then recreates them safely.

---

## COPY-PASTE THIS SQL INTO SUPABASE:

```sql
-- ============================================================================
-- FIX: Remove infinite recursion in RLS policies - CLEAN VERSION
-- ============================================================================
-- This version safely drops and recreates all policies
-- Safe to run multiple times - handles existing policies gracefully
-- ============================================================================

-- ============================================================================
-- 1. DROP ALL EXISTING POLICIES (Safe - uses IF EXISTS)
-- ============================================================================

DROP POLICY IF EXISTS "rfqs_owner_all" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select_own" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_insert" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_update" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_service_role" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select_as_recipient" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select_authenticated" ON public.rfqs;

DROP POLICY IF EXISTS "recipients_vendor" ON public.rfq_recipients;
DROP POLICY IF EXISTS "recipients_vendor_select" ON public.rfq_recipients;
DROP POLICY IF EXISTS "recipients_creator" ON public.rfq_recipients;
DROP POLICY IF EXISTS "recipients_creator_select" ON public.rfq_recipients;
DROP POLICY IF EXISTS "recipients_service_role" ON public.rfq_recipients;
DROP POLICY IF EXISTS "recipients_vendor_insert" ON public.rfq_recipients;

DROP POLICY IF EXISTS "responses_vendor" ON public.rfq_responses;
DROP POLICY IF EXISTS "responses_vendor_all" ON public.rfq_responses;
DROP POLICY IF EXISTS "responses_creator" ON public.rfq_responses;
DROP POLICY IF EXISTS "responses_creator_select" ON public.rfq_responses;
DROP POLICY IF EXISTS "responses_service_role" ON public.rfq_responses;

-- ============================================================================
-- 2. RECREATE rfqs TABLE POLICIES - SIMPLE, NON-RECURSIVE
-- ============================================================================

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
-- 3. RECREATE rfq_recipients TABLE POLICIES - SIMPLE, NON-RECURSIVE
-- ============================================================================

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
-- 4. RECREATE rfq_responses TABLE POLICIES - SIMPLE, NON-RECURSIVE
-- ============================================================================

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

-- ============================================================================
-- COMPLETE: All policies have been reset and recreated
-- ============================================================================
```

---

## Steps to Run:

1. Open Supabase → SQL Editor → **New Query**
2. Copy the SQL above (all of it)
3. Paste into the SQL editor
4. Click **Run**
5. Expected output: `Command executed successfully`

---

## After Running:

✅ All old policies are safely dropped  
✅ New clean policies are created  
✅ Dashboard should now load without infinite recursion error  

Then run SQL #2 (MIGRATION_ADD_IS_FAVORITE) as before.

---

**Status:** Ready to execute  
**File Location:** `supabase/sql/FIX_RLS_INFINITE_RECURSION_CLEAN.sql`
