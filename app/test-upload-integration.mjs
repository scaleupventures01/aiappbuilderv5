#!/usr/bin/env node

/**
 * Test script for image upload endpoint integration
 * Tests the full upload flow from FileDropzone to backend API
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backend API configuration
const API_BASE_URL = 'http://localhost:3002';
const UPLOAD_ENDPOINT = '/api/upload/images';

// Test configuration
const testConfig = {
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OTZhOTM3OC0xNWZmLTQzYWMtODI1YS0wYzFlODRiYTVjNmIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc1NTIyMzg1NywiZXhwIjoxNzU1MjI0NzU3LCJhdWQiOiJlbGl0ZS10cmFkaW5nLWNvYWNoLXVzZXJzIiwiaXNzIjoiZWxpdGUtdHJhZGluZy1jb2FjaC1haSJ9.XvsG0hTmTailycR8PtVEXMGRxTgajhAKTXzWvjmBqBY',
  testImagePath: path.join(__dirname, 'public', 'vite.svg'), // Using existing file
  conversationId: 'test-conversation-123',
  context: 'chat'
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

/**
 * Test the upload endpoint directly
 */
async function testDirectUpload() {
  console.log(`${colors.blue}Testing Direct Upload to Backend...${colors.reset}`);
  
  try {
    // Check if test file exists
    if (!fs.existsSync(testConfig.testImagePath)) {
      console.log(`${colors.yellow}Test file not found. Creating a test image...${colors.reset}`);
      
      // Create a simple test SVG file
      const testSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <rect width="100" height="100" fill="#4CAF50"/>
        <text x="50" y="50" text-anchor="middle" fill="white">TEST</text>
      </svg>`;
      
      const testImagePath = path.join(__dirname, 'test-image.svg');
      fs.writeFileSync(testImagePath, testSvg);
      testConfig.testImagePath = testImagePath;
    }
    
    // Create form data
    const formData = new FormData();
    const fileStream = fs.createReadStream(testConfig.testImagePath);
    formData.append('images', fileStream, 'test-image.svg');
    formData.append('conversationId', testConfig.conversationId);
    formData.append('context', testConfig.context);
    
    // Make upload request
    console.log(`${colors.blue}Uploading to: ${API_BASE_URL}${UPLOAD_ENDPOINT}${colors.reset}`);
    
    const response = await fetch(`${API_BASE_URL}${UPLOAD_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testConfig.authToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`${colors.green}✓ Upload successful!${colors.reset}`);
      console.log(`${colors.green}  - Upload ID: ${result.data.uploads[0].id}${colors.reset}`);
      console.log(`${colors.green}  - Secure URL: ${result.data.uploads[0].secureUrl}${colors.reset}`);
      console.log(`${colors.green}  - Thumbnail: ${result.data.uploads[0].thumbnailUrl}${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Upload failed:${colors.reset}`, result.error || result);
      return false;
    }
    
  } catch (error) {
    console.log(`${colors.red}✗ Test failed with error:${colors.reset}`, error.message);
    
    // Check if backend is running
    if (error.message.includes('ECONNREFUSED')) {
      console.log(`${colors.yellow}⚠ Backend server is not running on port 3001${colors.reset}`);
      console.log(`${colors.yellow}  Run 'npm run server' to start the backend${colors.reset}`);
    }
    
    return false;
  }
}

/**
 * Test authentication requirement
 */
async function testAuthenticationRequired() {
  console.log(`\n${colors.blue}Testing Authentication Requirement...${colors.reset}`);
  
  try {
    const formData = new FormData();
    const testBuffer = Buffer.from('test');
    formData.append('images', testBuffer, 'test.jpg');
    
    const response = await fetch(`${API_BASE_URL}${UPLOAD_ENDPOINT}`, {
      method: 'POST',
      headers: formData.getHeaders(),
      body: formData
    });
    
    if (response.status === 401) {
      console.log(`${colors.green}✓ Authentication properly enforced (401 returned)${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Authentication not enforced! Status: ${response.status}${colors.reset}`);
      return false;
    }
    
  } catch (error) {
    console.log(`${colors.red}✗ Auth test failed:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Test file validation
 */
async function testFileValidation() {
  console.log(`\n${colors.blue}Testing File Validation...${colors.reset}`);
  
  try {
    const formData = new FormData();
    const invalidFile = Buffer.from('invalid content');
    formData.append('images', invalidFile, 'test.exe');
    
    const response = await fetch(`${API_BASE_URL}${UPLOAD_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testConfig.authToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok && (response.status === 400 || response.status === 415)) {
      console.log(`${colors.green}✓ Invalid file properly rejected${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Invalid file was not rejected!${colors.reset}`);
      return false;
    }
    
  } catch (error) {
    console.log(`${colors.red}✗ Validation test failed:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.yellow}========================================${colors.reset}`);
  console.log(`${colors.yellow}Image Upload Integration Test Suite${colors.reset}`);
  console.log(`${colors.yellow}========================================${colors.reset}\n`);
  
  const results = {
    directUpload: false,
    authentication: false,
    validation: false
  };
  
  // Run tests
  results.authentication = await testAuthenticationRequired();
  results.validation = await testFileValidation();
  results.directUpload = await testDirectUpload();
  
  // Summary
  console.log(`\n${colors.yellow}========================================${colors.reset}`);
  console.log(`${colors.yellow}Test Results Summary${colors.reset}`);
  console.log(`${colors.yellow}========================================${colors.reset}`);
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log(`Authentication: ${results.authentication ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`File Validation: ${results.validation ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`Direct Upload: ${results.directUpload ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  
  console.log(`\n${colors.yellow}Total: ${passed}/${total} tests passed${colors.reset}`);
  
  if (passed === total) {
    console.log(`${colors.green}✓ All tests passed! Upload integration is working.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Some tests failed. Please check the implementation.${colors.reset}`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});