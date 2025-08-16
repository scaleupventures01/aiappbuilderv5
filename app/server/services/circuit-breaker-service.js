/**
 * Circuit Breaker Service - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.3-gpt4-vision-integration-service.md
 * Circuit breaker pattern implementation for API resilience
 * Created: 2025-08-15
 */

/**
 * Circuit Breaker States
 */
export const CIRCUIT_STATES = {
  CLOSED: 'CLOSED',       // Normal operation
  OPEN: 'OPEN',           // Circuit is open, requests blocked
  HALF_OPEN: 'HALF_OPEN'  // Testing if service is recovered
};

/**
 * Circuit Breaker Service Class
 * Implements circuit breaker pattern for external API calls
 */
export class CircuitBreakerService {
  constructor(options = {}) {
    // Circuit breaker configuration
    this.config = {
      failureThreshold: options.failureThreshold || 5,        // Failures before opening
      recoveryTimeout: options.recoveryTimeout || 60000,      // 1 minute recovery timeout
      monitoringPeriod: options.monitoringPeriod || 120000,   // 2 minute monitoring window
      halfOpenMaxCalls: options.halfOpenMaxCalls || 3,        // Max calls in half-open state
      successThreshold: options.successThreshold || 2,        // Successes needed to close circuit
      ...options
    };

    // Circuit state
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.halfOpenCallCount = 0;

    // Monitoring data
    this.callHistory = [];
    this.stateHistory = [];
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      rejectedCalls: 0,
      averageResponseTime: 0,
      lastResetTime: Date.now()
    };

    // Event listeners
    this.listeners = {
      stateChange: [],
      callSuccess: [],
      callFailure: [],
      circuitOpen: [],
      circuitClose: []
    };

