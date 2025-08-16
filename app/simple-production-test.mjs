#!/usr/bin/env node

/**
 * Simple Production Mode Test for PRD 1.2.10
 */

console.log('🚀 Testing Production Mode Configuration...\n');

// Test 1: Environment Variables
console.log('📋 Environment Configuration:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`USE_MOCK_OPENAI: ${process.env.USE_MOCK_OPENAI}`);
console.log(`Has OPENAI_API_KEY: ${!!process.env.OPENAI_API_KEY}`);
console.log(`API Key format: ${process.env.OPENAI_API_KEY ? (process.env.OPENAI_API_KEY.startsWith('sk-') ? 'Valid' : 'Invalid') : 'Missing'}`);

// Test 2: Check for exposed credentials in .env.development
import { readFileSync } from 'fs';

try {
  const envContent = readFileSync('.env.development', 'utf8');
  const hasRealApiKey = envContent.includes('sk-proj-') && !envContent.includes('sk-your-development-api-key-here');
  
  console.log(`\n🔒 Security Check (.env.development):`);
  console.log(`Has real API key: ${hasRealApiKey ? '❌ EXPOSED' : '✅ SECURE'}`);
  
  if (hasRealApiKey) {
    console.log('⚠️  CRITICAL: Real API key found in development environment file!');
  }
} catch (error) {
  console.log('\n🔒 Security Check: .env.development not found');
}

// Test 3: Production mode detection
try {
  const { productionValidator } = await import('./config/openai-production.js');
  
  console.log('\n🎯 Production Mode Detection:');
  
  // Current environment test
  const validation = productionValidator.validateProductionEnvironment();
  console.log(`Current mode: ${validation.mode}`);
  console.log(`Valid config: ${validation.valid}`);
  console.log(`Issues: ${validation.issues.length > 0 ? validation.issues.join(', ') : 'None'}`);
  console.log(`Warnings: ${validation.warnings.length > 0 ? validation.warnings.join(', ') : 'None'}`);
  
  // Test production mode enforcement
  const originalEnv = { ...process.env };
  
  // Test case: Production with mock mode
  process.env.NODE_ENV = 'production';
  process.env.USE_MOCK_OPENAI = 'true';
  
  try {
    productionValidator.isProductionMode();
    console.log('❌ FAILED: Should reject mock mode in production');
  } catch (error) {
    console.log('✅ PASSED: Correctly rejects mock mode in production');
  }
  
  // Restore environment
  process.env = { ...originalEnv };
  
} catch (error) {
  console.log('\n❌ Production module test failed:', error.message);
}

// Test 4: Health check endpoint (if server is running)
console.log('\n🏥 Health Check Test:');
try {
  const response = await fetch('http://localhost:3001/api/health');
  if (response.ok) {
    const health = await response.json();
    console.log(`Server status: ${health.status}`);
    console.log('✅ Server is running and responding');
  } else {
    console.log(`❌ Health check failed: ${response.status}`);
  }
} catch (error) {
  console.log('⚠️  Server not running or not accessible');
}

console.log('\n✅ Simple production test completed');