#!/usr/bin/env node

/**
 * PRD 1.2.10 Production Mode Validation Test
 * QA Engineer Implementation Test
 */

import { productionValidator, validateProductionApiKey, productionHealthCheck } from './config/openai-production.js';

// Test configuration
const ORIGINAL_ENV = { ...process.env };

/**
 * Test Results Tracking
 */
let testResults = {
  timestamp: new Date().toISOString(),
  environment: 'test',
  tests: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  details: [],
  issues: []
};

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
 * Test: Production Mode Detection
 */
async function testProductionModeDetection() {
  // Test 1: Mock mode enabled
  process.env.USE_MOCK_OPENAI = 'true';
  process.env.NODE_ENV = 'development';
  process.env.OPENAI_API_KEY = 'sk-test-key';
  
  if (productionValidator.isProductionMode()) {
    throw new Error('Should not be in production mode when USE_MOCK_OPENAI=true');
  }
  
  // Test 2: Production environment requires USE_MOCK_OPENAI=false
  process.env.NODE_ENV = 'production';
  process.env.USE_MOCK_OPENAI = 'true';
  
  try {
    productionValidator.isProductionMode();
    throw new Error('Should throw error when production env has mock mode enabled');
  } catch (error) {
    if (!error.message.includes('Production environment requires USE_MOCK_OPENAI=false')) {
      throw error;
    }
  }
  
  // Test 3: Valid production mode
  process.env.USE_MOCK_OPENAI = 'false';
  process.env.NODE_ENV = 'production';
  process.env.OPENAI_API_KEY = 'sk-proj-valid-looking-key-here-with-sufficient-length-for-validation-testing';
  
  const isProduction = productionValidator.isProductionMode();
  if (!isProduction) {
    throw new Error('Should be in production mode with valid config');
  }
  
  return {
    mockModeDetection: 'working',
    productionEnforcement: 'working',
    validProductionMode: 'working'
  };
}

/**
 * Test: API Key Validation
 */
async function testApiKeyValidation() {
  const tests = [
    { key: null, expected: false, name: 'null key' },
    { key: '', expected: false, name: 'empty key' },
    { key: 'invalid-key', expected: false, name: 'invalid format' },
    { key: 'sk-', expected: false, name: 'too short' },
    { key: 'your-openai-api-key-here', expected: false, name: 'placeholder key' },
    { key: 'sk-dev-api-key-here', expected: false, name: 'dev placeholder' },
    { key: 'sk-proj-valid-looking-key-here-with-sufficient-length', expected: true, name: 'valid format' }
  ];
  
  const results = {};
  
  for (const test of tests) {
    const isValid = productionValidator.isValidProductionApiKey(test.key);
    if (isValid !== test.expected) {
      throw new Error(`API key validation failed for ${test.name}: expected ${test.expected}, got ${isValid}`);
    }
    results[test.name] = isValid;
  }
  
  return results;
}

/**
 * Test: Environment Validation
 */
async function testEnvironmentValidation() {
  // Test development environment
  process.env.NODE_ENV = 'development';
  process.env.USE_MOCK_OPENAI = 'true';
  process.env.OPENAI_API_KEY = 'sk-dev-key';
  
  const devValidation = productionValidator.validateProductionEnvironment();
  if (!devValidation.valid) {
    throw new Error('Development environment should be valid for mock mode');
  }
  
  if (devValidation.mode !== 'mock') {
    throw new Error(`Expected mock mode in development, got ${devValidation.mode}`);
  }
  
  // Test production environment
  process.env.NODE_ENV = 'production';
  process.env.USE_MOCK_OPENAI = 'false';
  process.env.OPENAI_API_KEY = 'sk-proj-valid-production-key-here-with-sufficient-length';
  
  const prodValidation = productionValidator.validateProductionEnvironment();
  if (!prodValidation.valid) {
    throw new Error(`Production environment should be valid: ${prodValidation.issues.join(', ')}`);
  }
  
  if (prodValidation.mode !== 'production') {
    throw new Error(`Expected production mode, got ${prodValidation.mode}`);
  }
  
  return {
    developmentMode: devValidation.mode,
    productionMode: prodValidation.mode,
    validationWorking: true
  };
}

/**
 * Test: Health Check Functionality
 */
async function testHealthCheckFunctionality() {
  // Set up valid production environment
  process.env.NODE_ENV = 'production';
  process.env.USE_MOCK_OPENAI = 'false';
  process.env.OPENAI_API_KEY = 'sk-your-development-api-key-here'; // Placeholder - won't actually connect
  
  try {
    const healthCheck = await productionHealthCheck();
    
    if (!healthCheck.mode) {
      throw new Error('Health check should return mode information');
    }
    
    if (!healthCheck.timestamp) {
      throw new Error('Health check should include timestamp');
    }
    
    if (typeof healthCheck.responseTime !== 'number') {
      throw new Error('Health check should include response time');
    }
    
    return {
      mode: healthCheck.mode,
      status: healthCheck.status,
      hasValidation: !!healthCheck.validation,
      hasEnvironment: !!healthCheck.environment,
      hasConfiguration: !!healthCheck.configuration
    };
    
  } catch (error) {
    // Expected for placeholder API key
    if (error.message.includes('API key')) {
      return {
        healthCheckFunction: 'working',
        apiKeyValidationTriggered: true,
        note: 'API key validation working as expected'
      };
    }
    throw error;
  }
}

/**
 * Test: Security - No Credential Exposure
 */
