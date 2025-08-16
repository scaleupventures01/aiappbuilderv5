#!/usr/bin/env node
/**
 * Debug Mock Response Logic
 */

import { TradeAnalysisService } from './server/services/trade-analysis-service.js';

// Set environment for testing
process.env.USE_MOCK_OPENAI = 'true';
process.env.OPENAI_API_KEY = 'sk-dev-api-key-here';

async function debugMockLogic() {
  console.log('🐛 Debugging Mock Response Logic...');
  
  const service = new TradeAnalysisService();
  await service.initialize();
  
  const imageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  // Add temporary logging to the mock function
  const originalMockResponse = service.generateMockResponse.bind(service);
  service.generateMockResponse = async function(imageContent, prompt, description = '') {
    console.log(`🐛 Mock Debug: description="${description}", prompt="${prompt}"`);
    const textToAnalyze = (description + ' ' + prompt).toLowerCase();
    console.log(`🐛 Text to analyze: "${textToAnalyze}"`);
    
    return await originalMockResponse(imageContent, prompt, description);
  };
  
  const testCases = [
    'Strong bullish breakout pattern',
    'Bearish downtrend with volume',
    'Weak support levels failing'
  ];
  
  for (const description of testCases) {
    console.log(`\n🧪 Testing: "${description}"`);
    const result = await service.analyzeChart(imageData, description);
    console.log(`   Result: ${result.data.verdict}`);
  }
}

debugMockLogic().catch(error => {
  console.error('❌ Debug failed:', error.message);
  process.exit(1);
});