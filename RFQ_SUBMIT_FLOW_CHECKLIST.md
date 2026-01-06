# RFQ Submit Flow - Implementation Checklist

## Phase 1: Backend Setup (Foundation)

### 1.1 Verify Database Schema
- [ ] Confirm `rfqs` table has all required columns:
  - `user_id` (FK to auth.users)
  - `type` (varchar: 'direct', 'wizard', 'public')
  - `category` (varchar: categorySlug)
  - `title` (varchar)
  - `description` (text)
  - `location` (varchar)
  - `county` (varchar)
  - `budget_estimate` (varchar)
  - `status` (varchar: 'submitted', 'viewed', 'quoted', 'completed', 'closed')
  - `visibility` (varchar: 'private', 'public')
  - `template_data` (jsonb)
  - `shared_data` (jsonb)
  - `is_paid` (boolean)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- [ ] Confirm `rfq_recipients` table exists:
  - `rfq_id` (FK to rfqs)
  - `vendor_id` (FK to vendors)
  - `recipient_type` (varchar: 'direct', 'wizard', 'public')
  - `status` (varchar: 'sent', 'viewed', 'quoted')
  - `created_at` (timestamp)

- [ ] Confirm `users` table has verification fields:
  - `phone_verified` (boolean)
  - `email_verified` (boolean)

- [ ] Confirm RLS policies are correct:
  - [ ] `rfqs_insert` policy allows authenticated users to insert own RFQs
  - [ ] `rfqs_service_role` policy has WITH CHECK clause for SERVICE_ROLE
  - [ ] Run: `/supabase/sql/RLS_RFQ_INSERT_POLICY_FIX.md` if needed

### 1.2 Create Check Eligibility Endpoint
- [ ] Create `/app/api/rfq/check-eligibility/route.js`
- [ ] Implement:
  - [ ] User authentication check
  - [ ] Phone + email verification check
  - [ ] Count RFQs this month (submitted status only)
  - [ ] Calculate remaining_free (FREE_LIMIT = 3)
  - [ ] Determine requires_payment (if count >= 3)
  - [ ] Return proper JSON response
- [ ] Add error handling:
  - [ ] User not found → 404
  - [ ] User not verified → 200 with eligible: false
  - [ ] Database errors → 500 with details
- [ ] Add logging for debugging
- [ ] Test with cURL or Postman

### 1.3 Update Create RFQ Endpoint
- [ ] Verify `/app/api/rfq/create/route.js` exists
- [ ] Confirm it implements:
  - [ ] Auth check (userId required)
  - [ ] Verification check (email + phone verified)
  - [ ] Re-check usage limit (server-side)
  - [ ] Payload validation (category, title, summary, county)
  - [ ] Input sanitization (strip scripts)
  - [ ] RFQ insertion into `rfqs` table
  - [ ] Type-specific recipient creation:
    - [ ] Direct: Insert selected vendors
    - [ ] Wizard: Auto-match vendors
    - [ ] Public: Notify top 20 vendors
  - [ ] Async notifications (non-blocking)
  - [ ] Return rfqId + success message

### 1.4 Implement Vendor Matching Functions
- [ ] Create helper function: `autoMatchVendors(rfqId, categorySlug, county)`
  - [ ] Query vendors by primary category OR secondary categories
  - [ ] Filter by county (if provided)
  - [ ] Filter by active subscription
  - [ ] Sort by: rating DESC, response_rate DESC, verified_docs DESC
  - [ ] Take top 5-10
  - [ ] Insert into rfq_recipients

- [ ] Create helper function: `getTopVendorsForCategory(categorySlug, county, limit)`
  - [ ] Query vendors matching category
  - [ ] Filter by active subscription
  - [ ] Sort by: rating DESC, verified_docs DESC
  - [ ] Take top N (20 for public)
  - [ ] Return vendor list

### 1.5 Implement Notification System (Async)
- [ ] Create function: `triggerNotifications(rfqId, rfqType)`
- [ ] Send in-app notifications to vendors
- [ ] Send email notifications to vendors
- [ ] Send confirmation email to user
- [ ] Make async (non-blocking for RFQ creation)
- [ ] Log errors but don't block response

