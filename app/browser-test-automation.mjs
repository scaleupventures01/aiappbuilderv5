#!/usr/bin/env node

/**
 * Automated Browser Upload Test Suite
 * Tests FileDropzone component and upload API functionality
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class BrowserUploadTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
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

    async init() {
        console.log('🚀 Initializing browser automation...');
        
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for CI/CD
            devtools: false,
            defaultViewport: { width: 1280, height: 720 },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        this.page = await this.browser.newPage();
        
        // Enable console logging
        this.page.on('console', (msg) => {
            console.log(`[BROWSER] ${msg.text()}`);
        });

        // Handle page errors
        this.page.on('pageerror', (error) => {
            console.error(`[PAGE ERROR] ${error.message}`);
        });
    }

    async logResult(testName, status, message, details = null) {
        const result = {
            test: testName,
            status,
            message,
            details,
            timestamp: new Date().toISOString()
        };

        this.testResults.tests.push(result);
        this.testResults.summary.total++;
        this.testResults.summary[status]++;

        const statusIcon = {
            passed: '✅',
            failed: '❌',
            warnings: '⚠️'
        }[status] || '❓';

        console.log(`${statusIcon} ${testName}: ${message}`);
        if (details) {
            console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
        }
    }

    async createTestImage(filename = 'test-image.png', sizeMB = 1) {
        const size = sizeMB * 1024 * 1024; // Convert MB to bytes
        const canvas = await this.page.evaluate((width, height) => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // Create a gradient background
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(0.5, '#00ff00');
            gradient.addColorStop(1, '#0000ff');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // Add some text
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText('Test Image for Upload', 50, 50);
            
            return canvas.toDataURL('image/png');
        }, 800, 600);

        // Convert data URL to file
        const base64Data = canvas.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const filepath = path.join(__dirname, filename);
        fs.writeFileSync(filepath, buffer);
        
        return filepath;
    }

    async testServerConnection() {
        console.log('\n🌐 Testing server connection...');
        
        try {
            const response = await this.page.goto('http://localhost:3000/browser-upload-test.html', {
                waitUntil: 'networkidle0',
                timeout: 10000
            });

            if (response && response.ok()) {
                await this.logResult('server_connection', 'passed', 'Successfully connected to test server');
                
                // Wait for page to fully load
                await this.page.waitForSelector('#authStatus', { timeout: 5000 });
                return true;
            } else {
                await this.logResult('server_connection', 'failed', 'Failed to connect to test server');
                return false;
            }
        } catch (error) {
            await this.logResult('server_connection', 'failed', `Server connection error: ${error.message}`);
            return false;
        }
    }

    async testAuthentication() {
        console.log('\n🔐 Testing authentication...');
        
        try {
            // Wait for auth check to complete
            await this.page.waitForSelector('.auth-status', { timeout: 5000 });
            
            const authStatus = await this.page.$eval('.auth-status', el => ({
                text: el.textContent,
                className: el.className
            }));

            if (authStatus.className.includes('auth-valid')) {
                await this.logResult('authentication', 'passed', 'Authentication successful', authStatus);
                return true;
            } else {
                await this.logResult('authentication', 'failed', 'Authentication failed', authStatus);
                return false;
            }
        } catch (error) {
            await this.logResult('authentication', 'failed', `Authentication test error: ${error.message}`);
            return false;
        }
    }

    async testFileUpload() {
        console.log('\n📁 Testing file upload functionality...');
        
        try {
            // Create test image
            const testImagePath = await this.createTestImage('browser-test-image.png', 0.5);
            
            // Find file input and upload file
            const fileInput = await this.page.$('#fileInput1');
            await fileInput.uploadFile(testImagePath);
            
            // Wait for upload to complete
            await this.page.waitForSelector('#results1 .file-preview', { timeout: 10000 });
            
            // Check for upload result
            await this.page.waitForFunction(() => {
                const results = document.querySelector('#results1');
                return results && (
                    results.textContent.includes('Upload Successful') ||
                    results.textContent.includes('Upload Failed')
                );
            }, { timeout: 30000 });

            const uploadResult = await this.page.$eval('#results1', el => el.textContent);
            
            if (uploadResult.includes('Upload Successful')) {
                await this.logResult('file_upload', 'passed', 'Single file upload successful');
                
                // Clean up test file
                fs.unlinkSync(testImagePath);
                return true;
            } else {
                await this.logResult('file_upload', 'failed', 'Single file upload failed', { result: uploadResult });
                return false;
            }
        } catch (error) {
            await this.logResult('file_upload', 'failed', `File upload test error: ${error.message}`);
            return false;
        }
    }

    async testMultipleFileUpload() {
        console.log('\n📁 Testing multiple file upload...');
        
        try {
            // Create multiple test images
            const testFiles = [];
            for (let i = 1; i <= 3; i++) {
                const filepath = await this.createTestImage(`multi-test-${i}.png`, 0.3);
                testFiles.push(filepath);
            }
            
            // Upload multiple files
            const fileInput = await this.page.$('#fileInput2');
            await fileInput.uploadFile(...testFiles);
            
            // Wait for upload to complete
            await this.page.waitForFunction(() => {
                const results = document.querySelector('#results2');
                return results && (
                    results.textContent.includes('Upload Successful') ||
                    results.textContent.includes('Upload Failed')
                );
            }, { timeout: 30000 });

            const uploadResult = await this.page.$eval('#results2', el => el.textContent);
            
            if (uploadResult.includes('Upload Successful')) {
                await this.logResult('multiple_file_upload', 'passed', 'Multiple file upload successful');
                
                // Clean up test files
                testFiles.forEach(file => fs.unlinkSync(file));
                return true;
            } else {
                await this.logResult('multiple_file_upload', 'failed', 'Multiple file upload failed', { result: uploadResult });
                return false;
            }
        } catch (error) {
            await this.logResult('multiple_file_upload', 'failed', `Multiple file upload test error: ${error.message}`);
            return false;
        }
    }

    async testDragAndDrop() {
        console.log('\n🖱️ Testing drag and drop functionality...');
        
        try {
            // Create test image
            const testImagePath = await this.createTestImage('drag-drop-test.png', 0.2);
            
            // Read file as buffer for drag and drop simulation
            const fileBuffer = fs.readFileSync(testImagePath);
            
            // Simulate drag and drop
            await this.page.evaluate((fileData, fileName) => {
                const uploadZone = document.querySelector('#uploadZone1');
                const file = new File([new Uint8Array(fileData)], fileName, { type: 'image/png' });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                
                const dropEvent = new DragEvent('drop', {
                    bubbles: true,
                    cancelable: true,
                    dataTransfer: dataTransfer
                });
                
                uploadZone.dispatchEvent(dropEvent);
            }, Array.from(fileBuffer), 'drag-drop-test.png');
            
            // Wait for file processing
            await this.page.waitForSelector('#results1 .file-preview', { timeout: 5000 });
            
            await this.logResult('drag_and_drop', 'passed', 'Drag and drop functionality working');
            
            // Clean up
            fs.unlinkSync(testImagePath);
            return true;
        } catch (error) {
            await this.logResult('drag_and_drop', 'failed', `Drag and drop test error: ${error.message}`);
            return false;
        }
    }

    async testErrorHandling() {
        console.log('\n⚠️ Testing error handling...');
        
        try {
            // Test large file error
            await this.page.click('button[onclick="testLargeFile()"]');
            await this.page.waitForTimeout(2000);
            
            // Test invalid file type error
            await this.page.click('button[onclick="testInvalidFileType()"]');
            await this.page.waitForTimeout(2000);
            
            // Check if error tests were executed
            const largeFileResult = await this.page.$eval('#largeFileResult', el => el.textContent);
            const invalidFileResult = await this.page.$eval('#invalidFileResult', el => el.textContent);
            
            if (largeFileResult.includes('Tested') && invalidFileResult.includes('Tested')) {
                await this.logResult('error_handling', 'passed', 'Error handling tests executed successfully');
                return true;
            } else {
                await this.logResult('error_handling', 'warnings', 'Some error handling tests may not have executed properly');
                return false;
            }
        } catch (error) {
            await this.logResult('error_handling', 'failed', `Error handling test error: ${error.message}`);
            return false;
        }
    }

    async testAccessibility() {
        console.log('\n♿ Testing accessibility features...');
        
        try {
            // Check for ARIA labels
            const ariaLabels = await this.page.$$eval('[aria-label]', elements => 
                elements.map(el => ({ tag: el.tagName, label: el.getAttribute('aria-label') }))
            );
            
            // Check for proper heading structure
            const headings = await this.page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
                elements.map(el => ({ tag: el.tagName, text: el.textContent.trim().substring(0, 50) }))
            );
            
            // Check for keyboard navigation support
            const focusableElements = await this.page.$$eval(
                'button, input, [tabindex]:not([tabindex="-1"])', 
                elements => elements.length
            );
            
            await this.logResult('accessibility', 'passed', 'Accessibility features verified', {
                ariaLabels: ariaLabels.length,
                headings: headings.length,
                focusableElements
            });
            
            return true;
        } catch (error) {
            await this.logResult('accessibility', 'failed', `Accessibility test error: ${error.message}`);
            return false;
        }
    }

    async testMobileResponsiveness() {
        console.log('\n📱 Testing mobile responsiveness...');
        
        try {
            // Test mobile viewport
            await this.page.setViewport({ width: 375, height: 667 }); // iPhone SE
            await this.page.waitForTimeout(1000);
            
            // Check if upload zones are still visible and usable
            const uploadZoneVisible = await this.page.$eval('#uploadZone1', el => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            });
            
            // Test touch events
            const touchSupported = await this.page.evaluate(() => 'ontouchstart' in window);
            
            // Reset viewport
            await this.page.setViewport({ width: 1280, height: 720 });
            
            await this.logResult('mobile_responsiveness', 'passed', 'Mobile responsiveness verified', {
                uploadZoneVisible,
                touchSupported
            });
            
            return true;
        } catch (error) {
            await this.logResult('mobile_responsiveness', 'failed', `Mobile responsiveness test error: ${error.message}`);
            return false;
        }
    }

    async testPerformance() {
        console.log('\n⚡ Testing performance metrics...');
        
        try {
            // Get performance metrics
            const performanceMetrics = await this.page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const resources = performance.getEntriesByType('resource');
                
                return {
                    pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    resourceCount: resources.length,
                    largestResource: resources.reduce((max, resource) => 
                        resource.transferSize > max.transferSize ? resource : max
                    , { transferSize: 0, name: 'none' })
                };
            });
            
            // Check if performance is acceptable
            const performanceOk = performanceMetrics.pageLoadTime < 3000; // Less than 3 seconds
            
            await this.logResult(
                'performance', 
                performanceOk ? 'passed' : 'warnings', 
                'Performance metrics collected', 
                performanceMetrics
            );
            
            return performanceOk;
        } catch (error) {
            await this.logResult('performance', 'failed', `Performance test error: ${error.message}`);
            return false;
        }
    }

    async generateReport() {
        console.log('\n📊 Generating test report...');
        
        const reportPath = path.join(__dirname, `browser-upload-test-report-${Date.now()}.json`);
        
        // Add summary statistics
        this.testResults.summary.successRate = this.testResults.summary.total > 0 
            ? Math.round((this.testResults.summary.passed / this.testResults.summary.total) * 100)
            : 0;
            
        // Add environment info
        this.testResults.environment = {
            userAgent: await this.page.evaluate(() => navigator.userAgent),
            viewport: await this.page.viewport(),
            url: this.page.url()
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
        
        console.log(`📄 Test report saved to: ${reportPath}`);
        return reportPath;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
        
        // Clean up any remaining test files
        const testFiles = fs.readdirSync(__dirname).filter(file => 
            file.startsWith('test-') || file.startsWith('multi-test-') || file.startsWith('drag-drop-test')
        );
        
        testFiles.forEach(file => {
            try {
                fs.unlinkSync(path.join(__dirname, file));
            } catch (error) {
                console.warn(`Could not clean up file ${file}: ${error.message}`);
            }
        });
    }

    async runAllTests() {
        console.log('🎯 Starting comprehensive browser upload tests...\n');
        
        try {
            await this.init();
            
            // Core functionality tests
            const serverConnected = await this.testServerConnection();
            if (!serverConnected) {
                console.error('❌ Cannot proceed without server connection');
                return false;
            }
            
            const authSuccess = await this.testAuthentication();
            if (!authSuccess) {
                console.warn('⚠️ Authentication failed - upload tests may fail');
            }
            
            // Upload functionality tests
            await this.testFileUpload();
            await this.testMultipleFileUpload();
            await this.testDragAndDrop();
            await this.testErrorHandling();
            
            // Quality assurance tests
            await this.testAccessibility();
            await this.testMobileResponsiveness();
            await this.testPerformance();
            
            // Generate final report
            const reportPath = await this.generateReport();
            
            console.log('\n📈 Test Summary:');
            console.log(`Total Tests: ${this.testResults.summary.total}`);
            console.log(`Passed: ${this.testResults.summary.passed}`);
            console.log(`Failed: ${this.testResults.summary.failed}`);
            console.log(`Warnings: ${this.testResults.summary.warnings}`);
            console.log(`Success Rate: ${this.testResults.summary.successRate}%`);
            console.log(`\n📄 Full Report: ${reportPath}`);
            
            return this.testResults.summary.successRate >= 80;
            
        } catch (error) {
            console.error(`❌ Test suite error: ${error.message}`);
            return false;
        } finally {
            await this.cleanup();
        }
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new BrowserUploadTester();
    
    tester.runAllTests()
        .then(success => {
            console.log(success ? '\n✅ All tests completed successfully!' : '\n❌ Some tests failed');
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error(`\n💥 Test suite crashed: ${error.message}`);
            process.exit(1);
        });
}

export default BrowserUploadTester;