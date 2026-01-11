# S3 Upload Flow - Detailed Diagnostic

## Architecture Overview

```
BROWSER                          SERVER                         AWS S3
─────────────────────────────────────────────────────────────────────

User selects image
        │
        ├─ Compress image
        │   (1920x1440 max)
        │
        ├─ POST /api/status-updates/upload-image
        │  (fileName, contentType)
        │────────────────────────────────────┼────────┐
        │                                     │        │
        │                                  Verify AWS │
        │                                  credentials│
        │                                     │        │
        │                                  Generate   │
        │                                  PutObject  │
        │                                  command    │
        │                                     │        │
        │                                  Call       │
        │                                  getSignedUrl
        │                                     │        │
        │                         ┌─────────────────────┐
        │                         │ Create presigned    │
        │                         │ PUT URL with        │
        │                         │ signature           │
        │                         └─────────────────────┘
        │←─── { presignedUrl }  ────────────────────────────┤
        │
        ├─ PUT presignedUrl
        │  (with file blob)
        │────────────────────────────────────────────────────────┤
        │                                                        │
        │                                              Validate  │
        │                                              signature │
        │                                                        │
        │                                              Store     │
        │                                              object    │
        │                                                        │
        │                                          ┌──────────┐  │
        │                                          │ File     │  │
        │                                          │ stored   │  │
        │                                          │ in S3    │  │
        │                                          └──────────┘  │
        │←─── 200 OK ─────────────────────────────────────────────┤
        │
        ├─ Store presignedUrl in images array
        │
        ├─ POST /api/status-updates
        │  (vendorId, content, images: [...urls...])
        │────────────────────────────────────┤
        │                                     │
        │                                  Save to
        │                                  Supabase
        │                                  vendor_status_updates
        │                                  .images array
        │                                     │
        │←─── { update } ────────────────────────┤
        │
        └─ Display update in feed
           Load images from presignedUrls
           S3 validates signature, serves image
           Display in carousel
```

---

## Critical Paths to Check

### Path 1: Presigned URL Generation

**File**: `/pages/api/status-updates/upload-image.js`

**What happens:**
1. Request arrives: `{ fileName, contentType }`
2. Validates file type (JPEG, PNG, WebP, GIF)
3. Creates S3 key with prefix: `vendor-profiles/status-updates/{fileName}`
4. Calls `generatePresignedUploadUrl()` from `/lib/aws-s3.js`
5. Returns `{ presignedUrl }`

**What can go wrong:**
- AWS credentials missing/invalid
- S3 bucket not configured
- Metadata in PutObject command causes signature mismatch
- getSignedUrl throws error

**Debug logs to check:**
- "🎯 Generating presigned URL for status update image"
- "✅ Generated presigned URL for status update image"
- If error: "❌ Failed to generate presigned URL"

---

### Path 2: Direct S3 Upload

**File**: `/components/vendor-profile/StatusUpdateModal.js` lines 63-110

**What happens:**
1. Gets presigned URL from endpoint
2. Compresses file (canvas-based)
3. Makes PUT request to presigned URL
4. Includes `Content-Type` header
5. Body is compressed file blob
6. Returns presigned URL to component

**What can go wrong:**
- Presigned URL invalid
- Content-Type header wrong
- File blob not correct format
- S3 signature validation fails
- CORS issues

**Debug logs to check:**
- "✅ Got presigned URL"
- "✅ Uploaded to S3: {url}"
- If error: "❌ S3 upload error"

---

### Path 3: Database Save

**File**: `/app/api/status-updates/route.js` POST handler

**What happens:**
1. Receives `{ vendorId, content, images }`
2. Validates vendor exists
3. Inserts into `vendor_status_updates`
4. Saves images array directly
5. Returns update object

**What can go wrong:**
- Images array is empty
- Images array has wrong format (should be strings)
- Database insert fails
- Vendor not found

**Debug logs to check:**
- "📝 Creating status update for vendor"
- "Images: {count}"
- "✅ Status update created"

---

## Step-by-Step Verification

### Step 1: Check AWS Credentials

Create a simple test endpoint to verify AWS is configured:

**File to create**: `/pages/api/test-s3.js`

```javascript
export default async function handler(req, res) {
  console.log('🔍 AWS Configuration Check:');
  console.log('  AWS_REGION:', process.env.AWS_REGION ? '✅ Set' : '❌ Missing');
  console.log('  AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET ? '✅ Set' : '❌ Missing');
  console.log('  AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
  console.log('  AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
  
  return res.status(200).json({
    region: process.env.AWS_REGION ? 'set' : 'missing',
    bucket: process.env.AWS_S3_BUCKET || 'not set',
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
  });
}
```

