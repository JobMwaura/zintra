# 🚀 AWS S3 Integration for Vendor Message Attachments

## Overview

All vendor message file attachments now upload directly to **AWS S3** instead of Supabase Storage. This provides better scalability, performance, and cost efficiency.

---

## 📋 What Changed

### New API Endpoint
```
POST /api/vendor-messages/upload-file
```

### Modified Component
- `components/VendorInboxModal.js` - Updated file upload handler

### Key Changes
- ✅ File uploads go to AWS S3 (not Supabase Storage)
- ✅ Presigned URLs generated server-side (secure)
- ✅ Files uploaded directly from client to S3 (scalable)
- ✅ Organized folder structure: `vendor-messages/{vendorId}/{conversationId}/{file}`
- ✅ 50MB file size limit
- ✅ Multiple file types supported
- ✅ Metadata stored with each file

---

## 🔄 How It Works

### Upload Flow

```
User selects file
    ↓
handleFileAttach() called
    ↓
Fetch presigned URL from /api/vendor-messages/upload-file
    ↓
API validates:
  - User is authenticated
  - Vendor ID is valid
  - File type is allowed
  - File size < 50MB
    ↓
API returns presigned S3 URL (1 hour expiry)
    ↓
Client uploads file directly to S3
    (PUT request with presigned URL)
    ↓
File stored in S3 bucket
    ↓
File URL added to attachments
    ↓
User sends message with attachment URL
    ↓
URL saved in database
    ↓
File accessible via S3 public URL
```

### Code Flow

```javascript
// Step 1: Get authentication token
const token = (await supabase.auth.getSession()).data.session?.access_token;

// Step 2: Request presigned URL
const presignedResponse = await fetch('/api/vendor-messages/upload-file', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    vendorId: vendorId,
    conversationId: selectedConversation?.id,
  }),
});

const { uploadUrl, fileUrl } = await presignedResponse.json();

// Step 3: Upload to S3
const uploadResponse = await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': file.type },
  body: file,
});

// Step 4: Add to attachments
setAttachments((prev) => [...prev, {
  name: file.name,
  url: fileUrl,  // AWS S3 URL
  type: file.type,
  size: file.size,
}]);
```

---

## 📁 S3 Storage Structure

```
AWS S3 Bucket Structure:
└── vendor-messages/
    └── {vendorId}/
        └── {conversationId}/
            ├── 1705395600000-abc123-invoice.pdf
            ├── 1705395605000-def456-quote.xlsx
            └── 1705395610000-ghi789-proposal.docx

Example:
└── vendor-messages/
    └── vendor-uuid-12345/
        └── admin-uuid-67890/
            └── 1705395600000-abc123-Contract.pdf
```

---

## 🔐 Security Features

### Authentication
- ✅ Bearer token required in request header
- ✅ Supabase authentication verified server-side
- ✅ Only authenticated users can upload

### File Validation
- ✅ MIME type whitelist (documents, images, archives)
- ✅ File size limit (50MB max)
- ✅ Filename sanitization (removes special characters)
- ✅ Random token in filename (prevents guessing)

### Presigned URLs
- ✅ Only valid for 1 hour
- ✅ Single-use (after upload, cannot reuse)
- ✅ Read-only for downloads (no further uploads)
- ✅ Scoped to specific S3 key

### Metadata
Each file stored with metadata:
```json
{
  "user-id": "uploading-user-uuid",
  "vendor-id": "vendor-uuid",
  "conversation-id": "admin-or-user-uuid",
  "original-name": "original-filename.pdf",
  "uploaded-by": "user-uuid",
  "upload-timestamp": "2026-01-16T12:34:56Z",
  "type": "vendor-message-attachment"
}
```

---

## ✅ Supported File Types

### Documents
- PDF: `application/pdf`
- Word: `.doc`, `.docx`
- Excel: `.xls`, `.xlsx`
- PowerPoint: `.ppt`, `.pptx`
- Text: `.txt`, `.csv`

### Images
- JPEG: `image/jpeg`
- PNG: `image/png`
- WebP: `image/webp`
- GIF: `image/gif`

### Archives
- ZIP: `.zip`
- RAR: `.rar`
- 7Z: `.7z`

### Size Limit
- **Maximum:** 50MB per file
- **Error:** "File size exceeds 50MB limit"

---

## 🛠️ API Reference

### Endpoint
```
POST /api/vendor-messages/upload-file
```

### Request Headers
```javascript
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

### Request Body
```javascript
{
  "fileName": "contract.pdf",        // Original filename
  "fileType": "application/pdf",     // MIME type
  "fileSize": 2048576,               // File size in bytes
  "vendorId": "uuid-12345",          // Vendor ID
  "conversationId": "uuid-67890"     // Optional: admin/user ID
}
```

### Success Response (200)
```javascript
{
  "success": true,
  "uploadUrl": "https://aws-bucket.s3.amazonaws.com/...",
  "fileUrl": "https://aws-bucket.s3.amazonaws.com/...",
  "key": "vendor-messages/vendor-id/user-id/timestamp-random-filename.pdf",
  "fileName": "contract.pdf",
  "expiresIn": 3600  // Seconds
}
```

### Error Responses

**401 - Not Authenticated**
```javascript
{ "error": "Invalid or expired authentication token" }
```

**400 - Invalid File**
```javascript
{ "error": "File type not allowed" }
{ "error": "File size exceeds 50MB limit" }
{ "error": "Missing required fields: fileName, fileType, fileSize, vendorId" }
```

**500 - Server Error**
```javascript
{
  "error": "AWS S3 configuration error",
  "details": "..." // In development only
}
```

---

## 💻 Client-Side Implementation

### Import the component (already done)
```javascript
import VendorInboxModal from '@/components/VendorInboxModal';
```

### Usage in your component
```javascript
<VendorInboxModal
  isOpen={showInboxModal}
  onClose={() => setShowInboxModal(false)}
  vendorId={vendor?.id}
  currentUser={currentUser}
