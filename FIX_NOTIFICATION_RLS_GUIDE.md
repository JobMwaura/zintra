# 🔧 Fix: Notification RLS Policy Error - INSERT Blocked

## The Error You're Seeing

```
Error sending message: {code: '42501', details: null, hint: null, message: 'new row violates row-level security policy for table "notifications"'}
POST https://zeomgqlnztcdqtespsjx.supabase.co/rest/v1/vendor_messages 403 (Forbidden)
```

## Root Cause

The `notifications` table has an **INSERT RLS policy that's too restrictive**:

```sql
-- PROBLEM: This only allows the user inserting the row
WITH CHECK (auth.uid() = user_id);
```

This works for user-facing apps where the user inserts their own data, but **fails when the API (SERVICE_ROLE) tries to insert notifications on behalf of users**.

### The Scenario:
1. Vendor sends message via API
2. API uses SERVICE_ROLE key to insert notification
3. RLS policy checks: "Is auth.uid() = user_id?"
4. SERVICE_ROLE ≠ user_id → **BLOCKED** ❌

## The Fix

### Step 1: Go to Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New query**

### Step 2: Copy & Paste This SQL

```sql
-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Allow authenticated to insert notifications" ON public.notifications;

-- Create new INSERT policy that allows:
-- 1. SERVICE_ROLE (API) to insert ANY notification
-- 2. Authenticated users to insert notifications for themselves
CREATE POLICY "Allow insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (
    -- Allow SERVICE_ROLE (API) to insert
    auth.jwt() ->> 'role' = 'service_role'
    -- OR allow authenticated users to insert for themselves
    OR auth.uid() = user_id
  );

-- Verify the policy
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;
```

### Step 3: Click **Run**

You should see:
- ✅ Policy dropped
- ✅ New policy created
- ✅ 3 policies in verification (SELECT, INSERT, UPDATE)

### Step 4: Test

1. Refresh your app (hard refresh: `Cmd+Shift+R` or `Ctrl+Shift+R`)
2. Send a message as vendor
3. The message should send ✅
4. Notification should appear in dashboard ✅

## What This Does

| Before | After |
|--------|-------|
| ❌ Only user can insert own notification | ✅ User OR API (service role) can insert |
| ❌ API notifications blocked by RLS | ✅ API can create notifications for users |
| ❌ "403 Forbidden" error | ✅ Messages send + notifications appear |

## Security

This is **still secure** because:
- ✅ Users can still only READ their own notifications (SELECT policy unchanged)
- ✅ Users can still only UPDATE their own notifications (UPDATE policy unchanged)
- ✅ Users can still only DELETE their own notifications (DELETE policy unchanged)
- ✅ SERVICE_ROLE only inserts notifications where `user_id` is the actual recipient
- ✅ No user can manually insert fake notifications for other users

---

## If You Want to Be Extra Safe

You can also add a separate policy that ONLY allows the API to insert:

```sql
CREATE POLICY "API can insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

This keeps the user INSERT policy separate if you ever want users to create notifications directly.
