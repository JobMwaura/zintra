# VENDOR MESSAGES DEBUGGING CHECKLIST

**Date Started**: _______________  
**Estimated Time**: 15-30 minutes  
**Goal**: Get vendors to see messages from users

---

## 📋 PHASE 1: Gather Information (5 minutes)

- [ ] I have a user account (regular user)
- [ ] I have a vendor account (vendor owner)
- [ ] User account can send messages (UI allows it)
- [ ] Vendor account has vendor profile
- [ ] Both accounts are able to log in

---

## 🔍 PHASE 2: Check Database (5 minutes)

**Go to**: Supabase Dashboard → SQL Editor

### Subcheck 2.1: Messages exist
```sql
SELECT COUNT(*) FROM public.vendor_messages;
```
- [ ] Result > 0? **YES** → Continue to 2.2
- [ ] Result = 0? **NO** → Send test message and retry

### Subcheck 2.2: Vendor exists
```sql
SELECT id, user_id FROM public.vendors LIMIT 1;
```
- [ ] Found at least one vendor? **YES** → Continue to 2.3
- [ ] No vendors found? **NO** → Create vendor profile first

### Subcheck 2.3: See actual messages
```sql
SELECT vendor_id, user_id, sender_type, LEFT(message_text, 50), created_at 
FROM public.vendor_messages 
ORDER BY created_at DESC LIMIT 5;
```
- [ ] Messages showing vendor_id and user_id? **YES** → Continue to Phase 3
- [ ] Empty or NULL values? **NO** → Issue with message send

---

## 💻 PHASE 3: Check Browser Console (3 minutes)

1. [ ] Go to `/vendor-messages` (logged in as vendor)
2. [ ] Open DevTools (F12 key)
3. [ ] Go to Console tab
4. [ ] Look for these logs:

**Check for:**
- [ ] `✅ Current user:` (user is logged in)
- [ ] `✅ Vendor data:` (vendor profile found)
- [ ] `✅ Total messages:` (messages in database)
- [ ] `💬 Final conversation list:` (conversations ready)

**Result:**
- [ ] All logs present and showing data? **YES** → Go to Phase 4 (Data looks good!)
- [ ] Logs show "Total messages: 0"? **NO** → Back to Phase 2
- [ ] Logs show "Conversation list: []" but "Total messages: 5"? **RLS ISSUE** → Go to Phase 5

---

## 📊 PHASE 4: Visual Test (2 minutes)

Assuming console logs looked good:

1. [ ] Go to `/vendor-messages` page
2. [ ] Look for "Conversations" list on left side
3. [ ] Do you see conversations? **YES** → Phase 6 ✅
4. [ ] List is empty? **NO** → RLS Issue, go to Phase 5

---

## 🔐 PHASE 5: Check RLS Policies (5-10 minutes)

**This is the most common issue**

**Go to**: Supabase Dashboard → Table Editor → `vendor_messages` → RLS Policies

- [ ] RLS is **enabled** on vendor_messages table? (toggle should be ON)
- [ ] Policy exists: "Allow vendors to read messages to their profile"?
- [ ] Policy has correct USING clause? Check that it contains:
  ```
  auth.uid() IN (SELECT user_id FROM public.vendors WHERE id = vendor_id)
  ```

**If policy missing or wrong:**
- [ ] Go to "New Policy" or "Edit Policy"
- [ ] Add/fix the policy with above USING clause
- [ ] Save changes
- [ ] Go back to `/vendor-messages`
- [ ] Refresh page (Ctrl+R or Cmd+R)
- [ ] Check console logs again
- [ ] Do conversations appear now? → Phase 6

---

## ✅ PHASE 6: Verify Full Flow (5 minutes)

Now test the entire end-to-end flow:

### Part A: Send Message
- [ ] Log in as regular user
- [ ] Go to messages section
- [ ] Send a message to the vendor
- [ ] Console shows: `✅ Message sent!` or similar
- [ ] No errors in console

### Part B: Receive Message
- [ ] Log out and log in as vendor owner
- [ ] Go to `/vendor-messages`
- [ ] Console shows conversations loading
- [ ] Conversation list shows the user
- [ ] Click on conversation
- [ ] Message appears in thread

### Part C: Check Notifications
- [ ] Vendor should see notification badge
- [ ] Unread count should show
- [ ] When vendor reads message, unread count goes down

### Part D: Reply
- [ ] Vendor types reply message
- [ ] Vendor clicks Send
- [ ] Message appears in thread
- [ ] No errors in console
- [ ] Log back to user account
- [ ] User sees vendor's reply

---

## 🐛 Debugging Matrix

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| No conversations showing | RLS blocking SELECT | Check Phase 5 |
| "Total messages: 0" | No messages sent | Send test message Phase 2 |
| "No vendor profile" | User not a vendor | Create vendor profile |
| Messages don't load | API error | Check Network tab (F12) |
| Messages show, but empty thread | fetch fails | Check Phase 3 logs |

---

## 📞 If Stuck

Follow this tree:

```
Does browser console show "Total messages: X" where X > 0?
│
├─ NO → Go to Phase 2 (check database)
│
└─ YES → Does it show "Final conversation list: [...]" with data?
         │
         ├─ NO → Go to Phase 5 (RLS issue)
         │
         └─ YES → Messages should display in UI
                  If not → Check Network tab, refresh, try again
```

---

## ✨ Success Indicators

You're done when you see:

- [ ] ✅ Vendor can see conversation list
- [ ] ✅ Vendor can click conversation
- [ ] ✅ Vendor can see all messages in thread
- [ ] ✅ Vendor can send reply
- [ ] ✅ User receives vendor's reply
- [ ] ✅ Notification badge works
- [ ] ✅ No errors in console

---

## 📝 Notes Section

**Problems Found:**
```
_________________________________
_________________________________
_________________________________
```

**Fixes Applied:**
```
_________________________________
_________________________________
_________________________________
```

**Final Status:**
- [ ] WORKING ✅
- [ ] PARTIALLY WORKING 🟡
- [ ] NOT WORKING ❌

**If not working, next action:**
```
_________________________________
_________________________________
```

---

## 📚 Reference Documents

- `VENDOR_MESSAGES_DEBUG_STEPS.md` - Detailed guide (read if stuck)
- `VENDOR_INBOX_QUICK_START.md` - Quick reference
- `DEBUGGING_SUMMARY.md` - Overview and tools
- `vendor-messages-diagnostic.js` - Browser console script

---

## ⏱️ Time Log

| Phase | Start | End | Duration |
|-------|-------|-----|----------|
| Phase 1 | ___ | ___ | __ min |
| Phase 2 | ___ | ___ | __ min |
| Phase 3 | ___ | ___ | __ min |
| Phase 4 | ___ | ___ | __ min |
| Phase 5 | ___ | ___ | __ min |
| Phase 6 | ___ | ___ | __ min |
| **TOTAL** | | | **__ min** |

---

**Good luck! You've got this!** 🚀

Remember: Most issues (90%) are RLS-related. If you get stuck at Phase 4, check Phase 5 (RLS policies).
