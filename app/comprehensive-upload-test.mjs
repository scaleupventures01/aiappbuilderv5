#!/usr/bin/env node

/**
 * Comprehensive File Upload Test Script
 * Tests the complete upload workflow including authentication
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { config } from 'dotenv';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { generateAccessToken } from './utils/jwt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: '.env.development' });

const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  id: '896a9378-15ff-43ac-825a-0c1e84ba5c6b',
  email: 'test@example.com',
  username: 'testuser',
  subscription_tier: 'founder'
};

class UploadTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
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

  async testServerHealth() {
    return this.test('Server Health Check', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`Server health check failed: ${response.status}`);
      }
      const data = await response.json();
      return data;
    });
  }

  async testTokenGeneration() {
    return this.test('JWT Token Generation', async () => {
      const token = generateAccessToken(TEST_USER);
      if (!token || typeof token !== 'string') {
        throw new Error('Failed to generate valid token');
      }
      this.log(`Generated token: ${token.substring(0, 50)}...`, 'info');
      return token;
    });
  }

  async testFileExists() {
    return this.test('Test File Existence', async () => {
      const testFile = 'test-chart-bullish.png';
      if (!existsSync(testFile)) {
        throw new Error(`Test file not found: ${testFile}`);
      }
      const stats = require('fs').statSync(testFile);
      this.log(`Test file size: ${stats.size} bytes`, 'info');
      return testFile;
    });
  }

  async testUploadAuthentication(token) {
    return this.test('Upload Authentication', async () => {
      // Test without token first
      const response1 = await fetch(`${BASE_URL}/api/upload/images`, {
        method: 'POST',
        body: new FormData()
      });
      
      if (response1.status !== 401) {
        throw new Error(`Expected 401 without token, got ${response1.status}`);
      }

      // Test with invalid token
      const response2 = await fetch(`${BASE_URL}/api/upload/images`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid_token'
        },
        body: new FormData()
      });

      if (response2.status !== 401) {
        throw new Error(`Expected 401 with invalid token, got ${response2.status}`);
      }

      return { 
        noTokenStatus: response1.status,
        invalidTokenStatus: response2.status 
      };
    });
  }

  async testFileUpload(token, testFile) {
    return this.test('File Upload to Cloudinary', async () => {
      const form = new FormData();
      const fileBuffer = readFileSync(testFile);
      
      form.append('file', fileBuffer, {
        filename: 'test-chart.png',
        contentType: 'image/png'
      });
      
      form.append('metadata', JSON.stringify({
        type: 'chart',
        description: 'Test trading chart upload',
        userId: TEST_USER.id
      }));

      const response = await fetch(`${BASE_URL}/api/upload/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...form.getHeaders()
        },
        body: form
      });

      const responseText = await response.text();
      this.log(`Upload response status: ${response.status}`, 'info');
      this.log(`Upload response: ${responseText}`, 'info');

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      
      if (!data.success) {
        throw new Error(`Upload failed: ${data.error || 'Unknown error'}`);
      }

      if (!data.data?.url) {
        throw new Error('Upload succeeded but no Cloudinary URL returned');
      }

      this.log(`Cloudinary URL: ${data.data.url}`, 'success');
      return data;
    });
  }

  async testDatabasePersistence(uploadData) {
    return this.test('Database Persistence Verification', async () => {
      // Query database to verify upload was saved
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL_MODE === 'require'
      });

      try {
        const result = await pool.query(
          'SELECT * FROM uploads WHERE url = $1 ORDER BY created_at DESC LIMIT 1',
          [uploadData.data.url]
        );

        if (result.rows.length === 0) {
          throw new Error('Upload not found in database');
        }

        const record = result.rows[0];
        this.log(`Database record ID: ${record.id}`, 'info');
        this.log(`Database user ID: ${record.user_id}`, 'info');
        
        return record;
      } finally {
        await pool.end();
      }
    });
  }

  async testImageAccessibility(url) {
    return this.test('Cloudinary Image Accessibility', async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Image not accessible: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      this.log(`Image content type: ${contentType}`, 'info');
      return { status: response.status, contentType };
    });
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Upload Testing...', 'info');
    
    try {
      // Test 1: Server Health
      await this.testServerHealth();

      // Test 2: Token Generation
      const token = await this.testTokenGeneration();

      // Test 3: File Existence
      const testFile = await this.testFileExists();

      // Test 4: Authentication
      await this.testUploadAuthentication(token);

      // Test 5: File Upload
      const uploadData = await this.testFileUpload(token, testFile);

      // Test 6: Database Persistence
      const dbRecord = await this.testDatabasePersistence(uploadData);

      // Test 7: Image Accessibility
      await this.testImageAccessibility(uploadData.data.url);

      this.log('🎉 All tests completed successfully!', 'success');
      
    } catch (error) {
      this.log(`💥 Test suite failed: ${error.message}`, 'error');
    }

    // Print summary
    console.log('\n📊 TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    return this.results;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new UploadTester();
  tester.runAllTests()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

export default UploadTester;
