-- Fix RLS Policies for rfq_responses table
-- This allows vendors to insert their own quote responses
-- Run this in Supabase SQL Editor

-- First, ensure RLS is enabled on rfq_responses
ALTER TABLE public.rfq_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to prevent conflicts)
DROP POLICY IF EXISTS "Vendors can insert their own responses" ON public.rfq_responses;
DROP POLICY IF EXISTS "Users can view rfq responses" ON public.rfq_responses;
DROP POLICY IF EXISTS "Vendors can update their own responses" ON public.rfq_responses;

-- Policy 1: Allow vendors to INSERT their own quote responses
CREATE POLICY "Vendors can insert their own responses"
  ON public.rfq_responses
  FOR INSERT
  WITH CHECK (
    -- The vendor_id must match the vendor record owned by the current user
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = rfq_responses.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Policy 2: Allow vendors to SELECT/VIEW responses they submitted
CREATE POLICY "Vendors can view their own responses"
  ON public.rfq_responses
  FOR SELECT
  USING (
    -- Vendors can see their own responses
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = rfq_responses.vendor_id
      AND vendors.user_id = auth.uid()
    )
    OR
    -- RFQ creators can see all responses to their RFQs
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_responses.rfq_id
      AND rfqs.user_id = auth.uid()
    )
  );

-- Policy 3: Allow vendors to UPDATE/EDIT their own responses
CREATE POLICY "Vendors can update their own responses"
  ON public.rfq_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = rfq_responses.vendor_id
      AND vendors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = rfq_responses.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Policy 4: Allow RFQ creators to VIEW all responses to their RFQs
CREATE POLICY "RFQ creators can view responses to their RFQs"
  ON public.rfq_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_responses.rfq_id
      AND rfqs.user_id = auth.uid()
    )
  );

-- Verification: Check that RLS is enabled and policies exist
-- Run these queries to verify:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'rfq_responses';
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'rfq_responses';
