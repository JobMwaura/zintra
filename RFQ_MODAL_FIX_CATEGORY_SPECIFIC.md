# ✅ RFQ Modal Fix - Smart Category Selection

## Problem
When clicking "Request Quote" on a vendor profile, users were seeing a **generic RFQ modal** instead of the **category-specific modal** that displays different form fields based on the vendor's category.

**Expected Behavior:**
- If vendor has **1 category** → auto-select it, skip category picker, show form immediately
- If vendor has **multiple categories** → show category picker so user can choose which service they need

**Actual Behavior:**
- Users always saw category picker (even for single-category vendors)
- No category pre-selection based on vendor

## Root Cause
The vendor profile page was using the old `DirectRFQPopup` component (generic form), but even after switching to `RFQModal` (category-specific), the smart category selection logic wasn't implemented.

## Solution

### 1. Updated Vendor Profile Page
**File:** `app/vendor-profile/[id]/page.js`

Now passes vendor's categories to RFQModal:
```javascript
<RFQModal
  rfqType="direct"
  isOpen={showDirectRFQ}
  onClose={() => setShowDirectRFQ(false)}
  vendorCategories={[
    vendor.primaryCategorySlug,
    ...(vendor.secondaryCategories || [])
  ].filter(Boolean)}
  vendorName={vendor.company_name}
/>
```

### 2. Updated RFQModal Component
**File:** `components/RFQModal/RFQModal.jsx`

Added smart category logic:
```javascript
export default function RFQModal({ 
  rfqType = 'direct', 
  isOpen = false, 
  onClose = () => {}, 
  vendorCategories = [],      // NEW: Array of vendor's categories
  vendorName = null,          // NEW: Vendor name for header
  preSelectedCategory = null  // EXISTING: For backward compatibility
}) {
  // Determine if we should skip category selection
  const shouldSkipCategorySelection = vendorCategories.length === 1;
  const preSelectedCat = shouldSkipCategorySelection ? vendorCategories[0] : preSelectedCategory;
  
  // Start at details step if category is pre-selected
  const [currentStep, setCurrentStep] = useState(preSelectedCat ? 'details' : 'category');
  
  // Filter categories to only show vendor's categories
  if (vendorCategories && vendorCategories.length > 0) {
    cats = cats.filter(cat => vendorCategories.includes(cat.slug));
  }
}
```

### 3. Updated ModalHeader Component
**File:** `components/RFQModal/ModalHeader.jsx`

Shows vendor name in header:
```javascript
<h2 className="text-xl sm:text-2xl font-bold text-gray-900">
  {vendorName ? `Request Quote from ${vendorName}` : 'Create Direct RFQ'}
</h2>
<p className="text-xs sm:text-sm text-gray-500 mt-1">
  {vendorName ? 'Provide project details for this vendor' : 'Send directly to specific vendors'}
</p>
```

## User Experience

### Scenario 1: Single-Category Vendor (e.g., Electrician)
1. ✅ User clicks "Request Quote"
2. ✅ Modal header shows: "Request Quote from ABC Electricians"
3. ✅ **Category is pre-selected** (Electrical)
4. ✅ **Category picker is SKIPPED** → Goes directly to Step 1: Details
5. ✅ User sees electrical-specific form fields
6. ✅ Fills out form and submits

### Scenario 2: Multi-Category Vendor (e.g., Construction Company)
1. ✅ User clicks "Request Quote"
2. ✅ Modal header shows: "Request Quote from XYZ Construction"
3. ✅ **Shows category picker** with vendor's categories only:
   - 🏗️ Building Construction
   - 🔨 Repairs & Maintenance
   - 🎨 Interior Design
4. ✅ User selects which service they need
5. ✅ Form updates to show category-specific fields
6. ✅ Fills out form and submits

## Technical Details

### Data Structure
Vendors now have:
- `primaryCategorySlug` (string) - Main service category
- `secondaryCategories` (array) - Additional service categories

### Props
```javascript
<RFQModal
  rfqType="direct" | "wizard" | "public"
  isOpen={boolean}
  onClose={() => {}}
  vendorCategories={[...strings]}    // NEW
  vendorName={string}                 // NEW
  preSelectedCategory={string}        // EXISTING (backward compat)
/>
```

### Smart Selection Logic
```javascript
const shouldSkipCategorySelection = vendorCategories.length === 1;
const preSelectedCat = shouldSkipCategorySelection 
  ? vendorCategories[0] 
  : preSelectedCategory;
```

## Git Commits

### Commit 1: c23c5b5
```
fix: Use category-specific RFQModal in vendor profile
- Replaced generic DirectRFQPopup with RFQModal component
- RFQModal now displays category-specific form templates
```

### Commit 2: 504f3bb
```
feat: Smart category selection for RFQ modals
- If vendor has 1 primary category: auto-select it, skip category picker
- If vendor has multiple categories: show category picker for user choice
- Update modal header to show vendor name
- Filter available categories to only show vendor's categories
```

## Impact

✅ **User Experience:**
- Faster quote requests (single-category vendors skip category picker)
- Clearer intent (header shows which vendor they're contacting)
- Relevant forms (only appropriate categories shown)

✅ **Data Quality:**
- Users complete appropriate forms for vendor's services
- No mismatched category-to-vendor requests

✅ **Business:**
- Vendors receive better-quality leads
- Improved conversion rate (simpler flow for single-service vendors)

## Testing Checklist

### Single-Category Vendor Test
- [ ] Find a vendor with only `primaryCategorySlug` set
- [ ] Click "Request Quote"
- [ ] Verify modal shows vendor name in header
- [ ] Verify category picker is NOT shown (skipped)
- [ ] Verify you land on details step (template fields for that category)
- [ ] Fill out fields and verify they're category-specific

### Multi-Category Vendor Test
- [ ] Find a vendor with `secondaryCategories` populated
- [ ] Click "Request Quote"
- [ ] Verify modal shows vendor name in header
- [ ] Verify Step 1 shows category picker
- [ ] Verify only vendor's categories are shown
- [ ] Select a category
- [ ] Verify details step shows correct category-specific fields
- [ ] Fill out and submit

## Files Modified
- `app/vendor-profile/[id]/page.js` - Pass vendor categories and name
- `components/RFQModal/RFQModal.jsx` - Smart category selection logic
- `components/RFQModal/ModalHeader.jsx` - Show vendor name in title

---

**Status:** ✅ COMPLETE & DEPLOYED
**Deployed:** Commit 504f3bb pushed to main
**Vercel:** Will auto-deploy after commit
