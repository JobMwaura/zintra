-- ==========================================
-- QUICK RUN v2: Copy everything below and paste into Supabase SQL Editor
-- This version fixes the users table issue
-- ==========================================

-- ALTER existing rfqs table - add new management fields
ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS auto_category text,
ADD COLUMN IF NOT EXISTS project_type text,
ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'flexible',
ADD COLUMN IF NOT EXISTS buyer_name text,
ADD COLUMN IF NOT EXISTS buyer_email text,
ADD COLUMN IF NOT EXISTS buyer_phone text,
ADD COLUMN IF NOT EXISTS buyer_reputation text DEFAULT 'new',
ADD COLUMN IF NOT EXISTS services_required jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS material_requirements text,
ADD COLUMN IF NOT EXISTS dimensions jsonb DEFAULT '{"length":"","width":"","height":""}'::jsonb,
ADD COLUMN IF NOT EXISTS quality_preference text,
ADD COLUMN IF NOT EXISTS site_accessibility text,
ADD COLUMN IF NOT EXISTS delivery_preference text,
ADD COLUMN IF NOT EXISTS reference_images jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS spam_score int DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_flag boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS published_at timestamptz,
ADD COLUMN IF NOT EXISTS closed_at timestamptz;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rfqs_validation_status ON public.rfqs(validation_status);
CREATE INDEX IF NOT EXISTS idx_rfqs_user_id ON public.rfqs(user_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_county ON public.rfqs(county);
CREATE INDEX IF NOT EXISTS idx_rfqs_created_at ON public.rfqs(created_at);

-- Create admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text,
  role text default 'admin',
  status text default 'active',
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  features jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Create vendor subscriptions table
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

-- Create RFQ requests table (vendor invitations)
CREATE TABLE IF NOT EXISTS public.rfq_requests (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  vendor_id uuid not null,
  user_id uuid,
  project_title text,
  project_description text,
  status text default 'pending',
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_rfq_requests_rfq_id ON public.rfq_requests(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_requests_vendor_id ON public.rfq_requests(vendor_id);

-- Create RFQ responses table (vendor quotes)
CREATE TABLE IF NOT EXISTS public.rfq_responses (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  vendor_id uuid not null,
  amount numeric(14,2),
  message text,
  attachment_url text,
  status text default 'submitted',
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_rfq_id ON public.rfq_responses(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_vendor_id ON public.rfq_responses(vendor_id);

-- Create reviews table
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

-- Create admin activity log table
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

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text,
  title text,
  body text,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Ensure vendors table has all needed fields
-- (vendors table should already exist from initial setup)
-- This just adds any missing columns if needed
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rating numeric(3,2),
ADD COLUMN IF NOT EXISTS rfqs_completed int DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_time int,
ADD COLUMN IF NOT EXISTS complaints_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active timestamptz;

-- Add vendor table indexes
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON public.vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_county ON public.vendors(county);

-- Create categories table
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

-- Create conversations table (for admin-vendor messaging)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  vendor_id uuid not null,
  subject text,
  last_message_at timestamptz default now(),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON public.conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_vendor_id ON public.conversations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_is_active ON public.conversations(is_active);

-- Create messages table (for admin-vendor communications)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null,
  recipient_id uuid not null,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  body text not null,
  message_type text default 'admin_to_vendor',
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Vendor products table for product listings with images
CREATE TABLE IF NOT EXISTS public.vendor_products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null,
  description text,
  price text,
  category text,
  unit text,
  image_url text,
  status text default 'In Stock',
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor_id ON public.vendor_products(vendor_id);

-- Add offer fields to products
ALTER TABLE public.vendor_products
  ADD COLUMN IF NOT EXISTS sale_price text,
  ADD COLUMN IF NOT EXISTS offer_label text;

-- ==========================================
-- SUCCESS! All tables and columns are ready
-- ==========================================
