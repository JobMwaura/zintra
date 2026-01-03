# Vendor Response Error - Comprehensive Diagnostic Guide

## Issue Summary
When vendor tries to submit a response, getting "Internal server error" (500)

## Most Likely Cause
The `rfq_responses` table is missing one or more columns that the code is trying to insert.

The endpoint tries to insert these ~40 columns:
- rfq_id, vendor_id (required)
- quote_title, intro_text (new fields)
- pricing_model, price_min, price_max, unit_type, unit_price, etc. (new pricing fields)
- inclusions, exclusions, client_responsibilities (new fields)
- quote_status, submitted_at, expires_at (new metadata)
- quoted_price, currency, delivery_timeline, description, attachments, warranty, payment_terms (old fields)
- status, vendor_name, vendor_rating (old fields)

## Step 1: Check Database Schema

**Run this SQL in Supabase SQL Editor:**

```sql
-- Check what columns actually exist in rfq_responses table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'rfq_responses'
ORDER BY ordinal_position;
```

**Expected output:** See all the columns listed above

**If missing columns:** You'll see gaps (e.g., rfq_id, vendor_id, quoted_price, status but NOT the new quote_title, intro_text, etc.)

---

## Step 2: Identify Missing Columns

Compare actual columns with what code expects:

**REQUIRED (must exist):**
- rfq_id
- vendor_id
- status
- created_at

**NEW COLUMNS (added in recent refactor):**
- quote_title
- intro_text
- pricing_model
- inclusions
- exclusions
- etc.

---

## Step 3: Solution - Add Missing Columns

If columns are missing, copy and paste this SQL:

```sql
-- Add missing quote form columns to rfq_responses
ALTER TABLE public.rfq_responses
ADD COLUMN IF NOT EXISTS quote_title TEXT,
ADD COLUMN IF NOT EXISTS intro_text TEXT,
ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS validity_custom_date DATE,
ADD COLUMN IF NOT EXISTS earliest_start_date DATE,
ADD COLUMN IF NOT EXISTS pricing_model VARCHAR(50),
ADD COLUMN IF NOT EXISTS price_min DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS price_max DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS unit_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS estimated_units DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS vat_included BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS line_items JSONB,
ADD COLUMN IF NOT EXISTS transport_cost DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS labour_cost DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_charges DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_price_calculated DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS inclusions TEXT,
ADD COLUMN IF NOT EXISTS exclusions TEXT,
ADD COLUMN IF NOT EXISTS client_responsibilities TEXT,
ADD COLUMN IF NOT EXISTS quote_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS vendor_rating DECIMAL(3, 2) DEFAULT 0;

-- Verify
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'rfq_responses'
ORDER BY ordinal_position;
```

---

## Step 4: Check Row-Level Security (RLS)

**Run this SQL:**

```sql
-- Check RLS policies on rfq_responses
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'rfq_responses'
  AND schemaname = 'public';
```

**Issues to check:**
- ❌ Is there an INSERT policy that might block vendors?
- ❌ Is the policy checking `auth.uid()` correctly?
- ❌ Is the role correctly set?

**If RLS is blocking:** You might need to disable it temporarily or adjust the policy.

---

## Step 5: Simplify the Insert (Backup Plan)

If the above doesn't work, we can modify the API to insert only essential columns:

**Simplified version:**
```javascript
const { data: response, error: responseError } = await supabase
  .from('rfq_responses')
  .insert([
    {
      rfq_id: rfq_id,
      vendor_id: vendorId,
      quoted_price: quoted_price,
      currency: currency,
      delivery_timeline: delivery_timeline,
      description: description,
      status: 'submitted'
    }
  ])
  .select()
  .single();
```

This inserts only old fields that definitely exist, then you can update with new fields separately.

---

## Step 6: Check for Unique Constraint Issues

```sql
-- Check for unique constraints that might be violated
SELECT
  constraint_name,
  constraint_type,
  column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public'
  AND table_name = 'rfq_responses';
```

**Possible issue:** 
- Maybe there's a unique constraint on (rfq_id, vendor_id)
- Trying to submit second response might fail

---

## What to Do Now

### Option A (RECOMMENDED): Check Schema First
1. Run the first SQL query (columns check)
2. Share the output with me
3. I'll know exactly what's missing

### Option B: Add All Columns
1. Copy the migration SQL above
2. Run it in Supabase SQL Editor
3. Try vendor response again

### Option C: Test Minimal Insert
If columns are the issue:
1. I'll modify the API to insert just: rfq_id, vendor_id, quoted_price, status
2. This should work if database is the issue
3. Once working, we add the new fields gradually

---

## Expected Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "column does not exist" | Missing column in table | Add column with migration |
| "duplicate key value" | Unique constraint violated | Check (rfq_id, vendor_id) uniqueness |
| "new row violates RLS policy" | RLS blocking insert | Adjust RLS policy |
| "violates foreign key" | rfq_id or vendor_id invalid | Check if RFQ exists |

---

## Quick Diagnostic Commands

Run these one by one in Supabase SQL Editor:

```sql
-- 1. See all columns in rfq_responses
\d public.rfq_responses

-- 2. See all constraints
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'rfq_responses';

-- 3. See all RLS policies
SELECT * FROM pg_policies WHERE tablename = 'rfq_responses';

-- 4. Test a minimal insert (replace with real IDs)
INSERT INTO public.rfq_responses (rfq_id, vendor_id, quoted_price, status)
VALUES ('test-uuid', 'vendor-uuid', 50000, 'submitted');

-- 5. Check if previous inserts succeeded
SELECT id, rfq_id, vendor_id, status, created_at 
FROM public.rfq_responses 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## Next Steps

1. **URGENT:** Run the schema check SQL
2. Share the column list with me
3. I'll know exactly what to fix
4. We either add columns or simplify the insert

Let me know what you find!
