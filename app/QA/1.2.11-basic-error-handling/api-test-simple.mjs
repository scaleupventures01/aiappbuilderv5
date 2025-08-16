/**
 * Simple API Test Runner
 * Quick validation of core API functionality
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

console.log('🧪 Starting Simple API Tests...');
console.log(`Testing server at: ${BASE_URL}\n`);

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`Testing ${name}...`);
    const response = await fetch(url, options);
    const body = await response.text();
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (e) {
      parsedBody = body.substring(0, 100) + '...';
    }
    
    console.log(`✅ ${name}: ${response.status} ${response.statusText}`);
    console.log(`   Response: ${JSON.stringify(parsedBody, null, 2).substring(0, 200)}...`);
    
    return {
      success: response.status < 400,
      status: response.status,
      body: parsedBody
    };
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  const results = [];
  
  // Health checks
  results.push(await testEndpoint('Health Check', `${BASE_URL}/health`));
  results.push(await testEndpoint('Database Health', `${BASE_URL}/health/db`));
  results.push(await testEndpoint('WebSocket Health', `${BASE_URL}/health/websocket`));
  results.push(await testEndpoint('OpenAI Health', `${BASE_URL}/health/openai`));
  
  // API Documentation
  results.push(await testEndpoint('API Docs', `${API_BASE}`));
  
  // Authentication tests
  results.push(await testEndpoint('Login (no data)', `${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }));
  
  // Protected endpoint without auth
  results.push(await testEndpoint('Profile (no auth)', `${API_BASE}/users/profile`));
  
  // 404 test
  results.push(await testEndpoint('404 Test', `${API_BASE}/nonexistent`));
  
  // Summary
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`SUMMARY: ${passed}/${total} tests passed`);
  console.log('='.repeat(50));
  
  return results;
}

runTests().catch(console.error);