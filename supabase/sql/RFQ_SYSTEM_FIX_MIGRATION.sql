-- =============================================================================
-- RFQ SYSTEM DATABASE FIX - COMPREHENSIVE MIGRATION
-- =============================================================================
-- Run this in Supabase SQL Editor to fix relationship issues
-- Date: January 24, 2026
-- 
-- This migration:
-- 1. Ensures rfqs table has assigned_vendor_id column
-- 2. Fixes rfq_responses foreign key relationships
-- 3. Adds proper indexes for performance
-- 4. Sets up RLS policies for security
-- =============================================================================

-- =============================================================================
-- STEP 1: ENSURE rfqs TABLE HAS REQUIRED COLUMNS
-- =============================================================================

-- Add assigned_vendor_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rfqs' 
    AND column_name = 'assigned_vendor_id'
  ) THEN
    ALTER TABLE public.rfqs ADD COLUMN assigned_vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added assigned_vendor_id column to rfqs table';
  ELSE
    RAISE NOTICE 'assigned_vendor_id column already exists';
  END IF;
END $$;

-- Add type column if it doesn't exist (for direct/wizard/public RFQ types)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rfqs' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.rfqs ADD COLUMN type text DEFAULT 'direct';
    RAISE NOTICE 'Added type column to rfqs table';
  ELSE
    RAISE NOTICE 'type column already exists';
  END IF;
END $$;

-- Add budget_range column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rfqs' 
    AND column_name = 'budget_range'
  ) THEN
    ALTER TABLE public.rfqs ADD COLUMN budget_range text;
    RAISE NOTICE 'Added budget_range column to rfqs table';
  ELSE
    RAISE NOTICE 'budget_range column already exists';
  END IF;
END $$;

-- =============================================================================
-- STEP 2: FIX rfq_responses TABLE - REMOVE DUPLICATE FOREIGN KEYS
-- =============================================================================

-- Check and report existing foreign keys on rfq_responses
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    RAISE NOTICE '--- Current Foreign Keys on rfq_responses ---';
    FOR fk_record IN
        SELECT 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'rfq_responses' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    LOOP
        RAISE NOTICE 'FK: % | Column: % -> %.%', 
            fk_record.constraint_name, 
            fk_record.column_name,
            fk_record.foreign_table_name,
            fk_record.foreign_column_name;
    END LOOP;
END $$;

-- Drop duplicate foreign key constraints on rfq_id (if any exist)
-- Keep only ONE foreign key from rfq_responses.rfq_id -> rfqs.id
DO $$
DECLARE
    fk_count INTEGER;
    fk_name TEXT;
BEGIN
    -- Count FK constraints on rfq_id column
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'rfq_responses' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'rfq_id'
    AND tc.table_schema = 'public';
    
    IF fk_count > 1 THEN
        RAISE NOTICE 'Found % foreign keys on rfq_id - cleaning up duplicates...', fk_count;
        
        -- Get all but the first FK constraint name
        FOR fk_name IN
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'rfq_responses' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'rfq_id'
            AND tc.table_schema = 'public'
            OFFSET 1  -- Skip the first one, drop the rest
        LOOP
            EXECUTE format('ALTER TABLE public.rfq_responses DROP CONSTRAINT IF EXISTS %I', fk_name);
            RAISE NOTICE 'Dropped duplicate FK: %', fk_name;
        END LOOP;
    ELSE
        RAISE NOTICE 'Only % FK constraint on rfq_id - no duplicates to clean', fk_count;
    END IF;
END $$;

-- =============================================================================
-- STEP 3: ENSURE PROPER INDEXES EXIST
-- =============================================================================

-- Index on rfqs.assigned_vendor_id for faster vendor lookups
CREATE INDEX IF NOT EXISTS idx_rfqs_assigned_vendor_id 
ON public.rfqs(assigned_vendor_id);

-- Index on rfqs.type for filtering by RFQ type
CREATE INDEX IF NOT EXISTS idx_rfqs_type 
ON public.rfqs(type);

-- Index on rfqs.user_id for user's RFQ list
CREATE INDEX IF NOT EXISTS idx_rfqs_user_id 
ON public.rfqs(user_id);

-- Index on rfqs.status for status filtering
CREATE INDEX IF NOT EXISTS idx_rfqs_status 
ON public.rfqs(status);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_rfqs_user_status 
ON public.rfqs(user_id, status);

