# Implementation Guide: Fix vendor_rfq_inbox Security Issue

## 🎯 Quick Summary

**Problem**: `vendor_rfq_inbox` view exposes sensitive auth.users data (emails, metadata)  
**Solution**: Replace with a secure `get_vendor_rfq_inbox()` function  
**Impact**: ✅ No functional changes, just backend security improvement  
**Effort**: ~30 minutes total  

---

## 📋 Step-by-Step Implementation

### Phase 1: Execute SQL Migration (5 minutes)

**Location**: Supabase Dashboard > SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your zintra project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy-paste the contents of `SECURITY_FIX_VENDOR_RFQ_INBOX.sql`
6. Click "Run" (the play button)
7. Verify: You should see success messages for each operation

**What it does:**
- ✅ Removes the insecure view
- ✅ Creates a secure function with authentication checks
- ✅ Restricts permissions to authenticated users only
- ✅ Adds RLS policies for extra security

---

### Phase 2: Update Frontend Code (15 minutes)

**Files to Update:**
1. `app/vendor-profile/[id]/page.js` (line 180)
2. `components/vendor-profile/RFQInboxTab.js` (line 36)

#### File 1: `app/vendor-profile/[id]/page.js`

**Before:**
```javascript
const { data: rfqs } = await supabase
  .from('vendor_rfq_inbox')
  .select('*')
  .eq('vendor_id', vendorData.id);
```

**After:**
```javascript
const { data: rfqs } = await supabase.rpc('get_vendor_rfq_inbox', {
  p_vendor_id: vendorData.id
});
```

#### File 2: `components/vendor-profile/RFQInboxTab.js`

**Before:**
```javascript
const { data: rfqs, error } = await supabase
  .from('vendor_rfq_inbox')
  .select('*')
  .eq('vendor_id', vendorId);
```

**After:**
```javascript
const { data: rfqs, error } = await supabase.rpc('get_vendor_rfq_inbox', {
  p_vendor_id: vendorId
});
```

---

### Phase 3: Test (5 minutes)

**Test the function in Supabase SQL Editor:**

```sql
-- Get your vendor UUID (replace with actual value)
SELECT id, user_id FROM public.vendors LIMIT 1;

-- Test the function with a real vendor ID
SELECT * FROM public.get_vendor_rfq_inbox('VENDOR_UUID_HERE') LIMIT 5;
```

**Expected result:**
- ✅ Function returns RFQ data
- ✅ Columns include: id, rfq_id, requester_id, vendor_id, title, etc.
- ✅ requester_email shows email (not metadata)
- ✅ requester_name shows full_name (from public.users table)

**Test in your app:**
1. Sign in as a vendor
2. Go to Vendor Profile > RFQ Inbox tab
3. Verify RFQs load correctly
4. Verify vendor can see requester email and name

---

## 🔍 Verification Queries

Run these in Supabase SQL Editor to confirm security improvements:

### Check 1: Confirm view is removed
```sql
SELECT schemaname, viewname 
FROM pg_views 
WHERE viewname = 'vendor_rfq_inbox';
-- Expected: 0 rows (view is gone) ✅
```

### Check 2: Confirm function exists
```sql
SELECT routine_name, routine_type, security_type
FROM information_schema.routines 
WHERE routine_name = 'get_vendor_rfq_inbox';
-- Expected: 1 row with security_type = 'DEFINER' ✅
```

### Check 3: Confirm no auth.users exposure in public views
```sql
SELECT schemaname, viewname, definition
FROM pg_views 
WHERE schemaname = 'public' 
  AND definition LIKE '%auth.users%'
LIMIT 10;
-- Expected: 0 rows (no auth.users in public views) ✅
```

### Check 4: Confirm RLS is enabled on rfq_recipients
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'rfq_recipients'
  AND rowsecurity = true;
