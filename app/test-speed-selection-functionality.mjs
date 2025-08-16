#!/usr/bin/env node

/**
 * PRD 1.2.6 Speed Selection - Functional Integration Test
 * Tests the actual functionality of speed selection features
 */

import { tradeAnalysisService } from './server/services/trade-analysis-service.js';
import { getAllSpeedModes, getSpeedModeConfig, mapSpeedModeToReasoningEffort } from './config/openai.js';

console.log('🧪 PRD 1.2.6 Speed Selection - Functional Test');
console.log('================================================');

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, status, details = null, error = null) {
  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${status}: ${name}`);
  if (details) console.log(`   Details: ${JSON.stringify(details)}`);
  if (error) console.log(`   Error: ${error}`);
  
  results.tests.push({ name, status, details, error });
  if (status === 'PASS') results.passed++;
  else results.failed++;
}

async function testSpeedModeConfiguration() {
  console.log('\n🔧 Testing Speed Mode Configuration');
  console.log('------------------------------------');

  try {
    // Test getAllSpeedModes
    const allModes = getAllSpeedModes();
    const expectedModes = ['super_fast', 'fast', 'balanced', 'high_accuracy'];
    const foundModes = expectedModes.filter(mode => allModes[mode]);
    
    if (foundModes.length === expectedModes.length) {
      logTest('Speed Modes Configuration', 'PASS', { modesFound: foundModes.length });
    } else {
      logTest('Speed Modes Configuration', 'FAIL', null, `Missing modes: ${expectedModes.filter(m => !allModes[m]).join(', ')}`);
      return false;
    }

    // Test reasoning effort mapping
    const testMappings = [
      { mode: 'super_fast', expected: 'low' },
      { mode: 'fast', expected: 'low' },
      { mode: 'balanced', expected: 'medium' },
      { mode: 'high_accuracy', expected: 'high' }
    ];

    let mappingSuccess = true;
    for (const { mode, expected } of testMappings) {
      const effort = mapSpeedModeToReasoningEffort(mode);
      if (effort !== expected) {
        logTest(`Reasoning Effort Mapping - ${mode}`, 'FAIL', null, `Expected ${expected}, got ${effort}`);
        mappingSuccess = false;
      }
    }

    if (mappingSuccess) {
      logTest('Reasoning Effort Mapping', 'PASS', { mappingsVerified: testMappings.length });
    }

    // Test speed mode config retrieval
    const balancedConfig = getSpeedModeConfig('balanced');
    if (balancedConfig && balancedConfig.reasoningEffort === 'medium') {
      logTest('Speed Mode Config Retrieval', 'PASS', { balancedConfig });
    } else {
      logTest('Speed Mode Config Retrieval', 'FAIL', null, 'Balanced config not found or invalid');
    }

    return mappingSuccess;
  } catch (error) {
    logTest('Speed Mode Configuration Test', 'FAIL', null, error.message);
    return false;
  }
}

async function testTradeAnalysisService() {
  console.log('\n🤖 Testing Trade Analysis Service Integration');
  console.log('----------------------------------------------');

  try {
    // Initialize the service
    await tradeAnalysisService.initialize();
    
    // Test service configuration
    const config = tradeAnalysisService.getConfiguration();
    if (config.initialized) {
      logTest('Service Initialization', 'PASS', { initialized: config.initialized, mockMode: config.mockMode });
    } else {
      logTest('Service Initialization', 'FAIL', null, 'Service not initialized');
      return false;
    }

    // Test mock image data
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // Test different speed modes
    const speedModes = ['super_fast', 'fast', 'balanced', 'high_accuracy'];
    
    for (const speedMode of speedModes) {
      try {
        const startTime = Date.now();
        const result = await tradeAnalysisService.analyzeChart(
          testImageData,
          `Test analysis for ${speedMode} mode`,
          { speedMode, requestId: `test_${speedMode}_${Date.now()}` }
        );
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (result.success && result.metadata.speedMode === speedMode) {
          logTest(`Speed Mode Analysis - ${speedMode}`, 'PASS', { 
            duration: `${duration}ms`,
            speedMode: result.metadata.speedMode,
            reasoningEffort: result.metadata.reasoningEffort,
            mockMode: result.metadata.mockMode
          });
        } else {
          logTest(`Speed Mode Analysis - ${speedMode}`, 'FAIL', null, 'Analysis failed or incorrect speed mode');
        }
      } catch (error) {
        logTest(`Speed Mode Analysis - ${speedMode}`, 'FAIL', null, error.message);
      }
    }

    // Test convenience methods
    try {
      const superFastResult = await tradeAnalysisService.superFastAnalysis(testImageData, 'Super fast test');
      if (superFastResult.success && superFastResult.metadata.speedMode === 'super_fast') {
        logTest('Super Fast Convenience Method', 'PASS', { speedMode: superFastResult.metadata.speedMode });
      } else {
        logTest('Super Fast Convenience Method', 'FAIL', null, 'Method failed or incorrect speed mode');
      }
    } catch (error) {
      logTest('Super Fast Convenience Method', 'FAIL', null, error.message);
    }

    try {
      const highAccuracyResult = await tradeAnalysisService.highAccuracyAnalysis(testImageData, 'High accuracy test');
      if (highAccuracyResult.success && highAccuracyResult.metadata.speedMode === 'high_accuracy') {
        logTest('High Accuracy Convenience Method', 'PASS', { speedMode: highAccuracyResult.metadata.speedMode });
      } else {
        logTest('High Accuracy Convenience Method', 'FAIL', null, 'Method failed or incorrect speed mode');
      }
    } catch (error) {
      logTest('High Accuracy Convenience Method', 'FAIL', null, error.message);
    }

    return true;
  } catch (error) {
    logTest('Trade Analysis Service Test', 'FAIL', null, error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🛡️ Testing Error Handling');
  console.log('---------------------------');

  try {
    // Test invalid speed mode
    try {
      await tradeAnalysisService.analyzeChart(
        'data:image/png;base64,invalid',
        'Test description',
        { speedMode: 'invalid_mode' }
      );
      logTest('Invalid Speed Mode Handling', 'FAIL', null, 'Should have thrown error for invalid speed mode');
    } catch (error) {
      // This should fail gracefully
      logTest('Invalid Speed Mode Handling', 'PASS', { errorHandled: true });
    }

    // Test invalid image data handling
    try {
      await tradeAnalysisService.analyzeChart(
        'invalid_image_data',
        'Test description',
        { speedMode: 'balanced' }
      );
      logTest('Invalid Image Data Handling', 'FAIL', null, 'Should have thrown error for invalid image');
    } catch (error) {
      // This should fail gracefully
      logTest('Invalid Image Data Handling', 'PASS', { errorHandled: true });
    }

    return true;
  } catch (error) {
    logTest('Error Handling Test', 'FAIL', null, error.message);
    return false;
  }
}

async function testPerformanceMetrics() {
  console.log('\n📊 Testing Performance Metrics');
  console.log('-------------------------------');

  try {
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // Test performance tracking
    const result = await tradeAnalysisService.analyzeChart(
      testImageData,
      'Performance test',
      { speedMode: 'balanced' }
    );

    // Check if performance metadata is included
    const hasPerformanceData = result.metadata.speedPerformance && 
                              result.metadata.processingTime &&
                              result.metadata.targetResponseTime;

    if (hasPerformanceData) {
      logTest('Performance Metrics Collection', 'PASS', {
        processingTime: result.metadata.processingTime,
        targetTime: result.metadata.targetResponseTime,
        withinTarget: result.metadata.speedPerformance.withinTarget
      });
    } else {
      logTest('Performance Metrics Collection', 'FAIL', null, 'Performance metadata missing');
    }

    // Test within target time calculation
    const withinTargetCalculated = tradeAnalysisService.isWithinTargetTime(2500, '1-3 seconds');
    if (withinTargetCalculated === true) {
      logTest('Target Time Calculation', 'PASS', { testTime: '2.5s within 1-3s range' });
    } else {
      logTest('Target Time Calculation', 'FAIL', null, '2.5s should be within 1-3s range');
    }

    return true;
  } catch (error) {
    logTest('Performance Metrics Test', 'FAIL', null, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('Starting functional tests for PRD 1.2.6 Speed Selection implementation...\n');

  const testResults = await Promise.all([
    testSpeedModeConfiguration(),
    testTradeAnalysisService(), 
    testErrorHandling(),
    testPerformanceMetrics()
  ]);

  console.log('\n📈 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(2)}%`);

  const overallSuccess = testResults.every(result => result === true);

  if (overallSuccess && results.failed === 0) {
    console.log('\n🎉 All functional tests passed! Speed selection features are working correctly.');
  } else {
    console.log(`\n⚠️ Some tests failed. Review the implementation.`);
    
    // Show failed tests
    const failedTests = results.tests.filter(t => t.status === 'FAIL');
    if (failedTests.length > 0) {
      console.log('\nFailed Tests:');
      failedTests.forEach(test => {
        console.log(`  - ${test.name}: ${test.error || 'Unknown error'}`);
      });
    }
  }

  // Save results
  try {
    await import('fs/promises').then(fs => 
      fs.writeFile('speed-selection-functional-test-results.json', JSON.stringify(results, null, 2))
    );
    console.log('\n📋 Results saved to speed-selection-functional-test-results.json');
  } catch (error) {
    console.log('\n⚠️ Could not save results file:', error.message);
  }

  return overallSuccess && results.failed === 0;
}

// Run tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test execution failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});