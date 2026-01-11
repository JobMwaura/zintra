# Status Update Images Table - Deployment Guide

## Overview
Created a new `StatusUpdateImage` table to mirror the `PortfolioProjectImage` structure. This allows status updates to have multiple images stored with proper metadata, just like portfolio projects.

## What Was Created

### 1. Database Table: `StatusUpdateImage`
**File**: `/supabase/sql/STATUS_UPDATE_IMAGES_TABLE.sql`

**Schema**:
```sql
CREATE TABLE public.StatusUpdateImage (
  id TEXT PRIMARY KEY,
  statusupdateid UUID NOT NULL REFERENCES public.vendor_status_updates(id) ON DELETE CASCADE,
  imageurl TEXT NOT NULL,
  imagetype TEXT DEFAULT 'status',
  caption TEXT,
  displayorder INTEGER DEFAULT 0,
  uploadedat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- ✅ Separate table for each image (not array in vendor_status_updates)
- ✅ Foreign key to vendor_status_updates
- ✅ Cascade delete when update is deleted
- ✅ S3 URL storage (imageurl)
- ✅ Display order for gallery
- ✅ Optional caption for each image
- ✅ RLS enabled with permissive policies
- ✅ Indexes on statusupdateid and displayorder for fast queries

### 2. API Updates

#### POST `/api/status-updates`
- Creates vendor_status_updates record with content
- Saves each image to StatusUpdateImage table with metadata
- Returns update with images attached

**Request Body**:
```json
{
  "vendorId": "uuid-here",
  "content": "Update text...",
  "images": ["https://s3.amazonaws.com/...", "..."]
}
```

**Response**:
```json
{
  "message": "Status update created successfully",
  "update": {
    "id": "uuid",
    "vendor_id": "uuid",
    "content": "text",
    "images": [
      {
        "id": "uuid",
        "imageUrl": "https://s3...",
        "imageType": "status",
        "displayOrder": 0,
        "uploadedAt": "2026-01-11T..."
      }
    ]
  }
}
```

#### GET `/api/status-updates?vendorId=...`
- Fetches all status updates for vendor
- Fetches all images for those updates
- Attaches images with camelCase transformation
- Returns array of updates with nested images

### 3. Component Updates

#### StatusUpdateModal.js
- Removed Supabase Storage uploads
- Added S3 presigned URL generation
- Added image compression (1920x1440, 85% JPEG)
- Sequential uploads (prevents overload)
- Upload progress indicators

**Flow**:
1. User selects image files
2. Component compresses to 1920x1440, 85% JPEG quality
3. Requests presigned URL from `/api/status-updates/upload-image`
4. Uploads directly to S3 using presigned URL
5. Submits update with S3 URLs to `/api/status-updates` POST
6. API saves images to StatusUpdateImage table

## Deployment Steps

### Step 1: Deploy Database Migration
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy contents of `/supabase/sql/STATUS_UPDATE_IMAGES_TABLE.sql`
4. Run query
5. Verify table created: Check Tables → StatusUpdateImage exists

### Step 2: Deploy API Updates
The API code is already updated in:
- `/app/api/status-updates/route.js` (POST & GET handlers)
- `/app/api/status-updates/upload-image.js` (presigned URL generation)
- `/components/vendor-profile/StatusUpdateModal.js` (component)

These will deploy automatically with git push to Vercel.

### Step 3: Test the Flow

**Test 1: Upload Status Update with Images**
1. Go to vendor profile (as vendor user)
2. Click "Share Update" button
3. Write some text
4. Upload 2-3 images
5. Click "Post Update"
6. Verify:
   - ✅ Images display with preview
   - ✅ Progress shows "Compressing..." then "Uploading..."
   - ✅ Modal closes
   - ✅ Update appears in feed with images

**Test 2: Verify Database Storage**
1. Supabase Dashboard → Database → StatusUpdateImage
2. Query should show image records with:
   - statusupdateid pointing to correct update
   - imageurl with S3 URLs
   - displayorder as 0, 1, 2...
   - uploadedat timestamps

**Test 3: Verify API Response**
1. GET `/api/status-updates?vendorId={vendorId}`
2. Response should include updates with nested images array
3. Each image should have camelCase properties (imageUrl, displayOrder, etc.)

## Data Structure Comparison

### Portfolio Images (Reference)
```
PortfolioProject
  ├─ id
  ├─ vendorprofileid
  ├─ title
  └─ images: [
       {imageUrl, imageType, displayOrder, uploadedAt}
     ]

PortfolioProjectImage (separate table)
  ├─ id
  ├─ portfolioprojectid (FK)
  ├─ imageurl (S3)
  ├─ imagetype (before/during/after)
  ├─ displayorder
  └─ uploadedat
```

### Status Update Images (New)
```
vendor_status_updates
  ├─ id
  ├─ vendor_id
  ├─ content
  └─ images: [
       {imageUrl, imageType, displayOrder, uploadedAt}
     ]

StatusUpdateImage (new separate table)
  ├─ id
  ├─ statusupdateid (FK)
  ├─ imageurl (S3)
  ├─ imagetype (status/offer/achievement)
  ├─ displayorder
  └─ uploadedat
```

## Difference from Portfolio Implementation

### Similarities ✅
- Separate image table (not array)
- Foreign key cascade delete
- S3 URL storage
- Display order for gallery
- RLS enabled
- Camelcase transformation in API

### Differences
1. **Image Type**: Portfolio has before/during/after, Status Updates have status/offer/achievement
2. **Content**: Portfolio has full project metadata, Status Updates have just text content
3. **Gallery**: Both can have images but status updates simpler (no cover image selection)

## Troubleshooting

### Issue: "StatusUpdateImage table does not exist"
- **Solution**: Run SQL migration from Step 1
- Verify in Supabase Dashboard → Tables list

### Issue: "Foreign key constraint violation"
- **Solution**: Ensure vendor_status_updates record exists before inserting image
- Check API code uses correct update.id

### Issue: Images not displaying
- **Solution**: 
  1. Check S3 URLs are valid (not expired presigned URLs)
  2. Verify images were saved to StatusUpdateImage table
  3. Check camelCase transformation in API response

### Issue: "Maximum 5 images" error on save
- **Solution**: Frontend already validates, but API enforces 5 image limit
- Check images.length <= 5 before posting

## Rollback (If Needed)

To revert to old structure (images in array):
```sql
DROP TABLE public.StatusUpdateImage;
-- vendor_status_updates.images column will still exist for backwards compatibility
```

## Next Steps

Once deployed and tested:
1. ✅ Status updates with images fully working
2. Next: Implement delete status updates
3. Next: Implement edit status updates
4. Next: Implement likes and comments
5. Next: Display status updates in vendor profile feed

## Files Modified/Created

**New Files**:
- ✅ `/supabase/sql/STATUS_UPDATE_IMAGES_TABLE.sql`
- ✅ `/app/api/status-updates/upload-image.js`
- ✅ `/app/api/status-updates/route.js`

**Modified Files**:
- ✅ `/components/vendor-profile/StatusUpdateModal.js`

**Documentation**:
- ✅ This file: `STATUS_UPDATE_IMAGES_DEPLOYMENT_GUIDE.md`
