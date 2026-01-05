# RFQ System - Visual Architecture & Flow Diagram

## Current Architecture (What Should Work)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         /post-rfq Main Page                             │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     RFQ Type Selector                           │   │
│  │                                                                  │   │
│  │  [Direct RFQ] [Wizard RFQ] [Public RFQ]                        │   │
│  │   (orange)     (blue)       (green)                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
       │              │              │
       │              │              │
       ▼              ▼              ▼
  (Direct Path) (Wizard Path)  (Public Path)
```

---

## Direct RFQ Flow (Currently Broken 🔴)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ /post-rfq/direct/page.js                                                 │
│                                                                           │
│ <RfqProvider>  ✅ PROVIDER WRAPS MODAL                                   │
│   └─ <RFQModal rfqType="direct" isOpen={true} />                        │
│                                                                           │
│      ┌─────────────────────────────────────────────┐                    │
│      │  RFQModal (503 lines) - BROKEN              │                    │
│      │                                             │                    │
│      │  Local State:                               │                    │
│      │  - selectedCategory (NOT from context)      │                    │
│      │  - selectedJobType (NOT from context)       │                    │
│      │  - templateFields (NOT from context)        │                    │
│      │  - sharedFields (NOT from context)          │                    │
│      │                                             │                    │
│      │  Steps:                                     │                    │
│      │  1. Category Selection (generic dropdown)   │                    │
│      │  2. Job Type Selection (if needed)          │                    │
│      │  3. Template Fields (category-specific)     │                    │
│      │  4. Project Details (shared fields)         │                    │
│      │  5. Vendor Selection                        │                    │
│      │  6. Auth / Guest Submission                 │                    │
│      │  7. Review                                  │                    │
│      │  8. Success                                 │                    │
│      │                                             │                    │
│      │  On Submit:                                 │                    │
│      │  POST /api/rfq/create  ❌ ENDPOINT MISSING  │                    │
│      │                                             │                    │
│      │  ❌ 404 Not Found                           │                    │
│      │  ❌ Silent failure (no error handling)      │                    │
│      │  ❌ Users see "Network error"               │                    │
│      └─────────────────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Wizard RFQ Flow (Currently Broken 🔴)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ /post-rfq/wizard/page.js                                                 │
│                                                                           │
│ <RfqProvider>  ✅ PROVIDER WRAPS MODAL                                   │
│   └─ <RFQModal rfqType="wizard" isOpen={true} />                        │
│                                                                           │
│      ┌─────────────────────────────────────────────────────────┐        │
│      │  RFQModal (same as Direct - 503 lines) - BROKEN         │        │
│      │                                                         │        │
│      │  Local State:                                           │        │
│      │  - selectedCategory (NOT from context)                  │        │
│      │  - selectedJobType (NOT from context)                   │        │
│      │  - selectedVendors (NOT from context)                   │        │
│      │  - templateFields (NOT from context)                    │        │
│      │  - sharedFields (NOT from context)                      │        │
│      │                                                         │        │
│      │  Steps:                                                 │        │
│      │  1. Category Selection (generic dropdown)               │        │
│      │  2. Job Type Selection (if needed)                      │        │
│      │  3. Template Fields (category-specific)                 │        │
│      │  4. Project Details (shared fields)                     │        │
│      │  5. Vendor Matching (AUTO-MATCH by category)            │        │
│      │  6. Auth / Guest Submission                             │        │
│      │  7. Review                                              │        │
│      │  8. Success                                             │        │
│      │                                                         │        │
│      │  Expected Flow for Vendor Matching:                     │        │
│      │  - User selects category (e.g., "Building & Masonry")   │        │
│      │  - System queries vendors by category                   │        │
│      │  - User fills in project details                        │        │
│      │  - System shows matching vendors                        │        │
│      │  - User selects vendors OR proceeds with all matches    │        │
│      │                                                         │        │
│      │  On Submit:                                             │        │
│      │  POST /api/rfq/create  ❌ ENDPOINT MISSING              │        │
│      │                                                         │        │
│      │  ❌ 404 Not Found                                       │        │
│      │  ❌ Silent failure                                      │        │
│      │  ❌ Vendor matching never happens                       │        │
│      └─────────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Public RFQ Flow (Working ✅ but endpoint missing)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ /post-rfq/public/page.js                                                 │
│                                                                           │
│ <RfqProvider>  ✅ PROVIDER WRAPS MODAL                                   │
│   └─ <PublicRFQModalWrapper>                                            │
│        └─ <PublicRFQModal> (uses RfqContext) ✅                         │
│                                                                           │
│         ┌───────────────────────────────────────────────────────────┐   │
│         │  PublicRFQModal (505 lines) - WORKING ✅                  │   │
│         │                                                           │   │
│         │  Uses RfqContext: ✅                                      │   │
│         │  - selectedCategory (from context)                       │   │
│         │  - selectedJobType (from context)                        │   │
│         │  - templateFields (from context)                         │   │
│         │  - sharedFields (from context)                           │   │
│         │  - guestPhone (from context)                             │   │
│         │  - guestPhoneVerified (from context)                     │   │
│         │                                                           │   │
│         │  Features: ✅ ✅ ✅                                        │   │
│         │  - Beautiful category selector with SEARCH               │   │
│         │  - Beautiful job type list                               │   │
│         │  - Form auto-save every 2 seconds                        │   │
│         │  - Resume draft option                                   │   │
│         │  - Proper error handling                                 │   │
│         │                                                           │   │
│         │  Steps:                                                  │   │
│         │  1. Category Selection (PublicRFQCategorySelector) 🔥    │   │
│         │     - Grid layout                                        │   │
│         │     - Search functionality                               │   │
│         │     - Icons & descriptions                               │   │
│         │     - Green checkmark on select                          │   │
│         │                                                           │   │
│         │  2. Job Type Selection (PublicRFQJobTypeSelector) 🔥     │   │
│         │     - Clean list                                         │   │
│         │     - Category context displayed                         │   │
│         │                                                           │   │
│         │  3. Template Fields (RfqFormRenderer)                    │   │
│         │     - Category-specific fields only                      │   │
│         │     - Dynamic based on job type                          │   │
│         │                                                           │   │
│         │  4. Shared Fields                                        │   │
│         │     - Title, Description, Location, Budget               │   │
│         │     - Desired start date                                 │   │
│         │                                                           │   │
│         │  5. Auth Interception                                    │   │
│         │     - Guest submission with phone verification           │   │
│         │     - Existing user option                               │   │
│         │     - New signup option                                  │   │
│         │                                                           │   │
│         │  6. Success Message                                      │   │
│         │     - "RFQ posted successfully!"                         │   │
│         │     - Shows RFQ ID                                       │   │
│         │                                                           │   │
│         │  On Submit:                                              │   │
│         │  POST /api/rfq/create  ❌ ENDPOINT MISSING              │   │
│         │                                                           │   │
│         │  Data sent:                                              │   │
│         │  {                                                        │   │
│         │    rfqType: 'public',                                    │   │
│         │    categorySlug: 'building_masonry',                     │   │
│         │    jobTypeSlug: 'building_construction',                 │   │
│         │    templateFields: { /* category-specific */ },          │   │
│         │    sharedFields: { /* title, desc, etc */ },             │   │
│         │    guestPhone: '254712345678' (optional),                │   │
│         │    guestPhoneVerified: true (optional),                  │   │
│         │    userId: 'uuid' (if authenticated)                    │   │
│         │  }                                                        │   │
│         │                                                           │   │
│         │  ❌ 404 Not Found (endpoint missing)                    │   │
│         │  But has BETTER error handling than Direct/Wizard        │   │
│         └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Component Relationship Map

```
┌─────────────────────────────────────────────────────────────┐
│                     RfqContext (Provider)                   │
│                                                              │
│  Provides: selectedCategory, selectedJobType,               │
│            templateFields, sharedFields, userId, etc.       │
└─────────────────────────────────────────────────────────────┘
       ▲              ▲              ▲
       │              │              │
       │              │              └─────────────────────────┐
       │              │                                        │
       │              │           Used by PublicRFQModal ✅    │
       │              │                                        │
       │              │           NOT used by RFQModal ❌      │
       │              │                                        │
       │          Uses templates from:                         │
       │          /public/data/rfq-templates-v2-hierarchical   │
       │                                                        │
       │                                                        │
    [Direct Page]  [Wizard Page]  [Public Page]
       │              │              │
       ▼              ▼              ▼
    RFQModal    RFQModal    PublicRFQModal ✅
   (503 lines)  (503 lines)   (505 lines)
   ❌ Local      ❌ Local      ✅ Uses
   state only    state only    context
   
   Generic      Generic        Beautiful
   dropdowns    dropdowns      selectors
   
   ❌ No         ❌ No          ✅ Yes
   persistence  persistence    auto-save


