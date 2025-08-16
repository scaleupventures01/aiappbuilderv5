/**
 * Authentication/Login API Endpoint - Elite Trading Coach AI
 * Task: BE-007 - User login endpoint with JWT authentication
 * Created: 2025-08-14
 * 
 * POST endpoint for user authentication with email/username support,
 * password verification, JWT token generation, and comprehensive security measures.
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { findUserByEmail, findUserByUsername, updateLastLogin } from '../../db/queries/users.js';
import { generateTokenPair, verifyToken, extractTokenFromHeader, refreshAccessToken } from '../../utils/jwt.js';
import User from '../../models/User.js';

const router = express.Router();

// Rate limiting for login attempts
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for failed attempts
const failedLoginRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 failed attempts per hour per IP
  skip: (req) => req.loginSuccess === true,
  message: {
    success: false,
    error: 'Too many failed login attempts. Please try again in 1 hour.',
    code: 'STRICT_RATE_LIMIT'
  }
});

// Account lockout simulation (in production, use database or Redis)
const failedAttempts = new Map();
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Check if account is locked due to failed attempts
 * @param {string} identifier - Email or username
 * @returns {Object} Lock status and remaining time
 */
function checkAccountLockout(identifier) {
  const key = identifier.toLowerCase();
  const attempts = failedAttempts.get(key);
    
  if (!attempts) {
    return { locked: false, remainingTime: 0 };
  }
    
  if (attempts.count >= LOCKOUT_THRESHOLD) {
    const timeSinceLocked = Date.now() - attempts.lockedAt;
    if (timeSinceLocked < LOCKOUT_DURATION) {
      return {
        locked: true,
        remainingTime: Math.ceil((LOCKOUT_DURATION - timeSinceLocked) / 1000 / 60) // minutes
      };
    } else {
      // Lockout expired, reset attempts
      failedAttempts.delete(key);
      return { locked: false, remainingTime: 0 };
    }
  }
    
  return { locked: false, remainingTime: 0 };
}

/**
 * Record failed login attempt
 * @param {string} identifier - Email or username
 */
function recordFailedAttempt(identifier) {
  const key = identifier.toLowerCase();
  const attempts = failedAttempts.get(key) || { count: 0, lockedAt: null };
    
  attempts.count += 1;
    
  if (attempts.count >= LOCKOUT_THRESHOLD) {
    attempts.lockedAt = Date.now();
  }
    
  failedAttempts.set(key, attempts);
}

/**
 * Clear failed attempts on successful login
 * @param {string} identifier - Email or username
 */
function clearFailedAttempts(identifier) {
  const key = identifier.toLowerCase();
  failedAttempts.delete(key);
}

/**
 * Validate login input
 * @param {Object} loginData - Login credentials
 * @returns {Object} Validation result
 */
