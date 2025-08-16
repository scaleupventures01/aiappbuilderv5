import fs from 'fs/promises';
import path from 'path';

console.log('🚀 Direct Error Handling Validation');
console.log('PRD Reference: PRD-1.2.11-basic-error-handling-system.md');

const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0, total: 0 }
};

function addResult(test, status, details) {
  results.tests.push({ test, status, details });
  results.summary.total++;
  if (status === 'PASS') results.summary.passed++;
  else results.summary.failed++;
  console.log(`${status === 'PASS' ? '✅' : '❌'} ${test}: ${details}`);
}

try {
  // Test 1: Backend Error Handler File
  console.log('\n📁 Backend Implementation Validation');
  
  try {
    const errorHandlerPath = '../../server/services/trade-analysis-error-handler.js';
    const errorHandlerContent = await fs.readFile(errorHandlerPath, 'utf8');
    
    // Check for error types
    const hasErrorTypes = errorHandlerContent.includes('ERROR_TYPES');
    addResult('Error types configuration', hasErrorTypes ? 'PASS' : 'FAIL',
      hasErrorTypes ? 'ERROR_TYPES configuration found' : 'ERROR_TYPES configuration missing');
    
    // Check for specific error types from PRD
    const requiredTypes = ['OPENAI_RATE_LIMIT', 'NETWORK_TIMEOUT', 'FILE_TOO_LARGE', 'INVALID_FILE_FORMAT'];
    let foundTypes = 0;
    requiredTypes.forEach(type => {
      if (errorHandlerContent.includes(type)) foundTypes++;
    });
    
    addResult('Required error types present', foundTypes === requiredTypes.length ? 'PASS' : 'FAIL',
      `Found ${foundTypes}/${requiredTypes.length} required error types`);
    
    // Check for retry logic
    const hasRetryLogic = errorHandlerContent.includes('retryRequest') || errorHandlerContent.includes('autoRetry');
    addResult('Retry logic implementation', hasRetryLogic ? 'PASS' : 'FAIL',
      hasRetryLogic ? 'Retry logic found' : 'Retry logic missing');
    
    // Check for user-friendly messages
    const hasUserMessages = errorHandlerContent.includes('AI service is busy') ||
                           errorHandlerContent.includes('Invalid image format');
    addResult('User-friendly error messages', hasUserMessages ? 'PASS' : 'FAIL',
      hasUserMessages ? 'User-friendly messages found' : 'User-friendly messages missing');
    
  } catch (error) {
    addResult('Backend error handler file', 'FAIL', `File not accessible: ${error.message}`);
  }
  
  // Test 2: API Endpoint Integration
  console.log('\n📁 API Endpoint Validation');
  
  try {
    const apiPath = '../../api/analyze-trade.js';
    const apiContent = await fs.readFile(apiPath, 'utf8');
    
    // Check for error handler integration
    const hasErrorHandlerIntegration = apiContent.includes('tradeAnalysisErrorHandler');
    addResult('Error handler integration', hasErrorHandlerIntegration ? 'PASS' : 'FAIL',
      hasErrorHandlerIntegration ? 'Error handler integrated' : 'Error handler not integrated');
    
    // Check for try-catch blocks
    const hasTryCatch = apiContent.includes('try {') && apiContent.includes('catch (error)');
    addResult('Try-catch error handling', hasTryCatch ? 'PASS' : 'FAIL',
      hasTryCatch ? 'Try-catch blocks found' : 'Try-catch blocks missing');
    
    // Check for retry implementation
    const hasRetryImplementation = apiContent.includes('currentRetry') || apiContent.includes('while');
    addResult('API endpoint retry logic', hasRetryImplementation ? 'PASS' : 'FAIL',
      hasRetryImplementation ? 'Retry logic in API endpoint' : 'No retry logic in API');
    
  } catch (error) {
    addResult('API endpoint file', 'FAIL', `File not accessible: ${error.message}`);
  }
  
  // Test 3: Frontend Components
  console.log('\n📁 Frontend Components Validation');
  
  const frontendFiles = [
    { path: '../../src/components/ui/ErrorMessage.tsx', name: 'ErrorMessage component' },
    { path: '../../src/components/chat/TradeAnalysisError.tsx', name: 'TradeAnalysisError component' },
    { path: '../../src/services/tradeAnalysisAPI.ts', name: 'Trade Analysis API service' },
    { path: '../../src/types/error.ts', name: 'Error types definition' }
  ];
  
  for (const file of frontendFiles) {
    try {
      const content = await fs.readFile(file.path, 'utf8');
      
      // Basic React/TypeScript validation
      const isValid = content.includes('import') && 
                     (content.includes('export') || content.includes('interface') || content.includes('type'));
      
      addResult(`${file.name} structure`, isValid ? 'PASS' : 'FAIL',
        isValid ? 'Valid structure found' : 'Invalid structure');
      
    } catch (error) {
      addResult(file.name, 'FAIL', `File not accessible: ${error.message}`);
    }
  }
  
  // Test 4: Error Type Definitions
  console.log('\n📁 Error Types Validation');
  
  try {
    const errorTypesPath = '../../src/types/error.ts';
    const errorTypesContent = await fs.readFile(errorTypesPath, 'utf8');
    
    // Check for ErrorType union
    const hasErrorTypeUnion = errorTypesContent.includes('export type ErrorType');
    addResult('ErrorType union definition', hasErrorTypeUnion ? 'PASS' : 'FAIL',
      hasErrorTypeUnion ? 'ErrorType union found' : 'ErrorType union missing');
    
    // Check for interfaces
    const hasInterfaces = errorTypesContent.includes('interface ErrorResponse') &&
                         errorTypesContent.includes('interface AnalysisError');
    addResult('Error interfaces', hasInterfaces ? 'PASS' : 'FAIL',
      hasInterfaces ? 'Error interfaces found' : 'Error interfaces missing');
    
  } catch (error) {
    addResult('Error types file', 'FAIL', `File not accessible: ${error.message}`);
  }
  
  // Test 5: Specific Error Scenarios from PRD
  console.log('\n📁 PRD Error Scenarios Validation');
  
  try {
    const errorHandlerPath = '../../server/services/trade-analysis-error-handler.js';
    const errorHandlerContent = await fs.readFile(errorHandlerPath, 'utf8');
    
    // TS-001: OpenAI rate limit with auto-retry
    const hasRateLimitAutoRetry = errorHandlerContent.includes('OPENAI_RATE_LIMIT') &&
                                 errorHandlerContent.includes('"autoRetry": true');
    addResult('TS-001: Rate limit auto-retry', hasRateLimitAutoRetry ? 'PASS' : 'FAIL',
      hasRateLimitAutoRetry ? 'Rate limit auto-retry configured' : 'Rate limit auto-retry missing');
    
    // TS-003: Invalid format non-retryable
    const hasInvalidFormatNoRetry = errorHandlerContent.includes('INVALID_FILE_FORMAT') &&
                                   errorHandlerContent.includes('"retryable": false');
    addResult('TS-003: Invalid format non-retryable', hasInvalidFormatNoRetry ? 'PASS' : 'FAIL',
      hasInvalidFormatNoRetry ? 'Invalid format marked non-retryable' : 'Invalid format retry config unclear');
    
    // TS-004: File too large guidance
    const hasFileSizeGuidance = errorHandlerContent.includes('FILE_TOO_LARGE') &&
                               errorHandlerContent.includes('guidance');
    addResult('TS-004: File size guidance', hasFileSizeGuidance ? 'PASS' : 'FAIL',
      hasFileSizeGuidance ? 'File size guidance provided' : 'File size guidance missing');
    
  } catch (error) {
    addResult('PRD scenarios validation', 'FAIL', `Could not validate scenarios: ${error.message}`);
  }
  
  // Generate Summary
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('═'.repeat(50));
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success Rate: ${Math.round((results.summary.passed / results.summary.total) * 100)}%`);
  
  const overallStatus = results.summary.failed === 0 ? 'PASS' : 
                       results.summary.passed > results.summary.failed ? 'PARTIAL' : 'FAIL';
  console.log(`Overall Status: ${overallStatus}`);
  
  // Save results
  const resultsFile = `validation-results-${Date.now()}.json`;
  await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${resultsFile}`);
  
} catch (error) {
  console.error('❌ Validation failed:', error.message);
}

console.log('\n✅ Validation completed');