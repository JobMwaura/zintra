# Phase 2 Integration Testing Guide
**Quick Start for Integration Verification**

## Test Environment Setup

Before testing, ensure:
- [ ] Application is running locally or deployed
- [ ] Supabase is connected and operational
- [ ] Browser developer console is open for error monitoring
- [ ] Have test vendor account ready OR can create one

---

## Test 1: Category Selection in Vendor Signup ✅

**Objective:** Verify CategorySelector works in signup Step 3

**Steps:**
1. Go to vendor signup page
2. Complete Step 1: Business Information
   - Business name, description, location
3. Complete Step 2: Contact Details
   - Phone number, verify OTP
4. **Reach Step 3: Categories**
   - ✅ Should see CategorySelector component
   - ✅ Primary category dropdown (single-select)
   - ✅ Secondary categories selector (multi-select)

**Verify:**
- Primary category selection shows selected value
- Can select 0-5 secondary categories
- Visual feedback for selections (checkmarks/highlights)
- "Next" button validates requiring primary category
- Confirmation message shows selected categories

**Data Verification:**
After signup completion, check Supabase:
```sql
SELECT id, company_name, primary_category_slug, secondary_categories 
FROM vendor_profiles 
WHERE email = '{test_vendor_email}' 
ORDER BY created_at DESC LIMIT 1;
```
Should see:
- `primary_category_slug`: 'category_slug' (e.g., 'flooring_wall_finishes')
- `secondary_categories`: ARRAY['slug1', 'slug2', ...] or NULL

---

## Test 2: RFQ Modal Opens on Dashboard ✅

**Objective:** Verify RFQModalDispatcher opens modal instead of navigating

**Prerequisites:**
- Logged in as vendor with at least 1 active RFQ available
- RFQ dashboard loads successfully

**Steps:**
1. Go to RFQ Dashboard (`/vendor/rfq-dashboard`)
2. See list of available RFQs
3. **Click "Submit Quote" button on an RFQ**
   - ✅ Modal should appear on same page (NOT navigate away)
   - ✅ RFQModalDispatcher should load
   - ✅ UniversalRFQModal should display with form

**Verify:**
- Modal appears with 6-step form
- Form loads category-specific template
- Can see progress indicator
- Each section displays correctly
- Close button works (X icon or back button)

**Browser Console:**
- [ ] No errors related to modal opening
- [ ] Check for "RFQModalDispatcher loading..." in network tab

---

## Test 3: RFQ Modal Form Submission ✅

**Objective:** Verify 6-step form submission works

**Continue from Test 2 (Modal is open)**

**Step 1: Quote Overview**
- Enter Quote Title
- Enter Brief Introduction
- Select Validity (7, 14, 30 days or custom)
- Enter Earliest Start Date (optional)
- Click "Next"

**Step 2: Pricing & Breakdown**
- Select Pricing Model (Fixed, Range, Per Unit, Per Day)
- Enter Price or Price Range
- Optionally add line items, transport, labour costs
- Verify Total Price calculated
- Click "Next"

**Step 3: Inclusions/Exclusions**
- Enter What's Included
- Enter What's Not Included
- Enter Client Responsibilities (optional)
- Click "Next"

**Step 4: Additional Details**
- Delivery Timeline
- Payment Terms (optional)
- Special Warranty (optional)
- Click "Next"

**Step 5: Attachments**
- (Optional) Upload reference documents
- Click "Next"

**Step 6: Review & Submit**
- Review all entered information
- Click "Submit Quote"

**Verify:**
- ✅ Each step validates before allowing "Next"
- ✅ Progress indicator shows correct step
- ✅ Data persists when clicking "Back"
- ✅ "Submit" button shows success message
- ✅ Modal closes after submission
- ✅ Dashboard refreshes (may show "Quote Submitted" status)

**Data Verification:**
Check Supabase for new response:
```sql
SELECT id, rfq_id, vendor_id, quote_title, pricing_model, total_price_calculated, created_at
FROM rfq_responses
WHERE vendor_id = '{vendor_id}'
ORDER BY created_at DESC LIMIT 1;
```
Should see the newly submitted quote with all entered data.

---

## Test 4: Vendor Profile Category Editing ✅

**Objective:** Verify CategoryManagement component in vendor profile

**Prerequisites:**
- Logged in as a vendor
- Can access own profile in edit mode

**Steps:**
1. Go to Vendor Profile (your own profile)
2. Should be in edit/owner mode
3. **Click "Categories" tab**
   - ✅ Should see "Service Categories" section
   - ✅ CategoryManagement component should display
   - ✅ Should show current primary category
   - ✅ Should show current secondary categories (if any)

