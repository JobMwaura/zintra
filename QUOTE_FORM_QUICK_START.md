# Enhanced Quote Form - Implementation Quick Start

**Status:** 🚀 Ready to Build  
**Commit:** c00ac63  
**Estimated Time:** 3-4 hours for Phase 1-2

---

## 🎯 What's Working Now

✅ Submit Quote buttons navigate correctly to `/vendor/rfq/[rfq_id]/respond`  
✅ Basic form with: Price, Timeline, Description, Warranty, Payment Terms, File Upload  
✅ Form validation and API submission working  
✅ Success/error handling in place  

---

## 🛠️ Phase 1: Start Here - Database Schema Update

### Step 1: Create Migration SQL

Create file: `supabase/sql/ENHANCE_QUOTE_RESPONSES_SCHEMA.sql`

```sql
-- Add comprehensive fields to rfq_responses table for enhanced quote form

ALTER TABLE public.rfq_responses ADD COLUMN IF NOT EXISTS (
  -- Section 1: Quote Overview
  quote_title TEXT,
  intro_text TEXT,
  validity_days INTEGER DEFAULT 7,
  validity_custom_date DATE,
  earliest_start_date DATE,

  -- Section 2: Pricing & Breakdown
  pricing_model VARCHAR(20), -- 'fixed', 'range', 'per_unit', 'per_day'
  price_min DECIMAL(10, 2),
  price_max DECIMAL(10, 2),
  unit_type VARCHAR(50),
  unit_price DECIMAL(10, 2),
  estimated_units INTEGER,
  vat_included BOOLEAN DEFAULT false,
  line_items JSONB DEFAULT '[]', -- Array of {description, quantity, unit, unit_price}
  transport_cost DECIMAL(10, 2) DEFAULT 0,
  labour_cost DECIMAL(10, 2) DEFAULT 0,
  other_charges DECIMAL(10, 2) DEFAULT 0,
  vat_amount DECIMAL(10, 2) DEFAULT 0,
  total_price_calculated DECIMAL(10, 2),

  -- Section 3: Inclusions/Exclusions
  inclusions TEXT,
  exclusions TEXT,
  client_responsibilities TEXT,

  -- Section 4: Availability
  site_visit_required BOOLEAN DEFAULT false,
  site_visit_dates TEXT,
  estimated_work_duration TEXT,

  -- Section 5: Questions
  buyer_questions TEXT,

  -- Section 7: Internal
  internal_notes TEXT,

  -- Status tracking
  quote_status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected'
  submitted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rfq_responses_status 
  ON public.rfq_responses(rfq_id, quote_status);

CREATE INDEX IF NOT EXISTS idx_rfq_responses_submitted 
  ON public.rfq_responses(submitted_at DESC);
```

### Step 2: Execute in Supabase

1. Go to Supabase Dashboard → SQL Editor → New Query
2. Copy the SQL above
3. Click Run
4. Confirm success

---

## 🎨 Phase 2: Front-end - Enhanced Form Component

### Step 1: Create New Form Sections Component

Create file: `components/vendor/QuoteFormSections.js`

This component will contain:
- Section 1: Quote Overview
- Section 2: Pricing & Breakdown (with pricing model selector)
- Section 3: Inclusions/Exclusions

### Step 2: Update Respond Page

File: `app/vendor/rfq/[rfq_id]/respond/page.js`

Key changes:
1. Import new QuoteFormSections component
2. Expand formData state with new fields
3. Add form sections to step 1
4. Update validation logic
5. Update API payload on submission

---

## 💾 Key Form State (formData)

