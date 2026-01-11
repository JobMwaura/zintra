# Status Updates Carousel - Visual Architecture & Data Flow

## 🎨 User Interface

### Before (What You Had)
```
┌─────────────────────────────────────┐
│ Vendor Update Post                  │
├─────────────────────────────────────┤
│ "Great product update..."           │
├─────────────────────────────────────┤
│ [Image Grid - 2 columns]            │
│ [Image 1] [Image 2]                 │
│ [Image 3] [Image 4]                 │
├─────────────────────────────────────┤
│ ❤️ 0 likes                          │
└─────────────────────────────────────┘
```

### After (Professional Carousel)
```
┌──────────────────────────────────────────┐
│ [👤] Company Name        2m ago    [⋯]  │ ← Header with menu
├──────────────────────────────────────────┤
│ We're excited to announce...             │ ← Content text
├──────────────────────────────────────────┤
│  ◀                                      ▶│ ← Navigation arrows
│    [Full Size Image Display]             │
│         (16:9 Aspect Ratio)              │
│  ◀  [1 / 3]                             ▶│
├──────────────────────────────────────────┤
│ [📸1] [📸2] [📸3]  ← Thumbnails scroll ─→│
├──────────────────────────────────────────┤
│ ❤️ 0 likes    💬 0 comments              │ ← Stats bar
├──────────────────────────────────────────┤
│ [♡ Like] [💬 Comment] [↗ Share]         │ ← Action buttons
└──────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

### Upload Flow
```
User Posts Update with Images
         │
         ↓
┌─────────────────────────────────┐
│  StatusUpdateModal Component    │
├─────────────────────────────────┤
│ • Get images from file input    │
│ • Compress using canvas:        │
│   - Max 1920x1440              │
│   - 85% JPEG quality           │
│ • Create preview URLs (blob)    │
└─────────────────────────────────┘
         │
         ↓ Sequential (not parallel)
┌─────────────────────────────────┐
│  Request Presigned URLs         │
├─────────────────────────────────┤
│ POST /pages/api/status-updates/ │
│         upload-image            │
│                                 │
│ Parameters:                     │
│ • filename                      │
│ • contentType                   │
│ • folder: vendor-profiles/...   │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  S3 Presigned URL Response      │
├─────────────────────────────────┤
│ {                               │
│   presignedUrl: "https://...",  │
│   fileKey: "path/to/file"       │
│ }                               │
└─────────────────────────────────┘
         │
         ↓ Direct browser upload (fast!)
┌─────────────────────────────────┐
│  Browser → AWS S3 (Direct)      │
├─────────────────────────────────┤
│ PUT request with compressed     │
│ image directly to S3            │
│ (bypasses Node.js server)       │
└─────────────────────────────────┘
         │
         ↓ Collect S3 URLs
┌─────────────────────────────────┐
│  Create Status Update           │
├─────────────────────────────────┤
│ POST /app/api/status-updates    │
│                                 │
│ Body:                           │
│ {                               │
│   vendorId: "...",              │
│   content: "Update text...",    │
│   images: [                     │
│     "https://s3.../file1.jpg",  │
│     "https://s3.../file2.jpg",  │
│     "https://s3.../file3.jpg"   │
│   ]                             │
│ }                               │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  API Handler                    │
├─────────────────────────────────┤
│ 1. Create vendor_status_updates │
│    record in database           │
│                                 │
│ 2. Create StatusUpdateImage     │
│    records (one per image):     │
│    {                            │
│      statusupdateid: "...",     │
│      imageurl: "s3://...",      │
│      displayorder: 0,           │
│      imagetype: "status"        │
│    }                            │
│                                 │
│ 3. Return update with images    │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  Database Transaction           │
├─────────────────────────────────┤
│ vendor_status_updates:          │
│  + Update record created ✓      │
│                                 │
│ StatusUpdateImage:              │
│  + 3 image records created ✓    │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  Response to Client             │
├─────────────────────────────────┤
│ {                               │
│   success: true,                │
│   update: {                     │
│     id: "...",                  │
│     content: "...",             │
│     images: [                   │
│       { imageUrl: "s3://..." }, │
│       { imageUrl: "s3://..." }, │
│       { imageUrl: "s3://..." }  │
│     ]                           │
│   }                             │
│ }                               │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  Update Component State         │
├─────────────────────────────────┤
│ setUpdates([newUpdate, ...])    │
│ → Re-render feed                │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  User Sees Carousel! 🎉         │
├─────────────────────────────────┤
│ StatusUpdateCard displays:      │
│ • First image in main area      │
│ • All thumbnails below          │
│ • Navigation arrows             │
│ • Image counter (1/3)           │
└─────────────────────────────────┘
```

### Fetch/Display Flow
```
Page Load / User Navigates
         │
         ↓
