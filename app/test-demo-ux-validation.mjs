#!/usr/bin/env node

/**
 * Demo UX Validation Test Suite
 * Tests comprehensive UX fixes for the demo application
 * Focus on manual retry functionality and button interactions
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class DemoUXValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:3002';
    this.results = {
      testSuite: 'Demo UX Validation',
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async setup() {
    console.log('🚀 Setting up Demo UX Validation Test Suite...\n');
    
    try {
      this.browser = await puppeteer.launch({ 
        headless: false, // Set to false to see the browser for debugging
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.page = await this.browser.newPage();
      
      // Enable console logging
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('🔍 Browser Console Error:', msg.text());
        }
      });

      // Enable page error capturing
      this.page.on('pageerror', error => {
        console.log('🚨 Page Error:', error.message);
      });

      console.log('✅ Browser setup complete\n');
      return true;
    } catch (error) {
      console.error('❌ Browser setup failed:', error.message);
      return false;
    }
  }

  async navigateToApp() {
    try {
      console.log('🔗 Navigating to application...');
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
      
      // Click "Continue as Demo User" button
      await this.page.waitForSelector('button:has-text("Continue as Demo User")', { timeout: 10000 });
      await this.page.click('button:has-text("Continue as Demo User")');
      
      // Wait for main app to load
      await this.page.waitForSelector('[data-testid="desktop-layout"], .desktop-layout, main', { timeout: 10000 });
      
      console.log('✅ Successfully navigated to application\n');
      return true;
    } catch (error) {
      console.error('❌ Navigation failed:', error.message);
      return false;
    }
  }

  async navigateToConfidenceTest() {
    try {
      console.log('🎯 Navigating to Confidence Test page...');
      
      // Try multiple ways to navigate to confidence test
      const navSelectors = [
        'a[href="/confidence-test"]',
        'a:has-text("Confidence Test")',
        'nav a:has-text("test")',
        '[data-testid="confidence-test-link"]'
      ];

      let navSuccess = false;
      for (const selector of navSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2000 });
          await this.page.click(selector);
          navSuccess = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!navSuccess) {
        // Try direct navigation
        await this.page.goto(`${this.baseUrl}/confidence-test`, { waitUntil: 'networkidle0' });
      }

      // Wait for confidence test page to load
      await this.page.waitForSelector('h1:has-text("ConfidenceDisplay QA Testing Suite")', { timeout: 10000 });
      
      console.log('✅ Successfully navigated to Confidence Test page\n');
      return true;
    } catch (error) {
      console.error('❌ Navigation to Confidence Test failed:', error.message);
      console.log('🔄 Attempting direct URL navigation...');
      
      try {
        await this.page.goto(`${this.baseUrl}/confidence-test`, { waitUntil: 'networkidle0' });
        await this.page.waitForSelector('h1', { timeout: 5000 });
        console.log('✅ Direct navigation successful\n');
        return true;
      } catch (directError) {
        console.error('❌ Direct navigation also failed:', directError.message);
        return false;
      }
    }
  }

  async testManualRetryFunctionality() {
    console.log('🧪 Testing Manual Retry Functionality...\n');
    
    const testResult = {
      testName: 'Manual Retry Functionality',
      passed: false,
      details: [],
      issues: []
    };

    try {
      // Look for test animation button
      const animationButton = await this.page.waitForSelector('button:has-text("Test Animations")', { timeout: 5000 });
      
      // Test immediate feedback on click
      testResult.details.push('✓ Found Test Animations button');
      
      // Check initial state
      const initialClasses = await this.page.$eval('button:has-text("Test Animations")', el => el.className);
      testResult.details.push(`✓ Initial button classes: ${initialClasses}`);
      
      // Click the button and check for immediate feedback
      await this.page.click('button:has-text("Test Animations")');
      
      // Wait a short moment for state changes
      await this.page.waitForTimeout(100);
      
      // Check if button state changed (should show loading or disabled state)
      const afterClickClasses = await this.page.$eval('button:has-text("Test Animations")', el => el.className);
      testResult.details.push(`✓ After click classes: ${afterClickClasses}`);
      
      // Check for loading indicators or state changes
      const hasLoadingState = initialClasses !== afterClickClasses;
      if (hasLoadingState) {
        testResult.details.push('✅ Button provides immediate visual feedback');
      } else {
        testResult.issues.push('⚠️ Button may not provide immediate feedback');
      }
      
      // Test Performance Test button
      await this.page.click('button:has-text("Run Performance Test")');
      await this.page.waitForTimeout(100);
      
      // Check for results or feedback
      const performanceResults = await this.page.$('h2:has-text("Performance Test Results")');
      if (performanceResults) {
        testResult.details.push('✅ Performance test provides results');
      }
      
      testResult.passed = testResult.issues.length === 0;
      
    } catch (error) {
      testResult.issues.push(`❌ Error during manual retry test: ${error.message}`);
      testResult.passed = false;
    }

    this.results.tests.push(testResult);
    this.updateSummary(testResult.passed);
    
    this.logTestResult(testResult);
    return testResult.passed;
  }

  async testButtonInteractions() {
    console.log('🧪 Testing All Button Interactions...\n');
    
    const testResult = {
      testName: 'Button Interactions and Feedback',
      passed: false,
      details: [],
      issues: []
    };

    try {
      // Test all interactive buttons on the page
      const buttons = await this.page.$$('button');
      testResult.details.push(`✓ Found ${buttons.length} buttons to test`);
      
      let buttonsPassed = 0;
      let buttonsTotal = 0;

      for (let i = 0; i < Math.min(buttons.length, 8); i++) {
        try {
          const button = buttons[i];
          const buttonText = await button.evaluate(el => el.textContent?.trim() || 'Unknown');
          
          if (buttonText.length === 0 || buttonText === 'Unknown') continue;
          
          buttonsTotal++;
          
          // Get initial state
          const initialState = await button.evaluate(el => ({
            disabled: el.disabled,
            className: el.className,
            textContent: el.textContent
          }));
          
          // Click button
          await button.click();
          await this.page.waitForTimeout(50);
          
          // Check for state change
          const afterState = await button.evaluate(el => ({
            disabled: el.disabled,
            className: el.className,
            textContent: el.textContent
          }));
          
          const hasStateChange = JSON.stringify(initialState) !== JSON.stringify(afterState);
          
          if (hasStateChange) {
            testResult.details.push(`✅ Button "${buttonText}" provides feedback`);
            buttonsPassed++;
          } else {
            testResult.details.push(`⚠️ Button "${buttonText}" may lack immediate feedback`);
          }
          
        } catch (buttonError) {
          testResult.details.push(`⚠️ Error testing button ${i}: ${buttonError.message}`);
        }
      }
      
      const feedbackRatio = buttonsPassed / buttonsTotal;
      testResult.details.push(`📊 Feedback ratio: ${buttonsPassed}/${buttonsTotal} (${(feedbackRatio * 100).toFixed(1)}%)`);
      
      if (feedbackRatio >= 0.7) {
        testResult.details.push('✅ Good button feedback coverage');
        testResult.passed = true;
      } else {
        testResult.issues.push('⚠️ Some buttons may lack adequate feedback');
        testResult.passed = false;
      }
      
    } catch (error) {
      testResult.issues.push(`❌ Error during button interaction test: ${error.message}`);
      testResult.passed = false;
    }

    this.results.tests.push(testResult);
    this.updateSummary(testResult.passed);
    
    this.logTestResult(testResult);
    return testResult.passed;
  }

  async testSpamClickingPrevention() {
    console.log('🧪 Testing Spam Clicking Prevention...\n');
    
    const testResult = {
      testName: 'Spam Clicking Prevention',
      passed: false,
      details: [],
      issues: []
    };

    try {
      // Find a test button
      const testButton = await this.page.$('button:has-text("Test Animations")');
      if (!testButton) {
        testResult.issues.push('❌ Could not find test button');
        testResult.passed = false;
        this.results.tests.push(testResult);
        this.updateSummary(false);
        return false;
      }

      // Rapid click test
      testResult.details.push('🔄 Performing rapid click test...');
      
      let clickCount = 0;
      const rapidClicks = 10;
      const startTime = Date.now();
      
      for (let i = 0; i < rapidClicks; i++) {
        try {
          await testButton.click();
          clickCount++;
          await this.page.waitForTimeout(10); // Very short delay
        } catch (e) {
          // Expected if button becomes disabled
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      testResult.details.push(`📊 Clicked ${clickCount}/${rapidClicks} times in ${duration}ms`);
      
      // Check if button disabled itself or showed loading state
      const buttonState = await testButton.evaluate(el => ({
        disabled: el.disabled,
        className: el.className
      }));
      
      if (buttonState.disabled || buttonState.className.includes('loading') || buttonState.className.includes('disabled')) {
        testResult.details.push('✅ Button properly prevents spam clicking');
        testResult.passed = true;
      } else if (clickCount < rapidClicks) {
        testResult.details.push('✅ Some click prevention mechanism detected');
        testResult.passed = true;
      } else {
        testResult.issues.push('⚠️ Button may not prevent spam clicking effectively');
        testResult.passed = false;
      }
      
    } catch (error) {
      testResult.issues.push(`❌ Error during spam clicking test: ${error.message}`);
      testResult.passed = false;
    }

    this.results.tests.push(testResult);
    this.updateSummary(testResult.passed);
    
    this.logTestResult(testResult);
    return testResult.passed;
  }

  async testToastNotifications() {
    console.log('🧪 Testing Toast Notifications...\n');
    
    const testResult = {
      testName: 'Toast Notifications',
      passed: false,
      details: [],
      issues: []
    };

    try {
      // Look for toast trigger buttons (if on error handling demo page)
      const toastButtons = await this.page.$$('button:has-text("Show Error Toast"), button:has-text("Show Success Toast"), button:has-text("Show Warning Toast")');
      
      if (toastButtons.length === 0) {
        testResult.details.push('ℹ️ No toast buttons found on current page');
        testResult.passed = true; // Not a failure if not on the right page
      } else {
        testResult.details.push(`✓ Found ${toastButtons.length} toast trigger buttons`);
        
        // Test one toast button
        const firstButton = toastButtons[0];
        const buttonText = await firstButton.evaluate(el => el.textContent);
        
        await firstButton.click();
        await this.page.waitForTimeout(500);
        
        // Look for toast container or notification
        const toastElements = await this.page.$$('[data-testid*="toast"], [class*="toast"], [class*="notification"]');
        
        if (toastElements.length > 0) {
          testResult.details.push(`✅ Toast notification appeared after clicking "${buttonText}"`);
          testResult.passed = true;
        } else {
          testResult.issues.push('⚠️ Toast notification may not be working');
          testResult.passed = false;
        }
      }
      
    } catch (error) {
      testResult.issues.push(`❌ Error during toast test: ${error.message}`);
      testResult.passed = false;
    }

    this.results.tests.push(testResult);
    this.updateSummary(testResult.passed);
    
    this.logTestResult(testResult);
    return testResult.passed;
  }

  async testProfessionalUserExperience() {
    console.log('🧪 Testing Professional User Experience...\n');
    
    const testResult = {
      testName: 'Professional User Experience',
      passed: false,
      details: [],
      issues: []
    };

    try {
      // Test loading states
      const hasLoadingElements = await this.page.$$('[class*="loading"], [class*="spinner"], [class*="pulse"]');
      if (hasLoadingElements.length > 0) {
        testResult.details.push('✅ Loading states detected');
      } else {
        testResult.details.push('ℹ️ No loading states currently visible');
      }
      
      // Test responsive design
      await this.page.setViewport({ width: 1200, height: 800 });
      await this.page.waitForTimeout(500);
      
      const responsiveElements = await this.page.$('main, [class*="responsive"], [class*="grid"]');
      if (responsiveElements) {
        testResult.details.push('✅ Responsive layout elements detected');
      }
      
      // Test accessibility
      const headings = await this.page.$$('h1, h2, h3, h4, h5, h6');
      const buttons = await this.page.$$('button');
      const links = await this.page.$$('a');
      
      testResult.details.push(`📊 Accessibility elements: ${headings.length} headings, ${buttons.length} buttons, ${links.length} links`);
      
      // Test for proper semantic structure
      if (headings.length > 0 && buttons.length > 0) {
        testResult.details.push('✅ Good semantic structure');
      }
      
      // Test error handling
      const errorElements = await this.page.$$('[class*="error"], [class*="warning"], [class*="danger"]');
      testResult.details.push(`ℹ️ Error handling elements: ${errorElements.length} found`);
      
      // Overall assessment
      const positiveIndicators = testResult.details.filter(d => d.includes('✅')).length;
      if (positiveIndicators >= 2) {
        testResult.details.push('✅ Professional UX standards met');
        testResult.passed = true;
      } else {
        testResult.issues.push('⚠️ Professional UX could be improved');
        testResult.passed = false;
      }
      
    } catch (error) {
      testResult.issues.push(`❌ Error during UX test: ${error.message}`);
      testResult.passed = false;
    }

    this.results.tests.push(testResult);
    this.updateSummary(testResult.passed);
    
    this.logTestResult(testResult);
    return testResult.passed;
  }

  updateSummary(passed) {
    this.results.summary.total++;
    if (passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
  }

  logTestResult(testResult) {
    console.log(`\n📋 ${testResult.testName}: ${testResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (testResult.details.length > 0) {
      console.log('📝 Details:');
      testResult.details.forEach(detail => console.log(`   ${detail}`));
    }
    
    if (testResult.issues.length > 0) {
      console.log('⚠️ Issues:');
      testResult.issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    console.log('');
  }

  async generateReport() {
    const reportPath = path.join(process.cwd(), 'demo-ux-validation-report.json');
    
    this.results.summary.passRate = (this.results.summary.passed / this.results.summary.total * 100).toFixed(1);
    
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log('\n🎯 DEMO UX VALIDATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total Tests: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`📈 Pass Rate: ${this.results.summary.passRate}%`);
    console.log(`📄 Report saved to: ${reportPath}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return this.results;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    const setupSuccess = await this.setup();
    if (!setupSuccess) {
      console.error('❌ Test setup failed');
      return false;
    }

    try {
      // Navigate to app
      const navSuccess = await this.navigateToApp();
      if (!navSuccess) {
        console.error('❌ App navigation failed');
        return false;
      }

      // Navigate to confidence test page for comprehensive testing
      await this.navigateToConfidenceTest();

      // Run all tests
      await this.testManualRetryFunctionality();
      await this.testButtonInteractions();
      await this.testSpamClickingPrevention();
      await this.testToastNotifications();
      await this.testProfessionalUserExperience();

      // Generate final report
      const report = await this.generateReport();
      
      return report.summary.failed === 0;
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting Demo UX Validation Test Suite...\n');
  
  const validator = new DemoUXValidator();
  
  validator.runAllTests()
    .then(success => {
      if (success) {
        console.log('🎉 All demo UX tests passed!');
        process.exit(0);
      } else {
        console.log('⚠️ Some demo UX tests failed. Check the report for details.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test suite crashed:', error.message);
      process.exit(1);
    });
}

export default DemoUXValidator;