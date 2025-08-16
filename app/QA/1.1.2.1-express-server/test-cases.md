# Test Cases - PRD 1.1.2.1 Express Server Implementation

**Document**: Test Cases  
**PRD**: PRD-1.1.2.1-express-server  
**Version**: 1.0  
**Date**: 2025-08-14  
**Test ID Format**: TC-1.1.2.1-XXX

## 1. Server Initialization Tests

### TC-1.1.2.1-001: Server Startup Success
**Priority**: Critical  
**Description**: Verify server starts successfully and listens on configured port  
**Expected Results**: Server starts without errors, startup time < 3 seconds
**Acceptance Criteria**: Server starts successfully and accepts connections on configured port

### TC-1.1.2.1-002: Environment Validation
**Priority**: High  
**Description**: Verify environment variable validation on server startup  
**Expected Results**: Server fails gracefully with clear error messages when required env vars missing

### TC-1.1.2.1-003: TypeScript Configuration
**Priority**: Medium  
**Description**: Verify TypeScript support is properly configured  
**Expected Results**: ES module imports work, no compilation errors

## 2. WebSocket Integration Tests

### TC-1.1.2.1-004: WebSocket Server Initialization
**Priority**: Critical  
**Description**: Verify Socket.io WebSocket server initializes correctly  
**Expected Results**: Socket.io server created with proper CORS and transport config
**Acceptance Criteria**: WebSocket connections establish and maintain stable communication

### TC-1.1.2.1-005: WebSocket Connection Establishment
**Priority**: Critical  
**Description**: Test WebSocket connection from client with authentication  
**Expected Results**: Authenticated connections establish successfully with user rooms

### TC-1.1.2.1-006: WebSocket Authentication Middleware
**Priority**: High  
**Description**: Verify WebSocket connections require valid authentication  
**Expected Results**: Invalid/missing JWT tokens rejected with proper error messages

### TC-1.1.2.1-007: WebSocket Message Handling
**Priority**: Critical  
**Description**: Test real-time message sending and receiving  
**Expected Results**: Messages stored in database and broadcast to conversation participants

### TC-1.1.2.1-008: WebSocket Room Management
**Priority**: Medium  
**Description**: Test conversation room joining and leaving  
**Expected Results**: Room operations work with proper participant notifications

### TC-1.1.2.1-009: WebSocket Rate Limiting
**Priority**: High  
**Description**: Verify rate limiting on WebSocket events  
**Expected Results**: Rate limits enforced (10 messages/minute) with proper error responses

## 3. RESTful API Endpoint Tests

### TC-1.1.2.1-010: Health Check Endpoint
**Priority**: Critical  
**Description**: Test main health check endpoint functionality  
**Expected Results**: Returns 200 status, includes WebSocket status and system info
**Acceptance Criteria**: All API endpoints respond with proper status codes and data formats

### TC-1.1.2.1-011: Database Health Check
**Priority**: High  
**Description**: Test database connectivity health endpoint  
**Expected Results**: Confirms database connection with current time and version

### TC-1.1.2.1-012: WebSocket Health Check
**Priority**: Medium  
**Description**: Test WebSocket server health endpoint  
**Expected Results**: Returns WebSocket status and connected client count

### TC-1.1.2.1-013: API Documentation Endpoint
**Priority**: Low  
**Description**: Test API documentation endpoint  
**Expected Results**: Complete API documentation with all endpoints and WebSocket events

### TC-1.1.2.1-014: API Route Integration
**Priority**: Critical  
**Description**: Verify all API routes properly mounted and accessible  
**Expected Results**: All route categories accessible with proper middleware applied

## 4. Authentication Middleware Tests

### TC-1.1.2.1-015: JWT Authentication Success
**Priority**: Critical  
**Description**: Test JWT authentication middleware with valid tokens  
**Expected Results**: Valid tokens processed successfully with user context

### TC-1.1.2.1-016: JWT Authentication Failure
**Priority**: High  
**Description**: Test JWT authentication with invalid tokens  
**Expected Results**: All invalid token scenarios return 401 Unauthorized

