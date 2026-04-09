# 🏗️ Zintra Career Centre - Implementation Guide

**Date:** January 17, 2026  
**Status:** ✅ Complete - Ready for API Integration  
**Stack:** Next.js 14+, React 18+, TypeScript, Tailwind CSS

---

## 📁 File Structure

```
zintra-platform-backup/
├── app/
│   └── careers/
│       └── page.tsx                    # Main career centre landing page
├── components/
│   └── careers/
│       ├── HeroSearch.tsx              # Hero section with search bar
│       ├── TrustStrip.tsx              # Trust indicators (4 items)
│       ├── FeaturedEmployers.tsx       # Employer cards grid (6 items)
│       ├── TrendingRoles.tsx           # Trending job roles pills
│       ├── FastHireGigs.tsx            # Fast-hire gig cards (4 items)
│       ├── TopRatedTalent.tsx          # Worker/vendor profile cards (6 items)
│       ├── HowItWorks.tsx              # Two-column process guide
│       └── SafetyNote.tsx              # Safety & reporting section
└── lib/
    └── careers-mock-data.ts            # All mock data arrays
```

---

## 🎨 Component Overview

### **1. HeroSearch Component**
**File:** `components/careers/HeroSearch.tsx`

**Features:**
- Large hero banner with gradient background (orange Zintra brand colors)
- H1 headline: "Zintra Career Centre"
- Subtitle: "Connect with verified construction employers and gig opportunities across Kenya"
- 5 CTA buttons:
  - Primary: "Create Profile" (white button)
  - Secondary: "Find Jobs", "Find Gigs", "Post a Job", "Post a Gig" (outlined buttons)
- Advanced search form with fields:
  - Role/Skill (text input)
  - Location (text input)
  - Type (dropdown: Job, Gig, Both)
  - Pay Range (dropdown: 5 tiers from KES 0 to 20,000+)
  - Start Date (date picker)
  - Search & Clear buttons
- Fully responsive (mobile-first design)
- Form state managed with `useState`

**TODO Comments:**
- Route: `/careers/jobs`, `/careers/gigs`, `/careers/post-job`, `/careers/post-gig`
- Search form integration needs API call to `/api/careers/search`

---

### **2. TrustStrip Component**
**File:** `components/careers/TrustStrip.tsx`

**Features:**
- 4-item grid trust indicators
- Each item has:
  - Large emoji/icon
  - Title
  - Short description
- Responsive: 1 column (mobile) → 2 columns (tablet) → 4 columns (desktop)

**Data:**
- ✓ Verified Employers
- 🛡️ Anti-Scam Checks
- 💬 Secure Messaging
- 💰 Clear Pay Ranges

---

### **3. FeaturedEmployers Component**
**File:** `components/careers/FeaturedEmployers.tsx`

**Features:**
- 6-card grid of employer listings
- Each card displays:
  - Logo (emoji placeholder)
  - Company name
  - "Verified" badge (green, with checkmark)
  - Location with 📍 emoji
  - Job count badge
- Hover shadow effect
- Cards are clickable/hovered states prepared

**Mock Data:**
- 6 Kenyan construction companies
- Mix of verified/unverified
- Multiple locations (Nairobi, Mombasa, Kisumu, Nakuru)

**TODO:**
- Link cards to employer detail pages: `/careers/employers/[id]`
- API integration: `/api/careers/employers`

---

### **4. TrendingRoles Component**
**File:** `components/careers/TrendingRoles.tsx`

**Features:**
- Horizontal scrolling (flex wrap) of role pills
- Each pill is a clickable link
- Styled as rounded buttons with border
- Hover effect: orange background with white text
- Links to: `/careers/jobs?role=RoleName`

**Mock Roles:**
- 10 trending roles (Mason, Electrician, Plumber, etc.)

**TODO:**
- Dynamic trending roles from `/api/careers/trending-roles`

---

### **5. FastHireGigs Component**
**File:** `components/careers/FastHireGigs.tsx`

**Features:**
- 4-card grid of available gigs
- Each card shows:
  - Orange header with role name & employer
  - Location (📍)
  - Duration & start date (side by side)
  - Daily pay (highlighted in orange)
  - Applicant count
  - "Apply Now" button
