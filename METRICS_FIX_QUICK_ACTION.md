# ⚡ Quick Fix: Run This SQL Now

## The Error
```
❌ Error submitting quote: new row violates row-level security policy for table "rfq_quote_stats"
```

## The Fix (2 Steps)

### Step 1: Go to Supabase SQL Editor
```
https://app.supabase.com 
→ Your Project
→ SQL Editor
→ New Query
```

### Step 2: Copy & Run This SQL

**File to copy:** `supabase/sql/FIX_RFQ_STATS_RLS.sql`

Copy entire contents, paste into SQL Editor, click **Run**

---

## That's It! ✅

Quote submission will now work. The system will:
- ✅ Accept quote submissions
- ✅ Automatically increment quote counts
- ✅ Display counts on marketplace cards

## Test It

1. Go to `/post-rfq` marketplace
2. Click "View & Quote" on any RFQ
3. Submit quote form
4. Refresh page
5. Quote count should increase by 1 ✅

---

## What Was Fixed

Old approach (blocked by RLS):
```
User submits quote
→ Trigger tries to update quote_stats
→ RLS blocks it ❌
→ Error!
```

New approach (SECURITY DEFINER):
```
User submits quote
→ Trigger runs with elevated privileges
→ RLS allows it ✅
→ Quote count increments!
```

---

**Estimated time: 2 minutes**

Full explanation in: `RLS_SECURITY_DEFINER_FIX.md`
