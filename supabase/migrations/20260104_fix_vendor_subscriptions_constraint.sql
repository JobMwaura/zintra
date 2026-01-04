/**
 * Database Migration: Fix vendor_subscriptions check constraint
 * 
 * The existing constraint "vendor_subscriptions_status_check" doesn't allow 'pending_payment' status
 * This migration removes the old constraint and adds a new one that allows all required statuses
 */

-- First, check what the current constraint is and remove it
ALTER TABLE public.vendor_subscriptions
DROP CONSTRAINT IF EXISTS vendor_subscriptions_status_check;

-- Add the corrected constraint that includes all required statuses
ALTER TABLE public.vendor_subscriptions
ADD CONSTRAINT vendor_subscriptions_status_check 
  CHECK (status IN ('pending_payment', 'active', 'expired', 'cancelled', 'payment_failed'));

-- Verify the constraint was added
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'vendor_subscriptions' 
AND constraint_type = 'CHECK';
