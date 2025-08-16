/**
 * Rate Limiting Middleware
 * Advanced rate limiting with different tiers and adaptive limits
 */

import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import { config } from '../lib/config.mjs';
import { logger, logSecurityEvent } from '../lib/logger.mjs';

// Redis client for distributed rate limiting
let redisClient;

if (config.redis.host) {
  redisClient = createClient({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    db: config.redis.database + 1 // Use different DB for rate limiting
  });
  
  redisClient.on('error', (err) => {
    logger.warn('Redis rate limiter connection error:', err);
  });
  
  redisClient.connect().catch(err => {
    logger.warn('Failed to connect Redis for rate limiting:', err);
  });
}

/**
 * Custom rate limit handler
 */
function rateLimitHandler(req, res, options) {
  const retryAfter = Math.ceil(options.windowMs / 1000);
  
  logSecurityEvent('rate_limit_exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    limit: options.max,
    windowMs: options.windowMs,
    retryAfter: retryAfter
  });
  
  res.status(429).json({
    error: 'Rate limit exceeded',
    message: `Too many requests from this IP. Limit: ${options.max} requests per ${Math.ceil(options.windowMs / 60000)} minutes.`,
    retryAfter: retryAfter,
    limit: options.max,
    windowMs: options.windowMs
  });
}

/**
 * Custom key generator that includes user ID if authenticated
 */
function generateKey(req) {
  // Include user ID in key if authenticated
  const userId = req.user?.id || req.jwtUser?.id;
  const baseKey = userId ? `user:${userId}` : `ip:${req.ip}`;
  
  return `${baseKey}:${req.route?.path || req.path}`;
}

/**
 * Skip rate limiting for certain conditions
 */
function skipRateLimit(req) {
  // Skip for health checks
  if (req.path === '/health' || req.path === '/api/health') {
    return true;
  }
  
  // Skip for internal requests (if you have a way to identify them)
  if (req.get('X-Internal-Request') === 'true') {
    return true;
  }
  
  return false;
}

/**
 * Global rate limiter - applies to all requests
 */
export const globalLimiter = rateLimit({
  windowMs: config.security.rateLimiting.windowMs, // 15 minutes
  max: config.security.rateLimiting.maxRequests, // 100 requests
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  keyGenerator: generateKey,
  handler: rateLimitHandler
});

/**
 * Authentication rate limiter - stricter limits for auth endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 authentication attempts
  skipSuccessfulRequests: true, // Don't count successful auth attempts
  skipFailedRequests: false, // Count failed attempts
  keyGenerator: (req) => `auth:${req.ip}`,
  handler: (req, res) => {
    logSecurityEvent('auth_rate_limit_exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      severity: 'high'
    });
    
    res.status(429).json({
      error: 'Authentication rate limit exceeded',
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      retryAfter: 900 // 15 minutes
    });
  }
});

/**
 * API rate limiter - for API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  skip: skipRateLimit
});

/**
 * Strict rate limiter - for sensitive operations
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  keyGenerator: generateKey,
  handler: (req, res) => {
    logSecurityEvent('strict_rate_limit_exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      severity: 'high'
    });
    
    res.status(429).json({
      error: 'Strict rate limit exceeded',
      message: 'This operation is limited to 5 requests per hour.',
      retryAfter: 3600 // 1 hour
    });
  }
});

/**
 * Registration rate limiter - for user registration
 */
export const registrationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 registrations per day per IP
  keyGenerator: (req) => `registration:${req.ip}`,
  handler: (req, res) => {
    logSecurityEvent('registration_rate_limit_exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium'
    });
    
    res.status(429).json({
      error: 'Registration rate limit exceeded',
      message: 'Maximum 3 account registrations per 24 hours from this IP.',
      retryAfter: 86400 // 24 hours
    });
  }
});

/**
 * Password reset rate limiter
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  keyGenerator: (req) => `password-reset:${req.ip}`,
  handler: (req, res) => {
    logSecurityEvent('password_reset_rate_limit_exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium'
    });
    
    res.status(429).json({
      error: 'Password reset rate limit exceeded',
      message: 'Maximum 3 password reset attempts per hour.',
      retryAfter: 3600 // 1 hour
    });
  }
});

/**
 * Dynamic rate limiter based on user behavior
 */
export function createAdaptiveLimiter(options = {}) {
  const {
    baseWindowMs = 15 * 60 * 1000, // 15 minutes
    baseMax = 100, // Base limit
    suspiciousThreshold = 0.8, // Threshold for suspicious behavior
    penaltyMultiplier = 0.5 // Reduce limit by 50% for suspicious users
  } = options;
  
  return rateLimit({
    windowMs: baseWindowMs,
    max: (req) => {
      // Check if user has suspicious behavior patterns
      const isSuspicious = checkSuspiciousActivity(req);
      
      if (isSuspicious) {
        logSecurityEvent('adaptive_rate_limit_applied', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          reason: 'Suspicious behavior detected'
        });
        
        return Math.floor(baseMax * penaltyMultiplier);
      }
      
      return baseMax;
    },
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    skip: skipRateLimit
  });
}

/**
 * Check for suspicious activity patterns
 */
function checkSuspiciousActivity(req) {
  // Check for common bot patterns in User-Agent
  const userAgent = req.get('User-Agent') || '';
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /requests/i
  ];
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    return true;
  }
  
  // Check for suspicious request patterns
  // (This could be enhanced with more sophisticated detection)
  
  // Check for missing common headers
  if (!req.get('Accept') || !req.get('Accept-Language')) {
    return true;
  }
  
  // Check for suspicious referrer patterns
  const referer = req.get('Referer');
  if (referer && referer.includes('spam') || referer.includes('bot')) {
    return true;
  }
  
  return false;
}

/**
 * Rate limit bypass for admin users (if needed)
 */
export function createAdminBypass(limiter) {
  return (req, res, next) => {
    // Check if user is admin (implement your admin check logic)
    if (req.user?.isAdmin || req.jwtUser?.isAdmin) {
      return next();
    }
    
    return limiter(req, res, next);
  };
}

/**
 * Get rate limit status for a key
 */
export async function getRateLimitStatus(key) {
  try {
    if (!redisClient) {
      return null;
    }
    
    const data = await redisClient.get(`rl:${key}`);
    if (!data) {
      return null;
    }
    
    const { count, resetTime } = JSON.parse(data);
    
    return {
      count,
      remaining: Math.max(0, 100 - count), // Assuming max of 100
      resetTime: new Date(resetTime),
      resetTimeRemaining: Math.max(0, resetTime - Date.now())
    };
    
  } catch (error) {
    logger.error('Error getting rate limit status:', error);
    return null;
  }
}

/**
 * Clear rate limit for a specific key (admin function)
 */
export async function clearRateLimit(key) {
  try {
    if (!redisClient) {
      return false;
    }
    
    await redisClient.del(`rl:${key}`);
    logger.info('Rate limit cleared for key:', { key });
    return true;
    
  } catch (error) {
    logger.error('Error clearing rate limit:', error);
    return false;
  }
}

export const rateLimiter = {
  global: globalLimiter,
  auth: authLimiter,
  api: apiLimiter,
  strict: strictLimiter,
  registration: registrationLimiter,
  passwordReset: passwordResetLimiter,
  adaptive: createAdaptiveLimiter,
  adminBypass: createAdminBypass,
  getStatus: getRateLimitStatus,
  clear: clearRateLimit
};

export default rateLimiter;