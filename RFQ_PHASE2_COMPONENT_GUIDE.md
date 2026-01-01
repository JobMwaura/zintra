# Hierarchical RFQ System - Phase 2 Complete Component Guide

## 📋 Overview

This guide documents the complete hierarchical RFQ system implementation (Phase 2), featuring:

- **20 Major Categories** with **3-7 Job Types each** (~100 total templates)
- **Two-Level Selection Flow** (Category → Job Type)
- **Guest Mode Support** (start without login)
- **Form Data Persistence** (localStorage across sessions)
- **Auth Interception** (login before submit, preserve data)
- **Seamless Guest→Authenticated Transition** (no data loss)

---

## 🏗️ Architecture Overview

### User Journey (Complete Flow)

```
┌─────────────────────────────────────────────────────────────┐
│                    RFQ Submission Flow                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  Step 1: Category    │  ← User selects from 20 major categories
│  Selection           │    (Architectural, Structural, Roofing, etc)
└──────────────────────┘
         ↓
┌──────────────────────┐
│  Step 2: Job Type    │  ← User selects specific job type
│  Selection           │    (New house, Extension, Apartments, etc)
└──────────────────────┘
         ↓
┌──────────────────────┐
│  Step 3: Job-Type    │  ← Fill template fields specific to job type
│  Specific Fields     │    (property description, floor count, etc)
└──────────────────────┘
         ↓
┌──────────────────────┐
│  Step 4: Shared      │  ← Fill general project info
│  General Fields      │    (location, budget, start date, etc)
└──────────────────────┘
         ↓
┌──────────────────────┐
│  Step 5: Auth &      │  ← Guest: Email capture + Login optional
│  Submit              │    Authenticated: Direct submit
└──────────────────────┘
         ↓
┌──────────────────────┐
│  Success:            │  ← RFQ sent to matching vendors
│  RFQ Created         │    Guest/User notified via email
└──────────────────────┘
```

### Key Features at Each Step

**Step 1: Category Selection (RfqCategorySelector)**
- Display 20 categories with icons
- User selects one category
- Show category description
- Move to Step 2

**Step 2: Job Type Selection (RfqJobTypeSelector)** ← NEW
- Display 3-7 job type options within selected category
- Radio cards with descriptions
- Single selection only
- Move to Step 3 with both category + jobType

**Step 3: Job-Specific Fields (RfqFormRenderer)**
- Render fields from selected job type template
- 6-10 fields per job type (property description, dimensions, material preferences, etc)
- Form validation (required, min/max, dates)
- Auto-save to localStorage every 2 seconds
- Move to Step 4

**Step 4: Shared General Fields (RfqFormRenderer)**
- Render shared fields (same for all categories)
- 5-6 fields: location, budget, start date, project title, notes
- Auto-save to localStorage
- Move to Step 5

**Step 5: Auth & Submit (AuthInterceptor)**
- **If Guest Mode:** Show login/signup/email capture options
  - Login/Signup: User creates account, then submit
  - Continue as Guest: Capture email, submit as guest
  - All form data preserved throughout
- **If Authenticated:** Direct submit button
- Form data merged with user info
- Send to API endpoint
- Clear localStorage on success

---

## 📁 Component Breakdown

### 1. RfqJobTypeSelector Component

**File:** `/components/RfqJobTypeSelector.js`  
**Purpose:** Display job type options and allow single selection

**Props:**
```javascript
{
  jobTypes: [
    {
      slug: "arch_new_residential",
      label: "New house / residential design",
      description: "Design for a new residential property from scratch"
    },
    // ... more job types
  ],
  onSelect: (jobType) => {},        // Callback when user selects
  selectedJobType: "arch_new_residential",  // Currently selected (for UI update)
  isLoading: false
}
```

**Features:**
- Radio card UI (selected one highlighted in blue)
- Responsive grid (1 column mobile, 2 columns desktop)
- Shows description under each option
- Auto-selects if only 1 job type available
- Confirmation message after selection

