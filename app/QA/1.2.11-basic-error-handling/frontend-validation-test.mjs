#!/usr/bin/env node
/**
 * Frontend Error Handling Validation Test
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md
 * Validates frontend error components and services against PRD requirements
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
  testSuite: 'Frontend Error Handling Validation',
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
    components: { passed: 0, failed: 0, total: 0, tests: [] },
    services: { passed: 0, failed: 0, total: 0, tests: [] },
    types: { passed: 0, failed: 0, total: 0, tests: [] },
    userExperience: { passed: 0, failed: 0, total: 0, tests: [] },
    accessibility: { passed: 0, failed: 0, total: 0, tests: [] }
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
 * Validate file exists and read content
 */
async function validateFileExists(filePath, description) {
  try {
    const fullPath = join(projectRoot, filePath);
    await fs.access(fullPath);
    const content = await fs.readFile(fullPath, 'utf8');
    return { exists: true, content, path: fullPath };
  } catch (error) {
    return { exists: false, error: error.message, path: join(projectRoot, filePath) };
  }
}

/**
 * Test 1: Validate Frontend Component Files
 */
async function testFrontendComponents() {
  console.log('🔍 Testing frontend component files...');
  
  const requiredComponents = [
    {
      path: 'src/components/ui/ErrorMessage.tsx',
      description: 'Generic error message component',
      requirements: ['REQ-006', 'REQ-007', 'REQ-008', 'REQ-009']
    },
    {
      path: 'src/components/chat/TradeAnalysisError.tsx',
      description: 'Trade analysis specific error component',
      requirements: ['REQ-006', 'REQ-007', 'REQ-008', 'REQ-009']
    },
    {
      path: 'src/components/chat/TradeAnalysisErrorBoundary.tsx',
      description: 'Error boundary for trade analysis',
      requirements: ['REQ-010']
    },
    {
      path: 'src/components/ui/ToastNotification.tsx',
      description: 'Toast notification for error feedback',
      requirements: ['REQ-006', 'REQ-007']
    }
  ];
  
  for (const component of requiredComponents) {
    const result = await validateFileExists(component.path, component.description);
    
    if (result.exists) {
      addTestResult('components', `Component exists: ${component.description}`, 'PASS', 
        `Component found at ${result.path}`, component.requirements);
      
      // Validate React component structure
      const isReactComponent = result.content.includes('import React') &&
                              (result.content.includes('export const') || result.content.includes('export default'));
      
      if (isReactComponent) {
        addTestResult('components', `Component structure: ${component.description}`, 'PASS',
          'Valid React component structure found', component.requirements);
      } else {
        addTestResult('components', `Component structure: ${component.description}`, 'FAIL',
          'Invalid React component structure', component.requirements);
      }
    } else {
      addTestResult('components', `Component exists: ${component.description}`, 'FAIL',
        `Component not found: ${result.error}`, component.requirements);
    }
  }
}

/**
 * Test 2: Validate Error Service Implementation
 */
