# 🔧 Image Upload Error - Troubleshooting Guide

**Issue**: "Failed to generate upload URL" error when uploading images  
**Date**: January 2, 2026  
**Status**: Diagnostic Improvements Applied

---

## Problem Description

When trying to upload an image in the RFQ modal:
```
Error: Failed to generate upload URL
```

---

## Root Causes

### Cause #1: AWS Credentials Not Configured (MOST LIKELY)
The S3 client needs three environment variables:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`

These should be in `.env.local` file.

### Cause #2: Server Not Restarted
If you added AWS credentials to `.env.local`, the dev server must be restarted to load them.

### Cause #3: AWS SDK Not Installed
The AWS SDK packages might be missing or broken.

### Cause #4: AWS Credentials Invalid
The credentials might be expired, rotated, or deactivated.

---

## Improvements Made

**Commit**: `cae2b2d` - Better error handling for AWS S3

### 1. Environment Variable Validation
The S3 module now warns if AWS credentials are missing at startup:
```
⚠️ AWS_S3_BUCKET environment variable not set
⚠️ AWS_ACCESS_KEY_ID environment variable not set
⚠️ AWS_SECRET_ACCESS_KEY environment variable not set
```

### 2. Better Error Messages
The API now returns detailed info about what's missing:
```json
{
  "error": "Failed to generate upload URL",
  "details": "AWS_S3_BUCKET environment variable not configured",
  "missingAWSConfig": "AWS credentials not configured",
  "bucket": "Missing"
}
```

---

## How to Diagnose

### Step 1: Check Server Console
Look at your terminal where `npm run dev` is running:
- Should NOT see warnings about AWS variables
- If you do, environment variables aren't loaded

### Step 2: Check Network Response
1. Open DevTools (F12) → Network tab
2. Try uploading an image
3. Click the `/api/rfq/upload-image` request
4. View the Response tab
5. You'll see exactly what's missing

---

## Solutions

### Solution #1: Restart Dev Server (MOST LIKELY TO FIX)
The `.env.local` file might not be loaded yet.

```bash
# In terminal running npm run dev:
# Press Ctrl+C

# Restart:
npm run dev
```

Then try uploading again.

---

### Solution #2: Verify Environment Variables are Set

Check that `.env.local` has:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your_key>
AWS_SECRET_ACCESS_KEY=<your_secret>
AWS_S3_BUCKET=<your_bucket>
```

If missing, add them and restart the server.

---

### Solution #3: Install AWS SDK

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install @aws-sdk/util-utf8
```

Verify installation:
```bash
npm list @aws-sdk/client-s3
```

---

### Solution #4: Verify AWS Credentials

The credentials might be:
- Rotated in AWS console
- Deactivated or deleted
- Expired

Get fresh credentials from AWS IAM and update `.env.local`.

---

## Step-by-Step Fix

1. **Restart dev server**
   ```bash
   # Ctrl+C in terminal, then:
   npm run dev
   ```

2. **Check for warnings** in server console
   - Should be silent about AWS
   - If warnings appear, environment variables not loaded

3. **Try uploading image**
   - Open DevTools Network tab
   - Check response for exact error

4. **Based on error message**
   - If "AWS_S3_BUCKET not configured" → add to `.env.local`
   - If "AWS_ACCESS_KEY_ID not configured" → add to `.env.local`
   - If actual AWS error → verify credentials are valid

5. **Restart server** after any `.env.local` changes

6. **Try upload again**

---

## Testing

Expected success response from `/api/rfq/upload-image`:
```json
{
  "uploadUrl": "https://bucket.s3.amazonaws.com/...",
  "fileUrl": "https://bucket.s3.amazonaws.com/...",
  "key": "rfq-images/timestamp-random-filename",
  "message": "Presigned URL generated successfully"
}
```

Expected error response (if config missing):
```json
{
  "error": "Failed to generate upload URL",
  "details": "AWS_S3_BUCKET environment variable not configured",
  "missingAWSConfig": "AWS credentials not configured"
}
```

---

## Files Modified

**Commit**: `cae2b2d`

1. **`lib/aws-s3.js`**
   - Environment variable validation
   - Better error messages
   - Improved error context

2. **`pages/api/rfq/upload-image.js`**
   - Debugging information
   - Shows what config is missing
   - Better error reporting

---

## Checklist

- [ ] Dev server running
- [ ] `.env.local` file exists
- [ ] AWS credentials in `.env.local`
- [ ] Server restarted after adding credentials
- [ ] AWS SDK installed (`npm list @aws-sdk/client-s3`)
- [ ] No warnings in server console about AWS
- [ ] Try uploading image
- [ ] Check response in DevTools

---

## Summary

The "Failed to generate upload URL" error is now easier to diagnose. The server will tell you exactly which AWS credentials are missing.

**Most likely fix**: Restart your dev server!

---

**Status**: Ready for testing after diagnosis
