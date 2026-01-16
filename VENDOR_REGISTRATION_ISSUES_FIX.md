# 🔴 VENDOR PROFILE CREATION - CRITICAL ISSUES & FIXES

**Date**: January 16, 2026  
**Status**: Issues Identified & Solutions Ready  
**Severity**: HIGH - Blocking vendor registration  

---

## 📋 Issues Identified

### Issue #1: S3 Upload Fails with CORS Error
```
❌ Logo upload failed: TypeError: Failed to fetch
   PUT https://zintra-images-prod.s3.us-east-1.amazonaws.com/...
   net::ERR_FAILED
```

**Root Cause**: AWS S3 CORS configuration is not allowing the presigned URL PUT requests from your frontend domain.

### Issue #2: Missing Optional Document Upload Step
```
✅ Got presigned URL for vendor profile image
✅ Logo uploaded
❌ BUT: No option to upload verification documents in registration
❌ Missing step for optional business documents
```

**Root Cause**: Vendor registration only has 6 steps, document upload is not included.

---

## ✅ FIX #1: S3 CORS Configuration

### The Problem
When browser tries to PUT to S3 presigned URL, S3 rejects it because CORS headers aren't set.

### The Solution

Add CORS configuration to your AWS S3 bucket:

**Step 1: Go to AWS Console**
1. Open AWS S3 Console
2. Select bucket: `zintra-images-prod`
3. Click "Permissions" tab
4. Scroll down to "Cross-origin resource sharing (CORS)"

**Step 2: Add CORS Configuration**

Replace existing CORS with this:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "https://zintra-sandy.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://zintra.vercel.app",
      "https://*.vercel.app"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-version-id"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

**Step 3: Save and wait**
- Click "Save changes"
- Wait 2-3 minutes for AWS to apply CORS
- Clear browser cache (Ctrl+Shift+Delete)

### Why This Works
- `AllowedOrigins`: Tells S3 to accept PUT requests from your Vercel domain
- `AllowedMethods`: Allows PUT (upload) requests
- `ExposeHeaders`: Returns required headers to browser
- `MaxAgeSeconds`: Caches CORS config for 3000 seconds

### Test CORS Fix

1. Go to /vendor-registration
2. Try uploading a logo
3. Should upload to S3 successfully
4. Check browser console - no more errors

---

## ✅ FIX #2: Add Document Upload Step

### Current Vendor Registration Steps
```
Step 1: Account (Email/Password)
Step 2: Business Info (Phone OTP verification)
Step 3: Categories
Step 4: Details (Products/Services)
Step 5: Plan Selection
Step 6: Complete
```

### Proposed New Steps (Add Document Upload)
```
Step 1: Account (Email/Password)
Step 2: Business Info (Phone OTP verification)
Step 3: Categories
Step 4: ⭐ OPTIONAL Document Upload (NEW)
Step 5: Details (Products/Services)
Step 6: Plan Selection
Step 7: Complete
```

### Implementation

**File**: `/app/vendor-registration/page.js`

#### Step 1: Update Step Count

Find line with `const steps = [` and update:

```javascript
const steps = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Business Info' },
  { id: 3, label: 'Categories' },
  { id: 4, label: 'Documents' },      // ⭐ NEW STEP
  { id: 5, label: 'Details' },
  { id: 6, label: 'Plan' },
  { id: 7, label: 'Complete' },       // Changed from 6 to 7
];
```

#### Step 2: Add Form Data Fields

Find `const [formData, setFormData]` and add:

```javascript
const [formData, setFormData] = useState({
  // ... existing fields ...
  
  // ⭐ NEW: Document upload fields
  verificationDocument: null,
  documentFile: null,
  documentType: 'business_registration', // business_registration | tax_id | license | other
  companyRegistrationNumber: '',
  companyRegistrationDate: '',
  companyTaxId: '',
});
```

#### Step 3: Add Document Upload State

