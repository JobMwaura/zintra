# 🔍 RLS Audit: Find All Tables with Policies But RLS Disabled

## Problem Pattern

Some tables have RLS policies created but RLS is **NOT enabled**, making the policies inert.

**Tables Found So Far:**
- ❌ `admin_users` - FIXED
- ❌ `messages` - READY TO FIX

**Potentially Others:** Need to audit

---

## 🔎 SQL Query to Find Affected Tables

Run this query in Supabase SQL Editor to find all tables with this issue:

```sql
-- Find tables with policies but RLS disabled
SELECT 
  t.schemaname,
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count,
  STRING_AGG(DISTINCT p.policyname, ', ') as policy_names
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = false  -- RLS is disabled
  AND p.policyname IS NOT NULL  -- But has policies
GROUP BY t.schemaname, t.tablename, t.rowsecurity
ORDER BY t.tablename;
```

**This will show:**
- `schemaname`: public
- `tablename`: Table name
- `rls_enabled`: false (the problem)
- `policy_count`: How many policies exist
- `policy_names`: List of policy names

---

## Expected Findings

Based on the codebase review, these tables might have the same issue:

| Table | Policies | Status | Action |
|-------|----------|--------|--------|
| `admin_users` | 3+ | ✅ FIXED | Already fixed |
| `messages` | 3 | 🟡 READY | Use MESSAGES_RLS_FIX.sql |
| `notifications` | ? | ❓ AUDIT | Run diagnostic |
| `vendor_messages` | ? | ❓ AUDIT | Run diagnostic |
| `conversations` | ? | ❓ AUDIT | Run diagnostic |
| Other tables | ? | ❓ AUDIT | Run diagnostic |

---

## Fix Pattern (For Any Table)

Once you identify a table with this issue, the fix is always the same:

```sql
-- Step 1: Enable RLS
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

-- Step 2: Verify
SELECT rowsecurity FROM pg_tables 
WHERE tablename = '<table_name>' AND schemaname = 'public';
-- Should return: true ✅
```

---

## Tables to Check

### 1. notifications
```sql
-- Check notifications table
SELECT 
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'notifications') as policy_count
FROM pg_tables 
WHERE tablename = 'notifications' AND schemaname = 'public';
```

### 2. vendor_messages
```sql
-- Check vendor_messages table
SELECT 
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'vendor_messages') as policy_count
FROM pg_tables 
WHERE tablename = 'vendor_messages' AND schemaname = 'public';
```

### 3. conversations
```sql
-- Check conversations table
SELECT 
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'conversations') as policy_count
FROM pg_tables 
WHERE tablename = 'conversations' AND schemaname = 'public';
```

### 4. All public tables (comprehensive)
```sql
-- Show RLS status for all public tables
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## Interpretation

For the comprehensive audit results:

| rls_enabled | policy_count | Interpretation | Action |
|-------------|--------------|-----------------|--------|
| true | 0 | OK - No policies needed | ✅ Fine |
| true | > 0 | OK - RLS working | ✅ Fine |
| false | 0 | OK - No policies, no RLS | ✅ Fine |
| **false** | **> 0** | ❌ PROBLEM - Policies inert | 🔴 FIX |

---

## Fix Checklist

After running the audit query, for each table with `rls_enabled = false` AND `policy_count > 0`:

- [ ] Note the table name
- [ ] Note the policy count
- [ ] Note the policy names
- [ ] Run: `ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;`
- [ ] Verify: `SELECT rowsecurity FROM pg_tables WHERE tablename = '<table>';` returns `true`
- [ ] Test access control with different users
- [ ] Commit to git with note about which tables were fixed

---

## Template: Fix for Any Table

Use this template to create a fix for any newly discovered table:

```sql
-- ============================================================================
-- SECURITY FIX: <table_name> Table - Enable RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = '<table_name>') as policy_count
FROM pg_tables 
WHERE tablename = '<table_name>' AND schemaname = 'public';

-- Expected output: rls_enabled = true ✅
```

---

## Testing Each Fix

After enabling RLS on any table, test it:

```javascript
// Test 1: User A should NOT see User B's data
const { data, error } = await supabase
  .from('<table_name>')
  .select('*')
  .eq('user_id', user_b_id);

if (error) {
  console.log('✅ Good: Permission denied for other user data');
} else if (data.length === 0) {
  console.log('✅ Good: No data returned (RLS filtered)');
} else {
  console.log('❌ Bad: User can see other users data!');
}

// Test 2: User A should see their own data
const { data: ownData } = await supabase
  .from('<table_name>')
  .select('*')
  .eq('user_id', auth.uid());

if (ownData && ownData.length > 0) {
  console.log('✅ Good: User can see their own data');
} else {
  console.log('❌ Bad: User cannot see their own data');
}
```

---

## Documentation

For each table you fix, create:
1. A SQL fix file: `<TABLE_NAME>_RLS_FIX.sql`
2. A documentation file: `<TABLE_NAME>_RLS_SECURITY_ISSUE.md`
3. A cross-check file: `<TABLE_NAME>_RLS_CROSS_CHECK.md`

Use the existing fixes as templates:
- `ADMIN_USERS_RLS_FIX.sql`
- `MESSAGES_RLS_FIX.sql`

---

## Priority Order

Fix tables in this order (by privacy impact):

1. 🔴 **HIGH** (Privacy): `messages`, `conversations`, `vendor_messages`
2. 🟡 **MEDIUM** (Admin): `admin_users`, `notifications`
3. 🟢 **LOW** (Non-sensitive): Other tables

---

## Automation SQL (Find & Report)

This comprehensive SQL finds all issues and reports them:

```sql
-- Find all RLS configuration issues
SELECT 
  'ISSUE: RLS Disabled but Policies Exist' as issue_type,
  t.tablename,
  false as rls_enabled,
  COUNT(p.policyname) as policy_count,
  STRING_AGG(p.policyname, E'\n') as policies,
  'ALTER TABLE public.' || t.tablename || ' ENABLE ROW LEVEL SECURITY;' as fix_sql
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = false
  AND p.policyname IS NOT NULL
GROUP BY t.tablename

UNION ALL

SELECT 
  'OK: RLS Enabled' as issue_type,
  tablename,
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename),
  (SELECT STRING_AGG(policyname, E'\n') FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename),
  'No action needed'
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true

UNION ALL

SELECT 
  'OK: No Policies' as issue_type,
  tablename,
  rowsecurity,
  0,
  'None',
  'No action needed'
FROM pg_tables
WHERE schemaname = 'public' 
  AND rowsecurity = false
  AND tablename NOT IN (SELECT tablename FROM pg_policies WHERE schemaname = 'public')

ORDER BY issue_type DESC, tablename;
```

---

## Summary

**Current Status:**
- ✅ `admin_users` - FIXED
- 🟡 `messages` - READY TO FIX  
- ❓ Others - NEED TO AUDIT

**Next Step:** 
Run the audit query to find all tables with this issue, then fix them using the same pattern.

**Total Time for Full Audit:** ~5 minutes
**Time to Fix Each Table:** ~2 minutes

---

## Files for Reference

| File | Purpose |
|------|---------|
| `ADMIN_USERS_RLS_FIX.sql` | Example of complete fix |
| `MESSAGES_RLS_FIX.sql` | Ready-to-use fix |
| `ADMIN_USERS_RLS_SECURITY_ISSUE.md` | Detailed explanation template |
| `MESSAGES_RLS_CROSS_CHECK.md` | Cross-check template |

