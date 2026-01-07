-- Portfolio Feature - Database Migration Scripts
-- Execution: Run in Supabase SQL Editor or via migration tool
-- Date: January 7, 2026

-- ============================================================================
-- TABLE 1: vendor_portfolio_projects
-- ============================================================================

CREATE TABLE public.vendor_portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Project metadata
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  
  -- Categorization
  category_slug VARCHAR(100) NOT NULL,
  subcategories TEXT[] DEFAULT '{}',
  
  -- Location & timeline
  county VARCHAR(100),
  area VARCHAR(100),
  timeline_type VARCHAR(50),
  
  -- Budget info (ranges, not exact)
  budget_range_min INTEGER,
  budget_range_max INTEGER,
  
  -- Quick facts
  materials_used TEXT[] DEFAULT '{}',
  client_type VARCHAR(50),
  site_visit_done BOOLEAN DEFAULT FALSE,
  
  -- Content settings
  allow_quote_requests BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  
  -- Media count (denormalized for performance)
  media_count INTEGER DEFAULT 0,
  cover_image_url VARCHAR(500),
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  quote_request_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('completed', 'in_progress')),
  CONSTRAINT valid_client_type CHECK (client_type IS NULL OR client_type IN ('residential', 'commercial')),
  CONSTRAINT valid_budget_range CHECK (budget_range_min IS NULL OR budget_range_max IS NULL OR budget_range_min <= budget_range_max)
);

-- Indexes for common queries
CREATE INDEX idx_vendor_portfolio_projects_vendor_id 
  ON public.vendor_portfolio_projects(vendor_id);

CREATE INDEX idx_vendor_portfolio_projects_category 
  ON public.vendor_portfolio_projects(category_slug);

CREATE INDEX idx_vendor_portfolio_projects_status 
  ON public.vendor_portfolio_projects(status);

CREATE INDEX idx_vendor_portfolio_projects_created 
  ON public.vendor_portfolio_projects(created_at DESC);

CREATE INDEX idx_vendor_portfolio_projects_is_featured 
  ON public.vendor_portfolio_projects(is_featured) 
  WHERE is_featured = TRUE;

CREATE INDEX idx_vendor_portfolio_projects_is_pinned 
  ON public.vendor_portfolio_projects(is_pinned) 
  WHERE is_pinned = TRUE;

-- Full text search index (for search functionality)
CREATE INDEX idx_vendor_portfolio_projects_search 
  ON public.vendor_portfolio_projects 
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Enable RLS
ALTER TABLE public.vendor_portfolio_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access
CREATE POLICY "Anyone can view vendor portfolio projects"
  ON public.vendor_portfolio_projects
  FOR SELECT
  USING (true);

-- RLS Policy: Vendors can insert their own projects
CREATE POLICY "Vendors can insert own portfolio projects"
  ON public.vendor_portfolio_projects
  FOR INSERT
  WITH CHECK (vendor_id = auth.uid());

-- RLS Policy: Vendors can update their own projects
CREATE POLICY "Vendors can update own portfolio projects"
  ON public.vendor_portfolio_projects
  FOR UPDATE
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- RLS Policy: Vendors can delete their own projects
CREATE POLICY "Vendors can delete own portfolio projects"
  ON public.vendor_portfolio_projects
  FOR DELETE
  USING (vendor_id = auth.uid());

-- ============================================================================
-- TABLE 2: vendor_portfolio_media
-- ============================================================================

CREATE TABLE public.vendor_portfolio_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.vendor_portfolio_projects(id) ON DELETE CASCADE,
  
  -- Media info
  url VARCHAR(500) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'image',
  media_type VARCHAR(50), -- 'before', 'after', 'progress', null (default)
  
  -- Display
  caption VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_type CHECK (type IN ('image', 'video')),
  CONSTRAINT valid_media_type CHECK (media_type IS NULL OR media_type IN ('before', 'after', 'progress'))
);

-- Indexes
CREATE INDEX idx_vendor_portfolio_media_project_id 
  ON public.vendor_portfolio_media(project_id);

CREATE INDEX idx_vendor_portfolio_media_sort 
  ON public.vendor_portfolio_media(project_id, sort_order);

CREATE INDEX idx_vendor_portfolio_media_is_cover 
  ON public.vendor_portfolio_media(is_cover) 
  WHERE is_cover = TRUE;

-- Enable RLS
ALTER TABLE public.vendor_portfolio_media ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access to media
CREATE POLICY "Anyone can view portfolio media"
  ON public.vendor_portfolio_media
  FOR SELECT
  USING (true);

-- RLS Policy: Vendors can insert media for their projects
CREATE POLICY "Vendors can insert portfolio media"
  ON public.vendor_portfolio_media
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendor_portfolio_projects 
      WHERE id = project_id AND vendor_id = auth.uid()
    )
  );

-- RLS Policy: Vendors can update media for their projects
CREATE POLICY "Vendors can update portfolio media"
  ON public.vendor_portfolio_media
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_portfolio_projects 
      WHERE id = project_id AND vendor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendor_portfolio_projects 
      WHERE id = project_id AND vendor_id = auth.uid()
    )
  );

-- RLS Policy: Vendors can delete media for their projects
CREATE POLICY "Vendors can delete portfolio media"
  ON public.vendor_portfolio_media
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_portfolio_projects 
      WHERE id = project_id AND vendor_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE 3: portfolio_project_saves
