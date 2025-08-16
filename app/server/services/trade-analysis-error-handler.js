/**
 * Trade Analysis Error Handler - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md
 * Implements comprehensive error classification and handling for trade analysis
 * Created: 2025-08-15
 */

import { ExternalServiceError, ValidationError, DatabaseError } from '../middleware/error-handler.js';

/**
 * Error types configuration with user-friendly messages
 */
export const ERROR_TYPES = {
  // Network/API Errors
  OPENAI_RATE_LIMIT: {
    message: "AI service is busy. Trying again...",
    retryable: true,
    autoRetry: true,
    delay: 5000,
    maxRetries: 2
  },
  OPENAI_API_DOWN: {
    message: "AI service temporarily unavailable. Please try again in a few minutes.",
    retryable: true,
    autoRetry: false,
    delay: 10000,
    maxRetries: 1
  },
  OPENAI_QUOTA_EXCEEDED: {
    message: "AI service quota exceeded. Please try again later.",
    retryable: true,
    autoRetry: false,
    delay: 60000,
    maxRetries: 0
  },
  NETWORK_TIMEOUT: {
    message: "Request timed out. Please check your connection and try again.",
    retryable: true,
    autoRetry: true,
    delay: 2000,
    maxRetries: 2
  },
  
  // File/Upload Errors  
  FILE_TOO_LARGE: {
    message: "Image file is too large. Please use an image under 10MB.",
    retryable: false,
    guidance: "Try compressing your image or using a different format.",
    maxRetries: 0
  },
  INVALID_FILE_FORMAT: {
    message: "Invalid image format. Please use PNG, JPG, or JPEG.",
    retryable: false,
    guidance: "Convert your image to a supported format and try again.",
    maxRetries: 0
  },
  UPLOAD_FAILED: {
    message: "Failed to upload image. Please check your connection.",
    retryable: true,
    autoRetry: true,
    delay: 1000,
    maxRetries: 2
  },
  IMAGE_CORRUPTED: {
    message: "Image file appears to be corrupted. Please try a different image.",
    retryable: false,
    guidance: "Make sure the image file is not damaged and try again.",
    maxRetries: 0
  },
  
  // Processing Errors
  IMAGE_PROCESSING_FAILED: {
    message: "Unable to process the image. Please try a clearer chart image.",
    retryable: true,
    guidance: "Make sure the chart is clear and readable.",
    autoRetry: false,
    maxRetries: 1
  },
  AI_PROCESSING_FAILED: {
    message: "AI analysis failed. Please try again.",
    retryable: true,
    autoRetry: false,
    delay: 3000,
    maxRetries: 1
  },
  VISION_API_ERROR: {
    message: "Image analysis service unavailable. Please try again later.",
    retryable: true,
    autoRetry: true,
    delay: 5000,
    maxRetries: 2
  },
  
  // Authentication/Authorization Errors
  AUTHENTICATION_FAILED: {
    message: "Authentication required. Please log in and try again.",
    retryable: false,
    maxRetries: 0
  },
  INSUFFICIENT_CREDITS: {
    message: "Insufficient analysis credits. Please upgrade your plan.",
    retryable: false,
    guidance: "Consider upgrading to a premium plan for more analyses.",
    maxRetries: 0
  },
  
  // Database Errors
  DATABASE_CONNECTION_FAILED: {
    message: "Database temporarily unavailable. Please try again shortly.",
    retryable: true,
    autoRetry: true,
    delay: 3000,
    maxRetries: 2
  },
  DATA_SAVE_FAILED: {
    message: "Failed to save analysis results. Please try again.",
    retryable: true,
    autoRetry: true,
    delay: 1000,
    maxRetries: 2
  },
  
  // General Errors
  UNKNOWN_ERROR: {
    message: "Something went wrong. Please try again.",
    retryable: true,
    autoRetry: false,
    delay: 1000,
    maxRetries: 1
  },
  VALIDATION_ERROR: {
    message: "Invalid request. Please check your input and try again.",
    retryable: false,
    maxRetries: 0
  }
};

/**
 * Trade Analysis Error Handler Class
 */
export class TradeAnalysisErrorHandler {
  constructor() {
    this.requestId = null;
    this.userId = null;
    this.context = {};
  }

  /**
   * Set request context for error handling
   * @param {string} requestId - Unique request identifier
   * @param {string} userId - User identifier
   * @param {Object} context - Additional context data
   */
  setContext(requestId, userId, context = {}) {
    this.requestId = requestId;
    this.userId = userId;
    this.context = context;
  }

