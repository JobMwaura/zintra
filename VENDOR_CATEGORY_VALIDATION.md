# 📋 Vendor Category Validation System

## Overview

All vendors must have their `primaryCategorySlug` set to one of the **22 predefined categories** we've created. As the system evolves and new vendor types are needed, categories can be added to the list.

## The 22 Valid Categories (Current)

1. **general_contractor** - General Contractor
2. **architect** - Architect
3. **engineer** - Structural Engineer
4. **quantity_surveyor** - Quantity Surveyor
5. **interior_designer** - Interior Designer
6. **electrician** - Electrician
7. **plumber** - Plumber
8. **carpenter** - Carpenter
9. **mason** - Mason/Bricklayer
10. **painter** - Painter & Decorator
11. **tiler** - Tiler
12. **roofer** - Roofer
13. **welder** - Welder/Metal Fabricator
14. **landscaper** - Landscaper
15. **solar_installer** - Solar Installer
16. **hvac_technician** - HVAC Technician
17. **waterproofing** - Waterproofing Specialist
18. **security_installer** - Security System Installer
19. **materials_supplier** - Building Materials Supplier
20. **equipment_rental** - Equipment Rental
21. **hardware_store** - Hardware Store
22. **other** - Other

**Last Updated:** January 5, 2026

## Implementation

### 1. Validation Utility (`lib/vendors/vendorCategoryValidation.js`)

Central validation functions for all vendor category operations:

```javascript
import { 
  isValidCategorySlug,           // Check if a slug is valid
  validatePrimaryCategory,       // Validate primary category
  validateSecondaryCategories,   // Validate secondary categories
  validateVendorCategories,      // Validate both
  getCategoryLabel,              // Get display label for slug
  getAllValidCategories,         // Get all 22 categories
  sanitizeVendorCategories       // Remove invalid categories from data
} from '@/lib/vendors/vendorCategoryValidation';
```

### 2. Vendor Registration (`app/vendor-registration/page.js`)

When vendors register, their selected primary category is validated:

```javascript
import { isValidCategorySlug } from '@/lib/vendors/vendorCategoryValidation';

// In validation logic (Step 3):
if (currentStep === 3) {
  if (!formData.primaryCategorySlug) {
    newErrors.primaryCategorySlug = 'Select a primary category';
  } else if (!isValidCategorySlug(formData.primaryCategorySlug)) {
    newErrors.primaryCategorySlug = 'Selected category is not available';
  }
}
```

### 3. Category Update API (`app/api/vendor/update-categories.js`)

When vendors update their categories, server-side validation ensures only valid categories are saved:

```javascript
import { isValidCategorySlug } from '@/lib/vendors/vendorCategoryValidation';

// Validate primary category
if (!isValidCategorySlug(primaryCategorySlug)) {
  return Response.json(
    { error: `Invalid primary category: ${primaryCategorySlug}` },
    { status: 400 }
  );
}

// Validate secondary categories
if (Array.isArray(secondaryCategories)) {
  for (const slug of secondaryCategories) {
    if (!isValidCategorySlug(slug)) {
      return Response.json(
        { error: `Invalid secondary category: ${slug}` },
        { status: 400 }
      );
    }
  }
}
```

## Usage Examples

### Example 1: Check if a category is valid

```javascript
import { isValidCategorySlug } from '@/lib/vendors/vendorCategoryValidation';

if (isValidCategorySlug('electrician')) {
  console.log('✓ Valid');  // True
}

if (isValidCategorySlug('invalid_category')) {
  console.log('✓ Valid');  // False
}
```

### Example 2: Get all valid categories for a dropdown

```javascript
import { getAllValidCategories } from '@/lib/vendors/vendorCategoryValidation';

const categories = getAllValidCategories();
// Returns: [
//   { value: 'general_contractor', label: 'General Contractor' },
//   { value: 'architect', label: 'Architect' },
//   ...
// ]

categories.forEach(cat => {
  console.log(`${cat.label}: ${cat.value}`);
});
```

### Example 3: Validate vendor registration

```javascript
import { validateVendorCategories } from '@/lib/vendors/vendorCategoryValidation';

try {
  validateVendorCategories('electrician', ['plumbing', 'solar_installation']);
  console.log('✓ All categories valid');
} catch (error) {
  console.error(error.message);
  // "Invalid secondary categories: "solar_installation". 
  // Must be from: general_contractor, architect, ..."
}
```

### Example 4: Sanitize vendor data (remove invalid categories)