Add new state for document upload:

```javascript
const [uploadingDocument, setUploadingDocument] = useState(false);
const [documentUploadProgress, setDocumentUploadProgress] = useState(0);
const [documentUrl, setDocumentUrl] = useState(null);
const fileInputRef = useRef(null);
```

#### Step 4: Add Document Upload Handler

Add this function before `handleSubmit`:

```javascript
const handleDocumentUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validation
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  if (file.size > maxSize) {
    setOtpMessage('❌ Document must be less than 10MB');
    return;
  }

  if (!allowedTypes.includes(file.type)) {
    setOtpMessage('❌ Only PDF, JPG, or PNG files allowed');
    return;
  }

  setUploadingDocument(true);
  setOtpMessage('');

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    // Step 1: Get presigned URL
    const presignedResponse = await fetch('/api/vendor/upload-verification-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        vendorId: null, // Not created yet, will use user ID as reference
      }),
    });

    if (!presignedResponse.ok) {
      const error = await presignedResponse.json();
      throw new Error(error.error || 'Failed to get upload URL');
    }

    const { uploadUrl, fileUrl } = await presignedResponse.json();

    // Step 2: Upload to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    // Success
    setFormData(prev => ({ ...prev, documentFile: file }));
    setDocumentUrl(fileUrl);
    setOtpMessage('✅ Document uploaded successfully');
  } catch (err) {
    console.error('Document upload error:', err);
    setOtpMessage('❌ ' + err.message);
  } finally {
    setUploadingDocument(false);
  }
};
```

#### Step 5: Update Validation Logic

Find validation function and add case for Step 4:

```javascript
if (currentStep === 4) {
  // Step 4 is OPTIONAL - vendor can skip or upload
  // No validation errors needed
  return true;
}
```

Update remaining steps from 4→5, 5→6, etc.

#### Step 6: Add Step 4 UI Rendering

Add before the `// Step 5:` comment:

```javascript
{/* STEP 4: OPTIONAL DOCUMENT UPLOAD */}
{currentStep === 4 && (
  <div>
    <h2 className="text-2xl font-bold mb-2" style={{ color: brand.slate }}>
      📄 Verification Document
    </h2>
    <p className="text-gray-600 mb-6">
      Optional: Upload a business registration, tax ID, or license document to boost your credibility
    </p>

    {/* Document Type Selection */}
    <div className="mb-6">
      <label className="block text-sm font-semibold mb-2" style={{ color: brand.slate }}>
        Document Type
      </label>
      <select
        value={formData.documentType}
        onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
        style={{ '--tw-ring-color': brand.primary }}
      >
        <option value="business_registration">Business Registration Certificate</option>
        <option value="tax_id">Tax ID / VAT Certificate</option>
        <option value="license">Business License</option>
        <option value="other">Other Official Document</option>
      </select>
    </div>

    {/* Company Registration Number */}
    <div className="mb-6">
      <label className="block text-sm font-semibold mb-2" style={{ color: brand.slate }}>
        Registration Number (optional)
      </label>
      <input
        type="text"
        value={formData.companyRegistrationNumber}
        onChange={(e) => setFormData({ ...formData, companyRegistrationNumber: e.target.value })}
        placeholder="e.g., BRN-123456789"
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
        style={{ '--tw-ring-color': brand.primary }}
      />
    </div>

    {/* File Upload */}
    <div className="mb-6">
      <label className="block text-sm font-semibold mb-2" style={{ color: brand.slate }}>
        Upload Document
      </label>
      <div
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition hover:bg-gray-50"
        style={{ borderColor: brand.primary }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: brand.primary }} />
        <p className="font-semibold" style={{ color: brand.slate }}>
          Drop file here or click to select
        </p>
        <p className="text-sm text-gray-500">PDF, JPG, or PNG (max 10MB)</p>
        {documentUrl && (
          <div className="mt-3 text-sm text-green-600 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {formData.documentFile?.name}
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleDocumentUpload}
        className="hidden"
      />
    </div>

    {/* Info Message */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <p className="text-sm text-blue-800">
        💡 <strong>Tip:</strong> Adding verification documents helps build trust with customers. You can also add this later in your profile settings.
      </p>
    </div>

    {otpMessage && (
      <div className={`p-3 rounded-lg mb-6 text-sm ${otpMessage.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {otpMessage}
      </div>
    )}

    {/* Navigation */}
    <div className="flex gap-3">
      <button
        onClick={() => setCurrentStep(3)}
        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
      >
        <ChevronLeft className="w-4 h-4 inline mr-2" />
        Back
      </button>
      <button
        onClick={() => {
          setOtpMessage('');
          setCurrentStep(5);
        }}
        disabled={uploadingDocument}
        className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
        style={{ backgroundColor: brand.primary }}
      >
        {uploadingDocument ? 'Uploading...' : 'Continue'} →
      </button>
    </div>
  </div>
)}
```

---

## 🧪 Testing Plan

### Test 1: CORS Fix for Logo Upload
```
1. Go to /vendor-registration
2. Get to Step 1 (Account)
3. Fill email/password
4. Should NOT show logo upload error
```

### Test 2: Document Upload Step
```
1. Complete Steps 1-3
2. Arrive at Step 4 (Documents)
3. Should see:
   - Document Type dropdown
   - Registration Number input
   - File upload area
   - Can skip or upload
