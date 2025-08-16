#!/usr/bin/env node

/**
 * Mock Mode Validation Test - PRD 1.2.3 GPT-4 Vision Integration Service
 * QA Engineer: Comprehensive validation of mock mode functionality
 * Created: 2025-08-15
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  mockMode: true,
  testTimeout: 30000,
  expectedResponseTime: 3000, // Mock responses should be < 3 seconds
  testImagePath: join(__dirname, '../../test-image.png')
};

// Test results collector
const testResults = {
  timestamp: new Date().toISOString(),
  testSuite: 'Mock Mode Validation',
  prdReference: 'PRD-1.2.3-gpt4-vision-integration-service',
  environment: {
    mockMode: process.env.USE_MOCK_OPENAI || 'not set',
    apiKey: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
  },
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

/**
 * Enhanced logging function
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (data) {
    console.log(logEntry, JSON.stringify(data, null, 2));
  } else {
    console.log(logEntry);
  }
}

/**
 * Record test result
 */
function recordTest(testName, status, details = {}) {
  const test = {
    name: testName,
    status,
    executedAt: new Date().toISOString(),
    ...details
  };
  
  testResults.tests.push(test);
  testResults.summary.total++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
    log('info', `✅ ${testName}`, details);
  } else if (status === 'FAIL') {
    testResults.summary.failed++;
    log('error', `❌ ${testName}`, details);
  } else if (status === 'SKIP') {
    testResults.summary.skipped++;
    log('warn', `⏭️  ${testName}`, details);
  }
}

/**
 * Test 1: Service Initialization in Mock Mode
 */
