# E2E Testing Plan - Phase 2b Implementation

**Date:** January 1, 2026  
**Scope:** Complete testing of all 3 RFQ modals + payment enforcement + OTP flow  
**Estimated Time:** 3-4 hours  
**Status:** Ready to Execute

---

## Test Environment Setup

### Prerequisites

1. **Local Development Environment**
   - Node.js 16+ installed
   - Zintra platform running locally
   - All 3 modals deployed locally
   - Database accessible

2. **Test Accounts**
   ```
   Free User:
   - Email: free.user@test.com
   - Password: TestPass123!
   - RFQ Limit: 3 per month
   
   Standard User:
   - Email: standard.user@test.com
   - Password: TestPass123!
   - RFQ Limit: 5 per month
   
   Premium User:
   - Email: premium.user@test.com
   - Password: TestPass123!
   - RFQ Limit: Unlimited
   
   Guest (No Account):
   - Phone: +254712345678 (for testing)
   ```

3. **Mock SMS Provider**
   - Development: Mock provider enabled (prints OTP to console)
   - Production: Twilio or AWS SNS configured

4. **Test Tools**
   - Browser DevTools (Chrome/Firefox)
   - Network tab (to monitor API calls)
   - Console (to check logs)
   - Postman or curl (for direct API testing)

---

## Test Cases

### Test Suite 1: DirectRFQModal - Guest Flow

#### Test 1.1: Direct RFQ - Complete Guest Flow
```
Objective: Verify guest can complete direct RFQ from start to finish
Steps:
1. Open DirectRFQModal (isOpen={true})
2. Select category: "Architectural"
3. Verify category displays (progress: 25%)
4. Click "Next →"
5. Select job type: "New Residential"
6. Verify job type displays (progress: 50%)
7. Click "Next →"
8. Fill template fields:
   - Property Description: "3-bedroom house with basement"
   - Number of Floors: "2"
   - Estimated Area (sqm): "150"
9. Click "Next →"
10. Fill shared fields:
    - Location: "Nairobi"
    - Budget: "5,000,000"
    - Timeline: "3 months"
    - Contact Name: "John Doe"
    - Email: "john@example.com"
11. Click "Submit RFQ"
12. AuthInterceptor modal shows
13. Enter phone: "+254712345678"
14. Click "Send OTP"
15. Verify success message appears
16. Enter OTP (from console/email)
17. Click "Verify OTP"
18. Verify RFQ submitted successfully
19. Verify success notification: "RFQ submitted successfully!"
20. Verify modal closes after 2 seconds
21. Verify onSuccess callback fires with RFQ data

Expected Results:
✓ Form data saved to draft
✓ All fields accepted
✓ Phone OTP sent
✓ OTP verified
✓ API call to /api/rfq/create successful (200 OK)
✓ RFQ created with ID
✓ Modal closes
✓ onSuccess callback executed
```

#### Test 1.2: Direct RFQ - Auto-Save & Draft Resume
```
Objective: Verify auto-save saves form data every 2 seconds and can resume
Steps:
1. Open DirectRFQModal
2. Select category: "Plumbing"
3. Click "Next"
4. Select job type: "New Installation"
5. Click "Next"
6. Start filling form: "Bathroom renovation..."
7. WAIT 3 seconds (auto-save should trigger)
8. REFRESH PAGE
9. Verify "Resume Draft" prompt appears
10. Click "Resume Draft"
11. Verify all previously filled data restored
12. Verify form shows: "Bathroom renovation..."
13. Continue filling form
14. Complete submission as guest

Expected Results:
✓ Draft saved after 2 seconds
✓ Page refresh shows resume option
✓ Resume restores all data
✓ Form fields show exact text entered before refresh
✓ Can continue from where left off
✓ Submission completes successfully
```

