# RFQ Modal Integration Guide - Phase 2b Complete Implementation

## Overview

This guide details how to integrate the hierarchical RFQ system (Phase 2 Core) with the production tweaks (Phase 2 Tweaks) into the three modal interfaces:

1. **DirectRFQModal** - Direct RFQ submission (no vendor selection)
2. **WizardRFQModal** - Guided process with vendor selection
3. **PublicRFQModal** - Public RFQ without vendor pre-selection

---

## Key System Components to Use

### 1. RfqContext (Global State)
```javascript
import { useRfqContext } from '@/context/RfqContext';

// Available from context:
const {
  rfqType,                    // 'direct' | 'wizard' | 'public'
  setRfqType,
  selectedCategory,           // 'architectural', 'structural', etc.
  setSelectedCategory,
  selectedJobType,            // 'arch_new_residential', etc.
  setSelectedJobType,
  templateFields,             // Job-specific fields
  updateTemplateField,
  updateTemplateFields,
  sharedFields,               // Location, budget, date, etc.
  updateSharedField,
  updateSharedFields,
  isGuestMode,
  setUserAuthenticated,       // After login/signup
  guestPhone,
  guestPhoneVerified,         // TWEAK 4: Phone verification status
  currentStep,
  setCurrentStep,
  getAllFormData,
  resetRfq
} = useRfqContext();
```

### 2. Form Persistence Hook (localStorage)
```javascript
import { useRfqFormPersistence } from '@/hooks/useRfqFormPersistence';

const {
  saveFormData,   // Save to localStorage with rfqType key
  loadFormData,   // Load from localStorage with rfqType key
  clearFormData,  // Delete draft after submission
  hasDraft,       // Check if draft exists
  createAutoSave  // Debounced auto-save
} = useRfqFormPersistence();
```

### 3. AuthInterceptor Component (Enhanced with Tweak 4)
```javascript
import AuthInterceptor from '@/components/AuthInterceptor';

<AuthInterceptor
  isOpen={showAuthModal}
  onLoginSuccess={(user) => {
    // User logged in - form data preserved in context
    submitRfq();
  }}
  onGuestSubmit={(email) => {
    // Guest verified phone - submit with email
    submitRfq();
  }}
  onCancel={() => setShowAuthModal(false)}
/>
```

### 4. RfqJobTypeSelector Component (Step 2)
```javascript
import RfqJobTypeSelector from '@/components/RfqJobTypeSelector';

<RfqJobTypeSelector
  jobTypes={templates[selectedCategory].jobTypes}
  onSelect={(jobType) => {
    setSelectedJobType(jobType.slug);
    setCurrentStep('template');
  }}
  selectedJobType={selectedJobType}
/>
```

### 5. RfqFormRenderer Component (Steps 3 & 4)
```javascript
// Renders either template fields OR shared fields depending on step
<RfqFormRenderer
  fields={stepFields}  // From templates
  values={fieldValues}
  onChange={(fieldName, value) => updateField(fieldName, value)}
/>
```

---

## 5-Step RFQ Modal Flow

### Step 1: Category Selection
- User clicks "Get RFQ" button
- Modal opens with RfqCategorySelector
- User selects 1 of 20 categories
- **On Next:** Load job types for that category, move to Step 2
- **Auto-save:** Category selection

### Step 2: Job Type Selection
- Display 3-7 job type options
- User selects 1 job type
- Show job type description
- **On Next:** Load template fields, move to Step 3
- **Auto-save:** Job type selection

### Step 3: Template Fields (Job-Specific)
- Display 6-10 fields specific to job type
- Examples: "Property description", "Number of floors", "Plot size", etc.
- User fills fields (validation: required, type, min/max)
- Progress bar shows 60% complete
- **Auto-save:** Every 2 seconds (debounced)
- **On Next:** Move to Step 4
- **On Back:** Return to Step 2, preserve data

### Step 4: Shared Fields (General Info)
- Display 5 fields (same for ALL categories):
  - Project title (optional)
  - Location (required)
  - Property status (select)
  - Budget range (select)
  - Start date (optional)
