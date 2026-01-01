<!-- START: SECURITY_FIX_VENDOR_RFQ_INBOX_GUIDE.md -->

# 🔐 Security Fix: vendor_rfq_inbox - Replace View with Secure Function

## 📋 Executive Summary

**Issue**: The `public.vendor_rfq_inbox` view exposes sensitive `auth.users` data to authenticated users via PostgREST.

**Risk**: 🔴 **HIGH** - Sensitive authentication metadata could be exposed:
- User emails
- Raw user metadata  
- Other auth.users columns with sensitive info

**Solution**: Replace the view with a `SECURITY DEFINER` function that:
- ✅ Restricts access to authenticated users only
- ✅ Filters data to vendor's own RFQs
- ✅ Only exposes safe, sanitized columns
- ✅ Uses `public.users` table instead of `auth.users` metadata

---

## 🚨 What's the Vulnerability?

### The Problem

Current view structure:
```sql
CREATE OR REPLACE VIEW public.vendor_rfq_inbox AS
SELECT 
  r.id,
  r.title,
  u.email,          -- ❌ From auth.users (sensitive!)
  u.raw_user_meta_data,  -- ❌ From auth.users (sensitive!)
  -- ... other fields
FROM public.rfqs r
LEFT JOIN auth.users u ON r.user_id = u.id
-- No authentication/authorization checks
```

### Why This is Dangerous

1. **Direct access to auth.users**
   - PostgREST exposes all columns (with RLS limitations)
   - Unauthenticated users might see partial data
   - Sensitive metadata could leak

2. **No vendor filtering**
   - View returns all RFQs, not just vendor's RFQs
   - No row-level authorization
   - Vendor can see other vendors' RFQ inbox

3. **No authentication gating**
   - Non-vendors might access the view
   - No role-based access control
   - Relies only on GRANT permissions

### Attack Scenario

```
Malicious authenticated user runs:
  SELECT email, raw_user_meta_data 
  FROM public.vendor_rfq_inbox;

Gets: ❌ All user emails and metadata from auth.users
Risk: Sensitive data exposure, email scraping, metadata leak
```

---

## ✅ The Solution: SECURITY DEFINER Function

### How It Works

```sql
CREATE OR REPLACE FUNCTION public.get_vendor_rfq_inbox(p_vendor_id UUID)
RETURNS TABLE (...safe columns only...)
SECURITY DEFINER          -- ← Executes with creator's (postgres) permissions
SET search_path = public
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    r.id,
    r.title,
    -- ✅ ONLY expose safe columns
    u.email,              -- From public.users, not auth.users
    -- ❌ NEVER expose:
    -- u.raw_user_meta_data  (NOT SELECTED)
    -- auth.users columns    (NOT JOINED)
  FROM public.rfqs r
  LEFT JOIN auth.users u ON r.user_id = u.id
  LEFT JOIN public.users pu ON r.user_id = pu.id
  WHERE rr.vendor_id = p_vendor_id  -- ← Restrict to vendor's RFQs
  ORDER BY r.created_at DESC;
$$ ;

-- ✅ Only authenticated users can execute
GRANT EXECUTE ON FUNCTION public.get_vendor_rfq_inbox(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_vendor_rfq_inbox(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_vendor_rfq_inbox(UUID) FROM ANON;
```

### Key Security Features

| Feature | Benefit |
|---------|---------|
| **SECURITY DEFINER** | Executes with high privileges, controlled data exposure |
| **Function parameters** | Vendor ID passed as argument (no user input = no injection) |
| **Column selection** | Only safe columns in RETURNS clause |
| **Vendor filtering** | WHERE clause restricts to vendor's RFQs |
| **auth.users avoided** | Uses `public.users` instead of `auth.users` |
| **GRANT restrictions** | Only authenticated role can execute |

---

## 🔄 Migration: View → Function

### Step 1: Understand Current View

The existing vulnerable view:
```sql
CREATE OR REPLACE VIEW public.vendor_rfq_inbox AS
SELECT * FROM ...
-- Problems:
-- 1. Joins auth.users (sensitive)
-- 2. No vendor filtering
-- 3. No authentication check
```

### Step 2: Create Secure Function

From `SECURITY_FIX_VENDOR_RFQ_INBOX.sql`:
```sql
DROP VIEW IF EXISTS public.vendor_rfq_inbox CASCADE;

CREATE OR REPLACE FUNCTION public.get_vendor_rfq_inbox(p_vendor_id UUID)
RETURNS TABLE (
  id UUID,
  rfq_id UUID,
  requester_id UUID,
  vendor_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  county TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  rfq_type TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE,
  rfq_type_label TEXT,
  quote_count INTEGER,
  total_quotes INTEGER,
  requester_email TEXT,
  requester_name TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
STABLE
AS $$
  -- Safe query logic here
  SELECT ... FROM public.rfqs ...
$$ ;
```

