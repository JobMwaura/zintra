# 🔒 Earnings Privacy Policy Implementation

**Date**: 30 January 2026  
**Policy**: Hide individual earnings, show only completed gigs count  
**Requirement**: Employers must tag workers as "Hired/Completed" for count to register  

---

## Policy Overview

### What Changed
❌ **Before**: Could show earnings data  
✅ **After**: Only show completed gigs/jobs count

### How It Works
1. Worker completes a gig/job
2. Employer marks worker as "Hired" (confirms completion)
3. Count increases in worker's profile
4. No earnings information is visible anywhere

---

## Where Earnings Currently Show

### 1. Career Page Components

**File**: `components/careers/SuccessStories.js`
- **Current**: Shows `earnings: 'KES 45K/month'`, etc.
- **Change**: Replace with `completed_gigs: 234` or similar

**File**: `components/careers/LiveJobStats.js`
- **Current**: Shows `earnings: 'KES 50M+'`
- **Change**: Show `workers: 2,400+` instead (no earnings total)

### 2. Worker Profile Page

**File**: `app/careers/talent/[id]/page.js`
- **Current**: Mock data includes `completed_projects: 234`
- **Change**: Keep this, use it to display completed gigs
- **Remove**: Any earnings display

### 3. Mock Data

**File**: `lib/careers-mock-data.js`
- **Current**: Worker objects have `reviews` count
- **Add**: `completed_gigs` field
- **Remove**: Any earnings fields

### 4. TopRatedTalent Component

**File**: `components/careers/TopRatedTalent.js`
- **Current**: Shows rating + reviews
- **Change**: Consider showing completed gigs instead of or in addition to reviews

---

## Database Changes Needed

### New Field: Worker Completed Gigs

**Table**: `profiles` (for workers)

```sql
-- Add column to track completed gigs
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS completed_gigs INTEGER DEFAULT 0;

-- Add function to increment when job is marked as completed
CREATE OR REPLACE FUNCTION increment_completed_gigs(worker_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET completed_gigs = completed_gigs + 1
  WHERE id = worker_id;
END;
$$ LANGUAGE plpgsql;
```

### Job/Gig Completion Tracking

**How employers mark gigs as completed:**

When employer takes action "Hire/Complete" or "Mark as Completed":
1. Find all applications for that gig where `worker_id = X` and `status = 'accepted'`
2. Call `increment_completed_gigs(worker_id)`
3. Update application status to 'completed'

---

## Implementation Steps

### Step 1: Update Mock Data (5 min)
**File**: `lib/careers-mock-data.js`

```javascript
// BEFORE
export const mockTopRatedWorkers = [
  {
    id: 1,
    name: "James M.",
    role: "Mason",
    rating: 4.9,
    reviews: 127,
    // No earnings shown
  },
];

// AFTER
export const mockTopRatedWorkers = [
  {
    id: 1,
    name: "James M.",
    role: "Mason",
    rating: 4.9,
    reviews: 127,
    completed_gigs: 42, // NEW
  },
];
```

### Step 2: Update SuccessStories Component (10 min)
**File**: `components/careers/SuccessStories.js`

```javascript
// BEFORE
{
  name: 'James M.',
  earnings: 'KES 45K/month',
  testimonial: '...'
}

// AFTER
{
  name: 'James M.',
  completed_gigs: 42,
  testimonial: '...'
}

// In JSX, replace:
// <p className="text-xs text-gray-600 mb-1">Earnings</p>
// <p className="font-bold">{testimonial.earnings}</p>

// With:
// <p className="text-xs text-gray-600 mb-1">Completed Gigs</p>
// <p className="font-bold">{testimonial.completed_gigs}</p>
```

### Step 3: Update LiveJobStats Component (10 min)
**File**: `components/careers/LiveJobStats.js`

```javascript
// BEFORE
const stats = {
  workers: 2400,
  jobs: 15000,
  earnings: 'KES 50M+'
}

// AFTER
const stats = {
  workers: 2400,
  jobs: 15000,
  completed_gigs: 45000 // Sum of all worker completed_gigs
}

// And remove earnings stat from display
```

### Step 4: Update TopRatedTalent Component (15 min)
**File**: `components/careers/TopRatedTalent.js`

```javascript
// BEFORE
<span className="text-yellow-400 text-sm">⭐</span>
<span className="font-bold text-gray-900 text-sm">{worker.rating}</span>
<span className="text-xs text-gray-600">({worker.reviews})</span>

// AFTER
<span className="text-yellow-400 text-sm">⭐</span>
<span className="font-bold text-gray-900 text-sm">{worker.rating}</span>
<span className="text-xs text-gray-600">({worker.completed_gigs} gigs)</span>
```

### Step 5: Update Worker Profile Page (20 min)
**File**: `app/careers/talent/[id]/page.js`

```javascript
// In mock data section, ensure completed_gigs is set
const mockWorker = {
  ...existing,
  completed_gigs: 234, // Already in mock data
};

// In display section, show completed gigs stat
// Add new section or update existing stats area
```

