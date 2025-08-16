/**
 * Speed Preferences Database Queries
 * PRD Reference: PRD-1.2.6-gpt5-speed-selection.md
 * Description: Database operations for user speed preferences and analytics
 * Created: 2025-08-15
 */

import { query } from '../connection.js';

/**
 * Get user's speed preference
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} User's speed preference data
 */
async function getUserSpeedPreference(userId) {
  try {
    const result = await query(`
      SELECT 
        id,
        speed_preference,
        subscription_tier,
        created_at,
        updated_at
      FROM users 
      WHERE id = $1 AND is_active = TRUE AND deleted_at IS NULL
    `, [userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];
    
    return {
      userId: user.id,
      speedPreference: user.speed_preference || 'balanced',
      subscriptionTier: user.subscription_tier,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  } catch (error) {
    console.error('Failed to get user speed preference:', error.message);
    throw error;
  }
}

/**
 * Update user's speed preference
 * @param {string} userId - User UUID
 * @param {string} speedPreference - Speed preference (super_fast, fast, balanced, high_accuracy)
 * @returns {Promise<Object>} Updated user data
 */
async function updateUserSpeedPreference(userId, speedPreference) {
  try {
    // Validate speed preference
    const validSpeedModes = ['super_fast', 'fast', 'balanced', 'high_accuracy'];
    if (!validSpeedModes.includes(speedPreference)) {
      throw new Error(`Invalid speed preference. Must be one of: ${validSpeedModes.join(', ')}`);
    }

    const result = await query(`
      UPDATE users 
      SET 
        speed_preference = $2,
        updated_at = NOW()
      WHERE id = $1 AND is_active = TRUE AND deleted_at IS NULL
      RETURNING 
        id,
        speed_preference,
        subscription_tier,
        updated_at
    `, [userId, speedPreference]);

    if (result.rows.length === 0) {
      throw new Error('User not found or update failed');
    }

    const user = result.rows[0];
    
    return {
      userId: user.id,
      speedPreference: user.speed_preference,
      subscriptionTier: user.subscription_tier,
      updatedAt: user.updated_at
    };
  } catch (error) {
    console.error('Failed to update user speed preference:', error.message);
    throw error;
  }
}

/**
 * Record speed analytics for an analysis
 * @param {Object} analyticsData - Analytics data to record
 * @returns {Promise<Object>} Recorded analytics data
 */
async function recordSpeedAnalytics(analyticsData) {
  try {
    const {
      userId,
      analysisId = null,
      requestId = null,
      speedMode,
      reasoningEffort = null,
      responseTimeMs,
      targetResponseTime = null,
      withinTargetTime = false,
      costMultiplier = 1.0,
      baseCost = 0.0,
      totalCost = 0.0,
      tokensUsed = 0,
      modelUsed,
      fallbackUsed = false,
      retryCount = 0,
      endpoint = null,
      userAgent = null,
      ipAddress = null,
      verdict = null,
      confidence = null,
      analysisSuccessful = true,
      errorType = null
    } = analyticsData;

    // Validate required fields
    if (!userId || !speedMode || !responseTimeMs || !modelUsed) {
      throw new Error('Missing required analytics data: userId, speedMode, responseTimeMs, and modelUsed are required');
    }

    const result = await query(`
      INSERT INTO speed_analytics (
        user_id, analysis_id, request_id, speed_mode, reasoning_effort,
        response_time_ms, target_response_time, within_target_time,
        cost_multiplier, base_cost, total_cost, tokens_used,
        model_used, fallback_used, retry_count,
        endpoint, user_agent, ip_address,
        verdict, confidence, analysis_successful, error_type,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18,
        $19, $20, $21, $22,
        NOW()
      )
      RETURNING 
        id, user_id, speed_mode, response_time_ms, total_cost, created_at
    `, [
      userId, analysisId, requestId, speedMode, reasoningEffort,
      responseTimeMs, targetResponseTime, withinTargetTime,
      costMultiplier, baseCost, totalCost, tokensUsed,
      modelUsed, fallbackUsed, retryCount,
      endpoint, userAgent, ipAddress,
      verdict, confidence, analysisSuccessful, errorType
    ]);

    const analytics = result.rows[0];
    
    return {
      id: analytics.id,
      userId: analytics.user_id,
      speedMode: analytics.speed_mode,
      responseTimeMs: analytics.response_time_ms,
      totalCost: parseFloat(analytics.total_cost),
      createdAt: analytics.created_at
    };
  } catch (error) {
    console.error('Failed to record speed analytics:', error.message);
    throw error;
  }
}

/**
 * Get speed analytics for a user
 * @param {string} userId - User UUID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Analytics data
 */
async function getUserSpeedAnalytics(userId, options = {}) {
  try {
    const {
      limit = 50,
      offset = 0,
      speedMode = null,
      startDate = null,
      endDate = null,
      includeFailures = true
    } = options;

    let whereClause = 'WHERE user_id = $1 AND deleted_at IS NULL';
    const params = [userId];
    let paramCount = 1;

    if (speedMode) {
      paramCount++;
      whereClause += ` AND speed_mode = $${paramCount}`;
      params.push(speedMode);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND created_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND created_at <= $${paramCount}`;
      params.push(endDate);
    }

    if (!includeFailures) {
      whereClause += ' AND analysis_successful = TRUE';
    }

    const result = await query(`
      SELECT 
        id,
        speed_mode,
        reasoning_effort,
        response_time_ms,
        target_response_time,
        within_target_time,
        cost_multiplier,
        total_cost,
        tokens_used,
        model_used,
        fallback_used,
        retry_count,
        verdict,
        confidence,
        analysis_successful,
        error_type,
        created_at
      FROM speed_analytics 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, limit, offset]);

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM speed_analytics 
      ${whereClause}
    `, params);

    return {
      analytics: result.rows.map(row => ({
        id: row.id,
        speedMode: row.speed_mode,
        reasoningEffort: row.reasoning_effort,
        responseTimeMs: row.response_time_ms,
        targetResponseTime: row.target_response_time,
        withinTargetTime: row.within_target_time,
        costMultiplier: parseFloat(row.cost_multiplier),
        totalCost: parseFloat(row.total_cost),
        tokensUsed: row.tokens_used,
        modelUsed: row.model_used,
        fallbackUsed: row.fallback_used,
        retryCount: row.retry_count,
        verdict: row.verdict,
        confidence: row.confidence,
        analysisSuccessful: row.analysis_successful,
        errorType: row.error_type,
        createdAt: row.created_at
      })),
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        hasMore: (offset + limit) < parseInt(countResult.rows[0].total)
      }
    };
  } catch (error) {
    console.error('Failed to get user speed analytics:', error.message);
    throw error;
  }
}

/**
 * Get speed analytics summary for admin/monitoring
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Analytics summary
 */
async function getSpeedAnalyticsSummary(options = {}) {
  try {
    const {
      startDate = null,
      endDate = null,
      groupBy = 'speed_mode' // speed_mode, model_used, date
    } = options;

    let whereClause = 'WHERE deleted_at IS NULL';
    const params = [];
    let paramCount = 0;

    if (startDate) {
      paramCount++;
      whereClause += ` AND created_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND created_at <= $${paramCount}`;
      params.push(endDate);
    }

    let groupByClause = '';
    let selectClause = '';

    switch (groupBy) {
      case 'speed_mode':
        selectClause = 'speed_mode as group_key';
        groupByClause = 'GROUP BY speed_mode';
        break;
      case 'model_used':
        selectClause = 'model_used as group_key';
        groupByClause = 'GROUP BY model_used';
        break;
      case 'date':
        selectClause = 'DATE(created_at) as group_key';
        groupByClause = 'GROUP BY DATE(created_at)';
        break;
      default:
        selectClause = 'speed_mode as group_key';
        groupByClause = 'GROUP BY speed_mode';
    }

    const result = await query(`
      SELECT 
        ${selectClause},
        COUNT(*) as total_analyses,
        COUNT(*) FILTER (WHERE analysis_successful = TRUE) as successful_analyses,
        AVG(response_time_ms) as avg_response_time,
        AVG(response_time_ms) FILTER (WHERE within_target_time = TRUE) as avg_response_time_within_target,
        COUNT(*) FILTER (WHERE within_target_time = TRUE) as within_target_count,
        SUM(total_cost) as total_cost,
        AVG(total_cost) as avg_cost,
        SUM(tokens_used) as total_tokens,
        AVG(tokens_used) as avg_tokens,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) FILTER (WHERE fallback_used = TRUE) as fallback_count
      FROM speed_analytics 
      ${whereClause}
      ${groupByClause}
      ORDER BY group_key
    `, params);

    return {
      summary: result.rows.map(row => ({
        groupKey: row.group_key,
        totalAnalyses: parseInt(row.total_analyses),
        successfulAnalyses: parseInt(row.successful_analyses),
        successRate: parseFloat((row.successful_analyses / row.total_analyses * 100).toFixed(2)),
        avgResponseTime: parseFloat(row.avg_response_time),
        avgResponseTimeWithinTarget: parseFloat(row.avg_response_time_within_target),
        withinTargetCount: parseInt(row.within_target_count),
        withinTargetRate: parseFloat((row.within_target_count / row.total_analyses * 100).toFixed(2)),
        totalCost: parseFloat(row.total_cost),
        avgCost: parseFloat(row.avg_cost),
        totalTokens: parseInt(row.total_tokens),
        avgTokens: parseFloat(row.avg_tokens),
        uniqueUsers: parseInt(row.unique_users),
        fallbackCount: parseInt(row.fallback_count),
        fallbackRate: parseFloat((row.fallback_count / row.total_analyses * 100).toFixed(2))
      })),
      groupBy,
      dateRange: {
        startDate,
        endDate
      }
    };
  } catch (error) {
    console.error('Failed to get speed analytics summary:', error.message);
    throw error;
  }
}

export {
  getUserSpeedPreference,
  updateUserSpeedPreference,
  recordSpeedAnalytics,
  getUserSpeedAnalytics,
  getSpeedAnalyticsSummary
};