# RFQ Template System Implementation Guide

**Status**: 🔄 IMPLEMENTATION IN PROGRESS  
**Last Updated**: December 31, 2025  
**Scope**: Complete refactoring of 3 RFQ flow types to use category-specific templates

---

## Overview

This guide explains how to integrate the new RFQ template system into your existing DirectRFQModal, WizardRFQModal, and PublicRFQModal components.

**Key Goals**:
- ✅ Replace hardcoded fields with category-specific templates
- ✅ Maintain existing user flow (direct, wizard, public)
- ✅ Improve quote quality with targeted questions
- ✅ Scale easily: add new categories or templates without code changes

---

## Architecture

### Template System Structure

```
rfq-templates.json
├── categories (20 items)
│   ├── slug: unique identifier
│   └── label: display name
├── sharedGeneralFields (5 items)
│   └── Applied to ALL RFQs (Step 3)
└── templates (20+ items)
    ├── id: unique identifier
    ├── categorySlug: link to category
    ├── label: "Full house construction"
    ├── rfqTypes: ["direct", "wizard", "public"]
    └── fields: category-specific questions
```

### Component Architecture

```
DirectRFQModal / WizardRFQModal / PublicRFQModal
├── Step 1 (if needed): Category selection
│   └── RfqCategorySelector
│       ├── Displays 20 categories
│       ├── Filters by rfqType
│       └── Returns selected category + template
│
├── Step 2: Category-specific fields
│   └── RfqFormRenderer
│       ├── Loads template.fields
│       ├── Renders dynamic form
│       └── Manages form state
│
└── Step 3: Shared general fields
    └── RfqFormRenderer (again)
        ├── Loads sharedGeneralFields
        ├── Renders common questions
        └── Collects location, dates, budget
```

### Data Flow

```
User selects category
        ↓
Load template from rfq-templates.json by categorySlug
        ↓
Render template.fields (Step 2)
        ↓
Collect template field values
        ↓
Render sharedGeneralFields (Step 3)
        ↓
Collect shared field values
        ↓
POST /api/rfq/create with all values
        ↓
Save to database with template_id reference
        ↓
Match to vendors by category
```

---

## Files Created

### 1. `/public/data/rfq-templates.json`

Master template configuration file containing:
- 20 categories with slugs
- Shared general fields (location, budget, dates, notes)
- 16 category-specific templates with 5-8 fields each

**Key Structure**:
```javascript
{
  categories: [
    { slug: "building_masonry", label: "Building & Masonry" },
    // ... 19 more
  ],
  sharedGeneralFields: [
    { name: "project_title", label: "...", type: "text", required: false },
    // ... 4 more
  ],
  templates: [
    {
      id: "building_full_house",
      categorySlug: "building_masonry",
      label: "Full house construction",
      rfqTypes: ["direct", "wizard", "public"],
      fields: [
        { name: "house_type", label: "What are you building?", type: "text", required: true },
        // ... 7 more fields
      ]
    },
    // ... 15 more templates
  ]
}
```

**Usage**:
```javascript
const response = await fetch('/data/rfq-templates.json');
const templates = await response.json();

// Get all categories
const categories = templates.categories;

// Get templates for a category
const buildingTemplates = templates.templates.filter(
  t => t.categorySlug === 'building_masonry'
);

// Get template by ID
const template = templates.templates.find(t => t.id === 'building_full_house');

// Get shared general fields
const sharedFields = templates.sharedGeneralFields;
```

---

## Components Created

### 2. `/components/RfqFormRenderer.js`

Renders dynamic form fields based on template specifications.

**Supported Field Types**:
- `text` - Single-line text input
- `number` - Numeric input with min/max validation
- `select` - Dropdown with options
- `multiselect` - Checkboxes for multiple selections
- `textarea` - Multi-line text input
- `date` - Date picker
- `file` - File upload with preview

**Features**:
- ✅ Automatic validation (required fields, min/max, date format)
- ✅ Error messages below each field
- ✅ File upload with preview
- ✅ Disabled state for read-only viewing
- ✅ Form state management (via ref)

**Usage Example**:

```javascript
import RfqFormRenderer from '@/components/RfqFormRenderer';

export function MyComponent() {
  const formRef = useRef();

  const fields = [
    {
      name: "house_type",
      label: "What are you building?",
      type: "text",
      placeholder: "e.g. 3-bedroom bungalow",
      required: true
    },
    {
      name: "storeys",
      label: "Number of storeys",
      type: "select",
      options: ["Bungalow (1 storey)", "2 storeys", "3+ storeys"],
      required: true
    },
    {
      name: "extras",
      label: "Extras",
      type: "multiselect",
      options: ["Heating", "Lighting", "Water features"],
      required: false
    }
  ];

  const handleSubmit = () => {
    // Get all form values
    const values = formRef.current.getValues();
    
    // Check if valid
    const isValid = formRef.current.isValid();
    
    // Get errors if any
    const errors = formRef.current.getErrors();
    
    console.log('Form values:', values);
  };

  return (
    <div>
      <RfqFormRenderer
        ref={formRef}
        fields={fields}
        initialValues={{}}
        onFieldChange={(fieldName, value) => {
          console.log(`${fieldName} changed to:`, value);
        }}
        onFieldError={(fieldName, error) => {
          console.log(`${fieldName} error:`, error);
        }}
      />
      <button onClick={handleSubmit} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
        Submit
      </button>
    </div>
  );
}
```

**Ref API** (via `useImperativeHandle`):
```javascript
// Get all form values
const values = formRef.current.getValues();
// Returns: { fieldName: value, ... }

// Check if form is valid
const isValid = formRef.current.isValid();
// Returns: boolean

// Get validation errors
const errors = formRef.current.getErrors();
// Returns: { fieldName: errorMessage, ... }

// Set a field value programmatically
formRef.current.setFieldValue('fieldName', newValue);

// Clear all errors
formRef.current.clearErrors();
```

---

### 3. `/components/RfqCategorySelector.js`

Displays categories and template options for the selected category.

**Features**:
- ✅ Shows all 20 categories (filtered by rfqType)
- ✅ Shows template count per category
- ✅ Two-step selection: category → template
- ✅ Back button to return to categories
- ✅ Disabled state for loading/processing

**Usage Example**:

```javascript
import RfqCategorySelector from '@/components/RfqCategorySelector';
import templates from '@/public/data/rfq-templates.json';

export function CategoryStep() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleSelect = (category, template) => {
    console.log('Selected:', {
      category: category.slug,
      template: template.id
    });
    setSelectedTemplate(template);
  };

  return (
    <RfqCategorySelector
      categories={templates.categories}
      templates={templates.templates}
      rfqType="wizard"
      onSelect={handleSelect}
      onBack={() => console.log('User clicked back')}
      disabled={false}
    />
  );
}
```

**Props**:
- `categories`: Array of category objects from templates.json
- `templates`: Array of template objects from templates.json
- `rfqType`: String - 'direct', 'wizard', or 'public'
- `onSelect`: Callback - receives (category, template)
- `onBack`: Optional callback for back button
- `disabled`: Boolean - disables all interactions

---

## Refactoring Existing Modals

### Refactoring Pattern

All 3 modals follow similar pattern but with different entry points:

**DirectRFQModal** (Current user selects vendor first):
```
Entry: User clicks "Direct RFQ" from vendor page
Step 1: Category selection (RfqCategorySelector)
Step 2: Template-specific fields (RfqFormRenderer)
Step 3: Shared general fields (RfqFormRenderer)
Step 4: Review & submit
Exit: Create RFQ for this specific vendor
```

**WizardRFQModal** (Multi-step wizard):
```
Entry: User starts multi-step wizard
Step 1: Category selection (RfqCategorySelector)
Step 2: Template-specific fields (RfqFormRenderer)
Step 3: Shared general fields (RfqFormRenderer)
Step 4: Review vendors matching category
Step 5: Review & submit
Exit: Create RFQ and show matching vendors
```

**PublicRFQModal** (Public RFQ creation):
```
Entry: User clicks "Find vendors"
Step 1: Category selection (RfqCategorySelector)
Step 2: Template-specific fields (RfqFormRenderer)
Step 3: Shared general fields (RfqFormRenderer)
Step 4: Review & submit
Exit: Create public RFQ and show matching vendors
```

---

## Step-by-Step Integration Guide

### Step 1: Import Components & Templates

```javascript
import { useState, useRef } from 'react';
import RfqCategorySelector from '@/components/RfqCategorySelector';
import RfqFormRenderer from '@/components/RfqFormRenderer';
import templatesData from '@/public/data/rfq-templates.json';

export function DirectRFQModal({ vendorId, onClose, onSuccess }) {
  const [step, setStep] = useState('category'); // 'category' | 'fields' | 'shared' | 'review'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const templateFormRef = useRef();
  const sharedFormRef = useRef();
  
  // ... rest of component
}
```

### Step 2: Handle Category Selection

```javascript
const handleCategorySelect = (category, template) => {
  setSelectedCategory(category);
  setSelectedTemplate(template);
  setStep('fields');
};

const handleCategoryBack = () => {
  setSelectedCategory(null);
  setSelectedTemplate(null);
  setStep('category');
};
```

### Step 3: Render Category Selector (Step 1)

```javascript
{step === 'category' && (
  <RfqCategorySelector
    categories={templatesData.categories}
    templates={templatesData.templates}
    rfqType="direct"
    onSelect={handleCategorySelect}
    onBack={handleCategoryBack}
  />
)}
```

