# RFQModal Integration Guide - Quick Reference

## Overview
This guide shows how to integrate the two frontend hooks (`useRFQFormValidation` and `useRFQSubmit`) into the RFQModal component to enable complete RFQ submission flow.

---

## Step 1: Import Hooks

```javascript
import { useRFQFormValidation } from '@/hooks/useRFQFormValidation';
import { useRFQSubmit } from '@/hooks/useRFQSubmit';
```

---

## Step 2: Initialize Hooks in Component

```javascript
function RFQModal({ isOpen, onClose, rfqType = 'direct' }) {
  // Initialize validation hook
  const { validateRFQForm, getFieldError, hasError } = useRFQFormValidation();
  
  // Initialize submit hook
  const { 
    handleSubmit, 
    isLoading, 
    error, 
    success, 
    currentStep,
    clearError,
    resetSubmit
  } = useRFQSubmit();

  // Form state management
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectSummary: '',
    selectedCategory: '',
    county: '',
    town: '',
    budgetMin: '',
    budgetMax: '',
    selectedVendors: [],      // For Direct RFQ
    visibilityScope: 'county', // For Public RFQ
    selectedVendor: '',        // For Vendor Request
    templateFields: {},
    draftSavedAt: null
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState([]);

  // ... rest of component
}
```

---

## Step 3: Form Change Handler with Real-Time Validation

```javascript
const handleFormChange = (fieldName, value) => {
  const updatedFormData = {
    ...formData,
    [fieldName]: value
  };
  setFormData(updatedFormData);

  // Real-time validation (optional)
  const validation = validateRFQForm(updatedFormData, rfqType, categoryFields);
  setValidationErrors(validation.errors);
};
```

---

## Step 4: Form Submission Handler

```javascript
const handleFormSubmit = async (e) => {
  e.preventDefault();

  // Callback when verification is needed
  const onVerificationNeeded = () => {
    // Show verification modal
    setShowVerificationModal(true);
  };

  // Callback when payment is needed
  const onPaymentNeeded = (amount, formDataSnapshot, type, fields) => {
    // Show payment modal
    setPaymentAmount(amount);
    setShowPaymentModal(true);
    // Save form data for after payment
    setSavedFormData(formDataSnapshot);
    setSavedRFQType(type);
    setSavedCategoryFields(fields);
  };

  // Callback on successful submission
  const onSuccess = (rfqId) => {
    // Show success message
    showToast(`RFQ ${rfqId} created successfully!`);
  };

  // Call submit handler
  const result = await handleSubmit(
    formData,
    rfqType,
    categoryFields, // Array of category-specific fields
    onVerificationNeeded,
    onPaymentNeeded,
    onSuccess
  );

  if (!result.success) {
    setValidationErrors(result.details || [result.error]);
  }
};
```

---

## Step 5: Render Form with Validation Feedback

