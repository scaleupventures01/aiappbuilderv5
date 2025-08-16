-- Migration: Create uploads table for storing image upload metadata
-- Run with: psql -d your_database -f create-uploads-table.sql

-- Drop table if exists (for development only)
-- DROP TABLE IF EXISTS uploads CASCADE;

-- Create uploads table for storing image upload metadata
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL UNIQUE,
  original_filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  secure_url TEXT NOT NULL,
  thumbnail_url TEXT,
  context VARCHAR(50) DEFAULT 'chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_conversation_id ON uploads(conversation_id);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_uploads_context ON uploads(context);
CREATE INDEX IF NOT EXISTS idx_uploads_cloudinary_public_id ON uploads(cloudinary_public_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_uploads_updated_at ON uploads;
CREATE TRIGGER update_uploads_updated_at BEFORE UPDATE
    ON uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE uploads IS 'Stores metadata for uploaded images processed through Cloudinary';
COMMENT ON COLUMN uploads.id IS 'Unique identifier for the upload';
COMMENT ON COLUMN uploads.user_id IS 'Reference to the user who uploaded the image';
COMMENT ON COLUMN uploads.conversation_id IS 'Optional reference to the conversation where image was uploaded';
COMMENT ON COLUMN uploads.cloudinary_public_id IS 'Unique identifier in Cloudinary storage';
COMMENT ON COLUMN uploads.original_filename IS 'Original name of the uploaded file';
COMMENT ON COLUMN uploads.file_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN uploads.file_size IS 'Size of the file in bytes';
COMMENT ON COLUMN uploads.secure_url IS 'HTTPS URL to access the image';
COMMENT ON COLUMN uploads.thumbnail_url IS 'URL for the thumbnail version of the image';
COMMENT ON COLUMN uploads.context IS 'Context of the upload (chat, profile, analysis, etc.)';
COMMENT ON COLUMN uploads.created_at IS 'Timestamp when the upload was created';
COMMENT ON COLUMN uploads.updated_at IS 'Timestamp when the upload record was last updated';

-- Verify table creation
\d uploads;

-- Show indexes
\di uploads;

-- Confirmation
SELECT 'uploads table created successfully' AS status;