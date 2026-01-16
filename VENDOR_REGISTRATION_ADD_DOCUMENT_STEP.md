# 📄 Adding Document Upload Step to Vendor Registration

**Priority**: HIGH - Adds optional document verification feature  
**Time to Implement**: 20-30 minutes  
**Files to Edit**: 1 file (`/app/vendor-registration/page.js`)  
**Complexity**: Medium - Adding new form field + step + UI  

---

## Overview

**Current State**: 6-step registration (Account → Business Info → Categories → Details → Plan → Complete)

**New State**: 7-step registration (Account → Business Info → Categories → **📄 Documents** → Details → Plan → Complete)

**Step 4 (New)**: Optional document upload for business verification
- Upload business registration, tax ID, license, or other official document
- File types: PDF, JPG, PNG (max 10MB)
- Completely optional - users can skip

---

## Part 1: Update Steps Definition

**File**: `/app/vendor-registration/page.js`  
**Location**: Around line 23-30  
**Current Code**:
```javascript
const steps = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Business Info' },
  { id: 3, label: 'Categories' },
  { id: 4, label: 'Details' },
  { id: 5, label: 'Plan' },
  { id: 6, label: 'Complete' },
];
```

**Replace With**:
```javascript
const steps = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Business Info' },
  { id: 3, label: 'Categories' },
  { id: 4, label: 'Documents' },
  { id: 5, label: 'Details' },
  { id: 6, label: 'Plan' },
  { id: 7, label: 'Complete' },
];
```

---

## Part 2: Update Form State

**Location**: Around line 96-135  
**Add these fields to the initial form state**:

```javascript
// Around line 110-130, add:
verificationDocument: null,
documentFile: null,
documentType: 'business_registration', // Default type
companyRegistrationNumber: '',
companyRegistrationDate: null,

// Around line 135, add:
uploadingDocument: false,
documentUploadProgress: 0,
documentUploadError: null,
```

**Full Updated Form State** (example):
```javascript
const [formData, setFormData] = useState({
  // Existing fields
  businessName: '',
  businessDescription: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  whatsappNumber: '',
  county: '',
  location: '',
  primaryCategorySlug: '',
  secondaryCategories: [],
  websiteUrl: '',
  facebookPage: '',
  instagramHandle: '',
  selectedPlan: null,
  services: [],
  products: [],

  // NEW FIELDS
  verificationDocument: null,
  documentFile: null,
  documentType: 'business_registration',
  companyRegistrationNumber: '',
  companyRegistrationDate: null,
  uploadingDocument: false,
  documentUploadProgress: 0,
  documentUploadError: null,
});
```

---

## Part 3: Add Document Upload Handler

**Location**: After `handleSubmit` function (around line 450+)  
**Add this new function**:

```javascript
const handleDocumentUpload = async (file) => {
  if (!file) {
    setFormData(prev => ({
      ...prev,
      documentUploadError: 'No file selected'
    }));
    return;
  }

  // Validate file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    setFormData(prev => ({
      ...prev,
      documentUploadError: 'Only PDF, JPG, or PNG files allowed'
    }));
    return;
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    setFormData(prev => ({
      ...prev,
      documentUploadError: 'File must be smaller than 10MB'
    }));
    return;
  }

  try {
    setFormData(prev => ({
      ...prev,
      uploadingDocument: true,
      documentUploadError: null,
      documentUploadProgress: 0,
      documentFile: file
    }));

    // Get presigned URL from API
    const getUrlResponse = await fetch('/api/vendor-profile/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await supabaseClient.auth.session()?.access_token}`
      },
      body: JSON.stringify({
        fileType: file.type,
        fileSize: file.size,
        fileName: `document-${formData.documentType}-${Date.now()}${getFileExtension(file.type)}`
      })
    });

    if (!getUrlResponse.ok) {
      throw new Error('Failed to get presigned URL');
    }

    const { uploadUrl, fileUrl, key } = await getUrlResponse.json();

    // Upload to S3 using presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    // Save file URL to form data
    setFormData(prev => ({
      ...prev,
      verificationDocument: fileUrl,
      uploadingDocument: false,
      documentUploadProgress: 100,
      documentUploadError: null
    }));

  } catch (error) {
    console.error('Document upload error:', error);
    setFormData(prev => ({
      ...prev,
      uploadingDocument: false,
      documentUploadError: error.message || 'Upload failed. Please try again.'
    }));
  }
};