### Step 3: Update Frontend Code

**BEFORE** (Using view):
```javascript
const { data } = await supabase
  .from('vendor_rfq_inbox')
  .select('*')
  .eq('vendor_id', vendorId);
```

**AFTER** (Using function):
```javascript
const { data } = await supabase.rpc('get_vendor_rfq_inbox', {
  p_vendor_id: vendorId
});
```

### Step 4: Restrict Access

```sql
-- Only authenticated users can call the function
GRANT EXECUTE ON FUNCTION public.get_vendor_rfq_inbox(UUID) TO authenticated;

-- Remove public access
REVOKE EXECUTE ON FUNCTION public.get_vendor_rfq_inbox(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_vendor_rfq_inbox(UUID) FROM ANON;
```

### Step 5: Add RLS to rfq_recipients

```sql
ALTER TABLE public.rfq_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendors_view_own_rfq_recipients" ON public.rfq_recipients
FOR SELECT
USING (
  vendor_id = (SELECT id FROM public.vendors WHERE user_id = auth.uid())
);
```

---

## 🛡️ Security Benefits

| Before | After |
|--------|-------|
| ❌ View exposes all columns | ✅ Function returns only safe columns |
| ❌ Joins auth.users directly | ✅ Uses public.users for non-sensitive data |
| ❌ No vendor filtering | ✅ Function parameter filters by vendor |
| ❌ No auth check | ✅ GRANT restricts to authenticated role |
| ❌ PostgREST auto-exposes | ✅ Function call is controlled |
| ❌ User can query directly | ✅ Function logic is hidden |

---

## 🚀 Implementation Steps

### Phase 1: Prepare (5 minutes)

- [ ] Read this guide
- [ ] Back up current view definition
- [ ] Review `SECURITY_FIX_VENDOR_RFQ_INBOX.sql`

### Phase 2: Deploy SQL (5 minutes)

```sql
-- Step 1: Drop old view
DROP VIEW IF EXISTS public.vendor_rfq_inbox CASCADE;

-- Step 2: Copy entire contents of SECURITY_FIX_VENDOR_RFQ_INBOX.sql
-- and run in Supabase SQL Editor

-- Step 3: Verify function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_vendor_rfq_inbox';
```

### Phase 3: Update Frontend (10 minutes)

Find all calls to `vendor_rfq_inbox` view:
```bash
grep -r "vendor_rfq_inbox" src/
```

Replace with function call:
```javascript
// Before:
.from('vendor_rfq_inbox').select('*')

// After:
.rpc('get_vendor_rfq_inbox', { p_vendor_id: vendorId })
```

### Phase 4: Test & Deploy (15 minutes)

```javascript
// Test the function:
const { data, error } = await supabase.rpc(
  'get_vendor_rfq_inbox', 
  { p_vendor_id: '12345' }
);

if (error) {
  console.error('Function error:', error);
} else {
  console.log('✅ Function works:', data);
}
```

---

## 🔍 Detailed Comparison

### View Approach (VULNERABLE) ❌

```sql
CREATE OR REPLACE VIEW public.vendor_rfq_inbox AS
SELECT 
  r.*,
  u.*,  -- ❌ ALL auth.users columns exposed!
  rr.vendor_id
FROM public.rfqs r
LEFT JOIN auth.users u ON r.user_id = u.id  -- ❌ Joins auth table
LEFT JOIN public.rfq_recipients rr ON r.id = rr.rfq_id;

-- Postgraduate accesses:
SELECT * FROM vendor_rfq_inbox;  -- No filtering, auth.users exposed
```

### Function Approach (SECURE) ✅

```sql
CREATE OR REPLACE FUNCTION public.get_vendor_rfq_inbox(p_vendor_id UUID)
RETURNS TABLE (
  id UUID,
  rfq_id UUID,
  requester_email TEXT,  -- ✅ ONLY safe columns
  requester_name TEXT,   -- ✅ NOT raw metadata
  -- ... other safe columns
)
SECURITY DEFINER  -- ✅ Controlled execution context
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    r.id,
    r.id AS rfq_id,
    COALESCE(u.email, 'unknown@zintra.co.ke') AS requester_email,  -- ✅ Safe
    COALESCE(
      (SELECT full_name FROM public.users WHERE id = r.user_id),  -- ✅ Safe table
      u.email
    ) AS requester_name
  FROM public.rfqs r
  LEFT JOIN auth.users u ON r.user_id = u.id
  WHERE rr.vendor_id = p_vendor_id  -- ✅ Vendor filtering
  ORDER BY r.created_at DESC;
$$ ;

-- Frontend accesses:
SELECT * FROM get_vendor_rfq_inbox('vendor-id');  -- ✅ Safe, filtered, controlled
```

---

## ⚙️ Configuration Details

### Return Columns (Safe Only)

