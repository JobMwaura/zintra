# Subscription Management Setup Guide

## Current Status
✅ **Frontend Code**: Complete and built successfully
✅ **Database Schema**: Defined in migration file
❌ **Database Tables**: Need to be created in Supabase

## Issue
The `/admin/subscriptions` page won't display data because the required database tables don't exist yet in your Supabase instance.

## What You Need to Do

### Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** (left sidebar)

### Step 2: Run the Migration
1. Click **New Query**
2. Copy and paste **ALL** the SQL from `/supabase/sql/MIGRATION_v2_FIXED.sql`
3. Click **Run**
4. Wait for success message

### Step 3: Verify Tables Were Created
In Supabase, go to **Table Editor** and verify you see:
- `subscription_plans` ✓
- `vendor_subscriptions` ✓
- `admin_users` ✓
- `rfq_requests` ✓
- `rfq_responses` ✓
- `reviews` ✓
- `admin_activity` ✓
- `notifications` ✓
- `categories` ✓
- Plus existing tables: `rfqs`, `vendors`, `users`

### Step 4: Test the Page
1. The site should auto-redeploy on Vercel (check status)
2. Visit https://zintra-sandy.vercel.app/admin/subscriptions
3. You should see:
   - Plans Tab (empty initially)
   - Vendors Tab (empty initially)  
   - Analytics Tab (with zero stats)

### Step 5: Add Sample Data (Optional)
You can manually add test subscription plans via the UI:

**Create a Test Plan:**
- Name: "Starter"
- Price: 5000
- Description: "Basic listing access"
- Features: 
  - Unlimited RFQ access
  - Basic vendor profile
  - 30-day support

---

## Required Tables & Columns

### subscription_plans
```
- id (UUID, Primary Key)
- name (Text, Required)
- description (Text)
- price (Numeric 12,2)
- features (JSONB array)
- created_at (Timestamp)
```

### vendor_subscriptions
```
- id (UUID, Primary Key)
- vendor_id (UUID)
- user_id (UUID)
- plan_id (UUID, Foreign Key to subscription_plans)
- start_date (Timestamp)
- end_date (Timestamp)
- status (Text: active/inactive/paused)
- auto_renew (Boolean)
- created_at (Timestamp)
```

### vendors (UPDATE REQUIRED)
Must have these columns:
```
- verified (Boolean)
- rating (Numeric 3,2)
- rfqs_completed (Integer)
- response_time (Integer)
- complaints_count (Integer)
- last_active (Timestamp)
```

---

## Troubleshooting

### Page shows 404
- Verify build completed: `npm run build` ✓
- Verify file exists: `/app/admin/subscriptions/page.js` ✓
- Clear browser cache (Cmd+Shift+R)

### Page loads but shows "Error: ..."
- Check browser console (F12) for error details
- Verify Supabase connection string in `.env.local`
- Verify all tables exist in Supabase

### Table doesn't exist error
- Run migration SQL file again
- Check for SQL syntax errors
- Verify you're in the correct Supabase project

### Can't connect to Supabase
- Check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Verify keys are correct from Supabase Settings > API

---

## Database Verification Query

Run this in Supabase SQL Editor to verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscription_plans', 'vendor_subscriptions', 'admin_users', 'rfq_requests', 'rfq_responses', 'reviews', 'admin_activity', 'notifications', 'categories')
ORDER BY table_name;
```

You should see all 9 tables listed.

---

## Next Steps After Setup

1. ✅ Run the migration SQL
2. ✅ Verify tables exist
3. ✅ Visit the admin subscriptions page
4. ✅ Create test subscription plans
5. ✅ Add vendor subscriptions manually (or via admin UI)
6. ✅ Test all three tabs (Plans, Vendors, Analytics)

---

## Support

If you encounter issues:

1. Check the browser console for JavaScript errors (F12)
2. Check Supabase logs for database errors
3. Verify the migration SQL ran completely
4. Verify table/column names match exactly (case-sensitive)

---

**File Location**: `/supabase/sql/MIGRATION_v2_FIXED.sql`

Copy the entire contents and paste into Supabase SQL Editor, then click Run.
