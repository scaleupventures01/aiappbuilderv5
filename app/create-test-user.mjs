#!/usr/bin/env node

/**
 * Create a test user for upload testing
 */

import { query } from './db/connection.js';
import User from './models/User.js';

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    const testUserData = {
      id: '12345678-1234-1234-1234-123456789012',
      email: 'test@example.com',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      subscription_tier: 'founder',
      is_active: true,
      email_verified: true
    };

    // Create password hash
    const passwordHash = await User.hashPassword('TestPassword123!');
    testUserData.password_hash = passwordHash;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE id = $1 OR email = $2',
      [testUserData.id, testUserData.email]
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ Test user already exists');
      return;
    }

    // Create user
    const result = await query(`
      INSERT INTO users (
        id, email, username, password_hash, first_name, last_name,
        subscription_tier, is_active, email_verified, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
      ) RETURNING id, email, username
    `, [
      testUserData.id,
      testUserData.email,
      testUserData.username,
      testUserData.password_hash,
      testUserData.first_name,
      testUserData.last_name,
      testUserData.subscription_tier,
      testUserData.is_active,
      testUserData.email_verified
    ]);

    console.log('✅ Test user created successfully:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
    process.exit(1);
  }
}

createTestUser().catch(console.error);