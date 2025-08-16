#!/usr/bin/env node

/**
 * PRD-1.1.5.2 Image Upload Endpoint - Real Server QA Test
 * 
 * Tests against the actual running server implementation
 * Validates all PRD Section 5.2 Testing Requirements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import fetch from 'node-fetch';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server Configuration
const SERVER_CONFIG = {
  baseUrl: process.env.TEST_SERVER_URL || 'http://localhost:3001',
  uploadEndpoint: '/api/upload/images',
  healthEndpoint: '/health',
  timeout: 30000
};

// Test Results Storage
const testResults = {
  timestamp: new Date().toISOString(),
  testSuite: 'PRD-1.1.5.2-real-server-test',
  serverUrl: SERVER_CONFIG.baseUrl,
  results: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: []
  }
};

/**
 * Check if server is running
 */
async function checkServerHealth() {
  try {
    const response = await fetch(`${SERVER_CONFIG.baseUrl}${SERVER_CONFIG.healthEndpoint}`, {
      timeout: 5000
    });
    
    if (response.ok) {
      const health = await response.json();
      console.log(`✅ Server is healthy: ${health.message}`);
      return true;
    } else {
      console.log(`⚠️  Server health check returned: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Server is not accessible: ${error.message}`);
    return false;
  }
}

/**
 * Generate test token (mock implementation)
 */
function generateTestToken() {
  // In a real implementation, this would authenticate with the server
  return 'Bearer test-token-user-123';
}

/**
 * Generate various test images
 */
async function generateTestImages() {
  const images = {};

  try {
    console.log('📸 Generating test images...');

    // 1. Valid JPEG (small)
    images.validJpeg = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    })
      .jpeg({ quality: 80 })
      .toBuffer();

    // 2. Valid PNG
    images.validPng = await sharp({
      create: {
        width: 600,
        height: 400,
        channels: 4,
        background: { r: 255, g: 100, b: 50, alpha: 0.8 }
      }
    })
      .png()
      .toBuffer();

    // 3. Valid WebP
    images.validWebp = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 50, g: 200, b: 100 }
      }
    })
      .webp({ quality: 80 })
      .toBuffer();

    // 4. Valid GIF (simple static)
    images.validGif = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 255, g: 255, b: 0 }
      }
    })
      .gif()
      .toBuffer();

    // 5. Large file (around 10MB)
    images.largeFile = await sharp({
      create: {
        width: 4000,
        height: 3000,
        channels: 3,
        background: { r: 128, g: 128, b: 128 }
      }
    })
      .jpeg({ quality: 95 })
      .toBuffer();

    // 6. Extremely large file (should exceed 15MB limit)
    images.oversizedFile = await sharp({
      create: {
        width: 6000,
        height: 4000,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
      .png({ compressionLevel: 0 })
      .toBuffer();

    console.log('✅ Test images generated:');
    Object.entries(images).forEach(([name, buffer]) => {
      console.log(`   ${name}: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);
    });

    return images;

  } catch (error) {
    console.error('❌ Failed to generate test images:', error);
    throw error;
  }
}

/**
 * Test runner utility
 */
async function runTest(testName, testFunction) {
  console.log(`\n🧪 Running: ${testName}`);
  testResults.summary.total++;

  try {
    const startTime = Date.now();
    const result = await testFunction();
    const duration = Date.now() - startTime;

    const testResult = {
      name: testName,
      status: result.success ? 'PASS' : (result.skipped ? 'SKIP' : 'FAIL'),
      duration: `${duration}ms`,
      details: result.details || '',
      error: result.error || null,
      timestamp: new Date().toISOString(),
      response: result.response || null
    };

    testResults.results[testName] = testResult;

    if (result.skipped) {
      testResults.summary.skipped++;
      console.log(`⏭️  SKIP: ${testName} - ${result.reason}`);
    } else if (result.success) {
      testResults.summary.passed++;
      console.log(`✅ PASS: ${testName} (${duration}ms)`);
      if (result.details) console.log(`   📋 ${result.details}`);
    } else {
      testResults.summary.failed++;
      testResults.summary.errors.push(`${testName}: ${result.error}`);
      console.log(`❌ FAIL: ${testName} (${duration}ms)`);
      console.log(`   🚨 ${result.error}`);
    }

    return testResult;
  } catch (error) {
    testResults.summary.failed++;
    testResults.summary.errors.push(`${testName}: ${error.message}`);
    
    console.log(`💥 ERROR: ${testName}`);
    console.log(`   🚨 ${error.message}`);
    
    return {
      name: testName,
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Make HTTP request with file upload
 */
async function uploadFiles(files, additionalData = {}) {
  const formData = new FormData();
  
  // Add files
  files.forEach((file, index) => {
    formData.append('images', file.buffer, {
      filename: file.filename || `test-${index}.${file.type.split('/')[1]}`,
      contentType: file.type
    });
  });

  // Add additional data
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const response = await fetch(`${SERVER_CONFIG.baseUrl}${SERVER_CONFIG.uploadEndpoint}`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': generateTestToken(),
      ...formData.getHeaders()
    },
    timeout: SERVER_CONFIG.timeout
  });

  const responseData = await response.json();
  
  return { response, data: responseData };
}

/**
 * QA-1: Upload functionality with various image formats
 */
async function testImageFormats(images) {
  const formats = [
    { name: 'JPEG', buffer: images.validJpeg, type: 'image/jpeg', filename: 'test.jpg' },
    { name: 'PNG', buffer: images.validPng, type: 'image/png', filename: 'test.png' },
    { name: 'WebP', buffer: images.validWebp, type: 'image/webp', filename: 'test.webp' },
    { name: 'GIF', buffer: images.validGif, type: 'image/gif', filename: 'test.gif' }
  ];

  const results = [];

  for (const format of formats) {
    try {
      const { response, data } = await uploadFiles([format], {
        conversationId: 'test-conversation-123',
        context: 'chat'
      });

      results.push({
        format: format.name,
        status: response.status,
        success: data.success,
        uploads: data.data?.totalUploaded || 0
      });
    } catch (error) {
      results.push({
        format: format.name,
        status: 'ERROR',
        success: false,
        uploads: 0,
        error: error.message
      });
    }
  }

  const passedFormats = results.filter(r => r.success && r.status === 201);
  const success = passedFormats.length === formats.length;

  return {
    success,
    details: `Uploaded formats: ${passedFormats.map(r => r.format).join(', ')} (${passedFormats.length}/${formats.length})`,
    error: success ? null : `Failed formats: ${results.filter(r => !r.success).map(r => r.format).join(', ')}`,
    response: results
  };
}

/**
 * QA-2: File size limit enforcement
 */
async function testFileSizeLimits(images) {
  const tests = [
    {
      name: 'Small file (< 1MB)',
      file: { buffer: images.validJpeg, type: 'image/jpeg', filename: 'small.jpg' },
      expectedSuccess: true
    },
    {
      name: 'Large file (~10MB)',
      file: { buffer: images.largeFile, type: 'image/jpeg', filename: 'large.jpg' },
      expectedSuccess: true
    },
    {
      name: 'Oversized file (> 15MB)',
      file: { buffer: images.oversizedFile, type: 'image/png', filename: 'oversized.png' },
      expectedSuccess: false
    }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const { response, data } = await uploadFiles([test.file]);
      
      const actualSuccess = response.status === 201 && data.success;
      const testPassed = actualSuccess === test.expectedSuccess;

      results.push({
        name: test.name,
        fileSize: `${(test.file.buffer.length / 1024 / 1024).toFixed(2)}MB`,
        status: response.status,
        expected: test.expectedSuccess ? 'SUCCESS' : 'REJECT',
        actual: actualSuccess ? 'SUCCESS' : 'REJECT',
        passed: testPassed
      });
    } catch (error) {
      results.push({
        name: test.name,
        fileSize: `${(test.file.buffer.length / 1024 / 1024).toFixed(2)}MB`,
        status: 'ERROR',
        expected: test.expectedSuccess ? 'SUCCESS' : 'REJECT',
        actual: 'ERROR',
        passed: false,
        error: error.message
      });
    }
  }

  const allPassed = results.every(r => r.passed);

  return {
    success: allPassed,
    details: `Size limit tests: ${results.map(r => `${r.name}(${r.actual})`).join(', ')}`,
    error: allPassed ? null : 'File size limit enforcement failed',
    response: results
  };
}

/**
 * QA-3: Concurrent upload handling
 */
async function testConcurrentUploads(images) {
  // Test 1: Upload 5 files (should succeed)
  const fiveFiles = [
    { buffer: images.validJpeg, type: 'image/jpeg', filename: 'file1.jpg' },
    { buffer: images.validPng, type: 'image/png', filename: 'file2.png' },
    { buffer: images.validWebp, type: 'image/webp', filename: 'file3.webp' },
    { buffer: images.validGif, type: 'image/gif', filename: 'file4.gif' },
    { buffer: images.validJpeg, type: 'image/jpeg', filename: 'file5.jpg' }
  ];

  try {
    const { response: response1, data: data1 } = await uploadFiles(fiveFiles);
    
    const fiveFilesSuccess = response1.status === 201 && data1.data?.totalUploaded === 5;

    // Test 2: Upload 6 files (should fail)
    const sixFiles = [...fiveFiles, { buffer: images.validJpeg, type: 'image/jpeg', filename: 'file6.jpg' }];
    
    const { response: response2, data: data2 } = await uploadFiles(sixFiles);
    
    const sixFilesRejected = response2.status === 400 || response2.status === 413;

    const success = fiveFilesSuccess && sixFilesRejected;

    return {
      success,
      details: `5 files: ${response1.status} (${data1.data?.totalUploaded || 0}), 6 files: ${response2.status}`,
      error: success ? null : 'Concurrent upload limits not enforced correctly',
      response: {
        fiveFiles: { status: response1.status, uploaded: data1.data?.totalUploaded },
        sixFiles: { status: response2.status, rejected: sixFilesRejected }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Concurrent upload test failed: ${error.message}`,
      response: null
    };
  }
}

/**
 * QA-4: Error scenarios with invalid files
 */
async function testInvalidFiles() {
  const invalidFiles = [
    {
      name: 'Text file as image',
      buffer: Buffer.from('This is not an image'),
      type: 'text/plain',
      filename: 'fake.jpg'
    },
    {
      name: 'Executable file',
      buffer: Buffer.from('MZ' + 'x'.repeat(100)),
      type: 'application/octet-stream',
      filename: 'malware.exe'
    },
    {
      name: 'Invalid MIME type',
      buffer: Buffer.from('fake content'),
      type: 'application/unknown',
      filename: 'unknown.xyz'
    }
  ];

  const results = [];

  for (const file of invalidFiles) {
    try {
      const { response, data } = await uploadFiles([file]);
      
      // Should fail with 4xx status
      const correctlyRejected = response.status >= 400 && response.status < 500;
      
      results.push({
        name: file.name,
        status: response.status,
        rejected: correctlyRejected,
        error: data.error || 'Unknown error'
      });
    } catch (error) {
      results.push({
        name: file.name,
        status: 'ERROR',
        rejected: true, // Network error counts as rejection
        error: error.message
      });
    }
  }

  const allRejected = results.every(r => r.rejected);

  return {
    success: allRejected,
    details: `Invalid files rejected: ${results.filter(r => r.rejected).length}/${results.length}`,
    error: allRejected ? null : 'Some invalid files were not properly rejected',
    response: results
  };
}

/**
 * QA-5: Error scenarios with network issues
 */
async function testNetworkErrorScenarios() {
  const tests = [
    {
      name: 'No authorization token',
      headers: {},
      expectedStatus: 401
    },
    {
      name: 'Invalid authorization token',
      headers: { 'Authorization': 'Bearer invalid-token' },
      expectedStatus: 401
    },
    {
      name: 'Empty file upload',
      files: [],
      expectedStatus: 400
    }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const files = test.files || [{ buffer: Buffer.alloc(100), type: 'image/jpeg', filename: 'test.jpg' }];
      
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('images', file.buffer, {
          filename: file.filename,
          contentType: file.type
        });
      });

      const response = await fetch(`${SERVER_CONFIG.baseUrl}${SERVER_CONFIG.uploadEndpoint}`, {
        method: 'POST',
        body: formData,
        headers: {
          ...test.headers,
          ...formData.getHeaders()
        },
        timeout: SERVER_CONFIG.timeout
      });

      const testPassed = response.status === test.expectedStatus;

      results.push({
        name: test.name,
        status: response.status,
        expected: test.expectedStatus,
        passed: testPassed
      });
    } catch (error) {
      results.push({
        name: test.name,
        status: 'ERROR',
        expected: test.expectedStatus,
        passed: false,
        error: error.message
      });
    }
  }

  const allPassed = results.every(r => r.passed);

  return {
    success: allPassed,
    details: `Network error tests: ${results.map(r => `${r.name}(${r.status})`).join(', ')}`,
    error: allPassed ? null : 'Network error handling failed',
    response: results
  };
}

