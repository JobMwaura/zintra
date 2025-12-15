# 🚀 ZINTRA - Pre-Vercel Deployment Checklist

## Database Migrations Required

Before deploying to Vercel, run the following SQL migrations on your Supabase database.

---

## 📋 Files to Run

### 1. **supabase/sql/rfq_enhancements.sql** ← RUN THIS FIRST

This file contains:
- ✅ ALTER commands to add new columns to existing `rfqs` table
- ✅ CREATE TABLE statements for all required tables (with `IF NOT EXISTS`)
- ✅ Proper indexes for performance
- ✅ Support for all new analytics and management features

---

## 🔧 How to Run Migrations

### Option A: Via Supabase Dashboard (Recommended for beginners)

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your Zintra project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy all content from `supabase/sql/rfq_enhancements.sql`
6. Paste into the query editor
7. Click **Run** button
8. Wait for all statements to complete (should take < 30 seconds)

### Option B: Via psql CLI (For advanced users)

```bash
# Install psql if needed (on macOS)
brew install libpq
brew link --force libpq

# Get your Supabase connection string from:
# Settings → Database → Connection String → "URI" copy the postgresql:// URL

psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f supabase/sql/rfq_enhancements.sql
```

### Option C: Via Supabase CLI

```bash
# Login to Supabase (if not already)
supabase login

# Link to your project
supabase link --project-ref [PROJECT_ID]

# Push migrations
supabase db push
```

---

## ✅ What Gets Created/Modified

### New Columns Added to `rfqs` table:
- `auto_category` - auto-detected category
- `project_type` - type of project
- `urgency` - asap/normal/flexible
- `buyer_name`, `buyer_email`, `buyer_phone` - buyer contact info
- `buyer_reputation` - new/bronze/silver/gold
- `services_required` - JSON array of services
- `material_requirements` - text field
- `dimensions` - JSON object {length, width, height}
- `quality_preference` - quality tier
- `site_accessibility` - site access info
- `delivery_preference` - delivery method
- `reference_images` - JSON array
- `documents` - JSON array
- `validation_status` - pending/validated/needs_review/rejected
- `spam_score` - 0-100
- `budget_flag` - boolean
- `rejection_reason` - text
- `published_at` - when RFQ went live
- `closed_at` - when RFQ was closed

### Tables Created (if missing):
- `admin_users` - admin user profiles
- `subscription_plans` - vendor subscription tiers
- `vendor_subscriptions` - vendor subscription records
- `rfq_requests` - vendor invitations to RFQs
- `rfq_responses` - vendor quotes/responses
- `reviews` - vendor ratings/reviews
- `admin_activity` - audit log
- `notifications` - system notifications
- `vendors` - vendor profiles (ensure it exists)
- `users` - user profiles (ensure it exists)
- `categories` - RFQ categories

### New Indexes Created:
- `idx_rfqs_validation_status` - speed up validation queries
- `idx_rfqs_user_id` - speed up user RFQ lookups
- `idx_rfqs_county` - speed up geographic filtering
- `idx_rfqs_created_at` - speed up date-based queries
- Plus many others for related tables

---

## 🧪 Verify Everything Worked

After running the migration, run these verification queries in Supabase SQL Editor:

```sql
-- Check if new rfqs columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'rfqs' 
ORDER BY column_name;

-- Check if all tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check if indexes were created
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'rfqs'
ORDER BY indexname;
```

Expected: You should see 30+ columns in rfqs, all required tables, and many indexes.

---

## ⚠️ Important Notes

### If you get errors:

1. **"relation 'rfqs' does not exist"** 
   - Run the basic `admin_schema.sql` first (the base schema)
   - Then run `rfq_enhancements.sql`

2. **"column already exists"**
   - That's OK! The `IF NOT EXISTS` clauses handle this
   - The script is idempotent (safe to run multiple times)

3. **Foreign key errors**
   - Make sure `rfqs` table exists before running migrations
   - Make sure all referenced tables exist

### Backup first:
Before running any migrations on production database:
```bash
# Take a snapshot of your database
# Go to Supabase Dashboard → Settings → Backups → Create Backup
```

---

## 📝 Post-Migration Steps

1. **Verify columns** using the SQL queries above
2. **Restart your Next.js dev server**
   ```bash
   npm run dev
   ```
3. **Test the new features**:
   - Go to `/admin/rfqs` → Should see the new landing page
   - Click "Pending Review" → Check detail modal has new fields
   - Click "Analytics" → Should load analytics data
   - Go to `/admin/rfqs/active` → Try closing an RFQ

4. **Commit to git**:
   ```bash
   git add .
   git commit -m "feat: Enhanced RFQ management with new database schema and admin dashboard"
   git push origin main
   ```

5. **Deploy to Vercel**:
   - Vercel will auto-deploy on push to main
   - Or manually trigger from [https://vercel.com](https://vercel.com)

---

## 🔐 Security Notes

- The migrations use `CREATE TABLE IF NOT EXISTS` for safety
- All tables should have Row Level Security (RLS) enabled per your requirements
- Admin tables (`admin_users`, `admin_activity`) should be restricted
- Consider adding RLS policies before production use

Example RLS policy (run in SQL Editor if needed):
```sql
-- Allow users to see only their own RFQs
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own RFQs"
  ON public.rfqs
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
```

---

## 📊 Expected Database Size

After migrations:
- `rfqs` table: ~20KB per RFQ (with JSON fields)
- `rfq_requests` table: ~1KB per request
- `rfq_responses` table: ~2KB per response
- Total indexes: ~1MB for first 10k RFQs

---

## 🆘 Support

If you hit issues:

1. Check Supabase logs: **Settings → Logs → Database**
2. Verify table structure: Run the verification queries above
3. Test with sample data: Insert a test RFQ via the UI
4. Check console errors in browser DevTools

---

## ✨ What's Ready After Migration

After this runs successfully, you get:

✅ **Enhanced Admin Dashboard**
- Tabbed RFQ management interface
- Real-time stats and metrics
- Pending/Active/Analytics views

✅ **Better RFQ Data**
- All customer-submitted fields saved
- Spam detection scoring
- Validation status tracking
- Auto-categorization support

✅ **Analytics & Insights**
- Category performance metrics
- Geographic hotspots
- Budget distribution analysis
- Vendor response rates
- Approval/rejection statistics

✅ **RFQ Lifecycle Management**
- Approve RFQs with auto-vendor notification
- Reject with reason tracking
- Close completed RFQs
- Stale RFQ detection

---

**Last Updated**: December 15, 2025  
**Version**: 1.0  
**Status**: Ready for production deployment
