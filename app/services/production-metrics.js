/**
 * Production Performance Metrics Service
 * PRD Reference: PRD-1.2.10-openai-api-configuration.md
 * 
 * This service tracks and reports performance metrics specifically
 * for production OpenAI API usage and system performance.
 * 
 * Features:
 * - API response time tracking
 * - Cost monitoring and estimation
 * - Success/failure rate tracking
 * - Performance target validation
 * - Production-specific alerts
 * 
 * @module services/production-metrics
 */

import { openaiClientWrapper } from './openai-client.js';
import { getConfig } from '../config/openai.js';

/**
 * Production Performance Metrics Tracker
 */
class ProductionMetricsTracker {
  constructor() {
    this.metrics = {
      // API Performance
      responseTime: {
        current: null,
        average: 0,
        min: null,
        max: null,
        history: []
      },
      
      // Success Rates
      successRate: {
        current: 0,
        target: 99.5, // 99.5% target success rate
        rolling24h: 0,
        rolling1h: 0
      },
      
      // Cost Tracking
      costs: {
        currentSession: 0,
        daily: 0,
        monthly: 0,
        estimatedMonthly: 0
      },
      
      // Performance Targets
      targets: {
        responseTimeTarget: 30000, // 30 seconds max
        costTargetDaily: 50.00, // $50/day max
        successRateTarget: 99.5 // 99.5% minimum
      },
      
      // Alerts
      alerts: [],
      
      // Session tracking
      sessionStart: new Date(),
      lastUpdate: new Date()
    };
    
    this.performanceHistory = [];
    this.costHistory = [];
    this.alertThresholds = {
      responseTimeWarning: 25000, // 25 seconds
      responseTimeCritical: 35000, // 35 seconds
      successRateWarning: 95.0, // 95%
      successRateCritical: 90.0, // 90%
      costWarning: 40.00, // $40/day
      costCritical: 60.00 // $60/day
    };
  }

  /**
   * Record API request performance
   * @param {Object} requestData - Request performance data
   * @param {number} requestData.responseTime - Response time in ms
   * @param {boolean} requestData.success - Whether request succeeded
   * @param {number} requestData.tokens - Tokens used
   * @param {number} requestData.cost - Estimated cost
   * @param {string} requestData.model - Model used
   */
  recordApiRequest(requestData) {
    const now = new Date();
    
    // Update response time metrics
    this.updateResponseTimeMetrics(requestData.responseTime);
    
    // Update success rate metrics
    this.updateSuccessRateMetrics(requestData.success);
    
    // Update cost metrics
    this.updateCostMetrics(requestData.cost || 0);
    
    // Store performance history
    this.performanceHistory.push({
      timestamp: now,
      responseTime: requestData.responseTime,
      success: requestData.success,
      tokens: requestData.tokens || 0,
      cost: requestData.cost || 0,
      model: requestData.model
    });
    
    // Keep only last 1000 records
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory.shift();
    }
    
    // Check for performance alerts
    this.checkPerformanceAlerts(requestData);
    
