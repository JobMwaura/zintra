# Unified RFQ Modal - Implementation Architecture

**Date:** January 1, 2026  
**Version:** 1.0  
**Status:** Technical Architecture  
**Audience:** Frontend developers

---

## Overview

This document outlines the component structure, state management, and API contracts for the unified RFQ modal supporting Direct, Wizard, and Public RFQ types.

---

## 1. Component Hierarchy

```
RFQModal (container)
├── StepIndicator (shared)
├── StepContent (dynamic)
│   ├── StepCategory (Step 1)
│   ├── StepTemplate (Step 2)
│   ├── StepGeneral (Step 3)
│   ├── StepRecipients (Step 4 - type-specific)
│   │   ├── DirectRecipients (4A)
│   │   ├── WizardRecipients (4B)
│   │   └── PublicRecipients (4C)
│   ├── StepAuth (Step 5)
│   ├── StepReview (Step 6)
│   └── StepSuccess (Step 7)
├── ModalFooter (navigation buttons)
└── ModalHeader (title, subtitle, close)
```

---

## 2. Root Component: `RFQModal.jsx`

### File Location
```
/components/RFQModal.jsx
```

### Responsibilities
- Manage modal open/close state
- Manage current step navigation
- Manage form data (all steps)
- Render correct step component based on `currentStep`
- Pass data & callbacks to child components
- Handle form submission

### Component Structure

```javascript
export default function RFQModal({ rfqType, isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState('category');
  const [formData, setFormData] = useState({
    // Step 1
    selectedCategory: '',
    selectedJobType: '',
    
    // Step 2
    templateFields: {},
    
    // Step 3
    projectTitle: '',
    projectSummary: '',
    county: '',
    town: '',
    directions: '',
    budgetMin: '',
    budgetMax: '',
    budgetLevel: '',
    desiredStartDate: '',
    
    // Step 4 - varies by type
    selectedVendors: [],      // Direct & Wizard
    allowOtherVendors: false, // Wizard
    visibilityScope: 'category', // Public
    responseLimit: 5,         // Public
    
    // Step 5
    user: null,
    
    // Step 7
    rfqId: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [templateFieldsMetadata, setTemplateFieldsMetadata] = useState([]);

  // Effect: Load categories & templates on mount
  // Effect: Load vendors on mount
  // Effect: Load template fields when category/jobType changes

  // Handlers
  const handleNext = () => { /* validate, advance */ };
  const handleBack = () => { /* keep data, go back */ };
  const handleSubmit = () => { /* POST /api/rfq/create */ };

  // Render
  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <ModalHeader 
          rfqType={rfqType}
          onClose={onClose}
        />
        
        <StepIndicator 
          currentStep={currentStep}
          totalSteps={7}
        />
        
        <div className="modal-content">
          {currentStep === 'category' && <StepCategory {...} />}
          {currentStep === 'template' && <StepTemplate {...} />}
          {currentStep === 'general' && <StepGeneral {...} />}
          {currentStep === 'recipients' && (
            rfqType === 'direct' ? <DirectRecipients {...} /> :
            rfqType === 'wizard' ? <WizardRecipients {...} /> :
            <PublicRecipients {...} />
          )}
          {currentStep === 'auth' && <StepAuth {...} />}
          {currentStep === 'review' && <StepReview {...} />}
          {currentStep === 'success' && <StepSuccess {...} />}
        </div>
        
        <ModalFooter
          currentStep={currentStep}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
}
```

### Key State Transitions

```javascript
const steps = ['category', 'template', 'general', 'recipients', 'auth', 'review', 'success'];

function advanceStep() {
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex < steps.length - 1) {
    setCurrentStep(steps[currentIndex + 1]);
  }
}

function goBackStep() {
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex > 0) {
    setCurrentStep(steps[currentIndex - 1]);
  }
}
```

---

## 3. Shared Steps (1-3)

### Step 1: `StepCategory.jsx`

**File Location:** `/components/RFQModal/StepCategory.jsx`

**Props:**
```javascript
{
  selectedCategory: string,
  selectedJobType: string,
  categories: Array,        // from getAllCategories()
  jobTypes: Array,          // for current category
  onCategoryChange: (cat: string) => void,
  onJobTypeChange: (jt: string) => void,
  errors: Object,
}
```

**Render:**
```
- Grid of 20 category cards (responsive)
- Each card: icon + title, clickable
- Selected card: orange border + description below
- Job type radio list appears when category is selected
- Errors show below each section if present
```

**Validation:**
```javascript
const isValid = selectedCategory && selectedJobType;
```