#### Test 1.3: Direct RFQ - Start Fresh (Clear Draft)
```
Objective: Verify user can start fresh and discard draft
Steps:
1. Open DirectRFQModal
2. Fill partial form (category + job type)
3. REFRESH PAGE
4. Verify "Resume Draft" prompt
5. Click "Start Fresh"
6. Verify category is cleared
7. Verify job type is cleared
8. Verify form shows category selection screen
9. Start new submission

Expected Results:
✓ Resume prompt disappears
✓ Form reset to initial state
✓ Old draft discarded
✓ Can start fresh submission
```

#### Test 1.4: Direct RFQ - Back Navigation
```
Objective: Verify back button works correctly
Steps:
1. Open DirectRFQModal
2. Select category, click Next
3. Select job type, click Next
4. Fill template fields
5. Click Back
6. Verify returns to job type selection
7. Verify job type is still selected
8. Click Next
9. Verify template fields are still filled
10. Click Next
11. Fill shared fields
12. Click Back
13. Verify returns to template fields
14. Verify all template fields still filled

Expected Results:
✓ Back button navigates to previous step
✓ Form data preserved when navigating back
✓ Can re-navigate forward without data loss
✓ Back button disabled on first step
```

#### Test 1.5: Direct RFQ - Close Modal (Save Draft)
```
Objective: Verify closing modal saves draft
Steps:
1. Open DirectRFQModal
2. Select category, job type
3. Fill template fields: "Test project description"
4. Click close button (X)
5. Verify modal closes
6. Open DirectRFQModal again
7. Verify resume draft option shows
8. Click resume
9. Verify: "Test project description" is restored

Expected Results:
✓ Closing modal saves draft
✓ Draft persists across modal close/open
✓ Form data fully recovered
```

---

### Test Suite 2: DirectRFQModal - Authenticated User Flow

#### Test 2.1: Direct RFQ - Authenticated User (No Phone)
```
Objective: Verify authenticated user can submit without phone verification
Steps:
1. Login as Standard User (standard.user@test.com)
2. Verify user is authenticated
3. Open DirectRFQModal
4. Select category, job type
5. Fill template and shared fields
6. Click "Submit RFQ"
7. Verify: NO AuthInterceptor appears
8. Verify: Direct API call to /api/rfq/create
9. Verify success message and modal closes

Expected Results:
✓ Authenticated user skips phone verification
✓ RFQ submits directly to API
✓ No AuthInterceptor modal shown
✓ Submission succeeds (200 OK)
```

#### Test 2.2: Direct RFQ - Authenticated User (With Phone)
```
Objective: Verify authenticated user with verified phone
Steps:
1. Ensure authenticated user has verified_phone_at set
2. Open DirectRFQModal
3. Complete RFQ form
4. Click "Submit RFQ"
5. Verify submission succeeds without auth modal

Expected Results:
✓ Phone already verified for authenticated user
✓ No phone entry required
✓ Submission succeeds immediately
```

---

### Test Suite 3: DirectRFQModal - Payment Enforcement

#### Test 3.1: Payment Quota - Free User Limit
```
Objective: Verify free user can submit 3 RFQs, 4th returns 402
Steps:
1. Create or use free user account
2. Submit RFQ #1 (DirectRFQModal) → Success
3. Verify count: 1/3
4. Submit RFQ #2 (DirectRFQModal) → Success
5. Verify count: 2/3
6. Submit RFQ #3 (DirectRFQModal) → Success
7. Verify count: 3/3
8. Submit RFQ #4 (DirectRFQModal) → 402 Error
9. Verify error message: "You've reached your monthly RFQ limit"
10. Verify "upgrade your plan" link/button

Expected Results:
✓ RFQs 1-3 succeed (200 OK)
✓ RFQ 4 returns 402 Payment Required
✓ Error message shows user-friendly message
✓ API call visible in DevTools Network tab
✓ User prompted to upgrade
```

