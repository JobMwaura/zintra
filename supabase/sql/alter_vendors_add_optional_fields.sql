-- Add optional profile fields for vendor UI
-- Run this on your Supabase/Postgres instance.

alter table if exists public.vendors
  add column if not exists logo_url text,
  add column if not exists business_hours jsonb default '[]'::jsonb,
  add column if not exists locations text[] default '{}'::text[],
  add column if not exists highlights jsonb default '[]'::jsonb,
  add column if not exists certifications text[] default '{}'::text[],
  add column if not exists phone_verified boolean default false,
  add column if not exists phone_verified_at timestamp with time zone;

comment on column public.vendors.business_hours is 'Array of objects: [{day: string, hours: string}]';
comment on column public.vendors.locations is 'List of additional location strings';
comment on column public.vendors.highlights is 'Reasons to choose this vendor (array of strings)';
comment on column public.vendors.certifications is 'Certification names (array of strings)';
comment on column public.vendors.phone_verified is 'Flag indicating if phone number has been verified via OTP';
comment on column public.vendors.phone_verified_at is 'Timestamp when phone was verified';