**Usage:**
```javascript
import RfqJobTypeSelector from '@/components/RfqJobTypeSelector';

function RfqWizard() {
  const [selectedJobType, setSelectedJobType] = useState(null);
  
  return (
    <RfqJobTypeSelector
      jobTypes={category.jobTypes}
      onSelect={(jt) => setSelectedJobType(jt.slug)}
      selectedJobType={selectedJobType}
    />
  );
}
```

---

### 2. useRfqFormPersistence Hook

**File:** `/hooks/useRfqFormPersistence.js`  
**Purpose:** Persist form data to localStorage for recovery across sessions

**Methods:**

```javascript
const {
  saveFormData,           // Save form data
  loadFormData,           // Load saved form data
  clearFormData,          // Delete specific draft
  clearAllDrafts,         // Delete all drafts
  getAllDrafts,           // Get all saved drafts
  hasDraft,               // Check if draft exists
  createAutoSave          // Create debounced auto-save function
} = useRfqFormPersistence();
```

**Storage Structure:**
```javascript
localStorage["rfq_draft_architectural_arch_new_residential"] = {
  categorySlug: "architectural",
  jobTypeSlug: "arch_new_residential",
  templateFields: {
    property_description: "3-bedroom bungalow",
    number_of_floors: "2",
    plot_size: "50 × 100"
  },
  sharedFields: {
    location: "Ruiru",
    budget_range: "Mid-range",
    start_date: "2025-02-01"
  },
  createdAt: "2025-12-31T18:30:00Z",
  lastUpdatedAt: "2025-12-31T18:35:00Z"
}
```

**Usage Examples:**

Save form data:
```javascript
const { saveFormData } = useRfqFormPersistence();

// After each field change (debounced)
saveFormData("architectural", "arch_new_residential", 
  { property_description: "3-bed bungalow" },
  { location: "Ruiru" }
);
```

Load on mount:
```javascript
useEffect(() => {
  const saved = loadFormData("architectural", "arch_new_residential");
  if (saved) {
    setFormData({ ...saved.templateFields, ...saved.sharedFields });
  }
}, []);
```

Auto-save (debounced):
```javascript
const autoSave = createAutoSave(2000); // Save 2 seconds after last change

const handleFieldChange = (fieldName, value) => {
  setFormData(prev => ({ ...prev, [fieldName]: value }));
  autoSave("architectural", "arch_new_residential", formData, sharedFields);
};
```

Clear after submit:
```javascript
const { clearFormData } = useRfqFormPersistence();

async function submitRfq() {
  const response = await fetch('/api/rfq/create', { /* ... */ });
  if (response.ok) {
    clearFormData("architectural", "arch_new_residential");
    showSuccess("RFQ submitted!");
  }
}
```

---

### 3. RfqContext

**File:** `/context/RfqContext.js`  
**Purpose:** Global state management for RFQ form across all steps

**State Structure:**
```javascript
{
  // Selection
  selectedCategory: "architectural",
  selectedJobType: "arch_new_residential",
  
  // Form Data
  templateFields: { /* job-specific fields */ },
  sharedFields: { /* location, budget, date, etc */ },
  
  // User State
  isGuestMode: true,
  userEmail: "user@example.com",
  userId: "user-123",
  
  // UI State
  currentStep: "template",  // category | jobtype | template | shared | auth | submit
  isSubmitting: false,
  submitError: null
}
```

**Key Methods:**
```javascript
const {
  // Selection state
  selectedCategory,
  setSelectedCategory,
  selectedJobType,
  setSelectedJobType,
  
  // Form data management
  templateFields,
  updateTemplateField,        // Update single field
  updateTemplateFields,       // Update multiple fields
  sharedFields,
  updateSharedField,
  updateSharedFields,
  
  // User state
  isGuestMode,
  setUserAuthenticated,       // After login/signup
  submitAsGuest,              // Guest email capture
  
  // Actions
  initializeRfq,              // Restore from localStorage
  resetRfq,                   // Clear everything
  getAllFormData,             // Get all form data at once
  getFormCompleteness         // Get % progress
} = useRfqContext();
```

