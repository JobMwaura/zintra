# ZINTRA – CATEGORY-DRIVEN VENDORS & DYNAMIC RFQ MODALS
## Authoritative Implementation Plan

**Version:** 1.0  
**Date:** January 4, 2026  
**Status:** Planning Phase  
**Estimated Duration:** 8–12 weeks (Phased approach)

---

## 📋 EXECUTIVE SUMMARY

This document outlines the complete technical implementation for converting ZINTRA from a generic RFQ platform into a **category-driven vendor system with dynamic RFQ modals**. 

### Core Changes
- **20 canonical categories** become the system source of truth
- **Vendors must select a primary category** (defines RFQ modal type)
- **Dynamic RFQ modals** load category-specific questions
- **6-step universal modal structure** supports all categories
- **Guest-friendly RFQ creation** with login at submit time
- **Admin control** of categories and RFQ templates

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                     ZINTRA CATEGORY SYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  CANONICAL CATEGORIES (20)  ←──────┐                             │
│  (Singleton JSON)                   │                             │
│                                     │                             │
│  ┌─ VendorProfile                   │                             │
│  │  ├─ primary_category_slug ───────┘                             │
│  │  ├─ secondary_categories[] (0-n)                               │
│  │  └─ other_services (text)                                      │
│  │                                                                 │
│  └─ VendorCategory (JoinTable)                                    │
│     ├─ isPrimary (boolean)                                        │
│     └─ categoryId (FK)                                            │
│                                                                   │
│  RFQ TEMPLATES (20)                                               │
│  /lib/rfqTemplates/[categorySlug].json                            │
│  ├─ Category-specific questions                                   │
│  ├─ Field types & validation                                      │
│  └─ Multi-step structure                                          │
│                                                                   │
│  RFQ MODALS (Dynamic)                                             │
│  ├─ RFQModalDispatcher                                            │
│  │  └─ Fetch vendor.primary_category                              │
│  │  └─ Load matching template                                     │
│  │  └─ Render UniversalRFQModal with fields                       │
│  └─ UniversalRFQModal (6 Steps)                                   │
│     ├─ Step 1: Project Overview (Dynamic Q's)                     │
│     ├─ Step 2: Technical/Service Details                          │
│     ├─ Step 3: Materials/Preferences                              │
│     ├─ Step 4: Location & Timeline                                │
│     ├─ Step 5: Budget & Attachments                               │
│     └─ Step 6: Review & Submit (Login Required)                   │
│                                                                   │
│  API ENDPOINTS (New/Modified)                                     │
│  ├─ GET  /api/rfq-templates/[slug]                                │
│  ├─ GET  /api/rfq-templates (all)                                 │
│  ├─ POST /api/vendor-profile/update-category                      │
│  └─ POST /api/rfq/[rfq_id]/response (updated validation)          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA CHANGES

### Current State
- `VendorProfile`: Basic info (name, location, images, certs)
- `Category`: Static list (unused in current logic)
- `VendorCategory`: JoinTable (not enforcing primary)

### Required Changes

#### 1. VendorProfile Modifications

**New Columns:**
```sql
ALTER TABLE "VendorProfile" ADD COLUMN "primary_category_slug" VARCHAR(100);
ALTER TABLE "VendorProfile" ADD COLUMN "secondary_categories" TEXT[] DEFAULT '{}';
ALTER TABLE "VendorProfile" ADD COLUMN "other_services" TEXT;
ALTER TABLE "VendorProfile" ADD CONSTRAINT fk_primary_category 
  FOREIGN KEY ("primary_category_slug") REFERENCES "Category"("slug");
```

**Prisma Schema Update:**
```prisma
model VendorProfile {
  // ... existing fields ...
  
  // CATEGORY SYSTEM (NEW)
  primaryCategorySlug  String?           // e.g., "architectural_design"
  primaryCategory      Category?         @relation("primary", fields: [primaryCategorySlug], references: [slug])
  secondaryCategories  String[]          @default([])  // JSON array of slugs
  otherServices        String?           @db.Text      // Free text for unlisted services
  
  // EXISTING RELATIONS
  categories           VendorCategory[]
  
  @@index([primaryCategorySlug])
}

model Category {
  slug        String    @id  // Changed from UUID id to slug as primary
  name        String    @unique
  label       String    // e.g., "Architectural & Design"
  description String?   @db.Text
  icon        String?
  
  vendorProfiles VendorProfile[] @relation("primary")
  vendorCategories VendorCategory[]
  
  @@index([slug])
}
```

#### 2. RFQ Schema Updates (rfq_responses)

**Ensure all category-specific columns exist:**
```sql
ALTER TABLE "rfq_responses" ADD COLUMN IF NOT EXISTS "category_slug" VARCHAR(100);
ALTER TABLE "rfq_responses" ADD COLUMN IF NOT EXISTS "category_label" VARCHAR(200);
ALTER TABLE "rfq_responses" ADD COLUMN IF NOT EXISTS "template_version" INT DEFAULT 1;
-- All other category-specific fields should already exist from previous sessions
```

---

## 🗂️ FILE STRUCTURE & CREATION PLAN

### Phase 1: Core Foundations

#### 1.1 Canonical Categories (`lib/categories/`)
```
lib/categories/
├── canonicalCategories.js         (NEW - Main constant)
├── categoryUtils.js               (NEW - Helper functions)
└── categoryValidation.js          (NEW - Zod schemas)
```

**`lib/categories/canonicalCategories.js`:**
```javascript
export const CANONICAL_CATEGORIES = [
  {
    slug: 'architectural_design',
    label: 'Architectural & Design',
    description: 'Architectural design, 3D rendering, building plans',
    icon: 'Pencil',  // Lucide icon name
    order: 1,
  },
  {
    slug: 'building_masonry',
    label: 'Building & Masonry',
    description: 'Construction, walling, concrete works',
    icon: 'Hammer',
    order: 2,
  },
  // ... 18 more categories
];

export const CATEGORY_SLUG_TO_LABEL = {
  'architectural_design': 'Architectural & Design',
  'building_masonry': 'Building & Masonry',
  // ...
};

export const getCategoryBySlug = (slug) => 
  CANONICAL_CATEGORIES.find(c => c.slug === slug);
```

#### 1.2 RFQ Template System (`lib/rfqTemplates/`)
```
lib/rfqTemplates/
├── index.js                                (Template loader & validator)
├── templateSchema.js                       (Zod schema for templates)
├── categories/
│   ├── architectural_design.json           (NEW - Template for category)
│   ├── building_masonry.json
│   ├── roofing_waterproofing.json
│   ├── doors_windows_glass.json
│   ├── flooring_wall_finishes.json
│   ├── plumbing_drainage.json
│   ├── electrical_solar.json
│   ├── hvac_climate.json
│   ├── carpentry_joinery.json
│   ├── kitchens_wardrobes.json
│   ├── painting_decorating.json
│   ├── pools_water_features.json
│   ├── landscaping_outdoor.json
│   ├── fencing_gates.json
│   ├── security_smart.json
│   ├── interior_decor.json
│   ├── project_management_qs.json
│   ├── equipment_hire.json
│   ├── waste_cleaning.json
│   └── special_structures.json
└── sharedFields.json                       (Universal fields across all categories)
```

**Template Structure Example (`architectural_design.json`):**
```json
{
  "categorySlug": "architectural_design",
  "categoryLabel": "Architectural & Design",
  "templateVersion": 1,
  "steps": {
    "overview": {
      "stepNumber": 1,
      "title": "Project Overview",
      "description": "Tell us about your architectural project",
      "fields": [
        {
          "id": "project_type",
          "label": "Type of project",
          "type": "select",
          "required": true,
          "options": [
            { "value": "new_build", "label": "New Build" },
            { "value": "extension", "label": "Extension" },
            { "value": "renovation", "label": "Renovation" },
            { "value": "approval_only", "label": "Approval Only" }
          ]
        },
        {
          "id": "estimated_plot_size",
          "label": "Estimated plot size (sqm)",
          "type": "number",
          "required": false,
          "placeholder": "e.g., 500"
        },
        {
          "id": "number_of_floors",
          "label": "Number of floors",
          "type": "number",
          "required": true,
          "min": 1,
          "max": 50
        },
        {
          "id": "intended_use",
          "label": "Intended use",
          "type": "select",
          "required": true,
          "options": [
            { "value": "residential", "label": "Residential" },
            { "value": "commercial", "label": "Commercial" },
            { "value": "mixed", "label": "Mixed" }
          ]
        },
        {
          "id": "council_approvals_needed",
          "label": "Do you need council approvals?",
          "type": "radio",
          "required": true,
          "options": [
            { "value": "yes", "label": "Yes" },
            { "value": "no", "label": "No" },
            { "value": "unsure", "label": "Unsure" }
          ]
        },
        {
          "id": "existing_drawings",
          "label": "Do you have existing drawings?",
          "type": "file-upload",
          "required": false,
          "accepts": [".pdf", ".dwg", ".jpg", ".png"],
          "maxSize": 10485760,
          "maxFiles": 3
        }
      ]
    },
    "details": {
      "stepNumber": 2,
      "title": "Technical Details",
      "description": "Provide technical specifications",
      "fields": [
        // ... category-specific detail fields
      ]
    },
    // Steps 3, 4, 5, 6 continue with shared+custom fields
  },
  "sharedSteps": {
    "location": true,       // Include Step 4 (Location & Timeline)
    "budget": true,         // Include Step 5 (Budget & Attachments)
    "review": true          // Include Step 6 (Review & Submit)
  }
}
```

### Phase 2: API Layer

#### 2.1 RFQ Template API (`app/api/rfq-templates/`)
```
app/api/rfq-templates/
├── route.js                        (GET all templates)
└── [slug]/
    └── route.js                    (GET single template by category slug)
```

**`app/api/rfq-templates/route.js`:**
```javascript
// GET /api/rfq-templates
// Returns all 20 category templates with metadata
// Response: { templates: [{ slug, label, fields, steps }], total: 20 }
```

**`app/api/rfq-templates/[slug]/route.js`:**
```javascript
// GET /api/rfq-templates/[slug]
// Fetch specific category template
// Validates slug against CANONICAL_CATEGORIES
// Returns full template with all fields
```

#### 2.2 Vendor Category API (`app/api/vendor-profile/`)
```
app/api/vendor-profile/
├── update-primary-category/
│   └── route.js                    (POST - Set vendor's primary category)
├── add-secondary-category/
│   └── route.js                    (POST - Add secondary category)
└── remove-secondary-category/
    └── route.js                    (POST - Remove secondary category)
```

#### 2.3 Updated RFQ Response Endpoint

**Modify:** `app/api/rfq/[rfq_id]/response/route.js`
- Validate request fields against category template (not generic)
- Enforce RFQ submission limits (X per month/tier)
- Check for payment if limit exceeded
- Enhanced error messages (field mismatch, invalid category)

---

## 🎨 Component Architecture

### Phase 2: Components

#### 2.1 Dynamic RFQ Modal System
```
components/RFQModal/
├── RFQModalDispatcher.jsx          (NEW - Smart loader)
├── UniversalRFQModal.jsx           (NEW - 6-step container)
├── RFQStep1_Overview.jsx           (NEW - Dynamic fields)
├── RFQStep2_Details.jsx            (NEW)
├── RFQStep3_Materials.jsx          (NEW)
├── RFQStep4_Location.jsx           (NEW)
├── RFQStep5_Budget.jsx             (NEW)
├── RFQStep6_Review.jsx             (NEW)
├── RFQDraftManager.js              (NEW - Save/resume)
├── useRFQForm.js                   (NEW - Form state)
├── ModalHeader.jsx
├── ModalFooter.jsx
└── StepIndicator.jsx
```

**`RFQModalDispatcher.jsx`:**
- Checks if user is logged in (optional at open)
- Fetches vendor profile from URL param (if public RFQ request)
- Reads vendor.primary_category_slug
- Loads template from /api/rfq-templates/[slug]
- Renders `<UniversalRFQModal template={template} />`
- Handles 404 if invalid vendor/category

**`UniversalRFQModal.jsx`:**
- Container for all 6 steps
- Accepts `template` prop (category-specific config)
- Manages step navigation, form state, draft saving
- Injects category-specific fields into each step via template
- On Step 5: Check if user logged in → show auth modal if not
- On submit: Validate all fields, save RFQ, assign to vendor

#### 2.2 Vendor Profile Category UI
```
components/vendor-profile/
├── CategorySelector.jsx            (NEW - Primary category picker)
├── SecondaryCategoryManager.jsx    (NEW - Add/remove secondaries)
├── OtherServicesInput.jsx          (NEW - Free text field)
└── CategoryBadge.jsx               (Display read-only primary)
```

#### 2.3 Admin Dashboard
```
components/admin/
├── CategoryManagement.jsx          (NEW - CRUD categories)
├── TemplateEditor.jsx              (NEW - Edit RFQ templates)
├── OtherServicesReview.jsx         (NEW - Vendor submissions)
└── CategoryAnalytics.jsx           (NEW - Vendor distribution)
```

---

## 📋 IMPLEMENTATION PHASES

### PHASE 1: Backend Infrastructure (Weeks 1–3)

**Deliverables:**
- ✅ Prisma schema updated
- ✅ Database migrations (20 categories seeded)
- ✅ Canonical categories constant file
- ✅ RFQ template loader service
- ✅ Template API endpoints (GET /api/rfq-templates/*)
- ✅ Vendor category update endpoints

**Commits:**
1. `prisma: Add primary_category_slug and secondary_categories to VendorProfile`
2. `lib/categories: Create canonical categories system`
3. `lib/rfqTemplates: Create 20 category-specific templates`
4. `database: Seed Category table with 20 canonical entries`
5. `api: Create /api/rfq-templates endpoints`
6. `api: Create vendor category management endpoints`

**Testing:**
- [ ] Template loading works for all 20 categories
- [ ] API returns correct template for valid slug
- [ ] API returns 404 for invalid slug
- [ ] Database seeding populates 20 categories

---

### PHASE 2: Frontend Modal System (Weeks 4–6)

**Deliverables:**
- ✅ RFQModalDispatcher component
- ✅ UniversalRFQModal with 6 steps
- ✅ Dynamic field rendering per category
- ✅ Draft save/resume functionality
- ✅ Auth modal intercept at Step 5
- ✅ Form validation against template

**Commits:**
7. `components: Create RFQModalDispatcher`
8. `components: Create UniversalRFQModal with 6 steps`
9. `components: Create dynamic field rendering`
10. `lib: Create RFQ draft persistence service`
11. `components: Add draft save/resume UI`

**Testing:**
- [ ] Modal opens for vendor with primary category
- [ ] Correct template fields display
- [ ] Form fields validate per template schema
- [ ] Draft saves to S3/Context
- [ ] Resuming draft pre-fills form

---

### PHASE 3: Vendor Signup & Category Selection (Weeks 7–8)

**Deliverables:**
- ✅ Update vendor registration to require primary category
- ✅ Category selector UI (primary + secondary)
- ✅ Other services free-text field
- ✅ Profile edit page for category changes
- ✅ Category badges on vendor profiles

**Commits:**
12. `pages/vendor-registration: Add primary category selection`
13. `components: Create CategorySelector UI`
14. `pages/vendor-profile: Add category management section`

**Testing:**
- [ ] Vendor signup requires primary category
- [ ] Secondary categories can be added/removed
- [ ] Other services free text saves
- [ ] Existing vendors migrated (script assignment)

---

### PHASE 4: RFQ Submission & Admin Tools (Weeks 9–10)

**Deliverables:**
- ✅ Updated RFQ response endpoint (template validation)
- ✅ RFQ limit enforcement + payment modal
- ✅ Admin category CRUD pages
- ✅ Template editor UI
- ✅ Other services review dashboard

**Commits:**
15. `api/rfq/response: Update validation against template`
16. `api/rfq/response: Add RFQ limit + payment logic`
17. `pages/admin: Create category management pages`
18. `pages/admin: Create template editor`
19. `pages/admin: Create other services review panel`

**Testing:**
- [ ] RFQ submission validates against template
- [ ] RFQ limits enforced per subscription tier
- [ ] Payment modal triggered when limit exceeded
- [ ] Admin can view/edit categories
- [ ] Admin can review "other services"

---

### PHASE 5: Migration & Rollout (Weeks 11–12)

**Deliverables:**
- ✅ Migration scripts (assign existing vendors → categories)
- ✅ Data cleanup + validation
- ✅ Rollout documentation + runbooks
- ✅ Rollback procedures documented
- ✅ E2E testing suite

**Commits:**
20. `database: Create vendor migration scripts`
21. `docs: Migration & rollout playbook`

---

## 🔄 DATA MIGRATION STRATEGY

### Current State
- 500+ vendors (many without explicit category)
- Existing RFQs with mixed/generic category field

### Migration Plan

#### Step 1: Analyze Existing Data
```sql
SELECT 
  business_name,
  category,
  COUNT(*) as vendor_count
FROM vendors
GROUP BY category
ORDER BY vendor_count DESC;
```

#### Step 2: Mapping Script
Create mapping of existing categories → canonical categories
```javascript
// migrations/mapLegacyCategories.js
const LEGACY_TO_CANONICAL = {
  'architects': 'architectural_design',
  'builders': 'building_masonry',
  'contractors': 'project_management_qs',
  // ... map all existing categories
};
```

#### Step 3: Vendor Assignment
```sql
UPDATE "VendorProfile"
SET 
  "primary_category_slug" = 'building_masonry',
  "secondaryCategories" = '[]'
WHERE business_name LIKE '%contractor%';
-- Run for all legacy categories
```

#### Step 4: Validation
```javascript
// Verify all vendors have primary_category_slug
SELECT COUNT(*) as vendors_without_primary
FROM "VendorProfile"
WHERE "primary_category_slug" IS NULL;
```

#### Step 5: Fallback for Unmapped Vendors
- Vendors without category → Assigned to 'general-contractor' (add as 21st catch-all)
- Contact admin for manual category selection

---

## 🎯 GOLDEN RULES (Code Standards)

### 1. Category Slugs
- Always use `primaryCategorySlug` (snake_case)
- Never trust `categoryId` (use slug for deterministic behavior)
- Validate against `CANONICAL_CATEGORIES` constant

### 2. RFQ Templates
- Templates are immutable JSON files (version-controlled)
- New category? Add new JSON file, increment `templateVersion`
- Field IDs must match form state keys (kebab-case)

### 3. Form Validation
- Validate request body against template schema (Zod)
- Required fields determined by template, not hardcoded
- Error messages should include field label + template version

### 4. Database Consistency
- `VendorProfile.primaryCategorySlug` must match one of `CANONICAL_CATEGORIES[].slug`
- `VendorProfile.secondaryCategories` contains only valid slugs
- RFQ responses cannot be submitted without matching vendor category

### 5. Frontend State Management
- Draft state stored in Context + S3
- On modal open: Check Context for draft → Prompt to resume
- On logout: Clear draft from Context (S3 persists for login recovery)
- On RFQ submit: Delete draft from S3

---

## ✅ SUCCESS CRITERIA

### Phase 1 (Backend)
- [ ] All 20 categories seeded to database
- [ ] Vendor model supports primary + secondary categories
- [ ] Template API returns correct JSON for all 20 categories
- [ ] Backend tests pass (100+ test coverage)

### Phase 2 (Modal)
- [ ] Modal loads correct template for vendor's category
- [ ] All 6 steps render with dynamic fields
- [ ] Form validation works per template
- [ ] Draft save/resume tested end-to-end
- [ ] Auth intercept works at Step 5

### Phase 3 (Signup)
- [ ] New vendors required to select primary category
- [ ] Category editable post-signup
- [ ] 500+ existing vendors migrated with assignments
- [ ] No category assignment errors

### Phase 4 (RFQ)
- [ ] RFQ submission validates against template
- [ ] Admin can view all categories + templates
- [ ] "Other services" submissions visible to admin
- [ ] RFQ limits enforced per tier

### Phase 5 (Rollout)
- [ ] Staged rollout: 10% → 50% → 100%
- [ ] Monitoring alerts for template/category errors
- [ ] Rollback procedure tested (can revert in <30 min)

---

## 🚨 ROLLBACK PLAN

If critical issues found:

1. **Immediate:** Disable dynamic modal → show legacy generic form
2. **1 Hour:** Revert vendor.primary_category_slug to NULL
3. **2 Hours:** Revert all RFQ template changes
4. **4 Hours:** Full code rollback to last stable commit
5. **Ongoing:** Debug in staging, plan re-launch

---

## 📊 TESTING STRATEGY

### Unit Tests
- Category validation
- Template loading
- Field type validation
- Draft persistence

### Integration Tests
- Vendor registration → category assignment
- RFQ creation → template loading → submission
- Admin CRUD operations

### E2E Tests
1. Buyer creates RFQ for specific vendor
2. Correct template loads
3. Buyer fills form (guest)
4. At Step 5: Auth modal shown
5. Buyer logs in
6. Form preserved → Submit
7. RFQ appears in vendor inbox

---

## 🔗 API CONTRACT REFERENCE

### GET /api/rfq-templates
**Response:**
```json
{
  "templates": [
    {
      "slug": "architectural_design",
      "label": "Architectural & Design",
      "icon": "Pencil",
      "stepCount": 6
    },
    // ... 19 more
  ],
  "total": 20
}
```

### GET /api/rfq-templates/[slug]
**Response:**
```json
{
  "categorySlug": "architectural_design",
  "categoryLabel": "Architectural & Design",
  "templateVersion": 1,
  "steps": {
    "overview": { "fields": [...] },
    "details": { "fields": [...] },
    // ... steps 3-6
  }
}
```

### POST /api/vendor-profile/update-primary-category
**Request:**
```json
{
  "slug": "architectural_design"
}
```
**Response:**
```json
{
  "success": true,
  "vendorProfile": { ... }
}
```

### POST /api/rfq/[rfq_id]/response
**Updated:** Validate body against `/api/rfq-templates/[categorySlug]`

---

## 📚 DOCUMENTATION TO CREATE

1. **RFQ_MODAL_CATEGORY_SPEC.md** - Designer/QA reference
2. **CATEGORY_SYSTEM_ARCHITECTURE.md** - Developer guide
3. **TEMPLATE_JSON_SCHEMA.md** - How to add new templates
4. **ADMIN_CATEGORY_MANAGEMENT.md** - Admin user guide
5. **ROLLOUT_PLAYBOOK.md** - Staging & production steps
6. **MIGRATION_RUNBOOK.md** - Vendor data migration

---

## 💰 RESOURCE ESTIMATE

| Phase | Duration | Dev Hours | QA Hours | Total |
|-------|----------|-----------|----------|-------|
| 1: Backend | 3 weeks | 120 | 30 | 150 |
| 2: Modal | 3 weeks | 140 | 40 | 180 |
| 3: Signup | 2 weeks | 80 | 20 | 100 |
| 4: Admin | 2 weeks | 90 | 30 | 120 |
| 5: Migration | 2 weeks | 60 | 40 | 100 |
| **TOTAL** | **12 weeks** | **490** | **160** | **650** |

---

## 🎬 GETTING STARTED (Next 48 Hours)

1. **Day 1:**
   - [ ] Create `lib/categories/canonicalCategories.js`
   - [ ] Create 20 JSON template files in `lib/rfqTemplates/categories/`
   - [ ] Update Prisma schema

2. **Day 2:**
   - [ ] Run initial Prisma migration (add columns)
   - [ ] Create template API endpoints
   - [ ] Seed Category table with 20 entries

3. **Week 1:**
   - [ ] Commit Phase 1 changes to `phase/category-system` branch
   - [ ] Create PR with schema changes + templates
   - [ ] Begin Phase 2 (modal components)

---

## 📞 STAKEHOLDER SIGN-OFF

- [ ] Product Owner: Approve spec
- [ ] Engineering Lead: Approve architecture
- [ ] QA Lead: Approve testing strategy
- [ ] DevOps: Approve deployment plan

---

**End of Implementation Plan**

---

### Quick Links

- **Canonical Categories:** [20 Categories Specification](#canonical-categories)
- **RFQ Template Format:** [Template JSON Schema](#rfq-template-system)
- **Phase 1 Tasks:** [Backend Infrastructure](#phase-1-backend-infrastructure-weeks-1-3)
- **Testing Strategy:** [Testing Approach](#testing-strategy)