#### Test 3.2: Payment Quota - Standard User Limit
```
Objective: Verify standard user can submit 5 RFQs, 6th returns 402
Steps:
1. Use or create standard user account
2. Submit RFQs #1-5 → All Success
3. Submit RFQ #6 → 402 Error
4. Verify error message shows

Expected Results:
✓ Standard user limit is 5
✓ 6th RFQ returns 402
✓ Quota enforcement works correctly
```

#### Test 3.3: Payment Quota - Premium User Unlimited
```
Objective: Verify premium user can submit unlimited RFQs
Steps:
1. Use or create premium user account
2. Submit RFQ #1 → Success
3. Submit RFQ #2 → Success
4. ...
5. Submit RFQ #10+ → All Success
6. Verify no 402 errors

Expected Results:
✓ Premium user can submit 10+ RFQs
✓ No payment limit enforced
✓ All submissions succeed (200 OK)
```

---

### Test Suite 4: WizardRFQModal - Complete Flow

#### Test 4.1: Wizard RFQ - Vendor Selection Complete Flow
```
Objective: Verify wizard modal with vendor selection works end-to-end
Steps:
1. Open WizardRFQModal
2. Select category: "Architectural"
3. Click Next
4. Select job type: "New Residential"
5. Click Next
6. Verify vendor list loads
7. Verify vendors show:
   - Name
   - Rating (⭐)
   - Location
   - Description
8. Select 3 vendors (checkboxes)
9. Verify count: "3 vendors selected"
10. Click Next
11. Fill template fields
12. Click Next
13. Fill shared fields
14. Click Submit RFQ
15. AuthInterceptor shows (if guest)
16. Complete phone verification
17. Verify success and modal closes

Expected Results:
✓ Vendor list loads after job type selection
✓ Vendors display correctly with ratings
✓ Can select multiple vendors
✓ Selection count updates
✓ Selected vendors passed to API
✓ All form data captured
✓ Submission succeeds (200 OK)
```

#### Test 4.2: Wizard RFQ - Vendor Filtering by Job Type
```
Objective: Verify vendors filtered by selected job type
Steps:
1. Select job type: "New Residential"
2. Verify vendors show only those with "arch_new_residential" availability
3. Select different job type: "Renovation"
4. Verify vendor list updates
5. Verify only vendors with "arch_renovation" show

Expected Results:
✓ Vendor list filters correctly by job type
✓ API call to /api/vendors/by-jobtype includes correct jobType param
✓ Vendor availability matches selected job type
```

#### Test 4.3: Wizard RFQ - No Vendors Available
```
Objective: Verify graceful handling when no vendors available
Steps:
1. Select category: "Test"
2. Select job type: "none-available"
3. Verify error/message: "No vendors available for this job type"
4. Verify: "Continue" or similar button available
5. Proceed with form
6. Complete submission

Expected Results:
✓ Shows message instead of empty list
✓ User can still complete RFQ
✓ Submission succeeds
✓ RFQ marked as public (for vendor discovery)
```

#### Test 4.4: Wizard RFQ - Vendor Sorting by Rating
```
Objective: Verify vendors sorted by rating (highest first)
Steps:
1. Open WizardRFQModal
2. Select category and job type
3. Verify vendors display in order:
   - Highest rated vendors at top
   - Lowest rated vendors at bottom
4. Check rating stars match expected values

Expected Results:
✓ Vendors sorted by rating descending
✓ Highest rated vendor first
✓ Rating display accurate
```

#### Test 4.5: Wizard RFQ - Vendor Selection Required
```
Objective: Verify at least one vendor must be selected
Steps:
1. Open WizardRFQModal
2. Select category, job type
3. Verify: Vendor list shows
4. Do NOT select any vendor
5. Verify: "Next" button disabled
6. Select 1 vendor
7. Verify: "Next" button enabled

Expected Results:
✓ Next button disabled when no vendors selected
✓ Next button enabled when vendor selected
✓ Can proceed with at least 1 vendor
```