```javascript
import { sanitizeVendorCategories } from '@/lib/vendors/vendorCategoryValidation';

const vendorData = {
  id: '123',
  primaryCategorySlug: 'electrician',
  secondaryCategories: ['plumber', 'invalid_category']
};

const cleaned = sanitizeVendorCategories(vendorData);
// Returns:
// {
//   id: '123',
//   primaryCategorySlug: 'electrician',
//   secondaryCategories: ['plumber']  // invalid_category removed
// }
```

## Adding New Categories

When adding new vendor categories to the system:

### Step 1: Update `lib/constructionCategories.js`

```javascript
export const VENDOR_CATEGORIES = [
  // ... existing 22 categories ...
  { value: 'new_category_slug', label: 'New Category Label' },
];
```

### Step 2: Update comments in validation file

```javascript
// In lib/vendors/vendorCategoryValidation.js
// Update the total count and add new category to the list
// Last updated: [DATE]
// Total: 23 categories
// 
// 23. new_category_slug - New Category Label
```

### Step 3: That's it!

All validation functions automatically use the updated VENDOR_CATEGORIES, so:
- ✅ `isValidCategorySlug()` will accept the new category
- ✅ `getAllValidCategories()` will include it
- ✅ Registration and API routes will allow it

## Validation Points

### Client-Side Validation

1. **Vendor Registration** - Step 3 category selection
   - Prevents form submission with invalid category
   - User can only select from provided dropdown

2. **Category Management** - Profile page
   - Updates reflect only valid categories
   - Invalid selections prevented by UI

### Server-Side Validation

1. **Registration API** - When vendor is created
   - Validates primaryCategorySlug before insert
   - Returns 400 error if invalid

2. **Category Update API** - PUT /api/vendor/update-categories
   - Validates primary category
   - Validates all secondary categories
   - Returns 400 error if any invalid

## Benefits

✅ **Data Integrity** - No invalid categories in database
✅ **UI Consistency** - Always shows valid options
✅ **Future-Proof** - Easy to add new categories
✅ **Error Handling** - Clear messages when invalid
✅ **Type Safety** - Category slugs are validated everywhere

## Testing

### Manual Testing

```sql
-- Find vendors with valid categories
SELECT id, company_name, primaryCategorySlug, secondaryCategories 
FROM vendors 
WHERE primaryCategorySlug IN (
  'general_contractor', 'architect', 'engineer', 'quantity_surveyor',
  'interior_designer', 'electrician', 'plumber', 'carpenter',
  'mason', 'painter', 'tiler', 'roofer', 'welder', 'landscaper',
  'solar_installer', 'hvac_technician', 'waterproofing', 'security_installer',
  'materials_supplier', 'equipment_rental', 'hardware_store', 'other'
);

-- Find vendors with potentially invalid categories (edge cases)
SELECT id, company_name, primaryCategorySlug 
FROM vendors 
WHERE primaryCategorySlug NOT IN (
  'general_contractor', 'architect', 'engineer', 'quantity_surveyor',
  'interior_designer', 'electrician', 'plumber', 'carpenter',
  'mason', 'painter', 'tiler', 'roofer', 'welder', 'landscaper',
  'solar_installer', 'hvac_technician', 'waterproofing', 'security_installer',
  'materials_supplier', 'equipment_rental', 'hardware_store', 'other'
) 
AND primaryCategorySlug IS NOT NULL;
```

### Test Cases

1. ✅ Register vendor with valid category
2. ✅ Attempt to register with invalid category (should fail)
3. ✅ Update vendor primary category to valid (should succeed)
4. ✅ Update vendor primary category to invalid (should fail)
5. ✅ Add secondary categories (all valid)
6. ✅ Add secondary categories (mix of valid/invalid)

## Files Involved

- `lib/vendors/vendorCategoryValidation.js` - Validation utilities (NEW)
- `lib/constructionCategories.js` - Category definitions (UPDATED)
- `app/vendor-registration/page.js` - Registration UI (UPDATED)
- `app/api/vendor/update-categories.js` - Category API (UPDATED)
- `components/vendor-profile/CategoryManagement.js` - Profile UI (uses validation)
- `components/CategorySelector.js` - Category dropdown (already validates)

## Status

✅ **Validation utility created** - lib/vendors/vendorCategoryValidation.js
✅ **Registration updated** - Client-side validation added
✅ **API updated** - Server-side validation enabled
✅ **Documentation** - This comprehensive guide

All vendor categories are now validated against the 22 approved categories!

---

**Created:** January 5, 2026
**Status:** ✅ READY FOR DEPLOYMENT
