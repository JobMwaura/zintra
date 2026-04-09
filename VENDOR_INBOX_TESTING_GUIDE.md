# 🧪 Vendor Inbox Modal - Testing Guide

## Pre-Testing Setup

### Requirements
- ✅ Vendor account (with messages in database)
- ✅ Admin account (to send test messages)
- ✅ Modern web browser (Chrome, Safari, Firefox, Edge)
- ✅ Test file for attachment (PDF, image, document)
- ✅ Mobile device or mobile emulator (for responsive testing)

### Database Preparation
```sql
-- Verify vendor_messages table has data
SELECT COUNT(*) FROM vendor_messages WHERE vendor_id = 'YOUR_VENDOR_ID';

-- Check if users table has admin info
SELECT id, full_name, email FROM users WHERE role = 'admin' LIMIT 5;

-- Insert test message if needed
INSERT INTO vendor_messages 
  (vendor_id, user_id, sender_type, message_text, is_read, created_at)
VALUES 
  ('vendor_id', 'admin_id', 'user', '{"body":"Test message","attachments":[]}', false, now());
```

## Test Cases

### Test 1: Modal Opens/Closes ✅

**Steps:**
1. Log in as vendor
2. Navigate to own vendor profile
3. Click "Inbox" button in top-right
4. Verify modal slides in from right

**Expected Results:**
- ✅ Modal appears with smooth animation
- ✅ Header shows "📧 Messages" with unread count
- ✅ Conversation list visible on left (or center on mobile)
- ✅ No error messages in console

**Pass/Fail:** ___

---

### Test 2: Conversation List Displays ✅

**Steps:**
1. Modal is open
2. Check conversation list
3. Verify each conversation shows:
   - Admin name (from users table)
   - Last message preview
   - Timestamp (Today/Yesterday/Date)
   - Unread badge (if count > 0)

**Expected Results:**
- ✅ All conversations display correctly
- ✅ Admin names are correct (not "Admin" unless missing)
- ✅ Message previews are truncated appropriately
- ✅ Timestamps format correctly
- ✅ Unread badges appear in red

**Pass/Fail:** ___

---

### Test 3: Search Functionality ✅

**Steps:**
1. Type in search box
2. Type part of admin name
3. Verify conversations filter
4. Clear search box
5. Verify all conversations reappear

**Expected Results:**
- ✅ Conversations filter as you type
- ✅ Only matching conversations show
- ✅ Partial name matches work
- ✅ Case-insensitive search
- ✅ Clear search returns all conversations

**Pass/Fail:** ___

---

### Test 4: Filter Buttons ✅

**Steps:**
1. Click "Unread" filter
2. Verify only conversations with unread badges show
3. Click "Read" filter
4. Verify only conversations without unread badges show
5. Click "Archived" filter
6. Verify archived conversations show (if any)
7. Click "All" filter
8. Verify all conversations show

**Expected Results:**
- ✅ Each filter works independently
- ✅ Correct conversations display for each filter
- ✅ Active filter button highlighted in amber
- ✅ Count of conversations decreases/increases correctly

**Pass/Fail:** ___

---

### Test 5: Open Conversation ✅

**Steps:**
1. Click on a conversation in list
2. Verify thread view opens
3. Check header shows:
   - Admin name
   - Message count
   - Archive button
   - Delete button
4. Verify all messages display

**Expected Results:**
- ✅ Thread view displays on right (or replaces list on mobile)
- ✅ Messages show in reverse chronological order
- ✅ Admin messages in gray with "A" avatar
- ✅ Vendor messages in blue with "V" avatar, right-aligned
- ✅ All attachments show with download links
- ✅ Timestamps visible on all messages

**Pass/Fail:** ___

---

### Test 6: Send Message (No Attachment) ✅

**Steps:**
1. Open a conversation
2. Type "Test message from vendor" in compose box
3. Click Send button
4. Verify message appears in blue immediately
5. Verify message shows in conversation list

**Expected Results:**
- ✅ Message appears instantly in blue
- ✅ Compose box clears after send
- ✅ No page refresh needed
- ✅ Message visible in list preview
- ✅ No errors in console

**Pass/Fail:** ___

---

### Test 7: Attach Single File ✅

**Steps:**
1. Open conversation
2. Click paperclip icon
3. Select a test file (PDF, image, etc.)
4. Verify file preview appears in compose area
5. Type message text
6. Click Send

**Expected Results:**
- ✅ File picker dialog opens
- ✅ File preview chip appears with filename
- ✅ Remove button (X) on file chip works
- ✅ Message sends with file attached
- ✅ File link appears in message
- ✅ Can click link to download

**Pass/Fail:** ___

---

### Test 8: Attach Multiple Files ✅

**Steps:**
1. Open conversation
2. Click paperclip, select file 1
3. Verify file 1 preview appears
4. Click paperclip again, select file 2
5. Verify both files show
6. Type message
7. Click Send
8. Verify message shows both files

