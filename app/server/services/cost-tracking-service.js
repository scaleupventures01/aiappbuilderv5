/**
 * Cost Tracking Service - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.3-gpt4-vision-integration-service.md
 * Token usage and cost monitoring for OpenAI API calls
 * Created: 2025-08-15
 */

/**
 * Cost Tracking Service Class
 * Tracks token usage, costs, and provides budget monitoring
 */
export class CostTrackingService {
  constructor() {
    // OpenAI GPT-4 Vision pricing (as of 2025)
    this.pricing = {
      'gpt-4-vision-preview': {
        inputTokens: 0.01 / 1000,      // $0.01 per 1K input tokens
        outputTokens: 0.03 / 1000,     // $0.03 per 1K output tokens
        imageTokens: 0.00765,          // $0.00765 per image (high detail)
        imageTokensLowDetail: 0.00255  // $0.00255 per image (low detail)
      },
      'gpt-4o': {
        inputTokens: 0.005 / 1000,     // $0.005 per 1K input tokens  
        outputTokens: 0.015 / 1000,    // $0.015 per 1K output tokens
        imageTokens: 0.004,            // $0.004 per image
        imageTokensLowDetail: 0.00133  // $0.00133 per image (low detail)
      }
    };

    // Usage tracking
    this.usageStats = {
      totalRequests: 0,
      totalTokensUsed: 0,
      totalCostIncurred: 0,
      totalImages: 0,
      sessionStats: {},
      dailyStats: {},
      userStats: {},
      modelUsage: {}
    };

    // Budget alerts
    this.budgetLimits = {
      daily: parseFloat(process.env.DAILY_BUDGET_LIMIT) || 50.0,   // $50 daily limit
      monthly: parseFloat(process.env.MONTHLY_BUDGET_LIMIT) || 500.0, // $500 monthly limit
      user: parseFloat(process.env.USER_BUDGET_LIMIT) || 10.0      // $10 per user daily limit
    };

    // Alert thresholds
    this.alertThresholds = {
      warning: 0.75,  // Alert at 75% of budget
      critical: 0.90, // Critical alert at 90%
      emergency: 0.95 // Emergency shutdown at 95%
    };

    this.alertCallbacks = [];
  }

  /**
   * Calculate cost for OpenAI API usage
   * @param {Object} usage - API usage data
   * @param {string} model - Model used
   * @param {boolean} hasImage - Whether request included image
   * @param {string} imageDetail - Image detail level ('high' or 'low')
   * @returns {Object} Cost breakdown
   */
  calculateCost(usage, model = 'gpt-4-vision-preview', hasImage = false, imageDetail = 'high') {
    const modelPricing = this.pricing[model] || this.pricing['gpt-4-vision-preview'];
    
    // Calculate token costs
    const inputCost = (usage.prompt_tokens || 0) * modelPricing.inputTokens;
    const outputCost = (usage.completion_tokens || 0) * modelPricing.outputTokens;
    
    // Calculate image cost
    let imageCost = 0;
    if (hasImage) {
      imageCost = imageDetail === 'low' 
        ? modelPricing.imageTokensLowDetail 
        : modelPricing.imageTokens;
    }

    const totalCost = inputCost + outputCost + imageCost;

    return {
      inputCost: Math.round(inputCost * 10000) / 10000,     // Round to 4 decimal places
      outputCost: Math.round(outputCost * 10000) / 10000,
      imageCost: Math.round(imageCost * 10000) / 10000,
      totalCost: Math.round(totalCost * 10000) / 10000,
      totalTokens: usage.total_tokens || 0,
      breakdown: {
        inputTokens: usage.prompt_tokens || 0,
        outputTokens: usage.completion_tokens || 0,
        imageProcessed: hasImage ? 1 : 0,
        imageDetail: hasImage ? imageDetail : 'none'
      }
    };
  }

