# Business Updates (Status Updates) - Complete Component & Page List

## Overview

The "Business Updates" feature (internally called "Status Updates") consists of:
- **1 main page** that displays the feature
- **3 React components** for UI
- **2 API endpoints** for backend operations
- **3 database tables** with RLS policies

---

## Pages

### 1. **`/app/vendor-profile/[id]/page.js`** 🌟 MAIN PAGE
**Location**: `/Users/macbookpro2/Desktop/zintra-platform/app/vendor-profile/[id]/page.js`

**What it does**:
- Displays vendor profile with all tabs
- Shows "Business Updates" section on Overview tab
- Shows full "Business Updates" tab
- Manages the modal for creating new updates
- Fetches and displays all status updates

**Key features**:
```
Line 37-38: Imports StatusUpdateModal and StatusUpdateCard
Line 81-82: State management for modal and updates
Line 764-793: "Business Updates" box in Overview tab
  ├─ Shows latest 2 updates
  ├─ "+ Create Update" button
  └─ "+ N more updates" link

Line 1226-1250: Full "Business Updates" tab
  ├─ Shows all updates
  ├─ "+ Create Update" button
  └─ StatusUpdateCard for each update
```

**State variables**:
- `showStatusUpdateModal` - Controls modal visibility
- `statusUpdates` - Array of status updates

**UI Sections**:
- Overview tab: Shows 2 latest business updates
- Updates tab: Shows all business updates in full

**What triggers updates**:
- User clicks "+ Share Update" button
- Modal opens → User fills form → Submits
- Page fetches updated list from API

---

## Components

### 1. **`StatusUpdateModal.js`** 📝 CREATE/EDIT FORM
**Location**: `/Users/macbookpro2/Desktop/zintra-platform/components/vendor-profile/StatusUpdateModal.js`

**What it does**:
- Modal dialog for creating new status updates
- Handles image uploads to S3
- Compresses images before upload
- Shows upload progress

**Key features**:
```
Props:
├─ vendor (object) - Vendor info
├─ onClose (function) - Close modal
└─ onSuccess (function) - Called after successful create

State:
├─ content (text) - The update text
├─ images (array) - S3 URLs of uploaded images
├─ previewUrls (array) - Local preview URLs
├─ uploadProgress (object) - Upload status per image
├─ loading (boolean) - Is submitting?
└─ error (string) - Error message

Key functions:
├─ compressImage() - Canvas compression to 1920x1440
├─ uploadImageToS3() - Upload compressed image
├─ handleImageUpload() - Process selected images
└─ handleSubmit() - POST to /api/status-updates
```

**Workflow**:
1. User types content
2. User selects images
3. Component compresses each image (1920x1440 max)
4. Component uploads each to S3 (direct, no server)
5. Gets S3 URLs
6. POSTs to `/api/status-updates` with content + image URLs
7. Closes modal if successful

---

### 2. **`StatusUpdateCard.js`** 🎞️ DISPLAY CARD WITH CAROUSEL
**Location**: `/Users/macbookpro2/Desktop/zintra-platform/components/vendor-profile/StatusUpdateCard.js`

**What it does**:
- Displays a single status update
- Shows image carousel with thumbnails
- Handles like/unlike functionality
- Shows comments (future feature)

**Key features**:
```
Props:
├─ update (object) - The status update record
├─ vendor (object) - Vendor info
├─ currentUser (object) - Current logged-in user
└─ onDelete (function) - Called when deleted

State:
├─ liked (boolean) - Is current user liking this?
├─ likesCount (number) - Total likes
├─ currentImageIndex (number) - Which image showing?
└─ showComments (boolean) - Show comments section?

Key features:
├─ Image carousel with prev/next buttons
├─ Image counter (1/3, 2/3, etc.)
├─ Thumbnail strip below main image
├─ Click thumbnail to jump to image
├─ Likes button (❤️)
├─ Comments button (💬)
├─ Share button (→)
└─ More menu (⋮) for delete/edit

Image handling:
├─ Gets images from update.images (text array)
├─ Converts to URLs
├─ Displays main image large
├─ Shows thumbnails small below
└─ Navigation arrows and buttons
```

