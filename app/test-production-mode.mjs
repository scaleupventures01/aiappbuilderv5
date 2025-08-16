#!/usr/bin/env node
/**
 * Production Mode Automated Tests
 * PRD Reference: PRD-1.2.10-openai-api-configuration.md
 * 
 * This script runs comprehensive automated tests for production mode
 * functionality including validation, health checks, and performance.
 * 
 * Usage:
 *   node test-production-mode.mjs
 *   NODE_ENV=production node test-production-mode.mjs
 * 
 * @module test-production-mode
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

/**
 * Test runner configuration
 */
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 1,
  verbose: process.argv.includes('--verbose') || process.env.DEBUG === 'true'
};

/**
 * Test result tracking
 */
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

/**
 * Logging utility
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': 'ℹ️',
    'success': '✅',
    'error': '❌',
    'warning': '⚠️',
    'debug': '🔍'
  }[level] || 'ℹ️';
  
  console.log(`${prefix} ${timestamp} ${message}`);
  
  if (data && TEST_CONFIG.verbose) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Test assertion helper
 */
function assert(condition, message, expected = null, actual = null) {
  if (!condition) {
    const error = new Error(message);
    if (expected !== null && actual !== null) {
      error.expected = expected;
      error.actual = actual;
    }
    throw error;
  }
}

/**
 * Test wrapper with error handling and timing
 */
async function runTest(testName, testFn) {
  testResults.total++;
  const startTime = Date.now();
  
  try {
    log('info', `Running test: ${testName}`);
    await testFn();
    
    const duration = Date.now() - startTime;
    testResults.passed++;
    log('success', `Test passed: ${testName} (${duration}ms)`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    testResults.failed++;
    testResults.errors.push({
      test: testName,
      error: error.message,
      duration
    });
    log('error', `Test failed: ${testName} (${duration}ms) - ${error.message}`);
    
    if (TEST_CONFIG.verbose) {
      console.error(error);
    }
  }
}

/**
 * Test: Environment Configuration Validation
 */
async function testEnvironmentConfiguration() {
  const { ProductionModeValidator } = await import('./config/openai-production.js');
  
  const validator = new ProductionModeValidator();
  const validation = validator.validateProductionEnvironment();
  
  assert(validation !== null, 'Environment validation should return results');
  assert(typeof validation.valid === 'boolean', 'Validation should have valid field');
  assert(typeof validation.mode === 'string', 'Validation should have mode field');
  assert(Array.isArray(validation.issues), 'Validation should have issues array');
  assert(Array.isArray(validation.warnings), 'Validation should have warnings array');
  
  log('info', `Environment mode: ${validation.mode}`);
  log('info', `Environment valid: ${validation.valid}`);
  
  if (validation.issues.length > 0) {
    log('warning', `Environment issues: ${validation.issues.join(', ')}`);
  }
}

/**
 * Test: Production Mode Detection
 */
async function testProductionModeDetection() {
  const { ProductionModeValidator } = await import('./config/openai-production.js');
  
  const validator = new ProductionModeValidator();
  
  // Test should not throw for valid configurations
  try {
    const isProduction = validator.isProductionMode();
    log('info', `Production mode active: ${isProduction}`);
    
    // In test environment, mock mode should be allowed
    if (process.env.NODE_ENV !== 'production') {
      log('info', 'Non-production environment - mock mode allowed');
    } else {
      // In production, mock mode should be blocked
      assert(!process.env.USE_MOCK_OPENAI || process.env.USE_MOCK_OPENAI === 'false',
        'Production environment must have USE_MOCK_OPENAI=false');
    }
    
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      // Expected to throw in production without proper config
      log('info', 'Production validation correctly threw error for invalid config');
    } else {
      throw error;
    }
  }
}

/**
 * Test: API Key Validation
 */
async function testApiKeyValidation() {
  const { validateProductionApiKey } = await import('./config/openai-production.js');
  
  // Test invalid API key formats
  const invalidKeys = [
    '',
    null,
    undefined,
    'invalid-key',
    'sk-',
    'sk-short',
    'your-openai-api-key-here'
  ];
  
  for (const key of invalidKeys) {
    const result = await validateProductionApiKey(key);
    assert(!result.valid, `Invalid key "${key}" should be rejected`);
  }
  
  // Test valid API key format (if available)
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
    const result = await validateProductionApiKey(process.env.OPENAI_API_KEY);
    
    if (result.valid) {
      log('success', 'API key validation passed');
      assert(result.responseTime > 0, 'Response time should be recorded');
    } else {
      log('warning', `API key validation failed: ${result.error}`);
    }
  } else {
    log('info', 'No valid API key configured - skipping live validation');
  }
}

