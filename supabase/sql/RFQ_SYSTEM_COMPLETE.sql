-- ============================================================================
-- RFQ SYSTEM SCHEMA - COMPLETE
-- ============================================================================

-- TABLE 1: VENDORS
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  category TEXT,
  location TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);

-- TABLE 2: ADMIN USERS
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- TABLE 3: RFQ QUOTA
CREATE TABLE IF NOT EXISTS public.users_rfq_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  direct_rfqs_used INT DEFAULT 0,
  wizard_rfqs_used INT DEFAULT 0,
  public_rfqs_used INT DEFAULT 0,
  total_rfqs_this_month INT DEFAULT 0,
  free_quota_remaining INT DEFAULT 3,
  last_reset_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_rfq_quota_user_id ON public.users_rfq_quota(user_id);
CREATE INDEX IF NOT EXISTS idx_users_rfq_quota_month ON public.users_rfq_quota(month_year);

-- TABLE 4: RFQS (MAIN)
CREATE TABLE IF NOT EXISTS public.rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT,
  county TEXT,
  budget_estimate TEXT,
  type TEXT NOT NULL DEFAULT 'public',
  status TEXT NOT NULL DEFAULT 'submitted',
  is_paid BOOLEAN DEFAULT false,
  paid_amount DECIMAL(10, 2),
  assigned_vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  urgency TEXT DEFAULT 'normal',
  tags TEXT[],
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rfqs_user_id ON public.rfqs(user_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_type ON public.rfqs(type);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON public.rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_category ON public.rfqs(category);
CREATE INDEX IF NOT EXISTS idx_rfqs_created_at ON public.rfqs(created_at);

-- TABLE 5: RFQ RESPONSES
CREATE TABLE IF NOT EXISTS public.rfq_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  quoted_price DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  delivery_timeline TEXT,
  description TEXT,
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rfq_responses_rfq_id ON public.rfq_responses(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_vendor_id ON public.rfq_responses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_status ON public.rfq_responses(status);

-- TABLE 6: RFQ PAYMENTS
CREATE TABLE IF NOT EXISTS public.rfq_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  quantity INT DEFAULT 1,
  payment_method TEXT NOT NULL,
  transaction_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  phone_number TEXT,
  mpesa_receipt TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rfq_payments_user_id ON public.rfq_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_rfq_payments_status ON public.rfq_payments(status);

-- TABLE 7: RFQ RECIPIENTS
CREATE TABLE IF NOT EXISTS public.rfq_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rfq_recipients_rfq_id ON public.rfq_recipients(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_recipients_vendor_id ON public.rfq_recipients(vendor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rfq_recipients_unique ON public.rfq_recipients(rfq_id, vendor_id);

-- TABLE 8: ADMIN AUDIT
CREATE TABLE IF NOT EXISTS public.rfq_admin_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  details JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rfq_admin_audit_admin_id ON public.rfq_admin_audit(admin_id);
CREATE INDEX IF NOT EXISTS idx_rfq_admin_audit_resource ON public.rfq_admin_audit(resource_type, resource_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_rfq_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_admin_audit ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- VENDORS POLICIES
CREATE POLICY "vendor_select" ON public.vendors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vendor_service_role" ON public.vendors FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ADMIN USERS POLICIES
CREATE POLICY "admin_users_service_role" ON public.admin_users FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RFQ QUOTA POLICIES
CREATE POLICY "quota_select" ON public.users_rfq_quota FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "quota_update" ON public.users_rfq_quota FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "quota_service_role" ON public.users_rfq_quota FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RFQS POLICIES
CREATE POLICY "rfqs_select_own" ON public.rfqs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rfqs_insert" ON public.rfqs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rfqs_update" ON public.rfqs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rfqs_service_role" ON public.rfqs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RFQ RESPONSES POLICIES
CREATE POLICY "responses_vendor" ON public.rfq_responses FOR ALL USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));
CREATE POLICY "responses_creator" ON public.rfq_responses FOR SELECT USING (rfq_id IN (SELECT id FROM public.rfqs WHERE user_id = auth.uid()));
CREATE POLICY "responses_service_role" ON public.rfq_responses FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RFQ PAYMENTS POLICIES
CREATE POLICY "payments_select" ON public.rfq_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_service_role" ON public.rfq_payments FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RFQ RECIPIENTS POLICIES
CREATE POLICY "recipients_vendor" ON public.rfq_recipients FOR SELECT USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));
CREATE POLICY "recipients_creator" ON public.rfq_recipients FOR SELECT USING (rfq_id IN (SELECT id FROM public.rfqs WHERE user_id = auth.uid()));
CREATE POLICY "recipients_service_role" ON public.rfq_recipients FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- AUDIT POLICIES
CREATE POLICY "audit_service_role" ON public.rfq_admin_audit FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_rfq_quota_available(
  p_user_id UUID,
  p_rfq_type TEXT
) RETURNS TABLE (
  can_submit BOOLEAN,
  free_remaining INT,
  message TEXT
) AS $$
DECLARE
  v_quota RECORD;
  v_current_month TEXT;
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  SELECT * INTO v_quota FROM public.users_rfq_quota
  WHERE user_id = p_user_id AND month_year = v_current_month;
  
  IF v_quota IS NULL THEN
    INSERT INTO public.users_rfq_quota (user_id, month_year)
    VALUES (p_user_id, v_current_month)
    ON CONFLICT (user_id) DO UPDATE SET month_year = EXCLUDED.month_year;
    
    RETURN QUERY SELECT true, 3, 'Quota reset. You have 3 free RFQs.'::TEXT;
  ELSE
    RETURN QUERY SELECT
      (v_quota.free_quota_remaining > 0),
      v_quota.free_quota_remaining,
      CASE
        WHEN v_quota.free_quota_remaining > 0 THEN 'You can submit ' || v_quota.free_quota_remaining || ' more free RFQ(s) this month'
        ELSE 'Free quota exhausted. Pay KES 300 for additional RFQ'
      END::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.increment_rfq_usage(
  p_user_id UUID,
  p_rfq_type TEXT
) RETURNS void AS $$
DECLARE
  v_current_month TEXT;
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  UPDATE public.users_rfq_quota
  SET 
    total_rfqs_this_month = total_rfqs_this_month + 1,
    free_quota_remaining = CASE WHEN free_quota_remaining > 0 THEN free_quota_remaining - 1 ELSE 0 END,
    updated_at = NOW()
  WHERE user_id = p_user_id AND month_year = v_current_month;
  
  IF p_rfq_type = 'direct' THEN
    UPDATE public.users_rfq_quota SET direct_rfqs_used = direct_rfqs_used + 1
    WHERE user_id = p_user_id AND month_year = v_current_month;
  ELSIF p_rfq_type = 'wizard' THEN
    UPDATE public.users_rfq_quota SET wizard_rfqs_used = wizard_rfqs_used + 1
    WHERE user_id = p_user_id AND month_year = v_current_month;
  ELSIF p_rfq_type = 'public' THEN
    UPDATE public.users_rfq_quota SET public_rfqs_used = public_rfqs_used + 1
    WHERE user_id = p_user_id AND month_year = v_current_month;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.auto_match_vendors_to_rfq(
  p_rfq_id UUID
) RETURNS TABLE (matched_vendor_count INT) AS $$
DECLARE
  v_rfq RECORD;
  v_count INT := 0;
BEGIN
  SELECT * INTO v_rfq FROM public.rfqs WHERE id = p_rfq_id;
  
  INSERT INTO public.rfq_recipients (rfq_id, vendor_id, recipient_type)
  SELECT p_rfq_id, v.id, 'wizard'
  FROM public.vendors v
  WHERE v.category ILIKE v_rfq.category
    AND (v.location ILIKE v_rfq.location OR v_rfq.location IS NULL)
    AND v.status = 'active'
  ON CONFLICT (rfq_id, vendor_id) DO NOTHING;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_rfq_expiration() RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NOW() + INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_rfq_expiration ON public.rfqs;
CREATE TRIGGER trg_set_rfq_expiration
BEFORE INSERT ON public.rfqs
FOR EACH ROW EXECUTE FUNCTION public.set_rfq_expiration();

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW public.rfqs_with_details AS
SELECT 
  r.id, r.user_id, r.title, r.description, r.type, r.status,
  r.category, r.location, r.budget_estimate, r.is_paid, r.created_at
FROM public.rfqs r;

CREATE OR REPLACE VIEW public.vendor_eligible_rfqs AS
SELECT 
  r.id, r.user_id, r.title, r.type, r.category, r.location, r.budget_estimate, r.created_at
FROM public.rfqs r
WHERE r.status IN ('submitted', 'approved', 'assigned', 'in_review');
