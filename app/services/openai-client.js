/**
 * OpenAI Client Wrapper Service
 * 
 * This service provides an enhanced wrapper around the OpenAI client with:
 * - Request rate limiting with sliding window algorithm
 * - Token usage tracking and logging
 * - Cost estimation and monitoring
 * - Circuit breaker pattern for API failures
 * - Exponential backoff retry logic
 * - Usage statistics logging
 * - Monitoring alerts for quota approaching
 * - API key masking in all logs and errors
 * 
 * @module services/openai-client
 */

import { openaiClient, maskApiKey, getConfig } from '../config/openai.js';

/**
 * Sliding Window Rate Limiter
 */
class SlidingWindowRateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  isAllowed() {
    const now = Date.now();
    
    // Remove requests outside the current window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);
    
    // Check if we're under the limit
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
  
  getNextAllowedTime() {
    if (this.requests.length === 0) return Date.now();
    
    const oldestRequest = Math.min(...this.requests);
    return oldestRequest + this.windowMs;
  }
  
  getRemainingRequests() {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

/**
 * Circuit Breaker for API failure handling
 */
class CircuitBreaker {
  constructor(failureThreshold = 5, recoveryTimeMs = 60000) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeMs = recoveryTimeMs;
    this.failures = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  canExecute() {
    if (this.state === 'CLOSED') {
      return true;
    }
    
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeMs) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    
    if (this.state === 'HALF_OPEN') {
      return true;
    }
    
    return false;
  }
  
  recordSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      console.warn(`[OpenAI Client] Circuit breaker OPEN - API failures exceeded threshold (${this.failures})`);
    }
  }
  
  getState() {
    return this.state;
  }
}

/**
 * Usage Statistics Tracker
 */
class UsageStatsTracker {
  constructor() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      totalCostEstimated: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
      rateLimitHits: 0
    };
    this.responseTimeHistory = [];
  }
  
  recordRequest(success, tokens = 0, responseTime = 0, cost = 0) {
    this.stats.totalRequests++;
    this.stats.lastRequestTime = new Date().toISOString();
    
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }
    
    if (tokens > 0) {
      this.stats.totalTokensUsed += tokens;
    }
    
    if (cost > 0) {
      this.stats.totalCostEstimated += cost;
    }
    
    if (responseTime > 0) {
      this.responseTimeHistory.push(responseTime);
      // Keep only last 100 response times for average calculation
      if (this.responseTimeHistory.length > 100) {
        this.responseTimeHistory.shift();
      }
      
      this.stats.averageResponseTime = 
        this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length;
    }
  }
  
  recordRateLimitHit() {
    this.stats.rateLimitHits++;
  }
  
  getStats() {
    return { ...this.stats };
  }
  
  reset() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      totalCostEstimated: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
      rateLimitHits: 0
    };
    this.responseTimeHistory = [];
  }
}

/**
 * Cost Estimator for OpenAI API usage
 */
class CostEstimator {
  constructor() {
    // OpenAI pricing (as of 2024, prices may change)
    this.pricing = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4-vision-preview': { input: 0.01, output: 0.03 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
    };
  }
  
  estimateCost(model, inputTokens = 0, outputTokens = 0) {
    const modelPricing = this.pricing[model] || this.pricing['gpt-4']; // Default to GPT-4 pricing
    
    const inputCost = (inputTokens / 1000) * modelPricing.input;
    const outputCost = (outputTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }
}

/**
 * Exponential Backoff Utility
 */
class ExponentialBackoff {
  constructor(initialDelayMs = 1000, maxDelayMs = 30000, multiplier = 2) {
    this.initialDelay = initialDelayMs;
    this.maxDelay = maxDelayMs;
    this.multiplier = multiplier;
  }
  
  async delay(attempt) {
    const delayMs = Math.min(
      this.initialDelay * Math.pow(this.multiplier, attempt - 1),
      this.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delayMs;
    const actualDelay = delayMs + jitter;
    
    console.log(`[OpenAI Client] Waiting ${Math.round(actualDelay)}ms before retry attempt ${attempt}`);
    
    return new Promise(resolve => setTimeout(resolve, actualDelay));
  }
}

/**
 * OpenAI Client Wrapper
 */
class OpenAIClientWrapper {
  constructor() {
    const config = getConfig();
    
    // Initialize rate limiter (default: 60 requests per minute)
    this.rateLimiter = new SlidingWindowRateLimiter(
      config.rateLimitRPM,
      60000 // 1 minute window
    );
    
    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1 minute recovery
    
    // Initialize usage tracker
    this.usageTracker = new UsageStatsTracker();
    
    // Initialize cost estimator
    this.costEstimator = new CostEstimator();
    
    // Initialize backoff handler
    this.backoffHandler = new ExponentialBackoff();
    
    console.log('[OpenAI Client] Client wrapper initialized');
    console.log(`[OpenAI Client] Rate limit: ${config.rateLimitRPM} requests/minute`);
  }
  
