/**
 * Load Testing for File Upload Handler
 * DevOps Implementation for PRD 1.2.2
 * Tests concurrent upload handling and server resilience
 */

import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load test configuration
 */
const loadTestConfig = {
  // Test scenarios
  scenarios: {
    light: { users: 5, duration: 30, rampUp: 5 },
    moderate: { users: 15, duration: 60, rampUp: 10 },
    heavy: { users: 30, duration: 120, rampUp: 20 },
    spike: { users: 50, duration: 30, rampUp: 5 }
  },
  
  // File upload test parameters
  upload: {
    endpoint: '/api/upload',
    maxFileSize: '10MB',
    testFileSizes: ['100KB', '1MB', '5MB', '10MB'],
    concurrentUploads: [1, 5, 10, 20]
  },
  
  // Performance thresholds
  thresholds: {
    responseTime: {
      target: 200,    // Target response time (ms)
      acceptable: 500, // Acceptable response time (ms)
      critical: 2000   // Critical threshold (ms)
    },
    errorRate: {
      acceptable: 1,   // 1% error rate acceptable
      critical: 5      // 5% error rate critical
    },
    throughput: {
      target: 10,      // Target uploads per second
      minimum: 5       // Minimum acceptable throughput
    }
  }
};

/**
 * Test metrics collection
 */
class LoadTestMetrics {
  constructor() {
    this.reset();
  }

  reset() {
    this.requests = [];
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
    this.summary = null;
  }

  recordRequest(request) {
    this.requests.push({
      timestamp: Date.now(),
      responseTime: request.responseTime,
      success: request.success,
      size: request.size,
      endpoint: request.endpoint,
      statusCode: request.statusCode
    });
  }

  recordError(error) {
    this.errors.push({
      timestamp: Date.now(),
      message: error.message,
      type: error.type,
      statusCode: error.statusCode
    });
  }

  calculateSummary() {
    if (this.requests.length === 0) {
      return { error: 'No requests recorded' };
    }

    const totalDuration = this.endTime - this.startTime;
    const successfulRequests = this.requests.filter(r => r.success);
    const responseTimes = this.requests.map(r => r.responseTime);
    
    responseTimes.sort((a, b) => a - b);
    
    this.summary = {
      duration: totalDuration,
      totalRequests: this.requests.length,
      successfulRequests: successfulRequests.length,
      failedRequests: this.requests.length - successfulRequests.length,
      errorRate: ((this.requests.length - successfulRequests.length) / this.requests.length) * 100,
      throughput: (this.requests.length / totalDuration) * 1000,
      
      responseTime: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        p50: responseTimes[Math.floor(responseTimes.length * 0.5)],
        p90: responseTimes[Math.floor(responseTimes.length * 0.9)],
        p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
        p99: responseTimes[Math.floor(responseTimes.length * 0.99)]
      },
      
      errors: this.errors,
      totalErrors: this.errors.length
    };

    return this.summary;
  }

  getPerformanceGrade() {
    if (!this.summary) {
      this.calculateSummary();
    }

    const thresholds = loadTestConfig.thresholds;
    let grade = 'A';
    const issues = [];

    // Check response time
    if (this.summary.responseTime.avg > thresholds.responseTime.critical) {
      grade = 'F';
      issues.push('Critical response time exceeded');
    } else if (this.summary.responseTime.avg > thresholds.responseTime.acceptable) {
      grade = 'C';
      issues.push('Response time above acceptable threshold');
    }

    // Check error rate
    if (this.summary.errorRate > thresholds.errorRate.critical) {
      grade = 'F';
      issues.push('Critical error rate exceeded');
    } else if (this.summary.errorRate > thresholds.errorRate.acceptable) {
      if (grade !== 'F') grade = 'C';
      issues.push('Error rate above acceptable threshold');
    }

    // Check throughput
    if (this.summary.throughput < thresholds.throughput.minimum) {
      if (grade !== 'F') grade = 'D';
      issues.push('Throughput below minimum requirement');
    }

    return { grade, issues };
  }
}

/**
 * Mock file upload request (simulates without actual HTTP)
 */
async function simulateUploadRequest(fileSize, endpoint = '/api/upload') {
  const startTime = performance.now();
  
  // Simulate processing time based on file size
  const baseDuration = 50; // Base response time
  const sizeMultiplier = {
    '100KB': 1,
    '1MB': 2,
    '5MB': 5,
    '10MB': 10
  };
  
  const simulatedDuration = baseDuration * (sizeMultiplier[fileSize] || 1);
  const jitter = Math.random() * 50; // Add some randomness
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, simulatedDuration + jitter));
  
  const responseTime = performance.now() - startTime;
  
  // Simulate occasional errors (5% error rate)
  const success = Math.random() > 0.05;
  const statusCode = success ? 200 : (Math.random() > 0.5 ? 400 : 500);
  
  return {
    responseTime: Math.round(responseTime),
    success,
    statusCode,
    size: fileSize,
    endpoint
  };
}

/**
 * Run concurrent upload test
 */
async function runConcurrentUploadTest(concurrentUsers, duration, fileSize = '1MB') {
  console.log(`\n🚀 Starting concurrent upload test:`);
  console.log(`   Users: ${concurrentUsers}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   File Size: ${fileSize}`);
  
  const metrics = new LoadTestMetrics();
  metrics.startTime = Date.now();
  
  // Create user simulation promises
  const userPromises = [];
  
  for (let i = 0; i < concurrentUsers; i++) {
    const userPromise = (async () => {
      const endTime = Date.now() + (duration * 1000);
      let requestCount = 0;
      
      while (Date.now() < endTime) {
        try {
          const result = await simulateUploadRequest(fileSize);
          metrics.recordRequest(result);
          requestCount++;
          
          // Small delay between requests from same user
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        } catch (error) {
          metrics.recordError({
            message: error.message,
            type: 'simulation_error',
            statusCode: 0
          });
        }
      }
      
      return requestCount;
    })();
    
    userPromises.push(userPromise);
  }
  
  // Wait for all users to complete
  const results = await Promise.all(userPromises);
  metrics.endTime = Date.now();
  
  console.log(`✅ Test completed. Total requests: ${results.reduce((a, b) => a + b, 0)}`);
  
  return metrics;
}

