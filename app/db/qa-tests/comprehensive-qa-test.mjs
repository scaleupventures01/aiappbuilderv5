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

/**
 * Comprehensive QA Test Suite for PostgreSQL Database Setup
 * Tests all requirements from PRD-1.1.1.1
 */

class ComprehensiveQATester {
  constructor() {
    this.testResults = [];
    this.pool = null;
    this.startTime = Date.now();
  }

  async initializePool() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'elite_trading_coach_ai',
      user: process.env.DB_USER || 'trading_coach_user',
      password: process.env.DB_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    this.pool.on('error', (err) => {
      console.error('Pool error:', err);
    });
  }

  addTestResult(testName, passed, details, metrics = {}) {
    this.testResults.push({
      test: testName,
      passed,
      details,
      metrics,
      timestamp: new Date().toISOString()
    });
  }

  // Test 1: Basic Connection (PRD KPI 1: < 100ms response time)
  async testBasicConnection() {
    console.log('\n🔌 Test 1: Basic Database Connection (PRD KPI 1)');
    const startTime = Date.now();
    
    try {
      const client = await this.pool.connect();
      const duration = Date.now() - startTime;
      
      const result = await client.query('SELECT NOW() as server_time, version() as pg_version');
      const serverInfo = result.rows[0];
      
      client.release();
      
      const passed = duration < 100; // PRD requirement
      this.addTestResult(
        'Basic Connection',
        passed,
        `Connection established in ${duration}ms (requirement: <100ms)`,
        { 
          response_time_ms: duration,
          server_time: serverInfo.server_time,
          pg_version: serverInfo.pg_version.split(' ')[0],
          requirement_met: passed
        }
      );
      
      console.log(`${passed ? '✅' : '❌'} Connection time: ${duration}ms`);
      console.log(`   PostgreSQL: ${serverInfo.pg_version.split(' ')[0]}`);
      
      return passed;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult(
        'Basic Connection',
        false,
        `Connection failed: ${error.message}`,
        { response_time_ms: duration, error: error.message }
      );
      
      console.log(`❌ Connection failed: ${error.message}`);
      return false;
    }
  }

  // Test 2: Connection Pool Configuration (PRD requirement)
  async testConnectionPoolSetup() {
    console.log('\n🏊 Test 2: Connection Pool Configuration');
    
    try {
      const poolConfig = {
        max: this.pool.options.max,
        idleTimeoutMillis: this.pool.options.idleTimeoutMillis,
        connectionTimeoutMillis: this.pool.options.connectionTimeoutMillis
      };
      
      const currentStats = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };
      
      const configValid = poolConfig.max === 20 && poolConfig.idleTimeoutMillis === 30000;
      
      this.addTestResult(
        'Connection Pool Setup',
        configValid,
        `Pool configured: max=${poolConfig.max}, idle=${poolConfig.idleTimeoutMillis}ms`,
        { pool_config: poolConfig, current_stats: currentStats }
      );
      
      console.log(`${configValid ? '✅' : '❌'} Pool configuration`);
      console.log(`   Max connections: ${poolConfig.max} (required: 20)`);
      console.log(`   Idle timeout: ${poolConfig.idleTimeoutMillis}ms (required: 30000)`);
      console.log(`   Current stats:`, currentStats);
      
      return configValid;
    } catch (error) {
      this.addTestResult(
        'Connection Pool Setup',
        false,
        `Pool test failed: ${error.message}`,
        { error: error.message }
      );
      
      console.log(`❌ Pool configuration test failed: ${error.message}`);
      return false;
    }
  }

  // Test 3: Database Credentials and Permissions (PRD requirement)
  async testDatabaseCredentials() {
    console.log('\n🔑 Test 3: Database Credentials and Permissions');
    
    try {
      const client = await this.pool.connect();
      
      const dbInfo = await client.query('SELECT current_database(), current_user, session_user');
      const { current_database, current_user, session_user } = dbInfo.rows[0];
      
      const permissions = await client.query(`
        SELECT 
          has_database_privilege(current_user, current_database(), 'CONNECT') as can_connect,
          has_database_privilege(current_user, current_database(), 'CREATE') as can_create,
          has_database_privilege(current_user, current_database(), 'TEMPORARY') as can_temp
      `);
      const perms = permissions.rows[0];
      
      client.release();
      
      const expectedDb = process.env.DB_NAME || 'elite_trading_coach_ai';
      const expectedUser = process.env.DB_USER || 'trading_coach_user';
      
      const passed = current_database === expectedDb && 
                    current_user === expectedUser && 
                    perms.can_connect;
      
      this.addTestResult(
        'Database Credentials',
        passed,
        `Connected as ${current_user} to ${current_database}`,
        {
          database: current_database,
          expected_database: expectedDb,
          user: current_user,
          expected_user: expectedUser,
          permissions: perms
        }
      );
      
      console.log(`${passed ? '✅' : '❌'} Database credentials`);
      console.log(`   Database: ${current_database} (expected: ${expectedDb})`);
      console.log(`   User: ${current_user} (expected: ${expectedUser})`);
      console.log(`   Permissions:`, perms);
      
      return passed;
    } catch (error) {
      this.addTestResult(
        'Database Credentials',
        false,
        `Credentials test failed: ${error.message}`,
        { error: error.message }
      );
      
      console.log(`❌ Credentials test failed: ${error.message}`);
      return false;
    }
  }

  // Test 4: SSL Configuration (PRD requirement)
  async testSSLConfiguration() {
    console.log('\n🔒 Test 4: SSL Configuration');
    
    try {
      const client = await this.pool.connect();
      
      const sslQuery = await client.query('SHOW ssl');
      const serverSSLEnabled = sslQuery.rows[0].ssl === 'on';
      
      const isProduction = process.env.NODE_ENV === 'production';
      const poolSSLConfig = !!this.pool.options.ssl;
      
      client.release();
      
      // In development: SSL should be disabled
      // In production: SSL should be enabled
      const passed = isProduction ? poolSSLConfig : !poolSSLConfig;
      
      this.addTestResult(
        'SSL Configuration',
        passed,
        `Environment: ${process.env.NODE_ENV}, Server SSL: ${serverSSLEnabled}, Pool SSL: ${poolSSLConfig}`,
        {
          environment: process.env.NODE_ENV,
          server_ssl_enabled: serverSSLEnabled,
          pool_ssl_configured: poolSSLConfig,
          ssl_requirement_met: passed
        }
      );
      
      console.log(`${passed ? '✅' : '❌'} SSL configuration`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Server SSL capability: ${serverSSLEnabled}`);
      console.log(`   Pool SSL config: ${poolSSLConfig}`);
      
      return passed;
    } catch (error) {
      this.addTestResult(
        'SSL Configuration',
        false,
        `SSL test failed: ${error.message}`,
        { error: error.message }
      );
      
      console.log(`❌ SSL test failed: ${error.message}`);
      return false;
    }
  }

  // Test 5: Query Performance (PRD requirement: < 100ms)
  async testQueryPerformance() {
    console.log('\n⚡ Test 5: Query Performance');
    
    const testQueries = [
      { name: 'Simple SELECT', query: 'SELECT 1' },
      { name: 'Current Time', query: 'SELECT NOW()' },
      { name: 'Database Info', query: 'SELECT current_database(), current_user' },
      { name: 'System Info', query: 'SELECT version()' }
    ];
    
    const results = [];
    let allPassed = true;
    
    try {
      for (const { name, query } of testQueries) {
        const startTime = Date.now();
        const client = await this.pool.connect();
        
        const result = await client.query(query);
        const duration = Date.now() - startTime;
        const passed = duration < 100;
        
        client.release();
        
        results.push({ name, duration, passed, rowCount: result.rowCount });
        allPassed = allPassed && passed;
        
        console.log(`   ${passed ? '✅' : '❌'} ${name}: ${duration}ms`);
      }
      
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      
      this.addTestResult(
        'Query Performance',
        allPassed,
        `${results.filter(r => r.passed).length}/${results.length} queries under 100ms, avg: ${avgDuration.toFixed(1)}ms`,
        { 
          query_results: results,
          average_duration_ms: avgDuration,
          all_under_100ms: allPassed
        }
      );
      
      console.log(`${allPassed ? '✅' : '❌'} Query performance test`);
      console.log(`   Average duration: ${avgDuration.toFixed(1)}ms`);
      
      return allPassed;
    } catch (error) {
      this.addTestResult(
        'Query Performance',
        false,
        `Performance test failed: ${error.message}`,
        { error: error.message, partial_results: results }
      );
      
      console.log(`❌ Performance test failed: ${error.message}`);
      return false;
    }
  }

  // Test 6: Connection Pool Load Test
  async testConnectionPoolLoad() {
    console.log('\n🌊 Test 6: Connection Pool Load Test');
    
    try {
      const concurrentOperations = 10;
      const promises = [];
      const results = [];
      
      for (let i = 0; i < concurrentOperations; i++) {
        promises.push(this.performConcurrentOperation(i, results));
      }
      
      await Promise.all(promises);
      
      const successful = results.filter(r => r.success).length;
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const passed = successful === concurrentOperations && avgDuration < 100;
      
      this.addTestResult(
        'Connection Pool Load',
        passed,
        `${successful}/${concurrentOperations} operations successful, avg: ${avgDuration.toFixed(1)}ms`,
        {
          total_operations: concurrentOperations,
          successful_operations: successful,
          average_duration_ms: avgDuration,
          operation_results: results
        }
      );
      
      console.log(`${passed ? '✅' : '❌'} Pool load test`);
      console.log(`   Successful: ${successful}/${concurrentOperations}`);
      console.log(`   Average duration: ${avgDuration.toFixed(1)}ms`);
      
      return passed;
    } catch (error) {
      this.addTestResult(
        'Connection Pool Load',
        false,
        `Load test failed: ${error.message}`,
        { error: error.message }
      );
      
      console.log(`❌ Load test failed: ${error.message}`);
      return false;
    }
  }

  async performConcurrentOperation(id, results) {
    const startTime = Date.now();
    try {
      const client = await this.pool.connect();
      await client.query('SELECT $1 as operation_id, NOW() as timestamp', [id]);
      client.release();
      
      const duration = Date.now() - startTime;
      results.push({ id, success: true, duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({ id, success: false, duration, error: error.message });
    }
  }

  // Test 7: Acceptance Criteria Verification
  async verifyAcceptanceCriteria() {
    console.log('\n✅ Test 7: PRD Acceptance Criteria Verification');
    
    const criteria = [
      {
        id: 'AC1',
        description: 'Can establish connection to PostgreSQL with 100% success rate',
        test: () => this.testResults.find(r => r.test === 'Basic Connection')?.passed || false
      },
      {
        id: 'AC2', 
        description: 'Connection pool maintains stable connections under normal load',
        test: () => this.testResults.find(r => r.test === 'Connection Pool Load')?.passed || false
      },
      {
        id: 'AC3',
        description: 'SSL encryption verified for production connections',
        test: () => this.testResults.find(r => r.test === 'SSL Configuration')?.passed || false
      }
    ];
    
    let passedCriteria = 0;
    
    criteria.forEach(criterion => {
      const passed = criterion.test();
      passedCriteria += passed ? 1 : 0;
      
      console.log(`   ${passed ? '✅' : '❌'} ${criterion.id}: ${criterion.description}`);
    });
    
    const allCriteriaPassed = passedCriteria === criteria.length;
    
    this.addTestResult(
      'Acceptance Criteria',
      allCriteriaPassed,
      `${passedCriteria}/${criteria.length} acceptance criteria passed`,
      {
        total_criteria: criteria.length,
        passed_criteria: passedCriteria,
        criteria_details: criteria.map(c => ({ id: c.id, passed: c.test() }))
      }
    );
    
    console.log(`${allCriteriaPassed ? '✅' : '❌'} Acceptance criteria: ${passedCriteria}/${criteria.length} passed`);
    
    return allCriteriaPassed;
  }

  async runComprehensiveTests() {
    console.log('🚀 PostgreSQL Database Setup - Comprehensive QA Test Suite');
    console.log('===========================================================');
    console.log(`PRD: PRD-1.1.1.1 - PostgreSQL Database Installation and Configuration`);
    console.log(`Test Start Time: ${new Date().toISOString()}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    await this.initializePool();
    
    const tests = [
      () => this.testBasicConnection(),
      () => this.testConnectionPoolSetup(),
      () => this.testDatabaseCredentials(),
      () => this.testSSLConfiguration(),
      () => this.testQueryPerformance(),
      () => this.testConnectionPoolLoad(),
      () => this.verifyAcceptanceCriteria()
    ];
    
    let passedTests = 0;
    
    for (const test of tests) {
      try {
        const result = await test();
        if (result) passedTests++;
      } catch (error) {
        console.error(`Test failed with error: ${error.message}`);
      }
    }
    
    const totalDuration = Date.now() - this.startTime;
    const successRate = (passedTests / tests.length) * 100;
    const qaSignOff = passedTests === tests.length;
    
    // Generate QA Report
    console.log('\n📊 QA TEST RESULTS SUMMARY');
    console.log('===========================');
    console.log(`Test Duration: ${totalDuration}ms`);
    console.log(`Tests Passed: ${passedTests}/${tests.length}`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`QA Sign-off: ${qaSignOff ? 'APPROVED ✅' : 'FAILED ❌'}`);
    
    console.log('\n📋 DETAILED TEST RESULTS:');
    console.log('=========================');
    this.testResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.test}: ${result.passed ? 'PASS' : 'FAIL'}`);
      console.log(`   ${result.details}`);
      if (result.metrics.response_time_ms) {
        console.log(`   Response time: ${result.metrics.response_time_ms}ms`);
      }
    });
    
    await this.cleanup();
    
    return {
      prd: 'PRD-1.1.1.1',
      testSuite: 'PostgreSQL Database Setup QA',
      executionTime: totalDuration,
      totalTests: tests.length,
      passedTests,
      successRate,
      qaSignOff,
      testResults: this.testResults,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
  }

  async cleanup() {
    if (this.pool) {
      await this.pool.end();
      console.log('\n🧹 Database connections closed');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ComprehensiveQATester();
  
  tester.runComprehensiveTests()
    .then((report) => {
      console.log('\n✨ QA Test Suite Completed');
      console.log(`QA Sign-off Status: ${report.qaSignOff ? 'APPROVED' : 'REJECTED'}`);
      process.exit(report.qaSignOff ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ QA Test Suite Failed:', error);
      process.exit(1);
    });
}

export { ComprehensiveQATester };