-- Portfolio Feature - Database Tables
-- Complete isolation: No modifications to existing tables

-- =============================================================================
-- TABLE 1: portfolio_projects
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.portfolio_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Project Information
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., "Building & Construction"
  status TEXT DEFAULT 'completed', -- completed | in_progress
  
  -- Project Details
  project_type TEXT, -- e.g., "Residential", "Commercial"
  materials_used TEXT, -- JSON or comma-separated list
  cost_estimate DECIMAL(12, 2),
  timeline_months INT,
  
  -- Metrics
  views_count INT DEFAULT 0,
  saves_count INT DEFAULT 0,
  
  -- Tracking
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT status_valid CHECK (status IN ('completed', 'in_progress'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_vendor_id ON public.portfolio_projects(vendor_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_created_at ON public.portfolio_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_is_public ON public.portfolio_projects(is_public);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_is_featured ON public.portfolio_projects(is_featured);

-- =============================================================================
-- TABLE 2: portfolio_media
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.portfolio_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.portfolio_projects(id) ON DELETE CASCADE,
  
  -- Media Information
  media_url TEXT NOT NULL, -- S3 presigned URL
  media_type TEXT DEFAULT 'image', -- image | video
  file_name TEXT,
  file_size INT, -- in bytes
  
  -- Optional metadata
  caption TEXT,
  is_before_after BOOLEAN DEFAULT false, -- true if before/after pair
  pair_id UUID, -- Link to paired image if before/after
  
  -- Display order
  display_order INT DEFAULT 0,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT media_url_not_empty CHECK (length(trim(media_url)) > 0),
  CONSTRAINT media_type_valid CHECK (media_type IN ('image', 'video'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_media_project_id ON public.portfolio_media(project_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_media_display_order ON public.portfolio_media(display_order);

-- =============================================================================
-- TABLE 3: portfolio_saves (wishlist/moodboard)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.portfolio_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.portfolio_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.auth.users(id) ON DELETE CASCADE,
  
  -- Tracking
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Unique constraint: user can save each project only once
  UNIQUE(project_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_saves_user_id ON public.portfolio_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_saves_project_id ON public.portfolio_saves(project_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_saves_saved_at ON public.portfolio_saves(saved_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all three tables
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_saves ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies: portfolio_projects
-- =============================================================================

-- Policy 1: Public projects visible to everyone
CREATE POLICY "Public projects visible to all"
  ON public.portfolio_projects
  FOR SELECT
  USING (is_public = true OR auth.uid() = (SELECT user_id FROM public.vendors WHERE id = vendor_id));

-- Policy 2: Vendors can view their own projects (private or public)
CREATE POLICY "Vendors can view own projects"
  ON public.portfolio_projects
  FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.vendors WHERE id = vendor_id));

-- Policy 3: Vendors can create projects
CREATE POLICY "Vendors can create projects"
  ON public.portfolio_projects
  FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.vendors WHERE id = vendor_id));

-- Policy 4: Vendors can update their own projects
CREATE POLICY "Vendors can update own projects"
  ON public.portfolio_projects
  FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM public.vendors WHERE id = vendor_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.vendors WHERE id = vendor_id));

-- Policy 5: Vendors can delete their own projects
CREATE POLICY "Vendors can delete own projects"
  ON public.portfolio_projects
  FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM public.vendors WHERE id = vendor_id));

-- =============================================================================
-- RLS Policies: portfolio_media
-- =============================================================================

-- Policy 1: Anyone can view media from public projects
CREATE POLICY "View media from public projects"
  ON public.portfolio_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolio_projects
      WHERE portfolio_projects.id = portfolio_media.project_id
      AND (portfolio_projects.is_public = true OR auth.uid() = (SELECT user_id FROM public.vendors WHERE id = portfolio_projects.vendor_id))
    )
  );

-- Policy 2: Vendors can manage media on their projects
CREATE POLICY "Vendors can manage own project media"
  ON public.portfolio_media
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.portfolio_projects
      WHERE portfolio_projects.id = portfolio_media.project_id
      AND auth.uid() = (SELECT user_id FROM public.vendors WHERE id = portfolio_projects.vendor_id)
    )
  );

-- Policy 3: Vendors can delete media from their projects
CREATE POLICY "Vendors can delete own project media"
  ON public.portfolio_media
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolio_projects
      WHERE portfolio_projects.id = portfolio_media.project_id
      AND auth.uid() = (SELECT user_id FROM public.vendors WHERE id = portfolio_projects.vendor_id)
    )
  );

-- =============================================================================
-- RLS Policies: portfolio_saves
-- =============================================================================

-- Policy 1: Users can view their own saves
CREATE POLICY "Users can view own saves"
  ON public.portfolio_saves
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can save projects
CREATE POLICY "Users can save projects"
  ON public.portfolio_saves
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can delete their own saves
CREATE POLICY "Users can delete own saves"
  ON public.portfolio_saves
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGERS (Optional: update updated_at timestamp)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_portfolio_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portfolio_projects_updated_at_trigger
BEFORE UPDATE ON public.portfolio_projects
FOR EACH ROW
EXECUTE FUNCTION update_portfolio_projects_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.portfolio_projects IS 'Vendor portfolio projects showcasing completed or in-progress work';
COMMENT ON TABLE public.portfolio_media IS 'Images and videos for portfolio projects';
COMMENT ON TABLE public.portfolio_saves IS 'Users saving projects to their wishlist/moodboard';
