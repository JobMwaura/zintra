# 🎨 Portfolio Feature Specification v1.0

**Status:** 📋 Design Phase  
**Date:** January 7, 2026  
**Project:** Vendor Portfolio & Case Studies  
**Scope:** Major platform enhancement  

---

## 🎯 Executive Summary

Transform Zintra from a simple photo gallery platform into a structured **project portfolio & case-study system** that:

- ✅ Showcases vendor work with context (not just photos)
- ✅ Builds trust through before/after, materials, timeline data
- ✅ Accelerates RFQ creation via "Request Quote Like This"
- ✅ Increases quote conversion (users see exact outcomes they want)

**Expected Impact:**
- 40-60% increase in RFQ accuracy (vendors get better briefs)
- 25-35% higher quote acceptance (users see relevant work)
- Better vendor differentiation (quality portfolio = competitive advantage)

---

## 📊 Feature Overview

### User Flows

#### For Buyers/Users
```
Browse Platform
  ↓
Vendor Profile → Portfolio Tab
  ↓
Browse Projects Grid (filtered/searched)
  ↓
Click Project → Detail View
  ↓
3 options:
  • Request Quote Like This
  • Ask a Question
  • Save to My Ideas
```

#### For Vendors
```
Vendor Dashboard
  ↓
Portfolio Section
  ↓
Add Project (title, category, photos, description, facts)
  ↓
Project visible on public profile
  ↓
Users can: Request quotes, save, ask questions
  ↓
Vendor gets notifications + quote leads
```

#### For RFQ Creation (Pre-filled)
```
User clicks "Request Quote Like This" on portfolio
  ↓
RFQ Modal opens
  ↓
Auto-populated:
  • Vendor (pre-selected)
  • Category/Subcategory (from project)
  • Reference Project ID
  • Reference images attached
  ↓
User customizes for their needs
  ↓
Submit
```

---

## 🗄️ Database Schema

### Table 1: `vendor_portfolio_projects`

```sql
CREATE TABLE public.vendor_portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Project metadata
  title VARCHAR(255) NOT NULL,
  description TEXT, -- "Scope: re-roofing + waterproofing..."
  status VARCHAR(50) NOT NULL DEFAULT 'completed', -- completed | in_progress
  
  -- Categorization
  category_slug VARCHAR(100) NOT NULL, -- "roofing", "interior-design", etc.
  subcategories TEXT[] DEFAULT '{}', -- ["waterproofing", "gutter-installation"]
  
  -- Location & timeline
  county VARCHAR(100), -- optional for privacy
  area VARCHAR(100), -- optional neighborhood/estate name
  timeline_type VARCHAR(50), -- "2 weeks", "1 month", "3 months", etc.
  
  -- Budget info (ranges, not exact)
  budget_range_min INTEGER, -- optional, in KES
  budget_range_max INTEGER, -- optional
  
  -- Quick facts
  materials_used TEXT[], -- ["mabati", "timber", "cement", "gutters"]
  client_type VARCHAR(50), -- "residential" | "commercial"
  site_visit_done BOOLEAN DEFAULT FALSE,
  
  -- Content settings
  allow_quote_requests BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  
  -- Media count (denormalized for performance)
  media_count INTEGER DEFAULT 0,
  cover_image_url VARCHAR(500), -- URL of primary image
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_vendor_portfolio_projects_vendor_id ON public.vendor_portfolio_projects(vendor_id);
CREATE INDEX idx_vendor_portfolio_projects_category ON public.vendor_portfolio_projects(category_slug);
CREATE INDEX idx_vendor_portfolio_projects_status ON public.vendor_portfolio_projects(status);
CREATE INDEX idx_vendor_portfolio_projects_is_featured ON public.vendor_portfolio_projects(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_vendor_portfolio_projects_created ON public.vendor_portfolio_projects(created_at DESC);

-- RLS Policy: Vendors can only see/edit own projects, users can view public projects
ALTER TABLE public.vendor_portfolio_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own projects"
  ON public.vendor_portfolio_projects
  FOR SELECT
  USING (
    vendor_id = auth.uid() OR 
    TRUE -- All can view (public)
  );

CREATE POLICY "Vendors can insert own projects"
  ON public.vendor_portfolio_projects
  FOR INSERT
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update own projects"
  ON public.vendor_portfolio_projects
  FOR UPDATE
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can delete own projects"
  ON public.vendor_portfolio_projects
  FOR DELETE
  USING (vendor_id = auth.uid());
```

