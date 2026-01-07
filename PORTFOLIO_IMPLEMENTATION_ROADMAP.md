# 📋 Portfolio Feature - Implementation Roadmap

**Status:** 📅 Planning Phase  
**Date:** January 7, 2026  
**Duration:** 4-6 weeks (MVP)  
**Team:** Full-stack developers  

---

## 🎯 Project Overview

**Goal:** Build production-ready vendor portfolio system with case studies and RFQ pre-fill integration.

**Why This Matters:**
- Current: Random vendor photos (low trust)
- New: Structured project portfolios with context (high trust)
- Impact: 25-40% improvement in quote conversion

---

## 📊 Detailed Timeline

### WEEK 1: Backend Foundation

#### Day 1-2: Database Setup
**Deliverable:** Database migrations ready to run

**Tasks:**
- [ ] Create vendor_portfolio_projects table
- [ ] Create vendor_portfolio_media table
- [ ] Create portfolio_project_saves table
- [ ] Add reference columns to rfqs table
- [ ] Create indexes for performance
- [ ] Implement RLS policies
- [ ] Write SQL migration scripts
- [ ] Test migrations locally

**Success Criteria:**
- All tables created
- Relationships working
- RLS policies tested
- Can insert/query data

---

#### Day 3: API Infrastructure
**Deliverable:** API route structure established

**Tasks:**
- [ ] Create `/api/portfolio/` route structure
- [ ] Set up request validation middleware
- [ ] Set up response formatting
- [ ] Set up error handling
- [ ] Create TypeScript interfaces/types
- [ ] Set up Supabase client helpers

**Success Criteria:**
- Routes accessible
- Proper error handling
- Type safety established

---

#### Day 4-5: Core API Endpoints
**Deliverable:** All portfolio CRUD endpoints functional

**Tasks:**
- [ ] `GET /api/portfolio/projects` (list with filtering)
- [ ] `GET /api/portfolio/projects/:projectId` (detail)
- [ ] `POST /api/portfolio/projects` (create - protected)
- [ ] `PUT /api/portfolio/projects/:projectId` (update - protected)
- [ ] `DELETE /api/portfolio/projects/:projectId` (delete - protected)
- [ ] Write unit tests for each endpoint
- [ ] Test with Postman/curl

**Success Criteria:**
- All endpoints returning correct data
- Auth checks working
- Error handling proper
- Tests passing

---

### WEEK 2: Media & File Handling

#### Day 1-2: Media API & S3 Integration
**Deliverable:** Image upload system functional

**Tasks:**
- [ ] Create S3 utility functions
- [ ] Implement signed URL generation
- [ ] `POST /api/portfolio/:projectId/media` (upload)
- [ ] `DELETE /api/portfolio/:projectId/media/:mediaId`
- [ ] `PATCH /api/portfolio/:projectId/media/:mediaId` (reorder/caption)
- [ ] Handle multipart form data
- [ ] Add file validation (size, type)
- [ ] Test uploads locally

**Success Criteria:**
- Images upload to S3
- URLs stored in database
- Media reordering works
- File size limits enforced

---

#### Day 3: Save Functionality
**Deliverable:** Wishlist/save feature working

