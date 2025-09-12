-- Add email_confirmed column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false;

-- Update existing users to have email_confirmed = true (since they're already using the system)
UPDATE users SET email_confirmed = true WHERE email_confirmed IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_email_confirmed ON users(email_confirmed);

-- Add comment to the column
COMMENT ON COLUMN users.email_confirmed IS 'Whether the user has confirmed their email address';
