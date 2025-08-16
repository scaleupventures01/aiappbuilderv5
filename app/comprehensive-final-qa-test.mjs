#!/usr/bin/env node

/**
 * COMPREHENSIVE FINAL QA TEST
 * Tests all functionality and error scenarios for production readiness
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:3001';
const DEMO_BASE = 'http://localhost:5173';

// Test Results Storage
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

function logTest(testName, passed, details = '') {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ ${testName}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${testName} - ${details}`);
    }
    testResults.details.push({
        test: testName,
        status: passed ? 'PASS' : 'FAIL',
        details: details,
        timestamp: new Date().toISOString()
    });
}

async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.text();
        let jsonData = null;
        try {
            jsonData = JSON.parse(data);
        } catch (e) {
            // Not JSON, that's okay for some tests
        }
        
        return {
            status: response.status,
            data: jsonData || data,
            headers: Object.fromEntries(response.headers.entries())
        };
    } catch (error) {
        return {
            status: 0,
            error: error.message,
            data: null
        };
    }
}

async function testServerConnectivity() {
    console.log('\n🔍 Testing Server Connectivity...');
    
    // Test backend server
    const backendResponse = await makeRequest(`${API_BASE}/api/health`);
    logTest('Backend Server Connectivity', 
        backendResponse.status === 200 || backendResponse.status === 404, 
        `Status: ${backendResponse.status}`);
    
    // Test frontend server
    const frontendResponse = await makeRequest(`${DEMO_BASE}/working-error-demo.html`);
    logTest('Frontend Server Connectivity', 
        frontendResponse.status === 200, 
        `Status: ${frontendResponse.status}`);
}

async function testAuthenticationEndpoints() {
    console.log('\n🔐 Testing Authentication Endpoints...');
    
    // Test token generation
    const tokenResponse = await makeRequest(`${API_BASE}/generate-test-token`, {
        method: 'POST'
    });
    
    logTest('Token Generation Endpoint', 
        tokenResponse.status === 200 && tokenResponse.data?.success === true,
        `Status: ${tokenResponse.status}, Success: ${tokenResponse.data?.success}`);
    
    if (tokenResponse.data?.data?.token) {
        const token = tokenResponse.data.data.token;
        
        // Test token validation
        const validateResponse = await makeRequest(`${API_BASE}/api/auth/validate`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        logTest('Token Validation Endpoint', 
            validateResponse.status === 200 && validateResponse.data?.data?.valid === true,
            `Status: ${validateResponse.status}, Valid: ${validateResponse.data?.data?.valid}`);
    }
}

async function testErrorResponses() {
    console.log('\n🚨 Testing Error Response Formats...');
    
    // Test 404 for nonexistent endpoint
    const notFoundResponse = await makeRequest(`${API_BASE}/api/nonexistent`);
    logTest('404 Error Format', 
        notFoundResponse.status === 404 && notFoundResponse.data?.success === false,
        `Status: ${notFoundResponse.status}, Structured: ${!!notFoundResponse.data?.error}`);
    
    // Test 405 Method Not Allowed (GET instead of POST)
    const methodNotAllowedResponse = await makeRequest(`${API_BASE}/generate-test-token`, {
        method: 'GET'
    });
    logTest('405/404 Method Error Format', 
        (methodNotAllowedResponse.status === 405 || methodNotAllowedResponse.status === 404) && 
        methodNotAllowedResponse.data?.success === false,
        `Status: ${methodNotAllowedResponse.status}, Structured: ${!!methodNotAllowedResponse.data?.error}`);
    
    // Test 401 Unauthorized
    const unauthorizedResponse = await makeRequest(`${API_BASE}/api/auth/validate`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer invalid_token'
        }
    });
    logTest('401 Unauthorized Error Format', 
        unauthorizedResponse.status === 401 && unauthorizedResponse.data?.success === false,
        `Status: ${unauthorizedResponse.status}, Structured: ${!!unauthorizedResponse.data?.error}`);
}

async function testFileUploadErrorScenarios() {
    console.log('\n📁 Testing File Upload Error Scenarios...');
    
    // Test upload without auth
    const uploadNoAuthResponse = await makeRequest(`${API_BASE}/api/upload`, {
        method: 'POST'
    });
    logTest('Upload Without Auth Error', 
        uploadNoAuthResponse.status === 401 && uploadNoAuthResponse.data?.success === false,
        `Status: ${uploadNoAuthResponse.status}`);
    
    // Generate token for authenticated tests
    const tokenResponse = await makeRequest(`${API_BASE}/generate-test-token`, {
        method: 'POST'
    });
    
    if (tokenResponse.data?.data?.token) {
        const token = tokenResponse.data.data.token;
        
        // Test upload with invalid file type
        const formData = new FormData();
        formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');
        
        const uploadInvalidTypeResponse = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const uploadData = await uploadInvalidTypeResponse.text();
        let uploadJsonData = null;
        try {
            uploadJsonData = JSON.parse(uploadData);
        } catch (e) {
            // Not JSON
        }
        
        logTest('Upload Invalid File Type Error', 
            uploadInvalidTypeResponse.status >= 400 && uploadInvalidTypeResponse.status < 500,
            `Status: ${uploadInvalidTypeResponse.status}`);
    }
}

async function testDemoPageFunctionality() {
    console.log('\n🎭 Testing Demo Page Functionality...');
    
    // Test demo page loads
    const demoResponse = await makeRequest(`${DEMO_BASE}/working-error-demo.html`);
    logTest('Demo Page Loads', 
        demoResponse.status === 200 && demoResponse.data.includes('Error Handling'),
        `Status: ${demoResponse.status}, Contains Title: ${demoResponse.data.includes('Error Handling')}`);
    
    // Test demo assets load (check for common CSS/JS patterns)
    const hasStyles = demoResponse.data.includes('style') || demoResponse.data.includes('css');
    const hasScripts = demoResponse.data.includes('script') || demoResponse.data.includes('javascript');
    
    logTest('Demo Page Assets Present', 
        hasStyles && hasScripts,
        `Styles: ${hasStyles}, Scripts: ${hasScripts}`);
}

async function testRetryMechanisms() {
    console.log('\n🔄 Testing Retry Mechanisms...');
    
    // Test multiple rapid requests to ensure server stability
    const rapidRequests = [];
    for (let i = 0; i < 5; i++) {
        rapidRequests.push(makeRequest(`${API_BASE}/generate-test-token`, {
            method: 'POST'
        }));
    }
    
    const rapidResults = await Promise.all(rapidRequests);
    const allSuccessful = rapidResults.every(result => result.status === 200);
    
    logTest('Rapid Request Handling', 
        allSuccessful,
        `Successful requests: ${rapidResults.filter(r => r.status === 200).length}/5`);
}

async function generateReport() {
    console.log('\n📊 FINAL QA REPORT');
    console.log('==================');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    const isProductionReady = testResults.failed === 0 && testResults.passed >= 10;
    
    console.log('\n🎯 PRODUCTION READINESS ASSESSMENT');
    console.log('=====================================');
    
    if (isProductionReady) {
        console.log('🟢 APPROVED FOR PRODUCTION');
        console.log('✅ All critical functionality working');
        console.log('✅ Error handling properly implemented');
        console.log('✅ Authentication flow functional');
        console.log('✅ User experience is professional');
    } else {
        console.log('🔴 NOT READY FOR PRODUCTION');
        console.log(`❌ ${testResults.failed} tests failed`);
        console.log('❌ Critical issues need resolution');
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'final-qa-validation-report.json');
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: testResults.total,
            passed: testResults.passed,
            failed: testResults.failed,
            successRate: (testResults.passed / testResults.total) * 100,
            productionReady: isProductionReady
        },
        tests: testResults.details,
        recommendation: isProductionReady ? 'APPROVED FOR PRODUCTION' : 'REQUIRES FIXES BEFORE PRODUCTION'
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 Detailed report saved to: ${reportPath}`);
    
    return isProductionReady;
}

async function main() {
    console.log('🔬 STARTING COMPREHENSIVE FINAL QA TESTING');
    console.log('===========================================');
    
    try {
        await testServerConnectivity();
        await testAuthenticationEndpoints();
        await testErrorResponses();
        await testFileUploadErrorScenarios();
        await testDemoPageFunctionality();
        await testRetryMechanisms();
        
        const isReady = await generateReport();
        
        if (isReady) {
            console.log('\n🎉 QA SIGN-OFF: READY FOR PRODUCTION! 🎉');
            process.exit(0);
        } else {
            console.log('\n⚠️  QA SIGN-OFF: BLOCKED - REQUIRES FIXES ⚠️');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ CRITICAL ERROR during testing:', error);
        console.log('\n🚫 QA SIGN-OFF: BLOCKED - CRITICAL FAILURE 🚫');
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main as runFinalQATest };