**Setup:**
```javascript
// In pages/_app.js
import { RfqProvider } from '@/context/RfqContext';

function MyApp({ Component, pageProps }) {
  return (
    <RfqProvider>
      <Component {...pageProps} />
    </RfqProvider>
  );
}
```

**Usage in Components:**
```javascript
import { useRfqContext } from '@/context/RfqContext';

function RfqForm() {
  const { 
    templateFields, 
    updateTemplateField,
    sharedFields,
    updateSharedField 
  } = useRfqContext();

  return (
    <>
      <input
        value={templateFields.property_description || ''}
        onChange={(e) => updateTemplateField('property_description', e.target.value)}
      />
      <input
        value={sharedFields.location || ''}
        onChange={(e) => updateSharedField('location', e.target.value)}
      />
    </>
  );
}
```

---

### 4. AuthInterceptor Component

**File:** `/components/AuthInterceptor.js`  
**Purpose:** Show login/signup modal before final RFQ submission if user is guest

**Props:**
```javascript
{
  isOpen: true,                    // Show/hide modal
  onLoginSuccess: (user) => {},   // Called after login/signup
  onGuestSubmit: (email) => {},   // Called for guest submission
  onCancel: () => {}              // Called when user clicks cancel
}
```

**Features:**
- **Three Auth Modes:**
  1. **Login** - Email + password for existing users
  2. **Signup** - Create new account with email + password
  3. **Guest** - Email capture for guest submission

- Form data **never lost** during auth (stored in RfqContext)
- Password validation (minimum 6 chars)
- Email validation
- Error messages for invalid inputs
- Loading states while submitting
- Easy switching between modes

**Modal Layout:**
```
┌─ Complete Your RFQ Request ────────────────┐
│                                             │
│  [Login] [Sign Up]  or  [Continue as Guest]│
│                                             │
│  Email: [____________]                      │
│  Password: [____________]                   │
│                                             │
│  [Login Button]                             │
│                                             │
└─ [Cancel]  ────────────────────────────────┘
```

**Usage:**
```javascript
import AuthInterceptor from '@/components/AuthInterceptor';
import { useRfqContext } from '@/context/RfqContext';

function RfqForm() {
  const [showAuth, setShowAuth] = useState(false);
  const { isGuestMode, getAllFormData } = useRfqContext();

  const handleSubmit = async () => {
    if (isGuestMode) {
      setShowAuth(true); // Show auth modal
      return;
    }
    // User authenticated, proceed
    await submitRfq();
  };

  const handleAuthSuccess = async (user) => {
    setShowAuth(false);
    // Form data preserved in context, user is now authenticated
    await submitRfq();
  };

  return (
    <>
      <button onClick={handleSubmit}>Submit RFQ</button>
      
      <AuthInterceptor
        isOpen={showAuth}
        onLoginSuccess={handleAuthSuccess}
        onGuestSubmit={(email) => {
          setShowAuth(false);
          submitRfq();
        }}
        onCancel={() => setShowAuth(false)}
      />
    </>
  );
}
```

---

## 📊 Templates Data Structure

**File:** `/public/data/rfq-templates-v2-hierarchical.json`

### 20 Major Categories

1. **Architectural Plans & Approvals** (5 job types)
   - New house / residential design
   - Extension / renovation / alteration
   - Apartments / multi-unit housing
   - Commercial / mixed-use building
   - Council approvals / regularisation only

2. **Structural Engineering & Civil Works** (3 job types)
   - Structural design for new building
   - Structural check / assessment
   - Retaining walls / slope stabilisation

3. **Site Prep, Excavation & Earthworks** (3 job types)
   - Site clearance
   - Excavation
   - Levelling / grading

4. **General Building & Masonry** (4 job types)
   - Full house construction
   - Boundary / perimeter wall
   - Walling only
   - Concrete works

5. **Roofing & Waterproofing** (4 job types)
   - New roof
   - Re-roofing / replacement
   - Roof repairs
   - Waterproofing

