# 🐛 Category Suggestions Error Fix
**Status:** ✅ FIXED  
**Date:** January 4, 2026  
**Severity:** Critical (affects RFQ form category suggestions)

---

## Error Description

**Error Message:**
```
TypeError: Cannot read properties of undefined (reading 'toLowerCase')
Error getting category suggestions: TypeError: Cannot read properties of undefined (reading 'toLowerCase')
```

**Location:** `components/RFQModal/Steps/StepGeneral.jsx`  
**Triggered by:** When user enters project title in RFQ form (triggers category suggestions)

---

## Root Cause Analysis

The error was in `/lib/matching/categorySuggester.js` where the code was referencing `category.name` instead of `category.label`.

### The Problem:
```javascript
// CANONICAL_CATEGORIES structure (from canonicalCategories.js)
{
  slug: 'electrical_solar',
  label: 'Electrical & Solar',      // ← This is the property name
  description: '...',
  icon: 'Zap',
  order: 7
}

// BUT categorySuggester.js was accessing:
category.name  // ← UNDEFINED! Should be category.label
```

When the code tried to call `.toLowerCase()` on `undefined`, it threw:
```
TypeError: Cannot read properties of undefined (reading 'toLowerCase')
```

### Three Affected Functions:

**1. Line 21 - `buildCategoryKeywordMap()`**
```javascript
const nameWords = category.name.toLowerCase().split(/\s+/);
//                          ^^^^
// WRONG: category.name is undefined
```

**2. Line 70 - `scoreCategoryMatch()`**
```javascript
const categoryNameWords = category.name.toLowerCase().split(/\s+/);
//                                 ^^^^
// WRONG: category.name is undefined
```

**3. Line 114 - `suggestCategories()`**
```javascript
const scores = CANONICAL_CATEGORIES.map(category => ({
  slug: category.slug,
  name: category.name,  // ← WRONG: Should be category.label
  //                ^^^^
```

---

## The Fix

Changed all three occurrences of `category.name` to `category.label` to match the actual property names in `CANONICAL_CATEGORIES`.

### Before:
```javascript
const nameWords = category.name.toLowerCase().split(/\s+/);
const categoryNameWords = category.name.toLowerCase().split(/\s+/);
name: category.name,
```

### After:
```javascript
const nameWords = category.label.toLowerCase().split(/\s+/);
const categoryNameWords = category.label.toLowerCase().split(/\s+/);
name: category.label,
```

---

## Files Modified

| File | Changes | Lines |
|------|---------|-------|
| `/lib/matching/categorySuggester.js` | Changed `category.name` → `category.label` (3 places) | 21, 70, 114 |

---

## Testing

### Test Case 1: Category Suggestions on Project Title
1. Open RFQ form in a vendor's profile
2. Type project title: "I need electrical wiring for my house"
3. Wait 1 second for category suggestions to appear
4. **Expected:** Categories suggest "Electrical & Solar" with high score
5. **Result:** ✅ No TypeError, suggestions appear correctly

### Test Case 2: Empty/Short Project Title
1. Type less than 3 characters in project title
2. **Expected:** No suggestions shown, no errors
3. **Result:** ✅ Handled gracefully

### Test Case 3: Multiple Keyword Matches
1. Type: "I need plumbing and electrical work"
2. **Expected:** Both "Plumbing & Drainage" and "Electrical & Solar" in suggestions
3. **Result:** ✅ Multiple suggestions appear with correct scores

---

## Impact Analysis

**What This Fixes:**
- ✅ Category suggestions now work in RFQ form
- ✅ StepGeneral component no longer throws errors
- ✅ Users can see smart category recommendations based on project title
- ✅ Form submission no longer blocked by suggestion errors

**What This Doesn't Break:**
- ✅ All other category functionality remains unchanged
- ✅ CANONICAL_CATEGORIES structure unchanged
- ✅ All other RFQ form features work as before
- ✅ No database changes needed

**Related Components Unaffected:**
- `components/DirectRFQPopup.js` - Uses different category selection (no suggestions)
- `components/CategorySelector.js` - Uses direct imports, no suggestions
- `lib/constructionCategories.js` - No changes needed
- All vendor category filters - Unaffected

---

## Deployment Notes

**Risk Level:** 🟢 **VERY LOW**
- Only fixes undefined error
- No breaking changes to API
- No database migrations needed
- Backward compatible with all existing code

**Testing Before Deployment:**
- [x] Test category suggestions in RFQ form
- [x] Test multiple keyword matching
- [x] Test with empty/short titles
- [x] Verify no console errors
- [x] Test form submission with suggestions selected

**Deployment Steps:**
1. Merge to main branch
2. Deploy to production
3. Verify category suggestions working in RFQ forms
4. Monitor error logs for any regressions

---

## Summary

This was a simple but critical bug where the code was trying to access a property that doesn't exist. By changing `category.name` to `category.label` to match the actual CANONICAL_CATEGORIES structure, the category suggestions feature now works perfectly and provides smart recommendations to users filling out RFQ forms.

The error catch block in StepGeneral.jsx was already in place, so the error was being handled gracefully but preventing suggestions from showing. This fix ensures suggestions appear as intended.
