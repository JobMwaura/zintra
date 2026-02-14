-- ============================================================================
-- PHASE 3 FIX: Add metadata column to negotiation_threads
-- 
-- The report/flag API writes to negotiation_threads.metadata, but this
-- column was never created. This migration adds it.
-- 
-- Run this in Supabase SQL Editor.
-- ============================================================================

-- Add metadata JSONB column to negotiation_threads (for reports/flags)
ALTER TABLE negotiation_threads
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================================================
-- DONE. The negotiation report/flag feature will now work correctly.
-- ============================================================================
