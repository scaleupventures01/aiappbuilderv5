#!/usr/bin/env node
/**
 * Backend Error Handling Validation Test
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md
 * Validates backend error handler implementation against PRD requirements
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

/**
 * QA Test Results Structure
 */
const testResults = {
  testSuite: 'Backend Error Handling Validation',
  prdReference: 'PRD-1.2.11-basic-error-handling-system.md',
  timestamp: new Date().toISOString(),
  overallStatus: 'PENDING',
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  categories: {
    implementation: { passed: 0, failed: 0, total: 0, tests: [] },
    errorTypes: { passed: 0, failed: 0, total: 0, tests: [] },
    retryLogic: { passed: 0, failed: 0, total: 0, tests: [] },
    logging: { passed: 0, failed: 0, total: 0, tests: [] },
    integration: { passed: 0, failed: 0, total: 0, tests: [] }
  },
  detailedResults: []
};

/**
 * Test utility functions
 */
function addTestResult(category, testName, status, details, requirements = []) {
  const result = {
    test: testName,
    category,
    status,
    details,
    requirements,
    timestamp: new Date().toISOString()
  };
  
  testResults.detailedResults.push(result);
  testResults.categories[category].tests.push(result);
  testResults.categories[category].total++;
  
  if (status === 'PASS') {
    testResults.categories[category].passed++;
    testResults.summary.passed++;
  } else if (status === 'FAIL') {
    testResults.categories[category].failed++;
    testResults.summary.failed++;
  } else if (status === 'WARNING') {
    testResults.summary.warnings++;
  }
  
  testResults.summary.total++;
}

/**
 * Validate file exists and can be imported
 */
async function validateFileExists(filePath, description) {
  try {
    const fullPath = join(projectRoot, filePath);
    await fs.access(fullPath);
    
    // Try to read the file content
    const content = await fs.readFile(fullPath, 'utf8');
    return { exists: true, content, path: fullPath };
  } catch (error) {
    return { exists: false, error: error.message, path: join(projectRoot, filePath) };
  }
}

/**
 * Test 1: Validate Error Handler Implementation Files
 */
async function testImplementationFiles() {
  console.log('🔍 Testing implementation files...');
  
  const requiredFiles = [
    {
      path: 'server/services/trade-analysis-error-handler.js',
      description: 'TradeAnalysisErrorHandler main class',
      requirements: ['REQ-016', 'REQ-017', 'REQ-018', 'REQ-019', 'REQ-020']
    },
    {
      path: 'api/analyze-trade.js',
      description: 'API endpoint with error handling',
      requirements: ['REQ-006', 'REQ-007', 'REQ-008', 'REQ-011', 'REQ-012']
    },
    {
      path: 'server/services/trade-analysis-service.js',
      description: 'Trade analysis service integration',
      requirements: ['REQ-001', 'REQ-002', 'REQ-003', 'REQ-004', 'REQ-005']
    }
  ];
  
  for (const file of requiredFiles) {
    const result = await validateFileExists(file.path, file.description);
    
    if (result.exists) {
      addTestResult('implementation', `File exists: ${file.description}`, 'PASS', 
        `File found at ${result.path}`, file.requirements);
      
      // Validate file content has key components
      if (result.content.includes('class TradeAnalysisErrorHandler') || 
          result.content.includes('export class TradeAnalysisService') ||
          result.content.includes('router.post')) {
        addTestResult('implementation', `File content validation: ${file.description}`, 'PASS',
          'File contains expected class/router definitions', file.requirements);
      } else {
        addTestResult('implementation', `File content validation: ${file.description}`, 'FAIL',
          'File does not contain expected class/router definitions', file.requirements);
      }
    } else {
      addTestResult('implementation', `File exists: ${file.description}`, 'FAIL',
        `File not found: ${result.error}`, file.requirements);
    }
  }
}

/**
 * Test 2: Validate Error Types Configuration
 */
