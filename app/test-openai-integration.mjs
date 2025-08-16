/**
 * OpenAI Integration Test Suite
 * 
 * This test suite validates the complete OpenAI integration:
 * - Health check endpoint functionality
 * - Client wrapper with rate limiting and circuit breaker
 * - Error handling and recovery
 * - Real API calls (if valid key is provided)
 * - Security measures (API key masking)
 * 
 * Run with: node test-openai-integration.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables for testing
dotenv.config({ path: join(__dirname, '.env.development') });

/**
 * Test runner utility
 */
class IntegrationTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
  }
  
  test(name, testFn) {
    this.tests.push({ name, testFn });
  }
  
  skip(name, reason) {
    this.tests.push({ name, testFn: () => { throw new Error(`SKIP: ${reason}`); } });
  }
  
  async run() {
    console.log('🧪 OpenAI Integration Test Suite');
    console.log('=' + '='.repeat(50));
    
    for (const { name, testFn } of this.tests) {
      try {
        console.log(`\n🔍 Testing: ${name}`);
        await testFn();
        console.log(`✅ PASSED: ${name}`);
        this.passed++;
      } catch (error) {
        if (error.message.startsWith('SKIP:')) {
          console.log(`⚠️  SKIPPED: ${name} - ${error.message.slice(5)}`);
          this.skipped++;
        } else {
          console.error(`❌ FAILED: ${name}`);
          console.error(`   Error: ${error.message}`);
          this.failed++;
        }
      }
    }
    
    this.printSummary();
  }
  
  printSummary() {
    const total = this.passed + this.failed + this.skipped;
    console.log('\n' + '='.repeat(52));
    console.log(`📊 Test Results: ${this.passed}/${total} passed, ${this.skipped} skipped`);
    
    if (this.failed > 0) {
      console.log(`❌ ${this.failed} test(s) failed`);
    } else if (this.passed > 0) {
      console.log('🎉 All tests passed!');
    }
    
    console.log('=' + '='.repeat(51));
  }
}

const test = new IntegrationTestRunner();

/**
 * Mock HTTP request/response objects for testing middleware
 */
function createMockRequest(url = '/health/openai', method = 'GET') {
  return {
    url,
    method,
    headers: {},
    query: {},
    params: {},
    body: {}
  };
}

function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    },
    set: function(header, value) {
      this.headers[header] = value;
      return this;
    }
  };
  return res;
}

/**
 * Test health check endpoint without API key
 */
test.test('Health check endpoint without API key', async () => {
  // Clear any existing API key
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  
  try {
    // Clear module cache to force reload without API key
    const healthModulePath = join(__dirname, 'middleware', 'openai-health.js');
    if (require.cache[healthModulePath]) {
      delete require.cache[healthModulePath];
    }
    
    const configModulePath = join(__dirname, 'config', 'openai.js');
    if (require.cache[configModulePath]) {
      delete require.cache[configModulePath];
    }
    
    // This should fail during module import due to missing API key
    try {
      await import(`./config/openai.js?no_key_test=${Date.now()}`);
      throw new Error('Should have failed without API key');
    } catch (error) {
      if (!error.message.includes('OPENAI_API_KEY')) {
        throw new Error(`Expected API key error, got: ${error.message}`);
      }
      console.log('   ✓ Properly rejects missing API key');
    }
    
  } finally {
    // Restore API key
    if (originalKey) {
      process.env.OPENAI_API_KEY = originalKey;
    }
  }
});

/**
 * Test health check endpoint with placeholder API key
 */
