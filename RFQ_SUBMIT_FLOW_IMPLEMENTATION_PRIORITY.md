# RFQ SUBMIT FLOW - IMPLEMENTATION PRIORITY & ROADMAP

## 🎯 What To Build First (Priority Order)

This document outlines **exactly what to build** and **in what order** for fastest value delivery.

---

## 🔴 CRITICAL PATH (Must Complete First)

### Week 1: Core Backend + Flow

#### Day 1-2: Backend Foundation
**Priority: HIGHEST**
- [ ] Verify RLS policies in Supabase (WITH CHECK clause)
  - Run SQL from `RLS_RFQ_INSERT_POLICY_FIX.md` if not done
  - Confirm `rfqs_service_role` policy has WITH CHECK

- [ ] Create `/app/api/rfq/check-eligibility/route.js`
  ```
  Purpose: Quick eligibility check before submission
  Time: < 200ms response time
  Input: user_id, rfq_type
  Output: eligible, remaining_free, requires_payment, amount
  ```
  **Why first**: Lightweight, minimal dependencies, helps frontend design
  
- [ ] Test check-eligibility endpoint
  ```bash
  curl -X POST http://localhost:3000/api/rfq/check-eligibility \
    -H "Content-Type: application/json" \
    -d '{"user_id":"...", "rfq_type":"direct"}'
  ```

#### Day 3-4: Main Creation Endpoint
**Priority: HIGHEST**
- [ ] Verify `/app/api/rfq/create/route.js` has:
  - Auth check (userId required)
  - Verification check (email + phone)
  - Re-check usage limit
  - Input validation + sanitization
  - RFQ insertion
  - Recipient creation (type-specific)
  - Async notifications

- [ ] Implement recipient creation:
  - **Direct**: Insert selected vendors as-is
  - **Wizard**: Auto-match by category + rating
  - **Public**: Get top 20 vendors
  
  ```javascript
  // Direct: Simple
  recipients = selectedVendors.map(v => ({
    rfq_id, vendor_id: v, recipient_type: 'direct', status: 'sent'
  }))
  
  // Wizard: Query by category
  vendors = await supabase
    .from('vendors')
    .select('*')
    .or(`primary_category.eq.${category},secondary_categories.contains.[${category}]`)
    .order('rating', { ascending: false })
    .limit(5)
  
  // Public: Top 20
  vendors = await supabase.from('vendors')
    .select('*')
    .order('rating', { ascending: false })
    .limit(20)
  ```

- [ ] Test create endpoint
  ```bash
  curl -X POST http://localhost:3000/api/rfq/create \
    -H "Content-Type: application/json" \
    -d '{
      "userId":"...",
      "rfqType":"direct",
      "categorySlug":"roofing",
      "sharedFields":{"title":"Fix roof","...":"..."},
      "selectedVendors":["vendor1","vendor2"]
    }'
  ```

#### Day 5: Frontend Form Structure
**Priority: HIGH**
- [ ] Verify `RFQModal` component exists and handles:
  - Step-based UI (0, 1, 2, 3, 4)
  - Form data state management
  - Loading states
  - Error display

- [ ] Build form validation hook
  ```javascript
  const { validateRFQForm } = useRFQFormValidation()
  
  // Usage:
  const { isValid, errors } = validateRFQForm(formData, rfqType, templateFields)
  if (!isValid) {
    showErrorToast(errors.join(', '))
    highlightErrorFields(errors)
    return
  }
  ```

- [ ] Build submit handler hook
  ```javascript
  const { handleSubmit, isSubmitting, error } = useRFQSubmit()
  
  // In form submit:
  await handleSubmit(formData, rfqType)
  // Returns: redirect to /rfq/:id OR error shown
  ```

#### Day 6-7: Frontend Submission Flow (All Steps)
**Priority: HIGH**

**Step 0: Validation**
- [ ] Call `validateRFQForm()` on submit click
- [ ] If error: show toast + highlight fields + return
- [ ] If valid: disable button, show "Submitting...", continue

**Step 1: Authentication**
```javascript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  showAuthModal()
  // After auth: continue (preserve form data)
  return
}
```

**Step 2: Verification**
```javascript
if (!user.phone_verified || !user.email_verified) {
  showVerificationModal(user.phone_verified, user.email_verified)
  // After verification: continue
  return
}
```

**Step 3: Eligibility Check**
```javascript
const eligi = await fetch('/api/rfq/check-eligibility', {
  method: 'POST',
  body: JSON.stringify({ user_id: user.id, rfq_type: formData.rfqType })
})
const result = eligi.json()

if (result.requires_payment) {
  showPaymentModal({ amount: 300 })
  // After payment: continue
  return
}
```

**Step 4: Final Submit**
```javascript
const createRes = await fetch('/api/rfq/create', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    rfqType: formData.rfqType,
    categorySlug: formData.selectedCategory,
    sharedFields: formData.sharedFields,
    selectedVendors: formData.selectedVendors,
    // ... other fields
  })
})

const result = createRes.json()
if (createRes.ok) {
  localStorage.removeItem('rfq_form_draft')
  showSuccessToast('RFQ submitted! ✅')
  router.push(`/rfq/${result.rfqId}`)
}
```

