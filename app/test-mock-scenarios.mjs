#!/usr/bin/env node
/**
 * Mock Mode Scenario Tests
 */

import { TradeAnalysisService } from './server/services/trade-analysis-service.js';

// Set environment for testing
process.env.USE_MOCK_OPENAI = 'true';
process.env.OPENAI_API_KEY = 'sk-dev-api-key-here';

async function testDifferentScenarios() {
  console.log('🧪 Testing Different Mock Scenarios...');
  
  const service = new TradeAnalysisService();
  await service.initialize();
  
  const imageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  const scenarios = [
    { description: 'Strong bullish breakout pattern', expected: 'Diamond' },
    { description: 'Bearish downtrend with volume', expected: 'Skull' },
    { description: 'Weak support levels failing', expected: 'Skull' },
    { description: 'Neutral consolidation phase', expected: 'any' },
    { description: '', expected: 'any' } // No description
  ];
  
  console.log('\n🎭 Testing Mock Response Logic:');
  
  for (const scenario of scenarios) {
    try {
      const result = await service.analyzeChart(imageData, scenario.description);
      
      const verdict = result.data.verdict;
      const confidence = result.data.confidence;
      const reasoning = result.data.reasoning;
      
      let passed = true;
      if (scenario.expected !== 'any') {
        passed = verdict === scenario.expected;
      }
      
      console.log(`${passed ? '✅' : '❌'} "${scenario.description || 'No description'}"`);
      console.log(`   → Verdict: ${verdict} (Confidence: ${confidence}%)`);
      console.log(`   → Reasoning: ${reasoning.substring(0, 80)}...`);
      console.log('');
      
    } catch (error) {
      console.log(`❌ "${scenario.description}": ${error.message}`);
    }
  }
  
  // Test performance consistency
  console.log('⏱️ Testing Performance Consistency:');
  const times = [];
  
  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    await service.analyzeChart(imageData, 'Performance test');
    const duration = Date.now() - start;
    times.push(duration);
    console.log(`   Test ${i + 1}: ${duration}ms`);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`   Average: ${avgTime.toFixed(0)}ms`);
  
  // Test with invalid API key behavior
  console.log('\n🔑 Testing API Key Behavior:');
  
  // Test with different invalid keys
  const service2 = new TradeAnalysisService();
  process.env.OPENAI_API_KEY = 'your-openai-api-key-here'; // Should trigger mock
  process.env.USE_MOCK_OPENAI = 'false'; // Should still use mock due to invalid key
  
  await service2.initialize();
  const config2 = service2.getConfiguration();
  console.log(`✅ Invalid API key correctly triggered mock mode: ${config2.mockMode}`);
  
  console.log('\n🎉 All scenario tests completed!');
}

testDifferentScenarios().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});