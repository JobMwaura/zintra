# Business Updates - S3 Upload Verification Guide

## What Should Happen

### Upload Flow (Should go to AWS S3)

```
User selects image in modal
    ↓
File compressed (max 1920x1440)
    ↓
Call: POST /api/status-updates/upload-image
    Body: { fileName, contentType }
    ↓
Response: { presignedUrl }
    ↓
Call: PUT presignedUrl (to AWS S3 directly)
    Header: Content-Type matches file type
    Body: Compressed file
    ↓
S3 validates signature, stores file
    ↓
Return presignedUrl to frontend
    ↓
Store URL in images array
    ↓
Call: POST /api/status-updates
    Body: { vendorId, content, images: [...urls...] }
    ↓
Save to Supabase vendor_status_updates.images array
    ↓
Update created successfully
```

---

## Diagnostic Steps

### Step 1: Check Presigned URL Endpoint

The presigned URL should be coming from:
**File**: `/pages/api/status-updates/upload-image.js`

Expected behavior:
- Takes `fileName` and `contentType` from request
- Generates presigned PUT URL with signature
- Returns `{ presignedUrl, bucket, region }`

### Step 2: Check Direct S3 Upload

The modal at:
**File**: `/components/vendor-profile/StatusUpdateModal.js` (lines 60-110)

Expected behavior:
- Gets presigned URL from endpoint
- Makes PUT request directly to S3
- **Browser uploads directly to S3** (not through your server!)
- Returns full presigned URL (with signature)

### Step 3: Check Database Save

The API endpoint at:
**File**: `/app/api/status-updates/route.js` (POST handler)

Expected behavior:
- Receives array of S3 URLs in `images` field
- Saves them directly to `vendor_status_updates.images` array
- Does NOT try to save to separate table

---

## How to Verify Images Went to S3

### Option 1: Check Browser DevTools

1. Open DevTools (F12)
2. Go to **Network** tab
3. Upload an image
4. Look for requests:
   - ✅ POST `/api/status-updates/upload-image` → Should return `{ presignedUrl }`
   - ✅ PUT to `https://zintra-platform.s3.amazonaws.com/...` → Should be 200 OK
   - ✅ POST `/api/status-updates` → Should return update object

### Option 2: Check AWS S3 Console

1. Go to AWS S3 console
2. Open bucket: `zintra-platform`
3. Navigate to folder: `vendor-profiles/status-updates/`
4. Should see files like: `1234567890-abc123-photo.jpg`

### Option 3: Check Browser Console

Open DevTools Console, should see:
```
✅ Got presigned URL
✅ Uploaded to S3: https://zintra-platform.s3.amazonaws.com/...
```

---

## Possible Issues & Solutions

### Issue 1: Presigned URL Endpoint Returns Error

**Error Message**: "Failed to get presigned URL"

**Check**:
1. AWS credentials configured? (check `.env.local`)
   - `AWS_ACCESS_KEY_ID=...`
   - `AWS_SECRET_ACCESS_KEY=...`
   - `AWS_S3_BUCKET=zintra-platform`
   - `AWS_REGION=us-east-1`

2. Endpoint exists? `/pages/api/status-updates/upload-image.js`

3. S3 helper function works? `lib/aws-s3.js` → `generatePresignedUploadUrl()`

**Fix**: Verify `.env.local` has all AWS credentials

---

### Issue 2: S3 Upload Returns 403 Forbidden

**Error Message**: "S3 upload failed with status 403"

**Causes**:
1. Presigned URL signature invalid
2. Signature expired (but shouldn't be, it's just generated)
3. AWS credentials don't have permission
4. Content-Type header doesn't match

**Check**:
- Are you sending correct `Content-Type` header?
- Is the presigned URL malformed?
- Do AWS credentials have `s3:PutObject` permission?

**Fix**: 
1. Verify AWS IAM user has S3 permissions
2. Check Content-Type matches actual file type
3. Log the presigned URL and verify format

---

### Issue 3: Images Save to DB but Show "Image Error"

**Cause**: Presigned URL signature removed (we fixed this)

**Verify**: Should be fixed in recent commit
- Line 107 of `StatusUpdateModal.js`
- Should return full `presignedUrl` (not `split('?')[0]`)

