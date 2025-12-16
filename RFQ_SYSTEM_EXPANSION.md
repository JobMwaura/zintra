# RFQ System Expansion - Implementation Plan

## Overview
This document outlines the comprehensive changes needed to implement three distinct RFQ types (Direct, Wizard/Auto-Match, and Public Marketplace) across Zintra's platform.

## Completed in This Phase

### 1. Database Schema Migration ✅
**File:** `supabase/sql/MIGRATION_RFQ_TYPES.sql`

**New Tables:**
- `rfq_recipients` - Tracks which vendors received direct or matched RFQs
  - Columns: rfq_id, vendor_id, recipient_type (direct/matched), notification_sent_at, viewed_at, quote_submitted
  
- `rfq_quotes` - Stores vendor responses and quotes to RFQs
  - Columns: rfq_id, vendor_id, amount, currency, timeline_days, payment_terms, notes, status, submitted_at, accepted_at

**Schema Updates to rfqs Table:**
- `rfq_type` VARCHAR(20) - Values: 'direct', 'matched', 'public'
- `visibility` VARCHAR(20) - Values: 'private' (direct), 'semi-private' (matched), 'public'
- `deadline` TIMESTAMP - Deadline for submitting quotes
- `matched_vendors` JSONB - Array of vendor IDs matched by algorithm

**Indexes Created:**
- Optimized queries on rfq_type, visibility, user_id, category, location, deadline
- Performance-optimized foreign key queries on rfq_recipients and rfq_quotes tables

### 2. Homepage Updates ✅

**Three RFQ Type Boxes** (Already implemented in previous commit)
- Direct RFQ - "I know who I want to contact"
- Wizard RFQ - "Help me find the right vendors" (featured/scaled)
- Public RFQ - "Let all vendors compete"

**New: Public RFQ Marketplace Section**
- Added below the three RFQ type boxes
- Shows active public RFQs available for vendor bidding
- Currently shows placeholder state ("No active public RFQs")
- Ready for dynamic data integration from Supabase

### 3. /post-rfq Page Redesign ✅

**New Index Page** - Shows three RFQ type options
- File: `app/post-rfq/page.js.new` (ready to deploy)
- Layout file: `app/post-rfq/layout.js` (created)

**Features:**
- Three cards matching homepage design (Orange/Blue/Purple)
- "Get Started" buttons for each type
- Help section explaining which type to choose
- Navigation with "Back to Home" button
- Responsive design for all devices
- Query parameter handling: `?type=direct|matched|public`

**Navigation Routing:**
- Direct RFQ → `/post-rfq/direct`
- Wizard RFQ → `/post-rfq/wizard`
- Public RFQ → `/post-rfq/public`

## Next Steps - To Be Implemented

### Phase 2: Direct RFQ Wizard (Type 1)

**File to Create:** `app/post-rfq/direct/page.js`

**Features Required:**
1. **Vendor Selection UI**
   - Search vendors by name, category, location
   - Display vendor cards with ratings, reviews, specializations
   - Multi-select checkboxes to choose vendors
   - "Continue" button once vendors selected
   
2. **Project Details Form**
   - Project title (required)
   - Detailed description
   - Budget range (optional custom min/max)
   - Timeline preference
   - File attachments (documents, photos)
   
3. **Review & Submit**
   - Summary of selected vendors
   - Review all project details
   - Submit button

**Database Operations:**
```javascript
// Insert RFQ
INSERT INTO rfqs (
  user_id, title, description, 
  rfq_type='direct', visibility='private',
  category, budget_min, budget_max,
  location, created_at
)

// Insert recipients (one per selected vendor)
INSERT INTO rfq_recipients (
  rfq_id, vendor_id, recipient_type='direct',
  notification_sent_at
)
```

### Phase 3: Wizard RFQ with Auto-Matching (Type 2)

**File to Create:** `app/post-rfq/wizard/page.js`

**5-Step Guided Wizard:**

**Step 1: Project Basics**
- Project title
- Detailed description
- Category selection (dropdown from categories table)

