-- ============================================================================
-- Portfolio Tables Verification Script
-- ============================================================================
-- Run this in Supabase SQL Editor to verify the portfolio tables are complete
-- and properly configured.
-- ============================================================================

-- Check if PortfolioProject table exists and show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'PortfolioProject'
ORDER BY ordinal_position;

-- Check if PortfolioProjectImage table exists and show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'PortfolioProjectImage'
ORDER BY ordinal_position;

-- List all indexes on portfolio tables
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename IN ('PortfolioProject', 'PortfolioProjectImage')
ORDER BY tablename, indexname;

-- Check foreign key constraints
SELECT 
    constraint_name,
    table_name,
    column_name,
    referenced_table_name,
    referenced_column_name
FROM information_schema.key_column_usage
WHERE table_name IN ('PortfolioProject', 'PortfolioProjectImage')
AND referenced_table_name IS NOT NULL;

-- ============================================================================
-- Expected Results
-- ============================================================================
--
-- PortfolioProject columns:
--   id, vendorProfileId, title, description, categorySlug, status, 
--   completionDate, budgetMin, budgetMax, location, timeline, 
--   viewCount, quoteRequestCount, createdAt, updatedAt
--
-- PortfolioProjectImage columns:
--   id, portfolioProjectId, imageUrl, imageType, caption, 
--   displayOrder, uploadedAt
--
-- Indexes (should see 5):
--   PortfolioProject_pkey
--   PortfolioProject_vendorProfileId_idx
--   PortfolioProject_categorySlug_idx
--   PortfolioProject_status_idx
--   PortfolioProjectImage_pkey
--   PortfolioProjectImage_portfolioProjectId_idx
--
-- Foreign Keys (should see 2):
--   PortfolioProject_vendorProfileId_fkey
--   PortfolioProjectImage_portfolioProjectId_fkey

-- ============================================================================
-- If Tables Need to Be Recreated (use with caution)
-- ============================================================================
--
-- Only run these commands if the tables are corrupted or incomplete:
--
-- DROP TABLE IF EXISTS "PortfolioProjectImage" CASCADE;
-- DROP TABLE IF EXISTS "PortfolioProject" CASCADE;
--
-- Then run the PORTFOLIO_MIGRATION.sql to recreate them.
