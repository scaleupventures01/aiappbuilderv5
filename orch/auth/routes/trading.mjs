/**
 * Trading API Routes
 * Handles psychology coaching and training trade endpoints
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import PsychologyCoachingService from '../services/psychology-coaching-service.mjs';
import TrainingTradeService from '../services/training-trade-service.mjs';
import { tradingModels } from '../lib/trading-models.mjs';
import { logger } from '../lib/logger.mjs';

const router = express.Router();
const psychologyService = new PsychologyCoachingService();
const trainingService = new TrainingTradeService();

const {
  Trade,
  CoachingSession,
  PsychologyPattern,
  TrainingScenario,
  TradePlan,
  Conversation
} = tradingModels;

/**
 * Middleware to validate request errors
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// ============================================================================
// PSYCHOLOGY COACHING ENDPOINTS
// ============================================================================

/**
 * POST /api/trading/coaching/session
 * Create a new psychology coaching session
 */
router.post('/coaching/session',
  [
    body('sessionType').isIn(['Pre-Market', 'Live-Trading', 'Post-Market', 'Review', 'Pattern-Analysis']),
    body('userMessage').isLength({ min: 1, max: 2000 }),
    body('marketState').optional().isIn(['Pre-Open', 'Open', 'Mid-Day', 'Close', 'After-Hours']),
    body('relatedTradeIds').optional().isArray(),
    body('conversationId').optional().isUUID()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const sessionData = req.body;

      const result = await psychologyService.createCoachingSession(userId, sessionData);

      res.json({
        success: true,
        data: result,
        message: 'Psychology coaching session created successfully'
      });

    } catch (error) {
      logger.error('Failed to create coaching session', { 
        userId: req.user?.id, 
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create coaching session',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/trading/coaching/performance-context
 * Get comprehensive performance context for coaching
 */
router.get('/coaching/performance-context',
  [
    query('days').optional().isInt({ min: 1, max: 90 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days) || 7;

      const performanceContext = await psychologyService.buildPerformanceContext(userId, days);

      res.json({
        success: true,
        data: performanceContext,
        message: 'Performance context retrieved successfully'
      });

    } catch (error) {
      logger.error('Failed to get performance context', { 
        userId: req.user?.id, 
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve performance context'
      });
    }
  }
);

/**
 * GET /api/trading/coaching/history
 * Get coaching session history
 */
router.get('/coaching/history',
  [
    query('sessionType').optional().isIn(['Pre-Market', 'Live-Trading', 'Post-Market', 'Review', 'Pattern-Analysis']),
    query('days').optional().isInt({ min: 1, max: 90 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('includePatterns').optional().isBoolean()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const options = {
        sessionType: req.query.sessionType,
        days: parseInt(req.query.days) || 30,
        limit: parseInt(req.query.limit) || 50,
        includePatterns: req.query.includePatterns === 'true'
      };

      const history = await psychologyService.getCoachingHistory(userId, options);

      res.json({
        success: true,
        data: history,
        message: 'Coaching history retrieved successfully'
      });

    } catch (error) {
      logger.error('Failed to get coaching history', { 
        userId: req.user?.id, 
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve coaching history'
      });
    }
  }
);

/**
 * GET /api/trading/coaching/patterns
 * Get active psychology patterns
 */
router.get('/coaching/patterns',
  async (req, res) => {
    try {
      const userId = req.user.id;
      const patterns = await psychologyService.getActivePatterns(userId);

      res.json({
        success: true,
        data: patterns,
        message: 'Psychology patterns retrieved successfully'
      });

    } catch (error) {
      logger.error('Failed to get psychology patterns', { 
        userId: req.user?.id, 
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve psychology patterns'
      });
    }
  }
);

// ============================================================================
// TRAINING TRADE ENDPOINTS
// ============================================================================

/**
 * GET /api/trading/training/scenarios
 * Get available training scenarios
 */
router.get('/training/scenarios',
  [
    query('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced']),
    query('instrument').optional().isString(),
    query('category').optional().isString(),
    query('excludeCompleted').optional().isBoolean()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const options = {
        difficulty: req.query.difficulty,
        instrument: req.query.instrument,
        category: req.query.category,
        excludeCompleted: req.query.excludeCompleted === 'true'
      };

      const scenarios = await trainingService.getAvailableScenarios(userId, options);

      res.json({
        success: true,
        data: scenarios,
        message: 'Training scenarios retrieved successfully'
      });

    } catch (error) {
      logger.error('Failed to get training scenarios', { 
        userId: req.user?.id, 
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve training scenarios'
      });
    }
  }
);

/**
 * POST /api/trading/training/scenarios/:scenarioId/start
 * Start a training scenario
 */
router.post('/training/scenarios/:scenarioId/start',
  [
    param('scenarioId').isUUID()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { scenarioId } = req.params;

      const result = await trainingService.startTrainingScenario(userId, scenarioId);

      res.json({
        success: true,
        data: result,
        message: 'Training scenario started successfully'
      });

    } catch (error) {
      logger.error('Failed to start training scenario', { 
        userId: req.user?.id, 
        scenarioId: req.params.scenarioId,
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to start training scenario'
      });
    }
  }
);

/**
 * POST /api/trading/training/trades
 * Execute a training trade
 */
router.post('/training/trades',
  [
    body('scenarioId').isUUID(),
    body('tradePlanId').optional().isUUID(),
    body('direction').isIn(['Long', 'Short']),
    body('entryPrice').isNumeric(),
    body('positionSize').isInt({ min: 1 }),
    body('stopLoss').isNumeric(),
    body('takeProfitTargets').isArray(),
    body('emotionalState').optional().isString(),
    body('psychologyNotes').optional().isString(),
    body('conversationId').optional().isUUID()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const tradeData = req.body;

      const result = await trainingService.executeTrainingTrade(userId, tradeData);

      res.json({
        success: true,
        data: result,
        message: 'Training trade executed successfully'
      });

    } catch (error) {
      logger.error('Failed to execute training trade', { 
        userId: req.user?.id, 
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to execute training trade'
      });
    }
  }
);

/**
 * PUT /api/trading/training/trades/:tradeId/close
 * Close a training trade
 */
router.put('/training/trades/:tradeId/close',
  [
    param('tradeId').isUUID(),
    body('exitPrice').isNumeric(),
    body('exitReason').isString(),
    body('emotionalState').optional().isString(),
    body('psychologyNotes').optional().isString(),
    body('lessonLearned').optional().isString(),
    body('conversationId').optional().isUUID()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { tradeId } = req.params;
      const exitData = req.body;

      const result = await trainingService.closeTrainingTrade(userId, tradeId, exitData);

      res.json({
        success: true,
        data: result,
        message: 'Training trade closed successfully'
      });

    } catch (error) {
      logger.error('Failed to close training trade', { 
        userId: req.user?.id, 
        tradeId: req.params.tradeId,
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to close training trade'
      });
    }
  }
);

