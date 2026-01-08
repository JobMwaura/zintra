# Portfolio System Phase 2: AddProjectModal & API Endpoints

**Date:** 8 January 2026  
**Status:** ✅ COMPLETE  
**Components Created:** 3 (AddProjectModal, 2 API endpoints)

---

## What's New

### 1. ✅ AddProjectModal Component
**File:** `/components/vendor-profile/AddProjectModal.js` (520 lines)

**6-Step Wizard Flow:**
1. **Project Title** - Text input (max 100 chars), validates before proceeding
2. **Service Category** - Grid selector with 10 category options + emojis
3. **Project Description** - Textarea (max 500 chars) for "what we did"
4. **Photo Upload** - Multi-file drag & drop upload
   - Max 12 photos
   - Support before/during/after type tagging
   - Optional captions (max 100 chars per photo)
   - Real-time Supabase upload to `portfolio-images` bucket
   - Delete individual photos
   - Upload progress indicators
5. **Optional Details** - Budget, timeline, location
   - Budget min/max (KES)
   - Timeline description
   - Location description
6. **Review & Publish** - Summary review with publish toggle
   - Toggle between Draft/Published status
   - Shows project summary
   - Submit button creates project + images

**Key Features:**
- ✅ Step indicators with progress bar
- ✅ Back/Next navigation
- ✅ Form validation at each step
- ✅ Loading states & error handling
- ✅ Photo type selector (Before/During/After with emojis)
- ✅ Photo captions
- ✅ Responsive design (mobile-friendly)
- ✅ Integrates with Supabase storage

**Props:**
```javascript
<AddProjectModal
  vendorId={vendorId}                    // UUID of vendor
  vendorPrimaryCategory={categorySlug}   // Pre-fill category
  isOpen={true}                          // Show/hide modal
  onClose={() => {}}                     // Called when modal closes
  onSuccess={(project) => {}}            // Called when project created
/>
```

**Usage Flow:**
1. User clicks "+ Add Project" button
2. Modal opens with Step 1 (Title)
3. User fills each step (validates before next)
4. Step 4 uploads photos to Supabase in real-time
5. Step 6 shows summary and publish option
6. Click "Publish Project" sends API request
7. Modal closes on success, `onSuccess` callback fires

---

### 2. ✅ API Endpoint: POST /api/portfolio/projects
**File:** `/app/api/portfolio/projects/route.js`

**Purpose:** Create a new portfolio project

**Request Body:**
```json
{
  "vendorId": "uuid",              // Required: Vendor UUID
  "title": "string",               // Required: Project title
  "categorySlug": "string",        // Required: Category slug
  "description": "string",         // Required: Project description
  "status": "published|draft",     // Required: Publication status
  "budgetMin": 300000,            // Optional: Minimum budget
  "budgetMax": 600000,            // Optional: Maximum budget
  "timeline": "6 months",          // Optional: Timeline description
  "location": "Nairobi",           // Optional: Project location
  "completionDate": "2024-10-15"  // Optional: Date completed
}
```

**Response (201 Created):**
```json
{
  "message": "Project created successfully",
  "project": {
    "id": "uuid",
    "vendorProfileId": "uuid",
    "title": "3-Bedroom Bungalow",
    "description": "...",
    "categorySlug": "building-and-masonry",
    "status": "published",
    "budgetMin": 300000,
    "budgetMax": 600000,
    "timeline": "6 months",
    "location": "Nairobi",
    "completionDate": "2024-10-15T00:00:00Z",
    "viewCount": 0,
    "quoteRequestCount": 0,
    "createdAt": "2026-01-08T...",
    "updatedAt": "2026-01-08T..."
  }
}
```

**Validation:**
- ✅ Checks all required fields present
- ✅ Verifies vendor exists
- ✅ Converts budget strings to integers
- ✅ Trims whitespace from text fields

**Error Responses:**
- 400: Missing required fields
- 404: Vendor not found
- 500: Server error

---

### 3. ✅ API Endpoint: GET /api/portfolio/projects
**File:** `/app/api/portfolio/projects/route.js`

**Purpose:** Fetch published portfolio projects for a vendor

**Query Parameters:**
```
GET /api/portfolio/projects?vendorId=uuid
```

**Response (200 OK):**
```json
{
  "projects": [
    {
      "id": "uuid",
      "vendorProfileId": "uuid",
      "title": "3-Bedroom Bungalow",
      "description": "...",
      "categorySlug": "building-and-masonry",
      "status": "published",
      "budgetMin": 300000,
      "budgetMax": 600000,
      "viewCount": 15,
      "quoteRequestCount": 2,
      "images": [
        {
          "id": "uuid",
          "imageUrl": "https://...",
          "imageType": "before",
          "caption": "Original site",
          "displayOrder": 0
        },
        {
          "id": "uuid",
          "imageUrl": "https://...",
          "imageType": "after",
          "caption": "Completed project",
          "displayOrder": 1
        }
      ]
    }
  ]
}
```

**Features:**
- ✅ Returns only published projects
- ✅ Includes all related images
- ✅ Images sorted by displayOrder
- ✅ Ordered by newest first

---

### 4. ✅ API Endpoint: POST /api/portfolio/images
**File:** `/app/api/portfolio/images/route.js`

**Purpose:** Create portfolio project image(s)

**Request Body:**
```json
{
  "projectId": "uuid",           // Required: Project UUID
  "imageUrl": "https://...",     // Required: Image URL (from Supabase)
  "imageType": "before|during|after",  // Required: Photo type
  "caption": "Before renovation", // Optional: Image caption
  "displayOrder": 0              // Required: Display order (0-based)
}
```

