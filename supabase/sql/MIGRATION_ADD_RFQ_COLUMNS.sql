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
--
-- Indexes added:
--   - idx_rfqs_type: On type column for filtering by RFQ type
--   - idx_rfqs_status: On status column for filtering by status
--
-- ============================================================================
