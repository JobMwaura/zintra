# Portfolio System - Complete Reference Guide

**Last Updated:** 8 January 2026  
**Status:** Phase 2 Complete (3 of 9 phases done)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PORTFOLIO SYSTEM FLOW                        │
└─────────────────────────────────────────────────────────────────┘

VENDOR ACTIONS (Creating Portfolio)
│
├─ Open AddProjectModal (6-step wizard)
│  ├─ Step 1: Title
│  ├─ Step 2: Category
│  ├─ Step 3: Description
│  ├─ Step 4: Upload Photos (Before/During/After)
│  ├─ Step 5: Optional Details
│  └─ Step 6: Review & Publish
│
├─ Submit Project
│  ├─ POST /api/portfolio/projects → Create PortfolioProject
│  └─ POST /api/portfolio/images → Create Images (per photo)
│
└─ Success → Project appears in portfolio

CUSTOMER ACTIONS (Browsing Portfolio)
│
├─ View Vendor Profile
│  └─ See Portfolio Tab
│     ├─ Browse project gallery
│     ├─ Click project to view details
│     └─ Request quote for similar project
│
├─ ProjectDetailModal Opens (Phase 3)
│  ├─ See photos with Before/During/After toggle
│  ├─ View full project details
│  ├─ Share project
│  └─ Request Quote button
│
└─ RequestQuoteFromProject Modal (Phase 3)
   └─ Submit quote request with project context
```

---

## Component Hierarchy

```
Vendor Profile Page
│
├─ Portfolio Tab
│  │
│  ├─ PortfolioEmptyState (when no projects)
│  │  └─ Shows 3 example cards + CTA button
│  │
│  ├─ PortfolioProjectCard (grid of projects)
│  │  ├─ Cover image
│  │  ├─ Title + category
│  │  ├─ 3 specs (date, budget, location)
│  │  └─ Action buttons
│  │
│  └─ Add Project Button
│     └─ Opens AddProjectModal
│
├─ AddProjectModal ✅ (BUILT - Phase 2)
│  └─ 6-step wizard
│
├─ ProjectDetailModal 📋 (NEXT - Phase 3)
│  └─ View project with photo toggle
│
└─ RequestQuoteFromProject Modal 📋 (NEXT - Phase 3)
   └─ Quote request form

Legend:
✅ = Built and ready
📋 = Planned, not started
```

---

## Database Schema

```sql
┌─ PortfolioProject
│  ├─ id (UUID, PK)
│  ├─ vendorProfileId (FK → VendorProfile)
│  ├─ title (String, 100 chars max)
│  ├─ description (String, 500 chars max)
│  ├─ categorySlug (String) ──→ Links to service category
│  ├─ status (Enum: draft | published)
│  ├─ completionDate (DateTime, nullable)
│  ├─ budgetMin (Integer, nullable)
│  ├─ budgetMax (Integer, nullable)
│  ├─ timeline (String, nullable)
│  ├─ location (String, nullable)
│  ├─ viewCount (Integer)
│  ├─ quoteRequestCount (Integer)
│  ├─ createdAt (DateTime)
│  ├─ updatedAt (DateTime)
│  └─ images[] (Relation → PortfolioProjectImage)
│
└─ PortfolioProjectImage
   ├─ id (UUID, PK)
   ├─ portfolioProjectId (FK → PortfolioProject, CASCADE)
   ├─ imageUrl (String, Supabase Storage URL)
   ├─ imageType (Enum: before | during | after)
   ├─ caption (String, 100 chars, nullable)
   ├─ displayOrder (Integer)
   └─ uploadedAt (DateTime)

