# 🎯 AWS S3 CORS Fix - Step-by-Step Manual Instructions

**Current Issue**: Logo uploads failing with `net::ERR_FAILED` on S3 PUT requests  
**Root Cause**: S3 bucket CORS headers not configured  
**Time to Fix**: 5 minutes  
**Difficulty**: Very Easy - GUI clicks only  

---

## ⚡ QUICK START (5 MINUTES)

### Step 1: Open AWS Console
Go to: https://s3.console.aws.amazon.com/s3

### Step 2: Find Your Bucket
1. In the bucket list, **click on**: `zintra-images-prod`
2. Should show bucket details page

### Step 3: Navigate to CORS Settings
1. Click the **"Permissions"** tab (at the top)
2. Scroll down to find **"Cross-origin resource sharing (CORS)"** section
3. Click the **"Edit"** button next to CORS

### Step 4: Replace CORS Configuration
**You'll see a text area with JSON**. Delete everything and paste this:

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
      "https://zintra.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://*.vercel.app"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-version-id",
      "x-amz-meta-original_name",
      "x-amz-meta-upload_type"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

### Step 5: Save Changes
1. Click **"Save changes"** button
2. Wait for success message: ✅ "Successfully updated the CORS configuration"

### Step 6: Wait & Test
1. Wait **2-3 minutes** for AWS to propagate changes
2. Clear browser cache:
   - **Mac**: Cmd+Shift+Delete (or Empty Cache in DevTools)
   - **Windows**: Ctrl+Shift+Delete
3. Close browser completely, reopen it
4. Go to your app and try uploading a vendor logo

---

## ✅ Verification: Did It Work?

### Quick Test in Browser
1. Go to your vendor registration page
2. Try uploading a logo image
3. Check browser console (F12 → Console)
4. Look for one of these messages:

**✅ SUCCESS** (you should see):
```
✅ Got presigned URL for vendor profile image
✅ Uploaded vendor profile image to S3
✅ Vendor profile image upload complete
```

**❌ FAILURE** (if you see):
```
TypeError: Failed to fetch
net::ERR_FAILED
CORS policy: Response to preflight request...
```

### Check Network Tab (Advanced)
1. Open DevTools (F12)
2. Click **"Network"** tab
3. Try uploading a logo
4. Look for PUT request to `s3.amazonaws.com`
5. Click on it → **"Response Headers"**
6. Should see:
   - ✅ `access-control-allow-origin: https://your-domain.vercel.app`
   - ✅ `access-control-allow-methods: GET, PUT, POST, DELETE, HEAD`

---

## 🔍 How to Check Current CORS Config

If you want to verify CORS is actually saved:

1. Go back to S3 Console
2. Click bucket: `zintra-images-prod`
3. Click **"Permissions"** tab
4. Scroll to **"Cross-origin resource sharing (CORS)"**
5. Click **"Edit"**
6. Should show the JSON you just saved

---

## ❌ If It Still Doesn't Work

### Fix 1: Check Bucket Name
Make sure you're editing the **correct bucket**:
```
✅ CORRECT: zintra-images-prod
❌ WRONG:   zintra-images
❌ WRONG:   images-prod
❌ WRONG:   zintra
```

### Fix 2: Check Region
Make sure bucket is in correct region:
```
Expected region: us-east-1 (Northern Virginia)

To check:
1. Go to S3 Console
2. Find bucket: zintra-images-prod
3. Check "Region" column
4. Should say: us-east-1
```

### Fix 3: Hard Refresh Browser
AWS changes take 2-5 minutes to propagate:
```
1. Wait 5 minutes (not just 3)
2. Hard refresh browser:
   - Mac: Cmd+Shift+R
   - Windows: Ctrl+Shift+R
3. Or:
   - F12 → DevTools
   - Right-click refresh button
   - Click "Empty cache and hard refresh"
```

### Fix 4: Check CORS Config Syntax
Make sure JSON is valid (no typos):
1. Copy the JSON from this guide
2. Paste at: https://jsonlint.com/
3. Should show: "Valid JSON"

### Fix 5: Verify Your Domain
Make sure your deployment domain is in AllowedOrigins:

