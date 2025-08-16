#!/usr/bin/env node

/**
 * Simple QA Test Runner for PRD-1.1.4.4 Message Input Component
 * Runs individual test files and collects results
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class SimpleQARunner {
  constructor() {
    this.results = {
      testRun: 'PRD-1.1.4.4 Message Input Component QA Tests',
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {
        totalTests: 6,
        passed: 0,
        failed: 0,
        overallStatus: 'PENDING'
      }
    };
  }

  async runTest(testFile, testName) {
    console.log(`\n🧪 Running ${testName}...`);
    
    return new Promise((resolve) => {
      const child = spawn('node', [testFile], {
        cwd: process.cwd(),
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        process.stdout.write(data);
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        process.stderr.write(data);
      });

      child.on('close', (code) => {
        const success = code === 0;
        this.results.tests[testName] = {
          success,
          exitCode: code,
          stdout,
          stderr: stderr || null
        };

        if (success) {
          this.results.summary.passed++;
        } else {
          this.results.summary.failed++;
        }

        console.log(success ? '✅ PASSED' : '❌ FAILED');
        resolve(success);
      });

      // Set a timeout for long-running tests
      setTimeout(() => {
        child.kill('SIGTERM');
        console.log('⏰ Test timed out');
        resolve(false);
      }, 120000); // 2 minutes timeout
    });
  }

  async runAllTests() {
    console.log('🚀 Starting QA Test Suite for Message Input Component');
    console.log('=' .repeat(60));

    const tests = [
      ['performance-test.mjs', 'QA-001: Performance Testing'],
      ['security-test.mjs', 'QA-002: Security Testing'],
      ['file-upload-test.mjs', 'QA-003: File Upload Testing'],
      ['cross-browser-test.mjs', 'QA-004: Cross-Browser Testing'],
      ['mobile-device-test.mjs', 'QA-005: Mobile Device Testing'],
      ['accessibility-test.mjs', 'QA-006: Accessibility Testing']
    ];

    for (const [file, name] of tests) {
      await this.runTest(file, name);
    }

    this.generateSummary();
    await this.saveResults();
    this.printSummary();

    return this.results.summary.failed === 0;
  }

  generateSummary() {
    const passRate = (this.results.summary.passed / this.results.summary.totalTests) * 100;
    
    if (this.results.summary.failed === 0) {
      this.results.summary.overallStatus = 'PASS';
    } else if (passRate >= 80) {
      this.results.summary.overallStatus = 'CONDITIONAL_PASS';
    } else {
      this.results.summary.overallStatus = 'FAIL';
    }

    this.results.summary.passRate = `${passRate.toFixed(1)}%`;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 QA TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Overall Status: ${this.results.summary.overallStatus}`);
    console.log(`Tests Passed: ${this.results.summary.passed}/${this.results.summary.totalTests}`);
    console.log(`Pass Rate: ${this.results.summary.passRate}`);
    console.log('');

    for (const [testName, result] of Object.entries(this.results.tests)) {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${testName}`);
    }

    console.log('\n' + '='.repeat(60));
    if (this.results.summary.overallStatus === 'PASS') {
      console.log('✅ ALL TESTS PASSED - Component ready for review');
    } else {
      console.log('❌ SOME TESTS FAILED - Review required');
    }
    console.log('='.repeat(60));
  }

  async saveResults() {
    const evidenceDir = path.join(process.cwd(), 'evidence');
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `qa-test-execution-${timestamp}.json`;
    const filepath = path.join(evidenceDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n📁 Results saved to: ${filepath}`);
  }
}

// Run the tests
const runner = new SimpleQARunner();
runner.runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });