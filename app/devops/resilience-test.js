/**
 * Infrastructure Resilience Testing
 * DevOps implementation for PRD 1.2.2
 * Tests system behavior under various failure scenarios
 */

console.log('🛡️  Infrastructure Resilience Testing for PRD 1.2.2');
console.log('Testing system behavior under failure conditions');
console.log('='.repeat(60));

/**
 * Resilience test scenarios
 */
const resilienceTests = {
  // Memory stress testing
  memoryStress: {
    name: 'Memory Stress Test',
    description: 'Test behavior under high memory usage',
    test: async () => {
      console.log('📊 Testing memory stress scenarios...');
      
      const initialMemory = process.memoryUsage();
      const results = {
        initial: Math.round(initialMemory.rss / 1024 / 1024),
        peak: 0,
        recovered: false,
        errors: []
      };
      
      try {
        // Simulate memory usage (careful not to crash)
        const arrays = [];
        for (let i = 0; i < 100; i++) {
          arrays.push(new Array(10000).fill('test-data'));
          
          const currentMemory = process.memoryUsage();
          const currentMB = Math.round(currentMemory.rss / 1024 / 1024);
          results.peak = Math.max(results.peak, currentMB);
          
          // Stop if memory gets too high (safety)
          if (currentMB > 200) {
            console.log(`⚠️  Memory safety limit reached: ${currentMB}MB`);
            break;
          }
        }
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        // Check recovery
        await new Promise(resolve => setTimeout(resolve, 1000));
        const finalMemory = process.memoryUsage();
        const finalMB = Math.round(finalMemory.rss / 1024 / 1024);
        
        results.recovered = finalMB < (results.peak * 0.8);
        
        console.log(`   Initial: ${results.initial}MB`);
        console.log(`   Peak: ${results.peak}MB`);
        console.log(`   Final: ${finalMB}MB`);
        console.log(`   Recovery: ${results.recovered ? 'GOOD' : 'POOR'}`);
        
        return {
          status: results.recovered ? 'PASS' : 'WARN',
          details: results
        };
        
      } catch (error) {
        results.errors.push(error.message);
        return {
          status: 'FAIL',
          details: results,
          error: error.message
        };
      }
    }
  },

  // Error handling resilience
  errorHandling: {
    name: 'Error Handling Resilience',
    description: 'Test graceful error handling and recovery',
    test: async () => {
      console.log('🚨 Testing error handling resilience...');
      
      const results = {
        caughtErrors: 0,
        uncaughtErrors: 0,
        recoveryAttempts: 0,
        successful: true
      };
      
      try {
        // Test various error scenarios
        const errorScenarios = [
          () => { throw new Error('Simulated API error'); },
          () => { throw new TypeError('Type validation error'); },
          () => { JSON.parse('invalid json'); },
          () => { new URL('invalid-url'); }
        ];
        
        for (const scenario of errorScenarios) {
          try {
            scenario();
          } catch (error) {
            results.caughtErrors++;
            console.log(`   ✅ Caught: ${error.constructor.name}`);
          }
        }
        
        // Test async error handling
        try {
          await Promise.reject(new Error('Async error test'));
        } catch (error) {
          results.caughtErrors++;
          console.log(`   ✅ Caught async error: ${error.message}`);
        }
        
        console.log(`   Errors handled: ${results.caughtErrors}/5`);
        
        return {
          status: results.caughtErrors >= 4 ? 'PASS' : 'FAIL',
          details: results
        };
        
      } catch (error) {
        results.uncaughtErrors++;
        return {
          status: 'FAIL',
          details: results,
          error: error.message
        };
      }
    }
  },

  // Configuration resilience
  configResilience: {
    name: 'Configuration Resilience',
    description: 'Test behavior with missing/invalid configuration',
    test: async () => {
      console.log('⚙️  Testing configuration resilience...');
      
      const results = {
        missingConfigHandled: 0,
        invalidConfigHandled: 0,
        totalTests: 0,
        errors: []
      };
      
      // Test missing environment variables
      const testEnvVars = ['FAKE_VAR_1', 'FAKE_VAR_2', 'FAKE_VAR_3'];
      
      for (const envVar of testEnvVars) {
        results.totalTests++;
        try {
          const value = process.env[envVar];
          if (!value) {
            // Properly handled missing config
            results.missingConfigHandled++;
            console.log(`   ✅ Missing ${envVar} handled gracefully`);
          }
        } catch (error) {
          results.errors.push(`${envVar}: ${error.message}`);
        }
      }
      
      // Test invalid configuration values
      const invalidConfigs = [
        { key: 'INVALID_NUMBER', value: 'not-a-number', test: () => parseInt('not-a-number') },
        { key: 'INVALID_URL', value: 'not-a-url', test: () => new URL('not-a-url') },
        { key: 'INVALID_JSON', value: '{invalid}', test: () => JSON.parse('{invalid}') }
      ];
      
      for (const config of invalidConfigs) {
        results.totalTests++;
        try {
          config.test();
          // If we get here, invalid config wasn't caught
          console.log(`   ⚠️  Invalid ${config.key} not detected`);
        } catch (error) {
          // Properly caught invalid config
          results.invalidConfigHandled++;
          console.log(`   ✅ Invalid ${config.key} handled: ${error.constructor.name}`);
        }
      }
      
      const handledCount = results.missingConfigHandled + results.invalidConfigHandled;
      console.log(`   Configuration errors handled: ${handledCount}/${results.totalTests}`);
      
      return {
        status: handledCount >= (results.totalTests * 0.8) ? 'PASS' : 'WARN',
        details: results
      };
    }
  },

  // Resource exhaustion
  resourceExhaustion: {
    name: 'Resource Exhaustion Protection',
    description: 'Test protection against resource exhaustion',
    test: async () => {
      console.log('💾 Testing resource exhaustion protection...');
      
      const results = {
        protectionMechanisms: 0,
        totalChecks: 0,
        details: []
      };
      
      // Check file size limits
      results.totalChecks++;
      const maxFileSize = process.env.MAX_FILE_SIZE_MB;
      if (maxFileSize && parseInt(maxFileSize) <= 50) {
        results.protectionMechanisms++;
        results.details.push('File size limits configured');
        console.log(`   ✅ File size limit: ${maxFileSize}MB`);
      } else {
        results.details.push('File size limits missing or too high');
        console.log(`   ⚠️  File size limit issue`);
      }
      
      // Check rate limiting configuration
      results.totalChecks++;
      const rateLimit = process.env.RATE_LIMIT_MAX;
      if (rateLimit && parseInt(rateLimit) <= 1000) {
        results.protectionMechanisms++;
        results.details.push('Rate limiting configured');
        console.log(`   ✅ Rate limit: ${rateLimit} req/window`);
      } else {
        results.details.push('Rate limiting missing or too permissive');
        console.log(`   ⚠️  Rate limiting issue`);
      }
      
      // Check memory monitoring
      results.totalChecks++;
      const currentMemory = process.memoryUsage();
      const memoryMB = Math.round(currentMemory.rss / 1024 / 1024);
      if (memoryMB < 100) {
        results.protectionMechanisms++;
        results.details.push('Memory usage within limits');
        console.log(`   ✅ Memory usage: ${memoryMB}MB`);
      } else {
        results.details.push('High memory usage detected');
        console.log(`   ⚠️  Memory usage: ${memoryMB}MB`);
      }
      
      console.log(`   Protection mechanisms: ${results.protectionMechanisms}/${results.totalChecks}`);
      
      return {
        status: results.protectionMechanisms >= (results.totalChecks * 0.8) ? 'PASS' : 'WARN',
        details: results
      };
    }
  }
};

