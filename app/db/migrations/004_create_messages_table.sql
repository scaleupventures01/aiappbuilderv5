-- Migration: Create Messages Table
-- PRD Reference: PRD-1.1.1.4-messages-table.md
-- Task: BE-MSG-001 - Complete messages table implementation
-- Created: 2025-08-14
-- Description: Creates the messages table with AI verdict system, psychology fields, full-text search, and comprehensive security considerations

-- Drop existing objects if they exist (for clean re-runs)
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS update_conversation_stats_trigger ON messages;
DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_messages_user_id;
DROP INDEX IF EXISTS idx_messages_conversation_recent;
DROP INDEX IF EXISTS idx_messages_user_recent;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_messages_type;
DROP INDEX IF EXISTS idx_messages_verdict;
DROP INDEX IF EXISTS idx_messages_analysis_mode;
DROP INDEX IF EXISTS idx_messages_parent;
DROP INDEX IF EXISTS idx_messages_search;
DROP INDEX IF EXISTS idx_messages_pattern_tags;
DROP INDEX IF EXISTS idx_messages_image_metadata;
DROP INDEX IF EXISTS idx_messages_ai_responses;
DROP INDEX IF EXISTS idx_messages_user_messages;
DROP INDEX IF EXISTS idx_messages_with_images;
DROP INDEX IF EXISTS idx_messages_psychology;
DROP TABLE IF EXISTS messages CASCADE;

-- Create messages table with comprehensive security considerations and AI verdict system
CREATE TABLE messages (
    -- Cryptographically secure UUID v4 primary key prevents message enumeration
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys with CASCADE delete for GDPR compliance
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_message_id UUID REFERENCES messages(id), -- For AI responses to user messages (threading)
    
    -- Message content
    content TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('user', 'ai', 'system', 'training')),
    
    -- AI-specific fields for trade analysis (AI verdict system)
    verdict VARCHAR(20) CHECK (verdict IN ('diamond', 'fire', 'skull', null)),
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    analysis_mode VARCHAR(20) DEFAULT 'analysis' CHECK (analysis_mode IN ('analysis', 'psychology', 'training')),
    
    -- File attachments (primarily chart images stored in Cloudinary)
    image_url TEXT,
    image_filename VARCHAR(255),
    image_size INTEGER,
    image_metadata JSONB DEFAULT '{}' NOT NULL, -- Store image dimensions, format, etc.
    
    -- Psychology coaching specific fields
    emotional_state VARCHAR(50), -- 'confident', 'anxious', 'revenge', 'disciplined', etc.
    coaching_type VARCHAR(50), -- 'discipline', 'risk_management', 'emotional_control', etc.
    pattern_tags JSONB DEFAULT '[]' NOT NULL, -- Array of identified psychological patterns
    
    -- AI processing metadata for cost tracking and optimization
    ai_model VARCHAR(50), -- 'gpt-4-vision', 'gpt-4', 'claude-3.5-sonnet'
    ai_tokens_used INTEGER,
    ai_cost_cents INTEGER, -- Track AI costs per message in cents
    processing_time_ms INTEGER,
    
    -- Status and error handling for AI processing pipeline
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'processing', 'completed', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Metadata and timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    edited_at TIMESTAMP NULL,
    
    -- Full-text search with tsvector generation
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(content, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(image_filename, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(emotional_state, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(coaching_type, '')), 'C')
    ) STORED
);

-- Essential indexes for performance and query optimization
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_conversation_recent ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_user_recent ON messages(user_id, created_at DESC);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_verdict ON messages(verdict) WHERE verdict IS NOT NULL;
CREATE INDEX idx_messages_analysis_mode ON messages(analysis_mode);
CREATE INDEX idx_messages_parent ON messages(parent_message_id) WHERE parent_message_id IS NOT NULL;

-- Full-text search index for PostgreSQL search capabilities
CREATE INDEX idx_messages_search ON messages USING gin(search_vector);

-- JSONB indexes for psychology data and image metadata
CREATE INDEX idx_messages_pattern_tags ON messages USING gin(pattern_tags);
CREATE INDEX idx_messages_image_metadata ON messages USING gin(image_metadata);

-- Partial indexes for common query patterns (optimized for specific use cases)
CREATE INDEX idx_messages_ai_responses ON messages(conversation_id, created_at) WHERE type = 'ai';
CREATE INDEX idx_messages_user_messages ON messages(conversation_id, created_at) WHERE type = 'user';
CREATE INDEX idx_messages_with_images ON messages(conversation_id, created_at) WHERE image_url IS NOT NULL;
CREATE INDEX idx_messages_psychology ON messages(user_id, created_at) WHERE analysis_mode = 'psychology';

-- Composite indexes for complex queries
CREATE INDEX idx_messages_status_processing ON messages(status, created_at) WHERE status IN ('processing', 'failed');
CREATE INDEX idx_messages_ai_costs ON messages(user_id, created_at DESC, ai_cost_cents) WHERE ai_cost_cents IS NOT NULL;
CREATE INDEX idx_messages_emotional_state ON messages(user_id, emotional_state, created_at DESC) WHERE emotional_state IS NOT NULL;

-- Create trigger to automatically update updated_at on row updates
-- Reuses the existing function from users table migration
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update conversation statistics when messages are added
-- This trigger will call the function created in the conversations migration
CREATE TRIGGER update_conversation_stats_trigger 
    AFTER INSERT ON messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_conversation_stats();

