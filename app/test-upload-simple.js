/**
 * Simple Upload Integration Test
 * Tests core functionality for Upload Integration
 */

const UPLOAD_SERVER_URL = 'http://localhost:3001';

async function testEndpoint(endpoint, method = 'GET') {
  try {
    console.log(`Testing ${method} ${endpoint}...`);
    const response = await fetch(`${UPLOAD_SERVER_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { raw: data };
    }
    
    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, jsonData);
    return { status: response.status, data: jsonData, ok: response.ok };
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return { status: 0, error: error.message, ok: false };
  }
}

async function runTests() {
  console.log('🚀 Running Simple Upload Integration Tests');
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  
  // Test server health
  await testEndpoint('/health');
  
  // Test upload health
  await testEndpoint('/health/upload');
  
  // Test upload endpoint (should require auth)
  await testEndpoint('/api/upload/images', 'POST');
  
  console.log('\n✅ Simple tests completed');
}

runTests().catch(console.error);