### Step 6: Update Database Migration (if applicable)
Create migration to add `completed_gigs` column:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS completed_gigs INTEGER DEFAULT 0;

-- Create function to increment
CREATE OR REPLACE FUNCTION increment_completed_gigs(worker_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET completed_gigs = completed_gigs + 1,
      updated_at = NOW()
  WHERE id = worker_id AND account_type = 'worker';
END;
$$ LANGUAGE plpgsql;
```

### Step 7: Add API Endpoint (30 min)
**File**: `app/api/gigs/[gig_id]/complete/route.js` (NEW)

```javascript
// POST /api/gigs/[gig_id]/complete
// Body: { worker_id: UUID, employer_id: UUID }
// Action: Mark gig as completed, increment worker's completed_gigs

export async function POST(request, { params }) {
  try {
    const { gig_id } = params;
    const { worker_id, employer_id } = await request.json();

    // Verify employer owns this gig
    // Verify application exists and is accepted
    // Call increment_completed_gigs(worker_id)
    // Update application status to 'completed'

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

### Step 8: Update Job Card/Detail Components (30 min)
Any component showing individual gigs should:
- ❌ Remove earnings display
- ✅ Show employer info instead
- ✅ Show "Mark as Complete" button (if employer owns it)

---

## UI Changes Summary

### Before (What Users Saw)
```
Worker Card:
├─ Avatar
├─ Name: "James M."
├─ Role: "Mason"
├─ Location: "Nairobi"
├─ Rating: ⭐ 4.9
├─ Reviews: 127 reviews
└─ Button: View Profile

Success Story:
├─ Name
├─ Role
├─ Earnings: "KES 45K/month"  ❌ REMOVE THIS
└─ Testimonial
```

### After (What Users See Now)
```
Worker Card:
├─ Avatar
├─ Name: "James M."
├─ Role: "Mason"
├─ Location: "Nairobi"
├─ Rating: ⭐ 4.9
├─ Completed Gigs: 42 gigs  ✅ NEW
└─ Button: View Profile

Success Story:
├─ Name
├─ Role
├─ Completed Gigs: "42 gigs completed"  ✅ NEW
└─ Testimonial

Stats Section:
├─ Workers: "2,400+"
├─ Jobs Posted: "15,000+"
└─ Total Gigs Completed: "45,000+"  ✅ NEW (instead of earnings)
```

---

## Files to Update (Priority Order)

| File | Type | Change | Priority |
|------|------|--------|----------|
| `lib/careers-mock-data.js` | Mock Data | Add `completed_gigs` field | 🔴 First |
| `components/careers/SuccessStories.js` | Component | Replace earnings with gigs | 🔴 First |
| `components/careers/LiveJobStats.js` | Component | Replace earnings stat | 🔴 First |
| `components/careers/TopRatedTalent.js` | Component | Show gigs instead of reviews | 🟡 Second |
| `app/careers/talent/[id]/page.js` | Page | Display completed_gigs | 🟡 Second |
| Database migration | SQL | Add `completed_gigs` column | 🟡 Second |
| Job completion API | Route | Mark gigs complete, increment count | 🔵 Third |
| Gig detail components | Component | Remove earnings, add complete button | 🔵 Third |

---

## Testing Checklist

- [ ] Mock data shows completed_gigs instead of earnings
- [ ] Career page displays "42 gigs" instead of "KES 45K/month"
- [ ] Success stories show completed gigs
- [ ] Stats section shows total gigs (not earnings)
- [ ] Worker profile page shows completed gigs count
- [ ] No earnings values appear anywhere on public pages
- [ ] Database migration adds column successfully
- [ ] API endpoint marks gigs as completed
- [ ] Completed gigs count increments when employer marks complete
- [ ] Count persists after page reload

---

## Timeline

- **Step 1-3**: 25 minutes (quick wins)
- **Step 4-5**: 35 minutes (component updates)
- **Step 6-8**: 1 hour (database + API)
- **Testing**: 30 minutes
- **Total**: ~2 hours

---

## Security Notes

✅ **Privacy Protected**: No earnings visible on any public page  
✅ **Incentive Aligned**: Workers motivated to get hired/tagged by employers  
✅ **Employer Control**: Only employers can increment count (they mark complete)  
✅ **Fraud Prevention**: Can't manipulate count without employer action  

---

## Rollback Plan

If changes cause issues:

1. Revert component changes (remove gigs display)
2. Don't run database migration (completed_gigs won't exist)
3. App works as before (no gigs shown, no earnings shown)
4. No data loss

---

## Questions to Clarify

1. Should we show "Completed Gigs: 42" or "42 Gigs Completed" format?
2. Should the count be visible only on own profile or on all profiles?
3. Should there be a lifetime total or just this month/year?
4. Should we show "Completed Gigs / Total Gigs Applied" (e.g., "42 / 50")?
5. Who should be able to mark a gig as completed? Employer only? Both?

---

## Next Action

Ready to implement? Follow this order:
1. Start with Step 1 (update mock data)
2. Do Steps 2-3 (component changes)
3. Test on careers page
4. Then do Steps 4-8 (database + API)

Let me know when you want to proceed!
