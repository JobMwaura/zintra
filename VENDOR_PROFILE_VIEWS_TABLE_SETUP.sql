-- Vendor Profile Views Tracking Table
-- This table tracks who viewed which vendor profiles and when

CREATE TABLE IF NOT EXISTS vendor_profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  viewer_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_profile_views_vendor ON vendor_profile_views(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profile_views_viewed_at ON vendor_profile_views(viewed_at);
