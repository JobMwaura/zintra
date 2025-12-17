# 🔍 Metrics System - Complete Troubleshooting Guide

## Quick Checklist

Did you run BOTH SQL files?
- [ ] `supabase/sql/METRICS_TABLES_AND_TRIGGERS.sql` (initial setup)
- [ ] `supabase/sql/FIX_RFQ_STATS_RLS.sql` (RLS fix for triggers)

If you only ran the first one, that's why quotes won't submit! Run the second one now.

---

## Error 1: "RLS policy violation for rfq_quote_stats"

### Symptoms
```
❌ Error submitting quote: new row violates row-level security policy for table "rfq_quote_stats"
```

### Root Cause
Triggers blocked by RLS because they don't have elevated privileges

### Solution
Run: `supabase/sql/FIX_RFQ_STATS_RLS.sql`

This adds `SECURITY DEFINER` to trigger functions so they can bypass RLS.

### Verification
```sql
-- Check if fix was applied
SELECT proname, prosecdef FROM pg_proc 
WHERE proname = 'increment_rfq_quote_count';

-- Should show: prosecdef = true
```

---

## Error 2: "Quote count shows 0 for all RFQs"

### Symptoms
- Marketplace displays "0 quotes" on all RFQs
- Users submit quotes but count doesn't increase
- No errors in console

### Root Cause
Either:
1. Initial SQL not executed
2. Triggers not created
3. Statistics not populated

### Solution

**Option A: Check if tables exist**
```sql
SELECT tablename FROM pg_tables 
WHERE tablename IN ('rfq_quote_stats', 'rfq_views', 'vendor_profile_views', 'vendor_profile_stats');

-- Should return all 4 tables
```

If missing, run: `supabase/sql/METRICS_TABLES_AND_TRIGGERS.sql`

**Option B: Check if triggers exist**
```sql
SELECT trigger_name, trigger_function 
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trg_increment%';

-- Should return 2 triggers:
-- trg_increment_rfq_quote_count
-- trg_increment_vendor_profile_views
```

If missing, re-run the initial SQL setup.

**Option C: Manually test the trigger**
```sql
-- Get a real RFQ ID
SELECT id FROM public.rfqs LIMIT 1;  -- Copy this ID

-- Get a real vendor ID  
SELECT id FROM public.vendors LIMIT 1;  -- Copy this ID

-- Insert a test quote (replace IDs)
INSERT INTO public.rfq_responses 
(rfq_id, vendor_id, amount, message, timeline, terms, status)
VALUES 
('RFQ_ID_HERE', 'VENDOR_ID_HERE', 500000, 'Test quote', '2 weeks', 'Standard', 'submitted');

-- Check if quote_stats was updated
SELECT rfq_id, total_quotes FROM public.rfq_quote_stats 
WHERE rfq_id = 'RFQ_ID_HERE';

-- Should show total_quotes = 1
```

---

## Error 3: "Marketplace shows 'Loading marketplace...' forever"

### Symptoms
- Marketplace page stuck on loading spinner
- Never loads RFQ list
- No error messages

### Root Cause
Likely a fetch error getting `rfq_quote_stats`

### Solution

**Check browser console:**
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Common errors:
   - "Table rfq_quote_stats not found" → Run initial SQL
   - "RLS policy violation" → Run the RLS fix SQL
   - "Supabase connection failed" → Check API keys

**Check Supabase query directly:**
```sql
SELECT rfq_id, total_quotes FROM public.rfq_quote_stats LIMIT 5;
```

If this errors, the tables might not exist.

---

## Error 4: "View tracking not working"

### Symptoms
- Clicking "View & Quote" doesn't seem to log views
- `/api/track-rfq-view` endpoint returns error
- Quote counts not updating even when submitting

### Root Cause
RLS on `rfq_views` table blocking inserts, or API endpoint issue

### Solution

**Check if rfq_views table has proper policies:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'rfq_views';
-- Should return: rowsecurity = true

-- Check INSERT policy exists
SELECT policyname FROM pg_policies 
WHERE tablename = 'rfq_views' AND cmd = 'INSERT';
-- Should return: "Anyone can track RFQ views"
```

**Test the API directly:**
```bash
# Open terminal and run:
curl -X POST http://localhost:3000/api/track-rfq-view \
  -H "Content-Type: application/json" \
  -d '{"rfqId":"YOUR_RFQ_ID"}'

# Should return: { "success": true }
```

If error, check:
1. Environment variables set in `.env.local`
2. Supabase URL and key are correct
3. Check browser console in marketplace page

---

## Error 5: "Profile view tracking returns error"

### Symptoms
```
❌ Error tracking vendor profile view
```

### Root Cause
Similar to view tracking - RLS or API issue

### Solution

**Check vendor_profile_views table:**
```sql
-- Verify table exists
SELECT tablename FROM pg_tables 
WHERE tablename = 'vendor_profile_views';

-- Check policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'vendor_profile_views';

-- Should show: "Anyone can track vendor profile views"
```

**Test profile view tracking:**
```bash
curl -X POST http://localhost:3000/api/track-vendor-profile-view \
  -H "Content-Type: application/json" \
  -d '{"vendorId":"YOUR_VENDOR_ID"}'

