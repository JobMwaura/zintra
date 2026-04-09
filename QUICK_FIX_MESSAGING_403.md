# ⚡ QUICK ACT### Step 2: Paste This SQL:

```sql
-- Fix vendor message insert
DROP POLICY IF EXISTS "Allow vendors to respond to users" ON public.vendor_messages;
CREATE POLICY "Allow vendors to respond to users" ON public.vendor_messages FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR (auth.uid() IN (SELECT user_id FROM public.vendors WHERE id = vendor_id) AND sender_type = 'vendor'));

DROP POLICY IF EXISTS "Allow users to send messages to vendors" ON public.vendor_messages;
CREATE POLICY "Allow users to send messages to vendors" ON public.vendor_messages FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR (auth.uid() = user_id AND sender_type = 'user'));

-- Fix notifications insert
DROP POLICY IF EXISTS "Allow authenticated to insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow insert notifications" ON public.notifications;
CREATE POLICY "Allow insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() = user_id);
```aging 403 Error Now

## What's Broken
```
❌ vendor_messages 403 (Forbidden)
❌ notifications RLS policy violation
```

## 3-Minute Fix

### 1️⃣ Go to Supabase
https://app.supabase.com → Your Project → **SQL Editor**

### 2️⃣ New Query, Paste This:

```sql
-- Fix vendor message insert
DROP POLICY IF EXISTS "Allow vendors to respond to users" ON public.vendor_messages;
CREATE POLICY "Allow vendors to respond to users" ON public.vendor_messages FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR (auth.uid() IN (SELECT user_id FROM public.vendors WHERE id = vendor_id) AND sender_type = 'vendor'));

DROP POLICY IF EXISTS "Allow users to send messages to vendors" ON public.vendor_messages;
CREATE POLICY "Allow users to send messages to vendors" ON public.vendor_messages FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR (auth.uid() = user_id AND sender_type = 'user'));

-- Fix notifications insert
DROP POLICY IF EXISTS "Allow authenticated to insert notifications" ON public.notifications;
CREATE POLICY "Allow insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() = user_id);
```

### 3️⃣ Click **Run**

### 4️⃣ Hard Refresh App
- Mac: `Cmd+Shift+R`
- Windows: `Ctrl+Shift+R`

### 5️⃣ Test
Vendor sends message → Should work ✅

---

## Why This Works

API uses SERVICE_ROLE to insert messages/notifications on behalf of users, but old RLS policies only allowed direct user inserts. This fix allows both.

Still secure because SERVICE_ROLE only inserts correct data (user_id, vendor_id match).

---

**Detailed Guide:** `FIX_ALL_MESSAGING_RLS_GUIDE.md`
**SQL File:** `supabase/sql/FIX_ALL_MESSAGING_RLS.sql`