```javascript
// Render form fields with error display
<form onSubmit={handleFormSubmit}>
  {/* Error message display */}
  {error && (
    <div className="alert alert-error">
      <span>{error}</span>
      <button onClick={clearError}>Dismiss</button>
    </div>
  )}

  {/* Project Title Field */}
  <input
    type="text"
    placeholder="Project title"
    value={formData.projectTitle}
    onChange={(e) => handleFormChange('projectTitle', e.target.value)}
    className={hasError(validationErrors, 'title') ? 'input-error' : ''}
  />
  {hasError(validationErrors, 'title') && (
    <span className="error-text">
      {getFieldError(validationErrors, 'title')}
    </span>
  )}

  {/* Project Summary Field */}
  <textarea
    placeholder="Project summary"
    value={formData.projectSummary}
    onChange={(e) => handleFormChange('projectSummary', e.target.value)}
    className={hasError(validationErrors, 'summary') ? 'input-error' : ''}
  />
  {hasError(validationErrors, 'summary') && (
    <span className="error-text">
      {getFieldError(validationErrors, 'summary')}
    </span>
  )}

  {/* Category Dropdown */}
  <select
    value={formData.selectedCategory}
    onChange={(e) => {
      handleFormChange('selectedCategory', e.target.value);
      // Update category fields when category changes
      updateCategoryFields(e.target.value);
    }}
    className={hasError(validationErrors, 'category') ? 'input-error' : ''}
  >
    <option value="">Select Category</option>
    {categories.map(cat => (
      <option key={cat.slug} value={cat.slug}>{cat.name}</option>
    ))}
  </select>
  {hasError(validationErrors, 'category') && (
    <span className="error-text">
      {getFieldError(validationErrors, 'category')}
    </span>
  )}

  {/* County */}
  <input
    type="text"
    placeholder="County"
    value={formData.county}
    onChange={(e) => handleFormChange('county', e.target.value)}
    className={hasError(validationErrors, 'county') ? 'input-error' : ''}
  />
  {hasError(validationErrors, 'county') && (
    <span className="error-text">
      {getFieldError(validationErrors, 'county')}
    </span>
  )}

  {/* Town */}
  <input
    type="text"
    placeholder="Town"
    value={formData.town}
    onChange={(e) => handleFormChange('town', e.target.value)}
    className={hasError(validationErrors, 'town') ? 'input-error' : ''}
  />
  {hasError(validationErrors, 'town') && (
    <span className="error-text">
      {getFieldError(validationErrors, 'town')}
    </span>
  )}

  {/* Budget Min */}
  <input
    type="number"
    placeholder="Min Budget"
    value={formData.budgetMin}
    onChange={(e) => handleFormChange('budgetMin', e.target.value)}
    className={hasError(validationErrors, 'budget') ? 'input-error' : ''}
  />

  {/* Budget Max */}
  <input
    type="number"
    placeholder="Max Budget"
    value={formData.budgetMax}
    onChange={(e) => handleFormChange('budgetMax', e.target.value)}
    className={hasError(validationErrors, 'budget') ? 'input-error' : ''}
  />
  {hasError(validationErrors, 'budget') && (
    <span className="error-text">
      {getFieldError(validationErrors, 'budget')}
    </span>
  )}

  {/* TYPE-SPECIFIC FIELDS */}

  {/* For Direct RFQ: Vendor Selection */}
  {rfqType === 'direct' && (
    <div>
      <label>Select Vendors</label>
      {vendors.map(vendor => (
        <label key={vendor.id}>
          <input
            type="checkbox"
            checked={formData.selectedVendors.includes(vendor.id)}
            onChange={(e) => {
              const updatedVendors = e.target.checked
                ? [...formData.selectedVendors, vendor.id]
                : formData.selectedVendors.filter(v => v !== vendor.id);
              handleFormChange('selectedVendors', updatedVendors);
            }}
          />
          {vendor.name}
        </label>
      ))}
      {hasError(validationErrors, 'vendor') && (
        <span className="error-text">
          {getFieldError(validationErrors, 'vendor')}
        </span>
      )}
    </div>
  )}

  {/* For Public RFQ: Visibility Scope */}
  {rfqType === 'public' && (
    <div>
      <label>Visibility Scope</label>
      <select
        value={formData.visibilityScope}
        onChange={(e) => handleFormChange('visibilityScope', e.target.value)}
      >
        <option value="county">County Only</option>
        <option value="nationwide">Nationwide</option>
      </select>
      {hasError(validationErrors, 'visibility') && (
        <span className="error-text">
          {getFieldError(validationErrors, 'visibility')}
        </span>
      )}
    </div>
  )}

  {/* For Vendor Request: Single Vendor Selection */}
  {rfqType === 'vendor-request' && (
    <div>
      <label>Select Vendor</label>
      <select
        value={formData.selectedVendor}
        onChange={(e) => handleFormChange('selectedVendor', e.target.value)}
      >
        <option value="">Choose a vendor...</option>
        {vendors.map(vendor => (
          <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
        ))}
      </select>
      {hasError(validationErrors, 'vendor') && (
        <span className="error-text">
          {getFieldError(validationErrors, 'vendor')}
        </span>
      )}
    </div>
  )}

  {/* TEMPLATE FIELDS (Category-Specific) */}
  {categoryFields.map(field => (
    <div key={field.name}>
      <label>{field.label}</label>
      {field.type === 'text' && (
        <input
          type="text"
          value={formData.templateFields[field.name] || ''}
          onChange={(e) => {
            handleFormChange('templateFields', {
              ...formData.templateFields,
              [field.name]: e.target.value
            });
          }}
          required={field.required}
        />
      )}
      {field.type === 'textarea' && (
        <textarea
          value={formData.templateFields[field.name] || ''}
          onChange={(e) => {
            handleFormChange('templateFields', {
              ...formData.templateFields,
              [field.name]: e.target.value
            });
          }}
          required={field.required}
        />
      )}
      {field.type === 'number' && (
        <input
          type="number"
          value={formData.templateFields[field.name] || ''}
          onChange={(e) => {
            handleFormChange('templateFields', {
              ...formData.templateFields,
              [field.name]: e.target.value
            });
          }}
          required={field.required}
        />
      )}
      {field.type === 'email' && (
        <input
          type="email"
          value={formData.templateFields[field.name] || ''}
          onChange={(e) => {
            handleFormChange('templateFields', {
              ...formData.templateFields,
              [field.name]: e.target.value
            });
          }}
          required={field.required}
        />
      )}
      {field.type === 'phone' && (
        <input
          type="tel"
          value={formData.templateFields[field.name] || ''}
          onChange={(e) => {
            handleFormChange('templateFields', {
              ...formData.templateFields,
              [field.name]: e.target.value
            });
          }}
          required={field.required}
        />
      )}
      {field.type === 'url' && (
        <input
          type="url"
          value={formData.templateFields[field.name] || ''}
          onChange={(e) => {
            handleFormChange('templateFields', {
              ...formData.templateFields,
              [field.name]: e.target.value
            });
          }}
          required={field.required}
        />
      )}
      {field.type === 'select' && (
        <select
          value={formData.templateFields[field.name] || ''}
          onChange={(e) => {
            handleFormChange('templateFields', {
              ...formData.templateFields,
              [field.name]: e.target.value
            });
          }}
          required={field.required}
        >
          <option value="">Select {field.label}</option>
          {field.options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  ))}

  {/* Submit Button with Loading State */}
  <button
    type="submit"
    disabled={isLoading || validationErrors.length > 0}
    className="btn-primary"
  >
    {isLoading ? (
      <>
        <Spinner /> Submitting... ({currentStep})
      </>
    ) : (
      'Submit RFQ'
    )}
  </button>
</form>
```

