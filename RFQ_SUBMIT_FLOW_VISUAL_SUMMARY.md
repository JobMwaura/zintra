# RFQ SUBMIT FLOW - VISUAL SUMMARY & QUICK START

## 🎯 Overview

This is your complete **end-to-end RFQ submission system** for all 4 RFQ types:
- **Direct RFQ**: User selects vendors → submit → sent to chosen vendors
- **Wizard RFQ**: User fills form → auto-match vendors → submit → sent to best matches
- **Public RFQ**: User fills form → submit → visible to all vendors (notified top 20)
- **Vendor Request**: Start with vendor → fill form → submit → sent to that vendor

---

## 📊 System Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER SUBMITS RFQ (Frontend)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 0: PRE-SUBMIT VALIDATION (Client-side)                                │
│  - Validate all required fields (title, summary, category, county, budget) │
│  - Check type-specific requirements (vendors for Direct, etc.)              │
│  - Show error toast if invalid                                              │
│  - Disable submit button, show "Submitting..."                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: AUTHENTICATION GATE                                                 │
│  - Check: Is user signed in?                                                │
│  - NO  → Show auth modal (Sign In / Create Account)                         │
│  - YES → Continue (form data preserved)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: VERIFICATION GATE                                                   │
│  - Check: Is user.email_verified AND user.phone_verified?                   │
│  - NO  → Show verification modal (email OTP + phone OTP)                    │
│  - YES → Continue                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: ELIGIBILITY CHECK (API: /api/rfq/check-eligibility)                │
│  - Query: How many RFQs has user submitted this month?                      │
│  - FREE_LIMIT = 3                                                            │
│  - IF remaining_free > 0 → No payment needed                                │
│  - IF remaining_free = 0 → SHOW PAYMENT MODAL (KES 300)                    │
│           ↓                                                                   │
│       PAYMENT MODAL                                                          │
│       - User selects method (M-Pesa / Card)                                 │
│       - On success → Continue to submit                                      │
│       - On cancel  → Stop (keep draft)                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: FINAL SUBMIT (API: /api/rfq/create)                                │
│  - Send RFQ data to backend                                                 │
│  - Backend creates RFQ record + recipients                                  │
│  - Return rfqId                                                              │
│  - Clear draft from localStorage                                             │
│  - Show success toast                                                        │
│  - Redirect to /rfq/:id                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                       RFQ DETAIL PAGE (Success)                             │
│  - Show RFQ title, summary, budget, category, location                     │
│  - Show status tracker (Sent → Viewed → Quoted)                            │
│  - List vendors this RFQ was sent to                                        │
│  - Action buttons: Close, Edit, Extend, Upgrade                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Operations (Sequence)

```
POST /api/rfq/check-eligibility
├─ Input: user_id, rfq_type
├─ Check: User authenticated
├─ Check: User email_verified && phone_verified
├─ Query: COUNT rfqs WHERE user_id = ? AND status = 'submitted' AND created_at >= this_month
├─ Calculate: remaining_free = MAX(0, 3 - count)
├─ Return: {
│    eligible: true,
│    remaining_free: 2,
│    requires_payment: false,
│    amount: 0,
│    message: "..."
│  }
└─ Time: < 200ms (fast check, no RFQ created yet)

POST /api/rfq/create
├─ Input: full RFQ payload + userId
├─ Check: User authenticated (userId required)
├─ Check: User email_verified && phone_verified
├─ Recheck: usage limit (never trust frontend)
├─ Validate: category exists, required fields present
├─ Sanitize: strip scripts from title & summary
├─ INSERT rfqs table:
│   ├─ user_id, type, category, title, description
│   ├─ location, county, budget_estimate
│   ├─ status = 'submitted', visibility = 'private' or 'public'
│   ├─ template_data (JSON), shared_data (JSON)
│   └─ is_paid = true/false
├─ CREATE RECIPIENTS (type-specific):
│   ├─ DIRECT RFQ: 
│   │  └─ INSERT into rfq_recipients for each selected vendor
│   │     recipient_type = 'direct'
│   ├─ WIZARD RFQ:
│   │  └─ Auto-match vendors by category + rating
│   │  └─ INSERT into rfq_recipients for matched vendors
│   │     recipient_type = 'wizard'
│   └─ PUBLIC RFQ:
│      └─ Get top 20 vendors by rating
│      └─ INSERT into rfq_recipients for each top vendor
│         recipient_type = 'public'
├─ Async (non-blocking):
│   ├─ Send in-app notifications to vendors
│   ├─ Send email notifications to vendors
│   └─ Send confirmation email to user
└─ Return: { success: true, rfqId: "...", message: "..." }
```

---

## 📱 Frontend Component Hierarchy

