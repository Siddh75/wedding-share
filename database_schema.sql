-- Create super_admin_applications table
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

-- Create subscription_plans table
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

-- Create weddings table
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

-- Create wedding_invitations table
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

-- Create media table
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

-- Create events table
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

-- Create questions table
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

-- Create answers table
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  guest_id uuid not null references public.users(id),
  answer text not null,
  created_at timestamptz not null default now()
);

-- Create indexes for better performance
create index if not exists idx_weddings_super_admin on public.weddings(super_admin_id);
create index if not exists idx_weddings_code on public.weddings(code);
create index if not exists idx_media_wedding on public.media(wedding_id);
create index if not exists idx_media_status on public.media(status);
create index if not exists idx_events_wedding on public.events(wedding_id);
create index if not exists idx_questions_wedding on public.questions(wedding_id);
create index if not exists idx_answers_question on public.answers(question_id);

-- Enable RLS on all tables
alter table public.super_admin_applications enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.weddings enable row level security;
alter table public.wedding_invitations enable row level security;
alter table public.media enable row level security;
alter table public.events enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;




