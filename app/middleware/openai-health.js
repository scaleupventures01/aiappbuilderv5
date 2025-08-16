/**
 * OpenAI Health Check Middleware
 * 
 * This middleware provides comprehensive health monitoring for OpenAI API integration:
 * - API connectivity testing with minimal requests
 * - Response time measurement
 * - Rate limit header parsing and monitoring
 * - Error handling for different API error codes
 * - Caching to prevent API overuse during health checks
 * - Status determination logic
 * 
 * Health Status Levels:
 * - healthy: API is fully operational (< 2s response, no errors)
 * - degraded: API is operational but with issues (slow response, rate limits)
 * - unhealthy: API is not accessible or returning errors
 * 
 * @module middleware/openai-health
 */

import { openaiClient, maskApiKey, getConfig } from '../config/openai.js';

/**
 * Health check cache to prevent excessive API calls
 */
class HealthCheckCache {
  constructor(ttlMs = 30000) { // 30 second cache
    this.cache = new Map();
    this.ttl = ttlMs;
  }
  
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  clear() {
    this.cache.clear();
  }
}

const healthCache = new HealthCheckCache();

/**
 * Parse rate limit headers from OpenAI API response
 * @param {object} headers - Response headers
 * @returns {object} Rate limit information
 */
function parseRateLimitHeaders(headers) {
  const rateLimitInfo = {
    requestsRemaining: null,
    requestsReset: null,
    tokensRemaining: null,
    tokensReset: null
  };
  
  // OpenAI uses various header formats
  if (headers['x-ratelimit-remaining-requests']) {
    rateLimitInfo.requestsRemaining = parseInt(headers['x-ratelimit-remaining-requests'], 10);
  }
  
  if (headers['x-ratelimit-reset-requests']) {
    rateLimitInfo.requestsReset = headers['x-ratelimit-reset-requests'];
  }
  
  if (headers['x-ratelimit-remaining-tokens']) {
    rateLimitInfo.tokensRemaining = parseInt(headers['x-ratelimit-remaining-tokens'], 10);
  }
  
  if (headers['x-ratelimit-reset-tokens']) {
    rateLimitInfo.tokensReset = headers['x-ratelimit-reset-tokens'];
  }
  
  return rateLimitInfo;
}

/**
 * Determine health status based on response time and error conditions
 * @param {number} responseTime - Response time in milliseconds
 * @param {object|null} error - Error object if request failed
 * @param {object} rateLimitInfo - Rate limit information
 * @returns {string} Health status: 'healthy', 'degraded', or 'unhealthy'
 */
function determineHealthStatus(responseTime, error, rateLimitInfo) {
  // If there's an error, determine severity
  if (error) {
    if (error.status === 401) {
      return 'unhealthy'; // Authentication failed
    }
    if (error.status === 429) {
      return 'degraded'; // Rate limited but recoverable
    }
    if (error.status >= 500) {
      return 'unhealthy'; // Server error
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return 'unhealthy'; // Network connectivity issues
    }
    return 'degraded'; // Other errors that might be recoverable
  }
  
  // Check response time (target: < 2 seconds)
  if (responseTime > 5000) {
    return 'degraded'; // Very slow response
  }
  
  // Check rate limits
  if (rateLimitInfo.requestsRemaining !== null && rateLimitInfo.requestsRemaining < 5) {
    return 'degraded'; // Very low rate limit remaining
  }
  
  if (responseTime > 2000) {
    return 'degraded'; // Slow but acceptable response
  }
  
  return 'healthy';
}

/**
 * Perform OpenAI API health check
 * @returns {Promise<object>} Health check result
 */
