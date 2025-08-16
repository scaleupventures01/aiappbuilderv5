#!/usr/bin/env node

/**
 * Quick Test Script for Chart Upload Feature
 * Tests the /api/test-analyze-trade endpoint
 * Created: 2025-08-15
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testChartUpload() {
  console.log('🧪 Testing Chart Upload Feature');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. Test health endpoints
    console.log('1. Testing health endpoints...');
    
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('   ✅ General health:', healthData.success ? 'OK' : 'FAILED');

    const openaiHealthResponse = await fetch(`${BASE_URL}/health/openai`);
    const openaiHealthData = await openaiHealthResponse.json();
    console.log('   ✅ OpenAI health:', openaiHealthData.success ? 'OK' : 'FAILED');
    console.log('   📊 Mock mode:', openaiHealthData.data.useMockMode ? 'ENABLED' : 'DISABLED');

    // 2. Test the test page is accessible
    console.log('\n2. Testing test page access...');
    const testPageResponse = await fetch(`${BASE_URL}/api/test-analyze-trade`);
    console.log('   ✅ Test page:', testPageResponse.status === 200 ? 'ACCESSIBLE' : 'FAILED');

    // 3. Create a simple test image (1x1 pixel PNG)
    console.log('\n3. Creating test image...');
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0x00, 0x02, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const testImagePath = '/tmp/test-chart.png';
    fs.writeFileSync(testImagePath, testImageBuffer);
    console.log('   ✅ Test image created');

    // 4. Test chart analysis endpoint
    console.log('\n4. Testing chart analysis...');
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath), {
      filename: 'test-chart.png',
      contentType: 'image/png'
    });
    formData.append('description', 'Test chart analysis');

    const analysisResponse = await fetch(`${BASE_URL}/api/test-analyze-trade`, {
      method: 'POST',
      body: formData
    });

    const analysisData = await analysisResponse.json();
    
    if (analysisResponse.status === 200 && analysisData.success) {
      console.log('   ✅ Chart analysis: SUCCESS');
      console.log('   📊 Verdict:', analysisData.data.verdict);
      console.log('   🎯 Confidence:', analysisData.data.confidence + '%');
      console.log('   🤖 Model:', analysisData.metadata.model);
      console.log('   ⏱️  Processing time:', analysisData.data.processingTime + 'ms');
      console.log('   🧪 Test mode:', analysisData.metadata.testMode ? 'ENABLED' : 'DISABLED');
    } else {
      console.log('   ❌ Chart analysis: FAILED');
      console.log('   Error:', analysisData.error);
      console.log('   Code:', analysisData.code);
    }

    // Clean up
    fs.unlinkSync(testImagePath);
    console.log('\n✅ Test completed successfully!');
    
    console.log('\n🌟 Ready for testing!');
    console.log('   • Open browser to: http://localhost:3001/api/test-analyze-trade');
    console.log('   • Upload any chart image and test the analysis');
    console.log('   • No authentication required');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server not running. Start it with:');
      console.log('   ./start-test-server.sh    (Mac/Linux)');
      console.log('   start-test-server.bat     (Windows)');
    }
  }
}

// Run the test
testChartUpload();