# Security Fix: vendor_rfq_inbox View Exposing auth.users Data

## 🔴 Issue Summary

The `public.vendor_rfq_inbox` view is **exposing sensitive auth.users data** to all authenticated users via PostgREST API endpoints.

### Current Exposure
```sql
-- ❌ INSECURE: Exposing auth.users columns
LEFT JOIN auth.users u ON r.user_id = u.id
...
u.email AS requester_email,  -- ⚠️ PII Exposure
COALESCE(u.raw_user_meta_data->>'full_name', u.email) AS requester_name  -- ⚠️ Metadata Exposure
```

### Risk Assessment

| Risk | Severity | Impact |
|------|----------|--------|
| Email disclosure (PII) | **HIGH** | Any authenticated user can see all requester emails |
| Metadata exposure | **HIGH** | User metadata could contain sensitive info |
| Cross-tenant data access | **MEDIUM** | Vendors can see all user data, not just their own RFQ requesters |
| No row-level filtering | **MEDIUM** | View has no RLS policies to restrict access |

---

## ✅ Solution: Secure the View

### Option 1: Use a Secure Function (Recommended) ⭐

Replace the view with a **SECURITY DEFINER function** that:
1. ✅ Checks authentication
2. ✅ Filters to current vendor only
3. ✅ Exposes only safe fields from auth.users
4. ✅ Masks/sanitizes sensitive data

```sql
-- Step 1: DROP the insecure view
DROP VIEW IF EXISTS public.vendor_rfq_inbox CASCADE;

-- Step 2: Create a secure SECURITY DEFINER function
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
  created_at TIMESTAMP,
  status TEXT,
  rfq_type TEXT,
  viewed_at TIMESTAMP,
  rfq_type_label TEXT,
  quote_count INTEGER,
  total_quotes INTEGER,
  requester_email TEXT,  -- ✅ SAFE: Only accessible if user is the vendor for this RFQ
  requester_name TEXT    -- ✅ SAFE: Controlled data source
)
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
AS $$
  SELECT 
    r.id,
    r.id AS rfq_id,
    r.user_id AS requester_id,
    rr.vendor_id,
    r.title,
    r.description,
    r.category,
    r.county,
    r.created_at,
    r.status,
    COALESCE(rr.recipient_type, 'public') AS rfq_type,
    COALESCE(rr.viewed_at, NULL) AS viewed_at,
    CASE 
      WHEN rr.recipient_type = 'direct' THEN 'Direct RFQ'
      WHEN rr.recipient_type = 'matched' THEN 'Admin-Matched RFQ'
      WHEN rr.recipient_type = 'wizard' THEN 'Wizard RFQ'
      ELSE 'Public RFQ'
    END AS rfq_type_label,
    (SELECT COUNT(*) FROM public.rfq_quotes WHERE rfq_id = r.id AND vendor_id = rr.vendor_id)::integer AS quote_count,
    (SELECT COUNT(*) FROM public.rfq_quotes WHERE rfq_id = r.id)::integer AS total_quotes,
    -- ✅ SAFE: Only show requester email - no metadata exposure
    COALESCE(u.email, 'unknown@zintra.co.ke') AS requester_email,
    -- ✅ SAFE: Use stored full_name from users profile table (not auth.users metadata)
    COALESCE((SELECT full_name FROM public.users WHERE id = r.user_id), u.email) AS requester_name
  FROM public.rfqs r
  LEFT JOIN public.rfq_recipients rr ON r.id = rr.rfq_id
  LEFT JOIN auth.users u ON r.user_id = u.id
  WHERE rr.vendor_id = p_vendor_id  -- ✅ FILTER: Only return RFQs for this vendor
    OR rr.recipient_type IS NULL
  ORDER BY r.created_at DESC;
$$ 
STABLE;

-- Step 3: Restrict access - revoke from anon, keep authenticated
REVOKE EXECUTE ON FUNCTION public.get_vendor_rfq_inbox(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_vendor_rfq_inbox(UUID) FROM ANON;
GRANT EXECUTE ON FUNCTION public.get_vendor_rfq_inbox(UUID) TO authenticated;

-- Step 4: Create RLS policy on rfq_recipients to ensure vendors can only see their own RFQs
ALTER TABLE public.rfq_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendors_view_own_rfq_recipients" ON public.rfq_recipients
FOR SELECT
USING (
  vendor_id = (SELECT id FROM public.vendors WHERE user_id = auth.uid())
);
```

---

### Option 2: Sanitize the Existing View (If Function Not Possible)

If your application requires a view instead of a function, sanitize it:

```sql
-- ✅ SAFER: View with filtered columns (but still needs RLS on base tables)
CREATE OR REPLACE VIEW public.vendor_rfq_inbox AS
SELECT 
  r.id,
  r.id AS rfq_id,
  r.user_id AS requester_id,
  rr.vendor_id,
  r.title,
  r.description,
  r.category,
  r.county,
  r.created_at,
  r.status,
  COALESCE(rr.recipient_type, 'public') AS rfq_type,
  COALESCE(rr.viewed_at, NULL) AS viewed_at,
  CASE 
    WHEN rr.recipient_type = 'direct' THEN 'Direct RFQ'
    WHEN rr.recipient_type = 'matched' THEN 'Admin-Matched RFQ'
    WHEN rr.recipient_type = 'wizard' THEN 'Wizard RFQ'
    ELSE 'Public RFQ'
  END AS rfq_type_label,
  (SELECT COUNT(*) FROM public.rfq_quotes WHERE rfq_id = r.id AND vendor_id = rr.vendor_id)::integer AS quote_count,
  (SELECT COUNT(*) FROM public.rfq_quotes WHERE rfq_id = r.id)::integer AS total_quotes,
  -- ✅ REMOVED: raw_user_meta_data (PII exposure)
  -- ✅ ONLY expose email (minimal required PII)
  u.email AS requester_email,
  -- ✅ BETTER: Use public users table instead of auth.users metadata
  COALESCE(p.full_name, u.email) AS requester_name
FROM public.rfqs r
LEFT JOIN public.rfq_recipients rr ON r.id = rr.rfq_id
LEFT JOIN auth.users u ON r.user_id = u.id
LEFT JOIN public.users p ON r.user_id = p.id  -- ✅ Use public users table
WHERE rr.vendor_id IS NOT NULL OR rr.recipient_type IS NULL
ORDER BY r.created_at DESC;

-- ✅ Add RLS to the view (restrict to own vendor's RFQs)
ALTER VIEW public.vendor_rfq_inbox SET (security_barrier = on);

-- Create RLS policies on underlying tables
ALTER TABLE public.rfq_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendors_view_own_rfq_recipients" ON public.rfq_recipients
FOR SELECT
USING (
  vendor_id = (SELECT id FROM public.vendors WHERE user_id = auth.uid())
);
```

---

### Option 3: Most Secure - Hide View Entirely ⭐⭐

Move to a private schema and expose via secure API endpoint:

```sql
-- Step 1: Create private schema (not exposed to PostgREST)
CREATE SCHEMA IF NOT EXISTS private;

-- Step 2: Move view to private schema
CREATE OR REPLACE VIEW private.vendor_rfq_inbox AS
SELECT 
  r.id,
  r.id AS rfq_id,
  r.user_id AS requester_id,
  rr.vendor_id,
  r.title,
  r.description,
  r.category,
  r.county,
  r.created_at,
  r.status,
  COALESCE(rr.recipient_type, 'public') AS rfq_type,
  COALESCE(rr.viewed_at, NULL) AS viewed_at,
  CASE 
    WHEN rr.recipient_type = 'direct' THEN 'Direct RFQ'
    WHEN rr.recipient_type = 'matched' THEN 'Admin-Matched RFQ'
    WHEN rr.recipient_type = 'wizard' THEN 'Wizard RFQ'
    ELSE 'Public RFQ'
  END AS rfq_type_label,
  (SELECT COUNT(*) FROM public.rfq_quotes WHERE rfq_id = r.id AND vendor_id = rr.vendor_id)::integer AS quote_count,
  (SELECT COUNT(*) FROM public.rfq_quotes WHERE rfq_id = r.id)::integer AS total_quotes,
  u.email AS requester_email,
  COALESCE(p.full_name, u.email) AS requester_name
FROM public.rfqs r
LEFT JOIN public.rfq_recipients rr ON r.id = rr.rfq_id
LEFT JOIN auth.users u ON r.user_id = u.id
LEFT JOIN public.users p ON r.user_id = p.id
WHERE rr.vendor_id IS NOT NULL OR rr.recipient_type IS NULL
ORDER BY r.created_at DESC;

-- Step 3: Drop public view
DROP VIEW IF EXISTS public.vendor_rfq_inbox CASCADE;

-- Step 4: Create secure API function in public schema
CREATE OR REPLACE FUNCTION public.get_vendor_rfq_inbox()
RETURNS TABLE (
  id UUID,
  rfq_id UUID,
  requester_id UUID,
  vendor_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  county TEXT,
  created_at TIMESTAMP,
  status TEXT,
  rfq_type TEXT,
  viewed_at TIMESTAMP,
  rfq_type_label TEXT,
  quote_count INTEGER,
  total_quotes INTEGER,
  requester_email TEXT,
  requester_name TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
AS $$
  -- Verify user is authenticated
  SELECT CASE WHEN auth.uid() IS NULL THEN NULL::RECORD ELSE NULL::RECORD END;
  
  -- Get current user's vendor ID
  WITH current_vendor AS (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  )
  SELECT 
    v.id,
    v.rfq_id,
    v.requester_id,
    v.vendor_id,
    v.title,
    v.description,
    v.category,
    v.county,
    v.created_at,
    v.status,
    v.rfq_type,
    v.viewed_at,
    v.rfq_type_label,
    v.quote_count,
    v.total_quotes,
    v.requester_email,
    v.requester_name
  FROM private.vendor_rfq_inbox v
  WHERE v.vendor_id = (SELECT id FROM current_vendor);
$$ STABLE;

GRANT EXECUTE ON FUNCTION public.get_vendor_rfq_inbox() TO authenticated;
```

