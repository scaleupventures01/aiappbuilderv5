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
 * QA Test Suite: SSL Configuration and Failover Testing
 * Tests SSL and connection resilience according to PRD-1.1.1.1
 */

class SSLFailoverTester {
  constructor() {
    this.testResults = [];
  }

  async testSSLConfiguration() {
    console.log('\n🔒 Test: SSL Configuration');
    
    try {
      // Test local development SSL configuration (should be disabled)
      const localPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'elite_trading_coach_ai',
        user: process.env.DB_USER || 'trading_coach_user',
        password: process.env.DB_PASSWORD,
        ssl: false // Development mode
      });

      const client = await localPool.connect();
      
      // Check SSL status
      const sslResult = await client.query('SHOW ssl');
      const serverSSLEnabled = sslResult.rows[0].ssl === 'on';
      
      // Check connection encryption status
      const encryptionResult = await client.query(`
        SELECT CASE 
          WHEN ssl IS TRUE THEN 'encrypted' 
          ELSE 'not encrypted' 
        END as connection_status
        FROM pg_stat_ssl 
        WHERE pid = pg_backend_pid()
      `);
      
      const connectionEncrypted = encryptionResult.rows[0]?.connection_status === 'encrypted';
      
      client.release();
      await localPool.end();
      
      // Test production SSL configuration simulation
      const prodPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'elite_trading_coach_ai',
        user: process.env.DB_USER || 'trading_coach_user',
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false } // Production mode simulation
      });

      let prodSSLWorking = false;
      try {
        const prodClient = await prodPool.connect();
        prodClient.release();
        prodSSLWorking = true;
      } catch (error) {
        // SSL might not be configured on local PostgreSQL
        console.log('   Note: SSL connection attempt failed (expected for local dev):', error.message);
      }
      await prodPool.end();

      const devConfigCorrect = !connectionEncrypted; // Should not be encrypted in development
      const passed = devConfigCorrect;

      console.log(`${passed ? '✅' : '❌'} SSL configuration test`);
      console.log(`   Server SSL capability: ${serverSSLEnabled ? 'enabled' : 'disabled'}`);
      console.log(`   Development connection: ${connectionEncrypted ? 'encrypted' : 'not encrypted'} (expected: not encrypted)`);
      console.log(`   Production SSL config: ${prodSSLWorking ? 'working' : 'requires SSL-enabled server'}`);

      this.testResults.push({
        test: 'SSL Configuration',
        passed,
        details: `Dev: ${connectionEncrypted ? 'encrypted' : 'not encrypted'}, Server SSL: ${serverSSLEnabled}`,
        metrics: {
          server_ssl_enabled: serverSSLEnabled,
          dev_connection_encrypted: connectionEncrypted,
          prod_ssl_config_valid: prodSSLWorking,
          environment: process.env.NODE_ENV || 'development'
        }
      });

      return passed;
    } catch (error) {
      console.log(`❌ SSL configuration test failed: ${error.message}`);
      this.testResults.push({
        test: 'SSL Configuration',
        passed: false,
        details: `Test failed: ${error.message}`,
        metrics: { error: error.message }
      });
      return false;
    }
  }

  async testConnectionResilience() {
    console.log('\n🔄 Test: Connection Resilience and Recovery');
    
    try {
      const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'elite_trading_coach_ai',
        user: process.env.DB_USER || 'trading_coach_user',
        password: process.env.DB_PASSWORD,
        ssl: false,
        max: 5,
        idleTimeoutMillis: 5000, // Short timeout for testing
        connectionTimeoutMillis: 2000
      });

      // Test 1: Normal connection and recovery
      console.log('   Testing normal connection establishment...');
      const client1 = await pool.connect();
      await client1.query('SELECT 1');
      client1.release();

      // Test 2: Multiple rapid connections
      console.log('   Testing rapid connection cycling...');
      for (let i = 0; i < 5; i++) {
        const client = await pool.connect();
        await client.query('SELECT $1', [i]);
        client.release();
      }

      // Test 3: Connection after idle timeout
      console.log('   Testing connection after idle period...');
      await new Promise(resolve => setTimeout(resolve, 6000)); // Wait longer than idle timeout
      
      const client2 = await pool.connect();
      await client2.query('SELECT NOW()');
      client2.release();

      // Test 4: Error recovery
      console.log('   Testing error recovery...');
      try {
        const client3 = await pool.connect();
        await client3.query('SELECT invalid_column_name'); // This should fail
      } catch (queryError) {
        // Expected error, now test that pool still works
        const client4 = await pool.connect();
        await client4.query('SELECT 1'); // This should work
        client4.release();
      }

      await pool.end();

      console.log('✅ Connection resilience test passed');

      this.testResults.push({
        test: 'Connection Resilience',
        passed: true,
        details: 'All resilience scenarios handled correctly',
        metrics: {
          normal_connection: true,
          rapid_cycling: true,
          post_idle_connection: true,
          error_recovery: true
        }
      });

      return true;
    } catch (error) {
      console.log(`❌ Connection resilience test failed: ${error.message}`);
      this.testResults.push({
        test: 'Connection Resilience',
        passed: false,
        details: `Test failed: ${error.message}`,
        metrics: { error: error.message }
      });
      return false;
    }
  }

  async testTimeoutBehavior() {
    console.log('\n⏱️ Test: Connection Timeout Behavior');
    
    try {
      // Test with very short timeout to verify timeout behavior
      const timeoutPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'elite_trading_coach_ai',
        user: process.env.DB_USER || 'trading_coach_user',
        password: process.env.DB_PASSWORD,
        ssl: false,
        max: 1, // Only 1 connection
        connectionTimeoutMillis: 1000, // 1 second timeout
        idleTimeoutMillis: 2000
      });

      // Occupy the single connection
      const blockingClient = await timeoutPool.connect();
      
      // Try to get another connection - should timeout
      const timeoutStart = Date.now();
      try {
        await timeoutPool.connect();
        // If we get here, timeout didn't work as expected
        console.log('❌ Timeout test failed - connection should have timed out');
        await timeoutPool.end();
        return false;
      } catch (timeoutError) {
        const timeoutDuration = Date.now() - timeoutStart;
        console.log(`   Connection timeout after ${timeoutDuration}ms (expected ~1000ms)`);
        
        // Release the blocking connection
        blockingClient.release();
        
        // Now connection should work
        const newClient = await timeoutPool.connect();
        await newClient.query('SELECT 1');
        newClient.release();
        
        await timeoutPool.end();
        
        const timeoutWorking = timeoutDuration >= 900 && timeoutDuration <= 1500; // Allow some variance
        
        console.log(`${timeoutWorking ? '✅' : '❌'} Timeout behavior test`);
        
        this.testResults.push({
          test: 'Timeout Behavior',
          passed: timeoutWorking,
          details: `Connection timeout in ${timeoutDuration}ms`,
          metrics: {
            timeout_duration_ms: timeoutDuration,
            expected_timeout_ms: 1000,
            timeout_working: timeoutWorking
          }
        });
        
        return timeoutWorking;
      }
    } catch (error) {
      console.log(`❌ Timeout behavior test failed: ${error.message}`);
      this.testResults.push({
        test: 'Timeout Behavior',
        passed: false,
        details: `Test failed: ${error.message}`,
        metrics: { error: error.message }
      });
      return false;
    }
  }

  async testInvalidCredentials() {
    console.log('\n🚫 Test: Invalid Credentials Handling');
    
    try {
      // Test with invalid password
      const invalidPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'elite_trading_coach_ai',
        user: process.env.DB_USER || 'trading_coach_user',
        password: 'invalid_password_123',
        ssl: false,
        connectionTimeoutMillis: 2000
      });

      try {
        const client = await invalidPool.connect();
        client.release();
        await invalidPool.end();
        
        console.log('❌ Invalid credentials test failed - should have been rejected');
        this.testResults.push({
          test: 'Invalid Credentials',
          passed: false,
          details: 'Invalid credentials were accepted (security issue)',
          metrics: { security_issue: true }
        });
        return false;
      } catch (authError) {
        await invalidPool.end();
        console.log(`✅ Invalid credentials properly rejected: ${authError.message}`);
        
        this.testResults.push({
          test: 'Invalid Credentials',
          passed: true,
          details: 'Invalid credentials properly rejected',
          metrics: {
            error_type: authError.code,
            error_message: authError.message
          }
        });
        return true;
      }
    } catch (error) {
      console.log(`❌ Invalid credentials test failed: ${error.message}`);
      this.testResults.push({
        test: 'Invalid Credentials',
        passed: false,
        details: `Test failed: ${error.message}`,
        metrics: { error: error.message }
      });
      return false;
    }
  }

  async runSSLFailoverTests() {
    console.log('🚀 Starting SSL and Failover Test Suite');
    console.log('========================================');
    
    const tests = [
      () => this.testSSLConfiguration(),
      () => this.testConnectionResilience(),
      () => this.testTimeoutBehavior(),
      () => this.testInvalidCredentials()
    ];
    
    let passedTests = 0;
    
    for (const test of tests) {
      try {
        const result = await test();
        if (result) passedTests++;
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Test failed with error: ${error.message}`);
      }
    }
    
    console.log('\n📊 SSL & Failover Test Results Summary');
    console.log('======================================');
    console.log(`Tests passed: ${passedTests}/${tests.length}`);
    console.log(`Success rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`);
    
    return {
      totalTests: tests.length,
      passedTests,
      successRate: (passedTests / tests.length) * 100,
      results: this.testResults
    };
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new SSLFailoverTester();
  
  tester.runSSLFailoverTests()
    .then((summary) => {
      console.log('\n✨ SSL & Failover test suite completed');
      process.exit(summary.passedTests === summary.totalTests ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ SSL & Failover test suite failed:', error);
      process.exit(1);
    });
}

export { SSLFailoverTester };