┌─────────────────────────────────┐
│  StatusUpdateFeed Component     │
├─────────────────────────────────┤
│ useEffect → Fetch updates       │
│ GET /app/api/status-updates?    │
│     vendorId=...                │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  API Handler (GET)              │
├─────────────────────────────────┤
│ 1. Fetch vendor_status_updates  │
│    for this vendor              │
│                                 │
│ 2. Get all update IDs           │
│                                 │
│ 3. Fetch ALL StatusUpdateImage  │
│    records matching those IDs   │
│                                 │
│ 4. Group images by update       │
│                                 │
│ 5. Transform snake_case → camelCase
│    (database → API format)      │
│                                 │
│ 6. Return array with images     │
│    attached to each update      │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  Response with Images           │
├─────────────────────────────────┤
│ [                               │
│   {                             │
│     id: "update-1",             │
│     vendor_id: "...",           │
│     content: "...",             │
│     likes_count: 5,             │
│     created_at: "...",          │
│     images: [                   │
│       {                         │
│         imageUrl: "s3://..." ◄──┼─ From DB!
│       },                        │
│       {                         │
│         imageUrl: "s3://..."    │
│       },                        │
│       {                         │
│         imageUrl: "s3://..."    │
│       }                         │
│     ]                           │
│   }                             │
│ ]                               │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  StatusUpdateFeed State         │
├─────────────────────────────────┤
│ setUpdates(data.updates)        │
│ setState({ loading: false })    │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  Render Each Update             │
├─────────────────────────────────┤
│ {updates.map(update => (       │
│   <StatusUpdateCard             │
│     update={update}             │
│     vendor={vendor}             │
│     ...                         │
│   />                            │
│ ))}                             │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  StatusUpdateCard Processing    │
├─────────────────────────────────┤
│ 1. Extract images array:        │
│    update.images = [            │
│      { imageUrl: "s3://..." },  │
│      { imageUrl: "s3://..." },  │
│      { imageUrl: "s3://..." }   │
│    ]                            │
│                                 │
│ 2. Create imageUrls array:      │
│    const imageUrls =            │
│      images.map(img =>          │
│        img.imageUrl             │
│      )                          │
│                                 │
│ 3. State management:            │
│    currentImageIndex = 0        │
│    currentImage = imageUrls[0]  │
│                                 │
│ 4. Render carousel with image   │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  User Interacts with Carousel   │
├─────────────────────────────────┤
│ Click ◀ Previous Button         │
│ → setCurrentImageIndex(prev - 1)│
│ → Update component              │
│ → Display image[1]              │
│                                 │
│ Click Thumbnail[2]              │
│ → setCurrentImageIndex(2)       │
│ → Update component              │
│ → Display image[2]              │
│                                 │
│ Click ▶ Next Button             │
│ → setCurrentImageIndex(next + 1)│
│ → Update component              │
│ → Display image[3]              │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  User Refreshes Page            │
├─────────────────────────────────┤
│ GET /api/status-updates again   │
│ Database query runs again       │
│ Images fetched again            │
│ Carousel still shows! ✓         │
│ (Images persisted in DB)        │
└─────────────────────────────────┘
```

---

## 🗄️ Database Architecture

### Table Structure
```
┌──────────────────────────────────┐
│   vendor_status_updates          │ (Existing)
├──────────────────────────────────┤
│ id (UUID) ...................... │ ← Primary Key
│ vendor_id (UUID) ............... │ ← Foreign Key
│ content (TEXT) ................. │ ← Update text
│ likes_count (INT) .............. │ ← Like counter
│ comments_count (INT) ........... │ ← Comment counter
│ created_at (TIMESTAMP) ......... │ ← When created
│ updated_at (TIMESTAMP) ......... │ ← When updated
└──────────────────────────────────┘
          ▲
          │ 1 (one update)
          │
          │
          │ Many (multiple images)
          │ ▼
┌──────────────────────────────────┐
│    StatusUpdateImage             │ (New - Create!)
├──────────────────────────────────┤
│ id (TEXT) ...................... │ ← Primary Key
│ statusupdateid (UUID) .......... │ ← Foreign Key ↑
│ imageurl (TEXT) ................ │ ← S3 URL
│ imagetype (TEXT) ............... │ ← 'status', 'offer', etc
│ caption (TEXT, nullable) ....... │ ← Image description
│ displayorder (INT) ............. │ ← Order in carousel (0,1,2...)
│ uploadedat (TIMESTAMP) ......... │ ← Upload timestamp
└──────────────────────────────────┘

