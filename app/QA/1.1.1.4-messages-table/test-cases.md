# Test Cases: Messages Table Implementation (PRD-1.1.1.4)

**Test Cases Version**: 1.0
**Created**: 2025-08-14
**QA Engineer**: Claude Code
**PRD Reference**: PRD-1.1.1.4-messages-table.md

## Test Case Format

Each test case includes:
- **Test ID**: Unique identifier
- **Test Name**: Descriptive test name
- **Priority**: Critical/High/Medium/Low
- **Category**: Functional area
- **Prerequisites**: Required setup
- **Test Steps**: Step-by-step execution
- **Expected Results**: Expected outcomes
- **Pass Criteria**: Definition of success
- **Risk Level**: Impact assessment

---

## 1. Database Schema Tests (TC-MSG-100 series)

### TC-MSG-101: Messages Table Schema Creation
- **Priority**: Critical
- **Category**: Database Schema
- **Prerequisites**: PostgreSQL database, migration files
- **Objective**: Verify messages table created with complete schema

**Test Steps**:
1. Execute migration `004_create_messages_table.sql`
2. Query information_schema to verify table structure
3. Check all required columns exist with correct data types
4. Verify constraints and default values

**Expected Results**:
- Messages table created successfully
- All 25+ columns present with correct types
- CHECK constraints active for enums
- UUID primary key with default generation
- JSONB fields with default empty objects/arrays

**Pass Criteria**: All schema elements match PRD specification exactly

---

### TC-MSG-102: Index Creation and Optimization
- **Priority**: Critical
- **Category**: Database Performance
- **Prerequisites**: Messages table created
- **Objective**: Validate all indexes created for optimal performance

**Test Steps**:
1. Query pg_indexes for messages table
2. Verify 15+ indexes created as specified
3. Test query performance with indexes
4. Verify GIN indexes for JSONB and full-text search
5. Check partial indexes for specific conditions

**Expected Results**:
- All 15+ indexes created successfully
- Query plans use appropriate indexes
- Full-text search index functional
- Partial indexes active for filtered queries

**Pass Criteria**: All indexes present and optimizing query performance

---

### TC-MSG-103: Database Triggers and Functions
- **Priority**: Critical
- **Category**: Database Logic
- **Prerequisites**: Messages table with triggers
- **Objective**: Test automated timestamp and statistics updates

**Test Steps**:
1. Insert new message record
2. Update message record
3. Verify updated_at timestamp changes
4. Check conversation stats update trigger
5. Test trigger error handling

**Expected Results**:
- updated_at automatically updated on changes
- Conversation statistics updated after message insert
- Triggers handle errors gracefully

**Pass Criteria**: All triggers function correctly with no errors

---

### TC-MSG-104: Foreign Key Relationships
- **Priority**: Critical
- **Category**: Data Integrity
- **Prerequisites**: Users and conversations tables exist
- **Objective**: Verify referential integrity constraints

**Test Steps**:
1. Attempt to insert message with invalid user_id
2. Attempt to insert message with invalid conversation_id
3. Test CASCADE delete behavior
4. Verify parent_message_id self-reference
5. Test orphaned message handling

**Expected Results**:
- Invalid foreign keys rejected
- CASCADE delete removes related messages
- Self-referencing foreign key works correctly
- Database maintains referential integrity

**Pass Criteria**: All foreign key constraints enforced properly

---

### TC-MSG-105: Data Type Validation
- **Priority**: High
- **Category**: Data Validation
- **Prerequisites**: Messages table schema
- **Objective**: Test all field data types and constraints

**Test Steps**:
1. Test UUID fields with valid/invalid formats
2. Test INTEGER fields with valid/invalid ranges
3. Test VARCHAR fields with length limits
4. Test JSONB fields with valid/invalid JSON
5. Test TIMESTAMP fields with various formats
6. Test CHECK constraints for enums

**Expected Results**:
- Valid data accepted, invalid data rejected
- Length constraints enforced
- CHECK constraints prevent invalid enum values
- JSONB fields accept only valid JSON

**Pass Criteria**: All data type constraints work as specified

---

## 2. Message CRUD Operations Tests (TC-MSG-200 series)

### TC-MSG-201: Create User Message
- **Priority**: Critical
- **Category**: Message Creation
- **Prerequisites**: Test user and conversation
- **Objective**: Test user message creation with validation

**Test Steps**:
1. Create user message with required fields only
2. Create user message with all optional fields
3. Test with image attachment metadata
4. Verify content validation (max 50KB)
5. Test with empty/null content (should fail)
6. Verify auto-generated fields (id, timestamps)

**Expected Results**:
- Valid user messages created successfully
- Auto-generated UUID id assigned
- Timestamps set automatically
- Content validation enforced
- Image metadata stored correctly

**Pass Criteria**: User message creation works with proper validation

---

