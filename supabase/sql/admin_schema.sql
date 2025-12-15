-- Minimal schema to support admin dashboard, subscriptions, and RFQ flows.
-- Run this on your Supabase/Postgres instance (adjust schema/column types as needed).

-- Admin users table
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text,
  role text default 'admin',
  status text default 'active',
  created_at timestamptz default now()
);
create index if not exists idx_admin_users_user_id on public.admin_users(user_id);

-- Subscription plans
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  features jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Vendor subscriptions
create table if not exists public.vendor_subscriptions (
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
create index if not exists idx_vendor_subscriptions_user_id on public.vendor_subscriptions(user_id);
create index if not exists idx_vendor_subscriptions_vendor_id on public.vendor_subscriptions(vendor_id);
create index if not exists idx_vendor_subscriptions_status on public.vendor_subscriptions(status);

-- RFQs
create table if not exists public.rfqs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  budget_range text,
  timeline text,
  location text,
  county text,
  status text default 'pending', -- pending|open|closed|rejected
  user_id uuid, -- buyer user id
  buyer_id uuid, -- alias
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_rfqs_status on public.rfqs(status);
create index if not exists idx_rfqs_category on public.rfqs(category);

-- RFQ requests (invites to vendors)
create table if not exists public.rfq_requests (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  vendor_id uuid not null, -- points to vendor.user_id (or vendor id if aligned)
  user_id uuid, -- buyer
  status text default 'pending', -- pending|accepted|declined|expired
  created_at timestamptz default now()
);
create index if not exists idx_rfq_requests_rfq_id on public.rfq_requests(rfq_id);
create index if not exists idx_rfq_requests_vendor_id on public.rfq_requests(vendor_id);

-- RFQ responses (quotes from vendors)
create table if not exists public.rfq_responses (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  vendor_id uuid not null,
  amount numeric(14,2),
  message text,
  attachment_url text,
  status text default 'submitted', -- submitted|accepted|declined
  created_at timestamptz default now()
);
create index if not exists idx_rfq_responses_rfq_id on public.rfq_responses(rfq_id);
create index if not exists idx_rfq_responses_vendor_id on public.rfq_responses(vendor_id);

-- Reviews (for vendor profile + responses)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null,
  author text,
  rating int,
  comment text,
  vendor_response text,
  responded_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_reviews_vendor_id on public.reviews(vendor_id);

-- Optional: activity log for admin feed
create table if not exists public.admin_activity (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action text,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_admin_activity_created_at on public.admin_activity(created_at);