  /**
   * Main error handling method
   * @param {Error} error - Original error object
   * @param {Object} context - Request context
   * @returns {Object} Formatted error response
   */
  async handleError(error, context = {}) {
    const errorType = this.classifyError(error);
    const errorConfig = ERROR_TYPES[errorType];
    const currentRetryCount = context.retryCount || 0;

    // Log error for debugging
    this.logError(error, errorType, context);

    // Check if auto-retry should be attempted
    if (errorConfig.autoRetry && 
        currentRetryCount < (errorConfig.maxRetries || 0) && 
        context.canRetry !== false) {
      
      console.log(`Auto-retrying ${errorType} (attempt ${currentRetryCount + 1}/${errorConfig.maxRetries})`);
      
      // Wait for specified delay
      if (errorConfig.delay) {
        await this.delay(errorConfig.delay);
      }
      
      // Return retry instruction
      return {
        success: false,
        shouldRetry: true,
        errorType,
        retryCount: currentRetryCount + 1,
        retryDelay: errorConfig.delay || 1000
      };
    }

    // Return user-friendly error response
    return this.formatErrorResponse(errorType, errorConfig, currentRetryCount, error);
  }

  /**
   * Classify error into predefined types
   * @param {Error} error - Original error object
   * @returns {string} Error type constant
   */
  classifyError(error) {
    // OpenAI API errors
    if (error.message && error.message.includes('rate limit')) {
      return 'OPENAI_RATE_LIMIT';
    }
    if (error.code === 429 || error.status === 429) {
      return 'OPENAI_RATE_LIMIT';
    }
    if (error.code === 'quota_exceeded' || error.message?.includes('quota')) {
      return 'OPENAI_QUOTA_EXCEEDED';
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return 'OPENAI_API_DOWN';
    }

    // Network/timeout errors
    if (error.code === 'ETIMEDOUT' || error.code === 'TIMEOUT' || 
        error.message?.includes('timeout')) {
      return 'NETWORK_TIMEOUT';
    }

    // File/upload errors
    if (error.message?.includes('file too large') || error.code === 'LIMIT_FILE_SIZE') {
      return 'FILE_TOO_LARGE';
    }
    if (error.message?.includes('invalid format') || 
        error.message?.includes('unsupported file type')) {
      return 'INVALID_FILE_FORMAT';
    }
    if (error.message?.includes('upload failed') || 
        error.message?.includes('failed to upload')) {
      return 'UPLOAD_FAILED';
    }
    if (error.message?.includes('corrupted') || error.message?.includes('invalid image')) {
      return 'IMAGE_CORRUPTED';
    }

    // Processing errors
    if (error.message?.includes('vision') || error.message?.includes('image analysis')) {
      return 'VISION_API_ERROR';
    }
    if (error.message?.includes('image processing') || 
        error.message?.includes('failed to process image')) {
      return 'IMAGE_PROCESSING_FAILED';
    }
    if (error.message?.includes('AI') || error.message?.includes('analysis failed')) {
      return 'AI_PROCESSING_FAILED';
    }

    // Authentication/authorization errors
    if (error.name === 'AuthenticationError' || error.code === 'AUTHENTICATION_ERROR') {
      return 'AUTHENTICATION_FAILED';
    }
    if (error.message?.includes('insufficient credits') || 
        error.message?.includes('quota exceeded')) {
      return 'INSUFFICIENT_CREDITS';
    }

    // Database errors
    if (error.name === 'DatabaseError' || error.code?.startsWith('23') || 
        error.message?.includes('database')) {
      if (error.message?.includes('connection')) {
        return 'DATABASE_CONNECTION_FAILED';
      }
      return 'DATA_SAVE_FAILED';
    }

    // Validation errors
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
      return 'VALIDATION_ERROR';
    }

