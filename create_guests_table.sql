-- Create wedding_guests table for guest management
CREATE TABLE IF NOT EXISTS wedding_guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES users(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  plus_one BOOLEAN DEFAULT FALSE,
  plus_one_name VARCHAR(255),
  rsvp_status VARCHAR(50) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'yes', 'no', 'maybe')),
  dietary_restrictions TEXT,
  invited_by UUID NOT NULL REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wedding_id, guest_email)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_wedding_guests_wedding_id ON wedding_guests(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_guest_email ON wedding_guests(guest_email);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_rsvp_status ON wedding_guests(rsvp_status);

-- Add RLS policies
ALTER TABLE wedding_guests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view guests for their weddings" ON wedding_guests;
DROP POLICY IF EXISTS "Guests can view their own invitations" ON wedding_guests;
DROP POLICY IF EXISTS "Service role can manage all guests" ON wedding_guests;

-- Create policies
CREATE POLICY "Users can view guests for their weddings" ON wedding_guests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = wedding_guests.wedding_id 
      AND (
        weddings.super_admin_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
        OR (current_setting('request.jwt.claims', true)::json->>'sub')::uuid = ANY(weddings.wedding_admin_ids)
      )
    )
  );

CREATE POLICY "Guests can view their own invitations" ON wedding_guests
  FOR SELECT USING (guest_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Service role can manage all guests" ON wedding_guests
  FOR ALL USING (auth.role() = 'service_role');