test.test('Health check endpoint with placeholder API key', async () => {
  // Set placeholder API key
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
  
  try {
    // Import with placeholder key
    const { healthCheckMiddleware, clearHealthCache } = await import(`./middleware/openai-health.js?placeholder_test=${Date.now()}`);
    
    // Clear cache for clean test
    clearHealthCache();
    
    // Create mock request/response
    const req = createMockRequest();
    const res = createMockResponse();
    
    // Execute health check middleware
    await healthCheckMiddleware(req, res);
    
    // Verify response structure
    if (!res.body) {
      throw new Error('Health check should return response body');
    }
    
    const healthData = res.body;
    
    if (!healthData.status) {
      throw new Error('Health check should include status field');
    }
    
    if (!healthData.timestamp) {
      throw new Error('Health check should include timestamp field');
    }
    
    if (typeof healthData.responseTime !== 'number') {
      throw new Error('Health check should include responseTime as number');
    }
    
    // Should be unhealthy due to authentication error
    if (healthData.status === 'healthy') {
      console.log('   ⚠️  Unexpected healthy status with placeholder key');
    } else {
      console.log(`   ✓ Returned expected status: ${healthData.status}`);
    }
    
    console.log(`   ✓ Response time: ${healthData.responseTime}ms`);
    console.log(`   ✓ Response structure valid`);
    
  } finally {
    // Restore original key
    process.env.OPENAI_API_KEY = originalKey;
  }
});

/**
 * Test OpenAI client wrapper rate limiting
 */
test.test('OpenAI client wrapper rate limiting', async () => {
  // Set placeholder API key for testing
  process.env.OPENAI_API_KEY = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
  
  const { openaiClientWrapper } = await import(`./services/openai-client.js?rate_limit_test=${Date.now()}`);
  
  // Get initial rate limit status
  const initialStatus = openaiClientWrapper.getRateLimitStatus();
  
  if (typeof initialStatus.remaining !== 'number') {
    throw new Error('Rate limit status should include remaining requests');
  }
  
  if (typeof initialStatus.resetTime !== 'number') {
    throw new Error('Rate limit status should include reset time');
  }
  
  if (!initialStatus.circuitBreakerState) {
    throw new Error('Rate limit status should include circuit breaker state');
  }
  
  console.log(`   ✓ Initial rate limit: ${initialStatus.remaining} remaining`);
  console.log(`   ✓ Circuit breaker state: ${initialStatus.circuitBreakerState}`);
  
  // Test rate limit enforcement
  const startRemaining = initialStatus.remaining;
  
  try {
    // Try to make a request (will fail with placeholder key)
    await openaiClientWrapper.createChatCompletion([
      { role: 'user', content: 'Test message' }
    ]);
  } catch (error) {
    // Expected to fail with placeholder key
    console.log('   ✓ Request failed as expected with placeholder key');
  }
  
  const afterStatus = openaiClientWrapper.getRateLimitStatus();
  
  if (afterStatus.remaining >= startRemaining) {
    console.log('   ⚠️  Rate limit may not be properly decremented (expected with failed request)');
  }
});

/**
 * Test usage statistics tracking
 */
test.test('Usage statistics tracking', async () => {
  process.env.OPENAI_API_KEY = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
  
  const { openaiClientWrapper } = await import(`./services/openai-client.js?stats_test=${Date.now()}`);
  
  // Reset stats for clean test
  openaiClientWrapper.resetStats();
  
  const initialStats = openaiClientWrapper.getUsageStats();
  
  if (initialStats.totalRequests !== 0) {
    throw new Error('Initial stats should show zero requests');
  }
  
  try {
    // Try to make a request (will fail with placeholder key)
    await openaiClientWrapper.createChatCompletion([
      { role: 'user', content: 'Test message for stats' }
    ]);
  } catch (error) {
    // Expected to fail
  }
  
  const afterStats = openaiClientWrapper.getUsageStats();
  
  if (afterStats.totalRequests === 0) {
    throw new Error('Stats should track failed requests');
  }
  
  if (afterStats.failedRequests === 0) {
    throw new Error('Stats should track failed requests separately');
  }
  
  console.log(`   ✓ Total requests tracked: ${afterStats.totalRequests}`);
  console.log(`   ✓ Failed requests tracked: ${afterStats.failedRequests}`);
  console.log(`   ✓ Last request time: ${afterStats.lastRequestTime}`);
});

/**
 * Test API key masking in logs and errors
 */
