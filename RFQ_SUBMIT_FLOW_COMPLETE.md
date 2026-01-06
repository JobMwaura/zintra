# RFQ Submit Flow - Complete Implementation Plan

## Overview
This document outlines the complete end-to-end RFQ submission flow for Direct, Wizard, and Public RFQs, including frontend validation, authentication, verification, payment eligibility checks, and backend creation logic.

## Architecture

```
USER CLICKS SUBMIT
    ↓
[FRONTEND] Pre-submit validation
    ↓
[FRONTEND] Authentication gate (sign in/create if needed)
    ↓
[FRONTEND] Verification gate (email + phone OTP)
    ↓
[FRONTEND] Eligibility check (free limit + payment)
    ↓
[FRONTEND] Show payment modal (if needed)
    ↓
[FRONTEND] Final submit
    ↓
[BACKEND] check-eligibility endpoint
    ↓
[BACKEND] create endpoint
    ↓
[BACKEND] RFQ type-specific logic (Direct/Wizard/Public)
    ↓
[BACKEND] Create recipients + notifications
    ↓
[FRONTEND] Success → Redirect to RFQ detail page
```

## Frontend Flow

### 0) Pre-Submit Validation (Client-Side)

```javascript
// Validate required fields based on RFQ type
function validateRFQForm(formData, rfqType) {
  const errors = [];
  
  // Common required fields
  if (!formData.projectTitle) errors.push('Project title required');
  if (!formData.projectSummary) errors.push('Project summary required');
  if (!formData.category) errors.push('Category required');
  if (!formData.county) errors.push('County required');
  
  // Shared fields (from form)
  if (!formData.town) errors.push('Town required');
  if (!formData.budgetMin || !formData.budgetMax) errors.push('Budget required');
  
  // Type-specific
  if (rfqType === 'direct' && (!formData.selectedVendors || formData.selectedVendors.length === 0)) {
    errors.push('Select at least one vendor');
  }
  
  // Template fields (category-specific)
  for (const field of templateFieldsMetadata) {
    if (field.required && !formData.templateFields[field.name]) {
      errors.push(`${field.label} is required`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// If invalid: highlight fields + show error toast + DON'T submit
// If valid: proceed to step 1
```

**Result**: Valid form data ready for submission, or error feedback to user

---

### 1) Authentication Gate

```javascript
async function handleRFQSubmit(formData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Show auth modal (Sign In / Create Account)
    showAuthModal();
    // After auth succeeds, continue submission with form data intact
    // (NO data loss - form data preserved)
    return;
  }
  
  // User is authenticated, continue to verification
  await verificationGate(user, formData);
}
```

**Result**: User is authenticated (signed in or just created account)

---

### 2) Verification Gate

```javascript
async function verificationGate(user, formData) {
  // Check if phone and email are verified
  if (!user.phone_verified || !user.email_verified) {
    // Show verification modal with steps:
    // - Verify email (if not verified)
    // - Verify phone via OTP (if not verified)
    showVerificationModal(user.phone_verified, user.email_verified);
    
    // After verification succeeds, continue submission
    return;
  }
  
  // All verified, continue to eligibility check
  await eligibilityCheck(user.id, formData);
}
```

**Result**: User is verified (email + phone)

---

### 3) Eligibility Check + Payment Gate

```javascript
async function eligibilityCheck(userId, formData) {
  // Disable submit button + show "Checking eligibility..."
  setIsSubmitting(true);
  
  try {
    const response = await fetch('/api/rfq/check-eligibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        rfq_type: formData.rfqType
      })
    });
    
    const eligibility = await response.json();
    
    if (!eligibility.eligible) {
      showError('You are not eligible to submit RFQs at this time');
      return;
    }
    
    // Check if payment required
    if (eligibility.requires_payment) {
      // Show payment modal (M-Pesa, card, etc.)
      const paymentSuccess = await showPaymentModal({
        amount: eligibility.amount, // KES 300
        description: 'RFQ submission'
      });
      
      if (!paymentSuccess) {
        // User cancelled/failed payment
        showToast('Payment cancelled. Draft saved.');
        return;
      }
    }
    
    // Ready to submit
    await finalSubmit(userId, formData);
    
  } finally {
    setIsSubmitting(false);
  }
}

// API Response format:
// {
//   eligible: true/false,
//   remaining_free: 2,
//   requires_payment: false/true,
//   amount: 300,
//   message: "You have 2 free RFQs remaining this month"
// }
```

