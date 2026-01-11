# S3 Upload Diagnostics - Quick Start (5 Minutes)

## TL;DR

Business updates S3 upload isn't working. Code is correct. Need to test where it breaks.

---

## 4 Tests (Do These Now)

### Test 1: DevTools Network Tab

```
1. Open your app → Vendor Profile → Updates Tab
2. Press F12 (open DevTools)
3. Click "Network" tab
4. Click "+ Share Update"
5. Select an image file
6. Look for these requests:
```

**Expected**:
- `POST /api/status-updates/upload-image` → Status 200
- `PUT https://zintra-platform.s3.amazonaws.com/...` → Status 200
- `POST /api/status-updates` → Status 201

**Report**:
- ✅ Do you see all 3 requests?
- ❌ Do any show red (error)?
- What status codes do you see?

---

### Test 2: Browser Console

```
1. In same DevTools, click "Console" tab
2. Upload an image again
3. Look for these messages:
```

**Expected**:
```
✅ Got presigned URL
✅ Uploaded to S3: https://zintra-platform.s3.amazonaws.com/...
```

**Report**:
- ✅ Do you see both messages?
- ❌ Any error messages?
- Copy/paste the exact error text

---

### Test 3: Supabase Database

```
1. Go to Supabase console
2. Click "SQL Editor"
3. Run this query:

SELECT id, vendor_id, content, images, created_at 
FROM vendor_status_updates 
ORDER BY created_at DESC 
LIMIT 5;

4. Look at the latest record
5. Check the "images" column
```

**Expected**:
```json
[
  "https://zintra-platform.s3.amazonaws.com/vendor-profiles/status-updates/...",
  ...
]
```

**Report**:
- ✅ Do you see image URLs in the images column?
- ❌ Is the images column empty?
- What does it actually show?

---

### Test 4: AWS S3 Console

```
1. Go to AWS S3 console (aws.amazon.com/s3)
2. Click bucket: "zintra-platform"
3. Navigate to folder: vendor-profiles/status-updates/
4. Look for image files
```

**Expected**:
```
Files like:
  1704952800123-abc123-photo.jpg
  1704952801456-def456-photo.jpg
  (files you uploaded)
```

**Report**:
- ✅ Do you see files in this folder?
- ❌ Is the folder empty?
- How many files? When created?

---

## Simple Answer Matrix

Based on your tests, we'll know what's wrong:

### Scenario A: All 4 tests pass ✅
```
Test 1: ✅ All 3 network requests succeed
Test 2: ✅ Console shows upload success messages
Test 3: ✅ Supabase has image URLs in database
Test 4: ✅ Files visible in S3 folder

CONCLUSION: Everything working! Issue must be display/carousel.
```

### Scenario B: Test 4 fails ❌
```
Test 1: ✅ Network requests succeed
Test 2: ✅ Console shows success
Test 3: ✅ Database has URLs
Test 4: ❌ S3 folder is empty

CONCLUSION: Upload didn't actually save to S3.
             Likely: AWS credentials or permissions issue.
```

### Scenario C: Test 3 fails ❌
```
Test 1: ✅ Network requests succeed
Test 2: ✅ Console shows success
Test 3: ❌ Database images column is empty
Test 4: ❌ S3 folder is empty

CONCLUSION: Images never sent to database.
             Either S3 upload failed, or API didn't save it.
```

### Scenario D: Test 1 or 2 fails ❌
```
Test 1: ❌ Network request shows error or red status
Test 2: ❌ Console shows "❌ S3 upload error" or similar

CONCLUSION: Upload endpoint or presigned URL generation failed.
             Likely: AWS credentials not configured in .env.local
```

---

## What to Report Back

Just tell us:

```
Test 1 (Network): ✅ or ❌ 
  What status codes did you see?

Test 2 (Console): ✅ or ❌
  What was the exact error message?

Test 3 (Database): ✅ or ❌
  What's in the images column?

Test 4 (S3): ✅ or ❌
  Empty or has files?

Which scenario (A/B/C/D)?
```

---

## Example Reports

### Good Report ✅
```
Test 1: ✅ 
  POST 200, PUT 200, POST 201

Test 2: ✅
  Got presigned URL
  Uploaded to S3: https://...

Test 3: ✅
  ["https://zintra-platform.s3.amazonaws.com/vendor-profiles/status-updates/1704952800123-abc123-photo.jpg?X-Amz-Signature=..."]

Test 4: ✅
  1704952800123-abc123-photo.jpg (just created)

Scenario: A - Everything works!
```

### Problem Report ❌
```
Test 1: ❌
  POST shows 500 error
  No other requests made

Test 2: ❌
  Error: "Failed to get presigned URL"

Test 3: ❌
  images column is empty []

Test 4: ❌
  Folder is completely empty

Scenario: D - Presigned URL generation failed
```

---

## 30 Second Summary

1. **Open DevTools** (F12)
2. **Upload an image**
3. **Check Network tab** for requests
4. **Check Console** for logs
5. **Check Supabase** for data
6. **Check AWS S3** for files
7. **Tell us what you found**

That's it! Just those 4 checks.

---

## Files to Reference

While testing:
- `S3_UPLOAD_ACTION_PLAN.md` - Full diagnostic plan
- `S3_UPLOAD_VERIFICATION_GUIDE.md` - Detailed instructions
- `INVESTIGATION_SUMMARY.md` - Overview

---

## Why This Matters

```
✅ Code is correct (we verified)
❓ Config might be wrong (need to test)
🔧 Fix is ready (once we find issue)
```

The tests will tell us exactly what's wrong.

---

## Time Estimate

- Test 1 (Network): 1 min
- Test 2 (Console): 1 min
- Test 3 (Database): 1 min  
- Test 4 (S3): 1 min
- Report findings: 1 min

**Total: 5 minutes**

Then we fix it in 5-30 min.

---

Ready? Let's do this! 🚀
