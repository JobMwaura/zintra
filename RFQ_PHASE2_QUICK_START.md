# RFQ Phase 2 Quick Integration Guide

## 🚀 Getting Started (5 Minutes)

### Step 1: Set Up RfqProvider

Wrap your app with RfqProvider in `pages/_app.js`:

```javascript
import { RfqProvider } from '@/context/RfqContext';

function MyApp({ Component, pageProps }) {
  return (
    <RfqProvider>
      <Component {...pageProps} />
    </RfqProvider>
  );
}

export default MyApp;
```

### Step 2: Import Templates Data

Load the new hierarchical templates:

```javascript
// In your component
import templates from '@/public/data/rfq-templates-v2-hierarchical.json';

function RfqForm() {
  const { majorCategories, sharedGeneralFields } = templates;
  
  // majorCategories = array of 20 categories with jobTypes
  // sharedGeneralFields = array of 5 shared fields
  
  return (
    // Your form UI
  );
}
```

### Step 3: Create Two-Level Selection Flow

```javascript
import { useRfqContext } from '@/context/RfqContext';
import RfqJobTypeSelector from '@/components/RfqJobTypeSelector';
import templates from '@/public/data/rfq-templates-v2-hierarchical.json';

function RfqWizard() {
  const { 
    selectedCategory, 
    setSelectedCategory,
    selectedJobType,
    setSelectedJobType,
    currentStep,
    setCurrentStep
  } = useRfqContext();

  // Step 1: Category selection
  if (currentStep === 'category') {
    return (
      <div className="space-y-4">
        <h2>Select Project Type</h2>
        {templates.majorCategories.map((category) => (
          <button
            key={category.slug}
            onClick={() => {
              setSelectedCategory(category.slug);
              setCurrentStep('jobtype');
            }}
            className="block w-full text-left p-4 border rounded hover:bg-blue-50"
          >
            <h3 className="font-bold">{category.label}</h3>
            <p className="text-sm text-gray-600">{category.description}</p>
          </button>
        ))}
      </div>
    );
  }

  // Step 2: Job type selection
  if (currentStep === 'jobtype') {
    const category = templates.majorCategories.find(
      (c) => c.slug === selectedCategory
    );

    return (
      <div className="space-y-4">
        <h2>Select Job Type</h2>
        <RfqJobTypeSelector
          jobTypes={category.jobTypes}
          onSelect={(jobType) => {
            setSelectedJobType(jobType.slug);
            setCurrentStep('template');
          }}
          selectedJobType={selectedJobType}
        />
        <button
          onClick={() => setCurrentStep('category')}
          className="text-blue-600 hover:underline"
        >
          ← Back
        </button>
      </div>
    );
  }

  // Other steps...
}
```

---

## 📝 Example: Complete Multi-Step Form

