# Unified RFQ Modal - Quick Reference

**Date:** January 1, 2026  
**Version:** 1.0  
**Purpose:** TL;DR and quick lookup for developers

---

## 📋 One-Page Flow Summary

```
UNIFIED RFQ MODAL - 7 STEPS
==========================

Modal opened with rfqType = 'direct' | 'wizard' | 'public'

STEP 1: CATEGORY & JOB TYPE
├─ All 20 categories shown as grid
├─ Select category → shows job type options
├─ Next: load template

STEP 2: TEMPLATE FIELDS
├─ Category-specific questions (3-7 fields)
├─ Validate required fields
├─ Next: general project info

STEP 3: GENERAL PROJECT INFO
├─ Project title, summary
├─ Location (county, town)
├─ Budget min/max
├─ Start date preference
├─ Next: recipients (DIVERGES BY TYPE)

        ┌─────────────────────────────────────┐
        │ STEP 4: RECIPIENTS (TYPE-SPECIFIC)  │
        ├─────────────────────────────────────┤
        │                                     │
        │ DIRECT:                             │
        │ ✓ User picks 1-10 vendors          │
        │                                     │
        │ WIZARD:                             │
        │ ✓ Suggested vendors pre-checked    │
        │ ✓ Toggle: "Allow others too"       │
        │                                     │
        │ PUBLIC:                             │
        │ ✓ Set visibility scope             │
        │ ✓ Set response limit (5/10/∞)      │
        │                                     │
        └─────────────────────────────────────┘

STEP 5: AUTH & RFQ LIMITS
├─ If logged in + under limit: SKIP TO STEP 6
├─ Else: Show login/signup or payment UI
├─ Next: review

STEP 6: REVIEW & CONFIRM
├─ Show all entered data
├─ Show recipients (varies by type)
├─ Next: create RFQ

STEP 7: SUCCESS
├─ Confirm RFQ created
├─ Show RFQ ID
├─ Options: View Details / Close Modal
```

---

## 🎯 Component Tree (Quick)

```
RFQModal
├── ModalHeader (title, subtitle, close)
├── StepIndicator (step X of 7)
├── [Step Content]
│   ├── StepCategory (shared)
│   ├── StepTemplate (shared)
│   ├── StepGeneral (shared)
│   ├── StepRecipients (routes to type-specific)
│   │   ├── DirectRecipients (4A)
│   │   ├── WizardRecipients (4B)
│   │   └── PublicRecipients (4C)
│   ├── StepAuth (shared)
│   ├── StepReview (mostly shared)
│   └── StepSuccess (varies by type)
└── ModalFooter (Back / Next / Send buttons)
```

---

## 📍 Where Each RFQ Type Differs

### 1. Direct RFQ

**Step 4:** User searches and selects vendors manually
```javascript
selectedVendors = ['vendor_1', 'vendor_3']  // 1-10 vendors
```
**Validation:** At least 1 vendor required

**API Payload:**
```javascript
{
  rfqType: 'direct',
  selectedVendors: ['v1', 'v3'],
  // ... common fields ...
}
```

**DB Record:**
```javascript
rfq_type: 'direct'
visibility: 'private'
selectedVendors: ['v1', 'v3']  // stored in JSONB
```

**Recipients Created:** ✅ Yes (one per selected vendor)

**Success Message:**
```
"Your RFQ has been sent to 3 vendor(s).
 You'll be notified when they respond."
```

---

### 2. Wizard RFQ

**Step 4:** Vendors auto-matched, user confirms + can allow others
```javascript
// Backend filters vendors by category + location
recommendedVendors = [v1, v2, v3]

// User can keep auto-checked or uncheck
selectedVendors = [v1, v3]

// User can toggle: "Allow other vendors to respond"
allowOtherVendors = true
```

**Validation:** 
```javascript
selectedVendors.length > 0 OR allowOtherVendors === true
```

**API Payload:**
```javascript
{
  rfqType: 'wizard',
  selectedVendors: ['v1', 'v3'],
  allowOtherVendors: true,
  // ... common fields ...
}
```

**DB Record:**
```javascript
rfq_type: 'wizard'
visibility: 'matching'
selectedVendors: ['v1', 'v3']
allowOtherVendors: true
```

**Recipients Created:** ✅ Yes (one per selected vendor, rest matched later)

**Success Message:**
```
"Your RFQ is now live.
 Matching vendors will be notified."
```

---

### 3. Public RFQ

**Step 4:** User configures visibility settings only
```javascript
visibilityScope = 'category' | 'category_nearby'
responseLimit = 5 | 10 | 999  // 999 = no limit
```

**No vendor selection needed**

**Validation:** 
```javascript
visibilityScope && responseLimit // Just check settings filled
```

**API Payload:**
```javascript
{
  rfqType: 'public',
  visibilityScope: 'category_nearby',
  responseLimit: 5,
  selectedVendors: [],  // Empty
  // ... common fields ...
}
```

**DB Record:**
```javascript
rfq_type: 'public'
visibility: 'public'
visibilityScope: 'category_nearby'
responseLimit: 5
selectedVendors: []  // No explicit selection
```