### 1.6 API Testing
- [ ] Test check-eligibility:
  - [ ] Unauthenticated user → 401
  - [ ] User not verified → returns eligible: false
  - [ ] User with free RFQs → eligible: true, requires_payment: false
  - [ ] User over limit → eligible: true, requires_payment: true

- [ ] Test create endpoint:
  - [ ] Unauthenticated → 401
  - [ ] Not verified → 403
  - [ ] Missing required fields → 400
  - [ ] Valid direct RFQ → 201 + rfqId
  - [ ] Valid wizard RFQ → 201 + rfqId + recipient creation
  - [ ] Valid public RFQ → 201 + rfqId + recipient creation

---

## Phase 2: Frontend Setup (Core UX)

### 2.1 RFQ Form Component Structure
- [ ] Verify RFQModal component exists at `/components/RFQModal/RFQModal.jsx`
- [ ] Confirm it handles all RFQ types: direct, wizard, public, vendor-request
- [ ] Verify step-based flow is implemented

### 2.2 Step 0: Pre-Submit Validation
- [ ] Implement `validateRFQForm(formData, rfqType)` function:
  - [ ] Validate required shared fields:
    - [ ] projectTitle (non-empty)
    - [ ] projectSummary (non-empty)
    - [ ] category (selected)
    - [ ] county (selected)
    - [ ] town (non-empty)
    - [ ] budgetMin & budgetMax (both required)
  - [ ] Validate template fields (category-specific required fields)
  - [ ] Validate type-specific requirements:
    - [ ] Direct: at least 1 vendor selected
    - [ ] Public: visibility scope selected
  - [ ] Return: { isValid: boolean, errors: string[] }

- [ ] In form submit handler:
  - [ ] Call validateRFQForm()
  - [ ] If invalid: highlight error fields + show error toast + DON'T submit
  - [ ] If valid: disable submit button + proceed to auth check

### 2.3 Step 1: Authentication Gate
- [ ] In handleRFQSubmit:
  - [ ] Call `supabase.auth.getUser()`
  - [ ] If user is null:
    - [ ] Show auth modal (Sign In / Create Account)
    - [ ] On auth success: continue submission (preserve form data)
    - [ ] On auth cancel: keep draft + stop submission
  - [ ] If user exists: proceed to verification

- [ ] Implement auth modal:
  - [ ] Tabs: Sign In | Create Account
  - [ ] After success: trigger submission continuation

### 2.4 Step 2: Verification Gate
- [ ] Implement `verificationGate(user, formData)` function:
  - [ ] Check user.phone_verified && user.email_verified
  - [ ] If both verified: continue to eligibility check
  - [ ] If missing verification:
    - [ ] Show verification modal with steps
    - [ ] Allow user to verify email
    - [ ] Allow user to verify phone (OTP)
    - [ ] On success: continue submission

- [ ] Email verification:
  - [ ] Show email input (pre-filled if on user)
  - [ ] Send OTP to email
  - [ ] Show OTP input field
  - [ ] Verify and mark email_verified = true

- [ ] Phone verification (OTP):
  - [ ] Show phone input (pre-filled if on user)
  - [ ] Send OTP via SMS
  - [ ] Show OTP input field
  - [ ] Verify and mark phone_verified = true

### 2.5 Step 3: Eligibility Check + Payment
- [ ] Implement `eligibilityCheck(userId, formData)` function:
  - [ ] Call POST /api/rfq/check-eligibility
  - [ ] Show loading state ("Checking eligibility...")
  - [ ] Handle response:
    - [ ] If not eligible: show error + stop
    - [ ] If eligible + no payment: continue to submit
    - [ ] If eligible + requires_payment:
      - [ ] Show payment modal
      - [ ] User selects payment method (M-Pesa / Card / etc.)
      - [ ] Process payment
      - [ ] On success: continue to submit
      - [ ] On failure/cancel: show toast + save draft + stop

