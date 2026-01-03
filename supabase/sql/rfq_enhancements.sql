-- ==========================================
-- ZINTRA RFQ ENHANCEMENTS & MIGRATIONS
-- Run this script on your Supabase database
-- Date: December 15, 2025
-- ==========================================

-- ========================================
-- 1. ALTER existing rfqs table to add new fields
-- (These are the fields we added for better RFQ management)
-- ========================================

ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS auto_category text,
ADD COLUMN IF NOT EXISTS project_type text,
ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'flexible', -- asap|normal|flexible
ADD COLUMN IF NOT EXISTS buyer_name text,
ADD COLUMN IF NOT EXISTS buyer_email text,
ADD COLUMN IF NOT EXISTS buyer_phone text,
ADD COLUMN IF NOT EXISTS buyer_reputation text DEFAULT 'new', -- new|bronze|silver|gold
ADD COLUMN IF NOT EXISTS services_required jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS material_requirements text,
ADD COLUMN IF NOT EXISTS dimensions jsonb DEFAULT '{"length":"","width":"","height":""}'::jsonb,
ADD COLUMN IF NOT EXISTS quality_preference text,
ADD COLUMN IF NOT EXISTS site_accessibility text,
ADD COLUMN IF NOT EXISTS delivery_preference text,
ADD COLUMN IF NOT EXISTS reference_images jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'pending', -- pending|validated|needs_review|rejected
ADD COLUMN IF NOT EXISTS spam_score int DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_flag boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS published_at timestamptz,
ADD COLUMN IF NOT EXISTS closed_at timestamptz;

-- Add any missing indexes on the rfqs table
CREATE INDEX IF NOT EXISTS idx_rfqs_validation_status ON public.rfqs(validation_status);
CREATE INDEX IF NOT EXISTS idx_rfqs_user_id ON public.rfqs(user_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_county ON public.rfqs(county);
CREATE INDEX IF NOT EXISTS idx_rfqs_created_at ON public.rfqs(created_at);

-- ========================================
-- 2. Ensure required tables exist
-- (If they don't, they'll be created; if they do, no change)
-- ========================================

-- Admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text,
  role text default 'admin',
  status text default 'active',
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  features jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Vendor subscriptions
CREATE TABLE IF NOT EXISTS public.vendor_subscriptions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null,
  user_id uuid not null,
  plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  start_date timestamptz,
  end_date timestamptz,
  status text default 'active',
  auto_renew boolean default true,
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_user_id ON public.vendor_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_vendor_id ON public.vendor_subscriptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_status ON public.vendor_subscriptions(status);

-- RFQ requests (invites to vendors)
CREATE TABLE IF NOT EXISTS public.rfq_requests (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  vendor_id uuid not null,
  user_id uuid,
  project_title text,
  project_description text,
  status text default 'pending', -- pending|accepted|declined|expired
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_rfq_requests_rfq_id ON public.rfq_requests(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_requests_vendor_id ON public.rfq_requests(vendor_id);

-- RFQ responses (quotes from vendors)
CREATE TABLE IF NOT EXISTS public.rfq_responses (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  vendor_id uuid not null,
  amount numeric(14,2),
  message text,
  attachment_url text,
  status text default 'submitted', -- submitted|accepted|declined
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_rfq_id ON public.rfq_responses(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_vendor_id ON public.rfq_responses(vendor_id);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null,
  author text,
  rating int,
  comment text,
  vendor_response text,
  responded_at timestamptz,
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON public.reviews(vendor_id);

-- Admin activity log
CREATE TABLE IF NOT EXISTS public.admin_activity (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action text,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON public.admin_activity(created_at);

-- ========================================
-- 3. Create notifications table if missing
-- (Used by RFQ admin approval flow)
-- ========================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text, -- rfq_match|vendor_approved|rfq_response|etc
  title text,
  body text,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- ========================================
-- 4. Ensure vendors table exists and has required fields
-- (Core vendor profile table)
-- ========================================

-- Note: Vendors table should already exist from initial setup
-- This just ensures it has all the columns needed
-- If this fails, the table may have different structure - check your schema

CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  company_name text,
  email text,
  phone text,
  location text,
  county text,
  description text,
  website text,
  whatsapp text,
  price_range text,
  category text,
  status text default 'pending', -- pending|active|inactive|rejected
  verified boolean default false,
  rating numeric(3,2),
  rfqs_completed int default 0,
  response_time int, -- in hours
  complaints_count int default 0,
  last_active timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON public.vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_county ON public.vendors(county);

-- ========================================
-- 5. Create categories table
-- (Used for RFQ categorization)
-- ========================================

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique,
  description text,
  icon text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- ========================================
-- 6. Optional: Enable RLS if not already enabled
-- (For security - adjust based on your needs)
-- ========================================

-- Note: Row Level Security policies need to be configured per your app's requirements
-- These are examples - customize based on your access control needs

-- ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.rfq_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.rfq_responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFY: Run these SELECT queries to confirm tables exist
-- ========================================

-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT * FROM public.rfqs LIMIT 1;
-- SELECT * FROM public.vendors LIMIT 1;
-- SELECT * FROM public.rfq_requests LIMIT 1;
-- SELECT * FROM public.rfq_responses LIMIT 1;
