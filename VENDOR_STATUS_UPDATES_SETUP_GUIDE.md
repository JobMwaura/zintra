# SQL Migration Guide - Vendor Status Updates & RFQ Inbox

## Overview

This guide walks you through executing the SQL migrations to enable:
1. **Vendor Status Updates** - Facebook-like posting feature
2. **RFQ Inbox** - Unified interface for tracking all RFQ types received

## Important Notes ⚠️

- Run these migrations in your Supabase SQL editor: https://app.supabase.com/project/YOUR_PROJECT_ID/sql
- Ensure you have proper Supabase setup with `auth.users` table
- The migrations include proper RLS (Row Level Security) policies
- Test in development before running on production

---

## Step 1: Execute the Full Migration

### 1.1 Copy and Paste the Entire SQL File

Navigate to your Supabase project's SQL editor and copy the **entire** contents of:
```
supabase/sql/VENDOR_STATUS_UPDATES_AND_RFQ_INBOX.sql
```

Paste it into the SQL editor and click "Run" button.

### 1.2 What This Migration Does

✅ Creates `vendor_status_updates` table  
✅ Creates `vendor_status_update_likes` table  
✅ Creates `vendor_status_update_comments` table  
✅ Creates `vendor_rfq_inbox_stats` table  
✅ Creates `vendor_rfq_inbox` view  
✅ Sets up automatic triggers for likes and comment counts  
✅ Grants proper database permissions  

---

## Step 2: Verify Tables Were Created

After running the migration, verify in Supabase:

```sql
-- Check if vendor_status_updates table exists
SELECT * FROM information_schema.tables 
WHERE table_name IN (
  'vendor_status_updates',
  'vendor_status_update_likes',
  'vendor_status_update_comments',
  'vendor_rfq_inbox_stats'
)
LIMIT 10;
```

Expected output: 4 rows (one for each table)

---

## Step 3: Verify the View

Check if the vendor_rfq_inbox view was created:

```sql
-- Check if view exists
SELECT * FROM information_schema.views 
WHERE table_name = 'vendor_rfq_inbox';
```

Expected output: 1 row

---

## Step 4: Create Storage Bucket (For Status Update Images)

In Supabase, create a new storage bucket for vendor status images:

1. Go to **Storage** section in Supabase dashboard
2. Click **Create new bucket**
3. Name it: `vendor-status-images`
4. Keep it **Private** (authenticated access only)
5. Click **Create bucket**

---

## Step 5: Set Storage Policies

Add the following policies to the `vendor-status-images` bucket:

### Policy 1: Vendors can upload their own images
```
Type: INSERT
Auth: Authenticated users
Expression: auth.uid() = owner_id OR true
```

### Policy 2: Anyone can read public images
```
Type: SELECT
Auth: Public (no restrictions)
Expression: true
```

### Policy 3: Vendors can delete their own images
```
Type: DELETE
Auth: Authenticated users
Expression: auth.uid() = owner_id OR true
```

---

## Step 6: Enable RLS (Row Level Security) Policies

### 6.1 Status Updates Table

Run the following to add RLS policies:

```sql
-- Enable RLS
ALTER TABLE public.vendor_status_updates ENABLE ROW LEVEL SECURITY;

-- Policy: Vendors can see all status updates (public view)
CREATE POLICY "Anyone can view status updates" 
ON public.vendor_status_updates FOR SELECT 
USING (true);

-- Policy: Vendors can insert their own updates
CREATE POLICY "Vendors can create their own updates" 
ON public.vendor_status_updates FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM vendors WHERE id = vendor_id));

-- Policy: Vendors can update their own updates
CREATE POLICY "Vendors can update their own updates" 
ON public.vendor_status_updates FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM vendors WHERE id = vendor_id));

-- Policy: Vendors can delete their own updates
CREATE POLICY "Vendors can delete their own updates" 
ON public.vendor_status_updates FOR DELETE 
USING (auth.uid() = (SELECT user_id FROM vendors WHERE id = vendor_id));
```

### 6.2 Likes Table

```sql
-- Enable RLS
ALTER TABLE public.vendor_status_update_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view likes
CREATE POLICY "Anyone can view likes" 
ON public.vendor_status_update_likes FOR SELECT 
USING (true);

-- Policy: Authenticated users can add likes
CREATE POLICY "Users can like updates" 
ON public.vendor_status_update_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove their own likes
CREATE POLICY "Users can unlike their own likes" 
ON public.vendor_status_update_likes FOR DELETE 
USING (auth.uid() = user_id);
```

### 6.3 Comments Table

```sql
-- Enable RLS
ALTER TABLE public.vendor_status_update_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view comments
CREATE POLICY "Anyone can view comments" 
ON public.vendor_status_update_comments FOR SELECT 
USING (true);

-- Policy: Authenticated users can add comments
CREATE POLICY "Users can comment on updates" 
ON public.vendor_status_update_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments" 
ON public.vendor_status_update_comments FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments" 
ON public.vendor_status_update_comments FOR DELETE 
USING (auth.uid() = user_id);
```

### 6.4 RFQ Inbox Stats Table

