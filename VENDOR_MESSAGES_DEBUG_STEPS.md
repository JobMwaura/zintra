# VENDOR MESSAGE DEBUGGING GUIDE - STEP BY STEP

**Status**: Ready to debug
**Objective**: Ensure vendors can see messages from users
**Estimated time**: 15-30 minutes

---

## PHASE 1: Check if Data Exists

### Step 1.1: Query vendor_messages table directly

Go to **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Check if any messages exist
SELECT COUNT(*) as total_messages FROM public.vendor_messages;

-- See recent messages
SELECT 
  id,
  vendor_id,
  user_id,
  sender_type,
  LEFT(message_text, 50) as message_preview,
  is_read,
  created_at
FROM public.vendor_messages
ORDER BY created_at DESC
LIMIT 20;
```

**Expected result**: 
- You should see at least 1 message
- `sender_type` should be `'user'` for messages from users
- `vendor_id` and `user_id` should NOT be NULL

**If empty**: 
- User hasn't sent messages yet - try sending a test message first
- Check UserVendorMessagesTab.js is calling the API correctly

---

### Step 1.2: Check vendor profile exists

```sql
-- Find vendors in the system
SELECT 
  id,
  user_id,
  company_name
FROM public.vendors
LIMIT 10;
```

**Expected result**: 
- At least one vendor with a valid `user_id`
- `company_name` should not be NULL

**If empty**: 
- No vendors exist in system
- Vendor needs to complete vendor onboarding first

---

## PHASE 2: Check Notifications (Verify Trigger Works)

### Step 2.1: Check if notifications were created

```sql
-- See recent notifications
SELECT 
  id,
  user_id,
  type,
  title,
  LEFT(body, 50) as body_preview,
  related_id,
  related_type,
  created_at
FROM public.notifications
WHERE type = 'message'
ORDER BY created_at DESC
LIMIT 20;
```

**Expected result**: 
- Notifications exist with type `'message'`
- `related_type` should be `'vendor_message'`
- `user_id` should be the vendor owner's user_id

**If empty**: 
- Trigger function might not be executing
- Check trigger: `trigger_notify_on_message` on `vendor_messages`

---

## PHASE 3: Verify RLS Policies Allow Access

### Step 3.1: Test if vendor can read their messages

**IMPORTANT**: Simulate being logged in as vendor user

In Supabase SQL Editor:
1. Click "RLS" toggle (top right)
2. Set the auth.uid() to a vendor owner's user ID
3. Run:

```sql
-- Test: Can vendor read messages sent to their vendor?
SELECT 
  vm.*,
  v.company_name
FROM public.vendor_messages vm
JOIN public.vendors v ON vm.vendor_id = v.id
WHERE vm.vendor_id = (
  SELECT id FROM public.vendors WHERE user_id = auth.uid() LIMIT 1
)
ORDER BY vm.created_at DESC;
```

**Expected result**: 
- Messages show up when RLS is simulating vendor user
- If empty, RLS policy is BLOCKING access

**If blocked**: 
- Check policy: "Allow vendors to read messages to their profile"
- Should be: `WHERE auth.uid() IN (SELECT user_id FROM public.vendors WHERE id = vendor_id)`

---

## PHASE 4: Test the Component

### Step 4.1: Open vendor dashboard and check console logs

1. **Go to `/vendor-messages`** in your app as a vendor user
2. **Open DevTools** (F12 → Console tab)
3. **You should see logs like:**

```
✅ Current user: (user-id-here)
✅ Vendor data: {id: '...', user_id: '...', company_name: '...'}
✅ Total messages fetched: 5 [{...}, {...}, ...]
📦 Conversation map keys: ["user-id-1", "user-id-2"]
💬 Final conversation list: [{userId: '...', unreadCount: 2, ...}, ...]
```

**Debugging by log level:**

| Log | Meaning | What to check |
|-----|---------|---------------|
| ❌ Auth error | User not logged in | Login again |
| ⚠️ No vendor profile | User not a vendor | Create vendor profile |
| ✅ Vendor data | Vendor found | Good! Continue... |
| ✅ Total messages fetched: 0 | No messages | Check Phase 1 |
| ✅ Total messages fetched: 5 | Messages exist | Good! Continue... |
| 📦 Conversation map keys: [] | No conversations | RLS might be blocking |
| 💬 Final conversation list: [] | Empty list | RLS issue or data issue |

### Step 4.2: What if messages aren't showing?

**If you see "Total messages fetched: 0"**:
- Messages aren't in database yet
- Go back to Phase 1
- Have user send a test message

**If you see "Total messages fetched: 5" but "Final conversation list: []"**:
- Problem: Conversation map is empty
- Likely cause: RLS policy blocking SELECT
- Solution: Check Phase 3 RLS policy

**If you see messages in console but not in UI**:
- Problem: Data is there but UI not rendering
- Check Network tab for any API errors
- Try refreshing the page

---

## PHASE 5: Test the API Directly

### Step 5.1: Test message send endpoint

Use **Postman** or **curl**:

```bash
# Get your JWT token first (from browser DevTools → Application → Cookies → auth token)