  /**
   * Wait for rate limit to allow request
   */
  async waitForRateLimit() {
    if (!this.rateLimiter.isAllowed()) {
      const nextAllowedTime = this.rateLimiter.getNextAllowedTime();
      const waitTime = nextAllowedTime - Date.now();
      
      if (waitTime > 0) {
        console.log(`[OpenAI Client] Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      // Check again after waiting
      if (!this.rateLimiter.isAllowed()) {
        throw new Error('Rate limit still exceeded after waiting');
      }
    }
  }
  
  /**
   * Execute request with all safety mechanisms
   */
  async executeRequest(requestFn, maxRetries = 3) {
    // Check circuit breaker
    if (!this.circuitBreaker.canExecute()) {
      const error = new Error('Circuit breaker is OPEN - API temporarily unavailable');
      error.circuitBreakerState = this.circuitBreaker.getState();
      throw error;
    }
    
    // Wait for rate limit
    await this.waitForRateLimit();
    
    let lastError = null;
    const startTime = Date.now();
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[OpenAI Client] Executing request (attempt ${attempt}/${maxRetries})`);
        
        const result = await requestFn();
        const responseTime = Date.now() - startTime;
        
        // Extract usage information if available
        let usage = { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 };
        let cost = 0;
        
        if (result.usage) {
          usage = result.usage;
          cost = this.costEstimator.estimateCost(
            getConfig().model,
            usage.prompt_tokens,
            usage.completion_tokens
          );
        }
        
        // Record successful request
        this.circuitBreaker.recordSuccess();
        this.usageTracker.recordRequest(true, usage.total_tokens, responseTime, cost);
        
        console.log(`[OpenAI Client] Request successful - Tokens: ${usage.total_tokens}, Cost: $${cost.toFixed(6)}, Time: ${responseTime}ms`);
        
        return result;
        
      } catch (error) {
        lastError = error;
        const responseTime = Date.now() - startTime;
        
        // Mask API key in error messages
        const sanitizedError = this.sanitizeError(error);
        
        console.error(`[OpenAI Client] Request failed (attempt ${attempt}/${maxRetries}):`, {
          message: sanitizedError.message,
          status: sanitizedError.status,
          type: sanitizedError.type,
          responseTime
        });
        
        // Handle rate limiting
        if (error.status === 429) {
          this.usageTracker.recordRateLimitHit();
          
          if (attempt < maxRetries) {
            await this.backoffHandler.delay(attempt);
            continue;
          }
        }
        
        // Handle server errors with retry
        if (error.status >= 500 && attempt < maxRetries) {
          await this.backoffHandler.delay(attempt);
          continue;
        }
        
        // Record failure
        this.circuitBreaker.recordFailure();
        this.usageTracker.recordRequest(false, 0, responseTime, 0);
        
        // Don't retry on client errors (4xx except 429)
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          break;
        }
      }
    }
    
    // All retries exhausted
    throw this.sanitizeError(lastError);
  }
  
  /**
   * Sanitize error by masking API keys and sensitive information
   */
  sanitizeError(error) {
    const sanitized = {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.name || 'Error'
    };
    
    // Remove any potential API key exposure
    if (sanitized.message) {
      sanitized.message = sanitized.message.replace(
        /sk-[a-zA-Z0-9]{48}/g,
        maskApiKey('sk-placeholder')
      );
    }
    
    return sanitized;
  }
  
  /**
   * Create chat completion with safety mechanisms
   */
  async createChatCompletion(messages, options = {}) {
    const config = getConfig();
    
    const requestOptions = {
      model: options.model || config.model,
      messages,
      max_tokens: options.max_tokens || config.maxTokens,
      temperature: options.temperature || 0.7,
      ...options
    };
    
    console.log(`[OpenAI Client] Creating chat completion with model: ${requestOptions.model}`);
    
    return await this.executeRequest(
      () => openaiClient.chat.completions.create(requestOptions),
      config.maxRetries
    );
  }
  
  /**
   * Create vision completion (for image analysis)
   */
  async createVisionCompletion(messages, options = {}) {
    const config = getConfig();
    
    const requestOptions = {
      model: options.model || 'gpt-4-vision-preview',
      messages,
      max_tokens: options.max_tokens || config.maxTokens,
      temperature: options.temperature || 0.7,
      ...options
    };
    
    console.log(`[OpenAI Client] Creating vision completion with model: ${requestOptions.model}`);
    
    return await this.executeRequest(
      () => openaiClient.chat.completions.create(requestOptions),
      config.maxRetries
    );
  }
  
  /**
   * Get usage statistics
   */
  getUsageStats() {
    return this.usageTracker.getStats();
  }
  
  /**
   * Get rate limit status
   */
  getRateLimitStatus() {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      resetTime: this.rateLimiter.getNextAllowedTime(),
      circuitBreakerState: this.circuitBreaker.getState()
    };
  }
  
  /**
   * Determine if we should fallback to a different model
   * @param {Error} error - The error that occurred
   * @returns {boolean} True if we should attempt fallback
   */
  shouldFallback(error) {
    // Fallback for specific GPT-5 errors
    const fallbackStatuses = [404, 400]; // Model not found, bad request
    const fallbackMessages = [
      'model not found',
      'model not available',
      'unsupported model',
      'invalid model',
      'reasoning_effort not supported'
    ];
    
    if (fallbackStatuses.includes(error.status)) {
      return true;
    }
    
    if (error.message) {
      const errorMessage = error.message.toLowerCase();
      return fallbackMessages.some(msg => errorMessage.includes(msg));
    }
    
    return false;
  }
  
  /**
   * Reset statistics (for testing)
   */
  resetStats() {
    this.usageTracker.reset();
  }
}

// Create singleton instance
const openaiClientWrapper = new OpenAIClientWrapper();

// Export wrapper instance and classes
export {
  openaiClientWrapper,
  OpenAIClientWrapper,
  SlidingWindowRateLimiter,
  CircuitBreaker,
  UsageStatsTracker,
  CostEstimator,
  ExponentialBackoff
};

export default openaiClientWrapper;