Then call: `http://localhost:3000/api/test-s3`

Expected response:
```json
{
  "region": "set",
  "bucket": "zintra-platform",
  "hasAccessKey": true,
  "hasSecretKey": true
}
```

---

### Step 2: Test Presigned URL Generation

Call directly in browser console:

```javascript
const response = await fetch('/api/status-updates/upload-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'test-image.jpg',
    contentType: 'image/jpeg'
  })
});

const data = await response.json();
console.log('Status:', response.status);
console.log('Presigned URL:', data.presignedUrl);
```

Expected:
- Status: 200
- presignedUrl: Valid S3 URL with signature

If error:
- Status: 500
- Check server logs for "❌ Failed to generate presigned URL"

---

### Step 3: Test S3 Upload

If presigned URL works, test PUT:

```javascript
const presignedUrl = '...'; // From Step 2

// Create a test blob
const blob = new Blob(['test data'], { type: 'application/octet-stream' });

const uploadResponse = await fetch(presignedUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/octet-stream' },
  body: blob
});

console.log('Upload Status:', uploadResponse.status);
```

Expected:
- Status: 200 or 201

If error:
- Status: 403 = Signature invalid
- Status: 400 = Bad request
- Check AWS S3 bucket CORS settings

---

### Step 4: Test Database Save

After successful S3 upload, test API:

```javascript
const response = await fetch('/api/status-updates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vendorId: 'your-vendor-id',
    content: 'Test update',
    images: ['https://your-s3-presigned-url']
  })
});

const data = await response.json();
console.log('Status:', response.status);
console.log('Update:', data.update);
```

Expected:
- Status: 201
- update object with images array

---

## Browser DevTools Network Tab

When uploading, you should see:

### Request 1: Get Presigned URL
```
POST /api/status-updates/upload-image
Status: 200
Response: { presignedUrl, bucket, region }
```

### Request 2: Upload to S3
```
PUT https://zintra-platform.s3.amazonaws.com/vendor-profiles/status-updates/...
Status: 200
Headers: Content-Type: image/jpeg
```

### Request 3: Save to Database
```
POST /api/status-updates
Status: 201
Response: { message, update }
```

---

## Supabase Database Check

After creating update, verify in Supabase:

1. Open `vendor_status_updates` table
2. Find your new record
3. Check `images` column - should contain:
   ```json
   [
     "https://zintra-platform.s3.amazonaws.com/vendor-profiles/status-updates/...-photo.jpg?X-Amz-Signature=..."
   ]
   ```

If images column is empty:
- Images array didn't get sent to API
- API didn't save it properly

---

## AWS S3 Console Check

1. Login to AWS S3 console
2. Open bucket: `zintra-platform`
3. Navigate to: `vendor-profiles/status-updates/`
4. Should see files with names like:
   - `1704952800123-abc123-photo.jpg`
5. Click on file, should show:
   - Object Size (KB)
   - Last Modified date
   - Content Type: `image/jpeg`

If folder is empty:
- S3 upload never happened
- Presigned URL generation failed

---

## Common Issues & Solutions

| Issue | Symptom | Root Cause | Fix |
|-------|---------|-----------|-----|
| Missing AWS credentials | Presigned URL endpoint returns 500 | `.env.local` missing AWS_* vars | Add AWS variables to `.env.local` |
| S3 upload returns 403 | "S3 upload failed with status 403" | Signature invalid or expired | Check presigned URL format, verify AWS permissions |
| Images not saved | Update created but images array empty | Images not sent to API | Check modal is building images array correctly |
| Images show error | Carousel displays but images fail | Signature removed from URL | Verify StatusUpdateModal returns full presignedUrl |
| CORS error | Browser console shows CORS error | S3 bucket CORS not configured | Configure S3 CORS to allow PUT from your domain |

---

## What to Report Back

Once you test, provide:

1. **Presigned URL generation**:
   - Does `/api/status-updates/upload-image` work?
   - Does it return a valid presigned URL?

2. **S3 upload**:
   - Does the PUT to S3 succeed?
   - What status code?
   - Any errors in browser console?

3. **Database save**:
   - Does `/api/status-updates` POST work?
   - Are images in the database?
   - What format are they in?

4. **S3 files**:
   - Are files actually in S3 bucket?
   - Are they in the right folder?

5. **Images display**:
   - Do they load in carousel?
   - Any 403 errors?
   - Any other errors?

With this info, we can pinpoint exactly where it breaks!
