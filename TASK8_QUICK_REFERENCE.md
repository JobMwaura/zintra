# Task 8: User Dashboard - Quick Reference

**Status:** ✅ COMPLETE  
**Version:** 1.0.0  
**Commit:** f282a93  

---

## Quick Start

### Import Dashboard Components

```javascript
import {
  RFQTabs,
  StatisticsCard,
  FilterBar,
  RFQCard,
  PendingTab,
  ActiveTab,
  HistoryTab,
  MessagesTab,
  FavoritesTab
} from '@/components';

import { useRFQDashboard } from '@/hooks/useRFQDashboard';
```

### Basic Usage

```javascript
import { useRFQDashboard } from '@/hooks/useRFQDashboard';

export default function Dashboard() {
  const {
    allRFQs,
    stats,
    pendingRFQs,
    activeRFQs,
    isLoading,
    setSearchQuery,
    formatDate,
    getDaysUntilDeadline
  } = useRFQDashboard();

  return (
    <div>
      {/* Display statistics */}
      <StatisticsCard stats={stats} isLoading={isLoading} />

      {/* Filter controls */}
      <FilterBar onSearch={setSearchQuery} />

      {/* Display RFQs */}
      {pendingRFQs.map(rfq => (
        <RFQCard
          key={rfq.id}
          rfq={rfq}
          formatDate={formatDate}
          getDaysUntilDeadline={getDaysUntilDeadline}
        />
      ))}
    </div>
  );
}
```

---

## Component Props

### StatisticsCard

```javascript
<StatisticsCard
  stats={{
    total: number,
    pending: number,
    active: number,
    completed: number,
    newQuotesThisWeek: number,
    onTimeClosureRate: number
  }}
  isLoading={boolean}
/>
```

### RFQTabs

```javascript
<RFQTabs
  activeTab="pending" // pending|active|history|messages|favorites
  onTabChange={(tab) => {}}
  stats={{
    pending: number,
    active: number,
    completed: number,
    unreadMessages: number
  }}
/>
```

### FilterBar

```javascript
<FilterBar
  onSearch={(query) => {}}
  onStatusFilter={(status) => {}}
  onDateRangeFilter={(range) => {}}
  onSort={(sort) => {}}
  searchValue=""
  statusValue="all"
  dateRangeValue="all"
  sortValue="latest"
/>
```

### RFQCard

```javascript
<RFQCard
  rfq={rfqObject}
  onViewQuotes={(id) => {}}
  onViewDetails={(id) => {}}
  onMessage={(id) => {}}
  onFavorite={(id) => {}}
  formatDate={(date) => {}}
  getDaysUntilDeadline={(deadline) => {}}
  getStatusStyles={(rfq) => {}}
  getPriceStats={(rfq) => {}}
/>
```

### Tab Components

```javascript
<PendingTab
  rfqs={[]}
  onViewQuotes={(id) => {}}
  onViewDetails={(id) => {}}
  onMessage={(id) => {}}
  onFavorite={(id) => {}}
  isLoading={false}
  formatDate={(date) => {}}
  getDaysUntilDeadline={(deadline) => {}}
  getStatusStyles={(rfq) => {}}
  getPriceStats={(rfq) => {}}
/>

// Same props for ActiveTab, HistoryTab, FavoritesTab

<MessagesTab
  messages={[]}
  rfqs={[]}
  onOpenThread={(thread) => {}}
  isLoading={false}
  formatDate={(date) => {}}
/>
```

---

## useRFQDashboard Hook API

### State

```javascript
const {
  allRFQs,              // All user RFQs with responses
  filteredRFQs,         // RFQs after current filters
  stats,                // Aggregated statistics
  pendingRFQs,          // RFQs with < 2 quotes
  activeRFQs,           // RFQs with 2+ quotes
  historyRFQs,          // Closed/completed RFQs
  isLoading,            // Loading state
  error                 // Error message if any
} = useRFQDashboard();
```

### Filters

```javascript
const {
  setSearchQuery,       // Set text search
  setStatusFilter,      // Set status (all, pending, active, closed)
  setDateRangeFilter,   // Set date range (all, week, month, quarter)
  setSortBy             // Set sort (latest, oldest, deadline-soon, etc)
} = useRFQDashboard();
```

### Utilities

```javascript
const {
  formatDate,           // (date) => 'Jan 15, 2024'
  getDaysUntilDeadline, // (deadline) => 3
  getStatusStyles,      // (rfq) => { bg, text, label }
  getPriceStats         // (rfq) => { min, max, avg }
} = useRFQDashboard();
```

### Actions

```javascript
const {
  toggleFavorite,       // (rfqId) => void
  updateRFQStatus,      // (rfqId, status) => void
  fetchRFQs             // () => Promise<void>
} = useRFQDashboard();
```

---

## API Endpoints

### GET /api/rfqs/pending

**Fetch pending RFQs (< 2 quotes)**

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/rfqs/pending?search=laptop&sort=latest&limit=10"
```

### GET /api/rfqs/active

**Fetch active RFQs (2+ quotes) with price stats**

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/rfqs/active?sort=price-low&limit=20"
```

### GET /api/rfqs/history

**Fetch completed/closed RFQs**

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/rfqs/history?dateRange=month&limit=30"
```

### GET /api/rfqs/stats

**Fetch aggregated statistics**

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/rfqs/stats"
```

---

## Filter Options

### Status Values
- `all` - All RFQs
- `pending` - RFQs with < 2 quotes
- `active` - RFQs with 2+ quotes
- `completed` - Completed status
- `closed` - Closed status

