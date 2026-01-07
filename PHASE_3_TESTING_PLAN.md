# Phase 3: Testing & Integration Plan

**Date:** January 7, 2026  
**Status:** 🟡 PLANNED  
**Estimated Duration:** 1-2 hours  

## Overview

Phase 3 validates that the "Other" option implementation works correctly across all RFQ categories, from user selection through vendor notification.

## Pre-Testing Checklist

Before running tests, ensure:
- ✅ Phase 2 commit e943ff5 is deployed
- ✅ Dev server running: `npm run dev`
- ✅ Database is accessible
- ✅ Browser dev tools available for inspection
- ✅ Test account with vendor access

## Testing Sections

### Section 1: Dropdown Functionality Testing

**Objective:** Verify "Other" text input appears/disappears correctly

**Test Cases (Run on each RFQ category):**

1. **Architectural Services RFQ**
   ```
   Steps:
   1. Navigate to Create RFQ
   2. Select "Architectural Services" category
   3. Go to Details step
   4. Find first select field (e.g., "Type of Job")
   5. Select "Other" from dropdown
   6. ✓ Verify: Blue text input appears below dropdown
   7. ✓ Verify: Placeholder text shows field-specific prompt
   8. Change selection back to standard option
   9. ✓ Verify: Blue text input disappears
   10. Select "Other" again
   11. ✓ Verify: Text input appears again
   ```

2. **Building Services RFQ**
   - Repeat test steps for different category
   - Verify pattern is consistent

3. **Remaining 18 Categories**
   - Quick smoke test (spot check 5-6 more categories)
   - Verify at least one "Other" field per category works

**Success Criteria:**
- ✅ Text input appears immediately when "Other" selected
- ✅ Text input disappears immediately when other option selected
- ✅ Works consistently across all tested categories
- ✅ No console errors in browser dev tools

---

### Section 2: Form State & Data Capture Testing

**Objective:** Verify custom values are stored in form state correctly

**Test Steps:**

```javascript
// In browser console, you can check form state:
1. Navigate to RFQ Details form
2. Open Browser DevTools (F12) → Console
3. Type: window.__NEXT_DATA__ (to inspect Next.js state if available)
   OR look for formValues in React component props

4. Select "Other" from a dropdown field
5. Type custom value: "Custom requirement text here"
6. Check that formValues contains:
   - field_name: "Other"
   - field_name_custom: "Custom requirement text here"

7. Change to different field's "Other"
8. Type different custom value
9. Verify both custom fields in formValues are captured
```

**Success Criteria:**
- ✅ Custom value stored with correct `_custom` suffix pattern
- ✅ Multiple "Other" fields on same form each store separate custom values
- ✅ Switching between fields doesn't clear other values

---

### Section 3: Form Submission Testing

**Objective:** Verify custom values are submitted to API and stored in database

**Test Steps:**

```
1. Fill out complete RFQ form with at least 2 "Other" selections
   Example:
   - Type of Job: "Other" → "Kitchen redesign with island"
   - Special Requirements: "Other" → "Need to work around existing furniture"

2. Fill remaining required fields with valid data

3. Submit form (click Create RFQ button)

4. ✓ Verify: Form submission succeeds
   - No error messages
   - Redirect to success page or RFQ list

5. Open database to verify storage:
   - Connect to Supabase
   - Query table: public.rfqs
   - Find newly created RFQ
   - Check services_required JSONB field
   
   Expected content:
   {
     "type_of_job": "Other",
     "type_of_job_custom": "Kitchen redesign with island",
     "special_requirements": "Other",
     "special_requirements_custom": "Need to work around existing furniture",
     ...other fields
   }

6. ✓ Verify: Both selected value AND custom text present in JSONB field
```

**Database Verification Query:**
```sql
-- Check latest RFQ
SELECT 
  id,
  created_at,
  services_required
FROM public.rfqs
ORDER BY created_at DESC
LIMIT 5;

-- Should show JSON structure with both:
-- "field_name": "Other"
-- "field_name_custom": "user's text"
```

**Success Criteria:**
- ✅ API accepts submission with custom values
- ✅ No validation errors
- ✅ JSONB field stores both value and custom text
- ✅ Custom values persist in database

---

### Section 4: Vendor Display Testing

**Objective:** Verify vendors can see custom explanations in RFQ details

**Test Steps:**

```
1. Log in as Vendor user
2. Navigate to My Quotes or RFQ Browse
3. Find the RFQ created in Section 3 (with "Other" selections)
4. Click to view RFQ details

5. Check RFQ detail view:
   ✓ Verify: "Type of Job" shows "Other"
   ✓ Verify: Custom text displays below or near "Other" selection
   ✓ Verify: Formatting is clear and readable
   
   Expected display:
   Type of Job: Other - Kitchen redesign with island
   
   OR (if separate display):
   Type of Job: Other
   Additional Details: Kitchen redesign with island

6. Check all "Other" fields display custom text correctly

7. Test mobile view:
   ✓ Verify: Text displays without truncation
   ✓ Verify: Layout remains readable
```