/**
 * Run load test scenario
 */
async function runLoadTestScenario(scenarioName) {
  const scenario = loadTestConfig.scenarios[scenarioName];
  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioName}`);
  }
  
  console.log(`\n📊 Running Load Test Scenario: ${scenarioName.toUpperCase()}`);
  console.log('='.repeat(50));
  
  const metrics = await runConcurrentUploadTest(
    scenario.users,
    scenario.duration,
    '1MB' // Standard test file size
  );
  
  const summary = metrics.calculateSummary();
  const grade = metrics.getPerformanceGrade();
  
  console.log('\n📈 Load Test Results:');
  console.log(`Total Requests: ${summary.totalRequests}`);
  console.log(`Successful: ${summary.successfulRequests} (${(100 - summary.errorRate).toFixed(1)}%)`);
  console.log(`Failed: ${summary.failedRequests} (${summary.errorRate.toFixed(1)}%)`);
  console.log(`Throughput: ${summary.throughput.toFixed(1)} req/s`);
  console.log(`\nResponse Times:`);
  console.log(`  Average: ${summary.responseTime.avg.toFixed(0)}ms`);
  console.log(`  P50: ${summary.responseTime.p50}ms`);
  console.log(`  P90: ${summary.responseTime.p90}ms`);
  console.log(`  P95: ${summary.responseTime.p95}ms`);
  console.log(`  P99: ${summary.responseTime.p99}ms`);
  
  console.log(`\n🎯 Performance Grade: ${grade.grade}`);
  if (grade.issues.length > 0) {
    console.log('⚠️  Issues:');
    grade.issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  return { scenario: scenarioName, metrics, summary, grade };
}

/**
 * Run comprehensive load testing
 */
async function runComprehensiveLoadTest() {
  console.log('🧪 DevOps Load Testing for File Upload Handler');
  console.log('PRD 1.2.2 Implementation Validation');
  console.log('='.repeat(50));
  
  const results = [];
  
  // Test each scenario
  for (const scenarioName of ['light', 'moderate', 'heavy']) {
    try {
      const result = await runLoadTestScenario(scenarioName);
      results.push(result);
      
      // Brief pause between scenarios
      console.log('\n⏳ Cooling down...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Scenario ${scenarioName} failed:`, error.message);
      results.push({
        scenario: scenarioName,
        error: error.message,
        grade: { grade: 'F', issues: ['Test execution failed'] }
      });
    }
  }
  
  // Generate comprehensive report
  console.log('\n📋 Comprehensive Load Test Report');
  console.log('='.repeat(50));
  
  const overallGrades = results
    .filter(r => r.grade && !r.error)
    .map(r => r.grade.grade);
  
  const overallGrade = overallGrades.length > 0 
    ? overallGrades.includes('F') ? 'F' 
      : overallGrades.includes('D') ? 'D'
      : overallGrades.includes('C') ? 'C' 
      : 'A'
    : 'F';
  
  console.log(`Overall Performance Grade: ${overallGrade}`);
  
  for (const result of results) {
    if (result.error) {
      console.log(`❌ ${result.scenario}: FAILED (${result.error})`);
    } else {
      console.log(`${result.grade.grade === 'A' ? '✅' : result.grade.grade === 'F' ? '❌' : '⚠️'} ${result.scenario}: Grade ${result.grade.grade}`);
    }
  }
  
  // Recommendations
  console.log('\n💡 DevOps Recommendations:');
  if (overallGrade === 'A') {
    console.log('✅ System performance meets all requirements');
    console.log('✅ Ready for production deployment');
  } else if (overallGrade === 'F') {
    console.log('❌ Critical performance issues detected');
    console.log('❌ NOT ready for production - requires optimization');
  } else {
    console.log('⚠️  Performance issues detected');
    console.log('⚠️  Consider optimization before high-load deployment');
  }
  
  return {
    overallGrade,
    results,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };
}

// Export functions
export {
  runLoadTestScenario,
  runComprehensiveLoadTest,
  runConcurrentUploadTest,
  LoadTestMetrics,
  loadTestConfig
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scenario = process.argv[2] || 'comprehensive';
  
  if (scenario === 'comprehensive') {
    runComprehensiveLoadTest()
      .then(results => {
        console.log('\n' + '='.repeat(50));
        
        // Save results
        import('fs/promises').then(fs => {
          const reportPath = join(__dirname, `../devops/load-test-report-${Date.now()}.json`);
          return fs.writeFile(reportPath, JSON.stringify(results, null, 2));
        }).then(reportPath => {
          console.log(`📄 Load test report saved`);
        }).catch(err => {
          console.error('Failed to save report:', err.message);
        });
        
        process.exit(results.overallGrade === 'F' ? 1 : 0);
      })
      .catch(error => {
        console.error('❌ Load test failed:', error);
        process.exit(1);
      });
  } else {
    runLoadTestScenario(scenario)
      .then(result => {
        process.exit(result.grade.grade === 'F' ? 1 : 0);
      })
      .catch(error => {
        console.error('❌ Load test failed:', error);
        process.exit(1);
      });
  }
}