async function testErrorServices() {
  console.log('🔍 Testing error service implementation...');
  
  const serviceFiles = [
    {
      path: 'src/services/tradeAnalysisAPI.ts',
      description: 'Trade analysis API service',
      requirements: ['REQ-011', 'REQ-012', 'REQ-013']
    },
    {
      path: 'src/types/error.ts',
      description: 'Error type definitions',
      requirements: ['REQ-006', 'REQ-007']
    }
  ];
  
  for (const service of serviceFiles) {
    const result = await validateFileExists(service.path, service.description);
    
    if (result.exists) {
      addTestResult('services', `Service exists: ${service.description}`, 'PASS',
        `Service found at ${result.path}`, service.requirements);
      
      // Validate service implementation
      if (service.path.includes('tradeAnalysisAPI')) {
        // Check for error handling methods
        const hasErrorHandling = result.content.includes('createAnalysisError') &&
                                result.content.includes('classifyHttpError') &&
                                result.content.includes('validateImageFile');
        
        if (hasErrorHandling) {
          addTestResult('services', 'API service error handling methods', 'PASS',
            'Error handling methods found in API service', service.requirements);
        } else {
          addTestResult('services', 'API service error handling methods', 'FAIL',
            'Error handling methods not found in API service', service.requirements);
        }
        
        // Check for retry logic
        const hasRetryLogic = result.content.includes('autoRetry') &&
                             result.content.includes('maxRetries') &&
                             result.content.includes('while');
        
        if (hasRetryLogic) {
          addTestResult('services', 'API service retry logic', 'PASS',
            'Retry logic implemented in API service', ['REQ-011', 'REQ-012']);
        } else {
          addTestResult('services', 'API service retry logic', 'FAIL',
            'Retry logic not found in API service', ['REQ-011', 'REQ-012']);
        }
        
        // Check for progress callbacks
        const hasProgressCallbacks = result.content.includes('onProgress') &&
                                    result.content.includes('updateProgress');
        
        if (hasProgressCallbacks) {
          addTestResult('services', 'Progress feedback implementation', 'PASS',
            'Progress callbacks implemented for user feedback', ['REQ-010']);
        } else {
          addTestResult('services', 'Progress feedback implementation', 'WARNING',
            'Progress callbacks not clearly implemented', ['REQ-010']);
        }
      }
      
      if (service.path.includes('error.ts')) {
        // Check for error type definitions
        const hasErrorTypes = result.content.includes('ErrorType') &&
                             result.content.includes('ErrorResponse') &&
                             result.content.includes('AnalysisError');
        
        if (hasErrorTypes) {
          addTestResult('services', 'Error type definitions', 'PASS',
            'Complete error type definitions found', service.requirements);
        } else {
          addTestResult('services', 'Error type definitions', 'FAIL',
            'Error type definitions incomplete or missing', service.requirements);
        }
      }
      
    } else {
      addTestResult('services', `Service exists: ${service.description}`, 'FAIL',
        `Service not found: ${result.error}`, service.requirements);
    }
  }
}

/**
 * Test 3: Validate Error Type Configuration
 */
async function testErrorTypeDefinitions() {
  console.log('🔍 Testing error type definitions...');
  
  const result = await validateFileExists('src/types/error.ts', 'Error types');
  
  if (!result.exists) {
    addTestResult('types', 'Error type definitions', 'FAIL',
      'Error types file not found', ['REQ-006', 'REQ-007']);
    return;
  }
  
  // Check for required error types matching backend
  const requiredErrorTypes = [
    'OPENAI_RATE_LIMIT',
    'OPENAI_API_DOWN',
    'NETWORK_TIMEOUT',
    'FILE_TOO_LARGE',
    'INVALID_FILE_FORMAT',
    'UPLOAD_FAILED',
    'IMAGE_PROCESSING_FAILED',
    'AI_PROCESSING_FAILED',
    'UNKNOWN_ERROR',
    'VALIDATION_ERROR'
  ];
  
  let foundTypes = 0;
  let missingTypes = [];
  
  for (const errorType of requiredErrorTypes) {
    if (result.content.includes(`'${errorType}'`) || result.content.includes(`"${errorType}"`)) {
      foundTypes++;
    } else {
      missingTypes.push(errorType);
    }
  }
  
  if (foundTypes === requiredErrorTypes.length) {
    addTestResult('types', 'Required error types present', 'PASS',
      `All ${requiredErrorTypes.length} required error types found`, ['REQ-006']);
  } else {
    addTestResult('types', 'Required error types present', 'FAIL',
      `Missing error types: ${missingTypes.join(', ')}`, ['REQ-006']);
  }
  
  // Check for error configuration interfaces
  const hasErrorInterfaces = result.content.includes('ErrorResponse') &&
                            result.content.includes('ErrorUIState') &&
                            result.content.includes('AnalysisError');
  
  if (hasErrorInterfaces) {
    addTestResult('types', 'Error interface definitions', 'PASS',
      'Complete error interface definitions found', ['REQ-007']);
  } else {
    addTestResult('types', 'Error interface definitions', 'FAIL',
      'Error interface definitions incomplete', ['REQ-007']);
  }
  
  // Check for retry configuration types
  const hasRetryTypes = result.content.includes('RetryConfig') ||
                       result.content.includes('retryable') ||
                       result.content.includes('maxRetries');
  
  if (hasRetryTypes) {
    addTestResult('types', 'Retry configuration types', 'PASS',
      'Retry configuration types found', ['REQ-008', 'REQ-013']);
  } else {
    addTestResult('types', 'Retry configuration types', 'FAIL',
      'Retry configuration types not found', ['REQ-008', 'REQ-013']);
  }
}

