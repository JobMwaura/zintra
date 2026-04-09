# ✅ S3 CORS Fix - Correct Version (No Wildcard)

**Issue**: AWS doesn't allow wildcard `*` for ExposeHeaders  
**Solution**: List specific headers instead  
**Time**: 2 minutes  

---

## Correct CORS Config

**DELETE** the previous JSON and **PASTE THIS INSTEAD**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": [
      "ETag",
      "x-amz-version-id",
      "x-amz-meta-original_name",
      "x-amz-meta-upload_type",
      "x-amz-meta-user_id",
      "x-amz-meta-vendor_id",
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

## Steps

1. **Go to AWS S3 Console**: https://s3.console.aws.amazon.com/s3
2. **Find**: `zintra-images-prod`
3. **Permissions** → **CORS** → **Edit**
4. **Delete old config**
5. **Paste the JSON above** (with specific ExposeHeaders)
6. **Click Save** ✅
7. **Wait 2 minutes**
8. **Hard refresh browser** (Cmd+Shift+R)
9. **Try uploading logo**

---

## What Changed

**Before (didn't work)**:
```json
"ExposeHeaders": ["*"]  ❌ AWS doesn't allow wildcard
```

**After (should work)**:
```json
"ExposeHeaders": [
  "ETag",
  "x-amz-version-id",
  "x-amz-meta-original_name",
  ...
]  ✅ Specific headers listed
```

---

## Why These Headers

- **ETag**: File integrity verification
- **x-amz-version-id**: Version tracking
- **x-amz-meta-\***: Custom metadata we set
- **x-amz-checksum-\***: AWS SDK checksums
- **x-amz-sdk-checksum-algorithm**: SDK algorithm

These are all the headers that AWS SDK needs to read from S3 responses.

---

## Test After Updating

1. Hard refresh browser
2. Try uploading logo
3. Should work now ✅

**Let me know!** 🚀
