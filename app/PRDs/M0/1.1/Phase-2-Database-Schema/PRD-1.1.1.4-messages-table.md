# PRD-1.1.1.4: Messages Table Schema Creation

**Status**: Not Started
**Owner**: Backend Engineer
**Estimated Hours**: 4
**Dependencies**: PRD-1.1.1.3-conversations-table.md

## 1. Problem Statement
The core functionality of the Elite Trading Coach AI platform revolves around chat interactions between users and the AI. The messages table is critical for storing all conversation content, including text messages, image uploads, AI responses with trade verdicts, and psychology coaching sessions. Without a robust messages schema, the platform cannot provide its primary value proposition of AI-powered trading analysis and coaching.

## 2. User Story
As a trader using the platform, I want all my messages, charts, AI analysis, and coaching conversations to be permanently stored and easily retrievable so that I can reference past trades, track my progress, and maintain continuity in my trading education and psychological development.

## 3. Success Metrics
- KPI 1: Message storage and retrieval completes in <100ms
- KPI 2: Support for 10,000+ messages per user with efficient pagination
- KPI 3: Full-text search across message content with <500ms response time

## 4. Functional Requirements
- [ ] Messages table created with complete schema for chat functionality
- [ ] Support for user messages, AI responses, and system messages
- [ ] Image attachment storage with metadata (charts, screenshots)
- [ ] AI verdict system (Diamond/Fire/Skull) with confidence scores
- [ ] Psychology mode support with specialized fields
- [ ] Full-text search capability across message content
- [ ] Message threading for AI responses to user messages
- [ ] Efficient indexing for conversation-based queries

## 5. Non-Functional Requirements
- Performance: Message queries complete in <100ms, search in <500ms
- Security: Messages encrypted at rest, users can only access their messages
- Reliability: No message loss, atomic operations for message threads

## 6. Technical Specifications

### Preconditions
- Conversations and Users tables exist and are functional
- Database connection with proper permissions
- Image storage solution (Cloudinary) configured for file attachments

### Postconditions  
- Messages table exists with complete schema and relationships
- Full-text search indexing operational
- Message threading system functional
- Sample messages can be created, retrieved, and searched

### Implementation Details
**Table Schema:**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_message_id UUID REFERENCES messages(id), -- For AI responses to user messages
  
  -- Message content
  content TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('user', 'ai', 'system', 'training')),
  
  -- AI-specific fields for trade analysis
  verdict VARCHAR(20) CHECK (verdict IN ('diamond', 'fire', 'skull', null)),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  analysis_mode VARCHAR(20) DEFAULT 'analysis' CHECK (analysis_mode IN ('analysis', 'psychology', 'training')),
  
  -- File attachments (primarily chart images)
  image_url TEXT,
  image_filename VARCHAR(255),
  image_size INTEGER,
  image_metadata JSONB, -- Store image dimensions, format, etc.
  
  -- Psychology coaching specific fields
  emotional_state VARCHAR(50), -- 'confident', 'anxious', 'revenge', 'disciplined'
  coaching_type VARCHAR(50), -- 'discipline', 'risk_management', 'emotional_control'
  pattern_tags JSONB, -- Array of identified psychological patterns
  
  -- AI processing metadata
  ai_model VARCHAR(50), -- 'gpt-4-vision', 'gpt-4'
  ai_tokens_used INTEGER,
  ai_cost_cents INTEGER, -- Track AI costs per message
  processing_time_ms INTEGER,
  
  -- Status and error handling
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'processing', 'completed', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata and timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  edited_at TIMESTAMP NULL,
  
  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(content, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(image_filename, '')), 'B')
  ) STORED
);

-- Essential indexes for performance
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_conversation_recent ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_user_recent ON messages(user_id, created_at DESC);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_verdict ON messages(verdict) WHERE verdict IS NOT NULL;
CREATE INDEX idx_messages_analysis_mode ON messages(analysis_mode);
CREATE INDEX idx_messages_parent ON messages(parent_message_id) WHERE parent_message_id IS NOT NULL;

-- Full-text search index
CREATE INDEX idx_messages_search ON messages USING gin(search_vector);

-- JSONB indexes for psychology data
CREATE INDEX idx_messages_pattern_tags ON messages USING gin(pattern_tags);
CREATE INDEX idx_messages_image_metadata ON messages USING gin(image_metadata);

-- Partial indexes for common queries
CREATE INDEX idx_messages_ai_responses ON messages(conversation_id, created_at) WHERE type = 'ai';
CREATE INDEX idx_messages_user_messages ON messages(conversation_id, created_at) WHERE type = 'user';
CREATE INDEX idx_messages_with_images ON messages(conversation_id, created_at) WHERE image_url IS NOT NULL;
CREATE INDEX idx_messages_psychology ON messages(user_id, created_at) WHERE analysis_mode = 'psychology';

-- Update trigger for updated_at
CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

**Message Type Definitions:**
- `user`: Messages sent by the user (text, images)
- `ai`: Responses generated by AI (analysis, coaching)
- `system`: System notifications and status updates
- `training`: Messages from training scenarios

**Verdict System:**
- `diamond`: Perfect setup, high confidence trade
- `fire`: Good setup with warnings or considerations
- `skull`: Poor setup, avoid this trade

## 7. Testing Requirements

### 7.1 Unit Tests
- [ ] Test message creation with all field types
- [ ] Test foreign key relationships (conversation_id, user_id)
- [ ] Test message threading (parent_message_id)
- [ ] Test full-text search functionality
- [ ] Test JSONB field storage and querying

### 7.2 Integration Tests
- [ ] Test complete chat flow: user message → AI response
- [ ] Test image upload and metadata storage
- [ ] Test psychology mode message handling
- [ ] Test message search across conversations
- [ ] Test conversation statistics updates

### 7.3 Acceptance Criteria
- [ ] Criteria 1: Can store and retrieve messages with 100% data integrity
- [ ] Criteria 2: Full-text search returns relevant results in <500ms
- [ ] Criteria 3: AI verdict system stores and displays correctly in chat interface

## 8. Rollback Plan
1. Create comprehensive backup of existing message data
2. Document message creation and retrieval procedures
3. Create rollback script for schema changes
4. Test message data export/import procedures
5. Verify full-text search index recreation process

## 9. Documentation Requirements
- [ ] Messages table schema and field definitions
- [ ] AI verdict system documentation
- [ ] Psychology coaching message structure
- [ ] Full-text search query examples
- [ ] Message threading and conversation flow documentation

## 10. Sign-off
- [ ] Product Manager Review
- [ ] Technical Lead Review
- [ ] QA Review
- [ ] Implementation Complete