---

### Step 2: `StepTemplate.jsx`

**File Location:** `/components/RFQModal/StepTemplate.jsx`

**Props:**
```javascript
{
  templateFields: Object,    // { fieldName: value }
  fieldMetadata: Array,      // from getFieldsForJobType()
  onFieldChange: (name: string, value: any) => void,
  errors: Object,
}
```

**Render:**
```
- Header: "Tell us more about your [jobType]"
- For each field in fieldMetadata:
  - Use TemplateFieldRenderer component
  - Pass field definition, value, onChange, error
- If no fields: show message "No additional fields required"
```

**Validation:**
```javascript
const validateTemplate = (fields, metadata) => {
  const errors = {};
  metadata.forEach(field => {
    if (field.required && !fields[field.name]) {
      errors[field.name] = 'Required';
    }
  });
  return errors;
};
```

---

### Step 3: `StepGeneral.jsx`

**File Location:** `/components/RFQModal/StepGeneral.jsx`

**Props:**
```javascript
{
  projectTitle: string,
  projectSummary: string,
  county: string,
  town: string,
  directions: string,
  budgetMin: string,
  budgetMax: string,
  budgetLevel: string,
  desiredStartDate: string,
  counties: Array,          // dropdown options
  onFieldChange: (name: string, value: string) => void,
  errors: Object,
}
```

**Render:**
```
Section 1: Project Basics
  - Project title (text)
  - Project summary (textarea)

Section 2: Location
  - County dropdown (required)
  - Town input (required)
  - Directions textarea (optional)

Section 3: Budget & Timing
  - Budget min (number, required)
  - Budget max (number, required)
  - Budget level (radio)
  - Desired start date (select or date picker)
```

**Validation:**
```javascript
const validateGeneral = (data) => {
  const errors = {};
  if (!data.county) errors.county = 'Required';
  if (!data.town) errors.town = 'Required';
  if (!data.budgetMin) errors.budgetMin = 'Required';
  if (!data.budgetMax) errors.budgetMax = 'Required';
  if (parseInt(data.budgetMin) > parseInt(data.budgetMax)) {
    errors.budgetMin = 'Min must be less than max';
  }
  return errors;
};
```

---

## 4. Type-Specific Step 4

### Base: `StepRecipients.jsx`

**File Location:** `/components/RFQModal/StepRecipients.jsx`

Routes to type-specific component:

```javascript
export default function StepRecipients({ rfqType, ...props }) {
  if (rfqType === 'direct') return <DirectRecipients {...props} />;
  if (rfqType === 'wizard') return <WizardRecipients {...props} />;
  if (rfqType === 'public') return <PublicRecipients {...props} />;
}
```

---

### 4A. `DirectRecipients.jsx`

**File Location:** `/components/RFQModal/DirectRecipients.jsx`

**Props:**
```javascript
{
  selectedVendors: string[],        // vendor IDs
  onVendorToggle: (vendorId: string) => void,
  vendors: Array,                   // all vendors
  category: string,                 // for filtering
  errors: Object,
}
```

**Render:**
```
- Header: "Choose vendors to send this RFQ to"
- Search/filter bar
- Vendor list with checkboxes
  - Show: name, location, rating, verified badge, categories
- Info banner: "You can send to up to 10 vendors"
- Selected count display
```

**Validation:**
```javascript
const isValid = selectedVendors.length >= 1;
```

---

### 4B. `WizardRecipients.jsx`

**File Location:** `/components/RFQModal/WizardRecipients.jsx`

**Props:**
```javascript
{
  selectedVendors: string[],
  allowOtherVendors: boolean,
  onVendorToggle: (vendorId: string) => void,
  onAllowOthersChange: (bool: boolean) => void,
  vendors: Array,                   // pre-filtered recommended
  category: string,
  county: string,
  errors: Object,
}
```

**Render:**
```
- Header: "We'll match you to the right vendors"
- Info banner: "Based on your project, recommended vendors:"
- Pre-filtered vendor list (by category + county)
- Toggle: "Also allow other vetted vendors..."
```

**Pre-filtering Logic (in parent RFQModal):**
```javascript
const recommendedVendors = vendors.filter(v =>
  v.categories.includes(selectedCategory) &&
  (v.county === selectedCounty || v.nearby.includes(selectedCounty))
);
```

**Validation:**
```javascript
const isValid = selectedVendors.length >= 1 || allowOtherVendors;
```

---

### 4C. `PublicRecipients.jsx`

**File Location:** `/components/RFQModal/PublicRecipients.jsx`