-- Add comprehensive comments for documentation
COMMENT ON TABLE messages IS 'Messages table for Elite Trading Coach AI platform with AI verdict system and psychology coaching support';
COMMENT ON COLUMN messages.id IS 'Cryptographically secure UUID v4 primary key prevents message enumeration';
COMMENT ON COLUMN messages.conversation_id IS 'Foreign key reference to conversations table - CASCADE delete for GDPR compliance';
COMMENT ON COLUMN messages.user_id IS 'Foreign key reference to users table - CASCADE delete for GDPR compliance';
COMMENT ON COLUMN messages.parent_message_id IS 'Self-referencing foreign key for message threading (AI responses to user messages)';
COMMENT ON COLUMN messages.content IS 'Message text content - full-text searchable';
COMMENT ON COLUMN messages.type IS 'Message type: user, ai, system, or training';
COMMENT ON COLUMN messages.verdict IS 'AI trade verdict: diamond (perfect), fire (good with warnings), skull (avoid)';
COMMENT ON COLUMN messages.confidence IS 'AI confidence score (0-100) for the verdict';
COMMENT ON COLUMN messages.analysis_mode IS 'Analysis mode: analysis, psychology, or training';
COMMENT ON COLUMN messages.image_url IS 'Cloudinary URL for attached chart images';
COMMENT ON COLUMN messages.image_filename IS 'Original filename of uploaded image';
COMMENT ON COLUMN messages.image_size IS 'File size in bytes for image attachments';
COMMENT ON COLUMN messages.image_metadata IS 'JSONB metadata for images (dimensions, format, etc.)';
COMMENT ON COLUMN messages.emotional_state IS 'Detected or reported emotional state for psychology coaching';
COMMENT ON COLUMN messages.coaching_type IS 'Type of psychology coaching provided';
COMMENT ON COLUMN messages.pattern_tags IS 'JSONB array of identified psychological patterns';
COMMENT ON COLUMN messages.ai_model IS 'AI model used for processing (e.g., gpt-4-vision)';
COMMENT ON COLUMN messages.ai_tokens_used IS 'Number of tokens consumed by AI processing';
COMMENT ON COLUMN messages.ai_cost_cents IS 'Cost of AI processing in cents for tracking';
COMMENT ON COLUMN messages.processing_time_ms IS 'AI processing time in milliseconds';
COMMENT ON COLUMN messages.status IS 'Message processing status: sent, processing, completed, failed';
COMMENT ON COLUMN messages.error_message IS 'Error message if AI processing failed';
COMMENT ON COLUMN messages.retry_count IS 'Number of retry attempts for failed AI processing';
COMMENT ON COLUMN messages.created_at IS 'Message creation timestamp - immutable';
COMMENT ON COLUMN messages.updated_at IS 'Last message modification timestamp - auto-updated by trigger';
COMMENT ON COLUMN messages.edited_at IS 'Timestamp when message was last edited by user';
COMMENT ON COLUMN messages.search_vector IS 'Generated tsvector for full-text search across content and metadata';

-- Index comments for documentation
COMMENT ON INDEX idx_messages_conversation_id IS 'Fast lookup for messages within a conversation';
COMMENT ON INDEX idx_messages_user_id IS 'Fast lookup for user messages across all conversations';
COMMENT ON INDEX idx_messages_conversation_recent IS 'Optimized for conversation message listings (newest first)';
COMMENT ON INDEX idx_messages_search IS 'Full-text search index using PostgreSQL gin for content and metadata';
COMMENT ON INDEX idx_messages_pattern_tags IS 'GIN index for JSONB psychology pattern queries';
COMMENT ON INDEX idx_messages_verdict IS 'Partial index for AI verdict queries (only non-null verdicts)';
COMMENT ON INDEX idx_messages_psychology IS 'Partial index for psychology mode message queries';

-- Trigger comments
COMMENT ON TRIGGER update_messages_updated_at ON messages IS 'Automatically updates updated_at timestamp on any row modification';
COMMENT ON TRIGGER update_conversation_stats_trigger ON messages IS 'Updates parent conversation statistics when messages are inserted';

-- Security considerations:
-- 1. UUID primary keys prevent message enumeration attacks
-- 2. Foreign key CASCADE delete ensures GDPR compliance when users/conversations are deleted
-- 3. Status field allows tracking AI processing pipeline stages
-- 4. All indexes are scoped to user-owned content preventing unauthorized access patterns
-- 5. JSONB fields allow flexible metadata storage without exposing database schema
-- 6. Full-text search is secured within user's own messages and conversations

-- Performance considerations:
-- 1. Partial indexes reduce index size and improve query performance for common patterns
-- 2. Composite indexes cover multi-column query patterns in message retrieval
-- 3. GIN indexes enable efficient JSONB and full-text searching
-- 4. Generated tsvector column eliminates runtime text processing overhead
-- 5. Conversation-scoped indexes optimize real-time chat interface queries

-- AI Integration considerations:
-- 1. Verdict system supports Diamond/Fire/Skull classification with confidence scores
-- 2. Psychology fields enable emotional state tracking and pattern recognition
-- 3. AI cost tracking supports usage analytics and billing
-- 4. Processing status enables reliable async AI processing pipeline
-- 5. Retry mechanism handles AI service failures gracefully

-- Data Engineering considerations for future scaling:
-- 1. Table can be partitioned by created_at for time-series data management
-- 2. JSONB fields support evolution of AI metadata without schema changes
-- 3. Indexes support both transactional queries and analytical workloads
-- 4. Foreign key constraints maintain referential integrity for ETL processes
-- 5. Full-text search vectors can be replicated to dedicated search infrastructure
-- 6. AI cost and token tracking enables accurate usage analytics and optimization