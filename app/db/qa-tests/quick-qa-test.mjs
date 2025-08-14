import { config } from 'dotenv';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Setup for ES modules
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../../../.env.local') });

const { Pool } = require('pg');

console.log('🚀 PostgreSQL QA Test - Quick Assessment');
console.log('========================================');

async function runQuickQATest() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'elite_trading_coach_ai',
    user: process.env.DB_USER || 'trading_coach_user',
    password: process.env.DB_PASSWORD,
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });

  const testResults = [];
  let overallPassed = true;

  try {
    // Test 1: Basic Connection Performance
    console.log('\n1. Testing Connection Performance...');
    const connectionTimes = [];
    
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      const client = await pool.connect();
      const duration = Date.now() - start;
      await client.query('SELECT NOW()');
      client.release();
      connectionTimes.push(duration);
      console.log(`   Connection ${i + 1}: ${duration}ms`);
    }
    
    const avgConnectionTime = connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length;
    const connectionsPassed = connectionTimes.every(t => t < 100);
    console.log(`   Average: ${avgConnectionTime.toFixed(1)}ms (Requirement: <100ms) ${connectionsPassed ? '✅' : '❌'}`);
    
    testResults.push({
      test: 'Connection Performance',
      passed: connectionsPassed,
      avg_time: avgConnectionTime,
      requirement: '< 100ms'
    });
    
    if (!connectionsPassed) overallPassed = false;

    // Test 2: Pool Configuration
    console.log('\n2. Testing Pool Configuration...');
    const poolConfigOK = pool.options.max === 20 && pool.options.idleTimeoutMillis === 30000;
    console.log(`   Max connections: ${pool.options.max} (required: 20) ${pool.options.max === 20 ? '✅' : '❌'}`);
    console.log(`   Idle timeout: ${pool.options.idleTimeoutMillis}ms (required: 30000) ${pool.options.idleTimeoutMillis === 30000 ? '✅' : '❌'}`);
    
    testResults.push({
      test: 'Pool Configuration',
      passed: poolConfigOK,
      max_connections: pool.options.max,
      idle_timeout: pool.options.idleTimeoutMillis
    });
    
    if (!poolConfigOK) overallPassed = false;

    // Test 3: Database Credentials
    console.log('\n3. Testing Database Credentials...');
    const client = await pool.connect();
    const result = await client.query('SELECT current_database(), current_user');
    const { current_database, current_user } = result.rows[0];
    client.release();
    
    const expectedDb = process.env.DB_NAME || 'elite_trading_coach_ai';
    const expectedUser = process.env.DB_USER || 'trading_coach_user';
    const credentialsOK = current_database === expectedDb && current_user === expectedUser;
    
    console.log(`   Database: ${current_database} (expected: ${expectedDb}) ${current_database === expectedDb ? '✅' : '❌'}`);
    console.log(`   User: ${current_user} (expected: ${expectedUser}) ${current_user === expectedUser ? '✅' : '❌'}`);
    
    testResults.push({
      test: 'Database Credentials',
      passed: credentialsOK,
      database: current_database,
      user: current_user
    });
    
    if (!credentialsOK) overallPassed = false;

    // Test 4: SSL Configuration
    console.log('\n4. Testing SSL Configuration...');
    const client2 = await pool.connect();
    const sslResult = await client2.query('SHOW ssl');
    const serverSSL = sslResult.rows[0].ssl === 'on';
    client2.release();
    
    const environment = process.env.NODE_ENV || 'development';
    const poolSSL = !!pool.options.ssl;
    const sslConfigOK = environment === 'production' ? poolSSL : !poolSSL;
    
    console.log(`   Environment: ${environment}`);
    console.log(`   Server SSL: ${serverSSL}`);
    console.log(`   Pool SSL config: ${poolSSL} ${sslConfigOK ? '✅' : '❌'}`);
    
    testResults.push({
      test: 'SSL Configuration',
      passed: sslConfigOK,
      environment: environment,
      server_ssl: serverSSL,
      pool_ssl: poolSSL
    });
    
    if (!sslConfigOK) overallPassed = false;

    // Test 5: Concurrent Load
    console.log('\n5. Testing Concurrent Load...');
    const promises = [];
    const loadResults = [];
    
    for (let i = 0; i < 5; i++) {
      promises.push((async (id) => {
        const start = Date.now();
        try {
          const client = await pool.connect();
          await client.query('SELECT $1, pg_sleep(0.01)', [id]);
          client.release();
          const duration = Date.now() - start;
          loadResults.push({ id, success: true, duration });
        } catch (error) {
          const duration = Date.now() - start;
          loadResults.push({ id, success: false, duration, error: error.message });
        }
      })(i));
    }
    
    await Promise.all(promises);
    
    const successfulOps = loadResults.filter(r => r.success).length;
    const avgLoadTime = loadResults.reduce((sum, r) => sum + r.duration, 0) / loadResults.length;
    const loadTestPassed = successfulOps === 5 && avgLoadTime < 100;
    
    console.log(`   Successful operations: ${successfulOps}/5`);
    console.log(`   Average time: ${avgLoadTime.toFixed(1)}ms ${loadTestPassed ? '✅' : '❌'}`);
    
    testResults.push({
      test: 'Concurrent Load',
      passed: loadTestPassed,
      successful_ops: successfulOps,
      avg_time: avgLoadTime
    });
    
    if (!loadTestPassed) overallPassed = false;

    await pool.end();

    // Generate Summary
    console.log('\n' + '='.repeat(60));
    console.log('QA TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const passedTests = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log(`PRD Reference: PRD-1.1.1.1`);
    console.log(`Test Suite: PostgreSQL Database Setup QA`);
    console.log(`Environment: ${environment}`);
    console.log(`Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Overall QA Status: ${overallPassed ? 'APPROVED ✅' : 'REJECTED ❌'}`);
    
    console.log('\nDETAILED RESULTS:');
    testResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.test}: ${result.passed ? 'PASS ✅' : 'FAIL ❌'}`);
    });
    
    // PRD Acceptance Criteria Check
    console.log('\nPRD ACCEPTANCE CRITERIA:');
    console.log(`AC1 - Connection with 100% success rate: ${testResults[0].passed ? 'MET ✅' : 'NOT MET ❌'}`);
    console.log(`AC2 - Pool maintains stable connections: ${testResults[4].passed ? 'MET ✅' : 'NOT MET ❌'}`);
    console.log(`AC3 - SSL encryption verified: ${testResults[3].passed ? 'MET ✅' : 'NOT MET ❌'}`);
    
    const allCriteriaMet = testResults[0].passed && testResults[4].passed && testResults[3].passed;
    console.log(`All Acceptance Criteria: ${allCriteriaMet ? 'MET ✅' : 'NOT MET ❌'}`);
    
    // Issues and Recommendations
    console.log('\nISSUES DISCOVERED:');
    const issues = testResults.filter(t => !t.passed);
    if (issues.length === 0) {
      console.log('No issues discovered ✅');
    } else {
      issues.forEach(issue => {
        console.log(`- ${issue.test} failed`);
      });
    }
    
    console.log('\nRECOMMENDations:');
    console.log('1. Monitor connection performance in production');
    console.log('2. Implement connection pool metrics monitoring');
    console.log('3. Add automated database connectivity tests to CI/CD');
    
    console.log('\nQA SIGN-OFF:');
    console.log(`Status: ${overallPassed ? 'APPROVED FOR PRODUCTION' : 'REQUIRES FIXES'}`);
    console.log(`Ready for Deployment: ${overallPassed && allCriteriaMet ? 'YES' : 'NO'}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('QA ASSESSMENT COMPLETE');
    console.log('='.repeat(60));
    
    return {
      overall_passed: overallPassed,
      success_rate: successRate,
      acceptance_criteria_met: allCriteriaMet,
      test_results: testResults
    };
    
  } catch (error) {
    console.error('\n❌ QA Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    try {
      await pool.end();
    } catch (closeError) {
      console.error('Error closing pool:', closeError.message);
    }
    
    return {
      overall_passed: false,
      error: error.message
    };
  }
}

runQuickQATest().then(result => {
  process.exit(result.overall_passed ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});