### TC-MSG-202: Create AI Message with Verdict
- **Priority**: Critical
- **Category**: AI Integration
- **Prerequisites**: Message model, AI verdict classifier
- **Objective**: Test AI message creation with verdict system

**Test Steps**:
1. Create AI message with Diamond verdict (90+ confidence)
2. Create AI message with Fire verdict (50-89 confidence)
3. Create AI message with Skull verdict (<50 confidence)
4. Test confidence score validation (0-100 range)
5. Verify verdict-confidence consistency
6. Test AI processing metadata fields

**Expected Results**:
- AI messages created with verdict and confidence
- Verdict enum validation working
- Confidence range validation enforced
- AI processing metadata stored
- Cross-field validation working

**Pass Criteria**: AI verdict system integrated correctly

---

### TC-MSG-203: Create Psychology Message
- **Priority**: High
- **Category**: Psychology Coaching
- **Prerequisites**: Psychology pattern detector
- **Objective**: Test psychology-specific message creation

**Test Steps**:
1. Create message with emotional_state field
2. Create message with coaching_type field
3. Create message with pattern_tags array
4. Test analysis_mode = 'psychology'
5. Verify psychology field validation
6. Test JSONB pattern_tags storage

**Expected Results**:
- Psychology fields stored correctly
- Emotional state enum validation working
- Coaching type enum validation working
- Pattern tags JSONB array functional
- Analysis mode validation enforced

**Pass Criteria**: Psychology coaching features fully functional

---

### TC-MSG-204: Message with Image Attachment
- **Priority**: High
- **Category**: File Attachments
- **Prerequisites**: Image upload functionality
- **Objective**: Test message creation with image metadata

**Test Steps**:
1. Create message with image_url and metadata
2. Test image filename validation
3. Test image size validation (50MB limit)
4. Verify image_metadata JSONB storage
5. Test required filename when URL provided
6. Verify metadata structure and limits

**Expected Results**:
- Image attachment data stored correctly
- Filename validation enforced
- Size limits respected
- JSONB metadata stored with proper structure
- Cross-field validation working

**Pass Criteria**: Image attachment functionality working properly

---

### TC-MSG-205: Message Retrieval by ID
- **Priority**: Critical
- **Category**: Message Retrieval
- **Prerequisites**: Test messages in database
- **Objective**: Test single message fetch with security

**Test Steps**:
1. Retrieve message by valid ID and owner
2. Attempt to retrieve message owned by different user
3. Test with invalid UUID format
4. Test with non-existent message ID
5. Verify all fields returned correctly
6. Test public vs private field filtering

**Expected Results**:
- Valid message retrieved with all fields
- Cross-user access blocked
- Invalid IDs handled gracefully
- Non-existent messages return null
- Field filtering working correctly

**Pass Criteria**: Secure message retrieval functioning properly

---

### TC-MSG-206: Conversation Messages with Pagination
- **Priority**: Critical
- **Category**: Message Listing
- **Prerequisites**: Conversation with multiple messages
- **Objective**: Test paginated conversation message listing

**Test Steps**:
1. Get conversation messages with default pagination
2. Test with custom limit and offset
3. Test both ASC and DESC ordering
4. Verify pagination metadata accuracy
5. Test with empty conversation
6. Test with single message
7. Test performance with 1000+ messages

**Expected Results**:
- Paginated results returned correctly
- Order parameter respected
- Pagination metadata accurate
- Empty conversations handled
- Good performance with large datasets

**Pass Criteria**: Pagination working efficiently and accurately

---

### TC-MSG-207: Update User Message
- **Priority**: High
- **Category**: Message Updates
- **Prerequisites**: Existing user message
- **Objective**: Test message content and metadata updates

**Test Steps**:
1. Update message content successfully
2. Update emotional_state and pattern_tags
3. Attempt to update AI-only fields (should fail)
4. Test edited_at timestamp setting
5. Verify update validation rules
6. Test concurrent update handling

**Expected Results**:
- Allowed fields updated successfully
- AI-specific fields protected from updates
- edited_at timestamp set on content changes
- Validation applied to updated data
- Concurrent updates handled properly

**Pass Criteria**: Message updates work with proper restrictions

---

### TC-MSG-208: Update AI Results
- **Priority**: High
- **Category**: AI Integration
- **Prerequisites**: Message awaiting AI processing
- **Objective**: Test AI processing results update

**Test Steps**:
1. Update message with AI verdict and confidence
2. Update with psychology analysis results
3. Update with AI processing metadata
4. Test status change to 'completed'
5. Verify cost and token tracking
6. Test error handling for invalid results

**Expected Results**:
- AI results updated successfully
- Status changed to completed
- Processing metadata stored
- Cost tracking functional
- Validation applied to AI results

**Pass Criteria**: AI results integration working correctly

---

### TC-MSG-209: Soft Delete Message
- **Priority**: Medium
- **Category**: Message Management
- **Prerequisites**: User message to delete
- **Objective**: Test soft delete functionality

