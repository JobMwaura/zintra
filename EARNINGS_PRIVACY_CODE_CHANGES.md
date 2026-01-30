# 🔧 Earnings Privacy Implementation - Code Changes

**Status**: Ready to execute  
**Time Estimate**: 2 hours  
**Files to Change**: 8 files  

---

## Change 1: Update Mock Data

**File**: `lib/careers-mock-data.js`

**Location**: Lines 113-160

### Change

Add `completed_gigs` field to each worker:

```javascript
export const mockTopRatedWorkers = [
  {
    id: 1,
    name: "James M.",
    initials: "JM",
    role: "Mason",
    county: "Nairobi",
    rating: 4.9,
    reviews: 127,
    completed_gigs: 42,  // ✅ NEW
    toolsReady: true,
  },
  {
    id: 2,
    name: "Alice N.",
    initials: "AN",
    role: "Electrician",
    county: "Mombasa",
    rating: 4.8,
    reviews: 95,
    completed_gigs: 58,  // ✅ NEW
    toolsReady: true,
  },
  {
    id: 3,
    name: "David K.",
    initials: "DK",
    role: "Plumber",
    county: "Nakuru",
    rating: 4.7,
    reviews: 82,
    completed_gigs: 31,  // ✅ NEW
    toolsReady: false,
  },
  {
    id: 4,
    name: "Mercy W.",
    initials: "MW",
    role: "Carpenter",
    county: "Kisumu",
    rating: 4.9,
    reviews: 110,
    completed_gigs: 67,  // ✅ NEW
    toolsReady: true,
  },
  {
    id: 5,
    name: "Peter M.",
    initials: "PM",
    role: "Site Engineer",
    county: "Nairobi",
    rating: 4.6,
    reviews: 65,
    completed_gigs: 28,  // ✅ NEW
    toolsReady: true,
  },
  {
    id: 6,
    name: "Rose K.",
    initials: "RK",
    role: "Safety Officer",
    county: "Mombasa",
    rating: 4.8,
    reviews: 78,
    completed_gigs: 45,  // ✅ NEW
    toolsReady: false,
  },
];
```

---

## Change 2: Update SuccessStories Component

**File**: `components/careers/SuccessStories.js`

### Part A: Update Mock Data (Lines 24-50)

```javascript
const mockTestimonials = [
  {
    name: 'James M.',
    role: 'Mason',
    county: 'Nairobi',
    rating: 4.9,
    completed_gigs: 42,  // ✅ NEW - was: earnings: 'KES 45K/month'
    testimonial: 'Zintra helped me find consistent work. I can control my schedule and earn fairly for my skills.',
  },
  {
    name: 'Alice N.',
    role: 'Electrician',
    county: 'Mombasa',
    rating: 4.8,
    completed_gigs: 58,  // ✅ NEW - was: earnings: 'KES 35K-60K/month'
    testimonial: 'The platform connects me with quality employers. Payment is always on time.',
  },
  {
    name: 'David K.',
    role: 'Plumber',
    county: 'Nakuru',
    rating: 4.7,
    completed_gigs: 31,  // ✅ NEW - was: earnings: 'KES 75K-120K/month'
    testimonial: 'I love being my own boss. Zintra provides the flexibility and opportunities I need.',
  },
];
```

### Part B: Update JSX Display (Lines 147-150)

**Before**:
```javascript
<p className="text-xs text-gray-600 mb-1">Earnings</p>
<p className="font-bold text-orange-600">
  {testimonial.earnings}
</p>
```

**After**:
```javascript
<p className="text-xs text-gray-600 mb-1">Completed Gigs</p>
<p className="font-bold text-orange-600">
  {testimonial.completed_gigs} gigs
</p>
```

---

## Change 3: Update LiveJobStats Component

**File**: `components/careers/LiveJobStats.js`

### Part A: Update Stats Object (Lines 17-19 & 53-55)

**Before**:
```javascript
const stats = {
  workers: 'Join 2,400+',
  jobs: 'Over 15,000',
  earnings: 'KES 50M+'
};
```

**After**:
```javascript
const stats = {
  workers: 'Join 2,400+',
  jobs: 'Over 15,000',
  completed_gigs: 'Over 45,000'  // ✅ NEW - was: earnings
};
```

### Part B: Update Stats Labels (Lines 60-100)

**Before**:
```javascript
return [
  { number: stats.workers, label: 'Workers Trust Us' },
  { number: stats.jobs, label: 'Active Jobs' },
  { number: stats.earnings, label: 'Total Earnings Paid' }
];
```

**After**:
```javascript
return [
  { number: stats.workers, label: 'Workers Trust Us' },
  { number: stats.jobs, label: 'Active Jobs' },
  { number: stats.completed_gigs, label: 'Gigs Completed' }  // ✅ NEW
];
```

