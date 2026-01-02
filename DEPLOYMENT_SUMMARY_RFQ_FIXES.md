# Deployment Summary - RFQ Deadline & Expiration Fixes

**Date**: 2 January 2026  
**Commit**: `8f0edc7`  
**Status**: ✅ Ready for Deployment

---

## What's Fixed

### 1. RFQ Deadline Display Bug
**Problem**: RFQ cards showed "1 Jan 1970" (Unix epoch) with "20455 days overdue"
**Root Cause**: Component used non-existent `rfq.deadline` field instead of `rfq.expires_at`
**Fix**: Updated `components/RFQCard.js` to use correct `expires_at` column

### 2. 21-Day Expiration Logic
**Problem**: RFQs had no automatic expiration time
**Solution**: Added database trigger that sets `expires_at = NOW() + 21 days` on RFQ creation

---

## Files Changed

### Frontend
- **`components/RFQCard.js`** (line 143)
  - Changed: `{formatDate(rfq.deadline)}` → `{formatDate(rfq.expires_at)}`
  - Now displays correct deadline date

### Database Migration
- **`supabase/sql/MIGRATION_ADD_RFQ_COLUMNS.sql`**
  - Added: `set_rfq_expiration_21_days()` function
  - Added: `trg_set_rfq_expiration_21_days` trigger
  - Automatically sets `expires_at` to 21 days from creation

---

## Deployment Steps

### Step 1: Deploy Frontend Code ✅ (Already Done)
- Commit `8f0edc7` pushed to GitHub
- Code is built and ready to deploy to Vercel
- Next deployment will include the RFQCard fix

### Step 2: Run Database Migration (Required)
**You must run this migration in Supabase for the 21-day expiration to work**

Copy and run in Supabase Dashboard:
```sql
-- From: supabase/sql/MIGRATION_ADD_RFQ_COLUMNS.sql

-- RFQ EXPIRATION TRIGGER (21 days)
-- Automatically sets expires_at to NOW + 21 days when a new RFQ is created

CREATE OR REPLACE FUNCTION public.set_rfq_expiration_21_days()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set expires_at if it's not already set
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '21 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_rfq_expiration_21_days ON public.rfqs;
CREATE TRIGGER trg_set_rfq_expiration_21_days
  BEFORE INSERT ON public.rfqs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_rfq_expiration_21_days();
```

Or run the full migration:
```bash
cd /Users/macbookpro2/Desktop/zintra-platform
supabase db push
```

---

## Expected Behavior After Deployment

### New RFQs (Created After Migration)
- ✅ Automatically assigned `expires_at = NOW() + 21 days`
- ✅ Countdown displays correctly (e.g., "18 days left")
- ✅ After 21 days, marked as "Overdue"
- ✅ Users warned when ≤3 days left

### Existing RFQs (Created Before Migration)
- ℹ️ Still have `expires_at = NULL`
- ℹ️ Display "1 Jan 1970" until you manually set dates
- ✅ Can be updated via SQL: `UPDATE rfqs SET expires_at = created_at + INTERVAL '21 days' WHERE expires_at IS NULL`

### User Notifications
- Users see "Days Left" countdown (green: ≥4 days, orange: 3 days, red: overdue)
- Summary stats show "Closing Soon (≤3 days)" count
- Overdue badge appears when expiration passes

---

## Verification Steps

### 1. Check Database Trigger Created
In Supabase SQL Editor:
```sql
SELECT proname FROM pg_proc 
WHERE proname = 'set_rfq_expiration_21_days';
```
Should return 1 row.

### 2. Test on New RFQ
1. Create a new RFQ via the modal
2. Check My RFQs page
3. Deadline should show correct date (21 days from today)
4. Days countdown should display correctly

### 3. Check Frontend Display
Visit: https://zintra-sandy.vercel.app/my-rfqs
- RFQ cards should show correct "Deadline" dates
- Should NOT show "1 Jan 1970"
- Days left should be reasonable numbers

---

## Rollback Plan (If Needed)

If something goes wrong:

```sql
-- Drop the trigger and function
DROP TRIGGER IF EXISTS trg_set_rfq_expiration_21_days ON public.rfqs;
DROP FUNCTION IF EXISTS public.set_rfq_expiration_21_days();

-- Revert frontend by deploying previous commit (48bb4e5)
git revert 8f0edc7
```

---

## Timeline

| Task | Status | Notes |
|------|--------|-------|
| Code changes | ✅ Complete | Commit 8f0edc7 |
| Code review | ✅ Complete | Ready for production |
| Frontend push | ⏳ On next deploy | Will be included |
| Database migration | 🔴 **REQUIRED** | Must be run manually in Supabase |
| Testing | 📋 Next step | Test on staging/production |
| Launch | ⏳ After migration | RFQs will have proper expiration |

---

## Important Notes

⚠️ **The database migration MUST be run** for 21-day expiration to work. Without it:
- New RFQs won't have automatic `expires_at` values
- The trigger won't execute
- Frontend fix alone won't solve the problem

✅ **The frontend fix is backward compatible**:
- Works with existing `expires_at` values
- Won't break anything if migration isn't run yet
- Users will see NULL dates if migration is skipped

📌 **For existing RFQs**, run this optional update:
```sql
UPDATE public.rfqs 
SET expires_at = created_at + INTERVAL '21 days' 
WHERE expires_at IS NULL 
AND status = 'active';
```

---

## Commit Info

```
commit 8f0edc7
Author: Job LMU <job@example.com>
Date:   2 Jan 2026

    Fix RFQ deadline display and add 21-day expiration logic
    
    - Fix RFQCard to use expires_at instead of non-existent deadline field
    - Add 21-day expiration trigger: expires_at = NOW + 21 days on RFQ creation
    - Update migration with set_rfq_expiration_21_days() trigger function
    - Add expiration logic documentation to migration
    - RFQs now properly show countdown from 21 days
    - Users notified of RFQs closing in 3 days or expiring with 0 responses
```

---

## Questions?

Refer to `DATABASE_MIGRATION_INSTRUCTIONS.md` for detailed migration steps.

Contact: job@example.com