**Check**: Open browser console when viewing update
- Images should load without 403 errors
- If 403, signature is missing

---

### Issue 4: Images Don't Show in Carousel

**Possible Causes**:
1. Images array not saved to database
2. Images array is empty
3. URLs are malformed
4. Signatures expired (shouldn't happen)

**Check**:
1. Go to Supabase console
2. Open `vendor_status_updates` table
3. Find your update record
4. Check `images` column - should have array like:
   ```json
   [
     "https://zintra-platform.s3.amazonaws.com/vendor-profiles/status-updates/1234-abc-photo.jpg?X-Amz-Signature=...",
     "https://zintra-platform.s3.amazonaws.com/vendor-profiles/status-updates/1234-def-photo.jpg?X-Amz-Signature=..."
   ]
   ```

---

## Testing Checklist

### Full Integration Test

```bash
# 1. Open app and navigate to vendor profile > Updates tab

# 2. Click "+ Share Update"

# 3. Select an image
   Check DevTools Network tab:
   ✅ POST /api/status-updates/upload-image succeeds
   ✅ PUT to S3 succeeds (200 OK)
   
# 4. Type content and submit
   Check DevTools Network tab:
   ✅ POST /api/status-updates succeeds
   
# 5. Check browser console
   ✅ "✅ Got presigned URL"
   ✅ "✅ Uploaded to S3: https://..."
   
# 6. Check S3 AWS console
   ✅ File exists in vendor-profiles/status-updates/ folder
   
# 7. Check Supabase console
   ✅ vendor_status_updates record exists
   ✅ images array has URL with signature
   
# 8. View the update
   ✅ Image displays in carousel
   ✅ No "Image Error" text
```

---

## Files Involved

| File | Purpose | Upload Step |
|------|---------|-------------|
| StatusUpdateModal.js | Handles file selection & compression | 1. Compress |
| upload-image.js | Generates presigned URL | 2. Get presigned URL |
| aws-s3.js | AWS S3 helper functions | 2. Generate URL |
| StatusUpdateModal.js | Makes PUT to S3 | 3. Upload to S3 |
| route.js (POST) | Saves to database | 4. Save to DB |
| Supabase | Stores image URLs | 5. Store |

---

## Expected File Locations in S3

```
Bucket: zintra-platform
├── vendor-profiles/
│   ├── logos/
│   ├── images/
│   └── status-updates/
│       ├── 1704952800123-abc123-photo1.jpg
│       ├── 1704952801456-def456-photo2.jpg
│       └── ...
├── rfq-images/
└── ...
```

---

## Credentials Required

For S3 uploads to work, `.env.local` must have:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=zintra-platform
AWS_REGION=us-east-1

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Common Mistakes

1. ❌ Removing signature from presigned URL
   - ✅ Keep full URL: `https://...?X-Amz-Signature=...`

2. ❌ Wrong Content-Type header
   - ✅ Send file's actual MIME type: `image/jpeg`, `image/png`

3. ❌ Storing file key instead of full URL
   - ✅ For MVP, store full presigned URL

4. ❌ AWS credentials not in `.env.local`
   - ✅ Add all 4 AWS variables

5. ❌ S3 bucket has no CORS configured
   - ✅ Check S3 CORS settings allow PUT from your domain

---

## Quick Debug Commands

### Check if images are in Supabase
```sql
SELECT id, vendor_id, content, images, created_at 
FROM vendor_status_updates 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check if files are in S3
```bash
# Via AWS CLI:
aws s3 ls s3://zintra-platform/vendor-profiles/status-updates/ --recursive
```

### Check presigned URL format
Should look like:
```
https://zintra-platform.s3.amazonaws.com/vendor-profiles/status-updates/1704952800123-abc123-photo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Date=...&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=...
```

---

## Next Steps

1. **Run full integration test** (see testing checklist above)
2. **Check DevTools Network tab** for errors
3. **Check browser console** for upload logs
4. **Check AWS S3 console** for files
5. **Check Supabase** for database records
6. **Report findings** with exact error messages

Once you complete these steps, we'll know exactly where the issue is!
