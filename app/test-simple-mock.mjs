#!/usr/bin/env node
/**
 * Simple Mock Mode Test
 */

import { TradeAnalysisService } from './server/services/trade-analysis-service.js';

// Set environment for testing
process.env.USE_MOCK_OPENAI = 'true';
process.env.OPENAI_API_KEY = 'sk-dev-api-key-here';

async function testMockMode() {
  console.log('🧪 Testing Mock Mode...');
  
  try {
    const service = new TradeAnalysisService();
    console.log('✅ Service created');
    
    await service.initialize();
    console.log('✅ Service initialized');
    
    const config = service.getConfiguration();
    console.log('📊 Configuration:', config);
    
    // Test API key validation
    console.log('🔑 Testing API key validation...');
    console.log('Invalid key test:', service.isValidApiKey('sk-dev-api-key-here')); // Should be false
    console.log('Valid key test:', service.isValidApiKey('sk-1234567890abcdef1234567890abcdef')); // Should be true
    
    // Test mock response
    console.log('🎭 Testing mock response...');
    const imageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    const result = await service.analyzeChart(imageData, 'Strong bullish pattern');
    console.log('✅ Mock response generated');
    console.log('📊 Result:', {
      verdict: result.data.verdict,
      confidence: result.data.confidence,
      mockMode: result.metadata.mockMode,
      model: result.metadata.model
    });
    
    console.log('\n🎉 Mock mode test successful!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testMockMode();