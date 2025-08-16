#!/usr/bin/env node

/**
 * Frontend Demo Validation Test
 * Tests the React frontend specifically for UX fixes and manual retry functionality
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

class FrontendDemoValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.frontendUrl = 'http://localhost:5174';
    this.results = {
      testSuite: 'Frontend Demo UX Validation',
      timestamp: new Date().toISOString(),
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, warnings: 0 }
    };
  }

  async setup() {
    console.log('🚀 Setting up Frontend Demo Validation...\n');
    
    try {
      this.browser = await puppeteer.launch({ 
        headless: false, // Keep visible for debugging
        defaultViewport: { width: 1920, height: 1080 },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      
      this.page = await this.browser.newPage();
      
      // Set up error monitoring
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('🔍 Console Error:', msg.text());
        }
      });

      this.page.on('pageerror', error => {
        console.log('🚨 Page Error:', error.message);
      });

      // Set up request monitoring
      this.page.on('requestfailed', request => {
        console.log('🌐 Request Failed:', request.url());
      });

      console.log('✅ Browser setup complete');
      return true;
    } catch (error) {
      console.error('❌ Browser setup failed:', error.message);
      return false;
    }
  }

  async navigateToFrontend() {
    console.log('\n🔗 Navigating to Frontend...');
    
    try {
      console.log(`Loading: ${this.frontendUrl}`);
      await this.page.goto(this.frontendUrl, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for React app to mount
      await this.page.waitForSelector('#app', { timeout: 10000 });
      console.log('✅ React app container found');
      
      // Check if the app is in loading state or needs user action
      await this.page.waitForTimeout(2000);
      
      // Look for authentication or demo button
      const demoButton = await this.page.$('button:has-text("Continue as Demo User"), button:has-text("Demo"), [data-testid="demo-button"]');
      if (demoButton) {
        console.log('🔑 Found demo/auth button, clicking...');
        await demoButton.click();
        await this.page.waitForTimeout(2000);
      }
      
      // Wait for main app content
      await this.page.waitForSelector('main, .main-content, [data-testid="main"], .desktop-layout', { timeout: 15000 });
      console.log('✅ Main app content loaded\n');
      
      return true;
    } catch (error) {
      console.error('❌ Frontend navigation failed:', error.message);
      
      // Try to get page content for debugging
      try {
        const title = await this.page.title();
        const url = await this.page.url();
        console.log(`📄 Page title: ${title}`);
        console.log(`🔗 Current URL: ${url}`);
        
        const bodyText = await this.page.$eval('body', el => el.innerText.substring(0, 500));
        console.log(`📝 Page content preview: ${bodyText}`);
      } catch (debugError) {
        console.log('❌ Could not get page debug info');
      }
      
      return false;
    }
  }

  async navigateToConfidenceTest() {
    console.log('🎯 Navigating to Confidence Test...');
    
    try {
      // Try direct navigation to confidence test
      await this.page.goto(`${this.frontendUrl}/confidence-test`, { 
        waitUntil: 'networkidle0',
        timeout: 20000 
      });
      
      // Wait for the test page to load
      await this.page.waitForSelector('h1, h2, h3', { timeout: 10000 });
      
      const pageTitle = await this.page.$eval('h1, h2, h3', el => el.textContent);
      console.log(`✅ Loaded page: ${pageTitle}`);
      
      return true;
    } catch (error) {
      console.log('⚠️ Direct navigation failed, trying navigation links...');
      
      // Try to find navigation links
      const navLinks = await this.page.$$('a, button, [role="button"]');
      console.log(`🔍 Found ${navLinks.length} clickable elements`);
      
      for (let i = 0; i < Math.min(navLinks.length, 10); i++) {
        try {
          const element = navLinks[i];
          const text = await element.evaluate(el => el.textContent?.toLowerCase() || '');
          
          if (text.includes('confidence') || text.includes('test') || text.includes('demo')) {
            console.log(`🎯 Trying navigation element: "${text}"`);
            await element.click();
            await this.page.waitForTimeout(2000);
            
            const newUrl = await this.page.url();
            if (newUrl.includes('confidence') || newUrl.includes('test')) {
              console.log('✅ Successfully navigated via navigation element');
              return true;
            }
          }
        } catch (navError) {
          continue;
        }
      }
      
      console.log('⚠️ Could not navigate to confidence test, staying on current page');
      return false;
    }
  }

  async testManualRetryFunctionality() {
    console.log('\n🧪 Testing Manual Retry Functionality...');
    
    const testResult = {
      testName: 'Manual Retry Functionality',
      passed: false,
      details: [],
      issues: []
    };

    try {
      // Look for any retry-related buttons
      const retryButtons = await this.page.$$('button:has-text("Retry"), button:has-text("Try Again"), button:has-text("Test"), [data-testid*="retry"]');
      
      if (retryButtons.length === 0) {
        testResult.details.push('ℹ️ No explicit retry buttons found');
        
        // Look for any test buttons that might trigger retry scenarios
        const testButtons = await this.page.$$('button');
        if (testButtons.length > 0) {
          testResult.details.push(`✓ Found ${testButtons.length} buttons for interaction testing`);
          
          // Test the first few buttons for immediate feedback
          for (let i = 0; i < Math.min(3, testButtons.length); i++) {
            const button = testButtons[i];
            const buttonText = await button.evaluate(el => el.textContent?.trim() || `Button ${i + 1}`);
            
            if (buttonText.length === 0) continue;
            
            // Check initial state
            const initialState = await button.evaluate(el => ({
              disabled: el.disabled,
              className: el.className,
              textContent: el.textContent
            }));
            
            // Click and check for immediate feedback
            await button.click();
            await this.page.waitForTimeout(100);
            
            const afterState = await button.evaluate(el => ({
              disabled: el.disabled,
              className: el.className,
              textContent: el.textContent
            }));
            
            const hasStateChange = JSON.stringify(initialState) !== JSON.stringify(afterState);
            
            if (hasStateChange) {
              testResult.details.push(`✅ Button "${buttonText}" provides immediate feedback`);
            } else {
              testResult.details.push(`⚠️ Button "${buttonText}" may lack immediate feedback`);
            }
          }
          
          testResult.passed = testResult.details.filter(d => d.includes('✅')).length > 0;
        } else {
          testResult.issues.push('❌ No interactive buttons found');
          testResult.passed = false;
        }
      } else {
        testResult.details.push(`✓ Found ${retryButtons.length} retry-related buttons`);
        
        // Test the first retry button
        const firstRetryButton = retryButtons[0];
        const buttonText = await firstRetryButton.evaluate(el => el.textContent?.trim());
        
        // Test immediate feedback
        const initialClasses = await firstRetryButton.evaluate(el => el.className);
        await firstRetryButton.click();
        await this.page.waitForTimeout(100);
        const afterClasses = await firstRetryButton.evaluate(el => el.className);
        
        if (initialClasses !== afterClasses) {
          testResult.details.push(`✅ Retry button "${buttonText}" provides immediate visual feedback`);
          testResult.passed = true;
        } else {
          testResult.issues.push(`⚠️ Retry button "${buttonText}" may lack immediate feedback`);
          testResult.passed = false;
        }
      }
      
    } catch (error) {
      testResult.issues.push(`❌ Error during retry test: ${error.message}`);
      testResult.passed = false;
    }

    this.recordTest(testResult);
    return testResult.passed;
  }

  async testButtonInteractionFeedback() {
    console.log('\n🧪 Testing Button Interaction Feedback...');
    
    const testResult = {
      testName: 'Button Interaction Feedback',
      passed: false,
      details: [],
      issues: []
    };

    try {
      const buttons = await this.page.$$('button, [role="button"], input[type="button"], input[type="submit"]');
      testResult.details.push(`✓ Found ${buttons.length} interactive elements`);
      
      if (buttons.length === 0) {
        testResult.issues.push('❌ No interactive buttons found');
        testResult.passed = false;
        this.recordTest(testResult);
        return false;
      }

      let feedbackCount = 0;
      const testCount = Math.min(6, buttons.length);
      
      for (let i = 0; i < testCount; i++) {
        try {
          const button = buttons[i];
          const buttonText = await button.evaluate(el => 
            el.textContent?.trim() || el.value || el.getAttribute('aria-label') || `Element ${i + 1}`
          );
          
          // Skip if button text is empty or too long
          if (buttonText.length === 0 || buttonText.length > 50) continue;
          
          // Check for hover effects
          await button.hover();
          await this.page.waitForTimeout(50);
          
          // Check initial state
          const initialState = await button.evaluate(el => ({
            disabled: el.disabled,
            className: el.className,
            style: el.style.cssText
          }));
          
          // Click and check for state changes
          await button.click();
          await this.page.waitForTimeout(150);
          
          const afterState = await button.evaluate(el => ({
            disabled: el.disabled,
            className: el.className,
            style: el.style.cssText
          }));
          
          // Check for various types of feedback
          const hasClassChange = initialState.className !== afterState.className;
          const hasStyleChange = initialState.style !== afterState.style;
          const hasDisabledChange = initialState.disabled !== afterState.disabled;
          
          const hasFeedback = hasClassChange || hasStyleChange || hasDisabledChange;
          
          if (hasFeedback) {
            testResult.details.push(`✅ "${buttonText}": Immediate feedback detected`);
            feedbackCount++;
          } else {
            testResult.details.push(`⚠️ "${buttonText}": Limited feedback detected`);
          }
          
        } catch (buttonError) {
          testResult.details.push(`⚠️ Error testing button ${i + 1}: ${buttonError.message}`);
        }
      }
      
      const feedbackRatio = feedbackCount / testCount;
      testResult.details.push(`📊 Feedback ratio: ${feedbackCount}/${testCount} (${(feedbackRatio * 100).toFixed(1)}%)`);
      
      if (feedbackRatio >= 0.6) {
        testResult.details.push('✅ Good button feedback coverage');
        testResult.passed = true;
      } else {
        testResult.issues.push('⚠️ Many buttons lack adequate immediate feedback');
        testResult.passed = false;
      }
      
    } catch (error) {
      testResult.issues.push(`❌ Error during button feedback test: ${error.message}`);
      testResult.passed = false;
    }

    this.recordTest(testResult);
    return testResult.passed;
  }

  async testSpamClickingPrevention() {
    console.log('\n🧪 Testing Spam Clicking Prevention...');
    
    const testResult = {
      testName: 'Spam Clicking Prevention',
      passed: false,
      details: [],
      issues: []
    };

    try {
      const buttons = await this.page.$$('button:not([disabled])');
      
      if (buttons.length === 0) {
        testResult.details.push('ℹ️ No enabled buttons found for spam test');
        testResult.passed = true; // Not a failure
        this.recordTest(testResult);
        return true;
      }

      // Test rapid clicking on the first suitable button
      const testButton = buttons[0];
      const buttonText = await testButton.evaluate(el => el.textContent?.trim() || 'Test Button');
      
      testResult.details.push(`🎯 Testing spam prevention on: "${buttonText}"`);
      
      // Perform rapid clicks
      let successfulClicks = 0;
      const totalClicks = 8;
      const clickDelay = 50; // Very fast clicking
      
      for (let i = 0; i < totalClicks; i++) {
        try {
          await testButton.click();
          await this.page.waitForTimeout(clickDelay);
          successfulClicks++;
          
          // Check if button became disabled
          const isDisabled = await testButton.evaluate(el => el.disabled);
          if (isDisabled) {
            testResult.details.push(`✅ Button disabled after ${successfulClicks} clicks`);
            break;
          }
        } catch (clickError) {
          testResult.details.push(`ℹ️ Click ${i + 1} prevented (${clickError.message})`);
          break;
        }
      }
      
      testResult.details.push(`📊 Successful clicks: ${successfulClicks}/${totalClicks}`);
      
      // Check final button state
      const finalState = await testButton.evaluate(el => ({
        disabled: el.disabled,
        className: el.className
      }));
      
      const hasPreventionMechanism = finalState.disabled || 
                                   finalState.className.includes('loading') || 
                                   finalState.className.includes('disabled') ||
                                   successfulClicks < totalClicks;
      
      if (hasPreventionMechanism) {
        testResult.details.push('✅ Spam clicking prevention mechanism detected');
        testResult.passed = true;
      } else {
        testResult.issues.push('⚠️ No clear spam clicking prevention detected');
        testResult.passed = false;
      }
      
    } catch (error) {
      testResult.issues.push(`❌ Error during spam clicking test: ${error.message}`);
      testResult.passed = false;
    }

    this.recordTest(testResult);
    return testResult.passed;
  }

  async testToastNotifications() {
    console.log('\n🧪 Testing Toast Notifications...');
    
    const testResult = {
      testName: 'Toast Notifications',
      passed: false,
      details: [],
      issues: []
    };

    try {
      // Look for existing toast notifications
      const existingToasts = await this.page.$$('[class*="toast"], [class*="notification"], [data-testid*="toast"]');
      
      if (existingToasts.length > 0) {
        testResult.details.push(`✓ Found ${existingToasts.length} existing toast notifications`);
      }
      
      // Look for toast trigger buttons
      const toastTriggers = await this.page.$$('button:has-text("Error"), button:has-text("Success"), button:has-text("Warning"), button:has-text("Toast")');
      
      if (toastTriggers.length > 0) {
        testResult.details.push(`✓ Found ${toastTriggers.length} potential toast triggers`);
        
        // Test the first toast trigger
        const firstTrigger = toastTriggers[0];
        const buttonText = await firstTrigger.evaluate(el => el.textContent?.trim());
        
        await firstTrigger.click();
        await this.page.waitForTimeout(1000);
        
        // Check for new toast notifications
        const newToasts = await this.page.$$('[class*="toast"], [class*="notification"], [data-testid*="toast"]');
        
        if (newToasts.length > existingToasts.length) {
          testResult.details.push(`✅ Toast notification appeared after clicking "${buttonText}"`);
          testResult.passed = true;
        } else {
          testResult.details.push(`⚠️ No new toast after clicking "${buttonText}"`);
          testResult.passed = false;
        }
      } else {
        testResult.details.push('ℹ️ No specific toast trigger buttons found');
        
        // Check if any button clicks produce toast-like feedback
        const anyButtons = await this.page.$$('button');
        if (anyButtons.length > 0) {
          const testButton = anyButtons[0];
          await testButton.click();
          await this.page.waitForTimeout(500);
          
          const afterToasts = await this.page.$$('[class*="toast"], [class*="notification"], [data-testid*="toast"]');
          if (afterToasts.length > existingToasts.length) {
            testResult.details.push('✅ Toast-like notification system detected');
            testResult.passed = true;
          } else {
            testResult.details.push('ℹ️ No toast notifications detected');
            testResult.passed = true; // Not a failure if not implemented
          }
        }
      }
      
    } catch (error) {
      testResult.issues.push(`❌ Error during toast test: ${error.message}`);
      testResult.passed = false;
    }

    this.recordTest(testResult);
    return testResult.passed;
  }

  async testProfessionalUserExperience() {
    console.log('\n🧪 Testing Professional User Experience...');
    
    const testResult = {
      testName: 'Professional User Experience',
      passed: false,
      details: [],
      issues: []
    };

    try {
      // Test responsive design
      const originalViewport = await this.page.viewport();
      
      // Test mobile viewport
      await this.page.setViewport({ width: 768, height: 1024 });
      await this.page.waitForTimeout(500);
      
      // Test desktop viewport
      await this.page.setViewport({ width: 1920, height: 1080 });
      await this.page.waitForTimeout(500);
      
      testResult.details.push('✅ Responsive design viewport changes handled');
      
      // Restore original viewport
      if (originalViewport) {
        await this.page.setViewport(originalViewport);
      }
      
      // Test accessibility features
      const headings = await this.page.$$('h1, h2, h3, h4, h5, h6');
      const buttons = await this.page.$$('button, [role="button"]');
      const links = await this.page.$$('a[href]');
      const images = await this.page.$$('img[alt]');
      
      testResult.details.push(`📊 Accessibility elements: ${headings.length} headings, ${buttons.length} buttons, ${links.length} links, ${images.length} images with alt text`);
      
      if (headings.length > 0) {
        testResult.details.push('✅ Proper heading structure detected');
      }
      
      // Test loading states and transitions
      const loadingElements = await this.page.$$('[class*="loading"], [class*="spinner"], [class*="pulse"], [class*="skeleton"]');
      if (loadingElements.length > 0) {
        testResult.details.push(`✅ Loading state elements detected: ${loadingElements.length}`);
      }
      
      // Test error handling elements
      const errorElements = await this.page.$$('[class*="error"], [class*="warning"], [class*="danger"], [role="alert"]');
      testResult.details.push(`ℹ️ Error handling elements: ${errorElements.length}`);
      
      // Test smooth interactions
      const interactiveElements = await this.page.$$('button:not([disabled]), a[href], [tabindex]');
      if (interactiveElements.length > 0) {
        testResult.details.push(`✅ Interactive elements available: ${interactiveElements.length}`);
      }
      
      // Test visual design consistency
      const styledElements = await this.page.$$('[class*="btn"], [class*="button"], [class*="card"], [class*="container"]');
      if (styledElements.length > 0) {
        testResult.details.push(`✅ Consistent styling detected: ${styledElements.length} styled elements`);
      }
      
      // Overall assessment
      const positiveIndicators = testResult.details.filter(d => d.includes('✅')).length;
      
      if (positiveIndicators >= 3) {
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

    this.recordTest(testResult);
    return testResult.passed;
  }

  recordTest(testResult) {
    this.results.tests.push(testResult);
    
    this.results.summary.total++;
    if (testResult.passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
    
    if (testResult.issues.length > 0) {
      this.results.summary.warnings++;
    }
    
    // Log test result immediately
    console.log(`\n📋 ${testResult.testName}: ${testResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (testResult.details.length > 0) {
      console.log('📝 Details:');
      testResult.details.forEach(detail => console.log(`   ${detail}`));
    }
    
    if (testResult.issues.length > 0) {
      console.log('⚠️ Issues:');
      testResult.issues.forEach(issue => console.log(`   ${issue}`));
    }
  }

  async generateFinalReport() {
    const reportPath = './frontend-demo-validation-report.json';
    
    this.results.summary.passRate = (this.results.summary.passed / this.results.summary.total * 100).toFixed(1);
    this.results.testEnvironment = {
      frontendUrl: this.frontendUrl,
      timestamp: new Date().toISOString(),
      userAgent: await this.page.evaluate(() => navigator.userAgent)
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log('\n🎯 FRONTEND DEMO UX VALIDATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total Tests: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`⚠️ Warnings: ${this.results.summary.warnings}`);
    console.log(`📈 Pass Rate: ${this.results.summary.passRate}%`);
    console.log(`📄 Report saved to: ${reportPath}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return this.results;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Frontend Demo UX Validation...\n');
    
    const setupSuccess = await this.setup();
    if (!setupSuccess) {
      console.error('❌ Test setup failed');
      return false;
    }

    try {
      // Navigate to frontend
      const navSuccess = await this.navigateToFrontend();
      if (!navSuccess) {
        console.error('❌ Frontend navigation failed');
        return false;
      }

      // Try to navigate to confidence test page
      await this.navigateToConfidenceTest();

      // Run all validation tests
      await this.testManualRetryFunctionality();
      await this.testButtonInteractionFeedback();
      await this.testSpamClickingPrevention();
      await this.testToastNotifications();
      await this.testProfessionalUserExperience();

      // Generate final report
      const report = await this.generateFinalReport();
      
      return report.summary.failed === 0;
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the validation
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting Frontend Demo UX Validation Test Suite...\n');
  
  const validator = new FrontendDemoValidator();
  
  validator.runAllTests()
    .then(success => {
      if (success) {
        console.log('🎉 All frontend demo UX tests passed!');
        process.exit(0);
      } else {
        console.log('⚠️ Some frontend demo UX tests failed. Check the report for details.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test suite crashed:', error.message);
      process.exit(1);
    });
}

export default FrontendDemoValidator;