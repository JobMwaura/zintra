# SQL Migration Guide - RFQ System (December 17, 2025)

## Overview
The new RFQ forms require database schema changes to support three RFQ types (Direct, Matched/Wizard, and Public). This guide shows you exactly what SQL to run.

## What Gets Added

### 1. **Six New Columns to `rfqs` Table**
- `rfq_type` - Enum: 'direct', 'matched', 'public'
- `visibility` - Enum: 'private', 'semi-private', 'public'
- `deadline` - Timestamp for quote submission deadline
- `budget_min` - Integer (minimum budget in KSh)
- `budget_max` - Integer (maximum budget in KSh)
- `payment_terms` - String (payment preference)

### 2. **Two New Tables**
- `rfq_recipients` - Tracks which vendors received direct/matched RFQs
- `rfq_quotes` - Stores vendor quotes/responses

### 3. **Multiple Indexes**
- Performance optimization for queries on new columns

### 4. **Row Level Security (RLS) Policies**
- Secure access control for new tables
- Allow buyers to create recipients
- Allow vendors to submit quotes

---

## How to Run the Migration

### **Option 1: Supabase Dashboard (Recommended for Small Databases)**

1. Go to https://supabase.com → Select your project
2. Click **SQL Editor** in the left sidebar
3. Click **+ New Query**
4. Copy all SQL from: `supabase/sql/MIGRATION_RFQ_SYSTEM_DEC2025.sql`
5. Paste into the editor
6. Click **Run** button (top right)
7. Wait for completion (should see "Query executed successfully")

### **Option 2: Command Line (psql)**

```bash
# Connect to your database
psql postgresql://[user]:[password]@[host]:[port]/[database]

# Run the migration file
\i supabase/sql/MIGRATION_RFQ_SYSTEM_DEC2025.sql

# Verify success (should show the new tables)
\dt public.rfq*
```

### **Option 3: Using Supabase CLI**

```bash
# If you have supabase CLI installed
supabase db push

# Or manually run migration
supabase sql < supabase/sql/MIGRATION_RFQ_SYSTEM_DEC2025.sql
```

---

## What Each Section Does

### **STEP 1: Add Columns to rfqs Table**
Adds the six new columns needed by the forms:
- `rfq_type`: 'direct' / 'matched' / 'public'
- `visibility`: 'private' / 'semi-private' / 'public'
- `deadline`: Date when vendors must submit quotes
- `budget_min/max`: Replaces old `budget_range` string
- `payment_terms`: New payment preference field

### **STEP 2: Create rfq_recipients Table**
Tracks which vendors receive RFQs:
```
Columns: id, rfq_id, vendor_id, recipient_type, notification_sent_at, viewed_at, quote_submitted
Purpose: When you send Direct RFQ to 5 vendors, 5 rows created here
```

### **STEP 3: Create rfq_quotes Table**
Stores vendor responses:
```
Columns: id, rfq_id, vendor_id, amount, currency, timeline_days, payment_terms, notes, status
Purpose: When vendor submits quote, row created here
```

### **STEP 4: Add Indexes**
Optimizes database query performance (no visible changes)

### **STEP 5: Add Comments**
Documents the schema changes for future developers

### **STEP 6: Update RLS Policies**
Secures access to new tables:
- Only authenticated users can create recipients
- Only authenticated users can submit quotes
- Proper row-level access control

### **STEP 7: Grant Permissions**
Allows authenticated users to read/write to new tables

---

## Verification After Running Migration

Run these queries to verify everything worked:

### **Check if columns were added:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rfqs' 
AND column_name IN ('rfq_type', 'visibility', 'deadline', 'budget_min', 'budget_max', 'payment_terms');
```

Expected output: 6 rows (one for each new column)

### **Check if new tables exist:**
```sql
SELECT tablename FROM pg_tables 
WHERE tablename IN ('rfq_recipients', 'rfq_quotes');
```

Expected output: 2 rows (rfq_recipients, rfq_quotes)

### **Check table structure (psql only):**
```sql
\d public.rfq_recipients
\d public.rfq_quotes
```

---

## Timeline for Deployment

1. **Now**: Run the SQL migration (takes ~30 seconds)
2. **Immediately after**: Forms are ready to use
3. **Next phase**: Implement auto-matching algorithm
4. **Later phases**: Vendor notifications, quote management, RFQ details page

---

## Troubleshooting

### **Error: "relation 'rfqs' does not exist"**
- Check that your Supabase project is selected
- Make sure you're in the correct database

### **Error: "column already exists"**
- The migration uses `IF NOT EXISTS` clauses - it's safe to run multiple times
- Just run it again; it will skip what's already created

### **Error: "permission denied"**
- Make sure you're logged in as a user with admin/superuser permissions
- In Supabase, use the project's postgres role (not anon/service_role)

### **Tables created but forms still not working**
- Clear your browser cache
- Restart the Next.js development server
- Verify the Supabase client is pointing to the correct database

---

## Success Indicators

✅ **You'll know it worked when:**
1. SQL query shows "Query executed successfully" (no errors)
2. You can see the 2 new tables in Supabase SQL Editor
3. The RFQ forms submit without "table does not exist" errors
4. New RFQs appear in the database with populated budget_min/max fields
5. Direct/Matched RFQs create entries in rfq_recipients table

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/sql/MIGRATION_RFQ_SYSTEM_DEC2025.sql` | Main migration (run this!) |
| `supabase/sql/MIGRATION_RFQ_TYPES.sql` | Older version (can ignore) |
| `app/post-rfq/direct/page.js` | Direct RFQ form (uses new fields) |
| `app/post-rfq/wizard/page.js` | Wizard RFQ form (uses new fields) |
| `app/post-rfq/public/page.js` | Public RFQ form (uses new fields) |

---

## Next Steps After Migration

1. ✅ Run this SQL migration
2. Test the RFQ forms in your local dev environment
3. Create test RFQs of each type
4. Verify data appears correctly in Supabase
5. Implement auto-matching algorithm (Phase 5)
6. Set up vendor notifications (Phase 6)

---

**Last Updated**: December 17, 2025  
**Status**: Ready to run - no prerequisites