---

### Test Suite 5: PublicRFQModal - Complete Flow

#### Test 5.1: Public RFQ - Guest Posting Flow
```
Objective: Verify guest can post public project
Steps:
1. Open PublicRFQModal
2. Select category: "Plumbing"
3. Click Next
4. Select job type: "Repairs"
5. Click Next
6. Fill template fields
7. Click Next
8. Fill shared fields
9. Click "Post Project"
10. AuthInterceptor shows
11. Enter phone and complete OTP
12. Verify success message: "Vendors will view and respond to your request"
13. Verify modal closes

Expected Results:
✓ All steps work correctly
✓ No vendor pre-selection (key difference)
✓ Button says "Post Project" not "Submit RFQ"
✓ Success message mentions vendor discovery
✓ RFQ created with rfqType: 'public'
✓ selectedVendors: [] (empty, vendors discover)
```

#### Test 5.2: Public RFQ - Authenticated User Posting
```
Objective: Verify authenticated user can post public project
Steps:
1. Login as standard user
2. Open PublicRFQModal
3. Complete form (all 4 steps)
4. Click "Post Project"
5. Verify: AuthInterceptor doesn't show (already authenticated)
6. Verify: Direct submission
7. Success message shows
8. Modal closes

Expected Results:
✓ Authenticated user skips auth modal
✓ Submission succeeds directly
✓ Public RFQ created successfully
```

#### Test 5.3: Public RFQ - Payment Enforcement
```
Objective: Verify payment enforcement applies to public RFQs too
Steps:
1. Use free user with exhausted quota
2. Open PublicRFQModal
3. Complete form
4. Click "Post Project"
5. Verify: 402 error appears
6. Verify: Same error message as other RFQ types

Expected Results:
✓ Public RFQs count toward quota
✓ 402 error enforced for public too
✓ All RFQ types share same payment limits
```

---

### Test Suite 6: Phone Verification (OTP) Flow

#### Test 6.1: OTP - Correct Code
```
Objective: Verify OTP verification with correct code
Steps:
1. Start direct RFQ as guest
2. Submit form
3. Enter phone: "+254712345678"
4. Click "Send OTP"
5. Verify: "OTP sent to +254712345678"
6. Observe OTP code (console or mock provider)
7. Enter OTP code correctly
8. Click "Verify"
9. Verify: Success message
10. Verify: RFQ submitted

Expected Results:
✓ OTP sent successfully
✓ User shown phone number where OTP was sent
✓ OTP entry form displays
✓ Correct OTP verifies successfully
✓ RFQ submission proceeds
✓ guestPhoneVerified: true in API payload
```

#### Test 6.2: OTP - Incorrect Code
```
Objective: Verify OTP verification rejects wrong code
Steps:
1. Start phone verification flow
2. Enter phone, send OTP
3. Enter WRONG OTP code (e.g., "000000")
4. Click "Verify"
5. Verify: Error message: "Invalid OTP"
6. Verify: Attempt counter increments
7. Try wrong code 5 times
8. Verify: Error: "Too many incorrect attempts. Please try again later."

Expected Results:
✓ Wrong OTP rejected
✓ Error message shown
✓ Attempt counter works (max 5)
✓ After 5 attempts, OTP verification blocked
✓ User must re-send OTP
```

#### Test 6.3: OTP - Resend OTP
```
Objective: Verify user can resend OTP
Steps:
1. Send OTP to phone
2. Wait 1 minute
3. Click "Resend OTP"
4. Verify: New OTP sent
5. Verify: Counter shows "Resend available in X seconds"
6. Enter new OTP code
7. Verify successfully

Expected Results:
✓ Resend button works
✓ New OTP code generated and sent
✓ Rate limiting applies (max 3 sends per 15 min)
✓ Countdown timer shows when can resend
```

