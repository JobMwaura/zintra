# 📋 PHASE 9: NEGOTIATION & QUOTE RESPONSE SYSTEM - IMPLEMENTATION GUIDE

**Date**: January 6, 2026  
**Status**: Phase 8 Complete ✅ → Phase 9 Starting 🚀  
**Scope**: Build complete quote response system for vendors responding to RFQs

---

## 📊 ARCHITECTURE OVERVIEW

### New Database Tables
1. **rfq_quotes** - Structured quote data from vendors
2. **rfq_messages** - Q&A thread between vendor and buyer

### New Pages
1. **Vendor Respond to RFQ** - `/rfq/[rfq_id]/respond` (VendorRFQResponseForm)
2. **Buyer Review Quotes** - `/rfq/[rfq_id]/quotes` (BuyerQuoteReview)
3. **Quote Thread/Messages** - `/rfq/[rfq_id]/messages` (RFQMessaging)

### New API Routes
1. **POST `/app/api/rfq/[rfq_id]/quote/submit`** - Vendor submits quote
2. **GET `/app/api/rfq/[rfq_id]/quote/draft`** - Vendor gets their draft
3. **POST `/app/api/rfq/[rfq_id]/message`** - Send message in thread
4. **PUT `/app/api/rfq/[rfq_id]/quote/[quote_id]`** - Buyer accepts/rejects quote

---

## 🎯 STEP 1: Deploy Database Schema

**File**: `supabase/sql/PHASE_9_NEGOTIATION_SCHEMA.sql`

**What it does**:
- ✅ Creates `rfq_quotes` table with 40+ structured fields
- ✅ Creates `rfq_messages` table for Q&A
- ✅ Sets up RLS policies for both tables
- ✅ Creates validation trigger for quote submission

**Deploy**:
```bash
# Copy entire file into Supabase SQL Editor and run
# Expected: Tables created, RLS enabled, indexes created
# Runtime: ~5-10 seconds
```

