# 🎯 Gigs Page - Complete Feature Documentation

## ✅ What's Implemented

### Two New Pages Created

1. **Gigs Listing Page** (`/careers/gigs`)
   - Browse all available gigs
   - Search and filter functionality
   - Responsive grid layout
   - Real-time gig counts

2. **Gig Detail Page** (`/careers/gigs/[id]`)
   - Full gig information
   - Employer details
   - Apply button with tracking
   - Pay range display
   - Timeline calculator

---

## 📄 Page 1: Gigs Listing (`/careers/gigs`)

### URL
```
https://zintra-sandy.vercel.app/careers/gigs
```

### Features

#### Search & Filters
- **Search Bar:** Find gigs by title, role, or skills
- **Location Filter:** Dropdown showing all available locations
- **Category Filter:** Dropdown showing all available categories
- **Clear Filters:** One-click to reset all filters

#### Gig Cards Display
Each gig shows:
- **Title** - Bold, prominent heading
- **Category** - Color-coded badge
- **Urgent Badge** - Red "URGENT" badge (high priority)
- **Company Name** - Employer company name
- **Description** - First 2 lines preview
- **Location** - With map pin icon
- **Duration** - Gig length or type
- **Start Date** - When the gig begins
- **Pay** - Pay range or "Negotiable"
- **View & Apply Button** - Orange CTA

#### Responsive Layout
- **Desktop:** 2-column grid
- **Tablet:** 2 columns
- **Mobile:** 1 column

#### States
- **Loading:** Shows LoadingSpinner
- **Error:** Red error box with retry button
- **No Results:** Empty state with filter clearing option
- **Results:** Count shows "Found X gigs"

### Data Source
Fetches from `listings` table:
```sql
SELECT 
  id, title, description, category, location,
  pay_min, pay_max, job_type, start_date, duration, status, type,
  created_at, employer:employer_id(company_name, logo_url)
WHERE type = 'gig' AND status = 'active'
ORDER BY created_at DESC
```

### Color Scheme
- **Header:** Orange gradient (from-orange-500 to-orange-600)
- **Urgent Badge:** Red (bg-red-600)
- **Pay Text:** Orange (text-orange-600)
- **Hover Effect:** Orange border + shadow
- **Buttons:** Orange (hover: darker orange)

---

## 📋 Page 2: Gig Detail (`/careers/gigs/[id]`)

### URL Pattern
```
/careers/gigs/[id]
Example: /careers/gigs/f9a7d123-4567-89ab-cdef-012345678901
```

### Layout

#### Header Section (Sticky)
- Back button → returns to gigs list
- Gig title (bold, large)
- Category (smaller text below)

#### Left Column (Main Content)

**Alert Banner** (if gig not active)
- Yellow warning box
- Shows gig status

**About This Gig Section**
- Full description with line breaks
- Gray box with padding

**Gig Details Section**
- 3-column grid on desktop, 2-column on tablet
- Each detail has:
  - Icon (colored orange)
  - Label (small caps)
  - Value (bold)

Details shown:
- Location (map icon)
- Duration (clock icon)
- Start Date (calendar icon)
- Min Pay (dollar icon)
- Max Pay (dollar icon)
- Timeline (briefcase icon)

**About The Employer Section**
- Employer logo (if available)
- Company name (bold)
- Company location
- Company description

**Similar Gigs CTA**
- Blue box with "View all gigs" link

#### Right Column (Sticky - Desktop Only)

**Pay Card** (Orange gradient)
- Large pay range display
- Application count badge
- Apply Now button (white text on orange, or green if applied)
- Share Gig button (bordered)

**Status Badge**
- Green dot if active
- Gray dot if inactive
- Status text (capitalize)

**Posted Date**
- When gig was created

---

## 🎨 UI Components & Styling

### Color Palette
```
Primary Orange: #ea8f1e (orange-500)
Dark Orange: hover state (orange-600)
Red: #dc2626 (red-600) - Urgent badges
Green: #22c55e - Applied/success state
Gray: gray-50 to gray-900 - Backgrounds and text
```

### Typography
- **Page Titles:** text-3xl sm:text-4xl font-bold
- **Section Titles:** text-xl font-bold
- **Card Titles:** text-lg font-bold
- **Labels:** text-xs font-bold uppercase
- **Values:** text-sm to text-lg font-bold

### Spacing
- **Page padding:** px-4 sm:px-6 lg:px-8
- **Section spacing:** py-8 (pages), p-6 (cards)
- **Grid gap:** gap-6 (gigs), gap-3 (details)

