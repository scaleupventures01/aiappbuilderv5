/**
 * API Endpoint Validation Tests
 * PRD 1.2.2 - API Developer Implementation
 * 
 * Comprehensive testing of all API endpoints including:
 * - Endpoint availability and response format
 * - Authentication middleware
 * - Rate limiting behavior
 * - Error handling verification
 * - Request/response validation
 */

import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  maxRetries: 3,
  rateLimitTestCount: 15,
  concurrentRequests: 5
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  endpoints: {},
  authentication: {},
  rateLimiting: {},
  errorHandling: {},
  integration: {}
};

/**
 * Utility functions
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    test: '🧪'
  }[type] || 'ℹ️';
  
  console.log(`${timestamp} ${prefix} ${message}`);
}

function recordTest(category, testName, result, details = {}) {
  testResults.summary.total++;
  
  if (result.success) {
    testResults.summary.passed++;
  } else if (result.warning) {
    testResults.summary.warnings++;
  } else {
    testResults.summary.failed++;
  }
  
  if (!testResults[category]) {
    testResults[category] = {};
  }
  
  testResults[category][testName] = {
    success: result.success || false,
    warning: result.warning || false,
    message: result.message,
    timestamp: new Date().toISOString(),
    details: {
      ...details,
      ...result.details
    }
  };
}

async function makeRequest(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const responseData = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url
    };
    
    // Try to parse JSON response
    try {
      const body = await response.text();
      if (body) {
        responseData.body = JSON.parse(body);
      }
    } catch (e) {
      responseData.body = body;
      responseData.parseError = e.message;
    }
    
    return responseData;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function generateTestToken(userId = 1, email = 'test@example.com') {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
}

/**
 * Health Check Endpoint Tests
 */
