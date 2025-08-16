#!/usr/bin/env node

/**
 * Generate token using exact server environment loading
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables exactly like the server does
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
const envPath = path.resolve(process.cwd(), envFile);

// Load base .env file first
config();

// Then load environment-specific file (will override base settings)
config({ path: envPath });

console.log('🔧 Server Environment Token Generation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  • NODE_ENV:', process.env.NODE_ENV);
console.log('  • Env file path:', envPath);
console.log('  • JWT_SECRET (first 20):', process.env.JWT_SECRET?.substring(0, 20) + '...');

// Import JWT utilities after environment is loaded
const { generateAccessToken } = await import('./utils/jwt.js');

const TEST_USER = {
  id: '896a9378-15ff-43ac-825a-0c1e84ba5c6b',
  email: 'test@example.com',
  username: 'testuser',
  subscription_tier: 'founder'
};

try {
  const token = generateAccessToken(TEST_USER);
  console.log('\n✅ Token generated successfully:');
  console.log(token);
} catch (error) {
  console.error('\n❌ Token generation failed:', error.message);
}
