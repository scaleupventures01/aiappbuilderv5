/**
 * Enhanced Error Handler Middleware - Elite Trading Coach AI
 * Centralized error handling with logging, monitoring, and user-friendly responses
 * Created: 2025-08-14
 */

import { serverConfig, isDevelopment, isProduction } from '../config/environment.js';

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'VALIDATION_ERROR';
    this.field = field;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
    this.code = 'AUTHENTICATION_ERROR';
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.code = 'AUTHORIZATION_ERROR';
  }
}

export class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.code = 'NOT_FOUND';
    this.resource = resource;
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.code = 'CONFLICT_ERROR';
  }
}

export class RateLimitError extends Error {
  constructor(message, resetTime = null) {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
    this.code = 'RATE_LIMIT_ERROR';
    this.resetTime = resetTime;
  }
}

export class DatabaseError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
    this.code = 'DATABASE_ERROR';
    this.originalError = originalError;
  }
}

export class ExternalServiceError extends Error {
  constructor(service, message, statusCode = 503) {
    super(message);
    this.name = 'ExternalServiceError';
    this.statusCode = statusCode;
    this.code = 'EXTERNAL_SERVICE_ERROR';
    this.service = service;
  }
}

export class MethodNotAllowedError extends Error {
  constructor(method, allowedMethods = []) {
    super(`Method ${method} not allowed`);
    this.name = 'MethodNotAllowedError';
    this.statusCode = 405;
    this.code = 'METHOD_NOT_ALLOWED';
    this.method = method;
    this.allowedMethods = allowedMethods;
  }
}

/**
 * Error logging utility
 */
const logError = (error, req = null, additionalInfo = {}) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: isDevelopment() ? error.stack : undefined
    },
    request: req ? {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: sanitizeRequestBody(req.body),
      headers: sanitizeHeaders(req.headers),
      user: req.user ? { id: req.user.id, email: req.user.email } : null,
      ip: req.ip
    } : null,
    ...additionalInfo
  };
  
  // Log to console (in production, this would go to a logging service)
  if (error.statusCode >= 500) {
    console.error('🚨 INTERNAL SERVER ERROR:', JSON.stringify(errorInfo, null, 2));
  } else if (error.statusCode >= 400) {
    console.warn('⚠️  CLIENT ERROR:', JSON.stringify(errorInfo, null, 2));
  } else {
    console.info('ℹ️  ERROR INFO:', JSON.stringify(errorInfo, null, 2));
  }
  
  // TODO: In production, send to external logging service
  // sendToLoggingService(errorInfo);
};

/**
 * Sanitize request body for logging (remove sensitive data)
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Sanitize headers for logging
 */
