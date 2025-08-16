/**
 * User Registration API Endpoint - Elite Trading Coach AI
 * Task: BE-006 - User registration endpoint with JWT token
 * Created: 2025-08-14
 * 
 * POST endpoint for user registration with input validation, password strength checking,
 * secure password hashing, and JWT token generation on successful registration.
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { createUser, findUserByEmail, findUserByUsername } from '../../db/queries/users.js';
import { generateTokenPair } from '../../utils/jwt.js';
import User from '../../models/User.js';

const router = express.Router();

// Rate limiting for registration attempts
const registerRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window per IP
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again in 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for failed attempts
const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 failed attempts per hour per IP
  skip: (req) => req.registrationSuccess === true,
  message: {
    success: false,
    error: 'Too many failed registration attempts. Please try again in 1 hour.',
    code: 'STRICT_RATE_LIMIT'
  }
});

/**
 * Validate registration input data
 * @param {Object} userData - Registration data
 * @returns {Object} Validation result
 */
function validateRegistrationData(userData) {
  const errors = [];
    
  // Required fields
  if (!userData.email) {
    errors.push('Email is required');
  } else if (!User.validateEmail(userData.email)) {
    errors.push('Please provide a valid email address');
  }
    
  if (!userData.username) {
    errors.push('Username is required');
  } else if (!User.validateUsername(userData.username)) {
    errors.push('Username must be 3-50 characters, letters, numbers, and underscores only');
  }
    
  if (!userData.password) {
    errors.push('Password is required');
  } else if (!User.validatePassword(userData.password)) {
    errors.push('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
  }
    
  // Optional fields validation
  if (userData.first_name && !User.validateFirstName(userData.first_name)) {
    errors.push('First name contains invalid characters');
  }
    
  if (userData.last_name && !User.validateLastName(userData.last_name)) {
    errors.push('Last name contains invalid characters');
  }
    
  if (userData.timezone && !User.validateTimezone(userData.timezone)) {
    errors.push('Invalid timezone specified');
  }
    
  if (userData.trading_experience && !User.validateTradingExperience(userData.trading_experience)) {
    errors.push('Invalid trading experience level');
  }
    
  if (userData.subscription_tier && !User.validateSubscriptionTier(userData.subscription_tier)) {
    errors.push('Invalid subscription tier');
  }
    
  // Password confirmation check
  if (userData.password && userData.confirmPassword && userData.password !== userData.confirmPassword) {
    errors.push('Passwords do not match');
  }
    
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check for existing user conflicts
 * @param {string} email - User email
 * @param {string} username - Username
 * @returns {Promise<Object>} Conflict check result
 */
async function checkUserConflicts(email, username) {
  const conflicts = [];
    
  try {
    // Check email conflict
    const existingEmail = await findUserByEmail(email.toLowerCase());
    if (existingEmail) {
      conflicts.push('Email address is already registered');
    }
        
    // Check username conflict
    const existingUsername = await findUserByUsername(username.toLowerCase());
    if (existingUsername) {
      conflicts.push('Username is already taken');
    }
        
    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  } catch (error) {
    console.error('User conflict check error:', error);
    throw new Error('Unable to verify user uniqueness');
  }
}

/**
 * Sanitize user input data
 * @param {Object} userData - Raw user input
 * @returns {Object} Sanitized user data
 */
function sanitizeUserData(userData) {
  return {
    email: userData.email?.trim().toLowerCase(),
    username: userData.username?.trim().toLowerCase(),
    password: userData.password, // Don't trim password (preserve spaces if intentional)
    first_name: userData.first_name?.trim() || null,
    last_name: userData.last_name?.trim() || null,
    timezone: userData.timezone || 'America/New_York',
    trading_experience: userData.trading_experience || null,
    subscription_tier: userData.subscription_tier || 'founder', // Default to founder for MVP
    avatar_url: userData.avatar_url?.trim() || null
  };
}

/**
 * POST /api/users/register
 * Register a new user account
 */
router.post('/register', registerRateLimit, strictRateLimit, async (req, res) => {
  let registrationSuccess = false;
    
  try {
    console.log('Registration attempt:', {
      email: req.body.email,
      username: req.body.username,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
        
    // Validate input data
    const validation = validateRegistrationData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
        code: 'VALIDATION_ERROR'
      });
    }
        
    // Sanitize input data
    const userData = sanitizeUserData(req.body);
        
    // Check for existing users
    const conflictCheck = await checkUserConflicts(userData.email, userData.username);
    if (conflictCheck.hasConflicts) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        details: conflictCheck.conflicts,
        code: 'USER_EXISTS'
      });
    }
        
    // Create new user
    const newUser = await createUser(userData);
        
    // Generate JWT tokens
    const tokens = generateTokenPair(newUser);
        
    // Registration successful
    registrationSuccess = true;
    req.registrationSuccess = true;
        
    console.log('User registered successfully:', {
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username
    });
        
    // Return success response with tokens
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          timezone: newUser.timezone,
          trading_experience: newUser.trading_experience,
          subscription_tier: newUser.subscription_tier,
          is_active: newUser.is_active,
          email_verified: newUser.email_verified,
          created_at: newUser.created_at
        },
        tokens: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_type: tokens.tokenType,
          expires_in: tokens.expiresIn
        }
      }
    });
        
  } catch (error) {
    console.error('Registration error:', error);
        
    // Handle specific error types
    if (error.message.includes('already registered')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'USER_EXISTS'
      });
    } else if (error.message.includes('Validation failed')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'VALIDATION_ERROR'
      });
    } else if (error.message.includes('Password does not meet')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'PASSWORD_WEAK'
      });
    } else {
      // Generic server error
      res.status(500).json({
        success: false,
        error: 'Registration failed. Please try again.',
        code: 'REGISTRATION_FAILED',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
});

/**
 * GET /api/users/register/check-availability
 * Check if email/username is available
 */
router.get('/check-availability', async (req, res) => {
  try {
    const { email, username } = req.query;
        
    if (!email && !username) {
      return res.status(400).json({
        success: false,
        error: 'Email or username parameter is required',
        code: 'MISSING_PARAMETERS'
      });
    }
        
    const availability = {
      email: null,
      username: null
    };
        
    // Check email availability
    if (email) {
      if (!User.validateEmail(email)) {
        availability.email = { available: false, reason: 'Invalid email format' };
      } else {
        const existingEmail = await findUserByEmail(email.toLowerCase());
        availability.email = {
          available: !existingEmail,
          reason: existingEmail ? 'Email already registered' : 'Email available'
        };
      }
    }
        
    // Check username availability
    if (username) {
      if (!User.validateUsername(username)) {
        availability.username = { available: false, reason: 'Invalid username format' };
      } else {
        const existingUsername = await findUserByUsername(username.toLowerCase());
        availability.username = {
          available: !existingUsername,
          reason: existingUsername ? 'Username already taken' : 'Username available'
        };
      }
    }
        
    res.json({
      success: true,
      data: availability
    });
        
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to check availability',
      code: 'AVAILABILITY_CHECK_FAILED'
    });
  }
});

/**
 * GET /api/users/register/password-strength
 * Check password strength requirements
 */
router.post('/password-strength', (req, res) => {
  try {
    const { password } = req.body;
        
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required',
        code: 'MISSING_PASSWORD'
      });
    }
        
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };
        
    const isStrong = Object.values(checks).every(check => check);
        
    res.json({
      success: true,
      data: {
        is_strong: isStrong,
        checks: {
          'At least 8 characters': checks.length,
          'At least one uppercase letter': checks.uppercase,
          'At least one lowercase letter': checks.lowercase,
          'At least one number': checks.number,
          'At least one special character (@$!%*?&)': checks.special
        },
        score: Object.values(checks).filter(Boolean).length
      }
    });
        
  } catch (error) {
    console.error('Password strength check error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to check password strength',
      code: 'PASSWORD_CHECK_FAILED'
    });
  }
});

export default router;