---

## Step 6: Handle Modal Callbacks

```javascript
// Verification Modal Callback
const [showVerificationModal, setShowVerificationModal] = useState(false);

// When handleSubmit triggers onVerificationNeeded
<VerificationModal
  isOpen={showVerificationModal}
  onClose={() => setShowVerificationModal(false)}
  onComplete={() => {
    setShowVerificationModal(false);
    // Re-attempt submission after verification
    handleFormSubmit({ preventDefault: () => {} });
  }}
/>

// Payment Modal Callback
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [paymentAmount, setPaymentAmount] = useState(0);
const [savedFormData, setSavedFormData] = useState(null);

// When handleSubmit triggers onPaymentNeeded
<PaymentModal
  isOpen={showPaymentModal}
  amount={paymentAmount}
  onClose={() => setShowPaymentModal(false)}
  onPaymentComplete={() => {
    setShowPaymentModal(false);
    // Re-submit after payment
    if (savedFormData) {
      handleFormSubmit({ preventDefault: () => {} });
    }
  }}
/>
```

---

## Step 7: Handle Close/Reset

```javascript
const handleModalClose = () => {
  // Clear form state
  setFormData({
    projectTitle: '',
    projectSummary: '',
    selectedCategory: '',
    county: '',
    town: '',
    budgetMin: '',
    budgetMax: '',
    selectedVendors: [],
    visibilityScope: 'county',
    selectedVendor: '',
    templateFields: {},
    draftSavedAt: null
  });

  // Clear errors
  setValidationErrors([]);
  clearError();

  // Reset submit state
  resetSubmit();

  // Close modal
  onClose();
};
```

---

## Complete Component Skeleton

```javascript
import React, { useState } from 'react';
import { useRFQFormValidation } from '@/hooks/useRFQFormValidation';
import { useRFQSubmit } from '@/hooks/useRFQSubmit';

export function RFQModal({ isOpen, onClose, rfqType = 'direct' }) {
  // Hooks
  const { validateRFQForm, getFieldError, hasError } = useRFQFormValidation();
  const { handleSubmit, isLoading, error, success, currentStep, clearError, resetSubmit } = useRFQSubmit();

  // State
  const [formData, setFormData] = useState({...});
  const [validationErrors, setValidationErrors] = useState([]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Handlers
  const handleFormChange = (fieldName, value) => {...};
  const handleFormSubmit = async (e) => {...};
  const handleModalClose = () => {...};

  // Render
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-header">
        <h2>{rfqType.toUpperCase()} RFQ</h2>
        <button onClick={handleModalClose}>✕</button>
      </div>
      <div className="modal-body">
        <form onSubmit={handleFormSubmit}>
          {/* Form fields with validation */}
          {/* ... (see Step 5) */}
        </form>
      </div>
    </div>
  );
}
```

---

## Common Patterns

### Check if user is verified before showing form
```javascript
const [userVerified, setUserVerified] = useState(false);

useEffect(() => {
  const checkVerification = async () => {
    const response = await fetch('/api/rfq/check-eligibility', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    });
    const data = await response.json();
    setUserVerified(data.eligible);
  };
  
  if (userId) checkVerification();
}, [userId]);

{!userVerified && <p>Please verify your email and phone before submitting an RFQ</p>}
```

### Load category-specific fields
```javascript
const [categoryFields, setCategoryFields] = useState([]);

const updateCategoryFields = async (categorySlug) => {
  const response = await fetch(`/api/categories/${categorySlug}`);
  const data = await response.json();
  setCategoryFields(data.template_fields || []);
};
```

### Show loading state during each step
```javascript
<div className="step-indicator">
  <Step active={currentStep === 'validating'}>Validating...</Step>
  <Step active={currentStep === 'checking-auth'}>Checking auth...</Step>
  <Step active={currentStep === 'checking-eligibility'}>Checking eligibility...</Step>
  <Step active={currentStep === 'submitting'}>Submitting...</Step>
</div>
```

---

## Testing Integration

Test the integrated RFQModal:
1. Open RFQModal for each RFQ type (direct, wizard, public, vendor-request)
2. Try submitting with invalid data → Validation errors show
3. Try submitting as unverified user → Verification modal shows
4. Try submitting over quota → Payment modal shows
5. Submit valid RFQ → Redirects to `/rfq/{rfqId}`
6. Check database that RFQ and recipients created correctly
