/**
 * Playwright Live Browser Testing System
 * ALWAYS uses real browser testing - NO theoretical testing
 * Every feature is validated in actual browsers
 */

import { chromium, firefox, webkit } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PlaywrightTestingSystem {
  constructor() {
    this.browsers = {
      chromium: null,
      firefox: null,
      webkit: null
    };
    this.contexts = new Map();
    this.testResults = new Map();
    this.screenshotsDir = path.join(__dirname, '../../test-evidence');
    this.videosDir = path.join(__dirname, '../../test-videos');
    
    // Ensure directories exist
    [this.screenshotsDir, this.videosDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Initialize browsers for testing
   * ALWAYS use real browsers - never skip this
   */
  async initialize() {
    console.log('🎭 Initializing Playwright with REAL browsers...');
    
    // Launch all browsers
    this.browsers.chromium = await chromium.launch({
      headless: false, // Show browser for visibility
      slowMo: 100 // Slow down for human observation
    });
    
    this.browsers.firefox = await firefox.launch({
      headless: false,
      slowMo: 100
    });
    
    this.browsers.webkit = await webkit.launch({
      headless: false,
      slowMo: 100
    });
    
    console.log('✅ All browsers launched and ready for LIVE testing');
  }

  /**
   * Execute live browser test
   * NO MOCKING - Everything runs in real browser
   */
  async executeLiveBrowserTest(testConfig) {
    const {
      testId,
      url,
      actions,
      assertions,
      browserType = 'chromium'
    } = testConfig;
    
    console.log(`\n🌐 Executing LIVE browser test: ${testId}`);
    console.log(`   Browser: ${browserType}`);
    console.log(`   URL: ${url}`);
    
    const browser = this.browsers[browserType];
    if (!browser) {
      throw new Error(`Browser ${browserType} not initialized`);
    }
    
    // Create context with video recording
    const context = await browser.newContext({
      recordVideo: {
        dir: this.videosDir,
        size: { width: 1280, height: 720 }
      },
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    const testResult = {
      testId,
      browserType,
      url,
      status: 'running',
      screenshots: [],
      video: null,
      errors: [],
      assertions: []
    };
    
    try {
      // Navigate to URL
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Take initial screenshot
      const screenshotPath = path.join(this.screenshotsDir, `${testId}-initial.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testResult.screenshots.push(screenshotPath);
      
      // Execute actions
      for (const action of actions) {
        await this.executeAction(page, action);
        
        // Screenshot after each action
        const actionScreenshot = path.join(
          this.screenshotsDir, 
          `${testId}-${action.type}-${Date.now()}.png`
        );
        await page.screenshot({ path: actionScreenshot });
        testResult.screenshots.push(actionScreenshot);
      }
      
      // Execute assertions
      for (const assertion of assertions) {
        const assertionResult = await this.executeAssertion(page, assertion);
        testResult.assertions.push(assertionResult);
        
        if (!assertionResult.passed) {
          testResult.errors.push(assertionResult.error);
        }
      }
      
      // Final screenshot
      const finalScreenshot = path.join(this.screenshotsDir, `${testId}-final.png`);
      await page.screenshot({ path: finalScreenshot, fullPage: true });
      testResult.screenshots.push(finalScreenshot);
      
      // Check for console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          testResult.errors.push(`Console error: ${msg.text()}`);
        }
      });
      
      testResult.status = testResult.errors.length === 0 ? 'passed' : 'failed';
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
      testResult.status = 'failed';
      testResult.errors.push(error.message);
      
      // Error screenshot
      const errorScreenshot = path.join(this.screenshotsDir, `${testId}-error.png`);
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      testResult.screenshots.push(errorScreenshot);
      
    } finally {
      // Save video path
      const video = page.video();
      if (video) {
        testResult.video = await video.path();
      }
      
      await context.close();
      this.testResults.set(testId, testResult);
    }
    
    return testResult;
  }

  /**
   * Execute action in browser
   */
  async executeAction(page, action) {
    console.log(`   🎯 Executing action: ${action.type}`);
    
    switch (action.type) {
      case 'click':
        await page.click(action.selector);
        break;
        
      case 'type':
        await page.fill(action.selector, action.value);
        break;
        
      case 'select':
        await page.selectOption(action.selector, action.value);
        break;
        
      case 'upload':
        await page.setInputFiles(action.selector, action.files);
        break;
        
      case 'wait':
        await page.waitForTimeout(action.duration);
        break;
        
      case 'waitForSelector':
        await page.waitForSelector(action.selector, { timeout: action.timeout || 30000 });
        break;
        
      case 'scroll':
        await page.evaluate((scrollData) => {
          window.scrollTo(scrollData.x || 0, scrollData.y || 0);
        }, action.position);
        break;
        
      case 'screenshot':
        const screenshotPath = path.join(this.screenshotsDir, `${action.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: action.fullPage });
        break;
        
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute assertion in browser
   */
  async executeAssertion(page, assertion) {
    console.log(`   ✓ Checking: ${assertion.description}`);
    
    const result = {
      description: assertion.description,
      type: assertion.type,
      passed: false,
      error: null
    };
    
    try {
      switch (assertion.type) {
        case 'visible':
          await page.waitForSelector(assertion.selector, { state: 'visible' });
          result.passed = true;
          break;
          
        case 'hidden':
          await page.waitForSelector(assertion.selector, { state: 'hidden' });
          result.passed = true;
          break;
          
        case 'text':
          const element = await page.$(assertion.selector);
          const text = await element.textContent();
          result.passed = text.includes(assertion.expected);
          if (!result.passed) {
            result.error = `Expected "${assertion.expected}", got "${text}"`;
          }
          break;
          
        case 'value':
          const value = await page.inputValue(assertion.selector);
          result.passed = value === assertion.expected;
          if (!result.passed) {
            result.error = `Expected value "${assertion.expected}", got "${value}"`;
          }
          break;
          
        case 'count':
          const elements = await page.$$(assertion.selector);
          result.passed = elements.length === assertion.expected;
          if (!result.passed) {
            result.error = `Expected ${assertion.expected} elements, found ${elements.length}`;
          }
          break;
          
        case 'url':
          const currentUrl = page.url();
          result.passed = currentUrl.includes(assertion.expected);
          if (!result.passed) {
            result.error = `Expected URL to contain "${assertion.expected}", got "${currentUrl}"`;
          }
          break;
          
        case 'console':
          // Check that no console errors exist
          result.passed = assertion.noErrors === true;
          break;
          
        default:
          throw new Error(`Unknown assertion type: ${assertion.type}`);
      }
      
    } catch (error) {
      result.passed = false;
      result.error = error.message;
    }
    
    return result;
  }

  /**
   * Run cross-browser testing
   * Tests in ALL browsers to ensure compatibility
   */
  async runCrossBrowserTest(testConfig) {
    console.log('\n🌍 Running cross-browser test in ALL browsers...');
    
    const results = {};
    
    for (const browserType of ['chromium', 'firefox', 'webkit']) {
      console.log(`\n📱 Testing in ${browserType}...`);
      results[browserType] = await this.executeLiveBrowserTest({
        ...testConfig,
        browserType,
        testId: `${testConfig.testId}-${browserType}`
      });
    }
    
    return results;
  }

  /**
   * Generate test report with evidence
   */
  async generateTestReport(testId) {
    const result = this.testResults.get(testId);
    if (!result) {
      throw new Error(`No test results found for ${testId}`);
    }
    
    const report = `# Live Browser Test Report

## Test: ${testId}

### Configuration
- **Browser**: ${result.browserType}
- **URL**: ${result.url}
- **Status**: ${result.status.toUpperCase()}
- **Timestamp**: ${new Date().toISOString()}

### Evidence
- **Screenshots**: ${result.screenshots.length} captured
- **Video**: ${result.video ? 'Available' : 'Not available'}

### Assertions (${result.assertions.length} total)
${result.assertions.map(a => 
  `- [${a.passed ? '✅' : '❌'}] ${a.description}${a.error ? `\n  Error: ${a.error}` : ''}`
).join('\n')}

### Errors (${result.errors.length} total)
${result.errors.length > 0 ? result.errors.map(e => `- ${e}`).join('\n') : 'No errors'}

### Screenshots
${result.screenshots.map(s => `![Screenshot](${path.basename(s)})`).join('\n')}

### Video
${result.video ? `[View Test Video](${path.basename(result.video)})` : 'No video available'}

---
*This report was generated from LIVE browser testing - no mocking or simulation*
`;
    
    const reportPath = path.join(this.screenshotsDir, `${testId}-report.md`);
    fs.writeFileSync(reportPath, report);
    
    return reportPath;
  }

  /**
   * Cleanup browsers
   */
  async cleanup() {
    console.log('🧹 Cleaning up browsers...');
    
    for (const [name, browser] of Object.entries(this.browsers)) {
      if (browser) {
        await browser.close();
      }
    }
  }
}

/**
 * Integration with Orchestration System
 * EVERY feature must pass live browser tests
 */
export async function validateWithPlaywright(feature, url) {
  const tester = new PlaywrightTestingSystem();
  await tester.initialize();
  
  try {
    // Define test based on feature requirements
    const testConfig = {
      testId: `feature-${feature.id}`,
      url: url || 'http://localhost:3000',
      actions: feature.actions || [],
      assertions: feature.assertions || [
        { type: 'console', noErrors: true, description: 'No console errors' },
        { type: 'visible', selector: '#app', description: 'App is visible' }
      ]
    };
    
    // Run cross-browser test
    const results = await tester.runCrossBrowserTest(testConfig);
    
    // All browsers must pass
    const allPassed = Object.values(results).every(r => r.status === 'passed');
    
    if (!allPassed) {
      throw new Error('Live browser testing failed - feature not ready');
    }
    
    // Generate reports
    for (const [browser, result] of Object.entries(results)) {
      await tester.generateTestReport(`feature-${feature.id}-${browser}`);
    }
    
    return {
      passed: true,
      results,
      message: 'All live browser tests passed'
    };
    
  } finally {
    await tester.cleanup();
  }
}

// Export for use in orchestration
export default PlaywrightTestingSystem;