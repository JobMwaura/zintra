-- Fix: Add missing RLS policies for employer_payments table
-- Error: "new row violates row-level security policy for table employer_payments"
-- This occurs because employer_payments has RLS enabled but no INSERT policy

-- First, ensure the table exists and RLS is enabled
-- (assuming this was created by VENDOR_INTEGRATION_SCHEMA.sql)

-- Add INSERT policy
DROP POLICY IF EXISTS "employers_insert_own_payments" ON employer_payments;
CREATE POLICY "employers_insert_own_payments" ON employer_payments
  FOR INSERT WITH CHECK (auth.uid() = employer_id);

-- Ensure SELECT policy exists
DROP POLICY IF EXISTS "employers_read_own_payments" ON employer_payments;
CREATE POLICY "employers_read_own_payments" ON employer_payments
  FOR SELECT USING (auth.uid() = employer_id);

-- Add UPDATE policy for webhook processing
DROP POLICY IF EXISTS "service_update_payments" ON employer_payments;
CREATE POLICY "service_update_payments" ON employer_payments
  FOR UPDATE USING (auth.uid() = employer_id);

-- Same for employer_spending table
DROP POLICY IF EXISTS "employers_insert_own_spending" ON employer_spending;
CREATE POLICY "employers_insert_own_spending" ON employer_spending
  FOR INSERT WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "employers_read_own_spending" ON employer_spending;
CREATE POLICY "employers_read_own_spending" ON employer_spending
  FOR SELECT USING (auth.uid() = employer_id);

DROP POLICY IF EXISTS "employers_update_own_spending" ON employer_spending;
CREATE POLICY "employers_update_own_spending" ON employer_spending
  FOR UPDATE USING (auth.uid() = employer_id);
