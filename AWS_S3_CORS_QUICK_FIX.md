# 🚨 AWS S3 CORS FIX - IMMEDIATE ACTION

**Priority**: CRITICAL - Logo upload is failing  
**Time to Fix**: 5-10 minutes  
**Impact**: Unblocks vendor registration  

---

## The Error
```
❌ Logo upload failed: TypeError: Failed to fetch
   PUT https://zintra-images-prod.s3.us-east-1.amazonaws.com/...
   net::ERR_FAILED
```

## Root Cause
**AWS S3 CORS headers are not configured for your frontend domain.**

When your browser tries to PUT the image file to S3, S3 rejects the request because:
1. The origin (your website) is not in the S3 CORS AllowedOrigins list
2. Or CORS is not configured at all

---

## ⚡ QUICK FIX (5 minutes)

### Step 1: Open AWS Console
1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/s3)
2. Find bucket: **`zintra-images-prod`**
3. Click on the bucket name

### Step 2: Go to Permissions
1. Click **"Permissions"** tab
2. Scroll down to **"Cross-origin resource sharing (CORS)"**
3. Click **"Edit"**

### Step 3: Copy & Paste This CORS Config

**Delete any existing CORS config** and paste this:

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

### Step 4: Save Changes
1. Click **"Save changes"** button
2. Wait for confirmation message: "Successfully updated the CORS configuration"

### Step 5: Wait for AWS Propagation
1. **Wait 2-3 minutes** for CORS to be active
2. Clear browser cache (Ctrl+Shift+Delete on Windows, Cmd+Shift+Delete on Mac)
3. Close and reopen browser

---

## ✅ Test the Fix

1. Go to your vendor registration page
2. Try uploading a logo image
3. **Should upload successfully** (no error)
4. Check browser console - should see:
   ```
   ✅ Got presigned URL for vendor profile image
   ✅ Uploaded vendor profile image to S3
   ✅ Vendor profile image upload complete
   ```

---

## 📖 What Each Setting Does

```
AllowedHeaders: "*"
  └─ Browser can send any headers in requests to S3

AllowedMethods: GET, PUT, POST, DELETE, HEAD
  └─ Browser can use these HTTP methods
  └─ PUT is critical for direct uploads

AllowedOrigins: [your domains]
  └─ S3 only accepts requests from these domains
  └─ Prevents unauthorized cross-domain uploads
  └─ Must include your Vercel deployment URL

ExposeHeaders: ETag, x-amz-version-id, ...
  └─ Browser can read these S3 response headers
  └─ Needed for upload verification

MaxAgeSeconds: 3000
  └─ Browser caches CORS rules for 50 minutes
  └─ Reduces latency on subsequent requests
```

---

## 🔍 Verify It Worked

### In AWS Console:
1. Go back to bucket Permissions
2. Check CORS section
3. Should show your JSON config

### In Browser:
1. Open DevTools (F12)
2. Go to Network tab
3. Try uploading a logo
4. Look for the PUT request to s3.amazonaws.com
5. Check Response Headers:
   - `access-control-allow-origin: https://your-domain.vercel.app` ✅
   - `access-control-allow-methods: GET, PUT, POST, DELETE` ✅

### In Browser Console:
```
✅ Got presigned URL for vendor profile image
✅ Uploaded vendor profile image to S3
✅ Updated vendor profile with new image
✅ Vendor profile image upload complete
```

---

## ❌ If It Still Fails

### Check 1: Is CORS actually saved?
```
1. Go back to Permissions tab
2. Click "Edit" CORS again
3. Copy the JSON shown
4. Paste into text editor
5. Verify your domain is in AllowedOrigins
6. If not there, paste it again and save
```

### Check 2: Is bucket name correct?
```
Correct: zintra-images-prod
Wrong: zintra-images
Wrong: images-prod
Wrong: zintra

Double-check in AWS Console
```

### Check 3: Did you wait long enough?
```
AWS CORS changes take 2-5 minutes to propagate
If it's been < 5 minutes, wait a bit longer
Then clear browser cache and try again
```

### Check 4: Is the presigned URL coming from correct bucket?
```
In browser console, look for presigned URL:
Should contain: zintra-images-prod.s3.us-east-1.amazonaws.com

If it shows different bucket, something else is wrong
Check API endpoint: /api/vendor-profile/upload-image
```

### Check 5: Browser cache issue?
```
Hard refresh:
- Windows/Linux: Ctrl+Shift+R
- Mac: Cmd+Shift+R

Or:
1. Open DevTools (F12)
2. Right-click refresh icon
3. Click "Empty cache and hard refresh"
```

---

## 🚀 Deploy This Fix

**This is an AWS configuration change, NO code changes needed.**

Just:
1. Fix S3 CORS (steps above)
2. Hard refresh your browser
3. Test vendor registration
4. Done! 🎉

No git commits, no npm build, no server restart needed!

---

## 📞 If Stuck

### Bucket doesn't exist?
```
If you don't see "zintra-images-prod" in bucket list:
1. Go to AWS Console home
2. Search for "S3"
3. Check you're in correct region (us-east-1)
4. Check under "All buckets"
5. May need to create bucket first
```

### Don't have AWS access?
```
If you can't access AWS Console:
1. Ask admin for IAM user credentials
2. Or ask them to update CORS
3. Need S3 full access permissions
```

### CORS section not showing?
```
If you don't see CORS section:
1. Make sure you're on Permissions tab (not Properties)
2. Scroll all the way down
3. Should be below "Bucket policy" section
4. May need to click "Edit" first
```

---

## ✅ Checklist

- [ ] Opened AWS Console
- [ ] Found bucket: `zintra-images-prod`
- [ ] Clicked Permissions tab
- [ ] Found CORS section
- [ ] Deleted old CORS config (if any)
- [ ] Pasted new CORS config
- [ ] Clicked "Save changes"
- [ ] Waited 3 minutes
- [ ] Hard refreshed browser
- [ ] Tried vendor registration again
- [ ] Logo uploaded successfully ✅

---

**Time to Fix**: 5-10 minutes  
**Difficulty**: Easy  
**Blocker**: YES - Logo upload won't work without this  
**Next Step**: Test vendor registration
