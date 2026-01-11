-- ============================================================================
-- STATUS UPDATE IMAGES TABLE
-- ============================================================================
-- Similar to PortfolioProjectImage, this table stores individual images
-- for vendor status updates with proper relationships and metadata
-- ============================================================================

-- Create StatusUpdateImage table
CREATE TABLE IF NOT EXISTS public.StatusUpdateImage (
  id TEXT PRIMARY KEY,
  statusupdateid UUID NOT NULL REFERENCES public.vendor_status_updates(id) ON DELETE CASCADE,
  imageurl TEXT NOT NULL,
  imagetype TEXT DEFAULT 'status', -- Type of image (status, offer, achievement, etc.)
  caption TEXT,
  displayorder INTEGER DEFAULT 0,
  uploadedat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_status_update_images_updateid 
  ON public.StatusUpdateImage(statusupdateid);
CREATE INDEX IF NOT EXISTS idx_status_update_images_displayorder 
  ON public.StatusUpdateImage(statusupdateid, displayorder);

-- Add comments for clarity
COMMENT ON TABLE public.StatusUpdateImage IS 'Individual images for vendor status updates, stored separately for better organization and scalability';
COMMENT ON COLUMN public.StatusUpdateImage.id IS 'Unique identifier for the image record (UUID string)';
COMMENT ON COLUMN public.StatusUpdateImage.statusupdateid IS 'Foreign key reference to the parent status update';
COMMENT ON COLUMN public.StatusUpdateImage.imageurl IS 'S3 URL of the uploaded image';
COMMENT ON COLUMN public.StatusUpdateImage.imagetype IS 'Type/category of image (status, offer, achievement, etc.)';
COMMENT ON COLUMN public.StatusUpdateImage.caption IS 'Optional caption for the image';
COMMENT ON COLUMN public.StatusUpdateImage.displayorder IS 'Display order in the image gallery (0-based index)';
COMMENT ON COLUMN public.StatusUpdateImage.uploadedat IS 'Timestamp when image was uploaded';

-- Enable RLS if needed
ALTER TABLE public.StatusUpdateImage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - Allow all operations (permissive)
-- In production, you might want stricter policies
DROP POLICY IF EXISTS "Allow all operations on status update images" ON public.StatusUpdateImage;
CREATE POLICY "Allow all operations on status update images"
  ON public.StatusUpdateImage
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.StatusUpdateImage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.StatusUpdateImage TO service_role;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- This table mirrors the structure of PortfolioProjectImage but for status updates
-- Key differences:
-- 1. References vendor_status_updates instead of PortfolioProject
-- 2. imagetype defaults to 'status' instead of before/during/after
-- 3. Same S3 URL storage pattern as portfolio images
--
-- After deploying this migration:
-- 1. Status updates can store multiple images properly
-- 2. Images are fetched separately and attached to updates in the API
-- 3. Frontend displays images in a gallery format
-- ============================================================================
