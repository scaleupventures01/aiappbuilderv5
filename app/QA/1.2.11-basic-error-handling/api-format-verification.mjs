/**
 * API Request/Response Format Verification
 * PRD 1.2.2 - API Developer Implementation
 * 
 * Focused testing of:
 * - JSON schema validation
 * - HTTP status code consistency
 * - Content-Type headers
 * - API response structure standards
 * - Input validation and sanitization
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

// Expected response schemas
const RESPONSE_SCHEMAS = {
  success: {
    required: ['success', 'message'],
    optional: ['data', 'timestamp'],
    types: {
      success: 'boolean',
      message: 'string',
      data: 'object',
      timestamp: 'string'
    }
  },
  error: {
    required: ['success', 'message'],
    optional: ['error', 'details', 'timestamp'],
    types: {
      success: 'boolean',
      message: 'string',
      error: 'string',
      details: 'object',
      timestamp: 'string'
    }
  },
  health: {
    required: ['success', 'message'],
    optional: ['data', 'timestamp', 'version', 'environment'],
    types: {
      success: 'boolean',
      message: 'string',
      data: 'object',
      timestamp: 'string',
      version: 'string',
      environment: 'string'
    }
  }
};

class ApiFormatVerifier {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
      tests: {}
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      test: '🧪'
    }[type] || 'ℹ️';
    
    console.log(`${timestamp} ${prefix} ${message}`);
  }

  recordResult(testName, success, message, details = {}) {
    this.results.summary.total++;
    
    if (success) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
    
    this.results.tests[testName] = {
      success,
      message,
      timestamp: new Date().toISOString(),
      details
    };
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, options);
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.text()
      };
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  parseJsonSafely(text) {
    try {
      return { success: true, data: JSON.parse(text) };
    } catch (error) {
      return { success: false, error: error.message, data: text };
    }
  }

  validateSchema(data, schemaName) {
    const schema = RESPONSE_SCHEMAS[schemaName];
    if (!schema) {
      return { valid: false, errors: [`Unknown schema: ${schemaName}`] };
    }

    const errors = [];
    
    // Check required fields
    for (const field of schema.required) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check field types
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (field in data) {
        const actualType = typeof data[field];
        if (actualType !== expectedType && data[field] !== null) {
          errors.push(`Field '${field}' should be ${expectedType}, got ${actualType}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async testJsonResponseFormat() {
    this.log('Testing JSON response format consistency...', 'test');
    
    const endpoints = [
      { url: `${BASE_URL}/health`, schema: 'health', name: 'Health Check' },
      { url: `${BASE_URL}/health/db`, schema: 'health', name: 'Database Health' },
      { url: `${BASE_URL}/api`, schema: 'success', name: 'API Documentation' },
      { url: `${API_BASE}/nonexistent`, schema: 'error', name: 'Not Found Error' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint.url);
        const contentType = response.headers['content-type'] || '';
        
        // Check Content-Type header
        const hasJsonContentType = contentType.includes('application/json');
        if (!hasJsonContentType) {
          this.recordResult(`json_content_type_${endpoint.name.toLowerCase().replace(' ', '_')}`, false,
            `${endpoint.name}: Missing or incorrect Content-Type header`,
            { contentType, expectedType: 'application/json' });
          continue;
        }

        // Parse JSON
        const jsonResult = this.parseJsonSafely(response.body);
        if (!jsonResult.success) {
          this.recordResult(`json_parsing_${endpoint.name.toLowerCase().replace(' ', '_')}`, false,
            `${endpoint.name}: Invalid JSON response`,
            { error: jsonResult.error, body: response.body.substring(0, 200) });
          continue;
        }

        // Validate schema
        const validation = this.validateSchema(jsonResult.data, endpoint.schema);
        this.recordResult(`json_schema_${endpoint.name.toLowerCase().replace(' ', '_')}`, validation.valid,
          validation.valid ? `${endpoint.name}: Valid JSON schema` : 
          `${endpoint.name}: Schema validation failed`,
          { 
            errors: validation.errors,
            receivedFields: Object.keys(jsonResult.data),
            expectedSchema: endpoint.schema
          });

        this.log(`${endpoint.name}: ${validation.valid ? 'PASSED' : 'FAILED'}`, 
                validation.valid ? 'success' : 'error');

      } catch (error) {
        this.recordResult(`json_format_${endpoint.name.toLowerCase().replace(' ', '_')}`, false,
          `${endpoint.name}: Format test error`,
          { error: error.message });
        
        this.log(`${endpoint.name}: ERROR - ${error.message}`, 'error');
      }
    }
  }

  async testHttpStatusCodes() {
    this.log('Testing HTTP status code consistency...', 'test');

    const statusTests = [
      { url: `${BASE_URL}/health`, method: 'GET', expectedStatus: 200, name: 'Health Check Success' },
      { url: `${API_BASE}/nonexistent`, method: 'GET', expectedStatus: 404, name: 'Not Found' },
      { url: `${API_BASE}/auth/login`, method: 'POST', 
        body: JSON.stringify({}), expectedStatus: 400, name: 'Bad Request' },
      { url: `${BASE_URL}/health`, method: 'DELETE', expectedStatus: 405, name: 'Method Not Allowed' }
    ];

    for (const test of statusTests) {
      try {
        const response = await this.makeRequest(test.url, {
          method: test.method,
          headers: { 'Content-Type': 'application/json' },
          body: test.body
        });

        const statusRange = Math.floor(test.expectedStatus / 100);
        const actualRange = Math.floor(response.status / 100);
        const isCorrectRange = statusRange === actualRange;

        this.recordResult(`status_code_${test.name.toLowerCase().replace(/\s+/g, '_')}`, isCorrectRange,
          isCorrectRange ? `${test.name}: Correct status code range` : 
          `${test.name}: Unexpected status code`,
          {
            expectedStatus: test.expectedStatus,
            actualStatus: response.status,
            method: test.method,
            url: test.url
          });

        this.log(`${test.name}: ${isCorrectRange ? 'PASSED' : 'FAILED'} (${response.status})`, 
                isCorrectRange ? 'success' : 'error');

      } catch (error) {
        this.recordResult(`status_code_${test.name.toLowerCase().replace(/\s+/g, '_')}`, false,
          `${test.name}: Status code test error`,
          { error: error.message });
        
        this.log(`${test.name}: ERROR - ${error.message}`, 'error');
      }
    }
  }

  async testInputValidation() {
    this.log('Testing input validation and sanitization...', 'test');

    const validationTests = [
      {
        name: 'SQL Injection Attempt',
        url: `${API_BASE}/auth/login`,
        method: 'POST',
        body: JSON.stringify({
          email: "'; DROP TABLE users; --",
          password: "password"
        })
      },
      {
        name: 'XSS Attempt',
        url: `${API_BASE}/auth/login`,
        method: 'POST',
        body: JSON.stringify({
          email: "<script>alert('xss')</script>",
          password: "password"
        })
      },
      {
        name: 'Invalid Email Format',
        url: `${API_BASE}/auth/login`,
        method: 'POST',
        body: JSON.stringify({
          email: "not-an-email",
          password: "password"
        })
      },
      {
        name: 'Missing Required Fields',
        url: `${API_BASE}/auth/login`,
        method: 'POST',
        body: JSON.stringify({})
      },
      {
        name: 'Extra Large Payload',
        url: `${API_BASE}/auth/login`,
        method: 'POST',
        body: JSON.stringify({
          email: "test@example.com",
          password: "x".repeat(1000000) // 1MB password
        })
      }
    ];

    for (const test of validationTests) {
      try {
        const response = await this.makeRequest(test.url, {
          method: test.method,
          headers: { 'Content-Type': 'application/json' },
          body: test.body
        });

        // Input validation should return 400-level status codes
        const isProperlyValidated = response.status >= 400 && response.status < 500;
        
        // Parse response to check for proper error structure
        const jsonResult = this.parseJsonSafely(response.body);
        const hasProperErrorFormat = jsonResult.success && 
                                   jsonResult.data.success === false &&
                                   typeof jsonResult.data.message === 'string';

        const testPassed = isProperlyValidated && hasProperErrorFormat;

        this.recordResult(`input_validation_${test.name.toLowerCase().replace(/\s+/g, '_')}`, testPassed,
          testPassed ? `${test.name}: Properly validated and rejected` : 
          `${test.name}: Validation issues detected`,
          {
            status: response.status,
            hasProperErrorFormat,
            isProperlyValidated,
            responseBody: jsonResult.success ? jsonResult.data : response.body.substring(0, 200)
          });

        this.log(`${test.name}: ${testPassed ? 'PASSED' : 'FAILED'}`, testPassed ? 'success' : 'error');

      } catch (error) {
        // Network-level errors might be expected for some tests
        const isExpectedNetworkError = test.name.includes('Large Payload') && 
                                     error.message.toLowerCase().includes('body');
        
        this.recordResult(`input_validation_${test.name.toLowerCase().replace(/\s+/g, '_')}`, isExpectedNetworkError,
          isExpectedNetworkError ? `${test.name}: Properly rejected at network level` : 
          `${test.name}: Validation test error`,
          { error: error.message, isExpectedNetworkError });
        
        this.log(`${test.name}: ${isExpectedNetworkError ? 'PASSED' : 'ERROR'}`, 
                isExpectedNetworkError ? 'success' : 'error');
      }
    }
  }

  async testResponseHeaders() {
    this.log('Testing response headers consistency...', 'test');

    const endpoints = [
      `${BASE_URL}/health`,
      `${BASE_URL}/api`,
      `${API_BASE}/nonexistent`
    ];

    for (const url of endpoints) {
      try {
        const response = await this.makeRequest(url);
        
        const requiredHeaders = {
          'content-type': 'application/json',
          'x-content-type-options': 'nosniff'
        };

        const headerChecks = {};
        let allHeadersPresent = true;

        for (const [headerName, expectedValue] of Object.entries(requiredHeaders)) {
          const headerValue = response.headers[headerName];
          const isPresent = headerValue && headerValue.includes(expectedValue);
          
          headerChecks[headerName] = {
            present: isPresent,
            value: headerValue,
            expected: expectedValue
          };

          if (!isPresent) allHeadersPresent = false;
        }

        this.recordResult(`response_headers_${url.replace(/[:/]/g, '_')}`, allHeadersPresent,
          allHeadersPresent ? 'All required headers present' : 'Missing required headers',
          { headerChecks, allHeaders: response.headers });

        this.log(`Headers for ${url}: ${allHeadersPresent ? 'PASSED' : 'FAILED'}`, 
                allHeadersPresent ? 'success' : 'error');

      } catch (error) {
        this.recordResult(`response_headers_${url.replace(/[:/]/g, '_')}`, false,
          'Header test error', { error: error.message });
        
        this.log(`Headers for ${url}: ERROR - ${error.message}`, 'error');
      }
    }
  }

  async runAllTests() {
    this.log('Starting API Format Verification Tests', 'test');

    await this.testJsonResponseFormat();
    await this.testHttpStatusCodes();
    await this.testInputValidation();
    await this.testResponseHeaders();

    // Generate summary
    this.log('\n' + '='.repeat(80), 'info');
    this.log('API FORMAT VERIFICATION SUMMARY', 'info');
    this.log('='.repeat(80), 'info');
    this.log(`Total Tests: ${this.results.summary.total}`, 'info');
    this.log(`Passed: ${this.results.summary.passed}`, 'success');
    this.log(`Failed: ${this.results.summary.failed}`, this.results.summary.failed > 0 ? 'error' : 'info');
    
    const passRate = (this.results.summary.passed / this.results.summary.total * 100).toFixed(1);
    this.log(`Pass Rate: ${passRate}%`, passRate >= 90 ? 'success' : passRate >= 70 ? 'warning' : 'error');

    return this.results;
  }

  async saveResults() {
    const fs = await import('fs/promises');
    const resultsPath = `/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app/QA/1.2.11-basic-error-handling/api-format-verification-results.json`;
    
    await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
    this.log(`Results saved to: api-format-verification-results.json`, 'info');
  }
}

// Execute tests if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new ApiFormatVerifier();
  
  verifier.runAllTests()
    .then(async () => {
      await verifier.saveResults();
      process.exit(verifier.results.summary.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error(`Format verification failed: ${error.message}`);
      process.exit(1);
    });
}

export { ApiFormatVerifier };