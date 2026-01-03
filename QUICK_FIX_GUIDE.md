# 🎯 Quick Start: Direct Quote Request Fix

## 💥 The Problem You're Having
When you click "Request Quote" on a vendor profile and submit, you get:
```
⚠️ Failed to send request: null value in column "project_description" 
violates not-null constraint
```

## ✅ The Fix (30 seconds)

### Step 1: Copy This SQL
```sql
ALTER TABLE IF EXISTS public.rfq_requests
ADD COLUMN IF NOT EXISTS project_title text;

ALTER TABLE IF EXISTS public.rfq_requests
ADD COLUMN IF NOT EXISTS project_description text;
```

### Step 2: Run It
1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Paste the SQL above
4. Click **Run**

### Step 3: Verify
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'rfq_requests'
ORDER BY ordinal_position;
```

Should show: `project_title` and `project_description` in the list ✅

---

## 🧪 Then Test It

1. Go to any vendor profile page
2. Click **"Request Quote"**
3. Fill in the form:
   - Title: "Roof Repair"
   - Description: "Need to repair kitchen roof"
   - Category: Pick one
   - Budget: Enter amount
   - Location: Select county
4. Click **Submit**
5. Should see: ✅ **Request sent successfully!**

---

## 📚 Full Documentation

For detailed steps, troubleshooting, and more info:
→ See `DIRECT_QUOTE_FIX_MIGRATION_GUIDE.md`

---

## 🔧 What Was Changed in Code

**File:** `components/DirectRFQPopup.js` (line 206)
```javascript
// NOW INCLUDES:
project_description: form.description || '',
```

**Files:** All SQL schema files updated to include the new columns
