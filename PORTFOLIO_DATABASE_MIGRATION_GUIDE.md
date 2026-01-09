# Portfolio Feature Database Migration - Manual Deployment

**Status:** 🔴 PENDING - Requires manual SQL execution in Supabase console  
**Date:** January 9, 2026

## Overview

The portfolio feature requires two new database tables to be created:
- `PortfolioProject` - Main portfolio project data
- `PortfolioProjectImage` - Project images with before/during/after classification

## Tables to Create

### 1. PortfolioProject Table

Stores portfolio project information for vendors:

```sql
CREATE TABLE "PortfolioProject" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categorySlug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "completionDate" TIMESTAMP(3),
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "location" TEXT,
    "timeline" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "quoteRequestCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioProject_pkey" PRIMARY KEY ("id")
);
```

### 2. PortfolioProjectImage Table

Stores images for portfolio projects (before/during/after):

```sql
CREATE TABLE "PortfolioProjectImage" (
    "id" TEXT NOT NULL,
    "portfolioProjectId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageType" TEXT NOT NULL DEFAULT 'after',
    "caption" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioProjectImage_pkey" PRIMARY KEY ("id")
);
```

### 3. Create Indexes

```sql
-- PortfolioProject indexes
CREATE INDEX "PortfolioProject_vendorProfileId_idx" ON "PortfolioProject"("vendorProfileId");
CREATE INDEX "PortfolioProject_categorySlug_idx" ON "PortfolioProject"("categorySlug");
CREATE INDEX "PortfolioProject_status_idx" ON "PortfolioProject"("status");

-- PortfolioProjectImage indexes
CREATE INDEX "PortfolioProjectImage_portfolioProjectId_idx" ON "PortfolioProjectImage"("portfolioProjectId");
```

### 4. Add Foreign Keys

```sql
ALTER TABLE "PortfolioProject" 
ADD CONSTRAINT "PortfolioProject_vendorProfileId_fkey" 
FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioProjectImage" 
ADD CONSTRAINT "PortfolioProjectImage_portfolioProjectId_fkey" 
FOREIGN KEY ("portfolioProjectId") REFERENCES "PortfolioProject"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;
```

## Deployment Steps

### Option 1: Supabase Web Console (Recommended)

**Step 1: Open Supabase Console**
1. Go to: https://app.supabase.com
2. Select the **zintra** project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**

**Step 2: Run the Migration SQL**

Copy and paste the complete SQL from `prisma/migrations/20260108_add_portfolio_projects/migration.sql` into the SQL Editor.

**Step 3: Execute**
- Click **Run** button (or Cmd+Enter)
- You should see: "X rows affected" or success message

**Step 4: Verify**
- In Supabase, go to **Table Editor**
- You should see:
  - `PortfolioProject` table ✓
  - `PortfolioProjectImage` table ✓

### Option 2: Using psql Command Line

If you have PostgreSQL client installed:

```bash
# Get the connection string from Supabase dashboard
psql "postgresql://postgres:PASSWORD@db.zeomgqlnztcdqtespsjx.supabase.co:5432/postgres" \
  -f prisma/migrations/20260108_add_portfolio_projects/migration.sql
```

Replace `PASSWORD` with your actual Supabase database password.

## Verification Checklist

After running the migration, verify:

- [ ] Navigate to **Table Editor** in Supabase console
- [ ] **PortfolioProject** table exists with columns:
  - id, vendorProfileId, title, description, categorySlug, status
  - completionDate, budgetMin, budgetMax, location, timeline
  - viewCount, quoteRequestCount, createdAt, updatedAt
- [ ] **PortfolioProjectImage** table exists with columns:
  - id, portfolioProjectId, imageUrl, imageType, caption, displayOrder, uploadedAt
- [ ] Indexes created:
  - PortfolioProject_vendorProfileId_idx
  - PortfolioProject_categorySlug_idx
  - PortfolioProject_status_idx
  - PortfolioProjectImage_portfolioProjectId_idx
- [ ] Foreign keys established

## API Endpoints Ready

Once the tables are created, these endpoints will be fully functional:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/portfolio/projects` | GET | Fetch vendor portfolio projects |
| `/api/portfolio/projects` | POST | Create new portfolio project |
| `/api/portfolio/images` | POST | Add images to project |

## Frontend Features

Once deployed, vendors can:

✅ View portfolio tab on their profile  
✅ Add new projects via 6-step wizard  
✅ Upload before/during/after project images  
✅ Manage project visibility (draft/published)  
✅ Track project views and quote requests  

## Troubleshooting

### Error: "relation does not exist"
- **Cause:** Tables not yet created
- **Solution:** Run the SQL migration in Supabase console

### Error: "foreign key constraint failed"
- **Cause:** VendorProfile table issue
- **Solution:** Verify `VendorProfile` table exists with `id` primary key

### Error: "column does not exist"
- **Cause:** Migration ran partially
- **Solution:** Delete tables and run migration again from scratch

## Timeline

| Step | Status | Notes |
|------|--------|-------|
| Create PortfolioProject table | ⏳ PENDING | Run SQL in Supabase console |
| Create PortfolioProjectImage table | ⏳ PENDING | Run SQL in Supabase console |
| Create indexes | ⏳ PENDING | Run SQL in Supabase console |
| Setup foreign keys | ⏳ PENDING | Run SQL in Supabase console |
| Verify tables exist | ⏳ TODO | Check Supabase Table Editor |
| Test API endpoints | ⏳ TODO | Test with Postman or browser |
| Test frontend | ⏳ TODO | Add portfolio project from vendor profile |

## Next Steps

1. **👉 IMMEDIATE:** Run the SQL migration in Supabase console
2. Verify tables are created
3. Test portfolio feature in browser
4. Commit verification screenshot to repo

## Resources

- **Prisma Migration:** `/prisma/migrations/20260108_add_portfolio_projects/migration.sql`
- **API Routes:** `/app/api/portfolio/`
- **Components:** `/components/vendor-profile/AddProjectModal.js`
- **Supabase Dashboard:** https://app.supabase.com

---

**Note:** Without these tables, the portfolio feature will gracefully degrade with empty state UI. This deployment enables full functionality.