- [ ] Payment modal:
  - [ ] Show amount (KES 300)
  - [ ] Show payment methods:
    - [ ] M-Pesa (prompt for phone)
    - [ ] Card (prompt for card details)
  - [ ] Integrate with payment provider
  - [ ] Return: { success: boolean, receiptId?: string }

### 2.6 Step 4: Final Submit
- [ ] Implement `finalSubmit(userId, formData)` function:
  - [ ] Build request payload:
    ```javascript
    {
      rfqType: formData.rfqType,
      categorySlug: formData.selectedCategory,
      jobTypeSlug: formData.selectedJobType,
      templateFields: formData.templateFields,
      sharedFields: { /* all shared fields */ },
      selectedVendors: formData.selectedVendors || [],
      userId: userId,
      visibilityScope: formData.visibilityScope
    }
    ```
  - [ ] Call POST /api/rfq/create
  - [ ] Show loading state
  - [ ] Handle response:
    - [ ] Success (201):
      - [ ] Clear draft from localStorage
      - [ ] Show success toast: "RFQ submitted and sent to vendors ✅"
      - [ ] Redirect to `/rfq/{rfqId}`
    - [ ] Error:
      - [ ] Show error toast with message
      - [ ] Keep form data intact (for retry)
      - [ ] Don't redirect

- [ ] Draft management:
  - [ ] Save form data to localStorage while filling
  - [ ] Restore from localStorage on page load
  - [ ] Clear localStorage on successful submit
  - [ ] Show "Resume previous draft?" if data exists

### 2.7 Form Data Structure
- [ ] Create TypeScript/JSDoc for form data shape:
  ```javascript
  {
    rfqType: 'direct' | 'wizard' | 'public',
    selectedCategory: string, // categorySlug
    selectedJobType: string, // jobTypeSlug
    projectTitle: string,
    projectSummary: string,
    county: string,
    town: string,
    budgetMin: number,
    budgetMax: number,
    directions: string,
    desiredStartDate: string, // ISO date
    templateFields: { [key: string]: any }, // category-specific
    selectedVendors: string[], // Direct RFQ only
    visibilityScope: 'county' | 'nationwide' // Public RFQ only
  }
  ```

---

## Phase 3: RFQ Detail Page

### 3.1 Create RFQ Detail Page
- [ ] Create `/pages/rfq/[id].jsx` or `/app/rfq/[id]/page.jsx` (depending on framework)
- [ ] Fetch RFQ data from Supabase:
  - [ ] `rfqs` table (by id)
  - [ ] `rfq_recipients` table (vendors for this RFQ)
  - [ ] `vendors` table (vendor details for recipients)

### 3.2 Display RFQ Information
- [ ] Show RFQ title + summary
- [ ] Show category + location
- [ ] Show budget range
- [ ] Show status tracker:
  - [ ] Sent to X vendors ✅
  - [ ] Viewed by X vendors [progress]
  - [ ] Quotes received: X
- [ ] Show created date + deadline

### 3.3 Display Template Data
- [ ] Show category-specific template fields as read-only
- [ ] Format based on field type (text, number, select, etc.)

### 3.4 Display Attachments (if any)
- [ ] Show file list with download links

### 3.5 Action Buttons
- [ ] Close RFQ (if status is 'submitted' or 'viewed')
- [ ] Edit RFQ (if status is 'submitted' and < 30 mins old)
- [ ] Extend deadline
- [ ] Send to more vendors (opens vendor selector)

### 3.6 Vendors Panel
- [ ] List vendors this RFQ was sent to
- [ ] Show vendor name, rating, avatar
- [ ] Show response status (sent/viewed/quoted)
- [ ] For quoted vendors: show quote amount

### 3.7 Quotes Panel (if any)
- [ ] List received quotes from vendors
- [ ] Show vendor, amount, date received
- [ ] CTA: View quote details

### 3.8 Messages Thread
- [ ] Show conversations between user and vendors
- [ ] CTA: Message vendor (starts new thread if not exists)

---

## Phase 4: Vendor-Side RFQ View