#### Test 6.4: OTP - Rate Limiting (Sends)
```
Objective: Verify rate limiting on OTP sends (3 per 15 min)
Steps:
1. Send OTP to phone → Success (1/3)
2. Click "Resend OTP" → Success (2/3)
3. Click "Resend OTP" → Success (3/3)
4. Click "Resend OTP" → Error: "Please wait X minutes before resending"

Expected Results:
✓ First 3 sends within 15 min succeed
✓ 4th send returns rate limit error
✓ Error message shows wait time
✓ Countdown timer visible
```

#### Test 6.5: OTP - Rate Limiting (Attempts)
```
Objective: Verify rate limiting on OTP attempts (5 per 15 min)
Steps:
1. Enter wrong OTP 5 times → All rejected
2. 6th attempt → Error: "Too many attempts. Please try again later."

Expected Results:
✓ Rate limiting applies after 5 failed attempts
✓ User must wait 15 minutes or resend OTP
✓ Clear error message shown
```

#### Test 6.6: OTP - Expiry (5 minutes)
```
Objective: Verify OTP expires after 5 minutes
Steps:
1. Send OTP
2. Note time: 12:00:00
3. WAIT 6 minutes (until 12:06:00)
4. Enter OTP code
5. Click "Verify"
6. Verify: Error: "OTP expired. Please request a new code."

Expected Results:
✓ OTP valid for exactly 5 minutes
✓ After 5 minutes, OTP becomes invalid
✓ User must resend OTP to get new code
```

---

### Test Suite 7: Draft Persistence

#### Test 7.1: Drafts Stored by RFQ Type
```
Objective: Verify different drafts for each RFQ type
Steps:
1. Start DirectRFQModal
2. Select category: "Architectural"
3. Select job type: "New Residential"
4. Verify draft key: "rfq_draft_direct_architectural_new_residential"
5. CLOSE modal
6. Open WizardRFQModal
7. Select SAME category: "Architectural"
8. Select SAME job type: "New Residential"
9. Verify: Different draft (empty, not the direct one)
10. Fill different form data
11. CLOSE modal
12. Open DirectRFQModal
13. Select SAME category and job type
14. Verify: Resume shows ORIGINAL draft data (not wizard data)

Expected Results:
✓ Draft keys include rfqType
✓ Direct and Wizard drafts are separate
✓ Public draft is also separate
✓ Each RFQ type maintains own draft
✓ No data cross-contamination
```

#### Test 7.2: Draft Expiry (48 hours)
```
Objective: Verify drafts expire after 48 hours
Prerequisites:
- Manually set draft timestamp to 49+ hours ago in localStorage

Steps:
1. Check localStorage for old draft (timestamp > 48h)
2. Open modal for that category/jobtype
3. Verify: Resume draft NOT offered
4. Verify: Can start fresh

Expected Results:
✓ Old drafts not offered for resume
✓ 48-hour expiry enforced
✓ User starts with fresh form
```

#### Test 7.3: Draft Cleared on Success
```
Objective: Verify draft deleted after successful submission
Steps:
1. Start DirectRFQModal
2. Select category, job type
3. Fill partial form
4. REFRESH (draft saved)
5. Complete form
6. Submit successfully
7. Verify success notification
8. Open DirectRFQModal again (SAME category/jobtype)
9. Verify: Resume draft NOT offered
10. Verify: Form is empty

Expected Results:
✓ Draft deleted after successful submission
✓ New session starts fresh
✓ No resume option after success
```

---

### Test Suite 8: Form Validation

#### Test 8.1: Required Fields
```
Objective: Verify required fields enforced
Steps:
1. Start DirectRFQModal
2. Select category, job type
3. On template step, do NOT fill any required fields
4. Try to click "Next"
5. Verify: Button disabled or error shown
6. Fill one required field
7. Verify: Can proceed to next step

Expected Results:
✓ Required fields enforced
✓ Next button disabled until required fields filled
✓ Error message shows which fields required (if applicable)
```

