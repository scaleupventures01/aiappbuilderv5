/**
 * AI Performance Analyzer Service
 * Provides intelligent performance analysis and coaching insights using AI
 */

import { Op } from 'sequelize';
import { tradingModels } from '../lib/trading-models.mjs';
import { logger } from '../lib/logger.mjs';
import AIPromptTemplates from './ai-prompt-templates.mjs';
import TradeContextBuilder from './trade-context-builder.mjs';

const { Trade, CoachingSession, PsychologyPattern, TradePlan } = tradingModels;

export class AIPerformanceAnalyzer {
  constructor() {
    this.contextBuilder = new TradeContextBuilder();
  }

  /**
   * Perform comprehensive AI-powered performance analysis
   */
  async performComprehensiveAnalysis(userId, options = {}) {
    try {
      const {
        analysisType = 'comprehensive', // 'technical', 'psychological', 'comprehensive'
        timeframe = 30, // days
        focusAreas = null,
        compareBaselines = true,
        generateRecommendations = true
      } = options;

      // Build comprehensive performance context
      const performanceContext = await this.buildPerformanceContext(userId, timeframe);

      if (performanceContext.trades.length < 5) {
        return {
          message: 'Insufficient data for meaningful analysis',
          tradeCount: performanceContext.trades.length,
          minimumRequired: 5
        };
      }

      // Perform AI-powered analysis based on type
      const analysisResults = await this.executeAIAnalysis(analysisType, performanceContext, focusAreas);

      // Generate coaching insights and recommendations
      const coachingInsights = generateRecommendations ? 
        await this.generateCoachingInsights(analysisResults, performanceContext) : null;

      // Compare against baselines if requested
      const baselineComparison = compareBaselines ? 
        await this.performBaselineComparison(userId, analysisResults, timeframe) : null;

      // Generate actionable improvement plan
      const improvementPlan = await this.generateImprovementPlan(analysisResults, coachingInsights, baselineComparison);

      logger.info('Performance analysis completed', {
        userId,
        analysisType,
        timeframe,
        tradesAnalyzed: performanceContext.trades.length,
        insightsGenerated: coachingInsights?.insights?.length || 0
      });

      return {
        analysisResults,
        coachingInsights,
        baselineComparison,
        improvementPlan,
        performanceMetrics: this.calculateAdvancedMetrics(performanceContext.trades),
        summary: this.generateAnalysisSummary(analysisResults, coachingInsights, performanceContext)
      };

    } catch (error) {
      logger.error('Failed to perform performance analysis', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Analyze specific trade or group of trades with AI insights
   */
  async analyzeSpecificTrades(userId, tradeIds, options = {}) {
    try {
      const {
        analysisDepth = 'detailed',
        includeComparisons = true,
        generateLessons = true
      } = options;

      // Get trades and related context
      const trades = await Trade.findAll({
        where: {
          id: { [Op.in]: tradeIds },
          userId
        },
        include: [
          { model: TradePlan, as: 'tradePlan' }
        ],
        order: [['entryTime', 'ASC']]
      });

      if (trades.length === 0) {
        throw new Error('No trades found for analysis');
      }

      // Build context for each trade
      const tradeAnalyses = await Promise.all(
        trades.map(trade => this.analyzeSingleTrade(trade, { analysisDepth, includeComparisons }))
      );

      // Perform comparative analysis if multiple trades
      const comparativeAnalysis = trades.length > 1 ? 
        await this.performComparativeTradeAnalysis(trades, tradeAnalyses) : null;

      // Extract lessons and patterns
      const lessonsLearned = generateLessons ? 
        await this.extractLessonsFromTrades(trades, tradeAnalyses) : null;

      // Generate coaching recommendations
      const coachingRecommendations = await this.generateTradeSpecificCoaching(trades, tradeAnalyses, lessonsLearned);

      return {
        tradeAnalyses,
        comparativeAnalysis,
        lessonsLearned,
        coachingRecommendations,
        summary: this.generateTradeAnalysisSummary(trades, tradeAnalyses)
      };

    } catch (error) {
      logger.error('Failed to analyze specific trades', { userId, tradeIds, error: error.message });
      throw error;
    }
  }

  /**
   * Generate real-time performance insights during active trading
   */
  async generateLivePerformanceInsights(userId, options = {}) {
    try {
      const {
        sessionType = 'Live-Trading',
        currentMarketState = null,
        recentTradeIds = [],
        requestedInsights = null
      } = options;

      // Get recent session context
      const sessionContext = await this.buildLiveSessionContext(userId, sessionType, recentTradeIds);

      // Analyze current performance state
      const currentState = await this.analyzeLivePerformanceState(sessionContext);

      // Generate real-time insights
      const liveInsights = await this.generateRealTimeInsights(currentState, sessionContext, requestedInsights);

      // Provide immediate coaching guidance
      const immediateGuidance = await this.generateImmediateGuidance(currentState, liveInsights, currentMarketState);

      // Set up performance alerts
      const performanceAlerts = this.setupPerformanceAlerts(currentState, sessionContext);

      return {
        currentState,
        liveInsights,
        immediateGuidance,
        performanceAlerts,
        sessionSummary: this.generateSessionSummary(sessionContext, currentState)
      };

    } catch (error) {
      logger.error('Failed to generate live performance insights', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Analyze performance trends and predict future outcomes
   */
  async analyzePerformanceTrends(userId, options = {}) {
    try {
      const {
        trendPeriods = [7, 14, 30, 60], // days
        predictionHorizon = 14, // days ahead
        confidenceLevel = 0.8,
        focusMetrics = ['winRate', 'avgR', 'totalPnl']
      } = options;

      // Gather trend data across multiple timeframes
      const trendData = await this.gatherTrendData(userId, trendPeriods);

      // Perform AI-powered trend analysis
      const trendAnalysis = await this.performTrendAnalysis(trendData, focusMetrics);

      // Generate predictions with confidence intervals
      const predictions = await this.generatePerformancePredictions(trendAnalysis, predictionHorizon, confidenceLevel);

      // Identify trend-based coaching opportunities
      const trendCoaching = await this.generateTrendBasedCoaching(trendAnalysis, predictions);

      // Set up trend monitoring alerts
      const trendAlerts = this.setupTrendMonitoring(trendAnalysis, predictions);

      return {
        trendAnalysis,
        predictions,
        trendCoaching,
        trendAlerts,
        summary: this.generateTrendSummary(trendAnalysis, predictions)
      };

    } catch (error) {
      logger.error('Failed to analyze performance trends', { userId, error: error.message });
      throw error;
    }
  }

  // Private implementation methods

  async buildPerformanceContext(userId, timeframe) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - timeframe);

    const [trades, coachingSessions, patterns, plans] = await Promise.all([
      Trade.findAll({
        where: {
          userId,
          entryTime: { [Op.gte]: sinceDate }
        },
        include: [
          { model: TradePlan, as: 'tradePlan' }
        ],
        order: [['entryTime', 'ASC']]
      }),

      CoachingSession.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: sinceDate }
        },
        order: [['createdAt', 'ASC']]
      }),

      PsychologyPattern.findAll({
        where: {
          userId,
          isActive: true,
          lastObserved: { [Op.gte]: sinceDate }
        }
      }),

      TradePlan.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: sinceDate }
        }
      })
    ]);

    return {
      trades,
      coachingSessions,
      patterns,
      plans,
      timeframe,
      contextBuiltAt: new Date()
    };
  }

  async executeAIAnalysis(analysisType, performanceContext, focusAreas) {
    const { trades, coachingSessions, patterns } = performanceContext;

    const analysisResults = {
      type: analysisType,
      technicalAnalysis: null,
      psychologicalAnalysis: null,
      comprehensiveAnalysis: null,
      focusAreaAnalysis: null
    };

    if (analysisType === 'technical' || analysisType === 'comprehensive') {
      analysisResults.technicalAnalysis = await this.performTechnicalAnalysis(trades, performanceContext);
    }

    if (analysisType === 'psychological' || analysisType === 'comprehensive') {
      analysisResults.psychologicalAnalysis = await this.performPsychologicalAnalysis(trades, coachingSessions, patterns);
    }

    if (analysisType === 'comprehensive') {
      analysisResults.comprehensiveAnalysis = await this.performComprehensiveIntegratedAnalysis(
        analysisResults.technicalAnalysis,
        analysisResults.psychologicalAnalysis,
        performanceContext
      );
    }

    if (focusAreas && focusAreas.length > 0) {
      analysisResults.focusAreaAnalysis = await this.performFocusAreaAnalysis(focusAreas, performanceContext);
    }

    return analysisResults;
  }

  async performTechnicalAnalysis(trades, context) {
    const analysis = {
      setupQuality: this.analyzeSetupQuality(trades),
      entryTiming: this.analyzeEntryTiming(trades),
      exitManagement: this.analyzeExitManagement(trades),
      riskManagement: this.analyzeRiskManagement(trades),
      marketConditionPerformance: this.analyzeMarketConditionPerformance(trades),
      instrumentPerformance: this.analyzeInstrumentPerformance(trades),
      timeBasedPerformance: this.analyzeTimeBasedPerformance(trades)
    };

    // Generate AI insights for technical aspects
    analysis.aiInsights = await this.generateTechnicalAIInsights(analysis, trades);

    return analysis;
  }

  async performPsychologicalAnalysis(trades, coachingSessions, patterns) {
    const analysis = {
      emotionalStateImpact: this.analyzeEmotionalStateImpact(trades),
      disciplineMetrics: this.analyzeDisciplineMetrics(trades),
      planAdherenceAnalysis: this.analyzePlanAdherence(trades),
      stressResponsePatterns: this.analyzeStressResponsePatterns(trades, coachingSessions),
      coachingEffectiveness: this.analyzeCoachingEffectiveness(trades, coachingSessions),
      patternEvolution: this.analyzePatternEvolution(patterns),
      behavioralConsistency: this.analyzeBehavioralConsistency(trades)
    };

    // Generate AI insights for psychological aspects
    analysis.aiInsights = await this.generatePsychologicalAIInsights(analysis, trades, coachingSessions);

    return analysis;
  }

  async performComprehensiveIntegratedAnalysis(technicalAnalysis, psychologicalAnalysis, context) {
    const integrated = {
      performanceSynergies: this.identifyPerformanceSynergies(technicalAnalysis, psychologicalAnalysis),
      conflictAreas: this.identifyConflictAreas(technicalAnalysis, psychologicalAnalysis),
      holisticPatterns: this.identifyHolisticPatterns(technicalAnalysis, psychologicalAnalysis),
      improvementPriorities: this.prioritizeImprovementAreas(technicalAnalysis, psychologicalAnalysis),
      skillTransferOpportunities: this.identifySkillTransferOpportunities(technicalAnalysis, psychologicalAnalysis)
    };

    // Generate comprehensive AI insights
    integrated.aiInsights = await this.generateIntegratedAIInsights(integrated, technicalAnalysis, psychologicalAnalysis);

    return integrated;
  }

  async generateCoachingInsights(analysisResults, performanceContext) {
    const insights = {
      immediateActions: [],
      mediumTermGoals: [],
      longTermDevelopment: [],
      specificRecommendations: [],
      coachingPriorities: [],
      successMetrics: []
    };

    // Extract coaching insights from analysis results
    if (analysisResults.technicalAnalysis) {
      insights.immediateActions.push(...this.extractTechnicalActions(analysisResults.technicalAnalysis));
    }

    if (analysisResults.psychologicalAnalysis) {
      insights.immediateActions.push(...this.extractPsychologicalActions(analysisResults.psychologicalAnalysis));
    }

    if (analysisResults.comprehensiveAnalysis) {
      insights.specificRecommendations.push(...this.extractIntegratedRecommendations(analysisResults.comprehensiveAnalysis));
    }

    // Generate AI-powered coaching insights
    const prompt = this.buildCoachingInsightsPrompt(analysisResults, performanceContext);
    insights.aiGeneratedInsights = await this.generateAICoachingInsights(prompt);

    return insights;
  }

  async analyzeSingleTrade(trade, options) {
    const { analysisDepth, includeComparisons } = options;

    const analysis = {
      tradeId: trade.id,
      basicMetrics: this.calculateTradeBasicMetrics(trade),
      executionQuality: this.analyzeTradeExecution(trade),
      psychologyFactors: this.analyzeTracePsychology(trade),
      setupAnalysis: this.analyzeTradeSetup(trade),
      riskManagement: this.analyzeTradeRiskManagement(trade),
      learningPoints: this.extractTradeLearningPoints(trade)
    };

    if (analysisDepth === 'detailed') {
      analysis.detailedBreakdown = await this.performDetailedTradeBreakdown(trade);
    }

    if (includeComparisons) {
      analysis.benchmarkComparison = await this.compareTradeToBenchmarks(trade);
    }

    // Generate AI insights for this specific trade
    analysis.aiInsights = await this.generateSingleTradeAIInsights(trade, analysis);

    return analysis;
  }

  // Analysis helper methods

  analyzeSetupQuality(trades) {
    const setupData = {};
    trades.forEach(trade => {
      if (trade.setupType) {
        if (!setupData[trade.setupType]) {
          setupData[trade.setupType] = { trades: [], winRate: 0, avgPnl: 0 };
        }
        setupData[trade.setupType].trades.push(trade);
      }
    });

    // Calculate metrics for each setup type
    Object.keys(setupData).forEach(setupType => {
      const setupTrades = setupData[setupType].trades.filter(t => t.status === 'Closed');
      if (setupTrades.length > 0) {
        const winners = setupTrades.filter(t => t.pnlDollars > 0);
        setupData[setupType].winRate = Math.round((winners.length / setupTrades.length) * 100);
        setupData[setupType].avgPnl = Math.round(
          (setupTrades.reduce((sum, t) => sum + (t.pnlDollars || 0), 0) / setupTrades.length) * 100
        ) / 100;
      }
    });

    return {
      setupBreakdown: setupData,
      bestPerformingSetup: this.findBestPerformingSetup(setupData),
      worstPerformingSetup: this.findWorstPerformingSetup(setupData),
      setupConsistency: this.calculateSetupConsistency(setupData)
    };
  }

  analyzeEntryTiming(trades) {
    const timingAnalysis = {
      avgTimeToEntry: 0,
      entryQualityDistribution: {},
      timingImpactOnPerformance: {}
    };

    // Analyze entry timing patterns
    trades.forEach(trade => {
      // Analysis logic for entry timing
    });

    return timingAnalysis;
  }

  analyzeExitManagement(trades) {
    const exitAnalysis = {
      profitTargetHitRate: 0,
      stopLossHitRate: 0,
      avgHoldTime: 0,
      exitEfficiency: 0
    };

    const closedTrades = trades.filter(t => t.status === 'Closed');
    
    if (closedTrades.length > 0) {
      const stoppedOutTrades = closedTrades.filter(t => t.exitPrice === t.stopLoss);
      exitAnalysis.stopLossHitRate = Math.round((stoppedOutTrades.length / closedTrades.length) * 100);
      
      // Calculate average hold time
      const holdTimes = closedTrades
        .filter(t => t.entryTime && t.exitTime)
        .map(t => new Date(t.exitTime) - new Date(t.entryTime));
      
      if (holdTimes.length > 0) {
        exitAnalysis.avgHoldTime = holdTimes.reduce((sum, time) => sum + time, 0) / holdTimes.length;
      }
    }

    return exitAnalysis;
  }

  calculateAdvancedMetrics(trades) {
    const closedTrades = trades.filter(t => t.status === 'Closed' && t.pnlDollars !== null);
    
    if (closedTrades.length === 0) {
      return { message: 'No closed trades for metrics calculation' };
    }

    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnlDollars || 0), 0);
    const winners = closedTrades.filter(t => t.pnlDollars > 0);
    const losers = closedTrades.filter(t => t.pnlDollars < 0);

    const winRate = Math.round((winners.length / closedTrades.length) * 100);
    const avgWin = winners.length > 0 ? winners.reduce((sum, t) => sum + t.pnlDollars, 0) / winners.length : 0;
    const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((sum, t) => sum + t.pnlDollars, 0) / losers.length) : 0;
    const avgR = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Calculate Sharpe ratio
    const returns = closedTrades.map(t => t.pnlDollars || 0);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
    const sharpeRatio = variance > 0 ? avgReturn / Math.sqrt(variance) : 0;

    // Calculate maximum drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnl = 0;

    closedTrades.forEach(trade => {
      runningPnl += trade.pnlDollars || 0;
      peak = Math.max(peak, runningPnl);
      const drawdown = peak - runningPnl;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    return {
      totalTrades: closedTrades.length,
      winRate,
      avgR: Math.round(avgR * 100) / 100,
      totalPnl: Math.round(totalPnl * 100) / 100,
      avgPnl: Math.round((totalPnl / closedTrades.length) * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      profitFactor: avgLoss > 0 ? Math.round((avgWin * winners.length / (avgLoss * losers.length)) * 100) / 100 : 0,
      bestTrade: Math.max(...closedTrades.map(t => t.pnlDollars)),
      worstTrade: Math.min(...closedTrades.map(t => t.pnlDollars))
    };
  }

  findBestPerformingSetup(setupData) {
    let best = null;
    let bestScore = -Infinity;

    Object.entries(setupData).forEach(([setupType, data]) => {
      if (data.trades.length >= 3) { // Minimum sample size
        const score = data.winRate * 0.6 + (data.avgPnl > 0 ? data.avgPnl * 0.4 : data.avgPnl * 0.8);
        if (score > bestScore) {
          bestScore = score;
          best = { setupType, ...data, score };
        }
      }
    });

    return best;
  }

  findWorstPerformingSetup(setupData) {
    let worst = null;
    let worstScore = Infinity;

    Object.entries(setupData).forEach(([setupType, data]) => {
      if (data.trades.length >= 3) {
        const score = data.winRate * 0.6 + (data.avgPnl > 0 ? data.avgPnl * 0.4 : data.avgPnl * 0.8);
        if (score < worstScore) {
          worstScore = score;
          worst = { setupType, ...data, score };
        }
      }
    });

    return worst;
  }

  generateAnalysisSummary(analysisResults, coachingInsights, performanceContext) {
    const summary = [];

    if (analysisResults.technicalAnalysis) {
      const tech = analysisResults.technicalAnalysis;
      if (tech.setupQuality.bestPerformingSetup) {
        summary.push(`Best setup: ${tech.setupQuality.bestPerformingSetup.setupType} (${tech.setupQuality.bestPerformingSetup.winRate}% win rate)`);
      }
    }

    if (coachingInsights?.immediateActions?.length > 0) {
      summary.push(`${coachingInsights.immediateActions.length} immediate improvement actions identified`);
    }

    summary.push(`Analysis based on ${performanceContext.trades.length} trades over ${performanceContext.timeframe} days`);

    return summary.join('. ');
  }

  // Placeholder methods for additional analysis components
  // These would be fully implemented based on specific requirements

  analyzeRiskManagement(trades) { return {}; }
  analyzeMarketConditionPerformance(trades) { return {}; }
  analyzeInstrumentPerformance(trades) { return {}; }
  analyzeTimeBasedPerformance(trades) { return {}; }
  analyzeEmotionalStateImpact(trades) { return {}; }
  analyzeDisciplineMetrics(trades) { return {}; }
  analyzePlanAdherence(trades) { return {}; }
  calculateSetupConsistency(setupData) { return 0; }

  async generateTechnicalAIInsights(analysis, trades) {
    // Would integrate with AI service to generate insights
    return { insights: [], recommendations: [] };
  }

  async generatePsychologicalAIInsights(analysis, trades, sessions) {
    // Would integrate with AI service to generate insights
    return { insights: [], recommendations: [] };
  }
}

export default AIPerformanceAnalyzer;