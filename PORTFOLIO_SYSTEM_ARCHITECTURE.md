# Portfolio System - Comprehensive Architecture

## Vision

Transform the Portfolio tab from a simple image gallery into a powerful **"Build for me like this"** system that:
- Showcases vendor's completed projects with rich details
- Allows customers to request quotes for similar projects
- Includes before/during/after photo sequences
- Builds trust through visual proof of work
- Provides project-specific context (budget, timeline, location, category)

---

## Database Schema

### New: PortfolioProject Model

```prisma
model PortfolioProject {
  id                  String    @id @default(cuid())
  vendorProfileId     String
  vendorProfile       VendorProfile @relation(fields: [vendorProfileId], references: [id], onDelete: Cascade)
  
  // Core info
  title               String    // e.g., "3-Bedroom Bungalow – Narok"
  description         String    @db.Text
  categorySlug        String?   // e.g., "building-masonry"
  status              String    @default("draft") // draft | published
  
  // Project specs
  completionDate      DateTime?
  budgetMin           Int?      // Budget range in KES
  budgetMax           Int?
  location            String?   // e.g., "Narok, Kenya"
  timeline            String?   // e.g., "3 months"
  
  // Images with before/during/after types
  images              PortfolioProjectImage[]
  
  // Metadata
  viewCount           Int       @default(0)
  quoteRequestCount   Int       @default(0)
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([vendorProfileId])
  @@index([categorySlug])
  @@index([status])
}

model PortfolioProjectImage {
  id                    String    @id @default(cuid())
  portfolioProjectId    String
  portfolioProject      PortfolioProject @relation(fields: [portfolioProjectId], references: [id], onDelete: Cascade)
  
  imageUrl              String
  imageType             String    @default("after") // before | during | after
  caption               String?
  displayOrder          Int       @default(0)
  
  uploadedAt            DateTime  @default(now())
  
  @@index([portfolioProjectId])
}
```

### Updated: VendorProfile Model

Add relation:
```prisma
portfolioProjects   PortfolioProject[]
```

---

## Component Architecture

### 1. PortfolioTab (Parent)
- **Location:** `/app/vendor-profile/[id]/page.js` (Portfolio tab section)
- **Props:** vendor, canEdit, onAddProject, onViewProject
- **Logic:**
  - Check if vendor view or customer view
  - Show vendor view (with add button, grid with edit/delete) OR customer view (clean gallery, filters)
  - Handle empty state with examples
  - Pass click handlers to child cards

### 2. PortfolioEmptyState
- **Location:** `/components/vendor-profile/PortfolioEmptyState.js`
- **Shows when:** No portfolio projects exist
- **Content:**
  - Title: "Portfolio"
  - Subtitle: "Show customers what you've done. They can request: Build for me like this."
  - "+ Add Project" button
  - 3 example placeholder cards
- **Vendor only:** Full button
- **Customer:** Motivating message instead

### 3. PortfolioProjectCard
- **Location:** `/components/vendor-profile/PortfolioProjectCard.js`
- **Props:** project, canEdit, onView, onEdit, onDelete, onShare, onRequestQuote
- **Display:**
  - Cover image (first "after" image)
  - Project title
  - Category badge
  - 3 quick spec chips (completion date, budget range, location)
  - Hover state with actions
- **Actions:**
  - View (opens ProjectDetailModal)
  - Edit (vendor only - opens ProjectDetailModal in edit mode)
  - Share (copy link to clipboard)
  - Request Quote (customer only - opens RequestQuoteFromProject modal)

### 4. PortfolioProjectGrid
- **Location:** `/components/vendor-profile/PortfolioProjectGrid.js`
- **Props:** projects, canEdit, onView, onEdit, onDelete, etc.
- **Display:**
  - Responsive grid (2 cols tablet, 3 cols desktop)
  - Maps through projects, renders PortfolioProjectCard for each
  - Filters (optional): Category, Budget range, Type (before/after)

