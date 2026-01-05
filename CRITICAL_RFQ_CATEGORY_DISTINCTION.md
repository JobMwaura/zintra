# CRITICAL CLARIFICATION: RFQ System Category-Based Design

**Date**: January 6, 2026  
**Status**: ⚠️ **REQUIRES CORRECTION**

---

## The Core Issue

There is a **fundamental misunderstanding** about the RFQ system design that needs to be corrected:

### ❌ What I Built (INCORRECT INTERPRETATION)

I created a **separate full page** at `/post-rfq/direct` that:
- Loads vendor data
- Passes vendor's primary category to RFQModal
- Opens modal on a dedicated page

But this is **NOT what the existing system does**.

### ✅ What Actually Exists (THE CORRECT PATTERN)

The existing "Request Quote" on vendor profile:
- **Opens an inline modal** (overlay on the same page)
- **Does NOT navigate away**
- Modal renders RFQModal component inline
- Modal closes and returns to vendor profile

---

## The Three RFQ Types - CORRECTED

### 1. **Direct RFQ** (Inline Modal on Vendor Profile)

**Entry Point**: Vendor profile → "Request Quote" button

**What it does**:
- Opens an inline modal overlay (on vendor profile page)
- Modal shows "Request Quote from [Vendor Name]"
- Loads vendor's primary_category
- Shows **ONLY the form fields for that vendor's primary category**
  - Example: If vendor specializes in Electrical, show Electrical form only
  - Never show Carpentry, Plumbing, Roofing, etc. form fields
- User fills form and submits
- Returns to vendor profile after submit

**Key**: Category determines what form fields are shown

---

### 2. **Wizard RFQ** (Hub Page → Guided Selection)

**Entry Point**: RFQ hub page (`/post-rfq`) → "Request a Quote" or guided button

**What it does**:
- User navigates to `/post-rfq/wizard` page
- **User selects category** from list
- System loads that category's form fields
  - If user picks "Plumbing & Drainage", show plumbing-specific questions
  - If user picks "Roofing & Waterproofing", show roofing-specific questions
  - **Never show fields from other categories**
- System shows matching vendors (vendors in that category)
- User can review matched vendors before submitting
- On submit: RFQ goes to all matched vendors

**Key**: User chooses category, which determines form fields

---

### 3. **Public RFQ** (Hub Page → Public Marketplace)

**Entry Point**: RFQ hub page (`/post-rfq`) → "Post Public RFQ" button

**What it does**:
- User navigates to `/post-rfq/public` page
- **User selects category**
- System loads that category's form fields
  - Only fields relevant to the selected category
  - **Not a generic form, but category-specific**
- User fills category-specific details
- On submit: RFQ posted publicly
- All vendors in that category can see and bid

**Key**: Category determines form structure

---

## The Category-Based Form System (CRITICAL)

This is the KEY concept that I may not have fully explained:

### How Category-Based Forms Work

```
20 Canonical Categories
├─ Roofing & Waterproofing
│  ├─ Fields: Roof type, square footage, material preference, current condition
│  ├─ Job Types: New installation, repair, gutter cleaning
│  └─ Never shows: Electrical questions, plumbing questions, etc.
│
├─ Electrical Works
│  ├─ Fields: Voltage capacity, installation type, wiring preference
│  ├─ Job Types: New installation, rewiring, repair
│  └─ Never shows: Roofing questions, plumbing questions, etc.
│
├─ Plumbing & Drainage
│  ├─ Fields: Pipe material, water source, fixture count
│  ├─ Job Types: New installation, repair, maintenance
│  └─ Never shows: Electrical, roofing questions, etc.
│
└─ ... 17 more categories with unique fields
```

### Each Category Has Different Questions

**Roofing Form**:
```
1. What type of roof? (flat/pitched/curved)
2. Square footage?
3. Material preference? (asphalt/metal/tiles)
4. Current condition? (new/good/damaged)
5. Timeline?
6. Budget?
```

**Electrical Form**:
```
1. Electrical needs? (installation/repair/upgrade)
2. Voltage capacity? (single phase/three phase)
3. Wiring type? (underground/overhead)
4. Installation timeline?
5. Budget?
```

**Plumbing Form**:
```
1. Type of work? (new/repair/maintenance)
2. Pipe material? (PVC/copper/steel)
3. Water source? (municipal/borehole)
4. Number of fixtures?
5. Timeline?
6. Budget?
```

### The Critical Rule

**When a user/vendor selects a category:**
- **ONLY and ONLY that category's form fields should appear**
- No mixing of categories
- No generic "all-purpose" form
- No questions from other categories

---

## What I Built vs What Should Exist

### What I Built (Partially Correct)

✅ Created `/app/post-rfq/direct/page.js`
✅ Created `/app/post-rfq/wizard/page.js`
✅ Created `/app/post-rfq/public/page.js`
✅ Integrated with RFQModal

❌ **PROBLEM**: Created separate PAGES instead of understanding the inline modal pattern

### What Actually Needs to Happen

#### For Direct RFQ (Existing System)
The "Request Quote" button on vendor profile **already works correctly**:
- Opens inline modal
- Uses vendor's primary_category
- Shows only that category's form

**Status**: ✅ **Already implemented correctly in vendor profile**

#### For Wizard RFQ (New)
Need to build at `/post-rfq/wizard`:
- User selects from 20 categories
- RFQModal loads with `rfqType='wizard'`
- Category determines form fields dynamically
- Form shows only the selected category's questions

**Current Status**: ❓ **Partially built, but verify category-specific forms load correctly**

#### For Public RFQ (New)
Need to build at `/post-rfq/public`:
- User selects from 20 categories
- RFQModal loads with `rfqType='public'`
- Category determines form fields dynamically
- Shows only selected category's questions