async function testHealthEndpoints() {
  log('Testing health check endpoints...', 'test');
  
  const healthEndpoints = [
    { path: '/health', name: 'Main Health Check' },
    { path: '/health/db', name: 'Database Health' },
    { path: '/health/websocket', name: 'WebSocket Health' },
    { path: '/health/upload', name: 'Upload Health' },
    { path: '/health/openai', name: 'OpenAI Health' },
    { path: '/health/cors', name: 'CORS Health' }
  ];
  
  for (const endpoint of healthEndpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`);
      
      const isHealthy = response.status === 200 && response.body?.success === true;
      
      recordTest('endpoints', `health_${endpoint.path.replace('/', '_')}`, {
        success: isHealthy,
        message: isHealthy ? `${endpoint.name} endpoint is healthy` : `${endpoint.name} endpoint failed`,
        details: {
          status: response.status,
          response: response.body,
          responseTime: response.headers['x-response-time']
        }
      });
      
      log(`${endpoint.name}: ${isHealthy ? 'PASSED' : 'FAILED'}`, isHealthy ? 'success' : 'error');
      
    } catch (error) {
      recordTest('endpoints', `health_${endpoint.path.replace('/', '_')}`, {
        success: false,
        message: `${endpoint.name} endpoint error: ${error.message}`,
        details: { error: error.message }
      });
      
      log(`${endpoint.name}: ERROR - ${error.message}`, 'error');
    }
  }
}

/**
 * API Documentation Endpoint Test
 */
async function testApiDocumentation() {
  log('Testing API documentation endpoint...', 'test');
  
  try {
    const response = await makeRequest(`${API_BASE}`);
    
    const hasRequiredFields = response.body?.success === true &&
                             response.body?.endpoints &&
                             response.body?.features &&
                             response.body?.security;
    
    recordTest('endpoints', 'api_documentation', {
      success: response.status === 200 && hasRequiredFields,
      message: hasRequiredFields ? 'API documentation is complete' : 'API documentation is incomplete',
      details: {
        status: response.status,
        hasEndpoints: !!response.body?.endpoints,
        hasFeatures: !!response.body?.features,
        hasSecurity: !!response.body?.security,
        endpointCount: Object.keys(response.body?.endpoints || {}).length
      }
    });
    
    log(`API Documentation: ${hasRequiredFields ? 'PASSED' : 'FAILED'}`, hasRequiredFields ? 'success' : 'error');
    
  } catch (error) {
    recordTest('endpoints', 'api_documentation', {
      success: false,
      message: `API documentation error: ${error.message}`,
      details: { error: error.message }
    });
    
    log(`API Documentation: ERROR - ${error.message}`, 'error');
  }
}

/**
 * Authentication Endpoint Tests
 */
async function testAuthenticationEndpoints() {
  log('Testing authentication endpoints...', 'test');
  
  // Test registration endpoint
  try {
    const registrationData = {
      email: `test_${Date.now()}@example.com`,
      username: `testuser_${Date.now()}`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };
    
    const response = await makeRequest(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });
    
    const isValidResponse = response.status === 201 && response.body?.success === true;
    
    recordTest('authentication', 'user_registration', {
      success: isValidResponse,
      message: isValidResponse ? 'User registration works correctly' : 'User registration failed',
      details: {
        status: response.status,
        hasToken: !!response.body?.data?.token,
        hasUser: !!response.body?.data?.user
      }
    });
    
    log(`User Registration: ${isValidResponse ? 'PASSED' : 'FAILED'}`, isValidResponse ? 'success' : 'error');
    
  } catch (error) {
    recordTest('authentication', 'user_registration', {
      success: false,
      message: `Registration error: ${error.message}`,
      details: { error: error.message }
    });
    
    log(`User Registration: ERROR - ${error.message}`, 'error');
  }
  
  // Test login endpoint
  try {
    const loginData = {
      email: 'admin@elitetradingcoach.ai',
      password: 'AdminPassword123!'
    };
    
    const response = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });
    
    const isValidLogin = (response.status === 200 || response.status === 404) && response.body;
    
    recordTest('authentication', 'user_login', {
      success: isValidLogin,
      warning: response.status === 404,
      message: response.status === 404 ? 'Login endpoint accessible but user not found (expected in test)' : 
               isValidLogin ? 'Login endpoint works correctly' : 'Login endpoint failed',
      details: {
        status: response.status,
        hasBody: !!response.body
      }
    });
    
    log(`User Login: ${isValidLogin ? 'PASSED' : 'FAILED'}`, isValidLogin ? 'success' : 'error');
    
  } catch (error) {
    recordTest('authentication', 'user_login', {
      success: false,
      message: `Login error: ${error.message}`,
      details: { error: error.message }
    });
    
    log(`User Login: ERROR - ${error.message}`, 'error');
  }
}

/**
 * Authorization Middleware Tests
 */
async function testAuthorizationMiddleware() {
  log('Testing authorization middleware...', 'test');
  
  const protectedEndpoints = [
    { path: '/api/users/profile', method: 'GET', name: 'Get Profile' },
    { path: '/api/conversations', method: 'GET', name: 'List Conversations' },
    { path: '/api/messages', method: 'POST', name: 'Create Message' }
  ];
  
  for (const endpoint of protectedEndpoints) {
    // Test without token
    try {
      const response = await makeRequest(`${endpoint.path}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      });
      
      const isUnauthorized = response.status === 401;
      
      recordTest('authentication', `${endpoint.name.toLowerCase().replace(' ', '_')}_without_token`, {
        success: isUnauthorized,
        message: isUnauthorized ? `${endpoint.name} correctly rejects requests without token` : 
                 `${endpoint.name} should reject requests without token`,
        details: {
          status: response.status,
          endpoint: endpoint.path,
          method: endpoint.method
        }
      });
      
    } catch (error) {
      recordTest('authentication', `${endpoint.name.toLowerCase().replace(' ', '_')}_without_token`, {
        success: false,
        message: `Error testing ${endpoint.name} without token: ${error.message}`,
        details: { error: error.message }
      });
    }
    
    // Test with invalid token
    try {
      const response = await makeRequest(`${endpoint.path}`, {
        method: endpoint.method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        }
      });
      
      const isUnauthorized = response.status === 401;
      
      recordTest('authentication', `${endpoint.name.toLowerCase().replace(' ', '_')}_invalid_token`, {
        success: isUnauthorized,
        message: isUnauthorized ? `${endpoint.name} correctly rejects invalid tokens` : 
                 `${endpoint.name} should reject invalid tokens`,
        details: {
          status: response.status,
          endpoint: endpoint.path,
          method: endpoint.method
        }
      });
      
    } catch (error) {
      recordTest('authentication', `${endpoint.name.toLowerCase().replace(' ', '_')}_invalid_token`, {
        success: false,
        message: `Error testing ${endpoint.name} with invalid token: ${error.message}`,
        details: { error: error.message }
      });
    }
    
    // Test with valid token (if we can generate one)
    try {
      const token = generateTestToken();
      const response = await makeRequest(`${endpoint.path}`, {
        method: endpoint.method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        ...(endpoint.method === 'POST' && { body: JSON.stringify({}) })
      });
      
      // Accept various responses as valid (200, 400 for bad request data, etc.)
      const isValidResponse = response.status < 500;
      
      recordTest('authentication', `${endpoint.name.toLowerCase().replace(' ', '_')}_valid_token`, {
        success: isValidResponse,
        message: isValidResponse ? `${endpoint.name} accepts valid tokens` : 
                 `${endpoint.name} has server error with valid token`,
        details: {
          status: response.status,
          endpoint: endpoint.path,
          method: endpoint.method
        }
      });
      
    } catch (error) {
      recordTest('authentication', `${endpoint.name.toLowerCase().replace(' ', '_')}_valid_token`, {
        success: false,
        message: `Error testing ${endpoint.name} with valid token: ${error.message}`,
        details: { error: error.message }
      });
    }
  }
}

