# Test Cases - PRD 1.1.2.2 CORS Configuration

**Document**: Test Cases  
**PRD**: PRD-1.1.2.2-cors-configuration  
**Version**: 1.0  
**Date**: 2025-08-14  
**Test ID Format**: TC-1.1.2.2-XXX

## 1. Configuration Tests

### TC-1.1.2.2-001: CORS Middleware Installation
**Priority**: Critical  
**Description**: Verify CORS middleware is installed and configured  
**Preconditions**: Express server initialized  
**Test Steps**:
1. Check package.json for cors dependency
2. Verify cors middleware is imported
3. Confirm middleware is applied to Express app
**Expected Results**: CORS middleware properly installed and configured

### TC-1.1.2.2-002: Environment Variable Configuration
**Priority**: High  
**Description**: Test environment-specific CORS configuration  
**Preconditions**: Environment variables set  
**Test Steps**:
1. Set ALLOWED_ORIGINS environment variable
2. Set CORS_MAX_AGE environment variable
3. Start server and check configuration
**Expected Results**: Environment variables properly parsed and applied

### TC-1.1.2.2-003: Default Origins Configuration
**Priority**: High  
**Description**: Verify default origins for each environment  
**Test Steps**:
1. Test development environment defaults
2. Test staging environment defaults
3. Test production environment defaults
**Expected Results**: Correct default origins for each environment

## 2. Functional Tests

### TC-1.1.2.2-004: Authorized Origin Request
**Priority**: Critical  
**Description**: Test request from authorized origin  
**Test Steps**:
1. Send GET request from http://localhost:3000
2. Check response headers
3. Verify Access-Control-Allow-Origin header
**Expected Results**: Request allowed with proper CORS headers

### TC-1.1.2.2-005: Unauthorized Origin Request
**Priority**: Critical  
**Description**: Test request from unauthorized origin  
**Test Steps**:
1. Send request from http://malicious.com
2. Check response status
3. Verify error message
**Expected Results**: Request blocked with 403 error

### TC-1.1.2.2-006: Preflight Request Handling
**Priority**: Critical  
**Description**: Test OPTIONS preflight request  
**Test Steps**:
1. Send OPTIONS request with complex headers
2. Check preflight response headers
3. Verify allowed methods and headers
**Expected Results**: Preflight request handled with proper headers

### TC-1.1.2.2-007: Credential Sharing
**Priority**: High  
**Description**: Test credential sharing in cross-origin requests  
**Test Steps**:
1. Send request with credentials: true
2. Include authentication cookie
3. Verify cookie is sent and accepted
**Expected Results**: Credentials properly shared

### TC-1.1.2.2-008: HTTP Methods Whitelisting
**Priority**: High  
**Description**: Verify allowed HTTP methods  
**Test Steps**:
1. Test GET, POST, PUT, DELETE methods
2. Test OPTIONS and HEAD methods
3. Test non-whitelisted method (TRACE)
**Expected Results**: Whitelisted methods allowed, others blocked

### TC-1.1.2.2-009: Request Headers Whitelisting
**Priority**: Medium  
**Description**: Test allowed request headers  
**Test Steps**:
1. Send request with Content-Type header
2. Send request with Authorization header
3. Send request with non-whitelisted header
**Expected Results**: Whitelisted headers accepted

### TC-1.1.2.2-010: Response Headers Exposure
**Priority**: Medium  
**Description**: Test exposed response headers  
**Test Steps**:
1. Make request and check response
2. Verify X-Request-ID is exposed
3. Verify rate limit headers are exposed
**Expected Results**: Specified headers exposed to client

## 3. Security Tests

### TC-1.1.2.2-011: Origin Spoofing Prevention
**Priority**: Critical  
**Description**: Test protection against origin spoofing  
**Test Steps**:
1. Send request with forged Origin header
2. Attempt to bypass validation
3. Check security logs
**Expected Results**: Spoofing attempt blocked and logged

### TC-1.1.2.2-012: Wildcard Origin Prevention
**Priority**: High  
**Description**: Verify wildcard (*) origin is not used  
**Test Steps**:
1. Check CORS configuration
2. Test with various origins
3. Confirm no wildcard acceptance
**Expected Results**: No wildcard origin acceptance

### TC-1.1.2.2-013: Strict CORS for Sensitive Endpoints
**Priority**: High  
**Description**: Test strict CORS on sensitive endpoints  
**Test Steps**:
1. Access /api/admin endpoint
2. Test from various origins
3. Verify strict policy applies
**Expected Results**: Only specific production origins allowed

### TC-1.1.2.2-014: CORS Error Messages
**Priority**: Medium  
**Description**: Verify secure error messages  
**Test Steps**:
1. Trigger CORS violation
2. Check error response
3. Verify no sensitive information leaked
**Expected Results**: Generic error without sensitive details

## 4. Performance Tests

