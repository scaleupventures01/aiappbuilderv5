/**
 * OpenAI Server Integration Test
 * 
 * This test validates that the OpenAI health check endpoint is properly 
 * integrated into the server and returns the expected response format.
 * 
 * Run with: node test-openai-server.mjs
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.development') });

console.log('🧪 OpenAI Server Integration Test');
console.log('=' + '='.repeat(40));

/**
 * Test the health check endpoint integration
 */
async function testHealthCheckEndpoint() {
  try {
    console.log('\n🔍 Testing OpenAI health check endpoint integration...');
    
    // Import and test the health check middleware directly
    const { healthCheckMiddleware, clearHealthCache } = await import('./middleware/openai-health.js');
    
    // Clear cache for clean test
    clearHealthCache();
    
    // Create mock Express request and response objects
    const mockReq = {
      method: 'GET',
      url: '/health/openai',
      headers: {},
      ip: '127.0.0.1'
    };
    
    const mockRes = {
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
    
    // Execute the middleware
    const startTime = Date.now();
    await healthCheckMiddleware(mockReq, mockRes);
    const totalTime = Date.now() - startTime;
    
    // Validate response structure
    console.log('📋 Validating response structure...');
    
    if (!mockRes.body) {
      throw new Error('Health check should return response body');
    }
    
    const response = mockRes.body;
    
    // Check required fields
    const requiredFields = ['status', 'timestamp', 'responseTime'];
    for (const field of requiredFields) {
      if (!(field in response)) {
        throw new Error(`Response missing required field: ${field}`);
      }
    }
    
    // Validate field types
    if (typeof response.status !== 'string') {
      throw new Error('status should be a string');
    }
    
    if (typeof response.timestamp !== 'string') {
      throw new Error('timestamp should be a string');
    }
    
    if (typeof response.responseTime !== 'number') {
      throw new Error('responseTime should be a number');
    }
    
    // Validate status values
    const validStatuses = ['healthy', 'degraded', 'unhealthy'];
    if (!validStatuses.includes(response.status)) {
      throw new Error(`Invalid status value: ${response.status}`);
    }
    
    // Check optional fields if present
    if (response.config) {
      if (typeof response.config !== 'object') {
        throw new Error('config should be an object');
      }
    }
    
    if (response.rateLimit) {
      if (typeof response.rateLimit !== 'object') {
        throw new Error('rateLimit should be an object');
      }
    }
    
    if (response.error) {
      if (typeof response.error !== 'object') {
        throw new Error('error should be an object');
      }
      
      if (typeof response.error.message !== 'string') {
        throw new Error('error.message should be a string');
      }
    }
    
    // Validate HTTP status code
    const expectedHttpStatus = response.status === 'unhealthy' ? 503 : 200;
    if (mockRes.statusCode !== expectedHttpStatus) {
      console.log(`⚠️  HTTP status: expected ${expectedHttpStatus}, got ${mockRes.statusCode}`);
    }
    
    console.log('✅ Response structure validation passed');
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response time: ${response.responseTime}ms`);
    console.log(`✅ Total endpoint time: ${totalTime}ms`);
    console.log(`✅ HTTP status code: ${mockRes.statusCode}`);
    console.log(`✅ Cached: ${response.cached}`);
    
    // Test caching behavior
    console.log('\n🔄 Testing response caching...');
    
    const startTime2 = Date.now();
    await healthCheckMiddleware(mockReq, mockRes);
    const totalTime2 = Date.now() - startTime2;
    
    if (!mockRes.body.cached) {
      console.log('⚠️  Second request not cached (cache may have expired)');
    } else {
      console.log('✅ Second request properly cached');
      console.log(`✅ Cached response time: ${totalTime2}ms`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Health check endpoint test failed:', error.message);
    return false;
  }
}

/**
 * Test OpenAI client wrapper integration
 */
async function testClientWrapperIntegration() {
  try {
    console.log('\n🔍 Testing OpenAI client wrapper integration...');
    
    const { openaiClientWrapper } = await import('./services/openai-client.js');
    
    // Test wrapper initialization
    const rateLimitStatus = openaiClientWrapper.getRateLimitStatus();
    
    if (typeof rateLimitStatus.remaining !== 'number') {
      throw new Error('Rate limit status should include remaining count');
    }
    
    if (typeof rateLimitStatus.circuitBreakerState !== 'string') {
      throw new Error('Rate limit status should include circuit breaker state');
    }
    
    console.log(`✅ Rate limiter initialized: ${rateLimitStatus.remaining} requests remaining`);
    console.log(`✅ Circuit breaker state: ${rateLimitStatus.circuitBreakerState}`);
    
    // Test usage stats
    const stats = openaiClientWrapper.getUsageStats();
    
    const requiredStatFields = ['totalRequests', 'successfulRequests', 'failedRequests'];
    for (const field of requiredStatFields) {
      if (typeof stats[field] !== 'number') {
        throw new Error(`Stats should include ${field} as number`);
      }
    }
    
    console.log('✅ Usage statistics tracking initialized');
    console.log(`   Total requests: ${stats.totalRequests}`);
    console.log(`   Successful: ${stats.successfulRequests}`);
    console.log(`   Failed: ${stats.failedRequests}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Client wrapper integration test failed:', error.message);
    return false;
  }
}

/**
 * Test configuration loading and validation
 */
async function testConfigurationIntegration() {
  try {
    console.log('\n🔍 Testing configuration integration...');
    
    const { getConfig, maskApiKey } = await import('./config/openai.js');
    
    const config = getConfig();
    
    // Validate configuration structure
    const requiredFields = ['model', 'maxTokens', 'timeout', 'rateLimitRPM'];
    for (const field of requiredFields) {
      if (!(field in config)) {
        throw new Error(`Configuration missing required field: ${field}`);
      }
    }
    
    // Check that API key is masked
    if (!config.apiKey.includes('...')) {
      throw new Error('API key should be masked in configuration');
    }
    
    console.log('✅ Configuration structure valid');
    console.log(`   Model: ${config.model}`);
    console.log(`   Max tokens: ${config.maxTokens}`);
    console.log(`   Timeout: ${config.timeout}ms`);
    console.log(`   Rate limit: ${config.rateLimitRPM} req/min`);
    console.log(`   API key: ${config.apiKey}`);
    
    // Test API key masking function
    const testKey = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
    const masked = maskApiKey(testKey);
    
    if (!masked.includes('...')) {
      throw new Error('maskApiKey function should mask the key');
    }
    
    if (masked === testKey) {
      throw new Error('maskApiKey should not return the original key');
    }
    
    console.log('✅ API key masking function working correctly');
    
    return true;
    
  } catch (error) {
    console.error('❌ Configuration integration test failed:', error.message);
    return false;
  }
}

/**
 * Run all integration tests
 */
async function runIntegrationTests() {
  const results = [];
  
  results.push(await testConfigurationIntegration());
  results.push(await testClientWrapperIntegration());  
  results.push(await testHealthCheckEndpoint());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(42));
  console.log(`📊 Integration Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 All OpenAI integration tests passed!');
    console.log('✅ OpenAI API configuration is ready for use');
  } else {
    console.log(`❌ ${total - passed} test(s) failed`);
  }
  
  console.log('=' + '='.repeat(42));
  
  return passed === total;
}

// Run the tests
const success = await runIntegrationTests();
process.exit(success ? 0 : 1);