**Test Steps**:
1. Delete user message successfully
2. Verify message status changed to 'deleted'
3. Confirm message not returned in queries
4. Test that only user messages can be deleted
5. Attempt to delete AI/system messages (should fail)
6. Test delete access control

**Expected Results**:
- User messages soft deleted successfully
- Status updated to 'deleted'
- Deleted messages filtered from queries
- AI/system messages protected from deletion
- Access control enforced

**Pass Criteria**: Soft delete working with proper restrictions

---

### TC-MSG-210: Validation and Error Handling
- **Priority**: High
- **Category**: Data Validation
- **Prerequisites**: Various invalid message data
- **Objective**: Test comprehensive validation and error handling

**Test Steps**:
1. Submit message with missing required fields
2. Submit message with invalid data types
3. Submit message exceeding field length limits
4. Submit message with invalid enum values
5. Test cross-field validation rules
6. Verify error message clarity and accuracy

**Expected Results**:
- Invalid messages rejected with clear errors
- Validation errors specify exact issues
- Field length limits enforced
- Enum validation working
- Cross-field validation applied

**Pass Criteria**: Comprehensive validation with helpful error messages

---

## 3. AI Verdict System Tests (TC-MSG-300 series)

### TC-MSG-301: Diamond Verdict Classification
- **Priority**: High
- **Category**: AI Verdict System
- **Prerequisites**: AI verdict classifier, perfect trading setup
- **Objective**: Test Diamond verdict for perfect trading setups

**Test Steps**:
1. Submit perfect trading setup description
2. Verify Diamond verdict assigned (>80 confidence)
3. Test with multiple timeframe alignment
4. Test with excellent risk-reward ratio
5. Verify technical factor scoring
6. Test confidence score calculation accuracy

**Expected Results**:
- Diamond verdict assigned to perfect setups
- Confidence score 80-100 for Diamond
- Technical factors properly weighted
- Risk factors considered
- Reasoning generated if requested

**Pass Criteria**: Diamond classification accuracy >90% on test data

---

### TC-MSG-302: Fire Verdict Classification
- **Priority**: High
- **Category**: AI Verdict System
- **Prerequisites**: AI verdict classifier, good trading setup
- **Objective**: Test Fire verdict for good setups with warnings

**Test Steps**:
1. Submit good setup with minor concerns
2. Verify Fire verdict assigned (50-79 confidence)
3. Test with mixed technical factors
4. Test with moderate risk factors
5. Verify warning identification
6. Test edge cases between Fire and Diamond

**Expected Results**:
- Fire verdict assigned to decent setups
- Confidence score 50-79 for Fire
- Risk factors properly penalized
- Warnings identified in reasoning
- Consistent classification on edge cases

**Pass Criteria**: Fire classification accuracy >85% on test data

---

### TC-MSG-303: Skull Verdict Classification
- **Priority**: High
- **Category**: AI Verdict System
- **Prerequisites**: AI verdict classifier, poor trading setup
- **Objective**: Test Skull verdict for poor trading setups

**Test Steps**:
1. Submit poor trading setup description
2. Verify Skull verdict assigned (<50 confidence)
3. Test with major risk factors
4. Test with conflicting technical signals
5. Verify negative factor identification
6. Test extreme negative scenarios

**Expected Results**:
- Skull verdict assigned to poor setups
- Confidence score 0-49 for Skull
- Major risk factors heavily penalized
- Negative factors identified
- Clear warnings generated

**Pass Criteria**: Skull classification accuracy >90% on test data

---

### TC-MSG-304: Confidence Score Calculation
- **Priority**: High
- **Category**: AI Verdict Accuracy
- **Prerequisites**: Various trading setups
- **Objective**: Test confidence scoring algorithm accuracy

**Test Steps**:
1. Test base score calculation from technical factors
2. Test risk factor penalty application
3. Test positive factor bonus application
4. Verify score normalization (0-100 range)
5. Test edge case handling
6. Compare against manual analysis

**Expected Results**:
- Confidence scores within 0-100 range
- Technical factors properly weighted
- Risk/positive factors applied correctly
- Scores correlate with setup quality
- Edge cases handled gracefully

**Pass Criteria**: Confidence scoring accuracy within 5% of expected values

---

### TC-MSG-305: Technical Factor Analysis
- **Priority**: Medium
- **Category**: AI Analysis Components
- **Prerequisites**: Structured chart data or descriptions
- **Objective**: Test individual technical factor scoring

**Test Steps**:
1. Test trend alignment scoring
2. Test support/resistance strength analysis
3. Test volume confirmation scoring
4. Test risk-reward ratio calculation
5. Test market structure analysis
6. Test momentum indicator scoring

**Expected Results**:
- Each technical factor scored 0-100
- Factors properly weighted in overall score
- Keyword analysis functioning
- Chart data analysis working (if available)
- Consistent scoring across similar setups