**Result**: Payment handled (if needed), ready to create RFQ

---

### 4) Final Submit

```javascript
async function finalSubmit(userId, formData) {
  setIsSubmitting(true);
  
  try {
    const response = await fetch('/api/rfq/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rfqType: formData.rfqType,
        categorySlug: formData.selectedCategory,
        jobTypeSlug: formData.selectedJobType,
        templateFields: formData.templateFields,
        sharedFields: {
          projectTitle: formData.projectTitle,
          projectSummary: formData.projectSummary,
          county: formData.county,
          town: formData.town,
          budgetMin: formData.budgetMin,
          budgetMax: formData.budgetMax,
          directions: formData.directions,
          desiredStartDate: formData.desiredStartDate
        },
        selectedVendors: formData.selectedVendors || [], // For Direct RFQ
        userId: userId,
        visibilityScope: formData.visibilityScope // For Public RFQ (county-only or nationwide)
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      showErrorToast(result.error || 'Failed to submit RFQ');
      return;
    }
    
    // Success!
    clearDraft(); // Clear localStorage
    showSuccessToast('RFQ submitted and sent to vendors ✅');
    
    // Redirect to RFQ detail page
    router.push(`/rfq/${result.rfqId}`);
    
  } catch (err) {
    showErrorToast('Network error. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
}
```

**Result**: RFQ created, user redirected to detail page

---

## Backend Flow

### A) Check Eligibility Endpoint

**Endpoint**: `POST /api/rfq/check-eligibility`

**Request**:
```javascript
{
  user_id: "uuid",
  rfq_type: "direct" | "wizard" | "public"
}
```

**Implementation**:
```javascript
export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, rfq_type } = body;
    
    // 1. Auth check
    if (!user_id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // 2. Verification check
    const { data: user } = await supabase
      .from('users')
      .select('phone_verified, email_verified')
      .eq('id', user_id)
      .single();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!user.phone_verified || !user.email_verified) {
      return NextResponse.json({
        eligible: false,
        reason: 'Must verify phone and email',
        phone_verified: user.phone_verified,
        email_verified: user.email_verified
      }, { status: 200 });
    }
    
    // 3. Count RFQs this month (only "submitted" status)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const { count: rfqCount } = await supabase
      .from('rfqs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('status', 'submitted')
      .gte('created_at', thisMonth.toISOString());
    
    const FREE_RFQ_LIMIT = 3;
    const EXTRA_RFQ_COST = 300; // KES
    
    // 4. Determine eligibility
    const remaining_free = Math.max(0, FREE_RFQ_LIMIT - (rfqCount || 0));
    const requires_payment = remaining_free === 0;
    
    return NextResponse.json({
      eligible: true,
      remaining_free,
      requires_payment,
      amount: requires_payment ? EXTRA_RFQ_COST : 0,
      message: remaining_free > 0 
        ? `You have ${remaining_free} free RFQs remaining this month`
        : 'You have used your free RFQs. Each additional RFQ costs KES 300.'
    }, { status: 200 });
    
  } catch (err) {
    console.error('[CHECK-ELIGIBILITY] Error:', err);
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    );
  }
}
```

**Response**:
```javascript
{
  // Success
  eligible: true,
  remaining_free: 2,
  requires_payment: false,
  amount: 0,
  message: "You have 2 free RFQs remaining this month"
}

// OR if over limit
{
  eligible: true,
  remaining_free: 0,
  requires_payment: true,
  amount: 300,
  message: "You have used your free RFQs. Each additional RFQ costs KES 300."
}

// OR if not verified
{
  eligible: false,
  reason: "Must verify phone and email",
  phone_verified: false,
  email_verified: true
}
```

---

### B) Create RFQ Endpoint

**Endpoint**: `POST /api/rfq/create`

