#!/usr/bin/env node

/**
 * Generate a test JWT token for upload testing
 */

import { generateAccessToken } from './utils/jwt.js';
import { config } from 'dotenv';

// Load environment variables
config();

// Create a test user object
const testUser = {
  id: '896a9378-15ff-43ac-825a-0c1e84ba5c6b',
  email: 'test@example.com',
  username: 'testuser',
  subscription_tier: 'founder'
};

// Generate token using the proper utility
const token = generateAccessToken(testUser);

console.log('Generated test JWT token:');
console.log(token);
console.log('\nUser object:');
console.log(JSON.stringify(testUser, null, 2));