### Icons
From lucide-react:
- `ArrowLeft` - Back button
- `MapPin` - Location
- `Clock` - Duration/Date
- `DollarSign` - Pay
- `Calendar` - Start date
- `Briefcase` - Timeline
- `ChevronRight` - Call-to-action
- `AlertCircle` - Warnings
- `CheckCircle` - Applied status
- `Share2` - Share button

---

## 💾 Database Integration

### Listings Table
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY,
  employer_id UUID NOT NULL,
  type TEXT ('job' | 'gig'),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  location TEXT NOT NULL,
  pay_min DECIMAL,
  pay_max DECIMAL,
  pay_currency TEXT (default: 'KES'),
  job_type TEXT,
  start_date DATE,
  duration TEXT, -- "1 week", "3 days", etc
  status TEXT ('active' | 'paused' | 'closed' | 'filled'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Applications Table
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  worker_id UUID REFERENCES auth.users(id),
  status TEXT ('pending' | 'accepted' | 'rejected'),
  created_at TIMESTAMP
);
```

### Profiles (Employer) Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  company_name TEXT,
  logo_url TEXT,
  description TEXT,
  location TEXT
);
```

---

## 🔧 Implementation Details

### Gigs Page (`/careers/gigs/page.js`)

**Key State Variables:**
```javascript
const [gigs, setGigs] = useState([]);           // All active gigs
const [filteredGigs, setFilteredGigs] = useState([]); // Filtered results
const [searchTerm, setSearchTerm] = useState('');
const [filterLocation, setFilterLocation] = useState('');
const [filterCategory, setFilterCategory] = useState('');
const [locations, setLocations] = useState([]);  // For filter dropdown
const [categories, setCategories] = useState([]); // For filter dropdown
```

**Key Functions:**

```javascript
// Load gigs from Supabase
async function loadGigs() {
  const { data } = await supabase
    .from('listings')
    .select('...columns...')
    .eq('type', 'gig')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
}

// Apply all filters
function applyFilters() {
  let filtered = gigs;
  
  // Search filter
  if (searchTerm) {
    filtered = filtered.filter(g =>
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Location & Category filters
  if (filterLocation) filtered = filtered.filter(g => g.location === filterLocation);
  if (filterCategory) filtered = filtered.filter(g => g.category === filterCategory);
  
  setFilteredGigs(filtered);
}

// Navigate to detail page
function handleGigClick(gigId) {
  router.push(`/careers/gigs/${gigId}`);
}
```

**Suspense Boundary:**
```javascript
export default function GigsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GigsPageContent />
    </Suspense>
  );
}
```

This wraps `useSearchParams()` usage to prevent build errors.

---

### Gig Detail Page (`/careers/gigs/[id]/page.js`)

**Key State Variables:**
```javascript
const [gig, setGig] = useState(null);          // Full gig data
const [user, setUser] = useState(null);         // Current user (for apply)
const [applied, setApplied] = useState(false);  // Has user applied?
const [applying, setApplying] = useState(false); // Apply in progress
```

**Key Functions:**

```javascript
// Load gig details
async function loadGig() {
  const gigId = params.id;
  const { data } = await supabase
    .from('listings')
    .select('...all columns + employer info...')
    .eq('id', gigId)
    .eq('type', 'gig')
    .single();
}

// Apply to gig
async function handleApply() {
  if (!user) {
    router.push('/careers/auth/login');
    return;
  }
  
  // Check if already applied
  const { data: existingApp } = await supabase
    .from('applications')
    .select('id')
    .eq('listing_id', gig.id)
    .eq('worker_id', user.id)
    .single();
  
  if (existingApp) {
    setApplied(true);
    return;
  }
  
  // Create new application
  await supabase
    .from('applications')
    .insert({
      listing_id: gig.id,
      worker_id: user.id,
      status: 'pending',
      created_at: new Date().toISOString()
    });
  
  setApplied(true);
}

// Format helpers
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0
  }).format(amount);
}

function timeUntilStart(startDate) {
  const daysUntil = Math.ceil((new Date(startDate) - new Date()) / (1000*60*60*24));
  if (daysUntil === 0) return 'Starts Today';
  if (daysUntil === 1) return 'Starts Tomorrow';
  if (daysUntil < 7) return `Starts in ${daysUntil} days`;
  return `Starts in ${Math.ceil(daysUntil/7)} weeks`;
}
```

