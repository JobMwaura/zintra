# Adding "Other" Option to All Category-Specific Dropdowns

## Overview

Your RFQ form has two levels of dropdowns:

1. **Main Category Level** - Already has "Other" (✅ DONE)
   - Example: Roofing, Fencing, Flooring, etc.

2. **Category Detail Level** - Needs "Other" option added (🔄 IN PROGRESS)
   - Examples:
     - **Roofing** → Roof type: Metal, Tile, Asphalt, **Other**
     - **Fencing** → Type of fencing: Masonry, Chain-link, Metal panel, **Other**
     - **Flooring** → Floor type: Tile, Wood, Concrete, **Other**

## Solution: SelectWithOther Component

I've created a reusable component: `components/SelectWithOther.js`

This component:
- ✅ Renders any dropdown with predefined options
- ✅ Adds "Other (Please specify)" at the bottom
- ✅ Shows conditional text input when "Other" is selected
- ✅ Handles validation for required fields
- ✅ Stores both selected value and custom text

## Usage Example

### In Your Template-Based Forms

Instead of:
```javascript
<select value={roof_type} onChange={(e) => setRoofType(e.target.value)}>
  <option value="">Select type</option>
  <option>Metal Roof</option>
  <option>Clay Tiles</option>
  <option>Asphalt Shingles</option>
</select>
```

Use:
```javascript
import SelectWithOther from '@/components/SelectWithOther';

<SelectWithOther
  label="Roof Type"
  options={['Metal Roof', 'Clay Tiles', 'Asphalt Shingles', 'Concrete']}
  value={roofType}
  onChange={setRoofType}
  onOtherChange={setRoofTypeOther}
  otherValue={roofTypeOther}
  placeholder="e.g., Slate, Thatch, Solar panels"
  required={true}
  helpText="Select the main roof type for your project"
/>
```

### Component Props

```javascript
{
  label: "Roof Type",              // Label shown above dropdown
  options: ['Metal', 'Tile'],      // Predefined options
  value: roofType,                 // Current selected value
  onChange: setRoofType,           // Callback when selection changes
  onOtherChange: setRoofTypeOther, // Callback for "Other" text input
  otherValue: roofTypeOther,       // Text input value for custom option
  placeholder: "e.g., Slate...",   // Placeholder in text input
  required: true,                  // If field is required (adds * to label)
  helpText: "Select roof type",    // Helper text below dropdown
  disabled: false                  // Whether field is disabled
}
```

## Form State Structure

Your form state should include both value and "other" text:

```javascript
const [formData, setFormData] = useState({
  // Category level (already done)
  category: '',
  custom_category: '',
  custom_details: '',
  
  // Roofing category details (example)
  roof_type: '',
  roof_type_other: '',
  
  // Fencing category details (example)
  fencing_type: '',
  fencing_type_other: '',
  fence_requirements: [],
  fence_requirements_other: '',
  
  // Flooring category details (example)
  floor_type: '',
  floor_type_other: '',
  floor_size: '',
  
  // Site conditions (example)
  site_conditions: '',
  site_conditions_other: '',
  
  // ... more fields
});
```

## Data Storage & Submission

When submitting the form:

```javascript
const payload = {
  // Send the selected value (which could be custom)
  roof_type: formData.roof_type === 'other' 
    ? formData.roof_type_other  // Use custom text
    : formData.roof_type,        // Use selected option
    
  // Always include the "other" value (for reference/audit)
  roof_type_other: formData.roof_type_other,
  
  // Include the flag to track it's custom
  roof_type_is_custom: formData.roof_type === 'other',
  
  // Similar for all other detail fields...
};
```

## Example Implementation

### Step 1: Update Your Template Form Component

```javascript
import SelectWithOther from '@/components/SelectWithOther';

export function RoofingDetailsForm({ formData, setFormData }) {
  return (
    <div className="space-y-4">
      <h3>Roofing Project Details</h3>
      
      {/* Roof Type - Now with "Other" option */}
      <SelectWithOther
        label="Roof Type"
        options={['Metal Roof', 'Clay Tiles', 'Concrete Tiles', 'Asphalt Shingles', 'Slate']}
        value={formData.roof_type}
        onChange={(value) => setFormData({...formData, roof_type: value})}
        onOtherChange={(value) => setFormData({...formData, roof_type_other: value})}
        otherValue={formData.roof_type_other}
        placeholder="e.g., Thatch, Solar panels, Green roof"
        required={true}
      />

      {/* Roof Size */}
      <input
        type="text"
        placeholder="e.g., 10m x 12m, 100 sqm"
        value={formData.roof_size}
        onChange={(e) => setFormData({...formData, roof_size: e.target.value})}
        className="w-full px-3 py-2 border rounded-lg"
      />
    </div>
  );
}
```

