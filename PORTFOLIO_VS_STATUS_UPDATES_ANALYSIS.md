# Portfolio vs Status Updates - Database Architecture Issues

## Current Status (Jan 11, 2026)

### ✅ Status Updates - FIXED
- Tables created fresh: `vendor_status_updates`, `vendor_status_update_likes`, `vendor_status_update_comments`
- RLS policies enabled and working
- API ready: `/api/status-updates` POST/GET
- Feature: Business updates carousel with images

### ❌ Portfolio Projects - NEEDS FIXING
- Tables referenced in API: `PortfolioProject`, `PortfolioProjectImage`
- **These tables DO NOT EXIST** in Supabase
- RPC function missing: `create_portfolio_project`
- Errors on Vercel:
  - 503: PortfolioProjectImage table not found
  - 503: create_portfolio_project RPC function not found

---

## Errors Reported

### Error 1: PortfolioProjectImage Table Not Found
```
POST /api/portfolio/images → 503
❌ PortfolioProjectImage table not found
```

**Root Cause**: File `/app/api/portfolio/images/route.js` line 139 tries to INSERT into `PortfolioProjectImage`, but the table was never created in Supabase.

**What Needs to Happen**:
1. Create `PortfolioProject` table
2. Create `PortfolioProjectImage` table
3. Set up RLS policies on both
4. Test the portfolio feature

### Error 2: create_portfolio_project RPC Function Not Found
```
POST /api/portfolio/projects → 503
RPC error: Could not find function public.create_portfolio_project(...)
```

**Root Cause**: `/app/api/portfolio/projects/route.js` tries to call an RPC function that doesn't exist.

**What Needs to Happen**:
1. Create the `create_portfolio_project` PostgreSQL function
2. Set proper parameters (p_vendor_id, p_title, p_description, etc.)
3. Grant execute permissions

---

## Why Status Updates Works But Portfolio Doesn't

### Status Updates Table Creation ✅
```sql
CREATE TABLE public.vendor_status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id),
  content text NOT NULL,
  images text[] DEFAULT ARRAY[]::text[],
  ...
);
ALTER TABLE public.vendor_status_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_all" ON public.vendor_status_updates FOR SELECT USING (true);
```
✅ **We created this fresh today** - API now works

### Portfolio Table Creation ❌
```sql
CREATE TABLE public.PortfolioProject (
  id uuid PRIMARY KEY,
  vendor_id uuid NOT NULL,
  title text NOT NULL,
  ...
);
```
❌ **This was never created** - API fails with "table not found"

---

## Database Schema Comparison

### Status Updates Architecture
```
vendor_status_updates
  ├─ id (uuid)
  ├─ vendor_id (references vendors)
  ├─ content (text)
  ├─ images (text array) ← Images stored in same row
  ├─ created_at
  └─ RLS Policy: allow all

vendor_status_update_likes
  ├─ id (uuid)
  ├─ update_id (FK)
  ├─ user_id (FK)
  └─ RLS Policy: allow all

vendor_status_update_comments
  ├─ id (uuid)
  ├─ update_id (FK)
  ├─ user_id (FK)
  ├─ content (text)
  └─ RLS Policy: allow all
```

### Portfolio Architecture (MISSING)
```
PortfolioProject
  ├─ id (uuid) ← MISSING
  ├─ vendor_id (FK) ← MISSING
  ├─ title (text) ← MISSING
  ├─ description (text) ← MISSING
  ├─ category_slug (text) ← MISSING
  ├─ timeline (text) ← MISSING
  ├─ budget_min (numeric) ← MISSING
  ├─ budget_max (numeric) ← MISSING
  ├─ completion_date (date) ← MISSING
  ├─ location (text) ← MISSING
  ├─ status (text) ← MISSING
  └─ RLS Policy: MISSING

PortfolioProjectImage
  ├─ id (text) ← MISSING
  ├─ project_id (FK) ← MISSING
  ├─ image_url (text) ← MISSING
  ├─ image_type (enum: before/during/after) ← MISSING
  ├─ display_order (int) ← MISSING
  └─ RLS Policy: MISSING

create_portfolio_project RPC Function ← MISSING
  ├─ Takes project parameters
  ├─ Creates project record
  └─ Returns created project
```

---

## What Happened

### Status Updates (Our Focus Today)
1. Tables were defined in SQL files but had RLS issues
2. We deleted and recreated them fresh with working RLS
3. API now successfully creates and fetches updates ✅

### Portfolio (Not Our Focus, But Now Broken)
1. Tables were never created in Supabase
2. API tries to use non-existent `PortfolioProject` table
3. API tries to call non-existent RPC function
4. All portfolio operations fail with 503 errors

---

## Action Items

### Immediate (For Status Updates - DONE ✅)
- [x] Create fresh tables with working RLS
- [x] Test carousel feature
- [x] Verify images persist on refresh

### Future (For Portfolio - SEPARATE TASK)
- [ ] Create `PortfolioProject` table with proper schema
- [ ] Create `PortfolioProjectImage` table with before/during/after types
- [ ] Create `create_portfolio_project` RPC function
- [ ] Set up RLS policies on portfolio tables
- [ ] Test portfolio project creation
- [ ] Test portfolio image uploads

---

## Files That Need Portfolio Tables

**API Files Expecting These Tables:**
- `/app/api/portfolio/images/route.js` - Expects `PortfolioProject` and `PortfolioProjectImage`
- `/app/api/portfolio/projects/route.js` - Expects RPC function `create_portfolio_project`
- `/pages/api/portfolio/upload-image.js` - Works fine (just generates presigned URLs)

**What's Working:**
- S3 image uploads ✅ (presigned URL generation works)
- Image compression ✅ (client-side)

**What's Broken:**
- Saving project metadata to database ❌
- Saving image metadata to database ❌
- Creating projects ❌

---

## Summary

| Feature | Tables | RLS | API | Status |
|---------|--------|-----|-----|--------|
| **Status Updates** | vendor_status_updates ✅ | Working ✅ | /api/status-updates ✅ | **WORKING** ✅ |
| **Portfolio Projects** | PortfolioProject ❌ | Missing ❌ | /api/portfolio/projects ❌ | **BROKEN** ❌ |
| **Portfolio Images** | PortfolioProjectImage ❌ | Missing ❌ | /api/portfolio/images ❌ | **BROKEN** ❌ |
| **Image Uploads (S3)** | N/A | N/A | /api/portfolio/upload-image ✅ | **WORKING** ✅ |

---

## Next Step Recommendation

Since we just fixed status updates and it's working:
1. **Test status updates feature thoroughly** (carousel, persistence, both browsers)
2. **Document what we learned** about RLS policies
3. **Schedule portfolio table creation** as a separate task
4. **Avoid mixing the two** - keep portfolio work separate from status updates

The portfolio tables need to be created fresh with proper schema, similar to how we fixed status updates today.
