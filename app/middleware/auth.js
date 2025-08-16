/**
 * Authentication Middleware - Elite Trading Coach AI
 * Task: BE-006, BE-007, BE-008 - Authentication middleware
 * Created: 2025-08-14
 * 
 * Implements JWT-based authentication middleware with proper error handling,
 * rate limiting considerations, and security best practices.
 */

import { verifyToken, extractTokenFromHeader, isTokenBlacklisted } from '../utils/jwt.js';
import { getUserById, updateLastActive } from '../db/queries/users.js';

/**
 * Authentication middleware - verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function authenticateToken(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'TOKEN_MISSING',
        timestamp: new Date().toISOString(),
        retryable: false,
        guidance: 'Please provide valid authentication credentials'
      });
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        error: 'Token has been revoked',
        code: 'TOKEN_REVOKED',
        timestamp: new Date().toISOString(),
        retryable: false,
        guidance: 'Please login again to get a new access token'
      });
    }

    // Verify token
    const decoded = verifyToken(token, 'access');
        
    // Get user data from database
    const user = await getUserById(decoded.sub);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString(),
        retryable: false,
        guidance: 'Please login again with valid credentials'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'User account is inactive',
        code: 'USER_INACTIVE',
        timestamp: new Date().toISOString(),
        retryable: false,
        guidance: 'Please contact support to reactivate your account'
      });
    }

    // Attach user and token info to request
    req.user = user;
    req.token = {
      raw: token,
      decoded: decoded
    };

    // Update last active timestamp (async, don't wait)
    updateLastActive(user.id).catch(error => {
      console.warn('Failed to update last active:', error.message);
    });

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
        
    // Return appropriate error based on error type
    if (error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString(),
        guidance: 'Please login again to get a new access token'
      });
    } else if (error.message.includes('Invalid token')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'TOKEN_INVALID',
        timestamp: new Date().toISOString(),
        guidance: 'Please provide a valid authentication token'
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
        timestamp: new Date().toISOString(),
        guidance: 'Please check your authentication credentials'
      });
    }
  }
}

/**
 * Optional authentication middleware - authenticate if token present, but don't require
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function optionalAuthentication(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      // If token is present, verify it
      const decoded = verifyToken(token, 'access');
      const user = await getUserById(decoded.sub);
            
      if (user && user.is_active && !isTokenBlacklisted(token)) {
        req.user = user;
        req.token = {
          raw: token,
          decoded: decoded
        };
                
        // Update last active (async)
        updateLastActive(user.id).catch(() => {});
      }
    }

    next();
  } catch (error) {
    // For optional auth, continue without user if token is invalid
    console.warn('Optional authentication failed:', error.message);
    next();
  }
}

/**
 * Role-based authorization middleware
 * @param {Array|string} allowedRoles - Allowed subscription tiers or roles
 * @returns {Function} Express middleware function
 */
export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        timestamp: new Date().toISOString(),
        guidance: 'Please provide valid authentication credentials'
      });
    }

    const userRole = req.user.subscription_tier;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: userRole,
        timestamp: new Date().toISOString(),
        guidance: 'You do not have permission to access this resource'
      });
    }

    next();
  };
}

/**
 * Email verification requirement middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function requireEmailVerification(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    });
  }

  next();
}

/**
 * Admin authentication middleware (founder and pro tiers)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const adminTiers = ['founder', 'pro'];
  if (!adminTiers.includes(req.user.subscription_tier)) {
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
}

/**
 * Self-access authorization - users can only access their own resources
 * @param {string} userIdParam - Name of the URL parameter containing user ID
 * @returns {Function} Express middleware function
 */
export function requireSelfAccess(userIdParam = 'userId') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const requestedUserId = req.params[userIdParam];
    const authenticatedUserId = req.user.id;

    // Allow admins to access any user's resources
    const adminTiers = ['founder', 'pro'];
    if (adminTiers.includes(req.user.subscription_tier)) {
      return next();
    }

    // Check if user is accessing their own resource
    if (requestedUserId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - can only access your own resources',
        code: 'SELF_ACCESS_REQUIRED'
      });
    }

    next();
  };
}

/**
 * API key authentication middleware (for external integrations)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
      code: 'API_KEY_MISSING'
    });
  }

  // In production, validate API key against database
  // For now, use environment variable for demonstration
  const validApiKey = process.env.API_KEY;
    
  if (!validApiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      code: 'API_KEY_INVALID'
    });
  }

  // Set API authentication flag
  req.apiAuthenticated = true;
  next();
}

/**
 * Rate limiting authentication bypass for premium users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function premiumRateLimitBypass(req, res, next) {
  if (req.user) {
    const premiumTiers = ['founder', 'pro'];
    if (premiumTiers.includes(req.user.subscription_tier)) {
      // Mark request as premium for rate limiter
      req.isPremiumUser = true;
    }
  }
  next();
}

/**
 * Token refresh middleware - automatically refresh near-expiry tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function autoTokenRefresh(req, res, next) {
  try {
    if (req.token && req.token.decoded) {
      const { exp } = req.token.decoded;
      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpiry = exp - currentTime;
            
      // If token expires within 5 minutes, include refresh info in response
      if (timeToExpiry < 300) { // 5 minutes
        res.set('X-Token-Refresh-Needed', 'true');
        res.set('X-Token-Expires-In', timeToExpiry.toString());
      }
    }
        
    next();
  } catch (error) {
    console.warn('Auto token refresh check failed:', error.message);
    next();
  }
}

/**
 * Security headers middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function securityHeaders(req, res, next) {
  // Set security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
    
  next();
}