Indexes:
┌─────────────────────────────────────────┐
│ idx_statusupdate_statusupdateid        │
│ → Fast queries: "Get all images for    │
│   update X" (used in every API call)   │
├─────────────────────────────────────────┤
│ idx_statusupdate_displayorder          │
│ → Sort images by order (carousel flow) │
└─────────────────────────────────────────┘

RLS Policy:
┌─────────────────────────────────────────┐
│ Allow all operations (public)           │
│ (can be restricted later for security) │
└─────────────────────────────────────────┘
```

### Example Data
```
vendor_status_updates:
┌─────┬──────────┬──────────────────┬─────┬──────────────┐
│ id  │vendor_id │ content          │ ... │ created_at   │
├─────┼──────────┼──────────────────┼─────┼──────────────┤
│u001 │v123      │"Great launch!"   │ ... │2025-01-11... │
│u002 │v456      │"New offer"       │ ... │2025-01-11... │
└─────┴──────────┴──────────────────┴─────┴──────────────┘

StatusUpdateImage:
┌─────┬──────────────┬──────────────────┬──────────┬────────────┐
│ id  │statusupdateid│ imageurl         │ display  │ imagetype  │
├─────┼──────────────┼──────────────────┼──────────┼────────────┤
│i001 │ u001         │s3://...photo1.jpg│ 0        │ status     │
│i002 │ u001         │s3://...photo2.jpg│ 1        │ status     │
│i003 │ u001         │s3://...photo3.jpg│ 2        │ status     │
│i004 │ u002         │s3://...offer.jpg │ 0        │ offer      │
└─────┴──────────────┴──────────────────┴──────────┴────────────┘