6. **Doors, Windows & Glass** (4 job types)
   - New doors and windows
   - Replacement / upgrade
   - Glass partitions & shower enclosures
   - Security doors and grills

7-20. (Similar structure with 3-7 job types each)

### Template Field Types

Each job type includes **6-10 fields** of various types:

| Type | Example | Description |
|------|---------|-------------|
| **text** | Property description | Single-line text input |
| **textarea** | Scope of work | Multi-line text |
| **number** | Number of floors | Numeric input |
| **select** | Material type | Dropdown list |
| **multiselect** | Amenities | Multiple checkboxes |
| **date** | Start date | Date picker |
| **file** | Upload plans | File upload (multiple) |

### Shared General Fields (5 fields for ALL categories)

```javascript
[
  {
    name: "project_title",
    label: "Project title (optional)",
    type: "text",
    placeholder: "e.g. Ruiru Residential, Extension Project 2025"
  },
  {
    name: "location",
    label: "Location / Area",
    type: "text",
    placeholder: "e.g. Ruiru, Membley, Kiambu Road, Nairobi",
    required: true
  },
  {
    name: "property_status",
    label: "Property status",
    type: "select",
    options: ["Empty plot", "Existing structure", "Ongoing construction"]
  },
  {
    name: "budget_range",
    label: "Budget range",
    type: "select",
    options: ["Budget-conscious", "Mid-range", "Premium/flexible"]
  },
  {
    name: "start_date",
    label: "When would you like to start?",
    type: "date"
  }
]
```

---

## 🔄 Data Flow & Persistence

### Guest User Complete Flow

```
1. User arrives (guest mode)
   ↓
2. Step 1: Select Category
   ↓
3. Step 2: Select Job Type
   ↓
4. Step 3: Fill Job-Specific Fields
   └─→ Auto-save to localStorage every 2 seconds
   ↓
5. Step 4: Fill Shared Fields
   └─→ Auto-save to localStorage
   ↓
6. Step 5: Click Submit → AuthInterceptor appears
   ├─→ Option A: Login
   │   ├─→ Create new account
   │   └─→ Form data preserved in RfqContext
   ├─→ Option B: Sign Up
   │   ├─→ Existing account login
   │   └─→ Form data preserved in RfqContext
   └─→ Option C: Continue as Guest
       ├─→ Capture email only
       └─→ Form data sent with guest_email
   ↓
7. Submit RFQ to API
   └─→ Clear localStorage draft
   ↓
8. Success → Email sent to user & matching vendors
```

### Page Refresh During Form Fill

```
User on Step 3 (filling fields)
    ↓
Page refresh / accidental close
    ↓
User returns to form within 48 hours
    ↓
Component loads:
├─→ Check localStorage for saved draft
├─→ If found:
│   ├─→ Load RfqContext state
│   ├─→ Load template fields
│   └─→ Load shared fields
└─→ If expired (>48 hours):
    └─→ Show "draft expired" message
    
Result: User's work preserved! 🎉
```

### Guest to Authenticated Transition

```
1. Guest fills form (data in localStorage + RfqContext)
   ↓
2. Clicks Submit → AuthInterceptor modal
   ↓
3. Guest clicks "Login"
   ├─→ Form data stays in RfqContext
   └─→ User creates/signs into account
   ↓
4. Login successful
   ├─→ RfqContext.setUserAuthenticated(user)
   ├─→ isGuestMode = false
   └─→ Form data STILL intact
   ↓
5. Form automatically submits
   ├─→ data merged with user.id
   └─→ localStorage draft cleared
```

---

## 🚀 Implementation Checklist

### Phase 2a: Core Components (COMPLETE) ✅

- [x] Create hierarchical templates JSON (20 categories, ~100 templates)
- [x] Create RfqJobTypeSelector component
- [x] Create useRfqFormPersistence hook
- [x] Create RfqContext
- [x] Create AuthInterceptor component

### Phase 2b: Integration (TODO)