  /**
   * Track API usage and update statistics
   * @param {Object} usageData - Usage tracking data
   * @returns {Object} Updated tracking result
   */
  trackUsage(usageData) {
    const {
      requestId,
      userId,
      model = 'gpt-4-vision-preview',
      usage,
      hasImage = false,
      imageDetail = 'high',
      processingTime = 0,
      timestamp = new Date()
    } = usageData;

    // Calculate costs
    const costData = this.calculateCost(usage, model, hasImage, imageDetail);

    // Update global stats
    this.usageStats.totalRequests++;
    this.usageStats.totalTokensUsed += costData.totalTokens;
    this.usageStats.totalCostIncurred += costData.totalCost;
    if (hasImage) this.usageStats.totalImages++;

    // Update model usage stats
    if (!this.usageStats.modelUsage[model]) {
      this.usageStats.modelUsage[model] = {
        requests: 0,
        tokens: 0,
        cost: 0,
        images: 0
      };
    }
    this.usageStats.modelUsage[model].requests++;
    this.usageStats.modelUsage[model].tokens += costData.totalTokens;
    this.usageStats.modelUsage[model].cost += costData.totalCost;
    if (hasImage) this.usageStats.modelUsage[model].images++;

    // Update daily stats
    const dateKey = timestamp.toISOString().split('T')[0];
    if (!this.usageStats.dailyStats[dateKey]) {
      this.usageStats.dailyStats[dateKey] = {
        requests: 0,
        tokens: 0,
        cost: 0,
        images: 0
      };
    }
    this.usageStats.dailyStats[dateKey].requests++;
    this.usageStats.dailyStats[dateKey].tokens += costData.totalTokens;
    this.usageStats.dailyStats[dateKey].cost += costData.totalCost;
    if (hasImage) this.usageStats.dailyStats[dateKey].images++;

    // Update user stats
    if (userId) {
      if (!this.usageStats.userStats[userId]) {
        this.usageStats.userStats[userId] = {
          requests: 0,
          tokens: 0,
          cost: 0,
          images: 0,
          dailyCost: {},
          lastRequest: null
        };
      }
      this.usageStats.userStats[userId].requests++;
      this.usageStats.userStats[userId].tokens += costData.totalTokens;
      this.usageStats.userStats[userId].cost += costData.totalCost;
      this.usageStats.userStats[userId].lastRequest = timestamp;
      if (hasImage) this.usageStats.userStats[userId].images++;

      // Track daily user costs
      if (!this.usageStats.userStats[userId].dailyCost[dateKey]) {
        this.usageStats.userStats[userId].dailyCost[dateKey] = 0;
      }
      this.usageStats.userStats[userId].dailyCost[dateKey] += costData.totalCost;
    }

    // Check budget alerts
    this.checkBudgetAlerts(userId, dateKey);

    // Create tracking record
    const trackingRecord = {
      requestId,
      userId,
      timestamp: timestamp.toISOString(),
      model,
      usage: {
        inputTokens: usage.prompt_tokens || 0,
        outputTokens: usage.completion_tokens || 0,
        totalTokens: costData.totalTokens
      },
      cost: costData,
      processingTime,
      hasImage,
      imageDetail: hasImage ? imageDetail : null,
      budgetStatus: this.getBudgetStatus(userId, dateKey)
    };

    console.log(`💰 Cost tracking: ${requestId} - $${costData.totalCost} (${costData.totalTokens} tokens)`);

    return trackingRecord;
  }

  /**
   * Check budget alerts and trigger notifications
   * @param {string} userId - User ID
   * @param {string} dateKey - Date key (YYYY-MM-DD)
   */
  checkBudgetAlerts(userId, dateKey) {
    // Check daily budget
    const dailyCost = this.usageStats.dailyStats[dateKey]?.cost || 0;
    const dailyUtilization = dailyCost / this.budgetLimits.daily;

    if (dailyUtilization >= this.alertThresholds.emergency) {
      this.triggerAlert('emergency', 'daily', {
        current: dailyCost,
        limit: this.budgetLimits.daily,
        utilization: dailyUtilization,
        message: 'EMERGENCY: Daily budget limit almost reached! API calls may be suspended.'
      });
    } else if (dailyUtilization >= this.alertThresholds.critical) {
      this.triggerAlert('critical', 'daily', {
        current: dailyCost,
        limit: this.budgetLimits.daily,
        utilization: dailyUtilization,
        message: 'CRITICAL: Daily budget 90% utilized!'
      });
    } else if (dailyUtilization >= this.alertThresholds.warning) {
      this.triggerAlert('warning', 'daily', {
        current: dailyCost,
        limit: this.budgetLimits.daily,
        utilization: dailyUtilization,
        message: 'WARNING: Daily budget 75% utilized'
      });
    }

    // Check user budget if userId provided
    if (userId) {
      const userDailyCost = this.usageStats.userStats[userId]?.dailyCost[dateKey] || 0;
      const userUtilization = userDailyCost / this.budgetLimits.user;

      if (userUtilization >= this.alertThresholds.critical) {
        this.triggerAlert('critical', 'user', {
          userId,
          current: userDailyCost,
          limit: this.budgetLimits.user,
          utilization: userUtilization,
          message: `User ${userId} approaching daily budget limit`
        });
      }
    }
  }

