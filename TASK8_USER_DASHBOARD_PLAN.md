# Task 8: User Dashboard with Tabs - Implementation Plan & Build

**Status:** In Progress  
**Scope:** Redesign my-rfqs page with tabbed interface  
**Complexity:** High  
**Estimated Lines:** 1,200+ code + 500+ docs  

---

## 📋 Overview

Transform the existing my-rfqs page from a simple list into a professional dashboard with:
- 5 organized tabs (Pending, Active, History, Messages, Favorites)
- Search, filter, and sort functionality
- Real-time statistics and metrics
- Mobile-responsive design
- Message threading preview
- Quick action buttons

---

## 🎯 What We'll Build

### Components (6)
1. **RFQDashboard** - Main dashboard page
2. **RFQTabs** - Tab navigation component
3. **PendingTab** - RFQs waiting for quotes
4. **ActiveTab** - RFQs with received quotes
5. **HistoryTab** - Completed and closed RFQs
6. **MessagesTab** - Thread list from vendors
7. **FavoritesTab** - Bookmarked RFQs

### Features (15+)
- ✅ 5 tabbed interface
- ✅ Search by title/description
- ✅ Filter by status, date range, amount
- ✅ Sort by date, quotes, deadline
- ✅ Real-time quote counts
- ✅ Statistics dashboard (KPIs)
- ✅ Quick action buttons
- ✅ Message preview
- ✅ Deadline countdown
- ✅ Badge indicators (new quotes, messages)
- ✅ Responsive design
- ✅ Loading states
- ✅ Empty states
- ✅ Pagination
- ✅ Export data

---

## 🏗️ Component Architecture

```
RFQDashboard (Main Page)
├── Header
│   ├─ Title
│   ├─ Statistics Card
│   └─ Create RFQ Button
├── Search & Filter Bar
│   ├─ Search Input
│   ├─ Status Filter
│   ├─ Date Range Filter
│   └─ Sort Dropdown
├── RFQTabs
│   ├─ Tab Buttons (5 tabs)
│   └─ Active Tab Indicator
└── Tab Content (Dynamic)
    ├─ PendingTab (RFQs < 1 quote)
    ├─ ActiveTab (RFQs with quotes)
    ├─ HistoryTab (Closed/Completed)
    ├─ MessagesTab (Vendor threads)
    └─ FavoritesTab (Bookmarked)

Each Tab Contains:
├── Data Table/Card List
│   ├─ RFQ Title
│   ├─ Status Badge
│   ├─ Quote Count
│   ├─ Deadline
│   ├─ Created Date
│   └─ Quick Actions
├── Empty State
└── Pagination
```

---

## 📊 Tab Specifications

### 1. **Pending Tab**
Shows RFQs with 0 or 1 quote - needs more vendor attention

**Columns:**
- Title (link to RFQ)
- Status badge (yellow "Waiting for Quotes")
- Quotes received (0, 1)
- Deadline (countdown if < 7 days)
- Created date
- Actions: View Quotes, Send Reminder, Edit

**Sort Options:** Latest, Oldest, Deadline Soon, Deadline Latest
**Filter:** Date range, amount range

**Special Badge:** "⏰ Closing Soon" if deadline < 3 days

---

### 2. **Active Tab**
Shows RFQs with 2+ quotes - vendor competition happening

**Columns:**
- Title (link to RFQ)
- Status badge (blue "Active")
- Quote count (e.g., "5 quotes")
- Lowest price
- Highest price
- Deadline
- Created date
- Actions: Compare Quotes, View All, Message Vendors

**Metrics:** Average price, Price range

**Sort Options:** Most Quotes, Price (Low to High), Price (High to Low), Deadline

**Special Badge:** "🔥 Hot" if 5+ quotes, "🎯 Best Deal" if good price variance

---

### 3. **History Tab**
Shows completed, closed, or old RFQs (> 30 days)

**Columns:**
- Title (link to RFQ)
- Status badge (gray "Closed" or green "Completed")
- Final Quote Selected (vendor name)
- Final Price
- Quote Count
- Completion Date
- Actions: View Details, Export, Duplicate

**Metrics:** Total RFQs, Total Spent, Average Price

**Sort Options:** Latest, Oldest, Highest Price, Lowest Price

---

### 4. **Messages Tab**
Shows vendor message threads

**Display:**
- Vendor Name / Company
- Last Message Preview
- Unread count (red badge)
- Last Message Time
- RFQ Title
- Actions: Open Thread, Mark Read, Archive

**Thread Preview:**
- Vendor avatar/icon
- "New message from ABC Supplies"
- Message preview text
- Timestamp (e.g., "2 hours ago")

**Special Badge:** "🔴 New" if unread, "⭐ Important" if flagged

---

### 5. **Favorites Tab**
Shows bookmarked RFQs for easy access

