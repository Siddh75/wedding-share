-- Add wedding_data column to users table for storing temporary wedding signup data
ALTER TABLE users ADD COLUMN IF NOT EXISTS wedding_data TEXT;
