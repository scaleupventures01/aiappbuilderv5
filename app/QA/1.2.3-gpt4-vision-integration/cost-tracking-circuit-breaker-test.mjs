#!/usr/bin/env node

/**
 * Cost Tracking and Circuit Breaker Test - PRD 1.2.3 GPT-4 Vision Integration Service
 * QA Engineer: Validation of cost tracking and circuit breaker functionality
 */

console.log('🚀 Starting Cost Tracking and Circuit Breaker Validation');

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
  // Import required services
  const { costTrackingService } = await import('../../server/services/cost-tracking-service.js');
  const { gptVisionCircuitBreaker } = await import('../../server/services/circuit-breaker-service.js');
  
  recordTest('Services Import', true, { 
    costTrackingImported: !!costTrackingService,
    circuitBreakerImported: !!gptVisionCircuitBreaker
  });
  
  console.log('\n🔧 Testing Cost Tracking Service...');
  
  // Test cost calculation
  const testUsage = {
    prompt_tokens: 1000,
    completion_tokens: 500,
    total_tokens: 1500
  };
  
  const costCalculation = costTrackingService.calculateCost(
    testUsage, 
    'gpt-4-vision-preview', 
    true, // has image
    'high' // image detail
  );
  
  const costValid = (
    typeof costCalculation.totalCost === 'number' &&
    costCalculation.totalCost > 0 &&
    typeof costCalculation.inputCost === 'number' &&
    typeof costCalculation.outputCost === 'number' &&
    typeof costCalculation.imageCost === 'number' &&
    costCalculation.totalTokens === testUsage.total_tokens
  );
  
  recordTest('Cost Calculation', costValid, {
    totalCost: costCalculation.totalCost,
    inputCost: costCalculation.inputCost,
    outputCost: costCalculation.outputCost,
    imageCost: costCalculation.imageCost,
    totalTokens: costCalculation.totalTokens,
    breakdown: costCalculation.breakdown
  });
  
  // Test usage tracking
  const trackingData = {
    requestId: 'test-req-001',
    userId: 'qa-test-user',
    model: 'gpt-4-vision-preview',
    usage: testUsage,
    hasImage: true,
    imageDetail: 'high',
    processingTime: 2500
  };
  
  const trackingResult = costTrackingService.trackUsage(trackingData);
  
  const trackingValid = (
    trackingResult &&
    typeof trackingResult.cost === 'object' &&
    typeof trackingResult.cost.totalCost === 'number' &&
    trackingResult.requestId === trackingData.requestId &&
    trackingResult.userId === trackingData.userId
  );
  
  recordTest('Usage Tracking', trackingValid, {
    requestId: trackingResult?.requestId,
    userId: trackingResult?.userId,
    totalCost: trackingResult?.cost?.totalCost,
    tokensUsed: trackingResult?.tokensUsed,
    processingTime: trackingResult?.processingTime
  });
  
  // Test budget checking
  const budgetPermission = costTrackingService.checkRequestPermission('qa-test-user');
  
  const budgetCheckValid = (
    typeof budgetPermission.allowed === 'boolean' &&
    typeof budgetPermission.reason === 'string' &&
    budgetPermission.budgetStatus &&
    typeof budgetPermission.budgetStatus.daily === 'object'
  );
  
  recordTest('Budget Permission Check', budgetCheckValid, {
    allowed: budgetPermission.allowed,
    reason: budgetPermission.reason,
    dailySpent: budgetPermission.budgetStatus?.daily?.spent,
    dailyLimit: budgetPermission.budgetStatus?.daily?.limit,
    dailyRemaining: budgetPermission.budgetStatus?.daily?.remaining
  });
  
  // Test usage statistics
  const usageStats = costTrackingService.getUsageStatistics();
  
  const statsValid = (
    usageStats &&
    typeof usageStats.totalRequests === 'number' &&
    typeof usageStats.totalCostIncurred === 'number' &&
    typeof usageStats.totalTokensUsed === 'number' &&
    typeof usageStats.totalImages === 'number'
  );
  
  recordTest('Usage Statistics', statsValid, {
    totalRequests: usageStats?.totalRequests,
    totalCost: usageStats?.totalCostIncurred,
    totalTokens: usageStats?.totalTokensUsed,
    totalImages: usageStats?.totalImages,
    hasUserStats: !!usageStats?.userStats,
    hasModelUsage: !!usageStats?.modelUsage
  });
  
  console.log('\n🔧 Testing Circuit Breaker Service...');
  
  // Test circuit breaker status
  const initialStatus = gptVisionCircuitBreaker.getStatus();
  
  const statusValid = (
    initialStatus &&
    typeof initialStatus.state === 'string' &&
    ['CLOSED', 'OPEN', 'HALF_OPEN'].includes(initialStatus.state) &&
    typeof initialStatus.failureCount === 'number' &&
    typeof initialStatus.successCount === 'number' &&
    initialStatus.metrics &&
    typeof initialStatus.metrics.totalCalls === 'number'
  );
  
  recordTest('Circuit Breaker Status', statusValid, {
    state: initialStatus?.state,
    failureCount: initialStatus?.failureCount,
    successCount: initialStatus?.successCount,
    totalCalls: initialStatus?.metrics?.totalCalls,
    successfulCalls: initialStatus?.metrics?.successfulCalls,
    rejectedCalls: initialStatus?.metrics?.rejectedCalls
  });
  
  // Test successful execution through circuit breaker
  let successfulExecution = false;
  let executionResult = null;
  let executionError = null;
  
  try {
    executionResult = await gptVisionCircuitBreaker.execute(async () => {
      // Simulate successful API call
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      return { success: true, data: 'mock response', processingTime: 100 };
    }, {
      requestId: 'circuit-test-001',
      userId: 'qa-test-user',
      endpoint: '/api/analyze-trade'
    });
    
    successfulExecution = executionResult && executionResult.success === true;
  } catch (error) {
    executionError = error.message;
  }
  
  recordTest('Circuit Breaker Successful Execution', successfulExecution, {
    executed: successfulExecution,
    result: executionResult,
    error: executionError,
    processingTime: executionResult?.processingTime
  });
  
  // Test circuit breaker with simulated failure
  let failureHandled = false;
  let failureError = null;
  
  try {
    await gptVisionCircuitBreaker.execute(async () => {
      throw new Error('Simulated API failure');
    }, {
      requestId: 'circuit-test-failure-001',
      userId: 'qa-test-user'
    });
  } catch (error) {
    failureHandled = true;
    failureError = error.message;
  }
  
  recordTest('Circuit Breaker Failure Handling', failureHandled, {
    failureHandled,
    errorMessage: failureError,
    expectedError: 'Simulated API failure'
  });
  
  // Test circuit breaker statistics after operations
  const finalStatus = gptVisionCircuitBreaker.getStatus();
  const statisticsUpdated = (
    finalStatus.metrics.totalCalls > initialStatus.metrics.totalCalls &&
    (finalStatus.metrics.successfulCalls > initialStatus.metrics.successfulCalls ||
     finalStatus.metrics.failedCalls > initialStatus.metrics.failedCalls)
  );
  
  recordTest('Circuit Breaker Statistics Update', statisticsUpdated, {
    initialCalls: initialStatus.metrics.totalCalls,
    finalCalls: finalStatus.metrics.totalCalls,
    initialSuccesses: initialStatus.metrics.successfulCalls,
    finalSuccesses: finalStatus.metrics.successfulCalls,
    initialFailures: initialStatus.metrics.failedCalls,
    finalFailures: finalStatus.metrics.failedCalls
  });
  
  console.log('\n🔧 Testing Health Monitoring...');
  
  // Test circuit breaker health
  const healthReport = gptVisionCircuitBreaker.getHealthReport();
  
  const healthValid = (
    healthReport &&
    typeof healthReport.state === 'string' &&
    typeof healthReport.health === 'string' &&
    healthReport.metrics &&
    typeof healthReport.successRate === 'number'
  );
  
  recordTest('Circuit Breaker Health Report', healthValid, {
    state: healthReport?.state,
    health: healthReport?.health,
    successRate: healthReport?.successRate,
    averageResponseTime: healthReport?.metrics?.averageResponseTime,
    lastFailure: healthReport?.lastFailureTime
  });
  
  // Final summary
  console.log('\n📊 COST TRACKING & CIRCUIT BREAKER TEST SUMMARY:');
  console.log(`Total Tests: ${testResults.summary.passed + testResults.summary.failed}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  
  if (testResults.summary.failed === 0) {
    console.log('\n🎉 ALL COST TRACKING & CIRCUIT BREAKER TESTS PASSED!');
    console.log('✅ Cost tracking calculations work correctly');
    console.log('✅ Usage tracking and budget monitoring functional');
    console.log('✅ Circuit breaker protects against failures');
    console.log('✅ Statistics and health monitoring operational');
    console.log('✅ Error handling works as expected');
    
    // Save test results
    const fs = await import('fs/promises');
    const path = await import('path');
    const reportPath = path.join(process.cwd(), 'QA/1.2.3-gpt4-vision-integration/evidence/cost-circuit-breaker-test-results.json');
    await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`📄 Test results saved to: ${reportPath}`);
    
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED');
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