**Recipients Created:** ❌ No (vendors discover themselves)

**Success Message:**
```
"Your RFQ is now visible to all vendors.
 They'll respond when interested."
```

---

## 🔑 Key State in RFQModal

```javascript
const [formData, setFormData] = useState({
  // Shared by all types (Steps 1-3, 5-7)
  selectedCategory: '',
  selectedJobType: '',
  templateFields: {},
  projectTitle: '',
  county: '',
  town: '',
  budgetMin: '',
  budgetMax: '',
  
  // Type-specific (Step 4)
  selectedVendors: [],      // Direct, Wizard
  allowOtherVendors: false, // Wizard
  visibilityScope: '',      // Public
  responseLimit: 5,         // Public
  
  // Auth (Step 5)
  user: null,
  
  // Success (Step 7)
  rfqId: null,
});
```

---

## ✅ Validation Checklist by Step

### Step 1: Category & Job Type
```javascript
[✓] selectedCategory selected
[✓] selectedJobType selected
```

### Step 2: Template Fields
```javascript
[✓] All required fields filled
[✓] No field errors
```

### Step 3: General Project Info
```javascript
[✓] County selected
[✓] Town entered
[✓] budgetMin < budgetMax
[✓] Budget values entered
```

### Step 4: Recipients (Type-Specific)
```javascript
// Direct
[✓] selectedVendors.length >= 1

// Wizard
[✓] selectedVendors.length >= 1 OR allowOtherVendors === true

// Public
[✓] visibilityScope filled
[✓] responseLimit selected
```

### Step 5: Auth
```javascript
[✓] User logged in OR auth completed
[✓] Under free RFQ limit OR payment processed
```

### Step 6: Review
```javascript
[✓] All data displayed correctly
[✓] User confirmed ready to send
```

---

## 🚀 Quick Implementation Phases

### Phase 1: Foundation (1 day)
- [ ] Create RFQModal.jsx (state + navigation)
- [ ] Create step components skeleton
- [ ] Setup styling (modal layout, responsive)

### Phase 2: Shared Steps (1.5 days)
- [ ] Implement StepCategory
- [ ] Implement StepTemplate
- [ ] Implement StepGeneral
- [ ] Add validation

### Phase 3: Type-Specific (1.5 days)
- [ ] Implement DirectRecipients
- [ ] Implement WizardRecipients
- [ ] Implement PublicRecipients

### Phase 4: Final Steps (1 day)
- [ ] Implement StepAuth
- [ ] Implement StepReview
- [ ] Implement StepSuccess

### Phase 5: Backend (1 day)
- [ ] Create POST /api/rfq/create endpoint
- [ ] Type-specific validation
- [ ] Create recipients (varies by type)

### Phase 6: Testing (1 day)
- [ ] E2E test all three flows
- [ ] Mobile responsiveness
- [ ] Error scenarios

**Total:** 6 days of development

---

## 📚 Reference Files Created

| Document | Purpose |
|----------|---------|
| `RFQ_MODAL_UNIFIED_FLOW.md` | Complete UX/UI flow with wireframes |
| `RFQ_MODAL_IMPLEMENTATION_ARCHITECTURE.md` | Component structure, state, API contracts |
| `RFQ_MODAL_CODE_DIVERGENCE.md` | Where Direct/Wizard/Public differ |
| `RFQ_MODAL_QUICK_REFERENCE.md` | This file — TL;DR and lookup |

---

## 💡 Key Design Decisions

| Decision | Why |
|----------|-----|
| One modal, three types | Reduce duplication, consistent UX |
| Diverge only at Step 4 | Steps 1-3 identical, 5-7 mostly identical |
| Type-aware validation | Different rules per type (use switch statements) |
| Pre-filter for Wizard | Smarter defaults, better UX |
| No vendor selection for Public | Open posting, vendors find it |
| Skip auth if logged in + under limit | Faster experience |
| Store type in DB | Enables future analytics, support queries |

---

## 🔧 Common Code Patterns

### Type-Aware Switch (Steps 4, 6, 7)
```javascript
switch (rfqType) {
  case 'direct':
    return <DirectRecipients {...} />;
  case 'wizard':
    return <WizardRecipients {...} />;
  case 'public':
    return <PublicRecipients {...} />;
}
```

### Type-Aware Validation
```javascript
const validateRecipients = () => {
  if (rfqType === 'direct') {
    return selectedVendors.length >= 1;
  }
  if (rfqType === 'wizard') {
    return selectedVendors.length >= 1 || allowOtherVendors;
  }
  if (rfqType === 'public') {
    return visibilityScope && responseLimit;
  }
};
```

### Type-Aware API Payload
```javascript
const payload = {
  rfqType,
  // ... common fields ...
  ...(rfqType === 'direct' && { selectedVendors }),
  ...(rfqType === 'wizard' && { selectedVendors, allowOtherVendors }),
  ...(rfqType === 'public' && { visibilityScope, responseLimit }),
};
```

---

