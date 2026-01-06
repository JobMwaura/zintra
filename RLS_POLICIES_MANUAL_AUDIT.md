# 🔐 RLS POLICIES AUDIT - Manual Check

Your RFQ submissions might be blocked by RLS policies. Let's audit them!

## Step 1: Copy the SQL Audit Script

Go to **Supabase Dashboard → SQL Editor** and copy this entire SQL script:

```sql
-- ============================================================================
-- VIEW ALL RLS POLICIES ON RFQ-RELATED TABLES
-- ============================================================================

SELECT 
  tablename,
  policyname,
  CASE WHEN permissive THEN '✅ ALLOW' ELSE '❌ DENY' END as type,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has SELECT condition'
    ELSE 'No SELECT condition'
  END as select_check,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has INSERT/UPDATE condition'
    ELSE 'No INSERT/UPDATE condition'
  END as insert_check
FROM pg_policies
WHERE tablename IN ('rfqs', 'rfq_recipients', 'users', 'categories')
ORDER BY tablename, policyname;
```

## Step 2: Run It

Click **Run** in Supabase SQL Editor

## Step 3: Analyze Results

Look at the results for the `rfqs` table specifically.

### ✅ What Should Be There (Correct Setup)

```
rfqs | Users can create RFQs      | ✅ ALLOW | No SELECT condition          | Has INSERT/UPDATE condition
rfqs | Users can see own RFQs     | ✅ ALLOW | Has SELECT condition         | No INSERT/UPDATE condition
rfqs | Users can update own RFQs  | ✅ ALLOW | Has SELECT condition         | Has INSERT/UPDATE condition
rfqs | See public RFQs            | ✅ ALLOW | Has SELECT condition         | No INSERT/UPDATE condition
rfqs | Vendors can see assigned   | ✅ ALLOW | Has SELECT condition         | No INSERT/UPDATE condition
```

### ❌ What Would Block RFQ Creation

```
rfqs | (no INSERT policies at all)        ❌ PROBLEM: Can't create RFQs
rfqs | Some Policy                | ❌ DENY  (any row)               ❌ PROBLEM: Explicitly blocking
rfqs | Policy with false check    |     With_check = 'false'            ❌ PROBLEM: Denies all inserts
```

---

## More Detailed Check

To see the EXACT policy conditions, run this:

```sql
-- ============================================================================
-- DETAILED RFQ POLICY CONDITIONS
-- ============================================================================

SELECT 
  tablename,
  policyname,
  CASE WHEN permissive THEN '✅ ALLOW' ELSE '❌ DENY' END as type,
  qual as "SELECT condition (qual)",
  with_check as "INSERT condition (with_check)"
FROM pg_policies
WHERE tablename = 'rfqs'
ORDER BY policyname;
```

This will show you the exact conditions like:
- `auth.uid() = user_id` (Good ✅)
- `false` (Bad - blocks everything ❌)
- `NULL` (Might be okay depending on policy name)

---

## Most Important: Check the INSERT Policy

Run this to see ONLY the policy that controls RFQ creation:

```sql
SELECT 
  policyname,
  permissive,
  with_check as "INSERT condition"
FROM pg_policies
WHERE tablename = 'rfqs' 
  AND with_check IS NOT NULL
ORDER BY policyname;
```

### Expected Result (Correct):
```
Users can create RFQs | true | auth.uid() = user_id
```

### Problems to Look For:

1. **No results** = ❌ No INSERT policy exists
   - **Fix**: Create one:
   ```sql
   CREATE POLICY "Users can create RFQs"
     ON rfqs FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   ```

2. **with_check = false** = ❌ Explicitly denies inserts
   - **Fix**: Drop and recreate:
   ```sql
   DROP POLICY "Problem Policy Name" ON rfqs;
   CREATE POLICY "Users can create RFQs"
     ON rfqs FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   ```

3. **with_check is NULL** = ⚠️ Might be SELECT-only policy
   - **Fix**: Check if you have an INSERT policy with a non-NULL with_check

4. **with_check = some complex condition** = ⚠️ Might be too restrictive
   - **Example**: `with_check = admin_id = auth.uid()`
   - **Fix**: Should be: `with_check = auth.uid() = user_id`

---

## Quick Diagnostic: Run ALL These Commands

Copy and paste each one at a time into **Supabase SQL Editor**:

### 1. Count policies on rfqs
```sql
SELECT COUNT(*) as total_policies 
FROM pg_policies 
WHERE tablename = 'rfqs';
```

**Expected result**: Should be 5+ policies

---

### 2. Check if RLS is enabled on rfqs
```sql
SELECT rowsecurity 
FROM pg_tables 
WHERE tablename = 'rfqs' 
AND schemaname = 'public';
```

**Expected result**: `true` (RLS is enabled)
**If false**: RLS might not be working

---

### 3. List all rfqs policies with their types
```sql
SELECT 
  policyname,
  CASE WHEN permissive THEN 'ALLOW' ELSE 'DENY' END as allow_or_deny,
  CASE 
    WHEN qual IS NOT NULL THEN 'SELECT'
    WHEN with_check IS NOT NULL THEN 'INSERT/UPDATE'
    ELSE 'UNKNOWN'
  END as operation
FROM pg_policies
WHERE tablename = 'rfqs'
ORDER BY policyname;
```

**Expected result**: Mix of ALLOW SELECT and ALLOW INSERT

---

### 4. Show the exact INSERT policy condition
```sql
SELECT 
  policyname,
  with_check
FROM pg_policies
WHERE tablename = 'rfqs' 
  AND with_check IS NOT NULL
  AND permissive = true;
```

**Expected result**: 
```
Users can create RFQs | auth.uid() = user_id
```

---

## What to Do If You Find Problems

### Problem 1: No INSERT Policies
```sql
-- Create the missing INSERT policy
CREATE POLICY "Users can create RFQs"
  ON rfqs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Problem 2: Blocking Policies
```sql
-- Drop the blocking policy
DROP POLICY "Problem Policy Name" ON rfqs;

-- Create correct policy if needed
CREATE POLICY "Users can create RFQs"
  ON rfqs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Problem 3: Wrong Condition
```sql
-- Drop and recreate with correct condition
DROP POLICY "Bad Policy Name" ON rfqs;

CREATE POLICY "Users can create RFQs"
  ON rfqs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## After Fixing

1. **Test in Supabase SQL Editor** (as anon role):
   ```sql
   -- Try to create a test RFQ
   INSERT INTO rfqs (
     title,
     user_id,
     category_slug,
     budget_min,
     budget_max,
     status
   ) VALUES (
     'Test',
     auth.uid(),
     'test',
     100,
     500,
     'submitted'
   );
   ```

2. **Test your app**: Try creating an RFQ through the UI
3. **Check dashboard**: `/my-rfqs` should show your RFQ

---

## Summary Checklist

- [ ] Ran detailed policy query in Supabase SQL Editor
- [ ] Confirmed 5+ policies on rfqs table
- [ ] Confirmed RLS is enabled (rowsecurity = true)
- [ ] Found "Users can create RFQs" policy
- [ ] Verified with_check = "auth.uid() = user_id"
- [ ] No DENY policies found
- [ ] Tested INSERT with test RFQ
- [ ] Tried creating RFQ through app UI

If all checks pass, RFQ submission should work! ✅