#### Test 8.2: Field Type Validation
```
Objective: Verify field types validated
Steps:
1. On form with numeric field "Number of Floors"
2. Enter: "abc" (text in numeric field)
3. Try to submit
4. Verify: Error message or input rejected
5. Enter: "2" (valid number)
6. Verify: Accepted

Expected Results:
✓ Numeric fields reject non-numeric input
✓ Date fields validate date format
✓ Email validates email format
✓ Error messages shown clearly
```

#### Test 8.3: Field Bounds (Min/Max)
```
Objective: Verify min/max bounds enforced
Steps:
1. On form with field: "Number of Floors" (min: 1, max: 20)
2. Enter: "0" (below min)
3. Try submit
4. Verify: Error
5. Enter: "25" (above max)
6. Try submit
7. Verify: Error
8. Enter: "5" (within range)
9. Verify: Accepted

Expected Results:
✓ Min bounds enforced
✓ Max bounds enforced
✓ Clear error messages
```

---

### Test Suite 9: Error Handling

#### Test 9.1: Network Error
```
Objective: Verify graceful handling of network errors
Prerequisites:
- Simulate network error (DevTools Network Throttle or disable network)

Steps:
1. Complete RFQ form
2. Click "Submit RFQ"
3. Trigger network error
4. Verify: Error message: "Network error. Please try again."
5. Button re-enabled for retry

Expected Results:
✓ Network error caught
✓ User-friendly error message shown
✓ Can retry submission
✓ No silent failures
```

#### Test 9.2: API Error (500)
```
Objective: Verify handling of server errors
Prerequisites:
- Mock 500 error from API (modify test API or DevTools)

Steps:
1. Complete RFQ form
2. Submit
3. API returns 500 error
4. Verify: Error message: "Failed to submit RFQ. Please try again."
5. Can retry

Expected Results:
✓ 500 errors handled gracefully
✓ User informed of failure
✓ Can retry submission
```

#### Test 9.3: Validation Error (400)
```
Objective: Verify handling of validation errors
Steps:
1. Complete RFQ form with edge case data
2. Submit
3. API validates and returns 400 + error message
4. Verify: Error message displays API response

Expected Results:
✓ 400 errors caught
✓ Error message from API shows to user
✓ User can correct and retry
```

---

## Quick Testing Commands

### Test with curl (Direct RFQ)

```bash
# Send RFQ as guest
curl -X POST http://localhost:3000/api/rfq/create \
  -H "Content-Type: application/json" \
  -d '{
    "rfqType": "direct",
    "categorySlug": "architectural",
    "jobTypeSlug": "arch_new_residential",
    "templateFields": {
      "property_description": "3-bedroom house",
      "number_of_floors": "2"
    },
    "sharedFields": {
      "location": "Nairobi",
      "budget": 5000000,
      "timeline": "3 months",
      "contact_name": "John Doe",
      "email": "john@example.com"
    },
    "guestPhone": "+254712345678",
    "guestPhoneVerified": true,
    "isGuestMode": true
  }'

# Response (success):
# { "success": true, "rfqId": "rfq-xxx", "createdAt": "2025-01-01T...", "vendors": [...] }

# Response (402 - payment):
# { "success": false, "statusCode": 402, "message": "Payment required. Upgrade your plan." }
```

### Test with curl (Send OTP)

```bash
# Send OTP to phone
curl -X POST http://localhost:3000/api/auth/send-sms-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+254712345678"
  }'

# Response (success):
# { "success": true, "message": "OTP sent to +254712345678", "expiresIn": 300 }

# Response (rate limit):
# { "success": false, "statusCode": 429, "message": "Too many requests. Try again in X minutes." }
```

### Test with curl (Verify OTP)