const sanitizeHeaders = (headers) => {
  if (!headers || typeof headers !== 'object') return headers;
  
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Create standardized error response format
 */
const createStandardErrorResponse = (error, statusCode) => {
  const isRetryableError = [500, 502, 503, 504].includes(statusCode);
  
  const baseResponse = {
    success: false,
    error: error.message,
    code: error.code || 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  };

  // Add retryable field for applicable errors
  if (isRetryableError) {
    baseResponse.retryable = true;
  }

  // Add guidance for specific error types
  if (statusCode === 401) {
    baseResponse.guidance = 'Please provide valid authentication credentials';
  } else if (statusCode === 403) {
    baseResponse.guidance = 'You do not have permission to access this resource';
  } else if (statusCode === 404) {
    baseResponse.guidance = 'Check the URL or endpoint path';
  } else if (statusCode === 405) {
    baseResponse.guidance = 'Use the correct HTTP method for this endpoint';
  } else if (statusCode === 429) {
    baseResponse.guidance = 'Please wait before making another request';
  } else if (statusCode >= 500) {
    baseResponse.guidance = 'Please try again later or contact support if the issue persists';
  }

  return baseResponse;
};

/**
 * Main error handler middleware
 */
export const errorHandler = (error, req, res, next) => {
  // Log the error
  logError(error, req);
  
  // Default error response
  let statusCode = error.statusCode || 500;
  let errorResponse = createStandardErrorResponse(error, statusCode);
  
  // Handle specific error types
  switch (error.name) {
    case 'ValidationError':
      errorResponse.error = error.message;
      errorResponse.code = 'VALIDATION_ERROR';
      if (error.field) {
        errorResponse.field = error.field;
      }
      break;
      
    case 'AuthenticationError':
      errorResponse.error = 'Authentication required';
      errorResponse.code = 'AUTHENTICATION_ERROR';
      break;
      
    case 'AuthorizationError':
      errorResponse.error = 'Insufficient permissions';
      errorResponse.code = 'AUTHORIZATION_ERROR';
      break;
      
    case 'NotFoundError':
      errorResponse.error = error.message;
      errorResponse.code = 'NOT_FOUND';
      if (error.resource) {
        errorResponse.resource = error.resource;
      }
      break;
      
    case 'ConflictError':
      errorResponse.error = error.message;
      errorResponse.code = 'CONFLICT_ERROR';
      break;
      
    case 'RateLimitError':
      errorResponse.error = error.message;
      errorResponse.code = 'RATE_LIMIT_ERROR';
      errorResponse.retryable = true;
      if (error.resetTime) {
        errorResponse.retryAfter = Math.ceil((error.resetTime - Date.now()) / 1000);
      }
      break;
      
    case 'DatabaseError':
      statusCode = 500;
      errorResponse.error = isProduction() ? 'Database operation failed' : error.message;
      errorResponse.code = 'DATABASE_ERROR';
      errorResponse.retryable = true;
      break;
      
    case 'ExternalServiceError':
      errorResponse.error = `External service error: ${error.service}`;
      errorResponse.code = 'EXTERNAL_SERVICE_ERROR';
      errorResponse.retryable = true;
      if (error.service) {
        errorResponse.service = error.service;
      }
      break;

    case 'MethodNotAllowedError':
      statusCode = 405;
      errorResponse = createStandardErrorResponse(error, statusCode);
      errorResponse.error = error.message;
      errorResponse.code = 'METHOD_NOT_ALLOWED';
      errorResponse.method = error.method;
      if (error.allowedMethods && error.allowedMethods.length > 0) {
        errorResponse.allowedMethods = error.allowedMethods;
      }
      break;
      
    // Handle JWT errors
    case 'JsonWebTokenError':
      statusCode = 401;
      errorResponse = createStandardErrorResponse(error, statusCode);
      errorResponse.error = 'Invalid token';
      errorResponse.code = 'INVALID_TOKEN';
      break;
      
    case 'TokenExpiredError':
      statusCode = 401;
      errorResponse = createStandardErrorResponse(error, statusCode);
      errorResponse.error = 'Token expired';
      errorResponse.code = 'TOKEN_EXPIRED';
      break;
      
    // Handle Multer (file upload) errors
    case 'MulterError':
      statusCode = 400;
      errorResponse = createStandardErrorResponse(error, statusCode);
      if (error.code === 'LIMIT_FILE_SIZE') {
        errorResponse.error = 'File too large';
        errorResponse.code = 'FILE_TOO_LARGE';
        errorResponse.maxSize = serverConfig.upload.maxFileSize;
      } else if (error.code === 'LIMIT_FILE_COUNT') {
        errorResponse.error = 'Too many files';
        errorResponse.code = 'TOO_MANY_FILES';
        errorResponse.maxFiles = serverConfig.upload.maxFiles;
      } else {
        errorResponse.error = 'File upload error';
        errorResponse.code = 'FILE_UPLOAD_ERROR';
      }
      break;
      
    // Handle PostgreSQL errors
    case 'error': // PostgreSQL errors
      if (error.code === '23505') { // Unique violation
        statusCode = 409;
        errorResponse = createStandardErrorResponse(error, statusCode);
        errorResponse.error = 'Resource already exists';
        errorResponse.code = 'DUPLICATE_RESOURCE';
      } else if (error.code === '23503') { // Foreign key violation
        statusCode = 400;
        errorResponse = createStandardErrorResponse(error, statusCode);
        errorResponse.error = 'Invalid reference';
        errorResponse.code = 'INVALID_REFERENCE';
      } else {
        statusCode = 500;
        errorResponse = createStandardErrorResponse(error, statusCode);
        errorResponse.error = isProduction() ? 'Database error' : error.message;
        errorResponse.code = 'DATABASE_ERROR';
        errorResponse.retryable = true;
      }
      break;
      
    default:
      // Handle unknown errors
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        statusCode = error.statusCode;
        errorResponse = createStandardErrorResponse(error, statusCode);
        errorResponse.error = error.message;
      } else {
        statusCode = 500;
        errorResponse = createStandardErrorResponse(error, statusCode);
        errorResponse.error = isProduction() ? 'Internal server error' : error.message;
        errorResponse.retryable = true;
      }
  }
  
  // Add debug information in development
  if (isDevelopment() && statusCode >= 500) {
    errorResponse.debug = {
      stack: error.stack,
      originalError: error
    };
  }
  
  // Set security headers for error responses
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });
  
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for API routes
 */
