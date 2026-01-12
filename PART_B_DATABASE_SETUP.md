# Part B: Database Migration Setup 🗄️

## Quick Instructions

### 1. Go to Supabase Dashboard
```
https://supabase.com → Select zintra project → SQL Editor
```

### 2. Create New Query
Click **+ New Query** button (top right)

### 3. Copy & Paste SQL
Open this file: `/supabase/sql/COMMENT_REACTIONS_TABLE.sql`

Copy the entire contents and paste into Supabase SQL Editor.

### 4. Run Query
Click **RUN** button or press **Cmd+Enter**

### 5. Verify
Look for: `Query executed successfully`

---

## What Gets Created

**Table:** `vendor_status_update_comment_reactions`

**Columns:**
- `id` - UUID (primary key)
- `comment_id` - UUID (links to comments)
- `user_id` - UUID (links to user)
- `emoji` - Text (single emoji like 👍)
- `created_at` - Timestamp

**Features:**
- Unique constraint: One emoji per user per comment
- Auto-delete when comment is deleted
- Row-level security enabled
- Performance indexes on comment_id and user_id

---

## RLS Policies Automatically Applied

✅ **SELECT** - Anyone can view reactions
✅ **INSERT** - Only authenticated users can add (their own)
✅ **DELETE** - Only users can remove their own

---

## Expected Result

```
Query executed successfully (finished in 150ms)
```

No errors = success! ✅

---

## If Something Goes Wrong

### Error: "relation does not exist"
→ Wrong database or vendor_status_update_comments table not found

### Error: "duplicate key violates unique constraint"
→ Normal when testing - means toggle worked

### Error: "permission denied"
→ Check RLS policies were applied

### To roll back:
```sql
DROP TABLE IF EXISTS public.vendor_status_update_comment_reactions CASCADE;
```

---

## After Migration Complete

1. ✅ Restart your dev server:
```bash
npm run dev
```

2. ✅ Test locally:
   - Open vendor profile
   - Click comment
   - Try adding a reaction
   - Should save immediately

3. ✅ Refresh page
   - Reaction should persist ✅

---

## You're Done with Part B! 🎉

Now you can:
- Add emoji reactions to comments
- Reactions save to database
- Reactions persist across page refreshes
- Each user can only have one type of emoji per comment
- Click same emoji again to remove (toggle)

---

**Time:** 5-10 minutes
**Difficulty:** Very Easy
**Risk:** None (can rollback anytime)