**Success Criteria:**
- ✅ Custom text is visible to vendors
- ✅ Clear association between "Other" and custom explanation
- ✅ No missing or truncated text
- ✅ Works on mobile and desktop

---

### Section 5: Notification Testing

**Objective:** Verify vendors receive custom values in email notifications

**Test Steps:**

```
1. Create new RFQ with "Other" selections (Section 3 steps)

2. When RFQ is created, vendor should receive notification email

3. Check vendor's email:
   ✓ Verify: Email includes RFQ details
   ✓ Verify: "Other" selections are mentioned
   ✓ Verify: Custom text is included in email body

   Expected email content:
   "Type of Job: Other - Kitchen redesign with island"
   
4. Check email formatting:
   ✓ Verify: Text is readable
   ✓ Verify: No encoding issues
   ✓ Verify: Links work correctly
```

**Success Criteria:**
- ✅ Vendor receives notification
- ✅ Custom values included in email
- ✅ Formatting is clear and professional

---

## Testing Matrix

| Category | Dropdown Test | Form Submit | DB Verify | Vendor View |
|----------|:---:|:---:|:---:|:---:|
| Architectural | ✅ | ✅ | ✅ | ✅ |
| Building | ✅ | ✅ | ✅ | ✅ |
| Roofing | ✅ |  |  |  |
| Doors | ✅ |  |  |  |
| Flooring | ✅ |  |  |  |
| Plumbing | ✅ |  |  |  |
| Electrical | ✅ |  |  |  |
| Others (13) | ✅ |  |  |  |

**Legend:**
- Full test on at least 2-3 categories
- Smoke test on remaining categories
- Focus on full testing if any issues found

---

## Issue Tracking

Use this section to log any issues found:

### Issue Template
```
**Issue #[N]: [Title]**
- Affected Component: [RfqFormRenderer.js | Database | Vendor UI]
- Category: [Architectural | Building | etc.]
- Steps to Reproduce: [Clear steps]
- Expected Result: [What should happen]
- Actual Result: [What actually happens]
- Severity: [Critical | High | Medium | Low]
- Fix: [If applied]
```

### Current Issues
None found yet.

---

## Performance Baseline

Before testing, establish baseline:

```bash
# Check network performance in DevTools
1. Open DevTools → Network tab
2. Clear cache
3. Load RFQ form page
4. Note Load time: ____ms
5. Note Largest Contentful Paint: ____ms

After testing:
6. No significant increase in load times
7. No new network requests
8. No memory leaks (check Heap snapshot)
```

---

## Accessibility Testing

Verify accessibility standards:

- ✅ Keyboard navigation works
  - Tab through all fields
  - Enter to activate selects
  - Space to select options

- ✅ Screen reader compatible
  - Labels properly associated with inputs
  - Placeholder text is descriptive
  - Required field indicators clear

- ✅ Color contrast
  - Blue box meets WCAG AA standards
  - Text readable on blue background

---

## Browser Testing

Test on multiple browsers:

- [ ] Chrome 90+ (Primary)
- [ ] Firefox 88+ (Secondary)
- [ ] Safari 14+ (Mac)
- [ ] Edge 90+ (Windows)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

---

## Rollback Plan

If critical issues found:

```bash
# Revert Phase 2 commit
git revert e943ff5 --no-edit

# Or revert to Phase 1
git checkout ef0479c -- components/RfqFormRenderer.js components/TemplateFieldRenderer.js

# Push revert
git push origin main
```

---

## Sign-Off

**Phase 3 Testing Complete When:**
- [ ] All dropdown functionality tests pass
- [ ] Form submission works across categories
- [ ] Database stores custom values correctly
- [ ] Vendors can view custom text
- [ ] At least 5 categories fully tested
- [ ] No critical issues remaining
- [ ] Documentation updated

**Tested By:** [Your name]  
**Date Completed:** [Date]  
**Sign-Off:** [Approved/Rejected]

---

## Phase 3 Success Summary

If all tests pass, Phase 3 is complete and ready for Phase 4 (Production Deployment).

**Success Criteria Met:**
- ✅ "Other" functionality works across all tested categories
- ✅ Custom values captured and stored correctly
- ✅ Vendors receive and can view custom explanations
- ✅ No breaking changes to existing functionality
- ✅ Performance impact negligible
- ✅ Documentation complete

**Next Step:** Proceed to Phase 4 - Production Deployment

---

## Phase 3 Command Reference

Quick commands for testing:

```bash
# Start dev server
npm run dev

# Check git status
git status

# View Phase 2 commit
git show e943ff5

# Connect to database
# Use Supabase dashboard: https://app.supabase.com

# Check component files
code components/RfqFormRenderer.js
code components/TemplateFieldRenderer.js

# Review documentation
cat PHASE_2_UI_IMPLEMENTATION.md
cat PHASE_1_COMPLETION_REPORT.md
```

---

Good luck with Phase 3 testing! 🧪
