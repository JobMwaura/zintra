-- ============================================================================
-- ZINTRA CREDITS SYSTEM - DATABASE MIGRATION
-- Date: 29 January 2026
-- Purpose: Add credit-based payment system tables to Supabase
-- ============================================================================

-- 1. CREATE credits_packages TABLE
CREATE TABLE IF NOT EXISTS public.credits_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('employer', 'worker')),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  credit_amount INTEGER NOT NULL,
  price_ksh DECIMAL(10, 2) NOT NULL,
  discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  features TEXT[],
  position INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_package_per_type_name UNIQUE(user_type, name)
);

CREATE INDEX idx_credits_packages_user_type ON public.credits_packages(user_type);
CREATE INDEX idx_credits_packages_active ON public.credits_packages(is_active);

-- 2. CREATE user_credits TABLE
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  credit_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_purchased DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_used DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_refunded DECIMAL(10, 2) NOT NULL DEFAULT 0,
  last_purchased_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX idx_user_credits_balance ON public.user_credits(credit_balance);
CREATE INDEX idx_user_credits_updated ON public.user_credits(updated_at);

-- 3. CREATE credit_transactions TABLE
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'debit', 'refund', 'bonus', 'adjustment')),
  amount DECIMAL(10, 2) NOT NULL,
  action_type VARCHAR(50), -- 'post_job', 'apply_gig', 'message', etc.
  reference_id UUID, -- References job, application, etc.
  description TEXT,
  balance_before DECIMAL(10, 2),
  balance_after DECIMAL(10, 2),
  payment_method VARCHAR(50), -- 'mpesa', 'card', 'bank_transfer', 'bonus'
  mpesa_transaction_id VARCHAR(100),
  mpesa_response_code VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON public.credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_status ON public.credit_transactions(status);
CREATE INDEX idx_credit_transactions_created ON public.credit_transactions(created_at);
CREATE INDEX idx_credit_transactions_action ON public.credit_transactions(action_type);

-- 4. CREATE credit_usage_logs TABLE
CREATE TABLE IF NOT EXISTS public.credit_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  credits_deducted DECIMAL(10, 2) NOT NULL,
  reference_id UUID,
  reason TEXT,
  auto_refund BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credit_usage_logs_user_id ON public.credit_usage_logs(user_id);
CREATE INDEX idx_credit_usage_logs_action ON public.credit_usage_logs(action_type);
CREATE INDEX idx_credit_usage_logs_created ON public.credit_usage_logs(created_at);

-- 5. CREATE credit_promotions TABLE
CREATE TABLE IF NOT EXISTS public.credit_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  credit_bonus DECIMAL(10, 2),
  description TEXT,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credit_promotions_code ON public.credit_promotions(code);
CREATE INDEX idx_credit_promotions_valid ON public.credit_promotions(valid_from, valid_until);

