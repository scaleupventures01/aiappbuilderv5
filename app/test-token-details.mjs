/**
 * Detailed Token Usage Test for GPT-5 Speed Selection
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

async function testTokenUsageDetails() {
  console.log('🧮 Testing Token Usage Details');
  console.log('==============================');
  
  const service = new TradeAnalysisService();
  await service.initialize();
  
  const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  try {
    console.log('📤 Making GPT-5 API call...');
    
    // Test with super_fast mode for minimal token usage
    const result = await service.analyzeChart(
      testImageData,
      'Please analyze this chart image for trading signals',
      {
        speedMode: 'super_fast',
        requestId: 'token_detailed_test',
        userId: 'test-user'
      }
    );
    
    console.log('\n📊 TOKEN USAGE BREAKDOWN:');
    console.log('==========================');
    
    // Check if the raw OpenAI response has usage data
    if (result.rawResponse && result.rawResponse.usage) {
      const usage = result.rawResponse.usage;
      console.log(`📥 Input Tokens (prompt): ${usage.prompt_tokens}`);
      console.log(`📤 Output Tokens (completion): ${usage.completion_tokens}`);
      console.log(`🔢 Total Tokens: ${usage.total_tokens}`);
      
      // Calculate estimated cost (GPT-5 pricing)
      const inputCost = (usage.prompt_tokens / 1000000) * 1.25; // $1.25 per 1M input tokens
      const outputCost = (usage.completion_tokens / 1000000) * 10; // $10 per 1M output tokens
      const totalCost = inputCost + outputCost;
      
      console.log(`\n💰 ESTIMATED COST:`);
      console.log(`📥 Input Cost: $${inputCost.toFixed(6)}`);
      console.log(`📤 Output Cost: $${outputCost.toFixed(6)}`);
      console.log(`💵 Total Cost: $${totalCost.toFixed(6)}`);
      
    } else {
      console.log(`🔢 Total Tokens (from metadata): ${result.metadata?.tokensUsed || 'unknown'}`);
      console.log('❌ Detailed token breakdown not available');
    }
    
    console.log(`\n⚡ SPEED MODE DETAILS:`);
    console.log(`🎯 Mode: ${result.metadata?.speedMode}`);
    console.log(`🧠 Reasoning Effort: ${result.metadata?.reasoningEffort}`);
    console.log(`⏱️  Response Time: ${result.metadata?.processingTime}ms`);
    
    console.log(`\n📋 ANALYSIS RESULT:`);
    console.log(`💎 Verdict: ${result.data?.verdict}`);
    console.log(`📈 Confidence: ${result.data?.confidence}%`);
    console.log(`💭 Reasoning: ${result.data?.reasoning?.substring(0, 100)}...`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testTokenUsageDetails()
  .then(success => {
    console.log(`\n🏁 Token Usage Test: ${success ? 'COMPLETED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test crashed:', error);
    process.exit(1);
  });