### Table 2: `vendor_portfolio_media`

```sql
CREATE TABLE public.vendor_portfolio_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.vendor_portfolio_projects(id) ON DELETE CASCADE,
  
  -- Media info
  url VARCHAR(500) NOT NULL, -- S3 URL
  type VARCHAR(20) NOT NULL, -- 'image' | 'video'
  media_type VARCHAR(50), -- 'before' | 'after' | 'progress' | null (default)
  
  -- Display
  caption VARCHAR(255), -- Optional caption
  sort_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vendor_portfolio_media_project_id ON public.vendor_portfolio_media(project_id);
CREATE INDEX idx_vendor_portfolio_media_sort ON public.vendor_portfolio_media(project_id, sort_order);

-- RLS: Same access rules as projects table
ALTER TABLE public.vendor_portfolio_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access portfolio media through projects"
  ON public.vendor_portfolio_media
  FOR SELECT
  USING (
    (SELECT vendor_id FROM public.vendor_portfolio_projects WHERE id = project_id) = auth.uid() OR
    TRUE -- All can view
  );

CREATE POLICY "Vendors can insert own project media"
  ON public.vendor_portfolio_media
  FOR INSERT
  WITH CHECK (
    (SELECT vendor_id FROM public.vendor_portfolio_projects WHERE id = project_id) = auth.uid()
  );

CREATE POLICY "Vendors can update own project media"
  ON public.vendor_portfolio_media
  FOR UPDATE
  USING (
    (SELECT vendor_id FROM public.vendor_portfolio_projects WHERE id = project_id) = auth.uid()
  );

CREATE POLICY "Vendors can delete own project media"
  ON public.vendor_portfolio_media
  FOR DELETE
  USING (
    (SELECT vendor_id FROM public.vendor_portfolio_projects WHERE id = project_id) = auth.uid()
  );
```

### Table 3: `portfolio_project_saves`

```sql
CREATE TABLE public.portfolio_project_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.vendor_portfolio_projects(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicates
  UNIQUE(user_id, project_id)
);

-- Indexes
CREATE INDEX idx_portfolio_project_saves_user_id ON public.portfolio_project_saves(user_id);
CREATE INDEX idx_portfolio_project_saves_project_id ON public.portfolio_project_saves(project_id);

-- RLS
ALTER TABLE public.portfolio_project_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saves"
  ON public.portfolio_project_saves
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Update to `public.rfqs` table

```sql
-- Add portfolio reference columns
ALTER TABLE public.rfqs
ADD COLUMN reference_project_id UUID REFERENCES public.vendor_portfolio_projects(id) ON DELETE SET NULL,
ADD COLUMN reference_media_urls TEXT[];