```
RFQModal (Main form component)
├─ Step 0: Validation
│  └─ Call validateRFQForm()
├─ Step 1: Auth Gate
│  ├─ Check supabase.auth.getUser()
│  └─ Show AuthModal if needed
├─ Step 2: Verification Gate
│  └─ Show VerificationModal if not verified
│     ├─ Email OTP
│     └─ Phone OTP
├─ Step 3: Eligibility
│  ├─ Call POST /api/rfq/check-eligibility
│  └─ If requires_payment:
│     └─ Show PaymentModal
│        ├─ M-Pesa option
│        └─ Card option
└─ Step 4: Submit
   └─ Call POST /api/rfq/create
      └─ On success:
         ├─ clearDraft()
         ├─ showSuccessToast()
         └─ router.push(/rfq/:id)

VerificationModal (Reusable)
├─ Email verification step
│  ├─ Input email
│  ├─ Send OTP
│  └─ Verify OTP
└─ Phone verification step
   ├─ Input phone
   ├─ Send OTP
   └─ Verify OTP

PaymentModal (Reusable)
├─ M-Pesa:
│  ├─ Input phone
│  └─ Process payment
└─ Card:
   ├─ Input card details
   └─ Process payment

RFQDetailPage
├─ Fetch RFQ data from rfqs table
├─ Fetch recipients from rfq_recipients
├─ Show RFQ info
├─ Show status tracker
├─ Show vendors list
└─ Action buttons
```

---

## 💾 Database Tables & Operations

### rfqs table
```sql
INSERT INTO rfqs (
  user_id,           -- FK to auth.users
  type,              -- 'direct' | 'wizard' | 'public' | 'vendor-request'
  category,          -- categorySlug (e.g., 'roofing')
  title,             -- Project title
  description,       -- Project summary
  location,          -- Town/area
  county,            -- County
  budget_estimate,   -- "10000 - 50000"
  status,            -- 'submitted' | 'viewed' | 'quoted' | 'completed'
  visibility,        -- 'private' | 'public'
  template_data,     -- JSON: category-specific fields
  shared_data,       -- JSON: shared fields (budget, dates, etc.)
  is_paid            -- true if paid extra
) VALUES (...)
```

### rfq_recipients table
```sql
INSERT INTO rfq_recipients (
  rfq_id,            -- FK to rfqs
  vendor_id,         -- FK to vendors
  recipient_type,    -- 'direct' | 'wizard' | 'public'
  status             -- 'sent' | 'viewed' | 'quoted'
) VALUES (...)

-- Direct RFQ: 1 row per selected vendor
-- Wizard RFQ: 1 row per auto-matched vendor
-- Public RFQ: 1 row per top 20 vendor
```

### notifications table
```sql
INSERT INTO notifications (
  user_id,           -- Vendor receiving notification
  type,              -- 'rfq_received'
  related_rfq_id,    -- FK to rfqs
  title,             -- "New RFQ: Roofing & Waterproofing"
  message,           -- Full notification text
  created_at         -- Timestamp
) VALUES (...)
```

---

## ✅ Data Validation Checklist

### Pre-Submit (Client-side)
- [ ] Project title: non-empty
- [ ] Project summary: non-empty
- [ ] Category: selected
- [ ] County: selected
- [ ] Town: non-empty
- [ ] Budget min & max: both required, min ≤ max
- [ ] For Direct: at least 1 vendor selected
- [ ] For Public: visibility scope selected
- [ ] Template fields: all required fields filled (category-specific)

### Server-Side (check-eligibility)
- [ ] User authenticated (userId present)
- [ ] User email verified
- [ ] User phone verified
- [ ] Query RFQ count for this month

### Server-Side (create)
- [ ] User authenticated
- [ ] User email & phone verified
- [ ] Usage limit re-check (server-side)
- [ ] Category exists
- [ ] Required fields non-empty
- [ ] Budget: min ≤ max
- [ ] For Direct: validate vendor IDs exist + active
- [ ] For Wizard: validate category for matching
- [ ] For Public: visibility scope valid

---

## 🎨 UX States

### Success State
```
✅ RFQ Submitted

Status Tracker:
Sent to 3 vendors ✅ → Viewed by vendors → Quotes received

Actions:
[Close RFQ] [Edit] [Extend Deadline] [Send to More Vendors]
```

### Loading States
```
Pre-submit    → "Validating form..."
Auth          → "Signing you in..."
Verification  → "Sending OTP..."
Eligibility   → "Checking eligibility..."
Payment       → "Processing payment..."
Submit        → "Submitting RFQ..."
```

### Error States
```
✗ Required fields missing
✗ User not verified
✗ Not eligible (quota exceeded)
✗ Payment failed
✗ Network error
✗ Server error
```

---

## 🔒 Security

| Layer | Implementation |
|-------|-----------------|
| **Authentication** | Supabase auth + session token |
| **Authorization** | RLS policies on rfqs table |
| **Verification** | Email OTP + Phone OTP required |
| **Input Sanitization** | Strip HTML/scripts from title & description |
| **Server-Side Checks** | Re-validate usage limit (never trust frontend) |
| **Payment Validation** | Verify payment receipt exists |
| **Vendor Validation** | Confirm vendors exist before assigning |
| **RLS Policy** | SERVICE_ROLE policy WITH CHECK clause (see RLS_RFQ_INSERT_POLICY_FIX.md) |

