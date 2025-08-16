/**
 * Simple OpenAI Configuration Test
 * 
 * This test validates the basic functionality without complex module loading.
 * Run with: node test-openai-simple.mjs
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables for testing
dotenv.config({ path: join(__dirname, '.env.development') });

console.log('🧪 Simple OpenAI Configuration Test');
console.log('=' + '='.repeat(40));

/**
 * Test 1: Environment Variables
 */
console.log('\n🔍 Test 1: Environment Variables');
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not loaded');
  }
  
  if (!process.env.OPENAI_MODEL) {
    throw new Error('OPENAI_MODEL not loaded');
  }
  
  console.log(`✅ API Key loaded: ${process.env.OPENAI_API_KEY.substring(0, 8)}...`);
  console.log(`✅ Model: ${process.env.OPENAI_MODEL}`);
  console.log(`✅ Max Tokens: ${process.env.OPENAI_MAX_TOKENS}`);
  console.log(`✅ Rate Limit: ${process.env.OPENAI_RATE_LIMIT_RPM} req/min`);
  
} catch (error) {
  console.error(`❌ ${error.message}`);
}

/**
 * Test 2: Configuration Functions
 */
console.log('\n🔍 Test 2: Configuration Functions');
try {
  const { validateApiKeyFormat, maskApiKey } = await import('./config/openai.js');
  
  // Test valid key
  const testKey = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
  if (!validateApiKeyFormat(testKey)) {
    throw new Error('Valid API key should pass validation');
  }
  
  // Test invalid key
  if (validateApiKeyFormat('invalid-key')) {
    throw new Error('Invalid API key should fail validation');
  }
  
  // Test masking
  const masked = maskApiKey(testKey);
  if (!masked.includes('...')) {
    throw new Error('API key should be masked');
  }
  
  console.log(`✅ API key validation working`);
  console.log(`✅ API key masking working: ${masked}`);
  
} catch (error) {
  console.error(`❌ ${error.message}`);
}

/**
 * Test 3: Basic Configuration
 */
console.log('\n🔍 Test 3: Basic Configuration');
try {
  const { getConfig } = await import('./config/openai.js');
  const config = getConfig();
  
  if (!config.model) {
    throw new Error('Configuration should include model');
  }
  
  if (typeof config.maxTokens !== 'number') {
    throw new Error('maxTokens should be a number');
  }
  
  if (typeof config.timeout !== 'number') {
    throw new Error('timeout should be a number');
  }
  
  console.log(`✅ Configuration loaded successfully`);
  console.log(`   Model: ${config.model}`);
  console.log(`   Max Tokens: ${config.maxTokens}`);
  console.log(`   Timeout: ${config.timeout}ms`);
  console.log(`   Rate Limit: ${config.rateLimitRPM} req/min`);
  
} catch (error) {
  console.error(`❌ ${error.message}`);
}

/**
 * Test 4: Health Check Components
 */
console.log('\n🔍 Test 4: Health Check Components');
try {
  const { 
    parseRateLimitHeaders, 
    determineHealthStatus 
  } = await import('./middleware/openai-health.js');
  
  // Test header parsing
  const testHeaders = {
    'x-ratelimit-remaining-requests': '45',
    'x-ratelimit-remaining-tokens': '8000'
  };
  
  const rateInfo = parseRateLimitHeaders(testHeaders);
  
  if (rateInfo.requestsRemaining !== 45) {
    throw new Error('Rate limit parsing failed');
  }
  
  // Test status determination
  const healthyStatus = determineHealthStatus(1500, null, rateInfo);
  if (healthyStatus !== 'healthy') {
    throw new Error(`Expected healthy status, got ${healthyStatus}`);
  }
  
  const unhealthyStatus = determineHealthStatus(1500, { status: 401 }, rateInfo);
  if (unhealthyStatus !== 'unhealthy') {
    throw new Error(`Expected unhealthy status, got ${unhealthyStatus}`);
  }
  
  console.log('✅ Rate limit header parsing working');
  console.log('✅ Health status determination working');
  
} catch (error) {
  console.error(`❌ ${error.message}`);
}

/**
 * Test 5: Client Wrapper Components
 */
console.log('\n🔍 Test 5: Client Wrapper Components');
try {
  const { 
    SlidingWindowRateLimiter, 
    CircuitBreaker, 
    CostEstimator 
  } = await import('./services/openai-client.js');
  
  // Test rate limiter
  const limiter = new SlidingWindowRateLimiter(3, 1000);
  
  // Should allow first 3 requests
  for (let i = 0; i < 3; i++) {
    if (!limiter.isAllowed()) {
      throw new Error(`Request ${i + 1} should be allowed`);
    }
  }
  
  // 4th should be denied
  if (limiter.isAllowed()) {
    throw new Error('4th request should be denied');
  }
  
  // Test circuit breaker
  const breaker = new CircuitBreaker(2, 100);
  
  if (!breaker.canExecute()) {
    throw new Error('Circuit should start closed');
  }
  
  breaker.recordFailure();
  breaker.recordFailure();
  
  if (breaker.canExecute()) {
    throw new Error('Circuit should open after failures');
  }
  
  // Test cost estimator
  const estimator = new CostEstimator();
  const cost = estimator.estimateCost('gpt-4', 1000, 500);
  
  if (cost <= 0) {
    throw new Error('Cost should be positive');
  }
  
  console.log('✅ Rate limiter working');
  console.log('✅ Circuit breaker working');
  console.log(`✅ Cost estimator working: $${cost.toFixed(6)}`);
  
} catch (error) {
  console.error(`❌ ${error.message}`);
}

/**
 * Test 6: Server Integration
 */
console.log('\n🔍 Test 6: Server Integration');
try {
  // Mock request/response for health check
  const mockReq = {};
  const mockRes = {
    statusCode: 200,
    body: null,
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.body = data; return this; }
  };
  
  const { healthCheckMiddleware, clearHealthCache } = await import('./middleware/openai-health.js');
  
  // Clear cache and test
  clearHealthCache();
  
  await healthCheckMiddleware(mockReq, mockRes);
  
  if (!mockRes.body) {
    throw new Error('Health check should return response body');
  }
  
  if (!mockRes.body.status) {
    throw new Error('Health check should include status');
  }
  
  if (typeof mockRes.body.responseTime !== 'number') {
    throw new Error('Health check should include responseTime');
  }
  
  console.log(`✅ Health check endpoint working`);
  console.log(`   Status: ${mockRes.body.status}`);
  console.log(`   Response Time: ${mockRes.body.responseTime}ms`);
  console.log(`   HTTP Status: ${mockRes.statusCode}`);
  
} catch (error) {
  console.error(`❌ ${error.message}`);
}

console.log('\n' + '='.repeat(42));
console.log('🎉 Simple OpenAI Configuration Test Complete');
console.log('=' + '='.repeat(42));