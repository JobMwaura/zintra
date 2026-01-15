# AWS S3 Consolidated File Structure

## Overview

All vendor-related uploads (verification documents, business updates, and portfolio images) are stored in a **single AWS S3 bucket** for cost efficiency and simplified management.

## Benefits of Consolidation

✅ **Cost Savings**: Single S3 bucket = lower costs than multiple buckets  
✅ **Simplified Management**: One set of permissions, one CORS config  
✅ **Consistent Architecture**: All uploads use same AWS SDK setup  
✅ **Easier Monitoring**: All vendor files in one place  
✅ **Unified Backup**: Single bucket backup strategy

## S3 Bucket Structure

```
zintra-vendor-uploads/  (or your bucket name)
│
├── vendor-verification/          # Business verification documents
│   ├── {vendor-uuid}/
│   │   ├── 1234567890-abc123.pdf
│   │   ├── 1234567891-def456.jpg
│   │   └── ...
│   └── ...
│
├── status-updates/               # Business update images
│   ├── {vendor-uuid}/
│   │   ├── 1234567890-ghi789.jpg
│   │   ├── 1234567891-jkl012.png
│   │   └── ...
│   └── ...
│
├── portfolio-images/             # Portfolio project images
│   ├── {vendor-uuid}/
│   │   ├── 1234567890-mno345.jpg
│   │   ├── 1234567891-pqr678.png
│   │   └── ...
│   └── ...
│
├── rfq-images/                   # RFQ attachment images
│   ├── 1234567890-stu901-image.jpg
│   └── ...
│
└── vendor-profile/               # Vendor logos and cover images
    ├── logos/
    │   ├── {vendor-uuid}.jpg
    │   └── ...
    └── covers/
        ├── {vendor-uuid}.jpg
        └── ...
```

## File Naming Convention

### Verification Documents
```
vendor-verification/{vendor-uuid}/{timestamp}-{random}.{ext}
Example: vendor-verification/a1b2c3d4.../1706745600-abc123.pdf
```

### Business Updates
```
status-updates/{vendor-uuid}/{timestamp}-{random}.{ext}
Example: status-updates/a1b2c3d4.../1706745600-def456.jpg
```

### Portfolio Images
```
portfolio-images/{vendor-uuid}/{timestamp}-{random}.{ext}
Example: portfolio-images/a1b2c3d4.../1706745600-ghi789.png
```

### RFQ Images
```
rfq-images/{timestamp}-{random}-{filename}
Example: rfq-images/1706745600-jkl012-blueprint.jpg
```

## Environment Variables

All upload endpoints use the **same environment variables**:

```env
# AWS S3 Configuration (single bucket for all uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA******************
AWS_SECRET_ACCESS_KEY=****************************************
AWS_S3_BUCKET=zintra-vendor-uploads  # Single bucket name
```

⚠️ **Note**: You may see `AWS_S3_BUCKET_NAME` in older code - this is being phased out in favor of the standard `AWS_S3_BUCKET`.

## Upload Endpoints Using S3

### 1. Verification Documents
**Endpoint**: `POST /api/vendor/upload-verification-document`

**Usage**:
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('vendorId', vendorId);

const response = await fetch('/api/vendor/upload-verification-document', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});

const { fileUrl, s3Key } = await response.json();
// fileUrl: Full S3 URL for immediate use
// s3Key: Store in database for presigned URLs later
```

### 2. Business Updates (Status Updates)
**Endpoint**: Uses `lib/aws-s3.js` → `generatePresignedUploadUrl()`

**Usage**:
```javascript
import { generatePresignedUploadUrl } from '@/lib/aws-s3';

const { uploadUrl, fileUrl, key } = await generatePresignedUploadUrl(
  file.name,
  file.type,
  { vendor_id: vendorId },
  'status-updates/'
);

// Upload directly from browser to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type },
});
```

### 3. Portfolio Images
**Endpoint**: `POST /api/portfolio/images`

**Process**:
1. Upload image via presigned URL (same as business updates)
2. Save S3 key in database via API

```javascript
// Step 1: Get presigned URL
const { uploadUrl, fileUrl, key } = await generatePresignedUploadUrl(
  file.name,
  file.type,
  { vendor_id: vendorId },
  'portfolio-images/'
);

// Step 2: Upload to S3
await fetch(uploadUrl, { method: 'PUT', body: file });