async function performHealthCheck() {
  const startTime = Date.now();
  let responseTime = 0;
  let error = null;
  let rateLimitInfo = {};
  let testResult = null;
  
  try {
    console.log('[OpenAI Health] Starting health check...');
    
    // Perform a minimal API test (list models is lightweight)
    const response = await openaiClient.models.list();
    responseTime = Date.now() - startTime;
    
    // Extract rate limit information from response headers
    if (response.response && response.response.headers) {
      rateLimitInfo = parseRateLimitHeaders(response.response.headers);
    }
    
    // Validate response structure
    if (response && response.data && Array.isArray(response.data)) {
      testResult = {
        modelsCount: response.data.length,
        hasGpt4: response.data.some(model => model.id.includes('gpt-4')),
        hasVisionModel: response.data.some(model => 
          model.id.includes('vision') || model.id.includes('gpt-4o')
        )
      };
      
      console.log(`[OpenAI Health] API test successful - ${response.data.length} models available`);
    } else {
      throw new Error('Invalid API response structure');
    }
    
  } catch (err) {
    error = err;
    responseTime = Date.now() - startTime;
    
    console.error('[OpenAI Health] API test failed:', {
      message: err.message,
      status: err.status,
      code: err.code,
      responseTime
    });
  }
  
  // Determine overall health status
  const status = determineHealthStatus(responseTime, error, rateLimitInfo);
  
  // Build health check response
  const healthCheck = {
    status,
    responseTime,
    timestamp: new Date().toISOString(),
    config: {
      model: getConfig().model,
      timeout: getConfig().timeout,
      maxRetries: getConfig().maxRetries
    },
    rateLimit: rateLimitInfo,
    test: testResult,
    error: error ? {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.name
    } : null
  };
  
  console.log(`[OpenAI Health] Health check completed - Status: ${status}, Response time: ${responseTime}ms`);
  
  return healthCheck;
}

/**
 * Express middleware for OpenAI health check endpoint
 * GET /api/health/openai
 */
async function healthCheckMiddleware(req, res) {
  try {
    // Check cache first to prevent excessive API calls
    const cacheKey = 'health-check';
    const cachedResult = healthCache.get(cacheKey);
    
    if (cachedResult) {
      console.log('[OpenAI Health] Returning cached health check result');
      return res.status(200).json({
        ...cachedResult,
        cached: true,
        cacheAge: Date.now() - new Date(cachedResult.timestamp).getTime()
      });
    }
    
    // Perform new health check
    const healthResult = await performHealthCheck();
    
    // Cache the result
    healthCache.set(cacheKey, healthResult);
    
    // Determine HTTP status code based on health
    let httpStatus = 200;
    if (healthResult.status === 'degraded') {
      httpStatus = 200; // Still return 200 for degraded
    } else if (healthResult.status === 'unhealthy') {
      httpStatus = 503; // Service unavailable
    }
    
    res.status(httpStatus).json({
      ...healthResult,
      cached: false
    });
    
  } catch (error) {
    console.error('[OpenAI Health] Health check middleware error:', error);
    
    res.status(500).json({
      status: 'unhealthy',
      responseTime: 0,
      timestamp: new Date().toISOString(),
      error: {
        message: 'Health check failed',
        type: 'HealthCheckError'
      },
      cached: false
    });
  }
}

/**
 * Get cached health status without performing new check
 * @returns {object|null} Cached health status or null if not available
 */
function getCachedHealthStatus() {
  return healthCache.get('health-check');
}

/**
 * Clear health check cache (useful for testing)
 */
function clearHealthCache() {
  healthCache.clear();
}

/**
 * Manual health check for internal use
 * @param {boolean} useCache - Whether to use cached result
 * @returns {Promise<object>} Health check result
 */
async function checkHealth(useCache = true) {
  if (useCache) {
    const cached = getCachedHealthStatus();
    if (cached) return cached;
  }
  
  const result = await performHealthCheck();
  healthCache.set('health-check', result);
  return result;
}

// Export health check functionality
export {
  healthCheckMiddleware,
  performHealthCheck,
  getCachedHealthStatus,
  clearHealthCache,
  checkHealth,
  parseRateLimitHeaders,
  determineHealthStatus
};

export default healthCheckMiddleware;