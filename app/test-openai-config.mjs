/**
 * OpenAI Configuration Test Suite
 * 
 * This test suite validates:
 * - Configuration loading and validation
 * - API key format validation
 * - Environment variable parsing
 * - Error handling for invalid configurations
 * - Client instantiation and basic connectivity
 * 
 * Run with: node test-openai-config.mjs
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
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }
  
  test(name, testFn) {
    this.tests.push({ name, testFn });
  }
  
  async run() {
    console.log('🧪 OpenAI Configuration Test Suite');
    console.log('=' + '='.repeat(50));
    
    for (const { name, testFn } of this.tests) {
      try {
        console.log(`\n🔍 Testing: ${name}`);
        await testFn();
        console.log(`✅ PASSED: ${name}`);
        this.passed++;
      } catch (error) {
        console.error(`❌ FAILED: ${name}`);
        console.error(`   Error: ${error.message}`);
        this.failed++;
      }
    }
    
    this.printSummary();
  }
  
  printSummary() {
    const total = this.passed + this.failed;
    console.log('\n' + '='.repeat(52));
    console.log(`📊 Test Results: ${this.passed}/${total} passed`);
    
    if (this.failed > 0) {
      console.log(`❌ ${this.failed} test(s) failed`);
    } else {
      console.log('🎉 All tests passed!');
    }
    
    console.log('=' + '='.repeat(51));
  }
}

const test = new TestRunner();

/**
 * Test API key validation functions
 */
test.test('API key format validation', async () => {
  const { validateApiKeyFormat, maskApiKey } = await import('./config/openai.js');
  
  // Test valid API key format
  const validKey = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
  if (!validateApiKeyFormat(validKey)) {
    throw new Error('Valid API key format should pass validation');
  }
  
  // Test invalid formats
  const invalidKeys = [
    'invalid-key',
    'pk-1234567890abcdef',  // Wrong prefix
    'sk-short',             // Too short
    null,                   // Null value
    '',                     // Empty string
    123                     // Wrong type
  ];
  
  for (const key of invalidKeys) {
    if (validateApiKeyFormat(key)) {
      throw new Error(`Invalid API key should fail validation: ${key}`);
    }
  }
  
  // Test API key masking
  const maskedKey = maskApiKey(validKey);
  if (!maskedKey.includes('...') || maskedKey === validKey) {
    throw new Error('API key should be properly masked');
  }
  
  console.log(`   ✓ Valid key format recognized`);
  console.log(`   ✓ Invalid formats rejected`);
  console.log(`   ✓ API key properly masked: ${maskedKey}`);
});

/**
 * Test configuration loading with valid environment
 */
test.test('Configuration loading with valid environment', async () => {
  // Backup original environment
  const originalEnv = { ...process.env };
  
  try {
    // Set up test environment
    process.env.OPENAI_API_KEY = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
    process.env.OPENAI_MODEL = 'gpt-4-vision-preview';
    process.env.OPENAI_MAX_TOKENS = '1500';
    process.env.OPENAI_TIMEOUT = '25000';
    process.env.OPENAI_RATE_LIMIT_RPM = '50';
    process.env.OPENAI_MAX_RETRIES = '2';
    
    // Clear module cache to force reload
    const modulePath = './config/openai.js';
    const fullPath = join(__dirname, 'config', 'openai.js');
    if (require.cache[fullPath]) {
      delete require.cache[fullPath];
    }
    
    // Import and test
    const { getConfig } = await import(`${modulePath}?t=${Date.now()}`);
    const config = getConfig();
    
    if (config.model !== 'gpt-4-vision-preview') {
      throw new Error(`Expected model gpt-4-vision-preview, got ${config.model}`);
    }
    
    if (config.maxTokens !== 1500) {
      throw new Error(`Expected maxTokens 1500, got ${config.maxTokens}`);
    }
    
    if (config.timeout !== 25000) {
      throw new Error(`Expected timeout 25000, got ${config.timeout}`);
    }
    
    if (config.rateLimitRPM !== 50) {
      throw new Error(`Expected rateLimitRPM 50, got ${config.rateLimitRPM}`);
    }
    
    console.log(`   ✓ Environment variables parsed correctly`);
    console.log(`   ✓ Configuration loaded: ${JSON.stringify(config, null, 2)}`);
    
  } finally {
    // Restore original environment
    process.env = originalEnv;
  }
});

/**
 * Test configuration error handling
 */
test.test('Configuration error handling', async () => {
  // Backup original environment
  const originalEnv = { ...process.env };
  
  try {
    // Test missing API key
    delete process.env.OPENAI_API_KEY;
    
    try {
      // This should fail during module import
      await import(`./config/openai.js?missing_key=${Date.now()}`);
      throw new Error('Should have thrown error for missing API key');
    } catch (error) {
      if (!error.message.includes('OPENAI_API_KEY')) {
        throw new Error(`Expected API key error, got: ${error.message}`);
      }
      console.log('   ✓ Missing API key properly detected');
    }
    
    // Test invalid API key format
    process.env.OPENAI_API_KEY = 'invalid-key-format';
    
    try {
      await import(`./config/openai.js?invalid_key=${Date.now()}`);
      throw new Error('Should have thrown error for invalid API key format');
    } catch (error) {
      if (!error.message.includes('Invalid OPENAI_API_KEY format')) {
        throw new Error(`Expected format error, got: ${error.message}`);
      }
      console.log('   ✓ Invalid API key format properly detected');
    }
    
    // Test invalid numeric values
    process.env.OPENAI_API_KEY = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
    process.env.OPENAI_MAX_TOKENS = 'not-a-number';
    
    try {
      await import(`./config/openai.js?invalid_tokens=${Date.now()}`);
      throw new Error('Should have thrown error for invalid max tokens');
    } catch (error) {
      if (!error.message.includes('Invalid OPENAI_MAX_TOKENS')) {
        throw new Error(`Expected tokens error, got: ${error.message}`);
      }
      console.log('   ✓ Invalid numeric values properly detected');
    }
    
  } finally {
    // Restore original environment
    process.env = originalEnv;
  }
});