### 4.1 Create Vendor RFQ Detail Page
- [ ] Create `/app/vendor/rfq/[id]/page.jsx`
- [ ] Show RFQ details (read-only):
  - [ ] Title + summary
  - [ ] Category + location
  - [ ] Budget
  - [ ] Template data (category-specific fields)
  - [ ] Attachments
  - [ ] Client contact (if allowed)

### 4.2 Action Buttons
- [ ] [Submit Quote] → Opens quote form
- [ ] [Ask a Question] → Opens message composer
- [ ] [Save] → Adds to vendor's RFQ list

### 4.3 Quote Submission Form
- [ ] Show vendor quote template fields:
  - [ ] Quote amount (required)
  - [ ] Proposed timeline
  - [ ] Scope of work
  - [ ] Terms & conditions
  - [ ] Attachments
- [ ] Submit quote to `rfq_quotes` table
- [ ] Auto-update `rfq_recipients` status to 'quoted'

---

## Phase 5: Frontend Components (Reusable)

### 5.1 Verification Modal Component
- [ ] Create `/components/modals/VerificationModal.jsx`
- [ ] Props:
  - [ ] `isOpen: boolean`
  - [ ] `onClose: () => void`
  - [ ] `onSuccess: () => void`
  - [ ] `phoneVerified: boolean`
  - [ ] `emailVerified: boolean`

- [ ] Implement email verification step
- [ ] Implement phone OTP verification step
- [ ] Show progress indicator

### 5.2 Payment Modal Component
- [ ] Create `/components/modals/PaymentModal.jsx`
- [ ] Props:
  - [ ] `isOpen: boolean`
  - [ ] `onClose: () => void`
  - [ ] `onSuccess: (receiptId: string) => void`
  - [ ] `amount: number`
  - [ ] `description: string`

- [ ] Show payment methods (M-Pesa, Card)
- [ ] Handle payment provider integration
- [ ] Show loading + success states

### 5.3 Category Template Fields Component
- [ ] Create `/components/forms/TemplateFieldsForm.jsx`
- [ ] Props:
  - [ ] `categorySlug: string`
  - [ ] `jobTypeSlug: string`
  - [ ] `formData: object`
  - [ ] `onChange: (fieldName, value) => void`

- [ ] Fetch template schema from backend
- [ ] Render fields dynamically based on schema
- [ ] Validate as user types

### 5.4 Shared Fields Component
- [ ] Create `/components/forms/SharedFieldsForm.jsx`
- [ ] Props:
  - [ ] `formData: object`
  - [ ] `onChange: (fieldName, value) => void`
  - [ ] `errors: string[]`

- [ ] Render common fields:
  - [ ] Title, Summary, County, Town, Budget, Start Date, Directions
- [ ] Show error messages

### 5.5 Vendor Selector Component (Direct RFQ)
- [ ] Create `/components/forms/VendorSelector.jsx`
- [ ] Props:
  - [ ] `categorySlug: string`
  - [ ] `selectedVendors: string[]`
  - [ ] `onChange: (vendorIds: string[]) => void`

- [ ] Fetch vendors matching category
- [ ] Show vendor cards with rating + reviews
- [ ] Allow multi-select with checkboxes
- [ ] Show selected count

### 5.6 Status Tracker Component
- [ ] Create `/components/rfq/StatusTracker.jsx`
- [ ] Props:
  - [ ] `rfqId: string`
  - [ ] `status: string`
  - [ ] `sentCount: number`
  - [ ] `viewedCount: number`
  - [ ] `quotedCount: number`

- [ ] Show visual timeline:
  ```
  Sent ✅ → Viewed → Quoted
  ```
- [ ] Update in real-time (via polling or websocket)

---

## Phase 6: Testing & QA

### 6.1 Backend Testing
- [ ] [ ] Test check-eligibility endpoint with various user states
- [ ] [ ] Test create endpoint with valid/invalid payloads
- [ ] [ ] Test Direct RFQ creation + recipient insertion
- [ ] [ ] Test Wizard RFQ creation + auto-matching
- [ ] [ ] Test Public RFQ creation + top vendor selection
- [ ] [ ] Test error handling + logging
- [ ] [ ] Test concurrent requests (multiple users submitting)

