# 📋 ACTION 3: Test Phase 1 Fix - Test Plan

**Date:** 24 January 2026  
**Status:** ⏳ READY TO EXECUTE  
**Estimated Time:** 30 minutes

---

## 🎯 Testing Objectives

**Primary:** Verify that RFQs now reach vendors successfully  
**Secondary:** Confirm vendor can see RFQ in their inbox  
**Tertiary:** Validate debug logging works  

---

## 📋 Test Scenario: Send Direct RFQ to Narok Cement

### Prerequisites
✅ Code fix has been deployed to your local/staging environment  
✅ You have access to:
- Buyer test account
- Narok Cement vendor account (or any test vendor)
- Browser DevTools (F12)
- Supabase dashboard

---

## 🧪 Test Steps

### Step 1: Verify Deployment
**What:** Ensure the code fix is running
```bash
# Check git status
git status

# Should show DirectRFQPopup.js as modified
# Verify the change is in the file
grep -n "vendor?.id || null" components/DirectRFQPopup.js
```

**Expected:** Should show line 195 with `vendor?.id || null;`

---

### Step 2: Open Browser DevTools
**What:** Monitor console output during RFQ submission

**Steps:**
1. Open your app in browser
2. Press `F12` or `Cmd+Option+I` (Mac)
3. Go to **Console** tab
4. Keep it open during the test
5. Clear any existing messages (right-click → Clear)

**Expected:** Console is clean and ready to log

---

### Step 3: Log In as Buyer
**What:** Prepare to send an RFQ

**Steps:**
1. Log in as your test buyer account
2. Verify you're logged in (see user profile in top corner)
3. Navigate to a vendor profile (e.g., search for "Narok Cement")
4. Click the vendor to view their profile

**Expected:** You're on a vendor profile page

---

### Step 4: Initiate Direct RFQ
**What:** Open the Direct RFQ modal

**Steps:**
1. On vendor profile, look for **"Request for Quote"** button
2. Click it
3. Wait for modal to open
4. Verify the modal shows the vendor's name

**Expected:** DirectRFQPopup modal is open and shows vendor details

---

### Step 5: Fill Out RFQ Form
**What:** Complete all required fields

**Fields to Fill:**
| Field | Example Value |
|-------|---|
| Title | "Roof Replacement Quote" |
| Description | "Need quote for replacing roof tiles - 50 sq meters" |
| Category | "Roofing Services" (or similar) |
| Budget | "50000" (or "100000-150000") |
| Location | "Nairobi" or your test location |
| Attachments | (optional - skip if not needed) |

**Steps:**
1. Fill each field with test data
2. Verify all required fields are filled
3. Check the "I confirm..." checkbox at bottom
4. Do NOT click Submit yet - read next step

**Expected:** Form is complete with no validation errors

---

### Step 6: Monitor Console Before Submit
**What:** Get ready to capture the debug log

**Steps:**
1. Make sure Console tab is visible and focused
2. Scroll Console to see latest messages
3. Position so you can see new messages when they appear

**Expected:** Console is visible and ready

---

### Step 7: Submit RFQ
**What:** Send the RFQ and capture debug output

**Steps:**
1. Click **"Send Request"** button
2. **IMMEDIATELY** look at Console tab
3. Watch for the `[DirectRFQPopup] Sending RFQ to vendor:` message
4. Take screenshot of the console output

**Expected Console Output:**
```javascript
[DirectRFQPopup] Sending RFQ to vendor: {
  vendorId: "d4695f1a-498d-4a47-8861-dffabe176426",
  vendorName: "Narok Cement",
  rfqTitle: "Roof Replacement Quote",
  timestamp: "2026-01-24T10:30:00.000Z"
}
```

**Verify:**
- ✅ `vendorId` is a valid UUID (36 characters with dashes)
- ✅ `vendorName` matches the vendor you selected
- ✅ `rfqTitle` matches what you entered
- ✅ `timestamp` is current time

**If Error Message:** Look for `❌ Error sending RFQ request to vendor`
- This means something failed - document the error message

---

### Step 8: Wait for Success Message
**What:** Verify RFQ was submitted successfully

**Steps:**
1. After clicking Submit, wait 2-3 seconds
2. Look for **"✅ Request sent successfully! Redirecting..."** message in modal
3. Modal should close automatically

**Expected:**
- ✅ Success message appears
- ✅ Modal closes
- ✅ You're back on vendor profile

**If Failed:**
- ❌ Error message shows
- ❌ Modal stays open
- ❌ See error details in console

---

### Step 9: Check RFQ in Buyer Dashboard
**What:** Verify RFQ was created in database

**Steps:**
1. Navigate to **My RFQs** or buyer dashboard
2. Look for the RFQ you just created
3. Should appear in the list with:
   - Title: "Roof Replacement Quote"
   - Status: "Submitted" or "Pending"
   - Date: Today's date
   - Recipient: "Narok Cement"