curl -X POST http://localhost:3000/api/vendor/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "vendorId": "VENDOR_ID_HERE",
    "messageText": "Test message from debugging",
    "senderType": "user"
  }'
```

**Expected response**: 
```json
{
  "success": true,
  "data": [{
    "id": "...",
    "vendor_id": "...",
    "user_id": "...",
    "sender_type": "user",
    "message_text": "Test message...",
    "is_read": false,
    "created_at": "2025-12-25T..."
  }],
  "message": "Message sent successfully"
}
```

**If error**: 
- Status 400-500: Check error message in response
- Status 401: JWT token invalid or expired
- Status 403: User doesn't own the vendor

---

## PHASE 6: End-to-End Test

Once all phases pass:

### Step 6.1: Send a message as user

1. Login as **REGULAR USER** (not vendor)
2. Navigate to messages
3. Send message to vendor
4. Check browser console for success

### Step 6.2: Receive message as vendor

1. Login as **VENDOR OWNER** (different account)
2. Go to `/vendor-messages`
3. Check DevTools console for logs
4. Message should appear in inbox
5. Click on conversation to view thread

### Step 6.3: Reply from vendor

1. Type reply in message box
2. Click Send
3. Message should appear immediately
4. Check user inbox - they should see vendor's reply

---

## TROUBLESHOOTING DECISION TREE

```
Does "Total messages fetched" show > 0?
│
├─ NO
│  └─ Go to Phase 1
│     └─ Send test message from user account
│        └─ Refresh vendor inbox
│
└─ YES
   └─ Does "Final conversation list" show conversations?
      │
      ├─ NO
      │  └─ RLS POLICY ISSUE
      │     └─ Go to Phase 3
      │        └─ Test RLS with auth.uid()
      │           └─ Add missing policy or fix WHERE clause
      │
      └─ YES
         └─ ✅ EVERYTHING WORKS!
            └─ Messages should display in UI
               └─ If not, check browser console for render errors
```

---

## Common Error Messages & Fixes

### "Error loading vendor profile"
```
Cause: User is not a vendor owner
Fix: 
1. Create a vendor profile at /vendor-onboarding
2. Or create vendor in database:
   INSERT INTO vendors (user_id, company_name) 
   VALUES ('USER_ID', 'Company Name');
```

### "You must have a vendor profile to use messages"
```
Same as above - vendor profile missing
```

### "Error loading messages: permission denied for table"
```
Cause: RLS policy issue
Fix: 
1. Check RLS is enabled on vendor_messages table
2. Verify policy "Allow vendors to read messages to their profile"
3. Policy should have WHERE clause checking vendor ownership
```

### No conversations appear but messages exist
```
Cause: RLS is blocking SELECT
Fix:
1. In Supabase SQL Editor, test the policy
2. Run query from Phase 3 with RLS simulated
3. If empty, RLS is blocking - check policy USING clause
```

### UI shows conversations but messages are empty
```
Cause: fetchMessages() call failing
Fix:
1. Check DevTools Network tab
2. Look for `vendor_messages` API calls
3. See if they return 200 or error
4. Check error logs in console
```

---

## Key Database Queries for Reference

### See all messages for a vendor
```sql
SELECT * FROM vendor_messages 
WHERE vendor_id = 'VENDOR_ID_HERE'
ORDER BY created_at DESC;
```

### See messages a user sent to a vendor
```sql
SELECT * FROM vendor_messages 
WHERE vendor_id = 'VENDOR_ID_HERE' 
AND user_id = 'USER_ID_HERE'
AND sender_type = 'user'
ORDER BY created_at ASC;
```

### Count unread messages for vendor
```sql
SELECT COUNT(*) FROM vendor_messages 
WHERE vendor_id = 'VENDOR_ID_HERE'
AND sender_type = 'user'
AND is_read = FALSE;
```

### Check RLS policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'vendor_messages'
ORDER BY tablename, policyname;
```

---

## Success Checklist

- [ ] Messages exist in `vendor_messages` table
- [ ] Vendor profile exists with correct `user_id`
- [ ] Notifications are being created
- [ ] Browser console shows logs with messages
- [ ] RLS allows vendor to read their messages
- [ ] `/vendor-messages` page loads without errors
- [ ] Conversations list shows up
- [ ] Clicking conversation shows messages
- [ ] Vendor can send reply
- [ ] User receives vendor's reply

---

## Next Steps if Still Not Working

1. **Share console logs** - Copy full console output
2. **Share SQL results** - From Phase 1-3 queries
3. **Check Network tab** - Any failed API calls?
4. **Verify user setup**:
   - User account exists
   - User is authenticated
   - Vendor account exists
   - Vendor linked to correct user
5. **Check trigger execution**:
   - Run: `SELECT * FROM pg_proc WHERE proname = 'notify_on_message_insert';`
   - Should show function exists

---

**Last Updated**: December 25, 2025
**Component**: MessagesTab.js
**Table**: vendor_messages
**Status**: Ready to debug