**Workflow**:
1. Component receives update object
2. Extracts images array
3. Displays first image in main carousel
4. Shows thumbnails below
5. User can:
   - Click prev/next arrows
   - Click thumbnail to jump
   - Like the update
   - View comments (future)
   - Share (future)

---

### 3. **`StatusUpdateFeed.js`** 📰 FEED (Currently unused but exists)
**Location**: `/Users/macbookpro2/Desktop/zintra-platform/components/vendor-profile/StatusUpdateFeed.js`

**What it does**:
- Could display a feed of multiple updates
- Future enhancement

**Status**: Created but not actively used in current implementation

---

## API Endpoints

### 1. **`POST /api/status-updates`** ✏️ CREATE UPDATE
**Location**: `/Users/macbookpro2/Desktop/zintra-platform/app/api/status-updates/route.js`

**Request**:
```json
{
  "vendorId": "uuid-of-vendor",
  "content": "The update text",
  "images": ["https://s3.url/image1.jpg", "https://s3.url/image2.jpg"]
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
    "images": ["url1", "url2"],
    "likes_count": 0,
    "comments_count": 0,
    "created_at": "2026-01-11T...",
    "updated_at": "2026-01-11T..."
  }
}
```

**What happens**:
1. Validates vendor exists
2. Creates record in `vendor_status_updates` table
3. Saves images array
4. Returns created update

### 2. **`GET /api/status-updates?vendorId=...`** 📖 GET UPDATES
**Location**: `/Users/macbookpro2/Desktop/zintra-platform/app/api/status-updates/route.js`

**Request**:
```
GET /api/status-updates?vendorId=<uuid>
```

**Response**:
```json
{
  "updates": [
    {
      "id": "uuid",
      "vendor_id": "uuid",
      "content": "text",
      "images": ["url1", "url2"],
      "likes_count": 0,
      "created_at": "2026-01-11T..."
    }
  ]
}
```

**What happens**:
1. Fetches all updates for vendor
2. Orders by created_at DESC (newest first)
3. Limits to 20 updates
4. Returns complete records with images

### 3. **`POST /pages/api/status-updates/upload-image.js`** 📸 S3 PRESIGNED URL
**Location**: `/Users/macbookpro2/Desktop/zintra-platform/pages/api/status-updates/upload-image.js`

**Request**:
```json
{
  "fileName": "unique-filename.jpg",
  "contentType": "image/jpeg"
}
```

**Response**:
```json
{
  "presignedUrl": "https://s3.amazonaws.com/bucket/...",
  "bucket": "zintra-images-prod",
  "region": "us-east-1"
}
```

**What happens**:
1. Generates presigned URL for direct S3 upload
2. Frontend uses this to upload directly to S3
3. Returns S3 URL for saving to database

---

## Database Tables

### 1. **`vendor_status_updates`** 📋 MAIN TABLE
**Location**: Created via migration `20260111_add_rls_policies_status_updates.sql`

**Schema**:
```sql
id (uuid PRIMARY KEY)
vendor_id (uuid FK → vendors)
content (text NOT NULL)
images (text[] DEFAULT ARRAY[]::text[])
likes_count (integer DEFAULT 0)
comments_count (integer DEFAULT 0)
created_at (timestamp)
updated_at (timestamp)
```

**Indexes**:
- vendor_id (foreign key lookup)
- created_at DESC (for sorting)

**RLS Policy**: Allow all operations

---

### 2. **`vendor_status_update_likes`** 👍 LIKES TABLE
**Location**: Created via migration `20260111_add_rls_policies_status_updates.sql`

**Schema**:
```sql
id (uuid PRIMARY KEY)
update_id (uuid FK → vendor_status_updates)
user_id (uuid FK → auth.users)
created_at (timestamp)
UNIQUE(update_id, user_id)  -- One like per user per update
```