- Dates formatted using Intl API
- Responsive grid (1 → 2 → 4 columns)

**Mock Data:**
- 4 gigs with realistic details
- Pay ranges: 3,000 - 5,000 KES/day
- Various start dates & locations

**TODO:**
- Detail page: `/careers/gigs/[id]`
- Apply button action: POST to `/api/careers/gigs/[id]/apply`

---

### **6. TopRatedTalent Component**
**File:** `components/careers/TopRatedTalent.tsx`

**Features:**
- 6-card grid of worker profiles
- Each card displays:
  - Colored avatar circle (rotating 6 colors) with initials
  - Name & role
  - County location (📍)
  - Star rating & review count (⭐)
  - "Tools Ready" badge (🛠️) if applicable
  - "View Profile" button
- Centered, card-based layout
- Hover effects

**Mock Data:**
- 6 top-rated workers
- Ratings: 4.6 - 4.9 stars
- Mix of tools-ready status
- Various counties

**TODO:**
- Profile page: `/careers/talent/[id]`
- Hire button integration

---

### **7. HowItWorks Component**
**File:** `components/careers/HowItWorks.tsx`

**Features:**
- Two-column layout (responsive to single column on mobile)
- Left side: "For Workers" (👷 icon, blue steps)
- Right side: "For Employers" (🏢 icon, orange steps)
- Each side shows 3 steps:
  - Numbered circle with icon
  - Vertical line connector to next step
  - Title & short description
- Clean, easy-to-scan design

**Workers Flow:**
1. Create Your Profile
2. Browse & Apply
3. Get Hired & Earn

**Employers Flow:**
1. Post a Job or Gig
2. Find Your Team
3. Manage & Communicate

---

### **8. SafetyNote Component**
**File:** `components/careers/SafetyNote.tsx`

**Features:**
- Blue warning banner at bottom
- Alert icon (🚨) from lucide-react
- Safety message paragraph
- Two action buttons:
  - "Report a Job" button (solid blue)
  - "Career Advice & Tips" link (outlined, goes to `/careers/safety`)
- Accessible and prominent

**TODO:**
- Report modal/form integration
- `/careers/safety` page with tips

---

## 📊 Mock Data Structure

**File:** `lib/careers-mock-data.ts`

### **Data Arrays:**

1. **mockEmployers** (6 items)
   - id, name, logo, location, verified, jobCount

2. **mockTrendingRoles** (10 items)
   - Array of strings (role names)

3. **mockGigs** (4 items)
   - id, role, location, duration, pay, startDate, employer, applicants

4. **mockTopRatedWorkers** (6 items)
   - id, name, initials, role, county, rating, reviews, toolsReady

5. **payRanges** (5 items)
   - Dropdown options for search form

6. **howItWorksWorkers** (3 steps)
   - step, title, description

7. **howItWorksEmployers** (3 steps)
   - step, title, description

8. **trustItems** (4 items)
   - id, icon, title, description

---

## 🚀 How to Use

### **View the Page:**
```bash
# Navigate to the app
cd /Users/macbookpro2/Desktop/zintra-platform-backup

# Install dependencies (if needed)
npm install

# Run dev server
npm run dev

# Visit in browser
http://localhost:3000/careers
```

---

## 🔗 Routing & Navigation

All components use `next/link` for navigation. Routes implemented/ready:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/careers` | CareersPage | Landing page |
| `/careers/jobs` | TBD | Job listings (search results) |
| `/careers/gigs` | TBD | Gig listings (search results) |
| `/careers/post-job` | TBD | Post a job form |
| `/careers/post-gig` | TBD | Post a gig form |
| `/careers/profile` | TBD | Create/edit worker profile |
| `/careers/employers/[id]` | TBD | Employer detail page |
| `/careers/gigs/[id]` | TBD | Gig detail page |
| `/careers/talent/[id]` | TBD | Worker profile page |
| `/careers/safety` | TBD | Safety & tips page |

**TODO:** Create these pages as needed.

---

## 🎨 Styling Notes

### **Color Scheme:**
- Primary: `#ea8f1e` (Zintra orange)
- Secondary: `#f59e0b` (lighter orange)
- Dark: `#d97706` (darker orange hover state)
- Neutral: Tailwind gray scale
- Success: Green for verified badges
- Info: Blue for safety section

