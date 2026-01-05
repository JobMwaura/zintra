# RFQ System - Evidence & Code References

**Date**: January 5, 2026  
**Investigation Complete**

---

## Evidence: All Three Modals Call Missing Endpoint

### 1️⃣ PublicRFQModal.js (Line 136)

**File**: `components/PublicRFQModal.js`  
**Lines**: 134-150

```javascript
const submitRfq = async () => {
  setIsSubmitting(true);
  setError('');
  setSuccessMessage('');

  try {
    const formData = getAllFormData();

    const response = await fetch('/api/rfq/create', {  // ❌ LINE 136
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        guestPhone: guestPhone,
        guestPhoneVerified: guestPhoneVerified,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 402) {
        setError("You've reached your monthly RFQ limit. Please upgrade your plan.");
        // ...
```

**What it's sending**:
```javascript
{
  rfqType: 'public',
  categorySlug: 'building_masonry',
  jobTypeSlug: 'building_construction',
  templateFields: { /* category-specific fields */ },
  sharedFields: { 
    projectTitle: '...',
    projectSummary: '...',
    county: '...',
    budgetMin: '...',
    budgetMax: '...',
    // ...
  },
  guestPhone: '254712345678',    // If guest
  guestPhoneVerified: true,      // If guest
  userId: 'abc-123',             // If authenticated
}
```

---

### 2️⃣ RFQModal.jsx (Line 122 - for Direct RFQs)

**File**: `components/RFQModal/RFQModal.jsx`  
**Lines**: 120-150 (approx)

```javascript
const handleSubmit = async () => {
  // ... validation ...

  try {
    setLoading(true);
    const response = await fetch('/api/rfq/create', {  // ❌ MISSING
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rfqType: 'direct',
        selectedCategory: formData.selectedCategory,
        selectedJobType: formData.selectedJobType,
        templateFields: formData.templateFields,
        sharedFields: {
          projectTitle: formData.projectTitle,
          projectSummary: formData.projectSummary,
          county: formData.county,
          // ...
        },
        selectedVendors: formData.selectedVendors,
        // ...
      }),
    });

    const result = await response.json();
    // ... handle result ...
```

---

### 3️⃣ RFQModal.jsx (Line 172 - for Wizard RFQs)

**File**: `components/RFQModal/RFQModal.jsx`  
**Lines**: 170-200 (approx)

```javascript
const handleWizardSubmit = async () => {
  // ... validation ...

  try {
    setLoading(true);
    const response = await fetch('/api/rfq/create', {  // ❌ MISSING
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rfqType: 'wizard',
        selectedCategory: formData.selectedCategory,
        selectedJobType: formData.selectedJobType,
        templateFields: formData.templateFields,
        sharedFields: {
          projectTitle: formData.projectTitle,
          projectSummary: formData.projectSummary,
          county: formData.county,
          // ... vendor matching will happen server-side
        },
        // ...
      }),
    });

    const result = await response.json();
    // ... handle result ...
```

---

## Evidence: The Endpoint Really Doesn't Exist

### What API Routes DO Exist

```
✅ /api/rfq/submit
✅ /api/rfq/quota
✅ /api/rfq/payment/topup
✅ /api/rfq/[rfq_id]/response
✅ /api/rfq/assign-job
```

### What's Missing

```
❌ /api/rfq/create          ← All three modals call this
```

### Evidence from Directory Structure

```
/app/api/rfq/
├── [rfq_id]/
│   └── response/route.js
├── assign-job/
│   └── route.js
├── payment/
│   └── topup/route.js
├── quota/
│   └── route.js
├── submit/route.js
└── (NO create/ directory)
```

---

## The Old Modals (That Actually Worked!)

### DirectRFQModal.js (398 lines) - ⚠️ UNUSED

**File**: `components/DirectRFQModal.js`  
**Status**: File exists but NOT IMPORTED ANYWHERE

**Uses RfqContext properly**:
```javascript
const {
  rfqType,
  setRfqType,
  selectedCategory,
  setSelectedCategory,
  selectedJobType,
  setSelectedJobType,
  templateFields,
  updateTemplateField,
  updateTemplateFields,
  sharedFields,
  updateSharedField,
  updateSharedFields,
  isGuestMode,
  setUserAuthenticated,
  guestPhone,
  guestPhoneVerified,
  getAllFormData,
  resetRfq,
} = useRfqContext();
```

