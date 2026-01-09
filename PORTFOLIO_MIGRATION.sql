-- ============================================================================
-- Portfolio Database Migration
-- ============================================================================
-- This SQL migration creates the PortfolioProject and PortfolioProjectImage 
-- tables to enable the portfolio feature for vendors.
-- 
-- Location: Supabase SQL Editor
-- Date: January 9, 2026
-- ============================================================================

-- CreateTable PortfolioProject
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

-- CreateTable PortfolioProjectImage
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

-- CreateIndex for PortfolioProject table
CREATE INDEX "PortfolioProject_vendorProfileId_idx" ON "PortfolioProject"("vendorProfileId");
CREATE INDEX "PortfolioProject_categorySlug_idx" ON "PortfolioProject"("categorySlug");
CREATE INDEX "PortfolioProject_status_idx" ON "PortfolioProject"("status");

-- CreateIndex for PortfolioProjectImage table
CREATE INDEX "PortfolioProjectImage_portfolioProjectId_idx" ON "PortfolioProjectImage"("portfolioProjectId");

-- AddForeignKey - Link PortfolioProject to VendorProfile
ALTER TABLE "PortfolioProject" 
ADD CONSTRAINT "PortfolioProject_vendorProfileId_fkey" 
FOREIGN KEY ("vendorProfileId") 
REFERENCES "VendorProfile"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- AddForeignKey - Link PortfolioProjectImage to PortfolioProject
ALTER TABLE "PortfolioProjectImage" 
ADD CONSTRAINT "PortfolioProjectImage_portfolioProjectId_fkey" 
FOREIGN KEY ("portfolioProjectId") 
REFERENCES "PortfolioProject"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- ============================================================================
-- Table Schema Documentation
-- ============================================================================

-- PortfolioProject Table
-- =====================
-- Stores portfolio projects for vendors
--
-- Columns:
--   id (TEXT): Unique project identifier (primary key)
--   vendorProfileId (TEXT): Foreign key to VendorProfile table
--   title (TEXT): Project title (required)
--   description (TEXT): Detailed project description (required)
--   categorySlug (TEXT): Service category slug (e.g., "electrical", "plumbing")
--   status (TEXT): Project status - 'draft' or 'published' (default: 'draft')
--   completionDate (TIMESTAMP): When the project was completed
--   budgetMin (INTEGER): Minimum project budget in KES
--   budgetMax (INTEGER): Maximum project budget in KES
--   location (TEXT): Project location
--   timeline (TEXT): Project timeline description
--   viewCount (INTEGER): Number of times project was viewed (default: 0)
--   quoteRequestCount (INTEGER): Number of quote requests for this project (default: 0)
--   createdAt (TIMESTAMP): When the project was created (auto-set)
--   updatedAt (TIMESTAMP): When the project was last updated
--
-- Indexes:
--   PortfolioProject_pkey: Primary key on id
--   PortfolioProject_vendorProfileId_idx: For filtering by vendor
--   PortfolioProject_categorySlug_idx: For filtering by category
--   PortfolioProject_status_idx: For filtering by status
--
-- Foreign Keys:
--   vendorProfileId → VendorProfile(id) ON DELETE CASCADE

-- PortfolioProjectImage Table
-- ===========================
-- Stores images for portfolio projects
--
-- Columns:
--   id (TEXT): Unique image identifier (primary key)
--   portfolioProjectId (TEXT): Foreign key to PortfolioProject table
--   imageUrl (TEXT): URL to the image (stored in AWS S3) (required)
--   imageType (TEXT): Image type - 'before', 'during', or 'after' (default: 'after')
--   caption (TEXT): Optional image caption
--   displayOrder (INTEGER): Order in which to display images (default: 0)
--   uploadedAt (TIMESTAMP): When the image was uploaded (auto-set)
--
-- Indexes:
--   PortfolioProjectImage_pkey: Primary key on id
--   PortfolioProjectImage_portfolioProjectId_idx: For filtering by project
--
-- Foreign Keys:
--   portfolioProjectId → PortfolioProject(id) ON DELETE CASCADE

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- To verify tables were created successfully, run:
--
-- 1. Check PortfolioProject table:
--    SELECT * FROM "PortfolioProject" LIMIT 1;
--
-- 2. Check PortfolioProjectImage table:
--    SELECT * FROM "PortfolioProjectImage" LIMIT 1;
--
-- 3. List all indexes:
--    SELECT indexname FROM pg_indexes 
--    WHERE tablename IN ('PortfolioProject', 'PortfolioProjectImage')
--    ORDER BY indexname;
--
-- 4. Check table structure:
--    \d "PortfolioProject"
--    \d "PortfolioProjectImage"

-- ============================================================================
-- Rollback Instructions (if needed)
-- ============================================================================

-- To undo this migration and delete the tables:
-- 
-- ALTER TABLE "PortfolioProjectImage" DROP CONSTRAINT IF EXISTS "PortfolioProjectImage_portfolioProjectId_fkey";
-- ALTER TABLE "PortfolioProject" DROP CONSTRAINT IF EXISTS "PortfolioProject_vendorProfileId_fkey";
-- DROP TABLE IF EXISTS "PortfolioProjectImage";
-- DROP TABLE IF EXISTS "PortfolioProject";
