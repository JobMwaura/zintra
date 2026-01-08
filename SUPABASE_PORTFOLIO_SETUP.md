# Supabase Setup Checklist for Portfolio System

**Status:** ⚠️ ACTION REQUIRED - Read carefully before deploying

---

## Critical Setup Steps

### ✅ PHASE 1: Database Schema (Already Done)

The migration file was created in Phase 1:
- File: `prisma/migrations/20260108_add_portfolio_projects/migration.sql`
- This creates tables: `PortfolioProject` and `PortfolioProjectImage`
- **Status:** Ready to apply (will happen automatically when `npx prisma migrate deploy` runs)

---

### ⚠️ PHASE 2: Create Storage Bucket (ACTION REQUIRED NOW)

The AddProjectModal uses Supabase Storage to upload photos. You need to create the bucket before deploying.

**Steps to Create Bucket:**

1. **Log into Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your `zintra` project
   - Navigate to: **Storage** → **Buckets**

2. **Create New Bucket**
   - Click: **Create a new bucket**
   - Fill in:
     - **Name:** `portfolio-images`
     - **Public bucket:** ✅ YES (Toggle ON)
     - **File size limit:** 50 MB (recommended)
   - Click: **Create bucket**

3. **Verify Bucket**
   - You should see `portfolio-images` in your buckets list
   - It should show as "Public" ✅

### Why Public?
- Images need to be served to customers via public URLs
- The component calls `getPublicUrl()` to get image URLs
- Customers browse portfolio without authentication

---

### 📝 OPTIONAL: Set Row-Level Security (RLS) Policies

For production security, you should restrict who can upload. This is optional but recommended.

**To Add RLS Policies:**

1. **Go to Storage → Policies** in Supabase
2. **Click "New Policy" for `portfolio-images` bucket**

**Policy 1: Allow public read access**
```sql
-- Policy name: "Public read access"
-- Allowed operation: SELECT (Read)
-- Using expression:
bucket_id = 'portfolio-images'
```

**Policy 2: Allow authenticated vendors to upload**
```sql
-- Policy name: "Vendor upload"
-- Allowed operation: INSERT (Upload)
-- With check expression:
(bucket_id = 'portfolio-images' AND auth.uid() IS NOT NULL)
```

**Policy 3: Allow vendors to delete their own uploads** (optional)
```sql
-- Policy name: "Vendor delete"
-- Allowed operation: DELETE
-- Using expression:
(bucket_id = 'portfolio-images' AND auth.uid() IS NOT NULL)
```

---

## Verification Checklist

Before deploying, verify:

```
Supabase Setup:
- [ ] Storage bucket "portfolio-images" created
- [ ] Bucket is set to Public
- [ ] (Optional) RLS policies configured

Database Migration:
- [ ] Migration file exists: prisma/migrations/20260108_add_portfolio_projects/migration.sql
- [ ] Can see PortfolioProject table in Supabase
- [ ] Can see PortfolioProjectImage table in Supabase

Code:
- [ ] AddProjectModal.js exists in components/vendor-profile/
- [ ] API endpoints exist: /api/portfolio/projects and /api/portfolio/images
- [ ] Both endpoints reference correct table names
- [ ] Supabase client is initialized properly in lib/supabaseClient.js

Environment:
- [ ] NEXT_PUBLIC_SUPABASE_URL is set in .env.local
- [ ] SUPABASE_SERVICE_ROLE_KEY is set in .env.local (for API)
- [ ] (Vercel) Both env vars are set in production
```

---

## Deployment Sequence

### Step 1: Create Storage Bucket (BEFORE deploying)
```
1. Go to Supabase Dashboard
2. Create "portfolio-images" bucket (Public)
3. (Optional) Add RLS policies
4. Verify bucket exists and is accessible
```

### Step 2: Apply Database Migration
```bash
cd /Users/macbookpro2/Desktop/zintra-platform
npx prisma migrate deploy
```
Output should show:
```
✔ Applied migration(s) 20250108_add_portfolio_projects
```

### Step 3: Deploy Code to Vercel
```bash
git push origin main
# Vercel auto-deploys on push
```

### Step 4: Verify in Production
1. Go to your app URL
2. Try AddProjectModal
3. Upload a test image
4. Verify image uploads successfully
5. Verify project appears in database

