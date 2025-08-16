/**
 * Rate Limiting Middleware - Elite Trading Coach AI
 * Tier-based rate limiting for different user subscription levels
 * Created: 2025-08-14
 */

import rateLimit from 'express-rate-limit';
import { ipKeyGenerator } from 'express-rate-limit';
import { serverConfig } from '../config/environment.js';

/**
 * Basic rate limiter for general API endpoints
 */
export const basicRateLimit = rateLimit({
  windowMs: serverConfig.rateLimiting.windowMs,
  max: serverConfig.rateLimiting.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil(serverConfig.rateLimiting.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || ipKeyGenerator(req);
  }
});

/**
 * Tier-based rate limiting middleware
 * Applies different limits based on user subscription tier
 */
export const tierBasedRateLimit = rateLimit({
  windowMs: serverConfig.rateLimiting.windowMs,
  max: (req) => {
    // Default to free tier if not authenticated or tier not found
    const userTier = req.user?.subscription_tier || 'free';
    const tierConfig = serverConfig.rateLimiting.tiers[userTier] || serverConfig.rateLimiting.tiers.free;
    
    return tierConfig.maxRequests;
  },
  message: (req) => {
    const userTier = req.user?.subscription_tier || 'free';
    const tierConfig = serverConfig.rateLimiting.tiers[userTier] || serverConfig.rateLimiting.tiers.free;
    
    return {
      success: false,
      error: `Rate limit exceeded for ${userTier} tier`,
      code: 'TIER_RATE_LIMIT_EXCEEDED',
      tier: userTier,
      limit: tierConfig.maxRequests,
      windowMs: serverConfig.rateLimiting.windowMs,
      retryAfter: Math.ceil(serverConfig.rateLimiting.windowMs / 1000),
      upgradeMessage: userTier === 'free' 
        ? 'Upgrade to Premium or Enterprise for higher rate limits' 
        : userTier === 'premium' 
        ? 'Upgrade to Enterprise for higher rate limits' 
        : null
    };
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userTier = req.user?.subscription_tier || 'free';
    return `${req.user?.id || ipKeyGenerator(req)}_${userTier}`;
  },
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user?.role === 'admin';
  }
});

/**
 * Authentication endpoints rate limiter
 * Stricter limits for login/register attempts
 */
export const authRateLimit = rateLimit({
  windowMs: serverConfig.rateLimiting.auth.windowMs,
  max: serverConfig.rateLimiting.auth.maxAttempts,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil(serverConfig.rateLimiting.auth.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Combine IP and email for more granular limiting
    const email = req.body?.email || 'unknown';
    return `${ipKeyGenerator(req)}_${email}`;
  },
  skipSuccessfulRequests: true // Only count failed attempts
});

/**
 * Message/Chat endpoints rate limiter
 * Prevents message spam
 */
export const messageRateLimit = rateLimit({
  windowMs: serverConfig.rateLimiting.messaging.windowMs,
  max: (req) => {
    const userTier = req.user?.subscription_tier || 'free';
    const baseLimit = serverConfig.rateLimiting.messaging.maxMessages;
    
    // Apply tier multipliers
    const tierMultipliers = {
      free: 1,
      premium: 2,
      enterprise: 5
    };
    
    return baseLimit * (tierMultipliers[userTier] || 1);
  },
  message: (req) => {
    const userTier = req.user?.subscription_tier || 'free';
    const baseLimit = serverConfig.rateLimiting.messaging.maxMessages;
    const tierMultipliers = { free: 1, premium: 2, enterprise: 5 };
    const limit = baseLimit * (tierMultipliers[userTier] || 1);
    
    return {
      success: false,
      error: 'Message rate limit exceeded',
      code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
      tier: userTier,
      limit: limit,
      windowMs: serverConfig.rateLimiting.messaging.windowMs,
      retryAfter: Math.ceil(serverConfig.rateLimiting.messaging.windowMs / 1000)
    };
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `messages_${req.user?.id || ipKeyGenerator(req)}`,
  skip: (req) => req.user?.role === 'admin'
});

/**
 * File upload rate limiter
 */
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    const userTier = req.user?.subscription_tier || 'free';
    const limits = {
      free: 5,
      premium: 20,
      enterprise: 100
    };
    
    return limits[userTier] || limits.free;
  },
  message: (req) => {
    const userTier = req.user?.subscription_tier || 'free';
    const limits = { free: 5, premium: 20, enterprise: 100 };
    
    return {
      success: false,
      error: 'Upload rate limit exceeded',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      tier: userTier,
      limit: limits[userTier] || limits.free,
      upgradeMessage: userTier === 'free' 
        ? 'Upgrade to Premium for more uploads' 
        : null
    };
  },
  keyGenerator: (req) => `uploads_${req.user?.id || ipKeyGenerator(req)}`,
  skip: (req) => req.user?.role === 'admin'
});