```javascript
import React, { useEffect, useState } from 'react';
import { useRfqContext } from '@/context/RfqContext';
import { useRfqFormPersistence } from '@/hooks/useRfqFormPersistence';
import RfqFormRenderer from '@/components/RfqFormRenderer';
import RfqJobTypeSelector from '@/components/RfqJobTypeSelector';
import AuthInterceptor from '@/components/AuthInterceptor';
import templates from '@/public/data/rfq-templates-v2-hierarchical.json';

export default function CompleteRfqForm() {
  const {
    selectedCategory,
    setSelectedCategory,
    selectedJobType,
    setSelectedJobType,
    templateFields,
    updateTemplateFields,
    sharedFields,
    updateSharedFields,
    currentStep,
    setCurrentStep,
    isGuestMode,
    getAllFormData,
  } = useRfqContext();

  const {
    saveFormData,
    loadFormData,
    clearFormData,
    createAutoSave,
  } = useRfqFormPersistence();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create debounced auto-save (save 2 seconds after last change)
  const autoSave = createAutoSave(2000);

  // Load saved draft on mount
  useEffect(() => {
    if (selectedCategory && selectedJobType) {
      const saved = loadFormData(selectedCategory, selectedJobType);
      if (saved) {
        updateTemplateFields(saved.templateFields);
        updateSharedFields(saved.sharedFields);
      }
    }
  }, [selectedCategory, selectedJobType]);

  // Auto-save when fields change
  useEffect(() => {
    if (selectedCategory && selectedJobType && 
        (Object.keys(templateFields).length > 0 || 
         Object.keys(sharedFields).length > 0)) {
      autoSave(selectedCategory, selectedJobType, templateFields, sharedFields);
    }
  }, [templateFields, sharedFields]);

  const currentCategory = templates.majorCategories.find(
    (c) => c.slug === selectedCategory
  );

  const currentJobType = currentCategory?.jobTypes.find(
    (jt) => jt.slug === selectedJobType
  );

  const handleSubmit = async () => {
    // If guest mode, show auth modal first
    if (isGuestMode) {
      setShowAuthModal(true);
      return;
    }

    // User authenticated, proceed with submission
    await submitRfq();
  };

  const submitRfq = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = getAllFormData();

      const response = await fetch('/api/rfq/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit RFQ');
      }

      const result = await response.json();

      // Clear draft after successful submission
      clearFormData(selectedCategory, selectedJobType);

      // Show success message
      alert(`RFQ #${result.rfqId} submitted successfully!`);

      // Redirect or reset form
      // router.push(`/rfq/success/${result.rfqId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Step 1: Category Selection */}
      {currentStep === 'category' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">What do you need?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.majorCategories.map((category) => (
              <button
                key={category.slug}
                onClick={() => {
                  setSelectedCategory(category.slug);
                  setCurrentStep('jobtype');
                }}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition"
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <h3 className="font-bold text-lg">{category.label}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Job Type Selection */}
      {currentStep === 'jobtype' && currentCategory && (
        <div className="space-y-4">
          <div className="mb-6">
            <button
              onClick={() => setCurrentStep('category')}
              className="text-blue-600 hover:underline mb-4"
            >
              ← Back to Categories
            </button>
            <h2 className="text-2xl font-bold">
              {currentCategory.label}
            </h2>
            <p className="text-gray-600">Select the specific type of {currentCategory.label.toLowerCase()}</p>
          </div>

          <RfqJobTypeSelector
            jobTypes={currentCategory.jobTypes}
            onSelect={(jobType) => {
              setSelectedJobType(jobType.slug);
              setCurrentStep('template');
            }}
            selectedJobType={selectedJobType}
          />
        </div>
      )}

      {/* Step 3: Job-Specific Fields */}
      {currentStep === 'template' && currentJobType && (
        <div className="space-y-4">
          <div className="mb-6">
            <button
              onClick={() => setCurrentStep('jobtype')}
              className="text-blue-600 hover:underline mb-4"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold">{currentJobType.label}</h2>
            <p className="text-gray-600">{currentJobType.description}</p>
          </div>

          <RfqFormRenderer
            fields={currentJobType.fields}
            values={templateFields}
            onChange={(fieldName, value) => {
              updateTemplateFields({ [fieldName]: value });
            }}
            onNext={() => setCurrentStep('shared')}
          />

          <button
            onClick={() => setCurrentStep('jobtype')}
            className="text-blue-600 hover:underline"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Step 4: Shared General Fields */}
      {currentStep === 'shared' && (
        <div className="space-y-4">
          <div className="mb-6">
            <button
              onClick={() => setCurrentStep('template')}
              className="text-blue-600 hover:underline mb-4"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold">Project Details</h2>
            <p className="text-gray-600">Tell us a bit more about your project</p>
          </div>

          <RfqFormRenderer
            fields={templates.sharedGeneralFields}
            values={sharedFields}
            onChange={(fieldName, value) => {
              updateSharedFields({ [fieldName]: value });
            }}
            onNext={handleSubmit}
            submitButtonLabel="Proceed to Submission"
          />

          <button
            onClick={() => setCurrentStep('template')}
            className="text-blue-600 hover:underline"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Auth Interception Modal */}
      <AuthInterceptor
        isOpen={showAuthModal}
        onLoginSuccess={(user) => {
          setShowAuthModal(false);
          submitRfq();
        }}
        onGuestSubmit={(email) => {
          setShowAuthModal(false);
          submitRfq();
        }}
        onCancel={() => setShowAuthModal(false)}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg">
            <p className="text-lg font-semibold">Submitting your RFQ...</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🔌 API Endpoint Example

Here's the next thing to create (`/pages/api/rfq/create.js`):

```javascript
import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      categorySlug,
      jobTypeSlug,
      templateFields,
      sharedFields,
      isGuestMode,
      userEmail,
      userId,
    } = req.body;

    // Validate required fields
    if (!categorySlug || !jobTypeSlug || !sharedFields.location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get authenticated user if not guest
    let rfqUserId = null;
    if (!isGuestMode && userId) {
      rfqUserId = userId;
    }

    // Create RFQ record
    const { data, error } = await supabase
      .from('rfqs')
      .insert([
        {
          user_id: rfqUserId,
          category_slug: categorySlug,
          job_type_slug: jobTypeSlug,
          template_data: templateFields,
          shared_data: sharedFields,
          guest_email: isGuestMode ? userEmail : null,
          status: 'pending',
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    const rfqId = data[0].id;

    // TODO: Match to vendors based on jobTypeSlug
    // TODO: Send notifications to matched vendors
    // TODO: Send confirmation email to user/guest

    return res.status(201).json({
      rfqId,
      message: 'RFQ created successfully',
    });
  } catch (error) {
    console.error('RFQ creation error:', error);
    return res.status(500).json({
      message: error.message || 'Failed to create RFQ',
    });
  }
}
```

---

## 🧪 Testing Checklist

- [ ] Category selection works
- [ ] Job type selection works
- [ ] Form fields render correctly
- [ ] Form data saves to localStorage
- [ ] Page refresh recovers form data
- [ ] Auto-save works (check localStorage in DevTools)
- [ ] Guest mode shows AuthInterceptor
- [ ] Authenticated mode skips AuthInterceptor
- [ ] Login/signup/guest options all work
- [ ] Form data preserved during login
- [ ] RFQ submitted successfully
- [ ] localStorage cleared after submit
- [ ] Email notifications sent

---

## 📞 Next Steps

1. **Create API endpoint** `/pages/api/rfq/create.js`
2. **Integrate with modals:**
   - Refactor DirectRFQModal
   - Refactor WizardRFQModal
   - Refactor PublicRFQModal
3. **Add vendor matching** based on jobTypeSlug
4. **Send notifications** to matched vendors
5. **Deploy to staging** for testing
6. **User acceptance testing**
7. **Deploy to production**

---

**Ready to build?** Start with the API endpoint next! 🚀