-- Index for performance
CREATE INDEX idx_rfqs_reference_project ON public.rfqs(reference_project_id);
```

---

## 🛠️ API Endpoints

### Portfolio Projects

**GET** `/api/portfolio/projects`
- Fetch projects (with filtering, search, pagination)
- Query params: `vendor_id`, `category`, `status`, `search`, `page`, `limit`
- Public endpoint

**GET** `/api/portfolio/projects/:projectId`
- Get single project detail with media
- Public endpoint

**POST** `/api/portfolio/projects` (Protected - Vendor only)
- Create new project
- Body: title, description, category_slug, subcategories, status, etc.

**PUT** `/api/portfolio/projects/:projectId` (Protected - Vendor only)
- Update project
- Body: any updatable fields

**DELETE** `/api/portfolio/projects/:projectId` (Protected - Vendor only)
- Delete project

### Portfolio Media

**POST** `/api/portfolio/projects/:projectId/media` (Protected - Vendor only)
- Upload/add media to project
- Multipart form with file(s)
- Returns signed S3 URLs

**DELETE** `/api/portfolio/projects/:projectId/media/:mediaId` (Protected - Vendor only)
- Delete specific media

**PATCH** `/api/portfolio/projects/:projectId/media/:mediaId` (Protected - Vendor only)
- Reorder media, update captions
- Body: `sort_order`, `caption`, `media_type`

### Portfolio Saves

**POST** `/api/portfolio/projects/:projectId/save` (Protected - User only)
- Save project to wishlist

**DELETE** `/api/portfolio/projects/:projectId/save` (Protected - User only)
- Remove from wishlist

**GET** `/api/portfolio/saves` (Protected - User only)
- Fetch user's saved projects

### RFQ Pre-fill Integration

**POST** `/api/rfq/create-from-portfolio`
- Create RFQ pre-filled with portfolio project data
- Body:
  ```json
  {
    "projectId": "uuid",
    "customizations": {
      "location": "...",
      "timeline": "...",
      "budget": "..."
    }
  }
  ```
- Returns: RFQ ID (can open modal with this ID)

---

## 🎨 UI Components

### Vendor Dashboard

**Portfolio Management Section**
- Project list view (table/grid toggle)
  - Columns: Title, Category, Status, Views, Saves, Actions (Edit/Delete)
  - Bulk actions: Feature, Pin, Archive
  
- Add Project button
  - Opens modal/page with form:
    - Title (text input)
    - Category dropdown
    - Subcategories (multi-select)
    - Status radio: Completed / In Progress
    - Photos upload (drag-drop, multi)
    - Description (textarea)
    - County/Area (optional)
    - Timeline dropdown
    - Budget range sliders
    - Materials multi-select
    - Client type radio
    - Site visit checkbox
    - Allow quote requests toggle

- Edit Project
  - Same form as add, pre-filled
  - Can replace images, update details

### Portfolio Gallery (Public)

**Portfolio Tab on Vendor Profile**
```
Header: "Projects" or "Portfolio"

Filter Bar (sticky):
  Filter: All | Completed | In Progress
  Category dropdown
  Search box
  
Grid (3-4 columns, responsive):
  Each card:
    [Cover Image]
    Title
    Badges: Category, Status, "2 weeks"
    Heart icon (save count), Eye icon (view count)
```

### Project Detail View

**Modal or Full Page:**
```
Header:
  Back button | Project title | Share | Report

Left column (2/3):
  Image gallery
    - Grid of 6-20 images
    - Click to expand
    - Before/After toggle (if available)
    - Video player (if exists)

Right column (1/3):
  Description (short summary)
  
  Quick Facts:
    Category: [badge]
    Location: [county/area]
    Timeline: [2 weeks]
    Budget: [80K-150K]
    Materials: [multi-line]
    Client: Residential/Commercial
    Site visit: Yes/No
  
  CTA Buttons:
    [Request Quote Like This] (primary)
    [Ask a Question] (secondary)
    [Save to Ideas] (outline)
