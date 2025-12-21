# Quick SQL Execution Summary

## 🚀 To Enable Both Features - 3 Simple Steps

### Step 1: Run the Main Migration

Go to your Supabase SQL editor and run the entire file:
```
File: supabase/sql/VENDOR_STATUS_UPDATES_AND_RFQ_INBOX.sql
```

This creates all tables, views, and automatic triggers.

---

### Step 2: Create Storage Bucket

In Supabase Storage, create a new bucket:
- **Name**: `vendor-status-images`
- **Access**: Private
- This stores images for status updates

---

### Step 3: Enable Row-Level Security (RLS)

Copy and paste all the RLS policy SQL from the section below:

---

## 📋 Complete RLS Policies SQL

Copy this entire block and run in Supabase SQL editor:

```sql
-- ============================================================================
-- VENDOR STATUS UPDATES - ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.vendor_status_updates ENABLE ROW LEVEL SECURITY;

-- Anyone can view status updates (public)
CREATE POLICY "view_all_status_updates" ON public.vendor_status_updates 
FOR SELECT USING (true);

-- Vendors can insert their own updates
CREATE POLICY "vendors_can_insert_updates" ON public.vendor_status_updates 
FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.vendors WHERE id = vendor_id)
);

-- Vendors can update their own updates
CREATE POLICY "vendors_can_update_own_updates" ON public.vendor_status_updates 
FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM public.vendors WHERE id = vendor_id)
);

-- Vendors can delete their own updates
CREATE POLICY "vendors_can_delete_own_updates" ON public.vendor_status_updates 
FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM public.vendors WHERE id = vendor_id)
);

-- ============================================================================
-- VENDOR STATUS UPDATE LIKES - ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.vendor_status_update_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes
CREATE POLICY "view_all_likes" ON public.vendor_status_update_likes 
FOR SELECT USING (true);

-- Authenticated users can like
CREATE POLICY "users_can_like" ON public.vendor_status_update_likes 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their own likes
CREATE POLICY "users_can_unlike" ON public.vendor_status_update_likes 
FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- VENDOR STATUS UPDATE COMMENTS - ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.vendor_status_update_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
CREATE POLICY "view_all_comments" ON public.vendor_status_update_comments 
FOR SELECT USING (true);

-- Authenticated users can comment
CREATE POLICY "users_can_comment" ON public.vendor_status_update_comments 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "users_can_update_comments" ON public.vendor_status_update_comments 
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "users_can_delete_comments" ON public.vendor_status_update_comments 
FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- VENDOR RFQ INBOX STATS - ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.vendor_rfq_inbox_stats ENABLE ROW LEVEL SECURITY;

-- Vendors can only view their own stats
CREATE POLICY "vendors_view_own_stats" ON public.vendor_rfq_inbox_stats 
FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.vendors WHERE id = vendor_id)
);

-- Only update own stats
CREATE POLICY "vendors_update_own_stats" ON public.vendor_rfq_inbox_stats 
FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM public.vendors WHERE id = vendor_id)
);
```

---

## ✅ Verification Queries

After running above SQL, verify everything works:

```sql
-- 1. Check tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'vendor_status%'
OR tablename = 'vendor_rfq_inbox_stats';

-- 2. Check view exists
SELECT * FROM information_schema.views 
WHERE table_schema = 'public' AND table_name = 'vendor_rfq_inbox';

-- 3. Check triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
AND event_object_table LIKE 'vendor_status%';

-- 4. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename LIKE 'vendor_status%' OR tablename = 'vendor_rfq_inbox_stats');
```

---

## 🔧 Storage Bucket RLS Policies

In Supabase Storage dashboard, set these policies for `vendor-status-images` bucket:

### Policy 1: Upload
```
Allowed operations: INSERT
Auth users: authenticated
Target: objects
Custom expression: true
```

### Policy 2: Download
```
Allowed operations: SELECT
Auth users: public
Target: objects
Custom expression: true
```

### Policy 3: Delete
```
Allowed operations: DELETE
Auth users: authenticated
Target: objects
Custom expression: true
```

---

## 📊 What You Get

### Frontend Features (Already Deployed):
- ✅ New "Updates" tab in vendor profile
- ✅ "Share Update" button (only visible to vendor)
- ✅ Status update modal (post text + up to 5 images)
- ✅ Status update cards (like, comment, share buttons)
- ✅ New "RFQ Inbox" tab (only visible to vendor)
- ✅ RFQ stats cards and filtering by type

### Database Features (Need SQL):
- ✅ Status updates storage
- ✅ Likes and comments system
- ✅ RFQ inbox view aggregating all RFQ types
- ✅ Stats tracking
- ✅ Automatic triggers for counters
- ✅ Proper security with RLS

---

## ❓ Common Questions

**Q: Do I need to create the tables manually?**  
A: No! The main SQL file creates all tables automatically.

**Q: What's the storage bucket for?**  
A: It stores images uploaded with status updates.

**Q: Are the RLS policies required?**  
A: Yes! They ensure vendors can only edit their own data.

**Q: Can I skip any part?**  
A: All three steps are required for full functionality.

**Q: When do I run this?**  
A: Immediately after deploying the frontend code.

---

## 🎯 Execution Order

1. Run `VENDOR_STATUS_UPDATES_AND_RFQ_INBOX.sql` ← Do this FIRST
2. Create `vendor-status-images` storage bucket
3. Run RLS policies SQL
4. Verify with verification queries
5. Test in app!

---

## 📞 Need Help?

If something doesn't work:
1. Check Supabase logs in Dashboard > Logs
2. Verify table exists: Database > Tables > Look for `vendor_status_updates`
3. Check RLS policies: Database > Policies
4. Search the workspace for detailed setup guide: `VENDOR_STATUS_UPDATES_SETUP_GUIDE.md`