```javascript
const [formData, setFormData] = useState({
  // Current fields
  quoted_price: '',
  currency: 'KES',
  delivery_timeline: '',
  description: '',
  warranty: '',
  payment_terms: '',
  attachments: [],

  // NEW: Quote Overview
  quote_title: '',
  intro_text: '',
  validity_days: 7,
  validity_custom_date: '',
  earliest_start_date: '',

  // NEW: Pricing & Breakdown
  pricing_model: 'fixed', // 'fixed', 'range', 'per_unit', 'per_day'
  price_min: '',
  price_max: '',
  unit_type: '',
  unit_price: '',
  estimated_units: '',
  vat_included: false,
  line_items: [], // [{description, quantity, unit, unitPrice, lineTotal}]
  transport_cost: '',
  labour_cost: '',
  other_charges: '',

  // NEW: Inclusions/Exclusions
  inclusions: '',
  exclusions: '',
  client_responsibilities: '',

  // NEW: Availability
  site_visit_required: false,
  site_visit_dates: '',
  estimated_work_duration: '',

  // NEW: Questions
  buyer_questions: '',

  // NEW: Internal
  internal_notes: ''
});
```

---

## 🔧 Key Features to Implement

### 1. Pricing Model Selector
```javascript
<div>
  <label className="block text-sm font-semibold mb-3">Pricing Model</label>
  <div className="space-y-2">
    <Radio label="Fixed total price" value="fixed" />
    <Radio label="Price range" value="range" />
    <Radio label="Per unit / per item" value="per_unit" />
    <Radio label="Per day / hourly" value="per_day" />
  </div>
</div>

{/* Show different fields based on pricing_model */}
{formData.pricing_model === 'fixed' && (
  <>
    <PriceInput label="Total price" value={quoted_price} />
    <Toggle label="VAT included?" value={vat_included} />
  </>
)}

{formData.pricing_model === 'range' && (
  <>
    <PriceInput label="Minimum price" value={price_min} />
    <PriceInput label="Maximum price" value={price_max} />
    <Toggle label="VAT included?" value={vat_included} />
  </>
)}

{formData.pricing_model === 'per_unit' && (
  <>
    <TextInput label="Unit type (e.g. per metre)" value={unit_type} />
    <PriceInput label="Unit price (KES)" value={unit_price} />
    <NumberInput label="Estimated units" value={estimated_units} />
    {/* Auto-calculate: unit_price * estimated_units */}
  </>
)}

{formData.pricing_model === 'per_day' && (
  <>
    <PriceInput label="Daily rate (KES)" value={unit_price} />
    <NumberInput label="Estimated days" value={estimated_units} />
    {/* Auto-calculate: unit_price * estimated_units */}
  </>
)}
```

### 2. Line-Item Breakdown Table
```javascript
<div className="space-y-3">
  <h4 className="font-semibold">Item Breakdown (optional)</h4>
  
  <table className="w-full border-collapse">
    <thead>
      <tr className="border-b-2">
        <th>Description</th>
        <th>Qty</th>
        <th>Unit</th>
        <th>Unit Price (KES)</th>
        <th>Line Total</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {formData.line_items.map((item, idx) => (
        <tr key={idx} className="border-b">
          <td><TextInput value={item.description} /></td>
          <td><NumberInput value={item.quantity} /></td>
          <td><TextInput value={item.unit} /></td>
          <td><NumberInput value={item.unitPrice} /></td>
          <td className="font-semibold">{item.quantity * item.unitPrice}</td>
          <td>
            <button onClick={() => removeLineItem(idx)}>×</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  <button onClick={addLineItem} className="text-blue-600 font-semibold">
    + Add item
  </button>

  <div className="space-y-2 text-right">
    <p>Subtotal: {calculateSubtotal()} KES</p>
    <p>Transport: {transport_cost} KES</p>
    <p>Labour: {labour_cost} KES</p>
    <p>Other: {other_charges} KES</p>
    <p className="font-bold text-lg">Total: {calculateTotal()} KES</p>
  </div>
</div>
```