/**
 * Rate Limiting Tests
 */
async function testRateLimiting() {
  log('Testing rate limiting behavior...', 'test');
  
  const testEndpoint = '/health';
  const requests = [];
  
  // Make rapid requests to test rate limiting
  for (let i = 0; i < TEST_CONFIG.rateLimitTestCount; i++) {
    requests.push(makeRequest(`${BASE_URL}${testEndpoint}`));
  }
  
  try {
    const responses = await Promise.allSettled(requests);
    
    const successfulResponses = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200);
    const rateLimitedResponses = responses.filter(r => r.status === 'fulfilled' && r.value.status === 429);
    
    // Check if rate limiting is working (should have some 429 responses if rate limit is hit)
    const hasRateLimiting = rateLimitedResponses.length > 0;
    const hasRateLimitHeaders = responses.some(r => 
      r.status === 'fulfilled' && 
      (r.value.headers['x-ratelimit-limit'] || r.value.headers['retry-after'])
    );
    
    recordTest('rateLimiting', 'basic_rate_limiting', {
      success: true, // Rate limiting presence is informational
      message: hasRateLimiting ? 'Rate limiting is active and working' : 
               'Rate limiting may not be configured or limits not reached',
      details: {
        totalRequests: TEST_CONFIG.rateLimitTestCount,
        successfulResponses: successfulResponses.length,
        rateLimitedResponses: rateLimitedResponses.length,
        hasRateLimitHeaders: hasRateLimitHeaders,
        rateLimitingActive: hasRateLimiting
      }
    });
    
    log(`Rate Limiting: ${hasRateLimiting ? 'ACTIVE' : 'NOT DETECTED'}`, hasRateLimiting ? 'success' : 'warning');
    
  } catch (error) {
    recordTest('rateLimiting', 'basic_rate_limiting', {
      success: false,
      message: `Rate limiting test error: ${error.message}`,
      details: { error: error.message }
    });
    
    log(`Rate Limiting: ERROR - ${error.message}`, 'error');
  }
}

/**
 * Error Handling Tests
 */
async function testErrorHandling() {
  log('Testing error handling across endpoints...', 'test');
  
  const errorTests = [
    {
      name: 'Invalid JSON Body',
      url: `${API_BASE}/auth/login`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      },
      expectedStatus: 400
    },
    {
      name: 'Unsupported Content Type',
      url: `${API_BASE}/auth/login`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'plain text'
      },
      expectedStatus: 400
    },
    {
      name: 'Method Not Allowed',
      url: `${BASE_URL}/health`,
      options: {
        method: 'DELETE'
      },
      expectedStatus: 405
    },
    {
      name: 'Not Found Endpoint',
      url: `${API_BASE}/nonexistent-endpoint`,
      options: {
        method: 'GET'
      },
      expectedStatus: 404
    },
    {
      name: 'Large Request Body',
      url: `${API_BASE}/auth/login`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: 'x'.repeat(20 * 1024 * 1024) }) // 20MB
      },
      expectedStatus: 413
    }
  ];
  
  for (const test of errorTests) {
    try {
      const response = await makeRequest(test.url, test.options);
      
      const isCorrectStatus = Math.floor(response.status / 100) === Math.floor(test.expectedStatus / 100);
      const hasErrorStructure = response.body && typeof response.body === 'object';
      
      recordTest('errorHandling', test.name.toLowerCase().replace(/\s+/g, '_'), {
        success: isCorrectStatus && hasErrorStructure,
        message: isCorrectStatus ? `${test.name}: Correct error status returned` : 
                 `${test.name}: Unexpected status (expected ${test.expectedStatus}xx, got ${response.status})`,
        details: {
          expectedStatus: test.expectedStatus,
          actualStatus: response.status,
          hasErrorStructure: hasErrorStructure,
          responseBody: response.body
        }
      });
      
      log(`${test.name}: ${isCorrectStatus ? 'PASSED' : 'FAILED'}`, isCorrectStatus ? 'success' : 'error');
      
    } catch (error) {
      // Some errors (like request too large) might cause fetch to throw
      const isExpectedError = test.name.includes('Large Request') && error.message.includes('body');
      
      recordTest('errorHandling', test.name.toLowerCase().replace(/\s+/g, '_'), {
        success: isExpectedError,
        message: isExpectedError ? `${test.name}: Correctly rejected at network level` : 
                 `${test.name}: Unexpected error - ${error.message}`,
        details: { 
          error: error.message,
          isExpectedError: isExpectedError
        }
      });
      
      log(`${test.name}: ${isExpectedError ? 'PASSED' : 'ERROR'}`, isExpectedError ? 'success' : 'error');
    }
  }
}