**Expected:** RFQ is visible in your dashboard

**If Not Found:**
- Refresh the page (`Cmd+R` or `F5`)
- Check if it appears in a different tab or filter
- Look for any error messages

---

### Step 10: Log In as Vendor
**What:** Verify vendor received the RFQ

**Steps:**
1. Log out as buyer (click profile → Log Out)
2. Log in as the vendor (Narok Cement account)
3. Navigate to **Profile** → **RFQ Inbox** tab
4. Look for the RFQ you just sent

**Expected Results:**

**✅ TEST PASSES:**
- RFQ appears in vendor's inbox
- Title matches: "Roof Replacement Quote"
- Status shows as "Pending" or "Unread"
- Vendor name/buyer info is visible
- You can click it to view full details

**❌ TEST FAILS:**
- RFQ doesn't appear in inbox
- Only old RFQs are visible
- "No RFQs" message shows
- Different RFQ title/details

---

### Step 11: Verify RFQ Details as Vendor
**What:** Confirm complete RFQ data is visible

**Steps (if RFQ found):**
1. Click on the RFQ you received
2. Verify the following details:
   - ✅ Title matches what buyer entered
   - ✅ Description is present
   - ✅ Budget is shown
   - ✅ Category is correct
   - ✅ Location matches
   - ✅ Buyer's name/contact info visible

**Expected:** All RFQ details are correct and complete

---

## 📊 Test Results Summary

### Success Criteria (All Must Pass)

| Criterion | Status | Notes |
|-----------|--------|-------|
| Fix deployed | [ ] | Change visible in code |
| Debug log shown | [ ] | Console shows vendor ID log |
| Vendor ID is UUID | [ ] | Format: xxx-xxx-xxx... |
| RFQ in buyer dashboard | [ ] | Appears in My RFQs |
| RFQ in vendor inbox | [ ] | Appears in Profile → RFQ Inbox |
| RFQ details correct | [ ] | All fields match |
| No error messages | [ ] | No console errors |

### Overall Result
- [ ] ✅ **ALL TESTS PASSED** - RFQ system working correctly
- [ ] ⚠️ **PARTIAL PASS** - Some tests passed, some issues found
- [ ] ❌ **TESTS FAILED** - RFQ system not working

---

## 🐛 Troubleshooting

### If RFQ doesn't appear in vendor inbox:

**Check 1: Database verification**
```javascript
// In Supabase SQL Editor, run:
SELECT vendor_id, rfq_id, project_title, status 
FROM public.rfq_requests 
ORDER BY created_at DESC 
LIMIT 5;

-- Look for your RFQ with vendor_id matching the vendor record ID
```

**Check 2: Vendor ID validation**
```javascript
// Get the vendor's correct ID:
SELECT id, user_id, company_name 
FROM public.vendors 
WHERE company_name LIKE '%Narok%';

-- Compare the vendor.id with what was logged in console
```

**Check 3: RLS Policies**
```javascript
// Verify RLS allows vendor to see rfq_requests:
-- This might be blocking the query
-- Check Enable RLS setting on rfq_requests table
```

**Check 4: Console errors**
- Look for any red error messages in console
- Take screenshot of full error
- Note the error code and message

---

## 📝 Reporting

### If Tests Pass ✅
Document:
1. Date and time of test
2. Buyer and vendor accounts used
3. RFQ title and details
4. Screenshots of:
   - Console debug log
   - RFQ in buyer dashboard
   - RFQ in vendor inbox
5. Note: "Phase 1 fix verified working"

### If Tests Fail ❌
Document:
1. At what step it failed
2. Exact error messages (with screenshots)
3. Console error details
4. Vendor/buyer IDs used
5. Database query results (from troubleshooting)
6. Next action needed

---

## 🎯 Next Steps After Test

### If ✅ PASS:
1. ✅ Commit code change to git
2. ✅ Push to GitHub
3. ✅ Deploy to staging/production
4. ✅ Move to Phase 2: Add recipients section

### If ❌ FAIL:
1. ❌ Review error messages
2. ❌ Check database state
3. ❌ Verify code change was actually deployed
4. ❌ Review RLS policies
5. ❌ Contact support with logs

---

## 📱 Mobile Testing (Optional)

If you want to test on mobile device:

**Steps:**
1. Deploy to staging URL
2. Open staging URL on mobile device
3. Repeat steps 3-10 above
4. Verify responsive design looks good

**Expected:** Everything works on mobile too

---

## ✅ Completion

Once you complete the test:
1. Take screenshots of results
2. Document any issues found
3. Update this document with results
4. Decide: Continue to Phase 2 or fix issues?

**Estimated total time:** 30 minutes

