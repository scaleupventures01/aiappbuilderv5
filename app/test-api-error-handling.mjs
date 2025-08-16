/**
 * API Error Handling Test Suite
 * Tests standardized error response format implementation
 * Created: 2025-08-16
 */

const API_BASE = 'http://localhost:3001';

// Test case configuration
const testCases = [
  {
    name: 'Method Not Allowed - POST to /health',
    method: 'POST',
    url: '/health',
    expectedStatus: 405,
    expectedFields: ['success', 'error', 'code', 'timestamp', 'guidance', 'method', 'allowedMethods']
  },
  {
    name: 'Method Not Allowed - PUT to /health',
    method: 'PUT',
    url: '/health',
    expectedStatus: 405,
    expectedFields: ['success', 'error', 'code', 'timestamp', 'guidance', 'method', 'allowedMethods']
  },
  {
    name: 'Method Not Allowed - DELETE to /health',
    method: 'DELETE',
    url: '/health',
    expectedStatus: 405,
    expectedFields: ['success', 'error', 'code', 'timestamp', 'guidance', 'method', 'allowedMethods']
  },
  {
    name: 'API Endpoint Not Found',
    method: 'GET',
    url: '/api/nonexistent',
    expectedStatus: 404,
    expectedFields: ['success', 'error', 'code', 'timestamp', 'guidance', 'path', 'method']
  },
  {
    name: 'Valid Health Check',
    method: 'GET',
    url: '/health',
    expectedStatus: 200,
    expectedFields: ['success', 'message', 'timestamp']
  },
  {
    name: 'Valid API Documentation',
    method: 'GET',
    url: '/api',
    expectedStatus: 200,
    expectedFields: ['success', 'message', 'version']
  },
  {
    name: 'Database Health Check',
    method: 'GET',
    url: '/health/db',
    expectedStatus: 200,
    expectedFields: ['success', 'message', 'data']
  },
  {
    name: 'Method Not Allowed - POST to /api',
    method: 'POST',
    url: '/api',
    expectedStatus: 405,
    expectedFields: ['success', 'error', 'code', 'timestamp', 'guidance', 'method', 'allowedMethods']
  }
];

/**
 * Run a single test case
 */
async function runTest(testCase) {
  try {
    const response = await fetch(`${API_BASE}${testCase.url}`, {
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: testCase.method === 'POST' || testCase.method === 'PUT' ? 
        JSON.stringify({ test: 'data' }) : undefined
    });

    const responseBody = await response.json();
    const actualStatus = response.status;
    
    // Check status code
    const statusMatch = actualStatus === testCase.expectedStatus;
    
    // Check required fields exist
    const fieldsMatch = testCase.expectedFields.every(field => 
      responseBody.hasOwnProperty(field)
    );
    
    // Check error response format for error cases
    let formatMatch = true;
    if (actualStatus >= 400) {
      formatMatch = (
        responseBody.success === false &&
        typeof responseBody.error === 'string' &&
        typeof responseBody.code === 'string' &&
        typeof responseBody.timestamp === 'string'
      );
      
      // Check guidance exists for applicable errors
      if ([401, 403, 404, 405, 429].includes(actualStatus) || actualStatus >= 500) {
        formatMatch = formatMatch && typeof responseBody.guidance === 'string';
      }
      
      // Check retryable field for server errors
      if ([500, 502, 503, 504, 429].includes(actualStatus)) {
        formatMatch = formatMatch && responseBody.retryable === true;
      }
    }
    
    const passed = statusMatch && fieldsMatch && formatMatch;
    
    return {
      name: testCase.name,
      passed,
      actualStatus,
      expectedStatus: testCase.expectedStatus,
      statusMatch,
      fieldsMatch,
      formatMatch,
      responseBody,
      issues: [
        !statusMatch ? `Status: expected ${testCase.expectedStatus}, got ${actualStatus}` : null,
        !fieldsMatch ? `Missing fields: ${testCase.expectedFields.filter(f => !responseBody.hasOwnProperty(f)).join(', ')}` : null,
        !formatMatch ? 'Response format does not match standardized error format' : null
      ].filter(Boolean)
    };
    
  } catch (error) {
    return {
      name: testCase.name,
      passed: false,
      error: error.message,
      issues: [error.message]
    };
  }
}

/**
 * Run all tests and generate report
 */
async function runAllTests() {
  console.log('🧪 API Error Handling Test Suite');
  console.log('═'.repeat(60));
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);
    
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    
    if (!result.passed && result.issues) {
      result.issues.forEach(issue => {
        console.log(`    ⚠️  ${issue}`);
      });
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Test Summary');
  console.log('─'.repeat(40));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const passRate = Math.round((passed / total) * 100);
  
  console.log(`Passed: ${passed}/${total} (${passRate}%)`);
  console.log(`Failed: ${total - passed}/${total}`);
  
  if (passRate >= 90) {
    console.log('🎉 SUCCESS: Pass rate meets requirement (≥90%)');
  } else {
    console.log('⚠️  WARNING: Pass rate below requirement (≥90%)');
  }
  
  // Show detailed failures
  const failures = results.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log('\n❌ Failed Tests:');
    failures.forEach(failure => {
      console.log(`  • ${failure.name}`);
      if (failure.issues) {
        failure.issues.forEach(issue => console.log(`    - ${issue}`));
      }
    });
  }
  
  console.log('\n🔍 Standardized Error Format Validation:');
  const errorTests = results.filter(r => r.actualStatus >= 400);
  const errorFormatSuccess = errorTests.filter(r => r.formatMatch).length;
  console.log(`Error format compliance: ${errorFormatSuccess}/${errorTests.length} (${Math.round((errorFormatSuccess/errorTests.length)*100)}%)`);
  
  return {
    total,
    passed,
    passRate,
    results
  };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(summary => {
    process.exit(summary.passRate >= 90 ? 0 : 1);
  });
}

export { runAllTests };