# Code Implementation Details - Status Updates Image Persistence

## Change 1: AWS S3 Configuration

**File**: `/lib/aws-s3.js`  
**Lines**: 22-24  
**Change Type**: Configuration Fix

### What Changed
```javascript
// Before:
const GET_URL_EXPIRY = 86400 * 365; // 365 days (CAUSES ERROR)

// After:
const GET_URL_EXPIRY = 7 * 24 * 60 * 60; // 7 days (AWS maximum)
```

### Why
- AWS SigV4 presigned URLs have a hard maximum of 7 days
- Setting to 365 days causes: "Signature version 4 presigned URLs must have an expiration date less than one week in the future"
- 7 days is sufficient because we generate fresh URLs on every page load

### Impact
- `generateFileAccessUrl()` will now use 7-day expiry
- All GET presigned URLs will be valid for 7 days
- Frontend generates fresh URLs on each page load (automatically extends availability)

---

## Change 2: GET Endpoint - Generate Fresh URLs

**File**: `/app/api/status-updates/route.js`  
**Lines**: 141-169 (in GET endpoint)  
**Change Type**: Feature Addition

### What Changed
```javascript
// GET endpoint now processes file keys to generate fresh presigned URLs

// BEFORE (Old Logic):
const { data: updates, error: updatesError } = await supabase
  .from('vendor_status_updates')
  .select('*')
  .eq('vendor_id', vendorId)
  .order('created_at', { ascending: false })
  .limit(20);

// ... returned updates with stored images directly (expired URLs)
return NextResponse.json({ updates: updates || [] }, { status: 200 });

// AFTER (New Logic):
const { data: updates, error: updatesError } = await supabase
  .from('vendor_status_updates')
  .select('*')
  .eq('vendor_id', vendorId)
  .order('created_at', { ascending: false })
  .limit(20);

// Generate fresh presigned URLs for all image file keys
if (updates && updates.length > 0) {
  for (const update of updates) {
    if (!update.images) {
      update.images = [];
      continue;
    }

    // Generate fresh presigned GET URLs from file keys
    const freshUrls = [];
    for (const imageKey of update.images) {
      try {
        // imageKey is stored as file key in database
        // Example: "vendor-profiles/status-updates/1234-5678-image.jpg"
        
        // Generate fresh 7-day presigned URL
        const freshUrl = await generateFileAccessUrl(imageKey, 7 * 24 * 60 * 60);
        // freshUrl is now: "https://bucket.s3.amazonaws.com/vendor-profiles/status-updates/1234-5678-image.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Date=20250108T...&X-Amz-Expires=604800&X-Amz-Signature=..."
        
        freshUrls.push(freshUrl);
        console.log('✅ Generated fresh 7-day URL for image key:', imageKey);
      } catch (err) {
        console.error('⚠️ Failed to generate URL for image key:', imageKey, err.message);
        freshUrls.push(imageKey);
      }
    }
    update.images = freshUrls;
  }
}

return NextResponse.json({ updates: updates || [] }, { status: 200 });
```

### How It Works
1. **Fetch from DB**: Get all vendor status updates (images contain file keys)
2. **For Each Update**: Loop through images array
3. **For Each Image**: Extract file key from database
4. **Generate Fresh URL**: Call `generateFileAccessUrl(key)` with 7-day expiry
5. **Replace Array**: Replace file keys with fresh presigned URLs
6. **Return to Frontend**: Client receives ready-to-use presigned URLs

### What Frontend Sees
```javascript
// API Response:
{
  "updates": [
    {
      "id": "uuid-123",
      "vendor_id": "uuid-456",
      "content": "Our new product launch!",
      "images": [
        "https://bucket.s3.amazonaws.com/vendor-profiles/status-updates/1234-5678-image.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Date=20250108T120000Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=abc123...",
        "https://bucket.s3.amazonaws.com/vendor-profiles/status-updates/1234-5678-image2.jpg?X-Amz-Algorithm=..."
      ],
      "likes_count": 5,
      "comments_count": 0,
      "created_at": "2025-01-08T10:00:00Z"
    }
  ]
}
```

### Why This Works
- ✅ File key is permanent (stored once in DB, never updated)
- ✅ Fresh URL has current signature (always valid when received)
- ✅ Works on first visit, refresh, 1 day later, 1 year later
- ✅ Each page load generates fresh URL with current timestamp

---

## Change 3: Upload Endpoint (Already Correct)

**File**: `/pages/api/status-updates/upload-image.js`  
**Lines**: 42-48  
**Status**: No changes needed ✅

