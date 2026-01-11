-- ============================================================================
-- RECREATE PORTFOLIO TABLES (Force Schema Cache Refresh)
-- Date: 2026-01-11
-- ============================================================================

-- Drop and recreate PortfolioProject table
DROP TABLE IF EXISTS public."PortfolioProject" CASCADE;

CREATE TABLE public."PortfolioProject" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  vendorProfileId UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  categorySlug TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  budgetMin INTEGER,
  budgetMax INTEGER,
  timeline TEXT,
  location TEXT,
  completionDate TIMESTAMP,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vendor lookups
CREATE INDEX idx_portfolio_project_vendor_id ON public."PortfolioProject"(vendorProfileId);

-- Drop and recreate PortfolioProjectImage table
DROP TABLE IF EXISTS public."PortfolioProjectImage" CASCADE;

CREATE TABLE public."PortfolioProjectImage" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  portfolioProjectId TEXT NOT NULL REFERENCES public."PortfolioProject"(id) ON DELETE CASCADE,
  imageUrl TEXT NOT NULL,
  imageType TEXT NOT NULL CHECK (imageType IN ('before', 'during', 'after')),
  caption TEXT,
  displayOrder INTEGER NOT NULL,
  uploadedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for project lookups
CREATE INDEX idx_portfolio_image_project_id ON public."PortfolioProjectImage"(portfolioProjectId);

-- Enable RLS
ALTER TABLE public."PortfolioProject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PortfolioProjectImage" ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (allow all)
CREATE POLICY "Allow all operations on PortfolioProject"
ON public."PortfolioProject"
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on PortfolioProjectImage"
ON public."PortfolioProjectImage"
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions to service role
GRANT SELECT, INSERT, UPDATE, DELETE ON public."PortfolioProject" TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."PortfolioProjectImage" TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