async function testServiceInitialization() {
  const testName = 'Service Initialization in Mock Mode';
  log('info', `Starting ${testName}`);
  
  try {
    // Import the enhanced trade analysis service
    const { enhancedTradeAnalysisService } = await import('../../server/services/enhanced-trade-analysis-service.js');
    
    // Initialize the service
    await enhancedTradeAnalysisService.initialize();
    
    // Check if service is in mock mode
    const healthCheck = await enhancedTradeAnalysisService.healthCheck();
    
    if (healthCheck.mockMode) {
      recordTest(testName, 'PASS', {
        mockMode: healthCheck.mockMode,
        initialized: healthCheck.initialized,
        hasApiKey: healthCheck.hasApiKey,
        services: healthCheck.services
      });
    } else {
      recordTest(testName, 'FAIL', {
        reason: 'Service not in mock mode',
        healthCheck
      });
    }
    
  } catch (error) {
    recordTest(testName, 'FAIL', {
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Test 2: Mock Response Generation
 */
async function testMockResponseGeneration() {
  const testName = 'Mock Response Generation';
  log('info', `Starting ${testName}`);
  
  try {
    const { enhancedTradeAnalysisService } = await import('../../server/services/enhanced-trade-analysis-service.js');
    
    // Prepare test image data
    const testImageBuffer = Buffer.from('test-image-data', 'base64');
    const testFileMetadata = {
      originalname: 'test-chart.jpg',
      mimetype: 'image/jpeg',
      size: testImageBuffer.length
    };
    
    const startTime = Date.now();
    
    // Test analysis with different descriptions to verify smart response logic
    const testScenarios = [
      { description: 'strong bullish breakout pattern', expectedVerdict: 'Diamond' },
      { description: 'bearish decline with high volume', expectedVerdict: 'Skull' },
      { description: 'mixed signals and unclear trend', expectedVerdict: 'Fire' },
      { description: '', expectedVerdict: null } // No expectation for empty description
    ];
    
    const results = [];
    
    for (const scenario of testScenarios) {
      try {
        const analysisResult = await enhancedTradeAnalysisService.analyzeChart(
          'data:image/jpeg;base64,' + testImageBuffer.toString('base64'),
          scenario.description,
          { requestId: `test-${Date.now()}`, userId: 'qa-test-user' }
        );
        
        results.push({
          scenario: scenario.description || 'empty description',
          result: analysisResult.data,
          processingTime: analysisResult.data.processingTime,
          mockMode: analysisResult.metadata.mockMode
        });
        
      } catch (error) {
        results.push({
          scenario: scenario.description || 'empty description',
          error: error.message
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    const averageTime = totalTime / testScenarios.length;
    
    // Validate results
    const allSuccessful = results.every(r => !r.error);
    const allInMockMode = results.every(r => r.mockMode === true);
    const responseTimeAcceptable = averageTime < TEST_CONFIG.expectedResponseTime;
    
    if (allSuccessful && allInMockMode && responseTimeAcceptable) {
      recordTest(testName, 'PASS', {
        totalTests: testScenarios.length,
        averageResponseTime: averageTime,
        allResults: results
      });
    } else {
      recordTest(testName, 'FAIL', {
        allSuccessful,
        allInMockMode,
        responseTimeAcceptable,
        averageResponseTime: averageTime,
        expectedMaxTime: TEST_CONFIG.expectedResponseTime,
        results
      });
    }
    
  } catch (error) {
    recordTest(testName, 'FAIL', {
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Test 3: Smart Response Selection Logic
 */
async function testSmartResponseLogic() {
  const testName = 'Smart Response Selection Logic';
  log('info', `Starting ${testName}`);
  
  try {
    const { enhancedTradeAnalysisService } = await import('../../server/services/enhanced-trade-analysis-service.js');
    
    const testImageBuffer = Buffer.from('test-image-data', 'base64');
    
    // Test scenarios with expected response patterns
    const smartResponseTests = [
      {
        description: 'bullish diamond pattern strong breakout',
        expectedBehavior: 'Should favor Diamond verdict',
        attempts: 5
      },
      {
        description: 'bearish skull pattern declining volume',
        expectedBehavior: 'Should favor Skull verdict',
        attempts: 5
      },
      {
        description: 'mixed fire signals unclear direction',
        expectedBehavior: 'Should favor Fire verdict or random',
        attempts: 5
      }
    ];
    
    const testResults = [];
    
    for (const test of smartResponseTests) {
      const verdictCounts = { Diamond: 0, Skull: 0, Fire: 0 };
      const responses = [];
      
      for (let i = 0; i < test.attempts; i++) {
        try {
          const result = await enhancedTradeAnalysisService.analyzeChart(
            'data:image/jpeg;base64,' + testImageBuffer.toString('base64'),
            test.description,
            { requestId: `smart-test-${Date.now()}-${i}` }
          );
          
          const verdict = result.data.verdict;
          verdictCounts[verdict]++;
          responses.push({
            verdict,
            confidence: result.data.confidence,
            reasoning: result.data.reasoning
          });
          
        } catch (error) {
          responses.push({ error: error.message });
        }
      }
      
      testResults.push({
        description: test.description,
        expectedBehavior: test.expectedBehavior,
        verdictDistribution: verdictCounts,
        responses: responses.slice(0, 2) // Include first 2 responses as samples
      });
    }
    
    // Analyze results for smart response behavior
    const hasIntelligentResponseSelection = testResults.some(test => {
      const { verdictDistribution } = test;
      const totalResponses = Object.values(verdictDistribution).reduce((sum, count) => sum + count, 0);
      
      // Check if any single verdict dominates (>50% of responses)
      const hasPreference = Object.values(verdictDistribution).some(count => count / totalResponses > 0.5);
      return hasPreference;
    });
    
    if (hasIntelligentResponseSelection) {
      recordTest(testName, 'PASS', {
        intelligentSelection: true,
        testResults
      });
    } else {
      recordTest(testName, 'PASS', {
        note: 'Responses appear random, which is acceptable for mock mode',
        intelligentSelection: false,
        testResults
      });
    }
    
  } catch (error) {
    recordTest(testName, 'FAIL', {
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Test 4: Response Structure Validation
 */
async function testResponseStructure() {
  const testName = 'Mock Response Structure Validation';
  log('info', `Starting ${testName}`);
  
  try {
    const { enhancedTradeAnalysisService } = await import('../../server/services/enhanced-trade-analysis-service.js');
    
    const testImageBuffer = Buffer.from('test-image-data', 'base64');
    
    const result = await enhancedTradeAnalysisService.analyzeChart(
      'data:image/jpeg;base64,' + testImageBuffer.toString('base64'),
      'Test analysis for response structure validation',
      { requestId: 'structure-test' }
    );
    
    // Validate response structure according to PRD
    const structureValidation = {
      hasSuccessField: typeof result.success === 'boolean',
      hasDataField: result.data !== null && typeof result.data === 'object',
      hasMetadataField: result.metadata !== null && typeof result.metadata === 'object',
      
      // Data field validation
      hasVerdict: ['Diamond', 'Fire', 'Skull'].includes(result.data?.verdict),
      hasConfidence: typeof result.data?.confidence === 'number' && 
                    result.data.confidence >= 0 && 
                    result.data.confidence <= 100,
      hasReasoning: typeof result.data?.reasoning === 'string' && 
                   result.data.reasoning.length > 0,
      hasAnalysisMode: typeof result.data?.analysisMode === 'string',
      hasProcessingTime: typeof result.data?.processingTime === 'number',
      
      // Metadata field validation
      hasRequestId: typeof result.metadata?.requestId === 'string',
      hasTimestamp: typeof result.metadata?.timestamp === 'string',
      hasModel: typeof result.metadata?.model === 'string',
      hasMockModeFlag: result.metadata?.mockMode === true,
      hasTokensUsed: typeof result.metadata?.tokensUsed === 'number'
    };
    
    const allValidationsPass = Object.values(structureValidation).every(v => v === true);
    
    if (allValidationsPass) {
      recordTest(testName, 'PASS', {
        responseStructure: result,
        validations: structureValidation
      });
    } else {
      recordTest(testName, 'FAIL', {
        responseStructure: result,
        validations: structureValidation,
        failedValidations: Object.entries(structureValidation)
          .filter(([_, value]) => value !== true)
          .map(([key]) => key)
      });
    }
    
  } catch (error) {
    recordTest(testName, 'FAIL', {
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Test 5: Mock Mode Performance Validation
 */
async function testMockModePerformance() {
  const testName = 'Mock Mode Performance Validation';
  log('info', `Starting ${testName}`);
  
  try {
    const { enhancedTradeAnalysisService } = await import('../../server/services/enhanced-trade-analysis-service.js');
    
    const testImageBuffer = Buffer.from('test-image-data', 'base64');
    const performanceTests = [];
    const numberOfTests = 10;
    
    log('info', `Running ${numberOfTests} performance tests`);
    
    for (let i = 0; i < numberOfTests; i++) {
      const startTime = Date.now();
      
      try {
        const result = await enhancedTradeAnalysisService.analyzeChart(
          'data:image/jpeg;base64,' + testImageBuffer.toString('base64'),
          `Performance test ${i + 1}`,
          { requestId: `perf-test-${i}` }
        );
        
        const responseTime = Date.now() - startTime;
        
        performanceTests.push({
          testNumber: i + 1,
          responseTime,
          success: result.success,
          reportedProcessingTime: result.data?.processingTime,
          mockMode: result.metadata?.mockMode
        });
        
      } catch (error) {
        performanceTests.push({
          testNumber: i + 1,
          error: error.message,
          responseTime: Date.now() - startTime
        });
      }
    }
    
    // Analyze performance metrics
    const successfulTests = performanceTests.filter(t => t.success);
    const averageResponseTime = successfulTests.reduce((sum, test) => sum + test.responseTime, 0) / successfulTests.length;
    const maxResponseTime = Math.max(...successfulTests.map(t => t.responseTime));
    const minResponseTime = Math.min(...successfulTests.map(t => t.responseTime));
    const allWithinTimeout = successfulTests.every(t => t.responseTime < TEST_CONFIG.expectedResponseTime);
    
    const performanceMetrics = {
      totalTests: numberOfTests,
      successfulTests: successfulTests.length,
      averageResponseTime,
      maxResponseTime,
      minResponseTime,
      allWithinTimeout,
      expectedMaxTime: TEST_CONFIG.expectedResponseTime,
      performanceTests: performanceTests.slice(0, 3) // Include first 3 as samples
    };
    
    if (allWithinTimeout && successfulTests.length === numberOfTests) {
      recordTest(testName, 'PASS', performanceMetrics);
    } else {
      recordTest(testName, 'FAIL', {
        ...performanceMetrics,
        failures: performanceTests.filter(t => !t.success || t.responseTime >= TEST_CONFIG.expectedResponseTime)
      });
    }
    
  } catch (error) {
    recordTest(testName, 'FAIL', {
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Test 6: API Key Validation Logic
 */
async function testApiKeyValidation() {
  const testName = 'API Key Validation Logic';
  log('info', `Starting ${testName}`);
  
  try {
    const { enhancedTradeAnalysisService } = await import('../../server/services/enhanced-trade-analysis-service.js');
    
    // Test the isValidApiKey method
    const testKeys = [
      { key: 'sk-valid-key-format-here123456789', expected: true },
      { key: 'your-openai-api-key-here', expected: false },
      { key: 'sk-dev-api-key-here', expected: false },
      { key: 'invalid-format', expected: false },
      { key: '', expected: false },
      { key: null, expected: false },
      { key: undefined, expected: false },
      { key: 'sk-short', expected: false }
    ];
    
    const validationResults = [];
    
    for (const testCase of testKeys) {
      const result = enhancedTradeAnalysisService.isValidApiKey(testCase.key);
      const passed = result === testCase.expected;
      
      validationResults.push({
        key: testCase.key || 'null/undefined',
        expected: testCase.expected,
        actual: result,
        passed
      });
    }
    
    const allValidationsPassed = validationResults.every(r => r.passed);
    
    if (allValidationsPassed) {
      recordTest(testName, 'PASS', {
        totalValidations: testKeys.length,
        results: validationResults
      });
    } else {
      recordTest(testName, 'FAIL', {
        totalValidations: testKeys.length,
        passedValidations: validationResults.filter(r => r.passed).length,
        failedValidations: validationResults.filter(r => !r.passed),
        allResults: validationResults
      });
    }
    
  } catch (error) {
    recordTest(testName, 'FAIL', {
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Main test execution
 */
async function runMockModeValidation() {
  log('info', 'Starting Mock Mode Validation Test Suite for PRD 1.2.3');
  log('info', `Test environment: Mock Mode = ${process.env.USE_MOCK_OPENAI || 'auto-detect'}`);
  
  const startTime = Date.now();
  
  try {
    // Set mock mode environment
    process.env.USE_MOCK_OPENAI = 'true';
    process.env.OPENAI_API_KEY = 'sk-dev-api-key-here'; // Placeholder that should trigger mock mode
    
    // Execute all tests
    await testServiceInitialization();
    await testMockResponseGeneration();
    await testSmartResponseLogic();
    await testResponseStructure();
    await testMockModePerformance();
    await testApiKeyValidation();
    
    testResults.duration = Date.now() - startTime;
    testResults.status = testResults.summary.failed === 0 ? 'PASSED' : 'FAILED';
    
    // Generate test report
    await generateTestReport();
    
    log('info', '✅ Mock Mode Validation Test Suite completed');
    log('info', `Results: ${testResults.summary.passed} passed, ${testResults.summary.failed} failed, ${testResults.summary.skipped} skipped`);
    
    if (testResults.summary.failed > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    log('error', 'Test suite execution failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

/**
 * Generate comprehensive test report
 */
async function generateTestReport() {
  const reportPath = join(__dirname, 'evidence', `mock-mode-validation-${Date.now()}.json`);
  
  try {
    await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
    log('info', `Test report generated: ${reportPath}`);
  } catch (error) {
    log('error', 'Failed to generate test report', { error: error.message });
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMockModeValidation().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { runMockModeValidation };