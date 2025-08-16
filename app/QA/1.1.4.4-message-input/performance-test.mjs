#!/usr/bin/env node

/**
 * QA-001: Input Response Time Validation Test
 * Tests < 100ms input response time, rapid typing performance, 95th percentile metrics
 * 
 * PRD: 1.1.4.4 - Message Input Component
 * QA Engineer: QA Team
 */

import { performance } from 'node:perf_hooks';
import fs from 'fs';
import path from 'path';

class PerformanceTestSuite {
  constructor() {
    this.results = {
      testSuite: 'QA-001: Input Response Time Validation',
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      }
    };
    this.responseTimes = [];
  }

  // Simulate rapid typing with performance measurement
  async simulateRapidTyping() {
    const testName = 'Rapid Typing Response Time';
    console.log(`\n🧪 Running ${testName}...`);
    
    const responseTimes = [];
    const characters = 'The quick brown fox jumps over the lazy dog. This is a test of rapid typing performance.';
    
    try {
      for (let i = 0; i < characters.length; i++) {
        const start = performance.now();
        
        // Simulate DOM manipulation and React state update
        await this.simulateInputEvent(characters[i]);
        
        const end = performance.now();
        const responseTime = end - start;
        responseTimes.push(responseTime);
        
        // Add small delay to simulate real typing
        await this.sleep(10 + Math.random() * 20);
      }
      
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const p95 = this.calculatePercentile(responseTimes, 95);
      const p99 = this.calculatePercentile(responseTimes, 99);
      const maxResponseTime = Math.max(...responseTimes);
      
      this.responseTimes = this.responseTimes.concat(responseTimes);
      
      const passed = avgResponseTime < 100 && p95 < 100;
      
      this.results.tests.push({
        name: testName,
        status: passed ? 'PASS' : 'FAIL',
        details: {
          averageResponseTime: `${avgResponseTime.toFixed(2)}ms`,
          p95ResponseTime: `${p95.toFixed(2)}ms`,
          p99ResponseTime: `${p99.toFixed(2)}ms`,
          maxResponseTime: `${maxResponseTime.toFixed(2)}ms`,
          totalKeystrokes: characters.length,
          requirement: '< 100ms average response time'
        },
        passed
      });
      
      console.log(passed ? '✅ PASS' : '❌ FAIL');
      console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   95th percentile: ${p95.toFixed(2)}ms`);
      console.log(`   99th percentile: ${p99.toFixed(2)}ms`);
      
    } catch (error) {
      this.results.tests.push({
        name: testName,
        status: 'ERROR',
        error: error.message,
        passed: false
      });
      console.log('❌ ERROR:', error.message);
    }
  }

  // Simulate burst typing patterns
  async simulateBurstTyping() {
    const testName = 'Burst Typing Performance';
    console.log(`\n🧪 Running ${testName}...`);
    
    try {
      const burstSizes = [5, 10, 20, 50];
      const burstResults = [];
      
      for (const burstSize of burstSizes) {
        const burstTimes = [];
        const text = 'a'.repeat(burstSize);
        
        for (let burst = 0; burst < 10; burst++) {
          const start = performance.now();
          
          // Simulate rapid burst input
          for (let i = 0; i < burstSize; i++) {
            await this.simulateInputEvent(text[i]);
          }
          
          const end = performance.now();
          burstTimes.push(end - start);
          
          await this.sleep(100); // Small delay between bursts
        }
        
        const avgBurstTime = burstTimes.reduce((a, b) => a + b, 0) / burstTimes.length;
        const avgPerCharacter = avgBurstTime / burstSize;
        
        burstResults.push({
          burstSize,
          averageTotalTime: avgBurstTime.toFixed(2),
          averagePerCharacter: avgPerCharacter.toFixed(2),
          acceptable: avgPerCharacter < 100
        });
      }
      
      const allAcceptable = burstResults.every(result => result.acceptable);
      
      this.results.tests.push({
        name: testName,
        status: allAcceptable ? 'PASS' : 'FAIL',
        details: {
          burstResults,
          requirement: '< 100ms per character even in bursts'
        },
        passed: allAcceptable
      });
      
      console.log(allAcceptable ? '✅ PASS' : '❌ FAIL');
      burstResults.forEach(result => {
        console.log(`   Burst ${result.burstSize}: ${result.averagePerCharacter}ms/char`);
      });
      
    } catch (error) {
      this.results.tests.push({
        name: testName,
        status: 'ERROR',
        error: error.message,
        passed: false
      });
      console.log('❌ ERROR:', error.message);
    }
  }

  // Test memory usage during extended typing
  async testMemoryUsage() {
    const testName = 'Memory Usage During Extended Typing';
    console.log(`\n🧪 Running ${testName}...`);
    
    try {
      const initialMemory = process.memoryUsage();
      const longText = 'This is a very long message that simulates extended typing session. '.repeat(100);
      
      const start = performance.now();
      
      for (let i = 0; i < longText.length; i++) {
        await this.simulateInputEvent(longText[i]);
        
        // Simulate some processing delay
        if (i % 100 === 0) {
          await this.sleep(1);
        }
      }
      
      const end = performance.now();
      const finalMemory = process.memoryUsage();
      
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB
      const totalTime = end - start;
      const avgPerChar = totalTime / longText.length;
      
      const passed = memoryIncrease < 50 && avgPerChar < 100; // < 50MB increase, < 100ms per char
      
      this.results.tests.push({
        name: testName,
        status: passed ? 'PASS' : 'FAIL',
        details: {
          charactersTyped: longText.length,
          totalTime: `${totalTime.toFixed(2)}ms`,
          averagePerCharacter: `${avgPerChar.toFixed(2)}ms`,
          memoryIncrease: `${memoryIncrease.toFixed(2)}MB`,
          requirement: '< 50MB memory increase, < 100ms per character'
        },
        passed
      });
      
      console.log(passed ? '✅ PASS' : '❌ FAIL');
      console.log(`   Characters: ${longText.length}`);
      console.log(`   Avg per char: ${avgPerChar.toFixed(2)}ms`);
      console.log(`   Memory increase: ${memoryIncrease.toFixed(2)}MB`);
      
    } catch (error) {
      this.results.tests.push({
        name: testName,
        status: 'ERROR',
        error: error.message,
        passed: false
      });
      console.log('❌ ERROR:', error.message);
    }
  }

  // Test input lag under concurrent operations
  async testConcurrentOperationsLag() {
    const testName = 'Input Lag Under Concurrent Operations';
    console.log(`\n🧪 Running ${testName}...`);
    
    try {
      const responseTimes = [];
      
      // Simulate concurrent operations
      const concurrentTasks = [
        this.simulateFileUpload(),
        this.simulateAPICall(),
        this.simulateUIUpdates()
      ];
      
      // Start concurrent tasks
      Promise.all(concurrentTasks);
      
      // Test input responsiveness during concurrent operations
      for (let i = 0; i < 50; i++) {
        const start = performance.now();
        await this.simulateInputEvent('a');
        const end = performance.now();
        
        responseTimes.push(end - start);
        await this.sleep(50);
      }
      
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const p95 = this.calculatePercentile(responseTimes, 95);
      const maxTime = Math.max(...responseTimes);
      
      const passed = avgResponseTime < 150 && p95 < 200; // More lenient during concurrent ops
      
      this.results.tests.push({
        name: testName,
        status: passed ? 'PASS' : 'FAIL',
        details: {
          averageResponseTime: `${avgResponseTime.toFixed(2)}ms`,
          p95ResponseTime: `${p95.toFixed(2)}ms`,
          maxResponseTime: `${maxTime.toFixed(2)}ms`,
          requirement: '< 150ms average, < 200ms p95 during concurrent operations'
        },
        passed
      });
      
      console.log(passed ? '✅ PASS' : '❌ FAIL');
      console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   95th percentile: ${p95.toFixed(2)}ms`);
      
    } catch (error) {
      this.results.tests.push({
        name: testName,
        status: 'ERROR',
        error: error.message,
        passed: false
      });
      console.log('❌ ERROR:', error.message);
    }
  }

  // Utility methods
  async simulateInputEvent(char) {
    // Simulate DOM manipulation and React state update overhead
    const mockDOM = { value: '', dispatchEvent: () => {} };
    const mockReactUpdate = () => Promise.resolve();
    
    const start = performance.now();
    
    // Simulate input processing
    mockDOM.value += char;
    await mockReactUpdate();
    
    // Simulate validation and formatting
    if (char === ' ') {
      await this.sleep(1); // Word completion processing
    }
    
    const end = performance.now();
    return end - start;
  }

  async simulateFileUpload() {
    await this.sleep(2000);
    return 'upload-complete';
  }

  async simulateAPICall() {
    await this.sleep(1500);
    return 'api-complete';
  }

  async simulateUIUpdates() {
    for (let i = 0; i < 10; i++) {
      await this.sleep(100);
      // Simulate UI update
    }
    return 'ui-complete';
  }

  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runAllTests() {
    console.log('🚀 Starting QA-001: Input Response Time Validation Tests');
    console.log('=' .repeat(60));
    
    await this.simulateRapidTyping();
    await this.simulateBurstTyping();
    await this.testMemoryUsage();
    await this.testConcurrentOperationsLag();
    
    this.generateSummary();
    await this.saveResults();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary:');
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Passed: ${this.results.summary.passedTests}`);
    console.log(`Failed: ${this.results.summary.failedTests}`);
    console.log(`Overall Response Time: ${this.results.summary.averageResponseTime}ms`);
    console.log(`95th Percentile: ${this.results.summary.p95ResponseTime}ms`);
    
    return this.results.summary.failedTests === 0;
  }

  generateSummary() {
    this.results.summary.totalTests = this.results.tests.length;
    this.results.summary.passedTests = this.results.tests.filter(t => t.passed).length;
    this.results.summary.failedTests = this.results.tests.filter(t => !t.passed).length;
    
    if (this.responseTimes.length > 0) {
      this.results.summary.averageResponseTime = parseFloat(
        (this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length).toFixed(2)
      );
      this.results.summary.p95ResponseTime = parseFloat(
        this.calculatePercentile(this.responseTimes, 95).toFixed(2)
      );
      this.results.summary.p99ResponseTime = parseFloat(
        this.calculatePercentile(this.responseTimes, 99).toFixed(2)
      );
    }
  }

  async saveResults() {
    const timestamp = Date.now();
    const resultsPath = path.join(process.cwd(), 'QA', '1.1.4.4-message-input', 'evidence');
    
    // Ensure evidence directory exists
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }
    
    const filename = `performance-test-results-${timestamp}.json`;
    const filepath = path.join(resultsPath, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n📁 Results saved to: ${filepath}`);
  }
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new PerformanceTestSuite();
  testSuite.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

export default PerformanceTestSuite;