- Progress bar shows 80% complete
- **Auto-save:** Every 2 seconds
- **On Next:** Check if authenticated → Show auth modal if guest
- **On Back:** Return to Step 3, preserve data

### Step 5: Auth & Submit
- **If Authenticated:** Direct submit button
- **If Guest:** Show AuthInterceptor modal with:
  - Login option (with email + password)
  - Signup option (with email, password, confirm)
  - Continue as Guest option (with email + phone + OTP verification)
- **Phone Verification (TWEAK 4):** OTP sent and verified before submit
- **On Submit:** Call `/api/rfq/create` endpoint
- **On Success:** Clear localStorage draft, show success message

---

## Implementation Steps for DirectRFQModal

### 1. Modal Structure
```javascript
export default function DirectRFQModal({ isOpen, onClose, onSuccess }) {
  // State management
  const [currentStep, setCurrentStep] = useState('category');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Hooks
  const { useRfqContext, useRfqFormPersistence } = useRFQHooks();
  
  // Render based on step
  switch (currentStep) {
    case 'category': return <CategoryStep />;
    case 'jobtype': return <JobTypeStep />;
    case 'template': return <TemplateStep />;
    case 'shared': return <SharedStep />;
    case 'auth': return <AuthInterceptor ... />;
  }
}
```

### 2. Resume Draft Functionality
```javascript
useEffect(() => {
  if (isOpen && rfqType) {
    // Check if draft exists
    const hasSaved = hasDraft(rfqType, selectedCategory, selectedJobType);
    
    if (hasSaved) {
      const saved = loadFormData(rfqType, selectedCategory, selectedJobType);
      if (saved) {
        // Show "Resume draft?" modal
        showResumeDraftOption(saved);
      }
    }
  }
}, [isOpen, rfqType, selectedCategory, selectedJobType]);
```

### 3. Auto-Save on Field Change
```javascript
useEffect(() => {
  // Create debounced auto-save function
  const autoSave = createAutoSave(2000);
  
  // Call on every field change
  const handleFieldChange = (fieldName, value) => {
    updateTemplateField(fieldName, value);
    autoSave(rfqType, selectedCategory, selectedJobType, templateFields, sharedFields);
  };
  
  return handleFieldChange;
}, [rfqType, selectedCategory, selectedJobType, templateFields, sharedFields]);
```

### 4. Form Submission
```javascript
const handleFinalSubmit = async () => {
  if (isGuestMode) {
    // Show auth modal if guest
    setShowAuthModal(true);
    return;
  }
  
  // Authenticated user - direct submit
  setIsSubmitting(true);
  
  try {
    const formData = getAllFormData();
    
    const response = await fetch('/api/rfq/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        guestPhone: guestPhone,          // TWEAK 4
        guestPhoneVerified: guestPhoneVerified  // TWEAK 4
      })
    });
    
    if (!response.ok) {
      const data = await response.json();
      
      // Handle payment limit (402 Payment Required)
      if (response.status === 402) {
        setError('You\'ve reached your monthly RFQ limit. Please upgrade your plan.');
        return;
      }
      
      setError(data.message || 'Failed to submit RFQ');
      return;
    }
    
    const result = await response.json();
    
    // Clear localStorage draft
    clearFormData(rfqType, selectedCategory, selectedJobType);
    
    // Success!
    onSuccess(result);
    handleClose();
  } finally {
    setIsSubmitting(false);
  }
};
```

### 5. Handle Auth Success
```javascript
const handleAuthSuccess = (user) => {
  setShowAuthModal(false);
  
  // User is now authenticated
  // Form data is preserved in RfqContext
  // Auto-submit or let user confirm
  
  // Option A: Auto-submit
  handleFinalSubmit();
  
  // Option B: Let user confirm
  // showSubmitConfirmation();
};

const handleGuestSubmit = (email) => {
  setShowAuthModal(false);
  
  // Guest submitted with email + verified phone
  // Form data + guest email in context
  
  handleFinalSubmit();
};
```

---

## Key Implementation Details

