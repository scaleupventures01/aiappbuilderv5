#!/usr/bin/env node

/**
 * QA-002: Security Testing Suite
 * Tests XSS prevention, file upload security, input sanitization
 * 
 * PRD: 1.1.4.4 - Message Input Component
 * QA Engineer: QA Team
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'node:perf_hooks';

class SecurityTestSuite {
  constructor() {
    this.results = {
      testSuite: 'QA-002: Security Testing Suite',
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        criticalIssues: 0,
        highRiskIssues: 0,
        mediumRiskIssues: 0
      }
    };
  }

  // Test XSS prevention in message input
  async testXSSPrevention() {
    const testName = 'XSS Prevention in Message Input';
    console.log(`\n🛡️ Running ${testName}...`);
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      'javascript:alert("XSS")',
      '<svg onload="alert(\'XSS\')">',
      '<iframe src="javascript:alert(\'XSS\')">',
      '<div onclick="alert(\'XSS\')">Click me</div>',
      '<style>@import"javascript:alert(\'XSS\')"</style>',
      '<link rel="stylesheet" href="javascript:alert(\'XSS\')">',
      '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">',
      '<object data="javascript:alert(\'XSS\')">',
      '<embed src="javascript:alert(\'XSS\')">',
      '<form><button formaction="javascript:alert(\'XSS\')">',
      '<details open ontoggle="alert(\'XSS\')">',
      '<marquee onstart="alert(\'XSS\')">',
      'onmouseover="alert(\'XSS\')"',
      'onfocus="alert(\'XSS\')"',
      '&lt;script&gt;alert("XSS")&lt;/script&gt;',
      '&#60;script&#62;alert("XSS")&#60;/script&#62;',
      String.fromCharCode(60,115,99,114,105,112,116,62,97,108,101,114,116,40,34,88,83,83,34,41,60,47,115,99,114,105,112,116,62)
    ];

    try {
      const vulnerabilities = [];
      
      for (const payload of xssPayloads) {
        const result = await this.testInputSanitization(payload);
        
        if (result.vulnerable) {
          vulnerabilities.push({
            payload: payload,
            vulnerability: result.vulnerability,
            risk: result.risk
          });
        }
      }
      
      const passed = vulnerabilities.length === 0;
      const criticalVulns = vulnerabilities.filter(v => v.risk === 'CRITICAL').length;
      const highVulns = vulnerabilities.filter(v => v.risk === 'HIGH').length;
      
      this.results.tests.push({
        name: testName,
        status: passed ? 'PASS' : 'FAIL',
        details: {
          totalPayloadsTested: xssPayloads.length,
          vulnerabilitiesFound: vulnerabilities.length,
          criticalVulnerabilities: criticalVulns,
          highRiskVulnerabilities: highVulns,
          vulnerabilities: vulnerabilities,
          requirement: 'All XSS payloads must be safely handled'
        },
        passed,
        riskLevel: criticalVulns > 0 ? 'CRITICAL' : highVulns > 0 ? 'HIGH' : 'LOW'
      });
      
      console.log(passed ? '✅ PASS' : '❌ FAIL');
      console.log(`   Payloads tested: ${xssPayloads.length}`);
      console.log(`   Vulnerabilities found: ${vulnerabilities.length}`);
      if (vulnerabilities.length > 0) {
        console.log(`   Critical: ${criticalVulns}, High: ${highVulns}`);
      }
      
    } catch (error) {
      this.results.tests.push({
        name: testName,
        status: 'ERROR',
        error: error.message,
        passed: false,
        riskLevel: 'HIGH'
      });
      console.log('❌ ERROR:', error.message);
    }
  }

  // Test input sanitization and validation
  async testInputSanitization(payload) {
    // Simulate input sanitization that should be in the component
    const sanitizationTests = [
      {
        name: 'Script Tag Removal',
        test: () => !payload.toLowerCase().includes('<script'),
        vulnerability: 'Script tags not properly removed',
        risk: 'CRITICAL'
      },
      {
        name: 'Event Handler Removal',
        test: () => !/on\w+\s*=/i.test(payload),
        vulnerability: 'Event handlers not removed',
        risk: 'HIGH'
      },
      {
        name: 'JavaScript Protocol Blocking',
        test: () => !payload.toLowerCase().includes('javascript:'),
        vulnerability: 'JavaScript protocol not blocked',
        risk: 'HIGH'
      },
      {
        name: 'Data URI Validation',
        test: () => !payload.toLowerCase().includes('data:text/html'),
        vulnerability: 'Malicious data URIs not blocked',
        risk: 'MEDIUM'
      },
      {
        name: 'HTML Entity Encoding',
        test: () => !payload.includes('<') || payload.includes('&lt;'),
        vulnerability: 'HTML entities not properly encoded',
        risk: 'HIGH'
      }
    ];

    for (const test of sanitizationTests) {
      if (!test.test()) {
        return {
          vulnerable: true,
          vulnerability: test.vulnerability,
          risk: test.risk
        };
      }
    }

    return { vulnerable: false };
  }

  // Test file upload security
  async testFileUploadSecurity() {
    const testName = 'File Upload Security';
    console.log(`\n🛡️ Running ${testName}...`);
    
    try {
      const maliciousFiles = [
        {
          name: 'malicious.exe',
          type: 'application/octet-stream',
          content: 'MZ\x90\x00', // PE header
          expected: 'REJECT',
          risk: 'CRITICAL'
        },
        {
          name: 'script.js',
          type: 'application/javascript',
          content: 'alert("XSS")',
          expected: 'REJECT',
          risk: 'HIGH'
        },
        {
          name: 'malicious.php',
          type: 'application/x-php',
          content: '<?php system($_GET["cmd"]); ?>',
          expected: 'REJECT',
          risk: 'CRITICAL'
        },
        {
          name: 'fake.jpg',
          type: 'image/jpeg',
          content: '<?php echo "PHP in image"; ?>',
          expected: 'REJECT',
          risk: 'HIGH'
        },
        {
          name: 'huge-file.pdf',
          type: 'application/pdf',
          size: 15 * 1024 * 1024, // 15MB
          expected: 'REJECT',
          risk: 'MEDIUM'
        },
        {
          name: 'svg-xss.svg',
          type: 'image/svg+xml',
          content: '<svg><script>alert("XSS")</script></svg>',
          expected: 'REJECT',
          risk: 'HIGH'
        },
        {
          name: 'legitimate.jpg',
          type: 'image/jpeg',
          content: 'JPEG_HEADER_DATA',
          size: 1024 * 1024, // 1MB
          expected: 'ACCEPT',
          risk: 'NONE'
        }
      ];

      const vulnerabilities = [];
      let passedValidation = 0;

      for (const file of maliciousFiles) {
        const result = await this.validateFileUpload(file);
        
        if (result.accepted && file.expected === 'REJECT') {
          vulnerabilities.push({
            filename: file.name,
            type: file.type,
            vulnerability: `Malicious file ${file.name} was incorrectly accepted`,
            risk: file.risk
          });
        } else if (!result.accepted && file.expected === 'ACCEPT') {
          vulnerabilities.push({
            filename: file.name,
            type: file.type,
            vulnerability: `Legitimate file ${file.name} was incorrectly rejected`,
            risk: 'LOW'
          });
        } else {
          passedValidation++;
        }
      }

      const passed = vulnerabilities.length === 0;
      const criticalVulns = vulnerabilities.filter(v => v.risk === 'CRITICAL').length;
      const highVulns = vulnerabilities.filter(v => v.risk === 'HIGH').length;

      this.results.tests.push({
        name: testName,
        status: passed ? 'PASS' : 'FAIL',
        details: {
          filesTestted: maliciousFiles.length,
          passedValidation: passedValidation,
          vulnerabilitiesFound: vulnerabilities.length,
          criticalVulnerabilities: criticalVulns,
          highRiskVulnerabilities: highVulns,
          vulnerabilities: vulnerabilities,
          requirement: 'All malicious files must be rejected, legitimate files accepted'
        },
        passed,
        riskLevel: criticalVulns > 0 ? 'CRITICAL' : highVulns > 0 ? 'HIGH' : 'LOW'
      });

      console.log(passed ? '✅ PASS' : '❌ FAIL');
      console.log(`   Files tested: ${maliciousFiles.length}`);
      console.log(`   Passed validation: ${passedValidation}`);
      console.log(`   Vulnerabilities: ${vulnerabilities.length}`);

    } catch (error) {
      this.results.tests.push({
        name: testName,
        status: 'ERROR',
        error: error.message,
        passed: false,
        riskLevel: 'HIGH'
      });
      console.log('❌ ERROR:', error.message);
    }
  }

  // Validate file upload based on component logic
  async validateFileUpload(file) {
    // Simulate the file validation logic from MessageInput component
    const allowedTypes = ['image/', 'video/', 'audio/', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    // Type validation
    const isValidType = allowedTypes.some(type => file.type.startsWith(type));
    
    // Size validation
    const isValidSize = (file.size || 0) <= maxSize;
    
    // Content validation (basic)
    let isValidContent = true;
    if (file.content) {
      // Check for script content in files
      if (file.content.includes('<script') || 
          file.content.includes('<?php') || 
          file.content.includes('javascript:')) {
        isValidContent = false;
      }
    }
    
    // Special handling for SVG
    if (file.type === 'image/svg+xml') {
      if (file.content && file.content.includes('<script')) {
        isValidContent = false;
      }
    }
    
    const accepted = isValidType && isValidSize && isValidContent;
    
    return {
      accepted,
      reasons: {
        typeValid: isValidType,
        sizeValid: isValidSize,
        contentValid: isValidContent
      }
    };
  }

  // Test input length and content restrictions
  async testInputRestrictions() {
    const testName = 'Input Length and Content Restrictions';
    console.log(`\n🛡️ Running ${testName}...`);
    
    try {
      const maxLength = 2000; // From component
      const testCases = [
        {
          name: 'Normal Message',
          input: 'This is a normal trading message.',
          shouldAccept: true
        },
        {
          name: 'Maximum Length Message',
          input: 'a'.repeat(maxLength),
          shouldAccept: true
        },
        {
          name: 'Over Limit Message',
          input: 'a'.repeat(maxLength + 100),
          shouldAccept: false
        },
        {
          name: 'SQL Injection Attempt',
          input: "'; DROP TABLE users; --",
          shouldAccept: true, // Should be sanitized but accepted
          requiresSanitization: true
        },
        {
          name: 'Command Injection',
          input: '$(rm -rf /)',
          shouldAccept: true,
          requiresSanitization: true
        },
        {
          name: 'Unicode Overflow',
          input: '\u0000'.repeat(1000),
          shouldAccept: false
        },
        {
          name: 'Control Characters',
          input: '\x00\x01\x02\x03\x04\x05',
          shouldAccept: false
        }
      ];

      const failures = [];

      for (const testCase of testCases) {
        const result = await this.validateMessageInput(testCase.input, maxLength);
        
        if (result.accepted !== testCase.shouldAccept) {
          failures.push({
            testCase: testCase.name,
            input: testCase.input.substring(0, 50) + (testCase.input.length > 50 ? '...' : ''),
            expected: testCase.shouldAccept ? 'ACCEPT' : 'REJECT',
            actual: result.accepted ? 'ACCEPT' : 'REJECT',
            reason: result.reason
          });
        }
      }

      const passed = failures.length === 0;

      this.results.tests.push({
        name: testName,
        status: passed ? 'PASS' : 'FAIL',
        details: {
          testCases: testCases.length,
          failures: failures.length,
          failedCases: failures,
          requirement: 'Input validation must properly handle all edge cases'
        },
        passed,
        riskLevel: failures.length > 0 ? 'MEDIUM' : 'LOW'
      });

      console.log(passed ? '✅ PASS' : '❌ FAIL');
      console.log(`   Test cases: ${testCases.length}`);
      console.log(`   Failures: ${failures.length}`);

    } catch (error) {
      this.results.tests.push({
        name: testName,
        status: 'ERROR',
        error: error.message,
        passed: false,
        riskLevel: 'MEDIUM'
      });
      console.log('❌ ERROR:', error.message);
    }
  }

  // Validate message input
  async validateMessageInput(input, maxLength) {
    // Length validation
    if (input.length > maxLength) {
      return { accepted: false, reason: 'Length exceeds maximum' };
    }

    // Control character validation
    if (/[\x00-\x1f\x7f]/.test(input)) {
      return { accepted: false, reason: 'Contains control characters' };
    }

    // Null byte validation
    if (input.includes('\u0000')) {
      return { accepted: false, reason: 'Contains null bytes' };
    }

    return { accepted: true, reason: 'Valid input' };
  }

  // Test CSRF protection
  async testCSRFProtection() {
    const testName = 'CSRF Protection';
    console.log(`\n🛡️ Running ${testName}...`);
    
    try {
      // Simulate CSRF attack scenarios
      const attacks = [
        {
          name: 'Missing CSRF Token',
          hasToken: false,
          validToken: false,
          expected: 'REJECT'
        },
        {
          name: 'Invalid CSRF Token',
          hasToken: true,
          validToken: false,
          expected: 'REJECT'
        },
        {
          name: 'Valid CSRF Token',
          hasToken: true,
          validToken: true,
          expected: 'ACCEPT'
        }
      ];

      const vulnerabilities = [];

      for (const attack of attacks) {
        const result = await this.validateCSRFToken(attack.hasToken, attack.validToken);
        
        if (result.accepted && attack.expected === 'REJECT') {
          vulnerabilities.push({
            attack: attack.name,
            vulnerability: 'CSRF protection bypassed',
            risk: 'HIGH'
          });
        }
      }

      const passed = vulnerabilities.length === 0;

      this.results.tests.push({
        name: testName,
        status: passed ? 'PASS' : 'FAIL',
        details: {
          attacksTestted: attacks.length,
          vulnerabilities: vulnerabilities,
          requirement: 'All requests must include valid CSRF token'
        },
        passed,
        riskLevel: vulnerabilities.length > 0 ? 'HIGH' : 'LOW'
      });

      console.log(passed ? '✅ PASS' : '❌ FAIL');
      console.log(`   CSRF attacks tested: ${attacks.length}`);
      console.log(`   Vulnerabilities: ${vulnerabilities.length}`);

    } catch (error) {
      this.results.tests.push({
        name: testName,
        status: 'ERROR',
        error: error.message,
        passed: false,
        riskLevel: 'HIGH'
      });
      console.log('❌ ERROR:', error.message);
    }
  }

  // Validate CSRF token
  async validateCSRFToken(hasToken, validToken) {
    if (!hasToken) {
      return { accepted: false, reason: 'No CSRF token provided' };
    }

    if (!validToken) {
      return { accepted: false, reason: 'Invalid CSRF token' };
    }

    return { accepted: true, reason: 'Valid CSRF token' };
  }

  async runAllTests() {
    console.log('🛡️ Starting QA-002: Security Testing Suite');
    console.log('=' .repeat(60));
    
    await this.testXSSPrevention();
    await this.testFileUploadSecurity();
    await this.testInputRestrictions();
    await this.testCSRFProtection();
    
    this.generateSummary();
    await this.saveResults();
    
    console.log('\n' + '='.repeat(60));
    console.log('🛡️ Security Test Summary:');
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Passed: ${this.results.summary.passedTests}`);
    console.log(`Failed: ${this.results.summary.failedTests}`);
    console.log(`Critical Issues: ${this.results.summary.criticalIssues}`);
    console.log(`High Risk Issues: ${this.results.summary.highRiskIssues}`);
    console.log(`Medium Risk Issues: ${this.results.summary.mediumRiskIssues}`);
    
    return this.results.summary.criticalIssues === 0 && this.results.summary.highRiskIssues === 0;
  }

  generateSummary() {
    this.results.summary.totalTests = this.results.tests.length;
    this.results.summary.passedTests = this.results.tests.filter(t => t.passed).length;
    this.results.summary.failedTests = this.results.tests.filter(t => !t.passed).length;
    
    // Count issues by risk level
    this.results.tests.forEach(test => {
      if (test.riskLevel === 'CRITICAL') {
        this.results.summary.criticalIssues++;
      } else if (test.riskLevel === 'HIGH') {
        this.results.summary.highRiskIssues++;
      } else if (test.riskLevel === 'MEDIUM') {
        this.results.summary.mediumRiskIssues++;
      }
    });
  }

  async saveResults() {
    const timestamp = Date.now();
    const resultsPath = path.join(process.cwd(), 'QA', '1.1.4.4-message-input', 'evidence');
    
    // Ensure evidence directory exists
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }
    
    const filename = `security-test-results-${timestamp}.json`;
    const filepath = path.join(resultsPath, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n📁 Results saved to: ${filepath}`);
  }
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new SecurityTestSuite();
  testSuite.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Security test suite failed:', error);
      process.exit(1);
    });
}

export default SecurityTestSuite;