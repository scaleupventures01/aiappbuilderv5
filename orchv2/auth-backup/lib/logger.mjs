/**
 * Logging Configuration
 * Production-ready logging with Winston, including request tracking and security events
 */

import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom log format for structured logging
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  winston.format.json()
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, metadata = {} }) => {
    let logMessage = `${timestamp} [${level}] ${message}`;
    
    // Add request ID if available
    if (metadata.requestId) {
      logMessage += ` [${metadata.requestId}]`;
    }
    
    // Add additional metadata
    const metaKeys = Object.keys(metadata).filter(key => 
      !['requestId', 'timestamp', 'level', 'message'].includes(key)
    );
    
    if (metaKeys.length > 0) {
      const metaString = metaKeys.map(key => 
        `${key}=${JSON.stringify(metadata[key])}`
      ).join(' ');
      logMessage += ` | ${metaString}`;
    }
    
    return logMessage;
  })
);

/**
 * Create transports based on environment
 */
const createTransports = () => {
  const transports = [];
  
  // Console transport for all environments
  transports.push(
    new winston.transports.Console({
      level: config.logging.level,
      format: config.env === 'production' ? logFormat : consoleFormat
    })
  );
  
  // File transports for production and development
  if (config.env !== 'test') {
    // General application logs
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'app.log'),
        level: 'info',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true
      })
    );
    
    // Error logs
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true
      })
    );
    
    // Security event logs
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'security.log'),
        level: 'warn',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
        tailable: true
      })
    );
    
    // Authentication audit logs
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'auth-audit.log'),
        level: 'info',
        format: logFormat,
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 20,
        tailable: true
      })
    );
  }
  
  return transports;
};

/**
 * Main logger instance
 */
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: createTransports(),
  exitOnError: false,
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      format: logFormat
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      format: logFormat
    })
  ]
});

/**
 * Security logger for authentication and authorization events
 */
export const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.metadata(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10
    })
  ]
});

/**
 * Audit logger for authentication events
 */
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.metadata(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'auth-audit.log'),
      maxsize: 50 * 1024 * 1024,
      maxFiles: 20
    })
  ]
});

/**
 * Log authentication events for audit trail
 */
export function logAuthEvent(event, details = {}) {
  const auditEntry = {
    event,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  auditLogger.info('Authentication event', auditEntry);
  
  // Also log to main logger for immediate visibility
  logger.info(`Auth event: ${event}`, auditEntry);
}

/**
 * Log security events
 */
export function logSecurityEvent(event, details = {}) {
  const securityEntry = {
    event,
    timestamp: new Date().toISOString(),
    severity: details.severity || 'medium',
    ...details
  };
  
  securityLogger.warn('Security event', securityEntry);
  
  // Also log to main logger
  logger.warn(`Security event: ${event}`, securityEntry);
}

/**
 * Log OAuth provider events
 */
export function logOAuthEvent(provider, event, details = {}) {
  const oauthEntry = {
    provider,
    event,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  auditLogger.info('OAuth event', oauthEntry);
  logger.info(`OAuth ${provider}: ${event}`, oauthEntry);
}

/**
 * Log session events
 */
export function logSessionEvent(event, sessionId, details = {}) {
  const sessionEntry = {
    event,
    sessionId: sessionId ? sessionId.substring(0, 8) + '...' : 'unknown', // Partial session ID for privacy
    timestamp: new Date().toISOString(),
    ...details
  };
  
  auditLogger.info('Session event', sessionEntry);
  logger.info(`Session ${event}`, sessionEntry);
}

/**
 * Log database events
 */
export function logDatabaseEvent(operation, table, details = {}) {
  const dbEntry = {
    operation,
    table,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  logger.debug(`Database ${operation} on ${table}`, dbEntry);
}

/**
 * Log API request/response for debugging
 */
export function logApiEvent(method, path, statusCode, responseTime, details = {}) {
  const apiEntry = {
    method,
    path,
    statusCode,
    responseTime,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  logger[level](`${method} ${path} ${statusCode} ${responseTime}ms`, apiEntry);
}

/**
 * Create child logger with request context
 */
export function createRequestLogger(requestId, metadata = {}) {
  return logger.child({
    requestId,
    ...metadata
  });
}

/**
 * Sanitize sensitive data from logs
 */
export function sanitizeLogData(data) {
  const sensitiveFields = [
    'password',
    'secret',
    'token',
    'authorization',
    'cookie',
    'session',
    'apikey',
    'api_key',
    'private_key',
    'client_secret',
    'refresh_token',
    'access_token'
  ];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  // Also check nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Performance logger for tracking slow operations
 */
export function logPerformance(operation, duration, details = {}) {
  const perfEntry = {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
  logger[level](`Performance: ${operation} took ${duration}ms`, perfEntry);
}

// Set up stream for morgan middleware
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

export default logger;