// Step 3: Save to database
await fetch('/api/portfolio/images', {
  method: 'POST',
  body: JSON.stringify({
    projectId: projectId,
    imageUrl: key, // Store S3 key, not full URL
    imageType: 'before',
    displayOrder: 0,
  }),
});
```

### 4. RFQ Images
**Endpoint**: Uses `lib/aws-s3.js` → `generatePresignedUploadUrl()`

**Usage**: Same pattern as business updates with `'rfq-images/'` prefix.

## S3 Client Configuration

All endpoints use the same S3 client initialization:

```javascript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
```

## Metadata Storage

Each upload includes metadata for tracking and organization:

### Verification Documents
```javascript
Metadata: {
  vendorId: 'uuid',
  uploadedBy: 'user-uuid',
  originalName: 'business-license.pdf',
  uploadType: 'verification_document',
}
```

### Business Updates
```javascript
Metadata: {
  'uploaded-at': '2026-01-15T10:30:00Z',
  vendor_id: 'uuid',
}
```

### Portfolio Images
```javascript
Metadata: {
  'uploaded-at': '2026-01-15T10:30:00Z',
  vendor_id: 'uuid',
  project_id: 'uuid',
}
```

## File Type & Size Limits

### Verification Documents
- **Types**: PDF, JPG, PNG
- **Max Size**: 10 MB per file
- **Validation**: Server-side in API route

### Business Updates
- **Types**: JPG, PNG, GIF
- **Max Size**: 5 MB per file
- **Max Count**: 5 images per update
- **Validation**: Client-side and server-side

### Portfolio Images
- **Types**: JPG, PNG
- **Max Size**: 5 MB per file
- **Max Count**: 20 images per project (varies by type)
- **Validation**: Client-side and server-side

## IAM Permissions

The IAM user needs permissions for all prefixes in the bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::zintra-vendor-uploads/*",
        "arn:aws:s3:::zintra-vendor-uploads"
      ]
    }
  ]
}
```

## CORS Configuration

Single CORS configuration for all upload types:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <CORSRule>
    <AllowedOrigin>http://localhost:3000</AllowedOrigin>
    <AllowedOrigin>https://yourdomain.com</AllowedOrigin>
    <AllowedOrigin>https://www.yourdomain.com</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>
```

## Database Storage

### Store S3 Keys, Not Full URLs

✅ **Recommended** (store S3 key):
```sql
document_url: 'vendor-verification/a1b2c3d4.../1706745600-abc123.pdf'
```

❌ **Avoid** (storing full presigned URL):
```sql
document_url: 'https://zintra-vendor-uploads.s3.us-east-1.amazonaws.com/vendor-verification/...'
```

**Why?**
- Presigned URLs expire (default 7 days)
- S3 keys can generate fresh presigned URLs anytime
- More flexible for future changes (region, bucket name)

### Example: Verification Documents Table

```sql
CREATE TABLE vendor_verification_documents (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  document_url TEXT NOT NULL, -- S3 key: 'vendor-verification/{vendor-uuid}/...'
  -- ... other columns
);
```

### Generating Presigned URLs

When serving documents to users, generate fresh presigned URLs:

```javascript
import { generateFileAccessUrl } from '@/lib/aws-s3';

// Get document from database
const { data: doc } = await supabase
  .from('vendor_verification_documents')
  .select('document_url')
  .eq('id', docId)
  .single();

// Generate fresh presigned URL (valid for 7 days)
const presignedUrl = await generateFileAccessUrl(doc.document_url);

// Return to frontend
return { url: presignedUrl };
```

## Cost Estimation

### Single Bucket (Consolidated)

**Scenario**: 1,000 vendors, each with:
- 2 verification documents (2 MB each) = 2,000 files, 4 GB
- 10 business updates (500 KB each) = 10,000 files, 5 GB
- 20 portfolio images (1 MB each) = 20,000 files, 20 GB
- **Total**: 32,000 files, 29 GB

**Monthly Costs**:
- Storage: 29 GB × $0.023/GB = **$0.67**
- PUT requests: 32,000 × $0.005/1000 = **$0.16**
- GET requests: 320,000 × $0.0004/1000 = **$0.13**
- **Total per month**: ~**$1.00**

### Multiple Buckets (Not Recommended)

If you used separate buckets:
- 3 buckets × same storage = 3× cost? **No, storage cost is the same**
- BUT: More complex to manage, 3× CORS configs, 3× IAM policies

**Verdict**: Single bucket is simpler with same cost!

## Security Best Practices

### 1. Private Bucket
```bash
# Block all public access
✅ Block public access to buckets and objects
```

### 2. Server-Side Validation
```javascript
// Validate file type before upload
const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}
```

### 3. Authentication Required
```javascript
// All upload endpoints require authentication
const authHeader = request.headers.get('authorization');
const { data: { user } } = await supabase.auth.getUser(token);
```

### 4. Vendor Ownership Validation
```javascript
// Verify user owns the vendor account
const { data: vendor } = await supabase
  .from('vendors')
  .select('id')
  .eq('user_id', user.id)
  .single();