/>
```

### File attachment workflow
```javascript
// User clicks paperclip button
→ File picker opens
→ Select file(s)
→ handleFileAttach() executes:
  ├─ Get presigned URL from API
  ├─ Upload directly to S3
  └─ Add to attachments list
→ Type message
→ Click Send
→ Message + S3 URLs stored in DB
→ Admin/Vendor can download
```

---

## 📊 Comparison

### Before (Supabase Storage)
```
❌ Files stored in Supabase
❌ Uploads routed through server
❌ Server bandwidth used
❌ Limited storage/scalability
❌ Slower for large files
```

### After (AWS S3)
```
✅ Files stored in AWS S3
✅ Direct client-to-S3 uploads
✅ No server bandwidth used
✅ Unlimited scalability
✅ Faster for large files
✅ Better cost efficiency
✅ Better organized
✅ Metadata tracking
```

---

## 🔧 Configuration

### AWS Requirements
- S3 bucket created and configured
- CORS enabled for direct uploads
- Presigned URL generation configured
- Credentials stored in environment variables

### Environment Variables
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_S3_REGION=us-east-1
```

### S3 Bucket CORS Configuration
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": ["https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

## 🧪 Testing

### Test File Upload
1. Open vendor profile
2. Click "Inbox" button
3. Open a conversation
4. Click paperclip icon
5. Select a file (< 50MB)
6. File preview appears
7. Type message + Send
8. File uploads to S3 ✅

### Test Different File Types
- PDF document ✅
- Image (JPEG, PNG) ✅
- Word document (.docx) ✅
- Excel spreadsheet (.xlsx) ✅
- Archive (ZIP) ✅

### Test Error Handling
- File too large (> 50MB) → Error message
- Invalid file type → Error message
- Network error → Retry option
- Upload interrupted → Can retry

### Test File Retrieval
- Click download link → File downloads
- Verify content is correct ✅
- Try in different browsers ✅

---

## 📈 Monitoring

### Things to Monitor
1. **Upload Success Rate**
   - Track failed uploads
   - Monitor retry attempts
   - Watch for timeout issues

2. **File Types**
   - Which file types used most
   - Any unexpected uploads
   - Policy violations

3. **Performance**
   - Upload time distribution
   - File size distribution
   - Network latency issues

4. **Storage**
   - Total space used
   - Growth rate per month
   - Cleanup/archival strategy

### CloudWatch Metrics
```
- S3 bucket size
- Request count
- Upload latency
- Error rates
```

---

## 🚀 Benefits Summary

| Aspect | Benefit |
|--------|---------|
| **Scalability** | Unlimited storage in AWS S3 |
| **Performance** | Direct client-to-S3 uploads |
| **Cost** | Cheaper than Supabase storage |
| **Security** | Presigned URLs, metadata tracking |
| **Organization** | Structured folder paths |
| **Reliability** | AWS redundancy and durability |
| **Compliance** | S3 supports various compliance standards |
| **Integration** | Same pattern as RFQ uploads |

---

## 🔄 Future Enhancements

### Possible Improvements
1. **Image Thumbnails** - Generate S3 thumbnails for image previews
2. **Virus Scanning** - Scan uploaded files for malware
3. **Encryption** - Server-side encryption for sensitive files
4. **Versioning** - Keep multiple versions of files
5. **Archival** - Auto-move old files to cheaper storage tier
6. **Streaming** - Stream large files instead of full download
7. **CDN** - CloudFront CDN for faster downloads
8. **Analytics** - Track download statistics per file

---

## 📞 Troubleshooting

### Issue: "File upload failed"
**Solution:**
- Check file size (< 50MB)
- Check file type (supported list)
- Verify internet connection
- Try different browser

### Issue: "Invalid token"
**Solution:**
- Re-login to refresh token
- Check authentication status
- Clear browser cache/cookies
- Try in incognito mode

### Issue: "AWS S3 configuration error"
**Solution:**
- Verify AWS credentials in .env
- Check S3 bucket exists and accessible
- Verify CORS configuration
- Check IAM permissions

### Issue: "File not found after upload"
**Solution:**
- Verify upload completed (no errors)
- Check message was saved with URL
- Verify S3 URL is correct
- Check file visibility in S3

---

## 📝 Implementation Checklist

- [x] Create API endpoint for presigned URLs
- [x] Validate file types and sizes
- [x] Implement presigned URL generation
- [x] Update VendorInboxModal component
- [x] Handle direct S3 uploads
- [x] Error handling and validation
- [x] Metadata storage with files
- [x] Build and test
- [x] Commit to git
- [x] Push to GitHub
- [ ] Deploy to production
- [ ] Monitor S3 usage
- [ ] Gather feedback from users
- [ ] Document lessons learned

---

## ✨ Summary

**Vendor message file attachments now seamlessly upload to AWS S3** with:
- ✅ Security (authentication, validation, presigned URLs)
- ✅ Scalability (unlimited storage)
- ✅ Performance (direct client-to-S3)
- ✅ Organization (structured folders)
- ✅ Monitoring (metadata tracking)

**Status:** Ready for production deployment 🚀

---

**Implementation Date:** January 16, 2026  
**Commit:** 30766b5  
**Status:** ✅ COMPLETE
