# RFQ Dashboard Enhancement - SQL Implementation Guide

## Summary

The enhanced RFQ Management dashboard requires SQL schema updates to support new metrics and analytics features. This document outlines everything you need to implement.

## What Needs to be Done

### ✅ Code Side (COMPLETE)
- Dashboard UI with type breakdown cards ✅
- Alert system for RFQ monitoring ✅
- Metrics calculations in JavaScript ✅

### 🗄️ Database Side (READY TO DEPLOY)
- Add 4 new columns to `rfqs` table
- Create `rfq_view_tracking` table
- Add 2 automatic triggers
- Create supporting indexes
- Backfill existing data

## Quick Implementation (5 Minutes)

### For Supabase Users:
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open file: `/supabase/sql/ADD_DASHBOARD_METRICS_COLUMNS.sql`
3. Copy all content
4. Paste into SQL Editor
5. Click **Run**
6. Done! ✅

### For PostgreSQL Users:
```bash
psql -U postgres -d your_db < supabase/sql/ADD_DASHBOARD_METRICS_COLUMNS.sql
```

## New Database Columns

| Column Name | Type | Default | Purpose |
|-------------|------|---------|---------|
| `match_quality_score` | NUMERIC(5,2) | 75 | Matched RFQ quality % - Alert if <60% |
| `view_count` | INTEGER | 0 | Public RFQ marketplace views |
| `quote_count` | INTEGER | 0 | Total quotes received (auto-synced) |
| `recipients_count` | INTEGER | 0 | Vendors sent to (for response rate) |

## Automatic Features

### Auto-Update Triggers
- **quote_count**: Automatically updated when `rfq_responses` are added/deleted
- **view_count**: Automatically updated when view events are tracked

### Example: Auto-Update in Action
```
Customer Posts RFQ
         ↓
     RFQ Created (quote_count = 0)
         ↓
  Vendor Submits Quote
         ↓
  Trigger Fires
         ↓
  quote_count Updated to 1
         ↓
Dashboard Shows 1 Quote Received ✅
```

## Data Backfill Included

The migration automatically:
1. Counts existing quotes and updates `quote_count`
2. Counts existing recipients and updates `recipients_count`
3. Estimates views for public RFQs (3x quote count)
4. Sets match quality to 75% (reasonable default)

## Dashboard Metrics Explained

### Direct RFQs
**What Admin Sees:**
- Count of RFQs sent to specific vendors
- Response rate = (quotes received) / (recipients_count) × 100%
- Alert if no quotes after 3 days or response rate < 30%

**SQL Used:**
```sql
SELECT 
  COUNT(*) as direct_count,
  AVG(CASE WHEN recipients_count > 0 
    THEN (quote_count / recipients_count * 100) 
    ELSE 0 END) as avg_response_rate
FROM rfqs 
WHERE rfq_type = 'direct' AND status = 'active';
```

### Matched RFQs
**What Admin Sees:**
- Count of system auto-matched RFQs
- Average match quality %
- Alert if quality < 60%

**SQL Used:**
```sql
SELECT 
  COUNT(*) as matched_count,
  AVG(match_quality_score) as avg_quality
FROM rfqs 
WHERE rfq_type = 'matched' AND status = 'active';
```

### Public RFQs
**What Admin Sees:**
- Count of marketplace RFQs
- Engagement score = (total quotes / total views) × 100%
- Alert if no quotes after 5 days

**SQL Used:**
```sql
SELECT 
  COUNT(*) as public_count,
  SUM(view_count) as total_views,
  SUM(quote_count) as total_quotes,
  CASE WHEN SUM(view_count) > 0 
    THEN (SUM(quote_count) / SUM(view_count) * 100)
    ELSE 0 
  END as engagement_pct
FROM rfqs 
WHERE rfq_type = 'public' AND status = 'active';
```

## Integration Points

### Where Dashboard Reads These Fields

**File:** `/app/admin/dashboard/rfqs/page.js`

**Code Example:**
```javascript
// Calculate stats from new columns
const directCount = rfqs.filter(r => r.rfq_type === 'direct').length;
const matchedCount = rfqs.filter(r => r.rfq_type === 'matched').length;
const publicCount = rfqs.filter(r => r.rfq_type === 'public').length;

// Average match quality
const averageMatchQuality = 
  (matchedRFQs.reduce((sum, r) => 
    sum + (parseInt(r.match_quality_score || '75') || 75), 0
  ) / matchedRFQs.length).toFixed(0);

// Engagement score
const publicEngagementScore = 
  publicRFQs.length > 0
    ? ((totalQuotes / totalViews * 100)).toFixed(1)
    : 0;

// Alert checks
if (rfq.recipients_count > 0) {
  const responseRate = (responseCount / rfq.recipients_count * 100);
  if (responseRate < 30) {
    // Show low response rate alert
  }
}

if (parseFloat(rfq.match_quality_score || '75') < 60) {
  // Show poor quality alert
}
```

