#!/usr/bin/env node

/**
 * Debug authentication issue
 */

import { generateAccessToken, verifyToken, extractTokenFromHeader } from './utils/jwt.js';
import { getUserById } from './db/queries/users.js';

async function debugAuth() {
  console.log('🔍 Debugging Authentication Flow...');
  
  const testUser = {
    id: '896a9378-15ff-43ac-825a-0c1e84ba5c6b',
    email: 'test@example.com',
    username: 'testuser'
  };
  
  // Step 1: Generate token
  console.log('\n1. Generating token...');
  const token = generateAccessToken(testUser);
  console.log('✅ Token generated:', token.slice(0, 50) + '...');
  
  // Step 2: Create auth header
  const authHeader = `Bearer ${token}`;
  console.log('\n2. Auth header created');
  
  // Step 3: Extract token
  console.log('\n3. Extracting token from header...');
  const extractedToken = extractTokenFromHeader(authHeader);
  console.log('✅ Token extracted successfully');
  
  // Step 4: Verify token
  console.log('\n4. Verifying token...');
  try {
    const decoded = verifyToken(extractedToken, 'access');
    console.log('✅ Token verified successfully');
    console.log('  - User ID:', decoded.sub);
    console.log('  - Expiry:', new Date(decoded.exp * 1000).toISOString());
    console.log('  - Now:', new Date().toISOString());
    console.log('  - Valid for:', Math.round((decoded.exp * 1000 - Date.now()) / 1000), 'seconds');
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    return;
  }
  
  // Step 5: Get user
  console.log('\n5. Getting user from database...');
  try {
    const user = await getUserById(testUser.id);
    if (user) {
      console.log('✅ User found:', user.email);
      console.log('  - Active:', user.is_active);
      console.log('  - Verified:', user.email_verified);
    } else {
      console.log('❌ User not found');
      return;
    }
  } catch (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log('\n🎉 All authentication steps should work!');
  console.log('\n🧪 Testing with fetch...');
  
  // Test with actual API
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('http://localhost:3002/api/upload/images', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: true })
    });
    
    const result = await response.json();
    console.log('API Response Status:', response.status);
    console.log('API Response:', result);
    
  } catch (error) {
    console.log('❌ API test error:', error.message);
  }
}

debugAuth().catch(console.error);