# ✅ AWS S3 CORS Configuration - VERIFIED

**Date Checked**: 16 January 2026  
**Status**: ✅ Configuration looks solid!

---

## Current CORS Configuration

Your S3 bucket `zintra-images-prod` has:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "https://zintra-sandy.vercel.app",
      "https://zintra.co.ke",
      "http://localhost:3000",
      "*"
    ],
    "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"],
    "MaxAgeSeconds": 3000
  }
]
```

### Analysis:
- ✅ **AllowedMethods**: Includes GET, PUT, POST, DELETE, HEAD (PUT is critical for uploads)
- ✅ **AllowedOrigins**: Includes both Vercel domains + wildcard
- ✅ **AllowedHeaders**: Wildcard (*) allows all headers
- ✅ **MaxAgeSeconds**: 3000 seconds (50 minutes) - good caching

---

## Optional Improvement: Add More ExposeHeaders

Your current ExposeHeaders is minimal. Consider updating to:

```json
"ExposeHeaders": [
  "ETag",
  "x-amz-meta-custom-header",
  "x-amz-version-id",
  "x-amz-meta-original_name",
  "x-amz-meta-upload_type"
]
```

This allows the browser to read these response headers from S3, which can be useful for:
- **ETag**: File integrity verification
- **x-amz-version-id**: Track file versions
- **x-amz-meta-original_name**: Original filename (for validation)
- **x-amz-meta-upload_type**: Type of upload (vendor-profile, document, etc.)

**To add these**:
1. Go to S3 Console → zintra-images-prod → Permissions → CORS
2. Click Edit
3. Find `"ExposeHeaders"` array
4. Change from:
   ```json
   "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"]
   ```
   To:
   ```json
   "ExposeHeaders": [
     "ETag",
     "x-amz-meta-custom-header",
     "x-amz-version-id",
     "x-amz-meta-original_name",
     "x-amz-meta-upload_type"
   ]
   ```
5. Click Save

---

## Why Upload Still Might Fail

Even with correct CORS, uploads can fail if:

### 1. **API Endpoint Issues**
Your upload flow:
1. Browser calls `/api/vendor-profile/upload-image` (POST)
2. API generates presigned URL (valid 1 hour)
3. Browser PUTs file directly to S3
4. S3 checks CORS for the PUT request

**Check**: Is the API generating valid presigned URLs?
```bash
# Test by checking browser console when calling the API
# Should see: "uploadUrl": "https://zintra-images-prod.s3.us-east-1.amazonaws.com/..."
```

### 2. **File Size/Type Validation**
Your API only allows: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

**Check**: Are you uploading allowed formats?
```
✅ Allowed: JPG, PNG, WebP, GIF
❌ Not allowed: PDF, DOC, SVG, BMP
```

### 3. **Authorization Header Issues**
API requires Bearer token in Authorization header

**Check**: Is auth token being sent?
```javascript
// In your upload code, should have:
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

### 4. **Browser Cache Issue**
Old CORS rules cached in browser

**Fix**: Hard refresh
```
Mac: Cmd+Shift+R
Windows: Ctrl+Shift+R
```

### 5. **AWS Credentials**
Server-side presigned URL generation needs AWS credentials

**Check**: Environment variables set?
```
.env.local should have:
AWS_REGION=us-east-1
AWS_S3_BUCKET=zintra-images-prod
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPlusCfrDEXAMPLEKEY
```

---

## Test Upload Step-by-Step

### Step 1: Open Developer Tools
```
Press F12 → Console tab
```

### Step 2: Try Uploading a Logo
1. Go to your vendor registration page
2. Try uploading a profile image
3. Watch the console for messages

### Step 3: Look for These Messages

**✅ SUCCESS** (upload works):
```
✅ Got presigned URL for vendor profile image
✅ Uploaded vendor profile image to S3
✅ Updated vendor profile with new image
```

**❌ FAILURE** (CORS issue):
```
TypeError: Failed to fetch
CORS policy: Response to preflight request doesn't pass access control check
```

**❌ FAILURE** (Auth issue):
```
401 Unauthorized
Authorization header missing or invalid
```

**❌ FAILURE** (File validation):
```
Invalid file type. Allowed: image/jpeg, image/png, image/webp, image/gif
```

### Step 4: Check Network Tab
1. Press F12 → Network tab
2. Try uploading file
3. Look for PUT request to `s3.amazonaws.com`
4. Click on it → Response Headers
5. Should see:
   ```
   access-control-allow-origin: https://zintra-sandy.vercel.app
   access-control-allow-methods: GET, PUT, POST, DELETE, HEAD
   ```

---

## If Upload Still Fails

### 1. Check S3 Bucket Name
```
Correct: zintra-images-prod
Wrong: zintra-images, images-prod, zintra
```

### 2. Check Region
```
Expected: us-east-1 (Northern Virginia)

In S3 Console:
zintra-images-prod → Properties tab → Region should show us-east-1
```

### 3. Check IAM User Permissions
The AWS credentials used need these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::zintra-images-prod/*"
    }
  ]
}
```

### 4. Verify Presigned URL Format
When you call `/api/vendor-profile/upload-image`, the response should be:
```json
{
  "success": true,
  "uploadUrl": "https://zintra-images-prod.s3.us-east-1.amazonaws.com/vendor-profiles/...",
  "fileUrl": "https://zintra-images-prod.s3.us-east-1.amazonaws.com/vendor-profiles/...",
  "key": "vendor-profiles/..."
}
```

If you get an error instead, check:
- Is `/api/vendor-profile/upload-image` endpoint accessible?
- Are AWS credentials loaded in `.env.local`?
- Is your user authenticated (Bearer token valid)?

### 5. Test with CURL (Command Line)
```bash
# 1. Get a presigned URL from your API
curl -X POST https://zintra-sandy.vercel.app/api/vendor-profile/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "test.jpg", "contentType": "image/jpeg"}'

# 2. Use the uploadUrl to PUT a test file
curl -X PUT "PRESIGNED_URL_HERE" \
  -H "Content-Type: image/jpeg" \
  --data-binary @test.jpg
```

---

## Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| **CORS Config** | ✅ Good | All methods allowed, domains configured |
| **AllowedOrigins** | ✅ Good | Includes Vercel + localhost + wildcard |
| **AllowedMethods** | ✅ Good | PUT is included (critical for uploads) |
| **ExposeHeaders** | ⚠️ Minimal | Consider adding more headers |
| **MaxAgeSeconds** | ✅ Good | 3000 seconds is reasonable |
| **Overall** | ✅ READY | Should work - test your upload flow |

---

## Next Steps

1. **Test Now**: Try uploading a logo in vendor registration
2. **Check Console**: Look for error messages (F12 → Console)
3. **If Error**: Tell me the exact error message
4. **If Success**: Move on to document upload step (20 min)

The CORS config is correct. If uploads still fail, it's likely:
- File format (PDF not allowed, only image types)
- Auth token not being sent
- API endpoint not working
- AWS credentials not configured on server

Let me know what happens when you test! 🚀