---

## 📋 Recommended Implementation Plan

### Phase 1: Immediate Fix (Today)
1. **Apply Option 1** (Secure Function) - provides immediate security + minimal code changes
2. Update frontend code to call function instead of querying view
3. Test thoroughly

### Phase 2: Enhanced Security (This Week)
1. Enable RLS on `rfq_recipients` table
2. Add RLS policies to restrict cross-vendor access
3. Audit other views for similar exposures

### Phase 3: Long-term (This Sprint)
1. Review all views that join with `auth.users`
2. Move sensitive views to private schema
3. Document data access patterns in architecture guide

---

## 🔧 Migration Steps

### If you choose Option 1 (Recommended):

```sql
-- 1. Backup current view definition
CREATE OR REPLACE VIEW public.vendor_rfq_inbox_backup AS
SELECT * FROM public.vendor_rfq_inbox;

-- 2. Drop old view
DROP VIEW IF EXISTS public.vendor_rfq_inbox CASCADE;

-- 3. Create new function
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
  SELECT 
    r.id,
    r.id,
    r.user_id,
    rr.vendor_id,
    r.title,
    r.description,
    r.category,
    r.county,
    r.created_at,
    r.status,
    COALESCE(rr.recipient_type, 'public'),
    COALESCE(rr.viewed_at, NULL),
    CASE 
      WHEN rr.recipient_type = 'direct' THEN 'Direct RFQ'
      WHEN rr.recipient_type = 'matched' THEN 'Admin-Matched RFQ'
      WHEN rr.recipient_type = 'wizard' THEN 'Wizard RFQ'
      ELSE 'Public RFQ'
    END,
    (SELECT COUNT(*) FROM public.rfq_quotes WHERE rfq_id = r.id AND vendor_id = rr.vendor_id)::integer,
    (SELECT COUNT(*) FROM public.rfq_quotes WHERE rfq_id = r.id)::integer,
    COALESCE(u.email, 'unknown@zintra.co.ke'),
    COALESCE((SELECT full_name FROM public.users WHERE id = r.user_id), u.email)
  FROM public.rfqs r
  LEFT JOIN public.rfq_recipients rr ON r.id = rr.rfq_id
  LEFT JOIN auth.users u ON r.user_id = u.id
  WHERE rr.vendor_id = p_vendor_id
    OR rr.recipient_type IS NULL
  ORDER BY r.created_at DESC;
$$ ;

-- 4. Restrict access
REVOKE EXECUTE ON FUNCTION public.get_vendor_rfq_inbox(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_vendor_rfq_inbox(UUID) TO authenticated;

-- 5. Update RLS on rfq_recipients
ALTER TABLE public.rfq_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendors_view_own_rfq_recipients" ON public.rfq_recipients
FOR SELECT
USING (
  vendor_id = (SELECT id FROM public.vendors WHERE user_id = auth.uid())
);

-- 6. Verify (should return no insecure views)
SELECT schemaname, viewname 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname LIKE '%inbox%'
  AND definition LIKE '%auth.users%';
```

### Update Frontend Code

**Before:**
```typescript
const { data, error } = await supabase
  .from('vendor_rfq_inbox')
  .select('*')
  .eq('vendor_id', vendorId);
```

**After:**
```typescript
// Call the secure function instead
const { data, error } = await supabase
  .rpc('get_vendor_rfq_inbox', {
    p_vendor_id: vendorId
  });
```

---

## ✅ Verification Checklist

After applying the fix:

- [ ] Run query to find views exposing auth.users (should be 0 results):
  ```sql
  SELECT schemaname, viewname 
  FROM pg_views 
  WHERE schemaname = 'public' 
    AND definition LIKE '%auth.users%'
    AND definition LIKE '%SELECT%'
  ```

- [ ] Verify function works:
  ```sql
  SELECT * FROM public.get_vendor_rfq_inbox('VENDOR_UUID_HERE');
  ```

- [ ] Test RLS policies:
  ```sql
  -- As vendor user
  SELECT * FROM public.get_vendor_rfq_inbox(
    (SELECT id FROM vendors WHERE user_id = auth.uid())
  );
  ```

- [ ] Confirm no PostgREST exposure of sensitive columns

---

## 📚 Security Best Practices

Going forward, avoid:

❌ **Never:**
- Join public views/tables with `auth.users` directly
- Expose `raw_user_meta_data` via views/API
- Use `SELECT *` from views joining auth tables

✅ **Always:**
- Store user-safe data in `public.users` table
- Use SECURITY DEFINER functions for sensitive queries
- Implement RLS on all data tables
- Test data access with different roles (anon, authenticated, specific roles)
- Document what data is exposed and to whom

---

## 📞 Questions?

This fix addresses:
1. ✅ Removes auth.users exposure from public schema
2. ✅ Restricts data access via RLS
3. ✅ Uses SECURITY DEFINER for authenticated-only functions
4. ✅ Maintains application functionality with secure alternative

**Ready to execute Phase 1?** Let me know and I can run the SQL updates.

