# 🔧 PORTFOLIO IMAGE UPLOAD - ERROR DEBUGGING GUIDE

**Error**: `Failed to upload zintra banner.png: Failed to generate upload URL`

**Date**: January 11, 2026  
**Status**: Debugging in progress

---

## 🔍 Root Cause Analysis

The error occurs at this point:
```
User selects image
    ↓
Component calls: POST /api/portfolio/upload-image
    ↓
API tries to generate presigned URL
    ↓
❌ FAILS: "Failed to generate upload URL"
```

This means the API endpoint is returning an error when trying to generate the presigned URL.

---

## ✅ STEP 1: Check AWS Environment Variables on Vercel

**Most Likely Cause**: AWS environment variables are NOT set in Vercel deployment

### How to Fix:

1. Go to **Vercel Dashboard**
   - https://dashboard.vercel.com

2. Select your **zintra-platform** project

3. Go to **Settings** → **Environment Variables**

4. Add these variables (copy from your `.env.local` file):
   ```
   AWS_REGION = us-east-1
   AWS_ACCESS_KEY_ID = [Your AWS Access Key ID]
   AWS_SECRET_ACCESS_KEY = [Your AWS Secret Access Key]
   AWS_S3_BUCKET = zintra-images-prod
   ```
   
   ⚠️ **Never paste credentials in code/docs!** Copy them directly from your `.env.local` file.

5. Click **Save**

6. **Redeploy** the project:
   - Go to **Deployments**
   - Click **Redeploy** on the latest commit
   - Wait for it to complete

---

## ✅ STEP 2: Verify Environment Variables Are Set

After Vercel redeploys, test this:

1. Open browser console
2. Go to: https://zintra-sandy.vercel.app/api/debug/aws-config
3. You should see:
   ```json
   {
     "aws": {
       "AWS_REGION": "✅ Set",
       "AWS_ACCESS_KEY_ID": "✅ Set (AKIAYXWBN...)",
       "AWS_SECRET_ACCESS_KEY": "✅ Set (hidden)",
       "AWS_S3_BUCKET": "✅ zintra-images-prod"
     }
   }
   ```

If you see `❌ Missing`, then the env variables are not set on Vercel.

---

## ✅ STEP 3: Check Browser Network Tab

When you try to upload and get the error:

1. Open **Developer Tools** (F12 or Cmd+Option+I)
2. Go to **Network** tab
3. Try uploading a portfolio image again
4. Look for request to `/api/portfolio/upload-image`
5. Click on it and check:
   - **Status**: Should be 200
   - **Response**: Should have `uploadUrl`, `fileUrl`, `key`
   - **Error**: If failed, you'll see error message

Example of **successful response**:
```json
{
  "uploadUrl": "https://s3.amazonaws.com/zintra-images-prod/...",
  "fileUrl": "https://s3.amazonaws.com/zintra-images-prod/...",
  "key": "vendor-profiles/portfolio/{vendor_id}/...",
  "fileName": "1736520000-abc123-banner.png"
}
```

Example of **failed response**:
```json
{
  "error": "AWS_S3_BUCKET environment variable not configured",
  "details": "..."
}
```

---

## ✅ STEP 4: Check Server Logs (Vercel)

1. Go to Vercel Dashboard
2. Select **zintra-platform** project
3. Go to **Deployments**
4. Click on the current deployment
5. Go to **Logs** → **Function Logs**
6. Look for errors from `/api/portfolio/upload-image`

---

## 📋 Common Causes & Solutions

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "AWS_S3_BUCKET environment variable not configured" | Env var not set on Vercel | Add AWS_S3_BUCKET to Vercel env vars |
| "AWS_ACCESS_KEY_ID environment variable not configured" | Env var not set on Vercel | Add AWS_ACCESS_KEY_ID to Vercel env vars |
| "AWS_SECRET_ACCESS_KEY environment variable not configured" | Env var not set on Vercel | Add AWS_SECRET_ACCESS_KEY to Vercel env vars |
| "Failed to generate presigned URL" | AWS SDK error | Check AWS credentials are correct |
| "Unauthorized" | User not logged in | Make sure you're logged in as vendor |
| "Invalid file type" | File is not image | Use JPG, PNG, WebP, or GIF only |

---

## 🧪 Testing After Fix

Once you add environment variables and redeploy:

1. Visit: https://zintra-sandy.vercel.app
2. Log in as vendor
3. Go to vendor profile
4. Click "Add Portfolio Project"
5. On Step 4, upload an image
6. Should upload successfully ✅

---

## 🐛 If It Still Doesn't Work

1. **Check Network Tab** (Step 3 above)
   - What's the exact error response?
   - Screenshot it for debugging

2. **Check Vercel Logs** (Step 4 above)
   - Are there any errors in the deployment?
   - Share the error message

3. **Verify AWS Credentials**
   - Are the credentials still valid?
   - Have they been rotated/changed?

4. **Check AWS S3 Bucket**
   - Does the bucket `zintra-images-prod` still exist?
   - Go to https://s3.console.aws.amazon.com
   - Make sure bucket is in `us-east-1` region

---

## 📝 What to Share If You Need Help

When asking for debugging help, share:
1. ✅ Screenshot of Network tab response
2. ✅ Screenshot of Vercel env variables
3. ✅ Output from `/api/debug/aws-config` endpoint
4. ✅ Exact error message from browser console
5. ✅ Vercel deployment logs

---

## ✅ Quick Checklist

- [ ] AWS_REGION added to Vercel env vars
- [ ] AWS_ACCESS_KEY_ID added to Vercel env vars
- [ ] AWS_SECRET_ACCESS_KEY added to Vercel env vars
- [ ] AWS_S3_BUCKET added to Vercel env vars
- [ ] Project redeployed on Vercel
- [ ] Tested /api/debug/aws-config endpoint
- [ ] All 4 env vars show ✅
- [ ] Portfolio image upload works ✅

---

**Created**: January 11, 2026  
**Purpose**: Debug "Failed to generate upload URL" error  
**Next**: Follow steps above to fix

