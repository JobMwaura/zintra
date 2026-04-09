-- ============================================================================
-- EMERGENCY FIX - RESTORE VENDOR ACCESS (RUN THIS NOW!)
-- ============================================================================
-- Issue: All vendors disappeared - 500 error
-- Root Cause: Admin policies check admin_users table, but user not in that table
-- Solution: Re-add the authenticated user policy that was accidentally removed
-- ============================================================================

-- Restore the original "vendors_select_authenticated" policy
-- This allows ALL authenticated users to view vendors (not just admins)

CREATE POLICY "vendors_select_authenticated" ON public.vendors
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- EXPLANATION:
-- 
-- We now have TWO sets of policies working together:
-- 
-- 1. vendors_select_authenticated - Allows ALL authenticated users to view vendors
-- 2. admins_select_all_vendors - Allows admins to view ALL vendors (including hidden ones)
-- 
-- Both policies are combined with OR logic, so either one allows access
-- 
-- Result: Normal users AND admins can see vendors ✅
-- ============================================================================

-- VERIFICATION: Test vendor access
SELECT COUNT(*) as total_vendors FROM public.vendors;
SELECT COUNT(*) as active_vendors FROM public.vendors WHERE status = 'active';
