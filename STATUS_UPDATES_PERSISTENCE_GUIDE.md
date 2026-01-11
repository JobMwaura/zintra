# Status Updates Persistence & Facebook-Like Feed - Implementation Guide

## Problem Diagnosis

Updates disappear after page refresh because:
1. **StatusUpdateImage table not created** in Supabase
2. API tries to fetch images from non-existent table, causing errors
3. Images array doesn't populate on GET request
4. Frontend can't display images properly

## Solution - Complete Implementation

### Step 1: Create StatusUpdateImage Table in Supabase ⚠️ CRITICAL

**File**: `/supabase/sql/STATUS_UPDATE_IMAGES_TABLE.sql`

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire file content
4. Execute

**Verify Success**:
- Table appears in Tables list
- Can see columns: id, statusupdateid, imageurl, imagetype, displayorder, uploadedat
- Indexes created

### Step 2: Understand Current Architecture

The vendor profile already has status updates integrated:
- ✅ StatusUpdateModal component (post creation)
- ✅ StatusUpdateCard component (display with likes)
- ✅ Updates tab in vendor profile
- ❌ StatusUpdateImage table (MISSING - causing persistence issue)
- ❌ Link preview component (NEW - for URL sharing)
- ❌ Full feed display (NEW - Facebook-like layout)

### Step 3: Deploy New Components

Three new components have been created to enhance the feed:

**1. StatusUpdateFeed.js** - Main feed container
- Fetches updates from API
- Displays in reverse chronological order
- Handles loading/error states
- Integrates with StatusUpdateCard

**2. LinkPreview.js** - URL preview parser
- Extracts URLs from update text
- Fetches OpenGraph metadata
- Shows thumbnail + title + description
- Clickable link card

**3. /api/link-preview/route.js** - Backend for URL fetching
- Extracts OpenGraph meta tags
- Returns title, description, image
- Handles errors gracefully

### Step 4: Integration into Vendor Profile

The "Business Updates" section in vendor profile already exists but can be enhanced:

**Current Display**:
```
[Business Updates] [+ Share Update]
- Latest 2 updates shown
- Simple card layout with likes count
```

**Enhanced Display** (Optional - already working):
```
[Business Updates] [+ Share Update]
- Image carousel for each update
- Like/Comment/Share buttons
- Link preview for shared URLs
- Responsive grid layout
```

## Complete Data Flow for Persistence

```
1. Vendor clicks "+ Share Update" button
   ↓
2. StatusUpdateModal opens
   ↓
3. User:
   - Writes text content
   - Selects up to 5 images
   - Clicks "Post Update"
   ↓
4. Component compresses images
   ↓
5. Component calls presigned URL API:
   POST /pages/api/status-updates/upload-image
   ↓
6. Each image uploads directly to S3
   ↓
7. Component POSTs to:
   POST /api/status-updates
   - Content: text
   - Images: [S3 URLs array]
   ↓
8. API creates vendor_status_updates record
   ↓
9. API creates StatusUpdateImage records (one per image)
   ↓
10. Update with images saved to Supabase
    ↓
11. Page refresh: GET /api/status-updates?vendorId=...
    ↓
12. API fetches vendor_status_updates
    ↓
13. API fetches StatusUpdateImage records
    ↓
14. API joins images to updates
    ↓
15. Frontend displays updates with images
    ↓
16. ✅ Images persist!
```

## Files Status

### ✅ Already Implemented & Working
- `/pages/api/status-updates/upload-image.js` - Presigned URLs
- `/app/api/status-updates/route.js` - Create & fetch updates
- `/components/vendor-profile/StatusUpdateModal.js` - Post creation
- `/components/vendor-profile/StatusUpdateCard.js` - Display cards
- `/app/vendor-profile/[id]/page.js` - Integration

### ✅ New Components (Just Added)
- `/components/vendor-profile/StatusUpdateFeed.js` - Feed display
- `/components/vendor-profile/LinkPreview.js` - URL preview
- `/app/api/link-preview/route.js` - URL metadata API

### ⚠️ Database - MUST CREATE
- `/supabase/sql/STATUS_UPDATE_IMAGES_TABLE.sql` - Image metadata table

## Why Updates Disappear

