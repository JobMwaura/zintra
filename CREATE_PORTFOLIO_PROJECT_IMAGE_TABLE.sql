-- ============================================================================
-- CREATE PORTFOLIO PROJECT IMAGE TABLE
-- Date: 2026-01-11
-- ============================================================================
-- Creates the PortfolioProjectImage table if it doesn't exist

CREATE TABLE IF NOT EXISTS public."PortfolioProjectImage" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "portfolioProjectId" UUID NOT NULL REFERENCES public."PortfolioProject"(id) ON DELETE CASCADE,
  "imageUrl" TEXT NOT NULL,
  "imageType" TEXT NOT NULL DEFAULT 'after' CHECK ("imageType" IN ('before', 'during', 'after')),
  caption TEXT,
  "displayOrder" INTEGER DEFAULT 0,
  "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT portfolio_project_image_type_check CHECK ("imageType" IN ('before', 'during', 'after'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_PortfolioProjectImage_portfolioProjectId" 
  ON public."PortfolioProjectImage"("portfolioProjectId");

-- Verify table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'PortfolioProjectImage';

-- Show table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'PortfolioProjectImage'
ORDER BY ordinal_position;
