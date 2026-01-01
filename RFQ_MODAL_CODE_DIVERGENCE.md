# Unified RFQ Modal - Code Divergence Points

**Date:** January 1, 2026  
**Version:** 1.0  
**Focus:** How Direct, Wizard, and Public RFQ types diverge in code

---

## High-Level Principle

**One modal component, one entry point, 95% shared code.**

The three RFQ types diverge only in:
1. **Step 4: Recipients logic** (vendor selection strategy)
2. **Validation rules** (what's required varies by type)
3. **API payload** (different fields sent)
4. **Success messaging** (different copy)

Everything else (Steps 1-3, 5-7) is **identical**.

---

## 1. Entry Point - Same Modal, Different Props

### Current: Three Separate Pages
```
/app/post-rfq/direct/page.js       ← DirectRFQ page (569 lines)
/app/post-rfq/wizard/page.js       ← WizardRFQ page (similar)
/app/post-rfq/public/page.js       ← PublicRFQ page (similar)
```

### New: One Modal Triggered from Three Buttons
```
[Send Direct RFQ] button → RFQModal({ rfqType: 'direct' })
[Smart RFQ] button       → RFQModal({ rfqType: 'wizard' })
[Public RFQ] button      → RFQModal({ rfqType: 'public' })
```

**Usage Example:**
```javascript
// In any page component
const [showRFQModal, setShowRFQModal] = useState(false);

return (
  <>
    <button onClick={() => setShowRFQModal(true)}>Send Direct RFQ</button>
    
    <RFQModal
      rfqType="direct"
      isOpen={showRFQModal}
      onClose={() => setShowRFQModal(false)}
    />
  </>
);
```

---

## 2. Step-by-Step Divergence

### Steps 1-3: 100% Identical

**Step 1: Category & Job Type**
```javascript
// Identical for all three types
selectedCategory = user's choice
selectedJobType = user's choice
```

**Step 2: Template Questions**
```javascript
// Identical for all three types
templateFields = {
  field1: value1,
  field2: value2,
  ...
}
```

**Step 3: General Project Info**
```javascript
// Identical for all three types
projectTitle = "..."
projectSummary = "..."
county = "Nairobi"
town = "Westlands"
budgetMin = 100000
budgetMax = 500000
...
```

---

### Step 4: Recipients (Type-Specific)

#### 4A. Direct RFQ

**UI Logic:**
```javascript
// Show: Searchable vendor list with checkboxes
// Allow: User selects specific vendors (1-10)
// Store: selectedVendors = ['vendor_1', 'vendor_3', ...]

if (rfqType === 'direct') {
  return (
    <DirectRecipients
      vendors={allVendors}
      selectedVendors={formData.selectedVendors}
      onVendorToggle={(vendorId) => {
        setFormData(prev => ({
          ...prev,
          selectedVendors: prev.selectedVendors.includes(vendorId)
            ? prev.selectedVendors.filter(id => id !== vendorId)
            : [...prev.selectedVendors, vendorId]
        }))
      }}
    />
  );
}
```

**Validation:**
```javascript
const isDirectValid = formData.selectedVendors.length >= 1;
// User must select at least 1 vendor
```

**API Payload:**
```javascript
{
  rfqType: 'direct',
  // ... common fields ...
  selectedVendors: ['v1', 'v2', 'v3'],
}
```

---

#### 4B. Wizard RFQ

**Pre-filtering Logic:**
```javascript
// Behind the scenes, match vendors to category + location
const recommendedVendors = allVendors.filter(vendor =>
  vendor.categories.includes(formData.selectedCategory) &&
  (vendor.county === formData.county || 
   vendor.nearbyCounties.includes(formData.county))
);
```

**UI Logic:**
```javascript
if (rfqType === 'wizard') {
  return (
    <WizardRecipients
      recommendedVendors={recommendedVendors}
      selectedVendors={formData.selectedVendors}
      allowOtherVendors={formData.allowOtherVendors}
      onVendorToggle={(vendorId) => {
        // Same as Direct
      }}
      onAllowOthersChange={(allow) => {
        setFormData(prev => ({
          ...prev,
          allowOtherVendors: allow
        }))
      }}
    />
  );
}
```

**Suggested Vendors Pre-Checked:**
```javascript
// In Wizard recipients list, vendor cards start with checkbox checked
// User can uncheck if they don't want that vendor
// But they can keep "Allow others" on to get more responses
```

**Validation:**
```javascript
const isWizardValid = 
  formData.selectedVendors.length >= 1 || 
  formData.allowOtherVendors === true;
// User must select vendors OR allow others to respond
```

**API Payload:**
```javascript
{
  rfqType: 'wizard',
  // ... common fields ...
  selectedVendors: ['v1', 'v2'],        // subset of recommended
  allowOtherVendors: true,              // allow others too
}
```

---

#### 4C. Public RFQ

**No Vendor Selection:**
```javascript
// No vendor filtering or selection needed
// This is an open posting

if (rfqType === 'public') {
  return (
    <PublicRecipients
      visibilityScope={formData.visibilityScope}
      responseLimit={formData.responseLimit}
      onVisibilityScopeChange={(scope) => {
        setFormData(prev => ({
          ...prev,
          visibilityScope: scope
        }))
      }}
      onResponseLimitChange={(limit) => {
        setFormData(prev => ({
          ...prev,
          responseLimit: limit
        }))
      }}
      county={formData.county}
      category={formData.selectedCategory}
    />
  );
}
```

**UI Settings:**
```javascript
// Visibility scope options:
// - "category" (default)
// - "category_nearby"

// Response limit options:
// - 5 (default)
// - 10
// - 999 (no limit)
```

**Validation:**
```javascript
const isPublicValid = 
  formData.visibilityScope && 
  formData.responseLimit;
// Just validate settings are set
```

**API Payload:**
```javascript
{
  rfqType: 'public',
  // ... common fields ...
  visibilityScope: 'category_nearby',
  responseLimit: 5,
  selectedVendors: [],  // Empty for public
}
```

---

### Step 5: Auth (Type-Specific Only in Details)

```javascript
// All three types go through same auth flow
// But logic differs slightly:

if (rfqType === 'direct') {
  // "Your Direct RFQ will be sent to X vendors"
  // Emphasize direct control
}

if (rfqType === 'wizard') {
  // "Your RFQ will be matched to suggested vendors"
  // Emphasize matching
}

if (rfqType === 'public') {
  // "Your RFQ will be posted for all vendors to see"
  // Emphasize visibility
}

// Messaging changes, flow is same
```

---

### Step 6: Review (Slightly Divergent)

**Left Column (Project Summary):** 100% identical for all three

**Right Column (Recipients):** Varies by type

```javascript
// Direct
<div>
  <h3>Recipients (3 vendors)</h3>
  <ul>
    <li>Vendor A</li>
    <li>Vendor B</li>
    <li>Vendor C</li>
  </ul>
  <p>These vendors will be notified directly.</p>
</div>

// Wizard
<div>
  <h3>Recipients (Matched + Open)</h3>
  <p>Recommended: Vendor A, Vendor B</p>
  <p>✓ Open to other vendors in this category</p>
  <p>Matching vendors will be notified.</p>
</div>

// Public
<div>
  <h3>Recipients (Public)</h3>
  <p>Scope: Roofing & Waterproofing</p>
  <p>Location: Nairobi, Kiambu</p>
  <p>Response limit: 5 vendors</p>
  <p>Your RFQ will be publicly visible.</p>
</div>
```

---

### Step 7: Success (Divergent Messaging)

```javascript
// Direct
<SuccessMessage title="✓ RFQ Sent!">
  Your RFQ has been sent to 3 vendor(s).
  You'll be notified when they respond.
</SuccessMessage>

// Wizard
<SuccessMessage title="✓ RFQ Live!">
  Your RFQ is now live.
  We'll match you to the best vendors.
</SuccessMessage>

// Public
<SuccessMessage title="✓ RFQ Posted!">
  Your RFQ is now visible to all vendors.
  They'll respond directly to you.
</SuccessMessage>
```

---

## 3. Code Structure: Where Divergence Happens

### File Organization

```
/components/RFQModal/
├── RFQModal.jsx                 ← Main container (shared)
├── StepIndicator.jsx            ← Shared
├── ModalHeader.jsx              ← Shared
├── ModalFooter.jsx              ← Shared
│
├── Steps/
│   ├── StepCategory.jsx         ← Shared
│   ├── StepTemplate.jsx         ← Shared
│   ├── StepGeneral.jsx          ← Shared
│   │
│   ├── StepRecipients.jsx       ← Router to type-specific
│   │   ├── DirectRecipients.jsx   ← Type-specific
│   │   ├── WizardRecipients.jsx   ← Type-specific
│   │   └── PublicRecipients.jsx   ← Type-specific
│   │
│   ├── StepAuth.jsx             ← Shared (messaging varies)
│   ├── StepReview.jsx           ← Mostly shared (review varies)
│   └── StepSuccess.jsx          ← Varies by type
│
└── utils/
    ├── validation.js            ← Type-aware validation
    └── formatters.js            ← Format data by type
```

---

## 4. Divergence Switch in Main Modal

```javascript
// /components/RFQModal.jsx

export default function RFQModal({ rfqType, isOpen, onClose }) {
  // ... state setup ...
  
  const renderRecipientStep = () => {
    switch (rfqType) {
      case 'direct':
        return (
          <DirectRecipients
            vendors={vendors}
            selectedVendors={formData.selectedVendors}
            onVendorToggle={handleVendorToggle}
            errors={errors}
          />
        );
      case 'wizard':
        return (
          <WizardRecipients
            recommendedVendors={recommendedVendors}
            selectedVendors={formData.selectedVendors}
            allowOtherVendors={formData.allowOtherVendors}
            onVendorToggle={handleVendorToggle}
            onAllowOthersChange={handleAllowOthersChange}
            errors={errors}
          />
        );
      case 'public':
        return (
          <PublicRecipients
            visibilityScope={formData.visibilityScope}
            responseLimit={formData.responseLimit}
            onVisibilityScopeChange={handleVisibilityScopeChange}
            onResponseLimitChange={handleResponseLimitChange}
            county={formData.county}
            category={formData.selectedCategory}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 'category':
        return <StepCategory {...} />;
      case 'template':
        return <StepTemplate {...} />;
      case 'general':
        return <StepGeneral {...} />;
      case 'recipients':
        return renderRecipientStep();  // ← Type-specific
      case 'auth':
        return <StepAuth rfqType={rfqType} {...} />;
      case 'review':
        return <StepReview rfqType={rfqType} {...} />;
      case 'success':
        return <StepSuccess rfqType={rfqType} {...} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <ModalHeader rfqType={rfqType} onClose={onClose} />
        <StepIndicator currentStep={currentStep} />
        <div className="modal-content">
          {renderStep()}
        </div>
        <ModalFooter {...} />
      </div>
    </div>
  );
}
```

---

## 5. Validation Pattern: Type-Aware

```javascript
// /lib/rfqModalUtils.js

export const validateStep = (step, data, rfqType) => {
  const errors = {};
  
  // Steps 1-3 same for all types
  if (step === 'category') {
    if (!data.selectedCategory) errors.category = 'Required';
    if (!data.selectedJobType) errors.jobType = 'Required';
  }
  
  if (step === 'template') {
    // Validate template fields
  }
  
  if (step === 'general') {
    // Validate general project info
  }
  
  // Step 4 varies by type
  if (step === 'recipients') {
    if (rfqType === 'direct') {
      if (!data.selectedVendors?.length) {
        errors.selectedVendors = 'Select at least 1 vendor';
      }
    }
    
    if (rfqType === 'wizard') {
      if (!data.selectedVendors?.length && !data.allowOtherVendors) {
        errors.recipients = 'Select vendors or allow others';
      }
    }
    
    if (rfqType === 'public') {
      if (!data.visibilityScope) errors.visibilityScope = 'Required';
      if (!data.responseLimit) errors.responseLimit = 'Required';
    }
  }
  
  // Steps 5-7 mostly same
  
  return Object.keys(errors).length === 0 ? { valid: true } : { errors };
};
```

---

## 6. API Payload: Type-Aware

```javascript
// /app/api/rfq/create/route.js

export async function POST(request) {
  const body = await request.json();
  
  // Extract common fields
  const rfqRecord = {
    user_id: body.user_id,
    buyer_id: body.user_id,
    title: body.title,
    category: body.category,
    job_type: body.jobType,
    description: body.description,
    // ... rest of common fields ...
    details: body.templateFields,
    rfq_type: body.rfqType,
    created_at: new Date(),
    published_at: new Date(),
  };
  
  // Type-specific fields
  if (body.rfqType === 'direct') {
    rfqRecord.visibility = 'private';
    rfqRecord.selectedVendors = body.selectedVendors;
  }
  
  if (body.rfqType === 'wizard') {
    rfqRecord.visibility = 'matching';
    rfqRecord.selectedVendors = body.selectedVendors;
    rfqRecord.allowOtherVendors = body.allowOtherVendors;
  }
  
  if (body.rfqType === 'public') {
    rfqRecord.visibility = 'public';
    rfqRecord.visibilityScope = body.visibilityScope;
    rfqRecord.responseLimit = body.responseLimit;
  }
  
  // Create RFQ
  const { data: rfq, error } = await supabase
    .from('rfqs')
    .insert([rfqRecord])
    .select();
  
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  // Create recipients (varies by type)
  if (body.rfqType === 'direct') {
    // Create explicit recipient record for each vendor
    const recipients = body.selectedVendors.map(vendorId => ({
      rfq_id: rfq[0].id,
      vendor_id: vendorId,
      recipient_type: 'direct',
    }));
    await supabase.from('rfq_recipients').insert(recipients);
  }
  
  if (body.rfqType === 'wizard') {
    // Create recipient records for suggested vendors
    const recipients = body.selectedVendors.map(vendorId => ({
      rfq_id: rfq[0].id,
      vendor_id: vendorId,
      recipient_type: 'suggested',
    }));
    await supabase.from('rfq_recipients').insert(recipients);
    // Public will be populated when vendors find it (no explicit recipients)
  }
  
  if (body.rfqType === 'public') {
    // No recipient records created (it's a public posting)
    // Vendors search and find it themselves
  }
  
  return NextResponse.json({ id: rfq[0].id });
}
```

---

## 7. Database Schema Implication

### RFQ Table Fields (Type-Aware)

```sql
rfqs
├── id (UUID)
├── user_id (UUID)
├── category (text)
├── job_type (text)
├── title (text)
├── description (text)
├── details (JSONB) -- template fields
│
├── location (text)
├── county (text)
├── budget_min (integer)
├── budget_max (integer)
│
├── rfq_type (enum: 'direct', 'wizard', 'public')
├── visibility (enum: 'private', 'matching', 'public')
│
├── -- Direct-specific
├── selectedVendors (JSONB) -- ['v1', 'v2'] [OPTIONAL]
│
├── -- Wizard-specific
├── allowOtherVendors (boolean) [OPTIONAL, default: false]
│
├── -- Public-specific
├── visibilityScope (text) -- 'category', 'category_nearby' [OPTIONAL]
├── responseLimit (integer) -- 5, 10, 999 [OPTIONAL]
│
├── created_at (timestamp)
├── published_at (timestamp)
└── status (enum: 'open', 'closed', 'archived')
```

---

## 8. Side-by-Side Comparison

| Aspect | Direct | Wizard | Public |
|--------|--------|--------|--------|
| **Step 4 Input** | Select vendors manually | Confirm suggestions + toggle "allow others" | Set visibility scope + response limit |
| **Vendors Notified** | Specific selected vendors | Suggested + optionally all | Self-discovered |
| **Control Level** | High (choose each vendor) | Medium (suggestions + open) | Low (public posting) |
| **DB: rfq_type** | 'direct' | 'wizard' | 'public' |
| **DB: visibility** | 'private' | 'matching' | 'public' |
| **DB: selectedVendors** | populated | populated | empty |
| **DB: allowOtherVendors** | null | true/false | null |
| **DB: visibilityScope** | null | null | 'category' or 'category_nearby' |
| **DB: responseLimit** | null | null | 5, 10, or 999 |
| **Recipients Table** | Explicit records created | Explicit records for suggested, plus open | Vendors find it (no records) |
| **Success Message** | "Sent to X vendors" | "Live, matched vendors responding" | "Posted publicly, vendors responding" |

---

## 9. Migration Guide: From Pages to Modal

### Current (Three Pages)
```
User clicks "Send Direct RFQ"
  ↓
Navigate to /post-rfq/direct/page.js
  ↓
Full page form (multi-step)
  ↓
Submit
```

### New (One Modal)
```
User clicks "Send Direct RFQ"
  ↓
RFQModal({ rfqType: 'direct', isOpen: true })
  ↓
Modal overlay with 7 steps
  ↓
Submit (same backend)
```

**Files to Delete:**
```
/app/post-rfq/direct/page.js
/app/post-rfq/wizard/page.js
/app/post-rfq/public/page.js
```

**Files to Create:**
```
/components/RFQModal.jsx
/components/RFQModal/Steps/*.jsx (7 files)
/components/RFQModal/DirectRecipients.jsx
/components/RFQModal/WizardRecipients.jsx
/components/RFQModal/PublicRecipients.jsx
/lib/rfqModalUtils.js
/styles/RFQModal.module.css
```

**Trigger Points (Add RFQModal to existing pages):**
- Browse Vendors page → "Send Direct RFQ" button
- Vendor detail page → "Send Direct RFQ" button
- Home page → "Smart RFQ" button
- Public RFQ section → "Post Public RFQ" button

---

## 10. Code Reuse Summary

| Component | Shared? | Notes |
|-----------|---------|-------|
| RFQModal.jsx | ✅ 100% | Main container for all three types |
| StepCategory.jsx | ✅ 100% | Identical category/job type picker |
| StepTemplate.jsx | ✅ 100% | Renders template fields (same for all) |
| StepGeneral.jsx | ✅ 100% | Project info form (same for all) |
| StepRecipients.jsx | ✅ 100% | Router to type-specific recipients |
| DirectRecipients.jsx | ✅ 100% | Type-specific: vendor selection |
| WizardRecipients.jsx | ✅ 100% | Type-specific: suggested + toggle |
| PublicRecipients.jsx | ✅ 100% | Type-specific: visibility settings |
| StepAuth.jsx | ✅ 95% | Shared flow, messaging varies |
| StepReview.jsx | ✅ 90% | Left column shared, right varies |
| StepSuccess.jsx | ✅ 80% | Layout shared, copy varies |
| Validation functions | ✅ 100% | Type-aware (switch statements) |
| API endpoints | ✅ 100% | Single endpoint, type-aware logic |
| **Overall Code Reuse** | **✅ 90%** | One modal, three flows, minimal duplication |

---

## Summary

### Key Takeaway

> **95% of the code is shared across all three RFQ types. The only divergence happens at Step 4 (recipient selection), with minor variations in validation, copy, and database fields.**

This design:
- ✅ Reduces code duplication (one modal vs. three pages)
- ✅ Ensures consistent UX across all three types
- ✅ Makes maintenance easier (fix bug once, fixes all three)
- ✅ Allows future shared features (e.g., draft saving, analytics) with minimal changes
- ✅ Clear, testable divergence points (type-aware switches)

---

**Document Status:** ✅ Ready for Reference  
**Next Step:** Use this as guide when implementing RFQModal components

