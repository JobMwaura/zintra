-- ============================================================================
-- BILLING USAGE RPC — Atomic increment for included usage
-- Run in Supabase SQL Editor after 20260220_billing_system.sql
-- ============================================================================

-- Atomically increment a usage metric.
-- Returns the new value after increment.
CREATE OR REPLACE FUNCTION increment_billing_usage(
  p_user_id UUID,
  p_metric_key TEXT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_val INT;
BEGIN
  UPDATE billing_included_usage
  SET metric_value = metric_value + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND metric_key = p_metric_key
    AND period_start <= NOW()
    AND period_end >= NOW()
  RETURNING metric_value INTO new_val;

  IF new_val IS NULL THEN
    RETURN -1; -- No matching usage record
  END IF;

  RETURN new_val;
END;
$$;

-- Decrement a usage metric (for undo / refunds).
CREATE OR REPLACE FUNCTION decrement_billing_usage(
  p_user_id UUID,
  p_metric_key TEXT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_val INT;
BEGIN
  UPDATE billing_included_usage
  SET metric_value = GREATEST(0, metric_value - 1),
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND metric_key = p_metric_key
    AND period_start <= NOW()
    AND period_end >= NOW()
  RETURNING metric_value INTO new_val;

  IF new_val IS NULL THEN
    RETURN -1;
  END IF;

  RETURN new_val;
END;
$$;

-- ============================================================================
-- DONE
-- ============================================================================
SELECT 'billing_usage_rpc_installed' AS status;