```

### 5. Presigned URLs with Expiry
```javascript
// Presigned URLs expire after 7 days
const presignedUrl = await getSignedUrl(s3Client, command, {
  expiresIn: 7 * 24 * 60 * 60, // 7 days
});
```

## Migration from Separate Storage

If you previously had verification documents in a separate location:

### Option 1: Keep Existing Files (Recommended)
- New uploads use consolidated structure
- Old files remain in place
- Update code to handle both patterns

### Option 2: Migrate Existing Files
```javascript
// Pseudocode for migration
const docs = await supabase
  .from('vendor_verification_documents')
  .select('*')
  .like('document_url', 'verification-documents/%');

for (const doc of docs) {
  // Copy file to new location
  const oldKey = doc.document_url;
  const newKey = oldKey.replace('verification-documents/', 'vendor-verification/');
  
  await copyS3Object(oldKey, newKey);
  
  // Update database
  await supabase
    .from('vendor_verification_documents')
    .update({ document_url: newKey })
    .eq('id', doc.id);
  
  // Optionally delete old file
  await deleteS3Object(oldKey);
}
```

## Testing Checklist

After consolidation, verify all upload types work:

### ✅ Verification Documents
- [ ] Upload PDF from vendor verification page
- [ ] Upload JPG from vendor verification page
- [ ] Verify file appears in `vendor-verification/` folder
- [ ] Check database stores S3 key correctly
- [ ] Admin can view document with presigned URL

### ✅ Business Updates
- [ ] Upload image in business update
- [ ] Verify file appears in `status-updates/` folder
- [ ] Image displays in feed
- [ ] Presigned URL refreshes on page load

### ✅ Portfolio Images
- [ ] Upload before/during/after images
- [ ] Verify files appear in `portfolio-images/` folder
- [ ] Images display in portfolio gallery
- [ ] S3 keys stored in database

### ✅ RFQ Images
- [ ] Upload attachment to RFQ
- [ ] Verify file appears in `rfq-images/` folder
- [ ] Image displays in RFQ details

## Troubleshooting

### Error: "AWS_S3_BUCKET not configured"

**Solution**: Check environment variables
```bash
# .env.local
AWS_S3_BUCKET=zintra-vendor-uploads  # NOT AWS_S3_BUCKET_NAME
```

### Error: "Access Denied" on upload

**Solution**: Check IAM permissions include all prefixes
```json
"Resource": [
  "arn:aws:s3:::zintra-vendor-uploads/vendor-verification/*",
  "arn:aws:s3:::zintra-vendor-uploads/status-updates/*",
  "arn:aws:s3:::zintra-vendor-uploads/portfolio-images/*",
  "arn:aws:s3:::zintra-vendor-uploads/*"
]
```

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Solution**: Update CORS configuration to include your domain
```xml
<AllowedOrigin>https://yourdomain.com</AllowedOrigin>
```

### Verification documents not displaying

**Solution**: Check if storing full URLs vs S3 keys
```javascript
// Convert full URL to S3 key if needed
if (doc.document_url.includes('amazonaws.com')) {
  const url = new URL(doc.document_url);
  const s3Key = url.pathname.replace(/^\//, '');
  // Use s3Key for presigned URL generation
}
```

## Summary

✅ **Single AWS S3 bucket** for all vendor uploads  
✅ **Organized by prefix**: `vendor-verification/`, `status-updates/`, `portfolio-images/`  
✅ **Shared environment variables**: `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`  
✅ **Consistent file naming**: `{prefix}/{vendor-uuid}/{timestamp}-{random}.{ext}`  
✅ **Store S3 keys in database**, not full URLs  
✅ **Generate presigned URLs** when serving to users  
✅ **Cost-effective**: ~$1/month for 1,000 vendors  
✅ **Secure**: Private bucket, authentication required, server-side validation

---

**Next Steps**:
1. ✅ Update verification upload endpoint (completed)
2. ✅ Use `AWS_S3_BUCKET` environment variable (completed)
3. ✅ Store S3 keys in database (completed)
4. 🔄 Test uploads from all endpoints
5. 📋 Update documentation for team

**Files Modified**:
- `/app/api/vendor/upload-verification-document/route.js` - Updated to use `AWS_S3_BUCKET` and `vendor-verification/` prefix
- `/AWS_S3_CONSOLIDATED_STRUCTURE.md` - This comprehensive guide

**Existing Files Using S3**:
- `/lib/aws-s3.js` - Shared S3 utilities
- `/app/api/portfolio/images/route.js` - Portfolio uploads
- `/app/api/status-updates/route.js` - Business updates
- `/pages/api/rfq/upload-image.js` - RFQ attachments
