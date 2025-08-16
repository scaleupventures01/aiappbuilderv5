#!/usr/bin/env node

/**
 * Comprehensive Test Runner for PRD-1.1.4.4 Message Input Component
 * Orchestrates all QA test suites and generates final QA report
 * 
 * QA Engineer: QA Team
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'node:perf_hooks';

import PerformanceTestSuite from './performance-test.mjs';
import SecurityTestSuite from './security-test.mjs';
import FileUploadTestSuite from './file-upload-test.mjs';
import CrossBrowserTestSuite from './cross-browser-test.mjs';
import MobileDeviceTestSuite from './mobile-device-test.mjs';
import AccessibilityTestSuite from './accessibility-test.mjs';

class ComprehensiveTestRunner {
  constructor() {
    this.results = {
      testRun: 'PRD-1.1.4.4 Message Input Component - Comprehensive QA Testing',
      timestamp: new Date().toISOString(),
      duration: 0,
      summary: {
        totalTestSuites: 6,
        passedTestSuites: 0,
        failedTestSuites: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        overallStatus: 'PENDING',
        criticalIssues: 0,
        highPriorityIssues: 0,
        mediumPriorityIssues: 0,
        qaSignOff: false
      },
      testSuiteResults: {},
      recommendations: [],
      blockers: [],
      issuesSummary: {
        performance: [],
        security: [],
        fileUpload: [],
        crossBrowser: [],
        mobile: [],
        accessibility: []
      }
    };
  }

  async runAllTestSuites() {
    console.log('🚀 COMPREHENSIVE QA TEST EXECUTION - PRD-1.1.4.4');
    console.log('='.repeat(80));
    console.log('Testing Message Input Component implementation');
    console.log('QA Engineer: QA Team');
    console.log('Test Start Time:', new Date().toISOString());
    console.log('='.repeat(80));

    const startTime = performance.now();

    try {
      // QA-001: Performance Testing
      console.log('\n🏃‍♂️ EXECUTING QA-001: Performance Testing...');
      const performanceResults = await this.runPerformanceTests();
      this.processTestSuiteResults('performance', performanceResults);

      // QA-002: Security Testing
      console.log('\n🛡️ EXECUTING QA-002: Security Testing...');
      const securityResults = await this.runSecurityTests();
      this.processTestSuiteResults('security', securityResults);

      // QA-003: File Upload Testing
      console.log('\n📁 EXECUTING QA-003: File Upload Testing...');
      const fileUploadResults = await this.runFileUploadTests();
      this.processTestSuiteResults('fileUpload', fileUploadResults);

      // QA-004: Cross-Browser Testing
      console.log('\n🌐 EXECUTING QA-004: Cross-Browser Testing...');
      const crossBrowserResults = await this.runCrossBrowserTests();
      this.processTestSuiteResults('crossBrowser', crossBrowserResults);

      // QA-005: Mobile Device Testing
      console.log('\n📱 EXECUTING QA-005: Mobile Device Testing...');
      const mobileResults = await this.runMobileTests();
      this.processTestSuiteResults('mobile', mobileResults);

      // QA-006: Accessibility Testing
      console.log('\n♿ EXECUTING QA-006: Accessibility Testing...');
      const accessibilityResults = await this.runAccessibilityTests();
      this.processTestSuiteResults('accessibility', accessibilityResults);

      const endTime = performance.now();
      this.results.duration = Math.round(endTime - startTime);

      this.generateFinalSummary();
      this.generateRecommendations();
      await this.saveComprehensiveReport();
      
      this.printFinalReport();

      return this.results.summary.overallStatus === 'PASS';

    } catch (error) {
      console.error('❌ CRITICAL ERROR in test execution:', error.message);
      this.results.summary.overallStatus = 'ERROR';
      this.results.blockers.push({
        type: 'CRITICAL',
        component: 'Test Runner',
        issue: error.message,
        impact: 'Cannot complete QA validation'
      });
      return false;
    }
  }

  async runPerformanceTests() {
    try {
      const suite = new PerformanceTestSuite();
      const success = await suite.runAllTests();
      return {
        success,
        results: suite.results,
        category: 'Performance'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        category: 'Performance'
      };
    }
  }

  async runSecurityTests() {
    try {
      const suite = new SecurityTestSuite();
      const success = await suite.runAllTests();
      return {
        success,
        results: suite.results,
        category: 'Security'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        category: 'Security'
      };
    }
  }

  async runFileUploadTests() {
    try {
      const suite = new FileUploadTestSuite();
      const success = await suite.runAllTests();
      return {
        success,
        results: suite.results,
        category: 'File Upload'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        category: 'File Upload'
      };
    }
  }

  async runCrossBrowserTests() {
    try {
      const suite = new CrossBrowserTestSuite();
      const success = await suite.runAllTests();
      return {
        success,
        results: suite.results,
        category: 'Cross-Browser'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        category: 'Cross-Browser'
      };
    }
  }

  async runMobileTests() {
    try {
      const suite = new MobileDeviceTestSuite();
      const success = await suite.runAllTests();
      return {
        success,
        results: suite.results,
        category: 'Mobile'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        category: 'Mobile'
      };
    }
  }

  async runAccessibilityTests() {
    try {
      const suite = new AccessibilityTestSuite();
      const success = await suite.runAllTests();
      return {
        success,
        results: suite.results,
        category: 'Accessibility'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        category: 'Accessibility'
      };
    }
  }

  processTestSuiteResults(category, testResults) {
    this.results.testSuiteResults[category] = testResults;

    if (testResults.success) {
      this.results.summary.passedTestSuites++;
    } else {
      this.results.summary.failedTestSuites++;
    }

    if (testResults.results && testResults.results.summary) {
      const summary = testResults.results.summary;
      this.results.summary.totalTests += summary.totalTests || 0;
      this.results.summary.passedTests += summary.passedTests || 0;
      this.results.summary.failedTests += summary.failedTests || 0;

      // Extract issues by priority
      if (testResults.results.tests) {
        for (const test of testResults.results.tests) {
          if (!test.passed) {
            const issue = {
              testSuite: category,
              testName: test.name,
              issue: test.error || 'Test failed',
              priority: this.determinePriority(category, test)
            };

            this.results.issuesSummary[category].push(issue);

            switch (issue.priority) {
              case 'CRITICAL':
                this.results.summary.criticalIssues++;
                break;
              case 'HIGH':
                this.results.summary.highPriorityIssues++;
                break;
              case 'MEDIUM':
                this.results.summary.mediumPriorityIssues++;
                break;
            }
          }
        }
      }
    }

    if (testResults.error) {
      this.results.blockers.push({
        type: 'ERROR',
        component: category,
        issue: testResults.error,
        impact: `${category} testing could not be completed`
      });
    }
  }

  determinePriority(category, test) {
    // Security issues are always high priority
    if (category === 'security') {
      return 'CRITICAL';
    }

    // Accessibility issues that affect WCAG compliance
    if (category === 'accessibility' && test.name.includes('WCAG')) {
      return 'HIGH';
    }

    // Performance issues that affect user experience
    if (category === 'performance' && test.name.includes('Response Time')) {
      return 'HIGH';
    }

    // File upload security issues
    if (category === 'fileUpload' && test.name.includes('Security')) {
      return 'CRITICAL';
    }

    // Mobile compatibility issues
    if (category === 'mobile' && test.name.includes('Touch')) {
      return 'HIGH';
    }

    // Cross-browser compatibility issues
    if (category === 'crossBrowser' && test.name.includes('Basic Functionality')) {
      return 'HIGH';
    }

    return 'MEDIUM';
  }

  generateFinalSummary() {
    const passRate = this.results.summary.totalTests > 0 
      ? (this.results.summary.passedTests / this.results.summary.totalTests) * 100 
      : 0;

    // Determine overall status
    if (this.results.summary.criticalIssues > 0) {
      this.results.summary.overallStatus = 'FAIL';
    } else if (this.results.summary.highPriorityIssues > 3) {
      this.results.summary.overallStatus = 'FAIL';
    } else if (passRate >= 95) {
      this.results.summary.overallStatus = 'PASS';
    } else if (passRate >= 90) {
      this.results.summary.overallStatus = 'CONDITIONAL_PASS';
    } else {
      this.results.summary.overallStatus = 'FAIL';
    }

    // QA Sign-off determination
    this.results.summary.qaSignOff = (
      this.results.summary.overallStatus === 'PASS' ||
      (this.results.summary.overallStatus === 'CONDITIONAL_PASS' && 
       this.results.summary.criticalIssues === 0)
    );

    this.results.summary.passRate = `${passRate.toFixed(1)}%`;
  }

  generateRecommendations() {
    const recommendations = [];

    // Performance recommendations
    if (this.results.issuesSummary.performance.length > 0) {
      recommendations.push({
        category: 'Performance',
        priority: 'HIGH',
        recommendation: 'Optimize input response time to meet <100ms requirement',
        action: 'Review and optimize React state updates and DOM manipulation'
      });
    }

    // Security recommendations
    if (this.results.issuesSummary.security.length > 0) {
      recommendations.push({
        category: 'Security',
        priority: 'CRITICAL',
        recommendation: 'Address all XSS vulnerabilities and input sanitization issues',
        action: 'Implement proper input validation and output encoding'
      });
    }

    // File upload recommendations
    if (this.results.issuesSummary.fileUpload.length > 0) {
      recommendations.push({
        category: 'File Upload',
        priority: 'HIGH',
        recommendation: 'Strengthen file validation and security checks',
        action: 'Review MIME type validation and implement content scanning'
      });
    }

    // Cross-browser recommendations
    if (this.results.issuesSummary.crossBrowser.length > 0) {
      recommendations.push({
        category: 'Cross-Browser',
        priority: 'MEDIUM',
        recommendation: 'Improve cross-browser compatibility',
        action: 'Test and fix issues in older browser versions'
      });
    }

    // Mobile recommendations
    if (this.results.issuesSummary.mobile.length > 0) {
      recommendations.push({
        category: 'Mobile',
        priority: 'HIGH',
        recommendation: 'Enhance mobile user experience',
        action: 'Fix touch interactions and virtual keyboard behavior'
      });
    }

    // Accessibility recommendations
    if (this.results.issuesSummary.accessibility.length > 0) {
      recommendations.push({
        category: 'Accessibility',
        priority: 'HIGH',
        recommendation: 'Achieve WCAG 2.1 AA compliance',
        action: 'Fix color contrast, keyboard navigation, and screen reader support'
      });
    }

    // Add release recommendations
    if (this.results.summary.overallStatus === 'PASS') {
      recommendations.push({
        category: 'Release',
        priority: 'LOW',
        recommendation: 'Component ready for production release',
        action: 'Monitor performance metrics post-deployment'
      });
    } else if (this.results.summary.overallStatus === 'CONDITIONAL_PASS') {
      recommendations.push({
        category: 'Release',
        priority: 'MEDIUM',
        recommendation: 'Component may be released with monitoring',
        action: 'Address medium priority issues in next iteration'
      });
    } else {
      recommendations.push({
        category: 'Release',
        priority: 'CRITICAL',
        recommendation: 'Component not ready for production release',
        action: 'Address all critical and high priority issues before release'
      });
    }

    this.results.recommendations = recommendations;
  }

  printFinalReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL QA REPORT - PRD-1.1.4.4 MESSAGE INPUT COMPONENT');
    console.log('='.repeat(80));
    console.log(`Test Execution Time: ${(this.results.duration / 1000).toFixed(1)} seconds`);
    console.log(`Report Generated: ${new Date().toISOString()}`);
    console.log('');

    console.log('📋 OVERALL SUMMARY:');
    console.log(`  Overall Status: ${this.getStatusIcon()} ${this.results.summary.overallStatus}`);
    console.log(`  QA Sign-off: ${this.results.summary.qaSignOff ? '✅ APPROVED' : '❌ REJECTED'}`);
    console.log(`  Pass Rate: ${this.results.summary.passRate}`);
    console.log('');

    console.log('📈 TEST EXECUTION METRICS:');
    console.log(`  Test Suites: ${this.results.summary.passedTestSuites}/${this.results.summary.totalTestSuites} passed`);
    console.log(`  Individual Tests: ${this.results.summary.passedTests}/${this.results.summary.totalTests} passed`);
    console.log(`  Failed Tests: ${this.results.summary.failedTests}`);
    console.log('');

    console.log('🚨 ISSUES BREAKDOWN:');
    console.log(`  Critical Issues: ${this.results.summary.criticalIssues}`);
    console.log(`  High Priority Issues: ${this.results.summary.highPriorityIssues}`);
    console.log(`  Medium Priority Issues: ${this.results.summary.mediumPriorityIssues}`);
    console.log('');

    console.log('🔍 TEST SUITE RESULTS:');
    for (const [category, result] of Object.entries(this.results.testSuiteResults)) {
      const icon = result.success ? '✅' : '❌';
      const status = result.success ? 'PASS' : 'FAIL';
      console.log(`  ${icon} ${category}: ${status}`);
    }
    console.log('');

    if (this.results.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach(rec => {
        const priorityIcon = rec.priority === 'CRITICAL' ? '🔴' : 
                           rec.priority === 'HIGH' ? '🟡' : '🟢';
        console.log(`  ${priorityIcon} [${rec.priority}] ${rec.category}: ${rec.recommendation}`);
      });
      console.log('');
    }

    if (this.results.blockers.length > 0) {
      console.log('🚫 BLOCKERS:');
      this.results.blockers.forEach(blocker => {
        console.log(`  ❌ ${blocker.component}: ${blocker.issue}`);
      });
      console.log('');
    }

    console.log('='.repeat(80));
    if (this.results.summary.qaSignOff) {
      console.log('✅ QA APPROVAL: Message Input Component is approved for production release');
    } else {
      console.log('❌ QA REJECTION: Message Input Component requires fixes before release');
    }
    console.log('='.repeat(80));
  }

  getStatusIcon() {
    switch (this.results.summary.overallStatus) {
      case 'PASS': return '✅';
      case 'CONDITIONAL_PASS': return '⚠️';
      case 'FAIL': return '❌';
      case 'ERROR': return '💥';
      default: return '❓';
    }
  }

  async saveComprehensiveReport() {
    const timestamp = Date.now();
    const resultsPath = path.join(process.cwd(), 'QA', '1.1.4.4-message-input', 'evidence');
    
    // Ensure evidence directory exists
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }
    
    // Save comprehensive JSON report
    const jsonFilename = `comprehensive-qa-report-${timestamp}.json`;
    const jsonFilepath = path.join(resultsPath, jsonFilename);
    fs.writeFileSync(jsonFilepath, JSON.stringify(this.results, null, 2));

    // Save summary report
    const summaryFilename = `qa-summary-${timestamp}.md`;
    const summaryFilepath = path.join(resultsPath, summaryFilename);
    const summaryContent = this.generateMarkdownSummary();
    fs.writeFileSync(summaryFilepath, summaryContent);

    console.log(`\n📁 Comprehensive QA Report saved to: ${jsonFilepath}`);
    console.log(`📁 QA Summary saved to: ${summaryFilepath}`);
  }

  generateMarkdownSummary() {
    return `# QA Test Report - PRD-1.1.4.4 Message Input Component

## Executive Summary

- **Overall Status**: ${this.results.summary.overallStatus}
- **QA Sign-off**: ${this.results.summary.qaSignOff ? 'APPROVED ✅' : 'REJECTED ❌'}
- **Pass Rate**: ${this.results.summary.passRate}
- **Test Duration**: ${(this.results.duration / 1000).toFixed(1)} seconds
- **Report Date**: ${new Date().toISOString()}

## Test Results Overview

### Test Suites
- Total Test Suites: ${this.results.summary.totalTestSuites}
- Passed: ${this.results.summary.passedTestSuites}
- Failed: ${this.results.summary.failedTestSuites}

### Individual Tests
- Total Tests: ${this.results.summary.totalTests}
- Passed: ${this.results.summary.passedTests}
- Failed: ${this.results.summary.failedTests}

## Issues Summary

- **Critical Issues**: ${this.results.summary.criticalIssues}
- **High Priority Issues**: ${this.results.summary.highPriorityIssues}
- **Medium Priority Issues**: ${this.results.summary.mediumPriorityIssues}

## Test Suite Results

${Object.entries(this.results.testSuiteResults).map(([category, result]) => 
  `- **${category}**: ${result.success ? 'PASS ✅' : 'FAIL ❌'}`
).join('\n')}

## Recommendations

${this.results.recommendations.map(rec => 
  `### ${rec.category} [${rec.priority}]
- **Recommendation**: ${rec.recommendation}
- **Action**: ${rec.action}`
).join('\n\n')}

## QA Engineer Sign-off

**Status**: ${this.results.summary.qaSignOff ? 'APPROVED' : 'REJECTED'}

${this.results.summary.qaSignOff 
  ? 'The Message Input Component has passed all critical QA tests and is approved for production release.'
  : 'The Message Input Component has issues that must be resolved before production release.'
}

---
*Generated by Automated QA Test Suite*
*QA Engineer: QA Team*
`;
  }
}

// Run comprehensive tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new ComprehensiveTestRunner();
  runner.runAllTestSuites()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Comprehensive test runner failed:', error);
      process.exit(1);
    });
}

export default ComprehensiveTestRunner;