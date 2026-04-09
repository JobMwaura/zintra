# Comment System Enhancements - Implementation Guide

## Features Being Built (Locally)

### ✨ Phase 1: Emoji Reactions ✅ DONE
- Users can react to comments with various emojis
- Toggle reactions on/off
- See reaction counts
- Database table: `vendor_status_update_comment_reactions`

**Files Created**:
1. `/app/api/status-updates/comments/reactions/route.js` - API endpoint
2. `/components/vendor-profile/ReactionPicker.js` - UI component
3. `/supabase/sql/COMMENT_REACTIONS_TABLE.sql` - Database schema

**API Endpoints**:
- `GET /api/status-updates/comments/reactions?commentId=...` - Fetch reactions
- `POST /api/status-updates/comments/reactions` - Add/remove reaction

**Reaction Emojis Available**:
- 👍 (thumbs up)
- 👎 (thumbs down)
- ❤️ (love)
- 😂 (laugh)
- 🔥 (fire)
- 😮 (surprise)
- 😢 (sad)
- 🤔 (thinking)
- ✨ (sparkles)
- 🎉 (party)

---

### ✏️ Phase 2: Edit Comments ✅ DONE
- Users can edit their own comments
- Shows edit timestamp
- Modal interface for editing

**Files Created**:
1. `/components/vendor-profile/EditCommentModal.js` - Edit modal component
2. Updated `/app/api/status-updates/comments/[commentId]/route.js` - Added PUT method

**API Endpoint**:
- `PUT /api/status-updates/comments/[commentId]` - Update comment

---

### 📌 Phase 3: Pin Comments (TODO)
- Vendor can pin important comments
- Pinned comments appear at top
- Add `is_pinned` column to `vendor_status_update_comments`

**TODO**:
1. Add `is_pinned` boolean column to database
2. Create pin/unpin API endpoint
3. Update UI to show pin button (vendor-only)
4. Sort comments: pinned first, then by date

---

### 🔔 Phase 4: Reply Notifications (TODO)
- Detect @mentions in comments
- Send notifications to mentioned users
- Create notifications table

**TODO**:
1. Parse comment text for @username mentions
2. Create `comment_notifications` table
3. Send notification when mentioned
4. Display notification badge

---

## Database Changes Needed

### 1. Create Reactions Table
Run the SQL in `/supabase/sql/COMMENT_REACTIONS_TABLE.sql`

### 2. Update Comment Reactions Tracking (Optional)
Add to existing comments table:
```sql
ALTER TABLE vendor_status_update_comments ADD COLUMN reactions_count INTEGER DEFAULT 0;
```

---

## Component Integration

### Using ReactionPicker in StatusUpdateCard

```jsx
import ReactionPicker from '@/components/vendor-profile/ReactionPicker';

// Inside comment item rendering:
<ReactionPicker 
  commentId={comment.id}
  currentUser={currentUser}
  onReactionAdded={(emoji, action) => {
    console.log(`Reaction ${action}:`, emoji);
  }}
/>
```

### Using EditCommentModal in StatusUpdateCard

```jsx
import EditCommentModal from '@/components/vendor-profile/EditCommentModal';

// State
const [editingCommentId, setEditingCommentId] = useState(null);
const [editingComment, setEditingComment] = useState(null);

// Handler
const handleEditComment = async (commentId) => {
  const comment = comments.find(c => c.id === commentId);
  setEditingComment(comment);
  setEditingCommentId(commentId);
};

const handleSaveEdit = async (newContent) => {
  try {
    const response = await fetch(`/api/status-updates/comments/${editingCommentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent }),
    });

    if (!response.ok) throw new Error('Failed to update');
    
    // Update local state
    setComments(comments.map(c => 
      c.id === editingCommentId 
        ? { ...c, content: newContent, updated_at: new Date() }
        : c
    ));
    
    setEditingCommentId(null);
  } catch (err) {
    alert('Failed to update comment');
  }
};

// In render:
{editingCommentId && (
  <EditCommentModal
    comment={editingComment}
    onSave={handleSaveEdit}
    onCancel={() => setEditingCommentId(null)}
    isLoading={loading}
  />
)}
```

---

## Testing Locally

1. Run `npm run dev`
2. Navigate to vendor profile
3. Open comments section
4. Click on comment reaction button
5. Pick an emoji
6. See reaction appear and count update
7. Click edit button on your comment
8. Update the text
9. Click save

---

## Next Steps

When Vercel limit resets:
1. Run SQL migration for reactions table
2. Integrate components into StatusUpdateCard
3. Test full flow
4. Deploy to Vercel
5. Build Phase 3 (pin comments)
6. Build Phase 4 (reply notifications)

---

## File Checklist

**Created (Not Yet Integrated)**:
- ✅ `/app/api/status-updates/comments/reactions/route.js`
- ✅ `/components/vendor-profile/ReactionPicker.js`
- ✅ `/supabase/sql/COMMENT_REACTIONS_TABLE.sql`
- ✅ `/components/vendor-profile/EditCommentModal.js`
- ✅ PUT method in `/app/api/status-updates/comments/[commentId]/route.js`

**TODO - Integration**:
- StatusUpdateCard.js - Add edit button and reaction picker to each comment
- Database - Run SQL migration for reactions table

---

## Architecture

```
StatusUpdateCard
  ├─ Comment List
  │  └─ Each Comment
  │     ├─ ReactionPicker (NEW)
  │     ├─ Edit Button (NEW)
  │     └─ Delete Button (existing)
  │
  ├─ EditCommentModal (NEW)
  │
  └─ Add Comment Form (existing)
```

---
