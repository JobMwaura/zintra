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

-- CreateIndex
CREATE INDEX "PortfolioProject_vendorProfileId_idx" ON "PortfolioProject"("vendorProfileId");

-- CreateIndex
CREATE INDEX "PortfolioProject_categorySlug_idx" ON "PortfolioProject"("categorySlug");

-- CreateIndex
CREATE INDEX "PortfolioProject_status_idx" ON "PortfolioProject"("status");

-- CreateIndex
CREATE INDEX "PortfolioProjectImage_portfolioProjectId_idx" ON "PortfolioProjectImage"("portfolioProjectId");

-- AddForeignKey
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioProjectImage" ADD CONSTRAINT "PortfolioProjectImage_portfolioProjectId_fkey" FOREIGN KEY ("portfolioProjectId") REFERENCES "PortfolioProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