    // Default to unknown error
    return 'UNKNOWN_ERROR';
  }

  /**
   * Format error response for client
   * @param {string} errorType - Classified error type
   * @param {Object} errorConfig - Error configuration
   * @param {number} retryCount - Number of retry attempts made
   * @param {Error} originalError - Original error object
   * @returns {Object} Formatted error response
   */
  formatErrorResponse(errorType, errorConfig, retryCount, originalError) {
    const response = {
      success: false,
      errorType,
      message: errorConfig.message,
      retryable: errorConfig.retryable || false,
      retryCount,
      maxRetries: errorConfig.maxRetries || 0,
      timestamp: new Date().toISOString()
    };

    // Add guidance if available
    if (errorConfig.guidance) {
      response.guidance = errorConfig.guidance;
    }

    // Add retry information for retryable errors
    if (errorConfig.retryable) {
      response.canRetry = retryCount < (errorConfig.maxRetries || 0);
      if (response.canRetry && errorConfig.delay) {
        response.retryDelay = errorConfig.delay;
      }
    }

    // Add request context
    if (this.requestId) {
      response.requestId = this.requestId;
    }

    // Add debug information in development
    if (process.env.NODE_ENV === 'development' && originalError) {
      response.debug = {
        originalMessage: originalError.message,
        code: originalError.code,
        stack: originalError.stack?.split('\n').slice(0, 5)
      };
    }

    return response;
  }

  /**
   * Retry request with exponential backoff
   * @param {Function} requestFunction - Function to retry
   * @param {Object} context - Request context
   * @returns {Promise<any>} Request result or error
   */
  async retryRequest(requestFunction, context = {}) {
    const maxRetries = context.maxRetries || 2;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await requestFunction();
        return result;
      } catch (error) {
        lastError = error;
        const errorType = this.classifyError(error);
        const errorConfig = ERROR_TYPES[errorType];

        // Don't retry non-retryable errors
        if (!errorConfig.retryable) {
          throw error;
        }

        // Don't retry on final attempt
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const baseDelay = errorConfig.delay || 1000;
        const backoffDelay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
        const totalDelay = Math.min(backoffDelay + jitter, 30000); // Max 30 seconds

        console.log(`Retrying request after ${totalDelay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await this.delay(totalDelay);
      }
    }

    // If we get here, all retries failed
    throw lastError;
  }

  /**
   * Log error with context
   * @param {Error} error - Original error
   * @param {string} errorType - Classified error type
   * @param {Object} context - Request context
   */
  logError(error, errorType, context) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'error',
      errorType,
      message: error.message,
      code: error.code,
      stack: error.stack,
      requestId: this.requestId,
      userId: this.userId,
      context: {
        ...this.context,
        ...context,
        // Sanitize sensitive data
        retryCount: context.retryCount || 0
      },
      metadata: {
        userAgent: context.userAgent,
        ip: context.ip,
        timestamp: timestamp
      }
    };

    // Remove sensitive information from logs
    delete logEntry.context.token;
    delete logEntry.context.apiKey;
    delete logEntry.context.password;

    // Log to console (in production, send to logging service)
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Trade Analysis Error:', JSON.stringify(logEntry, null, 2));
    } else {
      console.error('🚨 Trade Analysis Error:', JSON.stringify({
        timestamp: logEntry.timestamp,
        errorType: logEntry.errorType,
        message: logEntry.message,
        requestId: logEntry.requestId,
        userId: logEntry.userId,
        retryCount: logEntry.context.retryCount
      }));
    }

    // TODO: In production, send to external logging service
    // await this.sendToLoggingService(logEntry);
  }

  /**
   * Utility method to add delay
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is retryable
   */
  isRetryable(error) {
    const errorType = this.classifyError(error);
    const errorConfig = ERROR_TYPES[errorType];
    return errorConfig.retryable || false;
  }

  /**
   * Get user-friendly message for error
   * @param {Error} error - Error to get message for
   * @returns {string} User-friendly error message
   */
  getUserMessage(error) {
    const errorType = this.classifyError(error);
    const errorConfig = ERROR_TYPES[errorType];
    return errorConfig.message;
  }

  /**
   * Create error metrics for monitoring
   * @param {string} errorType - Type of error
   * @param {Object} context - Error context
   * @returns {Object} Metrics data
   */
  createErrorMetrics(errorType, context = {}) {
    return {
      timestamp: new Date().toISOString(),
      errorType,
      userId: this.userId,
      requestId: this.requestId,
      retryCount: context.retryCount || 0,
      processingTime: context.processingTime,
      endpoint: context.endpoint || '/api/analyze-trade',
      userAgent: context.userAgent,
      ip: context.ip
    };
  }
}

/**
 * Global instance for convenience
 */
export const tradeAnalysisErrorHandler = new TradeAnalysisErrorHandler();

export default TradeAnalysisErrorHandler;