**Step 2: Location & Scope**
- Service location (county/area)
- Project type selector
- Dimensions/measurements if applicable

**Step 3: Budget**
- Budget range selection (predefined or custom)
- Payment terms preference
- Quality/preference level

**Step 4: Timeline**
- Project timeline preference
- Start date preference
- Urgency level

**Step 5: Attachments & Review**
- File upload (documents, photos, plans)
- Review all details
- Submit for auto-matching

**Auto-Matching Algorithm:**
```javascript
async function findMatchedVendors(rfq) {
  // Get all vendors with matching category
  const categoryVendors = await supabase
    .from('vendors')
    .select('*')
    .eq('category', rfq.category)
    .eq('status', 'active');
  
  // Filter by location (within service radius)
  const locationVendors = categoryVendors.filter(v => 
    v.service_counties.includes(rfq.location)
  );
  
  // Sort by rating (highest first)
  const sortedVendors = locationVendors.sort((a, b) => 
    b.rating - a.rating
  );
  
  // Check vendor capacity (not overwhelmed with RFQs)
  const availableVendors = sortedVendors.filter(v => 
    v.open_rfqs < v.max_concurrent_rfqs
  );
  
  // Return top N vendors (e.g., top 5)
  return availableVendors.slice(0, 5);
}
```

**Database Operations:**
```javascript
// Insert RFQ
INSERT INTO rfqs (
  user_id, title, description,
  rfq_type='matched', visibility='semi-private',
  category, budget_min, budget_max,
  location, matched_vendors=[...], created_at
)

// Insert recipients (auto-matched vendors)
INSERT INTO rfq_recipients (
  rfq_id, vendor_id, recipient_type='matched',
  notification_sent_at
) VALUES (...)
```

### Phase 4: Public RFQ Marketplace (Type 3)

**File to Create:** `app/post-rfq/public/page.js`

**Simple Public Form:**
- Project title
- Detailed description
- Category selection
- Location (county)
- Budget range
- Timeline
- Deadline for receiving quotes (date picker)
- File attachments
- Submit button

**Database Operations:**
```javascript
// Insert RFQ
INSERT INTO rfqs (
  user_id, title, description,
  rfq_type='public', visibility='public',
  category, budget_min, budget_max,
  location, deadline, created_at
)

// No rfq_recipients - public to all vendors
```

**Marketplace Display:**
- Update homepage "Public RFQ Marketplace" section
- Query: Get all RFQs where rfq_type='public' and deadline > NOW()
- Display cards with:
  - Project title
  - Budget range (budget_min - budget_max)
  - Location
  - Days until deadline
  - Number of quotes received (from rfq_quotes table)
  - "View & Quote" button

### Phase 5: RFQ Details/Browse Page

**File to Create:** `app/rfq/[id]/page.js`

**Different Views Based on User Type:**

1. **RFQ Creator View** (logged in user who posted RFQ)
   - Full RFQ details (read-only)
   - For Direct/Matched: List of selected vendors and their quotes
   - For Public: List of ALL vendors who quoted
   - Comparison table of quotes
   - Accept/Reject quote functionality
   - Message vendor functionality

2. **Selected Vendor View** (vendor in rfq_recipients)
   - Full RFQ details
   - Can submit/edit quote
   - Cannot see other vendors' quotes (private)

3. **Public RFQ View** (any vendor, public RFQ only)
   - Full RFQ details
   - Can submit quote
   - Can see number of other quotes (but not details)
   - Can compare against other quotes they've submitted

4. **Anonymous View** (not logged in)
   - Can view public RFQ details
   - Prompted to login/register to submit quote

### Phase 6: Vendor Dashboard Updates

**Vendor Inbox/Dashboard** - Add RFQ sections:
- "Direct RFQs Sent to You" (rfq_recipients where recipient_type='direct')
- "Matched RFQs for Your Category" (rfq_recipients where recipient_type='matched')
- "Public RFQs in Your Category" (where visibility='public' and category matches)

