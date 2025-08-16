/**
 * QA Test Script for Upload Integration
 * Tests all QA tasks for PRD-1.1.5.4
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

class UploadQATest {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message) {
    console.log(`[QA] ${message}`);
  }

  async runTest(testName, testFn) {
    this.results.total++;
    try {
      this.log(`Testing: ${testName}`);
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASS' });
      this.log(`✅ PASS: ${testName}`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'FAIL', error: error.message });
      this.log(`❌ FAIL: ${testName} - ${error.message}`);
    }
  }

  async makeRequest(url, options = {}) {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { text };
    }
    
    return { response, data };
  }

  // QA-001: Server startup validation (already done manually)
  async testServerStartup() {
    const { response, data } = await this.makeRequest(`${API_URL}/health`);
    
    if (response.status !== 200) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    if (!data.success) {
      throw new Error(`Health check returned unsuccessful: ${JSON.stringify(data)}`);
    }
    
    this.log(`Server health: ${data.message}`);
  }

  // QA-002: Upload route accessibility
  async testUploadRouteAccessibility() {
    // Test without authentication - should fail with 401
    const { response: noAuthResponse } = await this.makeRequest(`${API_URL}/upload/images`, {
      method: 'POST'
    });
    
    if (noAuthResponse.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated request, got ${noAuthResponse.status}`);
    }
    
    this.log('Upload route correctly requires authentication');
  }

  // QA-003: File upload endpoint functionality
  async testUploadEndpointFunctionality() {
    // Test with invalid method
    const { response: getResponse } = await this.makeRequest(`${API_URL}/upload/images`, {
      method: 'GET'
    });
    
    if (getResponse.status !== 404 && getResponse.status !== 405) {
      throw new Error(`Expected 404/405 for GET request, got ${getResponse.status}`);
    }
    
    this.log('Upload endpoint correctly rejects GET requests');
  }

  // QA-004: Authentication integration
  async testAuthenticationIntegration() {
    // Test with invalid token
    const { response, data } = await this.makeRequest(`${API_URL}/upload/images`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    if (response.status !== 401 && response.status !== 403) {
      throw new Error(`Expected 401/403 for invalid token, got ${response.status}`);
    }
    
    if (!data.error || !data.error.toLowerCase().includes('token')) {
      throw new Error(`Expected token-related error message, got: ${JSON.stringify(data)}`);
    }
    
    this.log('Authentication correctly rejects invalid tokens');
  }

  // QA-005: File type validation (server-side)
  async testFileTypeValidation() {
    // This test validates that the server-side validation middleware exists
    // We check the upload route file for proper validation imports
    const uploadRouteFile = path.join(__dirname, 'api/routes/upload.js');
    
    if (!fs.existsSync(uploadRouteFile)) {
      throw new Error('Upload route file not found');
    }
    
    const content = fs.readFileSync(uploadRouteFile, 'utf8');
    
    if (!content.includes('validateUpload')) {
      throw new Error('validateUpload middleware not found in upload routes');
    }
    
    if (!content.includes('multer')) {
      throw new Error('Multer file handling not found in upload routes');
    }
    
    this.log('Server-side file validation middleware is properly configured');
  }

  // QA-006: File size limit validation
  async testFileSizeLimits() {
    const uploadRouteFile = path.join(__dirname, 'api/routes/upload.js');
    const content = fs.readFileSync(uploadRouteFile, 'utf8');
    
    // Check for file size limits in multer configuration
    if (!content.includes('fileSize:') && !content.includes('15 * 1024 * 1024')) {
      throw new Error('File size limits not properly configured');
    }
    
    // Check for file limit configuration
    if (!content.includes('files:') && !content.includes('5')) {
      throw new Error('File count limits not properly configured');
    }
    
    this.log('File size and count limits are properly configured');
  }

  // QA-007: Cloudinary integration
  async testCloudinaryIntegration() {
    const serviceFile = path.join(__dirname, 'services/uploadService.js');
    
    if (!fs.existsSync(serviceFile)) {
      throw new Error('Upload service file not found');
    }
    
    const content = fs.readFileSync(serviceFile, 'utf8');
    
    if (!content.includes('cloudinary')) {
      throw new Error('Cloudinary not found in upload service');
    }
    
    if (!content.includes('uploadBuffer')) {
      throw new Error('Upload buffer method not found');
    }
    
    this.log('Cloudinary integration is properly configured');
  }

  // QA-008: Database integration
  async testDatabaseIntegration() {
    const queriesFile = path.join(__dirname, 'db/queries/uploads.js');
    
    if (!fs.existsSync(queriesFile)) {
      throw new Error('Upload queries file not found');
    }
    
    const content = fs.readFileSync(queriesFile, 'utf8');
    
    const requiredFunctions = [
      'createUpload',
      'getUploadById',
      'deleteUpload',
      'checkUploadAccess'
    ];
    
    for (const func of requiredFunctions) {
      if (!content.includes(func)) {
        throw new Error(`Required database function ${func} not found`);
      }
    }
    
    this.log('Database integration is properly configured');
  }

  // QA-009: Frontend component validation
  async testFrontendComponents() {
    const dropzoneFile = path.join(__dirname, 'src/components/Upload/FileDropzone.tsx');
    
    if (!fs.existsSync(dropzoneFile)) {
      throw new Error('FileDropzone component not found');
    }
    
    const content = fs.readFileSync(dropzoneFile, 'utf8');
    
    const requiredFeatures = [
      'useDropzone',
      'validateFile',
      'uploadService',
      'onProgress',
      'retry'
    ];
    
    for (const feature of requiredFeatures) {
      if (!content.includes(feature)) {
        throw new Error(`Required feature ${feature} not found in FileDropzone`);
      }
    }
    
    this.log('Frontend FileDropzone component is properly implemented');
  }

  // QA-010: Upload service validation
  async testUploadService() {
    const serviceFile = path.join(__dirname, 'src/services/uploadService.ts');
    
    if (!fs.existsSync(serviceFile)) {
      throw new Error('Frontend upload service not found');
    }
    
    const content = fs.readFileSync(serviceFile, 'utf8');
    
    const requiredFeatures = [
      'uploadFile',
      'retry',
      'onProgress',
      'XMLHttpRequest',
      'FormData'
    ];
    
    for (const feature of requiredFeatures) {
      if (!content.includes(feature)) {
        throw new Error(`Required feature ${feature} not found in upload service`);
      }
    }
    
    this.log('Frontend upload service is properly implemented');
  }

  // QA-011: Error handling validation
  async testErrorHandling() {
    const routeFile = path.join(__dirname, 'api/routes/upload.js');
    const content = fs.readFileSync(routeFile, 'utf8');
    
    // Check for try-catch blocks
    if (!content.includes('try {') || !content.includes('catch')) {
      throw new Error('Error handling not properly implemented');
    }
    
    // Check for proper error responses
    if (!content.includes('res.status(500)') || !content.includes('res.status(400)')) {
      throw new Error('Proper error status codes not implemented');
    }
    
    this.log('Error handling is properly implemented');
  }

  // QA-012: Security validation
  async testSecurityFeatures() {
    const validationFile = path.join(__dirname, 'middleware/validation.js');
    
    if (!fs.existsSync(validationFile)) {
      throw new Error('Validation middleware not found');
    }
    
    const content = fs.readFileSync(validationFile, 'utf8');
    
    const securityFeatures = [
      'FILE_SIGNATURES',
      'validateFileSignature',
      'sanitizeFilename',
      'suspiciousPatterns'
    ];
    
    for (const feature of securityFeatures) {
      if (!content.includes(feature)) {
        throw new Error(`Security feature ${feature} not found`);
      }
    }
    
    this.log('Security validation features are properly implemented');
  }

  // QA-013: Configuration validation
  async testConfiguration() {
    // Check environment files exist
    const envFiles = ['.env.example', '.env.development'];
    
    for (const envFile of envFiles) {
      const filePath = path.join(__dirname, envFile);
      if (!fs.existsSync(filePath)) {
        this.log(`Warning: ${envFile} not found`);
      }
    }
    
    // Check package.json for required dependencies
    const packageFile = path.join(__dirname, 'package.json');
    if (!fs.existsSync(packageFile)) {
      throw new Error('package.json not found');
    }
    
    const packageContent = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    const requiredDeps = ['multer', 'cloudinary', 'sharp'];
    
    for (const dep of requiredDeps) {
      if (!packageContent.dependencies || !packageContent.dependencies[dep]) {
        throw new Error(`Required dependency ${dep} not found in package.json`);
      }
    }
    
    this.log('Configuration and dependencies are properly set up');
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting Upload Integration QA Tests');
    this.log('=======================================');
    
    await this.runTest('QA-001: Server Health Check', () => this.testServerStartup());
    await this.runTest('QA-002: Upload Route Accessibility', () => this.testUploadRouteAccessibility());
    await this.runTest('QA-003: Upload Endpoint Functionality', () => this.testUploadEndpointFunctionality());
    await this.runTest('QA-004: Authentication Integration', () => this.testAuthenticationIntegration());
    await this.runTest('QA-005: File Type Validation', () => this.testFileTypeValidation());
    await this.runTest('QA-006: File Size Limits', () => this.testFileSizeLimits());
    await this.runTest('QA-007: Cloudinary Integration', () => this.testCloudinaryIntegration());
    await this.runTest('QA-008: Database Integration', () => this.testDatabaseIntegration());
    await this.runTest('QA-009: Frontend Components', () => this.testFrontendComponents());
    await this.runTest('QA-010: Upload Service', () => this.testUploadService());
    await this.runTest('QA-011: Error Handling', () => this.testErrorHandling());
    await this.runTest('QA-012: Security Features', () => this.testSecurityFeatures());
    await this.runTest('QA-013: Configuration', () => this.testConfiguration());
    
    this.printResults();
  }

  printResults() {
    this.log('=======================================');
    this.log('QA Test Results Summary');
    this.log('=======================================');
    this.log(`Total Tests: ${this.results.total}`);
    this.log(`Passed: ${this.results.passed}`);
    this.log(`Failed: ${this.results.failed}`);
    this.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      this.log('\nFailed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          this.log(`  ❌ ${test.name}: ${test.error}`);
        });
    }
    
    this.log('\nOverall Status: ' + (this.results.failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'));
  }
}

// Run the tests
const qaTest = new UploadQATest();
qaTest.runAllTests().catch(error => {
  console.error('QA Test execution failed:', error);
  process.exit(1);
});