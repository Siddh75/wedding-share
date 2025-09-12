-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('guest', 'admin', 'super_admin');
CREATE TYPE media_type AS ENUM ('image', 'video');
CREATE TYPE question_type AS ENUM ('text', 'multiple_choice', 'rating', 'date');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  role user_role DEFAULT 'guest',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weddings table
CREATE TABLE weddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  location TEXT,
  cover_image TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Wedding members table
CREATE TABLE wedding_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'guest',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(wedding_id, user_id)
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media table
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  filename TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type question_type NOT NULL,
  options TEXT[],
  is_required BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers table
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, user_id)
);

-- Invite links table
CREATE TABLE invite_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wedding_id UUID REFERENCES weddings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_weddings_code ON weddings(code);
CREATE INDEX idx_weddings_date ON weddings(date);
CREATE INDEX idx_wedding_members_wedding_id ON wedding_members(wedding_id);
CREATE INDEX idx_wedding_members_user_id ON wedding_members(user_id);
CREATE INDEX idx_media_wedding_id ON media(wedding_id);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_type ON media(type);
CREATE INDEX idx_media_is_approved ON media(is_approved);
CREATE INDEX idx_media_event_id ON media(event_id);
CREATE INDEX idx_events_wedding_id ON events(wedding_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_questions_wedding_id ON questions(wedding_id);
CREATE INDEX idx_questions_order ON questions("order");
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_user_id ON answers(user_id);
CREATE INDEX idx_invite_links_code ON invite_links(code);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_weddings_updated_at BEFORE UPDATE ON weddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invite_links_updated_at BEFORE UPDATE ON invite_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_policy ON users
  FOR UPDATE USING (auth.uid() = id);

-- Weddings policies
CREATE POLICY weddings_select_policy ON weddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = weddings.id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY weddings_insert_policy ON weddings
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY weddings_update_policy ON weddings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = weddings.id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY weddings_delete_policy ON weddings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = weddings.id 
      AND user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Wedding members policies
CREATE POLICY wedding_members_select_policy ON wedding_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM wedding_members wm
      WHERE wm.wedding_id = wedding_members.wedding_id
      AND wm.user_id = auth.uid()
      AND wm.is_active = true
    )
  );

CREATE POLICY wedding_members_insert_policy ON wedding_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = wedding_members.wedding_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Media policies
CREATE POLICY media_select_policy ON media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = media.wedding_id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY media_insert_policy ON media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = media.wedding_id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY media_update_policy ON media
  FOR UPDATE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = media.wedding_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY media_delete_policy ON media
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = media.wedding_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Events policies
CREATE POLICY events_select_policy ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = events.wedding_id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY events_insert_policy ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = events.wedding_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY events_update_policy ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = events.wedding_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY events_delete_policy ON events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = events.wedding_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Questions policies
CREATE POLICY questions_select_policy ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = questions.wedding_id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY questions_insert_policy ON questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = questions.wedding_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Answers policies
CREATE POLICY answers_select_policy ON answers
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = answers.wedding_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY answers_insert_policy ON answers
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = answers.wedding_id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Invite links policies
CREATE POLICY invite_links_select_policy ON invite_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = invite_links.wedding_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY invite_links_insert_policy ON invite_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = invite_links.wedding_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Notifications policies
CREATE POLICY notifications_select_policy ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_insert_policy ON notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create functions for common operations

-- Function to get wedding stats
CREATE OR REPLACE FUNCTION get_wedding_stats(wedding_uuid UUID)
RETURNS TABLE (
  total_photos BIGINT,
  total_videos BIGINT,
  total_guests BIGINT,
  total_events BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(CASE WHEN m.type = 'image' THEN 1 END) as total_photos,
    COUNT(CASE WHEN m.type = 'video' THEN 1 END) as total_videos,
    COUNT(DISTINCT wm.user_id) as total_guests,
    COUNT(DISTINCT e.id) as total_events
  FROM weddings w
  LEFT JOIN media m ON w.id = m.wedding_id
  LEFT JOIN wedding_members wm ON w.id = wm.wedding_id AND wm.is_active = true
  LEFT JOIN events e ON w.id = e.wedding_id AND e.is_active = true
  WHERE w.id = wedding_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search media
CREATE OR REPLACE FUNCTION search_media(
  wedding_uuid UUID,
  search_query TEXT DEFAULT '',
  media_type_filter media_type DEFAULT NULL,
  event_filter UUID DEFAULT NULL,
  tags_filter TEXT[] DEFAULT NULL,
  date_from DATE DEFAULT NULL,
  date_to DATE DEFAULT NULL,
  approved_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  type media_type,
  url TEXT,
  thumbnail_url TEXT,
  filename TEXT,
  size BIGINT,
  mime_type TEXT,
  is_approved BOOLEAN,
  event_id UUID,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  uploaded_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.type,
    m.url,
    m.thumbnail_url,
    m.filename,
    m.size,
    m.mime_type,
    m.is_approved,
    m.event_id,
    m.tags,
    m.created_at,
    m.uploaded_by
  FROM media m
  WHERE m.wedding_id = wedding_uuid
    AND (search_query = '' OR m.filename ILIKE '%' || search_query || '%')
    AND (media_type_filter IS NULL OR m.type = media_type_filter)
    AND (event_filter IS NULL OR m.event_id = event_filter)
    AND (tags_filter IS NULL OR m.tags && tags_filter)
    AND (date_from IS NULL OR DATE(m.created_at) >= date_from)
    AND (date_to IS NULL OR DATE(m.created_at) <= date_to)
    AND (NOT approved_only OR m.is_approved = true)
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