**Request**:
```javascript
{
  rfqType: "direct" | "wizard" | "public",
  categorySlug: "roofing",
  jobTypeSlug: "repairs",
  templateFields: { /* category-specific data */ },
  sharedFields: {
    projectTitle: "Fix roof leak",
    projectSummary: "Water leaking through ceiling",
    county: "Nairobi",
    town: "Ruiru",
    budgetMin: 10000,
    budgetMax: 50000,
    directions: "Off Thika Road",
    desiredStartDate: "2026-01-15"
  },
  selectedVendors: ["vendor-id-1", "vendor-id-2"], // For Direct RFQ
  visibilityScope: "county" | "nationwide", // For Public RFQ
  userId: "user-id",
  paymentReceiptId: "receipt-id" // If payment was made
}
```

**Implementation**:
```javascript
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      rfqType,
      categorySlug,
      jobTypeSlug,
      templateFields = {},
      sharedFields = {},
      selectedVendors = [],
      userId,
      visibilityScope = 'county'
    } = body;
    
    // ============================================================================
    // 1. AUTH CHECK
    // ============================================================================
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // ============================================================================
    // 2. VERIFICATION CHECK
    // ============================================================================
    const { data: user } = await supabase
      .from('users')
      .select('phone_verified, email_verified')
      .eq('id', userId)
      .single();
    
    if (!user || !user.phone_verified || !user.email_verified) {
      return NextResponse.json(
        { error: 'User must be verified' },
        { status: 403 }
      );
    }
    
    // ============================================================================
    // 3. RE-CHECK USAGE LIMIT (server-side, never trust frontend)
    // ============================================================================
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const { count: rfqCount } = await supabase
      .from('rfqs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'submitted')
      .gte('created_at', thisMonth.toISOString());
    
    const FREE_LIMIT = 3;
    if (rfqCount >= FREE_LIMIT) {
      // Over free limit - require payment
      // TODO: Verify payment receipt exists and is unused
      return NextResponse.json(
        { error: 'Payment required for additional RFQs' },
        { status: 402 }
      );
    }
    
    // ============================================================================
    // 4. VALIDATE PAYLOAD
    // ============================================================================
    if (!rfqType || !['direct', 'wizard', 'public'].includes(rfqType)) {
      return NextResponse.json({ error: 'Invalid RFQ type' }, { status: 400 });
    }
    
    if (!categorySlug) {
      return NextResponse.json({ error: 'Category required' }, { status: 400 });
    }
    
    if (!sharedFields.projectTitle || !sharedFields.projectSummary) {
      return NextResponse.json({ error: 'Title and summary required' }, { status: 400 });
    }
    
    if (!sharedFields.county) {
      return NextResponse.json({ error: 'County required' }, { status: 400 });
    }
    
    // Direct RFQ requires vendors
    if (rfqType === 'direct' && (!selectedVendors || selectedVendors.length === 0)) {
      return NextResponse.json({ error: 'Select at least one vendor' }, { status: 400 });
    }
    
    // Sanitize content (strip scripts, etc.)
    const sanitizedTitle = sanitizeInput(sharedFields.projectTitle);
    const sanitizedSummary = sanitizeInput(sharedFields.projectSummary);
    
    // ============================================================================
    // 5. CREATE RFQ RECORD
    // ============================================================================
    const { data: createdRfq, error: rfqError } = await supabase
      .from('rfqs')
      .insert([{
        user_id: userId,
        type: rfqType,
        category: categorySlug,
        title: sanitizedTitle,
        description: sanitizedSummary,
        location: sharedFields.town || null,
        county: sharedFields.county,
        budget_estimate: sharedFields.budgetMin && sharedFields.budgetMax
          ? `${sharedFields.budgetMin} - ${sharedFields.budgetMax}`
          : null,
        status: 'submitted',
        visibility: rfqType === 'public' ? 'public' : 'private',
        template_data: templateFields, // Store category-specific data as JSON
        shared_data: sharedFields, // Store shared data as JSON
        assigned_vendor_id: null,
        urgency: 'normal',
        is_paid: rfqCount >= (FREE_LIMIT - 1) // Mark as paid if over free limit
      }])
      .select('id, title, type, status')
      .single();
    
    if (rfqError) {
      console.error('[CREATE-RFQ] Database error:', rfqError);
      return NextResponse.json(
        { error: 'Failed to create RFQ', details: rfqError.message },
        { status: 500 }
      );
    }
    
    const rfqId = createdRfq.id;
    
    // ============================================================================
    // 6. CREATE RECIPIENT ROWS (type-specific)
    // ============================================================================
    
    if (rfqType === 'direct') {
      // Direct RFQ: Notify selected vendors only
      const recipientRecords = selectedVendors.map(vendorId => ({
        rfq_id: rfqId,
        vendor_id: vendorId,
        recipient_type: 'direct',
        status: 'sent'
      }));
      
      const { error: recipientError } = await supabase
        .from('rfq_recipients')
        .insert(recipientRecords);
      
      if (recipientError) {
        console.error('[CREATE-RFQ] Recipient error:', recipientError);
        // Non-critical - continue
      }
    } 
    else if (rfqType === 'wizard') {
      // Wizard RFQ: Auto-match vendors
      await autoMatchVendors(rfqId, categorySlug, sharedFields.county);
    }
    else if (rfqType === 'public') {
      // Public RFQ: Notify top-ranked vendors (no user selection)
      // Option A: Notify limited set to avoid spam
      const topVendors = await getTopVendorsForCategory(categorySlug, sharedFields.county, 20);
      
      const recipientRecords = topVendors.map(vendor => ({
        rfq_id: rfqId,
        vendor_id: vendor.id,
        recipient_type: 'public',
        status: 'sent'
      }));
      
      const { error: recipientError } = await supabase
        .from('rfq_recipients')
        .insert(recipientRecords);
      
      if (recipientError) {
        console.error('[CREATE-RFQ] Recipient error:', recipientError);
        // Non-critical - continue
      }
    }
    
    // ============================================================================
    // 7. INCREMENT USAGE COUNTER
    // ============================================================================
    // TODO: Update rfq_usage table or similar
    
    // ============================================================================
    // 8. TRIGGER NOTIFICATIONS (async)
    // ============================================================================
    // Send notifications to vendors (async, non-blocking)
    triggerNotifications(rfqId, rfqType).catch(err => {
      console.error('[CREATE-RFQ] Notification error:', err);
    });
    
    // ============================================================================
    // 9. RETURN SUCCESS
    // ============================================================================
    return NextResponse.json({
      success: true,
      rfqId: rfqId,
      rfqTitle: createdRfq.title,
      message: `RFQ submitted successfully! (${rfqType} type)`,
      redirectUrl: `/rfq/${rfqId}`
    }, { status: 201 });
    
  } catch (err) {
    console.error('[CREATE-RFQ] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    );
  }
}

// Helper: Auto-match vendors for Wizard RFQ
async function autoMatchVendors(rfqId, categorySlug, county) {
  const { data: candidates, error } = await supabase
    .from('vendors')
    .select('id, primary_category, secondary_categories, rating, verified_docs, response_rate, county, subscription_active')
    .or(`primary_category.eq.${categorySlug},secondary_categories.contains.[${categorySlug}]`)
    .eq('subscription_active', true)
    .eq('county', county || null)
    .order('rating', { ascending: false })
    .order('response_rate', { ascending: false })
    .limit(5); // Top 5-10 vendors
  
  if (!candidates) return;
  
  const recipientRecords = candidates.map(vendor => ({
    rfq_id: rfqId,
    vendor_id: vendor.id,
    recipient_type: 'wizard',
    status: 'sent'
  }));
  
  await supabase.from('rfq_recipients').insert(recipientRecords);
}

// Helper: Get top vendors for Public RFQ
async function getTopVendorsForCategory(categorySlug, county, limit) {
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, primary_category, secondary_categories, rating, verified_docs, subscription_active')
    .or(`primary_category.eq.${categorySlug},secondary_categories.contains.[${categorySlug}]`)
    .eq('subscription_active', true)
    .order('rating', { ascending: false })
    .order('verified_docs', { ascending: false })
    .limit(limit);
  
  return vendors || [];
}

// Helper: Trigger async notifications
async function triggerNotifications(rfqId, rfqType) {
  // Send to vendors (in-app + email)
  // Send to user confirmation (in-app + email)
  // TODO: Implement notification system
}
```

