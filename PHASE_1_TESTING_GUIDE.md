# Phase 1 Testing Guide: Quote Form Sections 1-3

**Status:** ✅ All Phase 1 components implemented and database migrated
**Date:** 3 January 2026
**Test Focus:** Quote form with Sections 1-3 (Overview, Pricing, Inclusions)

---

## Quick Start Checklist

- [x] Database migration executed in Supabase
- [x] QuoteFormSections component created (components/vendor/QuoteFormSections.js)
- [x] respond/page.js form state expanded with 30+ fields
- [x] API endpoint updated to accept new fields
- [ ] **NEXT:** Test the form end-to-end
- [ ] Verify data saves to database
- [ ] Check pricing calculations

---

## How to Test Phase 1

### Step 1: Navigate to Quote Form
1. Log in as a **vendor** user
2. Go to your RFQ Inbox (Vendor Dashboard)
3. Find an open RFQ and click **"Submit Quote"**
4. You should see the new form with 3 sections

### Step 2: Fill Section 1 (Quote Overview)

**Expected UI:**
- Expandable section with 5 fields
- Title input, introduction textarea
- Quote validity selector (7/14/30 days or custom)
- Earliest start date picker (optional)

**Test Data (Example):**
```
Quote Title: "Internet installation & Wi-Fi optimization – Ruiru"

Brief Introduction: "Thank you for the opportunity. We specialize in 
network installation and have successfully completed 15+ similar projects. 
Below is our comprehensive quote based on your requirements."

Quote Valid Until: 14 days

Earliest Date We Can Start: 2026-01-15
```

**Validation:**
- ✅ Title is required (error if empty)
- ✅ Introduction is required (error if empty)
- ✅ Validity days default to 7 if not selected

---

### Step 3: Fill Section 2 (Pricing & Breakdown)

**Expected UI:**
- Expandable section with multiple subsections
- Radio buttons for 4 pricing models: Fixed, Range, Per Unit, Per Day
- Conditional UI based on selected model

#### Test 2A: FIXED Pricing Model

**Select:** "Fixed total price"

**Test Data:**
```
Total Price (KES): 45000
Is VAT included: YES (checked)
```

**Expected Result:**
- Single input for total price
- VAT checkbox appears
- Price summary shows total with VAT calculation

**Validation:**
- ✅ Price is required (error if empty)
- ✅ Price must be > 0 (error if negative/zero)

---

#### Test 2B: RANGE Pricing Model

**Select:** "Price range (minimum to maximum)"

**Test Data:**
```
Minimum Price (KES): 35000
Maximum Price (KES): 55000
Is VAT included: NO
```

**Expected Result:**
- Two inputs (Min and Max)
- VAT checkbox appears
- Price summary shows both amounts

**Validation:**
- ✅ Both prices required
- ✅ Min must be less than Max (error if invalid)

---

#### Test 2C: PER UNIT Pricing Model

**Select:** "Per unit / per item"

**Test Data:**
```
Unit Type: "per installation point"
Unit Price (KES): 2500
Estimated Units: 10
```

**Expected Result:**
- Estimated total calculated: 2500 × 10 = 25,000
- Shows auto-calculated total below inputs

**Validation:**
- ✅ Unit type required
- ✅ Unit price required and > 0
- ✅ Estimated units required and > 0

---

#### Test 2D: PER DAY/HOURLY Pricing Model

**Select:** "Per day / hourly"

**Test Data:**
```
Daily / Hourly Rate (KES): 15000
Estimated Days / Hours: 3
```

**Expected Result:**
- Estimated total: 15,000 × 3 = 45,000
- Shows calculation below

**Validation:**
- ✅ Rate required and > 0
- ✅ Days/hours required and > 0

---

#### Test 2E: Line Item Breakdown (OPTIONAL)

**Feature Test:**
1. Scroll to "Item Breakdown" section
2. Click **"Add item"** button
3. Fill in sample line item:
   ```
   Description: "TP-Link Router model AX3200"
   Quantity: 2
   Unit: "pcs"
   Unit Price: 8500
   ```