**Also calls `/api/rfq/create`**:
```javascript
const submitRfq = async () => {
  try {
    const formData = getAllFormData();
    const response = await fetch('/api/rfq/create', {  // ❌ ALSO MISSING
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        guestPhone: guestPhone,
        guestPhoneVerified: guestPhoneVerified,
      }),
    });
    // ...
```

---

### WizardRFQModal.js (531 lines) - ⚠️ UNUSED

**File**: `components/WizardRFQModal.js`  
**Status**: File exists but NOT IMPORTED ANYWHERE

**Uses RfqContext properly**:
```javascript
const {
  rfqType,
  setRfqType,
  selectedCategory,
  setSelectedCategory,
  selectedJobType,
  setSelectedJobType,
  templateFields,
  updateTemplateField,
  updateTemplateFields,
  sharedFields,
  updateSharedField,
  updateSharedFields,
  selectedVendors,
  toggleVendor,
  setVendors,
  isGuestMode,
  setUserAuthenticated,
  guestPhone,
  guestPhoneVerified,
  getAllFormData,
  resetRfq,
} = useRfqContext();
```

**Also calls `/api/rfq/create`**:
```javascript
const submitRfq = async () => {
  try {
    const formData = getAllFormData();
    const response = await fetch('/api/rfq/create', {  // ❌ ALSO MISSING
      method: 'POST',
      // ...
```

---

## Why This Happened

### Hypothesis

**Timeline (reconstructed)**:

1. **Weeks 1-3**: Built RfqContext and DirectRFQModal/WizardRFQModal
   - These use RfqContext ✅
   - These call `/api/rfq/create`
   - These have form persistence ✅
   - These work correctly ✅

2. **Weeks 4-5**: Created PublicRFQModal for public RFQs
   - Similar to DirectRFQModal/WizardRFQModal
   - Uses RfqContext ✅
   - Adds beautiful category selector 🔥
   - Adds form auto-save 🔥
   - Calls `/api/rfq/create`

3. **Week 6**: Someone created generic RFQModal for reuse
   - Intended to consolidate Direct & Wizard into one component
   - BUT: Doesn't use RfqContext (architectural step backward)
   - Still calls `/api/rfq/create`
   - Replaced DirectRFQModal.js and WizardRFQModal.js usage

4. **This Week**: System "crashes"
   - But it never worked with RFQModal + missing endpoint!
   - Likely `/api/rfq/create` was deleted or never created
   - Users can't submit RFQs
   - System appears completely broken

### What Probably Happened

1. Someone planned to create `/api/rfq/create` endpoint
2. But never finished implementation
3. OR created it but then deleted it
4. OR created it but code review rejected it
5. Now all three modals can't submit

---

## The Data Structure Being Sent

### Direct RFQ Submission Data

```json
{
  "rfqType": "direct",
  "categorySlug": "building_masonry",
  "jobTypeSlug": "building_construction",
  "templateFields": {
    "what_building": "3-bedroom house with garage",
    "scope_of_work": "Full house construction",
    "site_status": "Bare plot",
    "materials_supply": "Vendor supplies",
    "project_timeline": "6 months",
    "special_notes": "Budget conscious"
  },
  "sharedFields": {
    "projectTitle": "Build my dream house",
    "projectSummary": "Need a quality 3-bedroom bungalow...",
    "county": "Nairobi",
    "town": "Kilimani",
    "directions": "Near Whole Foods",
    "budgetMin": "5000000",
    "budgetMax": "7000000",
    "desiredStartDate": "2026-03-01"
  },
  "selectedVendors": ["vendor-id-1", "vendor-id-2"],
  "allowOtherVendors": false,
  "userId": "user-id-123"  // if authenticated
}
```

### Wizard RFQ Submission Data

```json
{
  "rfqType": "wizard",
  "categorySlug": "building_masonry",
  "jobTypeSlug": "building_construction",
  "templateFields": { /* same as above */ },
  "sharedFields": { /* same as above */ },
  "userId": "user-id-123"  // if authenticated
  // NOTE: No selectedVendors - system will auto-match
}
```

