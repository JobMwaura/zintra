-- Portfolio Project Views RLS Policies

ALTER TABLE portfolio_project_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can track views" ON portfolio_project_views;
DROP POLICY IF EXISTS "Anyone can view stats" ON portfolio_project_views;
DROP POLICY IF EXISTS "No updates to views" ON portfolio_project_views;
DROP POLICY IF EXISTS "No deletes to views" ON portfolio_project_views;

CREATE POLICY "Anyone can track views"
  ON portfolio_project_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view stats"
  ON portfolio_project_views FOR SELECT
  USING (true);

CREATE POLICY "No updates to views"
  ON portfolio_project_views FOR UPDATE
  USING (false);

CREATE POLICY "No deletes to views"
  ON portfolio_project_views FOR DELETE
  USING (false);