---

## RFQ Type Differences

### Direct RFQ

**Frontend**:
- User selects 1+ vendors before submit
- Form includes vendor selection step

**Backend**:
- Validate selected vendors exist + are active
- Create rfq_recipients rows with recipient_type='direct'
- Send notifications only to selected vendors

**Result**: Sent to chosen vendors only

---

### Wizard RFQ

**Frontend**:
- Wizard flow (category → details → review)
- Optional: "How many vendors?" + "Filter by county?"
- Ends with "We'll send to best matches"

**Backend**:
- Auto-match vendors based on:
  - Primary category match
  - Secondary categories contain category
  - County filter (if provided)
  - Subscription active
  - Sort by: rating, response_rate, verified_docs
  - Pick top 5-10
- Create rfq_recipients with recipient_type='wizard'
- Send notifications to matched vendors

**Result**: Sent to best-matched vendors (no admin involved)

---

### Public RFQ

**Frontend**:
- User selects category + details
- No vendor selection
- Optional visibility settings (county-only vs nationwide)

**Backend**:
- Create RFQ with visibility='public'
- Notify top 20-30 vendors to avoid spam
- Still discoverable by all vendors in category
- Allows vendors to respond to public RFQ feed

**Result**: Visible to many, but notifications go to top vendors

---

