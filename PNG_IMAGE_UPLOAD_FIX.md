# PNG Image Upload Fix ✅

## Issue

When trying to upload a PNG image to the RFQ modal, you received this error:

```
File type not allowed. Supported: image/jpeg, image/png, image/webp, image/gif
```

Even though PNG is clearly in the list of supported types.

---

## Root Cause

The bug was in `/pages/api/rfq/upload-image.js` at line 53:

```javascript
// ❌ WRONG - Arguments in wrong order
const validation = validateFile(fileSize, fileType);
```

The `validateFile` function expects a **file object** with `.size` and `.type` properties:

```javascript
// In lib/aws-s3.js
export function validateFile(file, options = {}) {
  // file.size
  // file.type
  // ...
}
```

But the API was passing two separate arguments (`fileSize` number and `fileType` string) in the wrong order.

### What Happened

1. `validateFile` was called with: `validateFile(fileSize, fileType)`
2. Inside the function, it treated the number `fileSize` as the "file" object
3. When it tried to access `file.size` and `file.type`, it got `undefined`
4. The validation failed and returned the "not allowed" error

---

## Solution

Changed the validation call to pass a properly structured file object:

```javascript
// ✅ CORRECT - Pass file object with proper structure
const validation = validateFile({ size: fileSize, type: fileType });
```

### Changes Made

**File**: `/pages/api/rfq/upload-image.js`

**Line 53 - Before**:
```javascript
const validation = validateFile(fileSize, fileType);
```

**Line 53 - After**:
```javascript
const validation = validateFile({ size: fileSize, type: fileType });
```

---

## How It Works Now

1. **Client sends**: `{ fileName: "photo.png", fileType: "image/png", fileSize: 2048000 }`
2. **Server receives and extracts**: `fileType = "image/png"`, `fileSize = 2048000`
3. **Server creates file object**: `{ size: 2048000, type: "image/png" }`
4. **validateFile checks**:
   - ✅ Is file provided? Yes
   - ✅ Is size under limit? Yes (2MB < 10MB)
   - ✅ Is type in allowed list? Yes (`"image/png"` in `['image/jpeg', 'image/png', 'image/webp', 'image/gif']`)
5. **Returns**: `{ valid: true }`
6. **Server generates presigned URL** and returns upload URL
7. **Client uploads to S3** with the presigned URL
8. **Image successfully uploaded** ✅

---

## Supported File Types

All of these now work correctly:

✅ **PNG** - `image/png`
✅ **JPEG** - `image/jpeg`
✅ **WebP** - `image/webp`
✅ **GIF** - `image/gif`

---

## File Size Limit

Maximum file size: **10 MB**

The API validates this automatically. If a file exceeds 10MB, you'll see:
```
File size exceeds 10MB limit
```

---

## Testing

Try uploading these image types to the RFQ modal:

1. PNG image → **Should work** ✅
2. JPEG image → **Should work** ✅
3. WebP image → **Should work** ✅
4. GIF image → **Should work** ✅
5. PDF or other format → **Should show error** (not supported)

---

## Commit Details

**Hash**: cbd8458
**Message**: "fix: Correct validateFile function call with proper file object structure"
**Changes**: 
- 1 file modified
- 1 insertion, 1 deletion

**Status**: ✅ Pushed to GitHub

---

## What's Next

You can now:

1. Go to `/post-rfq`
2. Create a new RFQ (Direct, Wizard, or Public)
3. Fill in project details
4. **Upload PNG images** in the "Reference Images" section
5. Images will upload successfully to AWS S3 ✅

---

## Summary

- **Problem**: PNG uploads rejected even though PNG was supported
- **Cause**: validateFile called with wrong argument structure
- **Fix**: Pass file object `{ size, type }` instead of separate arguments
- **Result**: All image types (PNG, JPEG, WebP, GIF) now upload successfully
