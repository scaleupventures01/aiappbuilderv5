/**
 * Error Handling Middleware
 * Centralized error handling with proper logging and secure error responses
 */

import { ValidationError } from 'sequelize';
import { logger, logSecurityEvent } from '../lib/logger.mjs';
import { config } from '../lib/config.mjs';

/**
 * Custom Error Classes
 */
export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed', statusCode = 401) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Access denied', statusCode = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export class ValidationError extends Error {
  constructor(message = 'Validation failed', errors = [], statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded', retryAfter = 60, statusCode = 429) {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
    this.isOperational = true;
  }
}

export class OAuthError extends Error {
  constructor(message = 'OAuth authentication failed', provider = null, statusCode = 400) {
    super(message);
    this.name = 'OAuthError';
    this.statusCode = statusCode;
    this.provider = provider;
    this.isOperational = true;
  }
}

/**
 * Error severity levels
 */
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Determine error severity
 */
function getErrorSeverity(error) {
  if (error.statusCode >= 500) {
    return ERROR_SEVERITY.CRITICAL;
  } else if (error.statusCode >= 400) {
    return ERROR_SEVERITY.MEDIUM;
  } else if (error.name === 'AuthenticationError' || error.name === 'AuthorizationError') {
    return ERROR_SEVERITY.HIGH;
  } else {
    return ERROR_SEVERITY.LOW;
  }
}

/**
 * Sanitize error for client response
 */
function sanitizeError(error, isDevelopment = false) {
  const sanitized = {
    error: error.name || 'Error',
    message: error.message || 'An error occurred',
    statusCode: error.statusCode || 500
  };
  
  // Add additional fields for specific error types
  if (error.name === 'ValidationError' && error.errors) {
    sanitized.errors = error.errors;
  }
  
  if (error.name === 'RateLimitError' && error.retryAfter) {
    sanitized.retryAfter = error.retryAfter;
  }
  
  if (error.name === 'OAuthError' && error.provider) {
    sanitized.provider = error.provider;
  }
  
  // Include stack trace only in development
  if (isDevelopment && error.stack) {
    sanitized.stack = error.stack;
  }
  
  // Don't expose internal errors in production
  if (!isDevelopment && error.statusCode >= 500) {
    sanitized.message = 'Internal server error';
  }
  
  return sanitized;
}

/**
 * Check if error contains sensitive information
 */
function containsSensitiveInfo(error) {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /credential/i,
    /connection/i,
    /database/i,
    /redis/i
  ];
  
  const errorString = error.message + (error.stack || '');
  return sensitivePatterns.some(pattern => pattern.test(errorString));
}

/**
 * Main error handling middleware
 */
export function errorHandler(error, req, res, next) {
  // Skip if response already sent
  if (res.headersSent) {
    return next(error);
  }
  
  const isDevelopment = config.env === 'development';
  const errorId = generateErrorId();
  
  // Log error with context
  const errorContext = {
    errorId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || req.jwtUser?.id,
    sessionId: req.sessionID,
    referer: req.get('Referer'),
    severity: getErrorSeverity(error)
  };
  
  // Different logging levels based on error type
  if (error.statusCode >= 500) {
    logger.error('Server error occurred', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...errorContext
    });
  } else if (error.statusCode >= 400) {
    logger.warn('Client error occurred', {
      error: {
        name: error.name,
        message: error.message
      },
      ...errorContext
    });
  } else {
    logger.info('Application error occurred', {
      error: {
        name: error.name,
        message: error.message
      },
      ...errorContext
    });
  }
  
  // Log security events for authentication/authorization errors
  if (error.name === 'AuthenticationError' || error.name === 'AuthorizationError') {
    logSecurityEvent('authentication_authorization_error', {
      errorType: error.name,
      message: error.message,
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent'),
      severity: getErrorSeverity(error)
    });
  }
  
  // Handle specific error types
  let statusCode = 500;
  let errorResponse;
  
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorResponse = {
      error: 'Validation Error',
      message: 'Request validation failed',
      details: error.errors || []
    };
  } else if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    errorResponse = {
      error: 'Database Validation Error',
      message: 'Data validation failed',
      details: error.errors?.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      })) || []
    };
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    errorResponse = {
      error: 'Conflict',
      message: 'Resource already exists',
      details: error.errors?.map(err => ({
        field: err.path,
        message: 'Value already exists'
      })) || []
    };
  } else if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    errorResponse = {
      error: 'Reference Error',
      message: 'Referenced resource does not exist'
    };
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse = {
      error: 'Invalid Token',
      message: 'Authentication token is invalid'
    };
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse = {
      error: 'Token Expired',
      message: 'Authentication token has expired'
    };
  } else if (error.name === 'SyntaxError' && error.status === 400) {
    statusCode = 400;
    errorResponse = {
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    };
  } else {
    // Use custom error properties if available
    statusCode = error.statusCode || 500;
    errorResponse = sanitizeError(error, isDevelopment);
  }
  
  // Add error ID to response for tracking
  errorResponse.errorId = errorId;
  
  // Add timestamp
  errorResponse.timestamp = new Date().toISOString();
  
  // Mask sensitive information in production
  if (!isDevelopment && containsSensitiveInfo(error)) {
    logger.warn('Sensitive information detected in error', { errorId });
    errorResponse.message = 'An error occurred';
    if (errorResponse.stack) {
      delete errorResponse.stack;
    }
  }
  
  // Set appropriate headers
  res.status(statusCode);
  
  // Add retry-after header for rate limit errors
  if (error.name === 'RateLimitError' && error.retryAfter) {
    res.set('Retry-After', error.retryAfter);
  }
  
  // Send error response
  res.json(errorResponse);
}

/**
 * Generate unique error ID for tracking
 */
function generateErrorId() {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Not found (404) handler
 */
export function notFoundHandler(req, res) {
  const error = {
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    suggestions: [
      'Check the API documentation',
      'Verify the HTTP method is correct',
      'Ensure the endpoint URL is valid'
    ]
  };
  
  logger.warn('Route not found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json(error);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncErrorHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error handler for express-validator
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationError = new ValidationError(
      'Request validation failed',
      errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value,
        location: error.location
      }))
    );
    
    return next(validationError);
  }
  
  next();
}

/**
 * Database error handler
 */
export function handleDatabaseError(error) {
  if (error.name === 'SequelizeConnectionError') {
    return new Error('Database connection failed');
  } else if (error.name === 'SequelizeTimeoutError') {
    return new Error('Database operation timed out');
  } else if (error.name === 'SequelizeDatabaseError') {
    return new Error('Database query failed');
  }
  
  return error;
}

export default errorHandler;