### 3. Inclusions/Exclusions Section
```javascript
<div className="space-y-4">
  <div>
    <label className="block text-sm font-semibold mb-2">
      What is included in this quote?
    </label>
    <textarea
      value={formData.inclusions}
      onChange={(e) => updateFormData('inclusions', e.target.value)}
      placeholder="E.g. Router supply, internal cabling up to 10 points, configuration, 7-day support..."
      rows={4}
      className="w-full px-4 py-2 border rounded-lg"
    />
  </div>

  <div>
    <label className="block text-sm font-semibold mb-2">
      What is NOT included? (Exclusions & assumptions)
    </label>
    <textarea
      value={formData.exclusions}
      onChange={(e) => updateFormData('exclusions', e.target.value)}
      placeholder="E.g. ISP monthly fees, additional trunking beyond 50m, civil works..."
      rows={4}
      className="w-full px-4 py-2 border rounded-lg"
    />
  </div>

  <div>
    <label className="block text-sm font-semibold mb-2">
      Client Responsibilities / Dependencies
    </label>
    <textarea
      value={formData.client_responsibilities}
      onChange={(e) => updateFormData('client_responsibilities', e.target.value)}
      placeholder="E.g. Client to provide power points, secure location, site access 8am-5pm..."
      rows={4}
      className="w-full px-4 py-2 border rounded-lg"
    />
  </div>
</div>
```

---

## 📝 API Endpoint Update

File: `app/api/rfq/[rfq_id]/response/route.js`

Update to handle new fields:

```javascript
const { data, error } = await supabase
  .from('rfq_responses')
  .insert({
    rfq_id: rfqId,
    vendor_id: vendorProfile.id,
    user_id: session.user.id,
    
    // Current fields
    quoted_price: formData.quoted_price,
    currency: formData.currency,
    delivery_timeline: formData.delivery_timeline,
    description: formData.description,
    warranty: formData.warranty,
    payment_terms: formData.payment_terms,

    // NEW fields
    quote_title: formData.quote_title,
    intro_text: formData.intro_text,
    validity_days: formData.validity_days,
    validity_custom_date: formData.validity_custom_date,
    earliest_start_date: formData.earliest_start_date,
    pricing_model: formData.pricing_model,
    price_min: formData.price_min,
    price_max: formData.price_max,
    unit_type: formData.unit_type,
    unit_price: formData.unit_price,
    estimated_units: formData.estimated_units,
    vat_included: formData.vat_included,
    line_items: formData.line_items,
    transport_cost: formData.transport_cost,
    labour_cost: formData.labour_cost,
    other_charges: formData.other_charges,
    inclusions: formData.inclusions,
    exclusions: formData.exclusions,
    client_responsibilities: formData.client_responsibilities,
    site_visit_required: formData.site_visit_required,
    site_visit_dates: formData.site_visit_dates,
    estimated_work_duration: formData.estimated_work_duration,
    buyer_questions: formData.buyer_questions,
    internal_notes: formData.internal_notes,
    quote_status: 'sent',
    submitted_at: new Date().toISOString()
  });
```

---

## ✅ Implementation Checklist

### Database (1 hour)
- [ ] Create migration SQL
- [ ] Run in Supabase
- [ ] Verify columns created

### Form UI - Phase 2A (2 hours)
- [ ] Create QuoteFormSections component
- [ ] Add Quote Overview section
- [ ] Add Pricing Model selector
- [ ] Add pricing conditional fields
- [ ] Add line-item table

### Form UI - Phase 2B (1.5 hours)
- [ ] Add Inclusions/Exclusions section
- [ ] Add Availability section
- [ ] Add Questions section
- [ ] Add Internal Notes section
- [ ] Update respond page to include new sections

### Features (1 hour)
- [ ] Update form validation
- [ ] Update API endpoint
- [ ] Test form submission
- [ ] Test preview mode
- [ ] Test success screen

### Polish (0.5 hours)
- [ ] Mobile responsive
- [ ] Error handling
- [ ] Loading states
- [ ] Success notifications

---

## 🚀 Start Building

1. **First:** Run database migration (Supabase)
2. **Then:** Create QuoteFormSections component
3. **Then:** Update respond/page.js to use new sections
4. **Finally:** Test end-to-end submission

This modular approach lets you test each section as you build.

---

**Good luck! Let me know if you need help with any specific section.** 🎉
