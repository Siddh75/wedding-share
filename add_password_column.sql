-- Add password_hash column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash text;

-- Add index for password lookups (optional)
CREATE INDEX IF NOT EXISTS idx_users_password_hash ON public.users (password_hash) WHERE password_hash IS NOT NULL;

-- Update existing users to have a default password hash (for development)
-- In production, these users should be required to set their own passwords
UPDATE public.users 
SET password_hash = '$2b$10$default.hash.for.development.users.only'
WHERE password_hash IS NULL;

