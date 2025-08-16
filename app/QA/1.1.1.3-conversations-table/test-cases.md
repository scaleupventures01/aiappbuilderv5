# Test Cases - PRD-1.1.1.3: Conversations Table Implementation

**QA Reference**: Test Plan v1.0  
**PRD Reference**: PRD-1.1.1.3-conversations-table.md  
**Date**: 2025-08-14  
**Test ID Format**: TC-1.1.1.3-XXX  

## 1. Database Schema Tests

### TC-1.1.1.3-001: Conversations Table Creation
**Priority**: Critical  
**Category**: Database Schema  
**Description**: Verify conversations table is created with correct schema structure  

**Test Steps**:
1. Execute migration script: `003_create_conversations_table.sql`
2. Query table structure: `\d conversations`
3. Verify column definitions and constraints

**Expected Results**:
- Table `conversations` exists
- All columns present with correct data types:
  - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
  - `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  - `title` VARCHAR(255)
  - `mode` VARCHAR(20) DEFAULT 'analysis' with CHECK constraint
  - `status` VARCHAR(20) DEFAULT 'active' with CHECK constraint
  - `context_data` JSONB DEFAULT '{}' NOT NULL
  - `last_message_at` TIMESTAMP NULL
  - `message_count` INTEGER DEFAULT 0 NOT NULL
  - `created_at` TIMESTAMP DEFAULT NOW() NOT NULL
  - `updated_at` TIMESTAMP DEFAULT NOW() NOT NULL
  - `archived_at` TIMESTAMP NULL

### TC-1.1.1.3-002: Foreign Key Constraints
**Priority**: Critical  
**Category**: Database Schema  
**Description**: Verify foreign key relationship with users table  

**Test Steps**:
1. Query foreign key constraints: `SELECT * FROM information_schema.table_constraints WHERE table_name = 'conversations'`
2. Test CASCADE DELETE behavior by deleting a test user
3. Verify conversations are deleted when user is deleted

**Expected Results**:
- Foreign key constraint exists: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- When user is deleted, all their conversations are automatically deleted
- Cannot insert conversation with non-existent user_id

### TC-1.1.1.3-003: Database Indexes Validation
**Priority**: High  
**Category**: Database Schema  
**Description**: Verify all required indexes are created for optimal performance  

**Test Steps**:
1. Query index information: `SELECT * FROM pg_indexes WHERE tablename = 'conversations'`
2. Verify each index exists and covers expected columns
3. Test query plans use indexes: `EXPLAIN ANALYZE SELECT * FROM conversations WHERE user_id = 'uuid'`

**Expected Results**:
- All required indexes exist:
  - `idx_conversations_user_id` ON conversations(user_id)
  - `idx_conversations_user_active` ON conversations(user_id, updated_at DESC) WHERE status = 'active'
  - `idx_conversations_user_mode` ON conversations(user_id, mode, updated_at DESC)
  - `idx_conversations_last_message` ON conversations(last_message_at DESC)
  - `idx_conversations_created_at` ON conversations(created_at DESC)
  - `idx_conversations_context` ON conversations USING gin(context_data)
  - Additional composite indexes for performance
- Query plans show index usage for user-scoped queries

### TC-1.1.1.3-004: Triggers and Functions
**Priority**: High  
**Category**: Database Schema  
**Description**: Verify triggers and functions are created and functional  

**Test Steps**:
1. Check trigger exists: `SELECT * FROM information_schema.triggers WHERE event_object_table = 'conversations'`
2. Check function exists: `SELECT * FROM information_schema.routines WHERE routine_name = 'update_conversation_stats'`
3. Test trigger by updating a conversation record
4. Verify `updated_at` is automatically updated

**Expected Results**:
- Trigger `update_conversations_updated_at` exists on conversations table
- Function `update_conversation_stats()` exists for message statistics
- Updating any field automatically updates `updated_at` timestamp
- Function ready to be called by messages table trigger

## 2. Model Validation Tests

### TC-1.1.1.3-005: Conversation Model Instantiation
**Priority**: High  
**Category**: Model Validation  
**Description**: Test Conversation model constructor and basic properties  

**Test Steps**:
1. Import Conversation model: `import Conversation from '../../models/Conversation.js'`
2. Create instance with valid data
3. Create instance with minimal data
4. Create instance with invalid data

**Expected Results**:
- Model instantiates correctly with valid data
- Default values are set for optional fields
- All properties accessible through getter methods
- Invalid data handled gracefully

### TC-1.1.1.3-006: Title Validation
**Priority**: Medium  
**Category**: Model Validation  
**Description**: Test conversation title validation rules  

**Test Steps**:
1. Test valid titles: "Trade Analysis Session", "Quick question"
2. Test null/undefined title (should be valid)
3. Test empty string title
4. Test title > 255 characters
5. Test title with invalid characters: `<script>alert('xss')</script>`

**Expected Results**:
- Valid titles pass validation
- Null/undefined titles pass (optional field)
- Empty string treated as null
- Long titles (>255 chars) fail validation
- Invalid characters fail validation (XSS prevention)

### TC-1.1.1.3-007: Mode Validation
**Priority**: Critical  
**Category**: Model Validation  
**Description**: Test conversation mode validation constraints  

**Test Steps**:
1. Test valid modes: 'analysis', 'psychology', 'training', 'planning'
2. Test invalid modes: 'invalid', 'coaching', 'chat'
3. Test null/undefined mode
4. Test mode case sensitivity

**Expected Results**:
- All valid modes pass validation
- Invalid modes fail validation
- Default mode 'analysis' used for null/undefined
- Mode validation is case-sensitive

### TC-1.1.1.3-008: Status Validation
**Priority**: High  
**Category**: Model Validation  
**Description**: Test conversation status validation constraints  

**Test Steps**:
1. Test valid statuses: 'active', 'archived', 'deleted'
2. Test invalid statuses: 'inactive', 'hidden', 'pending'
3. Test null/undefined status
4. Test status transitions

**Expected Results**:
- All valid statuses pass validation
- Invalid statuses fail validation
- Default status 'active' used for null/undefined
- Status transitions work correctly (active → archived → active)

### TC-1.1.1.3-009: Context Data Validation
**Priority**: High  
**Category**: Model Validation  
**Description**: Test JSONB context data validation and size limits  

**Test Steps**:
1. Test valid context data structures
2. Test empty object `{}`
3. Test null context data
4. Test large context data (>50KB)
5. Test invalid JSON structures
6. Test context data with trading-specific fields

**Expected Results**:
- Valid JSON objects pass validation
- Empty object `{}` is valid default
- Null context data accepted
- Large context data (>50KB) fails validation
- Invalid JSON structures fail validation
- Trading-specific fields validated correctly

### TC-1.1.1.3-010: User ID Validation
**Priority**: Critical  
**Category**: Model Validation  
**Description**: Test user ID UUID format validation  

**Test Steps**:
1. Test valid UUIDs: `550e8400-e29b-41d4-a716-446655440000`
2. Test invalid UUIDs: `invalid-uuid`, `123`, empty string
3. Test null/undefined user ID
4. Test different UUID versions (v1, v4)

**Expected Results**:
- Valid UUIDs pass validation
- Invalid UUID formats fail validation
- Null/undefined user ID fails validation (required field)
- Both UUID v1 and v4 accepted

## 3. Database Query Tests

### TC-1.1.1.3-011: Create Conversation
**Priority**: Critical  
**Category**: CRUD Operations  
**Description**: Test conversation creation with database persistence  

**Test Steps**:
1. Create conversation with minimal required data
2. Create conversation with all optional fields
3. Create conversation with invalid user_id
4. Create conversation with invalid mode
5. Verify created conversation in database

**Expected Results**:
- Valid conversations created successfully
- Auto-generated fields populated (id, created_at, updated_at)
- Invalid user_id throws foreign key error
- Invalid mode throws check constraint error
- Created conversation retrievable from database

### TC-1.1.1.3-012: Get Conversation by ID
**Priority**: Critical  
**Category**: CRUD Operations  
**Description**: Test conversation retrieval with ownership validation  

**Test Steps**:
1. Get conversation by valid ID and correct user_id
2. Get conversation by valid ID but wrong user_id
3. Get conversation by non-existent ID
4. Get deleted conversation
5. Measure query execution time

**Expected Results**:
- Valid ID + correct user returns conversation
- Valid ID + wrong user returns null (access denied)
- Non-existent ID returns null
- Deleted conversations not returned
- Query completes in <50ms

### TC-1.1.1.3-013: List User Conversations
**Priority**: Critical  
**Category**: CRUD Operations  
**Description**: Test conversation listing with pagination and filtering  

**Test Steps**:
1. Get all active conversations for user
2. Get conversations with status filter (archived)
3. Get conversations with mode filter (psychology)
4. Test pagination with limit/offset
5. Test ordering by different fields
6. Measure query execution time

**Expected Results**:
- Returns only user's conversations
- Status filtering works correctly
- Mode filtering works correctly
- Pagination works with correct metadata
- Ordering by all supported fields works
- Query completes in <50ms

### TC-1.1.1.3-014: Update Conversation
**Priority**: High  
**Category**: CRUD Operations  
**Description**: Test conversation updates with validation and concurrency  

**Test Steps**:
1. Update conversation title
2. Update conversation mode
3. Update context_data
4. Update conversation owned by different user
5. Update deleted conversation
6. Test partial updates
7. Verify updated_at timestamp changes

**Expected Results**:
- Valid updates succeed
- Cross-user updates fail (access denied)
- Deleted conversation updates fail
- Partial updates work correctly
- updated_at automatically updated
- Invalid data rejected with validation errors

### TC-1.1.1.3-015: Archive/Restore Conversation
**Priority**: High  
**Category**: CRUD Operations  
**Description**: Test conversation archiving and restoration  

**Test Steps**:
1. Archive active conversation
2. Restore archived conversation
3. Archive already archived conversation
4. Restore non-archived conversation
5. Archive conversation owned by different user

**Expected Results**:
- Active conversation archives successfully
- Archived conversation restores successfully
- Already archived conversation throws error
- Non-archived conversation restore fails
- Cross-user operations fail (access denied)
- archived_at timestamp set/cleared appropriately

### TC-1.1.1.3-016: Soft Delete Conversation
**Priority**: High  
**Category**: CRUD Operations  
**Description**: Test conversation soft deletion  

**Test Steps**:
1. Soft delete active conversation
2. Soft delete archived conversation
3. Soft delete already deleted conversation
4. Verify deleted conversation not in normal queries
5. Delete conversation owned by different user

**Expected Results**:
- Active/archived conversations delete successfully
- Already deleted conversation throws error
- Deleted conversations excluded from normal queries
- Cross-user deletions fail (access denied)
- status field updated to 'deleted'

## 4. API Endpoint Tests

### TC-1.1.1.3-017: POST /api/conversations
**Priority**: Critical  
**Category**: API Endpoints  
**Description**: Test conversation creation endpoint  

**Test Steps**:
1. POST with valid conversation data and auth token
2. POST without authentication
3. POST with invalid conversation data
4. POST with missing required fields
5. Test rate limiting

**Expected Results**:
- Valid requests return 201 with conversation data
- Unauthenticated requests return 401
- Invalid data returns 400 with validation errors
- Missing fields return 400 with specific error messages
- Rate limiting returns 429 when exceeded

### TC-1.1.1.3-018: GET /api/conversations
**Priority**: Critical  
**Category**: API Endpoints  
**Description**: Test conversation listing endpoint  

**Test Steps**:
1. GET with valid authentication
2. GET without authentication
3. GET with query parameters (status, mode, pagination)
4. GET with invalid query parameters
5. Test response format and data structure

**Expected Results**:
- Valid requests return 200 with conversations array
- Unauthenticated requests return 401
- Query parameters filter results correctly
- Invalid parameters ignored or return 400
- Response includes pagination metadata

### TC-1.1.1.3-019: GET /api/conversations/:id
**Priority**: Critical  
**Category**: API Endpoints  
**Description**: Test individual conversation retrieval endpoint  

**Test Steps**:
1. GET with valid conversation ID and authentication
2. GET with invalid UUID format
3. GET with non-existent conversation ID
4. GET conversation owned by different user
5. Test response format

**Expected Results**:
- Valid requests return 200 with conversation data
- Invalid UUID format returns 400
- Non-existent ID returns 404
- Cross-user access returns 404 (not 403 to prevent enumeration)
- Response format matches API specification

### TC-1.1.1.3-020: PUT /api/conversations/:id
**Priority**: High  
**Category**: API Endpoints  
**Description**: Test conversation update endpoint  

**Test Steps**:
1. PUT with valid update data
2. PUT with invalid conversation ID
3. PUT with validation errors in data
4. PUT to conversation owned by different user
5. PUT to deleted conversation

**Expected Results**:
- Valid updates return 200 with updated conversation
- Invalid ID returns 400
- Validation errors return 400 with details
- Cross-user updates return 404
- Deleted conversation updates return 400

### TC-1.1.1.3-021: POST /api/conversations/:id/archive
**Priority**: High  
**Category**: API Endpoints  
**Description**: Test conversation archiving endpoint  

**Test Steps**:
1. POST to archive active conversation
2. POST to archive already archived conversation
3. POST with invalid conversation ID
4. POST to conversation owned by different user

**Expected Results**:
- Active conversation archiving returns 200
- Already archived returns appropriate error
- Invalid ID returns 400
- Cross-user operations return 404

### TC-1.1.1.3-022: DELETE /api/conversations/:id
**Priority**: High  
**Category**: API Endpoints  
**Description**: Test conversation deletion endpoint  

**Test Steps**:
1. DELETE with proper confirmation
2. DELETE without confirmation
3. DELETE with invalid conversation ID
4. DELETE conversation owned by different user

**Expected Results**:
- Valid deletion with confirmation returns 200
- Missing confirmation returns 400
- Invalid ID returns 400
- Cross-user deletions return 404

## 5. Security Tests

### TC-1.1.1.3-023: Authentication Validation
**Priority**: Critical  
**Category**: Security  
**Description**: Test all endpoints require proper authentication  

**Test Steps**:
1. Call each endpoint without Authorization header
2. Call with invalid JWT token
3. Call with expired JWT token
4. Call with tampered JWT token

**Expected Results**:
- All requests without auth return 401
- Invalid tokens return 401
- Expired tokens return 401
- Tampered tokens return 401

### TC-1.1.1.3-024: User Ownership Validation
**Priority**: Critical  
**Category**: Security  
**Description**: Test users can only access their own conversations  

**Test Steps**:
1. Try to access another user's conversation
2. Try to update another user's conversation
3. Try to delete another user's conversation
4. Enumerate conversation IDs from different users

**Expected Results**:
- All cross-user operations return 404 (not 403)
- No data leakage about other users' conversations
- Cannot enumerate conversations through ID guessing
- User isolation maintained across all operations

### TC-1.1.1.3-025: Input Validation Security
**Priority**: High  
**Category**: Security  
**Description**: Test protection against injection attacks  

**Test Steps**:
1. Test SQL injection in search queries
2. Test XSS in conversation titles
3. Test JSON injection in context_data
4. Test parameter pollution

**Expected Results**:
- SQL injection attempts blocked/sanitized
- XSS attempts escaped/rejected
- Invalid JSON rejected
- Parameter pollution handled gracefully
- No sensitive data exposed in error messages

### TC-1.1.1.3-026: Rate Limiting Security
**Priority**: High  
**Category**: Security  
**Description**: Test rate limiting protects against abuse  

**Test Steps**:
1. Make rapid conversation creation requests
2. Make rapid search requests
3. Test different rate limits per endpoint
4. Test premium user bypass

**Expected Results**:
- Rate limits enforced correctly
- 429 responses include proper headers
- Different limits for different operations
- Premium users bypass where configured

## 6. Performance Tests

### TC-1.1.1.3-027: Query Performance Benchmarks
**Priority**: High  
**Category**: Performance  
**Description**: Measure and validate query execution times  

**Test Steps**:
1. Measure conversation creation time (target: <100ms)
2. Measure conversation lookup time (target: <50ms)
3. Measure conversation listing time with 1000+ conversations
4. Measure search query performance
5. Test with concurrent operations

**Expected Results**:
- Conversation creation: <100ms
- Single conversation lookup: <50ms
- Conversation listing (20 items): <50ms
- Search queries: <100ms
- Performance maintained under concurrent load

### TC-1.1.1.3-028: Index Usage Validation
**Priority**: High  
**Category**: Performance  
**Description**: Verify queries use appropriate indexes  

**Test Steps**:
1. Run EXPLAIN ANALYZE on common queries
2. Check index usage for user-scoped queries
3. Verify JSONB index usage for context searches
4. Test query plans with different data volumes

**Expected Results**:
- All user-scoped queries use user_id index
- Range queries use appropriate composite indexes
- JSONB queries use GIN index when needed
- No full table scans on large datasets

### TC-1.1.1.3-029: Scalability Testing
**Priority**: Medium  
**Category**: Performance  
**Description**: Test performance with large datasets  

**Test Steps**:
1. Create test dataset with 10,000+ conversations
2. Measure query performance with large dataset
3. Test pagination performance
4. Test concurrent user operations

**Expected Results**:
- Performance requirements maintained with large datasets
- Pagination efficient with large result sets
- Concurrent operations don't degrade performance significantly
- Memory usage remains reasonable

## 7. Data Integrity Tests

### TC-1.1.1.3-030: Constraint Validation
**Priority**: High  
**Category**: Data Integrity  
**Description**: Test database constraints prevent invalid data  

**Test Steps**:
1. Try to insert conversation with invalid mode
2. Try to insert conversation with invalid status
3. Try to insert conversation with null user_id
4. Test character limits on title field

**Expected Results**:
- Invalid mode values rejected by CHECK constraint
- Invalid status values rejected by CHECK constraint
- NULL user_id rejected by NOT NULL constraint
- Title length limits enforced

### TC-1.1.1.3-031: Cascade Delete Behavior
**Priority**: High  
**Category**: Data Integrity  
**Description**: Test foreign key cascade behavior  

**Test Steps**:
1. Create user with conversations
2. Delete the user
3. Verify conversations are automatically deleted
4. Test with archived and deleted conversations

**Expected Results**:
- All user's conversations deleted when user deleted
- Cascade works regardless of conversation status
- No orphaned conversation records remain
- Operation completes successfully

### TC-1.1.1.3-032: JSONB Data Integrity
**Priority**: Medium  
**Category**: Data Integrity  
**Description**: Test JSONB context data handling  

**Test Steps**:
1. Insert various JSONB structures
2. Test JSONB size limits
3. Test JSONB query operations
4. Test context data updates and merging

**Expected Results**:
- Valid JSONB stored correctly
- Size limits enforced
- JSONB queries work efficiently
- Context data updates preserve existing fields

## 8. Edge Cases and Error Handling

### TC-1.1.1.3-033: Concurrent Operations
**Priority**: Medium  
**Category**: Edge Cases  
**Description**: Test concurrent access to same conversation  

**Test Steps**:
1. Multiple users updating same conversation simultaneously
2. Archive and delete operations on same conversation
3. High-frequency read/write operations
4. Test transaction isolation

**Expected Results**:
- Concurrent updates handled gracefully
- No data corruption or lost updates
- Proper error messages for conflicts
- Transaction isolation maintained

### TC-1.1.1.3-034: Error Message Quality
**Priority**: Medium  
**Category**: Error Handling  
**Description**: Verify error messages are helpful and secure  

**Test Steps**:
1. Trigger various validation errors
2. Test database connection errors
3. Test authorization errors
4. Check for sensitive data in error messages

**Expected Results**:
- Error messages are clear and actionable
- No sensitive data exposed (IDs, tokens, etc.)
- Appropriate HTTP status codes
- Consistent error format across API

---

## Test Execution Summary

**Total Test Cases**: 34  
**Critical**: 15 cases  
**High**: 13 cases  
**Medium**: 6 cases  

**Estimated Execution Time**: 12 hours  
**Required Pass Rate**: 100% for Critical, 95% for High, 90% for Medium  

**Dependencies**: Users table implementation (PRD-1.1.1.2) must be complete and functional  

---

**Status**: Ready for Execution  
**Next Action**: Execute test cases and document results in test-results-2025-08-14.md