---

## What Happens When Users Upload

### When AddProjectModal is used:

1. **User selects photos**
   - Component validates file types & sizes

2. **Photos upload to Supabase**
   ```javascript
   supabase.storage
     .from('portfolio-images')
     .upload(`${vendorId}/${filename}`, file)
   ```

3. **Component gets public URL**
   ```javascript
   supabase.storage
     .from('portfolio-images')
     .getPublicUrl(`${vendorId}/${filename}`)
   // Returns: https://your-supabase.com/storage/v1/object/public/portfolio-images/...
   ```

4. **URL is saved to database**
   ```javascript
   await fetch('/api/portfolio/images', {
     imageUrl: publicUrl,  // Saved to DB
     imageType: 'after',
     ...
   })
   ```

5. **Images are displayed to customers**
   - PortfolioProjectCard shows the image
   - ProjectDetailModal shows before/during/after toggle

---

## File Organization

```
Supabase Storage (portfolio-images bucket):
├── vendor-uuid-1/
│   ├── 1704702000000-abc123-kitchen-before.jpg
│   ├── 1704702005000-def456-kitchen-during.jpg
│   └── 1704702010000-ghi789-kitchen-after.jpg
├── vendor-uuid-2/
│   ├── 1704702015000-jkl012-renovation-before.jpg
│   └── 1704702020000-mno345-renovation-after.jpg
└── ...
```

Each vendor's photos are organized in their own folder for clarity.

---

## Troubleshooting

### If photos don't upload:
1. **Check bucket exists** - Go to Supabase → Storage
2. **Check bucket is Public** - Public toggle should be ON
3. **Check environment variables** - `NEXT_PUBLIC_SUPABASE_URL` set?
4. **Check browser console** - Any error messages?
5. **Check network tab** - Does upload request succeed?

### If images don't display:
1. **Check image URL is correct** - Visit URL directly in browser
2. **Check RLS policies** - If configured, ensure SELECT is allowed
3. **Check database** - Verify imageUrl is saved in portfolio_project_images table

### If API endpoints fail:
1. **Check database tables exist** - Run migration
2. **Check Prisma models** - Verify PortfolioProject and PortfolioProjectImage exist
3. **Check API code** - Verify /api/portfolio/ endpoints exist and have correct logic

---

## Environment Variables

Ensure these are set:

```env
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Also needed for AddProjectModal photo uploads:
# (Already used in StatusUpdateModal, so should be configured)
```

---

## Summary

**Before Deploying Phase 2:**

1. ✅ **Code is ready** - AddProjectModal & API endpoints written
2. ⚠️ **Storage bucket missing** - Create `portfolio-images` in Supabase NOW
3. ✅ **Migration ready** - Database schema waiting to be applied
4. ⚠️ **Production env vars** - Ensure Vercel has Supabase credentials

**Quick Action Items:**

```
IMMEDIATE (DO THIS NOW):
[ ] Create storage bucket "portfolio-images" in Supabase (Public)
[ ] (Optional) Configure RLS policies

AFTER THAT:
[ ] Run: npx prisma migrate deploy
[ ] Push to GitHub (already done: commit 48b6664)
[ ] Vercel auto-deploys
[ ] Test in production

IF ISSUES:
[ ] Check Supabase bucket exists and is Public
[ ] Verify environment variables in Vercel
[ ] Check database migration applied
[ ] Review browser console for errors
```

---

## Next Steps

Once Supabase is set up:

1. **Test AddProjectModal locally**
   ```bash
   cd your-project
   npm run dev
   # Try uploading images
   ```

2. **Test in production**
   - Go to your Vercel URL
   - Test upload with real images
   - Verify images appear in Supabase Storage

3. **Build Phase 3**
   - ProjectDetailModal (view projects)
   - RequestQuoteFromProject modal
   - Full integration

---

**Need Help?**

Check these files:
- `PORTFOLIO_SYSTEM_ARCHITECTURE.md` - System overview
- `PORTFOLIO_PHASE_2_COMPLETE.md` - Component details
- `components/vendor-profile/AddProjectModal.js` - Component code
- `app/api/portfolio/` - API endpoint code
