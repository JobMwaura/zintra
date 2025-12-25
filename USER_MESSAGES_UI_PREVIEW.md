# User Messages Section - New UI Preview

## What Users Will See

### Main Messages Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back  Messages > Vendor Messages        Back to Dashboard    │  (Header)
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐  ┌────────────────────────────────────┤
│  │  CONVERSATIONS LIST  │  │   MESSAGE THREAD VIEW              │
│  │                      │  │                                    │
│  │  [all] [vendors] [ad]│  │  Munich Pipes (selected vendor)    │
│  │                      │  │  Direct message conversation       │
│  │  🔍 Search vendors...│  │  ─────────────────────────────────│
│  │                      │  │                                    │
│  │  ┌──────────────────┐│  │  [12:34] Your Message              │
│  │  │ 🏢 Munich Pipes  ││  │         (amber background)         │
│  │  │ "Thanks for t..." ││  │                                    │
│  │  │ 3 days ago    [1]││  │  [12:45] Vendor Reply              │
│  │  └──────────────────┘│  │         (gray background)          │
│  │  🔴 New                │  │                                    │
│  │                      │  │  [13:20] Your follow-up            │
│  │  ┌──────────────────┐│  │         (amber background)         │
│  │  │ 🏢 TechCorp Inc  ││  │  ─────────────────────────────────│
│  │  │ "When can you..." ││  │  [Message Input Field            ]│
│  │  │ 2 days ago       ││  │  [Send Button]                    │
│  │  └──────────────────┘│  │                                    │
│  │                      │  │                                    │
│  │  ┌──────────────────┐│  │                                    │
│  │  │ 🏢 BuildPro Ltd  ││  │                                    │
│  │  │ "Project details" ││  │                                    │
│  │  │ 1 day ago        ││  │                                    │
│  │  └──────────────────┘│  │                                    │
│  │                      │  │                                    │
│  └──────────────────────┘  └────────────────────────────────────┤
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Filter Tabs

### Before (Old Component)
```
[all] [customers] [admin]  ← "customers" label confusing for users
```

### After (New Component)
```
[all] [vendors] [admin]    ← "vendors" label clear and accurate
```

## Conversation List Features

### Each Conversation Shows:
- 📸 **Vendor Logo** - Company branding image (or first initial in circle)
- 📝 **Vendor Name** - Company name (e.g., "Munich Pipes")
- 💬 **Last Message** - Preview of most recent message (truncated)
- 📅 **Date** - When last message was sent
- 🔴 **Unread Count** - Red badge if messages unread (e.g., "[3]")

### Example:
```
┌──────────────────────────┐
│ 🏢 Munich Pipes          │
│ "Thanks for inquiry..."  │
│ Dec 15, 2024         [3] │  ← 3 unread messages
└──────────────────────────┘
```

## Message Display

### Message Bubbles
```
User Message (Your Side):
┌─────────────────────────────────┐
│ "When can you deliver?"         │  ← Amber background
│ 12:34 PM                        │  ← Light timestamp
└─────────────────────────────────┘

Vendor Message (Their Side):
┌─────────────────────────────────┐
│ "We can deliver next Tuesday"   │  ← Gray background
│ 12:45 PM                        │  ← Dark timestamp
└─────────────────────────────────┘
```

### Message Details
- ✅ **Full Message Text** - No truncation
- ✅ **Timestamp** - HH:MM format showing exact time
- ✅ **Sender Identification** - Color indicates who sent (you=amber, vendor=gray)
- ✅ **Chronological Order** - Messages ordered oldest to newest (top to bottom)

## Search Feature

### How It Works:
1. User clicks search field
2. Types vendor name (e.g., "Munich")
3. Conversation list filters to matching vendors
4. Shows only conversations with matching vendor names

### Example:
```
🔍 Search vendors... [type "tech"]

Results:
- TechCorp Inc
- TechSolutions Ltd
- (Munich Pipes - hidden, doesn't match "tech")
```