/**
 * Test API connectivity (if API key is available)
 */
test.test('API connectivity test', async () => {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.log('   ⚠️  Skipping connectivity test - no valid API key provided');
    return;
  }
  
  try {
    const { testApiConnectivity } = await import('./config/openai.js');
    
    const startTime = Date.now();
    const result = await testApiConnectivity();
    const responseTime = Date.now() - startTime;
    
    if (!result) {
      throw new Error('API connectivity test returned false');
    }
    
    console.log(`   ✅ API connectivity test passed in ${responseTime}ms`);
    
  } catch (error) {
    // If it's an authentication error, that's expected with a placeholder key
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('   ⚠️  API key authentication failed (expected with placeholder key)');
    } else {
      throw error;
    }
  }
});

/**
 * Test health check middleware functionality
 */
test.test('Health check middleware functionality', async () => {
  const { 
    parseRateLimitHeaders, 
    determineHealthStatus,
    clearHealthCache 
  } = await import('./middleware/openai-health.js');
  
  // Clear cache for testing
  clearHealthCache();
  
  // Test rate limit header parsing
  const headers = {
    'x-ratelimit-remaining-requests': '45',
    'x-ratelimit-reset-requests': '2025-08-15T14:30:00Z',
    'x-ratelimit-remaining-tokens': '8000',
    'x-ratelimit-reset-tokens': '2025-08-15T14:31:00Z'
  };
  
  const rateLimitInfo = parseRateLimitHeaders(headers);
  
  if (rateLimitInfo.requestsRemaining !== 45) {
    throw new Error('Rate limit parsing failed for requests');
  }
  
  if (rateLimitInfo.tokensRemaining !== 8000) {
    throw new Error('Rate limit parsing failed for tokens');
  }
  
  console.log('   ✓ Rate limit headers parsed correctly');
  
  // Test health status determination
  const healthyStatus = determineHealthStatus(1500, null, rateLimitInfo);
  if (healthyStatus !== 'healthy') {
    throw new Error(`Expected healthy status, got ${healthyStatus}`);
  }
  
  const degradedStatus = determineHealthStatus(3000, null, rateLimitInfo);
  if (degradedStatus !== 'degraded') {
    throw new Error(`Expected degraded status, got ${degradedStatus}`);
  }
  
  const unhealthyStatus = determineHealthStatus(1500, { status: 401 }, rateLimitInfo);
  if (unhealthyStatus !== 'unhealthy') {
    throw new Error(`Expected unhealthy status, got ${unhealthyStatus}`);
  }
  
  console.log('   ✓ Health status determination working correctly');
});

/**
 * Test OpenAI client wrapper functionality
 */
test.test('OpenAI client wrapper functionality', async () => {
  const { 
    SlidingWindowRateLimiter, 
    CircuitBreaker, 
    UsageStatsTracker,
    CostEstimator 
  } = await import('./services/openai-client.js');
  
  // Test sliding window rate limiter
  const rateLimiter = new SlidingWindowRateLimiter(5, 1000); // 5 requests per second
  
  // Should allow first 5 requests
  for (let i = 0; i < 5; i++) {
    if (!rateLimiter.isAllowed()) {
      throw new Error(`Request ${i + 1} should be allowed`);
    }
  }
  
  // Sixth request should be denied
  if (rateLimiter.isAllowed()) {
    throw new Error('Sixth request should be denied by rate limiter');
  }
  
  console.log('   ✓ Sliding window rate limiter working correctly');
  
  // Test circuit breaker
  const circuitBreaker = new CircuitBreaker(3, 1000); // 3 failures, 1 second recovery
  
  if (!circuitBreaker.canExecute()) {
    throw new Error('Circuit breaker should initially allow execution');
  }
  
  // Record failures to trip the breaker
  for (let i = 0; i < 3; i++) {
    circuitBreaker.recordFailure();
  }
  
  if (circuitBreaker.canExecute()) {
    throw new Error('Circuit breaker should be OPEN after failures');
  }
  
  console.log('   ✓ Circuit breaker working correctly');
  
  // Test usage stats tracker
  const statsTracker = new UsageStatsTracker();
  
  statsTracker.recordRequest(true, 100, 1500, 0.05);
  statsTracker.recordRequest(false, 0, 0, 0);
  
  const stats = statsTracker.getStats();
  
  if (stats.totalRequests !== 2) {
    throw new Error('Usage stats not tracking requests correctly');
  }
  
  if (stats.successfulRequests !== 1) {
    throw new Error('Usage stats not tracking successes correctly');
  }
  
  console.log('   ✓ Usage stats tracker working correctly');
  
  // Test cost estimator
  const costEstimator = new CostEstimator();
  
  const cost = costEstimator.estimateCost('gpt-4-vision-preview', 1000, 500);
  
  if (cost <= 0) {
    throw new Error('Cost estimation should return positive value');
  }
  
  console.log(`   ✓ Cost estimator working correctly (estimated: $${cost.toFixed(6)})`);
});

/**
 * Run all tests
 */
console.log('Starting OpenAI Configuration Tests...\n');

await test.run();

// Exit with appropriate code
process.exit(test.failed > 0 ? 1 : 0);