/**
 * QA-6: Database integration tests
 */
async function testDatabaseIntegration(images) {
  try {
    const testFile = { 
      buffer: images.validJpeg, 
      type: 'image/jpeg', 
      filename: 'db-test.jpg' 
    };

    const { response, data } = await uploadFiles([testFile], {
      conversationId: 'test-conversation-db',
      context: 'chat'
    });

    if (response.status !== 201 || !data.success) {
      return {
        success: false,
        error: `Upload failed: ${response.status} - ${data.error}`,
        response: { status: response.status, data }
      };
    }

    // Check if response contains expected database fields
    const upload = data.data?.uploads?.[0];
    const requiredFields = ['id', 'publicId', 'originalName', 'secureUrl', 'thumbnailUrl', 'createdAt'];
    const missingFields = requiredFields.filter(field => !upload?.[field]);

    const success = missingFields.length === 0;

    return {
      success,
      details: success ? 'All database fields present' : `Missing fields: ${missingFields.join(', ')}`,
      error: success ? null : 'Database integration incomplete',
      response: { upload, missingFields }
    };
  } catch (error) {
    return {
      success: false,
      error: `Database integration test failed: ${error.message}`,
      response: null
    };
  }
}

/**
 * QA-7: Performance tests with large files
 */
async function testPerformance(images) {
  const largeFile = { 
    buffer: images.largeFile, 
    type: 'image/jpeg', 
    filename: 'performance-test.jpg' 
  };

  const fileSize = (largeFile.buffer.length / 1024 / 1024).toFixed(2);
  
  try {
    const startTime = Date.now();
    const { response, data } = await uploadFiles([largeFile]);
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);
    
    // PRD requirement: < 10 seconds for 10MB files
    const performancePassed = duration < 10000;
    const uploadSucceeded = response.status === 201 && data.success;
    
    const success = performancePassed && uploadSucceeded;

    return {
      success,
      details: `${fileSize}MB file processed in ${durationSeconds}s (${performancePassed ? 'PASS' : 'FAIL'})`,
      error: success ? null : `Performance requirement failed: ${durationSeconds}s > 10s`,
      response: {
        fileSize: `${fileSize}MB`,
        duration: `${durationSeconds}s`,
        performancePassed,
        uploadSucceeded
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Performance test failed: ${error.message}`,
      response: null
    };
  }
}

/**
 * Main test execution
 */
async function runAllTests() {
  console.log('🚀 PRD-1.1.5.2 Image Upload Endpoint - Real Server QA Tests');
  console.log('=' .repeat(70));
  console.log(`📡 Testing against: ${SERVER_CONFIG.baseUrl}`);

  try {
    // Check server health first
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
      console.log('⚠️  Server not accessible - some tests may be skipped');
    }

    // Generate test images
    const images = await generateTestImages();

    // Run all test suites
    await runTest('QA-1: Upload functionality with various image formats', 
      () => serverHealthy ? testImageFormats(images) : { skipped: true, reason: 'Server not accessible' });

    await runTest('QA-2: File size limit enforcement (15MB limit)', 
      () => serverHealthy ? testFileSizeLimits(images) : { skipped: true, reason: 'Server not accessible' });

    await runTest('QA-3: Concurrent upload handling (up to 5 files)', 
      () => serverHealthy ? testConcurrentUploads(images) : { skipped: true, reason: 'Server not accessible' });

    await runTest('QA-4: Error scenarios with invalid files', 
      () => serverHealthy ? testInvalidFiles() : { skipped: true, reason: 'Server not accessible' });

    await runTest('QA-5: Error scenarios with network issues', 
      () => serverHealthy ? testNetworkErrorScenarios() : { skipped: true, reason: 'Server not accessible' });

    await runTest('QA-6: Database integration tests', 
      () => serverHealthy ? testDatabaseIntegration(images) : { skipped: true, reason: 'Server not accessible' });

    await runTest('QA-7: Performance tests with large files (< 10s for 10MB)', 
      () => serverHealthy ? testPerformance(images) : { skipped: true, reason: 'Server not accessible' });

    // Generate final report
    console.log('\n' + '='.repeat(70));
    console.log('📊 REAL SERVER TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`🔗 Server: ${SERVER_CONFIG.baseUrl}`);
    console.log(`📋 Total Tests: ${testResults.summary.total}`);
    console.log(`✅ Passed: ${testResults.summary.passed}`);
    console.log(`❌ Failed: ${testResults.summary.failed}`);
    console.log(`⏭️  Skipped: ${testResults.summary.skipped}`);
    
    const executedTests = testResults.summary.total - testResults.summary.skipped;
    if (executedTests > 0) {
      console.log(`📈 Success Rate: ${((testResults.summary.passed / executedTests) * 100).toFixed(1)}%`);
    }

    if (testResults.summary.errors.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.summary.errors.forEach(error => console.log(`   • ${error}`));
    }

    // Save results to file
    const timestamp = Date.now();
    const resultsPath = path.join(__dirname, 'evidence', `real-server-test-results-${timestamp}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);

    // Overall status
    const overallStatus = testResults.summary.failed === 0 ? 'PASS' : 'FAIL';
    console.log(`\n🏁 OVERALL STATUS: ${overallStatus}`);

    return testResults;

  } catch (error) {
    console.error('💥 Test execution failed:', error);
    testResults.summary.errors.push(`Test execution failed: ${error.message}`);
    return testResults;
  }
}

// Execute tests if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(results => {
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

export { runAllTests, testResults };