**Columns:**
- Title (link to RFQ)
- Status badge
- Quote count
- Deadline
- Starred icon (★)
- Actions: View, Remove from Favorites, Message Vendors

**Sort Options:** Recently Bookmarked, Quotes, Deadline

**Empty State:** "No favorites yet. Star RFQs to save them here!"

---

## 🧮 Statistics Dashboard

### Key Performance Indicators (KPIs)

```
┌─────────────────────────────────────────────────────────┐
│              RFQ Dashboard Statistics                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Total    │  │  Pending │  │  Active  │  │ History │ │
│  │  RFQs    │  │  Quotes  │  │  Quotes  │  │ Complete│ │
│  │    45    │  │     8    │  │    22    │  │    15   │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │
│  │ New Quotes     │  │ New Messages   │  │  On-Time   │ │
│  │ This Week      │  │ Unread         │  │  Closure   │ │
│  │      12        │  │       3        │  │    94%     │ │
│  └────────────────┘  └────────────────┘  └────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Metrics to Display:**
- Total RFQs created
- Pending (waiting for quotes)
- Active (with quotes)
- Completed/History
- New quotes this week
- Unread messages
- On-time closure rate
- Average response time

---

## 🔍 Search & Filter Implementation

### Search
```javascript
// Search across:
- RFQ title
- RFQ description
- Vendor names (in quotes)
- RFQ ID
```

### Filters
```
Status: All, Pending, Active, Completed, Closed
Created: Last 7 days, Last 30 days, Custom date range
Amount: $0-1K, $1K-5K, $5K-10K, $10K+, Custom range
Quote Count: 0, 1, 2-5, 5+
Deadline: This week, Next week, Overdue, Custom
```

### Sort Options
```
Date Created: Newest, Oldest
Deadline: Soon, Later
Quotes: Most, Least
Price: Low-High, High-Low
Alphabetical: A-Z, Z-A
Last Updated: Newest, Oldest
```

---

## 📱 Mobile Responsiveness

### Desktop (1024px+)
- Table view with full columns
- Side-by-side filters
- Multiple columns visible

### Tablet (768px-1023px)
- Card view with horizontal scroll
- Collapsed filters (accordion)
- 3 columns visible

### Mobile (< 768px)
- Card view (full width)
- Stacked filters
- Essential columns only
- Touch-friendly buttons
- Swipe between tabs

---

## 🗄️ Database Queries

### Get Pending RFQs
```sql
SELECT r.*, 
  COUNT(q.id) as quote_count,
  MAX(q.created_at) as latest_quote
FROM rfqs r
LEFT JOIN rfq_responses q ON r.id = q.rfq_id
WHERE r.user_id = $1 
  AND r.status = 'active'
  AND COALESCE(COUNT(q.id), 0) < 2
GROUP BY r.id
ORDER BY r.created_at DESC;
```

### Get Active RFQs (with quotes)
```sql
SELECT r.*,
  COUNT(q.id) as quote_count,
  MIN(q.amount) as min_price,
  MAX(q.amount) as max_price,
  AVG(q.amount)::numeric(10,2) as avg_price
FROM rfqs r
LEFT JOIN rfq_responses q ON r.id = q.rfq_id
WHERE r.user_id = $1 
  AND r.status = 'active'
  AND COUNT(q.id) >= 2
GROUP BY r.id
ORDER BY r.created_at DESC;
```

### Get History RFQs
```sql
SELECT r.*,
  COUNT(q.id) as quote_count,
  (SELECT amount FROM rfq_responses 
   WHERE rfq_id = r.id AND status = 'accepted' LIMIT 1) as final_price
FROM rfqs r
LEFT JOIN rfq_responses q ON r.id = q.rfq_id
WHERE r.user_id = $1 
  AND r.status != 'active'