4. Press Tab or click outside → Line Total auto-calculates to 17,000
5. Add another item
6. Click trash icon to remove an item

**Expected UI:**
- Table with columns: Description, Qty, Unit, Unit Price, Line Total, Delete
- Add item button works
- Delete buttons work
- Line totals auto-calculate

---

#### Test 2F: Additional Costs

**Add costs to the pricing:**
```
Transport / Delivery (KES): 3000
Labour Cost (KES): 5000
Other Charges (KES): 1000
```

**Expected Price Summary:**
```
Subtotal (from line items): 17,000
Additional Costs: 9,000 (3000+5000+1000)
VAT (16%): 4,160 (if enabled)
Grand Total: 30,160
```

**Validation:**
- ✅ All cost fields optional
- ✅ Auto-calculation works
- ✅ Grand total updates in real-time

---

### Step 4: Fill Section 3 (Inclusions/Exclusions)

**Expected UI:**
- 3 large textareas
- Color-coded sections (green for inclusions, red for exclusions, blue for responsibilities)

**Test Data:**

**What is Included:**
```
✓ Router supply (TP-Link AX3200 or equivalent)
✓ Internal cabling installation up to 10 access points
✓ Wall-mount installation with cable management
✓ Configuration and network optimization
✓ User training on device setup
✓ 7-day technical support after installation
```

**What is NOT Included:**
```
✗ ISP monthly subscription fee
✗ Additional cabling beyond 50 meters
✗ Civil works or structural modifications
✗ Ceiling/wall repairs or repainting
✗ Ongoing maintenance after 7-day support period
```

**Client Responsibilities (Optional):**
```
• Provide access to all installation areas between 8am–5pm
• Ensure power outlets are available at router locations
• Clear areas of obstacles before installation
• Designate a point of contact for coordination
```

**Validation:**
- ✅ Inclusions is required (error if empty)
- ✅ Exclusions is required (error if empty)
- ✅ Responsibilities is optional

---

### Step 5: Complete Legacy Fields

**Old form fields still visible:**
These are maintained for backward compatibility.

**Fill:**
```
Delivery Timeline: "7 business days"
Your Proposal: "We have successfully completed 15+ similar installations 
with 98% customer satisfaction. Our team is available for immediate start. 
All materials are sourced from authorized suppliers with warranty."
Warranty (Optional): "1 year parts warranty + 2 years labor"
Payment Terms (Optional): "50% upfront, 50% upon completion"
```