**Verification query** (run after to confirm):
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('rfq_quotes', 'rfq_messages');
```

---

## 🎨 STEP 2: Build VendorRFQResponseForm Component

**Location**: `/components/VendorRFQResponseForm.js`  
**Current Status**: Exists but outdated (simple form)  
**Action**: Rebuild with 9 accordion sections

### Architecture (Hooks + Context)

```javascript
// VendorRFQResponseForm.js
const VendorRFQResponseForm = ({ rfqId, vendorId }) => {
  const [formData, setFormData] = useState({
    // Quote Basics
    amount_total: '',
    quote_type: 'labour_materials',
    pricing_mode: 'firm',
    price_confidence: 'firm',
    valid_until: '', // date + 7/14/30 days
    
    // Cost Breakdown
    cost_breakdown_type: 'simple', // toggle to line_items
    cost_breakdown_json: { labour: '', materials: '', transport: '', other: '', notes: '' },
    line_items_json: [],
    
    // Site Visit
    site_visit_required: false,
    site_visit_pricing_type: 'free',
    site_visit_fee: '',
    site_visit_date_earliest: '',
    site_visit_date_latest: '',
    site_visit_covers: [],
    estimation_basis: '',
    
    // Timeline & Availability
    earliest_start_date: '',
    duration_value: '',
    duration_unit: 'days',
    team_availability: 'available_now',
    team_availability_date: '',
    working_hours_preference: 'flexible',
    
    // Materials & Standards
    materials_supplied_by: 'vendor_supplies',
    preferred_brands_specs: '',
    compliance_standards: [],
    
    // Payment & Terms
    payment_model: 'deposit_balance',
    deposit_percent: 20,
    payment_milestones: [],
    payment_inclusions: [],
    payment_exclusions: '',
    
    // Warranty & Aftercare
    warranty_offered: false,
    warranty_duration: '',
    warranty_covers: [],
    
    // Attachments
    attachments_json: [],
  });

  const [activeSection, setActiveSection] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraft, setIsDraft] = useState(true);

  // Load draft if exists
  useEffect(() => {
    loadDraft();
  }, [rfqId, vendorId]);

  const loadDraft = async () => {
    const res = await fetch(`/app/api/rfq/${rfqId}/quote/draft`);
    if (res.ok) {
      const quote = await res.json();
      setFormData(quote);
      setIsDraft(true);
    }
  };

  const saveDraft = async () => {
    setIsSaving(true);
    try {
      await fetch(`/app/api/rfq/${rfqId}/quote/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: 'draft' }),
      });
      // Show "Saved" toast
    } finally {
      setIsSaving(false);
    }
  };

  const submitQuote = async () => {
    // Validate required fields
    if (!formData.amount_total || !formData.earliest_start_date || !formData.payment_model) {
      alert('Please fill in required fields: Amount, Start Date, Payment Model');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/app/api/rfq/${rfqId}/quote/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: 'submitted' }),
      });

      if (res.ok) {
        alert('Quote submitted successfully!');
        // Redirect to vendor dashboard or RFQ detail
      } else {
        alert('Failed to submit quote');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="vendor-rfq-response">
      {/* Top bar - RFQ Summary + Action Buttons */}
      <RFQSummaryCard rfqId={rfqId} />
      
      <div className="response-buttons">
        <button onClick={() => openAskQuestion()}>Ask a Question</button>
        <button onClick={saveDraft} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <button onClick={submitQuote} disabled={isSaving} className="primary">
          {isSaving ? 'Submitting...' : 'Submit Quote'}
        </button>
      </div>

      {/* Accordion Sections */}
      <Accordion activeSection={activeSection} setActiveSection={setActiveSection}>
        {/* 1. Quote Basics */}
        <AccordionSection title="Quote Basics" section={0} required>
          <QuoteBasicsSection formData={formData} setFormData={setFormData} />
        </AccordionSection>

        {/* 2. Cost Breakdown */}
        <AccordionSection title="Cost Breakdown" section={1}>
          <CostBreakdownSection formData={formData} setFormData={setFormData} />
        </AccordionSection>

        {/* 3. Site Visit */}
        <AccordionSection title="Site Visit" section={2}>
          <SiteVisitSection formData={formData} setFormData={setFormData} />
        </AccordionSection>

        {/* 4. Timeline & Availability */}
        <AccordionSection title="Timeline & Availability" section={3} required>
          <TimelineSection formData={formData} setFormData={setFormData} />
        </AccordionSection>

        {/* 5. Materials & Standards */}
        <AccordionSection title="Materials & Standards" section={4}>
          <MaterialsSection formData={formData} setFormData={setFormData} />
        </AccordionSection>

        {/* 6. Payment & Terms */}
        <AccordionSection title="Payment & Terms" section={5} required>
          <PaymentSection formData={formData} setFormData={setFormData} />
        </AccordionSection>

        {/* 7. Warranty & Aftercare */}
        <AccordionSection title="Warranty & Aftercare" section={6}>
          <WarrantySection formData={formData} setFormData={setFormData} />
        </AccordionSection>

        {/* 8. Attachments & Portfolio */}
        <AccordionSection title="Attachments & Portfolio" section={7}>
          <AttachmentsSection formData={formData} setFormData={setFormData} />
        </AccordionSection>

        {/* 9. Questions to Buyer */}
        <AccordionSection title="Questions to Buyer (Optional)" section={8}>
          <QuestionsSection rfqId={rfqId} vendorId={vendorId} />
        </AccordionSection>
      </Accordion>
    </div>
  );
};

export default VendorRFQResponseForm;
```

### Section Components

#### 1. QuoteBasicsSection
- Total Quote Amount (number, required)
- Quote Type (dropdown: labour_only, materials_only, labour_materials, consultation_only)
- Pricing Mode (dropdown: firm, estimate, range)
- Price Confidence (dropdown)
- Validity of Quote (dropdown: 7/14/30 days)

#### 2. CostBreakdownSection
- Toggle: Simple vs Line Items
- **Simple**: Labour, Materials, Transport, Other + Notes textarea
- **Line Items**: Table with Item name, Unit, Qty, Unit price, Total (auto-calc) + "Add Line Item" button

#### 3. SiteVisitSection
- Site Visit Required? (yes/no toggle)
- If Yes:
  - Site Visit Pricing (free, charged_deductible, charged_nonrefundable)
  - Site Visit Fee (shown only if charged)
  - Available Dates (date picker min/max)
  - What It Covers (multi-select: measurements, condition_assessment, access_check, boq, design_advice)
- If No:
  - How Estimated? (based_on_rfq_only, based_on_drawings, similar_previous_project)

#### 4. TimelineSection
- Earliest Start Date (date picker)
- Estimated Duration (number + dropdown: days/weeks)
- Team Availability (available_now, available_soon, scheduled + date if scheduled)
- Working Hours Preference (weekdays, weekends, flexible)

#### 5. MaterialsSection
- Who Supplies Materials? (vendor_supplies, buyer_supplies, either)
- Preferred Brands/Specs (textarea)
- Compliance Standards (multi-select: kebs, epra, nca, warranty_backed)

#### 6. PaymentSection
- Payment Model (deposit_balance, milestone_payments, pay_on_delivery, pay_on_completion)
- Deposit % (0, 20, 30, 50) - shown only for deposit_balance
- Milestones (add rows for milestone_payments mode)
- Inclusions (multi-select: labour, materials, transport, installation, cleanup)
- Exclusions (textarea with hint: "e.g., permits, third-party work")

#### 7. WarrantySection
- Warranty Offered? (yes/no)
- If Yes:
  - Duration (1_month, 3_months, 6_months, 12_months, 24_months)
  - What It Covers (textarea or array)

#### 8. AttachmentsSection
- Upload quotation PDF
- Upload BOQ/breakdown doc
- Upload product datasheets
- Upload past work photos
- Portfolio links

#### 9. QuestionsSection
- Textarea for vendor to ask buyer questions
- Pre-filled suggestions: "Do you have drawings?", "Access for delivery truck?", "Preferred brands?"
- Button: "Send Question to Buyer"

---

## 🔌 STEP 3: Create API Route for Quote Submission

**Location**: `/app/api/rfq/[rfq_id]/quote/submit/route.js`

```javascript
// /app/api/rfq/[rfq_id]/quote/submit/route.js

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req, { params }) {
  const { rfq_id } = params;
  
  try {
    const body = await req.json();
    const { status, ...quoteData } = body;

    // Get authenticated user from request (from middleware)
    const userId = req.headers.get('x-user-id');
    
    // Get vendor_id for this user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404 }
      );
    }

    // Check if quote already exists (draft)
    const { data: existingQuote } = await supabase
      .from('rfq_quotes')
      .select('id')
      .eq('rfq_id', rfq_id)
      .eq('vendor_id', vendor.id)
      .eq('status', 'draft')
      .single();

    if (existingQuote) {
      // Update existing draft
      const { data: updatedQuote, error: updateError } = await supabase
        .from('rfq_quotes')
        .update({
          ...quoteData,
          status: status || 'draft',
          updated_at: new Date(),
        })
        .eq('id', existingQuote.id)
        .select();

      if (updateError) throw updateError;

      // If submitting (not just saving draft), send notification
      if (status === 'submitted') {
        await notifyBuyerNewQuote(rfq_id, vendor.id, updatedQuote[0]);
      }

      return NextResponse.json({ quote: updatedQuote[0] });
    } else {
      // Create new quote
      const { data: newQuote, error: createError } = await supabase
        .from('rfq_quotes')
        .insert({
          rfq_id,
          vendor_id: vendor.id,
          ...quoteData,
          status: status || 'draft',
        })
        .select();

      if (createError) throw createError;

      // If submitting, send notification
      if (status === 'submitted') {
        await notifyBuyerNewQuote(rfq_id, vendor.id, newQuote[0]);
      }

      return NextResponse.json({ quote: newQuote[0] });
    }
  } catch (error) {
    console.error('Quote submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quote' },
      { status: 500 }
    );
  }
}

async function notifyBuyerNewQuote(rfqId, vendorId, quote) {
  // Get RFQ details
  const { data: rfq } = await supabase
    .from('rfqs')
    .select('user_id, title')
    .eq('id', rfqId)
    .single();

  // Get vendor details
  const { data: vendor } = await supabase
    .from('vendors')
    .select('company_name')
    .eq('id', vendorId)
    .single();

  // Send notification (integrate with your notification service)
  // e.g., email, push notification, in-app notification
  console.log(`Notification: New quote from ${vendor.company_name} for RFQ "${rfq.title}"`);
}
```

---

## 📊 STEP 4: Build Buyer Quote Review Page

**Location**: `/app/rfq/[rfq_id]/quotes/page.js`

**Features**:
- List all quotes for RFQ in cards
- Compare vendors side-by-side
- Accept/Reject buttons
- Message button to ask vendor questions
- Sorting/filtering by price, rating, timeline

---

## 💬 STEP 5: Build Messaging/Q&A Interface

**Location**: `/components/RFQMessaging.js`

**Features**:
- Thread view of messages between vendor and buyer
- Ability to attach files to messages
- Pre-formatted question suggestions
- Link messages to specific quote

---

## 📝 FORM VALIDATION CHECKLIST

**Required on Submit**:
- [ ] Total Quote Amount > 0
- [ ] Earliest Start Date set
- [ ] Payment Model selected
- [ ] Quote Type selected

**Conditional Required**:
- [ ] If pricing_mode = 'range': min and max set, min < max
- [ ] If site_visit_required = true and charged: fee > 0
- [ ] If team_availability = 'scheduled': date set

**On Save Draft**: All fields optional

---

## 🔒 SECURITY

**RLS Policies**:
- ✅ Vendors can only create/edit their own quotes
- ✅ Vendors can only see quotes they submitted
- ✅ Buyers can see all quotes for their RFQs
- ✅ Buyers cannot modify quote details (only status)
- ✅ Service role has full access (for backend operations)

**API Validation**:
- ✅ Verify user is authenticated
- ✅ Verify user is vendor (has vendor_id)
- ✅ Verify quote belongs to vendor (if updating)
- ✅ Prevent modifying submitted quotes (only revise)

---

## 📱 UX BEST PRACTICES

1. **Default Simple**: Start with simple cost breakdown, option to switch to line items
2. **Save Draft**: Auto-save draft every 30 seconds, manual save button
3. **Progress Indicator**: Show which sections are complete/incomplete
4. **Mobile Responsive**: Accordion sections work well on mobile
5. **Tooltips**: Explain complex fields (site visit pricing, payment milestones, etc.)
6. **Validation Messages**: Show inline error messages, not just alerts
7. **Disable Fields**: Disable fields that aren't relevant (e.g., site visit fee if free)

---

## 🚀 DEPLOYMENT ORDER

1. **Week 1**:
   - Deploy PHASE_9_NEGOTIATION_SCHEMA.sql
   - Build VendorRFQResponseForm (all sections)
   - Create POST /api/rfq/[rfq_id]/quote/submit endpoint

2. **Week 2**:
   - Build BuyerQuoteReview page
   - Integrate quote comparison
   - Build messaging interface

3. **Week 3**:
   - Testing and QA
   - Notifications for buyers when quotes arrive
   - Email templates for quote responses

---

## 📊 NEXT FEATURES (PHASE 10+)

- Vendor ratings/reviews after quote response
- Auto-matching quotes to RFQ requirements
- Price negotiation (buyer counter-offer)
- Quote expiry automation
- Quote analytics for vendors
- Integration with accounting/invoicing

---

**Status**: Ready to build 🚀