-- Index on rfq_responses.rfq_id
CREATE INDEX IF NOT EXISTS idx_rfq_responses_rfq_id 
ON public.rfq_responses(rfq_id);

-- Index on rfq_responses.vendor_id
CREATE INDEX IF NOT EXISTS idx_rfq_responses_vendor_id 
ON public.rfq_responses(vendor_id);

-- Index on rfq_requests.vendor_id (for vendor inbox)
CREATE INDEX IF NOT EXISTS idx_rfq_requests_vendor_id 
ON public.rfq_requests(vendor_id);

-- Index on rfq_requests.rfq_id
CREATE INDEX IF NOT EXISTS idx_rfq_requests_rfq_id 
ON public.rfq_requests(rfq_id);

-- =============================================================================
-- STEP 4: RLS POLICIES FOR rfqs TABLE
-- =============================================================================

-- Enable RLS on rfqs table
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own RFQs" ON public.rfqs;
DROP POLICY IF EXISTS "Users can insert their own RFQs" ON public.rfqs;
DROP POLICY IF EXISTS "Users can update their own RFQs" ON public.rfqs;
DROP POLICY IF EXISTS "Vendors can view RFQs assigned to them" ON public.rfqs;

-- Users can view their own RFQs
CREATE POLICY "Users can view their own RFQs"
ON public.rfqs FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own RFQs
CREATE POLICY "Users can insert their own RFQs"
ON public.rfqs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own RFQs
CREATE POLICY "Users can update their own RFQs"
ON public.rfqs FOR UPDATE
USING (auth.uid() = user_id);

-- Vendors can view RFQs assigned to them
CREATE POLICY "Vendors can view RFQs assigned to them"
ON public.rfqs FOR SELECT
USING (
  assigned_vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  )
);

-- =============================================================================
-- STEP 5: RLS POLICIES FOR rfq_responses TABLE
-- =============================================================================

-- Enable RLS on rfq_responses table
ALTER TABLE public.rfq_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Vendors can insert their own responses" ON public.rfq_responses;
DROP POLICY IF EXISTS "Vendors can view their own responses" ON public.rfq_responses;
DROP POLICY IF EXISTS "RFQ owners can view responses" ON public.rfq_responses;

-- Vendors can insert their own responses
CREATE POLICY "Vendors can insert their own responses"
ON public.rfq_responses FOR INSERT
WITH CHECK (
  vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  )
);

-- Vendors can view their own responses
CREATE POLICY "Vendors can view their own responses"
ON public.rfq_responses FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  )
);

-- RFQ owners can view all responses to their RFQs
CREATE POLICY "RFQ owners can view responses"
ON public.rfq_responses FOR SELECT
USING (
  rfq_id IN (
    SELECT id FROM public.rfqs WHERE user_id = auth.uid()
  )
);

-- =============================================================================
-- STEP 6: RLS POLICIES FOR rfq_requests TABLE (Vendor Inbox)
-- =============================================================================

-- Enable RLS on rfq_requests table
ALTER TABLE public.rfq_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can insert RFQ requests" ON public.rfq_requests;
DROP POLICY IF EXISTS "Vendors can view their RFQ requests" ON public.rfq_requests;
DROP POLICY IF EXISTS "Users can view their sent requests" ON public.rfq_requests;

-- Users can insert RFQ requests (when sending to vendors)
CREATE POLICY "Users can insert RFQ requests"
ON public.rfq_requests FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Vendors can view RFQ requests sent to them
CREATE POLICY "Vendors can view their RFQ requests"
ON public.rfq_requests FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  )
);

-- Users can view their own sent requests
CREATE POLICY "Users can view their sent requests"
ON public.rfq_requests FOR SELECT
USING (auth.uid() = user_id);

-- =============================================================================
-- STEP 7: VERIFICATION QUERIES
-- =============================================================================

-- Verify rfqs table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'rfqs'
ORDER BY ordinal_position;

-- Verify foreign keys on rfq_responses
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'rfq_responses' 
AND tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public';

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('rfqs', 'rfq_responses', 'rfq_requests');

-- Count existing RFQs
SELECT 
    COUNT(*) as total_rfqs,
    COUNT(assigned_vendor_id) as rfqs_with_vendor,
    COUNT(CASE WHEN type = 'direct' THEN 1 END) as direct_rfqs
FROM public.rfqs;

-- Migration Complete
SELECT '=== RFQ System Migration Complete ===' as status;
