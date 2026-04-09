# 🔧 Fixing Conversations Table Constraints

## Problem
The database error shows:
```
null value in column "admin_id" of relation "conversations" violates not-null constraint
```

This means your `conversations` table has BOTH column sets:
- **New columns**: `participant_1_id`, `participant_2_id` (what we're using)
- **Old columns**: `admin_id`, `vendor_id` (which still have NOT NULL constraints)

The code is inserting data into the new columns, but PostgreSQL is also validating the old columns' constraints.

---

## Solution
Remove the NOT NULL constraints from the legacy `admin_id` and `vendor_id` columns.

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** → **New Query**

### Step 2: Run This Migration
Copy and paste this SQL:

```sql
-- Drop NOT NULL constraint from admin_id column
ALTER TABLE public.conversations
ALTER COLUMN admin_id DROP NOT NULL;

-- Drop NOT NULL constraint from vendor_id column
ALTER TABLE public.conversations
ALTER COLUMN vendor_id DROP NOT NULL;
```

Then click **Run** (⌘+Enter or Ctrl+Enter)

### Step 3: Verify
Run this query to confirm the changes:

```sql
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'conversations'
AND column_name IN ('admin_id', 'vendor_id', 'participant_1_id', 'participant_2_id')
ORDER BY column_name;
```

Expected output:
| column_name | is_nullable | data_type |
|-------------|-------------|-----------|
| admin_id | YES | uuid |
| participant_1_id | NO | uuid |
| participant_2_id | NO | uuid |
| vendor_id | YES | uuid |

---

## What This Does
- ✅ Allows `admin_id` and `vendor_id` to be NULL
- ✅ Keeps `participant_1_id` and `participant_2_id` as NOT NULL
- ✅ Your code can now insert conversations using the new column names
- ✅ The message sending will work without constraint violations

---

## After This Fix
Try sending a message from the admin panel:
1. Go to `/admin/dashboard/vendors?tab=active`
2. Click the purple **Message** button on any vendor
3. Type a message and click **Send Message**
4. Should see: ✅ "Message sent successfully"

---

## Why This Happened
Your database schema was partially migrated from the old column names (`admin_id`, `vendor_id`) to new ones (`participant_1_id`, `participant_2_id`), but the old column constraints weren't removed. This is a common issue when evolving database schemas without fully dropping the old columns.

The cleanest approach would be to eventually drop the old columns entirely, but removing their constraints allows the system to work immediately.
