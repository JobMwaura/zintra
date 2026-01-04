# CATEGORY-DRIVEN VENDORS SYSTEM
## Developer Quick Reference Guide

**Status:** Phase 1 Complete | Ready for Phase 2  
**Updated:** January 4, 2026

---

## 🚀 QUICK IMPORTS

### Import Canonical Categories
```javascript
import { 
  CANONICAL_CATEGORIES,
  getCategoryBySlug,
  CATEGORY_SLUG_TO_LABEL,
  getCategoriesForDisplay 
} from '@/lib/categories';

// Usage
const category = getCategoryBySlug('architectural_design');
const allCategories = CANONICAL_CATEGORIES;  // Array of 20
const options = getCategoriesForDisplay();    // Formatted for dropdowns
```

### Import Category Utils
```javascript
import { 
  formatCategoryLabel,
  getCategoryIcon,
  validatePrimaryCategory,
  validateSecondaryCategories,
  getCategorySummary
} from '@/lib/categories';

// Usage
const label = formatCategoryLabel('architectural_design');  // "Architectural & Design"
const isValid = validatePrimaryCategory('building_masonry').isValid;
```

### Import Zod Schemas
```javascript
import { 
  updatePrimaryCategorySchema,
  vendorCategorySetupSchema,
  rfqTemplateSchema
} from '@/lib/categories';

// Usage
const result = vendorCategorySetupSchema.parse(formData);
if (!result.success) console.log(result.error);
```

### Import Template Loader
```javascript
import { 
  getRFQTemplate,
  getAllTemplates,
  getTemplateSteps,
  getTemplateStepFields,
  validateFormDataAgainstTemplate
} from '@/lib/rfqTemplates';

// Usage
const template = await getRFQTemplate('architectural_design');
const steps = await getTemplateSteps('building_masonry');
const validation = await validateFormDataAgainstTemplate('roofing_waterproofing', formData);
```

---

## 📋 COMMON PATTERNS

### Pattern 1: Validate and Save Vendor Category
```javascript
import { updatePrimaryCategorySchema } from '@/lib/categories';

// API endpoint: app/api/vendor-profile/update-primary-category/route.js
export async function POST(req) {
  try {
    const body = await req.json();
    const validated = updatePrimaryCategorySchema.parse(body);
    
    // Save to database
    const vendor = await prisma.vendorProfile.update({
      where: { userId: req.user.id },
      data: {
        primaryCategorySlug: validated.slug,
      },
    });
    
    return Response.json({ success: true, vendor });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

### Pattern 2: Load Correct RFQ Modal for Vendor
```javascript
import { getRFQTemplate } from '@/lib/rfqTemplates';

// Component: RFQModalDispatcher
export async function RFQModalDispatcher({ vendorId }) {
  // Fetch vendor
  const vendor = await fetch(`/api/vendor/${vendorId}`);
  const { primaryCategorySlug } = vendor.json();
  
  // Load template
  const template = await getRFQTemplate(primaryCategorySlug);
  
  // Render dynamic modal
  return <UniversalRFQModal template={template} />;
}
```

### Pattern 3: Validate RFQ Form Data Against Template
```javascript
import { validateFormDataAgainstTemplate } from '@/lib/rfqTemplates';

export async function submitRFQ(categorySlug, formData) {
  // Validate against template
  const validation = await validateFormDataAgainstTemplate(categorySlug, formData);
  
  if (!validation.valid) {
    // Show errors
    return { errors: validation.errors };
  }
  
  // Save RFQ
  const rfq = await prisma.rfqResponse.create({
    data: {
      ...formData,
      categorySlug,
    },
  });
  
  return { success: true, rfq };
}
```

### Pattern 4: Display Category in UI
```javascript
import { 
  formatCategoryLabel, 
  getCategoryIcon,
  getCategoryDescription 
} from '@/lib/categories';
import { LucideIcon } from 'lucide-react';

