# Comprehensive Quote Response Form - Enhancement Plan

**Status:** 🎯 Ready for Implementation  
**Date:** January 3, 2026  
**Scope:** Upgrade vendor quote submission form to professional enterprise standard

---

## 📋 Current State vs. Target

### Current Form (Basic)
- ✓ Quoted price
- ✓ Currency selection
- ✓ Delivery timeline
- ✓ Proposal description
- ✓ Warranty (optional)
- ✓ Payment terms (optional)
- ✓ File attachments (basic)
- ❌ No pricing breakdown
- ❌ No inclusions/exclusions
- ❌ No site visit info
- ❌ No questions for buyer
- ❌ No internal notes
- ❌ No draft save
- ❌ No preview

### Target Form (Enterprise)
- ✓ All current features
- ✨ Quote overview section
- ✨ Pricing model selector (Fixed/Range/Per unit/Per day)
- ✨ Line-item breakdown table
- ✨ Inclusions/Exclusions section
- ✨ Availability & Site visit section
- ✨ Questions for buyer
- ✨ Document upload (S3)
- ✨ Internal notes (vendor-only)
- ✨ Draft save functionality
- ✨ Preview as buyer sees it
- ✨ Post-submission confirmation

---

## 🏗️ Form Structure (8 Sections)

### **A. Header**
```
Title: "Submit Quote for [Project title]"
Subtitle: "Your quote will be sent to [Buyer Name] via Zintra. They can compare quotes from multiple vendors."
```

### **B. Section 1 – Quote Overview**
```
Fields:
- Quote title (text) – e.g. "Internet installation & Wi-Fi optimization – Ruiru"
- Brief introduction (textarea) – Greeting and intro
- Quote valid until (select) – 7/14/30 days or custom date
- Earliest date we can start (date) – Optional
```

### **C. Section 2 – Pricing & Breakdown**
```
Pricing Model Selection:
- ○ Fixed total price
- ○ Price range
- ○ Per unit / per item
- ○ Per day / hourly

Conditional fields based on selection:
- Fixed: Total price (KES), VAT included?
- Range: Min/Max prices, VAT included?
- Per unit: Unit type, Unit price, Estimated units (auto-calculate)
- Per day: Rate, Days/hours, VAT included?

Line-item breakdown table (optional):
- Columns: Item description | Quantity | Unit | Unit price | Line total
- Buttons: + Add item
- Shows: Subtotal, Additional costs (transport, labour, other)

Summary:
- Total before tax (KES)
- VAT (KES)
- Grand total (KES) – BOLD, LARGE
```

### **D. Section 3 – What's Included / Excluded**
```
- What is included (textarea)
- What is NOT included (textarea)
- Client responsibilities (textarea)
```

### **E. Section 4 – Availability & Site Visit**
```
- Do you require a site visit? (Yes/No)
- If Yes: Proposed visit dates & times (textarea)
- Estimated duration of work (text)
```

### **F. Section 5 – Questions for Buyer**
```
- Questions / clarifications (textarea)
- These appear in message thread + quote
```

### **G. Section 6 – Document Upload**
```
- Drag & drop area (Max 5 files, 10 MB each)
- Allowed: PDF, Images, Excel, Word
- Shows file list with remove option
- Uploaded to S3
```

### **H. Section 7 – Internal Note**
```
- Vendor-only note (not visible to buyer)
- For cost/margin notes, internal use
```

---

## 🔘 Buttons & Actions

### Step 1: Form Entry
- **Back to RFQ** (secondary) – Navigate back
- **Save draft** (secondary) – Save for later
- **Preview quote** (ghost) – See as buyer will see it
- **Next →** or **Send Quote** (primary) – Submit

### Step 2: Preview (read-only)
- **← Back to edit** – Go back to form
- **Send Quote** (primary) – Final submission
- **Cancel** – Go back to RFQ list

### Step 3: Confirmation
- Show "Quote sent successfully!"
- Summary card with:
  - Project title
  - RFQ ID
  - Total amount
  - Status: "Pending buyer review"
- Buttons:
  - **View this quote** – Go to quote detail page
  - **Back to RFQs** – Return to inbox
  - **Message buyer** – Send additional message

---

## 💾 Database Schema Updates

Add new fields to `quotes` or `rfq_responses` table:

```sql
ALTER TABLE rfq_responses ADD COLUMN IF NOT EXISTS (
  -- Section 1: Overview
  quote_title TEXT,
  intro_text TEXT,
  validity_days INTEGER DEFAULT 7,
  validity_custom_date DATE,
  earliest_start_date DATE,

  -- Section 2: Pricing
  pricing_model VARCHAR(20) -- 'fixed', 'range', 'per_unit', 'per_day'
  quoted_price DECIMAL(10, 2), -- Main price for fixed
  price_min DECIMAL(10, 2), -- For range
  price_max DECIMAL(10, 2), -- For range
  unit_type VARCHAR(50), -- For per unit (e.g. "per metre")
  unit_price DECIMAL(10, 2), -- For per unit
  estimated_units INTEGER, -- For per unit
  vat_included BOOLEAN DEFAULT false,
  line_items JSONB DEFAULT '[]', -- [{description, quantity, unit, unit_price, line_total}]
  transport_cost DECIMAL(10, 2),
  labour_cost DECIMAL(10, 2),
  other_charges DECIMAL(10, 2),
  vat_amount DECIMAL(10, 2),
  total_price DECIMAL(10, 2),

  -- Section 3: Inclusions/Exclusions
  inclusions TEXT,
  exclusions TEXT,
  client_responsibilities TEXT,

  -- Section 4: Availability
  site_visit_required BOOLEAN DEFAULT false,
  site_visit_dates TEXT,
  estimated_duration TEXT,

  -- Section 5: Questions
  buyer_questions TEXT,

  -- Section 7: Internal
  internal_notes TEXT,

  -- Status & Metadata
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected'
  submitted_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

---

## 🔄 Vendor Workflow

```
1. Click "Submit Quote" from RFQ Inbox/Details
   ↓
2. Load Respond Page with RFQ Summary
   ↓
3. Fill 7 sections of quote form
   ↓
4. Click "Preview Quote"
   ↓
5. Review as buyer will see it (read-only)
   ↓
6. Click "Send Quote"
   ↓
7. API saves quote + attachments to DB/S3
   ↓
8. Show Confirmation Screen
   ↓
9. Options: View quote, Back to RFQs, Message buyer
```

---

## 📊 Implementation Phases

### **Phase 1: Database & API** (1 hour)
- [ ] Update quotes/rfq_responses schema
- [ ] Create/update quote submission API endpoint
- [ ] Add draft save endpoint

### **Phase 2: Form UI – Sections 1-3** (3 hours)
- [ ] Add Quote Overview section
- [ ] Add Pricing Model selector with conditional fields
- [ ] Add Line-item breakdown table
- [ ] Add Inclusions/Exclusions section

### **Phase 3: Form UI – Sections 4-7** (2 hours)
- [ ] Add Availability & Site Visit section
- [ ] Add Questions for Buyer section
- [ ] Add Document Upload section
- [ ] Add Internal Notes section

### **Phase 4: Features** (2 hours)
- [ ] Implement draft save button
- [ ] Implement preview mode (read-only)
- [ ] Create confirmation screen
- [ ] Test form validation

### **Phase 5: Polish** (1 hour)
- [ ] Mobile responsive design
- [ ] Error handling & validation
- [ ] Loading states
- [ ] Success notifications

**Total Estimate:** ~9-10 hours

---

## 🚀 Benefits

1. **Professional appearance** – Enterprise-grade quote form
2. **Detailed pricing** – Line-item breakdown helps buyers compare
3. **Clear expectations** – Inclusions/exclusions reduce disputes
4. **Flexibility** – Multiple pricing models for different job types
5. **Completeness** – Vendor can provide comprehensive response
6. **Persistence** – Draft save allows step-by-step completion
7. **Transparency** – Preview shows exactly what buyer sees
8. **Communication** – Built-in questions clarify requirements

---

## ✅ Testing Checklist

- [ ] Form loads with correct RFQ details
- [ ] All sections visible and functional
- [ ] Pricing model selector works (shows/hides relevant fields)
- [ ] Line-item table add/remove rows works
- [ ] Auto-calculations (line totals, subtotal, total) work
- [ ] Draft save persists data correctly
- [ ] Preview shows read-only version correctly formatted
- [ ] File upload works (S3 integration)
- [ ] Quote submission creates record in DB
- [ ] Confirmation screen displays correctly
- [ ] All buttons navigate to correct pages
- [ ] Form validation catches missing required fields
- [ ] Mobile responsive on all screen sizes
- [ ] Error messages clear and helpful

---

## 📝 Success Metrics

- Vendors complete quote forms with 5+ sections of detail
- Average quote submission includes line-item breakdown
- Draft save used by 20%+ of vendors
- Quote completion rate increases from basic form
- Buyer satisfaction with quote detail improves
- Fewer follow-up questions needed from buyers

---

**Next Step:** Start with Phase 1 (Database Schema) and Phase 2 (Sections 1-3 UI)

