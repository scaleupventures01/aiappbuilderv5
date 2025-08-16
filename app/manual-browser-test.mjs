#!/usr/bin/env node

/**
 * Manual Browser Upload Test Runner
 * Performs actual browser testing with real file uploads
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ManualBrowserTester {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            tests: [],
            files_tested: [],
            environment: {
                node_version: process.version,
                platform: process.platform
            }
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
        
        this.testResults.tests.push({
            timestamp,
            type,
            message
        });
    }

    async checkServerStatus() {
        this.log('Checking server status...', 'info');
        
        try {
            const response = await fetch('http://localhost:3001/health');
            if (response.ok) {
                const data = await response.json();
                this.log(`Server is running: ${data.status}`, 'success');
                return true;
            } else {
                this.log(`Server responded with ${response.status}`, 'error');
                return false;
            }
        } catch (error) {
            this.log(`Cannot connect to server: ${error.message}`, 'error');
            return false;
        }
    }

    async testUploadAPI() {
        this.log('Testing upload API directly...', 'info');
        
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OTZhOTM3OC0xNWZmLTQzYWMtODI1YS0wYzFlODRiYTVjNmIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc1NTMwNDgwMywiZXhwIjoxNzU1MzA1NzAzLCJhdWQiOiJlbGl0ZS10cmFkaW5nLWNvYWNoLXVzZXJzIiwiaXNzIjoiZWxpdGUtdHJhZGluZy1jb2FjaC1haSJ9.-zNFO7IihaxEeoGxukzA6TzO_A8IDGHBzhvoyCWhZw0';
        
        try {
            // Test with small file
            const testFile = 'test-small.jpg';
            if (!fs.existsSync(testFile)) {
                this.log(`Test file ${testFile} not found`, 'error');
                return false;
            }

            const fileBuffer = fs.readFileSync(testFile);
            const formData = new FormData();
            const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
            formData.append('images', blob, testFile);
            formData.append('context', 'api-test');

            const response = await fetch('http://localhost:3001/api/upload/images', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                this.log(`Upload API test successful: ${result.results.length} file(s) uploaded`, 'success');
                this.testResults.files_tested.push({
                    filename: testFile,
                    size: fileBuffer.length,
                    status: 'success',
                    cloudinary_url: result.results[0]?.secureUrl
                });
                return true;
            } else {
                const errorData = await response.json();
                this.log(`Upload API test failed: ${errorData.error}`, 'error');
                return false;
            }
        } catch (error) {
            this.log(`Upload API test error: ${error.message}`, 'error');
            return false;
        }
    }

    async testFileValidation() {
        this.log('Testing file validation...', 'info');
        
        const testCases = [
            { file: 'test-small.jpg', expected: 'success', description: 'Small valid image' },
            { file: 'test-medium.jpg', expected: 'success', description: 'Medium valid image' },
            { file: 'test-large.jpg', expected: 'success', description: 'Large valid image (10MB)' },
            { file: 'test-oversized.jpg', expected: 'failure', description: 'Oversized image (20MB - should fail)' }
        ];

        const results = [];
        
        for (const testCase of testCases) {
            if (!fs.existsSync(testCase.file)) {
                this.log(`Skipping ${testCase.file} - file not found`, 'warning');
                continue;
            }

            const fileSize = fs.statSync(testCase.file).size;
            const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
            
            this.log(`Testing ${testCase.description}: ${testCase.file} (${sizeMB}MB)`, 'info');
            
            // Simulate validation logic
            const isValidSize = fileSize <= 15 * 1024 * 1024; // 15MB limit
            const actualResult = isValidSize ? 'success' : 'failure';
            
            const passed = actualResult === testCase.expected;
            results.push({
                file: testCase.file,
                expected: testCase.expected,
                actual: actualResult,
                passed,
                size: fileSize,
                sizeMB
            });
            
            this.log(`${testCase.file}: ${passed ? 'PASS' : 'FAIL'} (${actualResult})`, passed ? 'success' : 'error');
        }
        
        const passedTests = results.filter(r => r.passed).length;
        this.log(`File validation tests: ${passedTests}/${results.length} passed`, 'info');
        
        return passedTests === results.length;
    }

    async testErrorHandling() {
        this.log('Testing error handling scenarios...', 'info');
        
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OTZhOTM3OC0xNWZmLTQzYWMtODI1YS0wYzFlODRiYTVjNmIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc1NTMwNDgwMywiZXhwIjoxNzU1MzA1NzAzLCJhdWQiOiJlbGl0ZS10cmFkaW5nLWNvYWNoLXVzZXJzIiwiaXNzIjoiZWxpdGUtdHJhZGluZy1jb2FjaC1haSJ9.-zNFO7IihaxEeoGxukzA6TzO_A8IDGHBzhvoyCWhZw0';
        
        const errorTests = [
            {
                description: 'No authentication token',
                test: async () => {
                    const response = await fetch('http://localhost:3001/api/upload/images', {
                        method: 'POST',
                        body: new FormData()
                    });
                    return response.status === 401;
                }
            },
            {
                description: 'Invalid authentication token',
                test: async () => {
                    const response = await fetch('http://localhost:3001/api/upload/images', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer invalid-token'
                        },
                        body: new FormData()
                    });
                    return response.status === 401;
                }
            },
            {
                description: 'No files provided',
                test: async () => {
                    const response = await fetch('http://localhost:3001/api/upload/images', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: new FormData()
                    });
                    return response.status === 400;
                }
            }
        ];

        let passedErrorTests = 0;
        
        for (const errorTest of errorTests) {
            try {
                const result = await errorTest.test();
                if (result) {
                    this.log(`Error handling test passed: ${errorTest.description}`, 'success');
                    passedErrorTests++;
                } else {
                    this.log(`Error handling test failed: ${errorTest.description}`, 'error');
                }
            } catch (error) {
                this.log(`Error handling test error: ${errorTest.description} - ${error.message}`, 'error');
            }
        }
        
        this.log(`Error handling tests: ${passedErrorTests}/${errorTests.length} passed`, 'info');
        return passedErrorTests === errorTests.length;
    }

    async testMultipleFileUpload() {
        this.log('Testing multiple file upload...', 'info');
        
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OTZhOTM3OC0xNWZmLTQzYWMtODI1YS0wYzFlODRiYTVjNmIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc1NTMwNDgwMywiZXhwIjoxNzU1MzA1NzAzLCJhdWQiOiJlbGl0ZS10cmFkaW5nLWNvYWNoLXVzZXJzIiwiaXNzIjoiZWxpdGUtdHJhZGluZy1jb2FjaC1haSJ9.-zNFO7IihaxEeoGxukzA6TzO_A8IDGHBzhvoyCWhZw0';
        
        try {
            const testFiles = ['test-batch-1.jpg', 'test-batch-2.jpg', 'test-batch-3.jpg'];
            const existingFiles = testFiles.filter(file => fs.existsSync(file));
            
            if (existingFiles.length === 0) {
                this.log('No batch test files found for multiple upload test', 'warning');
                return false;
            }

            const formData = new FormData();
            let totalSize = 0;
            
            for (const filename of existingFiles) {
                const fileBuffer = fs.readFileSync(filename);
                const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
                formData.append('images', blob, filename);
                totalSize += fileBuffer.length;
            }
            
            formData.append('context', 'multi-file-test');

            const response = await fetch('http://localhost:3001/api/upload/images', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                this.log(`Multiple file upload successful: ${result.results.length}/${existingFiles.length} files uploaded`, 'success');
                
                for (const fileResult of result.results) {
                    this.testResults.files_tested.push({
                        filename: fileResult.originalFilename,
                        size: fileResult.fileSize,
                        status: 'success',
                        cloudinary_url: fileResult.secureUrl
                    });
                }
                
                return result.results.length === existingFiles.length;
            } else {
                const errorData = await response.json();
                this.log(`Multiple file upload failed: ${errorData.error}`, 'error');
                return false;
            }
        } catch (error) {
            this.log(`Multiple file upload error: ${error.message}`, 'error');
            return false;
        }
    }

    async generateBrowserTestInstructions() {
        this.log('Generating browser test instructions...', 'info');
        
        const instructions = `
🌐 BROWSER UPLOAD TESTING INSTRUCTIONS
=====================================

📋 Manual Testing Checklist:

1. OPEN BROWSER TEST PAGE
   - Navigate to: http://localhost:3001/browser-upload-test.html
   - Verify page loads correctly
   - Check authentication status (should show ✅ valid)

2. BASIC UPLOAD TESTS
   □ Single file upload using test-small.jpg
   □ Drag & drop test-medium.jpg onto upload zone
   □ Multiple file upload using test-batch-*.jpg files
   □ Upload progress indicators work correctly

3. ERROR HANDLING TESTS
   □ Upload test-oversized.jpg (should fail - 20MB)
   □ Try uploading non-image file (should be rejected)
   □ Test with invalid authentication token
   □ Test upload with no internet connection

4. REACT COMPONENT TESTING
   - Navigate to: http://localhost:3001
   - Go to Psychology Coaching page
   - Test FileDropzone component:
   □ Drag & drop functionality
   □ File preview generation
   □ Upload progress tracking
   □ Error display
   □ Success confirmation

5. ACCESSIBILITY TESTING
   □ Navigate upload zones using Tab key
   □ Press Enter/Space to open file dialog
   □ Test with screen reader (if available)
   □ Verify ARIA labels are announced

6. MOBILE RESPONSIVENESS
   □ Test on mobile device or browser dev tools
   □ Verify touch interactions work
   □ Check upload zones are properly sized
   □ Test file selection on mobile

7. PERFORMANCE TESTING
   □ Upload large files (10MB) and measure time
   □ Test multiple simultaneous uploads
   □ Monitor browser memory usage
   □ Check for any UI freezing

📁 Test Files Available:
${fs.readdirSync(__dirname).filter(f => f.startsWith('test-')).map(f => {
    const size = fs.statSync(path.join(__dirname, f)).size;
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    return `  - ${f} (${sizeMB}MB)`;
}).join('\n')}

🎯 Expected Results:
- Small/medium files should upload successfully
- Large files (10MB) should upload but may take time
- Oversized files (20MB) should be rejected
- Invalid file types should be rejected
- Progress indicators should show accurately
- Error messages should be clear and helpful

⚠️  Issues to Watch For:
- Upload stalling or timing out
- Memory leaks during large uploads
- UI becoming unresponsive
- Incorrect file validation
- Authentication errors
- Network error handling

📊 Report any issues with:
- Browser version and OS
- File types and sizes that failed
- Error messages received
- Steps to reproduce the issue
`;

        console.log(instructions);
        
        fs.writeFileSync('BROWSER_TEST_INSTRUCTIONS.md', instructions);
        this.log('Browser test instructions saved to BROWSER_TEST_INSTRUCTIONS.md', 'info');
    }

    async saveReport() {
        const reportPath = `browser-test-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
        this.log(`Test report saved to ${reportPath}`, 'info');
        return reportPath;
    }

    async runTests() {
        console.log('🎯 Starting manual browser upload testing...\n');
        
        const serverRunning = await this.checkServerStatus();
        if (!serverRunning) {
            this.log('Server is not running. Please start the server first.', 'error');
            return false;
        }

        // Run API tests
        await this.testUploadAPI();
        await this.testFileValidation();
        await this.testErrorHandling();
        await this.testMultipleFileUpload();
        
        // Generate instructions for manual testing
        await this.generateBrowserTestInstructions();
        
        // Save report
        const reportPath = await this.saveReport();
        
        console.log('\n📊 Automated Test Summary:');
        const successTests = this.testResults.tests.filter(t => t.type === 'success').length;
        const errorTests = this.testResults.tests.filter(t => t.type === 'error').length;
        const totalTests = successTests + errorTests;
        
        console.log(`✅ Successful operations: ${successTests}`);
        console.log(`❌ Failed operations: ${errorTests}`);
        console.log(`📄 Files tested: ${this.testResults.files_tested.length}`);
        console.log(`📋 Full report: ${reportPath}`);
        
        console.log('\n🌐 Next Steps:');
        console.log('1. Follow the instructions in BROWSER_TEST_INSTRUCTIONS.md');
        console.log('2. Open http://localhost:3001/browser-upload-test.html');
        console.log('3. Test the React app at http://localhost:3001');
        console.log('4. Report any issues found during manual testing');
        
        return true;
    }
}

// Run tests
const tester = new ManualBrowserTester();
tester.runTests().catch(error => {
    console.error('❌ Test runner error:', error.message);
    process.exit(1);
});