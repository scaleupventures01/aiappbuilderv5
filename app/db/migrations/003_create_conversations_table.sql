-- Migration: Create Conversations Table
-- PRD Reference: PRD-1.1.1.3-conversations-table.md
-- Task: BE-001/BE-002 - Complete conversations table implementation
-- Created: 2025-08-14
-- Description: Creates the conversations table with comprehensive security considerations, performance indexes, and audit triggers

-- Drop existing objects if they exist (for clean re-runs)
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
DROP TRIGGER IF EXISTS update_conversation_stats_trigger ON messages;
DROP FUNCTION IF EXISTS update_conversation_stats() CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Create conversations table with comprehensive security considerations
CREATE TABLE conversations (
    -- Cryptographically secure UUID v4 primary key prevents conversation enumeration
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to users table with CASCADE delete for GDPR compliance
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Conversation metadata
    title VARCHAR(255),
    
    -- Conversation mode with validation constraints
    mode VARCHAR(20) DEFAULT 'analysis' CHECK (mode IN ('analysis', 'psychology', 'training', 'planning')),
    
    -- Conversation lifecycle status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    
    -- JSONB context data for trading session information and coaching focus
    context_data JSONB DEFAULT '{}' NOT NULL,
    
    -- Message tracking for conversation statistics
    last_message_at TIMESTAMP NULL,
    message_count INTEGER DEFAULT 0 NOT NULL,
    
    -- Audit trail timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    archived_at TIMESTAMP NULL  -- Timestamp when conversation was archived
);

-- Performance indexes for fast conversation lookups
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_user_active ON conversations(user_id, updated_at DESC) WHERE status = 'active';
CREATE INDEX idx_conversations_user_mode ON conversations(user_id, mode, updated_at DESC);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_mode ON conversations(mode);

-- JSONB index for efficient context data queries
CREATE INDEX idx_conversations_context ON conversations USING gin(context_data);

-- Composite indexes for common query patterns
CREATE INDEX idx_conversations_user_status ON conversations(user_id, status, updated_at DESC);
CREATE INDEX idx_conversations_user_active_mode ON conversations(user_id, mode) WHERE status = 'active';
CREATE INDEX idx_conversations_recent_active ON conversations(updated_at DESC) WHERE status = 'active';

-- Create trigger to automatically update updated_at on row updates
-- Reuses the existing function from users table migration
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update conversation metadata when messages are added
-- This function will be called by a trigger on the messages table (when created)
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process INSERT operations on messages table
    IF TG_OP = 'INSERT' THEN
        -- Update conversation statistics
        UPDATE conversations 
        SET 
            last_message_at = NEW.created_at,
            message_count = message_count + 1,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
        
        -- Auto-generate title from first user message if not set
        -- Only for user messages (not AI responses)
        UPDATE conversations 
        SET title = CASE 
            WHEN title IS NULL AND NEW.type = 'user' AND LENGTH(TRIM(NEW.content)) > 0 THEN 
                LEFT(TRIM(NEW.content), 50) || CASE WHEN LENGTH(TRIM(NEW.content)) > 50 THEN '...' ELSE '' END
            ELSE title
        END
        WHERE id = NEW.conversation_id AND title IS NULL;
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add comprehensive comments for documentation
COMMENT ON TABLE conversations IS 'Conversation sessions for Elite Trading Coach AI platform with mode support';
COMMENT ON COLUMN conversations.id IS 'Cryptographically secure UUID v4 primary key prevents conversation enumeration';
COMMENT ON COLUMN conversations.user_id IS 'Foreign key reference to users table - CASCADE delete for GDPR compliance';
COMMENT ON COLUMN conversations.title IS 'Conversation title - auto-generated from first user message or user-defined';
COMMENT ON COLUMN conversations.mode IS 'Conversation mode: analysis, psychology, training, or planning';
COMMENT ON COLUMN conversations.status IS 'Conversation lifecycle status: active, archived, or deleted';
COMMENT ON COLUMN conversations.context_data IS 'JSONB storage for trading session context, coaching focus, and session metadata';
COMMENT ON COLUMN conversations.last_message_at IS 'Timestamp of most recent message in conversation';
COMMENT ON COLUMN conversations.message_count IS 'Total number of messages in conversation for statistics';
COMMENT ON COLUMN conversations.created_at IS 'Conversation creation timestamp - immutable';
COMMENT ON COLUMN conversations.updated_at IS 'Last conversation modification timestamp - auto-updated by trigger';
COMMENT ON COLUMN conversations.archived_at IS 'Timestamp when conversation was archived - null means active';

-- Index comments for documentation
COMMENT ON INDEX idx_conversations_user_id IS 'Fast lookup for user conversations';
COMMENT ON INDEX idx_conversations_user_active IS 'Optimized for active conversation listings by user';
COMMENT ON INDEX idx_conversations_user_mode IS 'Efficient queries for conversations by user and mode';
COMMENT ON INDEX idx_conversations_context IS 'GIN index for JSONB context data queries';
COMMENT ON INDEX idx_conversations_user_status IS 'Composite index for status-based conversation queries';

-- Function and trigger comments
COMMENT ON FUNCTION update_conversation_stats() IS 'Updates conversation metadata when messages are added - called by messages table trigger';
COMMENT ON TRIGGER update_conversations_updated_at ON conversations IS 'Automatically updates updated_at timestamp on any row modification';

-- Security considerations:
-- 1. UUID primary keys prevent conversation enumeration attacks
-- 2. Foreign key CASCADE delete ensures GDPR compliance when users are deleted
-- 3. Status field allows soft deletion without data loss
-- 4. Indexes are optimized for user-scoped queries preventing unauthorized access patterns
-- 5. JSONB context_data allows flexible storage without exposing database schema

-- Performance considerations:
-- 1. Partial indexes on status='active' reduce index size and improve query performance
-- 2. Composite indexes cover common query patterns in conversation listing
-- 3. GIN index on JSONB enables efficient context data searching
-- 4. message_count denormalization avoids expensive COUNT queries
-- 5. last_message_at enables efficient conversation sorting without joining messages table

-- Data Engineering considerations for future scaling:
-- 1. Table can be partitioned by created_at for time-series data management
-- 2. JSONB context_data supports evolution of conversation metadata without schema changes
-- 3. Indexes support both transactional queries and analytical workloads
-- 4. Foreign key constraints maintain referential integrity for ETL processes
-- 5. Audit timestamps enable change data capture for data warehousing