**RLS Policy**: Allow all operations

---

### 3. **`vendor_status_update_comments`** 💬 COMMENTS TABLE
**Location**: Created via migration `20260111_add_rls_policies_status_updates.sql`

**Schema**:
```sql
id (uuid PRIMARY KEY)
update_id (uuid FK → vendor_status_updates)
user_id (uuid FK → auth.users)
content (text NOT NULL)
created_at (timestamp)
updated_at (timestamp)
```

**RLS Policy**: Allow all operations

---

## Complete Data Flow

### Creating an Update
```
1. User clicks "+ Share Update" button
   ↓ (on vendor-profile/[id]/page.js)
2. StatusUpdateModal opens
   ↓
3. User selects images
   ↓
4. StatusUpdateModal.handleImageUpload()
   ├─ Compresses image (canvas)
   └─ Calls uploadImageToS3()
      ├─ Gets presigned URL from /api/status-updates/upload-image
      └─ Uploads directly to S3 (bypasses server)
   ↓
5. Got S3 URLs for all images
   ↓
6. User clicks "Post Update"
   ↓
7. StatusUpdateModal.handleSubmit()
   └─ POST to /api/status-updates
      ├─ Body: { vendorId, content, images[] }
      └─ API creates record in vendor_status_updates
   ↓
8. Modal closes
   ↓
9. Page refreshes updates list
   ↓
10. StatusUpdateCard displays the update with carousel
```

### Displaying Updates
```
1. Vendor profile page loads
   ↓
2. Fetches: GET /api/status-updates?vendorId=<id>
   ↓
3. API returns all updates with images array
   ↓
4. For each update:
   └─ <StatusUpdateCard update={update} />
      ├─ Extracts images array
      ├─ Shows first image large
      ├─ Shows thumbnail strip
      ├─ Displays likes/comments/share buttons
      └─ Handles navigation between images
```

---

## File Summary

| File | Type | Purpose |
|------|------|---------|
| `/app/vendor-profile/[id]/page.js` | Page | Main vendor profile with status updates |
| `/components/vendor-profile/StatusUpdateModal.js` | Component | Form to create updates |
| `/components/vendor-profile/StatusUpdateCard.js` | Component | Display single update with carousel |
| `/components/vendor-profile/StatusUpdateFeed.js` | Component | Feed layout (unused) |
| `/app/api/status-updates/route.js` | API | POST (create), GET (fetch) |
| `/pages/api/status-updates/upload-image.js` | API | S3 presigned URLs |
| Migrations | SQL | Database tables & RLS |

---

## Testing the Feature

### Test 1: Create Status Update
```
1. Go to vendor profile
2. Click "+ Share Update"
3. Type: "Test update"
4. Upload 2 images
5. Click "Post Update"
6. Modal closes
7. See update with carousel at top of Updates tab
```

### Test 2: View Carousel
```
1. See main image displayed
2. See image counter (1/2)
3. See thumbnail strip below
4. Click ◀ button → image changes
5. Click ▶ button → image changes
6. Click thumbnail → jumps to that image
```

### Test 3: Persistence
```
1. Create status update with images
2. Refresh page (Cmd+R)
3. Update still visible ✅
4. Images still in carousel ✅
5. Refresh again → still there ✅
```

---

## Future Enhancements

- [ ] Edit existing updates
- [ ] Delete updates with confirmation
- [ ] Like functionality (UI ready)
- [ ] Comments (table ready)
- [ ] @mentions in comments
- [ ] Share to social media
- [ ] Tags/categories
- [ ] Scheduled updates
- [ ] Analytics (views, likes, comments)
- [ ] Stricter RLS (vendor-specific access)

---

## Status (As of Jan 11, 2026)

✅ Pages: Complete
✅ Components: Complete with carousel
✅ API: Complete
✅ Database: Complete with RLS
✅ S3 Integration: Complete
✅ Image Compression: Complete
✅ Deployment: Live on Vercel

**Next**: Test the feature in your app!