## UX: What User Sees After Submit

### Success State
```
RFQ submitted ✅

Status Tracker:
├ Sent to vendors ✅
├ Viewed by vendors [Waiting...]
└ Quotes received [Waiting...]

Manage RFQ:
├ Edit (within 30 mins or before first quote)
├ Close RFQ
├ Extend deadline
└ Upgrade (send to more vendors)
```

### RFQ Detail Page (/rfq/:id)
```
Project: "Fix roof leak"
Category: Roofing & Waterproofing
Location: Ruiru, Nairobi
Budget: KES 10,000 - KES 50,000
Status: Sent to 3 vendors

Timeline:
├ Sent on: Jan 6, 2026
├ Deadline: Jan 13, 2026
└ Quotes received: 0

Attachments: [2 files]

Action buttons:
├ Close RFQ
├ Edit
└ Send to more vendors
```

---

## UX: What Vendor Sees After Submission

### Notification
```
🔔 New RFQ: Roofing & Waterproofing — Ruiru
   John D. needs help with roof repair
   Budget: KES 10,000 - KES 50,000
   [View & Quote]
```

### RFQ Details Page (Vendor View)
```
Project: "Fix roof leak"
Summary: "Water leaking through ceiling"
Category: Roofing & Waterproofing
Location: Ruiru, Nairobi
County: Nairobi
Budget: KES 10,000 - KES 50,000
Desired start: Jan 15, 2026

Attachments: [2 files]
Template data: [roofing-specific fields]

Action buttons:
├ [Submit Quote]
├ [Ask a Question]
└ [Save]

Chat thread: (linked to RFQ)
```

---

## Database Tables Affected

### 1. rfqs
```sql
INSERT INTO rfqs (
  user_id,
  type,
  category,
  title,
  description,
  location,
  county,
  budget_estimate,
  status,
  visibility,
  template_data,
  shared_data,
  is_paid
) VALUES (...)
```

### 2. rfq_recipients
```sql
INSERT INTO rfq_recipients (
  rfq_id,
  vendor_id,
  recipient_type, -- 'direct' | 'wizard' | 'public'
  status -- 'sent'
) VALUES (...)
```

### 3. rfq_usage (or users_rfq_quota)
```sql
UPDATE users_rfq_quota 
SET monthly_rfqs_used = monthly_rfqs_used + 1
WHERE user_id = ? AND month = ?
```

### 4. rfq_payments (if paid)
```sql
INSERT INTO rfq_payments (
  user_id,
  rfq_id,
  amount,
  currency,
  payment_method,
  status
) VALUES (...)
```

### 5. notifications
```sql
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  related_rfq_id
) VALUES (...)
```

---

## Security Considerations

1. **RLS Policies**: Ensure SERVICE_ROLE can insert (WITH CHECK clause)
2. **Input Sanitization**: Strip scripts, XSS attacks
3. **User Verification**: Must be email + phone verified
4. **Payment Validation**: Verify receipt before allowing RFQ
5. **Quota Enforcement**: Re-check server-side
6. **Vendor Validation**: Confirm vendors exist before assigning

---

## Summary

This flow ensures:
- ✅ Strong anti-spam (free limit + payment)
- ✅ Low admin involvement (auto-matching for Wizard)
- ✅ Clear user experience
- ✅ Multiple RFQ types support
- ✅ Server-side security
- ✅ Type-specific recipient matching
