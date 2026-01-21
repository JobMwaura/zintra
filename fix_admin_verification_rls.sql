-- Fix RLS policy for admin verification document updates
-- Problem: Admin users get 403 Forbidden when trying to update vendor_verification_documents
-- Solution: Ensure admin policy has both USING and WITH CHECK clauses

-- Drop ALL existing admin policies to ensure clean slate
DROP POLICY IF EXISTS "admins_manage_verification" ON public.vendor_verification_documents;
DROP POLICY IF EXISTS "admins_select_all_verification" ON public.vendor_verification_documents;
DROP POLICY IF EXISTS "admins_update_all_verification" ON public.vendor_verification_documents;
DROP POLICY IF EXISTS "admins_insert_verification" ON public.vendor_verification_documents;

-- Create a more specific admin policy for SELECT
CREATE POLICY "admins_select_all_verification" 
ON public.vendor_verification_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- Create a specific admin policy for UPDATE with proper WITH CHECK
CREATE POLICY "admins_update_all_verification" 
ON public.vendor_verification_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- Create a specific admin policy for INSERT if needed
CREATE POLICY "admins_insert_verification" 
ON public.vendor_verification_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);