export const notFoundHandler = (req, res) => {
  const error = new NotFoundError('Endpoint');
  logError(error, req);
  
  const errorResponse = createStandardErrorResponse(error, 404);
  errorResponse.error = 'Endpoint not found';
  errorResponse.code = 'ENDPOINT_NOT_FOUND';
  errorResponse.path = req.path;
  errorResponse.method = req.method;
  
  res.status(404).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch promise rejections
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error helper
 */
export const createValidationError = (message, field = null) => {
  return new ValidationError(message, field);
};

/**
 * Database error helper
 */
export const handleDatabaseError = (error, operation = 'Database operation') => {
  logError(error, null, { operation });
  
  if (error.code === '23505') {
    throw new ConflictError('Resource already exists');
  } else if (error.code === '23503') {
    throw new ValidationError('Invalid reference');
  } else if (error.code === '42P01') {
    throw new DatabaseError('Table does not exist');
  } else {
    throw new DatabaseError(`${operation} failed`, error);
  }
};

/**
 * Error monitoring and alerting
 */
export const setupErrorMonitoring = () => {
  // Monitor unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 UNHANDLED PROMISE REJECTION:', reason);
    logError(new Error('Unhandled Promise Rejection'), null, {
      reason,
      promise: promise.toString()
    });
    
    // In production, you might want to exit the process
    if (isProduction()) {
      console.error('Shutting down due to unhandled promise rejection');
      process.exit(1);
    }
  });
  
  // Monitor uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('🚨 UNCAUGHT EXCEPTION:', error);
    logError(error, null, { type: 'uncaughtException' });
    
    // Always exit on uncaught exceptions
    console.error('Shutting down due to uncaught exception');
    process.exit(1);
  });
  
  console.log('✅ Error monitoring initialized');
};

/**
 * Method validation middleware - validates HTTP methods for specific routes
 */
export const validateMethod = (allowedMethods) => {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      const error = new MethodNotAllowedError(req.method, allowedMethods);
      return next(error);
    }
    next();
  };
};

/**
 * Universal method handler - handles all requests and validates methods
 */
export const methodHandler = (allowedMethods, handler) => {
  return [
    validateMethod(allowedMethods),
    handler
  ];
};

/**
 * Health check error handler
 */
export const healthCheckError = (error) => {
  const errorResponse = createStandardErrorResponse(error, 503);
  errorResponse.error = 'Health check failed';
  errorResponse.code = 'HEALTH_CHECK_FAILED';
  errorResponse.retryable = true;
  
  if (isDevelopment()) {
    errorResponse.details = error.message;
  }
  
  return errorResponse;
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validateMethod,
  methodHandler,
  createValidationError,
  handleDatabaseError,
  setupErrorMonitoring,
  healthCheckError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  MethodNotAllowedError
};