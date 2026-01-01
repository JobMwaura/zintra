# AWS S3 Image Upload - Quick Start Checklist

## ✅ Completed (by me)

- ✅ Created `.env.local` with AWS credential placeholders
- ✅ Created `/lib/aws-s3.js` - S3 utility functions
- ✅ Created `/pages/api/vendor/upload-image.js` - API endpoint
- ✅ Created `/components/vendor/VendorImageUpload.js` - React component
- ✅ Created `AWS_S3_SETUP_GUIDE.md` - Complete documentation

---

## ⏳ Next Steps for You

### Step 1: Install Dependencies (5 minutes)

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Step 2: Update `.env.local` (2 minutes)

Replace placeholders in `.env.local` with your actual AWS credentials:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_new_access_key_here
AWS_SECRET_ACCESS_KEY=your_new_secret_key_here
AWS_S3_BUCKET=your_bucket_name
```

**Where to find these:**
- Go to AWS IAM Console → Users → Select your user
- Click Security credentials tab
- Find your new access key and secret key

### Step 3: Configure S3 Bucket CORS (5 minutes)

In AWS S3 Console:

1. Go to Buckets → Your Bucket → Permissions
2. Scroll to CORS
3. Click Edit
4. Paste this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://yourdomain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

5. Click Save

### Step 4: Integrate Component into Vendor Edit Page (10 minutes)

In your vendor profile edit page (e.g., `pages/vendor/[id]/edit.js`):

```javascript
import VendorImageUpload from '@/components/vendor/VendorImageUpload';

export default function VendorProfileEdit() {
  const vendorId = /* get from route params */;

  const handleUploadSuccess = async (fileData) => {
    console.log('Upload successful:', fileData);
    
    // Save to database
    const { data, error } = await supabase
      .from('VendorProfile')
      .update({
        profile_image_url: fileData.fileUrl,
        profile_image_key: fileData.key,
      })
      .eq('id', vendorId);

    if (error) {
      console.error('Error saving to database:', error);
    }
  };

  return (
    <div>
      {/* Your existing form fields */}
      
      <VendorImageUpload
        vendorId={vendorId}
        onUploadSuccess={handleUploadSuccess}
        options={{
          maxSize: 10 * 1024 * 1024, // 10MB
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        }}
      />
    </div>
  );
}
```

### Step 5: Test Upload (5 minutes)

1. Start dev server: `npm run dev`
2. Navigate to vendor edit page
3. Select an image (JPEG, PNG, or WebP)
4. Click Upload
5. Verify success message
6. Check S3 bucket for uploaded file

### Step 6: Display Image in Profile View (5 minutes)

In your vendor profile view page:

```javascript
{vendor?.profile_image_url && (
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

## 📋 What You Now Have

| File | Purpose | Status |
|------|---------|--------|
| `/lib/aws-s3.js` | S3 utilities | ✅ Ready |
| `/pages/api/vendor/upload-image.js` | Upload API | ✅ Ready |
| `/components/vendor/VendorImageUpload.js` | Upload UI | ✅ Ready |
| `.env.local` | AWS credentials | 🟡 Needs values |
| `AWS_S3_SETUP_GUIDE.md` | Full documentation | ✅ Ready |

---

## 🔒 Security Checklist

- ✅ Credentials in `.env.local` (not committed)
- ✅ `.gitignore` includes `.env*`
- ✅ S3 bucket is private (not public)
- ✅ Presigned URLs time-limited (1 hour for upload)
- ✅ File validation on server
- ✅ User auth check before upload
- ✅ Vendor ownership verification

---

## 🎯 Features Included

### Upload Component (`VendorImageUpload.js`)
- File input with validation
- Image preview before upload
- Direct S3 upload (no server storage)
- Progress tracking
- Error messages
- Success confirmation
- Clear button

### API Endpoint (`upload-image.js`)
- User authentication check
- File type validation
- File size validation
- Vendor ownership verification
- Presigned URL generation
- Metadata storage

### S3 Utilities (`aws-s3.js`)
- Generate presigned URLs
- Upload files directly
- Access existing files
- Delete files
- Validate files
- Sanitize file names

---

## 📊 Upload Flow

```
1. User selects image
   ↓
2. Browser validates (size, type)
   ↓
3. API request to /api/vendor/upload-image
   ↓
4. Server validates (auth, ownership, file)
   ↓
5. Generate presigned URL
   ↓
6. Return URL to browser
   ↓
7. Browser uploads directly to S3
   ↓
8. Success callback (save to database)
```

---

## 🐛 Troubleshooting

### CORS Error
→ Update S3 bucket CORS policy (see Step 3)

### Access Denied on Upload
→ Check IAM permissions include `s3:PutObject`

### File Not Found After Upload
→ Verify presigned URL didn't expire

### Component Not Rendering
→ Check NextJS page is using `'use client'` directive

### Credentials Not Working
→ Verify values in `.env.local`
→ Restart dev server after changing env

---

## 📞 Quick Reference

| Action | File | Function |
|--------|------|----------|
| Generate upload URL | `/lib/aws-s3.js` | `generatePresignedUploadUrl()` |
| Handle upload | `/pages/api/vendor/upload-image.js` | `handler()` |
| Show UI | `/components/vendor/VendorImageUpload.js` | Component |
| Save to DB | Your vendor edit page | Supabase update |

---

## ✨ Next Features (Optional)

After basic upload works:

1. **Image Gallery**
   - Display multiple vendor images
   - Edit/delete images

2. **Image Optimization**
   - Resize on upload
   - Generate thumbnails
   - Compress before S3

3. **CloudFront Distribution**
   - Faster image delivery
   - Global CDN

4. **Image Processing**
   - Face detection for profiles
   - Automatic cropping
   - Format conversion

---

## 🚀 Ready to Start?

1. ✅ Install dependencies
2. ✅ Update `.env.local`
3. ✅ Configure S3 CORS
4. ✅ Add component to your page
5. ✅ Test upload
6. ✅ Deploy!

**Estimated total time: 30-45 minutes**

Need help with any step? Let me know! 🎯