## Indexes for Performance

The migration creates 4 indexes:
```sql
-- For Matched RFQ filtering
CREATE INDEX idx_rfqs_match_quality_score 
  ON public.rfqs(match_quality_score) 
  WHERE rfq_type = 'matched';

-- For trending RFQ queries
CREATE INDEX idx_rfqs_view_count 
  ON public.rfqs(view_count DESC) 
  WHERE rfq_type = 'public';

-- For quote count sorting
CREATE INDEX idx_rfqs_quote_count 
  ON public.rfqs(quote_count DESC);

-- For response rate calculations
CREATE INDEX idx_rfqs_recipients_count 
  ON public.rfqs(recipients_count);
```

## Future Enhancement: View Tracking API

To properly track Public RFQ views, integrate this API endpoint:

```javascript
// app/api/track-rfq-view/route.js
export async function POST(request) {
  const { rfqId } = await request.json();
  
  // Insert view event
  await supabase
    .from('rfq_view_tracking')
    .insert({
      rfq_id: rfqId,
      viewer_ip: request.headers.get('x-forwarded-for'),
      viewer_user_id: userId, // if authenticated
    });
  
  // Trigger automatically updates rfqs.view_count
  return { success: true };
}
```

Call this when RFQ detail page loads:
```javascript
// When viewing an RFQ
useEffect(() => {
  fetch('/api/track-rfq-view', {
    method: 'POST',
    body: JSON.stringify({ rfqId })
  });
}, [rfqId]);
```

## Verification Checklist

After running the migration, verify:

```sql
-- ✅ Check columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'rfqs'
AND column_name IN ('match_quality_score', 'view_count', 'quote_count', 'recipients_count');
-- Should return 4 rows

-- ✅ Check triggers created
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name LIKE 'trg_update_rfq%';
-- Should return 2 rows

-- ✅ Check data was backfilled
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN quote_count > 0 THEN 1 END) as with_quotes,
  COUNT(CASE WHEN view_count > 0 THEN 1 END) as with_views
FROM rfqs;
-- Should show data distribution

-- ✅ Check view tracking table
SELECT COUNT(*) FROM rfq_view_tracking;
-- May be 0 (tracking starts after migration)
```

## Troubleshooting

### Issue: "Column already exists" error
**Solution**: This is normal if run twice. Columns already exist, no harm done.

### Issue: "Function already exists" error
**Solution**: Migration includes `OR REPLACE` to update functions. No action needed.

### Issue: Triggers not firing
**Solution**: 
1. Check Supabase logs for trigger errors
2. Verify `rfq_responses` table exists
3. Check RLS policies aren't blocking updates

### Issue: quote_count not updating
**Solution**:
1. Verify trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'trg_update_rfq_quote_count';`
2. Test trigger manually: Insert test response and check rfq.quote_count

### Issue: Performance slow
**Solution**:
1. Check indexes were created
2. Run `ANALYZE public.rfqs;` to update statistics
3. Monitor trigger execution time in logs

## Related Files

### Migration Files
- `/supabase/sql/ADD_DASHBOARD_METRICS_COLUMNS.sql` - Main migration

### Documentation
- `/SQL_DASHBOARD_SCHEMA_UPDATES.md` - Detailed technical guide
- `/RFQ_DASHBOARD_ENHANCEMENT_COMPLETE.md` - Feature documentation

### Code Files
- `/app/admin/dashboard/rfqs/page.js` - Uses new metrics (1037 lines)
- `/app/admin/dashboard/layout.js` - Sidebar navigation

## Timeline

**Phase 1: Completed (Dec 17, 2025)**
- ✅ Dashboard UI implementation
- ✅ Alert system
- ✅ JavaScript metrics calculations
- ✅ Git commits and deployment

**Phase 2: Ready to Deploy (Right Now)**
- 🗄️ SQL migration (5 minutes)
- 🗄️ Backfill existing data (automatic)
- 🗄️ Create triggers (automatic)

**Phase 3: Optional (Future)**
- 📊 View tracking API integration
- 📈 Historical analytics
- 🎯 Custom alert thresholds

## Success Criteria

After implementing:
- ✅ Dashboard loads without errors
- ✅ Stats cards show correct counts
- ✅ Type breakdown cards display metrics
- ✅ Alert system identifies problem RFQs
- ✅ All 4 metrics visible in admin panel
- ✅ Quote count updates when new quotes arrive
- ✅ No slow queries (sub-100ms)

## Support Resources

**Supabase Documentation:**
- https://supabase.com/docs/guides/database/functions

**PostgreSQL Triggers:**
- https://www.postgresql.org/docs/current/sql-createtrigger.html

**Row Level Security (RLS):**
- https://supabase.com/docs/guides/auth/row-level-security

---

**Status**: Ready for Production  
**Database**: Supabase PostgreSQL  
**Deployment Date**: December 17, 2025  
**Estimated Implementation Time**: 5 minutes