**Pass Criteria**: Technical factors accurately reflect setup quality

---

### TC-MSG-306: Batch Classification Performance
- **Priority**: Low
- **Category**: Performance Testing
- **Prerequisites**: Multiple trading setups
- **Objective**: Test batch classification performance

**Test Steps**:
1. Submit batch of 10 trading setups
2. Submit batch of 100 trading setups
3. Measure processing time per setup
4. Verify all results returned correctly
5. Test error handling in batch processing
6. Test memory usage during batch processing

**Expected Results**:
- Batch processing completes successfully
- Individual results maintain accuracy
- Processing time scales linearly
- Memory usage remains reasonable
- Errors don't affect entire batch

**Pass Criteria**: Batch processing completes within 10 seconds for 100 setups

---

## 4. Psychology Pattern Detection Tests (TC-MSG-400 series)

### TC-MSG-401: Emotional State Detection
- **Priority**: High
- **Category**: Psychology Analysis
- **Prerequisites**: Sample trader messages with emotional content
- **Objective**: Test emotion recognition from trader messages

**Test Steps**:
1. Test confident emotion detection
2. Test anxious/fearful emotion detection
3. Test revenge trading emotion detection
4. Test disciplined emotion detection
5. Test overwhelmed emotion detection
6. Test mixed emotional signals
7. Verify emotion scoring accuracy

**Expected Results**:
- Primary emotions detected correctly
- Emotional keywords recognized
- Context modifiers applied
- Mixed emotions handled appropriately
- Confidence scores for emotion detection

**Pass Criteria**: Emotional state detection accuracy >80%

---

### TC-MSG-402: Pattern Tag Identification
- **Priority**: High
- **Category**: Psychology Patterns
- **Prerequisites**: Messages with trading psychology patterns
- **Objective**: Test psychology pattern identification

**Test Steps**:
1. Test overtrading pattern detection
2. Test revenge trading pattern detection
3. Test FOMO pattern detection
4. Test analysis paralysis pattern detection
5. Test discipline issues pattern detection
6. Test positive patterns (good discipline, risk management)
7. Test complex pattern combinations

**Expected Results**:
- Negative patterns identified correctly
- Positive patterns recognized
- Multiple patterns detected in single message
- Pattern confidence scoring functional
- Complex patterns handled properly

**Pass Criteria**: Pattern detection accuracy >80% across all categories

---

### TC-MSG-403: Coaching Type Recommendation
- **Priority**: High
- **Category**: Coaching System
- **Prerequisites**: Messages with identified patterns/emotions
- **Objective**: Test coaching type suggestion algorithm

**Test Steps**:
1. Test discipline coaching recommendation
2. Test emotional control coaching recommendation
3. Test risk management coaching recommendation
4. Test patience coaching recommendation
5. Test confidence building coaching recommendation
6. Test fear management coaching recommendation
7. Verify recommendation priority system

**Expected Results**:
- Appropriate coaching types suggested
- Priority system working correctly
- Recommendations match detected patterns
- Edge cases handled appropriately
- Consistent recommendations for similar patterns

**Pass Criteria**: Coaching recommendations appropriate for >90% of cases

---

### TC-MSG-404: Overtrading Pattern Detection
- **Priority**: High
- **Category**: Specific Pattern Detection
- **Prerequisites**: Messages indicating overtrading behavior
- **Objective**: Test specific overtrading pattern detection

**Test Steps**:
1. Test frequency-based overtrading detection
2. Test volume-based overtrading detection
3. Test keyword-based detection ("all day", "every setup")
4. Test complex overtrading pattern combinations
5. Verify risk level assessment
6. Test false positive prevention

**Expected Results**:
- Overtrading patterns detected accurately
- Multiple detection methods working
- Risk level appropriately high
- False positives minimized
- Specific recommendations generated

**Pass Criteria**: Overtrading detection accuracy >85%

---

### TC-MSG-405: Revenge Trading Detection
- **Priority**: High
- **Category**: Specific Pattern Detection
- **Prerequisites**: Messages indicating revenge trading
- **Objective**: Test revenge trading pattern identification

**Test Steps**:
1. Test loss-based revenge pattern detection
2. Test anger-based revenge pattern detection
3. Test size increase pattern detection
4. Test emotional language recognition
5. Verify high risk assessment
6. Test intervention recommendations

**Expected Results**:
- Revenge trading patterns identified
- Emotional triggers recognized
- High risk level assigned
- Immediate intervention recommended
- Clear warning messages generated

**Pass Criteria**: Revenge trading detection accuracy >90%

---

### TC-MSG-406: Risk Level Assessment
- **Priority**: Medium
- **Category**: Psychology Risk Assessment
- **Prerequisites**: Messages with various risk patterns
- **Objective**: Test psychological risk level calculation

