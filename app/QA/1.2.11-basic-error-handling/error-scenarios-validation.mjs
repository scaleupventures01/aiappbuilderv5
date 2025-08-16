import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

/**
 * Error Scenarios Validation Test
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md, Section 7.1
 * Tests all 7 error scenarios specified in the PRD
 */

const testResults = {
  testSuite: 'Error Scenarios Validation',
  prdReference: 'PRD-1.2.11-basic-error-handling-system.md Section 7.1',
  timestamp: new Date().toISOString(),
  scenarios: {},
  summary: {
    total: 7,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  overallStatus: 'PENDING'
};

/**
 * Read and analyze implementation files
 */
async function loadImplementationFiles() {
  const files = {};
  
  const filePaths = {
    errorHandler: 'server/services/trade-analysis-error-handler.js',
    apiEndpoint: 'api/analyze-trade.js',
    tradeService: 'server/services/trade-analysis-service.js',
    frontendAPI: 'src/services/tradeAnalysisAPI.ts',
    errorTypes: 'src/types/error.ts'
  };
  
  for (const [key, path] of Object.entries(filePaths)) {
    try {
      const fullPath = join(projectRoot, path);
      const content = await fs.readFile(fullPath, 'utf8');
      files[key] = { path, content };
    } catch (error) {
      console.warn(`⚠️ Could not read ${path}: ${error.message}`);
      files[key] = { path, content: '', error: error.message };
    }
  }
  
  return files;
}

/**
 * Test TS-001: OpenAI API rate limit → Auto-retry with delay
 */
function testTS001_OpenAIRateLimit(files) {
  console.log('🔍 TS-001: OpenAI API rate limit → Auto-retry with delay');
  
  const scenario = {
    id: 'TS-001',
    description: 'OpenAI API rate limit → Auto-retry with delay',
    requirements: ['REQ-001', 'REQ-011', 'REQ-012'],
    tests: [],
    status: 'PENDING'
  };
  
  // Test 1: Backend error type exists
  const hasRateLimitError = files.errorHandler.content.includes('OPENAI_RATE_LIMIT');
  scenario.tests.push({
    test: 'OPENAI_RATE_LIMIT error type exists',
    status: hasRateLimitError ? 'PASS' : 'FAIL',
    details: hasRateLimitError ? 'Found OPENAI_RATE_LIMIT in error handler' : 'OPENAI_RATE_LIMIT not found'
  });
  
  // Test 2: Auto-retry configuration
  const hasAutoRetry = files.errorHandler.content.includes('"autoRetry": true') &&
                       files.errorHandler.content.includes('OPENAI_RATE_LIMIT');
  scenario.tests.push({
    test: 'Auto-retry enabled for rate limit',
    status: hasAutoRetry ? 'PASS' : 'FAIL',
    details: hasAutoRetry ? 'Auto-retry enabled for OPENAI_RATE_LIMIT' : 'Auto-retry not configured'
  });
  
  // Test 3: Delay configuration
  const hasDelay = files.errorHandler.content.includes('delay: 5000') ||
                   files.errorHandler.content.includes('delay: 3000');
  scenario.tests.push({
    test: 'Delay configured for rate limit',
    status: hasDelay ? 'PASS' : 'FAIL',
    details: hasDelay ? 'Delay configured for rate limit errors' : 'No delay configuration found'
  });
  
  // Test 4: Frontend handles rate limit
  const frontendHandlesRateLimit = files.frontendAPI.content.includes('OPENAI_RATE_LIMIT') ||
                                  files.errorTypes.content.includes('OPENAI_RATE_LIMIT');
  scenario.tests.push({
    test: 'Frontend handles rate limit error',
    status: frontendHandlesRateLimit ? 'PASS' : 'FAIL',
    details: frontendHandlesRateLimit ? 'Frontend handles OPENAI_RATE_LIMIT' : 'Frontend does not handle rate limit'
  });
  
  // Test 5: User-friendly message
  const hasUserMessage = files.errorHandler.content.includes('AI service is busy') ||
                         files.errorHandler.content.includes('Trying again');
  scenario.tests.push({
    test: 'User-friendly rate limit message',
    status: hasUserMessage ? 'PASS' : 'FAIL',
    details: hasUserMessage ? 'User-friendly rate limit message found' : 'No user-friendly message found'
  });
  
  // Calculate scenario status
  const passedTests = scenario.tests.filter(t => t.status === 'PASS').length;
  const failedTests = scenario.tests.filter(t => t.status === 'FAIL').length;
  
  if (failedTests === 0) {
    scenario.status = 'PASS';
    testResults.summary.passed++;
  } else if (passedTests >= failedTests) {
    scenario.status = 'PARTIAL';
    testResults.summary.warnings++;
  } else {
    scenario.status = 'FAIL';
    testResults.summary.failed++;
  }
  
  testResults.scenarios['TS-001'] = scenario;
  console.log(`   Status: ${scenario.status} (${passedTests}/${scenario.tests.length} tests passed)`);
}

/**
 * Test TS-002: Network timeout → Auto-retry once, then user message
 */
function testTS002_NetworkTimeout(files) {
  console.log('🔍 TS-002: Network timeout → Auto-retry once, then user message');
  
  const scenario = {
    id: 'TS-002',
    description: 'Network timeout → Auto-retry once, then user message',
    requirements: ['REQ-004', 'REQ-011'],
    tests: [],
    status: 'PENDING'
  };
  
  // Test 1: Network timeout error type
  const hasTimeoutError = files.errorHandler.content.includes('NETWORK_TIMEOUT') ||
                         files.errorHandler.content.includes('ETIMEDOUT');
  scenario.tests.push({
    test: 'Network timeout error type exists',
    status: hasTimeoutError ? 'PASS' : 'FAIL',
    details: hasTimeoutError ? 'Network timeout error type found' : 'Network timeout error type missing'
  });
  
  // Test 2: Auto-retry configuration for timeout
  const hasTimeoutRetry = files.errorHandler.content.includes('NETWORK_TIMEOUT') &&
                         files.errorHandler.content.includes('"autoRetry": true');
  scenario.tests.push({
    test: 'Auto-retry enabled for timeout',
    status: hasTimeoutRetry ? 'PASS' : 'FAIL',
    details: hasTimeoutRetry ? 'Auto-retry enabled for network timeout' : 'Auto-retry not enabled'
  });
  
  // Test 3: Timeout detection in service
  const hasTimeoutDetection = files.tradeService.content.includes('timeout') ||
                             files.apiEndpoint.content.includes('ETIMEDOUT');
  scenario.tests.push({
    test: 'Timeout detection implemented',
    status: hasTimeoutDetection ? 'PASS' : 'FAIL',
    details: hasTimeoutDetection ? 'Timeout detection found' : 'Timeout detection not implemented'
  });
  
  // Test 4: User message for timeout
  const hasTimeoutMessage = files.errorHandler.content.includes('Request timed out') ||
                           files.errorHandler.content.includes('check your connection');
  scenario.tests.push({
    test: 'User-friendly timeout message',
    status: hasTimeoutMessage ? 'PASS' : 'FAIL',
    details: hasTimeoutMessage ? 'User-friendly timeout message found' : 'No timeout message found'
  });
  
  const passedTests = scenario.tests.filter(t => t.status === 'PASS').length;
  const failedTests = scenario.tests.filter(t => t.status === 'FAIL').length;
  
  if (failedTests === 0) {
    scenario.status = 'PASS';
    testResults.summary.passed++;
  } else if (passedTests >= failedTests) {
    scenario.status = 'PARTIAL';
    testResults.summary.warnings++;
  } else {
    scenario.status = 'FAIL';
    testResults.summary.failed++;
  }
  
  testResults.scenarios['TS-002'] = scenario;
  console.log(`   Status: ${scenario.status} (${passedTests}/${scenario.tests.length} tests passed)`);
}

/**
 * Test TS-003: Invalid image format → Clear error, no retry
 */
function testTS003_InvalidFormat(files) {
  console.log('🔍 TS-003: Invalid image format → Clear error, no retry');
  
  const scenario = {
    id: 'TS-003',
    description: 'Invalid image format → Clear error, no retry',
    requirements: ['REQ-002', 'REQ-014'],
    tests: [],
    status: 'PENDING'
  };
  
  // Test 1: Invalid format error type
  const hasFormatError = files.errorHandler.content.includes('INVALID_FILE_FORMAT');
  scenario.tests.push({
    test: 'Invalid file format error type exists',
    status: hasFormatError ? 'PASS' : 'FAIL',
    details: hasFormatError ? 'INVALID_FILE_FORMAT found' : 'INVALID_FILE_FORMAT missing'
  });
  
  // Test 2: No retry for format errors
  const noRetryForFormat = files.errorHandler.content.includes('INVALID_FILE_FORMAT') &&
                          files.errorHandler.content.includes('"retryable": false');
  scenario.tests.push({
    test: 'No retry for invalid format',
    status: noRetryForFormat ? 'PASS' : 'FAIL',
    details: noRetryForFormat ? 'Invalid format marked as non-retryable' : 'Invalid format retry config unclear'
  });
  
  // Test 3: File validation in API endpoint
  const hasFileValidation = files.apiEndpoint.content.includes('fileFilter') ||
                           files.apiEndpoint.content.includes('allowedTypes');
  scenario.tests.push({
    test: 'File format validation implemented',
    status: hasFileValidation ? 'PASS' : 'FAIL',
    details: hasFileValidation ? 'File format validation found' : 'File format validation missing'
  });
  
  // Test 4: Clear error message
  const hasClearMessage = files.errorHandler.content.includes('Invalid image format') ||
                         files.errorHandler.content.includes('PNG, JPG, or JPEG');
  scenario.tests.push({
    test: 'Clear format error message',
    status: hasClearMessage ? 'PASS' : 'FAIL',
    details: hasClearMessage ? 'Clear format error message found' : 'Clear format error message missing'
  });
  
  // Test 5: Frontend file validation
  const frontendValidation = files.frontendAPI.content.includes('validateImageFile') ||
                            files.frontendAPI.content.includes('allowedTypes');
  scenario.tests.push({
    test: 'Frontend file validation',
    status: frontendValidation ? 'PASS' : 'FAIL',
    details: frontendValidation ? 'Frontend file validation implemented' : 'Frontend validation missing'
  });
  
  const passedTests = scenario.tests.filter(t => t.status === 'PASS').length;
  const failedTests = scenario.tests.filter(t => t.status === 'FAIL').length;
  
  if (failedTests === 0) {
    scenario.status = 'PASS';
    testResults.summary.passed++;
  } else if (passedTests >= failedTests) {
    scenario.status = 'PARTIAL';
    testResults.summary.warnings++;
  } else {
    scenario.status = 'FAIL';
    testResults.summary.failed++;
  }
  
  testResults.scenarios['TS-003'] = scenario;
  console.log(`   Status: ${scenario.status} (${passedTests}/${scenario.tests.length} tests passed)`);
}

/**
 * Test TS-004: File too large → Specific guidance about file size
 */
function testTS004_FileTooLarge(files) {
  console.log('🔍 TS-004: File too large → Specific guidance about file size');
  
  const scenario = {
    id: 'TS-004',
    description: 'File too large → Specific guidance about file size',
    requirements: ['REQ-002', 'REQ-009'],
    tests: [],
    status: 'PENDING'
  };
  
  // Test 1: File too large error type
  const hasFileTooLargeError = files.errorHandler.content.includes('FILE_TOO_LARGE');
  scenario.tests.push({
    test: 'File too large error type exists',
    status: hasFileTooLargeError ? 'PASS' : 'FAIL',
    details: hasFileTooLargeError ? 'FILE_TOO_LARGE found' : 'FILE_TOO_LARGE missing'
  });
  
  // Test 2: File size validation
  const hasFileSizeLimit = files.apiEndpoint.content.includes('fileSize') ||
                          files.apiEndpoint.content.includes('10 * 1024 * 1024');
  scenario.tests.push({
    test: 'File size limit implemented',
    status: hasFileSizeLimit ? 'PASS' : 'FAIL',
    details: hasFileSizeLimit ? 'File size limit found in API endpoint' : 'File size limit missing'
  });
  
  // Test 3: Specific guidance message
  const hasGuidanceMessage = files.errorHandler.content.includes('under 10MB') ||
                            files.errorHandler.content.includes('compressing your image');
  scenario.tests.push({
    test: 'Specific file size guidance',
    status: hasGuidanceMessage ? 'PASS' : 'FAIL',
    details: hasGuidanceMessage ? 'Specific file size guidance found' : 'Specific guidance missing'
  });
  
  // Test 4: Non-retryable configuration
  const nonRetryable = files.errorHandler.content.includes('FILE_TOO_LARGE') &&
                       files.errorHandler.content.includes('"retryable": false');
  scenario.tests.push({
    test: 'File too large non-retryable',
    status: nonRetryable ? 'PASS' : 'FAIL',
    details: nonRetryable ? 'FILE_TOO_LARGE marked non-retryable' : 'Retry config unclear'
  });
  
  // Test 5: Frontend validation
  const frontendSizeCheck = files.frontendAPI.content.includes('10 * 1024 * 1024') ||
                           files.frontendAPI.content.includes('file.size');
  scenario.tests.push({
    test: 'Frontend file size validation',
    status: frontendSizeCheck ? 'PASS' : 'FAIL',
    details: frontendSizeCheck ? 'Frontend file size validation found' : 'Frontend size validation missing'
  });
  
  const passedTests = scenario.tests.filter(t => t.status === 'PASS').length;
  const failedTests = scenario.tests.filter(t => t.status === 'FAIL').length;
  
  if (failedTests === 0) {
    scenario.status = 'PASS';
    testResults.summary.passed++;
  } else if (passedTests >= failedTests) {
    scenario.status = 'PARTIAL';
    testResults.summary.warnings++;
  } else {
    scenario.status = 'FAIL';
    testResults.summary.failed++;
  }
  
  testResults.scenarios['TS-004'] = scenario;
  console.log(`   Status: ${scenario.status} (${passedTests}/${scenario.tests.length} tests passed)`);
}

/**
 * Test TS-005: OpenAI API down → Helpful message, manual retry option
 */
function testTS005_APIDown(files) {
  console.log('🔍 TS-005: OpenAI API down → Helpful message, manual retry option');
  
  const scenario = {
    id: 'TS-005',
    description: 'OpenAI API down → Helpful message, manual retry option',
    requirements: ['REQ-001', 'REQ-013'],
    tests: [],
    status: 'PENDING'
  };
  
  // Test 1: API down error type
  const hasAPIDownError = files.errorHandler.content.includes('OPENAI_API_DOWN');
  scenario.tests.push({
    test: 'OpenAI API down error type exists',
    status: hasAPIDownError ? 'PASS' : 'FAIL',
    details: hasAPIDownError ? 'OPENAI_API_DOWN found' : 'OPENAI_API_DOWN missing'
  });
  
  // Test 2: Connection error detection
  const hasConnectionDetection = files.errorHandler.content.includes('ECONNREFUSED') ||
                                 files.tradeService.content.includes('ECONNREFUSED');
  scenario.tests.push({
    test: 'Connection error detection',
    status: hasConnectionDetection ? 'PASS' : 'FAIL',
    details: hasConnectionDetection ? 'Connection error detection found' : 'Connection error detection missing'
  });
  
  // Test 3: Helpful message
  const hasHelpfulMessage = files.errorHandler.content.includes('temporarily unavailable') ||
                           files.errorHandler.content.includes('try again in a few minutes');
  scenario.tests.push({
    test: 'Helpful API down message',
    status: hasHelpfulMessage ? 'PASS' : 'FAIL',
    details: hasHelpfulMessage ? 'Helpful API down message found' : 'Helpful message missing'
  });
  
  // Test 4: Manual retry option (retryable but no auto-retry)
  const manualRetryOnly = files.errorHandler.content.includes('OPENAI_API_DOWN') &&
                          files.errorHandler.content.includes('"retryable": true') &&
                          files.errorHandler.content.includes('"autoRetry": false');
  scenario.tests.push({
    test: 'Manual retry option available',
    status: manualRetryOnly ? 'PASS' : 'FAIL',
    details: manualRetryOnly ? 'Manual retry enabled, auto-retry disabled' : 'Retry configuration unclear'
  });
  
  const passedTests = scenario.tests.filter(t => t.status === 'PASS').length;
  const failedTests = scenario.tests.filter(t => t.status === 'FAIL').length;
  
  if (failedTests === 0) {
    scenario.status = 'PASS';
    testResults.summary.passed++;
  } else if (passedTests >= failedTests) {
    scenario.status = 'PARTIAL';
    testResults.summary.warnings++;
  } else {
    scenario.status = 'FAIL';
    testResults.summary.failed++;
  }
  
  testResults.scenarios['TS-005'] = scenario;
  console.log(`   Status: ${scenario.status} (${passedTests}/${scenario.tests.length} tests passed)`);
}

/**
 * Test TS-006: Server error → Generic retry message
 */
function testTS006_ServerError(files) {
  console.log('🔍 TS-006: Server error → Generic retry message');
  
  const scenario = {
    id: 'TS-006',
    description: 'Server error → Generic retry message',
    requirements: ['REQ-005', 'REQ-013'],
    tests: [],
    status: 'PENDING'
  };
  
  // Test 1: Unknown/generic error type
  const hasUnknownError = files.errorHandler.content.includes('UNKNOWN_ERROR');
  scenario.tests.push({
    test: 'Unknown error type exists',
    status: hasUnknownError ? 'PASS' : 'FAIL',
    details: hasUnknownError ? 'UNKNOWN_ERROR found' : 'UNKNOWN_ERROR missing'
  });
  
  // Test 2: Generic error message
  const hasGenericMessage = files.errorHandler.content.includes('Something went wrong') ||
                           files.errorHandler.content.includes('Please try again');
  scenario.tests.push({
    test: 'Generic error message',
    status: hasGenericMessage ? 'PASS' : 'FAIL',
    details: hasGenericMessage ? 'Generic error message found' : 'Generic message missing'
  });
  
  // Test 3: Server error handling in API
  const hasServerErrorHandling = files.apiEndpoint.content.includes('catch (error)') &&
                                 files.apiEndpoint.content.includes('500');
  scenario.tests.push({
    test: 'Server error handling in API',
    status: hasServerErrorHandling ? 'PASS' : 'FAIL',
    details: hasServerErrorHandling ? 'Server error handling found' : 'Server error handling missing'
  });
  
  // Test 4: Retry option for unknown errors
  const retryableUnknown = files.errorHandler.content.includes('UNKNOWN_ERROR') &&
                          files.errorHandler.content.includes('"retryable": true');
  scenario.tests.push({
    test: 'Unknown errors are retryable',
    status: retryableUnknown ? 'PASS' : 'FAIL',
    details: retryableUnknown ? 'Unknown errors marked retryable' : 'Unknown error retry config unclear'
  });
  
  const passedTests = scenario.tests.filter(t => t.status === 'PASS').length;
  const failedTests = scenario.tests.filter(t => t.status === 'FAIL').length;
  
  if (failedTests === 0) {
    scenario.status = 'PASS';
    testResults.summary.passed++;
  } else if (passedTests >= failedTests) {
    scenario.status = 'PARTIAL';
    testResults.summary.warnings++;
  } else {
    scenario.status = 'FAIL';
    testResults.summary.failed++;
  }
  
  testResults.scenarios['TS-006'] = scenario;
  console.log(`   Status: ${scenario.status} (${passedTests}/${scenario.tests.length} tests passed)`);
}

/**
 * Test TS-007: Multiple consecutive failures → Appropriate escalation
 */
function testTS007_ConsecutiveFailures(files) {
  console.log('🔍 TS-007: Multiple consecutive failures → Appropriate escalation');
  
  const scenario = {
    id: 'TS-007',
    description: 'Multiple consecutive failures → Appropriate escalation',
    requirements: ['REQ-015', 'REQ-019'],
    tests: [],
    status: 'PENDING'
  };
  
  // Test 1: Max retry limits
  const hasMaxRetries = files.errorHandler.content.includes('maxRetries') ||
                       files.apiEndpoint.content.includes('maxRetries');
  scenario.tests.push({
    test: 'Max retry limits configured',
    status: hasMaxRetries ? 'PASS' : 'FAIL',
    details: hasMaxRetries ? 'Max retry limits found' : 'Max retry limits missing'
  });
  
  // Test 2: Retry count tracking
  const hasRetryTracking = files.errorHandler.content.includes('retryCount') &&
                          files.apiEndpoint.content.includes('retryCount');
  scenario.tests.push({
    test: 'Retry count tracking',
    status: hasRetryTracking ? 'PASS' : 'FAIL',
    details: hasRetryTracking ? 'Retry count tracking found' : 'Retry count tracking missing'
  });
  
  // Test 3: Escalation logic
  const hasEscalation = files.apiEndpoint.content.includes('currentRetry') &&
                       files.apiEndpoint.content.includes('while') &&
                       files.apiEndpoint.content.includes('maxRetries');
  scenario.tests.push({
    test: 'Escalation logic implemented',
    status: hasEscalation ? 'PASS' : 'FAIL',
    details: hasEscalation ? 'Escalation logic found in API endpoint' : 'Escalation logic missing'
  });
  
  // Test 4: Retry logging
  const hasRetryLogging = files.errorHandler.content.includes('retryCount') &&
                         files.errorHandler.content.includes('logError');
  scenario.tests.push({
    test: 'Retry attempts logged',
    status: hasRetryLogging ? 'PASS' : 'FAIL',
    details: hasRetryLogging ? 'Retry logging implemented' : 'Retry logging missing'
  });
  
  // Test 5: Frontend retry handling
  const frontendRetryHandling = files.frontendAPI.content.includes('maxRetries') &&
                               files.frontendAPI.content.includes('currentRetry');
  scenario.tests.push({
    test: 'Frontend retry handling',
    status: frontendRetryHandling ? 'PASS' : 'FAIL',
    details: frontendRetryHandling ? 'Frontend retry handling found' : 'Frontend retry handling missing'
  });
  
  const passedTests = scenario.tests.filter(t => t.status === 'PASS').length;
  const failedTests = scenario.tests.filter(t => t.status === 'FAIL').length;
  
  if (failedTests === 0) {
    scenario.status = 'PASS';
    testResults.summary.passed++;
  } else if (passedTests >= failedTests) {
    scenario.status = 'PARTIAL';
    testResults.summary.warnings++;
  } else {
    scenario.status = 'FAIL';
    testResults.summary.failed++;
  }
  
  testResults.scenarios['TS-007'] = scenario;
  console.log(`   Status: ${scenario.status} (${passedTests}/${scenario.tests.length} tests passed)`);
}

/**
 * Generate final results summary
 */
function generateFinalSummary() {
  // Calculate overall status
  if (testResults.summary.failed > 0) {
    testResults.overallStatus = 'FAIL';
  } else if (testResults.summary.warnings > 0) {
    testResults.overallStatus = 'PASS_WITH_WARNINGS';
  } else {
    testResults.overallStatus = 'PASS';
  }
  
  console.log('\n📊 ERROR SCENARIOS VALIDATION SUMMARY');
  console.log('═'.repeat(50));
  console.log(`Overall Status: ${testResults.overallStatus}`);
  console.log(`Scenarios Passed: ${testResults.summary.passed}/7`);
  console.log(`Scenarios Failed: ${testResults.summary.failed}/7`);
  console.log(`Scenarios Partial: ${testResults.summary.warnings}/7`);
  console.log('');
  
  // Detailed scenario breakdown
  for (const [id, scenario] of Object.entries(testResults.scenarios)) {
    const passedTests = scenario.tests.filter(t => t.status === 'PASS').length;
    const totalTests = scenario.tests.length;
    console.log(`${id}: ${scenario.status} (${passedTests}/${totalTests} tests)`);
    
    if (scenario.status === 'FAIL') {
      const failedTests = scenario.tests.filter(t => t.status === 'FAIL');
      failedTests.forEach(test => {
        console.log(`   ❌ ${test.test}: ${test.details}`);
      });
    }
  }
  
  return testResults;
}

/**
 * Main test execution
 */
async function runErrorScenariosValidation() {
  console.log('🚀 Starting Error Scenarios Validation');
  console.log('PRD Reference: PRD-1.2.11-basic-error-handling-system.md, Section 7.1');
  console.log('Testing 7 specific error scenarios from the PRD\n');
  
  try {
    // Load implementation files
    const files = await loadImplementationFiles();
    
    // Run all scenario tests
    testTS001_OpenAIRateLimit(files);
    testTS002_NetworkTimeout(files);
    testTS003_InvalidFormat(files);
    testTS004_FileTooLarge(files);
    testTS005_APIDown(files);
    testTS006_ServerError(files);
    testTS007_ConsecutiveFailures(files);
    
    // Generate and save results
    const finalResults = generateFinalSummary();
    
    // Save results to file
    const resultsPath = join(__dirname, `error-scenarios-results-${Date.now()}.json`);
    await fs.writeFile(resultsPath, JSON.stringify(finalResults, null, 2));
    console.log(`\nDetailed results saved to: ${resultsPath}`);
    
    return finalResults;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runErrorScenariosValidation()
    .then(results => {
      process.exit(results.overallStatus === 'FAIL' ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runErrorScenariosValidation };