**Tasks:**
- [ ] `POST /api/portfolio/:projectId/save` (save)
- [ ] `DELETE /api/portfolio/:projectId/save` (unsave)
- [ ] `GET /api/portfolio/saves` (user's saves)
- [ ] Update project save_count on save/unsave
- [ ] Add unique constraint to prevent duplicates
- [ ] Test all flows

**Success Criteria:**
- Users can save/unsave projects
- Save count accurate
- Duplicates prevented
- Retrieval fast

---

#### Day 4-5: RFQ Integration API
**Deliverable:** Pre-fill RFQ endpoint working

**Tasks:**
- [ ] Create `/api/rfq/create-from-portfolio` endpoint
- [ ] Accept project ID + customizations
- [ ] Validate all required fields
- [ ] Merge portfolio data with RFQ fields
- [ ] Return RFQ ID + modal state
- [ ] Handle edge cases
- [ ] Write tests

**Success Criteria:**
- RFQ created successfully
- Pre-filled data correct
- Validation working
- Edge cases handled

---

### WEEK 3: Vendor Dashboard Frontend

#### Day 1-2: Project List Component
**Deliverable:** Vendors can view their projects

**Tasks:**
- [ ] Create `/vendor/portfolio` page
- [ ] Build PortfolioProjectsList component
- [ ] Table view: Title, Category, Status, Views, Saves, Actions
- [ ] Pagination (10 items per page)
- [ ] Sorting (by date, views, saves)
- [ ] Bulk actions UI (feature, pin, delete)
- [ ] Empty state (no projects yet)
- [ ] Loading states

**Success Criteria:**
- Projects display correctly
- Pagination works
- Sorting works
- UI is responsive

---

#### Day 3-4: Add/Edit Project Form
**Deliverable:** Vendors can create new projects

**Tasks:**
- [ ] Create AddProjectModal component
- [ ] Form fields:
  - Title (required)
  - Category dropdown (required)
  - Subcategories multi-select
  - Status radio (Completed/In Progress)
  - Description textarea
  - County/Area inputs
  - Timeline dropdown
  - Budget range sliders
  - Materials multi-select
  - Client type radio
  - Site visit checkbox
  - Allow quote requests toggle
- [ ] Form validation
- [ ] Submit handler (POST to API)
- [ ] Success/error feedback
- [ ] Error boundary

**Success Criteria:**
- Form validates
- Data submits to API
- Feedback provided
- Responsive design

---

#### Day 5: Image Upload UI
**Deliverable:** Vendors can upload project photos

**Tasks:**
- [ ] Create ImageUploadZone component (drag-drop)
- [ ] Handle file selection
- [ ] Progress indicators
- [ ] Image preview grid
- [ ] Delete image before upload
- [ ] Handle multiple files
- [ ] Upload to S3 via API
- [ ] Store URLs in project

**Success Criteria:**
- Drag-drop works
- Multiple images work
- Progress shown
- Images display

---

### WEEK 4: Portfolio Gallery & Display

#### Day 1-2: Portfolio Gallery Page
**Deliverable:** Public portfolio gallery visible

**Tasks:**
- [ ] Create `/portfolio/:vendorId` page
- [ ] Build PortfolioGrid component (Pinterest-style)
- [ ] 3-4 column responsive grid
- [ ] ProjectCard component:
  - Cover image
  - Title
  - Category badge
  - Status badge
  - Timeline badge
  - View/Save icons
  - Hover effects
- [ ] Skeleton loading
- [ ] Error state

**Success Criteria:**
- Grid displays correctly
- Cards are responsive
- Images load efficiently
- Interactions smooth

---

#### Day 3: Filters & Search
**Deliverable:** Users can filter/search projects

**Tasks:**
- [ ] Create FilterBar component
- [ ] Status filter: All / Completed / In Progress
- [ ] Category dropdown
- [ ] Search input (title + description)
- [ ] URL query params for state
- [ ] API query adjustments
- [ ] Filter/search debouncing
- [ ] Clear filters button

**Success Criteria:**
- Filters work
- Search works
- URL updates
- Performance good

---

#### Day 4-5: Project Detail Modal/Page
**Deliverable:** Full project detail view functional

**Tasks:**
- [ ] Create ProjectDetailModal/Page component
- [ ] Left side (2/3):
  - Image gallery grid
  - Image preview modal
  - Before/After toggle (if applicable)
  - Video player (if exists)
- [ ] Right side (1/3):
  - Title + back button
  - Description text
  - Quick Facts section:
    - Category
    - Location
    - Timeline
    - Budget range
    - Materials list
    - Client type
    - Site visit status
  - CTA Buttons:
    - Request Quote Like This
    - Ask a Question
    - Save to Ideas
- [ ] Share button
- [ ] Report button

**Success Criteria:**
- Gallery displays all images
- Facts display correctly
- Buttons functional
- Mobile responsive

---

### WEEK 5: Advanced Features

#### Day 1-2: Request Quote Integration
**Deliverable:** "Request Quote Like This" button works end-to-end

**Tasks:**
- [ ] Handle "Request Quote Like This" click
- [ ] Open RFQ creation modal
- [ ] Pre-fill with project data:
  - vendor_id
  - category
  - subcategories
  - reference_project_id
  - reference_media_urls
- [ ] User customizes location/timeline/budget
- [ ] Submit creates RFQ
- [ ] Success feedback
- [ ] Redirect or close modal

**Success Criteria:**
- Pre-fill works correctly
- RFQ created with reference
- User flow smooth
- No data loss

---

#### Day 3: Ask Question Feature
**Deliverable:** Users can ask vendors questions about projects

**Tasks:**
- [ ] Create QuestionModal component
- [ ] Text input for question
- [ ] Submit to new api/questions endpoint
- [ ] Attach project_id + vendor_id
- [ ] Vendor receives notification
- [ ] Question appears on project (optional)
- [ ] Success feedback

**Success Criteria:**
- Questions submit
- Vendors notified
- Feature optional for MVP

---

#### Day 4-5: Save to Wishlist
**Deliverable:** Users can save projects to personal moodboard

**Tasks:**
- [ ] Heart icon on project cards
- [ ] Click to save/unsave
- [ ] Toggle state with animation
- [ ] Create `/user/saved-projects` page
- [ ] Display user's saved projects
- [ ] Filter/organize saves
- [ ] View counts update

**Success Criteria:**
- Save/unsave works
- Saved projects display
- Counts accurate
- Fast interactions

---

### WEEK 6: Polish & Launch

#### Day 1: Vendor Analytics
**Deliverable:** Vendors see project performance

**Tasks:**
- [ ] Create analytics section in vendor dashboard
- [ ] Show per-project:
  - View count
  - Save count
  - Quote requests
  - Questions received
- [ ] Sparkline charts (optional)
- [ ] Date range filtering
- [ ] CSV export (optional)

**Success Criteria:**
- Metrics accurate
- Display clean
- Performance good

---

#### Day 2: Performance Optimization
**Deliverable:** Fast load times for gallery/detail views

**Tasks:**
- [ ] Optimize image loading
  - Lazy loading
  - Image compression (AWS)
  - CDN caching
- [ ] Optimize database queries
  - Add missing indexes
  - Optimize filters/search
- [ ] Pagination optimization
- [ ] Component lazy loading
- [ ] Code splitting

**Success Criteria:**
- Gallery loads < 2s
- Detail loads < 1s
- Lighthouse score 90+

---

#### Day 3: QA & Bug Fixes
**Deliverable:** Feature thoroughly tested

**Tasks:**
- [ ] Manual testing all flows
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Edge case testing
- [ ] Security review
- [ ] Bug fixes
- [ ] Performance tuning

**Success Criteria:**
- No critical bugs
- All features working
- Performance good

---

#### Day 4-5: Documentation & Launch
**Deliverable:** Feature ready for production

**Tasks:**
- [ ] Complete feature documentation
- [ ] Vendor onboarding guide
- [ ] User guide for portfolios
- [ ] Internal wiki/runbook
- [ ] Deploy to staging
- [ ] Stakeholder review
- [ ] Deploy to production
- [ ] Monitor for issues

**Success Criteria:**
- Documentation complete
- Feature live
- No critical issues
- Metrics tracking

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 13+ (React)
- TypeScript
- Tailwind CSS
- React Query/SWR (for data fetching)
- Zustand (state management)

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL)
- S3 for storage