**Test Steps**:
1. Test low risk level assignment
2. Test medium risk level assignment
3. Test high risk level assignment
4. Test critical risk level assignment
5. Verify risk level consistency
6. Test risk factor weighting

**Expected Results**:
- Risk levels assigned appropriately
- Critical patterns trigger high/critical risk
- Positive patterns reduce risk level
- Risk level consistency maintained
- Clear risk explanations provided

**Pass Criteria**: Risk level assignment accuracy >85%

---

## 5. Full-Text Search Tests (TC-MSG-500 series)

### TC-MSG-501: Basic Text Search Functionality
- **Priority**: Critical
- **Category**: Search Core Features
- **Prerequisites**: 1000+ messages with varied content
- **Objective**: Test basic full-text search capabilities

**Test Steps**:
1. Search for single keyword
2. Search for phrase in quotes
3. Search for multiple keywords
4. Test case-insensitive search
5. Test partial word matching
6. Test search result ranking

**Expected Results**:
- Relevant messages returned
- Ranking by relevance working
- Case insensitivity functional
- Phrase search working
- Multiple keywords handled correctly

**Pass Criteria**: Search returns relevant results with proper ranking

---

### TC-MSG-502: Advanced Search Patterns
- **Priority**: High
- **Category**: Search Advanced Features
- **Prerequisites**: Complex message corpus
- **Objective**: Test advanced search functionality

**Test Steps**:
1. Test boolean operators (AND, OR, NOT)
2. Test wildcard searches
3. Test proximity searches
4. Test synonym expansion
5. Test stop word handling
6. Test special character handling

**Expected Results**:
- Boolean operators work correctly
- Wildcards expand appropriately
- Proximity searches functional
- Stop words handled properly
- Special characters don't break search

**Pass Criteria**: Advanced search patterns work as expected

---

### TC-MSG-503: Search Performance Requirements
- **Priority**: Critical
- **Category**: Performance Testing
- **Prerequisites**: Large message dataset
- **Objective**: Test search response time requirement (<500ms)

**Test Steps**:
1. Measure search time for simple queries
2. Measure search time for complex queries
3. Test with large result sets
4. Test concurrent search requests
5. Test search index effectiveness
6. Profile search performance bottlenecks

**Expected Results**:
- Simple searches complete <200ms
- Complex searches complete <500ms
- Large result sets handled efficiently
- Concurrent searches perform well
- Search index optimizing queries

**Pass Criteria**: All searches complete within 500ms requirement

---

### TC-MSG-504: Search Result Filtering
- **Priority**: High
- **Category**: Search Filtering
- **Prerequisites**: Messages with various metadata
- **Objective**: Test search filtering capabilities

**Test Steps**:
1. Filter by conversation_id
2. Filter by analysis_mode
3. Filter by verdict type
4. Filter by date range
5. Filter by has_attachment
6. Test filter combinations
7. Test invalid filter handling

**Expected Results**:
- All filters work correctly
- Filter combinations function properly
- Invalid filters handled gracefully
- Filtered results accurate
- Performance maintained with filters

**Pass Criteria**: All search filters function correctly

---

### TC-MSG-505: Search Result Highlighting
- **Priority**: Medium
- **Category**: Search UX Features
- **Prerequisites**: Search functionality working
- **Objective**: Test search result highlighting

**Test Steps**:
1. Test keyword highlighting in results
2. Test phrase highlighting
3. Test multiple keyword highlighting
4. Verify HTML safety in highlighting
5. Test highlighting with special characters
6. Test truncated content highlighting

**Expected Results**:
- Keywords highlighted in results
- Highlighting HTML-safe
- Multiple highlights working
- Special characters handled
- Truncated content maintains highlights

**Pass Criteria**: Search highlighting enhances result readability

---

### TC-MSG-506: Search Security and Access Control
- **Priority**: High
- **Category**: Search Security
- **Prerequisites**: Multiple users with different messages
- **Objective**: Test search access control and security

**Test Steps**:
1. Verify user can only search own messages
2. Test cross-user search prevention
3. Test search input sanitization
4. Test search injection prevention
5. Verify conversation access control
6. Test authenticated-only search access

**Expected Results**:
- Search limited to user's messages
- Cross-user access blocked
- Input properly sanitized
- Injection attempts blocked
- Authentication required for search

**Pass Criteria**: Search maintains strict security controls

---

## 6. Message Threading Tests (TC-MSG-600 series)

### TC-MSG-601: Basic Message Threading
- **Priority**: High
- **Category**: Message Threading
- **Prerequisites**: Messages with parent-child relationships
- **Objective**: Test basic message threading functionality

**Test Steps**:
1. Create parent user message
2. Create AI response with parent_message_id
3. Retrieve complete thread
4. Verify thread hierarchy
5. Test thread depth tracking
6. Test thread message ordering