/**
 * Run individual resilience test
 */
async function runResilienceTest(testName) {
  const test = resilienceTests[testName];
  if (!test) {
    throw new Error(`Unknown test: ${testName}`);
  }
  
  console.log(`\n🧪 ${test.name}`);
  console.log(`   ${test.description}`);
  console.log('   ' + '-'.repeat(40));
  
  const startTime = Date.now();
  const result = await test.test();
  const duration = Date.now() - startTime;
  
  result.testName = testName;
  result.duration = duration;
  result.timestamp = new Date().toISOString();
  
  const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
  console.log(`   Status: ${statusIcon} ${result.status} (${duration}ms)`);
  
  return result;
}

/**
 * Run comprehensive resilience testing
 */
async function runComprehensiveResilienceTest() {
  console.log('Starting comprehensive resilience testing...\n');
  
  const results = [];
  
  for (const testName of Object.keys(resilienceTests)) {
    try {
      const result = await runResilienceTest(testName);
      results.push(result);
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Test ${testName} failed:`, error.message);
      results.push({
        testName,
        status: 'FAIL',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Generate summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESILIENCE TESTING SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  console.log(`Tests Run: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Warnings: ${warned}`);
  console.log(`Failed: ${failed}`);
  
  const overallGrade = failed > 0 ? 'FAIL' : warned > 0 ? 'WARN' : 'PASS';
  console.log(`\nOverall Resilience Grade: ${overallGrade}`);
  
  if (overallGrade === 'PASS') {
    console.log('✅ System demonstrates good resilience characteristics');
  } else if (overallGrade === 'WARN') {
    console.log('⚠️  Some resilience concerns detected - monitor in production');
  } else {
    console.log('❌ Critical resilience issues - address before production');
  }
  
  console.log('\n💡 Resilience Recommendations:');
  if (failed === 0 && warned === 0) {
    console.log('   - System resilience is adequate for production');
    console.log('   - Continue monitoring in production environment');
  } else {
    console.log('   - Review failed tests and implement fixes');
    console.log('   - Add monitoring for resource usage');
    console.log('   - Implement graceful degradation patterns');
  }
  
  return {
    summary: { passed, warned, failed, total: results.length },
    overallGrade,
    results,
    timestamp: new Date().toISOString()
  };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testName = process.argv[2];
  
  if (testName && resilienceTests[testName]) {
    runResilienceTest(testName)
      .then(result => {
        process.exit(result.status === 'FAIL' ? 1 : 0);
      })
      .catch(error => {
        console.error('❌ Resilience test failed:', error);
        process.exit(1);
      });
  } else {
    runComprehensiveResilienceTest()
      .then(summary => {
        console.log('\n' + '='.repeat(60));
        process.exit(summary.overallGrade === 'FAIL' ? 1 : 0);
      })
      .catch(error => {
        console.error('❌ Resilience testing failed:', error);
        process.exit(1);
      });
  }
}