async function testCredentialSecurity() {
  const testApiKey = 'sk-proj-test-secret-key-that-should-never-be-exposed-in-logs-12345';
  process.env.OPENAI_API_KEY = testApiKey;
  
  // Capture console output
  const originalLog = console.log;
  const originalError = console.error;
  let logOutput = '';
  
  console.log = (...args) => {
    logOutput += args.join(' ') + '\n';
  };
  console.error = (...args) => {
    logOutput += args.join(' ') + '\n';
  };
  
  try {
    // Test production mode activation logging
    process.env.USE_MOCK_OPENAI = 'false';
    process.env.NODE_ENV = 'production';
    
    const isProduction = productionValidator.isProductionMode();
    
    // Restore console
    console.log = originalLog;
    console.error = originalError;
    
    // Check for credential exposure
    if (logOutput.includes(testApiKey)) {
      throw new Error('API key was exposed in console output');
    }
    
    // Should contain masked version
    if (!logOutput.includes('sk-proj-t...') && !logOutput.includes('sk-proj...')) {
      console.log('Log output:', logOutput);
      throw new Error('Masked API key not found in logs');
    }
    
    return {
      credentialMasking: 'working',
      noFullKeyExposure: true,
      maskedKeyPresent: true
    };
    
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

/**
 * Test: Configuration File Security
 */
async function testConfigurationSecurity() {
  const fs = await import('fs/promises');
  
  // Check .env.development for exposed credentials
  try {
    const envContent = await fs.readFile('.env.development', 'utf8');
    
    // Should not contain actual API keys
    if (envContent.includes('sk-proj-') && !envContent.includes('sk-your-development-api-key-here')) {
      testResults.issues.push({
        severity: 'CRITICAL',
        type: 'credential_exposure',
        file: '.env.development',
        message: 'Real API key found in development environment file'
      });
      throw new Error('Real API key found in .env.development');
    }
    
    return {
      envDevelopmentSecure: true,
      hasPlaceholder: envContent.includes('sk-your-development-api-key-here'),
      noRealCredentials: true
    };
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { envDevelopmentNotFound: true };
    }
    throw error;
  }
}

/**
 * Test: Mock Mode Enforcement
 */
async function testMockModeEnforcement() {
  // Test that mock mode is properly disabled in production
  process.env.NODE_ENV = 'production';
  process.env.USE_MOCK_OPENAI = 'true';
  
  try {
    productionValidator.isProductionMode();
    throw new Error('Should reject mock mode in production');
  } catch (error) {
    if (!error.message.includes('Production environment requires USE_MOCK_OPENAI=false')) {
      throw error;
    }
  }
  
  // Test that production requires valid API key
  process.env.USE_MOCK_OPENAI = 'false';
  process.env.OPENAI_API_KEY = 'invalid-key';
  
  try {
    productionValidator.isProductionMode();
    throw new Error('Should reject invalid API key in production');
  } catch (error) {
    if (!error.message.includes('valid OpenAI API key')) {
      throw error;
    }
  }
  
  return {
    mockModeRejected: true,
    invalidKeyRejected: true,
    productionEnforcement: 'working'
  };
}

/**
 * Main test execution
 */
async function runPRD1210ValidationTests() {
  console.log('🚀 PRD 1.2.10 - OpenAI Production Mode Configuration Tests');
  console.log('📋 QA Engineer Validation Suite');
  console.log('=' + '='.repeat(70));
  
  // Run all tests
  await runTest('Production Mode Detection', testProductionModeDetection);
  await runTest('API Key Validation', testApiKeyValidation);
  await runTest('Environment Validation', testEnvironmentValidation);
  await runTest('Health Check Functionality', testHealthCheckFunctionality);
  await runTest('Credential Security', testCredentialSecurity);
  await runTest('Configuration File Security', testConfigurationSecurity);
  await runTest('Mock Mode Enforcement', testMockModeEnforcement);
  
  // Restore original environment
  process.env = { ...ORIGINAL_ENV };
  
  // Generate summary
  console.log('=' + '='.repeat(70));
  console.log('📊 PRD 1.2.10 Validation Summary');
  console.log('=' + '='.repeat(70));
  console.log(`Total Tests: ${testResults.tests.total}`);
  console.log(`Passed: ${testResults.tests.passed}`);
  console.log(`Failed: ${testResults.tests.failed}`);
  console.log(`Success Rate: ${Math.round((testResults.tests.passed / testResults.tests.total) * 100)}%`);
  
  // Show issues
  if (testResults.issues.length > 0) {
    console.log('\n🚨 Security Issues Found:');
    testResults.issues.forEach(issue => {
      console.log(`   ${issue.severity}: ${issue.message} (${issue.file})`);
    });
  }
  
  if (testResults.tests.failed === 0 && testResults.issues.length === 0) {
    console.log('\n✅ ALL TESTS PASSED - PRD 1.2.10 implementation validated');
    return { success: true, results: testResults };
  } else {
    console.log('\n❌ ISSUES FOUND - Review implementation');
    
    // Show failed tests
    const failedTests = testResults.details.filter(t => t.status === 'FAILED');
    if (failedTests.length > 0) {
      console.log('\n🔧 Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.error}`);
      });
    }
    
    return { success: false, results: testResults };
  }
}

// Execute tests
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const results = await runPRD1210ValidationTests();
      process.exit(results.success ? 0 : 1);
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  })();
}

export { runPRD1210ValidationTests };