### Date Range Values
- `all` - All time
- `week` - Last 7 days
- `month` - Last 30 days
- `quarter` - Last 90 days
- `custom` - Custom date range (not fully implemented)

### Sort Values
- `latest` - Newest first
- `oldest` - Oldest first
- `deadline-soon` - Earliest deadline
- `deadline-far` - Latest deadline
- `quotes-most` - Most quotes first
- `quotes-least` - Fewest quotes first
- `price-low` - Lowest price first
- `price-high` - Highest price first

---

## Styling

### Color Scheme

**Status Badges:**
- Pending: Yellow (`bg-yellow-100`, `text-yellow-700`)
- Active: Green (`bg-green-100`, `text-green-700`)
- Completed: Emerald (`bg-emerald-100`, `text-emerald-700`)
- Closed: Gray (`bg-slate-100`, `text-slate-700`)

**KPI Cards:**
- Total: Blue
- Pending: Yellow
- Active: Green
- Completed: Emerald
- New This Week: Purple
- On-Time Rate: Orange

**Closures:**
- Overdue: Red (days left < 0)
- Closing Soon: Orange (0 ≤ days left ≤ 3)
- Normal: Green (days left > 3)

---

## Key Formulas

### On-Time Closure Rate
```javascript
(closures on or before deadline / total completed RFQs) * 100
```

### Average Quote Price
```javascript
sum of all quote prices / number of quotes
```

### Price Variance
```javascript
max price - min price
```

### Average Response Time (Days)
```javascript
sum of (quote date - RFQ date) / number of quotes
```

### New Quotes This Week
```javascript
quotes created in last 7 days
```

---

## Common Tasks

### Get All Pending RFQs

```javascript
const { pendingRFQs } = useRFQDashboard();
// pendingRFQs contains all RFQs with < 2 quotes
```

### Search for RFQs

```javascript
const { setSearchQuery } = useRFQDashboard();
setSearchQuery('laptop'); // Searches title, description, category
```

### Filter by Date Range

```javascript
const { setDateRangeFilter } = useRFQDashboard();
setDateRangeFilter('month'); // Last 30 days
```

### Sort by Deadline

```javascript
const { setSortBy } = useRFQDashboard();
setSortBy('deadline-soon'); // Soonest deadline first
```

### Star/Favorite an RFQ

```javascript
const { toggleFavorite } = useRFQDashboard();
toggleFavorite(rfqId);
```

### Get Formatted Date

```javascript
const { formatDate } = useRFQDashboard();
const formatted = formatDate('2024-01-15'); // 'Jan 15, 2024'
```

### Check Days Until Deadline

```javascript
const { getDaysUntilDeadline } = useRFQDashboard();
const daysLeft = getDaysUntilDeadline('2024-01-20');
// Returns negative if overdue, positive if future
```

### Get Price Statistics for RFQ

```javascript
const { getPriceStats } = useRFQDashboard();
const stats = getPriceStats(rfq);
// Returns { min, max, avg }
```

---

## Performance Tips

1. **Use pagination** for large RFQ lists
2. **Debounce search** to 300ms
3. **Lazy load tab content** to switch tabs instantly
4. **Cache stats** if they don't change frequently
5. **Virtualize long lists** for 100+ RFQs

---

## Error Handling

```javascript
const { error, isLoading } = useRFQDashboard();

if (error) {
  return <div className="text-red-600">{error}</div>;
}

if (isLoading) {
  return <LoadingSpinner />;
}
```

---

## File Structure

```
components/
├── RFQTabs.js
├── StatisticsCard.js
├── FilterBar.js
├── RFQCard.js
├── PendingTab.js
├── ActiveTab.js
├── HistoryTab.js
├── MessagesTab.js
├── FavoritesTab.js
└── index.js

hooks/
└── useRFQDashboard.js

pages/api/rfqs/
├── pending.ts
├── active.ts
├── history.ts
└── stats.ts

app/
└── my-rfqs/
    └── page.js
```

---

## Database Migrations

### Add Favorites Support

```sql
ALTER TABLE rfqs ADD COLUMN is_favorite BOOLEAN DEFAULT false;
CREATE INDEX idx_rfqs_favorite ON rfqs(user_id, is_favorite);
```

---

## Testing

### Test Filters

```javascript
import { useRFQDashboard } from '@/hooks/useRFQDashboard';

const { pendingRFQs, activeRFQs, setStatusFilter } = useRFQDashboard();
setStatusFilter('pending');
expect(pendingRFQs).toHaveLength(n);
```

### Test Search

```javascript
const { filteredRFQs, setSearchQuery } = useRFQDashboard();
setSearchQuery('laptop');
expect(filteredRFQs[0].title).toContain('laptop');
```

### Test API

```javascript
const response = await fetch('/api/rfqs/stats', {
  headers: { Authorization: `Bearer ${token}` }
});
const stats = await response.json();
expect(stats.success).toBe(true);
expect(stats.data.total).toBeGreaterThanOrEqual(0);
```

---

## Troubleshooting

### RFQs not appearing
- Check `is_favorite` column exists (if filtering favorites)
- Verify user authentication token
- Check browser console for errors

### Statistics not updating
- Call `fetchRFQs()` to refresh data
- Check network tab for API errors
- Verify database permissions

### Filters not working
- Check filter value is valid option
- Verify `setSearchQuery` being called
- Check component receiving correct props

---

## Links

- **Documentation:** TASK8_USER_DASHBOARD_COMPLETE.md
- **Main Page:** app/my-rfqs/page.js
- **Hook:** hooks/useRFQDashboard.js
- **GitHub Commit:** f282a93