When get update u001, query returns:
{
  id: "u001",
  content: "Great launch!",
  images: [
    { imageUrl: "s3://...photo1.jpg", displayorder: 0 },
    { imageUrl: "s3://...photo2.jpg", displayorder: 1 },
    { imageUrl: "s3://...photo3.jpg", displayorder: 2 }
  ]
}
```

---

## 🔄 Component Hierarchy

```
app/vendor-profile/[id]/page.js (Main Page)
│
├─ StatusUpdateModal (Post creation)
│  └─ Textarea for text
│  └─ Image upload input
│  └─ Compression (Canvas)
│  └─ Presigned URL request
│  └─ S3 direct upload
│  └─ API call to save metadata
│
└─ StatusUpdateFeed (List of updates)
   │
   └─ Loop: .map(update => (
      └─ StatusUpdateCard (Individual update)
         │
         ├─ Header section
         │  ├─ Vendor logo
         │  ├─ Vendor name
         │  ├─ Timestamp
         │  └─ More menu (delete)
         │
         ├─ Content section
         │  └─ Update text
         │
         ├─ Image Gallery section
         │  ├─ Main image display
         │  │  ├─ Prev button (◀)
         │  │  ├─ Image (s3://...)
         │  │  ├─ Next button (▶)
         │  │  └─ Counter badge
         │  │
         │  └─ Thumbnail strip
         │     ├─ Thumb 1 (click to jump)
         │     ├─ Thumb 2 (click to jump)
         │     └─ Thumb 3 (click to jump)
         │
         ├─ Stats section
         │  ├─ Likes count
         │  └─ Comments count
         │
         └─ Actions section
            ├─ Like button
            ├─ Comment button
            └─ Share button
   ))
```

---

## 🔀 State Management (React Hooks)

```
StatusUpdateCard Component State:

const [liked, setLiked] = useState(false);
    ↓
    When user clicks Like button
    ↓
    setLiked(true) → Button turns red
    → Heart icon filled
    → likes_count increases
    → Persists on refresh (in DB)

const [currentImageIndex, setCurrentImageIndex] = useState(0);
    ↓
    When user clicks ◀ or ▶
    ↓
    setCurrentImageIndex(newIndex)
    → Re-renders component
    → Shows different image
    → Updates counter (1/3 → 2/3)
    → NOT persisted (just UI state)

const [showComments, setShowComments] = useState(false);
    ↓
    When user clicks "Comments" stat
    ↓
    setShowComments(!showComments)
    → Shows/hides comment section
    → Coming soon feature

StatusUpdateFeed Component State:

const [updates, setUpdates] = useState([]);
    ↓
    useEffect → fetch /api/status-updates
    ↓
    setUpdates(fetchedUpdates)
    → Renders all StatusUpdateCards
    → Each with its own carousel state

const [loading, setLoading] = useState(true);
    ↓
    While fetching from API
    ↓
    setLoading(false) when done
    → Shows/hides loading spinner

const [error, setError] = useState(null);
    ↓
    If API call fails
    ↓
    setError(error) 
    → Shows error message
    → User can retry
```

---

## 📈 Performance Optimization

### Browser Upload
```
Image Compression (Client-Side):
┌──────────────────┐
│ Original Image   │
│ 5000x4000 px     │
│ 2.5 MB           │
├──────────────────┤
│ Canvas compress: │
│ • Max 1920x1440  │
│ • 85% JPEG       │
├──────────────────┤
│ Compressed       │
│ 1920x1440 px     │
│ 250 KB (10x!)    │
├──────────────────┤
│ Direct to S3     │
│ (browser upload) │
│ Server never     │
│ handles image!   │
└──────────────────┘

Benefits:
✓ Faster upload (10x smaller)
✓ Less S3 bandwidth cost
✓ Faster server response
✓ Better mobile experience
✓ Automatic optimization
```

### Sequential Upload
```
Instead of parallel (slow):
[Image 1] → S3 ┐
[Image 2] → S3 ├─ All at once = timeout
[Image 3] → S3 │
[Image 4] → S3 ┘

Do sequential (reliable):
[Image 1] → S3 ✓ Done
     ↓
[Image 2] → S3 ✓ Done
     ↓
[Image 3] → S3 ✓ Done
     ↓
[Image 4] → S3 ✓ Done

Benefits:
✓ No timeouts
✓ Reliable on slow connections
✓ Clear progress tracking
✓ Easier error recovery
```

### Database Queries
```
Optimized Fetch (One Request):
┌──────────────────────────────┐
│ GET /api/status-updates?     │
│ vendorId=v123                │
├──────────────────────────────┤
│ 1. SELECT FROM               │
│    vendor_status_updates     │
│    WHERE vendor_id = v123    │
│    ORDER BY created_at DESC  │
│                              │
│ 2. Get list of update IDs    │
│    [u001, u002, u003]        │
│                              │
│ 3. SELECT FROM               │
│    StatusUpdateImage         │
│    WHERE statusupdateid      │
│    IN (u001, u002, u003)     │
│    ORDER BY displayorder     │
│                              │
│ 4. Group images by update    │
│                              │
│ 5. Return: {                 │
│      updates: [              │
│        {u001, images: [...]},│
│        {u002, images: [...]},│
│        {u003, images: [...]} │
│      ]                       │
│    }                         │
└──────────────────────────────┘

Indexes speed up queries:
┌──────────────────────────────┐
│ idx_statusupdate_           │
│ _statusupdateid             │
│                              │
│ Find all images for one     │
│ update: O(log n) ✓           │
└──────────────────────────────┘
```

---

## 🔐 Security

### Image Upload
```
Presigned URLs Prevent:
┌────────────────────────────────────┐
│ ✓ Unauthorized uploads to S3      │
│ ✓ Direct S3 access from frontend  │
│ ✓ Bucket configuration exposure   │
│                                    │
│ How it works:                      │
│ 1. Server generates presigned URL │
│    (valid for 15 minutes only)     │
│ 2. Frontend uses URL to upload     │
│ 3. URL expires (can't reuse)       │
│ 4. Credentials never in browser    │
└────────────────────────────────────┘
```

### Database Access
```
RLS Policies Prevent:
┌────────────────────────────────────┐
│ ✓ Unauthorized data access        │
│ ✓ Data leaks across vendors       │
│ ✓ Modification of others' data    │
│                                    │
│ Current: Permissive               │
│ (can be made restrictive later)    │
│                                    │
│ Future: Row-based access control  │
│ SELECT: Only own vendor's updates │
│ INSERT: Only if vendor_id matches │
│ DELETE: Only if owner             │
└────────────────────────────────────┘
```

---

## ✅ Complete Feature Checklist

- [x] Image carousel navigation
- [x] Thumbnail strip selection
- [x] Image counter display
- [x] Responsive design
- [x] Mobile friendly buttons
- [x] Error handling (broken images)
- [x] Smooth transitions
- [x] Professional styling
- [x] Vendor branding (logo, name)
- [x] Timestamp formatting
- [x] Like functionality
- [x] Comment UI (placeholder)
- [x] Share UI (placeholder)
- [x] Delete functionality
- [x] S3 integration
- [x] Image compression
- [x] Sequential uploads
- [x] Database persistence
- [x] API endpoints
- [x] Error recovery
- [ ] Database table creation (user action needed)

---

**That's the complete architecture! Just create the database table and you're done. 🚀**