function validateLoginData(loginData) {
  const errors = [];
    
  if (!loginData.identifier) {
    errors.push('Email or username is required');
  }
    
  if (!loginData.password) {
    errors.push('Password is required');
  }
    
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Authenticate user with email or username
 * @param {string} identifier - Email or username
 * @param {string} password - User password
 * @returns {Promise<Object>} Authentication result
 */
async function authenticateUser(identifier, password) {
  try {
    let userData = null;
        
    // Try to find user by email first, then username
    if (identifier.includes('@')) {
      userData = await findUserByEmail(identifier, true); // Include password hash
    } else {
      userData = await findUserByUsername(identifier, true); // Include password hash
    }
        
    if (!userData) {
      throw new Error('Invalid credentials');
    }
        
    // Check if user is active
    if (!userData.is_active || userData.deleted_at) {
      throw new Error('Account is inactive or deleted');
    }
        
    // Verify password
    const passwordValid = await User.verifyPassword(password, userData.password_hash);
    if (!passwordValid) {
      throw new Error('Invalid credentials');
    }
        
    // Remove password hash from returned data
    const { password_hash, ...safeUserData } = userData;
        
    return {
      success: true,
      user: safeUserData
    };
        
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 */
router.post('/login', loginRateLimit, failedLoginRateLimit, async (req, res) => {
  let loginSuccess = false;
    
  try {
    const { identifier, password, remember_me = false } = req.body;
        
    console.log('Login attempt:', {
      identifier: identifier,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
        
    // Validate input
    const validation = validateLoginData({ identifier, password });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
        code: 'VALIDATION_ERROR'
      });
    }
        
    // Check account lockout
    const lockoutStatus = checkAccountLockout(identifier);
    if (lockoutStatus.locked) {
      return res.status(423).json({
        success: false,
        error: `Account temporarily locked due to too many failed attempts. Try again in ${lockoutStatus.remainingTime} minutes.`,
        code: 'ACCOUNT_LOCKED',
        retry_after: lockoutStatus.remainingTime * 60 // seconds
      });
    }
        
    // Authenticate user
    const authResult = await authenticateUser(identifier.trim(), password);
        
    if (!authResult.success) {
      // Record failed attempt
      recordFailedAttempt(identifier);
            
      return res.status(401).json({
        success: false,
        error: 'Invalid email/username or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
        
    const user = authResult.user;
        
    // Clear failed attempts on successful login
    clearFailedAttempts(identifier);
        
    // Generate JWT tokens
    const tokens = generateTokenPair(user);
        
    // Update last login timestamp
    await updateLastLogin(user.id);
        
    loginSuccess = true;
    req.loginSuccess = true;
        
    console.log('User logged in successfully:', {
      userId: user.id,
      email: user.email,
      username: user.username
    });
        
    // Set secure HTTP-only cookie for refresh token if remember_me is true
    if (remember_me) {
      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }
        
    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.avatar_url,
          timezone: user.timezone,
          trading_experience: user.trading_experience,
          subscription_tier: user.subscription_tier,
          is_active: user.is_active,
          email_verified: user.email_verified,
          last_login: user.last_login,
          created_at: user.created_at
        },
        tokens: {
          access_token: tokens.accessToken,
          refresh_token: remember_me ? null : tokens.refreshToken, // Don't return in response if stored in cookie
          token_type: tokens.tokenType,
          expires_in: tokens.expiresIn
        }
      }
    });
        
  } catch (error) {
    console.error('Login error:', error);
        
    // Record failed attempt for server errors too
    if (req.body.identifier) {
      recordFailedAttempt(req.body.identifier);
    }
        
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
      code: 'LOGIN_FAILED',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    let refreshToken = req.body.refresh_token;
        
    // If no token in body, check for HTTP-only cookie
    if (!refreshToken) {
      refreshToken = req.cookies.refresh_token;
    }
        
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token is required',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }
        
    // Import getUserById here to avoid circular imports
    const { getUserById } = await import('../../db/queries/users.js');
        
    // Refresh the token
    const tokens = await refreshAccessToken(refreshToken, getUserById);
        
    console.log('Token refreshed successfully');
        
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_type: tokens.tokenType,
          expires_in: tokens.expiresIn
        }
      }
    });
        
  } catch (error) {
    console.error('Token refresh error:', error);
        
    // Clear refresh token cookie if it exists
    res.clearCookie('refresh_token');
        
    if (error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token has expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    } else if (error.message.includes('Invalid token')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'REFRESH_TOKEN_INVALID'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Token refresh failed',
        code: 'TOKEN_REFRESH_FAILED'
      });
    }
  }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate tokens
 */
router.post('/logout', async (req, res) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
        
    if (token) {
      // In production, add token to blacklist in Redis/database
      // For now, we'll just log the logout
      const decoded = verifyToken(token, 'access');
      console.log('User logged out:', decoded.sub);
    }
        
    // Clear refresh token cookie
    res.clearCookie('refresh_token');
        
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
        
  } catch (error) {
    console.error('Logout error:', error);
        
    // Even if token verification fails, clear cookie and return success
    res.clearCookie('refresh_token');
        
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information (requires authentication)
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
        
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }
        
    // Verify token
    const decoded = verifyToken(token, 'access');
        
    // Get user data
    const { getUserById } = await import('../../db/queries/users.js');
    const user = await getUserById(decoded.sub);
        
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }
        
    res.json({
      success: true,
      data: {
        user: user
      }
    });
        
  } catch (error) {
    console.error('Get current user error:', error);
        
    if (error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.message.includes('Invalid token')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Unable to get user information',
        code: 'USER_INFO_FAILED'
      });
    }
  }
});

/**
 * POST /api/auth/verify-token
 * Verify if a token is valid
 */
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
        
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
        code: 'TOKEN_MISSING'
      });
    }
        
    // Verify token
    const decoded = verifyToken(token, 'access');
        
    res.json({
      success: true,
      data: {
        valid: true,
        expires_at: decoded.exp,
        user_id: decoded.sub
      }
    });
        
  } catch (error) {
    res.json({
      success: true,
      data: {
        valid: false,
        reason: error.message
      }
    });
  }
});

/**
 * GET /api/auth/validate
 * CRITICAL DEMO FIX: Alias for verify-token endpoint that demos expect
 * Validates token from Authorization header or query parameter
 */
router.get('/validate', async (req, res) => {
  try {
    // Extract token from Authorization header or query parameter
    let token = extractTokenFromHeader(req.headers.authorization);
    
    // If no header token, check query parameter
    if (!token && req.query.token) {
      token = req.query.token;
    }
        
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required in Authorization header or token query parameter',
        code: 'TOKEN_MISSING'
      });
    }
        
    // Verify token
    const decoded = verifyToken(token, 'access');
        
    console.log('Token validation successful via /api/auth/validate:', {
      userId: decoded.sub,
      email: decoded.email,
      timestamp: new Date().toISOString()
    });
        
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        valid: true,
        expires_at: decoded.exp,
        user_id: decoded.sub,
        email: decoded.email,
        username: decoded.username
      }
    });
        
  } catch (error) {
    console.log('Token validation failed via /api/auth/validate:', error.message);
    
    res.status(401).json({
      success: false,
      error: 'Token validation failed',
      data: {
        valid: false,
        reason: error.message
      }
    });
  }
});

export default router;