**Validation:**
- ✅ Delivery timeline required (can't be empty)
- ✅ Proposal required (min 30 characters)
- ✅ Warranty and payment terms optional

---

### Step 6: Submit and Verify

**Click "Review Quote"** button
- Should move to step 2 (preview)
- All sections should be visible in summary

**On Preview Screen:**
- Verify all data is displayed correctly
- Check pricing summary matches calculations
- Review all sections for accuracy

**Click "Submit Quote"** button
- Should show success message: "Quote Submitted!"
- Should redirect to dashboard after 2 seconds

---

## Database Verification

After submitting, verify data was saved correctly:

### In Supabase SQL Editor:

```sql
-- Find the quote you just submitted
SELECT 
  id,
  quote_title,
  pricing_model,
  total_price_calculated,
  inclusions,
  exclusions,
  quote_status,
  submitted_at,
  created_at
FROM public.rfq_responses
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Results:**
- ✅ All Section 1 fields populated (quote_title, intro_text, validity_days, etc.)
- ✅ All Section 2 fields populated (pricing_model, unit_price, line_items, etc.)
- ✅ All Section 3 fields populated (inclusions, exclusions)
- ✅ quote_status = 'submitted'
- ✅ submitted_at = current timestamp

---

## Test Cases Summary

| Test Case | Step | Expected Result | Status |
|-----------|------|-----------------|--------|
| Section 1 - Quote Title Required | 4.1 | Error if empty | ⬜ |
| Section 1 - Intro Text Required | 4.1 | Error if empty | ⬜ |
| Section 2 - Fixed Pricing Model | 4.2A | UI shows total price input | ⬜ |
| Section 2 - Range Pricing Model | 4.2B | UI shows min/max inputs | ⬜ |
| Section 2 - Per Unit Pricing | 4.2C | Calculates total correctly | ⬜ |
| Section 2 - Per Day Pricing | 4.2D | Calculates total correctly | ⬜ |
| Section 2 - Line Items Add | 4.2E | Add button works | ⬜ |
| Section 2 - Line Items Delete | 4.2E | Delete button works | ⬜ |
| Section 2 - Line Total Calculation | 4.2E | Auto-calculates correctly | ⬜ |
| Section 2 - Additional Costs | 4.2F | All costs sum correctly | ⬜ |
| Section 2 - VAT Calculation | 4.2F | 16% VAT calculated | ⬜ |
| Section 2 - Grand Total | 4.2F | Sum of all costs correct | ⬜ |
| Section 3 - Inclusions Required | 4.3 | Error if empty | ⬜ |
| Section 3 - Exclusions Required | 4.3 | Error if empty | ⬜ |
| Form Validation | 5.1 | All required fields checked | ⬜ |
| API Response | 5.2 | Success message shown | ⬜ |
| Database Save | 5.3 | All fields saved correctly | ⬜ |

---

## Common Issues & Troubleshooting

### Issue 1: Form sections not showing
**Solution:** 
- Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Check console for import errors (F12 → Console)

### Issue 2: "Please enter a quote title" error even when filled
**Solution:**
- Ensure form state is updating (check React DevTools)
- Try clearing field and re-entering
- Check for extra whitespace in input

### Issue 3: Pricing calculations not working
**Solution:**
- Check that prices are valid numbers (no special characters)
- Verify VAT checkbox state
- Reload page and try again

### Issue 4: Data not saving to database
**Solution:**
- Check Supabase dashboard for error logs
- Verify API endpoint is receiving POST request (check Network tab)
- Confirm database migration was executed successfully
- Check RLS policies aren't blocking INSERT

### Issue 5: "Failed to submit response" error
**Solution:**
- Check browser console for detailed error message
- Verify all required Section 1-3 fields are filled
- Try refreshing and re-submitting
- Check Supabase connection status

---

## Next Steps After Phase 1 Testing

Once Phase 1 is verified working:

1. **Phase 2 (Sections 4-7):**
   - Section 4: Availability (timeline, milestones)
   - Section 5: Questions & FAQs
   - Section 6: File Uploads
   - Section 7: Additional Notes

2. **Phase 3 (Polish & Features):**
   - Draft save functionality
   - Professional preview mode
   - Confirmation screen with summary
   - Email notifications

3. **Phase 4 (Mobile & UX):**
   - Mobile responsive design
   - Touch-optimized inputs
   - Form navigation improvements

---

## Success Criteria

✅ **Phase 1 Testing Complete When:**
1. All 3 sections render correctly
2. Validation works for all required fields
3. Pricing models work independently
4. Line items add/remove/calculate correctly
5. Form submits without errors
6. Data saves to database with all fields
7. Database verification shows correct values

**Estimated Testing Time:** 30-45 minutes

---

## Files Involved in Phase 1

- **Frontend:**
  - `components/vendor/QuoteFormSections.js` (550 lines - NEW)
  - `app/vendor/rfq/[rfq_id]/respond/page.js` (UPDATED)

- **Backend:**
  - `app/api/rfq/[rfq_id]/response/route.js` (UPDATED)

- **Database:**
  - `supabase/sql/ENHANCE_QUOTE_RESPONSES_SCHEMA.sql` (24 new columns)

**Total Lines Added:** 1,300+ lines of code

---

**Ready to test? Start with Step 1 above! 🚀**
