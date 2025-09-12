-- Update users table to work with Supabase Auth
-- This script makes the users table compatible with Supabase Auth UUIDs

-- First, backup existing data (optional)
-- CREATE TABLE users_backup AS SELECT * FROM users;

-- Drop existing constraints
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;

-- Change id column to UUID type
ALTER TABLE public.users ALTER COLUMN id TYPE uuid USING id::uuid;

-- Recreate primary key
ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Recreate unique email constraint
ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);

-- Update the default value for id to use gen_random_uuid()
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Ensure the table has proper RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Application admins can view all users" ON public.users;

-- Create new RLS policies for Supabase Auth
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Application admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() and role = 'application_admin'
    )
  );

-- Allow service role to manage all users
CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default users with proper UUIDs (optional - only if needed)
-- INSERT INTO public.users (id, email, name, role) VALUES
--   (gen_random_uuid(), 'admin@weddingshare.com', 'Application Admin', 'application_admin'),
--   (gen_random_uuid(), 'super@venue.com', 'Super Admin', 'super_admin'),
--   (gen_random_uuid(), 'couple@wedding.com', 'Wedding Admin', 'admin')
-- ON CONFLICT (email) DO NOTHING;

