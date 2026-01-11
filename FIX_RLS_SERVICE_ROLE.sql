-- ============================================================================
-- FIX: Enable RLS with Service Role Policy for PortfolioProjectImage
-- Date: 2026-01-11
-- ============================================================================

-- First, enable RLS on PortfolioProjectImage
ALTER TABLE public."PortfolioProjectImage" ENABLE ROW LEVEL SECURITY;

-- Drop the existing "Allow all operations" policy if it exists
DROP POLICY IF EXISTS "Allow all operations" ON public."PortfolioProjectImage";

-- Create a policy that allows the service role (anon, authenticated, and service_role)
CREATE POLICY "Allow all for service role" 
ON public."PortfolioProjectImage"
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public."PortfolioProjectImage" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."PortfolioProjectImage" TO service_role;

-- ============================================================================
-- Same for PortfolioProject
-- ============================================================================

-- Enable RLS on PortfolioProject
ALTER TABLE public."PortfolioProject" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations" ON public."PortfolioProject";

-- Create service role policy
CREATE POLICY "Allow all for service role"
ON public."PortfolioProject"
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public."PortfolioProject" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."PortfolioProject" TO service_role;
