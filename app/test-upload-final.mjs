#!/usr/bin/env node

/**
 * Final Upload Integration Test
 * Tests upload endpoints, authentication, and end-to-end functionality
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const API_BASE_URL = 'http://localhost:3002';

// Generate fresh token
const testUser = {
  id: '896a9378-15ff-43ac-825a-0c1e84ba5c6b',
  email: 'test@example.com',
  username: 'testuser'
};

async function generateToken() {
  const { generateAccessToken } = await import('./utils/jwt.js');
  return generateAccessToken(testUser);
}

// Test functions
async function testHealthEndpoint() {
  console.log('\n📊 Testing Health Endpoints...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health/upload`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Upload health check passed');
      console.log('  - Database:', result.data.components.database.status);
      console.log('  - Cloudinary:', result.data.components.cloudinary.status);
      console.log('  - Upload Service:', result.data.components.uploadService.status);
      return true;
    } else {
      console.log('❌ Upload health check failed:', result.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    // Test without token
    const noAuthResponse = await fetch(`${API_BASE_URL}/api/upload/images`, {
      method: 'POST'
    });
    
    if (noAuthResponse.status === 401) {
      console.log('✅ Authentication requirement enforced');
    } else {
      console.log('❌ Authentication not required - this is wrong!');
      return false;
    }
    
    // Test with invalid token
    const badTokenResponse = await fetch(`${API_BASE_URL}/api/upload/images`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    if (badTokenResponse.status === 401) {
      console.log('✅ Invalid token properly rejected');
      return true;
    } else {
      console.log('❌ Invalid token accepted - this is wrong!');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Authentication test error:', error.message);
    return false;
  }
}

async function testUploadFlow() {
  console.log('\n📤 Testing Upload Flow...');
  
  try {
    const token = await generateToken();
    console.log('🔑 Generated fresh token');
    
    // Create a test image
    const testImage = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect width="100" height="100" fill="#4CAF50"/>
      <text x="50" y="50" text-anchor="middle" fill="white" dy=".3em">TEST</text>
    </svg>`;
    
    fs.writeFileSync('test-upload.svg', testImage);
    
    // Create form data
    const formData = new FormData();
    const fileStream = fs.createReadStream('test-upload.svg');
    formData.append('images', fileStream, 'test-upload.svg');
    formData.append('context', 'test');
    
    // Make upload request
    const response = await fetch(`${API_BASE_URL}/api/upload/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const result = await response.json();
    
    // Clean up test file
    try { fs.unlinkSync('test-upload.svg'); } catch {}
    
    if (response.ok && result.success) {
      console.log('✅ Upload successful!');
      console.log('  - Upload ID:', result.data.uploads[0].id);
      console.log('  - Secure URL:', result.data.uploads[0].secureUrl);
      return { success: true, uploadId: result.data.uploads[0].id };
    } else {
      console.log('❌ Upload failed:', result.error || result.message);
      console.log('  - Status:', response.status);
      console.log('  - Response:', result);
      return { success: false };
    }
    
  } catch (error) {
    console.log('❌ Upload test error:', error.message);
    return { success: false };
  }
}

async function runTests() {
  console.log('🧪 Elite Trading Coach AI - Upload Integration Test Suite');
  console.log('=' .repeat(60));
  
  const results = {};
  
  results.health = await testHealthEndpoint();
  results.auth = await testAuthentication();
  results.upload = await testUploadFlow();
  
  console.log('\n📋 Test Results Summary');
  console.log('=' .repeat(60));
  console.log('Health Endpoints:', results.health ? '✅ PASS' : '❌ FAIL');
  console.log('Authentication:', results.auth ? '✅ PASS' : '❌ FAIL');
  console.log('Upload Flow:', results.upload.success ? '✅ PASS' : '❌ FAIL');
  
  const passed = Object.values(results).filter(r => r === true || r.success).length;
  const total = 3;
  
  console.log(`\n🎯 Total: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Upload integration is working correctly.');
    process.exit(0);
  } else {
    console.log('🚫 Some tests failed. Upload integration needs attention.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});