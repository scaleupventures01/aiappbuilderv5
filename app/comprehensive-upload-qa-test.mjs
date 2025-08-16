#!/usr/bin/env node

/**
 * Comprehensive Upload QA Test Suite
 * Tests complete end-to-end upload workflow with edge cases
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// Load environment variables like server
config();
config({ path: '.env.development' });

const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  id: '896a9378-15ff-43ac-825a-0c1e84ba5c6b',
  email: 'test@example.com',
  username: 'testuser',
  subscription_tier: 'founder'
};

class UploadQATester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: [],
      uploadedFiles: []
    };
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
      max: 20
    });
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const icons = { info: '📋', success: '✅', error: '❌', warning: '⚠️' };
    console.log(`${icons[type]} [${timestamp}] ${message}`);
  }

  async test(name, testFn) {
    this.log(`Testing: ${name}`, 'info');
    try {
      const result = await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'passed', result });
      this.log(`✓ ${name}`, 'success');
      return result;
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'failed', error: error.message });
      this.log(`✗ ${name}: ${error.message}`, 'error');
      throw error;
    }
  }

  async generateToken() {
    const { generateAccessToken } = await import('./utils/jwt.js');
    return generateAccessToken(TEST_USER);
  }

  async testAuthenticationEdgeCases() {
    return this.test('Authentication Edge Cases', async () => {
      // Test 1: No token
      const response1 = await fetch(`${BASE_URL}/api/upload/images`, {
        method: 'POST',
        body: new FormData()
      });
      
      if (response1.status !== 401) {
        throw new Error(`Expected 401 without token, got ${response1.status}`);
      }

      // Test 2: Invalid token
      const response2 = await fetch(`${BASE_URL}/api/upload/images`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer invalid_token' },
        body: new FormData()
      });

      if (response2.status !== 401) {
        throw new Error(`Expected 401 with invalid token, got ${response2.status}`);
      }

      // Test 3: Malformed Authorization header
      const response3 = await fetch(`${BASE_URL}/api/upload/images`, {
        method: 'POST',
        headers: { 'Authorization': 'InvalidFormat token' },
        body: new FormData()
      });

      if (response3.status !== 401) {
        throw new Error(`Expected 401 with malformed header, got ${response3.status}`);
      }

      return { noToken: response1.status, invalidToken: response2.status, malformedHeader: response3.status };
    });
  }

  async testFileValidation() {
    return this.test('File Validation', async () => {
      const token = await this.generateToken();
      
      // Test 1: No files provided
      const form1 = new FormData();
      form1.append('context', 'testing');
      
      const response1 = await fetch(`${BASE_URL}/api/upload/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...form1.getHeaders()
        },
        body: form1
      });

      if (response1.status !== 400) {
        throw new Error(`Expected 400 for no files, got ${response1.status}`);
      }

      return { noFiles: response1.status };
    });
  }

  async testSingleFileUpload() {
    return this.test('Single File Upload', async () => {
      const token = await this.generateToken();
      const form = new FormData();
      const fileBuffer = readFileSync('test-chart-bullish.png');
      
      form.append('images', fileBuffer, {
        filename: 'single-test-chart.png',
        contentType: 'image/png'
      });
      form.append('context', 'qa-testing');
      form.append('conversationId', 'test-conversation-123');

      const response = await fetch(`${BASE_URL}/api/upload/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...form.getHeaders()
        },
        body: form
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data?.uploads?.length) {
        throw new Error('Upload response missing success data');
      }

      const upload = data.data.uploads[0];
      this.results.uploadedFiles.push(upload);

      return {
        uploadId: upload.id,
        cloudinaryUrl: upload.secureUrl,
        originalName: upload.originalName,
        totalUploaded: data.data.totalUploaded
      };
    });
  }

  async testDatabasePersistence(uploadData) {
    return this.test('Database Persistence', async () => {
      const result = await this.pool.query(
        'SELECT * FROM uploads WHERE id = $1',
        [uploadData.uploadId]
      );

      if (result.rows.length === 0) {
        throw new Error('Upload not found in database');
      }

      const record = result.rows[0];
      
      return {
        id: record.id,
        userId: record.user_id,
        originalFilename: record.original_filename,
        secureUrl: record.secure_url,
        createdAt: record.created_at
      };
    });
  }

  async testCloudinaryAccessibility(url) {
    return this.test('Cloudinary Image Accessibility', async () => {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Image not accessible: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      return {
        status: response.status,
        contentType,
        contentLength: response.headers.get('content-length')
      };
    });
  }

  async testUploadRetrieval(uploadId) {
    return this.test('Upload Retrieval API', async () => {
      const token = await this.generateToken();
      
      const response = await fetch(`${BASE_URL}/api/upload/images/${uploadId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to retrieve upload: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Retrieval response missing data');
      }

      return data.data;
    });
  }

  async testHealthEndpoint() {
    return this.test('Upload Health Endpoint', async () => {
      const response = await fetch(`${BASE_URL}/health/upload`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data?.components?.uploadService) {
        throw new Error('Health check missing upload service status');
      }

      return data.data.components;
    });
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Upload QA Testing...', 'info');
    
    try {
      // Test 1: Health Check
      await this.testHealthEndpoint();

      // Test 2: Authentication Edge Cases
      await this.testAuthenticationEdgeCases();

      // Test 3: File Validation
      await this.testFileValidation();

      // Test 4: Single File Upload
      const uploadData = await this.testSingleFileUpload();

      // Test 5: Database Persistence
      await this.testDatabasePersistence(uploadData);

      // Test 6: Cloudinary Accessibility
      await this.testCloudinaryAccessibility(uploadData.cloudinaryUrl);

      // Test 7: Upload Retrieval
      await this.testUploadRetrieval(uploadData.uploadId);

      this.log('🎉 All tests completed successfully!', 'success');
      
    } catch (error) {
      this.log(`💥 Test suite failed: ${error.message}`, 'error');
    } finally {
      await this.pool.end();
    }

    return this.generateReport();
  }

  generateReport() {
    const report = {
      summary: {
        total: this.results.passed + this.results.failed,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: `${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`
      },
      tests: this.results.tests,
      uploadedFiles: this.results.uploadedFiles,
      timestamp: new Date().toISOString()
    };

    console.log('\n📊 COMPREHENSIVE QA TEST REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Tests Passed: ${report.summary.passed}`);
    console.log(`❌ Tests Failed: ${report.summary.failed}`);
    console.log(`📈 Success Rate: ${report.summary.successRate}`);
    console.log(`📁 Files Uploaded: ${report.uploadedFiles.length}`);
    
    return report;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new UploadQATester();
  tester.runAllTests()
    .then(report => {
      process.exit(report.summary.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

export default UploadQATester;