/**
 * GET /api/trading/training/performance
 * Get training trade performance summary
 */
router.get('/training/performance',
  [
    query('scenarioId').optional().isUUID(),
    query('days').optional().isInt({ min: 1, max: 90 }),
    query('includeScenarioBreakdown').optional().isBoolean()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const options = {
        scenarioId: req.query.scenarioId,
        days: parseInt(req.query.days) || 30,
        includeScenarioBreakdown: req.query.includeScenarioBreakdown === 'true'
      };

      const performance = await trainingService.getTrainingPerformance(userId, options);

      res.json({
        success: true,
        data: performance,
        message: 'Training performance retrieved successfully'
      });

    } catch (error) {
      logger.error('Failed to get training performance', { 
        userId: req.user?.id, 
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve training performance'
      });
    }
  }
);

/**
 * GET /api/trading/training/vs-real
 * Get comparison between training and real trades
 */
router.get('/training/vs-real',
  [
    query('days').optional().isInt({ min: 1, max: 90 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days) || 30;

      const comparison = await trainingService.getTrainingVsRealComparison(userId, days);

      res.json({
        success: true,
        data: comparison,
        message: 'Training vs real comparison retrieved successfully'
      });

    } catch (error) {
      logger.error('Failed to get training vs real comparison', { 
        userId: req.user?.id, 
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve training vs real comparison'
      });
    }
  }
);