```bash
# Verify OTP
curl -X POST http://localhost:3000/api/auth/verify-sms-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+254712345678",
    "code": "123456"
  }'

# Response (success):
# { "success": true, "verified": true, "phone": "+254712345678" }

# Response (invalid):
# { "success": false, "statusCode": 400, "message": "Invalid OTP code" }
```

### Test with curl (Get Vendors)

```bash
# Get vendors for job type
curl -X GET "http://localhost:3000/api/vendors/by-jobtype?jobType=arch_new_residential&limit=10"

# Response:
# {
#   "success": true,
#   "vendors": [
#     {
#       "id": "vendor-001",
#       "name": "ABC Construction",
#       "rating": 4.8,
#       "location": "Nairobi",
#       ...
#     }
#   ]
# }
```

---

## Testing Checklist

### Pre-Testing
- [ ] All 3 modals deployed locally
- [ ] Database populated with test data
- [ ] Test accounts created (free, standard, premium)
- [ ] SMS provider configured (mock or real)
- [ ] Browser DevTools ready for debugging
- [ ] Postman/curl ready for API testing

### Test Suite 1: DirectRFQModal - Guest
- [ ] Test 1.1: Complete guest flow
- [ ] Test 1.2: Auto-save & draft resume
- [ ] Test 1.3: Start fresh
- [ ] Test 1.4: Back navigation
- [ ] Test 1.5: Close modal save draft

### Test Suite 2: DirectRFQModal - Auth
- [ ] Test 2.1: Auth user no phone
- [ ] Test 2.2: Auth user with phone

### Test Suite 3: Payment Enforcement
- [ ] Test 3.1: Free user limit (3)
- [ ] Test 3.2: Standard user limit (5)
- [ ] Test 3.3: Premium unlimited

### Test Suite 4: WizardRFQModal
- [ ] Test 4.1: Complete vendor flow
- [ ] Test 4.2: Vendor filtering
- [ ] Test 4.3: No vendors available
- [ ] Test 4.4: Vendor sorting
- [ ] Test 4.5: Vendor selection required

### Test Suite 5: PublicRFQModal
- [ ] Test 5.1: Guest posting
- [ ] Test 5.2: Auth user posting
- [ ] Test 5.3: Payment enforcement

### Test Suite 6: OTP Flow
- [ ] Test 6.1: Correct OTP
- [ ] Test 6.2: Incorrect OTP
- [ ] Test 6.3: Resend OTP
- [ ] Test 6.4: Rate limit sends
- [ ] Test 6.5: Rate limit attempts
- [ ] Test 6.6: OTP expiry

### Test Suite 7: Draft Persistence
- [ ] Test 7.1: Drafts by RFQ type
- [ ] Test 7.2: Draft expiry
- [ ] Test 7.3: Draft cleared on success

### Test Suite 8: Form Validation
- [ ] Test 8.1: Required fields
- [ ] Test 8.2: Field type validation
- [ ] Test 8.3: Field bounds

### Test Suite 9: Error Handling
- [ ] Test 9.1: Network error
- [ ] Test 9.2: API 500 error
- [ ] Test 9.3: Validation 400 error

---

## Test Results Template

```
TEST SUITE: [Name]
TEST CASE: [Number & Description]
STATUS: [ ] PASS [ ] FAIL [ ] BLOCKED

Environment: Local Dev
Browser: Chrome/Firefox
Date: [Date]
Tester: [Name]

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Steps to Reproduce:
[Clear step-by-step]

Screenshots/Logs:
[Attach if relevant]

Notes:
[Any additional info]
```

---

## Sign-Off

Testing begins: [Date/Time]
Testing ends: [Date/Time]
Total tests: 40+
Passed: ___
Failed: ___
Blocked: ___

Tested By: _______________
Date: _______________

Approved for Deployment: _______________
Date: _______________

---

**Status:** Ready to Execute  
**Estimated Duration:** 3-4 hours  
**Next Step:** Run all test suites and document results
