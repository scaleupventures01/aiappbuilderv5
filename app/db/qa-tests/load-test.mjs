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
 * QA Test Suite: Connection Pool Load Testing
 * Tests connection pool behavior under load according to PRD-1.1.1.1
 */

class ConnectionPoolLoadTester {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'elite_trading_coach_ai',
      user: process.env.DB_USER || 'trading_coach_user',
      password: process.env.DB_PASSWORD,
      ssl: false,
      max: 20, // PRD requirement
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    this.testResults = [];
  }

  async testConcurrentConnections() {
    console.log('\n🏊 Test: Concurrent Connection Pool Load');
    console.log('Testing with 15 concurrent connections (below max of 20)');
    
    const startTime = Date.now();
    const promises = [];
    const results = [];
    
    // Create 15 concurrent database operations
    for (let i = 0; i < 15; i++) {
      promises.push(this.performDatabaseOperation(i, results));
    }
    
    try {
      await Promise.all(promises);
      const totalDuration = Date.now() - startTime;
      
      // Analyze results
      const successful = results.filter(r => r.success).length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const maxResponseTime = Math.max(...results.map(r => r.duration));
      const minResponseTime = Math.min(...results.map(r => r.duration));
      
      const passed = successful === 15 && avgResponseTime < 100;
      
      console.log(`${passed ? '✅' : '❌'} Concurrent connections test`);
      console.log(`   Successful operations: ${successful}/15`);
      console.log(`   Average response time: ${avgResponseTime.toFixed(1)}ms`);
      console.log(`   Min response time: ${minResponseTime}ms`);
      console.log(`   Max response time: ${maxResponseTime}ms`);
      console.log(`   Total test duration: ${totalDuration}ms`);
      
      this.testResults.push({
        test: 'Concurrent Connections',
        passed,
        details: `${successful}/15 operations successful, avg ${avgResponseTime.toFixed(1)}ms`,
        metrics: {
          successful_operations: successful,
          total_operations: 15,
          avg_response_time: avgResponseTime,
          max_response_time: maxResponseTime,
          min_response_time: minResponseTime,
          total_duration: totalDuration
        }
      });
      
      return passed;
    } catch (error) {
      console.log(`❌ Concurrent connections test failed: ${error.message}`);
      this.testResults.push({
        test: 'Concurrent Connections',
        passed: false,
        details: `Test failed: ${error.message}`,
        metrics: { error: error.message }
      });
      return false;
    }
  }

  async performDatabaseOperation(id, results) {
    const startTime = Date.now();
    try {
      const client = await this.pool.connect();
      
      // Simulate a real database operation
      await client.query('SELECT pg_sleep(0.01)'); // 10ms sleep
      const result = await client.query('SELECT $1 as operation_id, NOW() as timestamp', [id]);
      
      client.release();
      
      const duration = Date.now() - startTime;
      results.push({ id, success: true, duration, timestamp: result.rows[0].timestamp });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({ id, success: false, duration, error: error.message });
    }
  }

  async testPoolExhaustion() {
    console.log('\n🌊 Test: Pool Exhaustion Handling');
    console.log('Testing with 25 connections (exceeding max of 20)');
    
    const startTime = Date.now();
    const promises = [];
    const results = [];
    
    // Create 25 connections to test pool exhaustion
    for (let i = 0; i < 25; i++) {
      promises.push(this.performLongOperation(i, results));
    }
    
    try {
      await Promise.allSettled(promises);
      const totalDuration = Date.now() - startTime;
      
      const successful = results.filter(r => r.success).length;
      const timedOut = results.filter(r => r.error && r.error.includes('timeout')).length;
      const errors = results.filter(r => !r.success).length;
      
      console.log(`   Successful operations: ${successful}/25`);
      console.log(`   Timeout errors: ${timedOut}/25`);
      console.log(`   Other errors: ${errors - timedOut}/25`);
      console.log(`   Total duration: ${totalDuration}ms`);
      
      // Pool should handle this gracefully with timeouts
      const passed = successful >= 20 && timedOut > 0; // Some should succeed, some should timeout
      
      console.log(`${passed ? '✅' : '❌'} Pool exhaustion handling test`);
      
      this.testResults.push({
        test: 'Pool Exhaustion',
        passed,
        details: `${successful}/25 successful, ${timedOut} timeouts, pool handled gracefully`,
        metrics: {
          successful_operations: successful,
          timeout_errors: timedOut,
          other_errors: errors - timedOut,
          total_duration: totalDuration
        }
      });
      
      return passed;
    } catch (error) {
      console.log(`❌ Pool exhaustion test failed: ${error.message}`);
      this.testResults.push({
        test: 'Pool Exhaustion',
        passed: false,
        details: `Test failed: ${error.message}`,
        metrics: { error: error.message }
      });
      return false;
    }
  }

  async performLongOperation(id, results) {
    const startTime = Date.now();
    try {
      const client = await this.pool.connect();
      
      // Longer operation to test pool limits
      await client.query('SELECT pg_sleep(0.1)'); // 100ms sleep
      const result = await client.query('SELECT $1 as operation_id', [id]);
      
      client.release();
      
      const duration = Date.now() - startTime;
      results.push({ id, success: true, duration });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({ id, success: false, duration, error: error.message });
    }
  }

  async testPoolStats() {
    console.log('\n📊 Test: Pool Statistics Monitoring');
    
    try {
      // Get initial stats
      const initialStats = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };
      
      console.log('   Initial pool stats:', initialStats);
      
      // Create some connections and check stats
      const clients = [];
      for (let i = 0; i < 5; i++) {
        clients.push(await this.pool.connect());
      }
      
      const activeStats = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };
      
      console.log('   Active connections stats:', activeStats);
      
      // Release connections
      clients.forEach(client => client.release());
      
      // Wait a moment for stats to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalStats = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };
      
      console.log('   Final pool stats:', finalStats);
      
      const passed = activeStats.totalCount >= 5 && finalStats.idleCount >= 5;
      
      console.log(`${passed ? '✅' : '❌'} Pool statistics test`);
      
      this.testResults.push({
        test: 'Pool Statistics',
        passed,
        details: 'Pool statistics tracked correctly throughout connection lifecycle',
        metrics: {
          initial_stats: initialStats,
          active_stats: activeStats,
          final_stats: finalStats
        }
      });
      
      return passed;
    } catch (error) {
      console.log(`❌ Pool statistics test failed: ${error.message}`);
      this.testResults.push({
        test: 'Pool Statistics',
        passed: false,
        details: `Test failed: ${error.message}`,
        metrics: { error: error.message }
      });
      return false;
    }
  }

  async runLoadTests() {
    console.log('🚀 Starting Connection Pool Load Test Suite');
    console.log('=============================================');
    
    const tests = [
      () => this.testConcurrentConnections(),
      () => this.testPoolStats(),
      () => this.testPoolExhaustion()
    ];
    
    let passedTests = 0;
    
    for (const test of tests) {
      try {
        const result = await test();
        if (result) passedTests++;
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Test failed with error: ${error.message}`);
      }
    }
    
    console.log('\n📊 Load Test Results Summary');
    console.log('============================');
    console.log(`Tests passed: ${passedTests}/${tests.length}`);
    console.log(`Success rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`);
    
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
      console.log('\n🧹 Pool connections closed');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ConnectionPoolLoadTester();
  
  tester.runLoadTests()
    .then((summary) => {
      console.log('\n✨ Load test suite completed');
      process.exit(summary.passedTests === summary.totalTests ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Load test suite failed:', error);
      process.exit(1);
    });
}

export { ConnectionPoolLoadTester };