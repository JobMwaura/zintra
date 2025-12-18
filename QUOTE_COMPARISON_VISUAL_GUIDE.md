# Quote Comparison - Visual & Architecture Guide

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Quote Comparison System                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐    ┌──────────────────────────┐
│  RFQ Creator View        │    │  Vendor View             │
│  (/quote-comparison/...) │    │  (same URL, filtered)    │
├──────────────────────────┤    ├──────────────────────────┤
│ • See ALL quotes         │    │ • See ONLY own quote     │
│ • Accept/reject quotes   │    │ • See other ratings      │
│ • Contact vendors        │    │ • Compare with average   │
│ • Export data            │    │ • No pricing from others │
└──────────────────────────┘    └──────────────────────────┘
        │                              │
        └──────────────┬───────────────┘
                       │
        ┌──────────────▼───────────────┐
        │ Quote Comparison Page        │
        │ /quote-comparison/[rfqId]    │
        ├─────────────────────────────┤
        │ 1. RFQ Header               │
        │    - Title, deadline        │
        │    - Quote count            │
        │ 2. Summary Cards            │
        │    - Lowest, highest, avg   │
        │ 3. Comparison Table         │
        │    - Sort, filter, select   │
        │ 4. Export Buttons           │
        │    - CSV, PDF               │
        │ 5. Actions                  │
        │    - Accept, reject, email  │
        └─────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
  QuoteComparison  QuoteComparison  useQuoteComparison
    Table          Card              Hook
    
  Displays        Preview card      API &
  full table      with stats        business logic
```

---

## 📋 Component Hierarchy

```
Quote Comparison Page
├─ Header Section
│  ├─ Back Button
│  ├─ RFQ Title & Description
│  └─ RFQ Meta Info (deadline, quote count)
├─ Summary Stats (4 cards)
│  ├─ Lowest Price (Blue)
│  ├─ Highest Rated (Green)
│  ├─ Average Price (Orange)
│  └─ Total Quotes (Purple)
├─ Action Buttons
│  ├─ Export CSV
│  ├─ Export PDF
│  └─ Send Messages
├─ Quote Comparison Table
│  ├─ Filter Bar
│  │  ├─ Status Filter
│  │  ├─ Price Range (Min/Max)
│  │  └─ Export Button
│  ├─ Table Header (sortable)
│  │  ├─ Vendor
│  │  ├─ Rating
│  │  ├─ Price
│  │  ├─ Timeline
│  │  ├─ Status
│  │  ├─ Submitted Date
│  │  └─ Action
│  └─ Table Rows
│     ├─ Quote 1
│     ├─ Quote 2
│     └─ ...
├─ Quote Stats Summary
│  ├─ Average Price
│  ├─ Highest Rating
│  ├─ Price Variance
│  └─ Total Count
└─ Action Section (if quote selected)
   ├─ Accept Button
   ├─ Reject Button
   └─ Contact Vendor Button
```

---

## 🎯 Data Flow

```
User Opens Page
      │
      ▼
Load RFQ Details
      │
      ├─► Fetch from rfqs table
      │   - Title, description, deadline
      │   - RFQ type (direct/matched/public)
      │
      ▼
Check Authorization
      │
      ├─► Is user the RFQ creator?
      │   └─► YES: Show all quotes
      │       NO: Filter to vendor's own quotes
      │
      ▼
Load Quotes & Vendors
      │
      ├─► Fetch from rfq_responses table
      │   - All quotes for this RFQ
      │
      ├─► Extract unique vendor_ids
      │
      └─► Fetch from vendors table
          - Company name, rating, verification
          - Phone, email, response time
          
      ▼
Render Components
      │
      ├─► Summary Stats (calculated from quotes)
      ├─► Quote Table (with vendor data)
      └─► Action Buttons (if creator)
      
      ▼
User Interacts
      │
      ├─► Sort/Filter → Re-render table
      ├─► Select Quote → Highlight row
      ├─► Accept/Reject → Update status → Refresh
      ├─► Export CSV → Download file
      ├─► Export PDF → Generate & download
      └─► Contact → Open email client