4. Upload a PDF
5. Should see "✅ Document uploaded successfully"
6. Click Continue → Step 5
```

### Test 3: Complete Registration Without Documents
```
1. Reach Step 4
2. Skip (click Continue without uploading)
3. Complete rest of registration
4. Should work fine without documents
```

---

## 🚀 Deployment

### Step 1: Fix AWS S3 CORS (10 minutes)
- Go to AWS Console
- Update CORS config for `zintra-images-prod`
- Wait 3 minutes for changes to apply

### Step 2: Update Vendor Registration Code (20 minutes)
- Update step count
- Add form fields
- Add upload handler
- Add UI for Step 4
- Update validation logic

### Step 3: Test (15 minutes)
- Create new vendor account
- Upload logo
- Upload document
- Complete registration
- Verify in database

### Step 4: Deploy (5 minutes)
```bash
git add -A
git commit -m "feat: Add document upload step + fix S3 CORS"
git push origin main
```

---

## 📊 Files to Modify

### PRIMARY: `/app/vendor-registration/page.js`
- Update step definitions (lines 23-30)
- Add form fields (around line 110)
- Add state variables (around line 140)
- Add validation (around line 320)
- Add document upload handler (before handleSubmit)
- Add Step 4 UI rendering (before Step 5)
- Update step navigation numbers

### SECONDARY: AWS S3 Console
- Update CORS configuration
- No code changes needed

---

## ⚠️ Important Notes

1. **Document Upload is OPTIONAL**
   - Vendors can skip this step
   - Not required to complete registration
   - Can be added later in profile

2. **S3 CORS Must Be Fixed First**
   - Logo upload will continue to fail until CORS is updated
   - This is blocking vendor registration

3. **Document Verification**
   - Documents uploaded in registration marked as pending
   - Admin will review separately
   - Doesn't block vendor registration

4. **Backward Compatibility**
   - Existing vendors unaffected
   - New vendors see new 7-step flow
   - Can revert step count if issues

---

## 💡 Future Enhancements

1. **Email verification** for submitted documents
2. **Auto-verification** using AI (OCR reading)
3. **Document expiry** tracking and reminders
4. **Multi-document** upload (multiple verification types)
5. **Document history** showing previous submissions

---

**Status**: Ready for implementation  
**Estimated Time**: 35-50 minutes  
**Complexity**: Medium  
**Risk**: Low (optional feature)
