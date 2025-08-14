# Elite Trading Coach AI - Backend Architecture

## Overview

This document outlines the enhanced backend architecture for the Elite Trading Coach AI platform, specifically designed to support the psychology coaching memory system and training trade storage requirements outlined in the MVP sprint plan.

## Architecture Components

### 1. Database Schema

#### Core Models

**User Management (Existing)**
- `users` - User profiles and authentication
- `oauth_providers` - OAuth integration data
- `user_sessions` - Session management
- `refresh_tokens` - JWT refresh tokens
- `security_events` - Security audit trail

**Trading & Psychology System (New)**
- `trades` - Unified storage for training and real trades
- `coaching_sessions` - Psychology coaching interactions
- `psychology_patterns` - Behavioral pattern tracking
- `training_scenarios` - Pre-loaded training examples
- `trade_plans` - Structured trade planning
- `conversations` - Chat conversations with context
- `coaching_session_trades` - Many-to-many relationship table

#### Key Features

**Trade Classification**
- `tradeType` field: 'Training' vs 'Real'
- Unified data structure for both types
- Performance comparison capabilities

**Psychology Integration**
- Trade-aware coaching sessions
- Pattern recognition across sessions
- Emotional state tracking
- Plan adherence scoring

**Context-Aware Memory**
- Comprehensive trade context building
- Psychology pattern correlation
- Performance trend analysis

### 2. Service Architecture

#### PsychologyCoachingService
**Location**: `/orch/auth/services/psychology-coaching-service.mjs`

**Responsibilities**:
- Create trade-aware coaching sessions
- Build performance context (training vs real)
- Track psychology patterns across sessions
- Generate context-aware AI prompts
- Analyze plan adherence and deviations

**Key Methods**:
```javascript
createCoachingSession(userId, sessionData)
buildPerformanceContext(userId, days)
buildTradeContext(userId, relatedTradeIds)
getActivePatterns(userId)
buildCoachingPrompt(contextData)
```

#### TrainingTradeService
**Location**: `/orch/auth/services/training-trade-service.mjs`

**Responsibilities**:
- Manage pre-loaded training scenarios
- Execute and track training trades
- Compare training vs real performance
- Establish coaching baselines
- Progress tracking through scenarios

**Key Methods**:
```javascript
initializeTrainingScenarios()
getAvailableScenarios(userId, options)
startTrainingScenario(userId, scenarioId)
executeTrainingTrade(userId, tradeData)
closeTrainingTrade(userId, tradeId, exitData)
getTrainingVsRealComparison(userId, days)
```

#### TradeContextBuilder
**Location**: `/orch/auth/services/trade-context-builder.mjs`

**Responsibilities**:
- Build comprehensive trading context
- Performance metrics calculation
- Pattern analysis and correlation
- Market context integration
- Context summarization for AI prompts

**Key Methods**:
```javascript
buildComprehensiveContext(userId, options)
buildTradeHistoryContext(userId, days, maxTrades)
buildCoachingHistoryContext(userId, days, maxSessions)
buildPsychologyPatternsContext(userId)
buildPerformanceMetricsContext(userId, days)
generateContextSummary(context)
```

#### ChatIntegrationService
**Location**: `/orch/auth/services/chat-integration-service.mjs`

**Responsibilities**:
- Integrate trading context with chat
- Mode-aware response generation
- Conversation search and analytics
- Export capabilities
- Training command handling

**Key Methods**:
```javascript
processChatMessage(userId, messageData)
searchConversations(userId, searchOptions)
getConversationAnalytics(userId, days)
exportConversationData(userId, exportOptions)
```

### 3. API Endpoints

#### Psychology Coaching Endpoints
**Base Path**: `/api/trading/coaching/`

- `POST /session` - Create coaching session
- `GET /performance-context` - Get performance context
- `GET /history` - Get coaching history
- `GET /patterns` - Get psychology patterns

#### Training Trade Endpoints
**Base Path**: `/api/trading/training/`

- `GET /scenarios` - Get available scenarios
- `POST /scenarios/:id/start` - Start training scenario
- `POST /trades` - Execute training trade
- `PUT /trades/:id/close` - Close training trade
- `GET /performance` - Get training performance
- `GET /vs-real` - Compare training vs real

