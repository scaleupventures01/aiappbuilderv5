/**
 * CORS Configuration Middleware - Elite Trading Coach AI
 * Advanced Cross-Origin Resource Sharing configuration with security hardening
 * Created: 2025-08-14
 * 
 * Features:
 * - Environment-specific origin whitelisting
 * - Dynamic origin validation with regex patterns
 * - Preflight request optimization with caching
 * - Security logging for CORS violations
 * - Support for development, staging, and production environments
 */

import cors from 'cors';

/**
 * Parse allowed origins from environment variable
 * Supports comma-separated list of origins
 */
const parseAllowedOrigins = () => {
  const originsEnv = process.env.ALLOWED_ORIGINS || '';
  
  // Default origins based on environment
  const defaultOrigins = {
    development: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ],
    staging: [
      'https://staging.elitetradingcoach.ai',
      'https://app-staging.elitetradingcoach.ai'
    ],
    production: [
      'https://elitetradingcoach.ai',
      'https://www.elitetradingcoach.ai',
      'https://app.elitetradingcoach.ai'
    ]
  };
  
  const env = process.env.NODE_ENV || 'development';
  
  // Parse custom origins from environment variable
  const customOrigins = originsEnv
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
  
  // Combine default and custom origins
  const allOrigins = [
    ...(defaultOrigins[env] || defaultOrigins.development),
    ...customOrigins
  ];
  
  // Remove duplicates
  return [...new Set(allOrigins)];
};

/**
 * Security logging for CORS events
 */
const logCorsEvent = (eventType, origin, allowed = false) => {
  const timestamp = new Date().toISOString();
  const logLevel = allowed ? 'info' : 'warn';
  
  const logMessage = {
    timestamp,
    eventType,
    origin,
    allowed,
    environment: process.env.NODE_ENV || 'development'
  };
  
  if (process.env.ENABLE_CORS_LOGGING === 'true') {
    console[logLevel]('[CORS]', JSON.stringify(logMessage));
  }
  
  // In production, you might want to send this to a monitoring service
  if (process.env.NODE_ENV === 'production' && !allowed) {
    // TODO: Send to monitoring service (e.g., Sentry, DataDog)
    console.warn('⚠️ CORS violation detected:', origin);
  }
};

/**
 * Dynamic origin validation function
 * Implements principle of least privilege
 */
const originValidator = (origin, callback) => {
  // Allow requests with no origin (same-origin requests, Postman, etc.)
  // Also allow 'null' origin for file:// protocol in development
  if (!origin || (origin === 'null' && process.env.NODE_ENV === 'development')) {
    logCorsEvent('no_origin_or_null', origin || 'undefined', true);
    return callback(null, true);
  }
  
  const allowedOrigins = parseAllowedOrigins();
  
  // Check exact match first (most common case)
  if (allowedOrigins.includes(origin)) {
    logCorsEvent('exact_match', origin, true);
    return callback(null, true);
  }
  
  // Check for subdomain patterns in production
  if (process.env.NODE_ENV === 'production') {
    const allowedPatterns = [
      /^https:\/\/[\w-]+\.elitetradingcoach\.ai$/,
      /^https:\/\/[\w-]+\.railway\.app$/ // Railway deployments
    ];
    
    const isPatternMatch = allowedPatterns.some(pattern => pattern.test(origin));
    if (isPatternMatch) {
      logCorsEvent('pattern_match', origin, true);
      return callback(null, true);
    }
  }
  
  // Check for development patterns
  if (process.env.NODE_ENV === 'development') {
    const devPatterns = [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^http:\/\/\[::1\]:\d+$/, // IPv6 localhost
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Local network
      /^file:\/\/.*$/ // Allow file:// protocol for local HTML files (development only)
    ];
    
    const isDevMatch = devPatterns.some(pattern => pattern.test(origin));
    if (isDevMatch) {
      logCorsEvent('dev_pattern_match', origin, true);
      return callback(null, true);
    }
  }
  
  // Origin not allowed
  logCorsEvent('rejected', origin, false);
  
  // Return error with informative message
  const error = new Error(`CORS policy: Origin ${origin} is not allowed`);
  error.statusCode = 403;
  callback(error);
};

/**
 * CORS configuration object
 */
export const corsConfig = {
  // Use dynamic origin validation
  origin: originValidator,
  
  // Allow credentials (cookies, authorization headers)
  credentials: true,
  
  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  
  // Allowed request headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-Request-ID',
    'Accept',
    'Accept-Language',
    'Content-Language',
    'Origin',
    // Upload-specific headers
    'X-Upload-Context',
    'X-File-Type',
    'X-File-Size',
    'Cache-Control',
    'Pragma'
  ],
  
  // Headers to expose to the client
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Content-Range',
    'Content-Length',
    'Content-Type',
    // Upload-specific exposed headers
    'X-Upload-Status',
    'X-Upload-Progress',
    'X-Token-Refresh-Needed',
    'X-Token-Expires-In'
  ],
  
  // Cache preflight response for 24 hours (86400 seconds)
  maxAge: parseInt(process.env.CORS_MAX_AGE) || 86400,
  
  // Pass the CORS preflight response to the next handler
  preflightContinue: false,
  
  // Provides a status code to use for successful OPTIONS requests
  optionsSuccessStatus: 204
};

/**
 * Create CORS middleware instance
 */
export const createCorsMiddleware = () => {
  return cors(corsConfig);
};

/**
 * Strict CORS middleware for sensitive endpoints
 * Only allows specific production origins
 */
export const strictCorsConfig = {
  origin: (origin, callback) => {
    const strictOrigins = process.env.STRICT_ALLOWED_ORIGINS
      ? process.env.STRICT_ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : ['https://app.elitetradingcoach.ai'];
    
    if (!origin || strictOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by strict CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600 // 1 hour for strict endpoints
};

/**
 * Create strict CORS middleware for sensitive endpoints
 */
export const createStrictCorsMiddleware = () => {
  return cors(strictCorsConfig);
};

/**
 * CORS error handler middleware
 * Provides user-friendly error messages for CORS violations
 */
export const corsErrorHandler = (err, req, res, next) => {
  if (err && err.message && err.message.includes('CORS')) {
    res.status(403).json({
      error: 'CORS Policy Violation',
      message: 'This origin is not allowed to access this resource',
      origin: req.get('origin') || 'unknown',
      help: 'Please contact support if you believe this is an error'
    });
  } else {
    next(err);
  }
};

/**
 * Preflight optimization middleware
 * Handles OPTIONS requests efficiently
 */
export const preflightHandler = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    // Log preflight request
    if (process.env.ENABLE_CORS_LOGGING === 'true') {
      console.log('[CORS] Preflight request from:', req.get('origin'));
    }
    
    // Set cache headers for preflight
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Vary', 'Origin');
    
    // Continue to CORS middleware
    next();
  } else {
    next();
  }
};

/**
 * Get current CORS configuration (for debugging/monitoring)
 */
export const getCorsStatus = () => {
  return {
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins: parseAllowedOrigins(),
    maxAge: corsConfig.maxAge,
    credentialsEnabled: corsConfig.credentials,
    methods: corsConfig.methods,
    loggingEnabled: process.env.ENABLE_CORS_LOGGING === 'true'
  };
};

export default createCorsMiddleware;