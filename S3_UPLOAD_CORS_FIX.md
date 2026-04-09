# 🔍 S3 Upload Failure Diagnosis

**Issue**: `net::ERR_FAILED` on PUT to presigned URL  
**Status**: CORS likely not returning proper headers  

---

## The Real Problem

Looking at your presigned URL, it includes these query parameters:
```
?X-Amz-Algorithm=AWS4-HMAC-SHA256
&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD
&X-Amz-Credential=...
&X-Amz-Date=...
&X-Amz-Expires=3600
&X-Amz-Signature=...
&X-Amz-SignedHeaders=host
&x-amz-checksum-crc32=...
&x-amz-meta-*=...
&x-id=PutObject
```

**The problem**: S3 is receiving the request but **CORS headers are missing from the response**, which makes the browser block it.

---

## Solution: Update S3 CORS Config

Your current CORS:
```json
"ExposeHeaders": ["ETag", "x-amz-meta-custom-header"]
```

**Should be**:
```json
"ExposeHeaders": [
  "ETag",
  "x-amz-version-id",
  "x-amz-meta-original_name",
  "x-amz-meta-upload_type",
  "x-amz-meta-custom-header"
]
```

But actually, **the issue might be simpler**: Your CORS config might not be exposing the headers that AWS SDK needs for SigV4 signed requests.

---

## The Real Fix: Update CORS to Allow All Headers

Go to AWS S3 Console and replace your entire CORS config with:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "https://zintra-sandy.vercel.app",
      "https://zintra.co.ke",
      "http://localhost:3000",
      "http://localhost:3001",
      "*"
    ],
    "ExposeHeaders": [
      "*"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

**Key change**: `"ExposeHeaders": ["*"]` instead of specific headers

---

## Steps to Update CORS

1. Go to: https://s3.console.aws.amazon.com/s3
2. Find bucket: `zintra-images-prod`
3. Click **Permissions** tab
4. Scroll to **"Cross-origin resource sharing (CORS)"**
5. Click **Edit**
6. Replace with the JSON above
7. Click **Save changes**
8. Wait 2 minutes
9. Hard refresh browser (Cmd+Shift+R)
10. Test upload again

---

## If ExposeHeaders: ["*"] Doesn't Work

Try this more explicit version:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "https://zintra-sandy.vercel.app",
      "https://zintra.co.ke",
      "http://localhost:3000",
      "http://localhost:3001",
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-version-id",
      "x-amz-meta-original_name",
      "x-amz-meta-upload_type",
      "x-amz-meta-custom-header",
      "x-amz-meta-user_id",
      "x-amz-meta-vendor_id",
      "x-amz-meta-upload-type",
      "x-amz-meta-uploaded-at",
      "x-amz-meta-uploaded_by",
      "x-amz-checksum-crc32",
      "x-amz-sdk-checksum-algorithm"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

---

## Why This Matters

The presigned URL includes AWS signature headers in the query string. When the browser makes the PUT request:

1. Browser sends: `PUT /file.png?X-Amz-Signature=...`
2. S3 validates the signature ✅
3. **S3 checks CORS headers** ← This is where it fails
4. If S3 doesn't return proper CORS headers, browser blocks the response
5. Result: `net::ERR_FAILED`

Your current CORS config only exposes specific headers. The AWS SDK might need different headers than what's exposed.

---

## Update Now

Please go to AWS Console and update the CORS config to expose all headers:

```json
"ExposeHeaders": ["*"]
```

Then test. Let me know if it works! 🚀