- [ ] Create `/pages/api/rfq/create.js` endpoint
  - Accept guest + authenticated RFQs
  - Validate form data
  - Match to vendors by jobType (not just category)
  - Return rfqId on success

- [ ] Refactor DirectRFQModal
  - Add Step 2: Job Type Selection
  - Integrate RfqContext
  - Add form persistence hooks
  - Add auth interception before submit
  - Test complete flow

- [ ] Refactor WizardRFQModal
  - Same as DirectRFQModal
  - Keep vendor selection at end

- [ ] Refactor PublicRFQModal
  - Same as DirectRFQModal
  - No vendor pre-selection
  - Full guest mode support

### Phase 2c: Testing & Deploy (TODO)

- [ ] End-to-end testing
  - Guest flow (fill → refresh → recover → login → submit)
  - Authenticated flow (direct submit)
  - Vendor matching by jobType
  - Email notifications

- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Production deployment

---

## 🎯 Key Differences from Phase 1

| Aspect | Phase 1 | Phase 2 |
|--------|---------|---------|
| **Templates** | 16 flat | ~100 hierarchical |
| **Selection** | 1 step (category) | 2 steps (category + job type) |
| **Guest Mode** | Not supported | Full support |
| **Form Persistence** | No | localStorage auto-save |
| **Auth Interception** | No | Login before submit |
| **Data Recovery** | No | Browser refresh safe |
| **Guest to Auth** | N/A | Seamless transition |

---

## 📚 Related Files

- **Components:**
  - `/components/RfqJobTypeSelector.js` ← NEW
  - `/components/AuthInterceptor.js` ← NEW
  - `/components/RfqFormRenderer.js` (reusable from Phase 1)
  - `/components/RfqCategorySelector.js` (v1, needs Step 2 integration)

- **Hooks:**
  - `/hooks/useRfqFormPersistence.js` ← NEW

- **Context:**
  - `/context/RfqContext.js` ← NEW

- **Data:**
  - `/public/data/rfq-templates-v2-hierarchical.json` ← NEW

- **API (TODO):**
  - `/pages/api/rfq/create.js` ← NEXT

---

## ✅ Testing Scenarios

### Scenario 1: Guest Submits After Form Refresh
1. Guest selects category & job type
2. Fills some fields
3. Page refreshes (accidental)
4. Returns to form
5. **Expected:** Fields recovered from localStorage ✅
6. Continues filling and submits
7. **Expected:** Email captured in AuthInterceptor ✅

### Scenario 2: Guest Converts to User Mid-Form
1. Guest fills half the form
2. Clicks to login (AuthInterceptor)
3. Creates new account
4. Returns to form
5. **Expected:** All fields still there ✅
6. **Expected:** Form auto-submits or shows success ✅

### Scenario 3: Authenticated User Direct Submit
1. Logged-in user enters RFQ flow
2. No AuthInterceptor shown
3. Fills form
4. Clicks Submit
5. **Expected:** Direct submission (no modal) ✅
6. **Expected:** user.id attached to RFQ ✅

---

## 🔗 Integration Points

**When other components need RFQ data:**

```javascript
import { useRfqContext } from '@/context/RfqContext';

function SomeComponent() {
  const { getAllFormData } = useRfqContext();
  
  // Get complete form data
  const formData = getAllFormData();
  
  // Use for API calls, validation, display, etc
}
```

**When other components need persistence:**

```javascript
import { useRfqFormPersistence } from '@/hooks/useRfqFormPersistence';

function SomeComponent() {
  const { loadFormData, saveFormData } = useRfqFormPersistence();
  
  // Load and save independently
}
```

---

## 📞 Support

For questions on:
- **RfqJobTypeSelector usage** → See component comments
- **Form persistence** → See hook examples
- **Context state management** → See RfqContext examples
- **Auth flow** → See AuthInterceptor examples
- **Template structure** → See JSON file comments

---

**Last Updated:** December 31, 2025  
**Phase:** 2 - Hierarchical System & Guest Mode  
**Status:** Core components complete, API endpoint & modal refactoring pending
