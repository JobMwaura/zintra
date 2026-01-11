-- ============================================================================
-- PORTFOLIO TABLES RESTORATION
-- ============================================================================
-- Recreate PortfolioProject and PortfolioProjectImage tables with RLS
-- These were working before and need to be restored
-- ============================================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.PortfolioProjectImage CASCADE;
DROP TABLE IF EXISTS public.PortfolioProject CASCADE;

-- ============================================================================
-- CREATE PORTFOLIO PROJECT TABLE
-- ============================================================================

CREATE TABLE public.PortfolioProject (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category_slug text,
  timeline text,
  budget_min numeric,
  budget_max numeric,
  completion_date date,
  location text,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_portfolio_project_vendor_id ON public.PortfolioProject(vendor_id);
CREATE INDEX idx_portfolio_project_created_at ON public.PortfolioProject(created_at DESC);
CREATE INDEX idx_portfolio_project_status ON public.PortfolioProject(status);

-- Enable RLS
ALTER TABLE public.PortfolioProject ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies
CREATE POLICY "portfolio_project_select" ON public.PortfolioProject FOR SELECT USING (true);
CREATE POLICY "portfolio_project_insert" ON public.PortfolioProject FOR INSERT WITH CHECK (true);
CREATE POLICY "portfolio_project_update" ON public.PortfolioProject FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "portfolio_project_delete" ON public.PortfolioProject FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.PortfolioProject TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.PortfolioProject TO service_role;

-- ============================================================================
-- CREATE PORTFOLIO PROJECT IMAGE TABLE
-- ============================================================================

CREATE TABLE public.PortfolioProjectImage (
  id TEXT PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.PortfolioProject(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type text DEFAULT 'before',
  caption text,
  display_order integer DEFAULT 0,
  uploaded_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_portfolio_project_image_project_id ON public.PortfolioProjectImage(project_id);
CREATE INDEX idx_portfolio_project_image_display_order ON public.PortfolioProjectImage(project_id, display_order);

-- Enable RLS
ALTER TABLE public.PortfolioProjectImage ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies
CREATE POLICY "portfolio_project_image_select" ON public.PortfolioProjectImage FOR SELECT USING (true);
CREATE POLICY "portfolio_project_image_insert" ON public.PortfolioProjectImage FOR INSERT WITH CHECK (true);
CREATE POLICY "portfolio_project_image_update" ON public.PortfolioProjectImage FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "portfolio_project_image_delete" ON public.PortfolioProjectImage FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.PortfolioProjectImage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.PortfolioProjectImage TO service_role;

-- ============================================================================
-- VERIFY TABLES CREATED
-- ============================================================================

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%Portfolio%'
ORDER BY table_name;