### **Typography:**
- Headings: Bold, large (3xl-6xl)
- Body: Gray-600 for descriptions
- Labels: Small, semibold, gray-700

### **Spacing:**
- Sections: `py-12 sm:py-16 lg:py-20`
- Container: `max-w-6xl`
- Gaps: `gap-6`, responsive adjustments

### **Responsive:**
- Mobile-first approach
- `sm:` for tablets
- `lg:` for desktops
- All grids adjust column count by breakpoint

---

## 🔄 API Integration TODOs

### **Phase 1: Employers & Gigs**
```
GET /api/careers/employers
GET /api/careers/employers/:id
GET /api/careers/gigs
GET /api/careers/gigs/:id
POST /api/careers/gigs/:id/apply
```

### **Phase 2: Workers & Ratings**
```
GET /api/careers/workers
GET /api/careers/workers/:id
GET /api/careers/workers/:id/reviews
```

### **Phase 3: Search & Trends**
```
GET /api/careers/search (query params: role, location, type, payRange)
GET /api/careers/trending-roles
```

### **Phase 4: Reporting & Safety**
```
POST /api/careers/report-job
POST /api/careers/report-worker
```

---

## ✅ Accessibility Features

- Semantic HTML (`section`, `button`, `form`, `input`)
- ARIA-friendly labels on all form inputs
- Keyboard-navigable (all buttons/links work with Tab & Enter)
- Good color contrast (WCAG AA compliant)
- Form validation ready (placeholder attributes clear)
- Icon+text pairs (emojis have text descriptions)

---

## 📱 Responsive Breakpoints

| Breakpoint | Device | Grid Cols | Changes |
|-----------|--------|-----------|---------|
| `<640px` | Mobile | 1 | Stacked, full width |
| `640px-1024px` | Tablet | 2 | Two columns, adjusted padding |
| `>1024px` | Desktop | 3-4 | Full grid layout |

---

## 🧪 Testing Checklist

- [ ] HeroSearch renders correctly
- [ ] Search form submits (check console)
- [ ] All CTA buttons navigate correctly
- [ ] TrustStrip displays all 4 items
- [ ] FeaturedEmployers grid shows 6 cards
- [ ] TrendingRoles pills are clickable links
- [ ] FastHireGigs shows 4 cards with all info
- [ ] TopRatedTalent displays avatars with colors
- [ ] HowItWorks shows both columns (2 on desktop, 1 on mobile)
- [ ] SafetyNote banner is visible at bottom
- [ ] All components responsive on mobile/tablet/desktop
- [ ] No console errors or missing imports

---

## 🚀 Next Steps

1. **Test the page:** Run dev server and visit `/careers`
2. **Add missing routes:** Create detail pages for jobs, gigs, talent, employers
3. **API integration:** Replace mock data with actual API calls
4. **Customize:** Adjust colors, text, images to match Zintra brand
5. **Analytics:** Add tracking for CTAs and searches
6. **Backend:** Create database models for jobs, gigs, employers, workers

---

## 📝 Notes for Future Developers

- All components use `"use client"` where needed (interactivity)
- Mock data is in a separate file for easy maintenance
- TODO comments mark places for API integration
- Components are modular and can be reused elsewhere
- Search form state is local; implement submission logic
- Date formatting uses `toLocaleDateString` for Kenya locale
- Consider adding loading states when integrating APIs
- Add error handling for API failures
- Implement proper authentication for sensitive routes

---

## 🎯 Success Criteria

The Career Centre page is successful when:

✅ All 8 sections render correctly  
✅ All links navigate to proper routes  
✅ Search form is fully functional  
✅ Mobile-responsive on all devices  
✅ Accessible to keyboard & screen reader users  
✅ Mock data displays properly  
✅ Hover/focus states work on all interactive elements  
✅ No console errors or missing imports  

---

**Built with ❤️ for Zintra Platform**  
**Last Updated:** January 17, 2026