export function CategoryBadge({ slug }) {
  const label = formatCategoryLabel(slug);
  const icon = getCategoryIcon(slug);
  const description = getCategoryDescription(slug);
  
  return (
    <div title={description}>
      <LucideIcon name={icon} className="w-4 h-4" />
      <span>{label}</span>
    </div>
  );
}
```

---

## 🔍 ALL 20 CATEGORIES

| # | Slug | Label | Icon |
|---|------|-------|------|
| 1 | `architectural_design` | Architectural & Design | Pencil |
| 2 | `building_masonry` | Building & Masonry | Hammer |
| 3 | `roofing_waterproofing` | Roofing & Waterproofing | Home |
| 4 | `doors_windows_glass` | Doors, Windows & Glass | Square |
| 5 | `flooring_wall_finishes` | Flooring & Wall Finishes | Grid |
| 6 | `plumbing_drainage` | Plumbing & Drainage | Droplets |
| 7 | `electrical_solar` | Electrical & Solar | Zap |
| 8 | `hvac_climate` | HVAC & Climate Control | Wind |
| 9 | `carpentry_joinery` | Carpentry & Joinery | Hammer |
| 10 | `kitchens_wardrobes` | Kitchens & Wardrobes | Box |
| 11 | `painting_decorating` | Painting & Decorating | Palette |
| 12 | `pools_water_features` | Swimming Pools & Water Features | Waves |
| 13 | `landscaping_outdoor` | Landscaping & Outdoor Works | Leaf |
| 14 | `fencing_gates` | Fencing & Gates | Grid3x3 |
| 15 | `security_smart` | Security & Smart Systems | Shield |
| 16 | `interior_decor` | Interior Design & Décor | Sofa |
| 17 | `project_management_qs` | Project Management & QS | CheckCircle |
| 18 | `equipment_hire` | Equipment Hire & Scaffolding | Truck |
| 19 | `waste_cleaning` | Waste Management & Site Cleaning | Trash2 |
| 20 | `special_structures` | Special Structures | Factory |

---

## 📊 TEMPLATE STRUCTURE

Every RFQ template has this structure:

```json
{
  "categorySlug": "string",           // Must match CANONICAL_CATEGORIES
  "categoryLabel": "string",          // Display name
  "templateVersion": 1,               // Increment when template changes
  "steps": {
    "overview": {
      "stepNumber": 1,
      "title": "string",
      "description": "string",
      "fields": [
        {
          "id": "field_key",          // Form data key
          "label": "Display Label",   // For UI
          "type": "select|radio|text|number|textarea|file-upload|...",
          "required": true,           // Default false
          "options": [
            { "value": "...", "label": "..." }
          ]
        }
      ]
    },
    "details": { ... },               // Step 2
    "materials": { ... },             // Step 3
    "location": { ... },              // Step 4 (shared)
    "budget": { ... },                // Step 5 (shared)
    "review": { ... }                 // Step 6 (shared)
  }
}
```

---

## ✅ VALIDATION CHECKLIST

Before pushing code using categories:

- [ ] Imported from `lib/categories` not `lib/constructionCategories`
- [ ] Used slug (not label) for database/API
- [ ] Validated user input with Zod schema
- [ ] Handled slug `undefined` gracefully
- [ ] Used `getCategoryBySlug()` for lookups (not manual search)
- [ ] Loaded templates with error handling
- [ ] Tested with all 20 categories
- [ ] No hardcoded category values

---

## 🚨 COMMON MISTAKES

### ❌ DON'T: Use label in database
```javascript
// WRONG
vendor.category = 'Architectural & Design';

// RIGHT
vendor.primaryCategorySlug = 'architectural_design';
```

### ❌ DON'T: Forget error handling on template load
```javascript
// WRONG
const template = await getRFQTemplate(slug);  // May throw

// RIGHT
try {
  const template = await getRFQTemplate(slug);
} catch (error) {
  return showError('Category template not found');
}
```

### ❌ DON'T: Mutate categories array
```javascript
// WRONG
CANONICAL_CATEGORIES.push({ slug: 'new', ... });

// RIGHT
// Categories are immutable - add to file only
```

### ❌ DON'T: Hardcode category checks
```javascript
// WRONG
if (slug === 'architectural_design' || slug === 'building_masonry') { ... }

// RIGHT
const isValid = isValidCategorySlug(slug);
```

---

## 🧪 TESTING SNIPPETS

### Test 1: Validate All Categories
```javascript
import { CANONICAL_CATEGORIES, isValidCategorySlug } from '@/lib/categories';

test('all 20 categories are valid', () => {
  expect(CANONICAL_CATEGORIES).toHaveLength(20);
  
  CANONICAL_CATEGORIES.forEach(cat => {
    expect(cat.slug).toBeTruthy();
    expect(cat.label).toBeTruthy();
    expect(isValidCategorySlug(cat.slug)).toBe(true);
  });
});
```

### Test 2: Load All Templates
```javascript
import { getAllTemplates } from '@/lib/rfqTemplates';

test('all 20 templates load successfully', async () => {
  const templates = await getAllTemplates();
  expect(Object.keys(templates)).toHaveLength(20);
});
```

### Test 3: Validate Schema
```javascript
import { vendorCategorySetupSchema } from '@/lib/categories';

test('schema validates correct data', () => {
  const data = {
    primaryCategory: 'architectural_design',
    secondaryCategories: ['building_masonry'],
    otherServices: 'Custom consulting',
  };
  
  const result = vendorCategorySetupSchema.safeParse(data);
  expect(result.success).toBe(true);
});
```

---

## 🔗 RELATED FILES

**Configuration:**
- `lib/categories/canonicalCategories.js` - Category definitions
- `lib/rfqTemplates/categories/*.json` - Template files

**Schemas:**
- `lib/categories/categoryValidation.js` - Zod schemas

**Utils:**
- `lib/categories/categoryUtils.js` - Helper functions

**API Routes (To Be Built):**
- `app/api/rfq-templates/route.js` - GET all templates
- `app/api/rfq-templates/[slug]/route.js` - GET single template
- `app/api/vendor-profile/update-primary-category/route.js` - Update vendor category

**Components (To Be Built):**
- `components/RFQModal/RFQModalDispatcher.jsx` - Smart modal loader
- `components/RFQModal/UniversalRFQModal.jsx` - 6-step form

---

## 📚 FULL DOCUMENTATION

For comprehensive details, see:
- **Implementation Plan:** `CATEGORY_DRIVEN_VENDORS_IMPLEMENTATION_PLAN.md`
- **Phase 1 Summary:** `PHASE1_DELIVERY_SUMMARY.md`
- **Architecture Diagram:** Inside implementation plan

---

## 🎯 NEXT STEPS

1. **Today:** Create remaining 18 RFQ templates
2. **Today:** Update Prisma schema + run migration
3. **Tomorrow:** Create API endpoints
4. **Tomorrow:** Start building modal components
5. **This week:** Integration testing

---

**Questions?** Check the implementation plan or contact the team.

