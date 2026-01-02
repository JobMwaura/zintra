-- ============================================================================
-- MIGRATION: Add missing RFQ columns to match RFQ_SYSTEM_COMPLETE.sql schema
-- ============================================================================
-- This migration adds the missing columns that should exist in the rfqs table
-- to make the RFQ modal functional

-- Check current columns and add missing ones
ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('direct', 'matched', 'public'));

ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'normal';

ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS attachments JSONB;

ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS assigned_vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2);

ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS tags TEXT[];

ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS budget_min DECIMAL(12, 2);

ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS budget_max DECIMAL(12, 2);

ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS county TEXT;

-- Create index on type column for faster queries
CREATE INDEX IF NOT EXISTS idx_rfqs_type ON public.rfqs(type);

-- Create index on status column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON public.rfqs(status);

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- Added columns:
--   - type: VARCHAR, defaults to 'public' (values: 'direct', 'matched', 'public')
--   - urgency: VARCHAR, defaults to 'normal'
--   - attachments: JSONB, stores complex form data
--   - assigned_vendor_id: UUID, foreign key to vendors
--   - is_paid: BOOLEAN, tracks payment status
--   - paid_amount: DECIMAL, tracks paid amount
--   - tags: TEXT[], array of tags
--   - expires_at: TIMESTAMPTZ, RFQ expiration date
--   - completed_at: TIMESTAMPTZ, completion timestamp
--   - budget_min: DECIMAL, minimum project budget (in KES)
--   - budget_max: DECIMAL, maximum project budget (in KES)
--   - location: TEXT, project location/town
--   - county: TEXT, county/region of the project
--
-- Indexes added:
--   - idx_rfqs_type: On type column for filtering by RFQ type
--   - idx_rfqs_status: On status column for filtering by status
--
-- ============================================================================

-- ============================================================================
-- ADDITIONAL ENHANCEMENTS FOR DYNAMIC RFQ MODAL
-- ============================================================================

-- Add category_slug for efficient filtering by category (if not present)
ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS category_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_rfqs_category_slug ON public.rfqs(category_slug);

-- Ensure status column exists with proper default
ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';

-- Ensure created_at and updated_at timestamps exist
ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE IF EXISTS public.rfqs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- GIN INDEXES FOR JSONB AND ARRAY COLUMNS
-- ============================================================================
-- These indexes dramatically improve performance for queries on JSONB
-- containment, existence checks, and array operations

-- GIN index for JSONB attachments (enables fast filtering by nested keys)
CREATE INDEX IF NOT EXISTS idx_rfqs_attachments_gin ON public.rfqs USING gin (attachments);

-- GIN index for tags array (enables fast containment searches like tags @> ARRAY['tag1'])
CREATE INDEX IF NOT EXISTS idx_rfqs_tags_gin ON public.rfqs USING gin (tags);

-- ============================================================================
-- EXPRESSION INDEXES FOR FREQUENTLY QUERIED JSONB KEYS
-- ============================================================================
-- Add expression indexes for category-specific fields you query often
-- Uncomment these if your app frequently filters by these attachment keys

-- Example: index attachments->>'type_of_work' if querying Doors/Windows type
-- CREATE INDEX IF NOT EXISTS idx_rfqs_attachments_type_of_work
--   ON public.rfqs ((attachments->>'type_of_work'));

-- Example: index attachments->>'urgency' if you have nested urgency in attachments
-- CREATE INDEX IF NOT EXISTS idx_rfqs_attachments_urgency
--   ON public.rfqs ((attachments->>'urgency'));

-- ============================================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================================================
-- Keeps updated_at current whenever a row is modified

CREATE OR REPLACE FUNCTION public.trg_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate to ensure idempotence
DROP TRIGGER IF EXISTS set_timestamp ON public.rfqs;
CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON public.rfqs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_set_timestamp();

-- ============================================================================
-- OPTIONAL: CHECK CONSTRAINT FOR URGENCY VALUES
-- ============================================================================
-- Enforces consistent urgency values at the database level
-- Uncomment if you want DB-level validation

-- ALTER TABLE IF EXISTS public.rfqs
-- ADD CONSTRAINT IF NOT EXISTS chk_rfqs_urgency
-- CHECK (urgency IN ('normal','high','urgent'));

-- ============================================================================
-- OPTIONAL: FULL-TEXT SEARCH SUPPORT
-- ============================================================================
-- Enables fast full-text search across title and description
-- Uncomment these lines if you need search functionality

-- -- Add tsvector column for full-text search
-- ALTER TABLE IF EXISTS public.rfqs
-- ADD COLUMN IF NOT EXISTS document tsvector;
-- 
-- -- Populate document column from existing title and description
-- UPDATE public.rfqs
-- SET document = to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
-- WHERE document IS NULL;
-- 
-- -- Create GIN index for fast FTS queries
-- CREATE INDEX IF NOT EXISTS idx_rfqs_document_fts ON public.rfqs USING gin(document);
-- 
-- -- Trigger to keep document column up-to-date
-- CREATE OR REPLACE FUNCTION public.trg_update_document()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.document := to_tsvector('english', coalesce(NEW.title,'') || ' ' || coalesce(NEW.description,''));
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- 
-- DROP TRIGGER IF EXISTS trg_update_document ON public.rfqs;
-- CREATE TRIGGER trg_update_document
--   BEFORE INSERT OR UPDATE ON public.rfqs
--   FOR EACH ROW
--   EXECUTE FUNCTION public.trg_update_document();

-- ============================================================================
-- SUMMARY OF ENHANCEMENTS
-- ============================================================================
-- New columns added:
--   - category_slug: TEXT, stores category identifier for efficient filtering
--   - status: TEXT, defaults to 'open' (open/closed/archived/pending)
--   - created_at: TIMESTAMPTZ, tracks record creation time
--   - updated_at: TIMESTAMPTZ, tracks last modification time
--
-- New indexes added:
--   - idx_rfqs_category_slug: B-tree index on category_slug for filtering
--   - idx_rfqs_attachments_gin: GIN index for JSONB containment queries
--   - idx_rfqs_tags_gin: GIN index for array containment queries
--
-- New triggers:
--   - set_timestamp: Automatically updates updated_at on every UPDATE
--
-- Optional features (commented out):
--   - Expression indexes for specific JSONB keys (enable as needed)
--   - CHECK constraint for urgency values
--   - Full-text search support with tsvector column and triggers
--
-- ============================================================================
