/**
 * Production Smoke Test Suite
 * PRD Reference: PRD-1.2.10-openai-api-configuration.md
 * 
 * Comprehensive end-to-end tests for production deployment validation.
 * This script validates all critical functionality after deployment.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BASE_URL = process.env.PRODUCTION_URL || 'https://elite-trading-coach.railway.app';
const TIMEOUT = 30000; // 30 seconds

/**
 * Test configuration
 */
const testConfig = {
  baseUrl: BASE_URL,
  timeout: TIMEOUT,
  retries: 3,
  retryDelay: 5000
};

/**
 * Test results tracking
 */
let testResults = {
  timestamp: new Date().toISOString(),
  environment: 'production',
  baseUrl: BASE_URL,
  tests: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  details: []
};

/**
 * Utility function to make HTTP requests
 */
async function makeRequest(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), testConfig.timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Test execution wrapper
 */
async function runTest(testName, testFunction) {
  console.log(`🔍 Testing: ${testName}`);
  testResults.tests.total++;
  
  const testStart = Date.now();
  
  try {
    const result = await testFunction();
    const duration = Date.now() - testStart;
    
    testResults.tests.passed++;
    testResults.details.push({
      name: testName,
      status: 'PASSED',
      duration,
      result
    });
    
    console.log(`✅ ${testName} - PASSED (${duration}ms)`);
    return { success: true, result, duration };
    
  } catch (error) {
    const duration = Date.now() - testStart;
    
    testResults.tests.failed++;
    testResults.details.push({
      name: testName,
      status: 'FAILED',
      duration,
      error: error.message
    });
    
    console.log(`❌ ${testName} - FAILED (${duration}ms)`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message, duration };
  }
}

/**
 * Test: Application Health Check
 */
async function testApplicationHealth() {
  const response = await makeRequest(`${testConfig.baseUrl}/api/health`);
  
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
  }
  
  const health = await response.json();
  
  if (health.status !== 'healthy') {
    throw new Error(`Application unhealthy: ${health.status}`);
  }
  
  return {
    status: health.status,
    timestamp: health.timestamp,
    services: health.services || {}
  };
}

/**
 * Test: OpenAI Production Mode
 */
async function testOpenAIProductionMode() {
  const response = await makeRequest(`${testConfig.baseUrl}/api/health/openai/production`);
  
  if (!response.ok) {
    throw new Error(`OpenAI health check failed: ${response.status} ${response.statusText}`);
  }
  
  const health = await response.json();
  
  if (health.status !== 'healthy') {
    throw new Error(`OpenAI service unhealthy: ${health.status}`);
  }
  
  if (health.mode !== 'production') {
    throw new Error(`OpenAI not in production mode: ${health.mode}`);
  }
  
  if (health.mockMode === true) {
    throw new Error('OpenAI mock mode is active in production');
  }
  
  return {
    mode: health.mode,
    mockMode: health.mockMode,
    apiConnectivity: health.apiConnectivity,
    configuration: health.configuration
  };
}

/**
 * Test: Database Connectivity
 */
async function testDatabaseConnectivity() {
  const response = await makeRequest(`${testConfig.baseUrl}/api/health/database`);
  
  if (!response.ok) {
    throw new Error(`Database health check failed: ${response.status} ${response.statusText}`);
  }
  
  const health = await response.json();
  
  if (health.status !== 'healthy') {
    throw new Error(`Database unhealthy: ${health.status}`);
  }
  
  return {
    status: health.status,
    connection: health.connection,
    responseTime: health.responseTime
  };
}

/**
 * Test: WebSocket Health
 */
async function testWebSocketHealth() {
  const response = await makeRequest(`${testConfig.baseUrl}/api/health/websocket`);
  
  if (!response.ok) {
    throw new Error(`WebSocket health check failed: ${response.status} ${response.statusText}`);
  }
  
  const health = await response.json();
  
  if (health.status !== 'healthy') {
    throw new Error(`WebSocket service unhealthy: ${health.status}`);
  }
  
  return {
    status: health.status,
    connections: health.connections
  };
}

/**
 * Test: API Security Headers
 */
async function testSecurityHeaders() {
  const response = await makeRequest(`${testConfig.baseUrl}/api/health`);
  
  const requiredHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection'
  ];
  
  const missingHeaders = requiredHeaders.filter(header => 
    !response.headers.has(header)
  );
  
  if (missingHeaders.length > 0) {
    throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
  }
  
  return {
    securityHeaders: Object.fromEntries(
      requiredHeaders.map(header => [header, response.headers.get(header)])
    )
  };
}

/**
 * Test: CORS Configuration
 */
async function testCORSConfiguration() {
  const response = await makeRequest(`${testConfig.baseUrl}/api/health/cors`);
  
  if (!response.ok) {
    throw new Error(`CORS health check failed: ${response.status} ${response.statusText}`);
  }
  
  const cors = await response.json();
  
  if (cors.status !== 'configured') {
    throw new Error(`CORS not properly configured: ${cors.status}`);
  }
  
  return {
    status: cors.status,
    allowedOrigins: cors.allowedOrigins
  };
}

/**
 * Test: Rate Limiting
 */
