# AWS S3 Setup for Vendor Verification Documents

## ✅ UPDATE: Using Consolidated S3 Bucket

**Important**: Verification documents now use the **SAME AWS S3 bucket** as portfolio images and business updates. This simplifies management and reduces costs.

**New Structure**:
```
AWS_S3_BUCKET/vendor-verification/{vendor-uuid}/{timestamp}-{random}.{ext}
```

**Quick Reference**: See `/AWS_S3_QUICK_REFERENCE.md` for setup details.

---

## Original Documentation (For Reference)

Below is the original documentation for setting up a separate bucket. **You don't need a separate bucket** - use your existing `AWS_S3_BUCKET` instead!

## 📋 Overview

Vendor verification documents (business registration certificates, tax IDs, licenses) are stored securely in AWS S3 for:
- **Better scalability** - No storage limits
- **Lower costs** - Pay only for what you use
- **Better security** - Fine-grained access control
- **Better performance** - CDN integration available

---

## 🔧 AWS S3 Configuration

### Step 1: Create S3 Bucket

1. **Go to AWS Console** → S3 → Create bucket

2. **Bucket Settings:**
   ```
   Bucket name: zintra-verification-documents (or your choice)
   Region: us-east-1 (or closest to your users)
   Block all public access: ✅ ENABLED (keep documents private)
   Bucket Versioning: ✅ Enabled (recommended)
   Default encryption: ✅ SSE-S3 (server-side encryption)
   ```

3. **CORS Configuration** (if accessing from browser):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
       "AllowedOrigins": ["https://yourdomain.com"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

### Step 2: Create IAM User for Application

1. **Go to AWS Console** → IAM → Users → Add users

2. **User Details:**
   ```
   User name: zintra-verification-uploader
   Access type: Programmatic access (Access key)
   ```

3. **Set Permissions** (Inline Policy):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "VerificationDocumentUpload",
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:PutObjectAcl",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::zintra-verification-documents/*"
       },
       {
         "Sid": "ListBucket",
         "Effect": "Allow",
         "Action": "s3:ListBucket",
         "Resource": "arn:aws:s3:::zintra-verification-documents"
       }
     ]
   }
   ```

4. **Save Access Keys** (You'll need these for `.env`)

### Step 3: Set Bucket Lifecycle Rules (Optional but Recommended)

**Purpose:** Auto-delete rejected documents after 90 days

1. Go to bucket → Management → Lifecycle rules → Create rule

2. **Rule Configuration:**
   ```
   Rule name: delete-rejected-docs
   Filter: Prefix = verification-documents/rejected/
   
   Actions:
   - Expire current versions: 90 days
   - Delete expired delete markers: ✅
   ```

---

## 🔐 Environment Variables

Add these to your `.env.local` file:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA******************
AWS_SECRET_ACCESS_KEY=****************************************
AWS_S3_BUCKET_NAME=zintra-verification-documents

# Optional: CloudFront CDN (for faster document access)
AWS_CLOUDFRONT_DOMAIN=d1234567890abc.cloudfront.net
```

---

## 📁 S3 Folder Structure

```
zintra-verification-documents/
├── verification-documents/
│   ├── {vendor-uuid-1}/
│   │   ├── 1737812345678.pdf
│   │   ├── 1737812456789.jpg
│   │   └── 1737812567890.png
│   ├── {vendor-uuid-2}/
│   │   └── 1737812678901.pdf
│   └── {vendor-uuid-3}/
│       └── 1737812789012.pdf
```

**Benefits:**
- Each vendor has their own folder
- Easy to find all documents for a specific vendor
- Easy to delete all documents when vendor is deleted
- Timestamp-based naming prevents conflicts

---

## 🔒 Security Features

### 1. **Private Bucket**
- ✅ All public access blocked
- ✅ Documents not accessible via direct URLs
- ✅ Access only through signed URLs or authenticated API

### 2. **Signed URLs (Future Enhancement)**
For viewing documents securely:
```javascript
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const command = new GetObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET_NAME,
  Key: 'verification-documents/vendor-id/document.pdf',
});

const signedUrl = await getSignedUrl(s3Client, command, { 
  expiresIn: 3600 // 1 hour
});
```

### 3. **Metadata Tagging**
Each uploaded file includes metadata:
```javascript
Metadata: {
  vendorId: 'uuid',
  uploadedBy: 'user-uuid',
  originalName: 'business_registration.pdf',
  uploadDate: '2026-01-15',
}
```

### 4. **File Validation**
- ✅ File type validation (PDF, JPG, PNG only)
- ✅ File size limit (10MB max)
- ✅ Vendor ownership verification
- ✅ Authentication required

---

## 🚀 API Endpoints

### **POST /api/vendor/upload-verification-document**

Upload a verification document to S3.

**Request:**
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('vendorId', vendorId);

