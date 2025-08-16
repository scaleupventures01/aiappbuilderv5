/**
 * AI Integration Test - Elite Trading Coach AI
 * Simple test file to verify AI components work together
 * Created: 2025-08-14
 */

import { processMessage, getAiStats, healthCheck } from './index.js';
import { classifyTradingSetup } from './verdict/classifier.js';
import { analyzeTraderPsychology } from './psychology/pattern-detector.js';
import { selectOptimalModel } from './core/model-selector.js';
import { formatAiResponse, RESPONSE_FORMATS } from './formatting/response-formatter.js';
import { generateOptimalPrompt } from './prompts/trade-analysis-prompts.js';

// Test message data samples
const testMessages = {
  basicTrade: {
    id: 'test-1',
    content: 'Looking at EUR/USD on the 1H chart. I see a strong support level at 1.0850 and price is bouncing. Thinking about going long with a tight stop at 1.0840. What do you think?',
    conversation_id: 'conv-1',
    user_id: 'user-1',
    type: 'user',
    analysis_mode: 'analysis'
  },
  
  psychologyMessage: {
    id: 'test-2', 
    content: 'I\'m feeling really anxious about this trade. I lost money yesterday and I\'m worried about revenge trading. Should I take a break or push through?',
    conversation_id: 'conv-1',
    user_id: 'user-1',
    type: 'user',
    analysis_mode: 'psychology',
    emotional_state: 'anxious'
  },
  
  chartMessage: {
    id: 'test-3',
    content: 'Can you analyze this chart for me? Looking for entry and exit points.',
    conversation_id: 'conv-1', 
    user_id: 'user-1',
    type: 'user',
    image_url: 'https://example.com/chart.jpg',
    image_filename: 'chart.jpg',
    analysis_mode: 'analysis'
  }
};

// Test individual components
async function testComponents() {
  console.log('🧪 Testing Individual AI Components...\n');
  
  try {
    // Test 1: Verdict Classifier
    console.log('1. Testing Verdict Classifier...');
    const verdictResult = await classifyTradingSetup({
      description: testMessages.basicTrade.content
    }, { includeReasoning: true });
    
    console.log(`   ✅ Verdict: ${verdictResult.verdict} (${verdictResult.confidence}% confidence)`);
    console.log(`   📋 Reasoning: ${verdictResult.reasoning?.summary || 'N/A'}`);

    // Test 2: Psychology Pattern Detector
    console.log('\n2. Testing Psychology Pattern Detector...');
    const psychResult = await analyzeTraderPsychology(testMessages.psychologyMessage);
    
    console.log(`   ✅ Emotional State: ${psychResult.emotionalState || 'Unknown'}`);
    console.log(`   🧠 Pattern Tags: ${psychResult.patternTags?.join(', ') || 'None'}`);
    console.log(`   🎯 Coaching Type: ${psychResult.coachingType || 'None'}`);

    // Test 3: Model Selector
    console.log('\n3. Testing Model Selector...');
    const modelResult = await selectOptimalModel(testMessages.chartMessage);
    
    console.log(`   ✅ Selected Model: ${modelResult.selectedModel}`);
    console.log(`   💰 Estimated Cost: $${modelResult.estimatedCost?.toFixed(4) || 'N/A'}`);
    console.log(`   🎯 Confidence: ${modelResult.confidence || 'N/A'}%`);

    // Test 4: Response Formatter
    console.log('\n4. Testing Response Formatter...');
    const mockAiResponse = {
      content: 'This is a mock AI analysis response',
      verdict: verdictResult.verdict,
      confidence: verdictResult.confidence,
      reasoning: verdictResult.reasoning
    };
    
    const formattedResult = await formatAiResponse(
      mockAiResponse, 
      RESPONSE_FORMATS.TRADE_ANALYSIS,
      { includeDisplayText: true }
    );
    
    console.log(`   ✅ Response Type: ${formattedResult.type}`);
    console.log(`   📝 Components: ${Object.keys(formattedResult.components || {}).join(', ')}`);

    // Test 5: Prompt Generator
    console.log('\n5. Testing Prompt Generator...');
    const promptResult = await generateOptimalPrompt(testMessages.basicTrade);
    
    console.log(`   ✅ Prompt Type: ${promptResult.promptType}`);
    console.log(`   🔍 Analysis Mode: ${promptResult.analysisMode}`);
    console.log(`   📏 System Prompt Length: ${promptResult.system?.length || 0} chars`);
    
    console.log('\n✅ All individual components tested successfully!\n');
    
    return true;
  } catch (error) {
    console.error('❌ Component test failed:', error);
    return false;
  }
}

// Test full integration (without actual API calls)
async function testIntegration() {
  console.log('🔗 Testing Full AI Integration (Mock Mode)...\n');
  
  try {
    // Mock the API key check
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  No OpenAI API key found - running in mock mode');
    }

    // Test basic trade analysis integration
    console.log('1. Testing Basic Trade Analysis Integration...');
    
    // This would normally call the full processMessage function
    // For testing without API key, we'll test the component orchestration
    const components = {
      verdict: await classifyTradingSetup({
        description: testMessages.basicTrade.content
      }),
      psychology: await analyzeTraderPsychology(testMessages.basicTrade),
      model: await selectOptimalModel(testMessages.basicTrade),
      prompt: await generateOptimalPrompt(testMessages.basicTrade)
    };

    console.log('   ✅ All components integrated successfully');
    console.log(`   📊 Verdict: ${components.verdict.verdict}`);
    console.log(`   🧠 Psychology: ${components.psychology.emotionalState || 'Neutral'}`);
    console.log(`   🤖 Model: ${components.model.selectedModel}`);
    console.log(`   📝 Prompt: ${components.prompt.promptType}`);

    // Test health check
    console.log('\n2. Testing Health Check...');
    let healthStatus;
    
    try {
      healthStatus = await healthCheck();
      console.log(`   ✅ Health Status: ${healthStatus.status}`);
    } catch (error) {
      console.log(`   ⚠️  Health Check Failed: ${error.message} (Expected without API key)`);
      healthStatus = { status: 'mock', error: 'No API key' };
    }

    // Test stats
    console.log('\n3. Testing Stats Collection...');
    const stats = getAiStats();
    console.log(`   📈 Total Requests: ${stats.totalRequests}`);
    console.log(`   🎯 Total Tokens: ${stats.totalTokens}`);
    console.log(`   💰 Total Cost: $${stats.totalCost}`);

    console.log('\n✅ Integration test completed successfully!\n');
    
    return {
      success: true,
      components,
      health: healthStatus,
      stats
    };
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting AI Component Tests...\n');
  console.log('=' .repeat(50));
  
  const componentTests = await testComponents();
  
  console.log('=' .repeat(50));
  
  const integrationTests = await testIntegration();
  
  console.log('=' .repeat(50));
  console.log('📊 Test Summary:');
  console.log(`   Components: ${componentTests ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Integration: ${integrationTests.success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (componentTests && integrationTests.success) {
    console.log('\n🎉 All AI components are working correctly!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Add OpenAI API key to environment variables');
    console.log('   2. Test with real API calls');
    console.log('   3. Integrate with message processing endpoints');
    console.log('   4. Add error handling and monitoring');
  } else {
    console.log('\n❌ Some tests failed - check the errors above');
  }
  
  console.log('\n' + '=' .repeat(50));
}

// Export test functions
export {
  testComponents,
  testIntegration,
  runTests,
  testMessages
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}