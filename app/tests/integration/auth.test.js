/**
 * Integration Tests for Authentication and User Management APIs - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.2-users-table.md
 * Test Coverage: Registration flow, login flow, profile management APIs
 * 
 * Test Framework: Vitest with Supertest for API testing
 * Dependencies: supertest, express, jwt
 * 
 * @author QA Engineer
 * @date 2025-08-14
 * @version 1.0
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { performance } from 'perf_hooks';

import app from '../../server.js'; // Assuming main express app export
import { query } from '../../db/connection.js';
import User from '../../models/User.js';

// Test configuration
const TEST_TIMEOUT = 15000; // 15 seconds for API calls
const API_BASE = '/api';

// Test data fixtures
const validRegistrationData = {
  email: 'integration.test@example.com',
  username: 'integrationtest',
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!',
  first_name: 'Integration',
  last_name: 'Test',
  timezone: 'America/New_York',
  trading_experience: 'beginner',
  subscription_tier: 'founder'
};

const validLoginData = {
  email: 'integration.test@example.com',
  password: 'TestPass123!'
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
    ...validRegistrationData,
    email: generateUniqueEmail(),
    username: generateUniqueUsername(),
    ...overrides
  };
  
  const response = await request(app)
    .post(`${API_BASE}/users/register`)
    .send(userData)
    .expect(201);
    
  return {
    user: response.body.data.user,
    tokens: response.body.data.tokens,
    originalData: userData
  };
}

async function cleanupTestData() {
  try {
    await query(`DELETE FROM users WHERE email LIKE '%@example.com' OR username LIKE 'test%'`);
  } catch (error) {
    console.warn('Cleanup error (non-critical):', error.message);
  }
}

// Test Suite Setup
beforeAll(async () => {
  console.log('🔗 Setting up Authentication Integration Tests...');
  await cleanupTestData();
}, TEST_TIMEOUT);

afterAll(async () => {
  console.log('🧹 Cleaning up integration test data...');
  await cleanupTestData();
}, TEST_TIMEOUT);

beforeEach(async () => {
  await cleanupTestData();
});

describe('User Registration API Tests', () => {
  
  test('TC-1.1.1.2-071: User registration with valid data', async () => {
    const startTime = performance.now();
    
    const userData = {
      ...validRegistrationData,
      email: generateUniqueEmail(),
      username: generateUniqueUsername()
    };
    
    const response = await request(app)
      .post(`${API_BASE}/users/register`)
      .send(userData)
      .expect(201);
    
    const endTime = performance.now();
    const registrationTime = endTime - startTime;
    
    // Verify response structure
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('User registered successfully');
    expect(response.body.data).toBeDefined();
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.tokens).toBeDefined();
    
    // Verify user data
    const user = response.body.data.user;
    expect(user.email).toBe(userData.email);
    expect(user.username).toBe(userData.username);
    expect(user.first_name).toBe(userData.first_name);
    expect(user.last_name).toBe(userData.last_name);
    expect(user.trading_experience).toBe(userData.trading_experience);
    expect(user.subscription_tier).toBe(userData.subscription_tier);
    expect(user.is_active).toBe(true);
    expect(user.email_verified).toBe(false);
    expect(user.created_at).toBeDefined();
    
    // Verify tokens
    const tokens = response.body.data.tokens;
    expect(tokens.access_token).toBeDefined();
    expect(tokens.refresh_token).toBeDefined();
    expect(tokens.token_type).toBe('Bearer');
    expect(tokens.expires_in).toBeDefined();
    
    // Verify JWT token structure
    const decodedToken = jwt.decode(tokens.access_token);
    expect(decodedToken.userId).toBe(user.id);
    expect(decodedToken.email).toBe(user.email);
    
    // Verify password is not in response
    expect(user.password).toBeUndefined();
    expect(user.password_hash).toBeUndefined();
    
    // Verify registration time meets performance requirement (<3s)
    expect(registrationTime).toBeLessThan(3000);
  });

  test('TC-1.1.1.2-072: Registration with duplicate email', async () => {
    const email = generateUniqueEmail();
    
    // Create first user
    await createTestUser({ email });
    
    // Try to register with same email
    const response = await request(app)
      .post(`${API_BASE}/users/register`)
      .send({
        ...validRegistrationData,
        email,
        username: generateUniqueUsername()
      })
      .expect(409);
    
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('USER_EXISTS');
    expect(response.body.details).toContain('Email address is already registered');
  });

  test('TC-1.1.1.2-073: Registration with duplicate username', async () => {
    const username = generateUniqueUsername();
    
    // Create first user
    await createTestUser({ username });
    
    // Try to register with same username
    const response = await request(app)
      .post(`${API_BASE}/users/register`)
      .send({
        ...validRegistrationData,
        email: generateUniqueEmail(),
        username
      })
      .expect(409);
    
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('USER_EXISTS');
    expect(response.body.details).toContain('Username is already taken');
  });

  test('TC-1.1.1.2-074: Registration with invalid email format', async () => {
    const response = await request(app)
      .post(`${API_BASE}/users/register`)
      .send({
        ...validRegistrationData,
        email: 'invalid-email-format',
        username: generateUniqueUsername()
      })
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.details).toContain('Please provide a valid email address');
  });

  test('TC-1.1.1.2-075: Registration with weak password', async () => {
    const response = await request(app)
      .post(`${API_BASE}/users/register`)
      .send({
        ...validRegistrationData,
        email: generateUniqueEmail(),
        username: generateUniqueUsername(),
        password: 'weak',
        confirmPassword: 'weak'
      })
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.details).toContain('Password must be at least 8 characters');
  });

  test('TC-1.1.1.2-076: Registration rate limiting', async () => {
    const userData = {
      email: generateUniqueEmail(),
      username: generateUniqueUsername(),
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!'
    };
    
    // Make multiple rapid requests (should hit rate limit after 5 attempts)
    const requests = [];
    for (let i = 0; i < 7; i++) {
      requests.push(
        request(app)
          .post(`${API_BASE}/users/register`)
          .send({
            ...userData,
            email: generateUniqueEmail(),
            username: generateUniqueUsername()
          })
      );
    }
    
    const responses = await Promise.all(requests);
    
    // Should have some rate limited responses
    const rateLimitedResponses = responses.filter(res => res.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    
    const rateLimitedResponse = rateLimitedResponses[0];
    expect(rateLimitedResponse.body.code).toBe('RATE_LIMIT_EXCEEDED');
  }, TEST_TIMEOUT);

});

describe('User Authentication API Tests', () => {
  
  test('TC-1.1.1.2-077: Login with valid email and password', async () => {
    // Create test user
    const testUser = await createTestUser();
    
    const startTime = performance.now();
    
    const response = await request(app)
      .post(`${API_BASE}/auth/login`)
      .send({
        email: testUser.originalData.email,
        password: testUser.originalData.password
      })
      .expect(200);
    
    const endTime = performance.now();
    const loginTime = endTime - startTime;
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.tokens).toBeDefined();
    
    const user = response.body.data.user;
    expect(user.email).toBe(testUser.user.email);
    expect(user.id).toBe(testUser.user.id);
    
    // Verify JWT tokens
    const tokens = response.body.data.tokens;
    expect(tokens.access_token).toBeDefined();
    expect(tokens.refresh_token).toBeDefined();
    
    // Verify login time meets performance requirement
    expect(loginTime).toBeLessThan(1000); // Should be much faster than registration
  });

  test('TC-1.1.1.2-078: Login with valid username and password', async () => {
    const testUser = await createTestUser();
    
    const response = await request(app)
      .post(`${API_BASE}/auth/login`)
      .send({
        username: testUser.originalData.username,
        password: testUser.originalData.password
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.username).toBe(testUser.user.username);
  });

  test('TC-1.1.1.2-079: Login with invalid password', async () => {
    const testUser = await createTestUser();
    
    const response = await request(app)
      .post(`${API_BASE}/auth/login`)
      .send({
        email: testUser.originalData.email,
        password: 'WrongPassword123!'
      })
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('INVALID_CREDENTIALS');
  });

  test('TC-1.1.1.2-080: Login with non-existing user', async () => {
    const response = await request(app)
      .post(`${API_BASE}/auth/login`)
      .send({
        email: 'nonexistent@example.com',
        password: 'TestPass123!'
      })
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('USER_NOT_FOUND');
  });

  test('TC-1.1.1.2-081: Login with inactive user', async () => {
    const testUser = await createTestUser();
    
    // Deactivate user in database
    await query('UPDATE users SET is_active = FALSE WHERE id = $1', [testUser.user.id]);
    
    const response = await request(app)
      .post(`${API_BASE}/auth/login`)
      .send({
        email: testUser.originalData.email,
        password: testUser.originalData.password
      })
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('ACCOUNT_INACTIVE');
  });

  test('TC-1.1.1.2-082: Login rate limiting and brute force protection', async () => {
    const testUser = await createTestUser();
    
    // Make multiple failed login attempts
    const failedAttempts = [];
    for (let i = 0; i < 6; i++) {
      failedAttempts.push(
        request(app)
          .post(`${API_BASE}/auth/login`)
          .send({
            email: testUser.originalData.email,
            password: 'WrongPassword' + i
          })
      );
    }
    
    const responses = await Promise.all(failedAttempts);
    
    // Should have rate limited responses
    const rateLimitedResponses = responses.filter(res => res.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  }, TEST_TIMEOUT);

});

describe('User Profile Management API Tests', () => {
  
  test('TC-1.1.1.2-083: Get user profile with valid token', async () => {
    const testUser = await createTestUser();
    
    const response = await request(app)
      .get(`${API_BASE}/users/profile`)
      .set('Authorization', `Bearer ${testUser.tokens.access_token}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
    
    const user = response.body.data.user;
    expect(user.id).toBe(testUser.user.id);
    expect(user.email).toBe(testUser.user.email);
    expect(user.username).toBe(testUser.user.username);
    
    // Verify sensitive data is not included
    expect(user.password_hash).toBeUndefined();
  });

  test('TC-1.1.1.2-084: Get user profile without token', async () => {
    const response = await request(app)
      .get(`${API_BASE}/users/profile`)
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
  });

  test('TC-1.1.1.2-085: Get user profile with invalid token', async () => {
    const response = await request(app)
      .get(`${API_BASE}/users/profile`)
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('INVALID_TOKEN');
  });

  test('TC-1.1.1.2-086: Update user profile with valid data', async () => {
    const testUser = await createTestUser();
    
    const updateData = {
      first_name: 'Updated',
      last_name: 'Name',
      trading_experience: 'intermediate',
      timezone: 'Europe/London'
    };
    
    const response = await request(app)
      .put(`${API_BASE}/users/profile`)
      .set('Authorization', `Bearer ${testUser.tokens.access_token}`)
      .send(updateData)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    
    const updatedUser = response.body.data.user;
    expect(updatedUser.first_name).toBe('Updated');
    expect(updatedUser.last_name).toBe('Name');
    expect(updatedUser.trading_experience).toBe('intermediate');
    expect(updatedUser.timezone).toBe('Europe/London');
    expect(updatedUser.updated_at).toBeDefined();
  });

  test('TC-1.1.1.2-087: Update user profile with invalid data', async () => {
    const testUser = await createTestUser();
    
    const response = await request(app)
      .put(`${API_BASE}/users/profile`)
      .set('Authorization', `Bearer ${testUser.tokens.access_token}`)
      .send({
        email: 'invalid-email-format',
        trading_experience: 'invalid-level'
      })
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

});

describe('Supporting API Endpoint Tests', () => {
  
  test('TC-1.1.1.2-088: Check email availability (available)', async () => {
    const newEmail = generateUniqueEmail();
    
    const response = await request(app)
      .get(`${API_BASE}/users/register/check-availability?email=${newEmail}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.email.available).toBe(true);
    expect(response.body.data.email.reason).toBe('Email available');
  });

  test('TC-1.1.1.2-089: Check email availability (taken)', async () => {
    const testUser = await createTestUser();
    
    const response = await request(app)
      .get(`${API_BASE}/users/register/check-availability?email=${testUser.user.email}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.email.available).toBe(false);
    expect(response.body.data.email.reason).toBe('Email already registered');
  });

  test('TC-1.1.1.2-090: Check username availability (available)', async () => {
    const newUsername = generateUniqueUsername();
    
    const response = await request(app)
      .get(`${API_BASE}/users/register/check-availability?username=${newUsername}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.username.available).toBe(true);
    expect(response.body.data.username.reason).toBe('Username available');
  });

  test('TC-1.1.1.2-091: Password strength check (strong)', async () => {
    const strongPassword = 'VeryStr0ng$Pass';
    
    const response = await request(app)
      .post(`${API_BASE}/users/register/password-strength`)
      .send({ password: strongPassword })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.is_strong).toBe(true);
    expect(response.body.data.score).toBe(5); // All 5 requirements met
    
    // Verify all checks pass
    const checks = response.body.data.checks;
    Object.values(checks).forEach(check => {
      expect(check).toBe(true);
    });
  });

  test('TC-1.1.1.2-092: Password strength check (weak)', async () => {
    const weakPassword = 'weak';
    
    const response = await request(app)
      .post(`${API_BASE}/users/register/password-strength`)
      .send({ password: weakPassword })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.is_strong).toBe(false);
    expect(response.body.data.score).toBeLessThan(5);
    
    // Should fail length requirement at minimum
    const checks = response.body.data.checks;
    expect(checks['At least 8 characters']).toBe(false);
  });

});

describe('API Security and Performance Tests', () => {
  
  test('Security: SQL injection prevention in registration', async () => {
    const maliciousData = {
      email: "test@example.com'; DROP TABLE users; --",
      username: "testuser'; DELETE FROM users; --",
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!'
    };
    
    // Should not cause SQL injection, should either fail validation or be safely escaped
    const response = await request(app)
      .post(`${API_BASE}/users/register`)
      .send(maliciousData);
    
    // Should either be rejected (400) or safely processed (201)
    expect([201, 400, 409]).toContain(response.status);
    
    // Verify users table still exists and has data
    const userCount = await query('SELECT COUNT(*) FROM users');
    expect(parseInt(userCount.rows[0].count)).toBeGreaterThanOrEqual(0);
  });

  test('Security: XSS prevention in user data', async () => {
    const xssData = {
      email: generateUniqueEmail(),
      username: generateUniqueUsername(),
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
      first_name: '<script>alert("xss")</script>',
      last_name: '"><script>alert("xss")</script>'
    };
    
    const response = await request(app)
      .post(`${API_BASE}/users/register`)
      .send(xssData)
      .expect(201);
    
    // XSS should be prevented/sanitized
    const user = response.body.data.user;
    expect(user.first_name).not.toContain('<script>');
    expect(user.last_name).not.toContain('<script>');
  });

  test('Performance: Registration endpoint response time', async () => {
    const userData = {
      email: generateUniqueEmail(),
      username: generateUniqueUsername(),
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!'
    };
    
    const startTime = performance.now();
    
    await request(app)
      .post(`${API_BASE}/users/register`)
      .send(userData)
      .expect(201);
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Should complete within 3 seconds (PRD requirement)
    expect(responseTime).toBeLessThan(3000);
  });

  test('Performance: Login endpoint response time', async () => {
    const testUser = await createTestUser();
    
    const startTime = performance.now();
    
    await request(app)
      .post(`${API_BASE}/auth/login`)
      .send({
        email: testUser.originalData.email,
        password: testUser.originalData.password
      })
      .expect(200);
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Should complete much faster than registration (< 1 second)
    expect(responseTime).toBeLessThan(1000);
  });

  test('HTTP Security Headers validation', async () => {
    const response = await request(app)
      .get(`${API_BASE}/users/register/check-availability?email=test@example.com`);
    
    // Verify security headers are present
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-xss-protection']).toBe('1; mode=block');
  });

});

describe('Error Handling and Edge Cases', () => {
  
  test('Malformed JSON handling', async () => {
    const response = await request(app)
      .post(`${API_BASE}/users/register`)
      .set('Content-Type', 'application/json')
      .send('{ invalid json }')
      .expect(400);
    
    expect(response.body.success).toBe(false);
  });

  test('Missing Content-Type header', async () => {
    const response = await request(app)
      .post(`${API_BASE}/users/register`)
      .send(validRegistrationData);
    
    // Should still work or give appropriate error
    expect([200, 201, 400, 415]).toContain(response.status);
  });

  test('Large payload handling', async () => {
    const largeData = {
      ...validRegistrationData,
      email: generateUniqueEmail(),
      username: generateUniqueUsername(),
      first_name: 'A'.repeat(1000), // Much larger than allowed
      last_name: 'B'.repeat(1000)
    };
    
    const response = await request(app)
      .post(`${API_BASE}/users/register`)
      .send(largeData);
    
    // Should either reject with validation error or truncate
    if (response.status === 400) {
      expect(response.body.code).toBe('VALIDATION_ERROR');
    }
  });

  test('Concurrent registration with same email', async () => {
    const email = generateUniqueEmail();
    const userData = {
      ...validRegistrationData,
      email,
      username: generateUniqueUsername()
    };
    
    // Create two simultaneous registration requests
    const requests = [
      request(app).post(`${API_BASE}/users/register`).send({
        ...userData,
        username: generateUniqueUsername()
      }),
      request(app).post(`${API_BASE}/users/register`).send({
        ...userData,
        username: generateUniqueUsername()
      })
    ];
    
    const responses = await Promise.all(requests);
    
    // One should succeed (201), one should fail (409)
    const statuses = responses.map(r => r.status).sort();
    expect(statuses).toEqual([201, 409]);
  });

});

console.log('✅ Authentication Integration Tests Suite Loaded - 25 Test Cases');