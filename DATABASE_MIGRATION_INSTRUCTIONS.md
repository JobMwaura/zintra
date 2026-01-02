# Database Migration Instructions

## ⚠️ CRITICAL: Policy Already Exists Error

If you see this error:
```
ERROR: 42710: policy "rfqs_select_own" for table "rfqs" already exists
```

**This means you ran the WRONG SQL file.**

---

## ✅ WHAT TO DO

### Step 1: Cancel/Ignore the RFQ_SYSTEM_COMPLETE.sql
Do **NOT** run `supabase/sql/RFQ_SYSTEM_COMPLETE.sql`

This file is for **initial setup only** and creates policies that already exist in your database.

### Step 2: Run ONLY the Migration File
Run **ONLY** this file:
```
supabase/sql/MIGRATION_ADD_RFQ_COLUMNS.sql
```

This file:
- ✅ Adds missing columns to the rfqs table
- ✅ Uses `IF NOT EXISTS` for safety (idempotent)
- ✅ Does NOT recreate policies
- ✅ Safe to run multiple times
- ✅ Takes < 1 second

### Step 3: Deploy the Migration

#### Option A: Supabase Dashboard (⭐ RECOMMENDED)
1. Go to https://app.supabase.com → Select "zintra" project
2. Click **SQL Editor** → **New Query**
3. Open `supabase/sql/MIGRATION_ADD_RFQ_COLUMNS.sql` in your editor
4. Copy the entire contents
5. Paste into Supabase SQL editor
6. Click **Run** button
7. Wait for ✅ Success message

#### Option B: Supabase CLI
```bash
cd /Users/macbookpro2/Desktop/zintra-platform
supabase db push
```

#### Option C: Direct psql Connection
```bash
psql "postgresql://..." < supabase/sql/MIGRATION_ADD_RFQ_COLUMNS.sql
```

---

## 📋 What Gets Added

This migration adds these columns to the `rfqs` table:

| Column | Type | Purpose |
|--------|------|---------|
| `type` | TEXT | 'direct', 'matched', or 'public' RFQ type |
| `urgency` | TEXT | 'normal', 'high', 'urgent' |
| `attachments` | JSONB | Stores all form data as JSON |
| `assigned_vendor_id` | UUID | Reference to assigned vendor |
| `is_paid` | BOOLEAN | Payment status tracking |
| `paid_amount` | DECIMAL | Amount paid |
| `tags` | TEXT[] | Array of tags |
| `expires_at` | TIMESTAMPTZ | RFQ expiration date |
| `completed_at` | TIMESTAMPTZ | Completion timestamp |
| `budget_min` | DECIMAL | Minimum budget (KES) |
| `budget_max` | DECIMAL | Maximum budget (KES) |
| `location` | TEXT | Project location/town |
| `county` | TEXT | County/region |
| `category_slug` | TEXT | Category identifier (for filtering) |
| `status` | TEXT | RFQ status (open/closed/archived) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

Plus indexes and triggers for performance optimization.

---

## ✅ Verification

After running the migration, verify it worked:

### In Supabase Dashboard:
1. Go to **Table Editor**
2. Click **rfqs** table
3. Check that all new columns appear in the column list
4. Especially verify:
   - `budget_min` exists
   - `budget_max` exists
   - `user_id` exists (should be from original schema)
   - `attachments` is JSONB type

### Via SQL Query:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rfqs' 
ORDER BY ordinal_position;
```

Should show all columns including budget_min, budget_max, location, county, attachments, etc.

---

## 🚀 Next Steps After Migration

1. ✅ Test the RFQ modal form
2. ✅ Submit a test RFQ
3. ✅ Verify data is saved (check Supabase table)
4. ✅ Check that no errors appear

---

## 🔧 Troubleshooting

### If you see "policy already exists" error again:
- You ran the wrong file
- Go back to Step 1 and run ONLY `MIGRATION_ADD_RFQ_COLUMNS.sql`
- Ignore/cancel any RFQ_SYSTEM_COMPLETE.sql queries

### If columns still don't exist:
- Migration might not have run successfully
- Check Supabase logs for error messages
- Run the verification SQL query above
- Contact support with the error message

### If RFQ modal still fails:
- Verify all columns exist (use verification query above)
- Check that `user_id` is being sent in the form submission
- Check browser console for JavaScript errors
- Check Supabase logs for insert errors

---

## 📚 File Reference

| File | Purpose | When to Run |
|------|---------|------------|
| `RFQ_SYSTEM_COMPLETE.sql` | Initial schema setup (creates tables + policies) | **NEVER** (already done) |
| `MIGRATION_ADD_RFQ_COLUMNS.sql` | Add missing columns to existing tables | **NOW** (this is what you need) |

---

## 💡 Key Takeaway

**Running the right file matters!**

- RFQ_SYSTEM_COMPLETE.sql = Initial setup (tables + policies)
- MIGRATION_ADD_RFQ_COLUMNS.sql = Add missing columns

If policies already exist, you need the migration file, not the complete schema file.