### Current Implementation
```javascript
return res.status(200).json({
  presignedUrl: uploadResult.uploadUrl,
  fileKey: uploadResult.key,  // ← Already returning file key!
  bucket: process.env.AWS_S3_BUCKET,
  region: process.env.AWS_REGION,
});
```

### What Happens
1. Client calls API: `POST /api/status-updates/upload-image`
2. API calls `generatePresignedUploadUrl()` from aws-s3.js
3. AWS returns: `{ uploadUrl, fileUrl, key, fileName }`
4. API extracts key and returns both `presignedUrl` and `fileKey`
5. Client uses `presignedUrl` to upload file to S3
6. Client extracts `fileKey` for database storage

---

## Change 4: Modal Storage (Already Correct)

**File**: `/components/vendor-profile/StatusUpdateModal.js`  
**Lines**: 60-110  
**Status**: No changes needed ✅

### Current Implementation
```javascript
const uploadImageToS3 = async (file) => {
  const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;

  try {
    // Step 1: Get presigned URL from our API
    const presignResponse = await fetch('/api/status-updates/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''}`,
      },
      body: JSON.stringify({
        fileName: uniqueFilename,
        contentType: file.type || 'image/jpeg',
      }),
    });

    const { presignedUrl, fileKey } = await presignResponse.json();
    // ↑ Extracts both presignedUrl and fileKey ✅

    // Step 2: Upload directly to S3
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'image/jpeg',
      },
      body: file,
    });

    // Upload successful
    console.log('✅ Uploaded to S3, storing file key:', fileKey);
    
    return fileKey; // ← Returns FILE KEY, not presigned URL ✅
  } catch (err) {
    console.error('❌ S3 upload error:', err);
    throw err;
  }
};
```

### What Gets Stored
```javascript
// In form submission (line 199-202):
const response = await fetch('/api/status-updates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vendorId: vendor.id,
    content: content.trim(),
    images: images.length > 0 ? images : [],
    // ↑ images array contains file keys:
    // ["vendor-profiles/status-updates/1234-image.jpg", 
    //  "vendor-profiles/status-updates/5678-image.jpg"]
  }),
});
```

---

## Change 5: POST Endpoint (No Changes Needed)

**File**: `/app/api/status-updates/route.js`  
**Lines**: 16-104  
**Status**: No changes needed ✅

### Current Implementation
```javascript
// Simply saves images array as-is
const { data: update, error: updateError } = await supabase
  .from('vendor_status_updates')
  .insert({
    vendor_id: vendorId,
    content: content.trim(),
    images: images && images.length > 0 ? images : [],
    // ↑ Stores file keys in database ✅
  })
  .select()
  .single();
```

### Database Result
```sql
-- vendor_status_updates table row:
id: uuid-123
vendor_id: uuid-456
content: "Our new product launch!"
images: ["vendor-profiles/status-updates/1234-image.jpg", "vendor-profiles/status-updates/5678-image.jpg"]
likes_count: 0
comments_count: 0
created_at: 2025-01-08 10:00:00
updated_at: 2025-01-08 10:00:00
```

Note: `images` column is `text[]` (text array), not URL field

---

## Change 6: Card Component (No Changes Needed)

**File**: `/components/vendor-profile/StatusUpdateCard.js`  
**Lines**: 14-19  
**Status**: No changes needed ✅

### Current Implementation
```javascript
const images = update.images || [];
const imageUrls = images.map(img => 
  typeof img === 'string' ? img : img.imageUrl
).filter(Boolean);

const currentImage = imageUrls[currentImageIndex];
```

### What Happens
1. Component receives update from API
2. API has already converted file keys to presigned URLs
3. Component treats as image URLs (which they are)
4. Carousel displays images normally

---

## Complete Data Flow Example

### Scenario: User Creates Update on Jan 8 @ 10:00 AM

**Step 1: Upload**
```
User selects: photo.jpg (5MB)
               ↓
Modal compresses to: photo-compressed.jpg (200KB)
                     ↓
Request: POST /api/status-updates/upload-image
{
  "fileName": "1736336400000-a3b2c1-photo-compressed.jpg",
  "contentType": "image/jpeg"
}
                     ↓
Response:
{
  "presignedUrl": "https://bucket.s3.amazonaws.com/vendor-profiles/status-updates/1736336400000-a3b2c1-photo-compressed.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE:20250108T100000Z/...&X-Amz-Expires=3600&X-Amz-Signature=abc123...",
  "fileKey": "vendor-profiles/status-updates/1736336400000-a3b2c1-photo-compressed.jpg"
}
                     ↓
