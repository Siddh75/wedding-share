-- Check existing tables and their structure
-- Run this in your Supabase SQL Editor to see what we're working with

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'weddings', 'super_admin_applications', 'subscription_plans', 'media', 'events', 'questions', 'answers', 'wedding_invitations');

-- Check the structure of the weddings table if it exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'weddings'
ORDER BY ordinal_position;

-- Check if user_role enum exists and what values it has
SELECT unnest(enum_range(NULL::user_role)) as enum_values;




