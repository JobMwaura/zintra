-- ========================================================================
-- Status Update Images Table Creation
-- ========================================================================
-- PURPOSE: Store image metadata for status updates (separate table for scalability)
-- LOCATION: Copy this entire SQL and execute in Supabase → SQL Editor
-- TIME TO RUN: < 5 seconds
-- ========================================================================

-- Create the main table
CREATE TABLE IF NOT EXISTS public.StatusUpdateImage (
  id TEXT PRIMARY KEY,
  statusupdateid UUID NOT NULL REFERENCES public.vendor_status_updates(id) ON DELETE CASCADE,
  imageurl TEXT NOT NULL,
  imagetype TEXT DEFAULT 'status',
  caption TEXT,
  displayorder INTEGER DEFAULT 0,
  uploadedat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_statusupdate_statusupdateid 
  ON public.StatusUpdateImage(statusupdateid);

CREATE INDEX IF NOT EXISTS idx_statusupdate_displayorder 
  ON public.StatusUpdateImage(displayorder);

-- Enable Row Level Security
ALTER TABLE public.StatusUpdateImage ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policy (allows all operations)
-- This matches the pattern used in portfolio images
CREATE POLICY "StatusUpdateImage: allow all operations" 
  ON public.StatusUpdateImage
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify table was created successfully
-- Run this after the above to confirm:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'StatusUpdateImage';

-- Expected result: One row showing 'StatusUpdateImage'
-- If you don't see it, check the error messages above.
