#!/usr/bin/env node

/**
 * Mock Legacy Test - PRD 1.2.3 GPT-4 Vision Integration Service
 * QA Engineer: Testing mock mode via legacy method (bypasses image processing pipeline)
 */

console.log('🚀 Starting GPT-4 Vision Integration Mock Mode Test (Legacy Method)');
console.log('Environment Setup:');
console.log('- USE_MOCK_OPENAI:', process.env.USE_MOCK_OPENAI || 'not set');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'configured' : 'not configured');

// Set mock mode
process.env.USE_MOCK_OPENAI = 'true';
process.env.OPENAI_API_KEY = 'sk-dev-api-key-here';

console.log('\n🔧 Testing service imports...');

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0 }
};

function recordTest(name, passed, details = {}) {
  testResults.tests.push({ name, passed, details, timestamp: new Date().toISOString() });
  if (passed) {
    testResults.summary.passed++;
    console.log(`✅ ${name}:`, details);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${name}:`, details);
  }
}

try {
  const serviceModule = await import('../../server/services/enhanced-trade-analysis-service.js');
  recordTest('Service Import', true, { imported: true });
  
  const service = serviceModule.enhancedTradeAnalysisService;
  recordTest('Service Instance', true, { available: true });
  
  console.log('\n🔧 Initializing service...');
  await service.initialize();
  recordTest('Service Initialization', true, { initialized: true });
  
  console.log('\n🔧 Running health check...');
  const health = await service.healthCheck();
  const mockModeCorrect = health.mockMode === true;
  recordTest('Mock Mode Detection', mockModeCorrect, {
    expectedMockMode: true,
    actualMockMode: health.mockMode,
    status: health.status,
    initialized: health.initialized
  });
  
  console.log('\n🔧 Testing legacy mock response generation...');
  
  // Test scenarios using legacy method (bypasses image processing pipeline)
  const testScenarios = [
    { description: 'strong bullish breakout pattern', expectedType: 'positive' },
    { description: 'bearish decline with high volume', expectedType: 'negative' },
    { description: 'mixed signals unclear trend', expectedType: 'neutral' },
    { description: '', expectedType: 'random' }
  ];
  
  const responses = [];
  let allResponsesValid = true;
  
  for (const scenario of testScenarios) {
    try {
      const startTime = Date.now();
      
      // Use legacy method that bypasses image processing
      const analysisResult = await service.legacyAnalyzeChart(
        'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent PNG
        scenario.description,
        { requestId: `legacy-test-${Date.now()}`, userId: 'qa-tester' }
      );
      
      const responseTime = Date.now() - startTime;
      
      const isValidResponse = (
        analysisResult.success === true &&
        ['Diamond', 'Fire', 'Skull'].includes(analysisResult.data?.verdict) &&
        typeof analysisResult.data?.confidence === 'number' &&
        analysisResult.data?.confidence >= 0 &&
        analysisResult.data?.confidence <= 100 &&
        typeof analysisResult.data?.reasoning === 'string' &&
        analysisResult.metadata?.mockMode === true &&
        responseTime < 5000 // Should be fast in mock mode
      );
      
      if (!isValidResponse) {
        allResponsesValid = false;
      }
      
      responses.push({
        scenario: scenario.description || 'empty',
        verdict: analysisResult.data?.verdict,
        confidence: analysisResult.data?.confidence,
        reasoning: analysisResult.data?.reasoning?.substring(0, 100) + '...',
        mockMode: analysisResult.metadata?.mockMode,
        responseTime,
        valid: isValidResponse
      });
      
    } catch (error) {
      responses.push({
        scenario: scenario.description || 'empty',
        error: error.message,
        valid: false
      });
      allResponsesValid = false;
    }
  }
  
  recordTest('Legacy Mock Responses', allResponsesValid, {
    totalScenarios: testScenarios.length,
    validResponses: responses.filter(r => r.valid).length,
    responses: responses.slice(0, 2) // Show first 2 as samples
  });
  
  console.log('\n🔧 Testing API key validation...');
  
  const apiKeyTests = [
    { key: 'sk-valid-key-12345678901234567890', expected: true, desc: 'Valid format' },
    { key: 'sk-dev-api-key-here', expected: false, desc: 'Placeholder dev key' },
    { key: 'your-openai-api-key-here', expected: false, desc: 'Placeholder key' },
    { key: 'invalid-format', expected: false, desc: 'Invalid format' },
    { key: '', expected: false, desc: 'Empty key' }
  ];
  
  let allKeyValidationsCorrect = true;
  const keyValidationResults = [];
  
  for (const test of apiKeyTests) {
    const result = service.isValidApiKey(test.key);
    const correct = result === test.expected;
    
    if (!correct) {
      allKeyValidationsCorrect = false;
    }
    
    keyValidationResults.push({
      description: test.desc,
      key: test.key || '(empty)',
      expected: test.expected,
      actual: result,
      correct
    });
  }
  
  recordTest('API Key Validation Logic', allKeyValidationsCorrect, {
    totalTests: apiKeyTests.length,
    correctValidations: keyValidationResults.filter(r => r.correct).length,
    sampleResults: keyValidationResults.slice(0, 3)
  });
  
  console.log('\n🔧 Testing service configuration...');
  
  const config = service.getEnhancedConfiguration();
  const configValid = (
    config.service.mockMode === true &&
    config.service.initialized === true &&
    typeof config.service.requestTimeout === 'number' &&
    typeof config.service.maxTokens === 'number'
  );
  
  recordTest('Service Configuration', configValid, {
    mockMode: config.service.mockMode,
    initialized: config.service.initialized,
    timeout: config.service.requestTimeout,
    maxTokens: config.service.maxTokens,
    servicesAvailable: Object.keys(config).length > 1
  });
  
  // Final summary
  console.log('\n📊 TEST SUMMARY:');
  console.log(`Total Tests: ${testResults.summary.passed + testResults.summary.failed}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  
  if (testResults.summary.failed === 0) {
    console.log('\n🎉 ALL MOCK MODE TESTS PASSED!');
    console.log('✅ Service correctly operates in mock mode');
    console.log('✅ Mock responses are generated within acceptable time');
    console.log('✅ Response structure matches PRD specification');
    console.log('✅ API key validation logic works correctly');
    console.log('✅ Service configuration is accessible');
    
    // Save test results
    const fs = await import('fs/promises');
    const path = await import('path');
    const reportPath = path.join(process.cwd(), 'QA/1.2.3-gpt4-vision-integration/evidence/mock-mode-test-results.json');
    await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`📄 Test results saved to: ${reportPath}`);
    
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    console.log('Failed tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${JSON.stringify(t.details)}`);
    });
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Test execution failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}