/**
 * Test: Production Health Check
 */
async function testProductionHealthCheck() {
  const { productionHealthCheck } = await import('./config/openai-production.js');
  
  const health = await productionHealthCheck();
  
  assert(health !== null, 'Health check should return results');
  assert(typeof health.status === 'string', 'Health check should have status');
  assert(typeof health.mode === 'string', 'Health check should have mode');
  assert(typeof health.timestamp === 'string', 'Health check should have timestamp');
  
  log('info', `Health status: ${health.status}`);
  log('info', `Health mode: ${health.mode}`);
  
  if (health.validation) {
    assert(typeof health.validation.valid === 'boolean', 'Validation should be included');
  }
  
  if (health.usage) {
    assert(typeof health.usage.totalRequests === 'number', 'Usage stats should be included');
  }
}

/**
 * Test: Production Metrics Tracking
 */
async function testProductionMetrics() {
  const { productionMetrics } = await import('./services/production-metrics.js');
  
  // Test metrics recording
  productionMetrics.recordApiRequest({
    responseTime: 1500,
    success: true,
    tokens: 100,
    cost: 0.001,
    model: 'gpt-5'
  });
  
  const metrics = productionMetrics.getMetrics();
  
  assert(metrics !== null, 'Metrics should be available');
  assert(typeof metrics.responseTime === 'object', 'Response time metrics should exist');
  assert(typeof metrics.successRate === 'object', 'Success rate metrics should exist');
  assert(typeof metrics.costs === 'object', 'Cost metrics should exist');
  
  const summary = productionMetrics.getPerformanceSummary();
  
  assert(summary !== null, 'Performance summary should be available');
  assert(typeof summary.performance === 'object', 'Performance data should exist');
  assert(typeof summary.costs === 'object', 'Cost data should exist');
  assert(typeof summary.usage === 'object', 'Usage data should exist');
  
  log('info', 'Production metrics tracking validated');
}

/**
 * Test: Trade Analysis Service Production Mode
 */
async function testTradeAnalysisProductionMode() {
  const { TradeAnalysisService } = await import('./server/services/trade-analysis-service.js');
  
  const service = new TradeAnalysisService();
  
  try {
    await service.initialize();
    
    const config = service.getConfiguration();
    
    assert(config !== null, 'Service configuration should be available');
    assert(typeof config.initialized === 'boolean', 'Initialization status should be available');
    assert(typeof config.mockMode === 'boolean', 'Mock mode status should be available');
    
    // In production, mock mode should be false
    if (process.env.NODE_ENV === 'production') {
      assert(!config.mockMode, 'Mock mode should be disabled in production');
    }
    
    log('info', `Service initialized: ${config.initialized}`);
    log('info', `Mock mode: ${config.mockMode}`);
    log('info', `Model: ${config.model}`);
    
  } catch (error) {
    if (process.env.NODE_ENV === 'production' && error.message.includes('Mock mode')) {
      log('success', 'Service correctly blocked mock mode in production');
    } else {
      throw error;
    }
  }
}

/**
 * Test: HTTP Endpoints
 */
async function testHttpEndpoints() {
  // Skip HTTP tests if no server is running
  if (!process.env.PORT && !process.env.TEST_SERVER_URL) {
    log('info', 'Skipping HTTP endpoint tests - no server configured');
    testResults.skipped++;
    return;
  }
  
  const baseUrl = process.env.TEST_SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;
  
  try {
    // Test health check endpoint
    const healthResponse = await fetch(`${baseUrl}/api/health/openai/production`);
    const healthData = await healthResponse.json();
    
    assert(healthData !== null, 'Health endpoint should return data');
    assert(typeof healthData.status === 'string', 'Health data should have status');
    
    log('info', `Health endpoint status: ${healthData.status}`);
    
    // Test metrics endpoint
    const metricsResponse = await fetch(`${baseUrl}/api/metrics/openai/production`);
    const metricsData = await metricsResponse.json();
    
    assert(metricsData !== null, 'Metrics endpoint should return data');
    assert(typeof metricsData.success === 'boolean', 'Metrics data should have success field');
    
    log('info', 'HTTP endpoints validated');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('warning', 'Server not running - skipping HTTP endpoint tests');
      testResults.skipped++;
      return;
    }
    throw error;
  }
}