**Expected Results**:
- Parent-child relationships created
- Complete threads retrieved correctly
- Thread hierarchy maintained
- Depth tracking functional
- Messages ordered chronologically within thread

**Pass Criteria**: Basic threading works correctly with proper hierarchy

---

### TC-MSG-602: Recursive Thread Retrieval
- **Priority**: High
- **Category**: Thread Performance
- **Prerequisites**: Multi-level message threads
- **Objective**: Test recursive thread retrieval performance

**Test Steps**:
1. Create thread with 3+ levels
2. Test complete thread retrieval
3. Measure query performance
4. Test with wide threads (many children)
5. Test with deep threads (many levels)
6. Verify recursive query correctness

**Expected Results**:
- Multi-level threads retrieved correctly
- Recursive queries perform well
- Wide and deep threads handled
- Query performance acceptable
- No infinite recursion issues

**Pass Criteria**: Recursive thread retrieval completes <100ms

---

### TC-MSG-603: Child Message Management
- **Priority**: High
- **Category**: Thread Management
- **Prerequisites**: Parent messages with children
- **Objective**: Test child message operations

**Test Steps**:
1. Get immediate children of parent message
2. Test child message ordering
3. Test child count accuracy
4. Handle parent message deletion
5. Test orphaned message behavior
6. Verify child access control

**Expected Results**:
- Child messages retrieved correctly
- Proper chronological ordering
- Accurate child counts
- Orphaned messages handled gracefully
- Access control maintained for children

**Pass Criteria**: Child message management works reliably

---

### TC-MSG-604: Thread Statistics and Metadata
- **Priority**: Medium
- **Category**: Thread Analytics
- **Prerequisites**: Various message threads
- **Objective**: Test thread statistics calculation

**Test Steps**:
1. Calculate thread message count
2. Calculate thread depth
3. Track thread participants
4. Calculate thread activity timeline
5. Test thread performance metrics
6. Verify statistics accuracy

**Expected Results**:
- Accurate thread statistics calculated
- Depth calculation correct
- Participant tracking functional
- Timeline data accurate
- Performance metrics useful

**Pass Criteria**: Thread statistics accurate and performant

---

## 7. API Endpoint Tests (TC-MSG-700 series)

### TC-MSG-701: POST /api/messages Endpoint
- **Priority**: Critical
- **Category**: API Testing
- **Prerequisites**: Express server, authentication
- **Objective**: Test message creation API endpoint

**Test Steps**:
1. POST valid user message with authentication
2. POST AI message with verdict data
3. POST without authentication (should fail)
4. POST with invalid data (should fail)
5. POST with missing required fields (should fail)
6. Test rate limiting
7. Verify response format and status codes

**Expected Results**:
- Valid messages created successfully (201)
- Invalid requests rejected appropriately (400)
- Authentication required (401)
- Rate limiting functional (429)
- Response format consistent
- Proper error messages returned

**Pass Criteria**: API endpoint secure and functional per specification

---

### TC-MSG-702: GET /api/messages/:id Endpoint
- **Priority**: Critical
- **Category**: API Testing
- **Prerequisites**: Test messages in database
- **Objective**: Test single message retrieval endpoint

**Test Steps**:
1. GET valid message ID with owner authentication
2. GET message ID with different user (should fail)
3. GET invalid UUID format (should fail)
4. GET non-existent message ID (404)
5. GET without authentication (should fail)
6. Verify response format and field filtering

**Expected Results**:
- Valid requests return message data (200)
- Cross-user access blocked (404/403)
- Invalid IDs rejected (400)
- Non-existent messages return 404
- Authentication required (401)
- Response format consistent

**Pass Criteria**: Secure message retrieval with proper access control

---

### TC-MSG-703: GET /api/messages/conversation/:id Endpoint
- **Priority**: Critical
- **Category**: API Testing
- **Prerequisites**: Conversation with multiple messages
- **Objective**: Test conversation message listing endpoint

**Test Steps**:
1. GET conversation messages with authentication
2. Test pagination parameters (limit, offset)
3. Test ordering parameter (ASC/DESC)
4. Test with invalid conversation ID
5. Test cross-user conversation access (should fail)
6. Test include_metadata parameter

**Expected Results**:
- Messages returned with pagination (200)
- Pagination parameters respected
- Ordering working correctly
- Invalid IDs rejected (400)
- Cross-user access blocked (404)
- Metadata inclusion optional

**Pass Criteria**: Paginated conversation messages with proper security

---

### TC-MSG-704: GET /api/messages/search Endpoint
- **Priority**: High
- **Category**: API Testing
- **Prerequisites**: Searchable message corpus
- **Objective**: Test full-text search API endpoint

**Test Steps**:
1. GET search with valid query and authentication
2. Test search with filters (verdict, date range, etc.)
3. Test pagination on search results
4. Test with missing search query (should fail)
5. Test with too-short query (should fail)
6. Test search rate limiting