// Helper function to get file extension
const getFileExtension = (mimeType) => {
  const extensions = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png'
  };
  return extensions[mimeType] || '';
};
```

---

## Part 4: Update Validation Logic

**Location**: The validation switch statement (around line 333+)  
**Find the line that looks like**:
```javascript
switch (currentStep) {
  case 1:
    // validate email, password
    break;
  case 2:
    // validate phone, OTP
    break;
  case 3:
    // validate categories
    break;
  case 4:
    // validate details
    break;
  // ... etc
}
```

**Add new case for Step 4 (Documents)**:
```javascript
switch (currentStep) {
  case 1:
    // existing validation
    break;
  case 2:
    // existing validation
    break;
  case 3:
    // existing validation
    break;
  
  // NEW: Step 4 - Documents (optional, no validation errors)
  case 4:
    // Document upload is optional
    // No validation errors - user can skip
    return true;
  
  // Shift existing validations: 4→5, 5→6, 6→7
  case 5:
    // OLD STEP 4 validation (Details)
    // ... existing code ...
    break;
  case 6:
    // OLD STEP 5 validation (Plan)
    // ... existing code ...
    break;
  case 7:
    // OLD STEP 6 validation (Complete)
    // ... existing code ...
    break;
}
```

---

## Part 5: Add Step 4 UI (Document Upload)

**Location**: In the render section where you have Step 1, Step 2, etc.  
**Find where Step 3 ends** and **add this after Step 3**:

```javascript
{currentStep === 4 && (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-2">📄 Verification Document</h2>
      <p className="text-gray-600 mb-6">
        Optional: Upload your business registration, tax ID, license, or other official document.
        We'll verify it to build trust in your profile.
      </p>
    </div>

    {/* Document Type Selection */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Document Type (Optional)
      </label>
      <select
        value={formData.documentType}
        onChange={(e) => {
          setFormData(prev => ({
            ...prev,
            documentType: e.target.value,
            verificationDocument: null, // Reset uploaded file when changing type
            documentFile: null
          }));
        }}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="business_registration">Business Registration Certificate</option>
        <option value="tax_id">Tax ID / VAT Certificate</option>
        <option value="license">Business License</option>
        <option value="other">Other Official Document</option>
      </select>
    </div>

    {/* Company Registration Number */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Registration Number (Optional)
      </label>
      <input
        type="text"
        placeholder="e.g., BR-2024-123456"
        value={formData.companyRegistrationNumber}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          companyRegistrationNumber: e.target.value
        }))}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    {/* File Upload Area */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload Document (Optional)
      </label>
      
      {!formData.verificationDocument ? (
        <div
          onClick={() => document.getElementById('documentInput')?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
        >
          <input
            id="documentInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleDocumentUpload(file);
              }
            }}
            disabled={formData.uploadingDocument}
          />
          
          {formData.uploadingDocument ? (
            <div className="space-y-3">
              <div className="text-lg font-medium text-gray-700">
                Uploading {formData.documentFile?.name}...
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${formData.documentUploadProgress}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600">
                {formData.documentUploadProgress}% uploaded
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xl">📁</div>
              <div className="text-gray-700 font-medium">
                Drop your document here or click to browse
              </div>
              <div className="text-sm text-gray-500">
                PDF, JPG, or PNG (max 10MB)
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">✅</div>
              <div>
                <div className="font-medium text-gray-900">
                  {formData.documentFile?.name || 'Document uploaded'}
                </div>
                <div className="text-sm text-gray-600">
                  Type: {formData.documentType.replace('_', ' ')}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  verificationDocument: null,
                  documentFile: null,
                  documentUploadError: null
                }));
              }}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {formData.documentUploadError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {formData.documentUploadError}
        </div>
      )}
    </div>

    {/* Navigation Buttons */}
    <div className="flex justify-between pt-6">
      <button
        onClick={() => setCurrentStep(3)}
        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
      >
        ← Back
      </button>
      <button
        onClick={() => {
          // Validation passes for optional step
          setCurrentStep(5);
        }}
        disabled={formData.uploadingDocument}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
      >
        Continue →
      </button>
    </div>
  </div>
)}
```

---

## Part 6: Update All Step References

**Important**: Now that we've added a step, all step numbers shift!

**Update these locations**:

1. **OLD Step 4 validation** (Details) - Change to Step 5
2. **OLD Step 5 validation** (Plan) - Change to Step 6  
3. **OLD Step 6 validation** (Complete) - Change to Step 7
4. **OLD Step 4 rendering** - Change to Step 5
5. **OLD Step 5 rendering** - Change to Step 6
6. **OLD Step 6 rendering** - Change to Step 7

Use Find & Replace (Ctrl+H or Cmd+H):
- Find: `currentStep === 4` → Replace: `currentStep === 5`
- Find: `currentStep === 5` → Replace: `currentStep === 6`
- Find: `currentStep === 6` → Replace: `currentStep === 7`

**⚠️ Be careful**: Do these replacements in order (6→7 first, then 5→6, then 4→5) to avoid conflicts!

---

## Part 7: Save Documents in Backend

**When vendor completes registration** (in `handleSubmit`), add this after vendor is created:

```javascript
// Around line 500+ in handleSubmit, after vendor is created:
if (formData.verificationDocument && vendorId) {
  try {
    // Save document to vendor_verification_documents table
    const { error } = await supabaseClient
      .from('vendor_verification_documents')
      .insert({
        vendor_id: vendorId,
        document_url: formData.verificationDocument,
        document_type: formData.documentType,
        company_registration_number: formData.companyRegistrationNumber,
        company_registration_date: formData.companyRegistrationDate,
        status: 'pending', // Admin will review
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to save verification document:', error);
      // Don't block registration, just log error
    }
  } catch (error) {
    console.error('Error saving verification document:', error);
  }
}
```

---

## Part 8: Test the Implementation

### Test Case 1: Upload Document Successfully
```
1. Go to /vendor-registration
2. Complete Steps 1-3
3. Arrive at Step 4 (Documents)
4. Select document type: "Business Registration Certificate"
5. Upload a PDF file
6. Wait for ✅ success indicator
7. Click Continue
8. Should proceed to Step 5 (Details)
✅ PASS
```

### Test Case 2: Skip Document Upload
```
1. Go to /vendor-registration
2. Complete Steps 1-3
3. Arrive at Step 4 (Documents)
4. Don't select or upload any file
5. Click Continue (button should be enabled)
6. Should proceed to Step 5 (Details) without error
✅ PASS
```

### Test Case 3: Document Size Validation
```
1. Go to Step 4 (Documents)
2. Try uploading a file > 10MB
3. Should show error: "File must be smaller than 10MB"
4. Should not upload
5. Can try different file
✅ PASS
```

### Test Case 4: File Type Validation
```
1. Go to Step 4 (Documents)
2. Try uploading a .doc or .txt file
3. Should show error: "Only PDF, JPG, or PNG files allowed"
4. Should not upload
✅ PASS
```

### Test Case 5: Complete Full Registration with Document
```
1. Go to /vendor-registration
2. Complete all steps 1-7 (including uploading document)
3. Click "Complete" on final step
4. Should create vendor profile
5. Should save document to database
6. Check vendor_verification_documents table
7. Row should exist with vendor_id and document details
✅ PASS
```

---

## Part 9: Database Schema (Already Exists)

The `vendor_verification_documents` table should already exist. If not, create it:

```sql
CREATE TABLE vendor_verification_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  document_url TEXT NOT NULL,
  document_type VARCHAR(50), -- business_registration, tax_id, license, other
  company_registration_number VARCHAR(100),
  company_registration_date DATE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
  rejection_reason TEXT,
  verified_by UUID REFERENCES admin_users(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_vendor_verification_documents_vendor_id 
ON vendor_verification_documents(vendor_id);
```

---

## ✅ Checklist

- [ ] Updated steps array (6 → 7 steps)
- [ ] Added form state fields:
  - [ ] verificationDocument
  - [ ] documentFile
  - [ ] documentType
  - [ ] companyRegistrationNumber
  - [ ] uploadingDocument
  - [ ] documentUploadProgress
  - [ ] documentUploadError
- [ ] Added handleDocumentUpload function
- [ ] Added getFileExtension helper
- [ ] Added Step 4 case in validation switch (returns true - optional)
- [ ] Updated Step 5, 6, 7 cases in validation switch (shifted from 4, 5, 6)
- [ ] Added Step 4 UI component with:
  - [ ] Document type dropdown
  - [ ] Registration number input
  - [ ] File upload area
  - [ ] Upload progress bar
  - [ ] Error messages
  - [ ] Back/Continue buttons
- [ ] Updated all step references (1-7 instead of 1-6)
- [ ] Updated handleSubmit to save documents to database
- [ ] Tested all 5 test scenarios
- [ ] Verified database table exists
- [ ] All code in place and tested

---

## 🚀 Implementation Summary

**Files to Edit**: 1 (`/app/vendor-registration/page.js`)  
**Lines to Add**: ~400 lines total  
**Time Required**: 20-30 minutes  
**Difficulty**: Medium  
**Testing Required**: Yes (5 test scenarios)  

**Key Changes**:
1. ✅ 6 steps → 7 steps
2. ✅ New Step 4: Document Upload
3. ✅ Old Steps 4-6 become Steps 5-7
4. ✅ Form state with document fields
5. ✅ File upload handler with S3 integration
6. ✅ Document save to database on completion

**No Breaking Changes**:
- Old vendors unaffected
- Document step is optional
- Existing registrations continue to work

---

## 📝 Commit Message

```
feat: Add optional document upload step to vendor registration

- Add Step 4: Optional document upload (business registration, tax ID, license)
- Shift Details/Plan/Complete to steps 5-7
- Support PDF, JPG, PNG files (max 10MB)
- Save documents to vendor_verification_documents table
- Add validation and error handling for file uploads
- Include upload progress indicator
- Allow users to skip document upload

Closes: [issue number if applicable]
```