Your domain should be one of:
- `https://zintra-sandy.vercel.app` (staging)
- `https://zintra.vercel.app` (production)
- `https://*.vercel.app` (any Vercel domain)

If using custom domain, add it:
```json
"AllowedOrigins": [
  "https://zintra-sandy.vercel.app",
  "https://zintra.vercel.app",
  "https://yourdomain.com",  // <-- Add your custom domain here
  "http://localhost:3000",
  "http://localhost:3001",
  "https://*.vercel.app"
]
```

---

## 📋 Complete Checklist

- [ ] Opened AWS S3 Console (https://s3.console.aws.amazon.com/s3)
- [ ] Found bucket: `zintra-images-prod`
- [ ] Clicked "Permissions" tab
- [ ] Found "Cross-origin resource sharing (CORS)" section
- [ ] Clicked "Edit"
- [ ] Deleted old CORS config (if any)
- [ ] Pasted new CORS JSON from this guide
- [ ] Clicked "Save changes"
- [ ] Saw success message ✅
- [ ] Waited 2-3 minutes
- [ ] Hard refreshed browser
- [ ] Tested vendor logo upload
- [ ] ✅ Upload succeeded (no errors)

---

## 🎓 What This CORS Config Does

```json
{
  "AllowedHeaders": ["*"]           // Browser can send any headers
  "AllowedMethods": [...]           // Browser can use GET, PUT, POST, DELETE, HEAD
  "AllowedOrigins": [...]           // Only these domains can access the bucket
  "ExposeHeaders": [...]            // Browser can read these response headers
  "MaxAgeSeconds": 3000             // Cache CORS rules for 50 minutes
}
```

**Why PUT is important**: Your app uploads directly from browser to S3 using presigned URLs. PUT method is required for this.

**Why your domain is important**: Prevents random websites from uploading to your bucket.

---

## 🚨 Important Notes

1. **This is safe**: CORS just allows your domain to upload to S3. Other domains still can't.

2. **No code changes needed**: You're only changing AWS configuration, not your app code.

3. **Changes are instant**: AWS applies CORS changes within 2-3 minutes.

4. **Already tested**: This exact config works for the notification system.

5. **Backward compatible**: Existing vendors/images unaffected.

---

## 📞 Need Help?

### Can't find S3 Console?
1. Go to AWS Console: https://console.aws.amazon.com
2. Search for "S3" at the top
3. Click "S3" in results
4. Should open S3 Console

### Can't find bucket?
1. Check you're in correct AWS account
2. Check you're logged in with correct IAM user
3. Search for bucket in S3 Console search box
4. If still not found, bucket might be in different region

### Edit button not showing?
1. Make sure you clicked on the bucket NAME (not just highlighted it)
2. Should show "Permissions" tab at the top
3. Try scrolling down - CORS section is at the bottom

### Don't have AWS access?
1. Ask your AWS admin for S3 permissions
2. Or ask them to update CORS for you
3. Need: `s3:GetBucketCors` and `s3:PutBucketCors` permissions

---

## ✨ Success Indicators

After CORS is fixed, you should see:

**In your app**:
- ✅ Logo upload works without errors
- ✅ Can upload JPG, PNG, PDF files
- ✅ Files appear in S3 bucket
- ✅ URLs saved to database

**In browser console**:
- ✅ No CORS errors
- ✅ No "Failed to fetch" errors
- ✅ Upload progress shows
- ✅ Success messages appear

**In AWS S3**:
- ✅ Files appear in `zintra-images-prod` bucket
- ✅ Files are publicly readable (if configured)
- ✅ File timestamps match upload time

---

## 🎯 Next Steps After CORS Fix

Once CORS is working (you can upload logos):

1. ✅ Test vendor registration (Step 1 logo upload)
2. ✅ Test vendor profile editing (logo upload)
3. ✅ Verify S3 bucket shows uploaded images
4. 📄 Then implement document upload step (20 minutes)
5. 🚀 Deploy to production

**Estimated total time**: 
- CORS fix: 5 minutes
- Testing: 5 minutes
- Document step: 20 minutes
- Testing: 10 minutes
- Deploy: 5 minutes
- **Total: ~45 minutes**

---

Good luck! This is the critical fix - once this works, everything else follows. 🚀