/**
 * Burst protection middleware
 * Prevents rapid-fire requests regardless of tier
 */
export const burstProtection = rateLimit({
  windowMs: 1000, // 1 second
  max: (req) => {
    const userTier = req.user?.subscription_tier || 'free';
    const tierConfig = serverConfig.rateLimiting.tiers[userTier] || serverConfig.rateLimiting.tiers.free;
    
    return tierConfig.burstLimit || 5;
  },
  message: {
    success: false,
    error: 'Too many requests in a short period',
    code: 'BURST_LIMIT_EXCEEDED',
    retryAfter: 1
  },
  keyGenerator: (req) => `burst_${req.user?.id || ipKeyGenerator(req)}`,
  skip: (req) => req.user?.role === 'admin'
});

/**
 * Dynamic rate limiter based on endpoint and user
 */
export const createDynamicRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    tierLimits = { free: 50, premium: 200, enterprise: 1000 },
    identifier = 'general',
    skipAdmin = true
  } = options;
  
  return rateLimit({
    windowMs,
    max: (req) => {
      const userTier = req.user?.subscription_tier || 'free';
      return tierLimits[userTier] || tierLimits.free;
    },
    message: (req) => {
      const userTier = req.user?.subscription_tier || 'free';
      return {
        success: false,
        error: `Rate limit exceeded for ${identifier}`,
        code: 'DYNAMIC_RATE_LIMIT_EXCEEDED',
        tier: userTier,
        limit: tierLimits[userTier] || tierLimits.free,
        identifier
      };
    },
    keyGenerator: (req) => `${identifier}_${req.user?.id || ipKeyGenerator(req)}_${req.user?.subscription_tier || 'free'}`,
    skip: skipAdmin ? (req) => req.user?.role === 'admin' : false
  });
};

/**
 * Rate limit headers middleware
 * Adds custom headers with tier information
 */
export const rateLimitHeaders = (req, res, next) => {
  if (req.user) {
    const userTier = req.user.subscription_tier || 'free';
    const tierConfig = serverConfig.rateLimiting.tiers[userTier];
    
    res.set({
      'X-User-Tier': userTier,
      'X-Tier-Limit': tierConfig?.maxRequests || 50,
      'X-Tier-Window': serverConfig.rateLimiting.windowMs
    });
  }
  
  next();
};

/**
 * Rate limit status endpoint
 * Allows users to check their current rate limit status
 */
export const rateLimitStatus = (req, res) => {
  const userTier = req.user?.subscription_tier || 'free';
  const tierConfig = serverConfig.rateLimiting.tiers[userTier] || serverConfig.rateLimiting.tiers.free;
  
  // In a real implementation, you'd track current usage
  // This is a simplified version
  res.json({
    success: true,
    data: {
      tier: userTier,
      limits: {
        requests: tierConfig.maxRequests,
        windowMs: serverConfig.rateLimiting.windowMs,
        burstLimit: tierConfig.burstLimit
      },
      specialLimits: {
        messaging: {
          limit: serverConfig.rateLimiting.messaging.maxMessages * (
            userTier === 'free' ? 1 : 
            userTier === 'premium' ? 2 : 5
          ),
          windowMs: serverConfig.rateLimiting.messaging.windowMs
        },
        uploads: {
          limit: userTier === 'free' ? 5 : userTier === 'premium' ? 20 : 100,
          windowMs: 15 * 60 * 1000
        }
      },
      upgradeOptions: userTier === 'free' 
        ? ['premium', 'enterprise'] 
        : userTier === 'premium' 
        ? ['enterprise'] 
        : []
    }
  });
};

/**
 * Error handler for rate limit exceeded
 */
export const rateLimitErrorHandler = (error, req, res, next) => {
  if (error.code === 'RATE_LIMITED') {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((error.resetTime - Date.now()) / 1000)
    });
  }
  
  next(error);
};

export default {
  basicRateLimit,
  tierBasedRateLimit,
  authRateLimit,
  messageRateLimit,
  uploadRateLimit,
  burstProtection,
  createDynamicRateLimit,
  rateLimitHeaders,
  rateLimitStatus,
  rateLimitErrorHandler
};