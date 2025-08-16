/**
 * Trade Analysis Error Handling Integration Test
 * Tests the complete error handling system for trade analysis
 * Created: 2025-08-15
 */

import { TradeAnalysisErrorHandler, ERROR_TYPES } from '../../server/services/trade-analysis-error-handler.js';
import { TradeAnalysisService } from '../../server/services/trade-analysis-service.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Mock errors for testing
 */
class MockError extends Error {
  constructor(message, code = null, status = null) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Test suite for Trade Analysis Error Handling
 */
class TradeAnalysisErrorHandlingTest {
  constructor() {
    this.errorHandler = new TradeAnalysisErrorHandler();
    this.service = new TradeAnalysisService();
    this.testResults = [];
    this.testStartTime = Date.now();
  }

  /**
   * Log test result
   */
  logResult(testName, passed, details = '', duration = 0) {
    const result = {
      testName,
      passed,
      details,
      duration,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName} (${duration}ms)`);
    if (details) {
      console.log(`   Details: ${details}`);
    }
  }

  /**
   * Test error classification
   */
  async testErrorClassification() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      // Test OpenAI rate limit error
      const rateLimitError = new MockError('rate limit exceeded', 429);
      const classification1 = this.errorHandler.classifyError(rateLimitError);
      if (classification1 !== 'OPENAI_RATE_LIMIT') {
        passed = false;
        details += `Rate limit classification failed: ${classification1}; `;
      }

      // Test network timeout error
      const timeoutError = new MockError('request timeout', 'ETIMEDOUT');
      const classification2 = this.errorHandler.classifyError(timeoutError);
      if (classification2 !== 'NETWORK_TIMEOUT') {
        passed = false;
        details += `Timeout classification failed: ${classification2}; `;
      }

      // Test file too large error
      const fileSizeError = new MockError('file too large', 'LIMIT_FILE_SIZE');
      const classification3 = this.errorHandler.classifyError(fileSizeError);
      if (classification3 !== 'FILE_TOO_LARGE') {
        passed = false;
        details += `File size classification failed: ${classification3}; `;
      }

      // Test invalid file format error
      const formatError = new MockError('invalid format');
      const classification4 = this.errorHandler.classifyError(formatError);
      if (classification4 !== 'INVALID_FILE_FORMAT') {
        passed = false;
        details += `File format classification failed: ${classification4}; `;
      }

      // Test unknown error
      const unknownError = new MockError('some random error');
      const classification5 = this.errorHandler.classifyError(unknownError);
      if (classification5 !== 'UNKNOWN_ERROR') {
        passed = false;
        details += `Unknown error classification failed: ${classification5}; `;
      }

      if (passed) {
        details = 'All error types classified correctly';
      }

    } catch (error) {
      passed = false;
      details = `Exception during test: ${error.message}`;
    }

    const duration = Date.now() - startTime;
    this.logResult('Error Classification', passed, details, duration);
    return passed;
  }

  /**
   * Test error response formatting
   */
  async testErrorResponseFormatting() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      this.errorHandler.setContext('test-request-123', 'test-user-456');

      // Test retryable error formatting
      const rateLimitError = new MockError('rate limit exceeded', 429);
      const response1 = await this.errorHandler.handleError(rateLimitError, { 
        retryCount: 0, 
        canRetry: false // Force no retry for testing
      });

      if (!response1.errorType || !response1.message || response1.retryable === undefined) {
        passed = false;
        details += 'Missing required response fields; ';
      }

      if (response1.errorType !== 'OPENAI_RATE_LIMIT') {
        passed = false;
        details += `Wrong error type: ${response1.errorType}; `;
      }

      if (!response1.retryable) {
        passed = false;
        details += 'Rate limit error should be retryable; ';
      }

      // Test non-retryable error formatting
      const formatError = new MockError('invalid format');
      const response2 = await this.errorHandler.handleError(formatError, { 
        retryCount: 0,
        canRetry: false 
      });

      if (response2.retryable) {
        passed = false;
        details += 'File format error should not be retryable; ';
      }

      if (passed) {
        details = 'Error responses formatted correctly';
      }

    } catch (error) {
      passed = false;
      details = `Exception during test: ${error.message}`;
    }

    const duration = Date.now() - startTime;
    this.logResult('Error Response Formatting', passed, details, duration);
    return passed;
  }

  /**
   * Test retry logic
   */
  async testRetryLogic() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      let attemptCount = 0;
      const maxRetries = 2;

      // Mock function that fails first few times then succeeds
      const mockFunction = async () => {
        attemptCount++;
        if (attemptCount <= maxRetries) {
          throw new MockError('temporary failure', 'ETIMEDOUT');
        }
        return { success: true, data: 'success' };
      };

      // Test retry with success
      const result = await this.errorHandler.retryRequest(mockFunction, { maxRetries });

      if (!result || !result.success) {
        passed = false;
        details += 'Retry should have succeeded after multiple attempts; ';
      }

      if (attemptCount !== maxRetries + 1) {
        passed = false;
        details += `Wrong number of attempts: ${attemptCount}, expected: ${maxRetries + 1}; `;
      }

      // Test retry with permanent failure
      attemptCount = 0;
      const failingFunction = async () => {
        attemptCount++;
        throw new MockError('permanent failure', 'INVALID_FILE_FORMAT');
      };

      try {
        await this.errorHandler.retryRequest(failingFunction, { maxRetries });
        passed = false;
        details += 'Non-retryable error should not be retried; ';
      } catch (error) {
        if (attemptCount !== 1) {
          passed = false;
          details += `Non-retryable error was retried ${attemptCount} times; `;
        }
      }

      if (passed) {
        details = 'Retry logic works correctly for both retryable and non-retryable errors';
      }

    } catch (error) {
      passed = false;
      details = `Exception during test: ${error.message}`;
    }

    const duration = Date.now() - startTime;
    this.logResult('Retry Logic', passed, details, duration);
    return passed;
  }

  /**
   * Test error logging
   */
  async testErrorLogging() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      // Capture console output
      let logOutput = '';
      const originalError = console.error;
      console.error = (...args) => {
        logOutput += args.join(' ') + '\n';
      };

      this.errorHandler.setContext('test-request-789', 'test-user-123', {
        endpoint: '/api/analyze-trade',
        userAgent: 'test-agent'
      });

      const testError = new MockError('test logging error', 'TEST_ERROR');
      this.errorHandler.logError(testError, 'UNKNOWN_ERROR', { 
        retryCount: 1,
        ip: '127.0.0.1' 
      });

      // Restore console.error
      console.error = originalError;

      // Verify log output contains expected information
      if (!logOutput.includes('Trade Analysis Error')) {
        passed = false;
        details += 'Log missing error header; ';
      }

      if (!logOutput.includes('test-request-789')) {
        passed = false;
        details += 'Log missing request ID; ';
      }

      if (!logOutput.includes('test-user-123')) {
        passed = false;
        details += 'Log missing user ID; ';
      }

      if (!logOutput.includes('test logging error')) {
        passed = false;
        details += 'Log missing error message; ';
      }

      if (passed) {
        details = 'Error logging includes all required context information';
      }

    } catch (error) {
      passed = false;
      details = `Exception during test: ${error.message}`;
    }

    const duration = Date.now() - startTime;
    this.logResult('Error Logging', passed, details, duration);
    return passed;
  }

  /**
   * Test service health check
   */
  async testServiceHealthCheck() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      const healthStatus = await this.service.healthCheck();

      if (!healthStatus.status) {
        passed = false;
        details += 'Health check missing status; ';
      }

      if (!healthStatus.timestamp) {
        passed = false;
        details += 'Health check missing timestamp; ';
      }

      if (healthStatus.hasApiKey === undefined) {
        passed = false;
        details += 'Health check missing API key status; ';
      }

      // Without actual API key, service should report as unhealthy but still return status
      if (healthStatus.status === 'healthy' && !process.env.OPENAI_API_KEY) {
        passed = false;
        details += 'Service should be unhealthy without API key; ';
      }

      if (passed) {
        details = 'Health check returns appropriate status information';
      }

    } catch (error) {
      passed = false;
      details = `Exception during test: ${error.message}`;
    }

    const duration = Date.now() - startTime;
    this.logResult('Service Health Check', passed, details, duration);
    return passed;
  }

  /**
   * Test error type configuration
   */
  async testErrorTypeConfiguration() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      // Verify all error types have required fields
      const requiredFields = ['message', 'retryable'];
      const errorTypeKeys = Object.keys(ERROR_TYPES);

      if (errorTypeKeys.length === 0) {
        passed = false;
        details += 'No error types defined; ';
      }

      for (const errorType of errorTypeKeys) {
        const config = ERROR_TYPES[errorType];
        
        for (const field of requiredFields) {
          if (config[field] === undefined) {
            passed = false;
            details += `${errorType} missing ${field}; `;
          }
        }

        // Verify message is user-friendly (no technical jargon)
        if (config.message && (config.message.includes('Error:') || config.message.includes('Exception'))) {
          passed = false;
          details += `${errorType} message not user-friendly: ${config.message}; `;
        }

        // Verify retryable errors have maxRetries
        if (config.retryable && config.maxRetries === undefined) {
          passed = false;
          details += `${errorType} is retryable but missing maxRetries; `;
        }
      }

      if (passed) {
        details = `All ${errorTypeKeys.length} error types properly configured`;
      }

    } catch (error) {
      passed = false;
      details = `Exception during test: ${error.message}`;
    }

    const duration = Date.now() - startTime;
    this.logResult('Error Type Configuration', passed, details, duration);
    return passed;
  }

  /**
   * Test user-friendly messages
   */
  async testUserFriendlyMessages() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      const technicalTerms = [
        'exception', 'stack trace', 'null pointer', 'undefined', 'error code',
        'internal server error', 'database', 'query', 'connection', 'timeout'
      ];

      const errorTypes = Object.keys(ERROR_TYPES);
      const problematicMessages = [];

      for (const errorType of errorTypes) {
        const message = ERROR_TYPES[errorType].message.toLowerCase();
        
        for (const term of technicalTerms) {
          if (message.includes(term.toLowerCase())) {
            problematicMessages.push(`${errorType}: "${ERROR_TYPES[errorType].message}"`);
            break;
          }
        }
      }

      if (problematicMessages.length > 0) {
        passed = false;
        details = `Messages contain technical terms: ${problematicMessages.join('; ')}`;
      } else {
        details = 'All error messages are user-friendly';
      }

    } catch (error) {
      passed = false;
      details = `Exception during test: ${error.message}`;
    }

    const duration = Date.now() - startTime;
    this.logResult('User-Friendly Messages', passed, details, duration);
    return passed;
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Trade Analysis Error Handling Integration Tests\n');

    const tests = [
      () => this.testErrorClassification(),
      () => this.testErrorResponseFormatting(),
      () => this.testRetryLogic(),
      () => this.testErrorLogging(),
      () => this.testServiceHealthCheck(),
      () => this.testErrorTypeConfiguration(),
      () => this.testUserFriendlyMessages()
    ];

    let passedTests = 0;
    for (const test of tests) {
      const passed = await test();
      if (passed) passedTests++;
    }

    const totalDuration = Date.now() - this.testStartTime;
    
    console.log('\n📊 Test Results Summary');
    console.log('═'.repeat(50));
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${tests.length - passedTests}`);
    console.log(`Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${Math.round((passedTests / tests.length) * 100)}%`);

    if (passedTests === tests.length) {
      console.log('\n✅ All tests passed! Error handling system is working correctly.');
    } else {
      console.log('\n❌ Some tests failed. Please review the error handling implementation.');
    }

    return {
      success: passedTests === tests.length,
      results: this.testResults,
      summary: {
        total: tests.length,
        passed: passedTests,
        failed: tests.length - passedTests,
        duration: totalDuration,
        successRate: Math.round((passedTests / tests.length) * 100)
      }
    };
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new TradeAnalysisErrorHandlingTest();
  test.runAllTests()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('🚨 Test runner error:', error);
      process.exit(1);
    });
}

export default TradeAnalysisErrorHandlingTest;