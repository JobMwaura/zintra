/**
 * Database Migration: Add PesaPal Payment Fields to vendor_subscriptions
 * Run this in Supabase SQL Editor to add payment tracking to subscriptions
 */

-- Step 1: Add payment-related columns to vendor_subscriptions table
ALTER TABLE IF EXISTS public.vendor_subscriptions
ADD COLUMN IF NOT EXISTS pesapal_order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pesapal',
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_status TEXT,
ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Step 2: Create index for faster lookups by order ID
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_pesapal_order_id 
  ON public.vendor_subscriptions(pesapal_order_id)
  WHERE pesapal_order_id IS NOT NULL;

-- Step 3: Create index for faster lookups by payment status
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_payment_status 
  ON public.vendor_subscriptions(payment_status)
  WHERE payment_status IS NOT NULL;

-- Step 4: Create payment_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  order_id TEXT NOT NULL,
  vendor_id UUID NOT NULL,
  status TEXT,
  amount NUMERIC(12, 2),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create indexes on payment_logs for efficient querying
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id 
  ON public.payment_logs(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_logs_vendor_id 
  ON public.payment_logs(vendor_id);

CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type 
  ON public.payment_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at 
  ON public.payment_logs(created_at DESC);

-- Step 6: Add check constraint for valid subscription statuses
ALTER TABLE public.vendor_subscriptions
DROP CONSTRAINT IF EXISTS valid_subscription_status;

ALTER TABLE public.vendor_subscriptions
ADD CONSTRAINT valid_subscription_status 
  CHECK (status IN ('pending_payment', 'active', 'expired', 'cancelled', 'payment_failed'));

-- Step 7: Add check constraint for valid payment statuses
ALTER TABLE public.vendor_subscriptions
DROP CONSTRAINT IF EXISTS valid_payment_status;

ALTER TABLE public.vendor_subscriptions
ADD CONSTRAINT valid_payment_status 
  CHECK (payment_status IS NULL OR payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'));

-- Step 8: Verify the schema changes
-- Run these to verify everything was created:

-- Check vendor_subscriptions columns
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'vendor_subscriptions' 
-- ORDER BY ordinal_position;

-- Check payment_logs table exists
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables 
--   WHERE table_name = 'payment_logs'
-- ) as table_exists;

-- Check all indexes
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('vendor_subscriptions', 'payment_logs');