```

---

## 📊 Table Structure (Visual)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Vendor          │ Rating  │ Price    │ Timeline │ Status    │ Date  │
├─────────────────────────────────────────────────────────────────────┤
│ Akiba Build     │ 4.8 ✓   │ 45,000   │ 2 weeks  │ ●Accepted │ 12/17 │
├─────────────────────────────────────────────────────────────────────┤
│ Elite Const.    │ 4.5     │ 52,000   │ 3 weeks  │ ●Pending  │ 12/17 │
├─────────────────────────────────────────────────────────────────────┤
│ Quick Build     │ 4.2     │ 48,500   │ 10 days  │ ●Pending  │ 12/18 │
├─────────────────────────────────────────────────────────────────────┤
│ BuildRight      │ 3.9     │ 55,000   │ 4 weeks  │ ●Pending  │ 12/16 │
└─────────────────────────────────────────────────────────────────────┘

Legend:
  ✓ = Verified vendor
  ● = Clickable status badge
```

---

## 💳 Summary Cards Layout

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ 💎 LOWEST PRICE  │ ⭐ HIGHEST RATED │ 📊 AVERAGE PRICE │ 📦 TOTAL QUOTES  │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ KSh 45,000       │ 4.8 ★            │ KSh 50,125       │ 4                │
│ (Green - Value)  │ (Green - Quality)│ (Orange - Bench) │ (Purple - Count) │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

---

## 🎨 Quote Comparison Card (Preview)

```
┌─────────────────────────────────────┐
│  📊 Quote Analysis                  │
│  4 quotes received                  │
├─────────────────────────────────────┤
│                                     │
│  ▼ Lowest      KSh 45,000          │  ← Green (savings)
│  ▲ Highest     KSh 55,000          │  ← Red (benchmark)
│  = Average     KSh 50,125          │  ← Orange (benchmark)
│                                     │
│  Price Variance: ████░░░░░ 18.1%   │  ← Visual bar
│                                     │
│  ✓ 1 Accepted  ⧖ 3 Pending        │  ← Status badges
│                                     │
│  View Comparison →                  │  ← CTA
└─────────────────────────────────────┘
```

---

## 🔄 User Interactions

### Scenario 1: RFQ Creator Reviews Quotes

```
1. Creator clicks on RFQ
      │
      ▼
2. Sees Quote Comparison Card
   (shows stats, quick preview)
      │
      ▼
3. Clicks "View Comparison"
      │
      ▼
4. Opens full page at /quote-comparison/[rfqId]
      │
      ├─► Sees summary stats
      ├─► Sees full table with all quotes
      ├─► Can sort by price, rating, date
      ├─► Can filter by status/price
      │
      ▼
5. Selects preferred quote
      │
      └─► Row highlights
          Shows action buttons below table
          - Accept (green)
          - Reject (red)
          - Contact Vendor (blue)
      
      ▼
6. Clicks "Accept Quote"
      │
      └─► Quote status → "accepted"
          Vendor notified (future feature)
          Page refreshes
          Vendor moves to accepted section
```

### Scenario 2: Vendor Checks Their Quote

```
1. Vendor logs in
      │
      ▼
2. Goes to /post-rfq
      │
      ▼
3. Views RFQ details
      │
      ├─► Clicks "View Comparison"
      │   URL: /quote-comparison/[rfqId]
      │
      ▼
4. Page loads
      │
      ├─► Checks: vendor_id = user.id?
      │   NO → Filter quotes to show only vendor's
      │
      ▼
5. Vendor sees:
      │
      ├─► Their quote (full details)
      ├─► Average price (benchmark)
      ├─► Other vendors' ratings (NO prices)
      ├─► Price variance % (but not individual prices)
      │
      └─► Info message: "You can only see your quote"
```

---

## 📤 Export Workflows

### CSV Export

```
User clicks "Export CSV"
      │
      ▼
System prepares data
├─ Headers: Vendor, Rating, Price, Timeline, Status, Date
└─ Rows: Each quote mapped to columns

      ▼
Generates CSV string
├─ Quote enclosing with quotes
├─ Commas as separators
└─ Newlines as row delimiters

      ▼
Creates blob
      │
      ├─► Sets MIME type: text/csv
      ├─► Creates download link
      └─► Triggers download dialog

      ▼
Browser downloads
      │
      └─► filename: quotes-[rfqId].csv
          Opens in Excel/Sheets/Numbers
```

### PDF Export

