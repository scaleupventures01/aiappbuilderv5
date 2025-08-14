# PRD-1.1.1.3: Conversations Table Schema Creation

**Status**: Not Started
**Owner**: Backend Engineer
**Estimated Hours**: 3
**Dependencies**: PRD-1.1.1.2-users-table.md

## 1. Problem Statement
The chat-based trading coach platform requires a system to organize and manage conversation sessions between users and the AI. Without a conversations table, the platform cannot group related messages, maintain conversation context, or provide features like conversation history, search, and mode switching between trade analysis and psychology coaching.

## 2. User Story
As a trader using the platform, I want my conversations to be organized into logical sessions so that I can easily navigate my chat history, switch between different conversation topics, and maintain context for ongoing trading discussions and psychology coaching sessions.

## 3. Success Metrics
- KPI 1: Conversation creation completes in <100ms
- KPI 2: Conversation lookup queries execute in <50ms
- KPI 3: Support for unlimited conversations per user with efficient pagination

## 4. Functional Requirements
- [ ] Conversations table created with proper schema
- [ ] Link conversations to users with foreign key relationship
- [ ] Support for conversation titles (auto-generated or user-defined)
- [ ] Track conversation mode (analysis vs psychology)
- [ ] Archive functionality for conversation management
- [ ] Timestamp tracking for creation and last update
- [ ] Efficient indexing for user conversation queries

## 5. Non-Functional Requirements
- Performance: Conversation queries complete in <50ms with proper indexing
- Security: Users can only access their own conversations
- Reliability: Foreign key constraints maintain data integrity

## 6. Technical Specifications

### Preconditions
- Users table exists and is functional
- Database connection established with proper permissions
- Understanding of conversation flow requirements

### Postconditions  
- Conversations table exists with complete schema
- Foreign key relationships established with users table
- Indexes optimized for common query patterns
- Sample conversations can be created and retrieved

### Implementation Details
**Table Schema:**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  mode VARCHAR(20) DEFAULT 'analysis' CHECK (mode IN ('analysis', 'psychology', 'training', 'planning')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  context_data JSONB DEFAULT '{}',
  last_message_at TIMESTAMP,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  archived_at TIMESTAMP NULL
);

-- Essential indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_user_active ON conversations(user_id, updated_at DESC) WHERE status = 'active';
CREATE INDEX idx_conversations_user_mode ON conversations(user_id, mode, updated_at DESC);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- JSONB index for context queries
CREATE INDEX idx_conversations_context ON conversations USING gin(context_data);

-- Update trigger for updated_at
CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update conversation metadata when messages are added
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE conversations 
    SET 
      last_message_at = NEW.created_at,
      message_count = message_count + 1,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    -- Auto-generate title from first user message if not set
    UPDATE conversations 
    SET title = CASE 
      WHEN title IS NULL AND NEW.type = 'user' THEN 
        LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END
      ELSE title
    END
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

**Context Data Schema:**
```json
{
  "trading_session_id": "uuid",
  "market_hours": true,
  "trading_instruments": ["ES", "NQ"],
  "session_type": "live_trading",
  "coaching_focus": ["discipline", "risk_management"],
  "last_mode_switch": "2024-01-15T10:30:00Z"
}
```

## 7. Testing Requirements

### 7.1 Unit Tests
- [ ] Test conversation creation with all field types
- [ ] Test foreign key constraint with users table
- [ ] Test conversation mode validation
- [ ] Test JSONB context data storage and retrieval

### 7.2 Integration Tests
- [ ] Test conversation creation from chat interface
- [ ] Test conversation listing and pagination
- [ ] Test conversation archiving workflow
- [ ] Test auto-title generation from first message

### 7.3 Acceptance Criteria
- [ ] Criteria 1: Can create conversation linked to user with proper foreign key relationship
- [ ] Criteria 2: Conversation queries return results in <50ms for active conversations
- [ ] Criteria 3: JSONB context data can store and retrieve complex trading session information

## 8. Rollback Plan
1. Export existing conversation data before schema changes
2. Create table backup with pg_dump
3. Document rollback SQL script
4. Test rollback procedure in development environment
5. Verify data integrity after rollback

## 9. Documentation Requirements
- [ ] Conversations table schema documentation
- [ ] Conversation mode definitions and use cases
- [ ] Context data structure and examples
- [ ] Query optimization guidelines for conversation retrieval

## 10. Sign-off
- [ ] Product Manager Review
- [ ] Technical Lead Review
- [ ] QA Review
- [ ] Implementation Complete