## 🐛 Common Pitfalls to Avoid

| Pitfall | Prevention |
|---------|-----------|
| Forgetting to reset Step 2 when category changes | Add useEffect cleanup for template fields |
| Validating all steps at once | Validate only current step, show errors |
| Not handling "no vendors available" case | Show fallback message in Direct/Wizard |
| Assuming vendor list is always populated | Lazy-load vendors on Step 4 |
| Not clearing selected vendors when changing category | Reset Step 4 data on category change |
| Showing template fields for wrong job type | Filter by category + jobType combo |
| Forgetting rfq_type in API payload | Always include rfqType in POST request |

---

## 📞 Support Matrix

### Questions to Ask When Stuck

**"How do I handle vendor selection?"**
- Direct: Let user pick manually from full list
- Wizard: Pre-filter by category + county, show as pre-checked
- Public: Don't ask, user sets visibility scope

**"What validation should fail?"**
- Direct: No vendors selected
- Wizard: No vendors selected AND "allow others" is off
- Public: Just check settings fields are filled

**"What goes in the API request?"**
- All types: Common fields (title, budget, location, details)
- Direct: selectedVendors array
- Wizard: selectedVendors array + allowOtherVendors boolean
- Public: visibilityScope + responseLimit

**"What gets stored in recipients table?"**
- Direct: Yes, one record per selected vendor
- Wizard: Yes, one record per selected vendor
- Public: No, vendors find it themselves

**"What should the success message say?"**
- Direct: "Sent to X vendor(s)"
- Wizard: "RFQ is live, vendors being matched"
- Public: "RFQ is posted publicly"

---

## 🎓 Example: Direct RFQ Flow in Code

```javascript
// User clicks "Send Direct RFQ" button
<button onClick={() => {
  setShowModal(true);
  setRFQType('direct');
}}>
  Send Direct RFQ
</button>

// Modal opens
<RFQModal
  rfqType="direct"
  isOpen={showModal}
  onClose={() => setShowModal(false)}
/>

// Inside RFQModal:
// Step 1: User picks "Roofing & Waterproofing" > "New roof"
// Step 2: User fills in "Roof type", "Area", "Existing situation"
// Step 3: User enters "Westlands", "KES 100k-500k", "ASAP"
// Step 4: User selects 3 vendors (DIVERGENCE POINT)
// Step 5: System checks auth (or shows login)
// Step 6: User reviews data, sees "3 vendors selected"
// Step 7: RFQ created, "Sent to 3 vendor(s)"

// In API:
POST /api/rfq/create {
  rfqType: 'direct',
  category: 'Roofing & Waterproofing',
  jobType: 'New roof',
  details: {
    roof_type: 'Tiles',
    area: '150 m²',
    existing: 'Old roof in place'
  },
  county: 'Nairobi',
  town: 'Westlands',
  budgetMin: 100000,
  budgetMax: 500000,
  selectedVendors: ['vendor_1', 'vendor_3', 'vendor_5']
}

// Creates:
// 1. RFQ record with rfq_type='direct', visibility='private'
// 2. 3 rfq_recipient records (one per vendor)
```

---

## 📊 Component File Sizes (Estimate)

| File | Size | Type |
|------|------|------|
| RFQModal.jsx | 400-500 lines | Container |
| StepCategory.jsx | 150-200 lines | Shared |
| StepTemplate.jsx | 100-150 lines | Shared |
| StepGeneral.jsx | 200-250 lines | Shared |
| DirectRecipients.jsx | 150-200 lines | Type-specific |
| WizardRecipients.jsx | 150-200 lines | Type-specific |
| PublicRecipients.jsx | 100-150 lines | Type-specific |
| StepAuth.jsx | 200-250 lines | Shared |
| StepReview.jsx | 250-300 lines | Mostly shared |
| StepSuccess.jsx | 100-150 lines | Varies |
| **Total** | **~1,700-2,100 lines** | |

---

## 🏁 Success Criteria

✅ Modal opens from 3 different buttons  
✅ All three flows work end-to-end  
✅ Vendor selection only happens for Direct/Wizard  
✅ Public RFQ doesn't ask for vendors  
✅ Validation varies by type  
✅ API payloads differ appropriately  
✅ Database records created correctly  
✅ Success messages vary by type  
✅ Mobile responsive  
✅ Keyboard accessible  
✅ < 10 clicks to send  
✅ Error handling consistent  

---

## 🔗 Related Documentation

- **Full Flow:** See `RFQ_MODAL_UNIFIED_FLOW.md`
- **Architecture:** See `RFQ_MODAL_IMPLEMENTATION_ARCHITECTURE.md`
- **Code Patterns:** See `RFQ_MODAL_CODE_DIVERGENCE.md`
- **Template System:** See `COMPREHENSIVE_RFQ_TEMPLATE_GUIDE.md`
- **Current DirectRFQ:** `/app/post-rfq/direct/page.js` (reference)

---

**Document Status:** ✅ Ready for Quick Reference  
**Audience:** Developers implementing the modal  
**Last Updated:** January 1, 2026