```
User clicks "Export PDF"
      │
      ▼
System initializes jsPDF
      │
      ├─► Creates document
      ├─► Sets page size
      └─► Initializes position

      ▼
Renders content
      │
      ├─ Title: "Quote Comparison Report"
      ├─ RFQ Details: Project name, total quotes, date
      ├─ Table Headers: Vendor, Rating, Price, Timeline, Status
      └─ Table Rows: Each quote formatted

      ▼
Handles pagination
      │
      └─► If content exceeds page height
          Add new page
          Continue rendering

      ▼
Browser downloads
      │
      └─► filename: quotes-[rfqId].pdf
          Opens in PDF viewer
```

---

## 🔐 Access Control Flow

```
User opens /quote-comparison/[rfqId]
      │
      ▼
Check authentication
      │
      ├─► No user? → Redirect to /login
      │
      ▼
Fetch RFQ
      │
      ├─► RFQ not found? → Show error
      │
      ▼
Check authorization
      │
      ├─► if (user.id === rfq.user_id)
      │   ✓ RFQ Creator
      │   ├─► Load ALL quotes
      │   ├─► Show accept/reject buttons
      │   ├─► Show vendor contact info
      │   └─► Allow export
      │
      └─► else if (rfq.rfq_type === 'public')
          ✓ Public RFQ
          ├─► Load vendor's own quotes only
          ├─► Hide accept/reject buttons
          ├─► Show other vendors' ratings only
          └─► Show info message
```

---

## 📈 Statistics Calculations

```
Summary Stats (calculated from quotes array)

Lowest Price    = Math.min(...quotes.map(q => q.amount))
Highest Price   = Math.max(...quotes.map(q => q.amount))
Average Price   = quotes.reduce(...) / quotes.length
Price Variance  = ((highest - lowest) / average) * 100

Price Variance Visualization:
  <10%  = Low variance (tight competition)
  10-25% = Normal variance
  >25%  = High variance (wide range)

Accepted Count  = quotes.filter(q => q.status === 'accepted').length
Rejected Count  = quotes.filter(q => q.status === 'rejected').length
Pending Count   = quotes.filter(q => q.status === 'submitted').length

Savings Potential = average_price - lowest_price
Savings %       = (savings / average_price) * 100
```

---

## 🔄 Real-Time Updates

```
When quote is accepted:
      │
      ▼
Frontend update
      ├─► Change status: "submitted" → "accepted"
      ├─► Highlight row (green background)
      └─► Move to accepted section

      ▼
Future Enhancement:
      └─► Supabase real-time subscription
          Notify vendor instantly
          Update dashboard in real-time
```

---

## 📱 Responsive Layout

### Desktop (1024px+)
```
Full-width table with all columns visible
Side-by-side summary cards
Hover effects on rows
```

### Tablet (768px-1023px)
```
Columns adjust width
Summary cards stack to 2 rows
Condensed vendor info
```

### Mobile (<768px)
```
Horizontal scroll on table
Summary cards stack vertically
Vendor info in accordion
Selected quote shows details below
```

---

## 🎯 Key Features Matrix

```
Feature                 │ Creator │ Vendor │ Admin
────────────────────────┼─────────┼────────┼──────
View all quotes         │    ✓    │   ✗    │  ✓
View own quote          │    ✓    │   ✓    │  ✓
See other prices        │    ✓    │   ✗    │  ✓
Accept quote            │    ✓    │   ✗    │  ✗
Reject quote            │    ✓    │   ✗    │  ✗
Contact vendors         │    ✓    │   ✓    │  ✓
Export CSV/PDF          │    ✓    │   ✗    │  ✓
View analytics          │    ✓    │   ✗    │  ✓
```

---

## 🚀 Performance Optimization

```
Load Quote Comparison Page (1000ms typical)

0ms   - Start navigation
100ms - Fetch RFQ details
300ms - Fetch quotes (parallel with vendors)
500ms - Fetch vendor data
600ms - Calculate statistics
700ms - Render components
900ms - Interactive
1000ms - Load animations complete
```

---

## 🔗 Related Pages

```
My RFQs Page
    ├─ Shows list of all RFQs
    ├─ Each RFQ has QuoteComparisonCard (preview)
    └─ Click → Navigate to /quote-comparison/[rfqId]
         │
         ▼
Quote Comparison Page
    ├─ Full comparison view
    ├─ Accept/Reject functionality
    ├─ Export options
    └─ Contact vendors
         │
         ├─ Click Accept → Update status
         │
         └─ Future: Navigate to /rfq/[rfqId]/negotiate
                    (Quote negotiation page - Task 10)
```

---

**Visual Guide Version:** 1.0  
**Last Updated:** December 18, 2025  
**Status:** ✅ Complete