# Should return: { "success": true }
```

---

## Error 6: "rfq_quote_stats has orphaned records"

### Symptoms
- Quote counts exist for RFQs that don't exist
- Database integrity warnings

### Solution
```sql
-- Find orphaned records
SELECT rs.rfq_id FROM public.rfq_quote_stats rs
LEFT JOIN public.rfqs r ON r.id = rs.rfq_id
WHERE r.id IS NULL;

-- Delete them
DELETE FROM public.rfq_quote_stats 
WHERE rfq_id NOT IN (SELECT id FROM public.rfqs);
```

This shouldn't happen if foreign key constraints are working, but good to check.

---

## Performance Issues: Marketplace Loads Slowly

### Symptoms
- Marketplace takes 5+ seconds to load
- Loading spinner visible for long time
- Eventually loads correctly

### Root Cause
Missing indexes or N+1 query problem

### Solution

**Check indexes:**
```sql
-- Verify indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('rfq_quote_stats', 'rfq_views');

-- Should show multiple indexes for efficient queries
```

If missing, add them:
```sql
CREATE INDEX IF NOT EXISTS idx_rfq_quote_stats_rfq_id ON public.rfq_quote_stats(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_views_rfq_id ON public.rfq_views(rfq_id);
```

**Verify no N+1 queries in browser:**
1. Open DevTools → Network tab
2. Load marketplace
3. Should see 1-2 requests, not 50+ requests
4. If many requests, check that marketplace isn't calling track API multiple times

---

## Data Consistency Issues

### Problem: Quote count = 5, but only 3 quotes submitted

### Solution: Resync counts

```sql
-- Rebuild quote stats from scratch
DELETE FROM public.rfq_quote_stats;

-- Rebuild from actual responses
INSERT INTO public.rfq_quote_stats (rfq_id, total_quotes, last_quote_at, created_at, updated_at)
SELECT 
  rfq_id, 
  COUNT(*) as total_quotes,
  MAX(created_at) as last_quote_at,
  NOW(),
  NOW()
FROM public.rfq_responses
GROUP BY rfq_id
ON CONFLICT (rfq_id)
DO UPDATE SET
  total_quotes = EXCLUDED.total_quotes,
  last_quote_at = EXCLUDED.last_quote_at,
  updated_at = NOW();
```

Then refresh marketplace - counts should be correct now.

---

## Database Verification Checklist

Run these queries to verify everything is set up correctly:

```sql
-- 1. Check all tables exist
SELECT tablename FROM pg_tables 
WHERE tablename IN ('rfq_quote_stats', 'rfq_views', 'vendor_profile_views', 'vendor_profile_stats');

-- 2. Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('rfq_quote_stats', 'rfq_views', 'vendor_profile_views', 'vendor_profile_stats');

-- 3. Check policies exist
SELECT policyname, tablename FROM pg_policies 
WHERE tablename IN ('rfq_quote_stats', 'rfq_views', 'vendor_profile_views', 'vendor_profile_stats')
ORDER BY tablename, policyname;

-- 4. Check triggers exist
SELECT trigger_name, trigger_function FROM information_schema.triggers 
WHERE trigger_name LIKE 'trg_increment%';

-- 5. Check functions have SECURITY DEFINER
SELECT proname, prosecdef FROM pg_proc 
WHERE proname IN ('increment_rfq_quote_count', 'increment_vendor_profile_views');
-- Both should show prosecdef = true

-- 6. Check indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('rfq_quote_stats', 'rfq_views', 'vendor_profile_views', 'vendor_profile_stats');

-- 7. Check data exists
SELECT COUNT(*) as rfq_quote_stats_count FROM public.rfq_quote_stats;
SELECT COUNT(*) as rfq_views_count FROM public.rfq_views;
SELECT COUNT(*) as vendor_profile_stats_count FROM public.vendor_profile_stats;
SELECT COUNT(*) as vendor_profile_views_count FROM public.vendor_profile_views;
```

If any check fails, follow the relevant section above.

---

## Still Having Issues?

### Debug Flow

1. **Check SQL ran successfully**
   ```
   Did you see ✅ success in Supabase?
   → If no, re-run and wait for completion
   ```

2. **Verify database state**
   ```sql
   -- Get a summary
   SELECT 
     (SELECT COUNT(*) FROM pg_tables 
      WHERE tablename IN ('rfq_quote_stats', 'rfq_views')) as tables_created,
     (SELECT COUNT(*) FROM information_schema.triggers 
      WHERE trigger_name LIKE 'trg_increment%') as triggers_created,
     (SELECT COUNT(*) FROM pg_proc 
      WHERE proname IN ('increment_rfq_quote_count', 'increment_vendor_profile_views')
      AND prosecdef = true) as security_definer_functions;
   ```

3. **Check application logs**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for red errors
   - Share error message

4. **Clear cache and try again**
   - Close browser completely
   - Clear cache/cookies
   - Open app in incognito mode
   - Try submitting quote

5. **Test manually in Supabase**
   ```sql
   -- Create test quote
   INSERT INTO rfq_responses...
   -- Check if stats updated
   SELECT * FROM rfq_quote_stats
   ```

---

## Contact Support

If still stuck after checking above:
- Share the exact error message
- Share the SQL query that failed (if any)
- Share screenshot of browser console
- Share Supabase SQL verification results

We can then diagnose quickly!

---

**Most issues are resolved by:** Running `FIX_RFQ_STATS_RLS.sql` if you haven't already