### Step 2: Update Form Validation

```javascript
const validateRoofingForm = (formData) => {
  const errors = [];
  
  // Check roof type is selected
  if (!formData.roof_type) {
    errors.push('Please select a roof type');
  }
  
  // If "Other" is selected, require the custom text
  if (formData.roof_type === 'other' && !formData.roof_type_other.trim()) {
    errors.push('Please specify the roof type');
  }
  
  return errors;
};
```

### Step 3: Update Form Submission

```javascript
const handleSubmit = async (formData) => {
  // Validate
  const errors = validateRoofingForm(formData);
  if (errors.length > 0) {
    setError(errors[0]);
    return;
  }

  // Prepare payload
  const payload = {
    // Use custom value if "Other" selected, otherwise use dropdown value
    roof_type: formData.roof_type === 'other' 
      ? formData.roof_type_other 
      : formData.roof_type,
    
    // Always include these for reference
    roof_type_other: formData.roof_type_other,
    roof_type_is_custom: formData.roof_type === 'other',
    
    roof_size: formData.roof_size,
    // ... other fields
  };

  // Send to API
  await submitRFQ(payload);
};
```

## Database Schema Updates

Add these columns to track custom values across all categories:

```sql
-- Add to rfqs table for tracking custom detail selections
ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS details_json jsonb, -- Store all custom detail values
ADD COLUMN IF NOT EXISTS custom_fields jsonb; -- Store which fields had "Other" selected

-- Example data structure:
{
  "roof_type": "Solar panels",
  "roof_type_is_custom": true,
  "fencing_type": "Bamboo",
  "fencing_type_is_custom": true,
  "floor_type": "Polished concrete",
  "floor_type_is_custom": true
}
```

## Validation Rules

For each detail field with "Other" option:

```javascript
// Rule: If "Other" is selected, custom text is required
if (fieldValue === 'other' && !fieldOtherValue.trim()) {
  error = `Please specify the ${fieldLabel}`;
}

// Rule: Don't allow empty custom text
if (fieldOtherValue && fieldOtherValue.trim().length === 0) {
  error = `${fieldLabel} cannot be empty`;
}

// Rule: Custom text should be reasonable length
if (fieldOtherValue && fieldOtherValue.trim().length > 100) {
  error = `${fieldLabel} is too long (max 100 characters)`;
}
```

## User Experience Flow

```
User selects category: "Roofing"
  ↓
Form shows roofing-specific fields
  ↓
User selects "Roof type" dropdown
  ├─ Option: Metal Roof
  ├─ Option: Clay Tiles
  ├─ Option: Asphalt Shingles
  └─ Option: Other (Please specify)
  ↓
User selects "Other (Please specify)"
  ↓
Text input appears below dropdown:
  [Please specify roof type]
  [e.g., Slate, Thatch, Solar panels]
  ↓
User types: "Green roof with solar panels"
  ↓
Form submits with:
  - roof_type: "other"
  - roof_type_other: "Green roof with solar panels"
  - roof_type_is_custom: true
  ↓
Database stores custom value for vendor to see
```

## Next Steps

1. ✅ SelectWithOther component created
2. ⏳ Identify all category-specific dropdown fields in your forms
3. ⏳ Replace each dropdown with SelectWithOther component
4. ⏳ Update form state to include "other" values
5. ⏳ Update validation logic for each field
6. ⏳ Update database schema to store custom selections
7. ⏳ Update vendor view to display custom detail values

## Files to Update

Based on your screenshots, update these template-based forms:

- [ ] Roofing template form (roof_type, roof area, etc.)
- [ ] Fencing template form (fencing_type, gate requirements, etc.)
- [ ] Flooring template form (floor_type, square footage, etc.)
- [ ] Any other category-specific detail forms

## Questions?

Refer to:
- `components/SelectWithOther.js` - Component implementation
- This file for usage examples and patterns
- Database migration guide for schema updates
