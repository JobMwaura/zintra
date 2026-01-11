-- ============================================================================
-- CREATE RLS POLICY FOR PORTFOLIO PROJECT IMAGE TABLE
-- Date: 2026-01-11
-- ============================================================================
-- This creates a policy that allows the service role to access the table

-- STEP 1: Enable RLS if not already enabled
ALTER TABLE public."PortfolioProjectImage" ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop any existing policies
DROP POLICY IF EXISTS "Allow service role to manage images" ON public."PortfolioProjectImage";
DROP POLICY IF EXISTS "Allow all" ON public."PortfolioProjectImage";

-- STEP 3: Create a simple policy that allows all operations
CREATE POLICY "Allow all operations" ON public."PortfolioProjectImage"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- STEP 4: Verify policy exists
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'PortfolioProjectImage';

-- STEP 5: Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'PortfolioProjectImage';