### Step 4: Render Template Fields (Step 2)

```javascript
{step === 'fields' && selectedTemplate && (
  <div>
    <h2 className="text-xl font-bold mb-4">
      {selectedTemplate.label}
    </h2>
    <p className="text-gray-600 mb-6">
      {selectedTemplate.description}
    </p>
    
    <RfqFormRenderer
      ref={templateFormRef}
      fields={selectedTemplate.fields}
      onFieldChange={(fieldName, value) => {
        console.log(`${fieldName}:`, value);
      }}
    />
    
    <div className="flex gap-4 mt-6">
      <button
        onClick={() => setStep('category')}
        className="px-4 py-2 border border-gray-300 rounded-lg"
      >
        Back
      </button>
      <button
        onClick={() => setStep('shared')}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Next
      </button>
    </div>
  </div>
)}
```

### Step 5: Render Shared General Fields (Step 3)

```javascript
{step === 'shared' && (
  <div>
    <h2 className="text-xl font-bold mb-4">
      Project Details
    </h2>
    <p className="text-gray-600 mb-6">
      Tell us more about your project and location.
    </p>
    
    <RfqFormRenderer
      ref={sharedFormRef}
      fields={templatesData.sharedGeneralFields}
    />
    
    <div className="flex gap-4 mt-6">
      <button
        onClick={() => setStep('fields')}
        className="px-4 py-2 border border-gray-300 rounded-lg"
      >
        Back
      </button>
      <button
        onClick={() => setStep('review')}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Review
      </button>
    </div>
  </div>
)}
```

### Step 6: Review & Submit

```javascript
{step === 'review' && (
  <div>
    <h2 className="text-xl font-bold mb-4">Review Your RFQ</h2>
    
    {/* Display template values */}
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      <h3 className="font-semibold mb-2">
        {selectedTemplate.label}
      </h3>
      {Object.entries(templateFormRef.current.getValues()).map(
        ([key, value]) => (
          <div key={key} className="text-sm mb-1">
            <span className="font-medium">{key}:</span> {String(value)}
          </div>
        )
      )}
    </div>
    
    {/* Display shared values */}
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <h3 className="font-semibold mb-2">Project Details</h3>
      {Object.entries(sharedFormRef.current.getValues()).map(
        ([key, value]) => (
          <div key={key} className="text-sm mb-1">
            <span className="font-medium">{key}:</span> {String(value)}
          </div>
        )
      )}
    </div>
    
    <div className="flex gap-4">
      <button
        onClick={() => setStep('shared')}
        className="px-4 py-2 border border-gray-300 rounded-lg"
      >
        Back
      </button>
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Submit RFQ
      </button>
    </div>
  </div>
)}
```

### Step 7: Handle Submission

```javascript
const handleSubmit = async () => {
  // Validate both forms
  if (!templateFormRef.current.isValid()) {
    alert('Please fix template field errors');
    setStep('fields');
    return;
  }
  
  if (!sharedFormRef.current.isValid()) {
    alert('Please fix project detail errors');
    setStep('shared');
    return;
  }
  
  // Collect all values
  const templateValues = templateFormRef.current.getValues();
  const sharedValues = sharedFormRef.current.getValues();
  
  // Create RFQ payload
  const rfqPayload = {
    vendorId, // or null for public/wizard
    templateId: selectedTemplate.id,
    categorySlug: selectedCategory.slug,
    templateFields: templateValues,
    sharedFields: sharedValues,
    createdAt: new Date().toISOString(),
  };
  
  try {
    const response = await fetch('/api/rfq/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rfqPayload),
    });
    
    if (!response.ok) throw new Error('Failed to create RFQ');
    
    const { rfqId } = await response.json();
    onSuccess?.(rfqId);
    onClose();
  } catch (error) {
    console.error('Error creating RFQ:', error);
    alert('Failed to create RFQ');
  }
};
```

---

## API Endpoint: `/pages/api/rfq/create.js`