**Props:**
```javascript
{
  visibilityScope: 'category' | 'category_nearby',
  responseLimit: 5 | 10 | 999,
  onVisibilityScopeChange: (scope: string) => void,
  onResponseLimitChange: (limit: number) => void,
  category: string,
  county: string,
  errors: Object,
}
```

**Render:**
```
- Header: "Public RFQ visibility"
- Info banner: "Your RFQ will be visible to relevant vendors"
- Visibility scope radio options
- Response limit radio options
```

**Validation:**
```javascript
const isValid = visibilityScope && responseLimit;
// No vendor selection needed (public posting)
```

---

## 5. Authentication & Limits: `StepAuth.jsx`

**File Location:** `/components/RFQModal/StepAuth.jsx`

**Props:**
```javascript
{
  user: User | null,
  onAuthComplete: (user: User) => void,
  rfqData: Object,            // for payment summary
  errors: Object,
}
```

**Logic:**
```javascript
useEffect(() => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Check RFQ limit
    const rfqCount = await countRFQsThisMonth(user.id);
    if (rfqCount < 3) {
      // Skip to review
      onAuthComplete(user);
    } else {
      // Show payment UI
    }
  }
}, []);
```

**Render (Not Logged In):**
```
- Tabs: [Log In] [Create Account] [Continue as Guest]
- Email, password, phone inputs
- Terms checkbox
```

**Render (Over Limit):**
```
- RFQ summary
- "Cost: KES 300"
- Button: "Pay KES 300 & Send RFQ"
- Button: "Save Draft"
```

---

## 6. Review: `StepReview.jsx`

**File Location:** `/components/RFQModal/StepReview.jsx`

**Props:**
```javascript
{
  rfqType: 'direct' | 'wizard' | 'public',
  formData: Object,           // all collected data
  templateFieldsMetadata: Array,
  vendors: Array,             // for Direct/Wizard
}
```

**Render:**
```
2-Column Layout (desktop):

Left: Project Summary
  - Title, category, job type
  - Location, budget, timeline
  - Key template fields (3-5 most important)

Right: Recipients (varies by type)
  - Direct: List of selected vendors
  - Wizard: "Recommended + open to others"
  - Public: Visibility scope + response limit
```

**Helper Function:**
```javascript
const getRelevantTemplateFields = (metadata, data) => {
  // Get 3-5 most important fields to show
  return metadata
    .filter(f => f.priority || f.required)
    .slice(0, 5)
    .map(f => ({
      label: f.label,
      value: data.templateFields[f.name]
    }));
};
```

---

## 7. Success: `StepSuccess.jsx`

**File Location:** `/components/RFQModal/StepSuccess.jsx`

**Props:**
```javascript
{
  rfqType: 'direct' | 'wizard' | 'public',
  rfqId: string,
  recipientCount: number,     // for Direct
  onViewRFQ: () => void,      // navigate to /rfq/[id]
  onClose: () => void,
}
```

**Render (by type):**
```
Direct:
  "Your RFQ has been sent to X vendor(s).
   You'll be notified when they respond."

Wizard:
  "Your RFQ is now live.
   Vendors will review and respond."

Public:
  "Your RFQ is now posted publicly.
   Vendors will discover and respond."

Buttons:
  - "View RFQ Details"
  - "Close Modal"
  - "Back to Home"
```

---

## 8. Supporting Components

### `StepIndicator.jsx`

```javascript
export default function StepIndicator({ currentStep, totalSteps }) {
  const steps = ['Category', 'Details', 'Project', 'Recipients', 'Auth', 'Review', 'Success'];
  
  return (
    <div className="step-indicator">
      {steps.map((name, idx) => (
        <div key={idx} className={`step ${idx < currentStep ? 'completed' : idx === currentStep ? 'active' : ''}`}>
          <div className="step-number">{idx < currentStep ? '✓' : idx + 1}</div>
          <div className="step-name">{name}</div>
        </div>
      ))}
    </div>
  );
}
```

### `ModalHeader.jsx`

```javascript
export default function ModalHeader({ rfqType, onClose }) {
  const titles = {
    direct: 'Send Direct RFQ',
    wizard: 'Smart RFQ (Let Zintra Match Vendors)',
    public: 'Post Public RFQ',
  };
  
  const subtitles = {
    direct: 'Select specific vendors you trust',
    wizard: "We'll find the right vendors for you",
    public: 'Post your project and let vendors find you',
  };
  
  return (
    <div className="modal-header">
      <h2>{titles[rfqType]}</h2>
      <p>{subtitles[rfqType]}</p>
      <button onClick={onClose} className="close-btn">×</button>
    </div>
  );
}
```