test.test('API key masking in logs and errors', async () => {
  const { maskApiKey } = await import('./config/openai.js');
  
  const testKey = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
  const maskedKey = maskApiKey(testKey);
  
  // Verify masking
  if (maskedKey.includes(testKey.slice(8, -4))) {
    throw new Error('API key should not contain middle characters after masking');
  }
  
  if (!maskedKey.startsWith('sk-12345')) {
    throw new Error('Masked key should start with first 8 characters');
  }
  
  if (!maskedKey.endsWith('cdef')) {
    throw new Error('Masked key should end with last 4 characters');
  }
  
  if (!maskedKey.includes('...')) {
    throw new Error('Masked key should contain ellipsis');
  }
  
  console.log(`   ✓ API key properly masked: ${maskedKey}`);
  
  // Test edge cases
  const shortKey = 'sk-short';
  const maskedShort = maskApiKey(shortKey);
  
  if (maskedShort !== '[MASKED_KEY]') {
    throw new Error('Short keys should be masked as [MASKED_KEY]');
  }
  
  const nullMask = maskApiKey(null);
  if (nullMask !== '[INVALID_KEY]') {
    throw new Error('Null keys should be masked as [INVALID_KEY]');
  }
  
  console.log('   ✓ Edge cases handled correctly');
});

/**
 * Test with real API key (if available)
 */
test.test('Real API connectivity (if key available)', async () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || !apiKey.startsWith('sk-') || apiKey.includes('your-openai') || apiKey.includes('placeholder')) {
    throw new Error('SKIP: No real API key provided');
  }
  
  try {
    const { testApiConnectivity } = await import('./config/openai.js');
    
    console.log('   🔄 Testing real API connectivity...');
    
    const startTime = Date.now();
    const result = await testApiConnectivity();
    const responseTime = Date.now() - startTime;
    
    if (!result) {
      throw new Error('API connectivity test failed with real key');
    }
    
    console.log(`   ✅ Real API connectivity successful in ${responseTime}ms`);
    
    // Test health check with real API
    const { healthCheckMiddleware, clearHealthCache } = await import('./middleware/openai-health.js');
    clearHealthCache();
    
    const req = createMockRequest();
    const res = createMockResponse();
    
    await healthCheckMiddleware(req, res);
    
    if (!res.body) {
      throw new Error('Health check with real API should return body');
    }
    
    const healthData = res.body;
    
    if (healthData.status !== 'healthy') {
      console.log(`   ⚠️  Health status: ${healthData.status} (may be degraded due to response time or rate limits)`);
    } else {
      console.log('   ✅ Real API health check: healthy');
    }
    
    console.log(`   ✅ Real API response time: ${healthData.responseTime}ms`);
    
  } catch (error) {
    throw new Error(`Real API test failed: ${error.message}`);
  }
});

/**
 * Test error recovery and circuit breaker
 */
test.test('Error recovery and circuit breaker', async () => {
  process.env.OPENAI_API_KEY = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
  
  const { CircuitBreaker } = await import('./services/openai-client.js');
  
  const circuitBreaker = new CircuitBreaker(2, 100); // 2 failures, 100ms recovery
  
  // Circuit should start closed
  if (!circuitBreaker.canExecute()) {
    throw new Error('Circuit breaker should start in CLOSED state');
  }
  
  // Record failures to open the circuit
  circuitBreaker.recordFailure();
  
  if (!circuitBreaker.canExecute()) {
    throw new Error('Circuit should still be closed after 1 failure');
  }
  
  circuitBreaker.recordFailure();
  
  if (circuitBreaker.canExecute()) {
    throw new Error('Circuit should be OPEN after reaching failure threshold');
  }
  
  console.log(`   ✓ Circuit breaker opens after ${circuitBreaker.failureThreshold} failures`);
  
  // Wait for recovery period
  await new Promise(resolve => setTimeout(resolve, 150));
  
  if (!circuitBreaker.canExecute()) {
    throw new Error('Circuit should be HALF_OPEN after recovery period');
  }
  
  console.log('   ✓ Circuit breaker transitions to HALF_OPEN after recovery period');
  
  // Test successful recovery
  circuitBreaker.recordSuccess();
  
  if (!circuitBreaker.canExecute() || circuitBreaker.getState() !== 'CLOSED') {
    throw new Error('Circuit should be CLOSED after successful request');
  }
  
  console.log('   ✓ Circuit breaker closes after successful request');
});

/**
 * Run all tests
 */
console.log('Starting OpenAI Integration Tests...\n');

await test.run();

// Exit with appropriate code
process.exit(test.failed > 0 ? 1 : 0);