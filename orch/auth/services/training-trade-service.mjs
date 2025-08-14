/**
 * Training Trade Service
 * Manages training trades, scenarios, and coaching baseline establishment
 */

import { Op } from 'sequelize';
import { tradingModels } from '../lib/trading-models.mjs';
import { database } from '../lib/database.mjs';
import { logger } from '../lib/logger.mjs';

const { Trade, TrainingScenario, TradePlan, CoachingSession } = tradingModels;
const { models: { User } } = database;

export class TrainingTradeService {

  /**
   * Initialize training scenarios (pre-loaded examples)
   */
  async initializeTrainingScenarios() {
    const transaction = await database.sequelize.transaction();
    
    try {
      // Check if scenarios already exist
      const existingScenarios = await TrainingScenario.count();
      if (existingScenarios > 0) {
        logger.info('Training scenarios already initialized');
        return;
      }

      const scenarios = this.getDefaultTrainingScenarios();
      
      await TrainingScenario.bulkCreate(scenarios, { transaction });
      await transaction.commit();
      
      logger.info(`Initialized ${scenarios.length} training scenarios`);
      
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to initialize training scenarios', { error: error.message });
      throw error;
    }
  }

  /**
   * Get available training scenarios for user
   */
  async getAvailableScenarios(userId, options = {}) {
    try {
      const {
        difficulty,
        instrument,
        category,
        excludeCompleted = false
      } = options;

      const whereClause = { isActive: true };
      
      if (difficulty) {
        whereClause.difficulty = difficulty;
      }
      
      if (instrument) {
        whereClause.instrument = instrument;
      }
      
      if (category) {
        whereClause.category = category;
      }

      let scenarios = await TrainingScenario.findAll({
        where: whereClause,
        order: [['difficulty', 'ASC'], ['name', 'ASC']]
      });

      // Exclude completed scenarios if requested
      if (excludeCompleted) {
        const completedScenarioIds = await this.getCompletedScenarioIds(userId);
        scenarios = scenarios.filter(s => !completedScenarioIds.includes(s.id));
      }

      // Add completion status for each scenario
      const scenariosWithStatus = await Promise.all(
        scenarios.map(async (scenario) => {
          const completionCount = await Trade.count({
            where: {
              userId,
              trainingScenarioId: scenario.id,
              status: 'Closed'
            }
          });

          return {
            ...scenario.toJSON(),
            completionCount,
            isCompleted: completionCount > 0
          };
        })
      );

      return scenariosWithStatus;

    } catch (error) {
      logger.error('Failed to get available scenarios', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Start a training scenario for user
   */
  async startTrainingScenario(userId, scenarioId, options = {}) {
    const transaction = await database.sequelize.transaction();
    
    try {
      // Get scenario details
      const scenario = await TrainingScenario.findByPk(scenarioId);
      if (!scenario) {
        throw new Error('Training scenario not found');
      }

      // Create trade plan if scenario has guidance
      let tradePlan = null;
      if (scenario.recommendedAction !== 'No-Trade') {
        tradePlan = await this.createTrainingTradePlan(userId, scenario, transaction);
      }

      // Create coaching session for scenario introduction
      const coachingSession = await this.createScenarioCoachingSession(
        userId, 
        scenario, 
        tradePlan,
        transaction
      );

      await transaction.commit();

      logger.info('Training scenario started', {
        userId,
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        hasPlan: !!tradePlan
      });

      return {
        scenario,
        tradePlan,
        coachingSession,
        nextSteps: this.getScenarioNextSteps(scenario, tradePlan)
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to start training scenario', { userId, scenarioId, error: error.message });
      throw error;
    }
  }

  /**
   * Execute a training trade
   */
  async executeTrainingTrade(userId, tradeData) {
    const transaction = await database.sequelize.transaction();
    
    try {
      const {
        scenarioId,
        tradePlanId,
        direction,
        entryPrice,
        positionSize,
        stopLoss,
        takeProfitTargets,
        emotionalState,
        psychologyNotes,
        conversationId
      } = tradeData;

      // Validate scenario exists
      const scenario = await TrainingScenario.findByPk(scenarioId);
      if (!scenario) {
        throw new Error('Training scenario not found');
      }

      // Get trade plan if provided
      let tradePlan = null;
      if (tradePlanId) {
        tradePlan = await TradePlan.findOne({
          where: { id: tradePlanId, userId }
        });
      }

      // Calculate risk amount
      const riskAmount = Math.abs(entryPrice - stopLoss) * positionSize * 100; // Assuming $100 per point

      // Create training trade
      const trade = await Trade.create({
        userId,
        tradeType: 'Training',
        trainingScenarioId: scenarioId,
        tradePlanId,
        instrument: scenario.instrument,
        direction,
        entryPrice,
        positionSize,
        stopLoss,
        takeProfitTargets,
        entryTime: new Date(),
        emotionalState,
        psychologyNotes,
        riskAmount,
        conversationId,
        status: 'Open',
        marketConditions: scenario.marketConditions
      }, { transaction });

      // Update trade plan status if exists
      if (tradePlan) {
        await tradePlan.update({
          status: 'Active',
          executedTradeId: trade.id
        }, { transaction });
      }

      // Create coaching session for trade execution
      const coachingSession = await this.createTradeExecutionCoaching(
        userId,
        trade,
        scenario,
        transaction
      );

      await transaction.commit();

      logger.info('Training trade executed', {
        userId,
        tradeId: trade.id,
        scenarioId,
        instrument: scenario.instrument,
        direction,
        entryPrice
      });

      return {
        trade,
        scenario,
        tradePlan,
        coachingSession,
        nextSteps: ['Monitor trade progress', 'Plan exit strategy', 'Document lessons learned']
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to execute training trade', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Close a training trade
   */
  async closeTrainingTrade(userId, tradeId, exitData) {
    const transaction = await database.sequelize.transaction();
    
    try {
      const {
        exitPrice,
        exitReason,
        emotionalState,
        psychologyNotes,
        lessonLearned,
        conversationId
      } = exitData;

      // Get the trade
      const trade = await Trade.findOne({
        where: { 
          id: tradeId, 
          userId,
          tradeType: 'Training',
          status: 'Open'
        },
        include: [
          { model: TrainingScenario, as: 'trainingScenario' },
          { model: TradePlan, as: 'tradePlan' }
        ]
      });

      if (!trade) {
        throw new Error('Training trade not found or already closed');
      }

      // Calculate P&L
      const direction = trade.direction === 'Long' ? 1 : -1;
      const pnlPoints = (exitPrice - trade.entryPrice) * direction;
      const pnlDollars = pnlPoints * trade.positionSize * 100; // Assuming $100 per point

      // Calculate plan adherence if trade had a plan
      let planAdherence = null;
      if (trade.tradePlan) {
        planAdherence = this.calculatePlanAdherence(trade, exitPrice, exitReason);
      }

      // Update trade
      await trade.update({
        exitPrice,
        exitTime: new Date(),
        pnlPoints,
        pnlDollars,
        status: 'Closed',
        emotionalState,
        psychologyNotes: psychologyNotes ? 
          `${trade.psychologyNotes || ''}\n\nExit Notes: ${psychologyNotes}` : 
          trade.psychologyNotes,
        planAdherence
      }, { transaction });

      // Update trade plan if exists
      if (trade.tradePlan) {
        await trade.tradePlan.update({
          status: 'Executed',
          adherenceScore: planAdherence
        }, { transaction });
      }

      // Create post-trade coaching session
      const coachingSession = await this.createPostTradeCoaching(
        userId,
        trade,
        exitReason,
        lessonLearned,
        transaction
      );

      // Check if scenario is completed and provide scenario summary
      const scenarioSummary = await this.getScenarioSummary(
        userId, 
        trade.trainingScenarioId,
        transaction
      );

      await transaction.commit();

      logger.info('Training trade closed', {
        userId,
        tradeId: trade.id,
        pnlDollars,
        pnlPoints,
        planAdherence
      });

      return {
        trade,
        coachingSession,
        scenarioSummary,
        performance: {
          pnlDollars,
          pnlPoints,
          planAdherence,
          exitReason
        }
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to close training trade', { userId, tradeId, error: error.message });
      throw error;
    }
  }

  /**
   * Get training trade performance summary
   */
  async getTrainingPerformance(userId, options = {}) {
    try {
      const {
        scenarioId,
        days = 30,
        includeScenarioBreakdown = false
      } = options;

      const whereClause = {
        userId,
        tradeType: 'Training'
      };

      if (scenarioId) {
        whereClause.trainingScenarioId = scenarioId;
      }

      if (days) {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);
        whereClause.createdAt = { [Op.gte]: sinceDate };
      }

      const trades = await Trade.findAll({
        where: whereClause,
        include: [
          { model: TrainingScenario, as: 'trainingScenario' },
          { model: TradePlan, as: 'tradePlan' }
        ],
        order: [['entryTime', 'DESC']]
      });

      // Calculate overall metrics
      const totalTrades = trades.length;
      const closedTrades = trades.filter(t => t.status === 'Closed');
      const winners = closedTrades.filter(t => t.pnlDollars > 0);
      
      const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnlDollars || 0), 0);
      const winRate = closedTrades.length > 0 ? Math.round((winners.length / closedTrades.length) * 100) : 0;
      
      const avgWin = winners.length > 0 ? winners.reduce((sum, t) => sum + t.pnlDollars, 0) / winners.length : 0;
      const losers = closedTrades.filter(t => t.pnlDollars <= 0);
      const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((sum, t) => sum + t.pnlDollars, 0) / losers.length) : 0;
      const avgR = avgLoss > 0 ? avgWin / avgLoss : 0;

      // Plan adherence metrics
      const tradesWithPlans = trades.filter(t => t.tradePlan);
      const avgPlanAdherence = tradesWithPlans.length > 0 ? 
        tradesWithPlans.reduce((sum, t) => sum + (t.planAdherence || 0), 0) / tradesWithPlans.length : 0;

      const summary = {
        totalTrades,
        closedTrades: closedTrades.length,
        openTrades: totalTrades - closedTrades.length,
        winRate,
        totalPnl: Math.round(totalPnl * 100) / 100,
        avgPnl: closedTrades.length > 0 ? Math.round((totalPnl / closedTrades.length) * 100) / 100 : 0,
        avgR: Math.round(avgR * 100) / 100,
        avgPlanAdherence: Math.round(avgPlanAdherence * 100),
        tradesWithPlans: tradesWithPlans.length,
        completedScenarios: [...new Set(closedTrades.map(t => t.trainingScenarioId))].length
      };

      // Scenario breakdown if requested
      let scenarioBreakdown = null;
      if (includeScenarioBreakdown) {
        scenarioBreakdown = await this.getScenarioBreakdown(userId, trades);
      }

      return {
        summary,
        scenarioBreakdown,
        recentTrades: trades.slice(0, 10).map(trade => ({
          id: trade.id,
          scenario: trade.trainingScenario?.name,
          instrument: trade.instrument,
          direction: trade.direction,
          pnl: trade.pnlDollars,
          status: trade.status,
          entryTime: trade.entryTime,
          planAdherence: trade.planAdherence
        }))
      };

    } catch (error) {
      logger.error('Failed to get training performance', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get comparison between training and real trades
   */
  async getTrainingVsRealComparison(userId, days = 30) {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      const [trainingTrades, realTrades] = await Promise.all([
        Trade.findAll({
          where: {
            userId,
            tradeType: 'Training',
            status: 'Closed',
            createdAt: { [Op.gte]: sinceDate }
          }
        }),
        Trade.findAll({
          where: {
            userId,
            tradeType: 'Real',
            status: 'Closed',
            createdAt: { [Op.gte]: sinceDate }
          }
        })
      ]);

      const trainingMetrics = this.calculateTradeMetrics(trainingTrades);
      const realMetrics = this.calculateTradeMetrics(realTrades);

      return {
        period: `${days} days`,
        training: trainingMetrics,
        real: realMetrics,
        comparison: {
          winRateDiff: realMetrics.winRate - trainingMetrics.winRate,
          avgRDiff: realMetrics.avgR - trainingMetrics.avgR,
          avgPnlDiff: realMetrics.avgPnl - trainingMetrics.avgPnl,
          consistency: this.calculateConsistencyScore(trainingMetrics, realMetrics)
        },
        insights: this.generateComparisonInsights(trainingMetrics, realMetrics)
      };

    } catch (error) {
      logger.error('Failed to get training vs real comparison', { userId, error: error.message });
      throw error;
    }
  }

  // Private helper methods

  /**
   * Get default training scenarios
   */
  getDefaultTrainingScenarios() {
    return [
      {
        name: 'Bull Flag Breakout - ES',
        description: 'Classic bull flag pattern on ES futures during uptrend',
        difficulty: 'Beginner',
        instrument: 'ES',
        marketConditions: {
          atr: 45,
          trend: 'Bullish',
          volatility: 'Normal',
          timeOfDay: 'Mid-Morning'
        },
        chartImageUrl: '/training-scenarios/bull-flag-es-1.png',
        setupDescription: 'ES showing strong uptrend with tight bull flag consolidation. Price approaching flag resistance with increasing volume.',
        setupType: 'Bull Flag',
        recommendedAction: 'Long',
        entryPrice: 4285.50,
        stopLoss: 4275.00,
        takeProfitTargets: [
          { level: 4295.00, percentage: 50 },
          { level: 4305.00, percentage: 30 },
          { level: 4320.00, percentage: 20 }
        ],
        psychologyFocus: ['Discipline', 'Entry-Timing', 'Risk-Management'],
        commonMistakes: [
          { mistake: 'Entering too early before breakout confirmation', impact: 'High' },
          { mistake: 'Not respecting stop loss', impact: 'Critical' },
          { mistake: 'Taking profits too early', impact: 'Medium' }
        ],
        coachingPrompts: [
          'What confirms this breakout is valid?',
          'How would you manage risk if the trade moves against you?',
          'What would invalidate this setup?'
        ],
        learningObjectives: [
          'Identify proper bull flag formation',
          'Execute disciplined entry timing',
          'Manage multi-target exit strategy'
        ],
        category: 'Continuation-Patterns',
        tags: ['Bull-Flag', 'Breakout', 'ES', 'Beginner'],
        isActive: true
      },
      {
        name: 'Failed Breakout Reversal - NQ',
        description: 'Identifying and trading failed breakouts on NQ futures',
        difficulty: 'Intermediate',
        instrument: 'NQ',
        marketConditions: {
          atr: 85,
          trend: 'Sideways',
          volatility: 'High',
          timeOfDay: 'Opening-Hour'
        },
        chartImageUrl: '/training-scenarios/failed-breakout-nq-1.png',
        setupDescription: 'NQ attempted breakout above resistance but failed with high volume rejection. Looking for reversal opportunity.',
        setupType: 'Failed Breakout',
        recommendedAction: 'Short',
        entryPrice: 15485.00,
        stopLoss: 15515.00,
        takeProfitTargets: [
          { level: 15450.00, percentage: 40 },
          { level: 15420.00, percentage: 35 },
          { level: 15385.00, percentage: 25 }
        ],
        psychologyFocus: ['Patience', 'Contrarian-Thinking', 'Exit-Management'],
        commonMistakes: [
          { mistake: 'Shorting too early in the breakout attempt', impact: 'High' },
          { mistake: 'Not waiting for clear rejection signals', impact: 'High' },
          { mistake: 'Holding too long expecting bigger move', impact: 'Medium' }
        ],
        coachingPrompts: [
          'How do you distinguish between a pullback and a failed breakout?',
          'What volume characteristics support this reversal setup?',
          'How would you protect profits if the move accelerates?'
        ],
        learningObjectives: [
          'Recognize failed breakout patterns',
          'Use volume analysis for confirmation',
          'Practice contrarian trade management'
        ],
        category: 'Reversal-Patterns',
        tags: ['Failed-Breakout', 'Reversal', 'NQ', 'Intermediate'],
        isActive: true
      },
      {
        name: 'Opening Range Breakout - MES',
        description: 'Trading the opening range breakout on MES with proper risk management',
        difficulty: 'Beginner',
        instrument: 'MES',
        marketConditions: {
          atr: 12,
          trend: 'Neutral',
          volatility: 'Low',
          timeOfDay: 'Market-Open'
        },
        chartImageUrl: '/training-scenarios/orb-mes-1.png',
        setupDescription: 'MES establishing opening range in first 30 minutes. Clear high/low levels with clean breakout potential.',
        setupType: 'Opening Range Breakout',
        recommendedAction: 'Long',
        entryPrice: 4288.75,
        stopLoss: 4283.25,
        takeProfitTargets: [
          { level: 4294.25, percentage: 60 },
          { level: 4299.75, percentage: 40 }
        ],
        psychologyFocus: ['Patience', 'Risk-Management', 'Early-Session-Discipline'],
        commonMistakes: [
          { mistake: 'Entering before range is fully established', impact: 'High' },
          { mistake: 'Using too wide stops for opening trades', impact: 'Medium' },
          { mistake: 'Not respecting opening range boundaries', impact: 'High' }
        ],
        coachingPrompts: [
          'How long should you wait to establish the opening range?',
          'What position size is appropriate for opening range trades?',
          'How do you handle false breakouts in the opening hour?'
        ],
        learningObjectives: [
          'Master opening range identification',
          'Practice conservative position sizing',
          'Develop early-session discipline'
        ],
        category: 'Opening-Strategies',
        tags: ['Opening-Range', 'Breakout', 'MES', 'Beginner'],
        isActive: true
      },
      {
        name: 'VWAP Rejection Trade - ES',
        description: 'Using VWAP as dynamic support/resistance for mean reversion trades',
        difficulty: 'Intermediate',
        instrument: 'ES',
        marketConditions: {
          atr: 52,
          trend: 'Bullish',
          volatility: 'Normal',
          timeOfDay: 'Afternoon'
        },
        chartImageUrl: '/training-scenarios/vwap-rejection-es-1.png',
        setupDescription: 'ES in uptrend pulling back to VWAP support. Multiple touches with decreasing momentum suggesting bounce.',
        setupType: 'VWAP Support',
        recommendedAction: 'Long',
        entryPrice: 4292.25,
        stopLoss: 4287.00,
        takeProfitTargets: [
          { level: 4302.00, percentage: 50 },
          { level: 4312.00, percentage: 30 },
          { level: 4325.00, percentage: 20 }
        ],
        psychologyFocus: ['Mean-Reversion', 'Technical-Analysis', 'Trend-Context'],
        commonMistakes: [
          { mistake: 'Fighting the overall trend direction', impact: 'High' },
          { mistake: 'Not waiting for clear rejection signals', impact: 'Medium' },
          { mistake: 'Overcomplicating the setup analysis', impact: 'Low' }
        ],
        coachingPrompts: [
          'How does VWAP behavior change throughout the trading day?',
          'What confirms a legitimate support bounce vs. continued breakdown?',
          'How do you balance mean reversion with trend continuation?'
        ],
        learningObjectives: [
          'Understand VWAP as dynamic support/resistance',
          'Combine trend context with mean reversion',
          'Practice multi-timeframe analysis'
        ],
        category: 'Mean-Reversion',
        tags: ['VWAP', 'Support', 'ES', 'Intermediate'],
        isActive: true
      },
      {
        name: 'High-Stress News Event - ES',
        description: 'Managing psychology and risk during volatile news-driven moves',
        difficulty: 'Advanced',
        instrument: 'ES',
        marketConditions: {
          atr: 95,
          trend: 'Volatile',
          volatility: 'Extreme',
          timeOfDay: 'News-Release'
        },
        chartImageUrl: '/training-scenarios/news-event-es-1.png',
        setupDescription: 'FOMC announcement causing extreme volatility. Price whipsawing with huge volume spikes and rapid direction changes.',
        setupType: 'News Event',
        recommendedAction: 'No-Trade',
        psychologyFocus: ['Emotional-Control', 'Risk-Management', 'Discipline', 'FOMO-Management'],
        commonMistakes: [
          { mistake: 'Trying to catch the move during initial volatility', impact: 'Critical' },
          { mistake: 'Using normal position sizes in extreme volatility', impact: 'Critical' },
          { mistake: 'Not stepping aside when conditions are unfavorable', impact: 'High' }
        ],
        coachingPrompts: [
          'What psychological pressures do you feel during high-volatility events?',
          'How do you resist FOMO when seeing large moves?',
          'What criteria would you need to consider trading during news events?'
        ],
        learningObjectives: [
          'Recognize when NOT to trade',
          'Manage FOMO and emotional reactions',
          'Develop patience for better opportunities'
        ],
        category: 'Risk-Management',
        tags: ['News-Event', 'No-Trade', 'Psychology', 'Advanced'],
        isActive: true
      }
    ];
  }

  /**
   * Calculate trade metrics
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
        worstTrade: 0
      };
    }

    const totalTrades = trades.length;
    const winners = trades.filter(t => t.pnlDollars > 0);
    const winRate = Math.round((winners.length / totalTrades) * 100);
    
    const totalPnl = trades.reduce((sum, t) => sum + (t.pnlDollars || 0), 0);
    const avgPnl = totalPnl / totalTrades;
    
    const avgWin = winners.length > 0 ? winners.reduce((sum, t) => sum + t.pnlDollars, 0) / winners.length : 0;
    const losers = trades.filter(t => t.pnlDollars <= 0);
    const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((sum, t) => sum + t.pnlDollars, 0) / losers.length) : 0;
    const avgR = avgLoss > 0 ? avgWin / avgLoss : 0;

    return {
      totalTrades,
      winRate,
      avgR: Math.round(avgR * 100) / 100,
      totalPnl: Math.round(totalPnl * 100) / 100,
      avgPnl: Math.round(avgPnl * 100) / 100,
      bestTrade: Math.max(...trades.map(t => t.pnlDollars || 0)),
      worstTrade: Math.min(...trades.map(t => t.pnlDollars || 0))
    };
  }

  /**
   * Create training trade plan
   */
  async createTrainingTradePlan(userId, scenario, transaction) {
    try {
      if (scenario.recommendedAction === 'No-Trade') {
        return null;
      }

      const tradePlan = await TradePlan.create({
        userId,
        name: `Training: ${scenario.name}`,
        instrument: scenario.instrument,
        direction: scenario.recommendedAction,
        setupDescription: scenario.setupDescription,
        setupType: scenario.setupType,
        entryCriteria: scenario.coachingPrompts || ['Scenario conditions met'],
        entryPrice: scenario.entryPrice,
        stopLoss: scenario.stopLoss,
        takeProfitTargets: scenario.takeProfitTargets,
        positionSize: 1, // Default training size
        riskAmount: Math.abs(scenario.entryPrice - scenario.stopLoss) * 100, // $100 per point
        invalidationCriteria: ['Stop loss hit', 'Setup invalidated'],
        psychologyNotes: `Training scenario focusing on: ${scenario.psychologyFocus?.join(', ') || 'General discipline'}`,
        emotionalPreparation: `Common mistakes to avoid: ${scenario.commonMistakes?.map(m => m.mistake).join(', ') || 'Follow the plan'}`,
        status: 'Pending'
      }, { transaction });

      return tradePlan;

    } catch (error) {
      logger.error('Failed to create training trade plan', { userId, scenarioId: scenario.id, error: error.message });
      throw error;
    }
  }

  /**
   * Create scenario coaching session
   */
  async createScenarioCoachingSession(userId, scenario, tradePlan, transaction) {
    try {
      const coachingPrompt = `Training Scenario: ${scenario.name}

${scenario.description}

Market Conditions:
- Instrument: ${scenario.instrument}
- ATR: ${scenario.marketConditions?.atr || 'N/A'}
- Trend: ${scenario.marketConditions?.trend || 'N/A'}
- Time: ${scenario.marketConditions?.timeOfDay || 'N/A'}

Setup: ${scenario.setupDescription}

Learning Objectives:
${scenario.learningObjectives?.map(obj => `- ${obj}`).join('\n') || 'Practice disciplined execution'}

Coaching Questions:
${scenario.coachingPrompts?.map(q => `- ${q}`).join('\n') || 'What is your plan for this setup?'}

Psychology Focus: ${scenario.psychologyFocus?.join(', ') || 'General discipline'}

${tradePlan ? `Recommended Plan:
- Entry: ${tradePlan.entryPrice}
- Stop: ${tradePlan.stopLoss}
- Targets: ${JSON.stringify(tradePlan.takeProfitTargets)}` : 'This is a no-trade scenario - focus on recognizing why.'}`;

      const aiResponse = `Welcome to the training scenario: ${scenario.name}

This ${scenario.difficulty} level scenario will help you practice ${scenario.psychologyFocus?.join(', ') || 'trading discipline'}.

Key things to focus on:
${scenario.learningObjectives?.map(obj => `• ${obj}`).join('\n') || '• Following your trading plan'}

${scenario.recommendedAction === 'No-Trade' ? 
  'This is a NO-TRADE scenario. The key lesson is recognizing when conditions are not favorable for trading.' :
  `The recommended action is to go ${scenario.recommendedAction} based on the ${scenario.setupType} pattern.`
}

Common mistakes to avoid:
${scenario.commonMistakes?.map(mistake => `• ${mistake.mistake} (${mistake.impact} impact)`).join('\n') || '• Deviating from the plan'}

Take your time to analyze the setup. When you're ready, execute your plan and we'll review the results together.`;

      const coachingSession = await CoachingSession.create({
        userId,
        sessionType: 'Pre-Market', // Training scenarios start as preparation
        marketState: 'Pre-Open',
        coachingPrompt,
        aiResponse,
        emotionalTriggers: scenario.psychologyFocus || [],
        behavioralPatterns: [],
        recommendations: scenario.learningObjectives || [],
        performanceContext: { trainingScenario: true, scenarioId: scenario.id }
      }, { transaction });

      return coachingSession;

    } catch (error) {
      logger.error('Failed to create scenario coaching session', { userId, scenarioId: scenario.id, error: error.message });
      throw error;
    }
  }

  async createTradeExecutionCoaching(userId, trade, scenario, transaction) {
    // Implementation for trade execution coaching
    return null; // Placeholder
  }

  async createPostTradeCoaching(userId, trade, exitReason, lessonLearned, transaction) {
    // Implementation for post-trade coaching
    return null; // Placeholder
  }

  calculatePlanAdherence(trade, exitPrice, exitReason) {
    // Implementation for plan adherence calculation
    return 1.0; // Placeholder
  }

  async getScenarioSummary(userId, scenarioId, transaction) {
    // Implementation for scenario summary
    return null; // Placeholder
  }

  async getCompletedScenarioIds(userId) {
    const completedTrades = await Trade.findAll({
      where: {
        userId,
        tradeType: 'Training',
        status: 'Closed'
      },
      attributes: ['trainingScenarioId'],
      group: ['trainingScenarioId']
    });

    return completedTrades.map(t => t.trainingScenarioId).filter(Boolean);
  }

  getScenarioNextSteps(scenario, tradePlan) {
    if (scenario.recommendedAction === 'No-Trade') {
      return [
        'Study the market conditions',
        'Identify why this is not a good trade',
        'Wait for better opportunities',
        'Document lessons learned'
      ];
    }

    return [
      'Review the trade plan carefully',
      'Execute the trade when conditions are met',
      'Monitor the trade progress',
      'Exit according to plan'
    ];
  }

  async getScenarioBreakdown(userId, trades) {
    const scenarioStats = {};
    
    for (const trade of trades) {
      const scenarioId = trade.trainingScenarioId;
      if (!scenarioId) continue;
      
      if (!scenarioStats[scenarioId]) {
        scenarioStats[scenarioId] = {
          scenarioName: trade.trainingScenario?.name || 'Unknown',
          trades: [],
          totalPnl: 0,
          winRate: 0
        };
      }
      
      scenarioStats[scenarioId].trades.push(trade);
      if (trade.pnlDollars) {
        scenarioStats[scenarioId].totalPnl += trade.pnlDollars;
      }
    }

    // Calculate win rates
    Object.values(scenarioStats).forEach(stats => {
      const closedTrades = stats.trades.filter(t => t.status === 'Closed');
      const winners = closedTrades.filter(t => t.pnlDollars > 0);
      stats.winRate = closedTrades.length > 0 ? Math.round((winners.length / closedTrades.length) * 100) : 0;
    });

    return scenarioStats;
  }

  calculateConsistencyScore(trainingMetrics, realMetrics) {
    // Simple consistency calculation based on performance differences
    const winRateDiff = Math.abs(realMetrics.winRate - trainingMetrics.winRate);
    const avgRDiff = Math.abs(realMetrics.avgR - trainingMetrics.avgR);
    
    // Lower differences = higher consistency
    const winRateConsistency = Math.max(0, 100 - winRateDiff * 2);
    const avgRConsistency = Math.max(0, 100 - avgRDiff * 50);
    
    return Math.round((winRateConsistency + avgRConsistency) / 2);
  }

  generateComparisonInsights(trainingMetrics, realMetrics) {
    const insights = [];
    
    if (realMetrics.winRate < trainingMetrics.winRate - 10) {
      insights.push('Real trading win rate significantly lower than training - focus on execution discipline');
    }
    
    if (realMetrics.avgR < trainingMetrics.avgR - 0.5) {
      insights.push('Real trading risk/reward worse than training - review exit management');
    }
    
    if (realMetrics.totalTrades > 0 && trainingMetrics.totalTrades > 0) {
      if (realMetrics.avgPnl > trainingMetrics.avgPnl * 1.2) {
        insights.push('Real trading performance exceeds training - good skill transfer');
      }
    }
    
    if (insights.length === 0) {
      insights.push('Performance metrics are reasonably consistent between training and real trading');
    }
    
    return insights;
  }
}

export default TrainingTradeService;