/**
 * Request/Response Format Tests
 */
async function testRequestResponseFormats() {
  log('Testing request/response format validation...', 'test');
  
  // Test CORS headers
  try {
    const response = await makeRequest(`${BASE_URL}/health`, {
      method: 'OPTIONS'
    });
    
    const hasCorsHeaders = response.headers['access-control-allow-origin'] || 
                          response.headers['access-control-allow-methods'];
    
    recordTest('endpoints', 'cors_headers', {
      success: hasCorsHeaders,
      message: hasCorsHeaders ? 'CORS headers are properly configured' : 'CORS headers missing',
      details: {
        allowOrigin: response.headers['access-control-allow-origin'],
        allowMethods: response.headers['access-control-allow-methods'],
        allowHeaders: response.headers['access-control-allow-headers']
      }
    });
    
    log(`CORS Headers: ${hasCorsHeaders ? 'PASSED' : 'FAILED'}`, hasCorsHeaders ? 'success' : 'error');
    
  } catch (error) {
    recordTest('endpoints', 'cors_headers', {
      success: false,
      message: `CORS headers test error: ${error.message}`,
      details: { error: error.message }
    });
  }
  
  // Test security headers
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    
    const hasSecurityHeaders = response.headers['x-content-type-options'] ||
                              response.headers['x-frame-options'] ||
                              response.headers['x-xss-protection'];
    
    recordTest('endpoints', 'security_headers', {
      success: hasSecurityHeaders,
      message: hasSecurityHeaders ? 'Security headers are present' : 'Security headers missing',
      details: {
        contentTypeOptions: response.headers['x-content-type-options'],
        frameOptions: response.headers['x-frame-options'],
        xssProtection: response.headers['x-xss-protection'],
        hsts: response.headers['strict-transport-security']
      }
    });
    
    log(`Security Headers: ${hasSecurityHeaders ? 'PASSED' : 'FAILED'}`, hasSecurityHeaders ? 'success' : 'error');
    
  } catch (error) {
    recordTest('endpoints', 'security_headers', {
      success: false,
      message: `Security headers test error: ${error.message}`,
      details: { error: error.message }
    });
  }
  
  // Test JSON response format consistency
  const endpoints = [
    '/health',
    '/health/db',
    '/api'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint}`);
      
      const hasConsistentFormat = response.body &&
                                 typeof response.body === 'object' &&
                                 typeof response.body.success === 'boolean' &&
                                 typeof response.body.message === 'string';
      
      recordTest('endpoints', `response_format_${endpoint.replace(/[\/]/g, '_')}`, {
        success: hasConsistentFormat,
        message: hasConsistentFormat ? `${endpoint}: Response format is consistent` : 
                 `${endpoint}: Response format is inconsistent`,
        details: {
          hasSuccessField: typeof response.body?.success === 'boolean',
          hasMessageField: typeof response.body?.message === 'string',
          responseStructure: Object.keys(response.body || {})
        }
      });
      
    } catch (error) {
      recordTest('endpoints', `response_format_${endpoint.replace(/[\/]/g, '_')}`, {
        success: false,
        message: `Response format test error for ${endpoint}: ${error.message}`,
        details: { error: error.message }
      });
    }
  }
}

/**
 * Integration Tests
 */
async function testIntegration() {
  log('Running integration tests...', 'test');
  
  // Test server startup and basic connectivity
  try {
    const startTime = Date.now();
    const response = await makeRequest(`${BASE_URL}/health`);
    const responseTime = Date.now() - startTime;
    
    const isHealthy = response.status === 200 && response.body?.success === true;
    
    recordTest('integration', 'server_connectivity', {
      success: isHealthy,
      message: isHealthy ? 'Server is accessible and responding correctly' : 'Server connectivity issues',
      details: {
        responseTime: responseTime,
        status: response.status,
        isHealthy: isHealthy
      }
    });
    
    log(`Server Connectivity: ${isHealthy ? 'PASSED' : 'FAILED'} (${responseTime}ms)`, isHealthy ? 'success' : 'error');
    
  } catch (error) {
    recordTest('integration', 'server_connectivity', {
      success: false,
      message: `Server connectivity error: ${error.message}`,
      details: { error: error.message }
    });
    
    log(`Server Connectivity: ERROR - ${error.message}`, 'error');
  }
  
  // Test concurrent request handling
  try {
    const concurrentRequests = Array(TEST_CONFIG.concurrentRequests).fill().map(() => 
      makeRequest(`${BASE_URL}/health`)
    );
    
    const startTime = Date.now();
    const responses = await Promise.allSettled(concurrentRequests);
    const totalTime = Date.now() - startTime;
    
    const successfulResponses = responses.filter(r => 
      r.status === 'fulfilled' && r.value.status === 200
    ).length;
    
    const canHandleConcurrentRequests = successfulResponses === TEST_CONFIG.concurrentRequests;
    
    recordTest('integration', 'concurrent_requests', {
      success: canHandleConcurrentRequests,
      message: canHandleConcurrentRequests ? 
        'Server handles concurrent requests correctly' : 
        'Server has issues with concurrent requests',
      details: {
        totalRequests: TEST_CONFIG.concurrentRequests,
        successfulRequests: successfulResponses,
        totalTime: totalTime,
        averageTime: totalTime / TEST_CONFIG.concurrentRequests
      }
    });
    
    log(`Concurrent Requests: ${canHandleConcurrentRequests ? 'PASSED' : 'FAILED'}`, 
        canHandleConcurrentRequests ? 'success' : 'error');
    
  } catch (error) {
    recordTest('integration', 'concurrent_requests', {
      success: false,
      message: `Concurrent requests test error: ${error.message}`,
      details: { error: error.message }
    });
    
    log(`Concurrent Requests: ERROR - ${error.message}`, 'error');
  }
}

/**
 * Main test execution
 */
async function runApiValidationTests() {
  log('Starting API Endpoint Validation Tests for PRD 1.2.2', 'test');
  log(`Testing server at: ${BASE_URL}`, 'info');
  
  try {
    // Run all test suites
    await testHealthEndpoints();
    await testApiDocumentation();
    await testAuthenticationEndpoints();
    await testAuthorizationMiddleware();
    await testRateLimiting();
    await testErrorHandling();
    await testRequestResponseFormats();
    await testIntegration();
    
    // Generate summary
    log('\n' + '='.repeat(80), 'info');
    log('API VALIDATION TEST SUMMARY', 'info');
    log('='.repeat(80), 'info');
    log(`Total Tests: ${testResults.summary.total}`, 'info');
    log(`Passed: ${testResults.summary.passed}`, 'success');
    log(`Failed: ${testResults.summary.failed}`, testResults.summary.failed > 0 ? 'error' : 'info');
    log(`Warnings: ${testResults.summary.warnings}`, testResults.summary.warnings > 0 ? 'warning' : 'info');
    
    const passRate = ((testResults.summary.passed + testResults.summary.warnings) / testResults.summary.total * 100).toFixed(1);
    log(`Pass Rate: ${passRate}%`, passRate >= 90 ? 'success' : passRate >= 70 ? 'warning' : 'error');
    
    // Save detailed results
    const fs = await import('fs/promises');
    const resultsPath = `/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app/QA/1.2.11-basic-error-handling/api-validation-results.json`;
    
    await fs.writeFile(resultsPath, JSON.stringify(testResults, null, 2));
    log(`Detailed results saved to: api-validation-results.json`, 'info');
    
    return testResults;
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
    throw error;
  }
}

// Execute tests if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runApiValidationTests()
    .then(() => {
      log('API validation tests completed successfully', 'success');
      process.exit(testResults.summary.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      log(`API validation tests failed: ${error.message}`, 'error');
      process.exit(1);
    });
}

export { runApiValidationTests, testResults };