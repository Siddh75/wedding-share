-- Add subdomain field to weddings table
ALTER TABLE weddings ADD COLUMN subdomain TEXT UNIQUE;

-- Create index for subdomain lookups
CREATE INDEX idx_weddings_subdomain ON weddings(subdomain);

-- Update existing weddings with generated subdomains
-- This will create subdomains based on wedding names (sanitized)
UPDATE weddings 
SET subdomain = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), 
    '\s+', '-', 'g'
  )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE subdomain IS NULL;

-- Add constraint to ensure subdomain format
ALTER TABLE weddings ADD CONSTRAINT check_subdomain_format 
CHECK (subdomain ~ '^[a-z0-9-]+$' AND LENGTH(subdomain) >= 3 AND LENGTH(subdomain) <= 50);

-- Add RLS policy for subdomain access
CREATE POLICY weddings_subdomain_select_policy ON weddings
  FOR SELECT USING (subdomain IS NOT NULL);
