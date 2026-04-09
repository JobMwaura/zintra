-- Portfolio Project Views Tracking Table
-- This table tracks who viewed which portfolio projects

CREATE TABLE IF NOT EXISTS portfolio_project_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES "PortfolioProject"(id) ON DELETE CASCADE,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_views_project ON portfolio_project_views(project_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_views_viewed_at ON portfolio_project_views(viewed_at);
