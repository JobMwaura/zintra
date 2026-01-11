# 🔍 DEBUG S3 403 FORBIDDEN - Comprehensive Troubleshooting

**Error**: Still getting `403 Forbidden` from S3 even after CORS configuration

**Status**: CORS should be fixed, but something else is preventing the upload

---

## ✅ Verification Checklist

### Step 1: Verify CORS Was Actually Saved

1. Go to: https://s3.console.aws.amazon.com
2. Click bucket: `zintra-images-prod`
3. Go to **Permissions** tab
4. Scroll to **Cross-origin resource sharing (CORS)**
5. Click **Edit**
6. **You should see the JSON policy you added**

If you see:
- ✅ **JSON policy is there** → CORS was saved, problem is elsewhere
- ❌ **Empty or different policy** → CORS wasn't saved properly
- ❌ **"No CORS configuration"** → Need to add it

**If CORS is empty**, try these steps:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Click Edit again
3. Paste the policy
4. Click Save
5. Wait 1-2 minutes for AWS to propagate

---

## 🔍 Possible Causes of 403 Error

### Issue #1: CORS Not Actually Configured
**How to check**: Follow Step 1 above
**Fix**: Re-add the CORS policy and wait for propagation

### Issue #2: IAM User Missing S3 Permissions
**Cause**: AWS credentials don't have permission to PutObject in S3
**How to check**:
1. Go to IAM Dashboard: https://console.aws.amazon.com/iam/
2. Find the user: Look for access key ID `AKIAYXWBNWDIJBUN5V6P`
3. Check policies: Should have `AmazonS3FullAccess` or custom policy with `s3:PutObject`
4. If missing, add the policy

### Issue #3: Signature Mismatch
**Cause**: The presigned URL signature doesn't match what AWS expects
**Reason**: Could be caused by:
- Server time out of sync (AWS uses exact timestamps)
- Metadata headers not matching what was signed
- Request headers being modified

**How to check**:
1. Look at presigned URL time: `X-Amz-Date=20260111T131359Z`
2. Check if server time matches (should be within 5 minutes)
3. Verify no headers are being added/removed

### Issue #4: Bucket Encryption or Other Settings
**Cause**: S3 bucket might have encryption or other settings blocking uploads
**How to check**:
1. Go to bucket → **Properties**
2. Check **Default encryption**: Should be disabled or standard AES
3. Check **Versioning**: Can be enabled (doesn't block presigned uploads)
4. Check **Object Lock**: Should be disabled

---

## 🛠️ Advanced Debugging

### Check AWS Logs
1. Go to CloudTrail: https://console.aws.amazon.com/cloudtrail/
2. Look for recent PUT requests to your bucket
3. Look for error messages explaining the 403

### Test Presigned URL with cURL
You can test if the presigned URL works by copying it and testing with curl:

```bash
# Copy the full URL from the error message
curl -X PUT "https://zintra-images-prod.s3.us-east-1.amazonaws.com/... [paste full URL]" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@/path/to/test-image.jpg"
```

If this works, it's a browser CORS issue.
If this fails with 403, it's an AWS permissions issue.

---

## 📋 CORS Policy Reference

Here's the CORS policy again (make sure it's exactly this):

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

---

## 🎯 Next Steps

1. **Verify CORS is actually saved** (Step 1 above)
2. **Check IAM user permissions** (Issue #2)
3. **If still not working**, go to CloudTrail and find the specific error
4. **Share the CloudTrail error message** so we can debug further

---

## 🚀 Alternative Solution: Server-Side Upload

If we can't get presigned URLs working, we can use **server-side upload** instead:

Instead of:
```
Component → API → Generate Presigned URL → Browser → S3
```

We do:
```
Component → API → Receive File → API → Upload to S3 → Return URL
```

This avoids CORS issues but uses your server bandwidth. Let me know if you want to implement this.

---

**Created**: January 11, 2026  
**Issue**: S3 403 Forbidden persisting after CORS configuration  
**Status**: Requires verification and debugging

