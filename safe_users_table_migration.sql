-- Safe migration script for users table to work with Supabase Auth
-- This script preserves all foreign key relationships

-- Step 1: Create a backup of the current users table
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Step 2: Create a new users table with the correct structure
CREATE TABLE IF NOT EXISTS users_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 3: Copy existing data to the new table
-- Note: We'll generate new UUIDs for existing users
INSERT INTO users_new (id, email, name, role, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  email,
  name,
  role,
  is_active,
  created_at,
  updated_at
FROM users_backup;

-- Step 4: Create a mapping table to track old ID to new ID relationships
CREATE TABLE IF NOT EXISTS user_id_mapping (
  old_id text PRIMARY KEY,
  new_id uuid NOT NULL
);

-- Step 5: Populate the mapping table
INSERT INTO user_id_mapping (old_id, new_id)
SELECT 
  u.old_id,
  u_new.id as new_id
FROM users_backup u
JOIN users_new u_new ON u.email = u_new.email;

-- Step 6: Update all foreign key references
-- This will be done in the next steps for each table

-- Step 7: Drop the old users table (after updating all references)
-- DROP TABLE users; -- We'll do this after updating all references

-- Step 8: Rename the new table to users
-- ALTER TABLE users_new RENAME TO users;

-- Step 9: Recreate indexes
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Step 10: Enable RLS
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS policies
-- CREATE POLICY "Users can view their own profile" ON users
--   FOR SELECT USING (auth.uid()::text = id::text);

-- CREATE POLICY "Application admins can view all users" ON users
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE id = auth.uid() and role = 'application_admin'
--     )
--   );

-- CREATE POLICY "Service role can manage all users" ON users
--   FOR ALL USING (auth.role() = 'service_role');

-- IMPORTANT: Before running the final steps, you need to:
-- 1. Update all foreign key references in other tables
-- 2. Test that everything works
-- 3. Then drop the old table and rename the new one

-- To see what needs to be updated, run:
-- SELECT 
--   tc.table_name, 
--   kcu.column_name, 
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM 
--   information_schema.table_constraints AS tc 
--   JOIN information_schema.key_column_usage AS kcu
--     ON tc.constraint_name = kcu.constraint_name
--     AND tc.table_schema = kcu.table_schema
--   JOIN information_schema.constraint_column_usage AS ccu
--     ON ccu.constraint_name = tc.constraint_name
--     AND ccu.table_schema = tc.table_schema
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
--   AND ccu.table_name='users';

