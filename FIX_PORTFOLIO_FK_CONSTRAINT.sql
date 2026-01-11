-- ============================================================================
-- FIX PORTFOLIO PROJECT FOREIGN KEY CONSTRAINT
-- Date: 2026-01-11
-- ============================================================================
-- The PortfolioProject table has a foreign key constraint that references
-- VendorProfile, but the app uses vendors table IDs. This causes 400 errors.
-- Solution: Drop the problematic FK and recreate it to reference vendors table

-- STEP 1: Check current foreign key
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public' 
  AND table_name = 'PortfolioProject' 
  AND column_name = 'vendorProfileId';

-- STEP 2: Drop the existing foreign key constraint
ALTER TABLE public."PortfolioProject"
DROP CONSTRAINT IF EXISTS "PortfolioProject_vendorProfileId_fkey";

-- STEP 3: Convert vendorProfileId column from text to uuid to match vendors.id type
ALTER TABLE public."PortfolioProject"
ALTER COLUMN "vendorProfileId" TYPE uuid USING "vendorProfileId"::uuid;

-- STEP 4: Add a new foreign key that references vendors table instead
ALTER TABLE public."PortfolioProject"
ADD CONSTRAINT "PortfolioProject_vendorId_fkey"
FOREIGN KEY ("vendorProfileId") REFERENCES public.vendors(id) ON DELETE CASCADE;

-- STEP 5: Verify the new constraint
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name 
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name 
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'PortfolioProject'
  AND kcu.column_name = 'vendorProfileId';