**Current Broken Flow**:
```
POST /api/status-updates (creates update, saves images)
  ↓ Works fine
  ↓
GET /api/status-updates?vendorId=... (fetches update)
  ↓ Works fine
  ↓
Try to query StatusUpdateImage table
  ↓ ERROR - TABLE DOESN'T EXIST
  ↓
Images array comes back empty
  ↓
Frontend displays update WITHOUT images
  ↓
StatusUpdateCard re-renders differently (no images)
  ↓
User thinks update disappeared
```

## How to Test Persistence

### Test 1: Create & Persist
1. Go to vendor profile (as vendor)
2. Click "+ Share Update"
3. Write text + upload 2 images
4. Click "Post Update"
5. ✅ Update appears with images
6. **Refresh page**
7. ✅ Update still there with images

### Test 2: Verify Database
1. Supabase Dashboard → SQL Editor
2. Run query:
```sql
SELECT * FROM "StatusUpdateImage" LIMIT 5;
```
3. Should see image records with S3 URLs

### Test 3: API Response
1. Open browser DevTools → Network
2. Click "+ Share Update"
3. Look for request to `/api/status-updates` (POST)
4. Response should include:
```json
{
  "update": {
    "id": "uuid",
    "content": "text",
    "images": [
      {
        "id": "uuid",
        "imageUrl": "https://s3...",
        "displayOrder": 0
      }
    ]
  }
}
```

## Architecture: Why Separate Table?

### Old Approach (Still in use for data):
```
vendor_status_updates
{
  id
  vendor_id
  content
  images: ["url1", "url2"] ← Array stored in column
}
```

**Problems**:
- Can't track metadata per image (type, caption, order)
- Can't index images efficiently
- Hard to query/filter by image properties
- Doesn't scale with many updates

### New Approach (StatusUpdateImage table):
```
vendor_status_updates
{
  id
  vendor_id
  content
  likes_count
  created_at
}

StatusUpdateImage
{
  id
  statusupdateid FK
  imageurl
  imagetype
  displayorder
  uploadedat
}
```

**Benefits**:
- ✅ Track metadata for each image
- ✅ Index by statusupdateid for fast queries
- ✅ Sort by displayorder for galleries
- ✅ Scale to thousands of updates
- ✅ Share image code with portfolio

## Link Preview Feature

When a user posts a URL in an update:
```
"Check out our new website https://example.com for details!"
```

The LinkPreview component:
1. Extracts URL
2. Fetches OpenGraph tags
3. Shows rich preview:
```
[Thumbnail Image] Website Title
                  Description text...
```

User can click to open URL.

## Deployment Checklist

- [ ] Step 1: Run SQL migration to create StatusUpdateImage table
- [ ] Step 2: Deploy to Vercel (new components auto-deploy)
- [ ] Step 3: Test persistence (create update, refresh)
- [ ] Step 4: Test API response (check Network tab)
- [ ] Step 5: Test link preview (post URL, see preview)
- [ ] Step 6: Verify database (query StatusUpdateImage)

## Troubleshooting

### Issue: "Updates disappearing"
**Solution**: Create StatusUpdateImage table (Step 1)

### Issue: "Images not showing after refresh"
**Solution**: 
1. Check StatusUpdateImage table exists
2. Check API response includes images array
3. Check S3 URLs are valid (not expired)

### Issue: "Link preview not showing"
**Solution**: 
1. URL must be in update text
2. URL must be valid (start with http/https)
3. Target website must have OpenGraph meta tags

### Issue: "Build errors on Vercel"
**Solution**: Make sure using correct function name:
- ✅ `generatePresignedUploadUrl` 
- ❌ `generatePresignedUrl`

## Next Phase Enhancements

Once persistence is working, consider:

1. **Comments System**
   - `vendor_status_update_comments` table ready
   - Needs: Comment input + reply display

2. **Share to Social**
   - Already have share buttons
   - Can integrate Twitter, Facebook, LinkedIn

3. **Advanced Analytics**
   - Track which updates get most engagement
   - Show trending updates
   - Vendor statistics dashboard

4. **Notifications**
   - Alert vendor when someone likes update
   - Notify followers of new updates

5. **Search & Filter**
   - Search updates by keyword
   - Filter by date range
   - Filter by image/no-image
