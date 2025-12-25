# VENDOR INBOX DEBUGGING - QUICK START

## You are here: 🔍 Debugging why vendors can't see messages

---

## QUICK TEST (5 minutes)

### 1. Check if messages exist
```sql
-- Paste in Supabase SQL Editor
SELECT COUNT(*) FROM public.vendor_messages;
```
- **Result > 0?** → Go to #2
- **Result = 0?** → Send test message first, then retry

### 2. Check if vendor profile exists
```sql
SELECT id, user_id FROM public.vendors LIMIT 1;
```
- **Found rows?** → Go to #3
- **No rows?** → Create vendor profile first

### 3. Check vendor inbox (open DevTools)
1. Go to `/vendor-messages` in your app
2. Press F12 (Open DevTools)
3. Go to Console tab
4. Look for logs starting with ✅ or ❌

**What you should see:**
```
✅ Current user: (some-uuid)
✅ Vendor data: {id: '...', user_id: '...'}
✅ Total messages fetched: 5
💬 Final conversation list: [{userId: '...', unreadCount: 2}, ...]
```

**If you see:**
```
✅ Total messages fetched: 5
📦 Conversation map keys: ["..."]
💬 Final conversation list: []
```
→ **RLS ISSUE** - See Section "Fix RLS Policies" below

---

## COMPREHENSIVE DEBUG (15-30 minutes)

Follow: **`/VENDOR_MESSAGES_DEBUG_STEPS.md`**

This has 6 phases:
1. Check if data exists
2. Verify notifications
3. Test RLS policies
4. Debug component
5. Test API
6. End-to-end test

---

## Files Modified

### Enhanced for Debugging
- `components/dashboard/MessagesTab.js` - Added 10+ console.log statements

### Created Documentation
- `VENDOR_MESSAGES_DEBUG_STEPS.md` - Complete step-by-step guide
- `debug-vendor-messages.sh` - Bash script with SQL queries
- This quick reference card

---

## Common Fixes

### Issue: "No vendor profile found"
```javascript
// Vendor user doesn't have a vendor profile
// Create one at /vendor-onboarding or manually:
INSERT INTO vendors (user_id, company_name) 
VALUES ('USER_UUID', 'Company Name');
```

### Issue: Messages fetched but not showing
```
RLS Policy Issue
Fix: Check policy "Allow vendors to read messages to their profile"
Must have: WHERE auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id)
```

### Issue: No messages at all
```
Check if user sent messages
1. Login as user account
2. Go to messages
3. Send test message to vendor
4. Go back to vendor account
5. Refresh /vendor-messages
```

---

## Console Logs - What They Mean

| Log | Meaning | Action |
|-----|---------|--------|
| ❌ Auth error | Not logged in | Logout & login again |
| ⚠️ No vendor profile | User is not vendor | Create vendor profile |
| ✅ Vendor data | Vendor found | ✓ Good |
| ✅ Total messages: 0 | No messages in DB | Send test message |
| ✅ Total messages: 5 | Messages exist | ✓ Good |
| 📦 Keys: [] | Conversation map empty | RLS blocking SELECT |
| 💬 Conv list: [] | Final list empty | RLS issue |
| 💬 Conv list: [{...}] | Conversations showing | ✓ Good |

---

## SQL Query Cheat Sheet

**See recent messages:**
```sql
SELECT vendor_id, user_id, sender_type, message_text, created_at 
FROM public.vendor_messages 
ORDER BY created_at DESC LIMIT 20;
```

**Check vendor exists:**
```sql
SELECT id, user_id, company_name FROM public.vendors;
```

**Test RLS (simulate vendor login):**
```sql
-- Set RLS to vendor's user_id
SELECT * FROM vendor_messages 
WHERE vendor_id IN (
  SELECT id FROM vendors WHERE user_id = auth.uid()
);
```

**See notifications:**
```sql
SELECT user_id, type, title, created_at 
FROM public.notifications 
WHERE type = 'message'
ORDER BY created_at DESC LIMIT 20;
```

---

## Next: What to Do

### Option A: Quick 5-minute check
1. Run SQL queries above
2. Check browser console logs
3. Identify which phase is failing

### Option B: Deep debugging
1. Follow `VENDOR_MESSAGES_DEBUG_STEPS.md`
2. Work through all 6 phases
3. Identify exact issue
4. Apply fix

### Option C: Run everything
```bash
# Make debug script executable
chmod +x debug-vendor-messages.sh

# Run it
./debug-vendor-messages.sh
```

---

## Most Common Issue

**99% of cases: RLS Policy**

**Symptoms:**
- Console shows: ✅ "Total messages fetched: 5"
- But then: 💬 "Final conversation list: []"
- UI shows: "No conversations yet"

**Fix:**
1. Go to Supabase Dashboard
2. Find `vendor_messages` table
3. Check RLS Policies
4. Find policy: "Allow vendors to read messages to their profile"
5. Verify USING clause has: `auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id)`

---

## Files to Know

- **Component**: `/components/dashboard/MessagesTab.js` (vendor inbox)
- **Sender**: `/components/UserVendorMessagesTab.js` (user sends)
- **API**: `/app/api/vendor/messages/send/route.js` (backend)
- **Schema**: `/supabase/sql/VENDOR_MESSAGING_SYSTEM.sql` (database)
- **Notifications**: `/supabase/sql/NOTIFICATIONS_SYSTEM.sql` (auto-notify)

---

## When in doubt, check:

1. **Browser Console** - F12 → Console tab (look for logs)
2. **Network Tab** - F12 → Network tab (any failed requests?)
3. **Database** - Supabase SQL Editor (data exists?)
4. **RLS** - Supabase Table Editor (policies enabled?)

---

**Status**: 🔧 Ready to debug
**Time estimate**: 15-30 minutes to full resolution
**Difficulty**: Medium (RLS policies can be tricky)
**Support**: Check VENDOR_MESSAGES_DEBUG_STEPS.md for detailed guide

Let's get this working! 🚀
