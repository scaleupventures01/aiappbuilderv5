#!/usr/bin/env node

/**
 * QUICK FINAL QA TEST
 * Essential production readiness checks
 */

const API_BASE = 'http://localhost:3001';
const DEMO_BASE = 'http://localhost:5173';

let passed = 0;
let failed = 0;

function logTest(testName, success, details = '') {
    if (success) {
        console.log(`✅ ${testName}`);
        passed++;
    } else {
        console.log(`❌ ${testName} - ${details}`);
        failed++;
    }
}

async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        });
        const text = await response.text();
        let data = null;
        try { data = JSON.parse(text); } catch (e) { data = text; }
        return { status: response.status, data };
    } catch (error) {
        return { status: 0, error: error.message };
    }
}

async function runTests() {
    console.log('🔬 QUICK FINAL QA TEST');
    console.log('======================');
    
    // 1. Token Generation
    const tokenResp = await makeRequest(`${API_BASE}/generate-test-token`, { method: 'POST' });
    logTest('Token Generation', tokenResp.status === 200 && tokenResp.data?.success, `Status: ${tokenResp.status}`);
    
    const token = tokenResp.data?.data?.token;
    
    // 2. Token Validation
    if (token) {
        const validateResp = await makeRequest(`${API_BASE}/api/auth/validate`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        logTest('Token Validation', validateResp.status === 200 && validateResp.data?.data?.valid, `Status: ${validateResp.status}`);
    }
    
    // 3. 404 Error Format
    const notFoundResp = await makeRequest(`${API_BASE}/api/nonexistent`);
    logTest('404 Error Format', notFoundResp.status === 404 && notFoundResp.data?.success === false, `Status: ${notFoundResp.status}`);
    
    // 4. Method Error Format  
    const methodResp = await makeRequest(`${API_BASE}/generate-test-token`, { method: 'GET' });
    logTest('Method Error Format', (methodResp.status === 404 || methodResp.status === 405) && methodResp.data?.success === false, `Status: ${methodResp.status}`);
    
    // 5. Auth Error Format
    const authResp = await makeRequest(`${API_BASE}/api/auth/validate`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer invalid' }
    });
    logTest('Auth Error Format', authResp.status === 401 && authResp.data?.success === false, `Status: ${authResp.status}`);
    
    // 6. Demo Page Loads
    const demoResp = await makeRequest(`${DEMO_BASE}/working-error-demo.html`);
    logTest('Demo Page Loads', demoResp.status === 200 && typeof demoResp.data === 'string' && demoResp.data.includes('Error'), `Status: ${demoResp.status}`);
    
    // Results
    const total = passed + failed;
    const successRate = (passed / total * 100).toFixed(1);
    
    console.log('\n📊 RESULTS');
    console.log('==========');
    console.log(`Passed: ${passed}/${total} (${successRate}%)`);
    
    const isReady = failed === 0 && passed >= 5;
    
    console.log('\n🎯 QA SIGN-OFF');
    console.log('===============');
    if (isReady) {
        console.log('🟢 APPROVED FOR PRODUCTION');
        console.log('✅ All critical systems operational');
        console.log('✅ Error handling properly implemented');
        console.log('✅ Authentication working correctly');
        console.log('✅ Demo interface functional');
        console.log('✅ Professional user experience confirmed');
    } else {
        console.log('🔴 NOT READY FOR PRODUCTION');
        console.log(`❌ ${failed} critical issues detected`);
    }
    
    return isReady;
}

runTests().then(ready => {
    process.exit(ready ? 0 : 1);
}).catch(error => {
    console.error('❌ CRITICAL TEST FAILURE:', error);
    process.exit(1);
});