All Three call: /api/rfq/create ❌ MISSING ENDPOINT
```

---

## The Missing Piece: `/api/rfq/create` Endpoint

```
┌──────────────────────────────────────────────────────────┐
│  /api/rfq/create  ❌ DOESN'T EXIST                        │
│                                                          │
│  What should it do:                                     │
│                                                          │
│  1. Accept POST request from modals                     │
│     Body: {                                             │
│       rfqType: 'direct' | 'wizard' | 'public',          │
│       categorySlug: string,                             │
│       jobTypeSlug: string,                              │
│       templateFields: object,                           │
│       sharedFields: object,                             │
│       selectedVendors: array, // for direct/wizard      │
│       userId?: string,        // if authenticated       │
│       guestEmail?: string,    // if guest               │
│       guestPhone?: string,    // if guest               │
│       guestPhoneVerified?: boolean                      │
│     }                                                   │
│                                                          │
│  2. Validate required fields                            │
│                                                          │
│  3. Check user authentication (if provided)             │
│                                                          │
│  4. Check RFQ quota (free vs paid)                      │
│                                                          │
│  5. Create RFQ record in database:                      │
│     - INSERT into 'rfqs' table                          │
│     - Store category & job type                         │
│     - Store template & shared fields                    │
│     - Set status to 'open'                              │
│     - Set visibility based on type                      │
│     - Set created_at timestamp                          │
│                                                          │
│  6. For WIZARD type:                                    │
│     - Query vendors matching category                   │
│     - Auto-assign vendors                               │
│     - Create vendor-RFQ relationships                   │
│                                                          │
│  7. For DIRECT type:                                    │
│     - Create vendor-RFQ relationships                   │
│     - Set with selected vendors                         │
│                                                          │
│  8. For PUBLIC type:                                    │
│     - Mark visibility as 'public'                       │
│     - Make available to all vendors                     │
│                                                          │
│  9. Return success response:                            │
│     {                                                   │
│       success: true,                                    │
│       rfqId: 'uuid',                                    │
│       message: 'RFQ created successfully'               │
│     }                                                   │
│                                                          │
│  10. Handle errors gracefully:                          │
│      - Validation errors (400)                          │
│      - Authentication errors (401)                      │
│      - Quota exceeded (402)                             │
│      - Server errors (500)                              │
└──────────────────────────────────────────────────────────┘
       ▲
       │
       │ POST from all 3 modals
       │
       │
    ┌──┴─┬──────┬─────────┐
    │    │      │         │
   Direct Wizard Public
   RFQModal RFQModal PublicRFQModal
