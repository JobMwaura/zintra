# Status Update Issues - Root Cause Analysis

## Combined Diagnosis Summary

Two separate (but related) issues are causing the carousel malfunction:

1. **Updates disappear after refresh** → Missing `vendor` prop when rendering
2. **Images show "Image Error"** → Storing unsigned (signature-stripped) S3 URLs for private bucket

---

## Issue #1: Updates Disappear After Refresh 🔴

### Root Cause
In `/app/vendor-profile/[id]/page.js` **line 1227**, the `StatusUpdateCard` is rendered with:

```javascript
<StatusUpdateCard
  key={update.id}
  update={update}
  vendor={vendor}              // ✅ PASSED
  currentUser={currentUser}
  onDelete={(id) => setStatusUpdates(statusUpdates.filter((u) => u.id !== id))}
/>
```

**But** in `/components/vendor-profile/StatusUpdateCard.js` **line 72**, the delete functionality accesses:

```javascript
const canDelete = currentUser?.id === vendor.user_id;
//                                   ^^^^^^
//                          This could be undefined!
```

**The Problem:**
- On **initial page load**: `vendor` is loaded from Supabase and passed correctly
- On **page refresh**: React needs to re-render from scratch
- If `vendor` loads slowly (network delay), the component might render BEFORE `vendor` is available
- Accessing `vendor.user_id` on undefined `vendor` → **Runtime error** → **Component crashes** → **Section stops rendering**
- Updates appear to "disappear" (they're actually hidden by the crash)

### Evidence

**Line 72 in StatusUpdateCard.js:**
```javascript
const canDelete = currentUser?.id === vendor.user_id;
```
- Uses optional chaining on `currentUser` ✅
- But DIRECT property access on `vendor` ❌
- `vendor` has no guard, so if `undefined`, this throws an error

**Line 97 in StatusUpdateCard.js** (in handleDelete):
```javascript
if (error) throw error;
if (onDelete) onDelete(update.id);  // This requires vendor.user_id to not have errored above
```

---

## Issue #2: Images Show "Image Error" 🔴

### Root Cause

In `/components/vendor-profile/StatusUpdateModal.js` **line 107**, the image upload stores:

```javascript
// Extract S3 URL from presigned URL (remove query parameters)
const s3Url = presignedUrl.split('?')[0];
//             ↓
// presignedUrl = "https://zintra-platform.s3.amazonaws.com/status-upr.../file.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
// 
// After split: "https://zintra-platform.s3.amazonaws.com/status-upr.../file.jpg"
//              ↑
//              This URL has NO SIGNATURE
```

**The Problem:**
1. **Presigned URL** = URL + query parameters (signature valid for ~15 minutes)
   - Example: `https://bucket.s3.amazonaws.com/file.jpg?X-Amz-Algorithm=...&X-Amz-Signature=ABC123`
   - This IS accessible without AWS credentials
   
2. **After `split('?')[0]`** = URL without signature
   - Example: `https://bucket.s3.amazonaws.com/file.jpg`
   - If bucket is **private** → GET request returns **403 Forbidden**
   - If bucket uses **CloudFront** → Need different URL format
   - Browser `<img>` tag gets 403 → Shows "Image Error"

### Evidence

**StatusUpdateModal.js lines 104-108:**
```javascript
// ❌ WRONG: Strips signature from presigned URL
const s3Url = presignedUrl.split('?')[0];
console.log('✅ Uploaded to S3:', s3Url);

return s3Url;  // Returns URL WITHOUT signature
```

**This is then stored in database** and later rendered in StatusUpdateCard:

```javascript
<img src={s3Url} />  // src has NO signature → 403 error
```

### Why This Matters

Your S3 bucket is **PRIVATE** (default AWS setting). Without the signature:
- ✅ Presigned URL: `GET` request works → Image loads
- ❌ Unsigned URL: `GET` request denied → "Image Error"

---

## Fix #1: Protect Against Missing Vendor 🔧

In `/components/vendor-profile/StatusUpdateCard.js` **line 72**, add optional chaining:

### Current (Unsafe):
```javascript
const canDelete = currentUser?.id === vendor.user_id;
```

### Fixed:
```javascript
const canDelete = currentUser?.id === vendor?.user_id;
```

This prevents crashes when `vendor` is loading. The card will render safely and `canDelete` will be `false` until `vendor` arrives.

---

## Fix #2: Store Presigned URL with Signature 🔧

In `/components/vendor-profile/StatusUpdateModal.js` **line 107**, keep the full presigned URL:

### Current (Wrong - Loses Signature):
```javascript
// Extract S3 URL from presigned URL (remove query parameters)
const s3Url = presignedUrl.split('?')[0];
console.log('✅ Uploaded to S3:', s3Url);
return s3Url;
```

### Fixed (Right - Keep Signature):
```javascript
// Keep the full presigned URL (signature is valid for 15 minutes)
console.log('✅ Uploaded to S3:', presignedUrl);
return presignedUrl;
```

**Why this works:**
- Presigned URL = authenticated access without AWS credentials
- Browser can GET the object because signature proves permission
- Signature is **valid on initial load**
- ✅ For MVP: Images load fine for users viewing within 15 minutes
- 🔄 For production: Switch to storing `fileKey` (not URL) + generate fresh presigned GET URLs on fetch (see below)

---

## Better Solution (For Production) 🚀

Instead of storing the presigned URL, store the **file key** and generate fresh presigned GET URLs when fetching:

### In Modal (Upload):
```javascript
// Store the file key, not the URL
const fileKey = uniqueFilename;
return fileKey;  // e.g., "status-updates/1234-abc-file.jpg"
```

### In API (Fetch):
```javascript
// When fetching updates, generate fresh presigned GET URLs
const imageKey = update.images[0];
const presignedGetUrl = await s3.getSignedUrl('getObject', {
  Bucket: 'zintra-platform',
  Key: imageKey,
  Expires: 900,  // 15 minutes
});
// Return presignedGetUrl in response
```

### In Card (Display):
```javascript
// presignedUrl comes from API, not database
<img src={presignedUrl} />  // Fresh signature every fetch
```

---

## Implementation Priority

| Issue | Severity | Fix Effort | Impact |
|-------|----------|-----------|--------|
| Issue #1: Missing `vendor?.user_id` | **HIGH** | 1 min | Prevents crashes on refresh |
| Issue #2: Unsigned S3 URLs | **HIGH** | 1 min | Makes images visible |
| Better solution: Store fileKey | Medium | 30 min | Production-ready persistence |

---

## Quick Fix (Next 2 Minutes)

1. **File**: `/components/vendor-profile/StatusUpdateCard.js`
   - **Line 72**: Change `vendor.user_id` → `vendor?.user_id`

2. **File**: `/components/vendor-profile/StatusUpdateModal.js`
   - **Line 107**: Remove the `split('?')[0]` line, keep full `presignedUrl`

This will:
- ✅ Stop crashes on refresh
- ✅ Make images load (with signature in URL)
- ✅ Carousel persists across refreshes

---

## Verification Steps

After applying fixes:

1. **Hard refresh** app (Cmd+Shift+R)
2. Go to vendor profile > Updates tab
3. Click "+ Share Update"
4. Upload 2-3 images
5. Type content, click "Post Update"
6. **Verify**: Carousel displays with images ✅
7. **Hard refresh** page (Cmd+R)
8. **Verify**: Images still visible (not disappeared) ✅
9. **Verify**: No "Image Error" text ✅

---

## Code References

### StatusUpdateCard.js (Line 72)
**File Path**: `/components/vendor-profile/StatusUpdateCard.js`
```javascript
// Current - UNSAFE
const canDelete = currentUser?.id === vendor.user_id;

// Fixed - SAFE
const canDelete = currentUser?.id === vendor?.user_id;
```

### StatusUpdateModal.js (Lines 104-108)
**File Path**: `/components/vendor-profile/StatusUpdateModal.js`
```javascript
// Current - LOSES SIGNATURE
if (!uploadResponse.ok) {
  throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
}

// Extract S3 URL from presigned URL (remove query parameters)
const s3Url = presignedUrl.split('?')[0];  // ❌ WRONG
console.log('✅ Uploaded to S3:', s3Url);
return s3Url;

// Fixed - KEEPS SIGNATURE
if (!uploadResponse.ok) {
  throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
}

// Keep the full presigned URL with signature
console.log('✅ Uploaded to S3:', presignedUrl);
return presignedUrl;  // ✅ CORRECT
```

---

## Why These Issues Weren't Caught Before

1. **Issue #1** (Missing vendor): Only manifests on page refresh with slow network
2. **Issue #2** (Unsigned URLs): Only visible for private S3 buckets (your setup)

During initial development, both might have appeared to work if:
- Developer always had fresh page loads (not refreshes)
- S3 bucket had public read access (not private)
- Network was fast (vendor loaded before rendering)
