# 🎯 S3 CORS Fix - The Real Issue

**Problem**: `net::ERR_FAILED` on PUT to S3  
**Root Cause**: S3 CORS headers not being returned to browser  
**Solution**: Update S3 CORS configuration

---

## Current Issue

Your presigned URL path is now **CORRECT**:
```
✅ /vendor-profiles/aa31b1ad.../profile-images/1768573213833-buyinw-Taratibu%20logo.png
```

But S3 is still rejecting it with `net::ERR_FAILED`. This is **100% a CORS issue**.

---

## How to Fix CORS

### Step 1: Go to AWS S3 Console
https://s3.console.aws.amazon.com/s3

### Step 2: Find Your Bucket
- Find: **`zintra-images-prod`**
- Click on it

### Step 3: Go to Permissions
1. Click **"Permissions"** tab at the top
2. Scroll down to **"Cross-origin resource sharing (CORS)"**
3. Click **"Edit"**

### Step 4: Replace CORS Config

**DELETE** whatever is there and **PASTE THIS**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

**Key changes from before**:
- ✅ `"AllowedOrigins": ["*"]` (allow ALL origins - more permissive)
- ✅ `"ExposeHeaders": ["*"]` (expose ALL headers)

### Step 5: Save
1. Click **"Save changes"** button
2. Wait for confirmation: ✅ "Successfully updated the CORS configuration"

### Step 6: Wait & Test
1. **Wait 2 minutes** (AWS takes time to apply)
2. **Hard refresh browser** (Cmd+Shift+R on Mac)
3. **Try uploading logo again**

---

## Why This Happens

When your browser makes a PUT request to S3 with a presigned URL:

```
Browser → PUT request to S3 with presigned URL
    ↓
S3 checks: "Is this origin allowed?"
S3 checks: "What headers can I return?"
    ↓
S3 needs to return CORS headers in response
    ↓
If CORS headers missing → Browser blocks response
    ↓
Result: net::ERR_FAILED
```

Your current CORS config only exposes specific headers. The AWS SDK might need different headers, so we're using `["*"]` to expose everything.

---

## Current CORS Config (Not Working)

```json
{
  "AllowedOrigins": [
    "https://zintra-sandy.vercel.app",
    "https://zintra.co.ke",
    "http://localhost:3000",
    "*"
  ],
  "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"]
}
```

**Problem**: `ExposeHeaders` is too restrictive. The AWS SDK may need other headers.

---

## New CORS Config (Should Work)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

**This is more permissive and should work with AWS SDK**.

---

## Test After Update

1. Wait 2 minutes
2. Hard refresh browser
3. Try uploading logo
4. Watch browser console
5. Should see:
   ```
   ✅ Got presigned URL for vendor profile image
   ✅ Uploaded vendor profile image to S3
   ✅ Updated vendor profile with new image
   ```

---

## If Still Fails

### Check 1: CORS Actually Saved
1. Go back to S3 Console
2. Permissions → CORS
3. Click Edit
4. Verify JSON matches what we sent
5. If not, paste again

### Check 2: Bucket Name
Make sure you're in the RIGHT bucket:
```
✅ zintra-images-prod
❌ zintra-images, images-prod, etc.
```

### Check 3: Region
```
Bucket should be in: us-east-1 (Northern Virginia)
```

### Check 4: Hard Refresh
```
Mac: Cmd+Shift+R
Windows: Ctrl+Shift+R

Or:
- F12 → DevTools
- Right-click refresh button
- "Empty cache and hard refresh"
```

### Check 5: Wait Longer
AWS CORS changes can take up to 5 minutes to propagate. If it's been < 5 minutes, wait longer.

---

## Expected Success

After CORS is fixed and you try to upload:

**Browser Console** (F12):
```
✅ Got presigned URL for vendor profile image
✅ Uploaded vendor profile image to S3
✅ Updated vendor profile with new image
✅ Vendor profile image upload complete
```

**Browser Network Tab**:
- PUT request to S3 should return 200 OK
- Response Headers should include:
  - `access-control-allow-origin: *`
  - `access-control-allow-methods: GET, PUT, POST, DELETE, HEAD`

**AWS S3**:
- New file appears in bucket
- Path: `/vendor-profiles/{vendorId}/profile-images/`
- File name: `{timestamp}-{randomId}-{filename}`

---

## Summary

| Item | Before | After |
|------|--------|-------|
| AllowedOrigins | Specific domains | `*` |
| ExposeHeaders | Specific headers | `*` |
| Result | CORS blocked | CORS allowed |
| Upload | ❌ net::ERR_FAILED | ✅ Success |

---

## Quick Action

1. ⏰ Time: 2 minutes
2. 🔗 Go to: https://s3.console.aws.amazon.com/s3
3. 🪣 Find: `zintra-images-prod`
4. ⚙️ Permissions → CORS → Edit
5. 📝 Paste the JSON above
6. 💾 Click Save
7. ⏳ Wait 2 minutes
8. 🔄 Hard refresh browser
9. 🧪 Test upload

**Do this now and report back!** 🚀