#### Trade Management Endpoints
**Base Path**: `/api/trading/`

- `POST /trades` - Log real trade
- `PUT /trades/:id` - Update/close real trade
- `GET /trades` - Get trades with filtering
- `POST /plans` - Create trade plan
- `GET /plans` - Get trade plans

### 4. Data Persistence Patterns

#### Context-Aware Storage
- All trades linked to conversations
- Coaching sessions reference specific trades
- Psychology patterns track related trades/sessions
- Comprehensive audit trail

#### Performance Optimization
- Indexed queries for user-specific data
- Efficient context building with parallel queries
- Cached performance metrics
- Optimized search with full-text indexing

#### Memory Management
- Psychology patterns with frequency tracking
- Context window management for AI prompts
- Performance metric aggregation
- Historical data archiving strategies

### 5. Integration Patterns

#### AI Service Integration
```javascript
// Context-aware prompt building
const prompt = await psychologyService.buildCoachingPrompt({
  userMessage,
  sessionType,
  marketState,
  performanceContext,
  tradeContext,
  psychologyPatterns
});

// AI response generation
const aiResponse = await generateCoachingResponse(prompt);
```

#### Chat System Integration
```javascript
// Mode-aware message processing
const result = await chatService.processChatMessage(userId, {
  message,
  mode: 'Psychology-Coaching',
  relatedTradeIds: [trade1.id, trade2.id],
  sessionType: 'Post-Market',
  marketState: 'After-Hours'
});
```

#### Training Trade Workflow
```javascript
// Complete training scenario workflow
const scenario = await trainingService.startTrainingScenario(userId, scenarioId);
const trade = await trainingService.executeTrainingTrade(userId, tradeData);
const result = await trainingService.closeTrainingTrade(userId, tradeId, exitData);
```

### 6. Performance Optimization

#### Database Optimizations
- Strategic indexing on frequently queried fields
- Compound indexes for complex queries
- JSONB indexing for metadata fields
- Connection pooling and query optimization

#### Caching Strategies
- Performance metric caching
- Context data caching for frequent requests
- Pattern analysis result caching
- Redis integration for session storage

#### Query Optimization
- Parallel context building
- Efficient joins with proper relationships
- Pagination for large result sets
- Bulk operations for data initialization

### 7. Security Considerations

#### Data Protection
- User data isolation
- Trade data encryption at rest
- Secure session management
- Input validation and sanitization

#### Access Control
- User-scoped data access
- API endpoint authentication
- Rate limiting on sensitive operations
- Audit trail for all trading operations

### 8. Monitoring and Analytics

#### Performance Metrics
- Trading performance tracking
- Psychology coaching effectiveness
- Training completion rates
- User engagement analytics

#### System Health
- Database performance monitoring
- API response time tracking
- Error rate monitoring
- Resource utilization tracking

## Implementation Notes

### Database Migrations
The new trading models are designed to be added to the existing authentication database. The `initializeTradingModels()` function handles schema synchronization.

### Backward Compatibility
All new functionality is additive and doesn't break existing authentication features. The trading routes are mounted separately at `/api/trading/`.

### Scalability Considerations
- Models designed for horizontal scaling
- Efficient data structures for large trade volumes
- Pagination and filtering for performance
- Caching strategies for frequently accessed data

### Development Workflow
1. Models automatically sync in development
2. Services are modular and testable
3. API endpoints follow RESTful conventions
4. Comprehensive error handling and logging

## Sprint Implementation Priority

Based on the MVP sprint plan, implement in this order:

1. **Phase 1 (Days 1-10)**: Core models and basic trading functionality
2. **Phase 2 (Days 11-18)**: Psychology coaching integration and training trades
3. **Phase 3 (Days 19-25)**: Advanced context building and performance analytics
4. **Phase 4 (Days 26-27)**: Chat integration and export capabilities

This architecture provides the foundation for the enhanced psychology coaching memory system and training trade storage while maintaining performance, security, and scalability for the Elite Trading Coach AI platform.