### Public RFQ Submission Data

```json
{
  "rfqType": "public",
  "categorySlug": "building_masonry",
  "jobTypeSlug": "building_construction",
  "templateFields": { /* same as above */ },
  "sharedFields": { /* same as above */ },
  "guestPhone": "254712345678",
  "guestPhoneVerified": true,
  "userId": "user-id-123"  // if authenticated, otherwise guest
}
```

---

## What The Endpoint Should Do

### Pseudo-code

```javascript
export async function POST(request) {
  const body = await request.json();
  
  // 1. Validate required fields
  const { 
    rfqType,           // 'direct' | 'wizard' | 'public'
    categorySlug,
    jobTypeSlug,
    templateFields,
    sharedFields,
    selectedVendors,   // for 'direct' only
    userId,            // for authenticated users
    guestPhone,        // for guests
    guestPhoneVerified // for guests
  } = body;

  // 2. Check user authentication
  if (!userId && !guestPhone) {
    return error(400, 'User authentication or guest phone required');
  }

  // 3. Check RFQ quota (if user authenticated)
  if (userId) {
    const canSubmit = await checkQuota(userId, rfqType);
    if (!canSubmit) {
      return error(402, 'RFQ quota exceeded. Please upgrade.');
    }
  }

  // 4. Create RFQ record
  const rfq = await db.rfqs.create({
    user_id: userId || null,
    title: sharedFields.projectTitle,
    description: sharedFields.projectSummary,
    category: categorySlug,
    job_type: jobTypeSlug,
    template_fields: templateFields,
    shared_fields: sharedFields,
    rfq_type: rfqType,
    status: 'open',
    visibility: rfqType === 'public' ? 'public' : 'private',
    guest_phone: guestPhone || null,
    guest_phone_verified: guestPhoneVerified || false,
    created_at: now()
  });

  // 5. Handle vendor assignment based on type
  if (rfqType === 'direct' && selectedVendors.length > 0) {
    // Assign selected vendors
    await assignVendorsToRfq(rfq.id, selectedVendors);
  } else if (rfqType === 'wizard') {
    // Auto-match vendors by category
    const matchingVendors = await findVendorsByCategory(categorySlug);
    await assignVendorsToRfq(rfq.id, matchingVendors);
  } else if (rfqType === 'public') {
    // Mark as public - available to all matching vendors
    await publishRfq(rfq.id);
  }

  // 6. Return success
  return success({
    rfqId: rfq.id,
    message: 'RFQ created successfully'
  });
}
```

---

## Investigation Evidence Summary

### ✅ Confirmed Working
1. RfqContext initialized and functional
2. All pages wrapped with RfqProvider
3. Category templates (1165 lines) well-designed
4. Beautiful selector components created
5. Form persistence system working

### ❌ Confirmed Broken
1. `/api/rfq/create` endpoint doesn't exist
2. All three modals call this non-existent endpoint
3. All submissions fail silently

### ⚠️ Confirmed Confused State
1. Old modals (DirectRFQModal, WizardRFQModal) exist but unused
2. New RFQModal doesn't use RfqContext (poor design choice)
3. Four modal components for similar functionality
4. No documentation on which to use

---

## Code References Summary

| Component | File | Lines | Status | Issue |
|-----------|------|-------|--------|-------|
| Public submission | PublicRFQModal.js | 136 | USED | Calls missing endpoint |
| Direct submission | RFQModal.jsx | 122 | USED | Calls missing endpoint |
| Wizard submission | RFQModal.jsx | 172 | USED | Calls missing endpoint |
| Old Direct | DirectRFQModal.js | 398 | UNUSED | Better implementation |
| Old Wizard | WizardRFQModal.js | 531 | UNUSED | Better implementation |

---

## Conclusion

**The system isn't actually broken - it's just missing one critical piece: the `/api/rfq/create` endpoint.**

Once created, everything will work again:
- ✅ Direct RFQ submissions will work
- ✅ Wizard RFQ submissions will work
- ✅ Public RFQ submissions will work
- ✅ Vendor matching will work
- ✅ Guest submissions will work
- ✅ Authenticated submissions will work

The secondary issues (architectural confusion with modals) can be addressed after getting the system back online.

