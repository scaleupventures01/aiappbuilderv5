/**
 * Quick Integration Status Verification
 * Verifies that the Cloudinary + Vision API integration is working
 */

import { tradeAnalysisService } from './server/services/trade-analysis-service.js';
import { config } from 'dotenv';

config();

const CLOUDINARY_URL = 'https://res.cloudinary.com/dgvkvlad0/image/upload/v1755303754/elite-trading-coach/testing/896a9378-15ff-43ac-825a-0c1e84ba5c6b/1755303753932_test-chart-bullish.png';

async function verifyIntegration() {
  console.log('🔍 Quick Integration Verification');
  
  try {
    await tradeAnalysisService.initialize();
    
    const result = await tradeAnalysisService.analyzeChart(
      CLOUDINARY_URL,
      'Quick verification test',
      { speedMode: 'fast', requestId: 'verify_' + Date.now() }
    );
    
    console.log('✅ INTEGRATION WORKING');
    console.log(`   Verdict: ${result.data.verdict}`);
    console.log(`   Confidence: ${result.data.confidence}%`);
    console.log(`   Model: ${result.data.modelUsed}`);
    console.log(`   Mock mode: ${tradeAnalysisService.mockMode}`);
    
    return true;
  } catch (error) {
    console.error('❌ INTEGRATION FAILED:', error.message);
    return false;
  }
}

verifyIntegration().then(success => {
  process.exit(success ? 0 : 1);
});