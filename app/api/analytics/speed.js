/**
 * Speed Analytics API Endpoints - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.6-gpt5-speed-selection.md
 * Description: API endpoints for speed analytics and usage tracking
 * Created: 2025-08-15
 */

import express from 'express';
import { authenticateToken, requireEmailVerification } from '../../middleware/auth.js';
import { asyncHandler } from '../../server/middleware/error-handler.js';
import { 
  getUserSpeedAnalytics, 
  getSpeedAnalyticsSummary 
} from '../../db/queries/speed-preferences.js';
import { updateLastActive } from '../../db/queries/users.js';

const router = express.Router();

/**
 * Input validation middleware for analytics queries
 */
const validateAnalyticsQuery = (req, res, next) => {
  const { 
    limit, 
    offset, 
    speedMode, 
    startDate, 
    endDate, 
    groupBy 
  } = req.query;
  
  // Validate limit
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 1000)) {
    return res.status(400).json({
      success: false,
      error: 'limit must be a number between 1 and 1000',
      code: 'VALIDATION_ERROR'
    });
  }
  
  // Validate offset
  if (offset && (isNaN(offset) || parseInt(offset) < 0)) {
    return res.status(400).json({
      success: false,
      error: 'offset must be a non-negative number',
      code: 'VALIDATION_ERROR'
    });
  }
  
  // Validate speed mode
  if (speedMode) {
    const validSpeedModes = ['super_fast', 'fast', 'balanced', 'high_accuracy', 'thorough', 'maximum'];
    if (!validSpeedModes.includes(speedMode)) {
      return res.status(400).json({
        success: false,
        error: `Invalid speed mode. Must be one of: ${validSpeedModes.join(', ')}`,
        code: 'VALIDATION_ERROR'
      });
    }
  }
  
  // Validate dates
  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(400).json({
      success: false,
      error: 'startDate must be a valid ISO date string',
      code: 'VALIDATION_ERROR'
    });
  }
  
  if (endDate && isNaN(Date.parse(endDate))) {
    return res.status(400).json({
      success: false,
      error: 'endDate must be a valid ISO date string',
      code: 'VALIDATION_ERROR'
    });
  }
  
  // Validate groupBy for summary endpoints
  if (groupBy) {
    const validGroupBy = ['speed_mode', 'model_used', 'date'];
    if (!validGroupBy.includes(groupBy)) {
      return res.status(400).json({
        success: false,
        error: `Invalid groupBy. Must be one of: ${validGroupBy.join(', ')}`,
        code: 'VALIDATION_ERROR'
      });
    }
  }
  
  next();
};

/**
 * GET /api/analytics/speed
 * Get speed analytics for the current user
 */