async function testErrorTypesConfiguration() {
  console.log('🔍 Testing error types configuration...');
  
  try {
    // Read the error handler file
    const result = await validateFileExists('server/services/trade-analysis-error-handler.js', 'Error handler');
    
    if (!result.exists) {
      addTestResult('errorTypes', 'Error types configuration', 'FAIL',
        'Cannot validate error types - handler file not found', ['REQ-006', 'REQ-007']);
      return;
    }
    
    // Check for required error types from PRD Section 5.2
    const requiredErrorTypes = [
      'OPENAI_RATE_LIMIT',
      'OPENAI_API_DOWN', 
      'NETWORK_TIMEOUT',
      'FILE_TOO_LARGE',
      'INVALID_FILE_FORMAT',
      'UPLOAD_FAILED',
      'IMAGE_PROCESSING_FAILED',
      'AI_PROCESSING_FAILED',
      'UNKNOWN_ERROR'
    ];
    
    let foundTypes = 0;
    let missingTypes = [];
    
    for (const errorType of requiredErrorTypes) {
      if (result.content.includes(errorType)) {
        foundTypes++;
      } else {
        missingTypes.push(errorType);
      }
    }
    
    if (foundTypes === requiredErrorTypes.length) {
      addTestResult('errorTypes', 'Required error types present', 'PASS',
        `All ${requiredErrorTypes.length} required error types found`, ['REQ-006']);
    } else {
      addTestResult('errorTypes', 'Required error types present', 'FAIL',
        `Missing error types: ${missingTypes.join(', ')}`, ['REQ-006']);
    }
    
    // Check error type configuration structure
    const hasErrorTypeConfig = result.content.includes('ERROR_TYPES') && 
                              result.content.includes('message:') &&
                              result.content.includes('retryable:');
    
    if (hasErrorTypeConfig) {
      addTestResult('errorTypes', 'Error type configuration structure', 'PASS',
        'ERROR_TYPES object with message and retryable properties found', ['REQ-007', 'REQ-008']);
    } else {
      addTestResult('errorTypes', 'Error type configuration structure', 'FAIL',
        'ERROR_TYPES configuration structure not found or incomplete', ['REQ-007', 'REQ-008']);
    }
    
    // Check for user-friendly messages
    const hasUserFriendlyMessages = result.content.includes('"AI service is busy') ||
                                   result.content.includes('"Image file is too large') ||
                                   result.content.includes('"Invalid image format');
    
    if (hasUserFriendlyMessages) {
      addTestResult('errorTypes', 'User-friendly error messages', 'PASS',
        'User-friendly error messages found in configuration', ['REQ-006', 'REQ-007']);
    } else {
      addTestResult('errorTypes', 'User-friendly error messages', 'FAIL',
        'User-friendly error messages not found', ['REQ-006', 'REQ-007']);
    }
    
  } catch (error) {
    addTestResult('errorTypes', 'Error types configuration validation', 'FAIL',
      `Error during validation: ${error.message}`, ['REQ-006', 'REQ-007']);
  }
}

/**
 * Test 3: Validate Retry Logic Implementation
 */
async function testRetryLogicImplementation() {
  console.log('🔍 Testing retry logic implementation...');
  
  try {
    const errorHandlerResult = await validateFileExists('server/services/trade-analysis-error-handler.js', 'Error handler');
    const apiEndpointResult = await validateFileExists('api/analyze-trade.js', 'API endpoint');
    
    if (!errorHandlerResult.exists || !apiEndpointResult.exists) {
      addTestResult('retryLogic', 'Retry logic implementation', 'FAIL',
        'Cannot validate retry logic - required files not found', ['REQ-011', 'REQ-012']);
      return;
    }
    
    // Check for retry methods in error handler
    const hasRetryMethods = errorHandlerResult.content.includes('retryRequest') ||
                           errorHandlerResult.content.includes('handleError') ||
                           errorHandlerResult.content.includes('autoRetry');
    
    if (hasRetryMethods) {
      addTestResult('retryLogic', 'Retry methods in error handler', 'PASS',
        'Retry methods found in TradeAnalysisErrorHandler', ['REQ-011', 'REQ-012']);
    } else {
      addTestResult('retryLogic', 'Retry methods in error handler', 'FAIL',
        'Retry methods not found in error handler', ['REQ-011', 'REQ-012']);
    }
    
    // Check for exponential backoff
    const hasExponentialBackoff = errorHandlerResult.content.includes('Math.pow') &&
                                 errorHandlerResult.content.includes('backoff');
    
    if (hasExponentialBackoff) {
      addTestResult('retryLogic', 'Exponential backoff implementation', 'PASS',
        'Exponential backoff logic found', ['REQ-012']);
    } else {
      addTestResult('retryLogic', 'Exponential backoff implementation', 'WARNING',
        'Exponential backoff implementation unclear', ['REQ-012']);
    }
    
    // Check for max retry limits
    const hasMaxRetries = errorHandlerResult.content.includes('maxRetries') ||
                         apiEndpointResult.content.includes('maxRetries');
    
    if (hasMaxRetries) {
      addTestResult('retryLogic', 'Max retry limits', 'PASS',
        'Max retry limits configuration found', ['REQ-015']);
    } else {
      addTestResult('retryLogic', 'Max retry limits', 'FAIL',
        'Max retry limits not configured', ['REQ-015']);
    }
    
    // Check for retry logic in API endpoint
    const hasApiRetryLogic = apiEndpointResult.content.includes('retry') &&
                            apiEndpointResult.content.includes('while') &&
                            apiEndpointResult.content.includes('currentRetry');
    
    if (hasApiRetryLogic) {
      addTestResult('retryLogic', 'API endpoint retry implementation', 'PASS',
        'Retry logic implemented in API endpoint', ['REQ-011', 'REQ-013']);
    } else {
      addTestResult('retryLogic', 'API endpoint retry implementation', 'FAIL',
        'Retry logic not found in API endpoint', ['REQ-011', 'REQ-013']);
    }
    
  } catch (error) {
    addTestResult('retryLogic', 'Retry logic validation', 'FAIL',
      `Error during validation: ${error.message}`, ['REQ-011', 'REQ-012']);
  }
}

