-- Vendor Profile Views RLS Policies

ALTER TABLE vendor_profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can track profile views" ON vendor_profile_views;
DROP POLICY IF EXISTS "Anyone can view profile stats" ON vendor_profile_views;
DROP POLICY IF EXISTS "No updates to profile views" ON vendor_profile_views;
DROP POLICY IF EXISTS "No deletes to profile views" ON vendor_profile_views;

CREATE POLICY "Anyone can track profile views"
  ON vendor_profile_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view profile stats"
  ON vendor_profile_views FOR SELECT
  USING (true);

CREATE POLICY "No updates to profile views"
  ON vendor_profile_views FOR UPDATE
  USING (false);

CREATE POLICY "No deletes to profile views"
  ON vendor_profile_views FOR DELETE
  USING (false);
