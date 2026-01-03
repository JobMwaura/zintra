# 🎯 COMPLETE GUIDE: Direct Quote Request Fix

## Current Status

You're getting this error:
```
⚠️ Failed to send request: insert or update on table "rfq_requests" 
violates foreign key constraint "rfq_requests_vendor_id_fkey"
```

## What Needs to Happen

You need to run **2 things** in Supabase SQL Editor (in order):

---

## ✅ STEP 1: Check the Foreign Key Constraint

**Copy and RUN this SQL** in your Supabase SQL Editor:

```sql
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'rfq_requests'
  AND tc.constraint_type = 'FOREIGN KEY';
```

### What You'll See:

**Option A: CORRECT (No fix needed)**
```
rfq_requests_vendor_id_fkey | vendor_id | vendors | id
```
→ Skip Step 2, just add columns with Step 3

**Option B: WRONG (Needs fixing)**
```
rfq_requests_vendor_id_fkey | vendor_id | auth.users | id
```
→ Go to Step 2

**Option C: WRONG (Needs fixing)**
```
(no results)
```
→ Go to Step 2

---

## ✅ STEP 2: Fix the Foreign Key Constraint

**If Option B or C above**, run this SQL:

```sql
-- Drop the wrong/missing constraint
ALTER TABLE public.rfq_requests
DROP CONSTRAINT IF EXISTS rfq_requests_vendor_id_fkey;

-- Add the correct constraint
ALTER TABLE public.rfq_requests
ADD CONSTRAINT rfq_requests_vendor_id_fkey
FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;
```

Then re-run the SQL from Step 1 to verify it now shows:
```
rfq_requests_vendor_id_fkey | vendor_id | vendors | id
```

---

## ✅ STEP 3: Add Missing Columns

**Now add the project_title and project_description columns:**

```sql
ALTER TABLE IF EXISTS public.rfq_requests
ADD COLUMN IF NOT EXISTS project_title text;

ALTER TABLE IF EXISTS public.rfq_requests
ADD COLUMN IF NOT EXISTS project_description text;

-- Verify they exist:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'rfq_requests'
ORDER BY ordinal_position;
```

Should show all these columns:
- id
- rfq_id
- vendor_id ← references vendors(id)
- user_id
- status
- created_at
- **project_title** ← NEW
- **project_description** ← NEW

---

## 🧪 STEP 4: Test It Works

1. Go to any vendor profile page
2. Click **"Request Quote"** button
3. Fill in:
   - Project Title: "Test Project"
   - Description: "Test description"
   - Category: Any
   - Budget: Any amount
   - Location: Any county
4. Click **Submit**
5. Should see: ✅ **"Request sent successfully!"**

---

## 📋 What Was Changed in Code

**File: `components/DirectRFQPopup.js` (line 206)**

```javascript
// NOW INCLUDES project_description:
const { error: requestError } = await supabase.from('rfq_requests').insert([{
  rfq_id: rfqData.id,
  vendor_id: vendorRecipientId,
  user_id: user?.id || null,
  project_title: form.title || 'Untitled Project',
  project_description: form.description || '',  // ✨ NEW
  status: 'pending',
  created_at: new Date().toISOString(),
}]);
```

---

## 📚 Reference Files

If you need more detailed help:

- **`VENDOR_FK_ERROR_DIAGNOSIS.md`** - Detailed diagnosis guide
- **`FIX_VENDOR_FK_SIMPLE.sql`** - Simple constraint fix SQL
- **`MIGRATION_COPY_PASTE.sql`** - Column addition SQL
- **`QUICK_FIX_GUIDE.md`** - Quick overview

---

## 🆘 Troubleshooting

**If still getting FK error after Step 2:**
1. Make sure Step 1 verification shows `vendors | id`
2. Check vendors table has data: `SELECT COUNT(*) FROM public.vendors;`
3. Hard refresh your browser (Cmd+Shift+R)

**If still getting NOT NULL error after Step 3:**
1. Verify columns exist: Check Step 3 SELECT query
2. Hard refresh browser
3. Check Vercel deployed the code

**Columns still not showing:**
1. Run Step 3 SQL again
2. Copy the exact output from the SELECT query
3. Check `information_schema.columns`

---

## ✨ Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Check FK constraint | Run SQL |
| 2 | Fix FK if wrong | Run SQL (if needed) |
| 3 | Add columns | Run SQL |
| 4 | Test feature | Try "Request Quote" |

All SQL is ready to copy-paste. Good luck! 🚀
