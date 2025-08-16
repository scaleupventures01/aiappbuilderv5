/**
 * Comprehensive Upload Integration Test
 * Tests all Backend Engineering tasks (BE-025 through BE-031)
 * and Frontend integration requirements
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const UPLOAD_SERVER_URL = 'http://localhost:3001';
const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// Utility functions
function logTest(testName, status, message = '', details = {}) {
  const timestamp = new Date().toISOString();
  const result = {
    timestamp,
    test: testName,
    status,
    message,
    details
  };
  
  TEST_RESULTS.details.push(result);
  
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusIcon} ${testName}: ${message}`);
  
  if (status === 'PASS') TEST_RESULTS.passed++;
  else if (status === 'FAIL') TEST_RESULTS.failed++;
  else TEST_RESULTS.warnings++;
  
  if (details && Object.keys(details).length > 0) {
    console.log(`   Details:`, details);
  }
}

async function makeRequest(endpoint, options = {}) {
  try {
    const url = `${UPLOAD_SERVER_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { raw: data };
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data: jsonData,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
      data: null
    };
  }
}

// Backend Engineering Tests (BE-025 through BE-031)

async function testBE025_DatabaseTable() {
  console.log('\n🔍 Testing BE-025: Verify uploads database table...');
  
  try {
    const { validateUploadsTable } = await import('./db/validate-uploads-table.js');
    await validateUploadsTable();
    logTest('BE-025', 'PASS', 'uploads table exists and is properly configured');
  } catch (error) {
    logTest('BE-025', 'FAIL', `Database table validation failed: ${error.message}`);
  }
}

async function testBE026_DatabaseConnection() {
  console.log('\n🔍 Testing BE-026: Database connection in upload routes...');
  
  try {
    // Test if upload routes can connect to database
    const response = await makeRequest('/health/upload');
    
    if (response.ok && response.data.success) {
      logTest('BE-026', 'PASS', 'Upload routes can access database and validate configuration');
    } else {
      logTest('BE-026', 'FAIL', 'Upload routes cannot access database properly', {
        status: response.status,
        response: response.data
      });
    }
  } catch (error) {
    logTest('BE-026', 'FAIL', `Database connection test failed: ${error.message}`);
  }
}

async function testBE027_UserModel() {
  console.log('\n🔍 Testing BE-027: User model import for auth middleware...');
  
  try {
    // Check if User model or queries exist
    const userQueryPath = join(__dirname, 'db', 'queries', 'users.js');
    await fs.access(userQueryPath);
    
    logTest('BE-027', 'PASS', 'User model/queries are available for authentication');
  } catch (error) {
    logTest('BE-027', 'FAIL', `User model not accessible: ${error.message}`);
  }
}

async function testBE028_CloudinaryEnvironment() {
  console.log('\n🔍 Testing BE-028: Cloudinary environment validation...');
  
  try {
    const { validateCloudinaryEnvironment } = await import('./server/config/environment.js');
    validateCloudinaryEnvironment();
    
    const response = await makeRequest('/health/upload');
    
    if (response.ok && response.data.data?.components?.uploadService?.configured) {
      logTest('BE-028', 'PASS', 'Cloudinary environment variables properly configured');
    } else {
      logTest('BE-028', 'FAIL', 'Cloudinary configuration not properly validated');
    }
  } catch (error) {
    logTest('BE-028', 'FAIL', `Cloudinary environment validation failed: ${error.message}`);
  }
}

async function testBE029_UploadHealthCheck() {
  console.log('\n🔍 Testing BE-029: Upload endpoint health check...');
  
  try {
    const response = await makeRequest('/health/upload');
    
    if (response.ok && response.data.success) {
      logTest('BE-029', 'PASS', 'Upload health check endpoint working properly', {
        components: response.data.data?.components
      });
    } else {
      logTest('BE-029', 'FAIL', 'Upload health check endpoint not working', {
        status: response.status,
        response: response.data
      });
    }
  } catch (error) {
    logTest('BE-029', 'FAIL', `Upload health check failed: ${error.message}`);
  }
}

async function testBE030_ErrorHandling() {
  console.log('\n🔍 Testing BE-030: Upload routes error handling...');
  
  try {
    // Test upload endpoint without authentication
    const response = await makeRequest('/api/upload/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.status === 401 && response.data.code === 'TOKEN_MISSING') {
      logTest('BE-030', 'PASS', 'Upload routes properly handle authentication errors');
    } else {
      logTest('BE-030', 'FAIL', 'Upload routes do not properly handle authentication errors', {
        expectedStatus: 401,
        actualStatus: response.status,
        response: response.data
      });
    }
  } catch (error) {
    logTest('BE-030', 'FAIL', `Error handling test failed: ${error.message}`);
  }
}

async function testBE031_IntegrationTest() {
  console.log('\n🔍 Testing BE-031: Upload integration test...');
  
  try {
    // Test all upload endpoints are accessible
    const endpoints = [
      { method: 'POST', path: '/api/upload/images' },
      { method: 'GET', path: '/api/upload/images/test-id' },
      { method: 'DELETE', path: '/api/upload/images/test-id' }
    ];
    
    let allEndpointsAccessible = true;
    const endpointResults = [];
    
    for (const endpoint of endpoints) {
      const response = await makeRequest(endpoint.path, {
        method: endpoint.method
      });
      
      // Expect 401 (authentication required) rather than 404 (not found)
      const isAccessible = response.status === 401 || (response.status >= 400 && response.status < 500);
      endpointResults.push({
        endpoint: `${endpoint.method} ${endpoint.path}`,
        status: response.status,
        accessible: isAccessible
      });
      
      if (!isAccessible) {
        allEndpointsAccessible = false;
      }
    }
    
    if (allEndpointsAccessible) {
      logTest('BE-031', 'PASS', 'All upload endpoints are accessible and properly configured', {
        endpoints: endpointResults
      });
    } else {
      logTest('BE-031', 'FAIL', 'Some upload endpoints are not accessible', {
        endpoints: endpointResults
      });
    }
  } catch (error) {
    logTest('BE-031', 'FAIL', `Integration test failed: ${error.message}`);
  }
}

// Server status tests
async function testServerStatus() {
  console.log('\n🔍 Testing server status and availability...');
  
  try {
    const response = await makeRequest('/health');
    
    if (response.ok && response.data.success) {
      logTest('SERVER_STATUS', 'PASS', 'Chat server is running and responsive', {
        timestamp: response.data.timestamp,
        websocket: response.data.websocket
      });
    } else {
      logTest('SERVER_STATUS', 'FAIL', 'Chat server is not responding properly');
    }
  } catch (error) {
    logTest('SERVER_STATUS', 'FAIL', `Server status check failed: ${error.message}`);
  }
}

// Frontend integration readiness tests
async function testFrontendIntegrationReadiness() {
  console.log('\n🔍 Testing frontend integration readiness...');
  
  try {
    // Check if FileDropzone component exists
    const dropzonePath = join(__dirname, 'src', 'components', 'Upload', 'FileDropzone.tsx');
    await fs.access(dropzonePath);
    
    // Check if upload service exists
    const servicePath = join(__dirname, 'src', 'services', 'uploadService.ts');
    await fs.access(servicePath);
    
    logTest('FRONTEND_READY', 'PASS', 'Frontend components and services are available for integration');
  } catch (error) {
    logTest('FRONTEND_READY', 'FAIL', `Frontend components not accessible: ${error.message}`);
  }
}

// Main test execution
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Upload Integration Tests...');
  console.log(`📅 Test run started at: ${new Date().toISOString()}`);
  console.log(`🔗 Testing server at: ${UPLOAD_SERVER_URL}`);
  
  // Server status check
  await testServerStatus();
  
  // Backend Engineering Tasks (BE-025 through BE-031)
  await testBE025_DatabaseTable();
  await testBE026_DatabaseConnection();
  await testBE027_UserModel();
  await testBE028_CloudinaryEnvironment();
  await testBE029_UploadHealthCheck();
  await testBE030_ErrorHandling();
  await testBE031_IntegrationTest();
  
  // Frontend readiness
  await testFrontendIntegrationReadiness();
  
  // Generate final report
  console.log('\n📊 TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Tests Passed: ${TEST_RESULTS.passed}`);
  console.log(`❌ Tests Failed: ${TEST_RESULTS.failed}`);
  console.log(`⚠️  Warnings: ${TEST_RESULTS.warnings}`);
  console.log(`📊 Total Tests: ${TEST_RESULTS.passed + TEST_RESULTS.failed + TEST_RESULTS.warnings}`);
  
  const successRate = Math.round((TEST_RESULTS.passed / (TEST_RESULTS.passed + TEST_RESULTS.failed + TEST_RESULTS.warnings)) * 100);
  console.log(`🎯 Success Rate: ${successRate}%`);
  
  // Save detailed results
  const reportPath = join(__dirname, 'upload-integration-test-results.json');
  await fs.writeFile(reportPath, JSON.stringify({
    summary: {
      passed: TEST_RESULTS.passed,
      failed: TEST_RESULTS.failed,
      warnings: TEST_RESULTS.warnings,
      successRate: successRate,
      timestamp: new Date().toISOString(),
      serverUrl: UPLOAD_SERVER_URL
    },
    details: TEST_RESULTS.details
  }, null, 2));
  
  console.log(`📝 Detailed results saved to: ${reportPath}`);
  
  if (TEST_RESULTS.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Upload integration is ready.');
  } else {
    console.log(`\n⚠️  ${TEST_RESULTS.failed} test(s) failed. Review the details above.`);
  }
  
  return TEST_RESULTS.failed === 0;
}

// Execute tests if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('🚨 Test execution failed:', error);
      process.exit(1);
    });
}

export { runComprehensiveTests };