-- ============================================================================

CREATE TABLE public.portfolio_project_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.vendor_portfolio_projects(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicate saves
  UNIQUE(user_id, project_id)
);

-- Indexes
CREATE INDEX idx_portfolio_project_saves_user_id 
  ON public.portfolio_project_saves(user_id);

CREATE INDEX idx_portfolio_project_saves_project_id 
  ON public.portfolio_project_saves(project_id);

CREATE INDEX idx_portfolio_project_saves_created 
  ON public.portfolio_project_saves(created_at DESC);

-- Enable RLS
ALTER TABLE public.portfolio_project_saves ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see/manage their own saves
CREATE POLICY "Users can manage own saves"
  ON public.portfolio_project_saves
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- UPDATE: Add reference columns to rfqs table
-- ============================================================================

-- Add columns to rfqs table (if they don't exist)
ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS reference_project_id UUID REFERENCES public.vendor_portfolio_projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reference_media_urls TEXT[];

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_rfqs_reference_project 
  ON public.rfqs(reference_project_id);

-- ============================================================================
-- FUNCTIONS: Automatic update triggers
-- ============================================================================

-- Update project metrics when media is added/deleted
CREATE OR REPLACE FUNCTION update_portfolio_project_media_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.vendor_portfolio_projects 
    SET media_count = media_count + 1
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.vendor_portfolio_projects 
    SET media_count = media_count - 1
    WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_media_count
AFTER INSERT OR DELETE ON public.vendor_portfolio_media
FOR EACH ROW
EXECUTE FUNCTION update_portfolio_project_media_count();

-- Update save count automatically
CREATE OR REPLACE FUNCTION update_portfolio_project_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.vendor_portfolio_projects 
    SET save_count = save_count + 1
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.vendor_portfolio_projects 
    SET save_count = save_count - 1
    WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_save_count
AFTER INSERT OR DELETE ON public.portfolio_project_saves
FOR EACH ROW
EXECUTE FUNCTION update_portfolio_project_save_count();

-- Update timestamp on modification
CREATE OR REPLACE FUNCTION update_portfolio_projects_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_portfolio_projects_timestamp
BEFORE UPDATE ON public.vendor_portfolio_projects
FOR EACH ROW
EXECUTE FUNCTION update_portfolio_projects_timestamp();

CREATE TRIGGER trigger_update_portfolio_media_timestamp
BEFORE UPDATE ON public.vendor_portfolio_media
FOR EACH ROW
EXECUTE FUNCTION update_portfolio_projects_timestamp();

-- ============================================================================
-- VIEWS: Helpful read-only views
-- ============================================================================

-- View: Vendor portfolio with aggregated stats
CREATE OR REPLACE VIEW vendor_portfolio_stats AS
SELECT 
  p.vendor_id,
  COUNT(p.id) as total_projects,
  SUM(p.view_count) as total_views,
  SUM(p.save_count) as total_saves,
  SUM(p.quote_request_count) as total_quote_requests,
  COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_projects,
  COUNT(CASE WHEN p.status = 'in_progress' THEN 1 END) as in_progress_projects
FROM public.vendor_portfolio_projects p
GROUP BY p.vendor_id;

-- View: Popular projects (top saved/viewed)
CREATE OR REPLACE VIEW popular_portfolio_projects AS
SELECT 
  p.*,
  ROW_NUMBER() OVER (ORDER BY (p.save_count + p.view_count/10) DESC) as popularity_rank
FROM public.vendor_portfolio_projects p
WHERE p.created_at >= NOW() - INTERVAL '90 days'
ORDER BY (p.save_count + p.view_count/10) DESC;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify the migration was successful:

-- Check all new tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name LIKE '%portfolio%';

-- Check RLS is enabled
-- SELECT schemaname, tablename FROM pg_tables 
-- WHERE tablename LIKE '%portfolio%' 
-- ORDER BY tablename;

-- Check indexes
-- SELECT schemaname, tablename, indexname FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND tablename LIKE '%portfolio%' 
-- ORDER BY tablename, indexname;

-- ============================================================================
-- SAMPLE DATA (for testing - optional)
-- ============================================================================

-- Uncomment to add test data:

/*
-- Insert test vendor (assumes vendor user exists)
INSERT INTO public.vendor_portfolio_projects (
  vendor_id,
  title,
  description,
  status,
  category_slug,
  subcategories,
  county,
  timeline_type,
  budget_range_min,
  budget_range_max,
  materials_used,
  client_type,
  site_visit_done,
  allow_quote_requests
) VALUES (
  (SELECT id FROM public.users WHERE role = 'vendor' LIMIT 1),
  '4BR Maisonette Roofing – Ruiru',
  'Scope: complete roof replacement with waterproofing, replaced timber, new mabati sheets, installed gutters and downspouts',
  'completed',
  'roofing',
  '{"waterproofing", "gutter-installation"}',
  'Kiambu',
  '2 weeks',
  80000,
  150000,
  '{"mabati", "timber", "cement", "gutters", "waterproofing-membrane"}',
  'residential',
  true,
  true
);
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- If you see this message without errors, the migration was successful!
-- Next steps:
-- 1. Test the tables and RLS policies
-- 2. Run sample queries to verify data insertion
-- 3. Begin API development (Week 1, Day 3+)