Indexes:
- vendorProfileId (for fetching vendor's projects)
- categorySlug (for filtering by category)
- status (for published/draft filtering)
- portfolioProjectId (for fetching images)
```

---

## API Endpoints Reference

### 1. CREATE PROJECT
```
POST /api/portfolio/projects

Request:
{
  "vendorId": "uuid",
  "title": "3-Bedroom Bungalow",
  "categorySlug": "building-and-masonry",
  "description": "Built a modern 3-bedroom bungalow...",
  "status": "published",
  "budgetMin": 300000,
  "budgetMax": 600000,
  "timeline": "6 months",
  "location": "Nairobi",
  "completionDate": "2024-10-15"
}

Response (201):
{
  "message": "Project created successfully",
  "project": {
    "id": "uuid",
    "vendorProfileId": "uuid",
    "title": "3-Bedroom Bungalow",
    "categorySlug": "building-and-masonry",
    "status": "published",
    "budgetMin": 300000,
    "budgetMax": 600000,
    "viewCount": 0,
    "quoteRequestCount": 0,
    ...
  }
}
```

### 2. GET PROJECTS
```
GET /api/portfolio/projects?vendorId=uuid

Response (200):
{
  "projects": [
    {
      "id": "uuid",
      "title": "3-Bedroom Bungalow",
      "status": "published",
      "viewCount": 15,
      "images": [
        {
          "id": "uuid",
          "imageUrl": "https://...",
          "imageType": "before",
          "displayOrder": 0
        },
        {
          "id": "uuid",
          "imageUrl": "https://...",
          "imageType": "after",
          "displayOrder": 1
        }
      ]
    }
  ]
}
```

### 3. CREATE IMAGE
```
POST /api/portfolio/images

Request:
{
  "projectId": "uuid",
  "imageUrl": "https://supabase.com/storage/...",
  "imageType": "after",
  "caption": "Completed project",
  "displayOrder": 1
}

Response (201):
{
  "message": "Image created successfully",
  "image": {
    "id": "uuid",
    "imageUrl": "https://...",
    "imageType": "after",
    "displayOrder": 1
  }
}
```

---

## Component Props Reference

### AddProjectModal
```javascript
<AddProjectModal
  vendorId="uuid"              // Required: Vendor ID
  vendorPrimaryCategory="slug" // Optional: Pre-fill category
  isOpen={boolean}             // Required: Show/hide modal
  onClose={() => {}}           // Required: Called on close
  onSuccess={(project) => {}}  // Optional: Called on success
/>
```

### PortfolioProjectCard
```javascript
<PortfolioProjectCard
  project={object}             // Required: Project data with images
  canEdit={boolean}            // Required: Show edit/delete buttons
  onView={() => {}}            // Optional: View clicked
  onEdit={() => {}}            // Optional: Edit clicked
  onDelete={() => {}}          // Optional: Delete clicked
  onShare={() => {}}           // Optional: Share clicked
  onRequestQuote={() => {}}    // Optional: Request quote clicked
/>
```

### PortfolioEmptyState
```javascript
<PortfolioEmptyState
  canEdit={boolean}            // Required: Vendor or customer view
  onAddProject={() => {}}      // Required: Add project clicked
/>
```

---

## Supabase Storage Structure

```
Storage Bucket: "portfolio-images"
├── vendor-uuid-1/
│   ├── 1704702000000-abc123-kitchen-before.jpg
│   ├── 1704702005000-def456-kitchen-during.jpg
│   └── 1704702010000-ghi789-kitchen-after.jpg
│
├── vendor-uuid-2/
│   ├── 1704702015000-jkl012-renovation-before.jpg
│   └── 1704702020000-mno345-renovation-after.jpg
│
└── vendor-uuid-3/
    └── ... (more photos)

Public URL Format:
https://your-supabase.com/storage/v1/object/public/portfolio-images/vendor-uuid/filename.jpg
```

---

## Feature Comparison: Phase 1 vs Phase 2

### Phase 1 ✅
- ✅ Database models (PortfolioProject, PortfolioProjectImage)
- ✅ Database migration
- ✅ PortfolioProjectCard component (display projects)
- ✅ PortfolioEmptyState component (motivating empty state)

### Phase 2 ✅
- ✅ AddProjectModal (6-step wizard)
- ✅ Photo upload to Supabase Storage
- ✅ Before/during/after photo tagging
- ✅ POST /api/portfolio/projects (create project)
- ✅ GET /api/portfolio/projects (list projects)
- ✅ POST /api/portfolio/images (create images)

### Phase 3 📋 (Next)
- 📋 ProjectDetailModal (view with photo toggle)
- 📋 RequestQuoteFromProject modal
- 📋 Portfolio tab integration
- 📋 GET /api/portfolio/projects/[id] (view single)
- 📋 PATCH /api/portfolio/projects/[id] (edit)
- 📋 DELETE /api/portfolio/projects/[id] (delete)

### Phases 4-9 📋 (Later)
- 📋 View & quote request tracking
- 📋 Share functionality
- 📋 Advanced features (filtering, sorting, etc.)
- 📋 End-to-end testing
- 📋 Production deployment & monitoring

---

## Category Reference

Categories supported by AddProjectModal:

| Emoji | Category | Slug |
|-------|----------|------|
| 🏗️ | Building & Masonry | building-and-masonry |
| 🪵 | Carpentry & Finishes | carpentry-and-finishes |
| ⚡ | Electrical | electrical |
| 🔧 | Plumbing | plumbing |
| 🎨 | Painting | painting |
| 🏠 | Roofing | roofing |
| 🌳 | Landscaping | landscaping |
| 👷 | General Contractor | general-contractor |
| 🛋️ | Interior Design | interior-design |
| 🔨 | Renovation | renovation |

---

## Photo Type Reference

Photos can be tagged as:

| Type | Emoji | Purpose |
|------|-------|---------|
| before | 📸 | Project before work started |
| during | ⏳ | Project during construction |
| after | ✨ | Completed project |

---

## Status Flow

Project Status Progression:

```
Draft ───save──→ Draft (editable)
  │               │
  │               └──→ Publish ───→ Published (customers see)
  │
  └──→ Publish ───→ Published (skip draft)
```

Visibility:
- **Draft:** Only vendor can see (private)
- **Published:** All customers can see (public)

---

## Sequence Diagram: Adding a Project

```
User                AddProjectModal         Supabase Storage      API Endpoint      Database
 │                       │                        │                    │                 │
 ├─ Click Add ────→ Modal Opens
 │                       │
 ├─ Fill Steps 1-3───→ Validate ─────────── (local)
 │                       │
 ├─ Select Photos ───→ Validate ─────────── (local)
 │                       │
 ├─ Drag Photos ─────→ Upload
 │                       ├─ Upload file ────────────→
 │                       │                      ✅ Stored
 │                       ├─ Get public URL
 │                       │                      Return URL
 │                       │←──────────────────────────
 │                       │
 ├─ Fill Steps 5-6───→ Validate ─────────── (local)
 │                       │
 ├─ Click Publish ───→ Submit
 │                       ├─ POST /api/portfolio/projects ──→
 │                       │                              Create project
 │                       │                         ✅ Return projectId
 │                       │←─────────────────────────────
 │                       │
 │                       ├─ POST /api/portfolio/images ──→
 │                       │   (for each photo)        Create images
 │                       │                       ✅ Return imageIds
 │                       │←─────────────────────────────
 │                       │
 ├─ Modal Closes ────→ Success callback
 │                       │
 └─ Project in Portfolio (loaded from DB)
```

---

## File Locations Quick Reference

```
Backend/API:
├── app/api/portfolio/
│   ├── projects/route.js (POST, GET)
│   └── images/route.js (POST)

Components:
├── components/vendor-profile/
│   ├── AddProjectModal.js ✅
│   ├── PortfolioProjectCard.js ✅
│   ├── PortfolioEmptyState.js ✅
│   ├── ProjectDetailModal.js 📋
│   └── RequestQuoteFromProject.js 📋

Database:
├── prisma/schema.prisma
│   └── PortfolioProject, PortfolioProjectImage models
├── prisma/migrations/
│   └── 20250108_add_portfolio_projects/migration.sql

Docs:
├── PORTFOLIO_SYSTEM_ARCHITECTURE.md (Overview)
├── PORTFOLIO_PHASE_1_COMPLETE.md (Phase 1 details)
├── PORTFOLIO_PHASE_2_COMPLETE.md (Phase 2 details)
├── PHASE_2_SUMMARY.md (Quick summary)
├── SUPABASE_PORTFOLIO_SETUP.md ⚠️ (ACTION REQUIRED)
└── PORTFOLIO_COMPLETE_REFERENCE.md (This file)
```

---

## Important: What You Must Do

### ⚠️ Before Deploying

1. **Create Supabase Storage Bucket**
   - Go to Supabase Dashboard
   - Create bucket: `portfolio-images`
   - Set to Public: ✅
   - See `SUPABASE_PORTFOLIO_SETUP.md` for details

2. **Apply Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

3. **Deploy to Production**
   - Push to GitHub (already done)
   - Vercel auto-deploys
   - Test in production URL

---

## Next Steps

1. **Create Supabase bucket** (1 minute) ⚠️
2. **Run migration** (`npx prisma migrate deploy`)
3. **Deploy to Vercel** (automatic)
4. **Test locally** - Try AddProjectModal
5. **Test in production** - Verify uploads work
6. **Continue with Phase 3** - Build ProjectDetailModal

---

## Support Resources

| Question | File |
|----------|------|
| How do I set up Supabase? | `SUPABASE_PORTFOLIO_SETUP.md` |
| What was built in Phase 2? | `PORTFOLIO_PHASE_2_COMPLETE.md` |
| How does the system work? | `PORTFOLIO_SYSTEM_ARCHITECTURE.md` |
| Quick overview? | `PHASE_2_SUMMARY.md` |
| Component details? | Component files in `/components/vendor-profile/` |
| API endpoint details? | Endpoint files in `/app/api/portfolio/` |

---

**Status: Phase 2 Complete! Ready for Production Deployment (after bucket creation)**
