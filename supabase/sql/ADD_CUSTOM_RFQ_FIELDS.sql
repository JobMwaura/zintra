-- ============================================================================
-- ADD CUSTOM RFQ FIELDS FOR "OTHER" CATEGORY SUPPORT
-- ============================================================================
-- Purpose: Allow users to specify custom categories (e.g., "Plumbing") and
-- custom details (e.g., floor types, roofing materials, specifications) when
-- the predefined categories don't match their needs.
--
-- Run this migration in Supabase SQL Editor
-- ============================================================================

-- Add columns to rfqs table if they don't exist
ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS custom_details text,
ADD COLUMN IF NOT EXISTS is_custom_category boolean DEFAULT false;

-- Add a comment explaining the custom fields
COMMENT ON COLUMN public.rfqs.custom_details IS 'Custom details provided by user when category is "Other" (e.g., floor types, roofing materials, specific requirements)';
COMMENT ON COLUMN public.rfqs.is_custom_category IS 'True if the category is user-specified via "Other" option, false if from predefined list';

-- ============================================================================
-- ADD CUSTOM DETAILS TO RFQ REQUESTS (vendor responses)
-- ============================================================================

-- Add columns to rfq_responses table if they don't exist
ALTER TABLE public.rfq_responses
ADD COLUMN IF NOT EXISTS custom_response_details text;

-- Add a comment explaining the custom response field
COMMENT ON COLUMN public.rfq_responses.custom_response_details IS 'Custom response details from vendor for RFQs with custom categories (e.g., vendor notes on specific floor types or materials)';

-- ============================================================================
-- ADD INDEX FOR BETTER QUERY PERFORMANCE
-- ============================================================================

-- Index on is_custom_category for filtering
CREATE INDEX IF NOT EXISTS idx_rfqs_is_custom_category 
ON public.rfqs(is_custom_category);

-- Combined index for querying by category and custom flag
CREATE INDEX IF NOT EXISTS idx_rfqs_category_custom 
ON public.rfqs(category, is_custom_category);

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- 
-- BACKWARD COMPATIBILITY:
-- - Existing RFQs will have is_custom_category = false (default)
-- - Existing RFQs will have custom_details = NULL
-- - No existing data is affected
--
-- USAGE IN FORMS:
-- When user selects "Other" category in DirectRFQPopup:
-- 1. Category field stores the user-specified category name (e.g., "Plumbing")
-- 2. is_custom_category is set to true
-- 3. custom_details stores additional info from the user
--
-- USAGE IN VENDOR RESPONSES:
-- Vendors responding to RFQs with custom categories can provide:
-- 1. Standard response quote (in standard quote field)
-- 2. Custom response details in custom_response_details field
--
-- BENEFITS:
-- - Flexible category system that adapts to user needs
-- - Users can specify categories not in predefined list
-- - Users can provide detailed specifications for custom categories
-- - Vendors can provide tailored responses
-- - Easy to track which RFQs are custom vs. predefined
-- ============================================================================
