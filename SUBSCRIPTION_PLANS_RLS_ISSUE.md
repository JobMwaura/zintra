# 🔴 SECURITY ISSUE: public.subscription_plans - RLS Disabled

## Issue Summary

The `public.subscription_plans` table has **2 RLS policies defined but RLS is NOT ENABLED**.

```
Table: public.subscription_plans
RLS Status: ❌ DISABLED
Policies: 2 policies exist (but are INERT)
  1. "Anyone can view subscription plans"
  2. "Public can view plans"
Risk: 🟡 MEDIUM (public data but misconfigured)
```

---

## Root Cause

**Exact same pattern as admin_users and messages:**

| Component | Status | Result |
|-----------|--------|--------|
| Policies Created | ✅ Yes | Policies defined in PostgreSQL |
| RLS Enabled | ❌ NO | RLS disabled on table |
| Effective Access Control | ❌ NONE | Policies have zero effect |
| Actual Security | ❌ BROKEN | Falls back to GRANT permissions |

---

## Why This Is a Problem

1. **False sense of security**: Policies appear to exist but don't work
2. **Confusing maintenance**: Future developers don't know if RLS is intentional or oversight
3. **Regression risk**: If someone enables RLS later without reviewing policies, behavior changes
4. **Policy purpose unclear**: Are the policies meant to:
   - Allow public access? (Then RLS not needed)
   - Restrict access? (Then RLS must be enabled)

---

## Analysis of Current Policies

The policies suggest **public read access is intended**:
- "Anyone can view subscription plans" → Suggests public visibility
- "Public can view plans" → Confirms public access

**Current behavior (RLS disabled):**
- ✅ Public can read (via GRANT permissions)
- ✅ Everyone can access
- ❌ Policies have no effect

**After enabling RLS:**
- The policies WILL take effect
- Should still allow public access (as intended)
- Better security posture (explicit row filtering)

---

## Recommended Fix

Since the policies are **permissive** (allow public access) and appear intentional, **Option 1 is recommended**:

### Option 1: Enable RLS (Recommended)

**Why this option:**
- Policies were clearly created for a reason
- Names suggest intentional public access
- RLS enables explicit row-level control
- Public data is still public, but explicitly managed
- Aligns with security best practices

**SQL:**
```sql
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
```

**Result:**
- ✅ RLS enabled
- ✅ Policies now active and enforced
- ✅ Public can still access (as policies allow)
- ✅ Better security posture

---

### Option 2: Remove Policies (If RLS Not Needed)

**When to choose this:**
- You prefer traditional GRANT-based access control
- You don't want RLS overhead
- Policies were created by mistake

**SQL:**
```sql
DROP POLICY "Anyone can view subscription plans" ON public.subscription_plans;
DROP POLICY "Public can view plans" ON public.subscription_plans;
```

**Result:**
- ✅ No policies
- ✅ Access via GRANT only
- ⚠️ Less explicit control

---

### Option 3: Tighten & Enable (Most Secure)

**When to choose this:**
- You want explicit control over who sees what
- Some users should NOT see all plans

**SQL:**
```sql
-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Public can view plans" ON public.subscription_plans;

-- Create tightened policies
-- Allow authenticated users to view all plans
CREATE POLICY "Authenticated can view plans" 
  ON public.subscription_plans 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow anonymous to view only public plans (if column exists)
CREATE POLICY "Anonymous can view public plans" 
  ON public.subscription_plans 
  FOR SELECT 
  TO anon 
  USING (is_public = true);  -- Adjust column name as needed

-- Service role bypass
CREATE POLICY "Service role can access all" 
  ON public.subscription_plans 
  FOR ALL 
  TO authenticated 
  USING ((auth.jwt() ->> 'role') = 'service_role');
```

---

## Impact Assessment

### For Option 1 (Enable RLS - Recommended)

**Security Impact:**
- ✅ Better security posture
- ✅ Explicit row-level filtering
- ✅ Matches developer intent (policies exist for a reason)

