/**
 * Simple Cloudinary URL Test
 * Quick test to verify OpenAI Vision API can access Cloudinary URLs
 */

import { tradeAnalysisService } from './server/services/trade-analysis-service.js';
import { config } from 'dotenv';

config();

const CLOUDINARY_URL = 'https://res.cloudinary.com/dgvkvlad0/image/upload/v1755303754/elite-trading-coach/testing/896a9378-15ff-43ac-825a-0c1e84ba5c6b/1755303753932_test-chart-bullish.png';

async function testCloudinaryAccess() {
  console.log('🔬 Testing Cloudinary URL with OpenAI Vision API...');
  console.log('URL:', CLOUDINARY_URL);
  
  try {
    await tradeAnalysisService.initialize();
    
    console.log('✅ Service initialized');
    console.log('Mock mode:', tradeAnalysisService.mockMode);
    
    // Test the analysis
    const result = await tradeAnalysisService.analyzeChart(
      CLOUDINARY_URL,
      'Test chart analysis',
      { speedMode: 'fast', requestId: 'cloudinary_test' }
    );
    
    console.log('✅ CLOUDINARY URL ANALYSIS SUCCESS!');
    console.log('Verdict:', result.data.verdict);
    console.log('Confidence:', result.data.confidence);
    console.log('Model:', result.data.modelUsed);
    console.log('Processing time:', result.data.processingTime, 'ms');
    
    return { success: true, result };
    
  } catch (error) {
    console.error('❌ CLOUDINARY URL ANALYSIS FAILED!');
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

testCloudinaryAccess().then(result => {
  console.log('\n📊 Final Result:', result.success ? 'PASSED' : 'FAILED');
  process.exit(result.success ? 0 : 1);
});