```

---

## Data Flow on Submission

### Current (Broken) Flow

```
User fills form → Clicks Submit
    ↓
Modals construct formData:
{
  rfqType: 'public' | 'direct' | 'wizard',
  categorySlug: 'building_masonry',
  jobTypeSlug: 'building_construction',
  templateFields: { /* category-specific data */ },
  sharedFields: { /* title, desc, budget, etc */ },
  ... (other fields)
}
    ↓
Modals POST to: /api/rfq/create
    ↓
❌ ENDPOINT DOESN'T EXIST
    ↓
404 Not Found response
    ↓
No error handling
    ↓
User sees: "Network error. Please try again."
    ↓
🔴 SYSTEM APPEARS COMPLETELY BROKEN
```

### What Should Happen

```
User fills form → Clicks Submit
    ↓
Modal constructs formData
    ↓
Modal POST to: /api/rfq/create
    ↓
✅ ENDPOINT EXISTS
    ↓
Server validates data
    ↓
Server creates RFQ record:
  INSERT rfqs (
    user_id,
    title, description,
    category, job_type,
    template_fields, shared_fields,
    rfq_type,
    status, visibility,
    created_at
  )
    ↓
For WIZARD: Queries matching vendors
For DIRECT: Uses selected vendors
For PUBLIC: Available to all vendors
    ↓