**Tools:**
- Git for version control
- Jest for testing
- Playwright for E2E tests
- Vercel for deployment

---

## 📦 Deliverables by Week

| Week | Deliverable | Status |
|------|------------|--------|
| 1 | Database schema, All API endpoints | 🔄 Backend ready |
| 2 | Media upload, Save functionality, RFQ integration | 🔄 APIs complete |
| 3 | Vendor dashboard, Add project form | 🔄 Admin UX done |
| 4 | Gallery, Detail view, Filters | 🔄 Public UX done |
| 5 | Quote pre-fill, Questions, Wishlist | 🔄 Advanced UX done |
| 6 | Analytics, Optimization, QA, Launch | ✅ Live |

---

## 👥 Team Structure

**Backend Developer (1):**
- Database design & setup
- API endpoints
- S3 integration
- RLS policies

**Frontend Developer (1):**
- All UI components
- State management
- Responsive design
- Optimization

**QA Engineer (0.5):**
- Testing
- Bug reports
- Performance testing

**Product Manager (0.5):**
- Requirements clarification
- Stakeholder communication
- Launch planning

---

## 🎯 Success Metrics

**During Development:**
- All acceptance criteria met
- Zero critical bugs
- Performance targets hit
- Code coverage > 80%

**Post-Launch (Month 1):**
- 20% of vendors create portfolio
- 30% of users browse portfolios
- 15% click "Request Quote Like This"
- 10% increase in RFQ accuracy

