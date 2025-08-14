/**
 * Trade Context Builder Service
 * Builds comprehensive context for psychology coaching and AI prompts
 */

import { Op } from 'sequelize';
import { tradingModels } from '../lib/trading-models.mjs';
import { database } from '../lib/database.mjs';
import { logger } from '../lib/logger.mjs';

const { Trade, CoachingSession, PsychologyPattern, TradePlan, Conversation } = tradingModels;
const { models: { User } } = database;

export class TradeContextBuilder {

  /**
   * Build comprehensive trading context for AI coaching
   */
  async buildComprehensiveContext(userId, options = {}) {
    try {
      const {
        includeTradeHistory = true,
        includeCoachingHistory = true,
        includePsychologyPatterns = true,
        includePerformanceMetrics = true,
        includePlanAdherence = true,
        includeMarketContext = false,
        tradeHistoryDays = 30,
        coachingHistoryDays = 14,
        maxTrades = 50,
        maxCoachingSessions = 20
      } = options;

      const context = {
        userId,
        timestamp: new Date(),
        contextVersion: '1.0'
      };

      // Build context components in parallel for performance
      const contextPromises = [];

      if (includeTradeHistory) {
        contextPromises.push(
          this.buildTradeHistoryContext(userId, tradeHistoryDays, maxTrades)
            .then(result => context.tradeHistory = result)
        );
      }

      if (includeCoachingHistory) {
        contextPromises.push(
          this.buildCoachingHistoryContext(userId, coachingHistoryDays, maxCoachingSessions)
            .then(result => context.coachingHistory = result)
        );
      }

      if (includePsychologyPatterns) {
        contextPromises.push(
          this.buildPsychologyPatternsContext(userId)
            .then(result => context.psychologyPatterns = result)
        );
      }

      if (includePerformanceMetrics) {
        contextPromises.push(
          this.buildPerformanceMetricsContext(userId, tradeHistoryDays)
            .then(result => context.performanceMetrics = result)
        );
      }

      if (includePlanAdherence) {
        contextPromises.push(
          this.buildPlanAdherenceContext(userId, tradeHistoryDays)
            .then(result => context.planAdherence = result)
        );
      }

      if (includeMarketContext) {
        contextPromises.push(
          this.buildMarketContext()
            .then(result => context.marketContext = result)
        );
      }

      await Promise.all(contextPromises);

      // Add context summary
      context.summary = this.generateContextSummary(context);

      logger.info('Comprehensive trading context built', {
        userId,
        components: Object.keys(context).filter(k => k !== 'userId' && k !== 'timestamp'),
        tradeCount: context.tradeHistory?.trades?.length || 0,
        sessionCount: context.coachingHistory?.sessions?.length || 0
      });

      return context;

    } catch (error) {
      logger.error('Failed to build comprehensive context', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Build trade history context
   */
  async buildTradeHistoryContext(userId, days = 30, maxTrades = 50) {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      const trades = await Trade.findAll({
        where: {
          userId,
          entryTime: { [Op.gte]: sinceDate }
        },
        include: [
          { model: TradePlan, as: 'tradePlan' }
        ],
        order: [['entryTime', 'DESC']],
        limit: maxTrades
      });

      // Separate training vs real trades
      const trainingTrades = trades.filter(t => t.tradeType === 'Training');
      const realTrades = trades.filter(t => t.tradeType === 'Real');

      // Calculate metrics for each type
      const trainingMetrics = this.calculateTradeMetrics(trainingTrades);
      const realMetrics = this.calculateTradeMetrics(realTrades);

      // Analyze recent patterns
      const recentPatterns = this.analyzeRecentTradePatterns(trades);

      // Get instrument breakdown
      const instrumentBreakdown = this.getInstrumentBreakdown(trades);

      // Get emotional state analysis
      const emotionalAnalysis = this.analyzeEmotionalStates(trades);

      return {
        period: `${days} days`,
        totalTrades: trades.length,
        trainingTrades: {
          count: trainingTrades.length,
          metrics: trainingMetrics
        },
        realTrades: {
          count: realTrades.length,
          metrics: realMetrics
        },
        recentPatterns,
        instrumentBreakdown,
        emotionalAnalysis,
        trades: trades.slice(0, 20).map(trade => this.formatTradeForContext(trade))
      };

    } catch (error) {
      logger.error('Failed to build trade history context', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Build coaching history context
   */
  async buildCoachingHistoryContext(userId, days = 14, maxSessions = 20) {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      const sessions = await CoachingSession.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: sinceDate }
        },
        include: [
          {
            model: Trade,
            as: 'relatedTrades',
            through: { attributes: [] }
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: maxSessions
      });

      // Analyze coaching themes
      const coachingThemes = this.analyzeCoachingThemes(sessions);

      // Get progress tracking
      const progressTracking = this.trackCoachingProgress(sessions);

      // Get session type breakdown
      const sessionTypeBreakdown = this.getSessionTypeBreakdown(sessions);

      return {
        period: `${days} days`,
        totalSessions: sessions.length,
        sessionTypeBreakdown,
        coachingThemes,
        progressTracking,
        recentSessions: sessions.slice(0, 10).map(session => this.formatSessionForContext(session))
      };

    } catch (error) {
      logger.error('Failed to build coaching history context', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Build psychology patterns context
   */
  async buildPsychologyPatternsContext(userId) {
    try {
      const patterns = await PsychologyPattern.findAll({
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

      // Group patterns by type
      const patternsByType = patterns.reduce((acc, pattern) => {
        if (!acc[pattern.patternType]) {
          acc[pattern.patternType] = [];
        }
        acc[pattern.patternType].push(pattern);
        return acc;
      }, {});

      // Identify critical patterns
      const criticalPatterns = patterns.filter(p => p.severity === 'Critical' || p.severity === 'High');

      // Calculate pattern impact
      const totalImpact = patterns.reduce((sum, p) => sum + (p.impactOnPerformance || 0), 0);

      return {
        totalPatterns: patterns.length,
        criticalPatterns: criticalPatterns.length,
        patternsByType,
        totalImpact,
        topPatterns: patterns.slice(0, 5).map(pattern => ({
          type: pattern.patternType,
          name: pattern.patternName,
          description: pattern.description,
          severity: pattern.severity,
          frequency: pattern.frequency,
          impact: pattern.impactOnPerformance,
          lastObserved: pattern.lastObserved
        }))
      };

    } catch (error) {
      logger.error('Failed to build psychology patterns context', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Build performance metrics context
   */
  async buildPerformanceMetricsContext(userId, days = 30) {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      // Get trades for the period
      const trades = await Trade.findAll({
        where: {
          userId,
          entryTime: { [Op.gte]: sinceDate },
          status: 'Closed'
        },
        order: [['entryTime', 'ASC']]
      });

      if (trades.length === 0) {
        return {
          period: `${days} days`,
          message: 'No closed trades in this period'
        };
      }

      // Calculate comprehensive metrics
      const metrics = this.calculateAdvancedMetrics(trades);

      // Calculate daily performance
      const dailyPerformance = this.calculateDailyPerformance(trades);

      // Calculate streaks
      const streaks = this.calculateStreaks(trades);

      // Calculate drawdown
      const drawdown = this.calculateDrawdown(trades);

      // Risk metrics
      const riskMetrics = this.calculateRiskMetrics(trades);

      return {
        period: `${days} days`,
        overview: metrics,
        dailyPerformance,
        streaks,
        drawdown,
        riskMetrics,
        tradeCount: trades.length,
        profitableDays: dailyPerformance.filter(d => d.pnl > 0).length,
        totalDays: dailyPerformance.length
      };

    } catch (error) {
      logger.error('Failed to build performance metrics context', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Build plan adherence context
   */
  async buildPlanAdherenceContext(userId, days = 30) {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      const plans = await TradePlan.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: sinceDate }
        },
        include: [
          { model: Trade, as: 'executedTrade' }
        ],
        order: [['createdAt', 'DESC']]
      });

      if (plans.length === 0) {
        return {
          period: `${days} days`,
          message: 'No trade plans in this period'
        };
      }

      const executedPlans = plans.filter(p => p.status === 'Executed' && p.executedTrade);
      const avgAdherence = executedPlans.length > 0 
        ? executedPlans.reduce((sum, p) => sum + (p.adherenceScore || 0), 0) / executedPlans.length 
        : 0;

      // Analyze deviation patterns
      const deviationPatterns = this.analyzeDeviationPatterns(executedPlans);

      // Plan success rate
      const successfulPlans = executedPlans.filter(p => p.executedTrade && p.executedTrade.pnlDollars > 0);
      const planSuccessRate = executedPlans.length > 0 
        ? Math.round((successfulPlans.length / executedPlans.length) * 100) 
        : 0;

      return {
        period: `${days} days`,
        totalPlans: plans.length,
        executedPlans: executedPlans.length,
        cancelledPlans: plans.filter(p => p.status === 'Cancelled').length,
        averageAdherence: Math.round(avgAdherence * 100),
        planSuccessRate,
        deviationPatterns,
        recentPlans: plans.slice(0, 10).map(plan => ({
          id: plan.id,
          name: plan.name,
          instrument: plan.instrument,
          direction: plan.direction,
          status: plan.status,
          adherenceScore: plan.adherenceScore,
          executed: !!plan.executedTrade,
          profitable: plan.executedTrade ? plan.executedTrade.pnlDollars > 0 : null,
          createdAt: plan.createdAt
        }))
      };

    } catch (error) {
      logger.error('Failed to build plan adherence context', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Build market context
   */
  async buildMarketContext() {
    try {
      const now = new Date();
      const marketHours = this.getMarketHours(now);
      
      return {
        currentTime: now,
        marketState: marketHours.state,
        timeToOpen: marketHours.timeToOpen,
        timeToClose: marketHours.timeToClose,
        timezone: 'America/New_York',
        tradingDay: this.getTradingDay(now)
      };

    } catch (error) {
      logger.error('Failed to build market context', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate context summary for AI prompts
   */
  generateContextSummary(context) {
    const summary = [];

    if (context.tradeHistory) {
      const th = context.tradeHistory;
      summary.push(`Recent ${th.period}: ${th.totalTrades} trades total (${th.realTrades.count} real, ${th.trainingTrades.count} training)`);
      
      if (th.realTrades.count > 0) {
        summary.push(`Real trading: ${th.realTrades.metrics.winRate}% win rate, ${th.realTrades.metrics.avgR}R avg, $${th.realTrades.metrics.totalPnl} total P&L`);
      }
      
      if (th.trainingTrades.count > 0) {
        summary.push(`Training: ${th.trainingTrades.metrics.winRate}% win rate, ${th.trainingTrades.metrics.avgR}R avg`);
      }
    }

    if (context.psychologyPatterns && context.psychologyPatterns.totalPatterns > 0) {
      summary.push(`${context.psychologyPatterns.totalPatterns} active psychology patterns identified, ${context.psychologyPatterns.criticalPatterns} critical`);
    }

    if (context.planAdherence && context.planAdherence.totalPlans > 0) {
      summary.push(`Plan adherence: ${context.planAdherence.averageAdherence}% average (${context.planAdherence.executedPlans}/${context.planAdherence.totalPlans} plans executed)`);
    }

    if (context.coachingHistory && context.coachingHistory.totalSessions > 0) {
      summary.push(`${context.coachingHistory.totalSessions} coaching sessions in ${context.coachingHistory.period}`);
    }

    return summary.join('. ');
  }

  // Helper methods for calculations and analysis

  calculateTradeMetrics(trades) {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        avgR: 0,
        totalPnl: 0,
        avgPnl: 0,
        bestTrade: 0,
        worstTrade: 0
      };
    }

    const closedTrades = trades.filter(t => t.status === 'Closed' && t.pnlDollars !== null);
    if (closedTrades.length === 0) return this.calculateTradeMetrics([]);

    const winners = closedTrades.filter(t => t.pnlDollars > 0);
    const winRate = Math.round((winners.length / closedTrades.length) * 100);
    
    const totalPnl = closedTrades.reduce((sum, t) => sum + t.pnlDollars, 0);
    const avgPnl = totalPnl / closedTrades.length;
    
    const avgWin = winners.length > 0 ? winners.reduce((sum, t) => sum + t.pnlDollars, 0) / winners.length : 0;
    const losers = closedTrades.filter(t => t.pnlDollars <= 0);
    const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((sum, t) => sum + t.pnlDollars, 0) / losers.length) : 0;
    const avgR = avgLoss > 0 ? avgWin / avgLoss : 0;

    return {
      totalTrades: trades.length,
      closedTrades: closedTrades.length,
      winRate,
      avgR: Math.round(avgR * 100) / 100,
      totalPnl: Math.round(totalPnl * 100) / 100,
      avgPnl: Math.round(avgPnl * 100) / 100,
      bestTrade: Math.max(...closedTrades.map(t => t.pnlDollars)),
      worstTrade: Math.min(...closedTrades.map(t => t.pnlDollars))
    };
  }

  analyzeRecentTradePatterns(trades) {
    const patterns = {
      consecutiveWins: 0,
      consecutiveLosses: 0,
      currentStreak: null,
      mostTradedInstrument: null,
      preferredDirection: null,
      avgTradesPerDay: 0
    };

    if (trades.length === 0) return patterns;

    const closedTrades = trades.filter(t => t.status === 'Closed' && t.pnlDollars !== null);
    if (closedTrades.length === 0) return patterns;

    // Calculate streaks
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;

    for (const trade of closedTrades.reverse()) { // Start from oldest
      if (trade.pnlDollars > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    }

    patterns.consecutiveWins = maxWinStreak;
    patterns.consecutiveLosses = maxLossStreak;
    patterns.currentStreak = currentWinStreak > 0 ? `${currentWinStreak} wins` : 
                            currentLossStreak > 0 ? `${currentLossStreak} losses` : 'No streak';

    // Most traded instrument
    const instrumentCounts = {};
    trades.forEach(trade => {
      instrumentCounts[trade.instrument] = (instrumentCounts[trade.instrument] || 0) + 1;
    });
    patterns.mostTradedInstrument = Object.keys(instrumentCounts).reduce((a, b) => 
      instrumentCounts[a] > instrumentCounts[b] ? a : b, Object.keys(instrumentCounts)[0]);

    // Preferred direction
    const directionCounts = { Long: 0, Short: 0 };
    trades.forEach(trade => {
      directionCounts[trade.direction]++;
    });
    patterns.preferredDirection = directionCounts.Long > directionCounts.Short ? 'Long' : 'Short';

    return patterns;
  }

  getInstrumentBreakdown(trades) {
    const breakdown = {};
    
    trades.forEach(trade => {
      if (!breakdown[trade.instrument]) {
        breakdown[trade.instrument] = {
          count: 0,
          totalPnl: 0,
          winRate: 0
        };
      }
      
      breakdown[trade.instrument].count++;
      if (trade.pnlDollars) {
        breakdown[trade.instrument].totalPnl += trade.pnlDollars;
      }
    });

    // Calculate win rates
    Object.keys(breakdown).forEach(instrument => {
      const instrumentTrades = trades.filter(t => t.instrument === instrument && t.status === 'Closed');
      const winners = instrumentTrades.filter(t => t.pnlDollars > 0);
      breakdown[instrument].winRate = instrumentTrades.length > 0 ? 
        Math.round((winners.length / instrumentTrades.length) * 100) : 0;
    });

    return breakdown;
  }

  analyzeEmotionalStates(trades) {
    const emotionalData = {
      states: {},
      mostCommon: null,
      impactOnPerformance: {}
    };

    const tradesWithEmotions = trades.filter(t => t.emotionalState);
    
    if (tradesWithEmotions.length === 0) return emotionalData;

    // Count emotional states
    tradesWithEmotions.forEach(trade => {
      const state = trade.emotionalState;
      if (!emotionalData.states[state]) {
        emotionalData.states[state] = 0;
      }
      emotionalData.states[state]++;
    });

    // Find most common
    emotionalData.mostCommon = Object.keys(emotionalData.states).reduce((a, b) => 
      emotionalData.states[a] > emotionalData.states[b] ? a : b);

    // Analyze impact on performance
    Object.keys(emotionalData.states).forEach(state => {
      const stateTrades = tradesWithEmotions.filter(t => t.emotionalState === state && t.status === 'Closed');
      if (stateTrades.length > 0) {
        const avgPnl = stateTrades.reduce((sum, t) => sum + (t.pnlDollars || 0), 0) / stateTrades.length;
        const winRate = Math.round((stateTrades.filter(t => t.pnlDollars > 0).length / stateTrades.length) * 100);
        
        emotionalData.impactOnPerformance[state] = {
          avgPnl: Math.round(avgPnl * 100) / 100,
          winRate,
          tradeCount: stateTrades.length
        };
      }
    });

    return emotionalData;
  }

  formatTradeForContext(trade) {
    return {
      id: trade.id,
      type: trade.tradeType,
      instrument: trade.instrument,
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      pnl: trade.pnlDollars,
      points: trade.pnlPoints,
      status: trade.status,
      emotionalState: trade.emotionalState,
      disciplineScore: trade.disciplineScore,
      planAdherence: trade.planAdherence,
      entryTime: trade.entryTime,
      exitTime: trade.exitTime,
      hadPlan: !!trade.tradePlanId
    };
  }

  analyzeCoachingThemes(sessions) {
    const themes = {};
    
    sessions.forEach(session => {
      // Analyze emotional triggers
      if (session.emotionalTriggers) {
        session.emotionalTriggers.forEach(trigger => {
          themes[trigger] = (themes[trigger] || 0) + 1;
        });
      }
      
      // Analyze behavioral patterns
      if (session.behavioralPatterns) {
        session.behavioralPatterns.forEach(pattern => {
          themes[pattern] = (themes[pattern] || 0) + 1;
        });
      }
    });

    return Object.entries(themes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }));
  }

  trackCoachingProgress(sessions) {
    // Simple progress tracking based on session frequency and themes
    return {
      sessionsThisWeek: sessions.filter(s => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(s.createdAt) >= weekAgo;
      }).length,
      averageSessionsPerWeek: Math.round(sessions.length / 2), // Assuming 2-week period
      consistencyScore: sessions.length > 0 ? Math.min(100, sessions.length * 10) : 0
    };
  }

  getSessionTypeBreakdown(sessions) {
    const breakdown = {};
    sessions.forEach(session => {
      breakdown[session.sessionType] = (breakdown[session.sessionType] || 0) + 1;
    });
    return breakdown;
  }

  formatSessionForContext(session) {
    return {
      id: session.id,
      type: session.sessionType,
      marketState: session.marketState,
      emotionalTriggers: session.emotionalTriggers,
      recommendations: session.recommendations,
      relatedTradeCount: session.relatedTradeIds?.length || 0,
      createdAt: session.createdAt
    };
  }

  calculateAdvancedMetrics(trades) {
    const basic = this.calculateTradeMetrics(trades);
    
    // Additional advanced metrics
    const profitFactor = basic.totalPnl > 0 ? 
      (trades.filter(t => t.pnlDollars > 0).reduce((sum, t) => sum + t.pnlDollars, 0)) /
      Math.abs(trades.filter(t => t.pnlDollars < 0).reduce((sum, t) => sum + t.pnlDollars, 0)) : 0;

    return {
      ...basic,
      profitFactor: Math.round(profitFactor * 100) / 100,
      sharpeRatio: this.calculateSharpeRatio(trades),
      maxConsecutiveWins: this.calculateMaxConsecutive(trades, true),
      maxConsecutiveLosses: this.calculateMaxConsecutive(trades, false)
    };
  }

  calculateSharpeRatio(trades) {
    if (trades.length < 2) return 0;
    
    const returns = trades.map(t => t.pnlDollars || 0);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? Math.round((avgReturn / stdDev) * 100) / 100 : 0;
  }

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

  calculateDailyPerformance(trades) {
    const dailyData = {};
    
    trades.forEach(trade => {
      const date = trade.entryTime.toDateString();
      if (!dailyData[date]) {
        dailyData[date] = { date, pnl: 0, trades: 0 };
      }
      dailyData[date].pnl += trade.pnlDollars || 0;
      dailyData[date].trades++;
    });

    return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  calculateStreaks(trades) {
    // Implementation for calculating winning/losing streaks
    return {
      currentStreak: 0,
      longestWinningStreak: 0,
      longestLosingStreak: 0
    };
  }

  calculateDrawdown(trades) {
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnl = 0;

    trades.forEach(trade => {
      runningPnl += trade.pnlDollars || 0;
      peak = Math.max(peak, runningPnl);
      const drawdown = peak - runningPnl;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    return {
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      currentDrawdown: Math.round((peak - runningPnl) * 100) / 100
    };
  }

  calculateRiskMetrics(trades) {
    const riskedAmounts = trades.map(t => t.riskAmount || 0).filter(r => r > 0);
    
    return {
      avgRiskPerTrade: riskedAmounts.length > 0 ? 
        Math.round((riskedAmounts.reduce((sum, r) => sum + r, 0) / riskedAmounts.length) * 100) / 100 : 0,
      maxRiskPerTrade: Math.max(...riskedAmounts, 0),
      totalRisked: Math.round(riskedAmounts.reduce((sum, r) => sum + r, 0) * 100) / 100
    };
  }

  analyzeDeviationPatterns(plans) {
    const deviations = {};
    
    plans.forEach(plan => {
      if (plan.deviations) {
        plan.deviations.forEach(deviation => {
          deviations[deviation] = (deviations[deviation] || 0) + 1;
        });
      }
    });

    return Object.entries(deviations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([deviation, count]) => ({ deviation, count }));
  }

  getMarketHours(date) {
    const now = new Date(date);
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hours = easternTime.getHours();
    const minutes = easternTime.getMinutes();
    const currentTime = hours * 60 + minutes;

    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM

    let state;
    let timeToOpen = null;
    let timeToClose = null;

    if (currentTime < marketOpen) {
      state = 'Pre-Open';
      timeToOpen = marketOpen - currentTime;
    } else if (currentTime < marketClose) {
      state = 'Open';
      timeToClose = marketClose - currentTime;
    } else {
      state = 'After-Hours';
      // Calculate time to next day's open
      timeToOpen = (24 * 60) - currentTime + marketOpen;
    }

    return { state, timeToOpen, timeToClose };
  }

  getTradingDay(date) {
    const day = date.getDay();
    if (day === 0 || day === 6) {
      return 'Weekend';
    }
    return 'Weekday';
  }
}

export default TradeContextBuilder;