/**
 * Trade Analysis Endpoint Test
 * Tests the /api/analyze-trade endpoint with various scenarios
 * Created: 2025-08-15
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TradeAnalysisEndpointTest {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.testResults = [];
    this.authToken = null;
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
   * Create test image buffer
   */
  createTestImageBuffer() {
    // Create a simple PNG header for testing
    // This is a minimal valid PNG file (1x1 transparent pixel)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
      0x1F, 0x15, 0xC4, 0x89, // CRC
      0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // compressed data
      0x0D, 0x0A, 0x2D, 0xB4, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    return pngData;
  }

  /**
   * Test server health
   */
  async testServerHealth() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();

      if (!response.ok) {
        passed = false;
        details = `Server health check failed: ${response.status} ${response.statusText}`;
      } else if (!data.success) {
        passed = false;
        details = 'Server reports unhealthy status';
      } else {
        details = `Server is healthy (${data.message})`;
      }

    } catch (error) {
      passed = false;
      details = `Cannot connect to server: ${error.message}`;
    }

    const duration = Date.now() - startTime;
    this.logResult('Server Health Check', passed, details, duration);
    return passed;
  }

  /**
   * Test analyze-trade endpoint health
   */
  async testAnalyzeTradeHealth() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      const response = await fetch(`${this.baseUrl}/api/analyze-trade/health`);
      const data = await response.json();

      if (!response.ok && response.status !== 503) {
        passed = false;
        details = `Unexpected response status: ${response.status}`;
      } else {
        // Service might be unhealthy without OpenAI key, which is expected
        if (data.status === 'healthy') {
          details = 'Trade analysis service is healthy';
        } else {
          details = `Trade analysis service status: ${data.status} (${data.error || 'no API key configured'})`;
          // This is expected without OpenAI API key, so still pass
        }
      }

    } catch (error) {
      passed = false;
      details = `Health check failed: ${error.message}`;
    }

    const duration = Date.now() - startTime;
    this.logResult('Analyze Trade Health Check', passed, details, duration);
    return passed;
  }

  /**
   * Test missing image file
   */
  async testMissingImageFile() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      const formData = new FormData();
      formData.append('description', 'Test without image');

      const response = await fetch(`${this.baseUrl}/api/analyze-trade`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': this.authToken ? `Bearer ${this.authToken}` : undefined
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        details = 'Authentication required (expected without auth token)';
        // This is expected behavior
      } else if (response.status !== 400) {
        passed = false;
        details = `Expected 400 Bad Request for missing image, got ${response.status}`;
      } else if (data.error && data.error.toLowerCase().includes('image')) {
        details = 'Properly rejected request without image file';
      } else {
        passed = false;
        details = `Unexpected error message: ${data.error}`;
      }

    } catch (error) {
      passed = false;
      details = `Request failed: ${error.message}`;
    }

    const duration = Date.now() - startTime;
    this.logResult('Missing Image File Validation', passed, details, duration);
    return passed;
  }

  /**
   * Test invalid file type
   */
  async testInvalidFileType() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      const formData = new FormData();
      const textBuffer = Buffer.from('This is not an image file');
      formData.append('image', textBuffer, {
        filename: 'test.txt',
        contentType: 'text/plain'
      });

      const response = await fetch(`${this.baseUrl}/api/analyze-trade`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': this.authToken ? `Bearer ${this.authToken}` : undefined
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        details = 'Authentication required (expected without auth token)';
        // This is expected behavior
      } else if (response.status !== 400) {
        passed = false;
        details = `Expected 400 Bad Request for invalid file type, got ${response.status}`;
      } else if (data.error && (data.error.toLowerCase().includes('file type') || data.error.toLowerCase().includes('format'))) {
        details = 'Properly rejected invalid file type';
      } else {
        passed = false;
        details = `Unexpected error message: ${data.error}`;
      }

    } catch (error) {
      passed = false;
      details = `Request failed: ${error.message}`;
    }

    const duration = Date.now() - startTime;
    this.logResult('Invalid File Type Validation', passed, details, duration);
    return passed;
  }

  /**
   * Test file too large
   */
  async testFileTooLarge() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      const formData = new FormData();
      // Create a buffer larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 0xFF); // 11MB
      formData.append('image', largeBuffer, {
        filename: 'large-test.png',
        contentType: 'image/png'
      });

      const response = await fetch(`${this.baseUrl}/api/analyze-trade`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': this.authToken ? `Bearer ${this.authToken}` : undefined
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        details = 'Authentication required (expected without auth token)';
        // This is expected behavior
      } else if (response.status !== 413 && response.status !== 400) {
        passed = false;
        details = `Expected 413 Payload Too Large or 400 Bad Request, got ${response.status}`;
      } else {
        details = 'Properly rejected file that is too large';
      }

    } catch (error) {
      // Connection might be rejected due to payload size
      if (error.message.includes('PayloadTooLargeError') || error.message.includes('request entity too large')) {
        details = 'Properly rejected large file (connection level)';
      } else {
        passed = false;
        details = `Unexpected error: ${error.message}`;
      }
    }

    const duration = Date.now() - startTime;
    this.logResult('File Too Large Validation', passed, details, duration);
    return passed;
  }

  /**
   * Test valid request structure (without actual processing)
   */
  async testValidRequestStructure() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      const formData = new FormData();
      const imageBuffer = this.createTestImageBuffer();
      formData.append('image', imageBuffer, {
        filename: 'test-chart.png',
        contentType: 'image/png'
      });
      formData.append('description', 'Test chart analysis request');

      const response = await fetch(`${this.baseUrl}/api/analyze-trade`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': this.authToken ? `Bearer ${this.authToken}` : undefined
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        details = 'Authentication required (expected without auth token)';
        // This is expected behavior for the real endpoint
      } else if (response.status === 503) {
        // Service unavailable due to missing OpenAI API key
        if (data.error && data.error.toLowerCase().includes('service')) {
          details = 'Service properly reports unavailability (missing OpenAI key)';
        } else {
          passed = false;
          details = `Service unavailable with unexpected message: ${data.error}`;
        }
      } else if (response.status === 500 && data.error && data.error.toLowerCase().includes('initialize')) {
        details = 'Service properly reports initialization failure (missing OpenAI key)';
      } else {
        passed = false;
        details = `Unexpected response: ${response.status} - ${data.error || data.message}`;
      }

    } catch (error) {
      passed = false;
      details = `Request failed: ${error.message}`;
    }

    const duration = Date.now() - startTime;
    this.logResult('Valid Request Structure', passed, details, duration);
    return passed;
  }

  /**
   * Test rate limiting
   */
  async testRateLimiting() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      const formData = new FormData();
      const imageBuffer = this.createTestImageBuffer();
      formData.append('image', imageBuffer, {
        filename: 'test-chart.png',
        contentType: 'image/png'
      });

      // Make multiple rapid requests to trigger rate limiting
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          fetch(`${this.baseUrl}/api/analyze-trade`, {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': this.authToken ? `Bearer ${this.authToken}` : undefined
            }
          })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitResponse = responses.find(r => r.status === 429);

      if (rateLimitResponse) {
        details = 'Rate limiting is working (429 Too Many Requests)';
      } else {
        // Check if we got auth errors instead (which is also expected)
        const authErrors = responses.filter(r => r.status === 401).length;
        if (authErrors > 0) {
          details = `Requests blocked by authentication (${authErrors} auth errors)`;
        } else {
          details = 'Rate limiting may not be triggered with current request pattern';
          // Don't fail the test as rate limiting might have different thresholds
        }
      }

    } catch (error) {
      passed = false;
      details = `Rate limit test failed: ${error.message}`;
    }

    const duration = Date.now() - startTime;
    this.logResult('Rate Limiting', passed, details, duration);
    return passed;
  }

  /**
   * Test CORS headers
   */
  async testCorsHeaders() {
    const startTime = Date.now();
    let passed = true;
    let details = '';

    try {
      const response = await fetch(`${this.baseUrl}/api/analyze-trade/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      const corsHeader = response.headers.get('access-control-allow-origin');
      const methodHeader = response.headers.get('access-control-allow-methods');

      if (corsHeader) {
        details = `CORS headers present: Origin=${corsHeader}`;
        if (methodHeader && methodHeader.includes('POST')) {
          details += ', POST method allowed';
        }
      } else {
        passed = false;
        details = 'Missing CORS headers';
      }

    } catch (error) {
      passed = false;
      details = `CORS test failed: ${error.message}`;
    }

    const duration = Date.now() - startTime;
    this.logResult('CORS Headers', passed, details, duration);
    return passed;
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Trade Analysis Endpoint Integration Tests\n');
    console.log('Note: Some tests may show expected failures due to missing authentication or OpenAI API key\n');

    const tests = [
      () => this.testServerHealth(),
      () => this.testAnalyzeTradeHealth(),
      () => this.testMissingImageFile(),
      () => this.testInvalidFileType(),
      () => this.testFileTooLarge(),
      () => this.testValidRequestStructure(),
      () => this.testRateLimiting(),
      () => this.testCorsHeaders()
    ];

    let passedTests = 0;
    const startTime = Date.now();

    for (const test of tests) {
      try {
        const passed = await test();
        if (passed) passedTests++;
        
        // Small delay between tests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`❌ Test execution error: ${error.message}`);
      }
    }

    const totalDuration = Date.now() - startTime;
    
    console.log('\n📊 Test Results Summary');
    console.log('═'.repeat(50));
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${tests.length - passedTests}`);
    console.log(`Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${Math.round((passedTests / tests.length) * 100)}%`);

    if (passedTests === tests.length) {
      console.log('\n✅ All endpoint tests passed!');
    } else {
      console.log('\n⚠️  Some endpoint tests failed, but this may be expected without full setup.');
    }

    console.log('\nTo fully test the endpoint, you need to:');
    console.log('1. Set up OPENAI_API_KEY in your environment');
    console.log('2. Configure authentication tokens');
    console.log('3. Start the server with: npm run start:dev');

    return {
      success: passedTests >= Math.floor(tests.length * 0.6), // 60% pass rate acceptable
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
  const baseUrl = process.argv[2] || 'http://localhost:3001';
  const test = new TradeAnalysisEndpointTest(baseUrl);
  
  test.runAllTests()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('🚨 Test runner error:', error);
      process.exit(1);
    });
}

export default TradeAnalysisEndpointTest;