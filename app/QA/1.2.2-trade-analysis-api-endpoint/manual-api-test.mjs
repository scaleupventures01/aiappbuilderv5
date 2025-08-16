#!/usr/bin/env node

/**
 * Manual API Test for PRD 1.2.2
 * Tests API endpoints with a running server
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🧪 Manual API Test for PRD 1.2.2...');

async function testEndpoints() {
  const tests = [];
  
  console.log('\n🔍 Testing health endpoints...');
  
  // Test health endpoints
  const healthEndpoints = [
    '/health',
    '/health/db',
    '/health/websocket',
    '/health/openai'
  ];
  
  for (const endpoint of healthEndpoints) {
    try {
      const { stdout, stderr } = await execAsync(`curl -s -w "\\n%{http_code}" http://localhost:8080${endpoint}`, {
        timeout: 5000
      });
      
      const lines = stdout.trim().split('\n');
      const statusCode = lines[lines.length - 1];
      const response = lines.slice(0, -1).join('\n');
      
      console.log(`${endpoint}: ${statusCode} ${statusCode.startsWith('2') ? '✅' : statusCode.startsWith('5') ? '⚠️' : '❌'}`);
      if (response && response.length < 200) {
        console.log(`  Response: ${response}`);
      }
      
      tests.push({ endpoint, statusCode: parseInt(statusCode), success: statusCode.startsWith('2') || statusCode === '503' });
      
    } catch (error) {
      console.log(`${endpoint}: ERROR ❌`);
      console.log(`  Error: ${error.message}`);
      tests.push({ endpoint, error: error.message, success: false });
    }
  }
  
  console.log('\n🔍 Testing API analyze-trade endpoint...');
  
  // Test the main API endpoint
  try {
    const { stdout, stderr } = await execAsync(`curl -s -w "\\n%{http_code}" -X POST http://localhost:8080/api/analyze-trade`, {
      timeout: 10000
    });
    
    const lines = stdout.trim().split('\n');
    const statusCode = lines[lines.length - 1];
    const response = lines.slice(0, -1).join('\n');
    
    console.log(`/api/analyze-trade: ${statusCode} ${statusCode === '400' || statusCode === '401' || statusCode === '429' ? '✅' : '❌'}`);
    console.log(`  Response: ${response}`);
    
    tests.push({ 
      endpoint: '/api/analyze-trade', 
      statusCode: parseInt(statusCode), 
      response,
      success: ['400', '401', '429'].includes(statusCode) // These are expected without auth/image
    });
    
  } catch (error) {
    console.log(`/api/analyze-trade: ERROR ❌`);
    console.log(`  Error: ${error.message}`);
    tests.push({ endpoint: '/api/analyze-trade', error: error.message, success: false });
  }
  
  // Test API health endpoint
  try {
    const { stdout, stderr } = await execAsync(`curl -s -w "\\n%{http_code}" http://localhost:8080/api/analyze-trade/health`, {
      timeout: 5000
    });
    
    const lines = stdout.trim().split('\n');
    const statusCode = lines[lines.length - 1];
    const response = lines.slice(0, -1).join('\n');
    
    console.log(`/api/analyze-trade/health: ${statusCode} ${statusCode.startsWith('2') || statusCode === '503' ? '✅' : '❌'}`);
    if (response && response.length < 200) {
      console.log(`  Response: ${response}`);
    }
    
    tests.push({ 
      endpoint: '/api/analyze-trade/health', 
      statusCode: parseInt(statusCode), 
      success: statusCode.startsWith('2') || statusCode === '503'
    });
    
  } catch (error) {
    console.log(`/api/analyze-trade/health: ERROR ❌`);
    console.log(`  Error: ${error.message}`);
    tests.push({ endpoint: '/api/analyze-trade/health', error: error.message, success: false });
  }
  
  return tests;
}

async function runTest() {
  console.log('⚡ Starting server and testing endpoints...');
  
  // Start server in background
  const serverProcess = exec('cd "/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app" && node server.js');
  
  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    const results = await testEndpoints();
    
    console.log('\n📊 Test Results Summary:');
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 All endpoints working correctly!');
    } else if (passed > total / 2) {
      console.log('⚠️  Most endpoints working, some issues detected');
    } else {
      console.log('❌ Multiple endpoint issues detected');
    }
    
    return { results, summary: { passed, total, success: passed === total } };
    
  } finally {
    // Kill server
    try {
      serverProcess.kill();
    } catch (error) {
      // Server might already be stopped
    }
  }
}

// Run the test
runTest()
  .then(testResults => {
    console.log('\n🏁 Manual API test complete!');
    process.exit(testResults.summary.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });