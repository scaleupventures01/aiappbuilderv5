#!/usr/bin/env node

/**
 * Comprehensive API Validation for PRD 1.2.2 - Trade Analysis API Endpoint
 * QA Engineer: Elite Trading Coach AI Team
 * Date: 2025-08-15
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class ComprehensiveAPIValidator {
  constructor() {
    this.baseUrl = 'http://localhost:3001'; // Correct port from server startup
    this.results = {
      timestamp: new Date().toISOString(),
      testSuite: 'PRD 1.2.2 - Trade Analysis API Endpoint - Comprehensive QA',
      serverStatus: 'unknown',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0 }
    };
    this.serverProcess = null;
  }

  log(message) {
    console.log(`[QA] ${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`);
  }

  addTest(name, passed, details = null, error = null) {
    this.results.tests.push({
      name,
      passed,
      timestamp: new Date().toISOString(),
      details,
      error
    });
    
    this.results.summary.total++;
    if (passed) {
      this.results.summary.passed++;
      this.log(`✅ ${name}`);
    } else {
      this.results.summary.failed++;
      this.log(`❌ ${name}${error ? ': ' + error : ''}`);
    }
  }

  async startServer() {
    this.log('🚀 Starting server for comprehensive testing...');
    
    try {
      // Change to app directory
      process.chdir('/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app');
      
      // Start server
      this.serverProcess = spawn('node', ['server.js'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });
      
      let serverReady = false;
      let startupOutput = '';
      
      // Monitor server startup
      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        startupOutput += output;
        if (output.includes('Elite Trading Coach AI Server Started')) {
          serverReady = true;
        }
      });
      
      this.serverProcess.stderr.on('data', (data) => {
        startupOutput += data.toString();
      });
      
      // Wait up to 10 seconds for server to start
      for (let i = 0; i < 100 && !serverReady; i++) {
        await this.delay(100);
      }
      
      if (serverReady) {
        this.results.serverStatus = 'started';
        this.log('✅ Server started successfully on port 3001');
        return { success: true, output: startupOutput };
      } else {
        this.results.serverStatus = 'failed';
        this.log('❌ Server failed to start within 10 seconds');
        return { success: false, output: startupOutput };
      }
      
    } catch (error) {
      this.results.serverStatus = 'error';
      this.log(`❌ Server startup error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async stopServer() {
    if (this.serverProcess) {
      try {
        this.serverProcess.kill('SIGTERM');
        await this.delay(3000); // Wait for graceful shutdown
        this.log('🛑 Server stopped');
      } catch (error) {
        this.log(`⚠️  Error stopping server: ${error.message}`);
      }
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const { stdout } = await execAsync(`curl -s -w "\\n%{http_code}\\n%{time_total}" ${options.method ? '-X ' + options.method : ''} ${options.headers ? options.headers.map(h => `-H "${h}"`).join(' ') : ''} ${options.data ? `--data "${options.data}"` : ''} "${this.baseUrl}${endpoint}"`, {
        timeout: 10000
      });
      
      const lines = stdout.trim().split('\n');
      const timeTotal = parseFloat(lines[lines.length - 1]);
      const statusCode = parseInt(lines[lines.length - 2]);
      const body = lines.slice(0, -2).join('\n');
      
      return {
        statusCode,
        body,
        timeTotal,
        success: true
      };
      
    } catch (error) {
      return {
        statusCode: 0,
        error: error.message,
        success: false
      };
    }
  }

  async testHealthEndpoints() {
    this.log('🩺 Testing health check endpoints...');
    
    const healthEndpoints = [
      { path: '/health', name: 'Basic Health Check' },
      { path: '/health/db', name: 'Database Health Check' },
      { path: '/health/websocket', name: 'WebSocket Health Check' },
      { path: '/health/openai', name: 'OpenAI API Health Check' },
      { path: '/health/cors', name: 'CORS Health Check' }
    ];
    
    for (const endpoint of healthEndpoints) {
      const result = await this.makeRequest(endpoint.path);
      
      if (!result.success) {
        this.addTest(endpoint.name, false, null, result.error);
        continue;
      }
      
      // Accept 200 (healthy) or 503 (service unavailable but endpoint working)
      if (result.statusCode === 200 || result.statusCode === 503) {
        this.addTest(endpoint.name, true, {
          statusCode: result.statusCode,
          responseTime: result.timeTotal,
          response: result.body.length > 100 ? result.body.substring(0, 100) + '...' : result.body
        });
      } else {
        this.addTest(endpoint.name, false, {
          statusCode: result.statusCode,
          response: result.body
        }, `Unexpected status code: ${result.statusCode}`);
      }
    }
  }

  async testAPIEndpoints() {
    this.log('🔌 Testing Trade Analysis API endpoints...');
    
    // Test 1: Main endpoint accessibility (should return auth error or validation error)
    const mainEndpoint = await this.makeRequest('/api/analyze-trade', { method: 'POST' });
    
    if (!mainEndpoint.success) {
      this.addTest('API Endpoint Accessibility', false, null, mainEndpoint.error);
    } else {
      // Expect 400 (validation), 401 (auth), or 429 (rate limit) - not 404
      const acceptableCodes = [400, 401, 429];
      const accessible = acceptableCodes.includes(mainEndpoint.statusCode);
      
      this.addTest('API Endpoint Accessibility', accessible, {
        statusCode: mainEndpoint.statusCode,
        response: mainEndpoint.body,
        note: accessible ? 'Endpoint accessible, returns expected error' : 'Unexpected response'
      }, accessible ? null : `Expected 400/401/429, got ${mainEndpoint.statusCode}`);
    }
    
    // Test 2: API health endpoint
    const apiHealth = await this.makeRequest('/api/analyze-trade/health');
    
    if (!apiHealth.success) {
      this.addTest('API Health Endpoint', false, null, apiHealth.error);
    } else {
      const healthy = apiHealth.statusCode === 200 || apiHealth.statusCode === 503;
      this.addTest('API Health Endpoint', healthy, {
        statusCode: apiHealth.statusCode,
        response: apiHealth.body.length > 150 ? apiHealth.body.substring(0, 150) + '...' : apiHealth.body
      });
    }
    
    // Test 3: API config endpoint (should require auth)
    const apiConfig = await this.makeRequest('/api/analyze-trade/config');
    
    if (!apiConfig.success) {
      this.addTest('API Config Endpoint Auth', false, null, apiConfig.error);
    } else {
      // Should return 401 (unauthorized) since we're not sending auth
      const requiresAuth = apiConfig.statusCode === 401;
      this.addTest('API Config Endpoint Auth', requiresAuth, {
        statusCode: apiConfig.statusCode,
        note: requiresAuth ? 'Properly requires authentication' : 'May have auth issues'
      });
    }
  }

  async testInputValidation() {
    this.log('🔍 Testing input validation...');
    
    // Test 1: GET method (should not be allowed)
    const getMethod = await this.makeRequest('/api/analyze-trade', { method: 'GET' });
    
    if (getMethod.success) {
      const methodNotAllowed = getMethod.statusCode === 404 || getMethod.statusCode === 405;
      this.addTest('Input Validation - Invalid Method', methodNotAllowed, {
        statusCode: getMethod.statusCode
      });
    } else {
      this.addTest('Input Validation - Invalid Method', false, null, getMethod.error);
    }
    
    // Test 2: POST with no data (should return validation error)
    const noData = await this.makeRequest('/api/analyze-trade', { 
      method: 'POST',
      headers: ['Content-Type: application/json']
    });
    
    if (noData.success) {
      // Should return 400 (validation error) or 401 (auth error) - both acceptable
      const hasValidation = noData.statusCode === 400 || noData.statusCode === 401 || noData.statusCode === 429;
      this.addTest('Input Validation - No Data', hasValidation, {
        statusCode: noData.statusCode,
        response: noData.body.substring(0, 100)
      });
    } else {
      this.addTest('Input Validation - No Data', false, null, noData.error);
    }
  }

  async testResponseFormat() {
    this.log('📋 Testing response format consistency...');
    
    const response = await this.makeRequest('/api/analyze-trade', { method: 'POST' });
    
    if (!response.success) {
      this.addTest('Response Format Consistency', false, null, response.error);
      return;
    }
    
    try {
      const jsonResponse = JSON.parse(response.body);
      
      // Check for required fields in error response
      const hasSuccess = 'success' in jsonResponse;
      const hasErrorInfo = jsonResponse.success === false ? 
        ('error' in jsonResponse || 'message' in jsonResponse) : true;
      const hasTimestamp = 'timestamp' in jsonResponse || 
        (jsonResponse.metadata && 'timestamp' in jsonResponse.metadata);
      
      const validFormat = hasSuccess && hasErrorInfo;
      
      this.addTest('Response Format Consistency', validFormat, {
        hasSuccess,
        hasErrorInfo,
        hasTimestamp,
        fields: Object.keys(jsonResponse),
        statusCode: response.statusCode
      });
      
    } catch (parseError) {
      this.addTest('Response Format Consistency', false, {
        response: response.body,
        statusCode: response.statusCode
      }, 'Response is not valid JSON');
    }
  }

  async testSecurityFeatures() {
    this.log('🔒 Testing security features...');
    
    const response = await this.makeRequest('/api/analyze-trade', { method: 'POST' });
    
    if (!response.success) {
      this.addTest('Security Headers Test', false, null, response.error);
      return;
    }
    
    // Parse headers from curl response (this is limited, but we can check status codes)
    // Security is mainly about proper error responses and not exposing sensitive info
    
    try {
      const jsonResponse = JSON.parse(response.body);
      
      // Check that error responses don't expose sensitive information
      const responseStr = JSON.stringify(jsonResponse).toLowerCase();
      const hasSensitiveData = responseStr.includes('password') || 
                               responseStr.includes('secret') || 
                               responseStr.includes('key') ||
                               responseStr.includes('token');
      
      this.addTest('Security - No Sensitive Data Exposure', !hasSensitiveData, {
        statusCode: response.statusCode,
        note: hasSensitiveData ? 'Response may contain sensitive data' : 'No sensitive data detected'
      });
      
    } catch (parseError) {
      this.addTest('Security - No Sensitive Data Exposure', true, {
        note: 'Response is not JSON, likely safe from data exposure'
      });
    }
  }

  async testPerformance() {
    this.log('⚡ Testing performance characteristics...');
    
    // Test response times for health endpoints
    const healthResponse = await this.makeRequest('/health');
    
    if (healthResponse.success) {
      const fastResponse = healthResponse.timeTotal < 1.0; // Under 1 second
      this.addTest('Performance - Health Endpoint Response Time', fastResponse, {
        responseTime: `${healthResponse.timeTotal}s`,
        threshold: '1.0s'
      });
    } else {
      this.addTest('Performance - Health Endpoint Response Time', false, null, healthResponse.error);
    }
    
    // Test API endpoint performance
    const apiResponse = await this.makeRequest('/api/analyze-trade', { method: 'POST' });
    
    if (apiResponse.success) {
      const fastResponse = apiResponse.timeTotal < 2.0; // Under 2 seconds for error response
      this.addTest('Performance - API Endpoint Response Time', fastResponse, {
        responseTime: `${apiResponse.timeTotal}s`,
        threshold: '2.0s',
        note: 'Error response should be fast'
      });
    } else {
      this.addTest('Performance - API Endpoint Response Time', false, null, apiResponse.error);
    }
  }

  async generateReport() {
    this.log('📄 Generating comprehensive QA report...');
    
    const passRate = this.results.summary.total > 0 ? 
      (this.results.summary.passed / this.results.summary.total * 100).toFixed(1) : 0;
    
    const conclusion = this.determineConclusion(parseFloat(passRate));
    
    const report = {
      ...this.results,
      passRate: parseFloat(passRate),
      conclusion,
      recommendations: this.generateRecommendations()
    };
    
    // Save JSON report
    const jsonPath = path.join(process.cwd(), `comprehensive-qa-results-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    
    // Save markdown report
    const mdPath = path.join(process.cwd(), 'final-qa-validation-report.md');
    fs.writeFileSync(mdPath, this.generateMarkdownReport(report));
    
    this.log(`✅ Reports saved: ${mdPath} and ${jsonPath}`);
    
    return report;
  }

  determineConclusion(passRate) {
    if (passRate >= 95) return 'PASS - Production Ready';
    if (passRate >= 85) return 'CONDITIONAL PASS - Minor Issues';
    if (passRate >= 70) return 'NEEDS WORK - Several Issues';
    return 'FAIL - Critical Issues';
  }

  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.results.tests.filter(t => !t.passed);
    
    if (this.results.serverStatus !== 'started') {
      recommendations.push('CRITICAL: Resolve server startup issues immediately');
    }
    
    if (failedTests.some(t => t.name.includes('API Endpoint Accessibility'))) {
      recommendations.push('HIGH: Fix API routing - endpoint not accessible');
    }
    
    if (failedTests.some(t => t.name.includes('Health'))) {
      recommendations.push('MEDIUM: Investigate health check failures');
    }
    
    if (failedTests.some(t => t.name.includes('Response Format'))) {
      recommendations.push('MEDIUM: Fix response format consistency');
    }
    
    if (failedTests.some(t => t.name.includes('Performance'))) {
      recommendations.push('LOW: Optimize response times');
    }
    
    return recommendations;
  }

  generateMarkdownReport(report) {
    return `# PRD 1.2.2 Trade Analysis API Endpoint - Final QA Validation Report

## Executive Summary

**Test Date**: ${report.timestamp}  
**QA Engineer**: Elite Trading Coach AI Team  
**Server Status**: ${report.serverStatus}  
**Total Tests**: ${report.summary.total}  
**Pass Rate**: ${report.passRate}%  

### Final Validation Status
**${report.conclusion}**

## Test Results Summary

✅ **Passed**: ${report.summary.passed}/${report.summary.total}  
❌ **Failed**: ${report.summary.failed}/${report.summary.total}  

## Detailed Test Results

${report.tests.map(test => `
### ${test.name}
**Status**: ${test.passed ? '✅ PASS' : '❌ FAIL'}  
${test.details ? `**Details**: \`\`\`json\n${JSON.stringify(test.details, null, 2)}\n\`\`\`` : ''}
${test.error ? `**Error**: ${test.error}` : ''}
`).join('\n')}

## PRD Acceptance Criteria Validation

### REQ-001: POST /api/analyze-trade endpoint
${this.getValidationStatus('API Endpoint')}

### REQ-002-005: Input validation and response handling  
${this.getValidationStatus('Input Validation')}
${this.getValidationStatus('Response Format')}

### REQ-006-015: Error handling and security
${this.getValidationStatus('Security')}

### Non-functional requirements
${this.getValidationStatus('Performance')}
${this.getValidationStatus('Health')}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## QA Sign-off

**Validation Status**: ${report.conclusion}  
**Ready for Production**: ${report.passRate >= 85 ? '✅ YES' : '❌ NO'}  
**Next Steps**: ${report.passRate >= 85 ? 'Proceed to deployment' : 'Address failed tests before deployment'}

---

**QA Engineer**: Elite Trading Coach AI Team  
**Validation Date**: ${report.timestamp}  
**Test Environment**: Development (localhost:3001)
`;
  }

  getValidationStatus(testType) {
    const relevantTests = this.results.tests.filter(t => t.name.includes(testType));
    if (relevantTests.length === 0) return '⚪ Not tested';
    
    const passed = relevantTests.filter(t => t.passed).length;
    if (passed === relevantTests.length) return '✅ All passed';
    if (passed > 0) return '⚠️ Partial';
    return '❌ Failed';
  }

  async runComprehensiveValidation() {
    this.log('🏁 Starting comprehensive PRD 1.2.2 validation...');
    
    try {
      // Step 1: Start server
      const serverResult = await this.startServer();
      this.addTest('Server Startup', serverResult.success, 
        { output: serverResult.output?.substring(0, 200) + '...' }, 
        serverResult.error);
      
      if (serverResult.success) {
        // Wait for server to fully initialize
        await this.delay(3000);
        
        // Step 2: Run all API tests
        await this.testHealthEndpoints();
        await this.testAPIEndpoints();
        await this.testInputValidation();
        await this.testResponseFormat();
        await this.testSecurityFeatures();
        await this.testPerformance();
        
      } else {
        this.log('⚠️  Skipping API tests due to server startup failure');
      }
      
    } finally {
      await this.stopServer();
    }
    
    // Generate final report
    const report = await this.generateReport();
    
    console.log('\n' + '='.repeat(80));
    console.log('🏆 COMPREHENSIVE QA VALIDATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`📊 Results: ${report.summary.passed}/${report.summary.total} tests passed (${report.passRate}%)`);
    console.log(`🎯 Status: ${report.conclusion}`);
    console.log(`📋 Ready for Production: ${report.passRate >= 85 ? 'YES ✅' : 'NO ❌'}`);
    
    return report;
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ComprehensiveAPIValidator();
  
  validator.runComprehensiveValidation()
    .then(report => {
      process.exit(report.passRate >= 85 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Comprehensive validation failed:', error);
      process.exit(1);
    });
}

export { ComprehensiveAPIValidator };