# 📨 RLS Policy: Vendors Can Send Messages to Users

## Purpose
Allows authenticated vendors to send messages to users through the vendor_messages table, while keeping security intact.

---

## What This Policy Does

### ✅ Allows:
- Vendors to send messages (sender_type = 'vendor')
- API to send messages on behalf of vendors (SERVICE_ROLE)
- Messages only if vendor is owned by current user

### ❌ Blocks:
- Non-vendors from sending vendor messages
- Vendors from sending on behalf of other vendors
- Messages with incorrect sender_type

---

## How to Apply

### Step 1: Open Supabase
https://app.supabase.com → Your Project → **SQL Editor**

### Step 2: Create New Query
Click the blue **"New Query"** button

### Step 3: Copy & Paste This SQL

```sql
-- Enable RLS
ALTER TABLE public.vendor_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policy
DROP POLICY IF EXISTS "Vendors can send messages to users" ON public.vendor_messages;

-- Create new policy
CREATE POLICY "Vendors can send messages to users" ON public.vendor_messages
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR (
      auth.uid() IN (
        SELECT user_id FROM public.vendors WHERE id = vendor_id
      )
      AND sender_type = 'vendor'
    )
  );
```

### Step 4: Click **Run**

You should see:
- ✅ Query executed successfully
- ✅ No errors

### Step 5: Verify

Run this query to confirm the policy exists:

```sql
SELECT policyname, cmd, permissive
FROM pg_policies 
WHERE tablename = 'vendor_messages'
ORDER BY policyname;
```

You should see:
- `Vendors can send messages to users` - INSERT

---

## How It Works

### For Vendor Sending Via Frontend:
```
Vendor clicks "Send Message"
    ↓
Frontend: POST /api/vendor/messages/send
    ↓
Body: {
  vendorId: "vendor-123",
  messageText: "Hello!",
  senderType: "vendor",
  userId: "user-456"
}
    ↓
API inserts into vendor_messages
    ↓
RLS checks:
  - auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_123)? 
  - YES (vendor owner is logged in)
  - sender_type = 'vendor'? YES
    ↓
✅ INSERT allowed
```

### For API Sending on Behalf of Vendor:
```
System trigger or scheduled job
    ↓
API uses SERVICE_ROLE key
    ↓
API inserts with vendor_id and sender_type='vendor'
    ↓
RLS checks:
  - auth.jwt() ->> 'role' = 'service_role'? YES
    ↓
✅ INSERT allowed
```

### For Non-Vendor Trying to Send:
```
Non-vendor clicks "Send" (shouldn't happen)
    ↓
RLS checks:
  - auth.jwt() ->> 'role' = 'service_role'? NO
  - auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_123)? NO
    ↓
❌ INSERT blocked - Policy violation
```

---

## Security Features

✅ **Vendor Isolation:**
- Vendors can only send from their own vendor accounts
- Can't impersonate other vendors

✅ **Type Safety:**
- Requires sender_type = 'vendor'
- Prevents vendors from sending user-type messages

✅ **API Access:**
- SERVICE_ROLE can send (needed for automated messages)
- But only when data is correct (database schema enforces this)

✅ **No PII Leaks:**
- Policy doesn't expose email or phone
- Message content is what vendor writes

---

## Testing

### Test 1: Vendor Sends Message
1. Log in as vendor
2. Go to vendor inbox
3. Click "Send" to respond to user
4. Should succeed ✅

### Test 2: Non-Vendor Tries to Send
1. Log in as regular user
2. Try to call API directly with vendor_id
3. Should get: `new row violates row-level security policy` ❌

### Test 3: Vendor Impersonation Blocked
1. Vendor A tries to send from Vendor B's account
2. Should get: `new row violates row-level security policy` ❌

---

## Combined With Other Policies

This policy works alongside:
- **User INSERT policy:** "Allow users to send messages to vendors"
- **SELECT policies:** Users/vendors can only read their own messages
- **UPDATE policies:** Can mark own messages as read

---

## Troubleshooting

### Error: Policy already exists
**Solution:** The SQL includes `DROP POLICY IF EXISTS` to handle this

### Error: Permission denied
**Solution:** You must be logged in as Supabase project admin

### Vendor messages still blocked
**Solution:** Verify:
1. RLS is enabled on vendor_messages
2. Policy was created successfully
3. Your vendor_id exists in vendors table
4. Your user_id matches vendor.user_id

---

## Related Files
- `POLICY_VENDOR_SEND_MESSAGES.sql` - This file
- `FIX_ALL_MESSAGING_RLS.sql` - Comprehensive fix for all messaging policies
- `VENDOR_MESSAGING_SYSTEM.sql` - Complete messaging system setup
