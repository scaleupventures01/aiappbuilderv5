-- Migration: Create files table for file metadata storage
-- Version: 002
-- Description: Creates the files table to store metadata for uploaded files (Cloudinary integration)
-- Dependencies: 001_create_users_table.sql

-- Create files table
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    
    -- File identification
    public_id VARCHAR(255) NOT NULL UNIQUE,
    original_filename VARCHAR(500) NOT NULL,
    sanitized_filename VARCHAR(500) NOT NULL,
    
    -- Cloudinary metadata
    cloudinary_url TEXT NOT NULL,
    secure_url TEXT NOT NULL,
    
    -- File properties
    file_size INTEGER NOT NULL CHECK (file_size > 0),
    mime_type VARCHAR(100) NOT NULL,
    file_format VARCHAR(20) NOT NULL,
    resource_type VARCHAR(20) NOT NULL DEFAULT 'image',
    
    -- Image-specific metadata (nullable for non-images)
    width INTEGER,
    height INTEGER,
    
    -- File categorization
    upload_type VARCHAR(50) NOT NULL DEFAULT 'general',
    category VARCHAR(100) DEFAULT 'uncategorized',
    folder_path VARCHAR(300),
    
    -- User and context information
    uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    upload_ip INET,
    
    -- Business context
    trade_id INTEGER, -- Foreign key to trades table (when implemented)
    conversation_id INTEGER, -- Foreign key to conversations table (when implemented)
    description TEXT,
    tags TEXT[], -- Array of tags for categorization
    
    -- Upload metadata
    upload_source VARCHAR(50) DEFAULT 'web_app',
    client_metadata JSONB DEFAULT '{}',
    
    -- Processing status
    processing_status VARCHAR(20) DEFAULT 'completed' CHECK (
        processing_status IN ('uploaded', 'processing', 'completed', 'failed', 'deleted')
    ),
    
    -- Security and compliance
    virus_scan_status VARCHAR(20) DEFAULT 'pending' CHECK (
        virus_scan_status IN ('pending', 'clean', 'infected', 'error')
    ),
    virus_scan_result JSONB DEFAULT '{}',
    
    -- Access control
    is_public BOOLEAN DEFAULT false,
    access_level VARCHAR(20) DEFAULT 'private' CHECK (
        access_level IN ('private', 'shared', 'public')
    ),
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    
    -- Version control
    version INTEGER DEFAULT 1,
    parent_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_public_id ON files(public_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_upload_type ON files(upload_type);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_processing_status ON files(processing_status);
CREATE INDEX IF NOT EXISTS idx_files_virus_scan_status ON files(virus_scan_status);
CREATE INDEX IF NOT EXISTS idx_files_trade_id ON files(trade_id) WHERE trade_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_conversation_id ON files(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON files(deleted_at) WHERE deleted_at IS NULL;

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_files_user_type_created ON files(uploaded_by, upload_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_user_active ON files(uploaded_by, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_files_public_active ON files(is_public, deleted_at) WHERE is_public = true AND deleted_at IS NULL;

-- Create GIN index for tags array and client_metadata JSONB
CREATE INDEX IF NOT EXISTS idx_files_tags ON files USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_files_client_metadata ON files USING GIN(client_metadata);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_files_updated_at();

-- Create file statistics view
CREATE OR REPLACE VIEW file_stats AS
SELECT 
    upload_type,
    COUNT(*) as total_files,
    SUM(file_size) as total_size,
    AVG(file_size) as avg_size,
    MIN(created_at) as first_upload,
    MAX(created_at) as last_upload,
    COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_files,
    COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_files
FROM files
GROUP BY upload_type;

-- Create user file statistics view
CREATE OR REPLACE VIEW user_file_stats AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(f.id) as total_files,
    SUM(f.file_size) as total_storage_used,
    COUNT(CASE WHEN f.upload_type = 'avatar' THEN 1 END) as avatar_count,
    COUNT(CASE WHEN f.upload_type = 'trade_screenshot' THEN 1 END) as trade_screenshot_count,
    COUNT(CASE WHEN f.upload_type = 'document' THEN 1 END) as document_count,
    MAX(f.created_at) as last_upload_at
FROM users u
LEFT JOIN files f ON u.id = f.uploaded_by AND f.deleted_at IS NULL
GROUP BY u.id, u.email;

-- Add constraints for file size limits based on type
ALTER TABLE files ADD CONSTRAINT check_avatar_size 
    CHECK (upload_type != 'avatar' OR file_size <= 2097152); -- 2MB for avatars

ALTER TABLE files ADD CONSTRAINT check_image_size 
    CHECK (upload_type NOT IN ('image', 'trade_screenshot') OR file_size <= 5242880); -- 5MB for images

ALTER TABLE files ADD CONSTRAINT check_document_size 
    CHECK (upload_type != 'document' OR file_size <= 10485760); -- 10MB for documents

-- Add constraint for valid upload types
ALTER TABLE files ADD CONSTRAINT check_upload_type_valid
    CHECK (upload_type IN (
        'avatar', 'image', 'trade_screenshot', 'document', 
        'profile_image', 'trading_plan', 'general'
    ));

-- Add constraint for valid MIME types
ALTER TABLE files ADD CONSTRAINT check_mime_type_valid
    CHECK (mime_type IN (
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ));

-- Create function to cleanup soft-deleted files
CREATE OR REPLACE FUNCTION cleanup_deleted_files(older_than_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Permanently delete files that have been soft-deleted for more than specified days
    DELETE FROM files 
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < CURRENT_TIMESTAMP - (older_than_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    INSERT INTO file_cleanup_log (cleanup_date, files_deleted, older_than_days)
    VALUES (CURRENT_TIMESTAMP, deleted_count, older_than_days);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create cleanup log table
CREATE TABLE IF NOT EXISTS file_cleanup_log (
    id SERIAL PRIMARY KEY,
    cleanup_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    files_deleted INTEGER NOT NULL,
    older_than_days INTEGER NOT NULL
);

-- Create function to get file storage quota usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_id INTEGER)
RETURNS TABLE (
    total_files BIGINT,
    total_size BIGINT,
    size_by_type JSONB,
    quota_percentage DECIMAL
) AS $$
DECLARE
    user_quota BIGINT := 1073741824; -- 1GB default quota
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(f.id) as total_files,
        COALESCE(SUM(f.file_size), 0) as total_size,
        COALESCE(
            jsonb_object_agg(
                f.upload_type, 
                jsonb_build_object(
                    'count', COUNT(*),
                    'size', SUM(f.file_size)
                )
            ),
            '{}'::jsonb
        ) as size_by_type,
        ROUND((COALESCE(SUM(f.file_size), 0) * 100.0 / user_quota), 2) as quota_percentage
    FROM files f
    WHERE f.uploaded_by = user_id AND f.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE files IS 'Stores metadata for all uploaded files integrated with Cloudinary';
COMMENT ON COLUMN files.public_id IS 'Cloudinary public ID for the file';
COMMENT ON COLUMN files.cloudinary_url IS 'Original Cloudinary URL';
COMMENT ON COLUMN files.secure_url IS 'HTTPS Cloudinary URL';
COMMENT ON COLUMN files.upload_type IS 'Category of upload (avatar, trade_screenshot, document, etc.)';
COMMENT ON COLUMN files.processing_status IS 'Current processing status of the file';
COMMENT ON COLUMN files.virus_scan_status IS 'Result of virus scanning';
COMMENT ON COLUMN files.tags IS 'Array of tags for file categorization and search';
COMMENT ON COLUMN files.client_metadata IS 'Additional metadata from client application';
COMMENT ON COLUMN files.deleted_at IS 'Timestamp for soft delete, NULL means file is active';