**Data Access:**
- ✅ Public can still view (policies allow it)
- ✅ No breaking changes expected
- ✅ Same as current behavior

**Performance:**
- ⚠️ Minimal RLS overhead
- Usually <1% impact for simple policies

**Breaking Changes:**
- ❌ None expected (same access as before)

---

## Testing Steps

After applying fix (Option 1):

```sql
-- 1. Verify RLS is enabled
SELECT rowsecurity FROM pg_tables 
WHERE tablename = 'subscription_plans';
-- Expected: true

-- 2. Verify policies exist
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'subscription_plans';
-- Expected: 2

-- 3. Test as anon user (can view?)
-- In app: Try viewing plans without login
-- Expected: Should work (policies allow)

-- 4. Test as authenticated user (can view?)
-- In app: Try viewing plans with login
-- Expected: Should work (policies allow)

-- 5. Query directly (as admin):
SELECT * FROM public.subscription_plans LIMIT 5;
-- Should work (admin bypasses RLS)
```

---

## Implementation Plan

### Quick Fix (2 minutes)

If you want just enable RLS (Option 1):

```sql
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
```

Then verify:
```sql
SELECT rowsecurity FROM pg_tables WHERE tablename = 'subscription_plans';
```

### Full Fix (5 minutes)

Create complete SQL with verification steps (provided below).

---

## Related Issues Found

This is the **4th table** with the same RLS pattern:

| Table | RLS | Policies | Severity | Status |
|-------|-----|----------|----------|--------|
| `admin_users` | ❌ Disabled | 3 | 🔴 HIGH | ✅ FIXED |
| `messages` | ❌ Disabled | 3 | 🔴 HIGH | ✅ FIXED |
| `subscription_plans` | ❌ Disabled | 2 | 🟡 MEDIUM | 🔄 TODO |
| Others? | ? | ? | ? | ❓ AUDIT |

**Recommendation**: Use `RLS_AUDIT_ALL_TABLES.md` to find all others.

---

## Recommended Action

**Recommendation: Apply Option 1 (Enable RLS)**

**Reasoning:**
1. Policies were clearly created intentionally (descriptive names)
2. Suggest public read access is desired (names: "Anyone", "Public")
3. Enabling RLS makes policies effective (best practice)
4. No breaking changes expected (same access as now)
5. Aligns with fixes for admin_users and messages

**Time to implement**: 2-5 minutes
**Risk level**: 🟢 Very Low
**Can rollback**: Yes (single command)

---

## Questions to Answer Before Proceeding

1. **Should subscription plans be viewable by public/anonymous users?**
   - YES → Use Option 1 (enable RLS, keep current policies)
   - NO → Use Option 3 (tighten policies before enabling)

2. **Was RLS intentionally disabled?**
   - NO (oversight) → Use Option 1
   - YES (prefer GRANT) → Use Option 2

3. **Are subscription plans sensitive data?**
   - NO (pricing plans are public) → Use Option 1
   - YES (tiered access needed) → Use Option 3

---

## Next Steps

**Choose your option:**

- **Option 1 (Recommended)**: I'll create SQL to enable RLS
- **Option 2**: I'll create SQL to drop policies
- **Option 3**: I'll create SQL with tightened policies

**Then:**
1. Run the SQL in Supabase
2. Run verification queries
3. Test in your app

---

## Files Available

- `SUBSCRIPTION_PLANS_RLS_FIX.sql` - (Will create when you choose option)
- `RLS_AUDIT_ALL_TABLES.md` - Find similar issues in other tables
- `MESSAGES_RLS_FIX.sql` - Example of same fix (already done)
- `ADMIN_USERS_RLS_FIX.sql` - Example of same fix (already done)

---

**Status**: 🔄 Awaiting your guidance on preferred option
**Priority**: 🟡 Medium (public data, but misconfigured)
**Time to fix**: 2-5 minutes
**Risk**: 🟢 Very Low