This endpoint saves the RFQ with template data to the database.

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    vendorId,           // null for public/wizard RFQs
    templateId,         // e.g. "building_full_house"
    categorySlug,       // e.g. "building_masonry"
    templateFields,     // { house_type: "...", storeys: "..." }
    sharedFields,       // { location: "...", budget_level: "..." }
  } = req.body;

  try {
    // Validate user authentication
    const authToken = req.headers.authorization?.split('Bearer ')[1];
    if (!authToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from token
    const { data: { user } } = await supabase.auth.getUser(authToken);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Validate vendorId if specified
    if (vendorId) {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('id', vendorId)
        .single();

      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
    }

    // Save RFQ to database
    const { data, error } = await supabase
      .from('rfqs')
      .insert([
        {
          user_id: user.id,
          vendor_id: vendorId || null,
          category_slug: categorySlug,
          template_id: templateId,
          template_data: templateFields,    // JSONB field
          shared_data: sharedFields,        // JSONB field
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // TODO: Send notification to matching vendors
    // TODO: Log activity in admin_activity table

    res.status(201).json({
      success: true,
      rfqId: data.id,
      message: 'RFQ created successfully',
    });
  } catch (error) {
    console.error('Error creating RFQ:', error);
    res.status(500).json({
      error: 'Failed to create RFQ',
      details: error.message,
    });
  }
}
```

### Database Schema

Expected table structure:

```sql
CREATE TABLE rfqs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vendor_id BIGINT REFERENCES vendors(id),
  category_slug VARCHAR(50) NOT NULL,
  template_id VARCHAR(50) NOT NULL,
  template_data JSONB,           -- { house_type: "...", ... }
  shared_data JSONB,             -- { location: "...", ... }
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

CREATE INDEX idx_rfqs_user_id ON rfqs(user_id);
CREATE INDEX idx_rfqs_vendor_id ON rfqs(vendor_id);
CREATE INDEX idx_rfqs_category_slug ON rfqs(category_slug);
CREATE INDEX idx_rfqs_status ON rfqs(status);
```

---

## Testing Checklist

Before deploying, verify:

### Template System
- [ ] Templates JSON loads correctly
- [ ] All 20 categories display properly
- [ ] Category counts match filtered templates
- [ ] Each category has at least 1 template

### Form Rendering
- [ ] Text fields accept input
- [ ] Number fields validate min/max
- [ ] Select dropdowns show options
- [ ] Multiselect checkboxes work
- [ ] Textarea handles multi-line input
- [ ] Date picker shows calendar
- [ ] File upload shows preview
- [ ] Required field validation works
- [ ] Errors display correctly

### Modal Integration
- [ ] Category selector shows correct categories
- [ ] Category → template transition works
- [ ] Template fields load from selected template
- [ ] Shared fields appear after template fields
- [ ] Form values persist when navigating back
- [ ] Validation prevents submission of invalid forms
- [ ] Review step displays all collected values
- [ ] Submission calls API endpoint correctly

### DirectRFQModal
- [ ] Opens when clicking vendor "Request Quote"
- [ ] Pre-fills vendorId
- [ ] Submits with correct vendorId

### WizardRFQModal
- [ ] Category selection is step 1
- [ ] Template fields are step 2
- [ ] Shared fields are step 3
- [ ] Displays matching vendors after submission

### PublicRFQModal
- [ ] No vendor pre-selected
- [ ] Submits with vendorId: null
- [ ] Shows all matching vendors after submission

---

## Troubleshooting

### Component Issues

**Q: "RfqFormRenderer is not defined"**  
A: Ensure import path is correct:
```javascript
import RfqFormRenderer from '@/components/RfqFormRenderer';
```

**Q: Form values not persisting**  
A: Ensure `ref` is properly attached:
```javascript
const formRef = useRef();
<RfqFormRenderer ref={formRef} ... />
```

**Q: Multiselect checkboxes not working**  
A: Check that fieldValue is array:
```javascript
const currentArray = Array.isArray(fieldValue) ? fieldValue : [];
```

### API Issues

**Q: "POST /api/rfq/create - 401 Unauthorized"**  
A: Pass authorization token in header:
```javascript
const token = localStorage.getItem('authToken');
fetch('/api/rfq/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})
```

**Q: "Cannot read property 'id' of null"**  
A: Ensure vendor exists before saving RFQ with vendorId

**Q: JSONB field format error**  
A: Ensure templateFields/sharedFields are objects, not strings:
```javascript
// ✅ Correct
templateFields: { house_type: "bungalow", storeys: 1 }

// ❌ Wrong
templateFields: '{"house_type":"bungalow"}'
```

---

## Next Steps

1. **Today**: Create `/pages/api/rfq/create.js` endpoint
2. **Today**: Refactor DirectRFQModal to use templates
3. **Tomorrow**: Refactor WizardRFQModal
4. **Tomorrow**: Refactor PublicRFQModal
5. **Next day**: E2E testing across all 3 flows
6. **Next day**: Performance testing (load templates, render forms)
7. **Week**: Deploy to staging
8. **Week**: User acceptance testing
9. **Week**: Deploy to production

---

## Reference

- Template JSON: `/public/data/rfq-templates.json`
- Form Renderer: `/components/RfqFormRenderer.js`
- Category Selector: `/components/RfqCategorySelector.js`
- API Endpoint: `/pages/api/rfq/create.js` (to be created)

---

**Questions?** Refer to specific section above or check template examples in rfq-templates.json.
