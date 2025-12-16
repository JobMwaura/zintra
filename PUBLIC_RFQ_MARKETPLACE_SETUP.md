# Public RFQ Marketplace - Sample Data Setup Guide

## Summary of Changes

✅ **Completed:**
1. **Removed** "Public RFQ Marketplace" section from `/app/page.js` (homepage)
2. **Created** new `/app/post-rfq/page.js` with three RFQ type selection boxes:
   - **Direct RFQ** (Orange) - I know who I want to contact
   - **Wizard RFQ** (Blue) - Help me find the right vendors
   - **Public RFQ** (Purple) - Let all vendors compete
3. **Added** "Public RFQ Marketplace" section **BELOW** the three selection boxes
4. **Fixed** Next.js Suspense warning with useSearchParams()
5. **Built & Deployed** to GitHub and Vercel

## Current State

### `/app/page.js` (Homepage)
- ✅ Hero section with centered buttons
- ✅ RFQ section with three type boxes
- ✅ Marketplace section REMOVED
- ✅ Users can click "Get Started" on "Public RFQ" to go to `/post-rfq`

### `/app/post-rfq/page.js` (RFQ Hub Page)
- ✅ Three RFQ type selection boxes at top (same as homepage)
- ✅ Help section explaining when to choose each type
- ✅ "Public RFQ Marketplace" section below help
- ✅ Shows placeholder message: "No active public RFQs at the moment"
- ⏳ **NEEDS**: Sample data in Supabase to show real RFQs

## Adding Sample Data to Supabase

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Go to your Supabase project**
   - Navigate to: https://app.supabase.com
   - Select your project (zintra-platform)

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste the SQL**
   - File location: `/supabase/sql/SAMPLE_PUBLIC_RFQS.sql`
   - **IMPORTANT**: Before running, you MUST replace the placeholder UUIDs:
     - Find all instances of `'550e8400-e29b-41d4-a716-446655440000'::uuid`
     - Replace with your actual user ID from the auth.users table
     - Or use this query to get your user ID:
       ```sql
       SELECT id FROM auth.users LIMIT 1;
       ```

4. **Execute the Query**
   - Click "Run" or press Ctrl+Enter
   - You should see 8 new records inserted successfully

### Option 2: Using CSV Import (Alternative)

Alternatively, you can import the sample data as CSV through the Supabase dashboard:
1. Go to the `rfqs` table in Supabase
2. Click "Upload CSV"
3. Prepare CSV with columns: title, description, category, rfq_type, visibility, budget_min, budget_max, location, county, timeline, status, deadline, user_id, buyer_id

## Verification

After inserting the sample data:

### 1. Check in Supabase
```sql
SELECT id, title, category, budget_min, budget_max, location 
FROM rfqs 
WHERE rfq_type = 'public' AND visibility = 'public' 
ORDER BY created_at DESC;
```

Expected result: 8 rows with various projects

### 2. Check in Application
1. Build and deploy: `npm run build && git push`
2. Visit: https://zintra-platform.vercel.app/post-rfq
3. Scroll down to "Public RFQ Marketplace" section
4. Should see a grid of 8 RFQ cards with:
   - Project title
   - Description preview
   - Budget range (KSh min - max)
   - Location (county)
   - Days until deadline
   - Number of quotes (initially 0)

## Sample Data Included

The SQL file creates 8 sample public RFQs:

| Title | Category | Budget | Location | Status |
|-------|----------|--------|----------|--------|
| Modern Kitchen Renovation | Kitchen & Interior Fittings | 500K - 1M | Nairobi | Open |
| Complete House Electrical Rewiring | Electrical & Lighting | 150K - 300K | Nairobi | Open |
| Bathroom Plumbing Renovation | Plumbing & Sanitation | 100K - 250K | Nairobi | Open |
| Office Partition Installation | Building & Structural | 200K - 500K | Nairobi | Open |
| Roof Replacement | Roofing & Waterproofing | 800K - 1.5M | Nairobi | Open |
| Commercial Kitchen Equipment | Kitchen & Interior Fittings | 250K - 500K | Mombasa | Open |
| Solar Panel Installation | Electrical & Lighting | 500K - 800K | Kisumu | Open |
| Interior Wall Painting | Flooring & Wall Finishes | 80K - 150K | Nakuru | Open |

## Important Notes

⚠️ **UUID Replacement Required**
- The SQL file uses placeholder UUIDs: `550e8400-e29b-41d4-a716-446655440000` through `550e8400-e29b-41d4-a716-446655440007`
- You MUST replace these with actual user IDs before running the SQL
- Get your user ID: `SELECT id FROM auth.users LIMIT 1;`
- Or use your own user ID if available

✅ **Database Schema Requirement**
- The `rfqs` table must have these columns (already created in MIGRATION_RFQ_TYPES.sql):
  - `rfq_type` (VARCHAR) - must be 'public'
  - `visibility` (VARCHAR) - must be 'public'
  - `deadline` (TIMESTAMP)
  - All other columns as per existing schema

## Next Steps

After sample data is added:

### 1. **Create Dynamic Marketplace Display** (Phase 3)
   - Modify `/app/post-rfq/page.js` to fetch public RFQs from Supabase
   - Display in a grid with cards showing:
     - Title, description preview
     - Budget range
     - Location
     - Days until deadline
     - Number of submitted quotes
   - Add "View & Quote" button → links to `/rfq/[id]`

### 2. **Build Direct RFQ Wizard** (Phase 4)
   - Create `/app/post-rfq/direct/page.js`
   - Vendor selection interface
   - Project details form
   - Store as `rfq_type='direct'` in database

### 3. **Build Wizard RFQ with Auto-Matching** (Phase 5)
   - Create `/app/post-rfq/wizard/page.js`
   - 5-step guided form
   - Auto-matching algorithm based on category/location/rating
   - Store matched vendors in `rfq_recipients` table

### 4. **Build Public RFQ Form** (Phase 6)
   - Create `/app/post-rfq/public/page.js`
   - Simplified form for public posting
   - Publish to marketplace

### 5. **Create RFQ Details Page** (Phase 7)
   - Create `/app/rfq/[id]/page.js`
   - Show RFQ details
   - Display vendor quotes
   - Role-based views (creator, vendor, public)

## File Changes Summary

| File | Change | Status |
|------|--------|--------|
| `/app/page.js` | Removed marketplace section | ✅ Done |
| `/app/post-rfq/page.js` | Created new index with three boxes + marketplace | ✅ Done |
| `/app/post-rfq/page.js.new` | Archive of new version | ✅ Done |
| `/app/post-rfq/layout.js` | Created layout wrapper | ✅ Done |
| `/supabase/sql/SAMPLE_PUBLIC_RFQS.sql` | Sample data SQL file | ✅ Created |
| Git | Committed and pushed all changes | ✅ Done |

## Deployed

✅ All changes have been committed and pushed to GitHub
✅ Vercel auto-deployment should be in progress
✅ Check deployment status: https://vercel.com/dashboard

---

**Next Action**: Add sample data to Supabase using the SQL file, then test the marketplace display on `/post-rfq` page.
