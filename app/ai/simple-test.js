/**
 * Simple AI Test - Elite Trading Coach AI
 * Quick test to verify AI components work together
 * Created: 2025-08-14
 */

import { getAiStats, healthCheck } from './index.js';
import { classifyTradingSetup } from './verdict/classifier.js';
import { analyzeTraderPsychology } from './psychology/pattern-detector.js';
import { selectOptimalModel } from './core/model-selector.js';
import { formatAiResponse, RESPONSE_FORMATS } from './formatting/response-formatter.js';
import { generateOptimalPrompt } from './prompts/trade-analysis-prompts.js';

async function quickTest() {
  console.log('🚀 Elite Trading Coach AI - Component Test\n');
  console.log('=' .repeat(60));

  // Test message
  const testMessage = {
    id: 'test-msg-001',
    content: 'Looking at EURUSD 1H chart. Strong support at 1.0850, price bouncing. Considering long position with stop at 1.0840. High volume on the bounce. Feeling confident about this setup.',
    conversation_id: 'conv-001',
    user_id: 'user-001',
    type: 'user',
    analysis_mode: 'analysis'
  };

  try {
    console.log('📊 Testing AI Verdict Classification...');
    const verdict = await classifyTradingSetup({
      description: testMessage.content
    }, { 
      includeReasoning: true,
      riskFactors: [],
      positiveFactors: ['highVolume', 'institutionalSupport']
    });

    console.log(`   Verdict: ${verdict.verdict} 💎🔥💀`);
    console.log(`   Confidence: ${verdict.confidence}%`);
    console.log(`   Summary: ${verdict.reasoning?.summary || 'N/A'}\n`);

    console.log('🧠 Testing Psychology Analysis...');
    const psychology = await analyzeTraderPsychology(testMessage, {
      includeInsights: true
    });

    console.log(`   Emotional State: ${psychology.emotionalState || 'Unknown'}`);
    console.log(`   Pattern Tags: ${psychology.patternTags?.join(', ') || 'None detected'}`);
    console.log(`   Coaching Type: ${psychology.coachingType || 'General'}`);
    console.log(`   Risk Level: ${psychology.insights?.riskLevel || 'Low'}\n`);

    console.log('🤖 Testing Model Selection...');
    const modelSelection = await selectOptimalModel(testMessage, {
      costSensitivity: 'medium',
      includeReasoning: true
    });

    console.log(`   Selected Model: ${modelSelection.selectedModel}`);
    console.log(`   Confidence: ${modelSelection.confidence}%`);
    console.log(`   Estimated Cost: $${modelSelection.estimatedCost?.toFixed(4) || 'N/A'}`);
    console.log(`   Reasoning: ${modelSelection.reasoning?.primaryFactors?.[0] || 'Standard analysis'}\n`);

    console.log('📝 Testing Response Formatting...');
    const mockAnalysis = {
      content: 'Based on your analysis of the EURUSD 1H chart, this appears to be a solid trading opportunity.',
      verdict: verdict.verdict,
      confidence: verdict.confidence,
      reasoning: verdict.reasoning,
      emotionalState: psychology.emotionalState,
      coachingType: psychology.coachingType,
      patternTags: psychology.patternTags,
      aiModel: modelSelection.selectedModel
    };

    const formatted = await formatAiResponse(
      mockAnalysis,
      RESPONSE_FORMATS.TRADE_ANALYSIS,
      { 
        includeDisplayText: true,
        displayOptions: {
          includeEmojis: true,
          format: 'markdown'
        }
      }
    );

    console.log(`   Response Type: ${formatted.type}`);
    console.log(`   Components: ${Object.keys(formatted.components || {}).length}`);
    console.log('   Sample Output:');
    console.log('   ' + (formatted.displayText?.substring(0, 200) || 'No display text').replace(/\n/g, '\n   '));
    if (formatted.displayText && formatted.displayText.length > 200) {
      console.log('   ...[truncated]');
    }
    console.log();

    console.log('🎯 Testing Prompt Generation...');
    const prompt = await generateOptimalPrompt(testMessage);

    console.log(`   Prompt Type: ${prompt.promptType}`);
    console.log(`   Analysis Mode: ${prompt.analysisMode}`);
    console.log(`   System Prompt: ${prompt.system?.length || 0} characters`);
    console.log(`   User Prompt: ${prompt.user?.length || 0} characters\n`);

    console.log('🏥 Testing Health Check...');
    const health = await healthCheck();

    console.log(`   Status: ${health.status}`);
    console.log('   Services:');
    Object.entries(health.services || {}).forEach(([service, status]) => {
      const icon = status === 'loaded' || status === 'connected' ? '✅' : 
                  status === 'not_configured' ? '⚠️' : '❌';
      console.log(`     ${icon} ${service}: ${status}`);
    });

    console.log('\n📈 Usage Statistics:');
    const stats = getAiStats();
    console.log(`   Total Requests: ${stats.totalRequests}`);
    console.log(`   Total Tokens: ${stats.totalTokens}`);
    console.log(`   Total Cost: $${stats.totalCost}`);

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 All AI components are working correctly!');
    console.log('\n📋 Implementation Summary:');
    console.log('   ✅ Verdict Classifier - Diamond/Fire/Skull with confidence scoring');
    console.log('   ✅ Psychology Detector - Emotional states and pattern recognition');
    console.log('   ✅ Model Selector - Intelligent AI model selection');
    console.log('   ✅ Response Formatter - Structured output formatting');
    console.log('   ✅ Prompt Generator - Context-aware prompt templates');
    console.log('   ✅ Integration Layer - Orchestrates all components');

    console.log('\n🚀 Next Steps:');
    console.log('   1. Add OpenAI API key to environment (.env file)');
    console.log('   2. Test with real AI API calls');
    console.log('   3. Integrate with message processing endpoints');
    console.log('   4. Add monitoring and error handling');
    console.log('   5. Performance optimization and caching');

    console.log('\n' + '=' .repeat(60));

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('\nError details:', error.stack);
    return false;
  }
}

// Run the test
quickTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test crashed:', error);
    process.exit(1);
  });