/**
 * Test 4: Validate User Experience Implementation
 */
async function testUserExperienceFeatures() {
  console.log('🔍 Testing user experience features...');
  
  // Test ErrorMessage component UX features
  const errorMessageResult = await validateFileExists('src/components/ui/ErrorMessage.tsx', 'ErrorMessage component');
  
  if (errorMessageResult.exists) {
    // Check for retry button implementation
    const hasRetryButton = errorMessageResult.content.includes('Try Again') &&
                          errorMessageResult.content.includes('onRetry');
    
    if (hasRetryButton) {
      addTestResult('userExperience', 'Retry button functionality', 'PASS',
        'Retry button implemented in ErrorMessage component', ['REQ-008', 'REQ-013']);
    } else {
      addTestResult('userExperience', 'Retry button functionality', 'FAIL',
        'Retry button not found in ErrorMessage component', ['REQ-008', 'REQ-013']);
    }
    
    // Check for loading states
    const hasLoadingStates = errorMessageResult.content.includes('isRetrying') &&
                            errorMessageResult.content.includes('animate-spin');
    
    if (hasLoadingStates) {
      addTestResult('userExperience', 'Loading states implementation', 'PASS',
        'Loading states implemented for retry actions', ['REQ-010']);
    } else {
      addTestResult('userExperience', 'Loading states implementation', 'FAIL',
        'Loading states not implemented', ['REQ-010']);
    }
    
    // Check for error guidance display
    const hasErrorGuidance = errorMessageResult.content.includes('guidance') &&
                            errorMessageResult.content.includes('Info');
    
    if (hasErrorGuidance) {
      addTestResult('userExperience', 'Error guidance display', 'PASS',
        'Error guidance display implemented', ['REQ-009']);
    } else {
      addTestResult('userExperience', 'Error guidance display', 'FAIL',
        'Error guidance display not implemented', ['REQ-009']);
    }
    
    // Check for countdown timers
    const hasCountdownTimer = errorMessageResult.content.includes('CountdownTimer') ||
                             errorMessageResult.content.includes('timeLeft');
    
    if (hasCountdownTimer) {
      addTestResult('userExperience', 'Auto-retry countdown', 'PASS',
        'Auto-retry countdown timer implemented', ['REQ-012']);
    } else {
      addTestResult('userExperience', 'Auto-retry countdown', 'WARNING',
        'Auto-retry countdown not clearly implemented', ['REQ-012']);
    }
  } else {
    addTestResult('userExperience', 'User experience validation', 'FAIL',
      'ErrorMessage component not found for UX validation', ['REQ-008', 'REQ-009']);
  }
  
  // Test TradeAnalysisError component specific features
  const tradeErrorResult = await validateFileExists('src/components/chat/TradeAnalysisError.tsx', 'TradeAnalysisError component');
  
  if (tradeErrorResult.exists) {
    // Check for error type specific configurations
    const hasErrorTypeConfig = tradeErrorResult.content.includes('ERROR_TYPE_CONFIG') &&
                              tradeErrorResult.content.includes('icon') &&
                              tradeErrorResult.content.includes('helpText');
    
    if (hasErrorTypeConfig) {
      addTestResult('userExperience', 'Error type specific UI configuration', 'PASS',
        'Error type specific UI configurations found', ['REQ-007']);
    } else {
      addTestResult('userExperience', 'Error type specific UI configuration', 'FAIL',
        'Error type specific UI configurations not found', ['REQ-007']);
    }
    
    // Check for suggestions system
    const hasSuggestions = tradeErrorResult.content.includes('ErrorSuggestions') ||
                          tradeErrorResult.content.includes('suggestions');
    
    if (hasSuggestions) {
      addTestResult('userExperience', 'Error suggestions system', 'PASS',
        'Error suggestions system implemented', ['REQ-009']);
    } else {
      addTestResult('userExperience', 'Error suggestions system', 'WARNING',
        'Error suggestions system not clearly implemented', ['REQ-009']);
    }
  }
}

