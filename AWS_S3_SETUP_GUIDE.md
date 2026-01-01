# AWS S3 Image Upload Setup Guide

## Overview

This guide walks through the AWS S3 image upload integration for vendor profiles. Images are uploaded directly from the browser to S3, bypassing your server.

---

## 1. Prerequisites

### Install Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Or with yarn:
```bash
yarn add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## 2. Environment Setup

### Add AWS Credentials to `.env.local`

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_new_access_key_here
AWS_SECRET_ACCESS_KEY=your_new_secret_key_here
AWS_S3_BUCKET=your_bucket_name
```

**Important:**
- ✅ Never share these credentials
- ✅ `.env.local` is in `.gitignore` (already done)
- ✅ Rotate credentials regularly
- ✅ Use IAM roles in production (best practice)

### AWS IAM Permissions Required

Your IAM user needs these S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your_bucket_name",
        "arn:aws:s3:::your_bucket_name/*"
      ]
    }
  ]
}
```

---

## 3. Files Created

### `/lib/aws-s3.js`
Utility functions for S3 operations:
- `generatePresignedUploadUrl()` - Generate upload URLs
- `uploadFileToS3()` - Server-side uploads
- `generateFileAccessUrl()` - Access existing files
- `deleteFileFromS3()` - Delete files
- `validateFile()` - Validate before upload
- `sanitizeFileName()` - Safe file names

### `/pages/api/vendor/upload-image.js`
API endpoint that:
- Authenticates user with Supabase
- Validates file
- Generates presigned URL
- Returns URL to client

### `/components/vendor/VendorImageUpload.js`
React component with:
- File input and selection
- Image preview
- Direct S3 upload
- Progress tracking
- Error handling
- Success messages

---

## 4. Integration Steps

### Step 1: Add Upload Component to Vendor Profile Page

In your vendor profile page (e.g., `pages/vendor/[id]/edit.js`):

```javascript
import VendorImageUpload from '@/components/vendor/VendorImageUpload';
import { useState } from 'react';

export default function VendorProfileEdit() {
  const [profileImage, setProfileImage] = useState(null);
  const vendorId = /* get from route params */;

  const handleUploadSuccess = (fileData) => {
    console.log('Uploaded:', fileData);
    // Save fileData.fileUrl to database
    // Save fileData.key for future deletion
    setProfileImage(fileData);
  };

  const handleUploadError = (error) => {
    console.error('Upload failed:', error);
  };

  return (
    <div>
      {/* Other form fields */}
      
      <VendorImageUpload
        vendorId={vendorId}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
        options={{
          maxSize: 10 * 1024 * 1024, // 10MB
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          label: 'Upload Profile Image',
        }}
      />

      {profileImage && (
        <div>
          <h3>Uploaded Image:</h3>
          <img 
            src={profileImage.fileUrl} 
            alt="Profile" 
            style={{ maxWidth: '200px' }}
          />
          <p>Size: {profileImage.size} bytes</p>
          <p>Key: {profileImage.key}</p>
        </div>
      )}
    </div>
  );
}
```

### Step 2: Store File Info in Database

After successful upload, save to Supabase:

```javascript
const { data, error } = await supabase
  .from('VendorProfile')
  .update({
    profile_image_url: fileData.fileUrl,
    profile_image_key: fileData.key, // Store for deletion later
    updated_at: new Date(),
  })
  .eq('id', vendorId);
```

### Step 3: Display Uploaded Images

In your vendor profile view:

```javascript
{vendor.profile_image_url && (
  <div className="w-32 h-32 relative rounded-lg overflow-hidden">
    <Image
      src={vendor.profile_image_url}
      alt={vendor.name}
      fill
      className="object-cover"
    />
  </div>
)}
```

---

## 5. AWS S3 Bucket Configuration

### Required Bucket Settings

#### 1. CORS Configuration
Allow browsers to upload directly. In AWS Console:

1. Go to S3 → Your Bucket → Permissions → CORS
2. Add this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://yourdomain.com"
    ],
    "ExposeHeaders": ["ETag", "x-amz-version-id"],
    "MaxAgeSeconds": 3000
  }
]
```

#### 2. Bucket Public Access
Keep public access **OFF** (default):
- Bucket Policies: Block Public Access
- ACLs: Disabled

#### 3. Versioning (Optional)
Enable versioning for backup:
1. Go to Properties → Versioning
2. Click Enable Versioning

---

## 6. Security Best Practices

### 1. Access Control
✅ **DO:**
- Use presigned URLs (time-limited)
- Verify user owns vendor profile before upload
- Validate file type and size
- Store file keys in database (for deletion)

❌ **DON'T:**
- Commit credentials to git
- Use long-lived presigned URLs
- Allow unauthenticated uploads
- Store files in version control

### 2. File Validation
```javascript
// Server-side validation (in API route)
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxSize = 5 * 1024 * 1024; // 5MB

if (!allowedTypes.includes(contentType)) {
  throw new Error('Invalid file type');
}
```

