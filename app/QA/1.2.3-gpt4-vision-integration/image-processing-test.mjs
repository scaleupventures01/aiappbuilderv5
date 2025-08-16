#!/usr/bin/env node

/**
 * Image Processing Pipeline Test - PRD 1.2.3 GPT-4 Vision Integration Service
 * QA Engineer: Validation of image processing pipeline functionality
 */

console.log('🚀 Starting Image Processing Pipeline Validation');

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0 }
};

function recordTest(name, passed, details = {}) {
  testResults.tests.push({ name, passed, details, timestamp: new Date().toISOString() });
  if (passed) {
    testResults.summary.passed++;
    console.log(`✅ ${name}:`, details);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${name}:`, details);
  }
}

try {
  // Import required modules
  const { imageProcessingPipeline } = await import('../../server/services/image-processing-pipeline.js');
  const { imagePreprocessingService } = await import('../../server/services/image-preprocessing-service.js');
  
  recordTest('Pipeline Service Import', true, { imported: true });
  
  console.log('\n🔧 Creating test image data...');
  
  // Create a simple PNG image programmatically
  const createTestPNG = () => {
    // Minimal PNG data (1x1 transparent pixel)
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // width=1, height=1
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // bit depth=8, color type=6
      0x89, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
      0x42, 0x60, 0x82
    ]);
    return pngHeader;
  };
  
  const testImageBuffer = createTestPNG();
  const fileMetadata = {
    originalname: 'test-chart.png',
    mimetype: 'image/png',
    size: testImageBuffer.length
  };
  
  console.log('\n🔧 Testing image preprocessing service...');
  
  try {
    const preprocessResult = await imagePreprocessingService.preprocessImage(
      testImageBuffer,
      fileMetadata,
      { quality: 85, maxWidth: 2048 }
    );
    
    const preprocessValid = (
      preprocessResult.success === true &&
      preprocessResult.data &&
      preprocessResult.data.dataUrl &&
      preprocessResult.data.dataUrl.startsWith('data:image/') &&
      preprocessResult.data.fileSize &&
      typeof preprocessResult.data.fileSize.processed === 'number'
    );
    
    recordTest('Image Preprocessing Service', preprocessValid, {
      success: preprocessResult.success,
      hasDataUrl: !!preprocessResult.data?.dataUrl,
      outputFormat: preprocessResult.data?.format,
      processedSize: preprocessResult.data?.fileSize?.processed,
      originalSize: preprocessResult.data?.fileSize?.original,
      compressionRatio: preprocessResult.data?.compressionRatio
    });
    
  } catch (error) {
    recordTest('Image Preprocessing Service', false, {
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
  }
  
  console.log('\n🔧 Testing full image processing pipeline...');
  
  try {
    const pipelineResult = await imageProcessingPipeline.processImage(
      testImageBuffer,
      fileMetadata,
      { 
        quality: 85,
        maxWidth: 2048,
        createThumbnail: true
      }
    );
    
    const pipelineValid = (
      pipelineResult.success === true &&
      pipelineResult.data &&
      pipelineResult.data.processedImage &&
      pipelineResult.data.processedImage.dataUrl &&
      pipelineResult.steps &&
      Object.keys(pipelineResult.steps).length > 0 &&
      pipelineResult.pipelineId
    );
    
    recordTest('Image Processing Pipeline', pipelineValid, {
      success: pipelineResult.success,
      pipelineId: pipelineResult.pipelineId,
      stepsCompleted: Object.keys(pipelineResult.steps || {}).length,
      hasProcessedImage: !!pipelineResult.data?.processedImage,
      hasThumbnail: !!pipelineResult.data?.thumbnail,
      totalTime: pipelineResult.metadata?.totalTime,
      qualityScore: pipelineResult.data?.qualityScore
    });
    
    if (pipelineValid && pipelineResult.data.thumbnail) {
      recordTest('Thumbnail Generation', true, {
        hasThumbnail: true,
        thumbnailFormat: pipelineResult.data.thumbnail.format,
        thumbnailSize: pipelineResult.data.thumbnail.fileSize
      });
    } else {
      recordTest('Thumbnail Generation', false, {
        hasThumbnail: !!pipelineResult.data?.thumbnail
      });
    }
    
  } catch (error) {
    recordTest('Image Processing Pipeline', false, {
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
  }
  
  console.log('\n🔧 Testing pipeline with invalid image...');
  
  try {
    const invalidImageBuffer = Buffer.from('invalid image data');
    const invalidMetadata = {
      originalname: 'invalid.png',
      mimetype: 'image/png',
      size: invalidImageBuffer.length
    };
    
    const invalidResult = await imageProcessingPipeline.processImage(
      invalidImageBuffer,
      invalidMetadata
    );
    
    // Should fail for invalid image
    recordTest('Invalid Image Handling', !invalidResult.success, {
      success: invalidResult.success,
      errors: invalidResult.errors?.length || 0,
      expectedToFail: true
    });
    
  } catch (error) {
    // Expected to throw error for invalid image
    recordTest('Invalid Image Handling', true, {
      expectedError: true,
      errorType: error.constructor.name,
      message: error.message?.substring(0, 100)
    });
  }
  
  console.log('\n🔧 Testing pipeline statistics...');
  
  try {
    const stats = imageProcessingPipeline.getProcessingStatistics();
    
    const hasStats = (
      stats &&
      typeof stats.totalProcessed === 'number' &&
      typeof stats.successfulProcessed === 'number' &&
      typeof stats.failedProcessed === 'number'
    );
    
    recordTest('Pipeline Statistics', hasStats, {
      totalProcessed: stats?.totalProcessed,
      successful: stats?.successfulProcessed,
      failed: stats?.failedProcessed,
      averageTime: stats?.averageProcessingTime,
      compressionSaved: stats?.totalCompressionSaved
    });
    
  } catch (error) {
    recordTest('Pipeline Statistics', false, {
      error: error.message
    });
  }
  
  // Final summary
  console.log('\n📊 IMAGE PROCESSING TEST SUMMARY:');
  console.log(`Total Tests: ${testResults.summary.passed + testResults.summary.failed}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  
  if (testResults.summary.failed === 0) {
    console.log('\n🎉 ALL IMAGE PROCESSING TESTS PASSED!');
    console.log('✅ Image preprocessing service works correctly');
    console.log('✅ Image processing pipeline completes successfully');
    console.log('✅ Thumbnail generation works');
    console.log('✅ Invalid image handling works correctly');
    console.log('✅ Pipeline statistics are available');
    
    // Save test results
    const fs = await import('fs/promises');
    const path = await import('path');
    const reportPath = path.join(process.cwd(), 'QA/1.2.3-gpt4-vision-integration/evidence/image-processing-test-results.json');
    await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`📄 Test results saved to: ${reportPath}`);
    
    process.exit(0);
  } else {
    console.log('\n❌ SOME IMAGE PROCESSING TESTS FAILED');
    console.log('Failed tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${JSON.stringify(t.details)}`);
    });
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Test execution failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}