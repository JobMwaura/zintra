# API Architecture Consistency - Portfolio & Status Updates

## Overview
Both Portfolio and Status Updates features follow the same API architecture pattern for consistency and maintainability.

## Architecture Pattern

### Directory Structure

```
pages/api/
├── portfolio/
│   └── upload-image.js          ← Presigned URL generation (Pages Router)
└── status-updates/
    └── upload-image.js          ← Presigned URL generation (Pages Router)

app/api/
├── portfolio/
│   ├── projects/
│   │   ├── route.js             ← POST (create) & GET (fetch) projects
│   │   └── [id]/route.js        ← DELETE (remove) project
│   └── images/
│       └── route.js             ← POST (save image metadata)
└── status-updates/
    └── route.js                 ← POST (create) & GET (fetch) updates
```

## API Endpoints Comparison

### Portfolio Feature
| Operation | Endpoint | Router | HTTP | File |
|-----------|----------|--------|------|------|
| Get presigned URL | `/api/portfolio/upload-image` | Pages | POST | `pages/api/portfolio/upload-image.js` |
| Create project | `/api/portfolio/projects` | App | POST | `app/api/portfolio/projects/route.js` |
| Get projects | `/api/portfolio/projects?vendorId=...` | App | GET | `app/api/portfolio/projects/route.js` |
| Save image metadata | `/api/portfolio/images` | App | POST | `app/api/portfolio/images/route.js` |
| Delete project | `/api/portfolio/projects/:id` | App | DELETE | `app/api/portfolio/projects/[id]/route.js` |

### Status Updates Feature
| Operation | Endpoint | Router | HTTP | File |
|-----------|----------|--------|------|------|
| Get presigned URL | `/api/status-updates/upload-image` | Pages | POST | `pages/api/status-updates/upload-image.js` |
| Create update | `/api/status-updates` | App | POST | `app/api/status-updates/route.js` |
| Get updates | `/api/status-updates?vendorId=...` | App | GET | `app/api/status-updates/route.js` |
| Save image metadata | (Integrated in POST) | App | POST | `app/api/status-updates/route.js` |

## Why This Pattern?

### Pages Router for Presigned URLs
- **Simple handlers**: Don't need full request/response cycle of App Router
- **Direct auth token handling**: Easier to extract Bearer token
- **S3 integration**: Direct presigned URL generation without middleware overhead
- **Consistency**: Matches portfolio pattern exactly
- **No `await params`**: Pages Router doesn't require awaiting params like App Router 16.x

### App Router for CRUD Operations
- **Modern approach**: Cleaner syntax with native NextResponse
- **Database operations**: Better for complex Supabase queries
- **Type safety**: Full TypeScript support
- **Middleware-friendly**: Can add auth middleware if needed
- **Dynamic routes**: Cleaner [id] syntax vs :id

## Data Flow Comparison

### Portfolio Feature Flow
```
AddProjectModal.js
  ↓ (1) Get presigned URL
  POST /pages/api/portfolio/upload-image
  ↓ (2) Upload to S3 directly
  S3 Bucket
  ↓ (3) Create project record
  POST /app/api/portfolio/projects
  ↓ (4) Save image metadata
  POST /app/api/portfolio/images (sequential for each image)
  ↓ (5) Fetch projects with images
  GET /app/api/portfolio/projects?vendorId=...
  ↓ Display in PortfolioProjectCard
```

### Status Updates Feature Flow
```
StatusUpdateModal.js
  ↓ (1) Get presigned URL
  POST /pages/api/status-updates/upload-image
  ↓ (2) Upload to S3 directly
  S3 Bucket
  ↓ (3) Create update + save images
  POST /app/api/status-updates (includes image metadata saving)
  ↓ (4) Fetch updates with images
  GET /app/api/status-updates?vendorId=...
  ↓ Display in feed
```

## Key Differences