**Expected Results:**
- ✅ Both files appear as separate chips
- ✅ Each file has remove button
- ✅ Can remove one file independently
- ✅ Message sends with both files
- ✅ Both download links appear in message

**Pass/Fail:** ___

---

### Test 9: Message Content Types ✅

**Steps:**
1. Send message with just text
2. Send message with file but no text
3. Send message with multiple files
4. Send message with very long text (multiple lines)
5. Verify all format correctly

**Expected Results:**
- ✅ Text-only message displays properly
- ✅ File-only message shows "(Attachment)" in preview
- ✅ Long messages wrap properly
- ✅ Multiple attachments all visible
- ✅ Timestamps show on all messages

**Pass/Fail:** ___

---

### Test 10: Archive Conversation ✅

**Steps:**
1. Open a conversation
2. Click Archive button (folder icon)
3. Verify conversation disappears from list
4. Click "Archived" filter
5. Verify conversation appears in archived list
6. Switch back to "All"
7. Verify conversation still hidden

**Expected Results:**
- ✅ Conversation disappears after archive
- ✅ Appears in "Archived" filter view
- ✅ Message history still intact
- ✅ No error messages
- ✅ Can still view archived conversation

**Pass/Fail:** ___

---

### Test 11: Delete Conversation ✅

**Steps:**
1. Open a conversation
2. Click Delete button (trash icon)
3. Verify confirmation dialog appears
4. Click "Confirm" (or "Yes")
5. Verify conversation removed from list
6. Verify message gone from all filters
7. Try to find conversation by search

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Can cancel deletion
- ✅ Conversation removed completely after confirmation
- ✅ Not visible in any filter
- ✅ Not found by search
- ✅ No way to recover

**Pass/Fail:** ___

---

### Test 12: Download Attachment ✅

**Steps:**
1. Open a message with attachment
2. Click the file link/button
3. Wait for download to complete
4. Verify file is correct and complete

**Expected Results:**
- ✅ Download starts automatically
- ✅ File downloads to Downloads folder
- ✅ File is not corrupted
- ✅ File size matches original
- ✅ File opens correctly

**Pass/Fail:** ___

---

### Test 13: Mark as Read ✅

**Steps:**
1. Open conversation with unread badge
2. Verify badge was showing
3. Close modal and reopen
4. Verify unread badge is gone
5. Verify unread count in header decreased

**Expected Results:**
- ✅ Badge disappears when conversation opened
- ✅ Badge gone after modal closes/reopens
- ✅ Main "Inbox" button badge updates
- ✅ "Unread" filter no longer shows conversation
- ✅ "Read" filter now shows conversation

**Pass/Fail:** ___

---

### Test 14: Real-Time Updates ✅

**Steps:**
1. Open a conversation in vendor account
2. In another tab/window, use admin account to send message
3. Watch vendor's modal without refreshing
4. Verify new message appears automatically
5. Verify unread badge updates

**Expected Results:**
- ✅ Message appears within 2-3 seconds
- ✅ No manual refresh needed
- ✅ UI updates automatically
- ✅ Timestamp shows correct time
- ✅ Notification badge appears/updates

**Pass/Fail:** ___

---

### Test 15: Mobile Responsive - Conversation List ✅

**Steps:**
1. Open on mobile device (or emulator)
2. Verify conversation list displays
3. Tap conversation
4. Verify thread view replaces list

**Expected Results:**
- ✅ Conversation list is readable on small screen
- ✅ Names and previews truncate properly
- ✅ Badge visible and readable
- ✅ Tapping conversation switches to thread view

**Pass/Fail:** ___

---

### Test 16: Mobile Responsive - Thread View ✅

**Steps:**
1. On mobile, open conversation
2. Verify thread view takes full width
3. Verify back arrow visible at top-left
4. Click back arrow
5. Verify returns to conversation list

**Expected Results:**
- ✅ Thread view is full-width and readable
- ✅ Messages format properly on small screen
- ✅ Compose box is accessible
- ✅ Back button easy to tap
- ✅ Navigation smooth

**Pass/Fail:** ___

---

### Test 17: Mobile Responsive - Compose ✅

**Steps:**
1. On mobile, open conversation
2. Tap compose text area
3. Keyboard appears
4. Type message
5. Verify text area grows or scrolls
6. Tap Send button
7. Verify button is easy to tap (not hidden by keyboard)

**Expected Results:**
- ✅ Keyboard doesn't completely hide compose area
- ✅ Can still see and tap Send button
- ✅ Message sends successfully
- ✅ Keyboard dismisses after send
- ✅ Message appears immediately

**Pass/Fail:** ___

---

### Test 18: Empty States ✅

**Steps:**
1. Search for non-existent conversation
2. Filter with no results (e.g., "Unread" when none exist)
3. Open vendor with no messages at all

