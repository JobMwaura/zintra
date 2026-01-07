# Setup: Running the "Other" Category Feature Migration

## Quick Start

### Step 1: Run Database Migration

1. Open your Supabase dashboard: https://app.supabase.com
2. Go to **SQL Editor**
3. Click **+ New Query**
4. Copy the entire contents of `supabase/sql/ADD_CUSTOM_RFQ_FIELDS.sql`
5. Paste into the query editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see: `"Success. No rows returned"`

### Step 2: Verify Migration

Run this verification query in the SQL Editor:

```sql
-- Check that columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rfqs'
AND column_name IN ('custom_details', 'is_custom_category')
ORDER BY column_name;
```

You should see two rows:
- `custom_details | text | YES`
- `is_custom_category | boolean | YES`

### Step 3: Code Deployment

The code changes are already deployed via Git commit `cd5b014`. Vercel will auto-deploy.

Changes made:
- ✅ `components/DirectRFQPopup.js` - Added "Other" category UI
- ✅ `app/vendor/rfq/[rfq_id]/respond/page.js` - Display custom details to vendors
- ✅ `supabase/sql/ADD_CUSTOM_RFQ_FIELDS.sql` - Database migration

### Step 4: Test the Feature

1. **Create an RFQ with "Other" category:**
   - Go to Browse → Click "Send Direct RFQ" on a vendor
   - Select category dropdown
   - Choose "Other (Please specify)"
   - Enter custom category: e.g., "Plumbing"
   - Enter custom details: e.g., "Need copper pipes, 1-inch diameter, galvanized finish"
   - Submit

2. **Verify as Vendor:**
   - Go to vendor dashboard
   - Find the RFQ you just created
   - Check that:
     - Category shows "Plumbing"
     - "Custom" badge appears next to category
     - "ADDITIONAL SPECIFICATIONS" section shows your custom details

3. **Respond to RFQ:**
   - Click "Respond with Quote"
   - Fill in quote form normally
   - Submit response
   - Verify response saves correctly

## Data Schema

### rfqs table changes:

| Column | Type | Nullable | Default | Example |
|--------|------|----------|---------|---------|
| custom_details | text | YES | NULL | "Terracotta tiles, original 1950s patterns" |
| is_custom_category | boolean | YES | false | true |

### Existing columns still work:

| Column | Notes |
|--------|-------|
| category | Now stores custom category name when is_custom_category=true |
| budget_range | Unchanged |
| location | Unchanged |
| All other RFQ fields | Unchanged |

## Backward Compatibility

✅ All existing RFQs continue to work:
- Existing `category` values unchanged
- `custom_details` = NULL for old RFQs
- `is_custom_category` = false for old RFQs

No data migration needed. No existing RFQs are modified.

## Troubleshooting

### Issue: "Column already exists" error

**Solution:** The column was already added in a previous migration. Run the verification query above. If columns exist, no action needed.

### Issue: "Permission denied" error

**Solution:** Make sure you're using a Supabase service role key, not an anon key. Use the SQL Editor in the dashboard (it handles auth automatically).

### Issue: UI doesn't show "Other" option

**Solution:** 
1. Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Check browser console for JavaScript errors
3. Verify Vercel deployment completed
4. Check commit `cd5b014` is in your main branch

### Issue: Custom details don't save

**Solution:**
1. Check browser console for form validation errors
2. Verify database columns exist (run verification query)
3. Check RLS policies allow INSERT on custom_details column
4. Try creating RFQ with only required fields first

## Testing Scenarios

### Scenario 1: Direct RFQ with Custom Category
```
User: Creates Direct RFQ
Category: "Other"
Custom Category: "Flooring Restoration"
Custom Details: "1950s terracotta tiles, must preserve original patterns"
Expected: RFQ created, is_custom_category=true, vendor sees custom badge
```

### Scenario 2: Vendor Viewing Custom RFQ
```
Vendor: Opens RFQ to respond
Expected: Sees custom category badge
Expected: Sees "ADDITIONAL SPECIFICATIONS" section
Expected: Can submit quote normally
```

### Scenario 3: Regular Predefined Category
```
User: Creates RFQ with predefined category (e.g., "Carpentry")
Custom Category: (empty)
Expected: RFQ created, is_custom_category=false, no custom badge
```

## Next Steps

After successful deployment:

1. **Update user documentation** with "Other" category feature
2. **Monitor usage** - Track how many RFQs use custom categories
3. **Gather feedback** - Ask vendors about custom category RFQs
4. **Plan Phase 2:**
   - Aggregate custom categories to find candidates for predefined list
   - Consider ML-based category suggestions
   - Track vendor performance by custom category

## Rollback

If you need to rollback:

```sql
-- Remove the new columns
ALTER TABLE public.rfqs
DROP COLUMN IF EXISTS custom_details,
DROP COLUMN IF EXISTS is_custom_category;

-- Drop indexes
DROP INDEX IF EXISTS idx_rfqs_is_custom_category;
DROP INDEX IF EXISTS idx_rfqs_category_custom;
```

Then redeploy old code version.

## Support

For issues or questions:
1. Check `OTHER_CATEGORY_FEATURE.md` for detailed documentation
2. Review code changes in commit `cd5b014`
3. Check Vercel deployment logs
4. Review Supabase activity logs in dashboard