**Vendor Quote Submission:**
- Form to submit quote with amount, timeline, terms
- Insert into rfq_quotes table
- Update rfq_recipients.quote_submitted = true if applicable

### Phase 7: Testing & Deployment

**Testing Checklist:**
- [ ] Direct RFQ: Can select vendors, RFQ created, recipients table populated
- [ ] Wizard RFQ: Auto-matching algorithm works, correct vendors matched, RFQ created
- [ ] Public RFQ: Public visibility, shows in marketplace, any vendor can quote
- [ ] Quote submission: Quotes stored in rfq_quotes table, status tracks correctly
- [ ] RFQ details page: Different views work for creator/vendor/anonymous
- [ ] Database queries: Indexes working, queries performant
- [ ] Notifications: Vendors notified when RFQ sent to them
- [ ] End-to-end flow: Create RFQ → Vendor receives → Submits quote → Creator sees quote

**Deployment Steps:**
1. Run database migration against Supabase
2. Deploy Phase 2-6 pages to production
3. Monitor error logs
4. Verify vendor notifications working
5. Test quote submission end-to-end

## Database Schema Summary

### Tables Reference

**rfqs** (existing, extended)
- id, user_id, title, description
- **NEW:** rfq_type, visibility, deadline, matched_vendors
- category, budget_min, budget_max, location
- status, created_at, updated_at

**rfq_recipients** (NEW)
- id, rfq_id, vendor_id, recipient_type
- notification_sent_at, viewed_at, quote_submitted
- created_at, updated_at

**rfq_quotes** (NEW)
- id, rfq_id, vendor_id, amount, currency
- timeline_days, payment_terms, notes, status
- submitted_at, accepted_at, created_at, updated_at

**vendors** (existing)
- id, user_id, company_name, category
- rating, verified, logo_url, status, service_counties
- open_rfqs, max_concurrent_rfqs, created_at, updated_at

### Key Queries

**Get Direct RFQs for Vendor:**
```sql
SELECT r.* FROM rfqs r
JOIN rfq_recipients rr ON r.id = rr.rfq_id
WHERE rr.vendor_id = ? AND rr.recipient_type = 'direct'
AND r.rfq_type = 'direct'
ORDER BY r.created_at DESC;
```

**Get Public Marketplace RFQs:**
```sql
SELECT r.* FROM rfqs r
WHERE r.rfq_type = 'public' AND r.visibility = 'public'
AND r.deadline > NOW()
ORDER BY r.created_at DESC
LIMIT 20;
```

**Get Quotes for RFQ:**
```sql
SELECT rq.*, v.company_name, v.rating, v.logo_url
FROM rfq_quotes rq
JOIN vendors v ON rq.vendor_id = v.id
WHERE rq.rfq_id = ?
ORDER BY rq.submitted_at DESC;
```

## Timeline Estimate

- **Phase 2 (Direct Wizard):** 2-3 hours
- **Phase 3 (Wizard with Auto-Matching):** 3-4 hours  
- **Phase 4 (Public RFQ):** 2 hours
- **Phase 5 (RFQ Details Page):** 3-4 hours
- **Phase 6 (Vendor Dashboard):** 2-3 hours
- **Phase 7 (Testing & Deployment):** 2-3 hours

**Total: 14-20 hours of development**

## Success Metrics

- ✅ All three RFQ types functional end-to-end
- ✅ Auto-matching algorithm working correctly
- ✅ Vendors receive notifications promptly
- ✅ Quote submission working
- ✅ Zero errors in production
- ✅ Database queries performant (sub-200ms)
- ✅ User satisfaction with workflow

## Notes

- The new `/post-rfq/page.js.new` file is ready to replace the old page.js
- All database changes are in MIGRATION_RFQ_TYPES.sql and ready to run
- Navigation already points to `/post-rfq` which will show the three options
- The homepage marketplace section is a placeholder - ready for dynamic data
- Consider email notifications when vendors receive RFQs
- Consider SMS notifications for urgent/high-value RFQs
- Future: Add RFQ analytics dashboard for admins and vendors
