/**
 * Unit Tests for Users Table Feature - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.2-users-table.md
 * Test Coverage: User model validation, password hashing, and database operations
 * 
 * Test Framework: Vitest (Jest-compatible)
 * Dependencies: bcrypt, pg (PostgreSQL)
 * 
 * @author QA Engineer
 * @date 2025-08-14
 * @version 1.0
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';
import { performance } from 'perf_hooks';

import User from '../../models/User.js';
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
  getUserById,
  updateUser,
  updateUserPassword,
  softDeleteUser,
  restoreUser,
  updateLastActive,
  updateLastLogin
} from '../../db/queries/users.js';
import { query, getClient } from '../../db/connection.js';

// Test configuration
const TEST_DB_PREFIX = 'test_';
const TEST_TIMEOUT = 10000; // 10 seconds for database operations

// Test data fixtures
const validUserData = {
  email: 'testuser@example.com',
  username: 'testuser123',
  password: 'TestPass123!',
  first_name: 'Test',
  last_name: 'User',
  timezone: 'America/New_York',
  trading_experience: 'beginner',
  subscription_tier: 'founder'
};

const invalidUserData = {
  invalidEmail: 'not-an-email',
  invalidUsername: 'ab', // too short
  weakPassword: '123', // too weak
  longEmail: 'a'.repeat(260) + '@example.com',
  longUsername: 'a'.repeat(60),
  invalidTradingExperience: 'expert',
  invalidSubscriptionTier: 'premium'
};

// Helper functions
function generateUniqueEmail() {
  return `test${Date.now()}${Math.random().toString(36).substr(2, 5)}@example.com`;
}

function generateUniqueUsername() {
  return `testuser${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
}

async function createTestUser(overrides = {}) {
  const userData = {
    ...validUserData,
    email: generateUniqueEmail(),
    username: generateUniqueUsername(),
    ...overrides
  };
  return await createUser(userData);
}

async function cleanupTestUsers() {
  try {
    await query(`DELETE FROM users WHERE email LIKE '%@example.com' OR username LIKE 'testuser%'`);
  } catch (error) {
    console.warn('Cleanup error (non-critical):', error.message);
  }
}

// Test Suite Setup
beforeAll(async () => {
  console.log('🧪 Setting up Users Table Unit Tests...');
  await cleanupTestUsers();
}, TEST_TIMEOUT);

afterAll(async () => {
  console.log('🧹 Cleaning up test data...');
  await cleanupTestUsers();
}, TEST_TIMEOUT);

beforeEach(async () => {
  // Clear any test data before each test
  await cleanupTestUsers();
});

afterEach(async () => {
  // Optional: Clean up after each test for isolation
});

describe('User Model Validation Tests', () => {
  
  describe('Password Security Tests', () => {
    
    test('TC-1.1.1.2-001: Bcrypt password hashing with work factor 12', async () => {
      const password = 'TestPass123!';
      const startTime = performance.now();
      
      const hash = await User.hashPassword(password);
      
      const endTime = performance.now();
      const hashTime = endTime - startTime;
      
      // Verify hash format and work factor
      expect(hash).toMatch(/^\$2[aby]\$12\$.{53}$/);
      expect(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$') || hash.startsWith('$2y$12$')).toBe(true);
      
      // Verify timing is within acceptable range (250-500ms)
      expect(hashTime).toBeGreaterThanOrEqual(200); // Allow some variance
      expect(hashTime).toBeLessThanOrEqual(1000); // Allow for slower test environments
      
      // Verify hash length (bcrypt hashes are 60 characters)
      expect(hash).toHaveLength(60);
    });

    test('TC-1.1.1.2-002: Password verification against hash', async () => {
      const password = 'TestPass123!';
      const wrongPassword = 'WrongPass456!';
      
      const hash = await User.hashPassword(password);
      
      // Test correct password
      const correctResult = await User.verifyPassword(password, hash);
      expect(correctResult).toBe(true);
      
      // Test incorrect password
      const incorrectResult = await User.verifyPassword(wrongPassword, hash);
      expect(incorrectResult).toBe(false);
      
      // Test with null/undefined
      const nullResult = await User.verifyPassword(null, hash);
      expect(nullResult).toBe(false);
      
      const undefinedResult = await User.verifyPassword(password, null);
      expect(undefinedResult).toBe(false);
    });

    test('TC-1.1.1.2-003: Password validation requirements', async () => {
      const strongPasswords = [
        'TestPass123!',
        'MyStr0ng$Pass',
        'Secure#2025',
        '8CharsOk!'
      ];
      
      const weakPasswords = [
        'short', // too short
        'nouppercase123!', // no uppercase
        'NOLOWERCASE123!', // no lowercase
        'NoNumbers!', // no numbers
        'NoSpecialChars123', // no special characters
        '', // empty
        'OnlyLettersHere' // missing numbers and special chars
      ];
      
      // Test strong passwords
      strongPasswords.forEach(password => {
        expect(User.validatePassword(password)).toBe(true);
      });
      
      // Test weak passwords
      weakPasswords.forEach(password => {
        expect(User.validatePassword(password)).toBe(false);
      });
    });

    test('TC-1.1.1.2-004: Password hashing error handling', async () => {
      const invalidInputs = [null, undefined, '', ' '.repeat(8)];
      
      for (const input of invalidInputs) {
        await expect(User.hashPassword(input)).rejects.toThrow();
      }
    });

  });

  describe('Input Validation Tests', () => {
    
    test('TC-1.1.1.2-005: Email validation with valid formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name+tag@domain.co.uk',
        'x@y.z',
        'email@subdomain.example.com',
        'firstname+lastname@example.com',
        'email@123.123.123.123', // IP address (technically valid)
        'test-email@domain-name.com',
        '1234567890@example.com'
      ];
      
      validEmails.forEach(email => {
        expect(User.validateEmail(email)).toBe(true);
      });
    });

    test('TC-1.1.1.2-006: Email validation with invalid formats', () => {
      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'missing@domain',
        'spaces @domain.com',
        'double@@domain.com',
        'ending.dot.@domain.com',
        '',
        null,
        undefined,
        'a'.repeat(250) + '@example.com' // too long
      ];
      
      invalidEmails.forEach(email => {
        expect(User.validateEmail(email)).toBe(false);
      });
    });

    test('TC-1.1.1.2-007: Username validation with valid formats', () => {
      const validUsernames = [
        'abc', // minimum length
        'user123',
        'test_user',
        'Username_With_Underscores',
        'a'.repeat(50), // maximum length
        '123456',
        'user_123_test'
      ];
      
      validUsernames.forEach(username => {
        expect(User.validateUsername(username)).toBe(true);
      });
    });

    test('TC-1.1.1.2-008: Username validation with invalid formats', () => {
      const invalidUsernames = [
        'ab', // too short
        'a'.repeat(51), // too long
        'user-name', // hyphen not allowed
        'user name', // space not allowed
        'user@name', // @ not allowed
        'user.name', // dot not allowed
        '',
        null,
        undefined,
        'user#name', // special chars not allowed
        'user!name'
      ];
      
      invalidUsernames.forEach(username => {
        expect(User.validateUsername(username)).toBe(false);
      });
    });

    test('TC-1.1.1.2-009: First name validation', () => {
      const validNames = [
        'John',
        "O'Connor",
        'Jean-Pierre',
        'Mary Jane',
        'José',
        null, // optional field
        undefined,
        ''
      ];
      
      const invalidNames = [
        'John123', // numbers not allowed
        'John@Doe', // special chars not allowed
        'a'.repeat(101), // too long
        'John$', // invalid special char
      ];
      
      validNames.forEach(name => {
        expect(User.validateFirstName(name)).toBe(true);
      });
      
      invalidNames.forEach(name => {
        expect(User.validateFirstName(name)).toBe(false);
      });
    });

    test('TC-1.1.1.2-010: Last name validation', () => {
      const validNames = [
        'Doe',
        "O'Connor", 
        'van der Berg',
        'Smith-Jones',
        null, // optional field
        undefined,
        ''
      ];
      
      const invalidNames = [
        'Doe123',
        'Doe@Email',
        'a'.repeat(101), // too long
        'Doe#'
      ];
      
      validNames.forEach(name => {
        expect(User.validateLastName(name)).toBe(true);
      });
      
      invalidNames.forEach(name => {
        expect(User.validateLastName(name)).toBe(false);
      });
    });

  });

  describe('Business Rule Validation Tests', () => {
    
    test('TC-1.1.1.2-011: Trading experience validation', () => {
      const validLevels = ['beginner', 'intermediate', 'advanced', 'professional', null, undefined];
      const invalidLevels = ['expert', 'novice', 'master', '', 'BEGINNER', 'Intermediate'];
      
      validLevels.forEach(level => {
        expect(User.validateTradingExperience(level)).toBe(true);
      });
      
      invalidLevels.forEach(level => {
        expect(User.validateTradingExperience(level)).toBe(false);
      });
    });

    test('TC-1.1.1.2-012: Subscription tier validation', () => {
      const validTiers = ['free', 'beta', 'founder', 'pro', null, undefined];
      const invalidTiers = ['premium', 'basic', 'enterprise', '', 'FREE', 'Pro'];
      
      validTiers.forEach(tier => {
        expect(User.validateSubscriptionTier(tier)).toBe(true);
      });
      
      invalidTiers.forEach(tier => {
        expect(User.validateSubscriptionTier(tier)).toBe(false);
      });
    });

    test('TC-1.1.1.2-013: Timezone validation', () => {
      const validTimezones = [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'UTC',
        null, // will default
        undefined
      ];
      
      const invalidTimezones = [
        'Invalid/Timezone',
        'EST',
        'GMT+5',
        'America/NonExistent'
      ];
      
      validTimezones.forEach(timezone => {
        expect(User.validateTimezone(timezone)).toBe(true);
      });
      
      invalidTimezones.forEach(timezone => {
        expect(User.validateTimezone(timezone)).toBe(false);
      });
    });

    test('TC-1.1.1.2-014: Avatar URL validation', () => {
      const validUrls = [
        'https://example.com/avatar.jpg',
        'http://localhost:3000/image.png',
        'https://cdn.example.com/avatars/user123.gif',
        null,
        undefined
      ];
      
      const userData = { ...validUserData };
      
      // Test valid URLs
      validUrls.forEach(url => {
        userData.avatar_url = url;
        const validation = User.validate(userData);
        if (url) {
          // Only test URL validation if URL is provided
          expect(() => new URL(url)).not.toThrow();
        }
        expect(validation.isValid).toBe(true);
      });
      
      // Test invalid URLs
      userData.avatar_url = 'not-a-url';
      const invalidValidation = User.validate(userData);
      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.errors).toContain('Avatar URL is not a valid URL');
    });

  });

  describe('User Model Instance Methods', () => {
    
    test('TC-1.1.1.2-015: User model constructor with valid data', () => {
      const testData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        trading_experience: 'beginner',
        subscription_tier: 'founder',
        is_active: true,
        email_verified: false
      };
      
      const user = new User(testData);
      
      expect(user.id).toBe(testData.id);
      expect(user.email).toBe(testData.email);
      expect(user.username).toBe(testData.username);
      expect(user.firstName).toBe(testData.first_name);
      expect(user.lastName).toBe(testData.last_name);
      expect(user.tradingExperience).toBe(testData.trading_experience);
      expect(user.subscriptionTier).toBe(testData.subscription_tier);
      expect(user.isActive).toBe(testData.is_active);
      expect(user.emailVerified).toBe(testData.email_verified);
      
      // Test defaults
      expect(user.timezone).toBe('America/New_York');
    });

    test('TC-1.1.1.2-016: toDatabaseObject method', () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User'
      });
      
      const dbObject = user.toDatabaseObject();
      
      expect(dbObject.email).toBe('test@example.com');
      expect(dbObject.username).toBe('testuser');
      expect(dbObject.first_name).toBe('Test');
      expect(dbObject.last_name).toBe('User');
      expect(dbObject.timezone).toBe('America/New_York');
      expect(dbObject.subscription_tier).toBe('founder');
      
      // Check that all expected database fields are present
      const expectedFields = [
        'id', 'email', 'username', 'password_hash', 'first_name', 'last_name',
        'avatar_url', 'timezone', 'trading_experience', 'subscription_tier',
        'is_active', 'email_verified', 'last_login', 'last_active',
        'created_at', 'updated_at', 'deleted_at'
      ];
      
      expectedFields.forEach(field => {
        expect(dbObject.hasOwnProperty(field)).toBe(true);
      });
    });

    test('TC-1.1.1.2-017: toPublicObject method (security)', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User'
      });
      
      // Set a password hash
      await user.setPassword('TestPass123!');
      
      const publicObject = user.toPublicObject();
      
      // Verify sensitive data is excluded
      expect(publicObject.password_hash).toBeUndefined();
      expect(publicObject.passwordHash).toBeUndefined();
      
      // Verify public data is included
      expect(publicObject.email).toBe('test@example.com');
      expect(publicObject.username).toBe('testuser');
      expect(publicObject.first_name).toBe('Test');
      expect(publicObject.last_name).toBe('User');
    });

    test('TC-1.1.1.2-018: isActiveUser method', () => {
      // Active user
      const activeUser = new User({
        is_active: true,
        deleted_at: null
      });
      expect(activeUser.isActiveUser()).toBe(true);
      
      // Inactive user
      const inactiveUser = new User({
        is_active: false,
        deleted_at: null
      });
      expect(inactiveUser.isActiveUser()).toBe(false);
      
      // Soft deleted user
      const deletedUser = new User({
        is_active: true,
        deleted_at: new Date()
      });
      expect(deletedUser.isActiveUser()).toBe(false);
    });

    test('TC-1.1.1.2-019: hasCompleteProfile method', () => {
      // Complete profile
      const completeUser = new User({
        first_name: 'Test',
        last_name: 'User',
        trading_experience: 'beginner'
      });
      expect(completeUser.hasCompleteProfile()).toBe(true);
      
      // Incomplete profile - missing first name
      const incompleteUser1 = new User({
        last_name: 'User',
        trading_experience: 'beginner'
      });
      expect(incompleteUser1.hasCompleteProfile()).toBe(false);
      
      // Incomplete profile - missing trading experience
      const incompleteUser2 = new User({
        first_name: 'Test',
        last_name: 'User'
      });
      expect(incompleteUser2.hasCompleteProfile()).toBe(false);
    });

    test('TC-1.1.1.2-020: getDisplayName method', () => {
      // User with full name
      const userWithName = new User({
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User'
      });
      expect(userWithName.getDisplayName()).toBe('Test User');
      
      // User without full name
      const userWithoutName = new User({
        username: 'testuser'
      });
      expect(userWithoutName.getDisplayName()).toBe('testuser');
      
      // User with only first name
      const userPartialName = new User({
        username: 'testuser',
        first_name: 'Test'
      });
      expect(userPartialName.getDisplayName()).toBe('testuser');
    });

  });

});

describe('Database Operations Tests', () => {
  
  describe('User Creation Tests', () => {
    
    test('TC-1.1.1.2-021: Create user with valid data', async () => {
      const userData = {
        email: generateUniqueEmail(),
        username: generateUniqueUsername(),
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User',
        trading_experience: 'beginner',
        subscription_tier: 'founder'
      };
      
      const createdUser = await createUser(userData);
      
      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.username).toBe(userData.username);
      expect(createdUser.first_name).toBe(userData.first_name);
      expect(createdUser.last_name).toBe(userData.last_name);
      expect(createdUser.trading_experience).toBe(userData.trading_experience);
      expect(createdUser.subscription_tier).toBe(userData.subscription_tier);
      expect(createdUser.is_active).toBe(true);
      expect(createdUser.email_verified).toBe(false);
      expect(createdUser.created_at).toBeDefined();
      
      // Verify password is not in response
      expect(createdUser.password).toBeUndefined();
      expect(createdUser.password_hash).toBeUndefined();
    });

    test('TC-1.1.1.2-022: Create user with duplicate email', async () => {
      const email = generateUniqueEmail();
      
      // Create first user
      await createTestUser({ email });
      
      // Try to create second user with same email
      await expect(createTestUser({ email })).rejects.toThrow(/email.*already registered/i);
    });

    test('TC-1.1.1.2-023: Create user with duplicate username', async () => {
      const username = generateUniqueUsername();
      
      // Create first user
      await createTestUser({ username });
      
      // Try to create second user with same username
      await expect(createTestUser({ username })).rejects.toThrow(/username.*already taken/i);
    });

    test('TC-1.1.1.2-024: Create user with missing required fields', async () => {
      // Missing email
      await expect(createUser({
        username: generateUniqueUsername(),
        password: 'TestPass123!'
      })).rejects.toThrow(/validation failed/i);
      
      // Missing username
      await expect(createUser({
        email: generateUniqueEmail(),
        password: 'TestPass123!'
      })).rejects.toThrow(/validation failed/i);
      
      // Missing password
      await expect(createUser({
        email: generateUniqueEmail(),
        username: generateUniqueUsername()
      })).rejects.toThrow(/password is required/i);
    });

    test('TC-1.1.1.2-025: Create user with invalid field values', async () => {
      // Invalid email
      await expect(createUser({
        email: 'invalid-email',
        username: generateUniqueUsername(),
        password: 'TestPass123!'
      })).rejects.toThrow(/validation failed/i);
      
      // Invalid username
      await expect(createUser({
        email: generateUniqueEmail(),
        username: 'ab', // too short
        password: 'TestPass123!'
      })).rejects.toThrow(/validation failed/i);
    });

  });

  describe('User Lookup Tests', () => {
    
    test('TC-1.1.1.2-026: Find user by email (existing)', async () => {
      const testUser = await createTestUser();
      
      const foundUser = await findUserByEmail(testUser.email);
      
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(testUser.email);
      expect(foundUser.username).toBe(testUser.username);
      expect(foundUser.password_hash).toBeUndefined(); // Should not include hash
    });

    test('TC-1.1.1.2-027: Find user by email (non-existing)', async () => {
      const foundUser = await findUserByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });

    test('TC-1.1.1.2-028: Find user by email with hash (for auth)', async () => {
      const testUser = await createTestUser();
      
      const foundUser = await findUserByEmail(testUser.email, true);
      
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(testUser.email);
      expect(foundUser.password_hash).toBeDefined(); // Should include hash for auth
      expect(foundUser.password_hash).toMatch(/^\$2[aby]\$12\$/); // Bcrypt format
    });

    test('TC-1.1.1.2-029: Find user by username (existing)', async () => {
      const testUser = await createTestUser();
      
      const foundUser = await findUserByUsername(testUser.username);
      
      expect(foundUser).toBeDefined();
      expect(foundUser.username).toBe(testUser.username);
      expect(foundUser.email).toBe(testUser.email);
    });

    test('TC-1.1.1.2-030: Find user by username (non-existing)', async () => {
      const foundUser = await findUserByUsername('nonexistentuser');
      expect(foundUser).toBeNull();
    });

    test('TC-1.1.1.2-031: Get user by ID (existing active)', async () => {
      const testUser = await createTestUser();
      
      const foundUser = await getUserById(testUser.id);
      
      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(testUser.id);
      expect(foundUser.email).toBe(testUser.email);
    });

    test('TC-1.1.1.2-032: Get user by ID (soft deleted)', async () => {
      const testUser = await createTestUser();
      
      // Soft delete the user
      await softDeleteUser(testUser.id);
      
      // Should not find user with activeOnly=true (default)
      const foundUser = await getUserById(testUser.id, true);
      expect(foundUser).toBeNull();
      
      // Should find user with activeOnly=false
      const foundDeletedUser = await getUserById(testUser.id, false);
      expect(foundDeletedUser).toBeDefined();
      expect(foundDeletedUser.deleted_at).toBeDefined();
    });

  });

  describe('User Update Tests', () => {
    
    test('TC-1.1.1.2-033: Update user profile valid fields', async () => {
      const testUser = await createTestUser();
      
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        trading_experience: 'intermediate'
      };
      
      const updatedUser = await updateUser(testUser.id, updateData);
      
      expect(updatedUser.first_name).toBe('Updated');
      expect(updatedUser.last_name).toBe('Name');
      expect(updatedUser.trading_experience).toBe('intermediate');
      expect(updatedUser.updated_at).toBeDefined();
      expect(new Date(updatedUser.updated_at).getTime()).toBeGreaterThan(new Date(testUser.updated_at).getTime());
    });

    test('TC-1.1.1.2-034: Update user with invalid data', async () => {
      const testUser = await createTestUser();
      
      await expect(updateUser(testUser.id, {
        email: 'invalid-email-format'
      })).rejects.toThrow(/validation failed/i);
      
      await expect(updateUser(testUser.id, {
        trading_experience: 'invalid-level'
      })).rejects.toThrow(/validation failed/i);
    });

    test('TC-1.1.1.2-035: Update user email to existing email', async () => {
      const testUser1 = await createTestUser();
      const testUser2 = await createTestUser();
      
      await expect(updateUser(testUser1.id, {
        email: testUser2.email
      })).rejects.toThrow(/email.*already in use/i);
    });

    test('TC-1.1.1.2-036: Update user password with valid password', async () => {
      const testUser = await createTestUser();
      const newPassword = 'NewPass456!';
      
      const result = await updateUserPassword(testUser.id, newPassword);
      expect(result).toBe(true);
      
      // Verify we can authenticate with new password
      const userWithHash = await findUserByEmail(testUser.email, true);
      const isValid = await User.verifyPassword(newPassword, userWithHash.password_hash);
      expect(isValid).toBe(true);
    });

    test('TC-1.1.1.2-037: Update user password with weak password', async () => {
      const testUser = await createTestUser();
      const weakPassword = '123';
      
      await expect(updateUserPassword(testUser.id, weakPassword)).rejects.toThrow(/password does not meet security requirements/i);
    });

  });

  describe('Soft Delete Tests', () => {
    
    test('TC-1.1.1.2-038: Soft delete existing user', async () => {
      const testUser = await createTestUser();
      
      const result = await softDeleteUser(testUser.id);
      expect(result).toBe(true);
      
      // Verify user is marked as deleted
      const deletedUser = await getUserById(testUser.id, false);
      expect(deletedUser.deleted_at).toBeDefined();
      expect(deletedUser.is_active).toBe(false);
    });

    test('TC-1.1.1.2-039: Soft delete already deleted user', async () => {
      const testUser = await createTestUser();
      
      // Delete user once
      await softDeleteUser(testUser.id);
      
      // Try to delete again
      await expect(softDeleteUser(testUser.id)).rejects.toThrow(/already deleted/i);
    });

    test('TC-1.1.1.2-040: Restore soft deleted user', async () => {
      const testUser = await createTestUser();
      
      // Soft delete user
      await softDeleteUser(testUser.id);
      
      // Restore user
      const result = await restoreUser(testUser.id);
      expect(result).toBe(true);
      
      // Verify user is restored
      const restoredUser = await getUserById(testUser.id);
      expect(restoredUser).toBeDefined();
      expect(restoredUser.is_active).toBe(true);
      expect(restoredUser.deleted_at).toBeNull();
    });

  });

  describe('Activity Tracking Tests', () => {
    
    test('TC-1.1.1.2-041: Update last active timestamp', async () => {
      const testUser = await createTestUser();
      const originalLastActive = testUser.last_active;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = await updateLastActive(testUser.id);
      expect(result).toBe(true);
      
      // Verify timestamp was updated
      const updatedUser = await getUserById(testUser.id);
      expect(new Date(updatedUser.last_active).getTime()).toBeGreaterThan(new Date(originalLastActive).getTime());
    });

    test('TC-1.1.1.2-042: Update last login timestamp', async () => {
      const testUser = await createTestUser();
      
      const result = await updateLastLogin(testUser.id);
      expect(result).toBe(true);
      
      // Verify both last_login and last_active were updated
      const updatedUser = await getUserById(testUser.id);
      expect(updatedUser.last_login).toBeDefined();
      expect(updatedUser.last_active).toBeDefined();
    });

  });

});

// Additional helper tests for comprehensive coverage
describe('Edge Cases and Error Handling', () => {
  
  test('Database connection error handling', async () => {
    // This test would require mocking database connection failures
    // For now, we'll test that functions throw appropriate errors with invalid inputs
    
    await expect(getUserById('')).rejects.toThrow(/user id is required/i);
    await expect(updateUser(null, {})).rejects.toThrow(/user id is required/i);
    await expect(findUserByEmail('')).rejects.toThrow(/valid email address is required/i);
  });

  test('Large data handling', async () => {
    const userData = {
      email: generateUniqueEmail(),
      username: generateUniqueUsername(),
      password: 'TestPass123!',
      first_name: 'A'.repeat(100), // Max length
      last_name: 'B'.repeat(100),  // Max length
      timezone: 'America/New_York'
    };
    
    const user = await createUser(userData);
    expect(user.first_name).toBe(userData.first_name);
    expect(user.last_name).toBe(userData.last_name);
  });

  test('UUID format validation', async () => {
    const testUser = await createTestUser();
    
    // Verify UUID format (version 4)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(testUser.id).toMatch(uuidRegex);
  });

  test('Case sensitivity handling', async () => {
    const email = 'Test@Example.com';
    const username = 'TestUser';
    
    const testUser = await createTestUser({ email, username });
    
    // Verify email and username are stored in lowercase
    expect(testUser.email).toBe(email.toLowerCase());
    expect(testUser.username).toBe(username.toLowerCase());
    
    // Verify we can find user with different case
    const foundUser = await findUserByEmail('TEST@EXAMPLE.COM');
    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe(testUser.email);
  });

});

console.log('✅ Users Table Unit Tests Suite Loaded - 42 Test Cases');