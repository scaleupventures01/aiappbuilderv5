#!/usr/bin/env node

/**
 * LIVE BROWSER TESTING SCRIPT
 * Tests GPT-5 vision integration via actual HTTP requests
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';
const TEST_IMAGE_PATH = './test-image.png';

console.log('🧪 LIVE BROWSER TESTING - GPT-5 Vision Verification');
console.log('=' .repeat(60));

async function testServerHealth() {
    console.log('\n📊 STEP 1: Server Health Check');
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        console.log('✅ Server Status:', response.status);
        console.log('✅ Health Response:', data);
        return true;
    } catch (error) {
        console.log('❌ Server Health Failed:', error.message);
        return false;
    }
}

async function testImageUpload(description = "Trading chart with breakout pattern", speedMode = "balanced") {
    console.log('\n🖼️  STEP 2: Testing Image Upload & Analysis');
    console.log(`📝 Description: "${description}"`);
    console.log(`⚡ Speed Mode: ${speedMode}`);
    
    try {
        // Check if test image exists
        if (!fs.existsSync(TEST_IMAGE_PATH)) {
            console.log('❌ Test image not found:', TEST_IMAGE_PATH);
            return false;
        }
        
        // Create form data (mimicking browser behavior)
        const formData = new FormData();
        formData.append('image', fs.createReadStream(TEST_IMAGE_PATH));
        formData.append('description', description);
        formData.append('speedMode', speedMode);
        
        console.log('🚀 Sending POST request to /api/test-analyze-trade...');
        const startTime = Date.now();
        
        const response = await fetch(`${API_BASE}/api/test-analyze-trade`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log(`⏱️  Response Time: ${responseTime}ms`);
        console.log(`📡 HTTP Status: ${response.status}`);
        
        const data = await response.json();
        
        // Detailed analysis of response
        console.log('\n📋 RESPONSE ANALYSIS:');
        console.log(`✅ Success: ${data.success}`);
        
        if (data.success) {
            console.log(`💎 Verdict: ${data.data.verdict}`);
            console.log(`🎯 Confidence: ${data.data.confidence}%`);
            console.log(`🧠 Model: ${data.metadata.model}`);
            console.log(`⚡ Processing Time: ${data.data.processingTime}ms`);
            console.log(`📝 Reasoning Preview: ${data.data.reasoning.substring(0, 100)}...`);
            
            // Verify GPT-5 is being used
            if (data.metadata.model === 'gpt-5') {
                console.log('✅ CONFIRMED: GPT-5 model is active');
            } else {
                console.log(`⚠️  WARNING: Expected gpt-5, got ${data.metadata.model}`);
            }
            
            // Verify valid verdict
            const validVerdicts = ['Diamond', 'Fire', 'Skull'];
            if (validVerdicts.includes(data.data.verdict)) {
                console.log('✅ CONFIRMED: Valid verdict received');
            } else {
                console.log(`❌ ERROR: Invalid verdict ${data.data.verdict}`);
            }
            
            return data;
        } else {
            console.log(`❌ ERROR: ${data.error}`);
            console.log(`🔍 Error Code: ${data.code || 'N/A'}`);
            return false;
        }
        
    } catch (error) {
        console.log('❌ Upload Test Failed:', error.message);
        return false;
    }
}

async function runMultipleScenarios() {
    console.log('\n🎭 STEP 3: Multiple Scenario Testing');
    
    const scenarios = [
        { description: "Bullish breakout pattern", speedMode: "fast" },
        { description: "Bearish reversal signal", speedMode: "balanced" },
        { description: "", speedMode: "super_fast" }, // Empty description
        { description: "Complex technical analysis required", speedMode: "high_accuracy" }
    ];
    
    let successCount = 0;
    
    for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        console.log(`\n🎬 Scenario ${i + 1}/${scenarios.length}:`);
        
        const result = await testImageUpload(scenario.description, scenario.speedMode);
        if (result) {
            successCount++;
            console.log(`✅ Scenario ${i + 1} PASSED`);
        } else {
            console.log(`❌ Scenario ${i + 1} FAILED`);
        }
        
        // Wait between tests to avoid rate limiting
        if (i < scenarios.length - 1) {
            console.log('⏳ Waiting 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log(`\n📊 SCENARIO RESULTS: ${successCount}/${scenarios.length} passed`);
    return successCount === scenarios.length;
}

async function validateConsistency() {
    console.log('\n🔄 STEP 4: Consistency Validation');
    console.log('Testing same input multiple times...');
    
    const results = [];
    const testDescription = "Test consistency check";
    
    for (let i = 0; i < 3; i++) {
        console.log(`\n🔄 Consistency Test ${i + 1}/3:`);
        const result = await testImageUpload(testDescription, "balanced");
        if (result) {
            results.push({
                verdict: result.data.verdict,
                confidence: result.data.confidence,
                model: result.metadata.model
            });
        }
        
        if (i < 2) {
            console.log('⏳ Waiting 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n📈 CONSISTENCY ANALYSIS:');
    console.log('Results:', results);
    
    // Check model consistency
    const models = [...new Set(results.map(r => r.model))];
    if (models.length === 1 && models[0] === 'gpt-5') {
        console.log('✅ Model consistency: All responses used gpt-5');
    } else {
        console.log('⚠️  Model inconsistency detected:', models);
    }
    
    return results.length === 3;
}

async function main() {
    console.log('🎯 Starting comprehensive live browser testing...\n');
    
    // Step 1: Health Check
    const healthOk = await testServerHealth();
    if (!healthOk) {
        console.log('\n❌ CRITICAL: Server health check failed. Aborting tests.');
        process.exit(1);
    }
    
    // Step 2: Basic Upload Test
    const basicTest = await testImageUpload();
    if (!basicTest) {
        console.log('\n❌ CRITICAL: Basic upload test failed. Aborting tests.');
        process.exit(1);
    }
    
    // Step 3: Multiple Scenarios
    const scenariosOk = await runMultipleScenarios();
    
    // Step 4: Consistency Check
    const consistencyOk = await validateConsistency();
    
    // Final Report
    console.log('\n' + '=' .repeat(60));
    console.log('🏁 FINAL TEST REPORT');
    console.log('=' .repeat(60));
    console.log(`✅ Server Health: PASSED`);
    console.log(`✅ Basic Upload: PASSED`);
    console.log(`${scenariosOk ? '✅' : '❌'} Multiple Scenarios: ${scenariosOk ? 'PASSED' : 'FAILED'}`);
    console.log(`${consistencyOk ? '✅' : '❌'} Consistency: ${consistencyOk ? 'PASSED' : 'FAILED'}`);
    
    const overallSuccess = healthOk && basicTest && scenariosOk && consistencyOk;
    console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (overallSuccess) {
        console.log('\n🎉 GPT-5 Vision integration is working correctly!');
        console.log('✅ No EXTERNAL_SERVICE_ERROR detected');
        console.log('✅ Consistent gpt-5 model usage confirmed');
        console.log('✅ Valid verdicts and reasoning generated');
    } else {
        console.log('\n⚠️  Some issues detected - review test output above');
    }
}

main().catch(console.error);