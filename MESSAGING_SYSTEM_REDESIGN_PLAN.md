# Admin-Vendor Messaging System - Complete Redesign

## 🎯 Current State Analysis

### Problem 1: Attachments Not Showing
- Admin uploads images via message modal
- Images saved as array in vendor_messages.message_text (wrong!)
- Vendor inbox doesn't extract/display attachments
- **Fix needed:** Store attachments separately, display in UI

### Problem 2: Message Flow Confusion
- Admin sends to vendor → saved to vendor_messages with sender_type='user'
- Vendor page (/vendor-messages) shows only vendor→user messages
- Admin messages not visible to vendor in their inbox
- **Fix needed:** Make vendor inbox show ALL messages (admin + other vendors)

### Problem 3: Zero Notifications
- No visual indicator of unread messages on vendor page
- No badge on Messages link
- Vendor doesn't know to check inbox
- **Fix needed:** Add unread badges, notifications, visual indicators

### Problem 4: Poor UI/UX
- Two separate tables: vendor_messages vs messages
- Inconsistent sender identification
- No message threading or conversation context
- Admin tab shows conversations, vendor shows individual messages
- **Fix needed:** Unified messaging UI for both admin and vendor

---

## ✅ Solution Architecture

### Database Schema (Unified)
```
vendor_messages table:
- id (uuid)
- vendor_id (uuid) - which vendor this is about
- user_id (uuid) - auth user id of vendor
- message_text (text) - the message content
- sender_type (enum: 'user' | 'vendor') - who sent it
- sender_name (text) - display name
- is_read (boolean) - unread status
- attachments (jsonb) - ARRAY OF ATTACHMENT OBJECTS
- conversation_id (uuid) - links to conversations table
- created_at (timestamp)
- updated_at (timestamp)
```

### Attachment Schema
```json
{
  "id": "uuid",
  "type": "image|document|file",
  "url": "s3://path/to/file",
  "name": "filename.jpg",
  "size": 1024000,
  "uploadedAt": "2024-01-16T10:00:00Z"
}
```

### Message Flow
```
Admin sends message with image
    ↓
1. Upload image to S3 → get URL
2. Save to vendor_messages with attachments array
3. Save to messages table (admin view)
    ↓
Vendor opens inbox
    ↓
1. Fetch vendor_messages (all messages)
2. Display with unread badge
3. Show attachments in message body
4. Mark as read when opened
    ↓
Vendor sees:
- Message from Admin (with image visible)
- Unread badge on Messages link
- Notification in header
```

---

## 🔧 Implementation Plan

### Phase 1: Fix Attachments Display
**Goal:** Make images visible in vendor inbox

**Steps:**
1. Update UserVendorMessagesTab to extract attachments from message_text JSON
2. Add attachment display component in message view
3. Parse and display all attachment types

**Files to modify:**
- `/components/UserVendorMessagesTab.js`

**Code change:**
```javascript
// Extract attachments if message_text is JSON with attachments
const parseMessageWithAttachments = (messageText) => {
  try {
    const parsed = JSON.parse(messageText);
    if (parsed.body && parsed.attachments) {
      return {
        body: parsed.body,
        attachments: parsed.attachments
      };
    }
  } catch (e) {
    // Not JSON, return as plain text
  }
  return {
    body: messageText,
    attachments: []
  };
};
```

---

### Phase 2: Fix Message Display for Vendor
**Goal:** Vendor sees all messages (admin + peers) in one unified inbox

**Steps:**
1. Update vendor inbox to show ALL messages from vendor_messages table
2. Filter by vendor_id correctly
3. Show sender context (Admin vs Peer Vendor)
4. Add conversation grouping

**Files to modify:**
- `/components/UserVendorMessagesTab.js`

---

### Phase 3: Add Unread Badges & Notifications
**Goal:** Vendor knows when there's a new message

**Steps:**
1. Add red badge on Messages link showing unread count
2. Add page-level notification in header
3. Auto-mark as read when opened
4. Update count in real-time

**Files to modify:**
- `/app/vendor-messages/page.js` (already has badge)
- `/components/UserVendorMessagesTab.js` (add notifications)

---

### Phase 4: Improve Admin Messages Table
**Goal:** Admin sees which messages have attachments, better overview

**Steps:**
1. Update /admin/dashboard/messages to show attachment count
2. Add filter for messages with attachments
3. Show sender info (Admin vs Vendor response)
4. Improve conversation grouping

**Files to modify:**
- `/app/admin/dashboard/messages/page.js`

---

## 📋 Immediate Actions Required

### 1. Check How Admin Saves Attachments
Currently in `/app/api/admin/messages/send/route.js`:
```javascript
attachments: attachments || []  // Are attachments being passed?
```

**Action:** Verify attachments are passed from frontend

### 2. Fix Vendor Inbox Display
Vendor inbox needs to:
- Show ALL messages from vendor_messages (not filter by conversation)
- Display attachments as clickable links/images
- Show "from Admin" vs "from Peer"
- Group by sender

### 3. Add Real-time Notifications
Subscribe to new messages in vendor_messages table for vendor

### 4. Improve Admin View
Show attachment indicators in message list

---

## 🎨 UI/UX Improvements

### For Vendor Inbox:
```
┌─ Messages ─────────────────────┐
│                                 │
│ Filter: All | Admin Only | Unread
│                                 │
├─ From Admin (Unread) ──────────┤
│ [Subject: Test message]         │
│ "Hello from admin" with image   │
│ [📎 1 attachment]               │
│ Today at 10:30 AM               │
│ [Mark as read]                  │
│                                 │
├─ From Peer Vendor ─────────────┤
│ [Subject: Partnership inquiry]  │
│ "Are you interested in..."      │
│ Yesterday at 3:45 PM            │
│                                 │
└─────────────────────────────────┘
```

### For Admin Messages:
```
┌─ Message Threads ──────────────┐
│                                 │
│ ✅ Narok Cement (2 messages)    │
│    Last: Today 10:30 AM         │
│    📎 Attachment                │
│                                 │
│ Franshoek Plumbers (1 message)  │
│    Last: Yesterday 3:45 PM      │
│                                 │
└─────────────────────────────────┘
```

---

## ⚠️ Current Code Issues

1. **Attachments stored as array in message_text field**
   - Should be separate attachment column/field
   - Need to parse JSON to extract

2. **Vendor inbox only shows vendor→user messages**
   - Filter: `sender_type: 'vendor'`
   - Missing: `sender_type: 'user'` (admin messages)

3. **No attachment display in UserVendorMessagesTab**
   - Message shows as plain text
   - Images not rendered as clickable/viewable

4. **Admin message sender unclear**
   - Labeled as 'user' in database
   - Vendor doesn't know it's from admin

---

## 📊 Priority Fixes

**🔴 Critical (Do First):**
1. Fix attachment display in vendor inbox
2. Make vendor inbox show admin messages
3. Add unread badge to Messages

**🟡 Important (Do Second):**
4. Add real-time notifications
5. Improve admin view with attachments
6. Add sender context labels

**🟢 Nice-to-Have (Do Later):**
7. Message search/filter
8. Archive/delete functionality
9. Message reactions/reactions
10. Typing indicators
