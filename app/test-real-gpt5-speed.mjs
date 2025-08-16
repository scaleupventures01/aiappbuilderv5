/**
 * Real GPT-5 Speed Selection Test
 * Tests actual OpenAI GPT-5 API with reasoning_effort parameter
 */

import { TradeAnalysisService } from './server/services/trade-analysis-service.js';

// Set environment for real API testing
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is required');
  console.log('Set your API key: export OPENAI_API_KEY=sk-your-key-here');
  process.exit(1);
}
process.env.USE_MOCK_OPENAI = "false";
process.env.OPENAI_MODEL = "gpt-5";

async function testRealGPT5SpeedSelection() {
  console.log('🚀 Testing Real GPT-5 Speed Selection');
  console.log('=====================================');
  
  try {
    // Initialize the service
    const service = new TradeAnalysisService();
    await service.initialize();
    
    console.log(`✅ Service initialized`);
    console.log(`📊 Mock Mode: ${service.mockMode}`);
    console.log(`🤖 Model: ${process.env.OPENAI_MODEL}`);
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    // Test fast speed mode
    console.log('\n🏃 Testing Fast Speed Mode');
    console.log('---------------------------');
    
    const startTime = Date.now();
    
    const result = await service.analyzeChart(
      testImageData,
      'Simple test chart for speed validation',
      {
        speedMode: 'fast',
        requestId: `test_${Date.now()}`,
        userId: 'test-user'
      }
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  Response Time: ${duration}ms`);
    console.log(`🎯 Speed Mode: ${result.metadata?.speedMode || 'unknown'}`);
    console.log(`🧠 Reasoning Effort: ${result.metadata?.reasoningEffort || 'unknown'}`);
    console.log(`💎 Verdict: ${result.data?.verdict || 'unknown'}`);
    console.log(`📈 Confidence: ${result.data?.confidence || 'unknown'}%`);
    console.log(`💰 Cost: $${result.metadata?.cost?.totalCost || 'unknown'}`);
    
    // Check if result looks valid
    if (result.success && result.data?.verdict && result.metadata?.speedMode === 'fast') {
      console.log('\n🎉 SUCCESS: Real GPT-5 speed selection is working!');
      console.log('✅ GPT-5 API integration confirmed');
      console.log('✅ Speed mode (fast) applied correctly');
      console.log('✅ Response received with valid analysis');
      return true;
    } else {
      console.log('\n❌ PARTIAL SUCCESS: API called but response format unexpected');
      console.log('Raw result:', JSON.stringify(result, null, 2));
      return false;
    }
    
  } catch (error) {
    console.log('\n❌ TEST FAILED');
    console.log(`Error: ${error.message}`);
    
    if (error.message.includes('401')) {
      console.log('💡 Suggestion: Check if API key is valid');
    } else if (error.message.includes('gpt-5')) {
      console.log('💡 Suggestion: GPT-5 may not be available in this account');
      console.log('💡 Fallback: Try with gpt-4o model');
    } else if (error.message.includes('reasoning_effort')) {
      console.log('💡 Suggestion: reasoning_effort parameter may not be supported');
    }
    
    return false;
  }
}

// Run the test
testRealGPT5SpeedSelection()
  .then((success) => {
    console.log(`\n🏁 Test Complete: ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test crashed:', error);
    process.exit(1);
  });