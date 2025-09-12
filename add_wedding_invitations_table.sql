-- Create wedding_invitations table for secure invitation system
CREATE TABLE IF NOT EXISTS wedding_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES users(id),
  UNIQUE(wedding_id, email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wedding_invitations_email ON wedding_invitations(email);
CREATE INDEX IF NOT EXISTS idx_wedding_invitations_status ON wedding_invitations(status);
CREATE INDEX IF NOT EXISTS idx_wedding_invitations_expires_at ON wedding_invitations(expires_at);

-- Add RLS policies (with IF NOT EXISTS to avoid conflicts)
ALTER TABLE wedding_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own invitations" ON wedding_invitations;
DROP POLICY IF EXISTS "Super admins can view invitations for their weddings" ON wedding_invitations;
DROP POLICY IF EXISTS "Service role can manage all invitations" ON wedding_invitations;

-- Create policies
CREATE POLICY "Users can view their own invitations" ON wedding_invitations
  FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Super admins can view invitations for their weddings" ON wedding_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = wedding_invitations.wedding_id 
      AND weddings.super_admin_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
    )
  );

CREATE POLICY "Service role can manage all invitations" ON wedding_invitations
  FOR ALL USING (auth.role() = 'service_role');