async function testRateLimiting() {
  const response = await makeRequest(`${testConfig.baseUrl}/api/health`);
  
  const rateLimitHeaders = [
    'x-ratelimit-limit',
    'x-ratelimit-remaining'
  ];
  
  const hasRateLimitHeaders = rateLimitHeaders.some(header => 
    response.headers.has(header)
  );
  
  if (!hasRateLimitHeaders) {
    throw new Error('Rate limiting headers not present');
  }
  
  return {
    rateLimitHeaders: Object.fromEntries(
      rateLimitHeaders
        .filter(header => response.headers.has(header))
        .map(header => [header, response.headers.get(header)])
    )
  };
}

/**
 * Test: Trade Analysis API (Mock Request)
 */
async function testTradeAnalysisAPI() {
  // Test basic endpoint availability (without actual image)
  const response = await makeRequest(`${testConfig.baseUrl}/api/analyze-trade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      // Empty request to test endpoint availability
    })
  });
  
  // Expect 400 (bad request) not 404 (not found) or 500 (server error)
  if (response.status === 404) {
    throw new Error('Trade analysis endpoint not found');
  }
  
  if (response.status === 500) {
    throw new Error('Trade analysis endpoint server error');
  }
  
  return {
    endpoint: 'available',
    statusCode: response.status,
    expectsBadRequest: response.status === 400
  };
}

/**
 * Test: File Upload Endpoint
 */
async function testFileUploadEndpoint() {
  // Test basic endpoint availability
  const response = await makeRequest(`${testConfig.baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  
  // Expect 400 (bad request) not 404 (not found) or 500 (server error)
  if (response.status === 404) {
    throw new Error('File upload endpoint not found');
  }
  
  if (response.status === 500) {
    throw new Error('File upload endpoint server error');
  }
  
  return {
    endpoint: 'available',
    statusCode: response.status,
    expectsBadRequest: response.status === 400
  };
}

/**
 * Test: Performance Metrics
 */
async function testPerformanceMetrics() {
  const start = Date.now();
  const response = await makeRequest(`${testConfig.baseUrl}/api/health`);
  const responseTime = Date.now() - start;
  
  if (responseTime > 5000) {
    throw new Error(`Response time too slow: ${responseTime}ms`);
  }
  
  return {
    responseTime,
    acceptable: responseTime < 2000,
    status: response.status
  };
}

/**
 * Run all production smoke tests
 */
async function runProductionSmokeTests() {
  console.log('🚀 Starting Production Smoke Tests');
  console.log(`📍 Base URL: ${testConfig.baseUrl}`);
  console.log(`⏱️  Timeout: ${testConfig.timeout}ms`);
  console.log('=' + '='.repeat(60));
  
  // Core Infrastructure Tests
  await runTest('Application Health Check', testApplicationHealth);
  await runTest('OpenAI Production Mode', testOpenAIProductionMode);
  await runTest('Database Connectivity', testDatabaseConnectivity);
  await runTest('WebSocket Health', testWebSocketHealth);
  
  // Security Tests
  await runTest('Security Headers', testSecurityHeaders);
  await runTest('CORS Configuration', testCORSConfiguration);
  await runTest('Rate Limiting', testRateLimiting);
  
  // API Endpoint Tests
  await runTest('Trade Analysis API', testTradeAnalysisAPI);
  await runTest('File Upload Endpoint', testFileUploadEndpoint);
  
  // Performance Tests
  await runTest('Performance Metrics', testPerformanceMetrics);
  
  // Generate summary
  console.log('=' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('=' + '='.repeat(60));
  console.log(`Total Tests: ${testResults.tests.total}`);
  console.log(`Passed: ${testResults.tests.passed}`);
  console.log(`Failed: ${testResults.tests.failed}`);
  console.log(`Success Rate: ${Math.round((testResults.tests.passed / testResults.tests.total) * 100)}%`);
  
  if (testResults.tests.failed === 0) {
    console.log('\n✅ ALL TESTS PASSED - Production deployment validated');
    return { success: true, results: testResults };
  } else {
    console.log('\n❌ SOME TESTS FAILED - Review deployment');
    
    // Show failed tests
    const failedTests = testResults.details.filter(t => t.status === 'FAILED');
    console.log('\n🔧 Failed Tests:');
    failedTests.forEach(test => {
      console.log(`   - ${test.name}: ${test.error}`);
    });
    
    return { success: false, results: testResults };
  }
}

/**
 * Save test results
 */
async function saveTestResults(results) {
  const fs = await import('fs/promises');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsPath = join(__dirname, `../../devops/production-smoke-test-${timestamp}.json`);
  
  await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Test results saved to: ${resultsPath}`);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const results = await runProductionSmokeTests();
      await saveTestResults(results.results);
      
      process.exit(results.success ? 0 : 1);
    } catch (error) {
      console.error('❌ Production smoke test failed:', error);
      process.exit(1);
    }
  })();
}

export {
  runProductionSmokeTests,
  testApplicationHealth,
  testOpenAIProductionMode,
  testDatabaseConnectivity,
  testWebSocketHealth,
  testSecurityHeaders,
  testCORSConfiguration,
  testRateLimiting,
  testTradeAnalysisAPI,
  testFileUploadEndpoint,
  testPerformanceMetrics
};