const response = await fetch('/api/vendor/upload-verification-document', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});
```

**Response (Success):**
```json
{
  "success": true,
  "fileUrl": "https://zintra-verification-documents.s3.us-east-1.amazonaws.com/verification-documents/vendor-uuid/1737812345678.pdf",
  "fileName": "business_registration.pdf",
  "fileSize": 2456789,
  "fileType": "application/pdf"
}
```

**Response (Error):**
```json
{
  "error": "File size exceeds 10MB limit"
}
```

### **GET /api/vendor/upload-verification-document?vendorId={uuid}**

Get list of uploaded documents for a vendor.

**Response:**
```json
{
  "success": true,
  "documents": [
    {
      "id": "uuid",
      "document_url": "https://...",
      "document_file_name": "business_registration.pdf",
      "status": "pending",
      "submitted_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

## 📊 Cost Estimation

### AWS S3 Pricing (us-east-1):

**Storage:**
- $0.023 per GB/month (first 50 TB)
- 1000 documents × 2MB average = 2GB = **$0.05/month**

**Requests:**
- PUT requests: $0.005 per 1,000 requests
- GET requests: $0.0004 per 1,000 requests
- 1000 uploads + 5000 views = **$0.007/month**

**Data Transfer:**
- First 100GB/month: FREE
- After: $0.09 per GB

**Total Monthly Cost (estimated):**
- 1000 documents: **~$0.10/month**
- 10,000 documents: **~$0.50/month**
- 100,000 documents: **~$5.00/month**

💡 **Much cheaper than Supabase Storage beyond free tier!**

---

## 🧪 Testing

### Test Upload Locally:

1. **Set up environment variables** in `.env.local`

2. **Test upload:**
   ```bash
   # Start dev server
   npm run dev
   
   # Navigate to vendor verification page
   # Upload a test PDF/image
   # Check AWS S3 console for file
   ```

3. **Verify in S3:**
   - Go to AWS Console → S3 → Your bucket
   - Navigate to `verification-documents/{vendor-id}/`
   - You should see your uploaded file

### Test API Directly:

```javascript
// Test in browser console
const formData = new FormData();
const file = document.querySelector('input[type="file"]').files[0];
formData.append('file', file);
formData.append('vendorId', 'your-vendor-uuid');

const token = 'your-jwt-token';

fetch('/api/vendor/upload-verification-document', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
}).then(res => res.json()).then(console.log);
```

---

## 🔄 Migration from Supabase Storage (if needed)

If you already have documents in Supabase Storage:

```javascript
// Migration script (run once)
const { data: documents } = await supabase
  .from('vendor_verification_documents')
  .select('*');

for (const doc of documents) {
  // Download from Supabase
  const { data: file } = await supabase.storage
    .from('vendor-documents')
    .download(doc.document_url);
  
  // Upload to S3
  const buffer = await file.arrayBuffer();
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `verification-documents/${doc.vendor_id}/${Date.now()}.pdf`,
    Body: Buffer.from(buffer),
  }));
  
  // Update database with new URL
  // ...
}
```

---

## 🛡️ Best Practices

### 1. **Use Signed URLs for Viewing**
Don't expose S3 URLs directly. Generate short-lived signed URLs:
```javascript
// Valid for 1 hour only
const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
```

### 2. **Enable S3 Bucket Versioning**
Protects against accidental deletion and allows document history.

### 3. **Set up CloudWatch Alarms**
Monitor:
- Unusual upload volumes
- Large file uploads
- Failed uploads

### 4. **Regular Backups**
Enable S3 Cross-Region Replication for disaster recovery.

### 5. **Audit Logging**
Enable S3 Server Access Logging to track all document access.

---

## 📈 Future Enhancements

### Phase 2:
- [ ] CloudFront CDN for faster global access
- [ ] Automatic virus scanning (AWS Macie)
- [ ] Document OCR and auto-validation
- [ ] Automatic compression for large images
- [ ] Thumbnail generation for previews

### Phase 3:
- [ ] Document encryption at rest (KMS)
- [ ] Document watermarking
- [ ] Audit trail with who accessed what
- [ ] Retention policies and auto-archiving

---

## 🐛 Troubleshooting

### Error: "Access Denied"
- Check IAM user has correct permissions
- Verify bucket name in environment variables
- Ensure bucket policy allows the IAM user

### Error: "Invalid Credentials"
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- Check credentials haven't expired
- Ensure no extra spaces in `.env.local`

### Error: "Bucket Not Found"
- Verify `AWS_S3_BUCKET_NAME` is correct
- Check bucket exists in correct region
- Verify region matches `AWS_REGION` env var

### Upload is Slow
- Check file size (should be < 10MB)
- Consider using CloudFront CDN
- Check network connection

---

## ✅ Deployment Checklist

- [ ] Create S3 bucket in AWS
- [ ] Create IAM user with upload permissions
- [ ] Configure bucket CORS (if needed)
- [ ] Add environment variables to production
- [ ] Test upload in production
- [ ] Verify documents appear in S3
- [ ] Test admin can view documents
- [ ] Set up CloudWatch monitoring
- [ ] Enable S3 versioning
- [ ] Configure lifecycle rules

---

## 📞 Support

**AWS Documentation:**
- [S3 Developer Guide](https://docs.aws.amazon.com/s3/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

**Zintra Platform:**
- Check this documentation
- Review API route code
- Test with sample files
- Monitor CloudWatch logs