---

## 🔒 Security & Authorization

### RLS Policies
The pages use Supabase RLS to:
- Only show active gigs (status = 'active')
- Only show gigs where type = 'gig'
- Allow anyone to read gig listings
- Require authentication to apply

### Application Creation
- User must be logged in to apply
- Prevents duplicate applications (checks before creating)
- Stores user_id as worker_id

---

## 📱 Mobile Responsiveness

### Breakpoints
- **Mobile (< 640px):** 1-column layout, full-width inputs
- **Tablet (640-1024px):** 2-column grid, side-by-side filters
- **Desktop (> 1024px):** Full layout with sticky right column

### Touch-Friendly
- Large button targets (44px minimum)
- Proper touch spacing
- Scrollable on mobile

---

## 🚀 Performance Optimizations

1. **Data Fetching:**
   - Select only needed columns
   - Filter on database (type, status)
   - Order by created_at

2. **Rendering:**
   - Client-side filtering for instant results
   - Lazy loading via Suspense
   - Pagination-ready (can add if needed)

3. **Images:**
   - Company logos sized appropriately
   - Lazy load with `next/image`

---

## 🧪 Testing Checklist

### Gigs Listing Page
- [ ] Navigate to `/careers/gigs`
- [ ] See list of all active gigs
- [ ] Search by title, role, skills - results update
- [ ] Filter by location - dropdown populates, results filter
- [ ] Filter by category - dropdown populates, results filter
- [ ] Combine multiple filters - all apply together
- [ ] Click "Clear Filters" - all filters reset
- [ ] Click gig card - navigates to detail page
- [ ] Test on mobile - single column, responsive
- [ ] Test on desktop - 2 columns, full layout
- [ ] No gigs state - shows with filter clearing option

### Gig Detail Page
- [ ] Navigate to gig detail from listing
- [ ] See full gig information
- [ ] See employer name and logo
- [ ] Pay range displays correctly (or "Negotiable")
- [ ] Timeline shows "Starts Today", "Tomorrow", "In X days", etc.
- [ ] Click "View & Apply" button
- [ ] If not logged in - redirects to login
- [ ] If logged in - creates application, shows "Applied" with green checkmark
- [ ] Second apply attempt - shows "Application Sent" (already applied)
- [ ] Application count updates
- [ ] Click "Back to Gigs" - returns to listing
- [ ] Click "Share Gig" - (can implement share sheet)
- [ ] Test on mobile - responsive layout, sticky card below content

---

## 🎯 Next Steps & Future Enhancements

### Phase 1 (Done)
✅ Create gigs listing page
✅ Create gig detail page
✅ Application tracking
✅ Search and filters

### Phase 2 (Coming)
- [ ] "My Applications" dashboard for workers
- [ ] Employer gigs management (/careers/employer/gigs)
- [ ] Post a gig form (/careers/post-gig)
- [ ] Gig status updates (pause, close, extend)
- [ ] Application status tracking (accepted, rejected)

### Phase 3 (Future)
- [ ] Saved/bookmarked gigs
- [ ] Gig recommendations based on profile
- [ ] Rating/review system for gigs
- [ ] Messaging between employer and worker
- [ ] Payment integration for gig completion

---

## 📊 Database Queries Reference

### Fetch All Active Gigs
```sql
SELECT 
  listings.*,
  employer:employer_id(company_name, logo_url, description, location),
  COUNT(applications.id) as application_count
FROM listings
LEFT JOIN applications ON listings.id = applications.listing_id
WHERE listings.type = 'gig' 
  AND listings.status = 'active'
GROUP BY listings.id
ORDER BY listings.created_at DESC;
```

### Fetch Single Gig with Details
```sql
SELECT 
  listings.*,
  employer:employer_id(id, company_name, logo_url, description, location),
  COUNT(applications.id) as application_count
FROM listings
LEFT JOIN applications ON listings.id = applications.listing_id
WHERE listings.id = $1 
  AND listings.type = 'gig'
GROUP BY listings.id;
```

### Apply to Gig
```sql
INSERT INTO applications (listing_id, worker_id, status, created_at)
VALUES ($1, $2, 'pending', now());
```

---

## ✨ Deployment Status

**Build Status:** ✅ Passing
**Deployment:** ✅ Vercel live
**Latest Commit:** f9fccaa

All pages are live and ready for testing:
- https://zintra-sandy.vercel.app/careers/gigs
- https://zintra-sandy.vercel.app/careers/gigs/[id]
