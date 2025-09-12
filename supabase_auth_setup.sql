-- Create users table with proper structure
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  role user_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for email lookups
create index if not exists idx_users_email on public.users (email);

-- Insert some test users for development
insert into public.users (email, name, role) values
  ('admin@weddingshare.com', 'Application Admin', 'application_admin'),
  ('super@venue.com', 'Super Admin', 'super_admin'),
  ('couple@wedding.com', 'Wedding Admin', 'admin')
on conflict (email) do nothing;

-- Enable Row Level Security
alter table public.users enable row level security;

-- RLS Policies
create policy "Users can view their own profile" on public.users
  for select using (auth.uid()::text = id::text);

create policy "Application admins can view all users" on public.users
  for select using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'application_admin'
    )
  );