---

## 📋 Implementation Phases

| Phase | Task | Timeline | Files |
|-------|------|----------|-------|
| **1** | Backend setup | 3-4 days | /app/api/rfq/check-eligibility, /app/api/rfq/create |
| **2** | Frontend core | 5-6 days | RFQModal, validation, auth, verification, payment |
| **3-4** | Detail pages | 2-3 days | /pages/rfq/[id], /pages/vendor/rfq/[id] |
| **5** | Components | 2-3 days | Modals, forms, selectors |
| **6** | Testing | 2-3 days | Unit, integration, E2E tests |
| **7** | Deployment | 1 day | Deploy to Vercel, monitoring setup |

**Total: 15-20 days**

---

## 🚀 Quick Start Checklist

### Immediate (Foundation)
- [ ] Read `RFQ_SUBMIT_FLOW_COMPLETE.md` (full architecture)
- [ ] Read `RFQ_SUBMIT_FLOW_CODE_TEMPLATES.md` (code examples)
- [ ] Verify database schema (rfqs, rfq_recipients tables)
- [ ] Confirm RLS policies (WITH CHECK clause)
- [ ] Test check-eligibility endpoint with cURL

### Backend (First Week)
- [ ] Create `/app/api/rfq/check-eligibility/route.js`
- [ ] Update `/app/api/rfq/create/route.js` with all logic
- [ ] Implement vendor matching functions
- [ ] Set up notification system
- [ ] Test all API endpoints

### Frontend (Second Week)
- [ ] Build form validation hook
- [ ] Build submit handler hook
- [ ] Build verification modal
- [ ] Build payment modal
- [ ] Integrate all steps into RFQModal
- [ ] Add draft saving/loading
- [ ] Test entire flow end-to-end

### Polish (Third Week)
- [ ] Build RFQ detail pages
- [ ] Build reusable components
- [ ] Full QA testing
- [ ] Deploy to Vercel
- [ ] Set up monitoring

---

## 📞 Reference Documents

1. **RFQ_SUBMIT_FLOW_COMPLETE.md** ← Start here
   - Complete flow documentation
   - Frontend steps explained
   - Backend implementation details
   - Type-specific logic

2. **RFQ_SUBMIT_FLOW_CODE_TEMPLATES.md** ← Copy/paste code
   - Production-ready templates
   - API endpoints
   - React hooks & components
   - Utility functions

3. **RFQ_SUBMIT_FLOW_CHECKLIST.md** ← Track progress
   - Detailed task breakdown
   - 7 implementation phases
   - Testing checklist
   - Deployment steps

4. **RLS_RFQ_INSERT_POLICY_FIX.md** ← Database fix
   - RLS policy issue explained
   - SQL fix to run in Supabase
   - Why SERVICE_ROLE needs WITH CHECK

5. **COMPREHENSIVE_RFQ_SYSTEM_AUDIT_REPORT.md** ← Historical context
   - Previous audit findings
   - Architecture decisions
   - Known issues resolved

---

## 💡 Key Design Decisions

| Decision | Reasoning |
|----------|-----------|
| **4 RFQ types** | Different user workflows (Direct: vendor selection first, Wizard: auto-match, Public: marketplace, Vendor: vendor-first) |
| **3 free RFQs/month** | Anti-spam + monetization (KES 300 per extra) |
| **Email + Phone verification** | Trust validation + legal compliance |
| **server-side re-check of limit** | Security (never trust frontend) |
| **Async notifications** | User sees success immediately (notifications sent in background) |
| **template_data + shared_data as JSON** | Flexibility for category-specific + standard fields |
| **rfq_recipients table** | Proper separation of RFQ from vendors |
| **Auto-match for Wizard** | Low admin overhead, smart distribution |

---

## 🎯 Success Criteria

Your implementation is complete when:

✅ User can sign up & verify email + phone
✅ User can fill and submit Direct RFQ (select vendors)
✅ User can fill and submit Wizard RFQ (auto-match)
✅ User can fill and submit Public RFQ (marketplace)
✅ User sees RFQ detail page after submit
✅ User with free RFQs can submit without payment
✅ User over limit must pay KES 300
✅ Vendors receive notifications
✅ System tracks RFQ status (sent → viewed → quoted)
✅ No RFQ is created if user not verified
✅ No RFQ is created if limit exceeded (unless paid)
✅ All data is properly sanitized
✅ Error handling is comprehensive

---

## 📚 Next Steps

1. **Today**: Read the three main documentation files
2. **Day 1-2**: Set up backend check-eligibility endpoint
3. **Day 2-3**: Update create endpoint with all logic
4. **Day 4-5**: Build frontend validation + submission flow
5. **Day 5-6**: Build verification + payment modals
6. **Day 7**: Test entire end-to-end flow
7. **Week 2**: Detail pages + components
8. **Week 3**: Polish + deploy

Questions? Refer to the relevant documentation file above.

---

**Generated**: January 6, 2026
**Project**: Zintra Platform - RFQ Submission System
**Status**: Ready for Implementation