**Expected Results:**
- ✅ Empty state message shows: "No conversations yet"
- ✅ Message is clear and helpful
- ✅ Icon displays (message bubble)
- ✅ Doesn't crash or show errors

**Pass/Fail:** ___

---

### Test 19: Error Handling ✅

**Steps:**
1. Close browser connection (offline mode)
2. Try to send message
3. Try to attach file
4. Restore connection
5. Try again

**Expected Results:**
- ✅ Error message shows gracefully
- ✅ "Failed to send" alert appears
- ✅ Message stays in compose for retry
- ✅ Can retry after connection restored
- ✅ No console errors

**Pass/Fail:** ___

---

### Test 20: Admin Name Display ✅

**Steps:**
1. Open conversation with admin
2. Verify admin name shows in:
   - Conversation list
   - Thread header
   - Message bubbles (if available)
3. Check name matches users table

**Expected Results:**
- ✅ Admin name displays in conversation list
- ✅ Admin name displays in thread header
- ✅ Name matches admin's actual name
- ✅ Falls back to "Admin" if not found
- ✅ No errors

**Pass/Fail:** ___

---

## Edge Case Testing

### Test E1: Very Long Messages ✅
- Type message with 1000+ characters
- Verify text wraps properly
- Verify message displays completely
- **Pass/Fail:** ___

### Test E2: Special Characters ✅
- Type message with: émojis 😀 symbols ™ quotes "like this"
- Verify all display correctly
- **Pass/Fail:** ___

### Test E3: Rapid Fire Messages ✅
- Send 5 messages quickly
- Verify all appear in order
- Verify no messages missed
- **Pass/Fail:** ___

### Test E4: Very Old Conversation ✅
- Open conversation from months ago
- Verify all messages load
- Verify timestamps format correctly
- Verify scrolling works
- **Pass/Fail:** ___

### Test E5: Admin Deleted/Disabled ✅
- Message from admin no longer in users table
- Verify message still shows
- Verify name falls back to "Admin"
- Verify conversation still viewable
- **Pass/Fail:** ___

---

## Browser Compatibility

Test on:
- [ ] Chrome (Windows/Mac)
- [ ] Safari (Mac/iOS)
- [ ] Firefox (Windows/Mac)
- [ ] Edge (Windows)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

| Browser | Version | Result | Notes |
|---------|---------|--------|-------|
| Chrome | Latest | _____ | __________ |
| Safari | Latest | _____ | __________ |
| Firefox | Latest | _____ | __________ |
| Edge | Latest | _____ | __________ |

---

## Performance Testing

### Load Testing
- **Time to open modal:** < 2 seconds
- **Time to load conversation list:** < 1 second  
- **Time to send message:** < 2 seconds
- **Time to receive message (real-time):** < 3 seconds

**Results:**
| Test | Target | Actual | Pass |
|------|--------|--------|------|
| Modal open | < 2s | ___ | ___ |
| List load | < 1s | ___ | ___ |
| Send message | < 2s | ___ | ___ |
| Real-time update | < 3s | ___ | ___ |

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Can open modal with keyboard
- [ ] Can navigate to all buttons with Tab
- [ ] Can click buttons with Enter/Space
- [ ] Can type in text boxes

### Screen Reader
- [ ] Modal title is announced
- [ ] Button labels are clear
- [ ] Message content is readable
- [ ] Status updates are announced

### Visual
- [ ] Text is readable (sufficient contrast)
- [ ] Buttons are clearly visible
- [ ] No flashing or rapid animation
- [ ] Focus indicators visible

---

## Security Testing

### Authorization
- [ ] Can only see own vendor's messages
- [ ] Can't access other vendor's messages
- [ ] Can't see messages of non-vendors

### File Upload
- [ ] File stored in Supabase Storage
- [ ] URL is secure (signed or public)
- [ ] Files are scanned for malware (if applicable)
- [ ] File size limits enforced

### SQL Injection
- [ ] Special characters in message handled
- [ ] Search safe from injection
- [ ] No raw SQL in filters

---

## Final Checklist

### Code Quality
- [ ] No console errors
- [ ] No console warnings
- [ ] Code follows style guide
- [ ] Comments are clear
- [ ] No unused variables

### Documentation
- [ ] README updated
- [ ] Code comments present
- [ ] API docs updated
- [ ] User guide complete

### Deployment
- [ ] Code committed
- [ ] Code pushed to main
- [ ] Build passes (✓ Compiled)
- [ ] No build errors
- [ ] All routes compile

---

## Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Status:** ☐ PASS  ☐ FAIL  ☐ NEEDS WORK  

**Issues Found:**
```
1. ____________________________________
2. ____________________________________
3. ____________________________________
```

**Comments:**
```
____________________________________
____________________________________
____________________________________
```

---

**Total Tests:** 20 + 5 Edge Cases + Compatibility + Performance + Accessibility + Security  
**Overall Status:** _______________
