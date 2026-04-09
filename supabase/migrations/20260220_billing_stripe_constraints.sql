-- ============================================================================
-- BILLING SUBSCRIPTIONS — Unique constraint for upsert + index
-- Run in Supabase SQL Editor after 20260220_billing_system.sql
-- ============================================================================

-- Unique constraint so we can upsert on (user_id, product_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'billing_subscriptions_user_product_unique'
  ) THEN
    ALTER TABLE billing_subscriptions
    ADD CONSTRAINT billing_subscriptions_user_product_unique
    UNIQUE (user_id, product_id);
  END IF;
END $$;

-- Service role needs INSERT/UPDATE on subscriptions (webhook runs as service role)
CREATE POLICY "service_insert_subscriptions" ON billing_subscriptions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "service_update_subscriptions" ON billing_subscriptions
  FOR UPDATE USING (true);

-- Service role insert on events
CREATE POLICY "service_insert_events" ON billing_subscription_events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "service_update_events" ON billing_subscription_events
  FOR UPDATE USING (true);

-- ============================================================================
-- DONE
-- ============================================================================
SELECT 'billing_stripe_constraints_installed' AS status;
