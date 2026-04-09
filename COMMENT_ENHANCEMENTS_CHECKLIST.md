# ✅ Comment Enhancements - Integration Checklist

## Phase 1: Emoji Reactions ✅ BUILT

### Files Ready:
- [x] `/app/api/status-updates/comments/reactions/route.js` - API
- [x] `/components/vendor-profile/ReactionPicker.js` - Component
- [x] `/supabase/sql/COMMENT_REACTIONS_TABLE.sql` - Database schema

### Integration Steps:
1. [ ] Import ReactionPicker in StatusUpdateCard
2. [ ] Add `reactions` state to track reaction UI state
3. [ ] Render ReactionPicker for each comment:
   ```jsx
   <ReactionPicker 
     commentId={comment.id}
     currentUser={currentUser}
   />
   ```
4. [ ] Test reactions in `npm run dev`
5. [ ] When deploying: Run SQL migration in Supabase

---

## Phase 2: Edit Comments ✅ BUILT

### Files Ready:
- [x] `/components/vendor-profile/EditCommentModal.js` - Component
- [x] API method added to `/app/api/status-updates/comments/[commentId]/route.js`

### Integration Steps:
1. [ ] Import EditCommentModal in StatusUpdateCard
2. [ ] Add state:
   ```javascript
   const [editingCommentId, setEditingCommentId] = useState(null);
   const [editingComment, setEditingComment] = useState(null);
   ```
3. [ ] Add edit handler:
   ```javascript
   const handleEditComment = (comment) => {
     setEditingComment(comment);
     setEditingCommentId(comment.id);
   };
   ```
4. [ ] Add update handler:
   ```javascript
   const handleSaveEdit = async (newContent) => {
     const response = await fetch(
       `/api/status-updates/comments/${editingCommentId}`,
       { method: 'PUT', body: JSON.stringify({ content: newContent }) }
     );
     // Reload comments or update state
   };
   ```
5. [ ] Add edit button to each comment (show only if currentUser owns it)
6. [ ] Render EditCommentModal when editing
7. [ ] Test in `npm run dev`

---

## Phase 3: Pin Comments 🔜 TODO

### Design:
- [x] Component structure planned
- [ ] Add `is_pinned` column to vendor_status_update_comments
- [ ] Create pin/unpin API endpoint
- [ ] Build UI component for pin button
- [ ] Sort comments: pinned first

### Implementation Checklist:
- [ ] Database migration SQL
- [ ] API endpoint: `POST /api/status-updates/comments/[id]/pin`
- [ ] Component: Pin button (vendor-only)
- [ ] Update comment sorting logic
- [ ] Add "pinned" badge to UI
- [ ] Test integration

---

## Phase 4: Reply Notifications 🔜 TODO

### Design:
- [x] Architecture planned
- [ ] Detect @mentions in comments
- [ ] Create notifications table
- [ ] Build notification logic

### Implementation Checklist:
- [ ] Create `comment_notifications` table
- [ ] Parse comment text for @username
- [ ] When saving comment: check for mentions
- [ ] Create notification records
- [ ] Update profile/dashboard to show notifications
- [ ] Build notification UI component
- [ ] Test mention detection

---

## 🚀 Deployment Checklist

### Before First Deploy:
- [ ] All components integrated into StatusUpdateCard
- [ ] Tested locally with `npm run dev`
- [ ] No console errors
- [ ] Reactions working correctly
- [ ] Edit comments working correctly

### Database:
- [ ] Run SQL migration: `COMMENT_REACTIONS_TABLE.sql`
- [ ] Verify table created in Supabase
- [ ] Test RLS policies

### Git/Vercel:
- [ ] All files added to git
- [ ] Commit message: `feat: add comment reactions and edit functionality`
- [ ] Push to main branch
- [ ] Vercel auto-deploys
- [ ] Test on production

---

## 🧪 Testing Scenarios

### Reactions Testing:
1. [ ] Can add reaction to comment
2. [ ] Reaction count updates in real-time
3. [ ] Can remove reaction (toggle off)
4. [ ] My reaction is highlighted blue
5. [ ] Can add multiple different reaction types
6. [ ] Reactions persist on page reload

### Edit Testing:
1. [ ] Only my comments show edit button
2. [ ] Edit button opens modal
3. [ ] Can edit comment text
4. [ ] Character counter works
5. [ ] Can't save empty comment
6. [ ] "edited" timestamp appears
7. [ ] Updated comment displays immediately
8. [ ] Other users see edited version

---

## 📋 Documentation Reference

- **Build Guide**: `COMMENT_ENHANCEMENTS_BUILD_GUIDE.md`
- **Summary**: `COMMENT_ENHANCEMENTS_BUILD_SUMMARY.md`
- **This Checklist**: `COMMENT_ENHANCEMENTS_CHECKLIST.md`

---

## ⏱️ Estimated Timeline

- Phase 1 Integration: 30 mins
- Phase 2 Integration: 20 mins
- Testing: 20 mins
- Deployment: 10 mins
- **Total for Phases 1-2: ~1.5 hours**

---

## 🎯 Quick Start

```bash
# 1. In StatusUpdateCard.js, add imports:
import ReactionPicker from '@/components/vendor-profile/ReactionPicker';
import EditCommentModal from '@/components/vendor-profile/EditCommentModal';

# 2. Add to comment rendering:
<ReactionPicker commentId={comment.id} currentUser={currentUser} />
<button onClick={() => handleEditComment(comment)}>Edit</button>

# 3. Test locally:
npm run dev

# 4. When ready to deploy:
# - Run SQL migration in Supabase
# - Commit and push to git
# - Vercel auto-deploys
```

---

**Status**: ✅ All code ready, waiting for integration! 🚀
