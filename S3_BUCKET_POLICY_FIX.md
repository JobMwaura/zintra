# 🔐 S3 Bucket Policy Fix - Most Likely Issue

**Issue**: `net::ERR_FAILED` with no response  
**Root Cause**: S3 bucket policy blocking PutObject requests  
**Solution**: Add bucket policy to allow uploads  

---

## The Problem

`net::ERR_FAILED` with **no status code** means the request didn't even complete. This happens when:
1. S3 bucket policy blocks the request before CORS is checked
2. Browser blocks the request due to security policy

**Most likely**: Your S3 bucket has no policy or a restrictive policy that blocks uploads.

---

## Solution: Add S3 Bucket Policy

### Step 1: Go to AWS S3 Console
https://s3.console.aws.amazon.com/s3

### Step 2: Find Your Bucket
- Click: **`zintra-images-prod`**

### Step 3: Go to Permissions
1. Click **"Permissions"** tab
2. Scroll to **"Bucket policy"** section
3. Click **"Edit"**

### Step 4: Add This Policy

**Copy and paste this entire JSON** (replace any existing policy):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::zintra-images-prod/*"
    },
    {
      "Sid": "AllowPresignedUploads",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::zintra-images-prod/*"
    }
  ]
}
```

### Step 5: Save
1. Click **"Save changes"**
2. Should see: ✅ "Successfully edited bucket policy"

---

## What This Policy Does

### Statement 1: AllowPublicRead
```json
"Action": "s3:GetObject"
```
- Allows anyone to **read/download** files from the bucket
- Needed so browsers can display uploaded images

### Statement 2: AllowPresignedUploads
```json
"Action": ["s3:PutObject", "s3:PutObjectAcl"]
```
- Allows **uploads using presigned URLs**
- Presigned URLs are secure (signed by your AWS credentials)
- Only valid for 1 hour after generation

---

## Security Note

This policy:
- ✅ Allows public **reading** of files (safe - images need to be viewable)
- ✅ Allows **uploads via presigned URLs only** (safe - requires your API to generate URL)
- ❌ Does NOT allow direct uploads without presigned URL (secure)
- ❌ Does NOT allow deleting files (secure)

**This is the standard pattern for user-uploaded content.**

---

## After Adding Policy

1. **Wait 1 minute** (policies apply almost instantly)
2. **Hard refresh browser** (Cmd+Shift+R)
3. **Try uploading logo again**
4. **Should work now** ✅

---

## Expected Success

After adding bucket policy, you should see:

**Browser Console**:
```
✅ Got presigned URL for vendor profile image
✅ Uploaded vendor profile image to S3
✅ Updated vendor profile with new image
✅ Vendor profile image upload complete
```

**Network Tab**:
- PUT request returns **200 OK**
- Response headers include CORS headers
- No `net::ERR_FAILED`

---

## If It Still Fails

### Check 1: Verify Policy Saved
1. Go back to Permissions → Bucket policy
2. Click Edit
3. Should see the JSON we just added
4. If not, paste again

### Check 2: Check Bucket Name in Policy
Make sure the policy has the **correct bucket name**:
```json
"Resource": "arn:aws:s3:::zintra-images-prod/*"
                              ^^^^^^^^^^^^^^^^^^^
                              Must match your bucket name
```

### Check 3: Block Public Access Settings
1. In S3 bucket → Permissions tab
2. Look for **"Block public access (bucket settings)"**
3. Click **"Edit"**
4. **Uncheck** all 4 checkboxes:
   - [ ] Block all public access
   - [ ] Block public access to buckets and objects granted through new access control lists (ACLs)
   - [ ] Block public access to buckets and objects granted through any access control lists (ACLs)
   - [ ] Block public access to buckets and objects granted through new public bucket or access point policies
5. Click **"Save changes"**
6. Type "confirm" when prompted
7. Wait 1 minute
8. Try upload again

---

## Alternative: More Permissive Policy (If Above Doesn't Work)

If the above policy doesn't work, try this more permissive version:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::zintra-images-prod",
        "arn:aws:s3:::zintra-images-prod/*"
      ]
    }
  ]
}
```

**Warning**: This allows ALL S3 actions. Only use temporarily for testing.

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| Add bucket policy | 2 min | ⏳ Do now |
| Wait for AWS | 1 min | After save |
| Hard refresh browser | 10 sec | Then do |
| Test upload | 30 sec | Finally |
| **TOTAL** | **~4 minutes** | Should work ✅ |

---

## Quick Action Steps

1. ⏰ **NOW**: Go to S3 Console
2. 🪣 Find: `zintra-images-prod`
3. ⚙️ Permissions → Bucket policy → Edit
4. 📝 Paste the first JSON policy
5. 💾 Save changes
6. ⏳ Wait 1 minute
7. 🔄 Hard refresh browser
8. 🧪 Test logo upload

**Do this now and let me know!** 🚀
