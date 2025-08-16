/**
 * Monitoring Service - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.3-gpt4-vision-integration-service.md
 * Comprehensive logging and monitoring for GPT-4 Vision calls
 * Created: 2025-08-15
 */

import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Log Levels
 */
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

/**
 * Monitoring Service Class
 * Comprehensive logging, metrics collection, and monitoring
 */
export class MonitoringService {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'gpt-vision-service';
    this.logLevel = LOG_LEVELS[options.logLevel] || LOG_LEVELS.INFO;
    this.enableFileLogging = options.enableFileLogging !== false;
    this.logDirectory = options.logDirectory || './logs';
    this.enableMetrics = options.enableMetrics !== false;
    this.enablePerformanceTracking = options.enablePerformanceTracking !== false;
    
    // Create log directory if it doesn't exist
    if (this.enableFileLogging && !existsSync(this.logDirectory)) {
      mkdirSync(this.logDirectory, { recursive: true });
    }

    // Initialize log streams
    this.logStreams = {};
    this.initializeLogStreams();

    // Metrics storage
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        rejected: 0,
        retried: 0
      },
      performance: {
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        totalResponseTime: 0,
        responseTimeDistribution: {
          '0-1s': 0,
          '1-3s': 0,
          '3-5s': 0,
          '5-10s': 0,
          '10s+': 0
        }
      },
      errors: {
        byType: {},
        byCode: {},
        recent: []
      },
      api: {
        totalTokens: 0,
        totalCost: 0,
        imageProcessed: 0,
        modelUsage: {}
      },
      system: {
        memoryUsage: [],
        cpuUsage: [],
        systemHealth: 'healthy'
      }
    };

    // Performance tracking data
    this.performanceTracking = {
      activeRequests: new Map(),
      completedRequests: [],
      maxActiveRequests: 0
    };

    // Event listeners for external monitoring
    this.eventListeners = {
      request: [],
      response: [],
      error: [],
      metric: [],
      alert: []
    };

    // Start background monitoring
    this.startBackgroundMonitoring();

    this.log('info', 'Monitoring Service initialized', {
      serviceName: this.serviceName,
      logLevel: Object.keys(LOG_LEVELS)[this.logLevel],
      fileLogging: this.enableFileLogging,
      logDirectory: this.logDirectory
    });
  }

  /**
   * Initialize log file streams
   */
  initializeLogStreams() {
    if (!this.enableFileLogging) return;

    const today = new Date().toISOString().split('T')[0];
    
    this.logStreams = {
      general: createWriteStream(join(this.logDirectory, `${this.serviceName}-${today}.log`), { flags: 'a' }),
      error: createWriteStream(join(this.logDirectory, `${this.serviceName}-error-${today}.log`), { flags: 'a' }),
      performance: createWriteStream(join(this.logDirectory, `${this.serviceName}-performance-${today}.log`), { flags: 'a' }),
      audit: createWriteStream(join(this.logDirectory, `${this.serviceName}-audit-${today}.log`), { flags: 'a' })
    };
  }

  /**
   * Log message with level and context
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @param {string} category - Log category
   */
  log(level, message, context = {}, category = 'general') {
    const logLevelNum = LOG_LEVELS[level.toUpperCase()];
    if (logLevelNum < this.logLevel) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      service: this.serviceName,
      message,
      context: this.sanitizeContext(context),
      category,
      pid: process.pid
    };

    // Console output
    this.outputToConsole(logEntry);

    // File output
    if (this.enableFileLogging) {
      this.outputToFile(logEntry, category);
    }

    // Emit log event for external listeners
    this.emit('log', logEntry);
  }

  /**
   * Track API request start
   * @param {string} requestId - Request identifier
   * @param {Object} requestData - Request details
   * @returns {Object} Tracking context
   */
  trackRequestStart(requestId, requestData = {}) {
    const startTime = Date.now();
    const trackingContext = {
      requestId,
      startTime,
      endpoint: requestData.endpoint || 'unknown',
      userId: requestData.userId,
      model: requestData.model || 'unknown',
      hasImage: requestData.hasImage || false,
      retryCount: requestData.retryCount || 0,
      clientIP: requestData.clientIP,
      userAgent: requestData.userAgent
    };

    // Store active request
    this.performanceTracking.activeRequests.set(requestId, trackingContext);
    
    // Update max active requests
    const activeCount = this.performanceTracking.activeRequests.size;
    this.performanceTracking.maxActiveRequests = Math.max(this.performanceTracking.maxActiveRequests, activeCount);

    // Update metrics
    this.metrics.requests.total++;
    
    this.log('info', `Request started: ${requestId}`, {
      ...trackingContext,
      activeRequests: activeCount
    }, 'performance');

    // Emit request start event
    this.emit('request', { type: 'start', requestId, data: trackingContext });

    return trackingContext;
  }

  /**
   * Track API request completion
   * @param {string} requestId - Request identifier
   * @param {Object} responseData - Response details
   */
  trackRequestEnd(requestId, responseData = {}) {
    const endTime = Date.now();
    const trackingContext = this.performanceTracking.activeRequests.get(requestId);
    
    if (!trackingContext) {
      this.log('warn', `Request end tracking failed: ${requestId} not found in active requests`, {});
      return;
    }

    const responseTime = endTime - trackingContext.startTime;
    
    // Update tracking context
    trackingContext.endTime = endTime;
    trackingContext.responseTime = responseTime;
    trackingContext.success = responseData.success !== false;
    trackingContext.error = responseData.error;
    trackingContext.tokensUsed = responseData.tokensUsed || 0;
    trackingContext.cost = responseData.cost || 0;

    // Move to completed requests
    this.performanceTracking.activeRequests.delete(requestId);
    this.performanceTracking.completedRequests.push(trackingContext);
    
    // Keep only last 100 completed requests
    if (this.performanceTracking.completedRequests.length > 100) {
      this.performanceTracking.completedRequests = this.performanceTracking.completedRequests.slice(-100);
    }

    // Update metrics
    if (trackingContext.success) {
      this.metrics.requests.successful++;
      this.updatePerformanceMetrics(responseTime);
    } else {
      this.metrics.requests.failed++;
      this.trackError(trackingContext.error, trackingContext);
    }

    // Update API metrics
    if (trackingContext.tokensUsed > 0) {
      this.metrics.api.totalTokens += trackingContext.tokensUsed;
    }
    if (trackingContext.cost > 0) {
      this.metrics.api.totalCost += trackingContext.cost;
    }
    if (trackingContext.hasImage) {
      this.metrics.api.imageProcessed++;
    }

    // Update model usage
    const model = trackingContext.model;
    if (!this.metrics.api.modelUsage[model]) {
      this.metrics.api.modelUsage[model] = { requests: 0, tokens: 0, cost: 0 };
    }
    this.metrics.api.modelUsage[model].requests++;
    this.metrics.api.modelUsage[model].tokens += trackingContext.tokensUsed || 0;
    this.metrics.api.modelUsage[model].cost += trackingContext.cost || 0;

    this.log('info', `Request completed: ${requestId}`, {
      ...trackingContext,
      activeRequests: this.performanceTracking.activeRequests.size
    }, 'performance');

    // Emit request end event
    this.emit('response', { type: 'end', requestId, data: trackingContext });
  }

  /**
   * Track API request retry
   * @param {string} requestId - Request identifier
   * @param {number} retryCount - Retry attempt number
   * @param {string} reason - Retry reason
   */
  trackRequestRetry(requestId, retryCount, reason) {
    this.metrics.requests.retried++;

    this.log('warn', `Request retry: ${requestId} (attempt ${retryCount})`, {
      requestId,
      retryCount,
      reason
    }, 'performance');
  }

  /**
   * Track error occurrence
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Error context
   */
  trackError(error, context = {}) {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorType = this.classifyError(errorMessage);
    const errorCode = this.extractErrorCode(errorMessage);
    
    // Update error metrics
    if (!this.metrics.errors.byType[errorType]) {
      this.metrics.errors.byType[errorType] = 0;
    }
    this.metrics.errors.byType[errorType]++;

    if (errorCode && !this.metrics.errors.byCode[errorCode]) {
      this.metrics.errors.byCode[errorCode] = 0;
    }
    if (errorCode) this.metrics.errors.byCode[errorCode]++;

    // Add to recent errors
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: errorMessage,
      type: errorType,
      code: errorCode,
      context: this.sanitizeContext(context),
      stack: error instanceof Error ? error.stack : null
    };

    this.metrics.errors.recent.unshift(errorEntry);
    
    // Keep only last 50 errors
    if (this.metrics.errors.recent.length > 50) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(0, 50);
    }

    this.log('error', `Error tracked: ${errorMessage}`, errorEntry, 'error');

    // Emit error event
    this.emit('error', errorEntry);
  }

  /**
   * Update performance metrics
   * @param {number} responseTime - Response time in ms
   */
  updatePerformanceMetrics(responseTime) {
    const perf = this.metrics.performance;
    
    // Update totals
    perf.totalResponseTime += responseTime;
    
    // Update min/max
    perf.minResponseTime = Math.min(perf.minResponseTime, responseTime);
    perf.maxResponseTime = Math.max(perf.maxResponseTime, responseTime);
    
    // Update average
    perf.averageResponseTime = Math.round(perf.totalResponseTime / this.metrics.requests.successful);

    // Update response time distribution
    if (responseTime < 1000) {
      perf.responseTimeDistribution['0-1s']++;
    } else if (responseTime < 3000) {
      perf.responseTimeDistribution['1-3s']++;
    } else if (responseTime < 5000) {
      perf.responseTimeDistribution['3-5s']++;
    } else if (responseTime < 10000) {
      perf.responseTimeDistribution['5-10s']++;
    } else {
      perf.responseTimeDistribution['10s+']++;
    }
  }

  /**
   * Classify error type
   * @param {string} errorMessage - Error message
   * @returns {string} Error type
   */
  classifyError(errorMessage) {
    const msg = errorMessage.toLowerCase();
    
    if (msg.includes('rate limit') || msg.includes('429')) return 'rate_limit';
    if (msg.includes('authentication') || msg.includes('401')) return 'authentication';
    if (msg.includes('authorization') || msg.includes('403')) return 'authorization';
    if (msg.includes('timeout') || msg.includes('etimedout')) return 'timeout';
    if (msg.includes('connection') || msg.includes('econnrefused')) return 'connection';
    if (msg.includes('validation') || msg.includes('400')) return 'validation';
    if (msg.includes('not found') || msg.includes('404')) return 'not_found';
    if (msg.includes('server error') || msg.includes('500')) return 'server_error';
    if (msg.includes('circuit breaker')) return 'circuit_breaker';
    if (msg.includes('image') || msg.includes('preprocessing')) return 'image_processing';
    
    return 'unknown';
  }

  /**
   * Extract error code from error message
   * @param {string} errorMessage - Error message
   * @returns {string|null} Error code
   */
  extractErrorCode(errorMessage) {
    const codeMatch = errorMessage.match(/\b(\d{3})\b/);
    return codeMatch ? codeMatch[1] : null;
  }

  /**
   * Get current system metrics
   * @returns {Object} System metrics
   */
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const systemMetrics = {
      timestamp: new Date().toISOString(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
      },
      uptime: Math.round(process.uptime()),
      activeRequests: this.performanceTracking.activeRequests.size,
      maxActiveRequests: this.performanceTracking.maxActiveRequests
    };

    // Store system metrics for trending
    this.metrics.system.memoryUsage.push({
      timestamp: Date.now(),
      usage: systemMetrics.memory.heapUsed
    });

    // Keep only last 100 data points
    if (this.metrics.system.memoryUsage.length > 100) {
      this.metrics.system.memoryUsage = this.metrics.system.memoryUsage.slice(-100);
    }

    return systemMetrics;
  }

  /**
   * Get comprehensive monitoring report
   * @returns {Object} Complete monitoring report
   */
  getMonitoringReport() {
    const systemMetrics = this.getSystemMetrics();
    const successRate = this.metrics.requests.total > 0 
      ? Math.round((this.metrics.requests.successful / this.metrics.requests.total) * 100)
      : 0;

    return {
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      summary: {
        status: this.assessSystemHealth(),
        totalRequests: this.metrics.requests.total,
        successRate: `${successRate}%`,
        averageResponseTime: `${this.metrics.performance.averageResponseTime}ms`,
        totalCost: `$${Math.round(this.metrics.api.totalCost * 100) / 100}`,
        uptime: systemMetrics.uptime
      },
      requests: this.metrics.requests,
      performance: this.metrics.performance,
      errors: {
        byType: this.metrics.errors.byType,
        byCode: this.metrics.errors.byCode,
        recentCount: this.metrics.errors.recent.length,
        recent: this.metrics.errors.recent.slice(0, 10) // Last 10 errors
      },
      api: this.metrics.api,
      system: {
        ...systemMetrics,
        health: this.metrics.system.systemHealth,
        memoryTrend: this.getMemoryTrend()
      },
      alerts: this.generateAlerts()
    };
  }

  /**
   * Assess overall system health
   * @returns {string} Health status
   */
  assessSystemHealth() {
    const successRate = this.metrics.requests.total > 0 
      ? (this.metrics.requests.successful / this.metrics.requests.total) * 100
      : 100;
    
    const avgResponseTime = this.metrics.performance.averageResponseTime;
    const activeRequests = this.performanceTracking.activeRequests.size;
    const recentErrors = this.metrics.errors.recent.filter(e => 
      Date.now() - new Date(e.timestamp).getTime() < 300000 // Last 5 minutes
    ).length;

    let healthScore = 100;
    
    // Penalize low success rate
    if (successRate < 95) healthScore -= (95 - successRate) * 2;
    
    // Penalize slow response times
    if (avgResponseTime > 5000) healthScore -= 20;
    else if (avgResponseTime > 3000) healthScore -= 10;
    
    // Penalize high active requests
    if (activeRequests > 10) healthScore -= 15;
    else if (activeRequests > 5) healthScore -= 5;
    
    // Penalize recent errors
    if (recentErrors > 5) healthScore -= 20;
    else if (recentErrors > 2) healthScore -= 10;

    if (healthScore >= 90) return 'excellent';
    if (healthScore >= 75) return 'good';
    if (healthScore >= 50) return 'fair';
    if (healthScore >= 25) return 'poor';
    return 'critical';
  }

  /**
   * Get memory usage trend
   * @returns {string} Trend description
   */
  getMemoryTrend() {
    if (this.metrics.system.memoryUsage.length < 5) return 'insufficient_data';
    
    const recent = this.metrics.system.memoryUsage.slice(-5);
    const oldest = recent[0].usage;
    const newest = recent[recent.length - 1].usage;
    const change = ((newest - oldest) / oldest) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate system alerts
   * @returns {Array} System alerts
   */
  generateAlerts() {
    const alerts = [];
    const systemMetrics = this.getSystemMetrics();
    
    // Memory alert
    if (systemMetrics.memory.heapUsed > 500) {
      alerts.push({
        type: 'memory',
        level: 'warning',
        message: `High memory usage: ${systemMetrics.memory.heapUsed}MB`,
        timestamp: new Date().toISOString()
      });
    }

    // Response time alert
    if (this.metrics.performance.averageResponseTime > 5000) {
      alerts.push({
        type: 'performance',
        level: 'warning',
        message: `Slow response time: ${this.metrics.performance.averageResponseTime}ms`,
        timestamp: new Date().toISOString()
      });
    }

    // Error rate alert
    const errorRate = this.metrics.requests.total > 0 
      ? (this.metrics.requests.failed / this.metrics.requests.total) * 100
      : 0;
    
    if (errorRate > 10) {
      alerts.push({
        type: 'errors',
        level: 'critical',
        message: `High error rate: ${Math.round(errorRate)}%`,
        timestamp: new Date().toISOString()
      });
    }

    return alerts;
  }

  /**
   * Output log entry to console
   * @param {Object} logEntry - Log entry
   */
  outputToConsole(logEntry) {
    const { timestamp, level, message, context } = logEntry;
    const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context, null, 2) : '';
    
    switch (level) {
      case 'DEBUG':
        console.debug(`[${timestamp}] ${level}: ${message}`, contextStr);
        break;
      case 'INFO':
        console.info(`[${timestamp}] ${level}: ${message}`, contextStr);
        break;
      case 'WARN':
        console.warn(`[${timestamp}] ${level}: ${message}`, contextStr);
        break;
      case 'ERROR':
      case 'CRITICAL':
        console.error(`[${timestamp}] ${level}: ${message}`, contextStr);
        break;
    }
  }

  /**
   * Output log entry to file
   * @param {Object} logEntry - Log entry
   * @param {string} category - Log category
   */
  outputToFile(logEntry, category = 'general') {
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Write to category-specific stream
    if (this.logStreams[category]) {
      this.logStreams[category].write(logLine);
    }
    
    // Always write to general stream
    if (category !== 'general' && this.logStreams.general) {
      this.logStreams.general.write(logLine);
    }
  }

  /**
   * Sanitize context for logging
   * @param {Object} context - Context object
   * @returns {Object} Sanitized context
   */
  sanitizeContext(context) {
    const sanitized = { ...context };
    
    // Remove sensitive data
    const sensitiveKeys = ['password', 'apiKey', 'token', 'secret', 'authorization'];
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '***REDACTED***';
      }
    });

    // Truncate large strings
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + '...[TRUNCATED]';
      }
    });

    return sanitized;
  }

  /**
   * Start background monitoring tasks
   */
  startBackgroundMonitoring() {
    // System metrics collection every 30 seconds
    setInterval(() => {
      if (this.enableMetrics) {
        const systemMetrics = this.getSystemMetrics();
        this.emit('metric', { type: 'system', data: systemMetrics });
      }
    }, 30000);

    // Clean up old active requests (abandoned requests)
    setInterval(() => {
      const now = Date.now();
      const timeout = 300000; // 5 minutes
      
      for (const [requestId, context] of this.performanceTracking.activeRequests.entries()) {
        if (now - context.startTime > timeout) {
          this.log('warn', `Cleaning up abandoned request: ${requestId}`, {
            requestId,
            age: now - context.startTime
          });
          
          this.performanceTracking.activeRequests.delete(requestId);
          this.metrics.requests.failed++;
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in monitoring event listener (${event}):`, error);
        }
      });
    }
  }

  /**
   * Close monitoring service and cleanup
   */
  close() {
    this.log('info', 'Monitoring Service shutting down');
    
    // Close log streams
    Object.values(this.logStreams).forEach(stream => {
      if (stream && typeof stream.end === 'function') {
        stream.end();
      }
    });
  }
}

/**
 * Global monitoring service instance for GPT-4 Vision
 */
export const gptVisionMonitoring = new MonitoringService({
  serviceName: 'gpt-4-vision-service',
  logLevel: process.env.LOG_LEVEL || 'INFO',
  enableFileLogging: process.env.ENABLE_FILE_LOGGING !== 'false',
  logDirectory: process.env.LOG_DIRECTORY || './logs'
});

export default MonitoringService;