GROUP BY r.id
ORDER BY r.updated_at DESC;
```

---

## 🎨 UI/UX Details

### Colors
- Primary: Orange (#F97316)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Danger: Red (#EF4444)
- Neutral: Slate (#64748B)

### Status Badges
```
Pending:   Yellow bg, "Waiting for Quotes"
Active:    Blue bg, "Active"
Completed: Green bg, "Completed"
Closed:    Gray bg, "Closed"
```

### Deadline Indicators
```
< 3 days:  Red, "⏰ Closing Soon"
3-7 days:  Yellow, "📅 Coming Soon"
> 7 days:  Gray, "📅 Plenty of time"
Overdue:   Red, "⚠️ Overdue"
```

### Quick Actions
```
View Quotes    → /quote-comparison/[rfqId]
Compare Quotes → /quote-comparison/[rfqId]
Edit RFQ       → /edit-rfq/[rfqId]
Message Vendor → Opens message modal
Send Reminder  → Sends SMS to vendors
View Details   → /rfq/[rfqId]
```

---

## 🚀 Implementation Steps

### Step 1: Create useRFQDashboard Hook (300 lines)
**File:** `hooks/useRFQDashboard.js`

Manages:
- Fetching RFQs for all tabs
- Filtering and sorting
- Search functionality
- Statistics calculations
- Real-time updates

### Step 2: Create RFQTabs Component (150 lines)
**File:** `components/RFQTabs.js`

Features:
- Tab navigation
- Active tab styling
- Badge indicators
- Tab switching

### Step 3: Create Individual Tab Components (800 lines)
**Files:**
- `components/tabs/PendingTab.js` (150 lines)
- `components/tabs/ActiveTab.js` (150 lines)
- `components/tabs/HistoryTab.js` (150 lines)
- `components/tabs/MessagesTab.js` (150 lines)
- `components/tabs/FavoritesTab.js` (100 lines)

### Step 4: Create Main Dashboard Page (300 lines)
**File:** `app/my-rfqs/page.js` (rewrite)

Features:
- Header with statistics
- Search and filter bar
- Tab component
- Dynamic content
- Loading and error states

### Step 5: Create Supporting Components (200 lines)
**Files:**
- `components/StatisticsCard.js` (80 lines)
- `components/RFQCard.js` (80 lines)
- `components/FilterBar.js` (80 lines)

### Step 6: Create API Endpoints (200 lines)
**Files:**
- `pages/api/rfqs/pending.ts` (50 lines)
- `pages/api/rfqs/active.ts` (50 lines)
- `pages/api/rfqs/history.ts` (50 lines)
- `pages/api/rfqs/stats.ts` (50 lines)

---

## 📋 Complete File List

```
Components:
├── components/RFQTabs.js                 (150 lines)
├── components/StatisticsCard.js          (80 lines)
├── components/RFQCard.js                 (80 lines)
├── components/FilterBar.js               (80 lines)
├── components/tabs/
│   ├── PendingTab.js                     (150 lines)
│   ├── ActiveTab.js                      (150 lines)
│   ├── HistoryTab.js                     (150 lines)
│   ├── MessagesTab.js                    (150 lines)
│   └── FavoritesTab.js                   (100 lines)

Pages:
├── app/my-rfqs/page.js                   (300 lines)

Hooks:
├── hooks/useRFQDashboard.js              (300 lines)

API Endpoints:
├── pages/api/rfqs/pending.ts             (50 lines)
├── pages/api/rfqs/active.ts              (50 lines)
├── pages/api/rfqs/history.ts             (50 lines)
└── pages/api/rfqs/stats.ts               (50 lines)

Documentation:
├── TASK8_USER_DASHBOARD_PLAN.md          (Current file)
├── TASK8_USER_DASHBOARD_COMPLETE.md      (Will create)
├── TASK8_QUICK_REFERENCE.md              (Will create)
└── TASK8_ARCHITECTURE_GUIDE.md           (Will create)

Total: 2,200+ lines of code + 1,200+ lines of docs
```

---

## 🎯 Key Features

✅ **5 Organized Tabs** for different RFQ states  
✅ **Real-Time Stats** showing key metrics  
✅ **Search Functionality** across multiple fields  
✅ **Advanced Filtering** by status, date, amount  
✅ **Sorting Options** for each tab  
✅ **Responsive Design** mobile-first approach  
✅ **Quick Actions** for common tasks  
✅ **Message Threading** vendor communications  
✅ **Favorites System** bookmark important RFQs  
✅ **Pagination** for large datasets  
✅ **Loading States** for better UX  
✅ **Empty States** when no data  
✅ **Performance** optimized queries  
✅ **Accessibility** proper ARIA labels  
✅ **Export Data** future capability  

---

## ✨ Enhanced User Experience

### Before (Simple List)
- Single view of all RFQs
- No filtering or searching
- No statistics
- Difficult to prioritize
- No vendor communication preview

### After (Dashboard)
- 5 organized tabs by state
- Powerful search and filters
- Key statistics visible
- Easy to prioritize
- Message preview in Messages tab
- Deadline countdowns
- Quick action buttons
- Status indicators
- Performance badges

---

## 🧪 Testing Checklist

- [ ] All 5 tabs load correctly
- [ ] Tab switching works smoothly
- [ ] Search filters correctly
- [ ] Sort options work
- [ ] Statistics calculate correctly
- [ ] Pagination works
- [ ] Mobile responsive
- [ ] Loading states display
- [ ] Empty states display
- [ ] Quick action buttons work
- [ ] No console errors
- [ ] Performance acceptable (< 500ms load)

---

## 📚 Next Steps

After Task 8 complete:
1. **Task 9:** Buyer Reputation System (badges, scoring)
2. **Task 10:** Quote Negotiation (counter-offers, Q&A)

---

**Status:** Ready to build! 🚀

