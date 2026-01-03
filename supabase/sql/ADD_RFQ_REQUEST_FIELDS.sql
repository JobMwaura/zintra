-- Migration: Add project_title and project_description to rfq_requests table
-- Date: 2026-01-03
-- Purpose: Support storing project details with direct RFQ requests

-- Add project_title column if it doesn't exist
ALTER TABLE IF EXISTS public.rfq_requests
ADD COLUMN IF NOT EXISTS project_title text;

-- Add project_description column if it doesn't exist
ALTER TABLE IF EXISTS public.rfq_requests
ADD COLUMN IF NOT EXISTS project_description text;

-- Verify the table structure
SELECT * FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'rfq_requests'
ORDER BY ordinal_position;