### TWEAK 2: RFQ Type in Draft Keys
```javascript
// Every save/load uses rfqType in the key
const draftKey = `rfq_draft_${rfqType}_${categorySlug}_${jobTypeSlug}`;

// Example: Draft keys for same category+jobtype but different RFQ types
// 'rfq_draft_direct_architectural_arch_new_residential'
// 'rfq_draft_wizard_architectural_arch_new_residential'
// 'rfq_draft_public_architectural_arch_new_residential'

// This allows users to have separate drafts for each RFQ type!
```

### TWEAK 4: Phone Verification Flow (Guest)
```javascript
// AuthInterceptor now handles phone verification:
// 1. Guest enters email
// 2. Guest enters phone number
// 3. OTP sent to phone
// 4. Guest enters OTP code
// 5. OTP verified → guestPhoneVerified = true
// 6. Form submitted with guestPhoneVerified flag

// In RFQ API endpoint (/pages/api/rfq/create.js):
// - For guests: Require guestPhoneVerified === true
// - For auth users: Check if phone_verified_at is set in database
```

### TWEAK 5: SSR-Safe localStorage
```javascript
// Hook uses: if (typeof window !== 'undefined') { /* localStorage */ }
// This prevents Next.js server-side rendering crashes

// All methods return null/empty on server:
loadFormData() → null  (on server)
saveFormData() → false (on server)
hasDraft() → false     (on server)
```

### TWEAK 3: Payment Enforcement (API Level)
```javascript
// Payment limits are enforced in /api/rfq/create.js
// Not in modals (modals can suggest, but API enforces)

// Response codes:
// 200: Success
// 400: Validation failed
// 402: Payment required (quota limit reached)
// 429: Rate limit exceeded
// 500: Server error
```

---

## Testing Checklist for Each Modal

### DirectRFQModal Tests
- [ ] Load modal → Check for resume draft option
- [ ] Select category → Load job types
- [ ] Select job type → Load template fields
- [ ] Fill template fields → Auto-save every 2 seconds
- [ ] Refresh page → Draft recovered from localStorage
- [ ] Fill shared fields → Auto-save works
- [ ] Click submit → Show auth modal (if guest)
- [ ] Guest path: Email → Phone → OTP verify → Submit
- [ ] Login path: Email/Password → Authenticated → Submit
- [ ] Signup path: Email/Password/Confirm → Authenticated → Submit
- [ ] Check localStorage keys contain rfqType: `rfq_draft_direct_...`

### Guest to Authenticated Transition
- [ ] Guest fills partial form (Step 2)
- [ ] Guest clicks submit → Auth modal shows
- [ ] Guest clicks login → Form data preserved
- [ ] After login → Form data still there
- [ ] Form auto-submits or user clicks submit again
- [ ] RFQ created with user.id (not guest email)

### Payment Limit Enforcement
- [ ] Free user (3 RFQs/month) after 3 RFQs → 402 error
- [ ] Standard user (5 RFQs/month) upgrade → Works
- [ ] Premium user (unlimited) → No limits

### Phone Verification (TWEAK 4)
- [ ] Guest enters phone → Send OTP works
- [ ] OTP expires after 5 minutes → Retry
- [ ] Wrong OTP → Error with attempts left
- [ ] Correct OTP → Verified flag set
- [ ] RFQ submitted without phone → API rejects

---

## File Dependencies

```
DirectRFQModal.js
├── useRfqContext (context/RfqContext.js)
├── useRfqFormPersistence (hooks/useRfqFormPersistence.js)
├── RfqCategorySelector (components/RfqCategorySelector.js)
├── RfqJobTypeSelector (components/RfqJobTypeSelector.js)
├── RfqFormRenderer (components/RfqFormRenderer.js)
├── AuthInterceptor (components/AuthInterceptor.js) [ENHANCED]
├── rfq-templates-v2-hierarchical.json (public/data/)
└── /api/rfq/create.js (pages/api/rfq/) [NEW]
```

---

## Migration Guide (If Updating Existing Modals)

If you have existing modals that need updating:

### Step 1: Replace Modal Body
```javascript
// Old: Single step form
// New: 5-step flow with context

// Before:
function OldModal() {
  const [formData, setFormData] = useState({});
  // ... local state management
}

// After:
function NewModal() {
  const { rfqType, selectedCategory, ... } = useRfqContext();
  // ... use context for all state
}
```

