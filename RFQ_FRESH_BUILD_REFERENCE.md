# 🚀 RFQ Fresh Build Reference

**Status**: Clean slate ready for fresh implementation  
**Date**: 6 January 2026  
**Commit**: `b6989f3` - Removed all RFQ page code

---

## What Was Deleted

✅ **Page Implementations Removed**:
- `/app/post-rfq/direct/page.js`
- `/app/post-rfq/wizard/page.js`
- `/app/post-rfq/public/page.js`

✅ **Component Implementations Removed**:
- `/components/RFQModal/` (entire folder with all step components)
- `/components/PublicRFQModal.js`
- `/components/PublicRFQModalWrapper.jsx`

✅ **Context & Utilities Removed**:
- `/context/RfqContext.js` (RFQ state management)
- `/lib/rfqTemplateUtils.js` (template loading utilities)

**Total deleted**: 21 files, ~4,686 lines of code

---

## What Was Preserved

✅ **All RFQ Flow Documentation** (~90 markdown files):

### Key Reference Documents
- `RFQ_COMPLETE_FLOW_ANALYSIS.md` - Complete 3-modal workflow
- `RFQ_SYSTEM_DOCUMENTATION_INDEX.md` - Navigation guide
- `RFQ_QUICK_REFERENCE.md` - Quick lookup
- `RFQ_MODAL_IMPLEMENTATION_ARCHITECTURE.md` - Architecture guide
- `RFQ_WIZARD_LOADING_FIX.md` - Loading issues and solutions
- `COMPREHENSIVE_RFQ_TEMPLATE_GUIDE.md` - Template system
- `RFQ_DATABASE_SCHEMA_ALIGNMENT.md` - Database structure
- `RFQ_SYSTEM_DEPLOYMENT_GUIDE.md` - Deployment checklist

### And 80+ more detailed documentation files covering:
- Flow diagrams and visual guides
- API endpoint specifications
- Database schema details
- Category system and templates
- Vendor response workflows
- Security and validation

---

## Architecture To Rebuild

Based on the preserved documentation, rebuild should include:

### 1. Three RFQ Types
```
Direct RFQ
├─ User selects specific vendors
├─ 7-step modal workflow
└─ Private visibility

Wizard RFQ
├─ System auto-matches vendors
├─ 7-step modal workflow
└─ Semi-private visibility

Public RFQ
├─ Visible to all matching vendors
├─ 5-step modal workflow (optimized)
└─ Public visibility
```

### 2. Modal Structure (7 steps for Direct/Wizard, 5 for Public)
```
Step 1: Category Selection
Step 2: Template Fields (category-specific)
Step 3: Project Details (shared across all types)
Step 4: Recipients/Visibility (type-specific)
Step 5: Authentication
Step 6: Review
Step 7: Success
```

### 3. Core Components Needed
- RFQModal.jsx (main modal container)
- Step components (Category, Template, General, Recipients, Auth, Review, Success)
- PublicRFQModal.jsx (optimized 5-step variant)
- RfqContext.js (state management)
- Template utilities (load categories, job types, fields)

### 4. Database Tables
- `rfqs` - RFQ records
- `rfq_responses` - Vendor responses
- `rfq_categories` - Category definitions
- `rfq_templates` - Template field definitions

### 5. API Endpoints
- `POST /api/rfq/create` - Submit RFQ
- `POST /api/rfq/[rfq_id]/response` - Vendor submit response
- `GET /api/vendor/eligible-rfqs` - List eligible RFQs for vendor

---

## Key Implementation Guidelines

From the preserved documentation:

### ✅ Do's
1. **Implement 3 separate modal types** - Each has distinct UX needs
2. **Use context for state** - RfqContext should persist form across unmounts
3. **Category-specific fields** - Load template fields based on selected category
4. **Auto-save drafts** - Especially for Public RFQ (every 2 seconds)
5. **Timeout all async calls** - Prevent infinite loading spinners
6. **Validate at each step** - Clear error messages
7. **Support guest submission** - Phone verification for guests

### ❌ Don'ts
1. Don't fetch templates on every render - cache them
2. Don't skip vendor filtering - must match user's category selection
3. Don't allow submission without auth verification
4. Don't show loading spinner indefinitely - hard timeout after 10s
5. Don't forget to handle Supabase errors gracefully

---

## File Structure To Create

```
app/post-rfq/
├─ page.js (main RFQ type selector)
├─ layout.js (wrapper)
├─ direct/
│  └─ page.js (direct RFQ page)
├─ wizard/
│  └─ page.js (wizard RFQ page)
└─ public/
   └─ page.js (public RFQ page)

components/
├─ RFQModal/
│  ├─ RFQModal.jsx (main container)
│  ├─ ModalHeader.jsx
│  ├─ ModalFooter.jsx
│  ├─ StepIndicator.jsx
│  └─ Steps/
│     ├─ StepCategory.jsx
│     ├─ StepTemplate.jsx
│     ├─ StepGeneral.jsx
│     ├─ StepRecipients.jsx
│     ├─ StepAuth.jsx
│     ├─ StepReview.jsx
│     └─ StepSuccess.jsx
├─ PublicRFQModal.js (5-step variant)
└─ PublicRFQModalWrapper.jsx

context/
└─ RfqContext.js (global RFQ state)

lib/
└─ rfqTemplateUtils.js (category/template loading)
```

---

## Quick Start for Rebuild

1. **Review the flow documentation** first
   - Start with `RFQ_COMPLETE_FLOW_ANALYSIS.md`
   - Review `COMPREHENSIVE_RFQ_TEMPLATE_GUIDE.md` for template structure

2. **Plan the implementation order**
   - Pages (page.js files)
   - Main modal component (RFQModal.jsx)
   - Step components
   - Context and utilities
   - API endpoints

3. **Test each piece as you build**
   - Modal opens without hanging
   - Categories load correctly
   - Form submission works
   - Vendor sees RFQs in dashboard

4. **Reference the database schema**
   - See `RFQ_DATABASE_SCHEMA_ALIGNMENT.md`
   - Ensure correct table names and columns

---

## Previous Issues Fixed (Reference)

These issues were resolved in the old code - learn from them:

1. **Infinite loading spinner**
   - Solution: Timeout all async calls (6-10 seconds)
   - Use Promise.race() with timeout

2. **Hydration mismatch flash**
   - Solution: Guard components with `mounted` state
   - Wait for useEffect to run before rendering interactive content

3. **Template loading failure**
   - Solution: Static import instead of fetch
   - Fallback to empty array if templates unavailable

4. **Vendor query hangs**
   - Solution: Soft-fail vendors if query times out
   - Still allow form to load without vendors

---

## Documentation Index

All preserved documentation is available in the repo root. Key files:

- `RFQ_COMPLETE_FLOW_ANALYSIS.md` - START HERE
- `RFQ_SYSTEM_DOCUMENTATION_INDEX.md` - Full index
- `COMPREHENSIVE_RFQ_TEMPLATE_GUIDE.md` - Templates
- `RFQ_MODAL_IMPLEMENTATION_ARCHITECTURE.md` - Architecture
- `RFQ_DATABASE_SCHEMA_ALIGNMENT.md` - Schema

---

## Ready to Build!

You now have:
- ✅ Clean codebase (no old baggage)
- ✅ Comprehensive flow documentation (90+ docs)
- ✅ Complete architecture reference
- ✅ Known pitfalls and solutions documented
- ✅ Database schema defined
- ✅ API endpoints specified

Build fresh with full context and best practices!

