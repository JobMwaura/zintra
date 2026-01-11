# 🚀 AWS S3 SETUP - TODAY'S COMPLETION GUIDE

**Date**: January 11, 2026  
**Estimated Time**: 30 minutes to complete

---

## ⚡ QUICK START: DO THIS NOW

### Step 1: Configure CORS (10 minutes) - 🔴 CRITICAL

This allows browsers to upload directly to your S3 bucket.

#### 1. Open AWS Console
```
Go to: https://s3.console.aws.amazon.com
Login with your AWS credentials
```

#### 2. Select Your Bucket
- Find: `zintra-images-prod`
- Click on it

#### 3. Go to Permissions Tab
- Click: "Permissions" (tab at top)
- Scroll down to: "Cross-origin resource sharing (CORS)"
- Click: "Edit"

#### 4. Paste This Configuration

Clear any existing CORS config and paste:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://zintra.co.ke",
      "https://zintra-sandy.vercel.app",
      "https://*.vercel.app"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-version-id",
      "x-amz-meta-*"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

#### 5. Click "Save Changes"

Wait for success message: **"CORS rules updated successfully"** ✅

---

### Step 2: Build & Test Locally (10 minutes)

#### 1. Build the Project
```bash
cd /Users/macbookpro2/Desktop/zintra-platform
npm run build 2>&1 | grep -i "compiled successfully"
```

Expected output:
```
✓ Compiled successfully
```

#### 2. Start Development Server
```bash
npm run dev
```

Expected output:
```
▲ Next.js 16.0.10
- Local:   http://localhost:3000
```

#### 3. Test RFQ Image Upload

**Open in browser**:
```
http://localhost:3000/post-rfq
```

- Fill out RFQ form
- Reach "Step 2: Reference Images"
- Click upload area or select file
- Upload a PNG/JPG image (< 10MB)
- Watch progress bar
- See success message ✅

#### 4. Test Vendor Profile Upload

**Open in browser**:
```
http://localhost:3000/vendor-profile/YOUR_VENDOR_ID
```

- Click image upload section
- Upload a PNG/JPG
- See success message ✅

#### 5. Verify in S3

**Go to S3 Console**:
```
https://s3.console.aws.amazon.com
```

- Click: `zintra-images-prod`
- Look for: `rfq-images/` and `vendor-profiles/` folders
- You should see your uploaded files ✅

---

### Step 3: Deploy to Vercel (5 minutes)

#### Option A: Auto-Deploy (Preferred)
```bash
cd /Users/macbookpro2/Desktop/zintra-platform
git add -A
git commit -m "docs: Add AWS S3 setup complete guide"
git push origin main
```

**Vercel will auto-deploy** within 2-3 minutes.

#### Option B: Manual Deploy
1. Go to: https://vercel.com/dashboard
2. Select: zintra-sandy project
3. Click: "Deployments" tab
4. Click: "Deploy" button
5. Wait for deployment to complete ✅

#### Step 4: Test on Production

**Open in browser**:
```
https://zintra-sandy.vercel.app/post-rfq
```

- Fill form and reach Step 2
- Upload image
- Should work exactly like local ✅

---

## 📊 VERIFICATION CHECKLIST

After completing the steps above, verify everything:

```
LOCAL DEVELOPMENT
┌─ RFQ Image Upload
│  ├─ [ ] File selection works
│  ├─ [ ] Progress bar shows
│  ├─ [ ] Upload completes
│  └─ [ ] File in S3 bucket
├─ Vendor Profile Upload
│  ├─ [ ] File selection works
│  ├─ [ ] Upload completes
│  └─ [ ] File in S3 bucket
└─ Error Handling
   ├─ [ ] Large file rejected (> 10MB)
   ├─ [ ] Invalid format rejected (PDF, etc)
   └─ [ ] Helpful error messages shown

PRODUCTION (Vercel)
├─ [ ] Can access https://zintra-sandy.vercel.app
├─ [ ] RFQ upload works
├─ [ ] Vendor profile upload works
└─ [ ] Files appear in S3 bucket

S3 CONSOLE
├─ [ ] Bucket exists: zintra-images-prod
├─ [ ] CORS configured
├─ [ ] Files in /rfq-images/ folder
└─ [ ] Files in /vendor-profiles/ folder
```

---

## 🆘 QUICK TROUBLESHOOTING

### Upload Not Working?

**Check #1**: CORS Configured?
```
Go to AWS S3 Console
Click bucket → Permissions → CORS
Is there JSON configuration? (Not empty/default?)
```

**Check #2**: Environment Variables?
```
Open .env.local in VS Code
Do you see AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET?
```

**Check #3**: Dev Server Running?
```
Terminal shows: "▲ Next.js 16.0.10"
Not showing errors?
```

**Check #4**: Browser Console?
```
Press F12 in browser
Go to Console tab
Any red errors? Copy and check.
```

---

## 📁 WHAT WAS SET UP FOR YOU

All of this is already done ✅:

### Code Files (Already Created)
- ✅ `/lib/aws-s3.js` - S3 utilities library
- ✅ `/pages/api/rfq/upload-image.js` - RFQ upload API
- ✅ `/pages/api/vendor/upload-image.js` - Vendor upload API
- ✅ `/components/RFQModal/RFQImageUpload.jsx` - RFQ upload UI
- ✅ `/components/vendor/VendorImageUpload.js` - Vendor upload UI

### Configuration (Already Set)
- ✅ `.env.local` has AWS credentials
- ✅ `package.json` has AWS SDK dependencies
- ✅ Environment variables configured

### Documentation (Already Created)
- ✅ `AWS_S3_SETUP_GUIDE.md` - Complete reference
- ✅ `AWS_S3_QUICK_START.md` - Quick checklist
- ✅ `AWS_S3_RFQ_IMAGE_UPLOAD_GUIDE.md` - RFQ details
- ✅ `AWS_S3_CORS_SETUP.md` - CORS configuration
- ✅ `AWS_S3_SETUP_COMPLETE_FINAL.md` - This comprehensive guide

---

## 🎯 SUCCESS CRITERIA

Once you complete the steps above, you should be able to:

✅ **Upload Images from RFQ Modal**
- Go to: /post-rfq → Step 2
- Select image
- See upload progress
- File stored in S3

✅ **Upload Images to Vendor Profile**
- Go to: /vendor-profile
- Click upload button
- Select image
- File stored in S3

✅ **Access Uploads from Database**
- RFQ stores image URLs
- Vendor profile stores image URLs
- Images accessible via presigned URLs

✅ **Production Ready**
- Works on Vercel staging
- Works on production domain
- S3 bucket properly configured
- CORS allows uploads

---

## 📞 NEXT STEPS

After completing today:

1. **Tomorrow**: Monitor S3 uploads in CloudWatch
2. **This Week**: Add image management (view/delete files)
3. **Next Week**: Optimize with image compression
4. **Future**: Add image CDN caching

---

**Time Estimate**: 30 minutes total  
**Difficulty**: Easy (mostly AWS console clicks)  
**Result**: Production-ready image uploads! 🎉

Let me know once you complete the CORS setup - everything else is ready to go!