### TC-1.1.2.1-017: Security Headers Middleware
**Priority**: High  
**Description**: Verify security headers applied to responses  
**Expected Results**: Helmet security headers and CSP policies applied

## 5. Rate Limiting Tests

### TC-1.1.2.1-018: Basic Rate Limiting
**Priority**: High  
**Description**: Test basic API rate limiting functionality  
**Expected Results**: Rate limits enforced (100 req/15min) with 429 responses

### TC-1.1.2.1-019: Tier-Based Rate Limiting
**Priority**: High  
**Description**: Test tier-based rate limiting for different user types  
**Expected Results**: Correct limits applied per tier (free: 50, premium: 200, enterprise: 1000)

### TC-1.1.2.1-020: Authentication Rate Limiting
**Priority**: Critical  
**Description**: Test stricter rate limiting on auth endpoints  
**Expected Results**: Auth endpoints limited to 5 attempts with 15-minute lockout

## 6. Performance Tests

### TC-1.1.2.1-021: Server Response Time
**Priority**: High  
**Description**: Verify API response times meet requirements  
**Expected Results**: Standard operations < 200ms, health checks < 100ms
**Acceptance Criteria**: API response time < 200ms for standard operations

### TC-1.1.2.1-022: Concurrent WebSocket Connections
**Priority**: High  
**Description**: Test WebSocket server with multiple concurrent connections  
**Expected Results**: Server handles 100+ concurrent connections with stable performance
**Acceptance Criteria**: WebSocket connection stability >99% uptime

### TC-1.1.2.1-023: Server Startup Time
**Priority**: Medium  
**Description**: Verify server startup time meets requirements  
**Expected Results**: Consistent startup time < 3 seconds
**Acceptance Criteria**: Server startup time < 3 seconds

## 7. Error Handling Tests

### TC-1.1.2.1-024: Global Error Handler
**Priority**: Critical  
**Description**: Test global error handling middleware  
**Expected Results**: All errors caught with consistent format and proper logging

### TC-1.1.2.1-025: 404 Not Found Handler
**Priority**: Medium  
**Description**: Test 404 handler for non-existent routes  
**Expected Results**: Non-existent routes return 404 with JSON error response

## 8. Configuration Tests

### TC-1.1.2.1-026: Environment-Based Configuration
**Priority**: High  
**Description**: Test configuration loading for different environments  
**Expected Results**: Correct environment-specific settings loaded

### TC-1.1.2.1-027: CORS Configuration
**Priority**: High  
**Description**: Test CORS configuration for frontend integration  
**Expected Results**: CORS properly configured for allowed origins

## 9. Graceful Shutdown Tests

### TC-1.1.2.1-028: Signal Handling
**Priority**: Medium  
**Description**: Test graceful shutdown on system signals  
**Expected Results**: Server responds to signals and shuts down cleanly within 10 seconds

### TC-1.1.2.1-029: Connection Cleanup
**Priority**: Medium  
**Description**: Test cleanup of active connections during shutdown  
**Expected Results**: All connections closed gracefully without resource leaks

## Summary

**Total Test Cases**: 29  
**Critical Priority**: 10 cases  
**High Priority**: 13 cases  
**Medium Priority**: 5 cases  
**Low Priority**: 1 case  

## Acceptance Criteria Mapping

### Primary Acceptance Criteria:
- **Criteria 1**: TC-1.1.2.1-001, TC-1.1.2.1-010, TC-1.1.2.1-014
- **Criteria 2**: TC-1.1.2.1-004, TC-1.1.2.1-005, TC-1.1.2.1-022  
- **Criteria 3**: TC-1.1.2.1-010, TC-1.1.2.1-014, TC-1.1.2.1-021

### Success Metrics:
- **KPI 1**: TC-1.1.2.1-023 (Server startup time < 3 seconds)
- **KPI 2**: TC-1.1.2.1-021 (API response time < 200ms)  
- **KPI 3**: TC-1.1.2.1-022 (WebSocket stability >99% uptime)

## Overall Status
- **Pass Criteria**: All Critical and High priority test cases must pass
- **Overall Status**: Pass required before Ready status
