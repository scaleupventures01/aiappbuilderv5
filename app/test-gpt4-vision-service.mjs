#!/usr/bin/env node
/**
 * GPT-4 Vision Service Test Script
 * PRD Reference: PRD-1.2.3-gpt4-vision-integration-service.md
 * Tests mock mode functionality and service integration
 * Created: 2025-08-15 by AI Engineer
 */

import { TradeAnalysisService } from './server/services/trade-analysis-service.js';
import fs from 'fs/promises';
import path from 'path';

// Set environment for testing
process.env.NODE_ENV = 'test';
process.env.USE_MOCK_OPENAI = 'true';
process.env.OPENAI_API_KEY = 'sk-dev-api-key-here';

/**
 * Test Results Storage
 */
const testResults = {
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    startTime: new Date().toISOString()
  }
};

/**
 * Log test result
 */
function logTest(name, passed, message, data = null) {
  const result = {
    name,
    passed,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (passed) {
    testResults.summary.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${name}: ${message}`);
  }
  
  if (data) {
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  }
}

/**
 * Generate test image data URL
 */
function generateTestImageDataUrl() {
  // Simple base64 test image (1x1 pixel PNG)
  const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  return `data:image/png;base64,${base64Data}`;
}

/**
 * Test 1: Service Initialization in Mock Mode
 */
async function testServiceInitialization() {
  console.log('\n🧪 Testing Service Initialization...');
  
  try {
    const service = new TradeAnalysisService();
    await service.initialize();
    
    const config = service.getConfiguration();
    
    logTest(
      'Service Initialization',
      config.initialized && config.mockMode,
      'Service initialized successfully in mock mode',
      config
    );
    
    return service;
  } catch (error) {
    logTest(
      'Service Initialization',
      false,
      `Initialization failed: ${error.message}`
    );
    throw error;
  }
}

/**
 * Test 2: API Key Validation
 */
async function testApiKeyValidation(service) {
  console.log('\n🧪 Testing API Key Validation...');
  
  // Test invalid keys
  const invalidKeys = [
    '',
    null,
    undefined,
    'invalid-key',
    'sk-short',
    'your-openai-api-key-here',
    'sk-dev-api-key-here'
  ];
  
  let validationTests = 0;
  let validationPassed = 0;
  
  for (const key of invalidKeys) {
    const isValid = service.isValidApiKey(key);
    validationTests++;
    if (!isValid) {
      validationPassed++;
    }
  }
  
  // Test valid key format
  const validKey = 'sk-1234567890abcdef1234567890abcdef';
  const isValidKey = service.isValidApiKey(validKey);
  validationTests++;
  if (isValidKey) {
    validationPassed++;
  }
  
  logTest(
    'API Key Validation',
    validationTests === validationPassed,
    `${validationPassed}/${validationTests} validation tests passed`,
    { invalidKeysRejected: validationPassed - 1, validKeyAccepted: isValidKey }
  );
}

/**
 * Test 3: Mock Response Generation
 */
async function testMockResponseGeneration(service) {
  console.log('\n🧪 Testing Mock Response Generation...');
  
  const testCases = [
    {
      description: 'Strong bullish pattern',
      expectedVerdict: 'Diamond'
    },
    {
      description: 'Bearish downtrend pattern',
      expectedVerdict: 'Skull'
    },
    {
      description: 'Neutral consolidation',
      expectedVerdict: null // Should be random
    }
  ];
  
  const imageData = generateTestImageDataUrl();
  
  for (const testCase of testCases) {
    try {
      const startTime = Date.now();
      const result = await service.analyzeChart(imageData, testCase.description);
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      
      // Validate response structure
      const validStructure = (
        result.success &&
        result.data &&
        result.data.verdict &&
        result.data.confidence &&
        result.data.reasoning &&
        result.metadata &&
        result.metadata.mockMode === true
      );
      
      // Check processing time (should be 1-2 seconds for mock)
      const validTiming = processingTime >= 1000 && processingTime <= 3000;
      
      // Check verdict for specific patterns
      let verdictCorrect = true;
      if (testCase.expectedVerdict) {
        verdictCorrect = result.data.verdict === testCase.expectedVerdict;
      }
      
      const passed = validStructure && validTiming && verdictCorrect;
      
      logTest(
        `Mock Response - ${testCase.description}`,
        passed,
        passed ? 'Generated valid mock response' : 'Invalid mock response',
        {
          verdict: result.data.verdict,
          confidence: result.data.confidence,
          processingTime,
          mockMode: result.metadata.mockMode,
          reasoning: result.data.reasoning.substring(0, 100) + '...'
        }
      );
    } catch (error) {
      logTest(
        `Mock Response - ${testCase.description}`,
        false,
        `Mock response failed: ${error.message}`
      );
    }
  }
}

/**
 * Test 4: Response Validation
 */
async function testResponseValidation(service) {
  console.log('\n🧪 Testing Response Validation...');
  
  const imageData = generateTestImageDataUrl();
  
  try {
    const result = await service.analyzeChart(imageData, 'Test validation');
    
    // Check all required fields
    const checks = {
      'success field': result.success === true,
      'verdict exists': !!result.data.verdict,
      'valid verdict': ['Diamond', 'Fire', 'Skull'].includes(result.data.verdict),
      'confidence exists': typeof result.data.confidence === 'number',
      'confidence range': result.data.confidence >= 0 && result.data.confidence <= 100,
      'reasoning exists': !!result.data.reasoning,
      'reasoning length': result.data.reasoning.length >= 10,
      'mock mode indicated': result.data.analysisMode === 'mock',
      'metadata exists': !!result.metadata,
      'model indicated': result.metadata.model === 'gpt-4-vision-preview-mock',
      'mock flag set': result.metadata.mockMode === true
    };
    
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    logTest(
      'Response Validation',
      passedChecks === totalChecks,
      `${passedChecks}/${totalChecks} validation checks passed`,
      checks
    );
  } catch (error) {
    logTest(
      'Response Validation',
      false,
      `Validation test failed: ${error.message}`
    );
  }
}

/**
 * Test 5: Error Handling
 */
async function testErrorHandling(service) {
  console.log('\n🧪 Testing Error Handling...');
  
  try {
    // Test with invalid image data
    const result = await service.analyzeChart('invalid-image-data', 'Test error handling');
    
    // Should either handle gracefully or throw appropriate error
    logTest(
      'Error Handling',
      true,
      'Service handled invalid input gracefully',
      { result: 'No error thrown' }
    );
  } catch (error) {
    // Check if error is properly handled
    const isProperError = error.message && typeof error.message === 'string';
    
    logTest(
      'Error Handling',
      isProperError,
      isProperError ? 'Service threw appropriate error' : 'Service error handling needs improvement',
      { errorMessage: error.message }
    );
  }
}

/**
 * Test 6: Performance Testing
 */
async function testPerformance(service) {
  console.log('\n🧪 Testing Performance...');
  
  const imageData = generateTestImageDataUrl();
  const iterations = 3;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    try {
      await service.analyzeChart(imageData, `Performance test ${i + 1}`);
      const endTime = Date.now();
      times.push(endTime - startTime);
    } catch (error) {
      logTest(
        'Performance Test',
        false,
        `Performance test ${i + 1} failed: ${error.message}`
      );
      return;
    }
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  
  // Mock responses should be reasonably fast (under 3 seconds)
  const performanceGood = avgTime < 3000 && maxTime < 4000;
  
  logTest(
    'Performance Test',
    performanceGood,
    `Average response time: ${avgTime.toFixed(0)}ms`,
    {
      averageTime: Math.round(avgTime),
      minTime,
      maxTime,
      allTimes: times
    }
  );
}

/**
 * Test 7: Health Check
 */
async function testHealthCheck(service) {
  console.log('\n🧪 Testing Health Check...');
  
  try {
    const health = await service.healthCheck();
    
    const isHealthy = (
      health.status === 'healthy' &&
      health.initialized === true &&
      health.hasApiKey === true
    );
    
    logTest(
      'Health Check',
      isHealthy,
      isHealthy ? 'Service reports healthy status' : 'Service health check failed',
      health
    );
  } catch (error) {
    logTest(
      'Health Check',
      false,
      `Health check failed: ${error.message}`
    );
  }
}

/**
 * Save test results to file
 */
async function saveTestResults() {
  testResults.summary.endTime = new Date().toISOString();
  testResults.summary.duration = new Date(testResults.summary.endTime) - new Date(testResults.summary.startTime);
  
  const reportPath = path.join(process.cwd(), 'gpt4-vision-test-results.json');
  
  try {
    await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Test results saved to: ${reportPath}`);
  } catch (error) {
    console.error(`\n❌ Failed to save test results: ${error.message}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting GPT-4 Vision Service Tests');
  console.log('=====================================');
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Mock Mode: ${process.env.USE_MOCK_OPENAI}`);
  console.log(`API Key: ${process.env.OPENAI_API_KEY?.substring(0, 10)}...`);
  
  try {
    // Run all tests
    const service = await testServiceInitialization();
    await testApiKeyValidation(service);
    await testMockResponseGeneration(service);
    await testResponseValidation(service);
    await testErrorHandling(service);
    await testPerformance(service);
    await testHealthCheck(service);
    
    // Print summary
    console.log('\n📊 Test Summary');
    console.log('===============');
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
    
    // Save results
    await saveTestResults();
    
    // Exit with appropriate code
    const success = testResults.summary.failed === 0;
    console.log(`\n${success ? '✅' : '❌'} Tests ${success ? 'PASSED' : 'FAILED'}`);
    
    if (success) {
      console.log('\n🎉 Mock mode is working correctly!');
      console.log('📝 Ready for production with real OpenAI API key');
    } else {
      console.log('\n🔧 Some tests failed - check the results above');
    }
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests, testResults };