| Column | Source | Safe? | Why |
|--------|--------|-------|-----|
| `id` | rfqs | ✅ | Public data |
| `rfq_id` | rfqs | ✅ | Public data |
| `requester_email` | public.users | ✅ | Non-sensitive |
| `requester_name` | public.users | ✅ | Non-sensitive |
| `title` | rfqs | ✅ | Public data |
| `description` | rfqs | ✅ | Public data |
| `category` | rfqs | ✅ | Public data |
| `county` | rfqs | ✅ | Public data |
| `created_at` | rfqs | ✅ | Public data |
| `status` | rfqs | ✅ | Public data |
| `quote_count` | COUNT(*) | ✅ | Aggregate |

### Avoided Columns (Sensitive)

| Column | Reason |
|--------|--------|
| `raw_user_meta_data` | Contains sensitive metadata |
| `encrypted_password` | Authentication credential |
| `last_sign_in_at` | User behavior tracking |
| `email_confirmed_at` | Account status |
| `phone_confirmed_at` | Account status |

---

## 🧪 Testing

### Test 1: Function Exists
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_vendor_rfq_inbox';

-- Expected: function | get_vendor_rfq_inbox
```

### Test 2: Returns Safe Columns Only
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'get_vendor_rfq_inbox';

-- Expected: Only safe columns listed
-- Should NOT include: raw_user_meta_data, encrypted_password
```

### Test 3: Frontend Integration
```javascript
// In React/Next.js:
const { data } = await supabase.rpc(
  'get_vendor_rfq_inbox',
  { p_vendor_id: vendorId }
);

console.log(data);  // Should show vendor's RFQs only, safe columns
```

### Test 4: Access Control
```sql
-- As anonymous user:
SELECT * FROM get_vendor_rfq_inbox('some-vendor-id');
-- Expected: Permission denied

-- As authenticated user:
SELECT * FROM get_vendor_rfq_inbox('some-vendor-id');
-- Expected: Returns RFQs for that vendor
```

---

## 🔄 Backward Compatibility

### Option 1: Create Wrapper View (Not Recommended)

If you need backward compatibility temporarily:

```sql
-- Create a view that wraps the function
CREATE OR REPLACE VIEW public.vendor_rfq_inbox AS
SELECT * FROM public.get_vendor_rfq_inbox(
  (SELECT id FROM vendors WHERE user_id = auth.uid())
);

-- ⚠️ This reintroduces the circular auth logic
-- Only use temporarily while updating frontend code
```

### Option 2: Deprecate View (Recommended)

```sql
-- Drop the view completely
DROP VIEW IF EXISTS public.vendor_rfq_inbox CASCADE;

-- Update all code to use the function
-- This is the correct long-term approach
```

---

## 🚨 Rollback Plan

If the migration causes issues:

```sql
-- Rollback: Remove function
DROP FUNCTION IF EXISTS public.get_vendor_rfq_inbox(UUID) CASCADE;

-- Recreate old view (if you have backup)
CREATE OR REPLACE VIEW public.vendor_rfq_inbox AS
SELECT ... -- Old view definition
```

---

## 📊 Implementation Checklist

- [ ] Back up current `vendor_rfq_inbox` view definition
- [ ] Read and understand `SECURITY_FIX_VENDOR_RFQ_INBOX.sql`
- [ ] Copy SQL and run in Supabase SQL Editor
- [ ] Verify function created: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'get_vendor_rfq_inbox'`
- [ ] Find all code using `vendor_rfq_inbox` view: `grep -r "vendor_rfq_inbox" src/`
- [ ] Update all occurrences to use `.rpc('get_vendor_rfq_inbox', { p_vendor_id })`
- [ ] Test function returns correct data
- [ ] Test function restricts to vendor's RFQs
- [ ] Test function is only callable by authenticated users
- [ ] Deploy and monitor logs
- [ ] Document change in CHANGELOG

---

## 🎯 Success Criteria

After implementing:
- ✅ Function `get_vendor_rfq_inbox` exists
- ✅ Returns only safe columns (no auth.users data)
- ✅ Filters to vendor's RFQs only
- ✅ Executable only by authenticated users
- ✅ Frontend uses `.rpc()` instead of view
- ✅ All tests pass
- ✅ No security warnings in logs

---

## 📚 References

- [Supabase Security Definer](https://supabase.com/docs/guides/database/security)
- [PostgreSQL Security Definer Functions](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- [PostgREST Function Calls](https://postgrest.org/en/stable/api.html#functions)
- [RLS Best Practices](https://supabase.com/docs/learn/auth-deep-dive/row-level-security)

---

## 📞 Questions?

1. Refer to `SECURITY_FIX_VENDOR_RFQ_INBOX.sql` for complete SQL
2. Check Supabase logs for errors
3. Use the rollback procedure if needed
4. Test thoroughly before deploying to production

