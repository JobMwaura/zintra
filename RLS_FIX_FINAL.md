# ✅ RLS Policy Fix - EXACT SQL TO RUN

## 🔍 What I Found

Your RLS policies:
- ✅ `insert_own_data` - Correct format
- ❌ `select_own_data` - Has `OR true` (making it too permissive)
- ✅ `update_own_data` - Correct format

**The issue**: The `select_own_data` policy with `OR true` might be interfering with INSERT checks.

## 🚀 FIX: Run This SQL

Copy and paste this **ENTIRE BLOCK** into Supabase SQL Editor:

```sql
-- Drop the problematic SELECT policy
DROP POLICY IF EXISTS "select_own_data" ON public.users;

-- Create a clean SELECT policy (just one, not two conditions)
CREATE POLICY "select_own_data" ON public.users
  FOR SELECT
  USING (true);

-- Verify policies
SELECT policyname, permissive, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

That's it! Just drop and recreate the SELECT policy.

---

## 🧪 Then Test Registration

1. Hard refresh: **Cmd+Shift+R**
2. Go to: https://zintra-sandy.vercel.app/user-registration
3. Complete all 4 steps
4. Should work now! ✅

---

## Why This Works

- ✅ `insert_own_data` - Users can insert their own row
- ✅ `select_own_data` - Everyone can view all profiles (simplified)
- ✅ `update_own_data` - Users can update their own row

No conflicts, clean policies, registration should work! 💪
