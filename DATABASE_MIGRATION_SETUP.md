# Database Migration Setup - Comment Reactions

## Overview
This guide walks you through setting up the Comment Reactions feature in Supabase.

## Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com) and log in
2. Select your `zintra` project
3. Navigate to **SQL Editor** in the left sidebar

## Step 2: Create the Reactions Table
1. Click **+ New Query** (top right)
2. Copy and paste the entire contents of `/supabase/sql/COMMENT_REACTIONS_TABLE.sql`
3. Click **RUN** (bottom right, or Cmd+Enter)

**Expected Output:**
```
Query executed successfully (finished in 150ms)
```

## Step 3: Verify the Setup

### Check Table Creation
Run this query in SQL Editor:
```sql
SELECT * FROM public.vendor_status_update_comment_reactions LIMIT 1;
```

Should return no errors (empty result is fine).

### Check Indexes
Run this query:
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'vendor_status_update_comment_reactions';
```

Should return:
- `idx_comment_reactions_comment_id`
- `idx_comment_reactions_user_id`

### Check RLS Policies
Run this query:
```sql
SELECT policyname, cmd, qual FROM pg_policies 
WHERE tablename = 'vendor_status_update_comment_reactions';
```

Should return 3 policies:
- `Anyone can view reactions` (SELECT)
- `Users can add reactions` (INSERT)
- `Users can remove their own reactions` (DELETE)

## Step 4: Test with Sample Data (Optional)

To verify everything works, you can insert a test reaction:

```sql
-- Get a real user_id and comment_id from your database
INSERT INTO public.vendor_status_update_comment_reactions 
  (comment_id, user_id, emoji)
VALUES 
  ((SELECT id FROM vendor_status_update_comments LIMIT 1),
   (SELECT id FROM auth.users LIMIT 1),
   '👍');
```

Then verify it was created:
```sql
SELECT * FROM public.vendor_status_update_comment_reactions;
```

Finally, delete the test record:
```sql
DELETE FROM public.vendor_status_update_comment_reactions 
WHERE emoji = '👍' AND created_at > NOW() - INTERVAL '1 minute';
```

## Step 5: Restart Your Development Server

After the migration, restart your Next.js dev server:

```bash
# Kill the existing server (Ctrl+C)
npm run dev
```

## Verification Checklist

- ✅ Table `vendor_status_update_comment_reactions` created
- ✅ Columns: `id`, `comment_id`, `user_id`, `emoji`, `created_at`
- ✅ UNIQUE constraint on `(comment_id, user_id, emoji)`
- ✅ Foreign keys configured with CASCADE delete
- ✅ Indexes created on `comment_id` and `user_id`
- ✅ RLS enabled
- ✅ Three RLS policies in place
- ✅ Dev server restarted

## What's Next?

Once the database migration is complete:

1. ✅ Components already integrated into StatusUpdateCard.js
2. ✅ API endpoints ready at `/api/status-updates/comments/reactions`
3. ✅ ReactionPicker component active in comments
4. 🚀 Test locally with `npm run dev`

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the SQL in the correct Supabase project
- Check that the `vendor_status_update_comments` table exists

### Error: "duplicate key value violates unique constraint"
- This is normal - it means you're trying to add the same emoji reaction twice
- The component handles this automatically (toggle behavior)

### Reactions not showing
- Verify RLS policies are applied correctly
- Check browser console for API errors
- Ensure user is authenticated

### Need to Roll Back?
Run this in SQL Editor:
```sql
DROP TABLE IF EXISTS public.vendor_status_update_comment_reactions CASCADE;
```

## Production Deployment

Once you're satisfied with local testing:

1. Commit changes: `git add -A && git commit -m "feat: add comment reactions and edit functionality"`
2. Push to GitHub: `git push origin main`
3. Vercel will auto-deploy
4. Migration is already applied to production database

---

**Estimated Time:** 5-10 minutes total
**Difficulty:** Low
**Risk:** None (can be rolled back anytime)