**Response (201 Created):**
```json
{
  "message": "Image created successfully",
  "image": {
    "id": "uuid",
    "portfolioProjectId": "uuid",
    "imageUrl": "https://...",
    "imageType": "before",
    "caption": "Before renovation",
    "displayOrder": 0,
    "uploadedAt": "2026-01-08T..."
  }
}
```

**Validation:**
- ✅ Validates all required fields
- ✅ Ensures imageType is before/during/after
- ✅ Verifies project exists
- ✅ Supports optional captions

**Error Responses:**
- 400: Missing fields or invalid imageType
- 404: Project not found
- 500: Server error

---

## Supabase Storage Setup Required

**Important:** The AddProjectModal uses Supabase Storage bucket `portfolio-images`.

### You need to create this bucket:

1. **Go to Supabase Dashboard**
2. **Navigate to Storage → Buckets**
3. **Create new bucket with:**
   - Name: `portfolio-images`
   - Public: **Yes** (so images are accessible via public URL)
   - File size limit: ~50MB per file recommended

4. **Optional: Set RLS Policies** (for security)
   ```sql
   -- Allow anyone to read/download images
   CREATE POLICY "Public read access"
   ON storage.objects
   FOR SELECT
   USING (bucket_id = 'portfolio-images');
   
   -- Allow authenticated vendors to upload
   CREATE POLICY "Vendor upload"
   ON storage.objects
   FOR INSERT
   WITH CHECK (
     bucket_id = 'portfolio-images' 
     AND auth.uid() IS NOT NULL
   );
   ```

---

## Integration Points

**Component Props:**
```javascript
// In vendor profile page or portfolio tab:
const [showAddModal, setShowAddModal] = useState(false);

<AddProjectModal
  vendorId={vendor.id}
  vendorPrimaryCategory={vendor.primaryCategory}
  isOpen={showAddModal}
  onClose={() => setShowAddModal(false)}
  onSuccess={(newProject) => {
    // Refresh portfolio projects list
    fetchProjects();
  }}
/>

// Button to trigger modal:
<button onClick={() => setShowAddModal(true)}>
  + Add Project
</button>
```

---

## How It All Works Together

### Adding a Project Flow:

```
User clicks "+ Add Project"
    ↓
AddProjectModal opens (Step 1)
    ↓
User enters title → clicks Next (Step 2)
    ↓
User selects category → clicks Next (Step 3)
    ↓
User enters description → clicks Next (Step 4)
    ↓
User uploads photos
    ↓ (AddProjectModal calls Supabase API)
Photos upload to `portfolio-images` bucket
    ↓
Photos display with type selectors
    ↓
User adds captions → clicks Next (Step 5)
    ↓
User fills optional details → clicks Next (Step 6)
    ↓
User reviews summary and publish toggle
    ↓
User clicks "Publish Project"
    ↓ (AddProjectModal calls POST /api/portfolio/projects)
API creates PortfolioProject in database
    ↓ (AddProjectModal calls POST /api/portfolio/images for each photo)
API creates PortfolioProjectImage entries for each photo
    ↓
Modal closes, onSuccess callback fires
    ↓
Portfolio projects refresh to show new project
```

---

## What's Ready

✅ **AddProjectModal** - Complete 6-step wizard  
✅ **Photo Upload** - Drag & drop to Supabase  
✅ **API Endpoints** - POST /api/portfolio/projects (create)  
✅ **API Endpoints** - GET /api/portfolio/projects (list)  
✅ **API Endpoints** - POST /api/portfolio/images (create)  
✅ **Form Validation** - Step-by-step validation  
✅ **Error Handling** - User-friendly error messages  

---

## What's Next (Phase 3)

- [ ] ProjectDetailModal (view project with photo toggle)
- [ ] RequestQuoteFromProject modal
- [ ] Update Portfolio tab integration
- [ ] Add edit & delete project endpoints
- [ ] Add sharing functionality
- [ ] Test all flows end-to-end

---

## Testing the Modal

### Manually:

1. Import AddProjectModal in your vendor profile page
2. Add state for `showAddModal`
3. Render modal with vendorId and callbacks
4. Click to open, fill in test data
5. Watch network tab as photos upload
6. Verify project appears in database

### Automated (Next Phase):

- Unit tests for form validation
- Integration tests for API endpoints
- E2E tests for full workflow

---

## Code Statistics

- **AddProjectModal.js** - 520 lines (fully functional component)
- **POST /api/portfolio/projects** - 60 lines (create project)
- **GET /api/portfolio/projects** - 30 lines (fetch projects)
- **POST /api/portfolio/images** - 55 lines (create image)

**Total:** ~665 lines of new code

---

## Next Deployment Steps

### When ready to deploy:

1. **Ensure Supabase bucket exists** (`portfolio-images`)
2. **Run Prisma migration** (already created in Phase 1)
   ```bash
   npx prisma migrate deploy
   ```
3. **Commit Phase 2 changes**
   ```bash
   git add -A
   git commit -m "feat: AddProjectModal & portfolio API endpoints (Phase 2)"
   git push origin main
   ```
4. **Deploy to Vercel** - Automatic deployment triggered by push
5. **Test in production** - Try full flow with real images

---

## Summary

**Phase 2 Complete! ✅**

Vendors can now:
- ✅ Open the AddProjectModal
- ✅ Fill in project details step-by-step
- ✅ Upload before/during/after photos
- ✅ Tag photos with type and add captions
- ✅ Add optional budget/timeline/location
- ✅ Save as draft or publish immediately
- ✅ See their project created in database with images

Next: Build ProjectDetailModal to view and share projects!