### TC-1.1.2.2-015: Preflight Cache MaxAge
**Priority**: High  
**Description**: Test preflight response caching  
**Test Steps**:
1. Send preflight request
2. Check Cache-Control header
3. Verify maxAge value (86400 seconds)
**Expected Results**: Preflight cached for 24 hours

### TC-1.1.2.2-016: CORS Processing Latency
**Priority**: High  
**Description**: Measure CORS overhead  
**Test Steps**:
1. Measure request without CORS
2. Measure request with CORS
3. Calculate overhead
**Expected Results**: < 5ms additional latency

### TC-1.1.2.2-017: Concurrent Cross-Origin Requests
**Priority**: Medium  
**Description**: Test multiple simultaneous CORS requests  
**Test Steps**:
1. Send 100 concurrent requests
2. Monitor server performance
3. Check all responses
**Expected Results**: All requests handled efficiently

## 5. WebSocket CORS Tests

### TC-1.1.2.2-018: WebSocket Connection with CORS
**Priority**: Critical  
**Description**: Test WebSocket CORS configuration  
**Test Steps**:
1. Connect WebSocket from authorized origin
2. Send and receive messages
3. Verify connection stability
**Expected Results**: WebSocket works with CORS

### TC-1.1.2.2-019: WebSocket Unauthorized Origin
**Priority**: High  
**Description**: Test WebSocket from unauthorized origin  
**Test Steps**:
1. Attempt connection from unauthorized origin
2. Check connection result
3. Verify error handling
**Expected Results**: Connection rejected with error

## 6. Logging and Monitoring Tests

### TC-1.1.2.2-020: CORS Event Logging
**Priority**: Medium  
**Description**: Verify CORS events are logged  
**Test Steps**:
1. Enable CORS logging
2. Make various requests
3. Check log entries
**Expected Results**: All CORS events properly logged

### TC-1.1.2.2-021: CORS Violation Alerts
**Priority**: Medium  
**Description**: Test security alerts for violations  
**Test Steps**:
1. Trigger CORS violation
2. Check security logs
3. Verify alert mechanism
**Expected Results**: Violations logged with appropriate severity

### TC-1.1.2.2-022: CORS Status Endpoint
**Priority**: Low  
**Description**: Test /health/cors monitoring endpoint  
**Test Steps**:
1. Access /health/cors endpoint
2. Verify configuration details
3. Check allowed origins list
**Expected Results**: Current CORS configuration displayed

## 7. Environment-Specific Tests

### TC-1.1.2.2-023: Development Environment CORS
**Priority**: High  
**Description**: Test CORS in development mode  
**Test Steps**:
1. Set NODE_ENV=development
2. Test localhost origins
3. Test local network origins
**Expected Results**: Flexible CORS for development

### TC-1.1.2.2-024: Production Environment CORS
**Priority**: Critical  
**Description**: Test CORS in production mode  
**Test Steps**:
1. Set NODE_ENV=production
2. Test production origins only
3. Verify strict validation
**Expected Results**: Strict CORS for production

## 8. Integration Tests

### TC-1.1.2.2-025: CORS with Authentication
**Priority**: High  
**Description**: Test CORS with JWT authentication  
**Test Steps**:
1. Login from cross-origin
2. Use JWT token in subsequent requests
3. Verify authentication works with CORS
**Expected Results**: Authentication works across origins

### TC-1.1.2.2-026: CORS with File Uploads
**Priority**: Medium  
**Description**: Test CORS for file upload endpoints  
**Test Steps**:
1. Upload file from cross-origin
2. Check multipart/form-data handling
3. Verify file received
**Expected Results**: File uploads work with CORS

## 9. Edge Cases

### TC-1.1.2.2-027: Missing Origin Header
**Priority**: Medium  
**Description**: Test request without Origin header  
**Test Steps**:
1. Send request without Origin header
2. Check server response
3. Verify handling
**Expected Results**: Request allowed (same-origin)

### TC-1.1.2.2-028: IPv6 Localhost Origin
**Priority**: Low  
**Description**: Test IPv6 localhost origin  
**Test Steps**:
1. Send request from [::1]:3000
2. Check CORS validation
3. Verify development mode handling
**Expected Results**: IPv6 localhost allowed in development

## Summary

**Total Test Cases**: 28  
**Critical Priority**: 8 cases  
**High Priority**: 11 cases  
**Medium Priority**: 7 cases  
**Low Priority**: 2 cases  

## Acceptance Criteria Mapping

### Functional Requirements Coverage:
- **FR-1**: TC-001, TC-004
- **FR-2**: TC-003, TC-004, TC-005
- **FR-3**: TC-006, TC-015
- **FR-4**: TC-007, TC-025
- **FR-5**: TC-008, TC-009

### Non-Functional Requirements Coverage:
- **NFR-1**: TC-011, TC-012, TC-013
- **NFR-2**: TC-002, TC-023, TC-024
- **NFR-3**: TC-015, TC-016, TC-017
- **NFR-4**: TC-011, TC-012, TC-014