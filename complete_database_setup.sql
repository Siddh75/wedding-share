-- Complete Database Setup for WeddingShare
-- Run this in your Supabase SQL Editor

-- Step 1: Add application_admin to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'application_admin';

-- Step 2: Create users table (if not exists)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  role user_role not null default 'guest',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Step 3: Create super_admin_applications table
create table if not exists public.super_admin_applications (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  business_type text not null check (business_type in ('venue', 'photography_studio', 'event_planner', 'other')),
  contact_person text not null,
  email text not null,
  phone text,
  website text,
  description text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  payment_verified boolean not null default false,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id),
  trial_end_date timestamptz
);

-- Step 4: Create subscription_plans table
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price decimal(10,2) not null,
  duration text not null check (duration in ('monthly', 'yearly', 'lifetime')),
  target_users text[] not null,
  features jsonb not null,
  is_active boolean not null default true,
  is_popular boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Step 5: Create weddings table
create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  location text not null,
  description text,
  code text unique not null,
  super_admin_id uuid not null references public.users(id),
  wedding_admin_ids uuid[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'archived')),
  subscription_plan_id uuid references public.subscription_plans(id),
  features jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Step 6: Create wedding_invitations table
create table if not exists public.wedding_invitations (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  email text not null,
  name text,
  role text not null check (role in ('bride', 'groom', 'wedding_admin')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  signup_link text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Step 7: Create media table
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  uploaded_by uuid not null references public.users(id),
  file_url text not null,
  file_name text not null,
  file_type text not null,
  file_size integer not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Step 8: Create events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  description text,
  date date not null,
  time time,
  location text,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Step 9: Create questions table
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  question text not null,
  question_type text not null check (question_type in ('text', 'multiple_choice', 'rating', 'yes_no')),
  options jsonb,
  is_required boolean not null default false,
  order_index integer not null default 0,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Step 10: Create answers table
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  guest_id uuid not null references public.users(id),
  answer text not null,
  created_at timestamptz not null default now()
);

-- Step 11: Create indexes for better performance
create index if not exists idx_weddings_super_admin on public.weddings(super_admin_id);
create index if not exists idx_weddings_code on public.weddings(code);
create index if not exists idx_media_wedding on public.media(wedding_id);
create index if not exists idx_media_status on public.media(status);
create index if not exists idx_events_wedding on public.events(wedding_id);
create index if not exists idx_questions_wedding on public.questions(wedding_id);
create index if not exists idx_answers_question on public.answers(question_id);

-- Step 12: Enable RLS on all tables
alter table public.users enable row level security;
alter table public.super_admin_applications enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.weddings enable row level security;
alter table public.wedding_invitations enable row level security;
alter table public.media enable row level security;
alter table public.events enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;

-- Step 13: Insert test data
-- Test users
INSERT INTO public.users (email, name, role) VALUES
  ('admin@weddingshare.com', 'Application Admin', 'application_admin'),
  ('super@venue.com', 'Super Admin', 'super_admin'),
  ('couple@wedding.com', 'Wedding Admin', 'admin')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Test subscription plans
INSERT INTO public.subscription_plans (name, description, price, duration, target_users, features, is_popular) VALUES
  ('Free Trial', '14-day free trial for new venues', 0.00, 'monthly', ARRAY['super_admin'], '{"max_weddings": 1, "max_guests": 50, "max_photos": 100, "features": ["basic_gallery", "guest_upload"]}', false),
  ('Starter', 'Perfect for small venues', 29.99, 'monthly', ARRAY['super_admin'], '{"max_weddings": 5, "max_guests": 200, "max_photos": 1000, "features": ["basic_gallery", "guest_upload", "questionnaire", "events"]}', false),
  ('Professional', 'Most popular choice', 79.99, 'monthly', ARRAY['super_admin'], '{"max_weddings": 20, "max_guests": 500, "max_photos": 5000, "features": ["basic_gallery", "guest_upload", "questionnaire", "events", "advanced_analytics", "priority_support"]}', true),
  ('Enterprise', 'For large photography studios', 199.99, 'monthly', ARRAY['super_admin'], '{"max_weddings": -1, "max_guests": -1, "max_photos": -1, "features": ["basic_gallery", "guest_upload", "questionnaire", "events", "advanced_analytics", "priority_support", "custom_branding", "api_access"]}', false)
ON CONFLICT DO NOTHING;

-- Test weddings (only if super admin exists)
INSERT INTO public.weddings (name, date, location, description, code, super_admin_id, status) 
SELECT 
  'Sarah & John Wedding',
  '2024-06-15',
  'Central Park Gardens',
  'A beautiful summer wedding celebration',
  'SARAHJOHN2024',
  u.id,
  'active'
FROM public.users u 
WHERE u.email = 'super@venue.com' AND u.role = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.weddings (name, date, location, description, code, super_admin_id, status) 
SELECT 
  'Emily & Michael Wedding',
  '2024-07-20',
  'Beachfront Resort',
  'Beach wedding with sunset ceremony',
  'EMILYMIKE2024',
  u.id,
  'draft'
FROM public.users u 
WHERE u.email = 'super@venue.com' AND u.role = 'super_admin'
ON CONFLICT DO NOTHING;

-- Test super admin application
INSERT INTO public.super_admin_applications (business_name, business_type, contact_person, email, phone, website, description, status) VALUES
  ('Central Park Gardens', 'venue', 'John Smith', 'john@centralparkgardens.com', '+1-555-0123', 'https://centralparkgardens.com', 'Beautiful outdoor wedding venue in the heart of the city', 'pending')
ON CONFLICT DO NOTHING;




