#!/usr/bin/env node

/**
 * Generate Fresh JWT Token for Testing
 * This script generates a new JWT token with extended expiration for development testing
 */

import { config } from 'dotenv';
import { generateTokenPair } from './utils/jwt.js';

// Load environment variables
config({ path: '.env.development' });

// Mock user data for testing
const testUser = {
  id: '896a9378-15ff-43ac-825a-0c1e84ba5c6b',
  email: 'test@example.com',
  username: 'testuser',
  subscription_tier: 'founder',
  is_active: true
};

try {
  console.log('🔑 Generating fresh JWT tokens...\n');
  
  // Generate new token pair
  const tokens = generateTokenPair(testUser);
  
  console.log('✅ New JWT Tokens Generated:\n');
  console.log('📋 Access Token (4 hours):', tokens.accessToken);
  console.log('\n📋 Refresh Token (30 days):', tokens.refreshToken);
  
  console.log('\n🔧 Token Details:');
  console.log(`   • Expires In: ${tokens.expiresIn}`);
  console.log(`   • Token Type: ${tokens.tokenType}`);
  console.log(`   • User ID: ${testUser.id}`);
  console.log(`   • Email: ${testUser.email}`);
  console.log(`   • Subscription: ${testUser.subscription_tier}`);
  
  console.log('\n📝 To use this token:');
  console.log('1. Copy the Access Token above');
  console.log('2. Open browser-upload-test.html');
  console.log('3. Paste the token in the JWT Token field');
  console.log('4. Click "Update Token" and "Check Auth"');
  
  console.log('\n🌐 Server Status:');
  console.log('   Make sure the server is running: npm run dev:server');
  
} catch (error) {
  console.error('❌ Error generating tokens:', error.message);
  process.exit(1);
}