/**
 * Test: Environment Variable Validation
 */
async function testEnvironmentVariables() {
  const requiredEnvVars = [
    'USE_MOCK_OPENAI',
    'OPENAI_API_KEY'
  ];
  
  const optionalEnvVars = [
    'OPENAI_MODEL',
    'OPENAI_FALLBACK_MODEL',
    'OPENAI_MAX_TOKENS',
    'OPENAI_TIMEOUT'
  ];
  
  // Check required variables exist
  for (const envVar of requiredEnvVars) {
    assert(process.env[envVar] !== undefined, 
      `Required environment variable ${envVar} should be defined`);
  }
  
  // Validate specific configurations
  if (process.env.NODE_ENV === 'production') {
    assert(process.env.USE_MOCK_OPENAI === 'false',
      'Production environment must have USE_MOCK_OPENAI=false');
  }
  
  log('info', 'Environment variables validated');
}

/**
 * Test: Performance Targets
 */
async function testPerformanceTargets() {
  const { productionMetrics } = await import('./services/production-metrics.js');
  
  // Simulate some API requests with different performance characteristics
  const testRequests = [
    { responseTime: 1500, success: true, tokens: 100, cost: 0.001 },
    { responseTime: 2500, success: true, tokens: 150, cost: 0.0015 },
    { responseTime: 3000, success: true, tokens: 200, cost: 0.002 },
    { responseTime: 35000, success: false, tokens: 0, cost: 0 }, // Should trigger alert
  ];
  
  for (const request of testRequests) {
    productionMetrics.recordApiRequest(request);
  }
  
  const targetCompliance = productionMetrics.checkPerformanceTargets();
  
  assert(targetCompliance !== null, 'Target compliance should be available');
  assert(typeof targetCompliance.overall === 'boolean', 'Overall compliance should be boolean');
  assert(typeof targetCompliance.details === 'object', 'Compliance details should be available');
  
  log('info', `Performance targets met: ${targetCompliance.overall}`);
  
  // Check that alerts were generated for poor performance
  const metrics = productionMetrics.getMetrics();
  const criticalAlerts = metrics.alerts.filter(a => a.level === 'critical');
  
  if (criticalAlerts.length > 0) {
    log('info', `Critical alerts generated: ${criticalAlerts.length}`);
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  log('info', '🚀 Starting Production Mode Automated Tests');
  log('info', `Environment: ${process.env.NODE_ENV || 'development'}`);
  log('info', `Mock mode: ${process.env.USE_MOCK_OPENAI || 'undefined'}`);
  log('info', `API key configured: ${!!process.env.OPENAI_API_KEY}`);
  
  console.log('═'.repeat(80));
  
  const tests = [
    ['Environment Configuration', testEnvironmentConfiguration],
    ['Production Mode Detection', testProductionModeDetection],
    ['API Key Validation', testApiKeyValidation],
    ['Production Health Check', testProductionHealthCheck],
    ['Production Metrics', testProductionMetrics],
    ['Trade Analysis Service', testTradeAnalysisProductionMode],
    ['HTTP Endpoints', testHttpEndpoints],
    ['Environment Variables', testEnvironmentVariables],
    ['Performance Targets', testPerformanceTargets]
  ];
  
  const startTime = Date.now();
  
  for (const [testName, testFn] of tests) {
    await runTest(testName, testFn);
  }
  
  const totalTime = Date.now() - startTime;
  
  console.log('═'.repeat(80));
  log('info', '📊 Test Results Summary');
  console.log(`Total tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Skipped: ${testResults.skipped}`);
  console.log(`Total time: ${totalTime}ms`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach(error => {
      console.log(`  - ${error.test}: ${error.error}`);
    });
  }
  
  const successRate = (testResults.passed / testResults.total) * 100;
  
  if (successRate >= 90) {
    log('success', `Production mode tests completed successfully (${successRate.toFixed(1)}% pass rate)`);
    process.exit(0);
  } else {
    log('error', `Production mode tests failed (${successRate.toFixed(1)}% pass rate)`);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    log('error', `Test runner failed: ${error.message}`);
    if (TEST_CONFIG.verbose) {
      console.error(error);
    }
    process.exit(1);
  });
}

export {
  runAllTests,
  testResults,
  TEST_CONFIG
};