**Status**: End of Week 1 = Core flow working ✅

---

## 🟡 SECONDARY (Build Next)

### Week 2: Polish & Detail Pages

#### Day 1-2: Detail Pages
**Priority: HIGH** (users need to see what they submitted)
- [ ] Create `/pages/rfq/[id].jsx` (user view)
  - Fetch RFQ data + recipients
  - Show title, summary, category, location, budget
  - Show status tracker (Sent → Viewed → Quoted)
  - List vendors sent to
  - Action buttons (Close, Edit, Extend, Upgrade)

- [ ] Create `/pages/vendor/rfq/[id].jsx` (vendor view)
  - Show RFQ details (read-only)
  - Button: "Submit Quote"
  - Button: "Ask a Question"
  - Button: "Save"

#### Day 3-4: Reusable Components
**Priority: MEDIUM**
- [ ] VerificationModal
  - Email OTP input + send
  - Phone OTP input + send
  - Progress indicator
  - Error handling

- [ ] PaymentModal
  - Amount display
  - M-Pesa option
  - Card option
  - Processing state

- [ ] VendorSelector (for Direct RFQ)
  - Fetch vendors by category
  - Show vendor cards (rating, avatar)
  - Multi-select with checkboxes
  - Selected count

- [ ] StatusTracker
  - Visual timeline
  - Update counts (sent, viewed, quoted)
  - Optional: real-time polling

#### Day 5: Draft Saving
**Priority: MEDIUM** (helps UX)
- [ ] Save form data to localStorage on change
  ```javascript
  const { saveDraft, loadDraft, clearDraft } = useDraft()
  
  // Save on every change
  onChange={() => {
    setFormData(newData)
    saveDraft(newData)
  }}
  
  // Load on mount
  useEffect(() => {
    const draft = loadDraft()
    if (draft) setFormData(draft)
  }, [])
  
  // Clear on success
  if (success) clearDraft()
  ```

#### Day 6-7: Polish
**Priority: MEDIUM**
- [ ] Loading states for all async operations
- [ ] Error handling + logging
- [ ] Toast notifications (success, error, warning)
- [ ] Form accessibility (labels, aria attributes)
- [ ] Mobile responsiveness

**Status**: End of Week 2 = Full user flow working ✅

---

## 🟢 OPTIONAL (Nice to Have)

### Week 3: Advanced Features

#### Day 1-2: Real-time Status Updates
**Priority: LOW**
- [ ] Polling or WebSocket for status updates
- [ ] Show real-time vendor interactions
- [ ] Notification badge updates

#### Day 3-4: RFQ Management
**Priority: LOW**
- [ ] Close RFQ endpoint
- [ ] Edit RFQ endpoint (within time limit)
- [ ] Extend deadline
- [ ] Send to more vendors (bulk)

#### Day 5-6: Vendor Dashboard
**Priority: LOW**
- [ ] Vendor RFQ feed (Public RFQs)
- [ ] RFQ search & filter
- [ ] Quote submission form
- [ ] Message thread with user

#### Day 7: Analytics
**Priority: LOW**
- [ ] Track submission success rate
- [ ] Track payment completion rate
- [ ] Vendor response time tracking
- [ ] Popular categories

**Status**: End of Week 3 = Production-ready system ✅

---

## 📊 Dependency Graph

```
RLS Policies (Foundation)
    ↓
check-eligibility Endpoint
    ↓
create Endpoint (Direct)
    ↓
create Endpoint (Wizard auto-match)
    ↓
create Endpoint (Public top-vendors)
    ↓
Form Validation Hook
    ↓
Submit Handler Hook
    ↓
Auth Gate (Step 1)
    ↓
Verification Modal (Step 2)
    ↓
Eligibility Check (Step 3)
    ↓
Payment Modal (Step 3.5)
    ↓
Final Submit (Step 4)
    ↓
RFQ Detail Page (show result)
```

**Critical path**: RLS → Endpoints → Frontend flow → Detail pages

**Parallel work**: You can build form validation + submit handler while endpoints are being finalized

---

## 💼 Effort Estimates

| Task | Days | Difficulty | Impact |
|------|------|-----------|--------|
| RLS Policy Fix | 0.5 | 🟢 Easy | 🔴 Critical |
| check-eligibility | 1 | 🟢 Easy | 🟢 High |
| create Endpoint | 2 | 🟡 Medium | 🔴 Critical |
| Form Validation | 0.5 | 🟢 Easy | 🟢 High |
| Submit Handler | 1.5 | 🟡 Medium | 🔴 Critical |
| Auth Gate | 0.5 | 🟢 Easy | 🟢 High |
| Verification Modal | 1 | 🟡 Medium | 🟢 High |
| Payment Modal | 1.5 | 🟡 Medium | 🟡 Medium |
| RFQ Detail Page | 1.5 | 🟡 Medium | 🟢 High |
| Vendor Detail Page | 1 | 🟡 Medium | 🟡 Medium |
| Polish + Testing | 3 | 🟡 Medium | 🟡 Medium |
| Deployment | 0.5 | 🟢 Easy | 🟡 Medium |