**Expected Results**:
- Valid searches return results (200)
- Filters applied correctly
- Pagination functional
- Missing query rejected (400)
- Short queries rejected (400)
- Rate limiting applied (429)

**Pass Criteria**: Full-text search API functional with proper validation

---

### TC-MSG-705: Message Threading API Endpoints
- **Priority**: High
- **Category**: API Testing
- **Prerequisites**: Messages with threading relationships
- **Objective**: Test thread-related API endpoints

**Test Steps**:
1. GET /api/messages/:id/thread with valid ID
2. GET /api/messages/:id/children with valid ID
3. Test with invalid message IDs
4. Test with non-existent message IDs
5. Test cross-user access prevention
6. Verify thread data format

**Expected Results**:
- Valid thread requests return data (200)
- Child message requests functional
- Invalid IDs rejected (400)
- Non-existent IDs return 404
- Cross-user access blocked
- Response format consistent

**Pass Criteria**: Thread API endpoints secure and functional

---

### TC-MSG-706: API Authentication and Authorization
- **Priority**: Critical
- **Category**: API Security
- **Prerequisites**: User authentication system
- **Objective**: Test API authentication and authorization

**Test Steps**:
1. Test all endpoints without authentication token
2. Test with invalid/expired authentication token
3. Test with valid authentication
4. Verify user-specific data access
5. Test token refresh requirements
6. Test rate limiting bypass for premium users

**Expected Results**:
- Unauthenticated requests rejected (401)
- Invalid tokens rejected (401)
- Valid authentication allows access
- User data isolation maintained
- Token requirements enforced
- Premium rate limit bypass working

**Pass Criteria**: Strict authentication/authorization on all endpoints

---

### TC-MSG-707: API Rate Limiting
- **Priority**: High
- **Category**: API Security
- **Prerequisites**: Rate limiting middleware
- **Objective**: Test API rate limiting functionality

**Test Steps**:
1. Test standard rate limits for different endpoints
2. Test burst request handling
3. Test rate limit reset timing
4. Test premium user rate limit bypass
5. Test rate limit error responses
6. Test concurrent request handling

**Expected Results**:
- Rate limits enforced per endpoint
- Burst requests handled appropriately
- Limits reset after time window
- Premium bypass functional
- Clear rate limit error messages (429)
- Concurrent requests managed

**Pass Criteria**: Rate limiting protects API without impacting user experience

---

### TC-MSG-708: API Error Handling and Responses
- **Priority**: High
- **Category**: API Quality
- **Prerequisites**: Various error conditions
- **Objective**: Test API error handling and response quality

**Test Steps**:
1. Test validation error responses
2. Test server error handling (500)
3. Test not found error responses (404)
4. Test unauthorized error responses (401)
5. Test rate limit error responses (429)
6. Verify error message clarity and consistency

**Expected Results**:
- Appropriate HTTP status codes
- Clear, helpful error messages
- Consistent error response format
- Security-conscious error details
- Proper error logging
- No sensitive data in errors

**Pass Criteria**: High-quality error handling with consistent responses

---

## 8. Security Tests (TC-MSG-800 series)

### TC-MSG-801: Input Validation and Sanitization
- **Priority**: Critical
- **Category**: Security
- **Prerequisites**: Various malicious input payloads
- **Objective**: Test input validation and sanitization

**Test Steps**:
1. Test SQL injection attempts
2. Test XSS payload attempts
3. Test malicious JSON in JSONB fields
4. Test buffer overflow attempts
5. Test script injection in content
6. Test path traversal attempts

**Expected Results**:
- All malicious input blocked/sanitized
- SQL injection prevented
- XSS payloads neutralized
- Malicious JSON rejected
- Buffer overflows prevented
- Path traversal blocked

**Pass Criteria**: All security tests pass with no vulnerabilities

---

### TC-MSG-802: Access Control and Data Isolation
- **Priority**: Critical
- **Category**: Security
- **Prerequisites**: Multiple test users
- **Objective**: Test user data isolation and access control

**Test Steps**:
1. Test cross-user message access prevention
2. Test conversation ownership validation
3. Test message search isolation
4. Test thread access control
5. Test admin vs user access levels
6. Test data leakage prevention

**Expected Results**:
- Users can only access their own data
- Conversation ownership enforced
- Search results properly isolated
- Thread access controlled
- Admin access appropriately scoped
- No data leakage between users

**Pass Criteria**: Complete data isolation with no cross-user access

---

### TC-MSG-803: Authentication Security
- **Priority**: Critical
- **Category**: Security
- **Prerequisites**: Authentication system
- **Objective**: Test authentication security measures

**Test Steps**:
1. Test token validation security
2. Test token expiration handling
3. Test session management
4. Test brute force protection
5. Test concurrent session handling
6. Test authentication bypass attempts

