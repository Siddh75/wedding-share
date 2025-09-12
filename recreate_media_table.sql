-- Drop and recreate media table
DROP TABLE IF EXISTS media CASCADE;

CREATE TABLE media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    description TEXT,
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    cloudinary_public_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_media_wedding_id ON media(wedding_id);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_status ON media(status);
CREATE INDEX idx_media_created_at ON media(created_at);

-- Add RLS policies
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Allow users to view media for weddings they have access to
CREATE POLICY "Users can view media for accessible weddings" ON media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM weddings w
            WHERE w.id = media.wedding_id
            AND (
                w.super_admin_id = auth.uid() OR
                w.wedding_admin_ids @> ARRAY[auth.uid()]::UUID[] OR
                EXISTS (
                    SELECT 1 FROM wedding_invitations wi
                    WHERE wi.wedding_id = w.id AND wi.guest_id = auth.uid()
                )
            )
        )
    );

-- Allow super admins and wedding admins to insert media
CREATE POLICY "Super admins and wedding admins can insert media" ON media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM weddings w
            WHERE w.id = media.wedding_id
            AND (
                w.super_admin_id = auth.uid() OR
                w.wedding_admin_ids @> ARRAY[auth.uid()]::UUID[]
            )
        )
    );

-- Allow users to update their own media or if they're wedding admin
CREATE POLICY "Users can update accessible media" ON media
    FOR UPDATE USING (
        uploaded_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM weddings w
            WHERE w.id = media.wedding_id
            AND (
                w.super_admin_id = auth.uid() OR
                w.wedding_admin_ids @> ARRAY[auth.uid()]::UUID[]
            )
        )
    );

-- Allow users to delete their own media or if they're wedding admin
CREATE POLICY "Users can delete accessible media" ON media
    FOR DELETE USING (
        uploaded_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM weddings w
            WHERE w.id = media.wedding_id
            AND (
                w.super_admin_id = auth.uid() OR
                w.wedding_admin_ids @> ARRAY[auth.uid()]::UUID[]
            )
        )
    );