### `ModalFooter.jsx`

```javascript
export default function ModalFooter({
  currentStep,
  onBack,
  onNext,
  onSubmit,
  loading,
  isValid,
}) {
  const stepIndex = ['category', 'template', 'general', 'recipients', 'auth', 'review', 'success'].indexOf(currentStep);
  
  return (
    <div className="modal-footer">
      {stepIndex > 0 && (
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>
      )}
      
      {stepIndex < 6 ? (
        <button onClick={onNext} disabled={!isValid} className="btn-primary">
          Next →
        </button>
      ) : (
        <button onClick={onSubmit} disabled={loading} className="btn-primary">
          {loading ? 'Sending...' : 'Send RFQ'}
        </button>
      )}
    </div>
  );
}
```

---

## 9. API Contracts

### POST /api/rfq/create

**Request:**
```javascript
{
  rfqType: 'direct' | 'wizard' | 'public',
  title: string,
  description: string,
  category: string,
  jobType: string,
  county: string,
  town: string,
  directions: string,
  budgetMin: number,
  budgetMax: number,
  budgetLevel: string,
  desiredStartDate: string,
  details: Object,                // template fields as JSON
  
  // Varies by type:
  // Direct: { selectedVendors: string[] }
  // Wizard: { selectedVendors: string[], allowOtherVendors: boolean }
  // Public: { visibilityScope: string, responseLimit: number }
}
```

**Response:**
```javascript
{
  id: string,                     // RFQ ID
  url: string,                    // /rfq/[id]
  message: string,
  recipientCount: number,         // for Direct/Wizard
}
```

**Error:**
```javascript
{
  error: string,
  field?: string,                 // for field-specific errors
}
```

---

## 10. Utility Functions

### File: `/lib/rfqModalUtils.js`

```javascript
// Load all categories (already exists)
export const getAllCategories = async () => { ... };

// Load job types for category (already exists)
export const getJobTypesForCategory = async (category) => { ... };

// Load template fields for job type (already exists)
export const getFieldsForJobType = async (category, jobType) => { ... };

// Validate step-specific data
export const validateCategory = (category, jobType) => {
  if (!category) return { error: 'Category required' };
  if (!jobType) return { error: 'Job type required' };
  return { valid: true };
};

export const validateTemplate = (fields, metadata) => {
  const errors = {};
  metadata.forEach(field => {
    if (field.required && !fields[field.name]) {
      errors[field.name] = 'Required';
    }
  });
  return Object.keys(errors).length === 0 ? { valid: true } : { errors };
};

export const validateGeneral = (data) => {
  const errors = {};
  if (!data.county) errors.county = 'Required';
  if (!data.town) errors.town = 'Required';
  if (!data.budgetMin) errors.budgetMin = 'Required';
  if (!data.budgetMax) errors.budgetMax = 'Required';
  if (parseInt(data.budgetMin) > parseInt(data.budgetMax)) {
    errors.budgetMin = 'Min must be less than max';
  }
  return Object.keys(errors).length === 0 ? { valid: true } : { errors };
};

export const validateRecipients = (data, rfqType) => {
  if (rfqType === 'direct' || rfqType === 'wizard') {
    if (!data.selectedVendors?.length && rfqType === 'direct') {
      return { errors: { vendors: 'Select at least one vendor' } };
    }
    if (!data.selectedVendors?.length && !data.allowOtherVendors && rfqType === 'wizard') {
      return { errors: { vendors: 'Select vendor or allow others' } };
    }
  }
  return { valid: true };
};

// Filter vendors by category and location
export const filterRecommendedVendors = (vendors, category, county) => {
  return vendors.filter(v =>
    v.categories?.includes(category) &&
    (v.county === county || v.nearby?.includes(county))
  );
};

// Count user's RFQs this month
export const countRFQsThisMonth = async (userId) => {
  const monthStart = new Date();
  monthStart.setDate(1);
  
  const { count } = await supabase
    .from('rfqs')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString());
  
  return count || 0;
};
```

---

## 11. Styling Strategy

### File: `/styles/RFQModal.module.css`

