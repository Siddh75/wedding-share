-- Corrected Database Setup for WeddingShare
-- Run this in your Supabase SQL Editor

-- Step 1: Add application_admin to user_role enum (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('guest', 'admin', 'super_admin', 'application_admin');
    ELSIF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role') AND enumlabel = 'application_admin') THEN
        ALTER TYPE user_role ADD VALUE 'application_admin';
    END IF;
END $$;

-- Step 2: Drop existing tables if they exist (to ensure clean slate)
DROP TABLE IF EXISTS public.answers CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.media CASCADE;
DROP TABLE IF EXISTS public.wedding_invitations CASCADE;
DROP TABLE IF EXISTS public.weddings CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.super_admin_applications CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 3: Create users table
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'guest',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 4: Create super_admin_applications table
CREATE TABLE public.super_admin_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  business_type text NOT NULL CHECK (business_type IN ('venue', 'photography_studio', 'event_planner', 'other')),
  contact_person text NOT NULL,
  email text NOT NULL,
  phone text,
  website text,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_verified boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id),
  trial_end_date timestamptz
);

-- Step 5: Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  duration text NOT NULL CHECK (duration IN ('monthly', 'yearly', 'lifetime')),
  target_users text[] NOT NULL,
  features jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_popular boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 6: Create weddings table
CREATE TABLE public.weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  location text NOT NULL,
  description text,
  code text UNIQUE NOT NULL,
  super_admin_id uuid NOT NULL REFERENCES public.users(id),
  wedding_admin_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  subscription_plan_id uuid REFERENCES public.subscription_plans(id),
  features jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 7: Create wedding_invitations table
CREATE TABLE public.wedding_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  role text NOT NULL CHECK (role IN ('bride', 'groom', 'wedding_admin')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  signup_link text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Step 8: Create media table
CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.users(id),
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 9: Create events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  date date NOT NULL,
  time time,
  location text,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 10: Create questions table
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  question text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('text', 'multiple_choice', 'rating', 'yes_no')),
  options jsonb,
  is_required boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 11: Create answers table
CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES public.users(id),
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Step 12: Create indexes for better performance
CREATE INDEX idx_weddings_super_admin ON public.weddings(super_admin_id);
CREATE INDEX idx_weddings_code ON public.weddings(code);
CREATE INDEX idx_media_wedding ON public.media(wedding_id);
CREATE INDEX idx_media_status ON public.media(status);
CREATE INDEX idx_events_wedding ON public.events(wedding_id);
CREATE INDEX idx_questions_wedding ON public.questions(wedding_id);
CREATE INDEX idx_answers_question ON public.answers(question_id);

-- Step 13: Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Step 14: Insert test data
-- Test users
INSERT INTO public.users (email, name, role) VALUES
  ('admin@weddingshare.com', 'Application Admin', 'application_admin'),
  ('super@venue.com', 'Super Admin', 'super_admin'),
  ('couple@wedding.com', 'Wedding Admin', 'admin');

-- Test subscription plans
INSERT INTO public.subscription_plans (name, description, price, duration, target_users, features, is_popular) VALUES
  ('Free Trial', '14-day free trial for new venues', 0.00, 'monthly', ARRAY['super_admin'], '{"max_weddings": 1, "max_guests": 50, "max_photos": 100, "features": ["basic_gallery", "guest_upload"]}', false),
  ('Starter', 'Perfect for small venues', 29.99, 'monthly', ARRAY['super_admin'], '{"max_weddings": 5, "max_guests": 200, "max_photos": 1000, "features": ["basic_gallery", "guest_upload", "questionnaire", "events"]}', false),
  ('Professional', 'Most popular choice', 79.99, 'monthly', ARRAY['super_admin'], '{"max_weddings": 20, "max_guests": 500, "max_photos": 5000, "features": ["basic_gallery", "guest_upload", "questionnaire", "events", "advanced_analytics", "priority_support"]}', true),
  ('Enterprise', 'For large photography studios', 199.99, 'monthly', ARRAY['super_admin'], '{"max_weddings": -1, "max_guests": -1, "max_photos": -1, "features": ["basic_gallery", "guest_upload", "questionnaire", "events", "advanced_analytics", "priority_support", "custom_branding", "api_access"]}', false);

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
WHERE u.email = 'super@venue.com' AND u.role = 'super_admin';

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
WHERE u.email = 'super@venue.com' AND u.role = 'super_admin';

-- Test super admin application
INSERT INTO public.super_admin_applications (business_name, business_type, contact_person, email, phone, website, description, status) VALUES
  ('Central Park Gardens', 'venue', 'John Smith', 'john@centralparkgardens.com', '+1-555-0123', 'https://centralparkgardens.com', 'Beautiful outdoor wedding venue in the heart of the city', 'pending');