/**
 * Test 4: Validate Logging Implementation
 */
async function testLoggingImplementation() {
  console.log('🔍 Testing logging implementation...');
  
  try {
    const result = await validateFileExists('server/services/trade-analysis-error-handler.js', 'Error handler');
    
    if (!result.exists) {
      addTestResult('logging', 'Error logging implementation', 'FAIL',
        'Cannot validate logging - handler file not found', ['REQ-016', 'REQ-017']);
      return;
    }
    
    // Check for logging methods
    const hasLoggingMethods = result.content.includes('logError') &&
                             result.content.includes('console.error');
    
    if (hasLoggingMethods) {
      addTestResult('logging', 'Error logging methods', 'PASS',
        'Error logging methods found', ['REQ-016']);
    } else {
      addTestResult('logging', 'Error logging methods', 'FAIL',
        'Error logging methods not found', ['REQ-016']);
    }
    
    // Check for request context logging
    const hasContextLogging = result.content.includes('requestId') &&
                             result.content.includes('userId') &&
                             result.content.includes('context');
    
    if (hasContextLogging) {
      addTestResult('logging', 'Request context logging', 'PASS',
        'Request context logging implemented', ['REQ-018']);
    } else {
      addTestResult('logging', 'Request context logging', 'FAIL',
        'Request context logging not implemented', ['REQ-018']);
    }
    
    // Check for retry attempts logging
    const hasRetryLogging = result.content.includes('retryCount') &&
                           result.content.includes('retry');
    
    if (hasRetryLogging) {
      addTestResult('logging', 'Retry attempts logging', 'PASS',
        'Retry attempts logging implemented', ['REQ-019']);
    } else {
      addTestResult('logging', 'Retry attempts logging', 'FAIL',
        'Retry attempts logging not implemented', ['REQ-019']);
    }
    
    // Check for data sanitization
    const hasDataSanitization = result.content.includes('delete') &&
                               (result.content.includes('token') || 
                                result.content.includes('password') ||
                                result.content.includes('apiKey'));
    
    if (hasDataSanitization) {
      addTestResult('logging', 'Data sanitization', 'PASS',
        'Data sanitization implemented in logging', ['REQ-020']);
    } else {
      addTestResult('logging', 'Data sanitization', 'WARNING',
        'Data sanitization not clearly implemented', ['REQ-020']);
    }
    
  } catch (error) {
    addTestResult('logging', 'Logging validation', 'FAIL',
      `Error during validation: ${error.message}`, ['REQ-016', 'REQ-017']);
  }
}

/**
 * Test 5: Validate API Integration
 */