**Key Classes:**
```css
.modal-overlay {
  /* Full-screen overlay */
}

.modal-panel {
  /* Centered panel, 600px desktop, full-height mobile */
}

.modal-header {
  /* Sticky at top */
}

.modal-content {
  /* Scrollable content area */
}

.modal-footer {
  /* Sticky at bottom */
}

.step-category-grid {
  /* 3-column grid on desktop, responsive */
}

.category-card {
  /* Clickable card with hover/select states */
}

.vendor-card {
  /* Checkbox + vendor info */
}

.section {
  /* Spacing between form sections */
}

.form-group {
  /* Label + input wrapper */
}

.error-message {
  /* Red text below field */
}

.info-banner {
  /* Blue background info box */
}
```

---

## 12. State Management Pattern

Use React Context for shared state:

```javascript
// /context/RFQModalContext.js
export const RFQModalContext = createContext();

export function RFQModalProvider({ children }) {
  const [state, dispatch] = useReducer(rfqModalReducer, initialState);
  
  return (
    <RFQModalContext.Provider value={{ state, dispatch }}>
      {children}
    </RFQModalContext.Provider>
  );
}

// Use in components:
const { state, dispatch } = useContext(RFQModalContext);
```

Or use Zustand for simpler global state:

```javascript
// /store/rfqModalStore.js
export const useRFQModalStore = create((set) => ({
  isOpen: false,
  rfqType: 'direct',
  currentStep: 'category',
  formData: { ... },
  
  setOpen: (open) => set({ isOpen: open }),
  setStep: (step) => set({ currentStep: step }),
  updateForm: (data) => set(state => ({
    formData: { ...state.formData, ...data }
  })),
}));
```

---

## 13. Testing Strategy

### Unit Tests
- [ ] Validation functions (validateCategory, validateTemplate, etc.)
- [ ] Utility functions (filterRecommendedVendors, countRFQsThisMonth, etc.)

### Component Tests
- [ ] Each step component renders correctly
- [ ] Form inputs update state
- [ ] Errors display on invalid input
- [ ] Navigation buttons work (next/back)

### E2E Tests
- [ ] Direct flow: category → template → general → vendors → auth → review → success
- [ ] Wizard flow: category → template → general → suggested vendors → auth → review → success
- [ ] Public flow: category → template → general → visibility → auth → review → success

### Edge Cases
- [ ] User cancels mid-flow
- [ ] User changes category (reset template fields)
- [ ] Over RFQ limit (show payment UI)
- [ ] Network error during submission
- [ ] Very long form data (ensure doesn't break layout)

---

## 14. Performance Optimizations

1. **Lazy load vendor list** – Only load on Step 4
2. **Memoize category grid** – Expensive to re-render
3. **Debounce vendor search** – Reduce filter operations
4. **Cache template JSON** – Already done in rfqTemplateUtils
5. **Code-split modal** – Load only when modal opens
6. **Image optimization** – Compress vendor logos

```javascript
// Code split example
const RFQModal = lazy(() => import('@/components/RFQModal'));

// In page:
<Suspense fallback={<LoadingSpinner />}>
  <RFQModal rfqType="direct" isOpen={isOpen} onClose={handleClose} />
</Suspense>
```

---

## 15. Accessibility

- [ ] Modal has proper ARIA labels
- [ ] Keyboard navigation (tab, enter, escape)
- [ ] Color contrast meets WCAG AA
- [ ] Form labels associated with inputs
- [ ] Error messages linked to fields via aria-describedby
- [ ] Step indicator updates aria-current
- [ ] Focus management (trap focus in modal)

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create `/components/RFQModal.jsx` (container)
- [ ] Create `/components/RFQModal/StepIndicator.jsx`
- [ ] Create `/components/RFQModal/ModalHeader.jsx`
- [ ] Create `/components/RFQModal/ModalFooter.jsx`
- [ ] Set up Context or Zustand for state

### Phase 2: Shared Steps
- [ ] Create `StepCategory.jsx`
- [ ] Create `StepTemplate.jsx`
- [ ] Create `StepGeneral.jsx`
- [ ] Add validation functions

### Phase 3: Type-Specific Steps
- [ ] Create `DirectRecipients.jsx`
- [ ] Create `WizardRecipients.jsx`
- [ ] Create `PublicRecipients.jsx`
- [ ] Add type-specific validation

### Phase 4: Auth & Final Steps
- [ ] Create `StepAuth.jsx`
- [ ] Create `StepReview.jsx`
- [ ] Create `StepSuccess.jsx`

### Phase 5: Backend & Testing
- [ ] Implement `POST /api/rfq/create`
- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Test on mobile

### Phase 6: Polish
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Error handling refinement
- [ ] UX review & feedback

---

**Architecture Status:** ✅ Ready for Development  
**Estimated Dev Time:** 4-5 days  
**Next Step:** Start with Phase 1 (foundation)