### Step 2: Add RFQ Type
```javascript
// Modal must set rfqType on mount
useEffect(() => {
  setRfqType('direct'); // or 'wizard' or 'public'
}, []);
```

### Step 3: Implement Steps
```javascript
// Add step component for each:
- CategoryStep
- JobTypeStep
- TemplateStep
- SharedStep
- (AuthInterceptor handles auth step)
```

### Step 4: Add Auto-Save
```javascript
// Use hook's createAutoSave function
const autoSave = createAutoSave(2000);

// Call on field changes
autoSave(rfqType, selectedCategory, selectedJobType, templateFields, sharedFields);
```

---

## Common Issues & Solutions

### Issue 1: Draft Not Loading
**Problem:** User navigates away and returns, draft not found

**Solution:**
```javascript
// Check SSR guard
if (!isInitialized()) {
  // Still on server, wait for hydration
  return null;
}

// Load draft
const saved = loadFormData(rfqType, category, jobType);
```

### Issue 2: Phone Verification Fails
**Problem:** OTP send/verify API returns error

**Solution:**
```javascript
// Check SMS provider configured in .env.local
// Check SMS rate limit (3 sends per 15 min)
// Check phone format (10-15 digits)
// In development, set SMS_PROVIDER=mock
```

### Issue 3: Payment Limit Not Enforced
**Problem:** User submits more than quota allows

**Solution:**
```javascript
// Payment enforcement is API-only, not modal
// Modal receives 402 Payment Required response
// Show user upgrade prompt

if (response.status === 402) {
  showUpgradeModal();
}
```

---

## Deployment Checklist

- [ ] All three modals refactored (Direct, Wizard, Public)
- [ ] Phone OTP endpoints tested (/api/auth/send-sms-otp, /api/auth/verify-sms-otp)
- [ ] RFQ create endpoint tested (/api/rfq/create)
- [ ] SMS provider configured (.env.local)
- [ ] Database migrations run
- [ ] LocalStorage draft recovery tested
- [ ] Guest-to-auth transition tested
- [ ] Payment limits tested
- [ ] Rate limiting verified
- [ ] E2E tests passing
- [ ] Staging deployment complete
- [ ] Production ready

---

## Quick Start Code Template

```javascript
import React, { useState, useEffect } from 'react';
import { useRfqContext } from '@/context/RfqContext';
import { useRfqFormPersistence } from '@/hooks/useRfqFormPersistence';
import RfqCategorySelector from '@/components/RfqCategorySelector';
import RfqJobTypeSelector from '@/components/RfqJobTypeSelector';
import AuthInterceptor from '@/components/AuthInterceptor';

export default function DirectRFQModal({ isOpen, onClose, onSuccess }) {
  const { rfqType, setRfqType, currentStep, setCurrentStep, ... } = useRfqContext();
  const { saveFormData, loadFormData, clearFormData, createAutoSave } = useRfqFormPersistence();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setRfqType('direct');
      setCurrentStep('category');
    }
  }, [isOpen]);
  
  // Handle step navigation
  const handleNext = async () => {
    switch (currentStep) {
      case 'category': setCurrentStep('jobtype'); break;
      case 'jobtype': setCurrentStep('template'); break;
      case 'template': setCurrentStep('shared'); break;
      case 'shared': handleSubmit(); break;
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (isGuestMode) {
      setShowAuthModal(true);
      return;
    }
    
    await submitRfq();
  };
  
  // Render current step
  return (
    <div className={`modal ${isOpen ? 'open' : 'closed'}`}>
      {currentStep === 'category' && <CategoryStep />}
      {currentStep === 'jobtype' && <JobTypeStep />}
      {currentStep === 'template' && <TemplateStep />}
      {currentStep === 'shared' && <SharedStep />}
      
      <AuthInterceptor
        isOpen={showAuthModal}
        onLoginSuccess={handleAuthSuccess}
        onGuestSubmit={handleGuestSubmit}
        onCancel={() => setShowAuthModal(false)}
      />
    </div>
  );
}
```

---

This guide provides everything needed to implement the complete Phase 2b modal refactoring with all tweaks integrated!
