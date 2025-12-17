-- ============================================================================
-- VENDOR PROFILE IMPROVEMENTS - Database Schema Updates
-- ============================================================================
-- Date: December 17, 2025
-- Purpose: Fix vendor profile issues by persisting services and FAQs to database,
--          add social media fields, and improve data integrity
-- ============================================================================

-- ============================================================================
-- 1. CREATE vendor_services TABLE
-- ============================================================================
-- Purpose: Store vendor services (replaces hardcoded array)
-- Benefits: Services persist across sessions, can be edited per vendor
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vendor_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries by vendor
CREATE INDEX IF NOT EXISTS idx_vendor_services_vendor_id 
  ON public.vendor_services(vendor_id);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_vendor_services_display_order 
  ON public.vendor_services(vendor_id, display_order);

-- ============================================================================
-- 2. CREATE vendor_faqs TABLE
-- ============================================================================
-- Purpose: Store vendor FAQs (replaces hardcoded arrays)
-- Benefits: FAQs are now editable, persistent, and manageable per vendor
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vendor_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries by vendor
CREATE INDEX IF NOT EXISTS idx_vendor_faqs_vendor_id 
  ON public.vendor_faqs(vendor_id);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_vendor_faqs_display_order 
  ON public.vendor_faqs(vendor_id, display_order);

-- Index for active FAQs
CREATE INDEX IF NOT EXISTS idx_vendor_faqs_active 
  ON public.vendor_faqs(vendor_id, is_active);

-- ============================================================================
-- 3. ADD SOCIAL MEDIA COLUMNS TO vendors TABLE
-- ============================================================================
-- Purpose: Store Instagram and Facebook URLs in database
-- Current: Only website and WhatsApp available
-- ============================================================================

ALTER TABLE IF EXISTS public.vendors
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- ============================================================================
-- 4. CREATE TRIGGER FOR vendor_services updated_at
-- ============================================================================
-- Auto-updates the updated_at timestamp when a service is modified
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_vendor_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vendor_services_updated_at ON public.vendor_services;
CREATE TRIGGER trg_vendor_services_updated_at
  BEFORE UPDATE ON public.vendor_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_services_updated_at();

-- ============================================================================
-- 5. CREATE TRIGGER FOR vendor_faqs updated_at
-- ============================================================================
-- Auto-updates the updated_at timestamp when an FAQ is modified
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_vendor_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vendor_faqs_updated_at ON public.vendor_faqs;
CREATE TRIGGER trg_vendor_faqs_updated_at
  BEFORE UPDATE ON public.vendor_faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_faqs_updated_at();

-- ============================================================================
-- 6. INSERT DEFAULT SERVICES FOR EXISTING VENDORS (MIGRATION)
-- ============================================================================
-- This migrates default services to the database for all vendors that don't 
-- have services yet. Vendors can then customize or delete these services.
-- ============================================================================

INSERT INTO public.vendor_services (vendor_id, name, description, display_order)
SELECT 
  v.id,
  'Material Delivery'::TEXT,
  'Same-day and scheduled delivery options available for all products'::TEXT,
  1
FROM public.vendors v
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendor_services 
  WHERE vendor_id = v.id AND name = 'Material Delivery'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.vendor_services (vendor_id, name, description, display_order)
SELECT 
  v.id,
  'Project Consultation'::TEXT,
  'Expert advice on material selection and quantity estimation'::TEXT,
  2
FROM public.vendors v
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendor_services 
  WHERE vendor_id = v.id AND name = 'Project Consultation'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.vendor_services (vendor_id, name, description, display_order)
SELECT 
  v.id,
  'Custom Cutting & Fabrication'::TEXT,
  'On-site cutting and fabrication services for lumber, steel, and other materials'::TEXT,
  3
FROM public.vendors v
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendor_services 
  WHERE vendor_id = v.id AND name = 'Custom Cutting & Fabrication'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.vendor_services (vendor_id, name, description, display_order)
SELECT 
  v.id,
  'Equipment Rental'::TEXT,
  'Rent specialized tools and equipment for your project needs'::TEXT,
  4
FROM public.vendors v
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendor_services 
  WHERE vendor_id = v.id AND name = 'Equipment Rental'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.vendor_services (vendor_id, name, description, display_order)
SELECT 
  v.id,
  'Contractor Referrals'::TEXT,
  'Connect with our network of trusted contractors for your project'::TEXT,
  5
FROM public.vendors v
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendor_services 
  WHERE vendor_id = v.id AND name = 'Contractor Referrals'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS for security
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.vendor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_faqs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (PostgreSQL doesn't support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS vendor_services_read_public ON public.vendor_services;
DROP POLICY IF EXISTS vendor_services_write_own ON public.vendor_services;
DROP POLICY IF EXISTS vendor_services_update_own ON public.vendor_services;
DROP POLICY IF EXISTS vendor_services_delete_own ON public.vendor_services;
DROP POLICY IF EXISTS vendor_faqs_read_public ON public.vendor_faqs;
DROP POLICY IF EXISTS vendor_faqs_write_own ON public.vendor_faqs;
DROP POLICY IF EXISTS vendor_faqs_update_own ON public.vendor_faqs;
DROP POLICY IF EXISTS vendor_faqs_delete_own ON public.vendor_faqs;

-- Allow anyone to read services for public vendor profiles
CREATE POLICY vendor_services_read_public
  ON public.vendor_services
  FOR SELECT
  USING (TRUE);

-- Allow vendors to manage their own services
CREATE POLICY vendor_services_write_own
  ON public.vendor_services
  FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM public.vendors 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY vendor_services_update_own
  ON public.vendor_services
  FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY vendor_services_delete_own
  ON public.vendor_services
  FOR DELETE
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors 
      WHERE user_id = auth.uid()
    )
  );

-- Allow anyone to read FAQs for public vendor profiles
CREATE POLICY vendor_faqs_read_public
  ON public.vendor_faqs
  FOR SELECT
  USING (is_active = TRUE);

-- Allow vendors to manage their own FAQs
CREATE POLICY vendor_faqs_write_own
  ON public.vendor_faqs
  FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM public.vendors 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY vendor_faqs_update_own
  ON public.vendor_faqs
  FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY vendor_faqs_delete_own
  ON public.vendor_faqs
  FOR DELETE
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration was successful
-- ============================================================================

-- Check vendor_services table created
-- SELECT * FROM information_schema.tables WHERE table_name = 'vendor_services';

-- Check vendor_faqs table created
-- SELECT * FROM information_schema.tables WHERE table_name = 'vendor_faqs';

-- Check new columns added to vendors
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'vendors' AND column_name IN ('instagram_url', 'facebook_url');

-- Check services count per vendor
-- SELECT vendor_id, COUNT(*) as service_count FROM vendor_services GROUP BY vendor_id;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