## Real-Time Updates

### Automatic Refresh
- New messages appear every 3 seconds
- Vendor messages auto-marked as read when you open the conversation
- Conversation list updates when new message is sent
- Unread badge updates in real-time

### Auto-Scroll
- New messages automatically scroll into view
- You always see the latest message at bottom

## Sending Messages

### Message Input
```
┌─────────────────────────────────────────┐
│ Type a message...                   [📤] │
└─────────────────────────────────────────┘
```

### Steps:
1. Click message input field
2. Type your message
3. Press Send button or Enter key
4. Message appears immediately (amber bubble)
5. Can send multiple messages to same vendor

## Empty States

### No Conversation Selected
```
📨
Select a conversation to start messaging
```

### No Messages with Vendor
```
💬
Start a conversation
```

### No Vendor Conversations
```
📨
No messages yet
```

## Navigation

### From User Dashboard
- Click "Messages" in sidebar
- Goes to `/user-messages`
- Shows vendor conversations

### Back Button
- Click "← Back" button (top-left)
- Returns to `/user-dashboard`
- Preserves message state

## Keyboard Shortcuts (Possible Future)
- `Enter` - Send message (if implemented)
- `Escape` - Close message view (if implemented)
- `Cmd/Ctrl + K` - Search conversations (if implemented)

## Mobile Responsiveness

### Wide Screens (Desktop)
- Side-by-side layout (conversations left, messages right)
- Full UI visible

### Narrow Screens (Mobile - Future Enhancement)
- Stacked layout option
- Full-width conversation list or messages
- Swipe to switch views (if implemented)

## Key Differences from Old Component

| Feature | Old | New |
|---------|-----|-----|
| **Filter Tabs** | "customers" | "vendors" ✅ |
| **Data Source** | conversations table | vendor_messages table ✅ |
| **Message Display** | Limited | Full with timestamps ✅ |
| **Vendor Info** | Minimal | Logo + name ✅ |
| **Unread Count** | Not shown | Red badge ✅ |
| **Search** | Basic | Functional ✅ |
| **Real-time** | Polling | 3-second refresh ✅ |
| **Auto-read** | Manual | Automatic ✅ |
| **Layout** | Single column | Split panel ✅ |

## Related Pages

### User-Side
- **Page**: `/app/user-messages/page.js`
- **Component**: `components/UserVendorMessagesTab.js` (NEW)
- **Table**: `vendor_messages`

### Vendor-Side (Separate)
- **Component**: `components/VendorMessagingModal.js`
- **Modal**: Opens when vendor message icon clicked in profile
- **Same table**: `vendor_messages`

## Loading States

### Initial Load
- Shows "Loading messages..." spinner
- Fetches user's conversations with vendors
- Enriches with vendor details

### Message Send
- Button shows loading spinner
- Send button disabled during send
- Returns error if send fails

### Message Refresh
- Silent background refresh every 3 seconds
- No loading indicator shown
- New messages appear smoothly

## Error Handling

### Session Expired
- Alert: "Session expired. Please log in again."
- User should refresh or login again

### Send Failed
- Alert: "Error: [specific error message]"
- Examples:
  - "Vendor not found"
  - "Invalid vendor ID"
  - "Database error"

### Network Issues
- Polling continues to retry every 3 seconds
- No disruption to existing messages shown

## Accessibility Features

- ✅ Semantic HTML structure
- ✅ Proper button and input labeling
- ✅ Color contrast for readability
- ✅ Keyboard navigation support (future)
- ✅ Loading states with Loader icon

## Performance Considerations

- ✅ Lazy loads vendor details only when needed
- ✅ 3-second polling (not real-time, reduces server load)
- ✅ Pagination support (handles many messages)
- ✅ Auto-read marking (no extra load)

---

This is the complete user-facing view of the new messaging system. All features are implemented and ready for testing.
