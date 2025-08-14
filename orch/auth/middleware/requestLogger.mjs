/**
 * Request Logging Middleware
 * Comprehensive request/response logging with performance metrics
 */

import { v4 as uuidv4 } from 'uuid';
import { logger, logApiEvent, sanitizeLogData } from '../lib/logger.mjs';
import { config } from '../lib/config.mjs';

/**
 * Request logging middleware
 */
export function requestLogger(req, res, next) {
  if (!config.logging.requestLogging) {
    return next();
  }
  
  // Generate unique request ID
  const requestId = uuidv4();
  req.requestId = requestId;
  
  // Add request ID to response headers
  res.set('X-Request-ID', requestId);
  
  // Start timing
  const startTime = Date.now();
  
  // Log incoming request
  const requestData = {
    requestId,
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    authorization: req.get('Authorization') ? '[PRESENT]' : '[ABSENT]',
    cookies: req.cookies ? Object.keys(req.cookies) : [],
    query: sanitizeLogData(req.query),
    params: sanitizeLogData(req.params)
  };
  
  // Add user info if authenticated
  if (req.user) {
    requestData.userId = req.user.id;
    requestData.userEmail = req.user.email;
  } else if (req.jwtUser) {
    requestData.userId = req.jwtUser.id;
    requestData.userEmail = req.jwtUser.email;
  }
  
  // Add session info if available
  if (req.sessionID) {
    requestData.sessionId = req.sessionID.substring(0, 8) + '...'; // Partial session ID
  }
  
  // Log request body for non-GET requests (sanitized)
  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    requestData.body = sanitizeLogData(req.body);
  }
  
  logger.info('Incoming request', requestData);
  
  // Store original res.json to intercept response
  const originalJson = res.json;
  const originalSend = res.send;
  
  // Intercept response
  res.json = function(data) {
    logResponse(req, res, startTime, data);
    return originalJson.call(this, data);
  };
  
  res.send = function(data) {
    logResponse(req, res, startTime, data);
    return originalSend.call(this, data);
  };
  
  // Handle cases where response ends without json/send
  res.on('finish', () => {
    if (!res.logged) {
      logResponse(req, res, startTime);
    }
  });
  
  next();
}

/**
 * Log response details
 */
function logResponse(req, res, startTime, responseData = null) {
  if (res.logged) {
    return; // Already logged
  }
  
  res.logged = true;
  
  const duration = Date.now() - startTime;
  const statusCode = res.statusCode;
  
  const responseInfo = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    statusCode,
    duration,
    contentLength: res.get('Content-Length'),
    contentType: res.get('Content-Type')
  };
  
  // Add user info if available
  if (req.user?.id) {
    responseInfo.userId = req.user.id;
  } else if (req.jwtUser?.id) {
    responseInfo.userId = req.jwtUser.id;
  }
  
  // Log response data for errors or in development
  if (config.env === 'development' || statusCode >= 400) {
    if (responseData && typeof responseData === 'object') {
      responseInfo.response = sanitizeLogData(responseData);
    }
  }
  
  // Determine log level based on status code
  let logLevel = 'info';
  if (statusCode >= 500) {
    logLevel = 'error';
  } else if (statusCode >= 400) {
    logLevel = 'warn';
  }
  
  logger[logLevel]('Request completed', responseInfo);
  
  // Log API event for metrics
  logApiEvent(req.method, req.path, statusCode, duration, {
    requestId: req.requestId,
    userId: responseInfo.userId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Log slow requests
  if (duration > 1000) {
    logger.warn('Slow request detected', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      duration,
      threshold: 1000
    });
  }
  
  // Log security-relevant status codes
  if ([401, 403, 429].includes(statusCode)) {
    logger.warn('Security-relevant response', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
}

/**
 * Middleware to skip logging for certain requests
 */
export function skipLogging(req, res, next) {
  req.skipLogging = true;
  next();
}

/**
 * Enhanced request logger with additional context
 */
export function enhancedRequestLogger(req, res, next) {
  if (req.skipLogging || !config.logging.requestLogging) {
    return next();
  }
  
  // Add geo-location info if available (from IP)
  // This would typically use a GeoIP service
  const geoInfo = getGeoInfo(req.ip);
  if (geoInfo) {
    req.geoInfo = geoInfo;
  }
  
  // Detect bot/crawler requests
  const isBot = detectBot(req.get('User-Agent'));
  if (isBot) {
    req.isBot = true;
  }
  
  // Continue with regular logging
  requestLogger(req, res, next);
}

/**
 * Get geographical information from IP (placeholder)
 */
function getGeoInfo(ip) {
  // In a real implementation, you'd use a service like MaxMind GeoIP
  // For now, just return null
  return null;
}

/**
 * Detect if request is from a bot/crawler
 */
function detectBot(userAgent) {
  if (!userAgent) {
    return false;
  }
  
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /node-fetch/i,
    /axios/i
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Create child logger with request context
 */
export function createRequestLogger(req) {
  return logger.child({
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    userId: req.user?.id || req.jwtUser?.id,
    sessionId: req.sessionID,
    ip: req.ip
  });
}

/**
 * Log specific events during request processing
 */
export function logRequestEvent(req, event, data = {}) {
  const requestLogger = createRequestLogger(req);
  
  requestLogger.info(`Request event: ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...data
  });
}

/**
 * Performance monitoring middleware
 */
export function performanceMonitor(req, res, next) {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log performance metrics
    logger.debug('Request performance', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      duration,
      statusCode: res.statusCode,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    });
    
    // Alert on very slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn('Very slow request detected', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        duration,
        threshold: 5000
      });
    }
  });
  
  next();
}

/**
 * Request correlation middleware for distributed tracing
 */
export function correlationMiddleware(req, res, next) {
  // Check for incoming correlation ID
  const correlationId = req.get('X-Correlation-ID') || 
                       req.get('X-Request-ID') || 
                       req.requestId || 
                       uuidv4();
  
  req.correlationId = correlationId;
  res.set('X-Correlation-ID', correlationId);
  
  // Add to logger context
  req.logger = logger.child({ correlationId });
  
  next();
}

export default requestLogger;