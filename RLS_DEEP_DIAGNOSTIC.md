# 🔬 Deep Diagnostic - Find the Real Problem

## Run This SQL to Diagnose Everything

```sql
-- 1. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check all constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users' AND table_schema = 'public';

-- 3. Check for triggers
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users' AND trigger_schema = 'public';

-- 4. Check RLS policies in detail
SELECT policyname, permissive, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- 5. Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'users' AND schemaname = 'public';

-- 6. Try a test insert as anon user
INSERT INTO public.users (id, full_name, phone)
VALUES (gen_random_uuid(), 'Test User', '+254700000000')
ON CONFLICT (id) DO NOTHING;
```

Run all of this and share the **exact output** and **any error messages**.

---

## Key Things to Check

1. **Is the ID column** properly set to UUID PRIMARY KEY?
2. **Are there CHECK constraints** that might be blocking?
3. **Are there TRIGGERS** that might be interfering?
4. **Are RLS policies correct** (we already saw they are)?
5. **Can we insert as anon user** (last query)?

---

## Most Likely Issue

The error message says "violates row-level security policy" but we've already created the right policies. This suggests:

- ❌ The INSERT policy might not be active/applied correctly
- ❌ There might be a trigger preventing inserts
- ❌ The auth.uid() might not be set correctly during signup
- ❌ There might be a check constraint we don't know about

The diagnostic will tell us exactly what's wrong! 🔍
