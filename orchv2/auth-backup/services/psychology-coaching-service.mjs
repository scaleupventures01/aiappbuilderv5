/**
 * Psychology Coaching Service
 * Handles trade-aware psychology coaching with memory and pattern recognition
 */

import { Op } from 'sequelize';
import { tradingModels } from '../lib/trading-models.mjs';
import { database } from '../lib/database.mjs';
import { logger } from '../lib/logger.mjs';

const { Trade, CoachingSession, PsychologyPattern, TradePlan, Conversation } = tradingModels;
const { models: { User } } = database;

export class PsychologyCoachingService {
  
  /**
   * Create a psychology coaching session with full trade context
   */
  async createCoachingSession(userId, sessionData) {
    const transaction = await database.sequelize.transaction();
    
    try {
      const {
        sessionType,
        userMessage,
        marketState,
        relatedTradeIds = [],
        conversationId
      } = sessionData;

      // Get user's recent performance context
      const performanceContext = await this.buildPerformanceContext(userId);
      
      // Get relevant trade history for context
      const tradeContext = await this.buildTradeContext(userId, relatedTradeIds);
      
      // Get existing psychology patterns
      const psychologyPatterns = await this.getActivePatterns(userId);
      
      // Build context-aware coaching prompt
      const coachingPrompt = await this.buildCoachingPrompt({
        userMessage,
        sessionType,
        marketState,
        performanceContext,
        tradeContext,
        psychologyPatterns
      });

      // Generate AI response (placeholder - integrate with your AI service)
      const aiResponse = await this.generateCoachingResponse(coachingPrompt);
      
      // Extract insights from the coaching session
      const insights = await this.extractCoachingInsights(userMessage, aiResponse);

      // Create coaching session record
      const coachingSession = await CoachingSession.create({
        userId,
        sessionType,
        marketState,
        relatedTradeIds,
        conversationId,
        coachingPrompt,
        aiResponse,
        emotionalTriggers: insights.emotionalTriggers,
        behavioralPatterns: insights.behavioralPatterns,
        recommendations: insights.recommendations,
        performanceContext,
        riskManagementNotes: insights.riskManagementNotes
      }, { transaction });

      // Update or create psychology patterns
      await this.updatePsychologyPatterns(userId, insights, coachingSession.id, transaction);
      
      // Link to related trades
      if (relatedTradeIds.length > 0) {
        await this.linkSessionToTrades(coachingSession.id, relatedTradeIds, transaction);
      }

      await transaction.commit();

      logger.info('Psychology coaching session created', {
        userId,
        sessionId: coachingSession.id,
        sessionType,
        relatedTrades: relatedTradeIds.length
      });

      return {
        session: coachingSession,
        aiResponse,
        insights,
        context: {
          performance: performanceContext,
          trades: tradeContext,
          patterns: psychologyPatterns
        }
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create coaching session', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Build comprehensive performance context for coaching
   */
  async buildPerformanceContext(userId, days = 7) {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      // Get recent trades (both training and real)
      const recentTrades = await Trade.findAll({
        where: {
          userId,
          entryTime: { [Op.gte]: sinceDate }
        },
        order: [['entryTime', 'DESC']],
        limit: 50
      });

      // Separate training vs real trades
      const trainingTrades = recentTrades.filter(t => t.tradeType === 'Training');
      const realTrades = recentTrades.filter(t => t.tradeType === 'Real');

      // Calculate performance metrics
      const trainingMetrics = this.calculateTradeMetrics(trainingTrades);
      const realMetrics = this.calculateTradeMetrics(realTrades);

      // Get plan adherence stats
      const planAdherenceStats = await this.calculatePlanAdherenceStats(userId, days);

      // Get recent psychology patterns
      const recentPatterns = await PsychologyPattern.findAll({
        where: {
          userId,
          lastObserved: { [Op.gte]: sinceDate },
          isActive: true
        },
        order: [['severity', 'DESC'], ['frequency', 'DESC']]
      });

      return {
        period: `${days} days`,
        trainingTrades: {
          count: trainingTrades.length,
          metrics: trainingMetrics
        },
        realTrades: {
          count: realTrades.length,
          metrics: realMetrics
        },
        comparison: this.compareTrainingVsReal(trainingMetrics, realMetrics),
        planAdherence: planAdherenceStats,
        activePatterns: recentPatterns.map(p => ({
          type: p.patternType,
          name: p.patternName,
          severity: p.severity,
          frequency: p.frequency
        })),
        lastUpdated: new Date()
      };

    } catch (error) {
      logger.error('Failed to build performance context', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Build trade context for coaching prompts
   */
  async buildTradeContext(userId, relatedTradeIds = []) {
    try {
      let trades = [];
      
      if (relatedTradeIds.length > 0) {
        // Get specific trades
        trades = await Trade.findAll({
          where: {
            id: { [Op.in]: relatedTradeIds },
            userId
          },
          include: [
            { model: TradePlan, as: 'tradePlan' }
          ],
          order: [['entryTime', 'DESC']]
        });
      } else {
        // Get recent trades
        trades = await Trade.findAll({
          where: { userId },
          include: [
            { model: TradePlan, as: 'tradePlan' }
          ],
          order: [['entryTime', 'DESC']],
          limit: 10
        });
      }

      return trades.map(trade => ({
        id: trade.id,
        type: trade.tradeType,
        instrument: trade.instrument,
        direction: trade.direction,
        pnl: trade.pnlDollars,
        points: trade.pnlPoints,
        emotionalState: trade.emotionalState,
        disciplineScore: trade.disciplineScore,
        planAdherence: trade.planAdherence,
        deviationReasons: trade.deviationReasons,
        psychologyNotes: trade.psychologyNotes,
        entryTime: trade.entryTime,
        hadPlan: !!trade.tradePlan,
        planDetails: trade.tradePlan ? {
          adherence: trade.tradePlan.adherenceScore,
          deviations: trade.tradePlan.deviations
        } : null
      }));

    } catch (error) {
      logger.error('Failed to build trade context', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get active psychology patterns for user
   */
  async getActivePatterns(userId) {
    try {
      return await PsychologyPattern.findAll({
        where: {
          userId,
          isActive: true
        },
        order: [
          ['severity', 'DESC'],
          ['frequency', 'DESC'],
          ['lastObserved', 'DESC']
        ]
      });
    } catch (error) {
      logger.error('Failed to get active patterns', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Build context-aware coaching prompt
   */
  async buildCoachingPrompt({
    userMessage,
    sessionType,
    marketState,
    performanceContext,
    tradeContext,
    psychologyPatterns
  }) {
    try {
      const prompt = `
You are an elite trading psychology coach with deep expertise in futures trading. Provide coaching based on the following context:

**USER MESSAGE:**
${userMessage}

**SESSION CONTEXT:**
- Session Type: ${sessionType}
- Market State: ${marketState || 'Unknown'}
- Time: ${new Date().toISOString()}

**PERFORMANCE CONTEXT:**
- Recent Trading Period: ${performanceContext.period}
- Training Trades: ${performanceContext.trainingTrades.count} trades
  - Win Rate: ${performanceContext.trainingTrades.metrics.winRate}%
  - Avg R: ${performanceContext.trainingTrades.metrics.avgR}
  - Total P&L: $${performanceContext.trainingTrades.metrics.totalPnl}
- Real Trades: ${performanceContext.realTrades.count} trades
  - Win Rate: ${performanceContext.realTrades.metrics.winRate}%
  - Avg R: ${performanceContext.realTrades.metrics.avgR}
  - Total P&L: $${performanceContext.realTrades.metrics.totalPnl}
- Training vs Real Performance: ${performanceContext.comparison.summary}
- Plan Adherence: ${performanceContext.planAdherence.averageScore}%

**RECENT TRADES CONTEXT:**
${tradeContext.length > 0 ? tradeContext.map(trade => 
  `- ${trade.type} ${trade.instrument} ${trade.direction}: ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl} (${trade.points}pts) | Discipline: ${trade.disciplineScore}/10 | Emotional State: ${trade.emotionalState || 'Unknown'}`
).join('\n') : 'No recent trades to reference'}

**ACTIVE PSYCHOLOGY PATTERNS:**
${psychologyPatterns.length > 0 ? psychologyPatterns.map(pattern => 
  `- ${pattern.patternName} (${pattern.severity}): Frequency ${pattern.frequency}x | ${pattern.description}`
).join('\n') : 'No significant patterns identified yet'}

**COACHING INSTRUCTIONS:**
1. Reference specific trades and performance data in your response
2. Address any psychology patterns you see emerging
3. Provide actionable advice for risk management and discipline
4. Focus on trading psychology, not general emotional support
5. Reference plan adherence and deviations when relevant
6. Compare training vs real performance when helpful
7. Be direct but supportive - this is about trading improvement

Provide your coaching response:`;

      return prompt;

    } catch (error) {
      logger.error('Failed to build coaching prompt', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate AI coaching response (placeholder for AI integration)
   */
  async generateCoachingResponse(coachingPrompt) {
    // TODO: Integrate with OpenAI API or your preferred AI service
    // For now, return a placeholder response
    return `Based on your recent trading activity and the patterns I'm observing, here's my coaching response: [AI response would be generated here based on the comprehensive context provided]`;
  }

  /**
   * Extract coaching insights from session
   */
  async extractCoachingInsights(userMessage, aiResponse) {
    // TODO: Use AI to extract structured insights
    // For now, return placeholder insights
    return {
      emotionalTriggers: [],
      behavioralPatterns: [],
      recommendations: [],
      riskManagementNotes: ''
    };
  }

  /**
   * Update psychology patterns based on coaching session
   */
  async updatePsychologyPatterns(userId, insights, sessionId, transaction) {
    try {
      // This would analyze the insights and update/create patterns
      // Implementation depends on your specific pattern recognition logic
      logger.info('Psychology patterns updated', { userId, sessionId });
    } catch (error) {
      logger.error('Failed to update psychology patterns', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Calculate trade metrics for performance analysis
   */
  calculateTradeMetrics(trades) {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        avgR: 0,
        totalPnl: 0,
        avgPnl: 0,
        bestTrade: 0,
        worstTrade: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0
      };
    }

    const totalTrades = trades.length;
    const winners = trades.filter(t => t.pnlDollars > 0);
    const losers = trades.filter(t => t.pnlDollars <= 0);
    const winRate = Math.round((winners.length / totalTrades) * 100);
    
    const totalPnl = trades.reduce((sum, t) => sum + (t.pnlDollars || 0), 0);
    const avgPnl = totalPnl / totalTrades;
    
    const avgWin = winners.length > 0 ? winners.reduce((sum, t) => sum + t.pnlDollars, 0) / winners.length : 0;
    const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((sum, t) => sum + t.pnlDollars, 0) / losers.length) : 0;
    const avgR = avgLoss > 0 ? avgWin / avgLoss : 0;

    return {
      totalTrades,
      winRate,
      avgR: Math.round(avgR * 100) / 100,
      totalPnl: Math.round(totalPnl * 100) / 100,
      avgPnl: Math.round(avgPnl * 100) / 100,
      bestTrade: Math.max(...trades.map(t => t.pnlDollars || 0)),
      worstTrade: Math.min(...trades.map(t => t.pnlDollars || 0)),
      consecutiveWins: this.calculateMaxConsecutive(trades, true),
      consecutiveLosses: this.calculateMaxConsecutive(trades, false)
    };
  }

  /**
   * Calculate max consecutive wins/losses
   */
  calculateMaxConsecutive(trades, wins = true) {
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (const trade of trades) {
      const isWin = trade.pnlDollars > 0;
      if ((wins && isWin) || (!wins && !isWin)) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return maxStreak;
  }

  /**
   * Compare training vs real trade performance
   */
  compareTrainingVsReal(trainingMetrics, realMetrics) {
    if (trainingMetrics.totalTrades === 0 || realMetrics.totalTrades === 0) {
      return {
        summary: 'Insufficient data for comparison',
        winRateDiff: 0,
        avgRDiff: 0,
        recommendations: []
      };
    }

    const winRateDiff = realMetrics.winRate - trainingMetrics.winRate;
    const avgRDiff = realMetrics.avgR - trainingMetrics.avgR;
    
    let recommendations = [];
    
    if (winRateDiff < -10) {
      recommendations.push('Real trading win rate significantly lower than training - review execution and discipline');
    }
    
    if (avgRDiff < -0.5) {
      recommendations.push('Real trading risk/reward ratio worse than training - focus on exit management');
    }

    return {
      summary: `Real vs Training: Win Rate ${winRateDiff >= 0 ? '+' : ''}${winRateDiff}%, Avg R ${avgRDiff >= 0 ? '+' : ''}${avgRDiff}`,
      winRateDiff,
      avgRDiff,
      recommendations
    };
  }

  /**
   * Calculate plan adherence statistics
   */
  async calculatePlanAdherenceStats(userId, days = 7) {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      const plans = await TradePlan.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: sinceDate },
          status: { [Op.in]: ['Executed', 'Cancelled', 'Invalidated'] }
        }
      });

      if (plans.length === 0) {
        return { averageScore: 0, totalPlans: 0, executedPlans: 0 };
      }

      const executedPlans = plans.filter(p => p.status === 'Executed' && p.adherenceScore !== null);
      const avgScore = executedPlans.length > 0 
        ? executedPlans.reduce((sum, p) => sum + p.adherenceScore, 0) / executedPlans.length 
        : 0;

      return {
        averageScore: Math.round(avgScore * 100),
        totalPlans: plans.length,
        executedPlans: executedPlans.length,
        adherenceScores: executedPlans.map(p => p.adherenceScore)
      };

    } catch (error) {
      logger.error('Failed to calculate plan adherence stats', { userId, error: error.message });
      return { averageScore: 0, totalPlans: 0, executedPlans: 0 };
    }
  }

  /**
   * Link coaching session to trades
   */
  async linkSessionToTrades(sessionId, tradeIds, transaction) {
    try {
      const { CoachingSessionTrade } = tradingModels;
      
      const links = tradeIds.map(tradeId => ({
        coachingSessionId: sessionId,
        tradeId
      }));

      await CoachingSessionTrade.bulkCreate(links, { transaction });
      
    } catch (error) {
      logger.error('Failed to link session to trades', { sessionId, tradeIds, error: error.message });
      throw error;
    }
  }

  /**
   * Get coaching history for user
   */
  async getCoachingHistory(userId, options = {}) {
    try {
      const {
        sessionType,
        days = 30,
        limit = 50,
        includePatterns = false
      } = options;

      const whereClause = { userId };
      
      if (sessionType) {
        whereClause.sessionType = sessionType;
      }

      if (days) {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);
        whereClause.createdAt = { [Op.gte]: sinceDate };
      }

      const include = [];
      if (includePatterns) {
        include.push({
          model: Trade,
          as: 'relatedTrades',
          through: { attributes: [] }
        });
      }

      const sessions = await CoachingSession.findAll({
        where: whereClause,
        include,
        order: [['createdAt', 'DESC']],
        limit
      });

      return sessions;

    } catch (error) {
      logger.error('Failed to get coaching history', { userId, error: error.message });
      throw error;
    }
  }
}

export default PsychologyCoachingService;