  /**
   * Trigger budget alert
   * @param {string} level - Alert level (warning, critical, emergency)
   * @param {string} type - Alert type (daily, monthly, user)
   * @param {Object} data - Alert data
   */
  triggerAlert(level, type, data) {
    const alert = {
      level,
      type,
      timestamp: new Date().toISOString(),
      data,
      acknowledged: false
    };

    console.warn(`🚨 BUDGET ALERT [${level.toUpperCase()}]: ${data.message}`);
    
    // Call registered alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in budget alert callback:', error);
      }
    });

    // In production, you might want to:
    // - Send email notifications
    // - Post to Slack/Discord
    // - Write to database
    // - Trigger monitoring systems
  }

  /**
   * Get current budget status
   * @param {string} userId - User ID (optional)
   * @param {string} dateKey - Date key (optional)
   * @returns {Object} Budget status
   */
  getBudgetStatus(userId = null, dateKey = null) {
    const currentDate = dateKey || new Date().toISOString().split('T')[0];
    
    const dailyCost = this.usageStats.dailyStats[currentDate]?.cost || 0;
    const dailyUtilization = dailyCost / this.budgetLimits.daily;

    const status = {
      daily: {
        spent: Math.round(dailyCost * 100) / 100,
        limit: this.budgetLimits.daily,
        remaining: Math.max(0, Math.round((this.budgetLimits.daily - dailyCost) * 100) / 100),
        utilization: Math.round(dailyUtilization * 1000) / 10, // Round to 1 decimal
        status: dailyUtilization >= this.alertThresholds.emergency ? 'emergency' :
                dailyUtilization >= this.alertThresholds.critical ? 'critical' :
                dailyUtilization >= this.alertThresholds.warning ? 'warning' : 'normal'
      }
    };

    // Add user budget status if provided
    if (userId && this.usageStats.userStats[userId]) {
      const userDailyCost = this.usageStats.userStats[userId].dailyCost[currentDate] || 0;
      const userUtilization = userDailyCost / this.budgetLimits.user;

      status.user = {
        spent: Math.round(userDailyCost * 100) / 100,
        limit: this.budgetLimits.user,
        remaining: Math.max(0, Math.round((this.budgetLimits.user - userDailyCost) * 100) / 100),
        utilization: Math.round(userUtilization * 1000) / 10,
        status: userUtilization >= this.alertThresholds.critical ? 'critical' :
                userUtilization >= this.alertThresholds.warning ? 'warning' : 'normal'
      };
    }

    return status;
  }

  /**
   * Get usage statistics
   * @param {Object} options - Statistics options
   * @returns {Object} Usage statistics
   */
  getUsageStatistics(options = {}) {
    const { includeUserStats = false, includeDailyBreakdown = false } = options;

    const stats = {
      global: {
        totalRequests: this.usageStats.totalRequests,
        totalTokensUsed: this.usageStats.totalTokensUsed,
        totalCostIncurred: Math.round(this.usageStats.totalCostIncurred * 100) / 100,
        totalImages: this.usageStats.totalImages,
        averageCostPerRequest: this.usageStats.totalRequests > 0 
          ? Math.round((this.usageStats.totalCostIncurred / this.usageStats.totalRequests) * 10000) / 10000
          : 0,
        averageTokensPerRequest: this.usageStats.totalRequests > 0
          ? Math.round(this.usageStats.totalTokensUsed / this.usageStats.totalRequests)
          : 0
      },
      models: this.usageStats.modelUsage,
      budgetStatus: this.getBudgetStatus(),
      pricing: this.pricing
    };

    if (includeDailyBreakdown) {
      stats.dailyBreakdown = this.usageStats.dailyStats;
    }

    if (includeUserStats) {
      // Only include summary user stats for privacy
      stats.userSummary = {
        totalUsers: Object.keys(this.usageStats.userStats).length,
        activeToday: this.getActiveTodayCount(),
        topSpenders: this.getTopSpenders(5)
      };
    }

    return stats;
  }

  /**
   * Get count of users active today
   * @returns {number} Active user count
   */
  getActiveTodayCount() {
    const today = new Date().toISOString().split('T')[0];
    return Object.values(this.usageStats.userStats).filter(user => 
      user.dailyCost[today] && user.dailyCost[today] > 0
    ).length;
  }

  /**
   * Get top spending users (without exposing IDs)
   * @param {number} limit - Number of top users to return
   * @returns {Array} Top spenders list
   */
  getTopSpenders(limit = 5) {
    return Object.entries(this.usageStats.userStats)
      .map(([userId, stats]) => ({
        userHash: this.hashUserId(userId), // Hash for privacy
        totalCost: Math.round(stats.cost * 100) / 100,
        requests: stats.requests,
        lastRequest: stats.lastRequest
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit);
  }

  /**
   * Hash user ID for privacy
   * @param {string} userId - User ID to hash
   * @returns {string} Hashed user ID
   */
  hashUserId(userId) {
    // Simple hash for privacy (in production, use crypto)
    return `user_${userId.substring(0, 8)}...${userId.slice(-4)}`;
  }

  /**
   * Register budget alert callback
   * @param {Function} callback - Alert callback function
   */
  onBudgetAlert(callback) {
    if (typeof callback === 'function') {
      this.alertCallbacks.push(callback);
    }
  }

  /**
   * Check if request should be allowed based on budget
   * @param {string} userId - User ID
   * @returns {Object} Permission result
   */
  checkRequestPermission(userId = null) {
    const budgetStatus = this.getBudgetStatus(userId);
    
    // Block if daily budget is at emergency level
    if (budgetStatus.daily.status === 'emergency') {
      return {
        allowed: false,
        reason: 'Daily budget limit exceeded',
        budgetStatus
      };
    }

    // Block if user budget is at critical level
    if (userId && budgetStatus.user && budgetStatus.user.status === 'critical') {
      return {
        allowed: false,
        reason: 'User daily budget limit exceeded',
        budgetStatus
      };
    }

    return {
      allowed: true,
      budgetStatus
    };
  }

  /**
   * Reset daily statistics (should be called daily)
   */
  resetDailyStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Keep daily stats for historical purposes, just reset user daily costs
    Object.values(this.usageStats.userStats).forEach(userStats => {
      if (!userStats.dailyCost[today]) {
        userStats.dailyCost[today] = 0;
      }
    });

    console.log('📊 Daily cost tracking statistics reset');
  }

  /**
   * Export usage data for analysis
   * @param {Object} options - Export options
   * @returns {Object} Export data
   */
  exportUsageData(options = {}) {
    const { startDate, endDate, userId } = options;
    
    // Filter data based on options
    let dailyData = this.usageStats.dailyStats;
    
    if (startDate || endDate) {
      dailyData = Object.entries(dailyData)
        .filter(([date, _]) => {
          if (startDate && date < startDate) return false;
          if (endDate && date > endDate) return false;
          return true;
        })
        .reduce((acc, [date, data]) => {
          acc[date] = data;
          return acc;
        }, {});
    }

    return {
      exportDate: new Date().toISOString(),
      period: { startDate, endDate },
      dailyData,
      globalStats: this.usageStats,
      budgetLimits: this.budgetLimits
    };
  }
}

/**
 * Global cost tracking service instance
 */
export const costTrackingService = new CostTrackingService();

export default CostTrackingService;