**Modify Categories:**
4. Change Primary Category
   - Click dropdown
   - Select different category
   - Verify it updates
   
5. Modify Secondary Categories
   - Add new categories (up to 5 total)
   - Remove existing categories
   - Try adding 6th category (should be prevented)
   
6. **Click "Save Changes"**
   - ✅ Should show success message
   - ✅ Button should indicate saving state
   - ✅ Data should persist in database

**Verify Persistence:**
7. Refresh page (F5)
   - ✅ Category changes should remain
   - ✅ Same primary and secondary categories visible

**Data Verification:**
Check Supabase:
```sql
SELECT id, company_name, primary_category_slug, secondary_categories
FROM vendor_profiles
WHERE id = '{vendor_id}';
```
Should show updated categories.

---

## Test 5: End-to-End Flow ✅

**Objective:** Full integration from signup through RFQ response

**Complete Flow:**
1. **Signup (Test 1)**
   - Create new vendor
   - Select primary + secondary categories
   - Complete all steps
   
2. **Dashboard (Test 2 & 3)**
   - View available RFQs
   - Submit quote via modal
   - Select category-specific template
   - Complete 6-step form
   
3. **Profile (Test 4)**
   - Go to own profile
   - Edit categories in profile
   - Verify changes saved

4. **Data Consistency Check**
   - Verify all data in Supabase
   - Categories match across vendor_profiles and rfq_responses

---

## Browser Console Monitoring

While testing, watch for these in the browser console (F12):

**Expected (OK):**
```
✅ Loading RFQ opportunities...
✅ RFQModalDispatcher mounted
✅ UniversalRFQModal form loaded
✅ Quote submitted successfully
```

**Errors (NOT OK):**
```
❌ Cannot read property 'id' of null
❌ primaryCategorySlug is undefined
❌ API error 400
❌ Modal component failed to load
```

If you see errors, note:
- Error message
- File name and line number
- When it occurred (during which action)

---

## Network Tab Monitoring

Check Network tab for these API calls:

**During Signup:**
- POST `/api/vendor/create` (should include `primaryCategorySlug` and `secondaryCategories`)
- Response: 200 OK with vendor data

**During RFQ Response:**
- POST `/api/rfq/[rfq_id]/response` (should include quote form data)
- Response: 200 OK with response ID

**During Category Update:**
- PUT `/api/vendor/update-categories` (should include updated categories)
- Response: 200 OK

---

## Rollback Instructions (If Issues Found)

If critical issues occur:

**Quick Rollback:**
1. RFQ Modal not opening:
   - Check if RFQModalDispatcher component exists
   - Verify import statement in rfq-dashboard/page.js
   
2. Categories not saving:
   - Check Supabase schema (columns must exist)
   - Verify update-categories.js endpoint exists
   
3. Signup Step 3 broken:
   - Check CategorySelector component is properly imported
   - Verify formData state has new fields

**Database Rollback:**
If vendor data corrupted:
```sql
-- Backup current data
SELECT * FROM vendor_profiles WHERE created_at > NOW() - INTERVAL '1 hour';

-- Update null categories back
UPDATE vendor_profiles 
SET primary_category_slug = NULL, secondary_categories = NULL 
WHERE primary_category_slug = 'invalid_value';
```

---

## Success Criteria

All tests pass when:
- ✅ Categories selectable in signup
- ✅ RFQ modal opens without navigation
- ✅ 6-step form submits without errors
- ✅ Categories editable in vendor profile
- ✅ All data persists in Supabase
- ✅ No breaking changes to existing features
- ✅ Browser console has no critical errors
- ✅ API responses include category data

---

## Reporting Issues

If you find issues during testing, provide:

1. **Test Scenario:** Which test (1-5) failed
2. **Steps to Reproduce:** Exact steps taken
3. **Expected Behavior:** What should happen
4. **Actual Behavior:** What actually happened
5. **Error Message:** Any console errors (screenshot recommended)
6. **Browser/Device:** Chrome, Safari, Firefox, Mobile, etc.
7. **Supabase Data:** Query results showing saved data

---

## Test Status Tracking

| Test | Status | Date | Notes |
|------|--------|------|-------|
| Test 1: Signup Categories | ⏳ Pending | - | - |
| Test 2: Modal Opens | ⏳ Pending | - | - |
| Test 3: Form Submission | ⏳ Pending | - | - |
| Test 4: Profile Editing | ⏳ Pending | - | - |
| Test 5: End-to-End | ⏳ Pending | - | - |

---

**Ready to Test?** Follow tests 1-5 above in order. Each test takes ~5-10 minutes.

**Questions?** Refer to PHASE2_INTEGRATION_COMPLETE.md for detailed integration information.
