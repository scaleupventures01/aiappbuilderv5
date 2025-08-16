#!/usr/bin/env node

/**
 * Debug what JWT secret the server is actually using
 */

import { config } from 'dotenv';

// Load env files the same way as the server
config({ path: '.env' });
config({ path: '.env.development' });

console.log('🔧 Server JWT Debug');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Environment variables:');
console.log('  • NODE_ENV:', process.env.NODE_ENV);
console.log('  • JWT_SECRET (first 20 chars):', process.env.JWT_SECRET?.substring(0, 20) + '...');

// Try to import and see what the JWT utility actually uses
try {
  const { getJWTConfig } = await import('./utils/jwt.js');
  const jwtConfig = getJWTConfig();
  console.log('\nJWT Configuration from utils/jwt.js:');
  console.log('  • Access Token Expiry:', jwtConfig.accessTokenExpiry);
  console.log('  • Issuer:', jwtConfig.issuer);
  console.log('  • Audience:', jwtConfig.audience);
  console.log('  • Has Secret:', jwtConfig.hasSecret);
} catch (error) {
  console.error('Error loading JWT config:', error.message);
}