### 3. Sanitize File Names
The `sanitizeFileName()` utility:
- Removes special characters
- Converts to lowercase
- Limits length
- Preserves extension

### 4. Presigned URL Expiry
- Upload URLs: 1 hour (can be shorter)
- Download URLs: 10 hours (can be longer)
- Configure in `AWS_S3.js`

---

## 7. Testing

### Test 1: Local Upload
1. Start dev server: `npm run dev`
2. Navigate to vendor profile edit page
3. Select an image
4. Click Upload
5. Verify success message
6. Check S3 bucket for uploaded file

### Test 2: Direct S3 Verification
```bash
# List uploaded files
aws s3 ls s3://your_bucket_name/vendor-profiles/ --recursive

# View specific file
aws s3api head-object \
  --bucket your_bucket_name \
  --key vendor-profiles/TIMESTAMP-vendor-image.jpg
```

### Test 3: Access Control
- ✅ User can upload their own vendor image
- ✅ User cannot upload for another vendor
- ✅ Image is accessible via presigned URL
- ✅ Image is not public (bucket is private)

### Test 4: Error Handling
- Test oversized file (> 5MB)
- Test invalid file type (.txt, .exe, etc)
- Test network failure during upload
- Verify error messages display

---

## 8. Troubleshooting

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:** Update S3 bucket CORS policy with your domain

```bash
aws s3api put-bucket-cors \
  --bucket your_bucket_name \
  --cors-configuration file://cors.json
```

### Issue: "Access Denied" on upload

**Solution:** Check IAM permissions include `s3:PutObject`

```bash
# Test permissions
aws s3 put-object \
  --bucket your_bucket_name \
  --key test-file.txt \
  --body /dev/null
```

### Issue: Presigned URL expired before upload

**Solution:** Increase expiry time in `generatePresignedUploadUrl()`

```javascript
const command = new PutObjectCommand({...});
const url = await getSignedUrl(s3Client, command, {
  expiresIn: 7200, // 2 hours instead of 1
});
```

### Issue: File not found after upload

**Solution:** Verify file was actually written to S3

```bash
aws s3api get-object \
  --bucket your_bucket_name \
  --key vendor-profiles/your-file.jpg \
  /dev/null
```

---

## 9. Production Considerations

### 1. Use IAM Roles (Not Access Keys)
In production, use EC2/ECS IAM roles instead of stored credentials:

```javascript
// Instead of hardcoded credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  // Credentials auto-detected from IAM role
});
```

### 2. Enable S3 Encryption
- Go to S3 → Bucket → Properties
- Enable "Default encryption"
- Use AWS-managed keys (KMS)

### 3. Enable Logging
Track all S3 access:
1. Go to Properties → Server access logging
2. Enable with target bucket
3. Review logs regularly

### 4. Set Lifecycle Policies
Auto-delete old images:

```
Rule: Delete images older than 90 days
Prefix: vendor-profiles/
Days: 90
```

### 5. CloudFront Distribution
For faster image delivery:
1. Create CloudFront distribution
2. Set S3 bucket as origin
3. Use CloudFront URLs instead of S3 direct URLs

---

## 10. API Reference

### `generatePresignedUploadUrl(fileName, contentType, metadata)`

Generate URL for browser upload

**Parameters:**
- `fileName` (string) - Original file name
- `contentType` (string) - MIME type
- `metadata` (object) - Additional metadata

**Returns:**
```javascript
{
  uploadUrl: "https://bucket.s3.amazonaws.com/...",
  fileUrl: "https://bucket.s3.amazonaws.com/...",
  key: "vendor-profiles/1234-abcd-file.jpg"
}
```

### `uploadFileToS3(fileKey, buffer, contentType, metadata)`

Server-side upload

**Parameters:**
- `fileKey` (string) - S3 object key
- `buffer` (Buffer) - File contents
- `contentType` (string) - MIME type
- `metadata` (object) - Additional metadata

### `generateFileAccessUrl(fileKey, expiresIn)`

Get presigned URL for existing file

**Parameters:**
- `fileKey` (string) - S3 object key
- `expiresIn` (number) - Seconds until expiry

**Returns:**
- Presigned URL string

### `deleteFileFromS3(fileKey)`

Delete a file from S3

**Parameters:**
- `fileKey` (string) - S3 object key

**Returns:**
- Boolean (true if successful)

---

## 11. Next Steps

1. ✅ Install AWS SDK dependencies
2. ✅ Add credentials to `.env.local`
3. ✅ Configure S3 bucket CORS
4. ✅ Add VendorImageUpload component to edit page
5. ✅ Save file URLs to database
6. ✅ Display images in vendor profile
7. ✅ Test end-to-end
8. ✅ Deploy to production

---

## Support

For issues:
1. Check AWS S3 documentation: https://docs.aws.amazon.com/s3/
2. Check AWS SDK docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/
3. Review security best practices: https://aws.amazon.com/s3/security/