/**
 * Test 5: Validate Accessibility Features
 */
async function testAccessibilityFeatures() {
  console.log('🔍 Testing accessibility features...');
  
  const componentFiles = [
    'src/components/ui/ErrorMessage.tsx',
    'src/components/chat/TradeAnalysisError.tsx',
    'src/components/ui/ToastNotification.tsx'
  ];
  
  for (const componentPath of componentFiles) {
    const result = await validateFileExists(componentPath, `Component: ${componentPath}`);
    
    if (result.exists) {
      // Check for ARIA attributes
      const hasAriaAttributes = result.content.includes('role="alert"') ||
                               result.content.includes('aria-live') ||
                               result.content.includes('aria-label');
      
      if (hasAriaAttributes) {
        addTestResult('accessibility', `ARIA attributes in ${componentPath.split('/').pop()}`, 'PASS',
          'ARIA attributes found for accessibility', ['REQ-006']);
      } else {
        addTestResult('accessibility', `ARIA attributes in ${componentPath.split('/').pop()}`, 'FAIL',
          'ARIA attributes not found', ['REQ-006']);
      }
      
      // Check for screen reader support
      const hasScreenReaderSupport = result.content.includes('ScreenReader') ||
                                    result.content.includes('announce');
      
      if (hasScreenReaderSupport) {
        addTestResult('accessibility', `Screen reader support in ${componentPath.split('/').pop()}`, 'PASS',
          'Screen reader announcements implemented', ['REQ-006']);
      } else {
        addTestResult('accessibility', `Screen reader support in ${componentPath.split('/').pop()}`, 'WARNING',
          'Screen reader announcements not clearly implemented', ['REQ-006']);
      }
      
      // Check for keyboard navigation
      const hasKeyboardNavigation = result.content.includes('onKeyDown') ||
                                   result.content.includes('tabIndex') ||
                                   result.content.includes('focus');
      
      if (hasKeyboardNavigation) {
        addTestResult('accessibility', `Keyboard navigation in ${componentPath.split('/').pop()}`, 'PASS',
          'Keyboard navigation support found', ['REQ-006']);
      } else {
        addTestResult('accessibility', `Keyboard navigation in ${componentPath.split('/').pop()}`, 'WARNING',
          'Keyboard navigation not clearly implemented', ['REQ-006']);
      }
    }
  }
  
  // Check if accessibility utils exist
  const accessibilityResult = await validateFileExists('src/utils/accessibility.ts', 'Accessibility utilities');
  
  if (accessibilityResult.exists) {
    addTestResult('accessibility', 'Accessibility utilities', 'PASS',
      'Accessibility utilities file found', ['REQ-006']);
  } else {
    addTestResult('accessibility', 'Accessibility utilities', 'WARNING',
      'Accessibility utilities file not found', ['REQ-006']);
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
  const resultsPath = join(__dirname, `frontend-validation-results-${Date.now()}.json`);
  await fs.writeFile(resultsPath, JSON.stringify(testResults, null, 2));
  
  // Generate summary report
  console.log('\n📊 FRONTEND ERROR HANDLING VALIDATION SUMMARY');
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
async function runFrontendValidationTests() {
  console.log('🚀 Starting Frontend Error Handling Validation Tests');
  console.log('PRD Reference: PRD-1.2.11-basic-error-handling-system.md');
  console.log('');
  
  try {
    await testFrontendComponents();
    await testErrorServices();
    await testErrorTypeDefinitions();
    await testUserExperienceFeatures();
    await testAccessibilityFeatures();
    
    const results = await generateTestSummary();
    
    return results;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFrontendValidationTests()
    .then(results => {
      process.exit(results.overallStatus === 'FAIL' ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runFrontendValidationTests, testResults };