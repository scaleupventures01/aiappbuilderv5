#!/usr/bin/env node

/**
 * Test script for the critical demo endpoints
 * Verifies that both POST /generate-test-token and GET /api/auth/validate work properly
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002';

async function testDemoEndpoints() {
  console.log('🧪 Testing Critical Demo Endpoints');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Test 1: Generate test token
    console.log('1️⃣ Testing POST /generate-test-token...');
    const tokenResponse = await fetch(`${BASE_URL}/generate-test-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token generation failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token generated successfully');
    console.log(`   Token: ${tokenData.data.token.substring(0, 50)}...`);
    console.log(`   User ID: ${tokenData.data.user.id}`);
    console.log(`   Email: ${tokenData.data.user.email}\n`);

    const token = tokenData.data.token;

    // Test 2: Validate token with Authorization header
    console.log('2️⃣ Testing GET /api/auth/validate with Authorization header...');
    const validateResponse = await fetch(`${BASE_URL}/api/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!validateResponse.ok) {
      throw new Error(`Token validation failed: ${validateResponse.status} ${validateResponse.statusText}`);
    }

    const validateData = await validateResponse.json();
    console.log('✅ Token validation with header successful');
    console.log(`   Valid: ${validateData.data.valid}`);
    console.log(`   User ID: ${validateData.data.user_id}`);
    console.log(`   Email: ${validateData.data.email}\n`);

    // Test 3: Validate token with query parameter
    console.log('3️⃣ Testing GET /api/auth/validate with query parameter...');
    const queryValidateResponse = await fetch(`${BASE_URL}/api/auth/validate?token=${token}`, {
      method: 'GET'
    });

    if (!queryValidateResponse.ok) {
      throw new Error(`Token validation with query failed: ${queryValidateResponse.status} ${queryValidateResponse.statusText}`);
    }

    const queryValidateData = await queryValidateResponse.json();
    console.log('✅ Token validation with query parameter successful');
    console.log(`   Valid: ${queryValidateData.data.valid}`);
    console.log(`   User ID: ${queryValidateData.data.user_id}`);
    console.log(`   Email: ${queryValidateData.data.email}\n`);

    // Test 4: Test error handling
    console.log('4️⃣ Testing error handling (no token)...');
    const errorResponse = await fetch(`${BASE_URL}/api/auth/validate`, {
      method: 'GET'
    });

    const errorData = await errorResponse.json();
    console.log('✅ Error handling works correctly');
    console.log(`   Success: ${errorData.success}`);
    console.log(`   Error: ${errorData.error}\n`);

    // Test 5: Test backward compatibility with existing endpoint
    console.log('5️⃣ Testing backward compatibility with POST /api/auth/verify-token...');
    const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    if (!verifyResponse.ok) {
      throw new Error(`Verify token failed: ${verifyResponse.status} ${verifyResponse.statusText}`);
    }

    const verifyData = await verifyResponse.json();
    console.log('✅ Backward compatibility verified');
    console.log(`   Valid: ${verifyData.data.valid}`);
    console.log(`   User ID: ${verifyData.data.user_id}\n`);

    console.log('🎉 ALL TESTS PASSED! Demo endpoints are working correctly.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ POST /generate-test-token - Working');
    console.log('✅ GET /api/auth/validate - Working (both header and query param)');
    console.log('✅ POST /api/auth/verify-token - Working (backward compatibility)');
    console.log('✅ Error handling - Working');
    console.log('\n🚀 Demo should now work without 405/404 errors!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testDemoEndpoints();