### 5. AddProjectModal (Wizard)
- **Location:** `/components/vendor-profile/AddProjectModal.js`
- **Flow:**
  1. **Step 1:** Project Title
     - Input field
     - Max 100 characters
  2. **Step 2:** Category
     - Dropdown (pre-filled with vendor's primary category)
     - Can select any category vendor works with
  3. **Step 3:** Description
     - Text area
     - "What we did" explanation
     - Max 500 characters
  4. **Step 4:** Photos
     - Multi-file upload
     - Drag & drop
     - For each photo: select type (before/during/after)
     - Reorder by dragging
     - Min 1 photo (after), ideally 3+
  5. **Step 5:** Optional Details
     - Budget range (min/max)
     - Timeline (e.g., "3 months")
     - Location
     - All optional
  6. **Step 6:** Publish
     - Toggle: Draft / Published
     - Save button
     - Auto-publish option for power users

### 6. ProjectDetailModal
- **Location:** `/components/vendor-profile/ProjectDetailModal.js`
- **Props:** project, canEdit, vendorName, onEdit, onShare, onRequestQuote
- **Display:**
  - **Before/During/After Photo Viewer**
    - Toggle or tabs to switch between photo types
    - Large image display
    - Thumbnails below
    - Full-screen option
  - **Project Details**
    - Title
    - Category badge
    - Description
    - Completion date
    - Budget range
    - Timeline
    - Location
    - View count
  - **Actions**
    - Edit (vendor only button)
    - Share (copy link)
    - Request Quote (customer only button)

### 7. RequestQuoteFromProject
- **Location:** `/components/vendor-profile/RequestQuoteFromProject.js`
- **Props:** project, vendor, onClose, onSubmit
- **Pre-fills:**
  - Category (from project)
  - Context/Description (suggests: "I need a similar project like [project title]")
  - Budget range (from project if available)
  - Location (from project or vendor profile)
  - Timeline (optional)
- **Action:** "Send Quote Request"
- **Integrates with:** Existing RFQModal or creates new quote request in system

---

## UI/UX Mockup

### Empty State (Vendor - No Projects)
```
┌─────────────────────────────────────────┐
│  Portfolio                              │
│  Show customers what you've done.       │
│  They can request: Build for me like    │
│  this.                                  │
│                                         │
│         [+ Add Project]                 │
│                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ Before │ │ Before │ │ Before │      │
│  │ After  │ │ After  │ │ After  │      │
│  │        │ │        │ │        │      │
│  │Example │ │Example │ │Example │      │
│  │Card 1  │ │Card 2  │ │Card 3  │      │
│  └────────┘ └────────┘ └────────┘      │
└─────────────────────────────────────────┘
```

### Project Grid (With Projects)
```
┌─────────────────────────────────────────┐
│  Portfolio                [+ Add Project]│
│                                         │
│  ┌──────────────┐ ┌──────────────┐    │
│  │   [Image]    │ │   [Image]    │    │
│  │              │ │              │    │
│  │ 3-Bedroom    │ │ Kitchen      │    │
│  │ Bungalow     │ │ Renovation   │    │
│  │ [🏢 Building]│ │ [🔧 Carpentry]    │
│  │              │ │              │    │
│  │ Oct 2025     │ │ Sep 2025     │    │
│  │ 300k–600k    │ │ 150k–300k    │    │
│  │ Narok        │ │ Nairobi      │    │
│  │              │ │              │    │
│  │ [👁 View] [✎ Edit] [📤 Share]│    │
│  └──────────────┘ └──────────────┘    │
│                                         │
│  ┌──────────────┐                      │
│  │   [Image]    │                      │
│  │              │                      │
│  │ Office Space │                      │
│  │ Makeover     │                      │
│  │ [🏢 Building]│                      │
│  │              │                      │
│  │ Nov 2025     │                      │
│  │ 500k–1M      │                      │
│  │ Karen        │                      │
│  │              │                      │
│  │ [👁 View] [✎ Edit] [📤 Share]│    │
│  └──────────────┘                      │
└─────────────────────────────────────────┘
```

### Project Detail View
```
┌─────────────────────────────────────────┐
│ 3-Bedroom Bungalow – Narok              │
│                                         │
│ Before / During / After Tabs            │
│ ┌─────────────────────────────────────┐ │
│ │         [Large Image]                │ │
│ │                                     │ │
│ │    [Before Image] [During] [After]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 🏢 Building & Masonry                  │
│                                         │
│ What we did:                            │
│ Built a modern 3-bedroom bungalow      │
│ with contemporary design on a sloped   │
│ plot in Narok. Finished with quality   │
│ materials and finishes.                │
│                                         │
│ Completed: Oct 2025                    │
│ Budget: 300k – 600k KES                │
│ Timeline: 3 months                     │
│ Location: Narok, Kenya                 │
│                                         │
│ [📤 Share] [👁 2.3k views]              │
│                                         │
│ [Vendor: Request Quote Like This]      │
│         or                              │
│ [Vendor: Edit] [Delete]                │
└─────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database & Core Components
1. Create Prisma migration for PortfolioProject models
2. Build PortfolioProjectCard component
3. Build PortfolioEmptyState component
4. Update Portfolio tab to use new components

### Phase 2: Add Project Flow
1. Build AddProjectModal (wizard)
2. Create upload/storage integration
3. Build ProjectDetailModal
4. Wire up add/edit/delete functionality

### Phase 3: Customer Interaction
1. Build RequestQuoteFromProject modal
2. Integrate with existing RFQ system
3. Add share functionality
4. Add view count tracking

### Phase 4: Polish & Features
1. Before/during/after photo management
2. Filters (category, budget, etc.)
3. Analytics (views, quote requests)
4. Mobile optimization

---

## Data Flow

### Add Project
```
Vendor clicks "+ Add Project"
  → AddProjectModal opens (Step 1)
  → User enters title → Step 2
  → Selects category → Step 3
  → Writes description → Step 4
  → Uploads photos (before/during/after) → Step 5
  → Sets optional details → Step 6
  → Chooses draft/published
  → Clicks Save
    → POST /api/portfolio/projects
      → Save to PortfolioProject + PortfolioProjectImage
      → Return project with images
    → PortfolioTab refreshes grid
    → New card appears in grid
```

### View Project
```
Customer clicks "View" on project card
  → ProjectDetailModal opens
  → Shows before/during/after photos
  → Shows all project details
  → "Request Quote Like This" button visible
    → Clicks button
    → RequestQuoteFromProject modal opens
    → Pre-filled with project context
    → Submits → Quote request created
```

### Edit Project (Vendor Only)
```
Vendor clicks "Edit" on card
  → ProjectDetailModal opens in edit mode
  → Can change title, description, category
  → Can re-upload or reorder photos
  → Can update budget/timeline/location
  → Save button submits changes
```

---

## API Endpoints Needed

```
POST   /api/portfolio/projects          - Create project
GET    /api/portfolio/projects          - List projects (filter by vendor)
GET    /api/portfolio/projects/[id]     - Get project details
PATCH  /api/portfolio/projects/[id]     - Update project
DELETE /api/portfolio/projects/[id]     - Delete project

POST   /api/portfolio/projects/[id]/images  - Add images to project
DELETE /api/portfolio/projects/[id]/images/[imgId]  - Delete image

POST   /api/portfolio/projects/[id]/quote-requests  - Quote request from project
```

---

## Next Steps

1. ✅ Design complete (this document)
2. ⏭️ Create Prisma migration for PortfolioProject models
3. ⏭️ Build core components (Card, EmptyState, DetailModal)
4. ⏭️ Build AddProjectModal wizard
5. ⏭️ Create API endpoints
6. ⏭️ Wire everything together
7. ⏭️ Test all flows
8. ⏭️ Deploy

---

## Tech Stack

- **Database:** Supabase PostgreSQL (via Prisma)
- **Frontend:** React, Next.js, Tailwind CSS
- **File Upload:** S3/Vercel Blob Storage
- **Modals:** React modal components
- **Image Display:** Next.js Image component

---

## Success Metrics

✅ Vendors can create projects with photos and details  
✅ Customers see professional portfolio gallery  
✅ Customers can request quotes for similar projects  
✅ Before/during/after photos build trust  
✅ Project details (budget, timeline, location) provide context  
✅ Share links allow vendors to showcase work externally  