-- 6. CREATE credit_pricing_actions TABLE
CREATE TABLE IF NOT EXISTS public.credit_pricing_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type VARCHAR(50) UNIQUE NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('employer', 'worker', 'both')),
  cost_ksh DECIMAL(10, 2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credit_pricing_actions_user_type ON public.credit_pricing_actions(user_type);
CREATE INDEX idx_credit_pricing_actions_active ON public.credit_pricing_actions(is_active);

-- 7. INSERT default credit pricing for actions
INSERT INTO public.credit_pricing_actions (action_type, user_type, cost_ksh, description) VALUES
  ('post_job', 'employer', 500, 'Post a new job listing'),
  ('post_gig', 'employer', 250, 'Post a new gig listing'),
  ('extend_job', 'employer', 250, 'Extend job posting duration'),
  ('boost_job', 'employer', 200, 'Boost job to top placement'),
  ('message_worker', 'employer', 100, 'Send direct message to worker'),
  ('apply_job', 'worker', 50, 'Apply for a job'),
  ('apply_gig', 'worker', 25, 'Apply for a gig'),
  ('message_employer', 'worker', 100, 'Send direct message to employer'),
  ('save_job', 'worker', 0, 'Save job to wishlist (free)')
ON CONFLICT (action_type) DO NOTHING;

-- 8. INSERT default credit packages for employers
INSERT INTO public.credits_packages (user_type, name, credit_amount, price_ksh, discount_percentage, features, position) VALUES
  ('employer', 'Starter', 1000, 1000, 0, ARRAY['2 job posts', 'Basic support'], 1),
  ('employer', 'Professional', 5000, 4500, 10, ARRAY['10 job posts', 'Email support', 'Job analytics'], 2),
  ('employer', 'Business', 10000, 8500, 15, ARRAY['20 job posts', 'Priority support', 'Advanced analytics'], 3),
  ('employer', 'Enterprise', 25000, 20000, 20, ARRAY['50+ job posts', '24/7 support', 'Custom features'], 4)
ON CONFLICT (user_type, name) DO NOTHING;

-- 9. INSERT default credit packages for workers
INSERT INTO public.credits_packages (user_type, name, credit_amount, price_ksh, discount_percentage, features, position) VALUES
  ('worker', 'Casual', 500, 500, 0, ARRAY['10 applications', 'Basic profile'], 1),
  ('worker', 'Active', 2000, 1800, 10, ARRAY['40 applications', 'Profile boost'], 2),
  ('worker', 'Professional', 5000, 4000, 20, ARRAY['125 applications', 'Top placement', 'Profile verification'], 3),
  ('worker', 'Premium', 10000, 7500, 25, ARRAY['250+ applications', 'VIP support', 'Guaranteed visibility'], 4)
ON CONFLICT (user_type, name) DO NOTHING;

-- 10. CREATE FUNCTION to auto-deduct credits
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  p_user_id UUID,
  p_amount DECIMAL,
  p_action_type VARCHAR,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance DECIMAL;
  v_result JSONB;
BEGIN
  -- Get current balance
  SELECT credit_balance INTO v_current_balance
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE; -- Lock row
  
  -- Check if sufficient credits
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'current_balance', v_current_balance,
      'required', p_amount
    );
  END IF;
  
  -- Deduct credits
  UPDATE public.user_credits
  SET 
    credit_balance = credit_balance - p_amount,
    total_used = total_used + p_amount,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO public.credit_transactions (
    user_id,
    transaction_type,
    amount,
    action_type,
    reference_id,
    description,
    balance_before,
    balance_after,
    status
  ) VALUES (
    p_user_id,
    'debit',
    p_amount,
    p_action_type,
    p_reference_id,
    p_description,
    v_current_balance,
    v_current_balance - p_amount,
    'completed'
  );
  
  -- Log usage
  INSERT INTO public.credit_usage_logs (
    user_id,
    action_type,
    credits_deducted,
    reference_id,
    reason
  ) VALUES (
    p_user_id,
    p_action_type,
    p_amount,
    p_reference_id,
    p_description
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Credits deducted successfully',
    'balance_before', v_current_balance,
    'balance_after', v_current_balance - p_amount
  );
END;
$$ LANGUAGE plpgsql;

-- 11. CREATE FUNCTION to add credits (for purchases/bonuses)
CREATE OR REPLACE FUNCTION public.add_user_credits(
  p_user_id UUID,
  p_amount DECIMAL,
  p_transaction_type VARCHAR DEFAULT 'purchase',
  p_payment_method VARCHAR DEFAULT NULL,
  p_mpesa_transaction_id VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Update or create user_credits
  INSERT INTO public.user_credits (user_id, credit_balance, total_purchased)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    credit_balance = user_credits.credit_balance + p_amount,
    total_purchased = user_credits.total_purchased + p_amount,
    last_purchased_at = NOW(),
    updated_at = NOW();
  
  -- Log transaction
  INSERT INTO public.credit_transactions (
    user_id,
    transaction_type,
    amount,
    payment_method,
    mpesa_transaction_id,
    description,
    status
  ) VALUES (
    p_user_id,
    p_transaction_type,
    p_amount,
    p_payment_method,
    p_mpesa_transaction_id,
    p_description,
    'completed'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Credits added successfully',
    'amount_added', p_amount
  );
END;
$$ LANGUAGE plpgsql;

-- 12. Enable RLS on new tables
ALTER TABLE public.credits_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_pricing_actions ENABLE ROW LEVEL SECURITY;

-- 13. Create RLS Policies for user_credits
CREATE POLICY "Users can view their own credits"
  ON public.user_credits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Note: Admin update policies should be handled through custom database functions
-- rather than RLS policies for security. Users cannot directly update their own credits.

-- 14. Create RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON public.credit_transactions
  FOR INSERT
  WITH CHECK (true);

-- 15. Create RLS Policies for credit_usage_logs
CREATE POLICY "Users can view their own usage logs"
  ON public.credit_usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- 16. Create RLS Policies for credits_packages (public read)
CREATE POLICY "Anyone can view active packages"
  ON public.credits_packages
  FOR SELECT
  USING (is_active = true);

-- 17. Create RLS Policies for credit_pricing_actions (public read)
CREATE POLICY "Anyone can view active pricing"
  ON public.credit_pricing_actions
  FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Next Steps:
-- 1. Test credit purchase flow
-- 2. Test credit deduction flow
-- 3. Set up M-Pesa integration
-- 4. Set up payment webhook handlers
-- 5. Create admin dashboard for credit management
-- ============================================================================