// ============================================================================
// TRADE MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/trading/trades
 * Log a real trade
 */
router.post('/trades',
  [
    body('instrument').isString(),
    body('direction').isIn(['Long', 'Short']),
    body('entryPrice').isNumeric(),
    body('positionSize').isInt({ min: 1 }),
    body('entryTime').optional().isISO8601(),
    body('stopLoss').optional().isNumeric(),
    body('takeProfitTargets').optional().isArray(),
    body('setupType').optional().isString(),
    body('emotionalState').optional().isString(),
    body('psychologyNotes').optional().isString(),
    body('tradePlanId').optional().isUUID(),
    body('conversationId').optional().isUUID()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const tradeData = {
        ...req.body,
        userId,
        tradeType: 'Real',
        entryTime: req.body.entryTime ? new Date(req.body.entryTime) : new Date(),
        status: 'Open'
      };

      if (tradeData.stopLoss) {
        tradeData.riskAmount = Math.abs(tradeData.entryPrice - tradeData.stopLoss) * tradeData.positionSize * 100;
      }

      const trade = await Trade.create(tradeData);

      // Update trade plan if linked
      if (tradeData.tradePlanId) {
        await TradePlan.update(
          { status: 'Active', executedTradeId: trade.id },
          { where: { id: tradeData.tradePlanId, userId } }
        );
      }

      logger.info('Real trade logged', {
        userId,
        tradeId: trade.id,
        instrument: trade.instrument,
        direction: trade.direction
      });

      res.json({
        success: true,
        data: trade,
        message: 'Trade logged successfully'
      });

    } catch (error) {
      logger.error('Failed to log trade', { 
        userId: req.user?.id, 
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to log trade'
      });
    }
  }
);

/**
 * PUT /api/trading/trades/:tradeId
 * Update/close a real trade
 */
router.put('/trades/:tradeId',
  [
    param('tradeId').isUUID(),
    body('exitPrice').optional().isNumeric(),
    body('exitTime').optional().isISO8601(),
    body('status').optional().isIn(['Open', 'Closed', 'Cancelled']),
    body('emotionalState').optional().isString(),
    body('psychologyNotes').optional().isString(),
    body('disciplineScore').optional().isInt({ min: 1, max: 10 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { tradeId } = req.params;
      const updateData = req.body;

      const trade = await Trade.findOne({
        where: { id: tradeId, userId, tradeType: 'Real' }
      });

      if (!trade) {
        return res.status(404).json({
          success: false,
          message: 'Trade not found'
        });
      }

      // Calculate P&L if closing
      if (updateData.exitPrice && updateData.status === 'Closed') {
        const direction = trade.direction === 'Long' ? 1 : -1;
        const pnlPoints = (updateData.exitPrice - trade.entryPrice) * direction;
        const pnlDollars = pnlPoints * trade.positionSize * 100;

        updateData.pnlPoints = pnlPoints;
        updateData.pnlDollars = pnlDollars;
        updateData.exitTime = updateData.exitTime ? new Date(updateData.exitTime) : new Date();
      }

      await trade.update(updateData);

      // Update trade plan status if linked
      if (trade.tradePlanId && updateData.status === 'Closed') {
        await TradePlan.update(
          { status: 'Executed' },
          { where: { id: trade.tradePlanId, userId } }
        );
      }

      logger.info('Trade updated', {
        userId,
        tradeId: trade.id,
        status: updateData.status,
        pnl: updateData.pnlDollars
      });

      res.json({
        success: true,
        data: trade,
        message: 'Trade updated successfully'
      });

    } catch (error) {
      logger.error('Failed to update trade', { 
        userId: req.user?.id, 
        tradeId: req.params.tradeId,
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update trade'
      });
    }
  }
);

/**
 * GET /api/trading/trades
 * Get user's trades with filtering
 */
router.get('/trades',
  [
    query('tradeType').optional().isIn(['Training', 'Real', 'All']),
    query('status').optional().isIn(['Open', 'Closed', 'Cancelled']),
    query('instrument').optional().isString(),
    query('days').optional().isInt({ min: 1, max: 365 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        tradeType = 'All',
        status,
        instrument,
        days,
        limit = 50,
        offset = 0
      } = req.query;

      const whereClause = { userId };

      if (tradeType !== 'All') {
        whereClause.tradeType = tradeType;
      }

      if (status) {
        whereClause.status = status;
      }

      if (instrument) {
        whereClause.instrument = instrument;
      }

      if (days) {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - parseInt(days));
        whereClause.createdAt = { [Op.gte]: sinceDate };
      }

      const trades = await Trade.findAndCountAll({
        where: whereClause,
        include: [
          { model: TradePlan, as: 'tradePlan' },
          { model: TrainingScenario, as: 'trainingScenario' }
        ],
        order: [['entryTime', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          trades: trades.rows,
          total: trades.count,
          limit: parseInt(limit),
          offset: parseInt(offset)
        },
        message: 'Trades retrieved successfully'
      });

    } catch (error) {
      logger.error('Failed to get trades', { 
        userId: req.user?.id, 
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trades'
      });
    }
  }
);

// ============================================================================
// TRADE PLAN ENDPOINTS
// ============================================================================

/**
 * POST /api/trading/plans
 * Create a trade plan
 */
router.post('/plans',
  [
    body('name').isLength({ min: 1, max: 100 }),
    body('instrument').isString(),
    body('direction').isIn(['Long', 'Short']),
    body('setupDescription').isLength({ min: 1, max: 1000 }),
    body('entryCriteria').isArray(),
    body('stopLoss').isNumeric(),
    body('takeProfitTargets').isArray(),
    body('positionSize').isInt({ min: 1 }),
    body('riskAmount').isNumeric(),
    body('invalidationCriteria').isArray(),
    body('psychologyNotes').optional().isString(),
    body('emotionalPreparation').optional().isString(),
    body('conversationId').optional().isUUID()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const planData = { ...req.body, userId, status: 'Pending' };

      const tradePlan = await TradePlan.create(planData);

      logger.info('Trade plan created', {
        userId,
        planId: tradePlan.id,
        instrument: tradePlan.instrument,
        direction: tradePlan.direction
      });

      res.json({
        success: true,
        data: tradePlan,
        message: 'Trade plan created successfully'
      });

    } catch (error) {
      logger.error('Failed to create trade plan', { 
        userId: req.user?.id, 
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create trade plan'
      });
    }
  }
);

/**
 * GET /api/trading/plans
 * Get user's trade plans
 */
router.get('/plans',
  [
    query('status').optional().isIn(['Pending', 'Active', 'Executed', 'Cancelled', 'Invalidated']),
    query('instrument').optional().isString(),
    query('days').optional().isInt({ min: 1, max: 90 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        status,
        instrument,
        days,
        limit = 20
      } = req.query;

      const whereClause = { userId };

      if (status) {
        whereClause.status = status;
      }

      if (instrument) {
        whereClause.instrument = instrument;
      }

      if (days) {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - parseInt(days));
        whereClause.createdAt = { [Op.gte]: sinceDate };
      }

      const tradePlans = await TradePlan.findAll({
        where: whereClause,
        include: [
          { model: Trade, as: 'executedTrade' }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: tradePlans,
        message: 'Trade plans retrieved successfully'
      });

    } catch (error) {
      logger.error('Failed to get trade plans', { 
        userId: req.user?.id, 
        error: error.message 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trade plans'
      });
    }
  }
);

// Initialize training scenarios on server start
trainingService.initializeTrainingScenarios().catch(error => {
  logger.error('Failed to initialize training scenarios on startup', { error: error.message });
});

export default router;