---

## Change 4: Update TopRatedTalent Component

**File**: `components/careers/TopRatedTalent.js`

### Location: Lines 65-75 (Rating & Reviews section)

**Before**:
```javascript
<div className="flex items-center gap-1">
  <span className="text-yellow-400 text-sm">⭐</span>
  <span className="font-bold text-gray-900 text-sm">{worker.rating}</span>
  <span className="text-xs text-gray-600">({worker.reviews})</span>
</div>
```

**After**:
```javascript
<div className="space-y-2">
  {/* Rating */}
  <div className="flex items-center gap-1">
    <span className="text-yellow-400 text-sm">⭐</span>
    <span className="font-bold text-gray-900 text-sm">{worker.rating}</span>
    <span className="text-xs text-gray-600">({worker.reviews})</span>
  </div>
  
  {/* Completed Gigs */}
  <div className="flex items-center gap-1">
    <span className="text-green-600 text-sm">✓</span>
    <span className="text-xs text-gray-600">
      {worker.completed_gigs} gigs completed
    </span>
  </div>
</div>
```

---

## Change 5: Update Worker Profile Page

**File**: `app/careers/talent/[id]/page.js`

### Part A: Update Mock Data (Lines 34-60)

Ensure mock worker includes `completed_gigs`:

```javascript
setWorker({
  id: mockWorker.id,
  full_name: mockWorker.name,
  avatar_url: null,
  city: mockWorker.county,
  phone: '+254700000000',
  email: `${mockWorker.initials.toLowerCase()}@zintra.com`,
  role: mockWorker.role,
  bio: `Experienced ${mockWorker.role} with excellent track record. Highly skilled and professional.`,
  skills: ['Masonry', 'Bricklaying', 'Foundation Work', 'Finishing'],
  experience: 8,
  certifications: ['Construction Safety', 'Quality Assurance'],
  average_rating: mockWorker.rating,
  ratings_count: mockWorker.reviews,
  completed_gigs: mockWorker.completed_gigs,  // ✅ NEW
  account_type: 'worker',
  created_at: '2024-01-01',
  reviews: [...existing reviews...],
  applications: [],
  completed_projects: 234,  // Keep this for compatibility
  success_rate: 98,
  response_time: '< 1 hour',
});
```

### Part B: Add Stats Section (after Bio section, around line 280)

Add new section to display completed gigs:

```javascript
{/* Completed Gigs Stats */}
{worker.completed_gigs && (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
      <CheckCircle2 size={24} className="text-green-500" />
      Track Record
    </h2>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs text-gray-600 font-semibold mb-1">Gigs Completed</p>
        <p className="text-3xl font-bold text-gray-900">{worker.completed_gigs}</p>
      </div>
      <div>
        <p className="text-xs text-gray-600 font-semibold mb-1">Success Rate</p>
        <p className="text-3xl font-bold text-green-600">{worker.success_rate || 98}%</p>
      </div>
    </div>
  </div>
)}
```

---

## Change 6: Database Migration (Optional but Recommended)

**Create New File**: `supabase/migrations/add_completed_gigs.sql`

```sql
-- Add completed_gigs tracking to worker profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS completed_gigs INTEGER DEFAULT 0;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_completed_gigs 
ON profiles(completed_gigs) 
WHERE account_type = 'worker';

-- Function to safely increment completed gigs
CREATE OR REPLACE FUNCTION increment_completed_gigs(
  p_worker_id UUID,
  p_increment INTEGER DEFAULT 1
)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    completed_gigs = completed_gigs + p_increment,
    updated_at = NOW()
  WHERE 
    id = p_worker_id 
    AND account_type = 'worker';
END;
$$ LANGUAGE plpgsql;

-- Function to get worker stats including completed gigs
CREATE OR REPLACE FUNCTION get_worker_stats(p_worker_id UUID)
RETURNS TABLE (
  completed_gigs INTEGER,
  average_rating NUMERIC,
  ratings_count INTEGER,
  full_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    profiles.completed_gigs,
    profiles.average_rating,
    profiles.ratings_count,
    profiles.full_name
  FROM profiles
  WHERE profiles.id = p_worker_id AND profiles.account_type = 'worker';
END;
$$ LANGUAGE plpgsql;
```

---

## Change 7: API Route for Marking Gigs Complete

**Create New File**: `app/api/gigs/[gig_id]/mark-complete/route.js`