    this.metrics.lastUpdate = now;
  }

  /**
   * Update response time metrics
   * @param {number} responseTime - Response time in ms
   */
  updateResponseTimeMetrics(responseTime) {
    if (responseTime == null) return;
    
    this.metrics.responseTime.current = responseTime;
    this.metrics.responseTime.history.push(responseTime);
    
    // Keep only last 100 response times
    if (this.metrics.responseTime.history.length > 100) {
      this.metrics.responseTime.history.shift();
    }
    
    // Calculate statistics
    const history = this.metrics.responseTime.history;
    this.metrics.responseTime.average = history.reduce((a, b) => a + b, 0) / history.length;
    this.metrics.responseTime.min = Math.min(...history);
    this.metrics.responseTime.max = Math.max(...history);
  }

  /**
   * Update success rate metrics
   * @param {boolean} success - Whether request succeeded
   */
  updateSuccessRateMetrics(success) {
    const recentRequests = this.performanceHistory.slice(-100);
    const recentSuccesses = recentRequests.filter(r => r.success).length;
    
    if (recentRequests.length > 0) {
      this.metrics.successRate.current = (recentSuccesses / recentRequests.length) * 100;
    }
    
    // Calculate rolling success rates
    const last24h = this.performanceHistory.filter(r => 
      Date.now() - r.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    const last1h = this.performanceHistory.filter(r => 
      Date.now() - r.timestamp.getTime() < 60 * 60 * 1000
    );
    
    if (last24h.length > 0) {
      const successes24h = last24h.filter(r => r.success).length;
      this.metrics.successRate.rolling24h = (successes24h / last24h.length) * 100;
    }
    
    if (last1h.length > 0) {
      const successes1h = last1h.filter(r => r.success).length;
      this.metrics.successRate.rolling1h = (successes1h / last1h.length) * 100;
    }
  }

  /**
   * Update cost metrics
   * @param {number} cost - Cost of the request
   */
  updateCostMetrics(cost) {
    if (cost <= 0) return;
    
    this.metrics.costs.currentSession += cost;
    
    // Calculate daily costs
    const today = new Date().toDateString();
    const todaysRequests = this.performanceHistory.filter(r => 
      r.timestamp.toDateString() === today
    );
    this.metrics.costs.daily = todaysRequests.reduce((sum, r) => sum + (r.cost || 0), 0);
    
    // Estimate monthly costs
    const daysInMonth = new Date().getDate();
    if (daysInMonth > 0) {
      this.metrics.costs.estimatedMonthly = (this.metrics.costs.daily / daysInMonth) * 30;
    }
  }

  /**
   * Check for performance alerts
   * @param {Object} requestData - Request data to check
   */
  checkPerformanceAlerts(requestData) {
    const alerts = [];
    
    // Response time alerts
    if (requestData.responseTime > this.alertThresholds.responseTimeCritical) {
      alerts.push({
        level: 'critical',
        type: 'response_time',
        message: `Critical: API response time ${requestData.responseTime}ms exceeds ${this.alertThresholds.responseTimeCritical}ms`,
        value: requestData.responseTime,
        threshold: this.alertThresholds.responseTimeCritical
      });
    } else if (requestData.responseTime > this.alertThresholds.responseTimeWarning) {
      alerts.push({
        level: 'warning',
        type: 'response_time',
        message: `Warning: API response time ${requestData.responseTime}ms exceeds ${this.alertThresholds.responseTimeWarning}ms`,
        value: requestData.responseTime,
        threshold: this.alertThresholds.responseTimeWarning
      });
    }
    
    // Success rate alerts
    if (this.metrics.successRate.current < this.alertThresholds.successRateCritical) {
      alerts.push({
        level: 'critical',
        type: 'success_rate',
        message: `Critical: Success rate ${this.metrics.successRate.current.toFixed(1)}% below ${this.alertThresholds.successRateCritical}%`,
        value: this.metrics.successRate.current,
        threshold: this.alertThresholds.successRateCritical
      });
    } else if (this.metrics.successRate.current < this.alertThresholds.successRateWarning) {
      alerts.push({
        level: 'warning',
        type: 'success_rate',
        message: `Warning: Success rate ${this.metrics.successRate.current.toFixed(1)}% below ${this.alertThresholds.successRateWarning}%`,
        value: this.metrics.successRate.current,
        threshold: this.alertThresholds.successRateWarning
      });
    }
    
    // Cost alerts
    if (this.metrics.costs.daily > this.alertThresholds.costCritical) {
      alerts.push({
        level: 'critical',
        type: 'cost',
        message: `Critical: Daily cost $${this.metrics.costs.daily.toFixed(2)} exceeds $${this.alertThresholds.costCritical}`,
        value: this.metrics.costs.daily,
        threshold: this.alertThresholds.costCritical
      });
    } else if (this.metrics.costs.daily > this.alertThresholds.costWarning) {
      alerts.push({
        level: 'warning',
        type: 'cost',
        message: `Warning: Daily cost $${this.metrics.costs.daily.toFixed(2)} exceeds $${this.alertThresholds.costWarning}`,
        value: this.metrics.costs.daily,
        threshold: this.alertThresholds.costWarning
      });
    }
    
    // Add alerts with timestamps
    alerts.forEach(alert => {
      alert.timestamp = new Date();
      this.metrics.alerts.unshift(alert);
    });
    
    // Keep only last 50 alerts
    if (this.metrics.alerts.length > 50) {
      this.metrics.alerts = this.metrics.alerts.slice(0, 50);
    }
    
    // Log critical alerts
    alerts.filter(a => a.level === 'critical').forEach(alert => {
      console.error(`🚨 PRODUCTION ALERT: ${alert.message}`);
    });
  }

  /**
   * Get current performance metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.sessionStart.getTime(),
      requestCount: this.performanceHistory.length
    };
  }

  /**
   * Get performance summary for monitoring
   * @returns {Object} Performance summary
   */
  getPerformanceSummary() {
    const usage = openaiClientWrapper.getUsageStats();
    const rateLimitStatus = openaiClientWrapper.getRateLimitStatus();
    
    return {
      performance: {
        responseTime: {
          current: this.metrics.responseTime.current,
          average: Math.round(this.metrics.responseTime.average),
          target: this.metrics.targets.responseTimeTarget,
          withinTarget: (this.metrics.responseTime.average || 0) < this.metrics.targets.responseTimeTarget
        },
        successRate: {
          current: parseFloat(this.metrics.successRate.current.toFixed(1)),
          rolling24h: parseFloat(this.metrics.successRate.rolling24h.toFixed(1)),
          target: this.metrics.targets.successRateTarget,
          withinTarget: this.metrics.successRate.current >= this.metrics.targets.successRateTarget
        }
      },
      costs: {
        session: parseFloat(this.metrics.costs.currentSession.toFixed(4)),
        daily: parseFloat(this.metrics.costs.daily.toFixed(2)),
        estimatedMonthly: parseFloat(this.metrics.costs.estimatedMonthly.toFixed(2)),
        target: this.metrics.targets.costTargetDaily,
        withinTarget: this.metrics.costs.daily <= this.metrics.targets.costTargetDaily
      },
      usage: {
        totalRequests: usage.totalRequests,
        successfulRequests: usage.successfulRequests,
        failedRequests: usage.failedRequests,
        totalTokensUsed: usage.totalTokensUsed,
        averageResponseTime: Math.round(usage.averageResponseTime)
      },
      rateLimit: rateLimitStatus,
      alerts: {
        active: this.metrics.alerts.filter(a => 
          Date.now() - a.timestamp.getTime() < 60 * 60 * 1000 // Last hour
        ).length,
        critical: this.metrics.alerts.filter(a => 
          a.level === 'critical' && Date.now() - a.timestamp.getTime() < 60 * 60 * 1000
        ).length,
        recent: this.metrics.alerts.slice(0, 5)
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if system is meeting performance targets
   * @returns {Object} Target compliance status
   */
  checkPerformanceTargets() {
    const summary = this.getPerformanceSummary();
    
    return {
      overall: summary.performance.responseTime.withinTarget && 
               summary.performance.successRate.withinTarget && 
               summary.costs.withinTarget,
      responseTime: summary.performance.responseTime.withinTarget,
      successRate: summary.performance.successRate.withinTarget,
      cost: summary.costs.withinTarget,
      details: {
        responseTime: {
          current: summary.performance.responseTime.average,
          target: summary.performance.responseTime.target,
          status: summary.performance.responseTime.withinTarget ? 'PASS' : 'FAIL'
        },
        successRate: {
          current: summary.performance.successRate.current,
          target: summary.performance.successRate.target,
          status: summary.performance.successRate.withinTarget ? 'PASS' : 'FAIL'
        },
        cost: {
          current: summary.costs.daily,
          target: summary.costs.target,
          status: summary.costs.withinTarget ? 'PASS' : 'FAIL'
        }
      }
    };
  }

  /**
   * Reset metrics (for testing)
   */
  reset() {
    this.metrics = {
      responseTime: { current: null, average: 0, min: null, max: null, history: [] },
      successRate: { current: 0, target: 99.5, rolling24h: 0, rolling1h: 0 },
      costs: { currentSession: 0, daily: 0, monthly: 0, estimatedMonthly: 0 },
      targets: { responseTimeTarget: 30000, costTargetDaily: 50.00, successRateTarget: 99.5 },
      alerts: [],
      sessionStart: new Date(),
      lastUpdate: new Date()
    };
    this.performanceHistory = [];
    this.costHistory = [];
  }
}

// Create global instance
const productionMetrics = new ProductionMetricsTracker();

// Export tracker and instance
export {
  ProductionMetricsTracker,
  productionMetrics
};

export default productionMetrics;