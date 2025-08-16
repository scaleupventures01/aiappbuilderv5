#!/usr/bin/env node

/**
 * Simple Validation Test - PRD 1.2.3 GPT-4 Vision Integration Service
 * QA Engineer: Quick validation of mock mode functionality
 */

console.log('🚀 Starting GPT-4 Vision Integration Service Validation');
console.log('Environment Setup:');
console.log('- USE_MOCK_OPENAI:', process.env.USE_MOCK_OPENAI || 'not set');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'configured' : 'not configured');

// Set mock mode
process.env.USE_MOCK_OPENAI = 'true';
process.env.OPENAI_API_KEY = 'sk-dev-api-key-here';

console.log('\n🔧 Testing service imports...');

try {
  const serviceModule = await import('../../server/services/enhanced-trade-analysis-service.js');
  console.log('✅ Enhanced Trade Analysis Service imported successfully');
  
  const service = serviceModule.enhancedTradeAnalysisService;
  console.log('✅ Service instance available');
  
  console.log('\n🔧 Initializing service...');
  await service.initialize();
  console.log('✅ Service initialized');
  
  console.log('\n🔧 Running health check...');
  const health = await service.healthCheck();
  console.log('✅ Health check result:', {
    status: health.status,
    mockMode: health.mockMode,
    initialized: health.initialized,
    hasApiKey: health.hasApiKey
  });
  
  if (health.mockMode) {
    console.log('✅ Service is correctly running in MOCK MODE');
  } else {
    console.log('❌ Service is NOT in mock mode (expected: true)');
  }
  
  console.log('\n🔧 Testing mock response generation...');
  const testImage = 'data:image/jpeg;base64,' + Buffer.from('test-image-data').toString('base64');
  
  const analysisResult = await service.analyzeChart(
    testImage,
    'Test bullish pattern analysis',
    { requestId: 'qa-test-001', userId: 'qa-tester' }
  );
  
  console.log('✅ Mock analysis completed:', {
    success: analysisResult.success,
    verdict: analysisResult.data?.verdict,
    confidence: analysisResult.data?.confidence,
    mockMode: analysisResult.metadata?.mockMode,
    processingTime: analysisResult.data?.processingTime
  });
  
  // Validate response structure
  const validations = {
    hasSuccess: typeof analysisResult.success === 'boolean',
    hasVerdict: ['Diamond', 'Fire', 'Skull'].includes(analysisResult.data?.verdict),
    hasConfidence: typeof analysisResult.data?.confidence === 'number',
    hasReasoning: typeof analysisResult.data?.reasoning === 'string',
    isMockMode: analysisResult.metadata?.mockMode === true,
    hasProcessingTime: typeof analysisResult.data?.processingTime === 'number'
  };
  
  const allValid = Object.values(validations).every(v => v === true);
  
  console.log('\n🔍 Response Structure Validation:', validations);
  
  if (allValid) {
    console.log('✅ ALL MOCK MODE VALIDATIONS PASSED');
    console.log('\n📋 Summary:');
    console.log('- Service initialization: ✅ PASS');
    console.log('- Mock mode detection: ✅ PASS');
    console.log('- Response generation: ✅ PASS');
    console.log('- Response structure: ✅ PASS');
    process.exit(0);
  } else {
    console.log('❌ SOME VALIDATIONS FAILED');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}