-- ============================================================================
-- COMPREHENSIVE SUPABASE DATABASE MIGRATION
-- Date: 2026-01-03
-- Purpose: Add project_title and project_description to rfq_requests table
-- ============================================================================

-- Step 1: Add missing columns to rfq_requests table
-- These columns are required for the Direct Quote Request feature
ALTER TABLE IF EXISTS public.rfq_requests
ADD COLUMN IF NOT EXISTS project_title text;

ALTER TABLE IF EXISTS public.rfq_requests
ADD COLUMN IF NOT EXISTS project_description text;

-- Step 2: Verify the table structure
-- This query will show all columns in the rfq_requests table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'rfq_requests'
ORDER BY ordinal_position;

-- ============================================================================
-- VERIFICATION COMPLETE
-- The rfq_requests table now has:
-- - id (uuid primary key)
-- - rfq_id (uuid not null, references rfqs)
-- - vendor_id (uuid not null)
-- - user_id (uuid nullable)
-- - project_title (text nullable)
-- - project_description (text nullable)
-- - status (text default 'pending')
-- - created_at (timestamptz default now())
-- ============================================================================
