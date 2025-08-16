/**
 * Standardized Error Handler Middleware - Elite Trading Coach AI
 * Centralized error handling with consistent JSON response format
 * Created: 2025-08-16
 * 
 * Provides consistent error responses in the format:
 * {
 *   success: false,
 *   error: "User-friendly message",
 *   code: "ERROR_CODE",
 *   timestamp: "ISO string",
 *   retryable: boolean (if applicable),
 *   guidance: "specific guidance" (if applicable)
 * }
 */

import { isDevelopment, isProduction } from '../server/config/environment.js';

/**
 * Custom error class for Method Not Allowed
 */
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
 * Create standardized error response format
 */
const createStandardErrorResponse = (error, statusCode, req = null) => {
  const isRetryableError = [500, 502, 503, 504].includes(statusCode);
  
  const baseResponse = {
    success: false,
    error: error.message || 'An error occurred',
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
    baseResponse.retryable = true;
  } else if (statusCode >= 500) {
    baseResponse.guidance = 'Please try again later or contact support if the issue persists';
  }

  return baseResponse;
};

/**
 * Method validation middleware - validates HTTP methods for specific routes
 */
export const validateMethod = (allowedMethods) => {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      const error = new MethodNotAllowedError(req.method, allowedMethods);
      
      // Set appropriate headers
      res.set('Allow', allowedMethods.join(', '));
      
      const errorResponse = createStandardErrorResponse(error, 405, req);
      errorResponse.method = error.method;
      errorResponse.allowedMethods = error.allowedMethods;
      
      return res.status(405).json(errorResponse);
    }
    next();
  };
};

/**
 * Enhanced error handler middleware with standardized format
 */
export const errorHandler = (error, req, res, next) => {
  // Determine status code
  let statusCode = error.statusCode || 500;
  
  // Create standardized error response
  const errorResponse = createStandardErrorResponse(error, statusCode, req);
  
  // Handle specific error types
  switch (error.name) {
    case 'ValidationError':
      statusCode = 400;
      errorResponse.error = error.message;
      errorResponse.code = 'VALIDATION_ERROR';
      if (error.field) {
        errorResponse.field = error.field;
      }
      break;
      
    case 'MethodNotAllowedError':
      statusCode = 405;
      errorResponse.error = error.message;
      errorResponse.code = 'METHOD_NOT_ALLOWED';
      errorResponse.method = error.method;
      errorResponse.allowedMethods = error.allowedMethods;
      res.set('Allow', error.allowedMethods.join(', '));
      break;
      
    case 'JsonWebTokenError':
      statusCode = 401;
      errorResponse.error = 'Invalid token';
      errorResponse.code = 'INVALID_TOKEN';
      break;
      
    case 'TokenExpiredError':
      statusCode = 401;
      errorResponse.error = 'Token expired';
      errorResponse.code = 'TOKEN_EXPIRED';
      break;
      
    default:
      // Handle unknown errors
      if (statusCode >= 500) {
        errorResponse.error = isProduction() ? 'Internal server error' : error.message;
        errorResponse.retryable = true;
      }
  }

  // Update guidance based on final status code
  if (statusCode === 401) {
    errorResponse.guidance = 'Please provide valid authentication credentials';
  } else if (statusCode === 403) {
    errorResponse.guidance = 'You do not have permission to access this resource';
  } else if (statusCode === 404) {
    errorResponse.guidance = 'Check the URL or endpoint path';
  } else if (statusCode === 405) {
    errorResponse.guidance = 'Use the correct HTTP method for this endpoint';
  } else if (statusCode === 429) {
    errorResponse.guidance = 'Please wait before making another request';
    errorResponse.retryable = true;
  } else if (statusCode >= 500) {
    errorResponse.guidance = 'Please try again later or contact support if the issue persists';
    errorResponse.retryable = true;
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
  
  // Log the error
  console.error(`${new Date().toISOString()} - ${statusCode} ${error.name}: ${error.message}`);
  
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for API routes
 */
export const notFoundHandler = (req, res) => {
  const errorResponse = createStandardErrorResponse(
    { message: 'Endpoint not found', code: 'ENDPOINT_NOT_FOUND' }, 
    404, 
    req
  );
  
  errorResponse.path = req.path;
  errorResponse.method = req.method;
  
  res.status(404).json(errorResponse);
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validateMethod,
  MethodNotAllowedError,
  createStandardErrorResponse
};