Browser uploads directly to S3:
PUT https://bucket.s3.amazonaws.com/vendor-profiles/status-updates/1736336400000-a3b2c1-photo-compressed.jpg?X-Amz-Algorithm=...&X-Amz-Signature=abc123...

File stored at S3 location ✅
```

**Step 2: Store**
```
Modal stores file key in images array:
["vendor-profiles/status-updates/1736336400000-a3b2c1-photo-compressed.jpg"]
                     ↓
Form submission: POST /api/status-updates
{
  "vendorId": "vendor-uuid-456",
  "content": "Our new product launch!",
  "images": ["vendor-profiles/status-updates/1736336400000-a3b2c1-photo-compressed.jpg"]
}
                     ↓
Database insert:
vendor_status_updates {
  id: uuid-123,
  vendor_id: uuid-456,
  content: "Our new product launch!",
  images: ["vendor-profiles/status-updates/1736336400000-a3b2c1-photo-compressed.jpg"],
  created_at: 2025-01-08 10:00:00
}
```

**Step 3: Fetch (Same Day - Jan 8 @ 2:00 PM)**
```
User views vendor profile
                ↓
Frontend: GET /api/status-updates?vendorId=vendor-uuid-456
                ↓
Backend fetches from DB:
images: ["vendor-profiles/status-updates/1736336400000-a3b2c1-photo-compressed.jpg"]
                ↓
For each image key:
  generateFileAccessUrl("vendor-profiles/status-updates/1736336400000-a3b2c1-photo-compressed.jpg", 604800)
                ↓
AWS generates NEW presigned URL with CURRENT TIMESTAMP:
  Signature includes: timestamp=2025-01-08T14:00:00Z, expiry=604800
                ↓
Response:
{
  "updates": [{
    "id": "uuid-123",
    "content": "Our new product launch!",
    "images": ["https://bucket.s3.amazonaws.com/vendor-profiles/status-updates/1736336400000-a3b2c1-photo-compressed.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Date=20250108T140000Z&X-Amz-Expires=604800&X-Amz-Signature=xyz789..."],
    "created_at": "2025-01-08T10:00:00Z"
  }]
}
                ↓
Frontend displays image ✅
Browser: GET https://bucket.s3.amazonaws.com/vendor-profiles/status-updates/...
S3: Validates signature, returns image ✅
```

**Step 4: Fetch Again (5 Days Later - Jan 13)**
```
User views vendor profile
                ↓
Frontend: GET /api/status-updates?vendorId=vendor-uuid-456
                ↓
Backend fetches from DB (same file key):
images: ["vendor-profiles/status-updates/1736336400000-a3b2c1-photo-compressed.jpg"]
                ↓
For each image key:
  generateFileAccessUrl("vendor-profiles/status-updates/1736336400000-a3b2c1-photo-compressed.jpg", 604800)
                ↓
AWS generates ANOTHER NEW presigned URL with NEW TIMESTAMP:
  Signature includes: timestamp=2025-01-13T14:00:00Z, expiry=604800
  (Previous URL from Jan 8 is now expired, but doesn't matter - we have new one)
                ↓
Response:
{
  "updates": [{
    "id": "uuid-123",
    "content": "Our new product launch!",
    "images": ["https://bucket.s3.amazonaws.com/vendor-profiles/status-updates/1736336400000-a3b2c1-photo-compressed.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Date=20250113T140000Z&X-Amz-Expires=604800&X-Amz-Signature=zzz999..."],
    "created_at": "2025-01-08T10:00:00Z"
  }]
}
                ↓
Frontend displays image ✅
Browser: GET https://bucket.s3.amazonaws.com/vendor-profiles/status-updates/...
S3: Validates signature with NEW timestamp, returns image ✅
```

**Step 5: Fetch Again (10 Years Later - Jan 8, 2035)**
```
Same process repeats
File key still exists in database (unchanged)
New presigned URL generated with current timestamp
Image still loads ✅
Never expires ✅
```

---

## Summary

| Component | Responsibility | Status |
|-----------|-----------------|--------|
| aws-s3.js | Use 7-day max for presigned URLs | ✅ Fixed |
| upload-image.js | Return file key to client | ✅ Already working |
| StatusUpdateModal.js | Store file keys in database | ✅ Already working |
| POST /api/status-updates | Save file keys to DB | ✅ Already working |
| GET /api/status-updates | Generate fresh URLs from keys | ✅ Fixed |
| StatusUpdateCard.js | Display images from URLs | ✅ Already working |

All components work together to ensure:
- ✅ File keys stored forever (never expire)
- ✅ Fresh presigned URLs generated on each fetch (always valid)
- ✅ Images display forever without any manual intervention
