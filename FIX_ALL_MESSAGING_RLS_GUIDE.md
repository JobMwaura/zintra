# 🔧 COMPREHENSIVE FIX: All Messaging RLS Policies

## The Errors You're Seeing

```
❌ POST /vendor_messages 403 (Forbidden)
❌ Error: new row violates row-level security policy for table "notifications"
```

## Root Cause (Both Errors)

Your RLS policies require `auth.uid()` to match, but the **API uses SERVICE_ROLE key** which has `auth.uid() = NULL`.

### The Scenario:
1. Vendor clicks "Send Message"
2. Frontend calls API: `POST /api/vendor/messages/send`
3. API uses SERVICE_ROLE key (for security)
4. API tries: `INSERT INTO vendor_messages ...`
5. RLS policy checks: `auth.uid() = vendor_user_id?`
6. SERVICE_ROLE → `auth.uid() = NULL` → **BLOCKED** ❌

## The Fix (3 RLS Policies)

This SQL allows **SERVICE_ROLE (API) to insert** while keeping security:

### Step 1: Go to Supabase Dashboard

1. **URL:** https://app.supabase.com → Your Project
2. **Click:** SQL Editor (left sidebar)
3. **Click:** New Query

### Step 2: Copy & Paste This SQL

```sql
-- ============================================================================
-- FIX: Both RLS Policies for Messaging System - Allow SERVICE_ROLE
-- ============================================================================

-- STEP 1: Fix vendor_messages INSERT policies
-- ============================================================================

-- Fix vendor INSERT policy
DROP POLICY IF EXISTS "Allow vendors to respond to users" ON public.vendor_messages;

CREATE POLICY "Allow vendors to respond to users" ON public.vendor_messages
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR (
      auth.uid() IN (SELECT user_id FROM public.vendors WHERE id = vendor_id) 
      AND sender_type = 'vendor'
    )
  );

-- Fix user INSERT policy
DROP POLICY IF EXISTS "Allow users to send messages to vendors" ON public.vendor_messages;

CREATE POLICY "Allow users to send messages to vendors" ON public.vendor_messages
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR (
      auth.uid() = user_id 
      AND sender_type = 'user'
    )
  );

-- ============================================================================
-- STEP 2: Fix notifications INSERT policy
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated to insert notifications" ON public.notifications;

CREATE POLICY "Allow insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR auth.uid() = user_id
  );

-- ============================================================================
-- STEP 3: Verify
-- ============================================================================

SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('vendor_messages', 'notifications')
ORDER BY tablename, policyname;
```

### Step 3: Click **Run**

You should see:
- ✅ 2 vendor_messages policies updated
- ✅ 1 notifications policy updated
- ✅ Verification query shows all policies

### Step 4: Test

1. **Hard refresh app:** `Cmd+Shift+R` or `Ctrl+Shift+R`
2. **As vendor:** Go to RFQ Inbox → Click "Contact Buyer"
3. **Type message:** "Test message"
4. **Click Send:** Should now work! ✅
5. **Check dashboard:** Notification should appear

---

## What Each Fix Does

### vendor_messages - Vendor INSERT (Policy 1)
**Before:** Only vendor auth could insert
**After:** SERVICE_ROLE OR vendor auth can insert
**Result:** API can create messages for vendors ✅

### vendor_messages - User INSERT (Policy 2)
**Before:** Only user auth could insert
**After:** SERVICE_ROLE OR user auth can insert
**Result:** API can create messages for users ✅

### notifications - INSERT (Policy 3)
**Before:** Only recipient auth could insert (impossible!)
**After:** SERVICE_ROLE OR user auth can insert
**Result:** API can create notifications for users ✅

---

## Security Check

✅ **Still Secure Because:**
- Users can only **READ** their own notifications (SELECT policy unchanged)
- Users can only **UPDATE** their own notifications (UPDATE policy unchanged)
- Users can only **DELETE** their own notifications (DELETE policy unchanged)
- SERVICE_ROLE only inserts data where user_id = the actual recipient
- No user can manually create notifications for others

---

## What This Enables

| Feature | Before | After |
|---------|--------|-------|
| Vendor sends message | ❌ 403 Forbidden | ✅ Works |
| Message saved to DB | ❌ Blocked | ✅ Saved |
| User gets notification | ❌ Fails | ✅ Appears |
| Dashboard shows alert | ❌ Nothing | ✅ Shows "New message" |
| Real-time updates | ❌ Doesn't happen | ✅ Live updates |

---

## Files

- `FIX_ALL_MESSAGING_RLS.sql` - Ready-to-run SQL in this repo
- `FIX_NOTIFICATION_RLS_INSERT.sql` - Original notifications fix
- `FIX_NOTIFICATION_RLS_GUIDE.md` - Detailed explanation

---

## If Something Else Goes Wrong

Check these:
1. Are you in the correct Supabase project?
2. Are you logged in with the correct account?
3. Did the SQL run without errors?
4. Did you hard-refresh the browser (not just F5)?
5. Check browser console (F12) for any remaining errors

If still failing, check the error message - it might be a different RLS policy.