-- Expected: 1 row (RLS enabled) ✅
```

---

## 📝 Code Changes Summary

### Changes Made:
| File | Change | Type |
|------|--------|------|
| `SECURITY_FIX_VENDOR_RFQ_INBOX.sql` | Database migration | SQL |
| `app/vendor-profile/[id]/page.js` | Update query method | Frontend |
| `components/vendor-profile/RFQInboxTab.js` | Update query method | Frontend |

### Lines Changed:
- `app/vendor-profile/[id]/page.js` - Line 180 (1 line change)
- `components/vendor-profile/RFQInboxTab.js` - Line 36 (1 line change)

### No Changes To:
- ✅ Table schemas
- ✅ Data structure
- ✅ API responses (same columns returned)
- ✅ User experience
- ✅ Performance (actually slightly improved)

---

## ⚡ Quick Implementation Checklist

- [ ] Execute SQL migration in Supabase Dashboard
- [ ] Run verification queries (4 checks above)
- [ ] Update `app/vendor-profile/[id]/page.js` line 180
- [ ] Update `components/vendor-profile/RFQInboxTab.js` line 36
- [ ] Test vendor profile RFQ inbox tab
- [ ] Run local build: `npm run build`
- [ ] Push to GitHub
- [ ] Deploy to Vercel

---

## 🚨 Troubleshooting

### Error: "function get_vendor_rfq_inbox does not exist"
**Solution**: The SQL migration didn't execute successfully. Check:
1. Verify you ran the full SQL in Supabase SQL Editor
2. Look for error messages in the query output
3. Re-run the SQL if needed

### Error: "Column 'vendor_id' of relation 'vendor_rfq_inbox' does not exist"
**Solution**: The old view still exists. Run:
```sql
DROP VIEW IF EXISTS public.vendor_rfq_inbox CASCADE;
```

### Function returns no data
**Solution**: The vendor_id might not exist. Try:
```sql
SELECT * FROM public.get_vendor_rfq_inbox(
  (SELECT id FROM public.vendors LIMIT 1)
);
```

### Function still shows old columns
**Solution**: Clear Supabase cache. In your code:
```typescript
// Clear the cache
supabase.removeAllChannels();

// Or refresh the entire client
const newSupabase = createClient(...);
```

---

## 📚 Security Improvements Delivered

✅ **Removed PII Exposure**
- auth.users email no longer directly exposed
- raw_user_meta_data no longer exposed
- Using sanitized data from public.users table instead

✅ **Added Authentication Checks**
- Function only accessible to authenticated users
- Anonymous users cannot access vendor RFQ data

✅ **Added Authorization Filtering**
- Vendors only see their own RFQs (enforced by RLS policy)
- Even if accessed through the API, data is filtered

✅ **SECURITY DEFINER Pattern**
- Function executes with controlled permissions
- Users don't need direct table access

✅ **Audit Trail**
- All data access goes through one controlled function
- Easier to monitor and log access

---

## 🔄 Rollback Plan (If Needed)

If you need to revert:

```sql
-- Drop the secure function
DROP FUNCTION IF EXISTS public.get_vendor_rfq_inbox(UUID) CASCADE;

-- Recreate the original view (if still needed, though insecure)
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
  u.email AS requester_email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) AS requester_name
FROM public.rfqs r
LEFT JOIN public.rfq_recipients rr ON r.id = rr.rfq_id
LEFT JOIN auth.users u ON r.user_id = u.id
WHERE rr.vendor_id IS NOT NULL OR rr.recipient_type IS NULL
ORDER BY r.created_at DESC;
```

Then revert the frontend code changes back to using `.from('vendor_rfq_inbox')`.

---

## ✨ Next Steps

1. **Immediate** (Today):
   - [ ] Execute SQL migration
   - [ ] Run verification queries
   - [ ] Update frontend code
   - [ ] Test locally

2. **Short-term** (This Week):
   - [ ] Deploy to production
   - [ ] Monitor for any issues
   - [ ] Review other views for similar exposures

3. **Long-term** (This Month):
   - [ ] Document data access patterns
   - [ ] Audit all auth.users exposures in the codebase
   - [ ] Implement security scanning in CI/CD

---

## 📞 Support

If you run into any issues, check:
1. **SECURITY_FIX_VENDOR_RFQ_INBOX.md** - Detailed explanation
2. **SECURITY_FIX_VENDOR_RFQ_INBOX.sql** - Full migration script
3. **Supabase Logs** - Check for SQL errors
4. **Browser Console** - Check for frontend errors

Ready to implement? Start with **Phase 1: Execute SQL Migration** above! ✅

