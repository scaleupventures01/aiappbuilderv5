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
 * QA Report Generator for PostgreSQL Database Setup
 * Executes focused tests and generates comprehensive QA report
 */

class QAReportGenerator {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
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
  }

  async runFocusedTests() {
    console.log('🚀 PostgreSQL QA Report Generation');
    console.log('==================================');
    
    await this.initializePool();
    
    // Test 1: Connection Performance
    console.log('\n1. Testing Connection Performance...');
    const connectionTest = await this.testConnectionPerformance();
    
    // Test 2: Pool Configuration
    console.log('\n2. Testing Pool Configuration...');
    const poolTest = await this.testPoolConfiguration();
    
    // Test 3: Database Permissions
    console.log('\n3. Testing Database Permissions...');
    const permissionsTest = await this.testDatabasePermissions();
    
    // Test 4: SSL Configuration
    console.log('\n4. Testing SSL Configuration...');
    const sslTest = await this.testSSLSetup();
    
    // Test 5: Load Testing
    console.log('\n5. Testing Under Load...');
    const loadTest = await this.testUnderLoad();
    
    await this.cleanup();
    
    return {
      connectionTest,
      poolTest,
      permissionsTest,
      sslTest,
      loadTest
    };
  }

  async testConnectionPerformance() {
    const results = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      try {
        const client = await this.pool.connect();
        const queryResult = await client.query('SELECT NOW(), $1 as test_id', [i]);
        client.release();
        
        const duration = Date.now() - startTime;
        results.push({ attempt: i + 1, duration, success: true });
        console.log(`   Attempt ${i + 1}: ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        results.push({ attempt: i + 1, duration, success: false, error: error.message });
        console.log(`   Attempt ${i + 1}: FAILED (${duration}ms) - ${error.message}`);
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const maxDuration = Math.max(...results.map(r => r.duration));
    const under100ms = results.filter(r => r.success && r.duration < 100).length;
    
    const passed = successful === 5 && avgDuration < 100;
    
    console.log(`   Results: ${successful}/5 successful, avg: ${avgDuration.toFixed(1)}ms, max: ${maxDuration}ms`);
    console.log(`   Under 100ms: ${under100ms}/5 (PRD requirement: 100%)`);
    
    return {
      test: 'Connection Performance',
      passed,
      successful_connections: successful,
      total_attempts: 5,
      average_duration_ms: avgDuration,
      max_duration_ms: maxDuration,
      under_100ms_count: under100ms,
      meets_prd_requirement: under100ms === 5,
      details: results
    };
  }

  async testPoolConfiguration() {
    try {
      const config = {
        max: this.pool.options.max,
        idleTimeoutMillis: this.pool.options.idleTimeoutMillis,
        connectionTimeoutMillis: this.pool.options.connectionTimeoutMillis
      };
      
      const stats = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };
      
      const configCorrect = config.max === 20 && config.idleTimeoutMillis === 30000;
      
      console.log(`   Max connections: ${config.max} (required: 20) ${config.max === 20 ? '✅' : '❌'}`);
      console.log(`   Idle timeout: ${config.idleTimeoutMillis}ms (required: 30000) ${config.idleTimeoutMillis === 30000 ? '✅' : '❌'}`);
      console.log('   Current pool stats:', stats);
      
      return {
        test: 'Pool Configuration',
        passed: configCorrect,
        configuration: config,
        current_stats: stats,
        meets_prd_specs: configCorrect
      };
    } catch (error) {
      console.log(`   ERROR: ${error.message}`);
      return {
        test: 'Pool Configuration',
        passed: false,
        error: error.message
      };
    }
  }

  async testDatabasePermissions() {
    try {
      const client = await this.pool.connect();
      
      const dbInfo = await client.query('SELECT current_database(), current_user');
      const { current_database, current_user } = dbInfo.rows[0];
      
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
      
      const correctDb = current_database === expectedDb;
      const correctUser = current_user === expectedUser;
      const hasRequiredPerms = perms.can_connect;
      
      const passed = correctDb && correctUser && hasRequiredPerms;
      
      console.log(`   Database: ${current_database} (expected: ${expectedDb}) ${correctDb ? '✅' : '❌'}`);
      console.log(`   User: ${current_user} (expected: ${expectedUser}) ${correctUser ? '✅' : '❌'}`);
      console.log(`   Can connect: ${perms.can_connect} ${perms.can_connect ? '✅' : '❌'}`);
      console.log(`   Can create: ${perms.can_create}`);
      console.log(`   Can temp: ${perms.can_temp}`);
      
      return {
        test: 'Database Permissions',
        passed,
        database: current_database,
        expected_database: expectedDb,
        user: current_user,
        expected_user: expectedUser,
        permissions: perms,
        credentials_correct: correctDb && correctUser,
        permissions_adequate: hasRequiredPerms
      };
    } catch (error) {
      console.log(`   ERROR: ${error.message}`);
      return {
        test: 'Database Permissions',
        passed: false,
        error: error.message
      };
    }
  }

  async testSSLSetup() {
    try {
      const client = await this.pool.connect();
      
      const sslQuery = await client.query('SHOW ssl');
      const serverSSLEnabled = sslQuery.rows[0].ssl === 'on';
      
      client.release();
      
      const environment = process.env.NODE_ENV || 'development';
      const poolSSLConfig = !!this.pool.options.ssl;
      
      // In development: SSL should be disabled on pool
      // In production: SSL should be enabled on pool
      const configCorrect = environment === 'production' ? poolSSLConfig : !poolSSLConfig;
      
      console.log(`   Environment: ${environment}`);
      console.log(`   Server SSL capability: ${serverSSLEnabled}`);
      console.log(`   Pool SSL config: ${poolSSLConfig} ${configCorrect ? '✅' : '❌'}`);
      console.log(`   Configuration correct: ${configCorrect}`);
      
      return {
        test: 'SSL Configuration',
        passed: configCorrect,
        environment,
        server_ssl_enabled: serverSSLEnabled,
        pool_ssl_configured: poolSSLConfig,
        configuration_correct: configCorrect,
        prd_requirement_met: configCorrect
      };
    } catch (error) {
      console.log(`   ERROR: ${error.message}`);
      return {
        test: 'SSL Configuration',
        passed: false,
        error: error.message
      };
    }
  }

  async testUnderLoad() {
    console.log('   Running 10 concurrent operations...');
    
    const promises = [];
    const results = [];
    
    for (let i = 0; i < 10; i++) {
      promises.push(this.performLoadTestOperation(i, results));
    }
    
    try {
      await Promise.all(promises);
      
      const successful = results.filter(r => r.success).length;
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const maxDuration = Math.max(...results.map(r => r.duration));
      const allUnder100 = results.filter(r => r.success && r.duration < 100).length;
      
      const passed = successful === 10 && avgDuration < 100;
      
      console.log(`   Successful: ${successful}/10`);
      console.log(`   Average duration: ${avgDuration.toFixed(1)}ms`);
      console.log(`   Max duration: ${maxDuration}ms`);
      console.log(`   All under 100ms: ${allUnder100}/10`);
      
      return {
        test: 'Load Testing',
        passed,
        total_operations: 10,
        successful_operations: successful,
        average_duration_ms: avgDuration,
        max_duration_ms: maxDuration,
        all_under_100ms: allUnder100,
        pool_handled_load: passed,
        operation_details: results
      };
    } catch (error) {
      console.log(`   ERROR: ${error.message}`);
      return {
        test: 'Load Testing',
        passed: false,
        error: error.message
      };
    }
  }

  async performLoadTestOperation(id, results) {
    const startTime = Date.now();
    try {
      const client = await this.pool.connect();
      await client.query('SELECT $1 as operation_id, pg_sleep(0.01)', [id]);
      client.release();
      
      const duration = Date.now() - startTime;
      results.push({ id, success: true, duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({ id, success: false, duration, error: error.message });
    }
  }

  async generateQAReport(testResults) {
    const totalDuration = Date.now() - this.startTime;
    const allTests = Object.values(testResults);
    const passedTests = allTests.filter(test => test.passed).length;
    const totalTests = allTests.length;
    const successRate = (passedTests / totalTests) * 100;
    const qaSignOff = passedTests === totalTests;
    
    // Check PRD acceptance criteria
    const acceptanceCriteria = this.evaluateAcceptanceCriteria(testResults);
    
    const report = {
      prd_reference: 'PRD-1.1.1.1',
      test_suite: 'PostgreSQL Database Setup QA',
      execution_metadata: {
        start_time: new Date(this.startTime).toISOString(),
        end_time: new Date().toISOString(),
        duration_ms: totalDuration,
        environment: process.env.NODE_ENV || 'development',
        database_host: process.env.DB_HOST || 'localhost',
        database_name: process.env.DB_NAME || 'elite_trading_coach_ai'
      },
      test_summary: {
        total_tests: totalTests,
        passed_tests: passedTests,
        failed_tests: totalTests - passedTests,
        success_rate_percent: successRate,
        qa_sign_off: qaSignOff
      },
      prd_acceptance_criteria: acceptanceCriteria,
      detailed_test_results: testResults,
      issues_discovered: this.identifyIssues(testResults),
      performance_metrics: this.extractPerformanceMetrics(testResults),
      recommendations: this.generateRecommendations(testResults),
      qa_assessment: {
        ready_for_production: qaSignOff && acceptanceCriteria.all_criteria_met,
        critical_issues: this.identifyIssues(testResults).filter(i => i.severity === 'critical'),
        sign_off_status: qaSignOff ? 'APPROVED' : 'REJECTED',
        next_steps: qaSignOff ? 'Implementation approved for deployment' : 'Fix identified issues before deployment'
      }
    };
    
    return report;
  }

  evaluateAcceptanceCriteria(testResults) {
    const criteria = [
      {
        id: 'AC1',
        description: 'Can establish connection to PostgreSQL with 100% success rate',
        met: testResults.connectionTest.successful_connections === 5,
        evidence: `${testResults.connectionTest.successful_connections}/5 connections successful`
      },
      {
        id: 'AC2',
        description: 'Connection pool maintains stable connections under normal load',
        met: testResults.loadTest.successful_operations === 10,
        evidence: `${testResults.loadTest.successful_operations}/10 concurrent operations successful`
      },
      {
        id: 'AC3',
        description: 'SSL encryption verified for production connections',
        met: testResults.sslTest.configuration_correct,
        evidence: `SSL configuration correct for ${testResults.sslTest.environment} environment`
      }
    ];
    
    const metCriteria = criteria.filter(c => c.met).length;
    
    return {
      total_criteria: criteria.length,
      met_criteria: metCriteria,
      all_criteria_met: metCriteria === criteria.length,
      criteria_details: criteria
    };
  }

  identifyIssues(testResults) {
    const issues = [];
    
    if (!testResults.connectionTest.meets_prd_requirement) {
      issues.push({
        severity: 'critical',
        category: 'performance',
        description: 'Connection response time exceeds PRD requirement of <100ms',
        evidence: `${testResults.connectionTest.under_100ms_count}/5 connections under 100ms`,
        recommendation: 'Optimize database configuration or review network latency'
      });
    }
    
    if (!testResults.poolTest.meets_prd_specs) {
      issues.push({
        severity: 'high',
        category: 'configuration',
        description: 'Connection pool not configured according to PRD specifications',
        evidence: `Pool config: max=${testResults.poolTest.configuration.max}, idle=${testResults.poolTest.configuration.idleTimeoutMillis}ms`,
        recommendation: 'Update pool configuration to match PRD requirements'
      });
    }
    
    if (!testResults.permissionsTest.credentials_correct) {
      issues.push({
        severity: 'critical',
        category: 'security',
        description: 'Database credentials do not match expected values',
        evidence: `DB: ${testResults.permissionsTest.database}, User: ${testResults.permissionsTest.user}`,
        recommendation: 'Verify environment variables and database setup'
      });
    }
    
    if (!testResults.sslTest.configuration_correct) {
      issues.push({
        severity: 'medium',
        category: 'security',
        description: 'SSL configuration does not match environment requirements',
        evidence: `Environment: ${testResults.sslTest.environment}, SSL configured: ${testResults.sslTest.pool_ssl_configured}`,
        recommendation: 'Review SSL configuration for production deployment'
      });
    }
    
    if (!testResults.loadTest.pool_handled_load) {
      issues.push({
        severity: 'high',
        category: 'scalability',
        description: 'Connection pool failed to handle concurrent load properly',
        evidence: `${testResults.loadTest.successful_operations}/10 operations successful`,
        recommendation: 'Review connection pool settings and database performance'
      });
    }
    
    return issues;
  }

  extractPerformanceMetrics(testResults) {
    return {
      connection_performance: {
        average_connection_time_ms: testResults.connectionTest.average_duration_ms,
        max_connection_time_ms: testResults.connectionTest.max_duration_ms,
        success_rate_percent: (testResults.connectionTest.successful_connections / 5) * 100,
        prd_compliance: testResults.connectionTest.meets_prd_requirement
      },
      load_performance: {
        concurrent_operations: testResults.loadTest.total_operations,
        success_rate_percent: (testResults.loadTest.successful_operations / testResults.loadTest.total_operations) * 100,
        average_response_time_ms: testResults.loadTest.average_duration_ms,
        max_response_time_ms: testResults.loadTest.max_duration_ms
      },
      pool_metrics: {
        max_connections: testResults.poolTest.configuration?.max,
        idle_timeout_ms: testResults.poolTest.configuration?.idleTimeoutMillis,
        connection_timeout_ms: testResults.poolTest.configuration?.connectionTimeoutMillis
      }
    };
  }

  generateRecommendations(testResults) {
    const recommendations = [];
    
    if (testResults.connectionTest.average_duration_ms > 50) {
      recommendations.push({
        category: 'Performance',
        priority: 'Medium',
        recommendation: 'Consider optimizing database connection setup or review network configuration',
        rationale: `Average connection time of ${testResults.connectionTest.average_duration_ms.toFixed(1)}ms could be improved`
      });
    }
    
    if (testResults.sslTest.environment === 'development' && testResults.sslTest.server_ssl_enabled) {
      recommendations.push({
        category: 'Security',
        priority: 'Low',
        recommendation: 'Consider enabling SSL in development for better production parity',
        rationale: 'Server supports SSL but not configured in development environment'
      });
    }
    
    recommendations.push({
      category: 'Monitoring',
      priority: 'Medium',
      recommendation: 'Implement connection pool monitoring in production',
      rationale: 'Track pool statistics to ensure optimal performance'
    });
    
    recommendations.push({
      category: 'Testing',
      priority: 'Low',
      recommendation: 'Add automated database connectivity tests to CI/CD pipeline',
      rationale: 'Ensure database connectivity is verified with each deployment'
    });
    
    return recommendations;
  }

  async cleanup() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

// Run QA report generation
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new QAReportGenerator();
  
  generator.runFocusedTests()
    .then(async (testResults) => {
      const report = await generator.generateQAReport(testResults);
      
      console.log('\n' + '='.repeat(80));
      console.log('POSTGRESQL DATABASE SETUP - QA REPORT');
      console.log('='.repeat(80));
      console.log(`PRD Reference: ${report.prd_reference}`);
      console.log(`Test Suite: ${report.test_suite}`);
      console.log(`Execution Time: ${report.execution_metadata.duration_ms}ms`);
      console.log(`Environment: ${report.execution_metadata.environment}`);
      console.log('');
      
      console.log('TEST SUMMARY:');
      console.log(`- Total Tests: ${report.test_summary.total_tests}`);
      console.log(`- Passed: ${report.test_summary.passed_tests}`);
      console.log(`- Failed: ${report.test_summary.failed_tests}`);
      console.log(`- Success Rate: ${report.test_summary.success_rate_percent.toFixed(1)}%`);
      console.log(`- QA Sign-off: ${report.test_summary.qa_sign_off ? 'APPROVED ✅' : 'REJECTED ❌'}`);
      console.log('');
      
      console.log('PRD ACCEPTANCE CRITERIA:');
      report.prd_acceptance_criteria.criteria_details.forEach(criterion => {
        console.log(`- ${criterion.id}: ${criterion.met ? 'MET ✅' : 'NOT MET ❌'}`);
        console.log(`  ${criterion.description}`);
        console.log(`  Evidence: ${criterion.evidence}`);
      });
      console.log('');
      
      if (report.issues_discovered.length > 0) {
        console.log('ISSUES DISCOVERED:');
        report.issues_discovered.forEach((issue, index) => {
          console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
          console.log(`   Category: ${issue.category}`);
          console.log(`   Evidence: ${issue.evidence}`);
          console.log(`   Recommendation: ${issue.recommendation}`);
          console.log('');
        });
      } else {
        console.log('ISSUES DISCOVERED: None ✅');
        console.log('');
      }
      
      console.log('PERFORMANCE METRICS:');
      console.log(`- Average Connection Time: ${report.performance_metrics.connection_performance.average_connection_time_ms.toFixed(1)}ms`);
      console.log(`- Max Connection Time: ${report.performance_metrics.connection_performance.max_connection_time_ms}ms`);
      console.log(`- Connection Success Rate: ${report.performance_metrics.connection_performance.success_rate_percent}%`);
      console.log(`- Load Test Success Rate: ${report.performance_metrics.load_performance.success_rate_percent}%`);
      console.log('');
      
      console.log('QA ASSESSMENT:');
      console.log(`- Ready for Production: ${report.qa_assessment.ready_for_production ? 'YES ✅' : 'NO ❌'}`);
      console.log(`- Critical Issues: ${report.qa_assessment.critical_issues.length}`);
      console.log(`- Sign-off Status: ${report.qa_assessment.sign_off_status}`);
      console.log(`- Next Steps: ${report.qa_assessment.next_steps}`);
      console.log('');
      
      console.log('RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.recommendation}`);
        console.log(`   Rationale: ${rec.rationale}`);
      });
      
      console.log('\n' + '='.repeat(80));
      console.log('QA REPORT COMPLETED');
      console.log('='.repeat(80));
      
      process.exit(report.test_summary.qa_sign_off ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ QA Report Generation Failed:', error);
      process.exit(1);
    });
}

export { QAReportGenerator };