| Aspect | Portfolio | Status Updates |
|--------|-----------|-----------------|
| Image table separation | Separate `PortfolioImages` table + `images/route.js` | Integrated in `route.js` POST |
| Image types | before/during/after | status/offer/achievement |
| Content structure | Full project metadata (title, budget, location, etc.) | Simple text content |
| Gallery display | Carousel with thumbnails | Grid/inline display |
| Image count | Multiple (required) | Up to 5 |

## Database Table Mapping

### Portfolio
- **vendors** (parent)
  - PortfolioProject (projects)
    - PortfolioProjectImage (images)

### Status Updates
- **vendors** (parent)
  - vendor_status_updates (updates)
    - StatusUpdateImage (images)

## Code Duplication Analysis

### Presigned URL Generation
✅ **IDENTICAL** - Both use:
```javascript
generatePresignedUrl(fileName, contentType, {}, keyPrefix, true)
```

### Image Compression
✅ **IDENTICAL** - Both use:
- Canvas-based compression
- Max 1920x1440
- 85% JPEG quality
- Sequential uploads (not parallel)

### Data Transformation
✅ **IDENTICAL** - Both transform:
```javascript
// Database (lowercase)
imageurl, imagetype, displayorder, uploadedat

// Frontend (camelCase)
imageUrl, imageType, displayOrder, uploadedAt
```

### API Response Structure
✅ **SIMILAR** - Both return:
```json
{
  "id": "uuid",
  "images": [
    {
      "id": "uuid",
      "imageUrl": "s3://...",
      "imageType": "type",
      "displayOrder": 0,
      "uploadedAt": "ISO timestamp"
    }
  ]
}
```

## Consistency Checklist

- ✅ Presigned URL generation in Pages Router (`/pages/api/...`)
- ✅ CRUD operations in App Router (`/app/api/.../route.js`)
- ✅ S3 path prefix organization (`vendor-profiles/{feature}/`)
- ✅ Image compression pipeline identical
- ✅ Sequential uploads (not parallel)
- ✅ camelCase transformation in API responses
- ✅ Separate image tables for scalability
- ✅ RLS policies on image tables
- ✅ Cascade delete on parent deletion
- ✅ Same error handling patterns
- ✅ Same logging patterns (✅, ❌, 📝 emojis)

## Future Consistency

When implementing other image-heavy features (e.g., "Testimonials", "Before & After", "Gallery"), follow this pattern:

1. **Presigned URLs** → `/pages/api/{feature}/upload-image.js`
2. **Create/Read** → `/app/api/{feature}/route.js`
3. **Image metadata** → `{Feature}Image` table (separate)
4. **Transform to camelCase** in API response
5. **Sequential uploads** from component
6. **Compress images** before uploading

## Benefits of This Consistency

1. **Predictability**: Developers know exactly where to find code
2. **Less context switching**: Same patterns across features
3. **Easier debugging**: Standard error handling and logging
4. **Reusability**: Code from portfolio can be adapted for other features
5. **Scalability**: New team members can onboard quickly
6. **Maintainability**: Bug fixes in one place benefit all features
7. **Testing**: Same test patterns for all image features

## Files Involved

### Portfolio
- `pages/api/portfolio/upload-image.js` - Presigned URLs
- `app/api/portfolio/projects/route.js` - CRUD projects
- `app/api/portfolio/projects/[id]/route.js` - Delete
- `app/api/portfolio/images/route.js` - Image metadata
- `components/vendor-profile/AddProjectModal.js` - UI
- `components/vendor-profile/PortfolioProjectCard.js` - Display

### Status Updates
- `pages/api/status-updates/upload-image.js` - Presigned URLs
- `app/api/status-updates/route.js` - CRUD + images
- `components/vendor-profile/StatusUpdateModal.js` - UI
- `supabase/sql/STATUS_UPDATE_IMAGES_TABLE.sql` - Database

### Shared Utilities
- `lib/aws-s3.js` - S3 helper functions
- `lib/supabaseClient.js` - Supabase client