**Post-Launch (Month 3):**
- 50% of vendors have portfolio
- 20% quote conversion improvement
- $X improvement in average order value

---

## 🚀 Go-Live Checklist

**Pre-Launch:**
- [ ] All features tested
- [ ] Performance optimized
- [ ] Documentation complete
- [ ] Vendor onboarding ready
- [ ] Support training done
- [ ] Database backed up
- [ ] Rollback plan ready

**Launch Day:**
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Monitor performance
- [ ] Check user feedback
- [ ] Quick response team ready

**Post-Launch:**
- [ ] Daily monitoring Week 1
- [ ] Gather user feedback
- [ ] Track KPIs
- [ ] Quick fixes if needed
- [ ] Plan Phase 2

---

## 📝 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Database performance | High | Proper indexing, query optimization |
| S3 costs | Medium | Image optimization, CDN |
| Vendor adoption | High | Easy UX, clear guides, incentives |
| Content moderation | Medium | Report feature, review process |
| Mobile performance | High | Progressive image loading, optimization |

---

## 🔄 Iteration Plan (Phase 2+)

**Week 7-8:**
- Before/After slider component
- Advanced filters
- Featured projects on vendor profile
- Improved search (faceted)

**Week 9-10:**
- Video support
- Project categorization by type
- Vendor portfolio stats dashboard
- Integration with vendor reviews

**Week 11-12:**
- Watermarking
- Client testimonials
- Project timeline gallery
- Mobile app support

---

## 📊 Estimation Summary

| Phase | Days | Stories | Est. Hours |
|-------|------|---------|-----------|
| Database | 2 | 5 | 16 |
| Backend APIs | 3 | 8 | 24 |
| Media Upload | 2 | 6 | 16 |
| Vendor Dashboard | 3 | 9 | 24 |
| Gallery UI | 3 | 8 | 24 |
| Detail View | 3 | 8 | 24 |
| Quote Integration | 2 | 5 | 16 |
| Polish/QA | 3 | 10 | 24 |
| **TOTAL** | **21** | **59** | **168** |

**Team Size:** 2 developers + 1 QA (part-time)  
**Timeline:** 4-6 weeks (with 2 devs)

---

## ✅ Next Steps

1. ✅ **Specification complete** (DONE)
2. ✅ **Roadmap created** (DONE - you are here)
3. 📅 **Schedule team & resources**
4. 🛠️ **Begin Week 1: Database setup**
5. 📊 **Daily standups & tracking**
6. 🚀 **Launch MVP at Week 6**

---

## 💡 Key Success Factors

✅ **Clear specifications** - Done  
✅ **Phased approach** - Clear weekly milestones  
✅ **API-first design** - Better separation of concerns  
✅ **Type safety** - TypeScript throughout  
✅ **Testing** - Unit + E2E tests  
✅ **Performance** - Optimization built-in  
✅ **User feedback** - Iterative approach  

---

*Roadmap Version: 1.0*  
*Created: January 7, 2026*  
*Ready to Execute*
