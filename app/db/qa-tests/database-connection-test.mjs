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
 * QA Test Suite: Database Connection Test
 * Tests PRD-1.1.1.1 Requirements for PostgreSQL Setup
 */

class DatabaseConnectionTester {
  constructor() {
    this.testResults = [];
    this.pool = null;
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

  async addTestResult(testName, passed, details, metrics = {}) {
    this.testResults.push({
      test: testName,
      passed,
      details,
      metrics,
      timestamp: new Date().toISOString()
    });
  }

  async testBasicConnection() {
    console.log('\n🔌 Test 1: Basic Database Connection');
    const startTime = Date.now();
    
    try {
      const client = await this.pool.connect();
      const duration = Date.now() - startTime;
      
      // Test basic query
      const result = await client.query('SELECT NOW(), version()');
      const serverTime = result.rows[0].now;
      const version = result.rows[0].version;
      
      client.release();
      
      const passed = duration < 100; // PRD requirement: < 100ms
      await this.addTestResult(
        'Basic Connection',
        passed,
        `Connection established in ${duration}ms. Server time: ${serverTime}`,
        { response_time_ms: duration, server_time: serverTime, pg_version: version }
      );
      
      console.log(`${passed ? '✅' : '❌'} Connection time: ${duration}ms (Requirement: <100ms)`);
      console.log(`   PostgreSQL Version: ${version.split(' ')[0]}`);
      
      return passed;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.addTestResult(
        'Basic Connection',
        false,
        `Connection failed: ${error.message}`,
        { response_time_ms: duration, error: error.message }
      );
      
      console.log(`❌ Connection failed after ${duration}ms: ${error.message}`);
      return false;
    }
  }

  async testConnectionPoolConfiguration() {
    console.log('\n🏊 Test 2: Connection Pool Configuration');
    
    try {
      const poolConfig = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };
      
      // Verify pool is properly configured
      const maxConnections = 20; // From our config
      const configValid = this.pool.options.max === maxConnections;
      
      await this.addTestResult(
        'Pool Configuration',
        configValid,
        `Pool configured with max=${this.pool.options.max} connections`,
        { 
          pool_stats: poolConfig,
          max_connections: this.pool.options.max,
          idle_timeout: this.pool.options.idleTimeoutMillis,
          connection_timeout: this.pool.options.connectionTimeoutMillis
        }
      );
      
      console.log(`${configValid ? '✅' : '❌'} Pool max connections: ${this.pool.options.max}`);
      console.log('   Current pool stats:', poolConfig);
      console.log(`   Idle timeout: ${this.pool.options.idleTimeoutMillis}ms`);
      console.log(`   Connection timeout: ${this.pool.options.connectionTimeoutMillis}ms`);
      
      return configValid;
    } catch (error) {
      await this.addTestResult(
        'Pool Configuration',
        false,
        `Pool configuration test failed: ${error.message}`,
        { error: error.message }
      );
      
      console.log(`❌ Pool configuration test failed: ${error.message}`);
      return false;
    }
  }

  async testDatabaseCredentials() {
    console.log('\n🔑 Test 3: Database Credentials and Permissions');
    
    try {
      const client = await this.pool.connect();
      
      // Test database information
      const dbInfo = await client.query('SELECT current_database(), current_user, session_user');
      const { current_database, current_user, session_user } = dbInfo.rows[0];
      
      // Test basic permissions
      const permissionsTest = await client.query(`
        SELECT has_database_privilege(current_user, current_database(), 'CONNECT') as can_connect,
               has_database_privilege(current_user, current_database(), 'CREATE') as can_create
      `);
      const { can_connect, can_create } = permissionsTest.rows[0];
      
      client.release();
      
      const passed = can_connect && current_database === (process.env.DB_NAME || 'elite_trading_coach_ai');
      
      await this.addTestResult(
        'Database Credentials',
        passed,
        `Connected as ${current_user} to database ${current_database}`,
        {
          database: current_database,
          user: current_user,
          session_user: session_user,
          permissions: { can_connect, can_create }
        }
      );
      
      console.log(`${passed ? '✅' : '❌'} Database: ${current_database}`);
      console.log(`   User: ${current_user}`);
      console.log(`   Can connect: ${can_connect}`);
      console.log(`   Can create: ${can_create}`);
      
      return passed;
    } catch (error) {
      await this.addTestResult(
        'Database Credentials',
        false,
        `Credentials test failed: ${error.message}`,
        { error: error.message }
      );
      
      console.log(`❌ Credentials test failed: ${error.message}`);
      return false;
    }
  }