```

---

## 🔄 Integration Points

### With Existing RFQ System

**When user clicks "Request Quote Like This":**

1. Open RFQ creation modal
2. Pre-fill:
   - `vendor_id` → from project
   - `category` → from project
   - `subcategories` → from project
   - `reference_project_id` → project ID
   - `reference_media_urls` → array of media URLs
3. User customizes:
   - Location
   - Timeline
   - Budget
   - Specific requirements
4. Submit as normal RFQ

**Benefits:**
- Vendor sees context of what client wants (exact style)
- Client gets relevant quotes faster
- Higher conversion rate

### With Vendor Profile

**Vendor Profile Tabs:**
```
Overview | Portfolio | Services | Reviews
```

Portfolio tab shows:
- Project grid with filters
- Statistics: Total projects, Total saves, etc.
- Top 6 featured projects (pinned at top)

---

## 📱 Responsive Design

### Mobile-first approach:

**Grid:**
- Desktop: 3-4 columns
- Tablet: 2 columns
- Mobile: 1 column (full width cards)

**Project Detail:**
- Mobile: Stack layout (image, then facts, then CTAs)
- Desktop: 2-column layout

**Filter bar:**
- Mobile: Collapse filters into modal/drawer
- Desktop: Always visible

---

## 🔒 Trust & Safety Features

### Image Ownership Verification

**When adding project:**
- Checkbox: "I own or have rights to these images"
- Optional: Watermark (future enhancement)
- Optional: Add client testimonial/approval

**User-level safety:**
- "Report this project" link
  - Flag for: Duplicate images, copyright issues, spam
  - Review by moderation team

### Data Privacy

**Sensitive info handling:**
- Location: Optional, defaults to county only
- Budget: Ranges only, never exact amounts
- Client info: No personal details shown

---

## 🎯 Phase Breakdown

### Phase 1: Database Setup (1-2 days)
- Create tables: portfolio_projects, portfolio_media, portfolio_saves
- Create indexes and RLS policies
- Migration scripts

### Phase 2: Vendor Dashboard (3-4 days)
- Project list component
- Add/Edit project form
- Image upload integration (S3)
- Delete functionality

### Phase 3: Portfolio Gallery UI (3-4 days)
- Grid component with responsive layout
- Filter & search functionality
- Category/subcategory dropdowns
- Save to wishlist functionality

### Phase 4: Project Detail View (2-3 days)
- Image gallery component
- Quick facts display
- CTA buttons
- Before/After toggle

### Phase 5: RFQ Integration (2-3 days)
- "Request Quote Like This" logic
- Pre-fill RFQ modal
- Attach reference images
- Test end-to-end flow

### Phase 6: Analytics & Optimization (2-3 days)
- Track views, saves per project
- Vendor analytics dashboard
- Performance optimization

---

## 📈 Success Metrics

**For Users:**
- Portfolio views per session
- Projects saved (wishlist adoption)
- "Request Quote Like This" clicks
- Quote accuracy improvement

**For Vendors:**
- Projects created per vendor
- Quote leads from portfolio
- Quote acceptance rate

**For Platform:**
- RFQ conversion rate
- Quote-to-job conversion
- Average quote completion time

---

## 🚀 Launch Strategy

### MVP (Minimum Viable Product) - Week 1-2
- Database + API endpoints
- Vendor dashboard (add project only)
- Portfolio gallery (view only)
- Project detail view
- Basic "Request Quote Like This"

### v1.1 (First Enhancement) - Week 3
- Advanced filters (category, status, timeline)
- Save to wishlist
- Before/After toggle
- Vendor analytics

### v1.2 (Second Enhancement) - Week 4
- Featured/Pinned projects
- Search functionality
- Report project feature
- Mobile optimization

---

## 💾 Migration Strategy

**For existing vendors with photos:**
- Option 1: Manual migration tool (vendor uploads/confirms)
- Option 2: Auto-import if old photos exist
- Clear communication about new feature

---

## 🔗 Dependencies

- **Supabase/PostgreSQL:** Database
- **AWS S3:** Image/video storage
- **Next.js/React:** Frontend
- **Next.js API Routes:** Backend
- **Existing RFQ system:** Pre-fill integration

---

## ✅ Success Criteria

- [x] Database schema designed and validated
- [x] API endpoints defined
- [x] UI components specified
- [ ] Database created and tested
- [ ] Vendor dashboard working
- [ ] Portfolio gallery displayed
- [ ] Project detail view functional
- [ ] RFQ pre-fill integration working
- [ ] End-to-end testing complete
- [ ] Performance optimized

---

## 📋 Next Steps

1. ✅ **Specification complete** (you are here)
2. 📋 **Create detailed implementation plan** (Phase breakdown)
3. 🛠️ **Build database** (Phase 1)
4. 💻 **Implement components** (Phases 2-5)
5. ✨ **Launch MVP** (1-2 weeks)
6. 📊 **Gather analytics** (Ongoing)
7. 🔄 **Iterate based on feedback** (Weeks 3+)

---

## 🎉 Summary

This portfolio feature transforms Zintra from a simple gallery into a **professional case-study platform** that:

1. **For Users:** See real outcomes, make better choices, accelerate RFQ creation
2. **For Vendors:** Showcase expertise, get better leads, build trust
3. **For Zintra:** Increase engagement, improve conversion rates, differentiate from competitors

**Estimated Implementation Time:** 4-6 weeks (MVP to production)

**Expected ROI:** 25-40% improvement in quote conversion rates

---

*Specification Version: 1.0*  
*Last Updated: January 7, 2026*  
*Status: Ready for Implementation Planning*