    console.log('🔧 Circuit Breaker Service initialized:', this.config);
  }

  /**
   * Execute function with circuit breaker protection
   * @param {Function} fn - Function to execute
   * @param {Object} context - Execution context
   * @returns {Promise} Execution result
   */
  async execute(fn, context = {}) {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Check if circuit allows the call
    const permission = this.checkCallPermission();
    if (!permission.allowed) {
      this.recordRejectedCall(callId, permission.reason, context);
      throw new Error(`Circuit breaker: ${permission.reason}`);
    }

    try {
      // Execute the protected function
      console.log(`🔄 Circuit breaker executing call ${callId} (state: ${this.state})`);
      
      const result = await fn();
      
      const executionTime = Date.now() - startTime;
      this.recordSuccessfulCall(callId, executionTime, context);
      
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordFailedCall(callId, error, executionTime, context);
      
      throw error;
    }
  }

  /**
   * Check if call is permitted by circuit breaker
   * @returns {Object} Permission result
   */
  checkCallPermission() {
    const now = Date.now();

    switch (this.state) {
      case CIRCUIT_STATES.CLOSED:
        return { allowed: true, reason: null };

      case CIRCUIT_STATES.OPEN:
        // Check if recovery timeout has elapsed
        if (now >= this.nextAttemptTime) {
          this.changeState(CIRCUIT_STATES.HALF_OPEN);
          this.halfOpenCallCount = 0;
          return { allowed: true, reason: null };
        }
        return { 
          allowed: false, 
          reason: `Circuit is open. Recovery attempt in ${Math.round((this.nextAttemptTime - now) / 1000)}s`
        };

      case CIRCUIT_STATES.HALF_OPEN:
        // Allow limited calls to test service recovery
        if (this.halfOpenCallCount < this.config.halfOpenMaxCalls) {
          return { allowed: true, reason: null };
        }
        return { 
          allowed: false, 
          reason: 'Circuit is half-open. Maximum test calls reached.'
        };

      default:
        return { allowed: false, reason: 'Unknown circuit state' };
    }
  }

  /**
   * Record successful call
   * @param {string} callId - Call identifier
   * @param {number} executionTime - Execution time in ms
   * @param {Object} context - Call context
   */
  recordSuccessfulCall(callId, executionTime, context) {
    this.metrics.totalCalls++;
    this.metrics.successfulCalls++;
    
    // Update average response time
    this.updateAverageResponseTime(executionTime);
    
    // Add to call history
    this.addToCallHistory({
      callId,
      timestamp: Date.now(),
      success: true,
      executionTime,
      context: this.sanitizeContext(context)
    });

    console.log(`✅ Circuit breaker: Call ${callId} successful (${executionTime}ms)`);

    // Handle state transitions
    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      this.successCount++;
      this.halfOpenCallCount++;
      
      if (this.successCount >= this.config.successThreshold) {
        this.changeState(CIRCUIT_STATES.CLOSED);
        this.resetCounters();
      }
    } else if (this.state === CIRCUIT_STATES.CLOSED) {
      // Reset failure count on successful call
      this.failureCount = 0;
    }

    // Trigger success listeners
    this.emit('callSuccess', { callId, executionTime, context });
  }

  /**
   * Record failed call
   * @param {string} callId - Call identifier
   * @param {Error} error - Error that occurred
   * @param {number} executionTime - Execution time in ms
   * @param {Object} context - Call context
   */
  recordFailedCall(callId, error, executionTime, context) {
    this.metrics.totalCalls++;
    this.metrics.failedCalls++;
    this.lastFailureTime = Date.now();
    
    // Add to call history
    this.addToCallHistory({
      callId,
      timestamp: Date.now(),
      success: false,
      error: error.message,
      executionTime,
      context: this.sanitizeContext(context)
    });

    console.log(`❌ Circuit breaker: Call ${callId} failed - ${error.message} (${executionTime}ms)`);

    // Handle state transitions
    if (this.state === CIRCUIT_STATES.CLOSED) {
      this.failureCount++;
      
      if (this.failureCount >= this.config.failureThreshold) {
        this.openCircuit();
      }
    } else if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      // Any failure in half-open state immediately opens the circuit
      this.openCircuit();
    }

    // Trigger failure listeners
    this.emit('callFailure', { callId, error, executionTime, context });
  }

  /**
   * Record rejected call (circuit open)
   * @param {string} callId - Call identifier
   * @param {string} reason - Rejection reason
   * @param {Object} context - Call context
   */
  recordRejectedCall(callId, reason, context) {
    this.metrics.totalCalls++;
    this.metrics.rejectedCalls++;

    console.log(`🚫 Circuit breaker: Call ${callId} rejected - ${reason}`);

    // Add to call history
    this.addToCallHistory({
      callId,
      timestamp: Date.now(),
      success: false,
      rejected: true,
      reason,
      context: this.sanitizeContext(context)
    });
  }

  /**
   * Open the circuit breaker
   */
  openCircuit() {
    this.changeState(CIRCUIT_STATES.OPEN);
    this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    this.successCount = 0;
    
    console.warn(`🚨 Circuit breaker opened. Recovery attempt at ${new Date(this.nextAttemptTime).toISOString()}`);
    
    // Trigger circuit open listeners
    this.emit('circuitOpen', {
      failureCount: this.failureCount,
      recoveryTime: this.nextAttemptTime
    });
  }

  /**
   * Change circuit breaker state
   * @param {string} newState - New circuit state
   */
  changeState(newState) {
    const oldState = this.state;
    this.state = newState;
    
    // Add to state history
    this.stateHistory.push({
      from: oldState,
      to: newState,
      timestamp: Date.now(),
      metrics: { ...this.metrics }
    });

    console.log(`🔄 Circuit breaker state change: ${oldState} → ${newState}`);

    // Trigger state change listeners
    this.emit('stateChange', {
      from: oldState,
      to: newState,
      timestamp: Date.now()
    });

    // Trigger specific state listeners
    if (newState === CIRCUIT_STATES.CLOSED) {
      this.emit('circuitClose', {
        previousFailureCount: this.failureCount,
        downtime: this.calculateDowntime()
      });
    }
  }

  /**
   * Reset failure counters
   */
  resetCounters() {
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenCallCount = 0;
    this.lastFailureTime = null;
  }

  /**
   * Add call to history (with size limit)
   * @param {Object} callData - Call data to store
   */
  addToCallHistory(callData) {
    this.callHistory.unshift(callData);
    
    // Keep only last 100 calls
    if (this.callHistory.length > 100) {
      this.callHistory = this.callHistory.slice(0, 100);
    }
  }

  /**
   * Update average response time
   * @param {number} executionTime - New execution time
   */
  updateAverageResponseTime(executionTime) {
    const totalSuccessful = this.metrics.successfulCalls;
    if (totalSuccessful === 1) {
      this.metrics.averageResponseTime = executionTime;
    } else {
      // Calculate rolling average
      this.metrics.averageResponseTime = Math.round(
        (this.metrics.averageResponseTime * (totalSuccessful - 1) + executionTime) / totalSuccessful
      );
    }
  }

  /**
   * Sanitize context for storage
   * @param {Object} context - Context to sanitize
   * @returns {Object} Sanitized context
   */
  sanitizeContext(context) {
    // Remove sensitive data and limit size
    const sanitized = {};
    
    const allowedKeys = ['requestId', 'userId', 'endpoint', 'model', 'hasImage'];
    allowedKeys.forEach(key => {
      if (context[key] !== undefined) {
        sanitized[key] = context[key];
      }
    });

    return sanitized;
  }

  /**
   * Calculate circuit downtime
   * @returns {number} Downtime in milliseconds
   */
  calculateDowntime() {
    if (!this.lastFailureTime) return 0;
    
    const openStateEntry = this.stateHistory
      .slice()
      .reverse()
      .find(entry => entry.to === CIRCUIT_STATES.OPEN);
    
    if (!openStateEntry) return 0;
    
    return Date.now() - openStateEntry.timestamp;
  }

  /**
   * Get circuit breaker status
   * @returns {Object} Current status
   */
  getStatus() {
    const now = Date.now();
    
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      halfOpenCallCount: this.halfOpenCallCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      nextAttemptTime: this.nextAttemptTime ? new Date(this.nextAttemptTime).toISOString() : null,
      timeToRecovery: this.nextAttemptTime ? Math.max(0, this.nextAttemptTime - now) : null,
      metrics: {
        ...this.metrics,
        successRate: this.metrics.totalCalls > 0 
          ? Math.round((this.metrics.successfulCalls / this.metrics.totalCalls) * 100)
          : 0,
        failureRate: this.metrics.totalCalls > 0
          ? Math.round((this.metrics.failedCalls / this.metrics.totalCalls) * 100)
          : 0,
        rejectionRate: this.metrics.totalCalls > 0
          ? Math.round((this.metrics.rejectedCalls / this.metrics.totalCalls) * 100)
          : 0
      },
      configuration: this.config,
      health: this.assessHealth()
    };
  }

  /**
   * Assess circuit breaker health
   * @returns {string} Health status
   */
  assessHealth() {
    if (this.state === CIRCUIT_STATES.OPEN) {
      return 'unhealthy';
    }
    
    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      return 'recovering';
    }
    
    const successRate = this.metrics.totalCalls > 0 
      ? (this.metrics.successfulCalls / this.metrics.totalCalls) * 100
      : 100;
    
    if (successRate >= 95) return 'excellent';
    if (successRate >= 85) return 'good';
    if (successRate >= 70) return 'fair';
    return 'poor';
  }

  /**
   * Get recent call history
   * @param {number} limit - Number of calls to return
   * @returns {Array} Recent calls
   */
  getRecentCalls(limit = 10) {
    return this.callHistory.slice(0, limit);
  }

  /**
   * Get state history
   * @param {number} limit - Number of state changes to return
   * @returns {Array} State changes
   */
  getStateHistory(limit = 10) {
    return this.stateHistory.slice(-limit);
  }

  /**
   * Force circuit state (for testing/emergency)
   * @param {string} state - State to force
   */
  forceState(state) {
    if (!Object.values(CIRCUIT_STATES).includes(state)) {
      throw new Error(`Invalid circuit state: ${state}`);
    }
    
    console.warn(`⚠️ Forcing circuit breaker state to ${state}`);
    this.changeState(state);
    
    if (state === CIRCUIT_STATES.CLOSED) {
      this.resetCounters();
    } else if (state === CIRCUIT_STATES.OPEN) {
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    }
  }

  /**
   * Reset circuit breaker
   */
  reset() {
    console.log('🔄 Resetting circuit breaker');
    
    this.changeState(CIRCUIT_STATES.CLOSED);
    this.resetCounters();
    
    // Reset metrics
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      rejectedCalls: 0,
      averageResponseTime: 0,
      lastResetTime: Date.now()
    };
    
    // Clear history
    this.callHistory = [];
    this.stateHistory = [];
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in circuit breaker event listener (${event}):`, error);
        }
      });
    }
  }

  /**
   * Get circuit breaker statistics for monitoring
   * @returns {Object} Statistics
   */
  getStatistics() {
    const uptime = Date.now() - this.metrics.lastResetTime;
    
    return {
      state: this.state,
      uptime: uptime,
      uptimeFormatted: this.formatDuration(uptime),
      metrics: this.metrics,
      recentFailures: this.callHistory.filter(call => !call.success && !call.rejected).length,
      configuration: this.config,
      lastFailure: this.lastFailureTime ? {
        timestamp: new Date(this.lastFailureTime).toISOString(),
        timeAgo: Date.now() - this.lastFailureTime
      } : null
    };
  }

  /**
   * Format duration in human readable format
   * @param {number} duration - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(duration) {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

/**
 * Create circuit breaker for specific service
 * @param {string} serviceName - Service name
 * @param {Object} options - Circuit breaker options
 * @returns {CircuitBreakerService} Circuit breaker instance
 */
export function createCircuitBreaker(serviceName, options = {}) {
  const circuitBreaker = new CircuitBreakerService({
    serviceName,
    ...options
  });

  console.log(`🔧 Created circuit breaker for service: ${serviceName}`);
  return circuitBreaker;
}

/**
 * GPT-4 Vision specific circuit breaker
 */
export const gptVisionCircuitBreaker = createCircuitBreaker('gpt-4-vision', {
  failureThreshold: 3,        // Open after 3 failures
  recoveryTimeout: 30000,     // 30 seconds recovery timeout
  halfOpenMaxCalls: 2,        // Test with 2 calls
  successThreshold: 2         // Close after 2 successes
});

export default CircuitBreakerService;