async function testAPIIntegration() {
  console.log('🔍 Testing API integration...');
  
  try {
    const result = await validateFileExists('api/analyze-trade.js', 'API endpoint');
    
    if (!result.exists) {
      addTestResult('integration', 'API endpoint integration', 'FAIL',
        'API endpoint file not found', ['REQ-001', 'REQ-002']);
      return;
    }
    
    // Check for error handler integration
    const hasErrorHandlerIntegration = result.content.includes('tradeAnalysisErrorHandler') &&
                                      result.content.includes('handleError');
    
    if (hasErrorHandlerIntegration) {
      addTestResult('integration', 'Error handler integration', 'PASS',
        'Error handler integrated in API endpoint', ['REQ-001']);
    } else {
      addTestResult('integration', 'Error handler integration', 'FAIL',
        'Error handler not integrated in API endpoint', ['REQ-001']);
    }
    
    // Check for try-catch blocks
    const hasTryCatchBlocks = result.content.includes('try {') &&
                             result.content.includes('catch (error)');
    
    if (hasTryCatchBlocks) {
      addTestResult('integration', 'Try-catch error handling', 'PASS',
        'Try-catch blocks implemented for error handling', ['REQ-001']);
    } else {
      addTestResult('integration', 'Try-catch error handling', 'FAIL',
        'Try-catch blocks not found', ['REQ-001']);
    }
    
    // Check for input validation
    const hasInputValidation = result.content.includes('validateTradeAnalysisRequest') ||
                              result.content.includes('validation');
    
    if (hasInputValidation) {
      addTestResult('integration', 'Input validation', 'PASS',
        'Input validation middleware implemented', ['REQ-002']);
    } else {
      addTestResult('integration', 'Input validation', 'FAIL',
        'Input validation not implemented', ['REQ-002']);
    }
    
    // Check for multer file handling integration
    const hasFileHandling = result.content.includes('multer') &&
                           result.content.includes('upload.single');
    
    if (hasFileHandling) {
      addTestResult('integration', 'File handling integration', 'PASS',
        'File upload handling integrated', ['REQ-002', 'REQ-003']);
    } else {
      addTestResult('integration', 'File handling integration', 'FAIL',
        'File upload handling not integrated', ['REQ-002', 'REQ-003']);
    }
    
    // Check for rate limiting
    const hasRateLimiting = result.content.includes('rateLimit') ||
                           result.content.includes('analysisRateLimit');
    
    if (hasRateLimiting) {
      addTestResult('integration', 'Rate limiting implementation', 'PASS',
        'Rate limiting implemented', ['REQ-001']);
    } else {
      addTestResult('integration', 'Rate limiting implementation', 'WARNING',
        'Rate limiting not clearly implemented', ['REQ-001']);
    }
    
  } catch (error) {
    addTestResult('integration', 'API integration validation', 'FAIL',
      `Error during validation: ${error.message}`, ['REQ-001', 'REQ-002']);
  }
}

/**
 * Generate test summary and save results
 */
async function generateTestSummary() {
  // Calculate overall status
  if (testResults.summary.failed > 0) {
    testResults.overallStatus = 'FAIL';
  } else if (testResults.summary.warnings > 0) {
    testResults.overallStatus = 'PASS_WITH_WARNINGS';
  } else {
    testResults.overallStatus = 'PASS';
  }
  
  // Save detailed results
  const resultsPath = join(__dirname, `backend-validation-results-${Date.now()}.json`);
  await fs.writeFile(resultsPath, JSON.stringify(testResults, null, 2));
  
  // Generate summary report
  console.log('\n📊 BACKEND ERROR HANDLING VALIDATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Overall Status: ${testResults.overallStatus}`);
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Warnings: ${testResults.summary.warnings}`);
  console.log('');
  
  // Category breakdown
  for (const [category, results] of Object.entries(testResults.categories)) {
    const passRate = results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0;
    console.log(`${category.toUpperCase()}: ${results.passed}/${results.total} (${passRate}%)`);
  }
  
  console.log('');
  console.log(`Detailed results saved to: ${resultsPath}`);
  
  // Show critical failures
  const criticalFailures = testResults.detailedResults.filter(r => r.status === 'FAIL');
  if (criticalFailures.length > 0) {
    console.log('\n❌ CRITICAL FAILURES:');
    criticalFailures.forEach(failure => {
      console.log(`  • ${failure.test}: ${failure.details}`);
    });
  }
  
  return testResults;
}

/**
 * Main test execution
 */
async function runBackendValidationTests() {
  console.log('🚀 Starting Backend Error Handling Validation Tests');
  console.log('PRD Reference: PRD-1.2.11-basic-error-handling-system.md');
  console.log('');
  
  try {
    await testImplementationFiles();
    await testErrorTypesConfiguration();
    await testRetryLogicImplementation();
    await testLoggingImplementation();
    await testAPIIntegration();
    
    const results = await generateTestSummary();
    
    return results;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBackendValidationTests()
    .then(results => {
      process.exit(results.overallStatus === 'FAIL' ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runBackendValidationTests, testResults };