### 6.2 Frontend Testing
- [ ] [ ] Test form validation (all required fields)
- [ ] [ ] Test auth flow (sign in + create account)
- [ ] [ ] Test verification flow (email + phone OTP)
- [ ] [ ] Test payment flow (success + cancel)
- [ ] [ ] Test all RFQ types (direct, wizard, public)
- [ ] [ ] Test draft saving/restoration
- [ ] [ ] Test form data preservation during auth/verification

### 6.3 Integration Testing
- [ ] [ ] End-to-end flow: Unauth → Auth → Verify → Pay → Submit → See detail page
- [ ] [ ] User with free RFQs can submit without payment
- [ ] [ ] User over limit must pay
- [ ] [ ] Direct RFQ vendors receive notifications
- [ ] [ ] Wizard RFQ sends to matched vendors
- [ ] [ ] Public RFQ sends to top vendors

### 6.4 Edge Cases
- [ ] [ ] User starts form → navigates away → returns (draft restored)
- [ ] [ ] User signs in during form submission
- [ ] [ ] User cancels payment (draft preserved)
- [ ] [ ] Network error during submission (error handling)
- [ ] [ ] Concurrent form submission (duplicate prevention)
- [ ] [ ] Vendor not found (graceful error)
- [ ] [ ] Category not found (graceful error)

### 6.5 Performance Testing
- [ ] [ ] Check-eligibility endpoint response time < 200ms
- [ ] [ ] Create endpoint response time < 500ms (excluding notifications)
- [ ] [ ] Vendor matching query performance
- [ ] [ ] Notifications don't block user response

---

## Phase 7: Deployment & Monitoring

### 7.1 Database Migrations
- [ ] [ ] Run schema migrations (if any missing columns)
- [ ] [ ] Update RLS policies (WITH CHECK clause)
- [ ] [ ] Create indexes on frequently queried fields:
  - [ ] `rfqs(user_id, created_at)` for monthly count
  - [ ] `rfq_recipients(rfq_id, vendor_id)`

### 7.2 Environment Variables
- [ ] [ ] Ensure all API endpoints are correctly configured
- [ ] [ ] Verify Supabase credentials (SERVICE_ROLE_KEY)
- [ ] [ ] Configure payment provider credentials (M-Pesa, Stripe, etc.)
- [ ] [ ] Set FREE_RFQ_LIMIT = 3
- [ ] [ ] Set EXTRA_RFQ_COST = 300 (KES)

### 7.3 Deploy to Vercel
- [ ] [ ] Push all changes to GitHub
- [ ] [ ] Vercel auto-deploys on push
- [ ] [ ] Verify all API endpoints are accessible
- [ ] [ ] Test in production environment

### 7.4 Monitoring & Logging
- [ ] [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] [ ] Monitor check-eligibility endpoint
- [ ] [ ] Monitor create endpoint
- [ ] [ ] Monitor notification delivery
- [ ] [ ] Track RFQ creation success rate
- [ ] [ ] Track payment completion rate

### 7.5 Documentation
- [ ] [ ] Update API documentation
- [ ] [ ] Create user guide for RFQ submission
- [ ] [ ] Create vendor guide for viewing RFQs
- [ ] [ ] Document troubleshooting common issues

---

## Summary

This checklist covers:
✅ Backend foundation (database + API endpoints)
✅ Frontend UX (all 4 submission steps)
✅ RFQ detail pages (user + vendor views)
✅ Reusable components
✅ Testing strategy
✅ Deployment process
✅ Monitoring setup

**Estimated Timeline**:
- Phase 1 (Backend): 3-4 days
- Phase 2 (Frontend): 5-6 days
- Phase 3-4 (Detail Pages): 2-3 days
- Phase 5 (Components): 2-3 days
- Phase 6 (Testing): 2-3 days
- Phase 7 (Deployment): 1 day

**Total**: ~15-20 days for full implementation