**Current Status**: ❓ **Partially built, but verify category-specific forms load correctly**

---

## The Real Question: Is Category-Specific Form Loading Working?

This is what I need to verify:

### Current Implementation Check

**In RFQModal.jsx**, when user selects a category (in Wizard or Public):

```javascript
// When user selects category
const handleCategorySelect = (categorySlug) => {
  setFormData({...formData, selectedCategory: categorySlug});
  
  // Load that category's fields
  const fields = getFieldsForJobType(categorySlug);
  setTemplateFieldsMetadata(fields);
  
  // This should ONLY show fields for this category
  // Not fields from other categories
}
```

**Key Question**: Does `getFieldsForJobType()` correctly return **ONLY the fields for the selected category**?

### If Category-Specific Loading is Working ✅

Then the system is correct:
- Direct RFQ: Vendor's primary_category is pre-selected → only that category's form shows
- Wizard RFQ: User selects category → only that category's form shows
- Public RFQ: User selects category → only that category's form shows

### If Category-Specific Loading is NOT Working ❌

Then we have a major problem:
- Users might see mixed fields from multiple categories
- Forms might not be truly category-specific
- This would be a critical bug

---

## What Needs Verification

### 1. **RFQModal Form Field Loading**

When a category is selected, verify:
```javascript
// Get fields for "roofing_waterproofing"
const fields = getFieldsForJobType('roofing_waterproofing');
// Should return: [{name: 'roofType', ...}, {name: 'squareFootage', ...}, ...]
// Should NOT return: electrical, plumbing, carpentry, etc. fields
```

### 2. **Template System Structure**

The JSON template file structure:
```json
{
  "majorCategories": [
    {
      "slug": "roofing_waterproofing",
      "label": "Roofing & Waterproofing",
      "fields": [
        {name: "roofType", type: "select", required: true},
        {name: "squareFootage", type: "number", required: true},
        ...only roofing fields...
      ]
    },
    {
      "slug": "electrical_works",
      "label": "Electrical Works",
      "fields": [
        {name: "electricalNeeds", type: "select", required: true},
        {name: "voltageCapacity", type: "select", required: true},
        ...only electrical fields...
      ]
    },
    ...18 more categories with their unique fields...
  ]
}
```

**Verification**: Does the template file have this structure?

### 3. **Form Rendering in Modal**

When RFQModal renders the form fields:
```javascript
// In StepTemplate component
const renderFields = (templateFields) => {
  return templateFields.map(field => (
    <FormField key={field.name} field={field} />
  ));
};

// Should show ONLY fields from the selected category
// Example: If category='roofing', should NOT include electrical fields
```

---

## The Fix (If Needed)

If category-specific form loading is not working correctly:

### 1. Update Template System
Ensure each category has ONLY its own fields:
```javascript
export async function getFieldsForJobType(categorySlug) {
  const templates = await loadTemplates();
  const category = templates.majorCategories.find(
    c => c.slug === categorySlug
  );
  
  return category ? category.fields : [];
  // This should return ONLY fields for that category
}
```

### 2. Update Form Rendering
Ensure StepTemplate only renders the returned fields:
```javascript
const StepTemplate = ({ category, templateFields }) => {
  // Get fields for THIS category only
  const categoryFields = await getFieldsForJobType(category);
  
  // Render ONLY these fields
  return categoryFields.map(field => (
    <FormField key={field.name} field={field} value={formData[field.name]} />
  ));
};
```

### 3. Prevent Cross-Category Fields
Add validation:
```javascript
const validateCategoryFit = (category, submittedData) => {
  const allowedFields = getFieldsForJobType(category).map(f => f.name);
  
  // Check: Are there fields in submittedData that aren't in allowedFields?
  // If yes: REJECT submission
  
  const extraFields = Object.keys(submittedData).filter(
    f => !allowedFields.includes(f)
  );
  
  if (extraFields.length > 0) {
    throw new Error(`Invalid fields for ${category}: ${extraFields}`);
  }
};
```

---

## Summary of Distinction

| Aspect | Direct RFQ | Wizard RFQ | Public RFQ |
|--------|-----------|-----------|-----------|
| **Location** | Inline modal on vendor profile | Page `/post-rfq/wizard` | Page `/post-rfq/public` |
| **Category** | Pre-selected (vendor's primary) | User selects | User selects |
| **Form Fields** | Only vendor's primary category fields | Only selected category fields | Only selected category fields |
| **Recipients** | Single vendor only | Matched vendors | All in category |
| **Visibility** | Private | Private | Public |
| **Example** | Electrical vendor → Only electrical form | User picks Plumbing → Plumbing form | User picks Roofing → Roofing form |

---

## What You're Pointing Out

You're correctly identifying that:

1. **The form MUST be category-specific**
   - No generic forms
   - No mixing of category fields
   - Each category has unique questions

2. **Different entry points, same principle**
   - Direct: Vendor's category locked
   - Wizard: User selects category
   - Public: User selects category
   - **ALL must load ONLY that category's form fields**

3. **This is how the system proves it's "category-based"**
   - Not just storing category in database
   - But actually showing category-specific form fields
   - User for Electrical never sees Plumbing questions

---

## Next Action Required

I need to verify in the code:

1. ✅ Does RFQModal correctly load category-specific fields?
2. ✅ Does it prevent showing fields from other categories?
3. ✅ Are the three RFQ types using this correctly?

If there are issues, I'll fix:
- Template system to ensure category isolation
- RFQModal rendering to show only category fields
- Form validation to reject cross-category data

This is the core of what makes it a "category-based" system.
