# 🔧 FIX S3 403 FORBIDDEN ERROR - CORS Configuration

**Error**: `PUT https://zintra-images-prod.s3.us-east-1.amazonaws.com/... 403 (Forbidden)`

**Status**: Presigned URL works, but S3 blocks the upload from browser

**Root Cause**: Missing or incorrect S3 CORS configuration

---

## ✅ How to Fix (AWS Console)

### Step 1: Go to S3 Bucket
1. Visit: https://s3.console.aws.amazon.com
2. Find bucket: `zintra-images-prod`
3. Click on it

### Step 2: Open CORS Configuration
1. Go to **Permissions** tab
2. Scroll down to **Cross-origin resource sharing (CORS)**
3. Click **Edit**

### Step 3: Add CORS Policy
Replace everything with this CORS policy:

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
      "https://zintra.co.ke",
      "http://localhost:3000",
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-meta-custom-header"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

### Step 4: Save
Click **Save changes**

---

## 📋 What This CORS Policy Does

| Setting | Value | Purpose |
|---------|-------|---------|
| **AllowedOrigins** | Your domain + localhost | Allow uploads from your app |
| **AllowedMethods** | GET, PUT, POST, DELETE | Allow these HTTP methods |
| **AllowedHeaders** | * | Allow any request headers |
| **ExposeHeaders** | ETag, etc | Allow these response headers |
| **MaxAgeSeconds** | 3000 | Cache CORS preflight for 3000 seconds |

---

## 🧪 Test After Fixing CORS

1. Go to: https://zintra-sandy.vercel.app
2. Log in as vendor
3. Try uploading portfolio image again
4. Should work now! ✅

---

## 🔍 If Still Not Working

Check these things:

### 1. Verify CORS was saved
- Go back to S3 Permissions
- Check CORS shows your policy

### 2. Check bucket public access settings
- Go to Bucket → Permissions
- Look for "Block Public Access"
- This doesn't affect presigned URLs, but good to verify

### 3. Check bucket policy
- Go to Bucket → Permissions → Bucket Policy
- Look for any Deny rules that might block uploads

### 4. Verify IAM user has S3 permissions
- Go to IAM Dashboard
- Find the user with access key AKIAYXWBNWDIJBUN5V6P
- Check policies include S3 bucket access

---

## 📚 Reference

- AWS S3 CORS Documentation: https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html
- Presigned URL limitations: https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html

---

**Created**: January 11, 2026  
**Issue**: 403 Forbidden on presigned URL PUT request  
**Solution**: Add CORS configuration to S3 bucket