**Expected Results**:
- Token validation secure
- Expired tokens rejected
- Sessions managed properly
- Brute force attempts blocked
- Concurrent sessions handled
- No authentication bypass possible

**Pass Criteria**: Authentication system secure against common attacks

---

### TC-MSG-804: API Security Headers and Configuration
- **Priority**: High
- **Category**: Security
- **Prerequisites**: Express server with security middleware
- **Objective**: Test API security configuration

**Test Steps**:
1. Test CORS configuration
2. Test security headers (HSTS, CSP, etc.)
3. Test request size limits
4. Test timeout configurations
5. Test SSL/TLS enforcement
6. Test security middleware functionality

**Expected Results**:
- CORS properly configured
- Security headers present
- Request size limits enforced
- Timeouts prevent DoS
- SSL/TLS required
- Security middleware active

**Pass Criteria**: API properly configured for security

---

## 9. Performance Tests (TC-MSG-900 series)

### TC-MSG-901: Database Query Performance
- **Priority**: Critical
- **Category**: Performance
- **Prerequisites**: Large message dataset
- **Objective**: Test query performance requirements (<100ms)

**Test Steps**:
1. Measure single message retrieval time
2. Measure conversation message listing time
3. Measure message creation time
4. Measure message update time
5. Test with concurrent operations
6. Profile slow queries

**Expected Results**:
- Single message queries <50ms
- Conversation listings <100ms
- Message creation <100ms
- Updates <100ms
- Concurrent performance maintained
- No slow queries identified

**Pass Criteria**: All database operations meet <100ms requirement

---

### TC-MSG-902: Search Performance Testing
- **Priority**: Critical
- **Category**: Performance
- **Prerequisites**: Large searchable corpus
- **Objective**: Test search performance requirement (<500ms)

**Test Steps**:
1. Measure simple search query time
2. Measure complex search query time
3. Test search with filters
4. Test large result set performance
5. Measure search index effectiveness
6. Test concurrent search performance

**Expected Results**:
- Simple searches <200ms
- Complex searches <500ms
- Filtered searches <500ms
- Large result sets handled efficiently
- Search indexes optimizing performance
- Concurrent searches performing well

**Pass Criteria**: All searches complete within 500ms requirement

---

### TC-MSG-903: Concurrent Operations Testing
- **Priority**: High
- **Category**: Performance
- **Prerequisites**: Load testing tools
- **Objective**: Test system under concurrent load

**Test Steps**:
1. Test 50 concurrent message creations
2. Test 100 concurrent message retrievals
3. Test 25 concurrent search operations
4. Test mixed operation load
5. Measure response time degradation
6. Test system stability under load

**Expected Results**:
- Concurrent operations complete successfully
- Response times remain reasonable
- No deadlocks or conflicts
- System remains stable
- Performance degrades gracefully
- Database connections managed properly

**Pass Criteria**: System handles concurrent load without failure

---

### TC-MSG-904: Memory and Resource Usage
- **Priority**: Medium
- **Category**: Performance
- **Prerequisites**: Resource monitoring tools
- **Objective**: Test system resource usage

**Test Steps**:
1. Monitor memory usage during operations
2. Test memory usage with large datasets
3. Monitor CPU usage patterns
4. Test database connection pool usage
5. Monitor disk I/O patterns
6. Test garbage collection impact

**Expected Results**:
- Memory usage stays within reasonable bounds
- No memory leaks detected
- CPU usage efficient
- Connection pooling effective
- Disk I/O optimized
- Garbage collection minimal impact

**Pass Criteria**: Resource usage efficient and stable

---

## 10. Test Execution Summary

### Test Execution Order
1. **Database Schema Tests** (TC-MSG-100) - Foundation
2. **CRUD Operations Tests** (TC-MSG-200) - Core functionality
3. **AI Verdict Tests** (TC-MSG-300) - AI integration
4. **Psychology Tests** (TC-MSG-400) - Psychology features
5. **Search Tests** (TC-MSG-500) - Search functionality
6. **Threading Tests** (TC-MSG-600) - Threading features
7. **API Tests** (TC-MSG-700) - API endpoints
8. **Security Tests** (TC-MSG-800) - Security validation
9. **Performance Tests** (TC-MSG-900) - Performance validation

### Pass/Fail Criteria
- **PASS**: All Critical tests pass, <5% High priority failures
- **CONDITIONAL PASS**: All Critical tests pass, <10% High priority failures
- **FAIL**: Any Critical test failures or >20% overall failures

### Risk Mitigation
- Mock external AI services for consistent testing
- Use transaction isolation for concurrent tests
- Implement test data cleanup between runs
- Monitor test environment stability

---

**Total Test Cases**: 85+
**Critical Priority**: 25 tests
**High Priority**: 35 tests
**Medium Priority**: 20 tests
**Low Priority**: 5+ tests

**Estimated Execution Time**: 2-3 days for complete test suite