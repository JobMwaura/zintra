## Dashboard (/my-rfqs) Audit Report

### Issues Found

#### 🔴 **CRITICAL: toggleFavorite Not Implemented**
- **Location**: `hooks/useRFQDashboard.js` line 357
- **Issue**: Function only logs, doesn't persist to database
- **Current Code**:
  ```javascript
  const toggleFavorite = useCallback((rfqId) => {
    // TODO: Implement favorite functionality with database
    console.log('Toggle favorite for RFQ:', rfqId);
  }, []);
  ```
- **Impact**: Favorite button doesn't work, changes aren't saved
- **Fix**: Implement database update + local state management

#### 🔴 **CRITICAL: Data Structure Mismatch**
- **Location**: `hooks/useRFQDashboard.js` line 52
- **Issue**: Fetching `budget_range` but RFQ schema has `budget_min` and `budget_max`
- **Current Code**:
  ```javascript
  .select(`
    id,
    title,
    description,
    category,
    budget_range,    // ❌ WRONG - doesn't exist in schema
    location,
    county,
    ...
  `)
  ```
- **Impact**: Budget data isn't fetched, display shows undefined
- **Fix**: Change to `budget_min, budget_max`

#### 🟡 **MAJOR: Real-time Updates Not Working Properly**
- **Location**: `hooks/useRFQDashboard.js` line 44 & `app/my-rfqs/page.js`
- **Issue**: 
  - Hook uses `useEffect` to fetch on mount, but not on visibility change properly
  - Changes in one tab don't immediately reflect in other tabs
  - Favorite toggle on one card doesn't update others
- **Impact**: Users must refresh to see updated data
- **Fix**: Add proper state update after mutations

#### 🟡 **MAJOR: Favorite State is Local Only**
- **Location**: `components/RFQCard.js` line 21-22
- **Issue**: `isFavorite` state is local to each card component
  ```javascript
  const [isFavorite, setIsFavorite] = useState(false);
  ```
- **Impact**: 
  - Favorite state is lost on page refresh
  - State doesn't sync between cards showing the same RFQ
  - Favorites tab won't work properly

#### 🟡 **MAJOR: Missing is_favorite Column in RFQs Table**
- **Location**: Database schema
- **Issue**: `is_favorite` column is referenced in code but may not exist in database
- **Impact**: Can't persist favorites

#### 🟠 **MEDIUM: useRFQDashboard Creates New Supabase Client**
- **Location**: `hooks/useRFQDashboard.js` line 18-27
- **Issue**: Creates client with useRef every time, but doesn't use shared singleton
- **Impact**: Multiple client instances (same issue as RFQ details page)
- **Fix**: Use shared singleton from `@/lib/supabaseClient`

---

### Summary of Required Fixes

1. **Implement toggleFavorite function** with database persistence
2. **Fix budget field selection** in RFQs query
3. **Add is_favorite column** to rfqs table (if missing)
4. **Move favorite state** from component to hook/parent
5. **Fix real-time updates** with proper refetch after mutations
6. **Use shared Supabase client** singleton

---

### Button Functionality Status

| Button | Status | Issue |
|--------|--------|-------|
| Create RFQ | ✅ Working | Navigates correctly to /post-rfq |
| Refresh | ✅ Working | Calls fetchRFQs correctly |
| Compare Quotes | ✅ Should Work | Navigates to /quote-comparison/[id] |
| View Details | ✅ Should Work | Navigates to /rfqs/[id] |
| Message | ✅ Should Work | Navigates to /messages?rfq=[id] |
| Add to Favorites | ❌ Not Working | toggleFavorite not implemented, state lost on refresh |
| More Menu Options | ❌ Partially | View Details works, Send Reminder has no handler |
| Tab Switching | ✅ Working | Tab state updates |
| Filter/Search | ✅ Working | Filters data correctly |

---

### Data Flow Issues

**Current (Broken)**:
```
RFQCard (local state) → onFavorite callback → toggleFavorite (logs only) → No update
```

**Should Be**:
```
RFQCard (derives from parent) → onFavorite callback → toggleFavorite → DB update → 
Local state update → Parent re-renders → Card reflects change
```

---

### Next Steps

1. Fix toggleFavorite to update database
2. Add is_favorite to RFQs table
3. Move favorite state to hook level
4. Fix budget_range → budget_min/budget_max
5. Implement proper refetch after mutations
6. Use shared Supabase client