```javascript
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase server-side client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request, { params }) {
  try {
    const { gig_id } = params;
    const { worker_id, employer_id } = await request.json();

    // Verify required fields
    if (!worker_id || !employer_id) {
      return Response.json(
        { error: 'worker_id and employer_id required' },
        { status: 400 }
      );
    }

    // Verify employer owns the gig
    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .select('id, employer_id')
      .eq('id', gig_id)
      .single();

    if (gigError || !gig) {
      return Response.json(
        { error: 'Gig not found' },
        { status: 404 }
      );
    }

    if (gig.employer_id !== employer_id) {
      return Response.json(
        { error: 'Unauthorized - not gig owner' },
        { status: 403 }
      );
    }

    // Get worker's current stats
    const { data: workerStats, error: statsError } = await supabase
      .rpc('get_worker_stats', { p_worker_id: worker_id });

    if (statsError) {
      console.error('Error fetching worker stats:', statsError);
    }

    // Increment worker's completed gigs
    const { error: incrementError } = await supabase
      .rpc('increment_completed_gigs', {
        p_worker_id: worker_id,
        p_increment: 1
      });

    if (incrementError) {
      return Response.json(
        { error: 'Failed to update completed gigs count' },
        { status: 500 }
      );
    }

    // Update application status to 'completed'
    const { error: updateError } = await supabase
      .from('applications')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('gig_id', gig_id)
      .eq('worker_id', worker_id);

    if (updateError) {
      console.error('Error updating application:', updateError);
    }

    // Return updated stats
    const { data: updatedWorker } = await supabase
      .from('profiles')
      .select('completed_gigs, average_rating, ratings_count')
      .eq('id', worker_id)
      .single();

    return Response.json({
      success: true,
      message: 'Gig marked as completed',
      worker_stats: updatedWorker
    });

  } catch (error) {
    console.error('Error marking gig complete:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## Change 8: Update Gig Detail Component (Optional)

**File**: `app/careers/gigs/[id]/page.js` or wherever gig details are shown

Add button for employer to mark gig as complete:

```javascript
{/* Mark Complete Button (for employer) */}
{isEmployer && application?.status === 'accepted' && (
  <button
    onClick={handleMarkComplete}
    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition"
  >
    ✓ Mark This Worker as Hired/Completed
  </button>
)}

// Handler function:
async function handleMarkComplete() {
  try {
    const response = await fetch(`/api/gigs/${gigId}/mark-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        worker_id: application.worker_id,
        employer_id: user.id
      })
    });

    if (!response.ok) {
      throw new Error('Failed to mark gig as completed');
    }

    const data = await response.json();
    console.log('✓ Worker tagged as hired!', data.worker_stats);
    
    // Refresh component or show success message
    setApplication({ ...application, status: 'completed' });
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## Implementation Checklist

### Phase 1: Component Updates (30 min)
- [ ] Update `lib/careers-mock-data.js` (Change 1)
- [ ] Update `components/careers/SuccessStories.js` (Change 2)
- [ ] Update `components/careers/LiveJobStats.js` (Change 3)
- [ ] Update `components/careers/TopRatedTalent.js` (Change 4)
- [ ] Test careers page - should show gigs, not earnings

### Phase 2: Profile Page (15 min)
- [ ] Update `app/careers/talent/[id]/page.js` (Change 5)
- [ ] Test profile page - should show completed gigs stat
- [ ] Verify no earnings values appear anywhere

### Phase 3: Backend (45 min)
- [ ] Create database migration file (Change 6)
- [ ] Run migration in Supabase
- [ ] Create API route for marking complete (Change 7)
- [ ] Test API endpoint

### Phase 4: Integration (30 min)
- [ ] Add "Mark Complete" button to gig details (Change 8)
- [ ] Test complete flow: employer marks complete → count increases
- [ ] Verify count persists

### Phase 5: Testing (20 min)
- [ ] Career page shows gigs not earnings ✓
- [ ] Profile shows completed gigs ✓
- [ ] No earnings values anywhere ✓
- [ ] Count increments on completion ✓
- [ ] Mobile responsive ✓

---

## Rollback Instructions

If something breaks:

```bash
# Revert database migration
# (don't run supabase/migrations/add_completed_gigs.sql)

# Revert component changes (git)
git checkout -- components/careers/
git checkout -- app/careers/talent/[id]/page.js

# Delete API route
rm app/api/gigs/[gig_id]/mark-complete/route.js

# Restart
npm run dev
```

---

## Success Indicators

✅ Career page shows "42 gigs" instead of "KES 45K/month"  
✅ Success stories mention gigs, not earnings  
✅ Stats show "45,000 Gigs Completed" not "KES 50M+ Earnings"  
✅ Worker profile shows completed gigs counter  
✅ No earnings displayed anywhere on public pages  
✅ Employer can mark worker as hired/completed  
✅ Count increases when marked complete  
✅ Mobile responsive and working  

---

## Next Steps

1. Review changes above
2. Clarify any questions (see questions in previous document)
3. Run Phase 1 implementation
4. Test on staging
5. Deploy to production

Ready to proceed?