  async testSSLConfiguration() {
    console.log('\n🔒 Test 4: SSL Configuration');
    
    try {
      const client = await this.pool.connect();
      
      // Check SSL status
      const sslQuery = await client.query('SHOW ssl');
      const sslEnabled = sslQuery.rows[0].ssl === 'on';
      
      // Check if connection is encrypted (in production)
      const isProduction = process.env.NODE_ENV === 'production';
      const expectedSSL = isProduction;
      
      client.release();
      
      const passed = !isProduction || sslEnabled; // SSL should be on in production
      
      await this.addTestResult(
        'SSL Configuration',
        passed,
        `SSL enabled: ${sslEnabled}, Environment: ${process.env.NODE_ENV}`,
        {
          ssl_enabled: sslEnabled,
          environment: process.env.NODE_ENV,
          ssl_required: expectedSSL,
          pool_ssl_config: !!this.pool.options.ssl
        }
      );
      
      console.log(`${passed ? '✅' : '❌'} SSL enabled: ${sslEnabled}`);
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   Pool SSL config: ${!!this.pool.options.ssl}`);
      
      return passed;
    } catch (error) {
      await this.addTestResult(
        'SSL Configuration',
        false,
        `SSL test failed: ${error.message}`,
        { error: error.message }
      );
      
      console.log(`❌ SSL test failed: ${error.message}`);
      return false;
    }
  }

  async testQueryPerformance() {
    console.log('\n⚡ Test 5: Query Performance');
    
    const queries = [
      { name: 'Simple SELECT', query: 'SELECT 1' },
      { name: 'Date Function', query: 'SELECT NOW()' },
      { name: 'Version Check', query: 'SELECT version()' },
      { name: 'Database Info', query: 'SELECT current_database(), current_user' }
    ];
    
    const results = [];
    let allPassed = true;
    
    try {
      for (const { name, query } of queries) {
        const startTime = Date.now();
        const client = await this.pool.connect();
        
        const result = await client.query(query);
        const duration = Date.now() - startTime;
        const passed = duration < 100; // PRD requirement
        
        client.release();
        
        results.push({ name, duration, passed, rows: result.rowCount });
        allPassed = allPassed && passed;
        
        console.log(`   ${passed ? '✅' : '❌'} ${name}: ${duration}ms`);
      }
      
      await this.addTestResult(
        'Query Performance',
        allPassed,
        `All queries completed, ${results.filter(r => r.passed).length}/${results.length} under 100ms`,
        { query_results: results }
      );
      
      return allPassed;
    } catch (error) {
      await this.addTestResult(
        'Query Performance',
        false,
        `Performance test failed: ${error.message}`,
        { error: error.message, partial_results: results }
      );
      
      console.log(`❌ Performance test failed: ${error.message}`);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting PostgreSQL Database QA Test Suite');
    console.log('==============================================');
    
    await this.initializePool();
    
    const tests = [
      () => this.testBasicConnection(),
      () => this.testConnectionPoolConfiguration(),
      () => this.testDatabaseCredentials(),
      () => this.testSSLConfiguration(),
      () => this.testQueryPerformance()
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
    
    // Generate summary
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`Tests passed: ${passedTests}/${tests.length}`);
    console.log(`Success rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`);
    
    // Detailed results
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.test}: ${result.passed ? 'PASS' : 'FAIL'}`);
      console.log(`   ${result.details}`);
      if (result.metrics.response_time_ms) {
        console.log(`   Response time: ${result.metrics.response_time_ms}ms`);
      }
    });
    
    await this.cleanup();
    
    return {
      totalTests: tests.length,
      passedTests,
      successRate: (passedTests / tests.length) * 100,
      results: this.testResults
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
  const tester = new DatabaseConnectionTester();
  
  tester.runAllTests()
    .then((summary) => {
      console.log('\n✨ Test suite completed');
      process.exit(summary.passedTests === summary.totalTests ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

export { DatabaseConnectionTester };