**Total: ~15 days** (can be reduced to 10 days with parallel work)

---

## ✅ Weekly Milestones

### Week 1 (Ends Friday)
**Milestone: Core submission flow working**
- [ ] RLS policies fixed
- [ ] Both API endpoints working + tested
- [ ] Form validation working
- [ ] All 4 steps implemented (Auth → Verify → Eligibility → Submit)
- [ ] User can submit RFQ and see detail page

**Test**: Submit direct RFQ as new user
- Create account → Verify email/phone → Select vendor → Submit
- Check database: RFQ created + recipient created
- Check vendors: Notifications received

### Week 2 (Ends Friday)
**Milestone: Complete user experience**
- [ ] RFQ detail page done
- [ ] Vendor detail page done
- [ ] All modals polished
- [ ] Draft saving works
- [ ] All error handling complete
- [ ] Mobile responsive

**Test**: Full end-to-end as different user types
- User with free RFQs → Submit without payment
- User over limit → Show payment modal
- Vendor → View RFQ + submit quote

### Week 3 (Ends Friday)
**Milestone: Production ready**
- [ ] All features tested (unit + integration + E2E)
- [ ] Performance optimized
- [ ] Error logging set up
- [ ] Monitoring configured
- [ ] Deployed to Vercel

**Test**: Stress test (concurrent submissions)
- Multiple users submitting simultaneously
- Check for race conditions
- Verify database consistency

---

## 🔍 Testing Checklist (Per Milestone)

### Week 1 Testing
- [ ] Direct RFQ creation (API returns rfqId)
- [ ] Wizard RFQ creation (vendors auto-matched)
- [ ] Public RFQ creation (top 20 vendors notified)
- [ ] Payment required when over limit
- [ ] User must be verified (phone + email)
- [ ] API input validation (missing fields rejected)
- [ ] Recipient records created correctly
- [ ] Duplicate submissions prevented

### Week 2 Testing
- [ ] Detail page loads RFQ data
- [ ] Recipients displayed with vendor info
- [ ] Status tracker shows correct counts
- [ ] Draft saving/loading works
- [ ] Auth modal flows correctly
- [ ] Verification modal flows correctly
- [ ] Payment modal flows correctly
- [ ] Success redirect works

### Week 3 Testing
- [ ] Concurrent submissions don't create duplicates
- [ ] Database is consistent after all operations
- [ ] Error logging captures all failures
- [ ] Performance is acceptable (< 2s total time)
- [ ] Mobile UI is responsive
- [ ] All edge cases handled gracefully

---

## 🚀 Go-Live Checklist

**Before deploying to production:**

- [ ] All tests passing (unit + integration + E2E)
- [ ] Error handling complete (no white screens)
- [ ] Loading states shown for all async ops
- [ ] Form validation works client-side + server-side
- [ ] RLS policies confirmed in Supabase
- [ ] Database indexes created for performance
- [ ] Environment variables set in Vercel
- [ ] Payment provider credentials configured
- [ ] Email/SMS notifications working
- [ ] Error tracking (Sentry) configured
- [ ] Analytics tracking configured
- [ ] User documentation written
- [ ] Vendor documentation written
- [ ] Support team trained
- [ ] Staging environment tested
- [ ] Database backup configured

---

## 🎯 Success = This Works

```javascript
// User journey (full test)
1. Unauth user lands on RFQ form
2. Fills form (project title, category, vendors, etc.)
3. Clicks "Submit RFQ"
4. Auth modal shown → Creates account
5. Verification modal shown → Verifies email + phone
6. Eligibility check → Shows "2 free RFQs remaining"
7. Form submits → Creates RFQ in database
8. Redirect to /rfq/[id] → Shows detail page
9. Detail page shows:
   - RFQ title + summary
   - Sent to 3 vendors ✅
   - Waiting for vendors to view
10. Vendors receive notifications
11. One vendor responds
12. Status shows "Quote received"
13. User sees vendor's quote on detail page
```

If this whole flow works → **YOU'RE DONE** ✅

---

## 📞 Quick Reference

| Need | File |
|------|------|
| Overall flow | RFQ_SUBMIT_FLOW_COMPLETE.md |
| Implementation tasks | RFQ_SUBMIT_FLOW_CHECKLIST.md |
| Code templates | RFQ_SUBMIT_FLOW_CODE_TEMPLATES.md |
| Visual diagrams | RFQ_SUBMIT_FLOW_VISUAL_SUMMARY.md |
| Database fix | RLS_RFQ_INSERT_POLICY_FIX.md |
| This doc | RFQ_SUBMIT_FLOW_IMPLEMENTATION_PRIORITY.md |

---

**Timeline**: 15 days (1-2 weeks with full focus)
**Complexity**: Medium (multiple steps, type-specific logic)
**Risk Level**: Low (well-isolated, clear requirements)
**Value**: High (core feature for platform)

**Start**: Monday
**Target Launch**: 3 weeks from start
**Maintenance**: Minimal (once complete, stable feature)