Server creates vendor-RFQ relationships
    ↓
Server returns:
{
  success: true,
  rfqId: 'abc123',
  message: 'RFQ created successfully'
}
    ↓
Modal shows success:
"RFQ posted successfully! ✅"
    ↓
Modal clears form
    ↓
Modal closes (after 2 seconds)
    ↓
User is redirected to dashboard
    ↓
RFQ is visible to relevant vendors
```

---

## Template Structure Example

```
Category: Building & Masonry
├─ Slug: building_masonry
├─ Icon: 🏗️
├─ Description: "Construction, walls, foundations, slabs"
│
└─ Job Types:
   │
   ├─ Job Type: Building & Masonry Work
   │  ├─ Slug: building_construction
   │  ├─ Description: "Describe the building or structure..."
   │  │
   │  └─ Category-Specific Fields:
   │     ├─ what_building (text) - "What are you building?"
   │     ├─ scope_of_work (select) - "Scope of work"
   │     ├─ site_status (select) - "Current status of site"
   │     ├─ materials_supply (radio) - "Who supplies materials?"
   │     ├─ project_timeline (text) - "When do you want it done?"
   │     └─ ... (more fields)
   │
   └─ (Other job types for this category)


Shared Fields (same for all categories):
├─ Title: "Project Title" (required)
├─ Description: "Tell us more..." (required)
├─ County: "Select county" (required)
├─ Town: "Specific town" (optional)
├─ Budget Min: (optional)
├─ Budget Max: (optional)
├─ Desired Start Date: (optional)
└─ Location Details: (optional)
```

---

## Summary: System Architecture Issues

### 🔴 CRITICAL - Missing Endpoint
- `/api/rfq/create` doesn't exist
- All three modals call this endpoint
- Submissions fail silently

### 🟡 ARCHITECTURAL - Inconsistent Implementation
- **RFQModal**: Uses local state, generic selectors (503 lines)
- **PublicRFQModal**: Uses RfqContext, beautiful selectors (505 lines)
- Both do almost the same thing but differently

### 🟡 UX - Direct & Wizard Missing Features
- No form auto-save
- Generic category dropdown
- No draft persistence
- No resume option

### 🟡 CODE - Old Components Unclear
- **DirectRFQModal.js** - unused?
- **WizardRFQModal.js** - unused?
- Suggest deletion or clarification

### ✅ GOOD - RfqContext Properly Set Up
- Context initialized correctly
- All pages have RfqProvider wrapper
- Template system well-designed
- Category hierarchies defined

---

## Recommendation

```
DO THIS IMMEDIATELY (24 hours):
1. Create /api/rfq/create endpoint
2. Handle guest + authenticated submissions
3. Test all three RFQ types
4. Deploy

THEN (3-5 days):
1. Refactor RFQModal to use RfqContext
2. Add beautiful selectors to Direct/Wizard
3. Add form auto-save to Direct/Wizard
4. Remove unused modal components
5. Comprehensive testing
6. Update documentation
```