router.get('/',
  authenticateToken,
  requireEmailVerification,
  validateAnalyticsQuery,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
      limit = 50,
      offset = 0,
      speedMode,
      startDate,
      endDate,
      includeFailures = 'true'
    } = req.query;
    
    try {
      console.log(`📊 Getting speed analytics for user ${userId}`);
      
      const analytics = await getUserSpeedAnalytics(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        speedMode,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        includeFailures: includeFailures === 'true'
      });
      
      // Calculate summary statistics
      const summary = {
        totalAnalyses: analytics.analytics.length,
        successfulAnalyses: analytics.analytics.filter(a => a.analysisSuccessful).length,
        avgResponseTime: analytics.analytics.reduce((sum, a) => sum + a.responseTimeMs, 0) / analytics.analytics.length || 0,
        totalCost: analytics.analytics.reduce((sum, a) => sum + a.totalCost, 0),
        avgCost: analytics.analytics.reduce((sum, a) => sum + a.totalCost, 0) / analytics.analytics.length || 0,
        speedModeDistribution: {},
        modelDistribution: {},
        verdictDistribution: {}
      };
      
      // Calculate distributions
      analytics.analytics.forEach(a => {
        // Speed mode distribution
        summary.speedModeDistribution[a.speedMode] = 
          (summary.speedModeDistribution[a.speedMode] || 0) + 1;
        
        // Model distribution
        summary.modelDistribution[a.modelUsed] = 
          (summary.modelDistribution[a.modelUsed] || 0) + 1;
        
        // Verdict distribution (only for successful analyses)
        if (a.analysisSuccessful && a.verdict) {
          summary.verdictDistribution[a.verdict] = 
            (summary.verdictDistribution[a.verdict] || 0) + 1;
        }
      });
      
      // Update user's last active timestamp (non-blocking)
      updateLastActive(userId).catch(error => {
        console.warn('Failed to update last active:', error.message);
      });
      
      res.json({
        success: true,
        data: {
          analytics: analytics.analytics,
          summary,
          pagination: analytics.pagination
        },
        metadata: {
          userId,
          timestamp: new Date().toISOString(),
          queryParams: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            speedMode,
            startDate,
            endDate,
            includeFailures: includeFailures === 'true'
          }
        }
      });
      
    } catch (error) {
      console.error(`❌ Failed to get speed analytics for user ${userId}:`, error.message);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve speed analytics',
        code: 'GET_ANALYTICS_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * GET /api/analytics/speed/summary
 * Get aggregated speed analytics summary (admin only or user's own data)
 */
router.get('/summary',
  authenticateToken,
  requireEmailVerification,
  validateAnalyticsQuery,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
      startDate,
      endDate,
      groupBy = 'speed_mode'
    } = req.query;
    
    try {
      console.log(`📊 Getting speed analytics summary for user ${userId}`);
      
      // For now, only show user's own data
      // In the future, admin users could see system-wide data
      const userAnalytics = await getUserSpeedAnalytics(userId, {
        limit: 10000, // Large limit to get all data for summary
        offset: 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        includeFailures: true
      });
      
      // Group analytics by the specified dimension
      const grouped = {};
      
      userAnalytics.analytics.forEach(analytics => {
        let key;
        switch (groupBy) {
          case 'speed_mode':
            key = analytics.speedMode;
            break;
          case 'model_used':
            key = analytics.modelUsed;
            break;
          case 'date':
            key = analytics.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
            break;
          default:
            key = analytics.speedMode;
        }
        
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(analytics);
      });
      
      // Calculate summary for each group
      const summary = Object.keys(grouped).map(groupKey => {
        const groupAnalytics = grouped[groupKey];
        const successful = groupAnalytics.filter(a => a.analysisSuccessful);
        const withinTarget = groupAnalytics.filter(a => a.withinTargetTime);
        
        return {
          groupKey,
          totalAnalyses: groupAnalytics.length,
          successfulAnalyses: successful.length,
          successRate: parseFloat((successful.length / groupAnalytics.length * 100).toFixed(2)),
          avgResponseTime: parseFloat((groupAnalytics.reduce((sum, a) => sum + a.responseTimeMs, 0) / groupAnalytics.length).toFixed(2)),
          withinTargetCount: withinTarget.length,
          withinTargetRate: parseFloat((withinTarget.length / groupAnalytics.length * 100).toFixed(2)),
          totalCost: parseFloat(groupAnalytics.reduce((sum, a) => sum + a.totalCost, 0).toFixed(4)),
          avgCost: parseFloat((groupAnalytics.reduce((sum, a) => sum + a.totalCost, 0) / groupAnalytics.length).toFixed(4)),
          totalTokens: groupAnalytics.reduce((sum, a) => sum + a.tokensUsed, 0),
          avgTokens: parseFloat((groupAnalytics.reduce((sum, a) => sum + a.tokensUsed, 0) / groupAnalytics.length).toFixed(2)),
          fallbackCount: groupAnalytics.filter(a => a.fallbackUsed).length,
          fallbackRate: parseFloat((groupAnalytics.filter(a => a.fallbackUsed).length / groupAnalytics.length * 100).toFixed(2))
        };
      });
      
      // Update user's last active timestamp (non-blocking)
      updateLastActive(userId).catch(error => {
        console.warn('Failed to update last active:', error.message);
      });
      
      res.json({
        success: true,
        data: {
          summary: summary.sort((a, b) => a.groupKey.localeCompare(b.groupKey)),
          groupBy,
          totalRecords: userAnalytics.analytics.length
        },
        metadata: {
          userId,
          timestamp: new Date().toISOString(),
          dateRange: {
            startDate,
            endDate
          },
          queryParams: {
            groupBy,
            startDate,
            endDate
          }
        }
      });
      
    } catch (error) {
      console.error(`❌ Failed to get speed analytics summary for user ${userId}:`, error.message);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve speed analytics summary',
        code: 'GET_SUMMARY_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * GET /api/analytics/speed/performance
 * Get performance metrics for different speed modes
 */
router.get('/performance',
  authenticateToken,
  requireEmailVerification,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { days = 30 } = req.query;
    
    try {
      console.log(`📊 Getting speed performance metrics for user ${userId}`);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      const analytics = await getUserSpeedAnalytics(userId, {
        limit: 10000,
        offset: 0,
        startDate,
        includeFailures: false // Only successful analyses for performance metrics
      });
      
      // Group by speed mode and calculate performance metrics
      const speedModes = ['super_fast', 'fast', 'balanced', 'high_accuracy'];
      const performance = {};
      
      speedModes.forEach(mode => {
        const modeAnalytics = analytics.analytics.filter(a => a.speedMode === mode);
        
        if (modeAnalytics.length > 0) {
          const responseTimes = modeAnalytics.map(a => a.responseTimeMs);
          const costs = modeAnalytics.map(a => a.totalCost);
          const confidenceScores = modeAnalytics.filter(a => a.confidence).map(a => a.confidence);
          
          performance[mode] = {
            totalAnalyses: modeAnalytics.length,
            avgResponseTime: parseFloat((responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length).toFixed(2)),
            minResponseTime: Math.min(...responseTimes),
            maxResponseTime: Math.max(...responseTimes),
            withinTargetCount: modeAnalytics.filter(a => a.withinTargetTime).length,
            withinTargetRate: parseFloat((modeAnalytics.filter(a => a.withinTargetTime).length / modeAnalytics.length * 100).toFixed(2)),
            avgCost: parseFloat((costs.reduce((sum, c) => sum + c, 0) / costs.length).toFixed(4)),
            totalCost: parseFloat(costs.reduce((sum, c) => sum + c, 0).toFixed(4)),
            avgConfidence: confidenceScores.length > 0 ? 
              parseFloat((confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length).toFixed(2)) : null,
            verdictDistribution: {}
          };
          
          // Calculate verdict distribution
          modeAnalytics.forEach(a => {
            if (a.verdict) {
              performance[mode].verdictDistribution[a.verdict] = 
                (performance[mode].verdictDistribution[a.verdict] || 0) + 1;
            }
          });
        } else {
          performance[mode] = {
            totalAnalyses: 0,
            avgResponseTime: null,
            minResponseTime: null,
            maxResponseTime: null,
            withinTargetCount: 0,
            withinTargetRate: 0,
            avgCost: null,
            totalCost: 0,
            avgConfidence: null,
            verdictDistribution: {}
          };
        }
      });
      
      res.json({
        success: true,
        data: {
          performance,
          totalAnalyses: analytics.analytics.length,
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: new Date().toISOString(),
            days: parseInt(days)
          }
        },
        metadata: {
          userId,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error(`❌ Failed to get speed performance metrics for user ${userId}:`, error.message);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve speed performance metrics',
        code: 'GET_PERFORMANCE_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  })
);

export default router;