```sql
-- Enable RLS
ALTER TABLE public.vendor_rfq_inbox_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Vendors can only see their own stats
CREATE POLICY "Vendors can view their own stats" 
ON public.vendor_rfq_inbox_stats FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM vendors WHERE id = vendor_id));

-- Policy: Only system can update stats (via trigger)
CREATE POLICY "Only authenticated users can update stats" 
ON public.vendor_rfq_inbox_stats FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM vendors WHERE id = vendor_id));
```

---

## Step 7: Test the Migration

### 7.1 Test Vendor Status Updates

```sql
-- Insert a test status update
INSERT INTO public.vendor_status_updates (vendor_id, content)
SELECT 
  id,
  'This is a test status update! 🎉'
FROM vendors
LIMIT 1;

-- Verify it was inserted
SELECT * FROM public.vendor_status_updates 
ORDER BY created_at DESC 
LIMIT 1;
```

### 7.2 Test RFQ Inbox View

```sql
-- View all RFQs for a specific vendor
SELECT * FROM public.vendor_rfq_inbox 
WHERE vendor_id = (SELECT id FROM vendors LIMIT 1)
LIMIT 10;

-- Count RFQs by type for a vendor
SELECT 
  rfq_type_label,
  COUNT(*) as count
FROM public.vendor_rfq_inbox
WHERE vendor_id = (SELECT id FROM vendors LIMIT 1)
GROUP BY rfq_type_label;
```

### 7.3 Test Likes Trigger

```sql
-- Get a status update ID
WITH latest_update AS (
  SELECT id FROM public.vendor_status_updates 
  ORDER BY created_at DESC LIMIT 1
)
-- Insert a like
INSERT INTO public.vendor_status_update_likes (update_id, user_id)
SELECT id, auth.uid() FROM latest_update;

-- Verify likes_count was incremented
SELECT likes_count FROM public.vendor_status_updates 
ORDER BY created_at DESC LIMIT 1;
```

---

## Troubleshooting

### Issue: "relation does not exist" error

**Solution**: Ensure the entire migration file was executed. Some lines may have been skipped.

### Issue: Permission denied on INSERT

**Solution**: Check that RLS policies are properly set up and user is authenticated.

### Issue: Triggers not firing

**Solution**: Verify triggers were created:
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table LIKE 'vendor_status%';
```

### Issue: View returns no results

**Solution**: Verify that:
1. `rfqs` table has data
2. `rfq_recipients` table has data
3. Vendor ID exists in both tables

---

## Database Schema Reference

### vendor_status_updates
```
- id (UUID, Primary Key)
- vendor_id (UUID, Foreign Key to vendors)
- content (TEXT)
- images (TEXT array)
- likes_count (INTEGER)
- comments_count (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### vendor_status_update_likes
```
- id (UUID, Primary Key)
- update_id (UUID, Foreign Key to vendor_status_updates)
- user_id (UUID, Foreign Key to auth.users)
- created_at (TIMESTAMP)
```

### vendor_status_update_comments
```
- id (UUID, Primary Key)
- update_id (UUID, Foreign Key to vendor_status_updates)
- user_id (UUID, Foreign Key to auth.users)
- content (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### vendor_rfq_inbox_stats
```
- vendor_id (UUID, Primary Key)
- total_rfqs (INTEGER)
- direct_rfqs (INTEGER)
- matched_rfqs (INTEGER)
- wizard_rfqs (INTEGER)
- public_rfqs (INTEGER)
- unread_rfqs (INTEGER)
- pending_rfqs (INTEGER)
- accepted_rfqs (INTEGER)
- last_updated (TIMESTAMP)
```

### vendor_rfq_inbox (VIEW)
```
- id (UUID)
- rfq_id (UUID)
- requester_id (UUID)
- vendor_id (UUID)
- title (TEXT)
- description (TEXT)
- category (TEXT)
- county (TEXT)
- created_at (TIMESTAMP)
- status (TEXT)
- rfq_type (TEXT: 'direct', 'matched', 'wizard', 'public')
- viewed_at (TIMESTAMP or NULL)
- rfq_type_label (TEXT: display name)
- quote_count (INTEGER)
- total_quotes (INTEGER)
- requester_email (TEXT)
- requester_name (TEXT)
```

---

## Frontend Feature Summary

### Status Updates Tab
- Vendors can click "Share Update" button
- Opens modal to post text and up to 5 images
- Displays all updates as cards with:
  - Company logo and name
  - Update date/time
  - Content and images
  - Like/Comment/Share buttons
  - Like and comment counts
- Vendors can delete their own updates

### RFQ Inbox Tab
- Shows stats: Total RFQs, Unread, Pending, With Quotes
- Filter by RFQ type: All, Direct, Matched, Wizard, Public
- Each RFQ shows:
  - Type badge (color-coded)
  - Title and description
  - Category and location
  - Quote count (vendor's quotes vs total)
  - Date posted
  - "View Details" and "Submit Quote" buttons

---

## Next Steps

1. ✅ Execute the SQL migration
2. ✅ Verify tables and views created
3. ✅ Create storage bucket
4. ✅ Set storage policies
5. ✅ Enable RLS policies
6. ✅ Test with sample data
7. Deploy the frontend code (already in git)
8. Test the features in production

---

## Support

If you encounter any issues:
1. Check the Supabase logs for error details
2. Verify all tables exist in Database > Tables
3. Check RLS policies in Database > Policies
4. Ensure auth.users table is properly configured

