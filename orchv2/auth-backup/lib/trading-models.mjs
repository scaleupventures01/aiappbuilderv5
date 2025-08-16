/**
 * Trading Models for Psychology Coaching and Training System
 * Extends the existing database with trade-aware psychology coaching
 */

import { Sequelize, DataTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { database } from './database.mjs';

const { sequelize, models: { User } } = database;

/**
 * Trade Model
 * Stores both training and real trades with comprehensive details
 */
const Trade = sequelize.define('Trade', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  // Trade Classification
  tradeType: {
    type: DataTypes.ENUM('Training', 'Real'),
    allowNull: false,
    defaultValue: 'Real'
  },
  
  // Trade Basics
  instrument: {
    type: DataTypes.STRING(10), // ES, NQ, MES, etc.
    allowNull: false
  },
  direction: {
    type: DataTypes.ENUM('Long', 'Short'),
    allowNull: false
  },
  
  // Price and Sizing
  entryPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  exitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  positionSize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  
  // Timing
  entryTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  exitTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // P&L Calculations
  pnlPoints: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  pnlDollars: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  
  // Risk Management
  stopLoss: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  takeProfitTargets: {
    type: DataTypes.JSONB, // Array of TP levels
    allowNull: true
  },
  riskAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  
  // Trade Context
  setupType: {
    type: DataTypes.STRING(100), // Bull Flag, Head & Shoulders, etc.
    allowNull: true
  },
  marketConditions: {
    type: DataTypes.JSONB, // ATR, trend, volatility context
    allowNull: true
  },
  
  // Psychology and Coaching Context
  emotionalState: {
    type: DataTypes.STRING(50), // Fear, Confident, Revenge, etc.
    allowNull: true
  },
  psychologyNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  disciplineScore: {
    type: DataTypes.INTEGER, // 1-10 scale
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  
  // Plan Adherence
  tradePlanId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'trade_plans',
      key: 'id'
    }
  },
  planAdherence: {
    type: DataTypes.DECIMAL(3, 2), // 0.00 to 1.00
    allowNull: true
  },
  deviationReasons: {
    type: DataTypes.JSONB, // Array of deviation types
    allowNull: true
  },
  
  // Media and Documentation
  chartImageUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  
  // Training-Specific Fields
  trainingScenarioId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'training_scenarios',
      key: 'id'
    }
  },
  
  // Status
  status: {
    type: DataTypes.ENUM('Open', 'Closed', 'Cancelled'),
    defaultValue: 'Open'
  },
  
  // Metadata
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'trades',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['tradeType'] },
    { fields: ['instrument'] },
    { fields: ['entryTime'] },
    { fields: ['status'] },
    { fields: ['tradePlanId'] },
    { fields: ['conversationId'] },
    { fields: ['trainingScenarioId'] },
    { 
      fields: ['userId', 'tradeType', 'entryTime'],
      name: 'user_trade_type_time_idx'
    }
  ]
});

/**
 * Psychology Coaching Session Model
 * Tracks coaching interactions with trade context
 */
const CoachingSession = sequelize.define('CoachingSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  
  // Session Context
  sessionType: {
    type: DataTypes.ENUM('Pre-Market', 'Live-Trading', 'Post-Market', 'Review', 'Pattern-Analysis'),
    allowNull: false
  },
  
  // Trade Context
  relatedTradeIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
    defaultValue: []
  },
  marketState: {
    type: DataTypes.ENUM('Pre-Open', 'Open', 'Mid-Day', 'Close', 'After-Hours'),
    allowNull: true
  },
  
  // Coaching Content
  coachingPrompt: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  aiResponse: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  
  // Psychology Insights
  emotionalTriggers: {
    type: DataTypes.JSONB, // Array of identified triggers
    allowNull: true
  },
  behavioralPatterns: {
    type: DataTypes.JSONB, // Patterns identified in this session
    allowNull: true
  },
  recommendations: {
    type: DataTypes.JSONB, // Coaching recommendations
    allowNull: true
  },
  
  // Performance Context
  performanceContext: {
    type: DataTypes.JSONB, // Recent P&L, win rate, etc.
    allowNull: true
  },
  riskManagementNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Session Metadata
  conversationId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // Duration in seconds
    allowNull: true
  },
  
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'coaching_sessions',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['sessionType'] },
    { fields: ['marketState'] },
    { fields: ['createdAt'] },
    { fields: ['conversationId'] },
    {
      fields: ['userId', 'sessionType', 'createdAt'],
      name: 'user_session_type_time_idx'
    }
  ]
});

/**
 * Psychology Pattern Model
 * Tracks behavioral patterns across multiple sessions
 */
const PsychologyPattern = sequelize.define('PsychologyPattern', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  
  // Pattern Classification
  patternType: {
    type: DataTypes.ENUM(
      'Emotional-Trigger', 
      'Risk-Management', 
      'Discipline-Issue', 
      'Performance-Pattern',
      'Market-Timing',
      'Entry-Hesitation',
      'Exit-Management',
      'Revenge-Trading'
    ),
    allowNull: false
  },
  
  // Pattern Details
  patternName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  
  // Pattern Context
  triggerConditions: {
    type: DataTypes.JSONB, // Conditions that trigger this pattern
    allowNull: true
  },
  tradingContext: {
    type: DataTypes.JSONB, // Market conditions, time of day, etc.
    allowNull: true
  },
  
  // Pattern Impact
  frequency: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  impactOnPerformance: {
    type: DataTypes.DECIMAL(5, 2), // P&L impact
    allowNull: true
  },
  severity: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    defaultValue: 'Medium'
  },
  
  // Pattern Evolution
  firstObserved: {
    type: DataTypes.DATE,
    allowNull: false
  },
  lastObserved: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  // Coaching History
  coachingInterventions: {
    type: DataTypes.JSONB, // Array of coaching approaches tried
    allowNull: true
  },
  progressNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Related Data
  relatedTradeIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
    defaultValue: []
  },
  relatedSessionIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
    defaultValue: []
  },
  
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'psychology_patterns',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['patternType'] },
    { fields: ['severity'] },
    { fields: ['isActive'] },
    { fields: ['lastObserved'] },
    {
      fields: ['userId', 'patternType', 'isActive'],
      name: 'user_pattern_type_active_idx'
    }
  ]
});

/**
 * Training Scenario Model
 * Pre-loaded trading scenarios for coaching baseline
 */
const TrainingScenario = sequelize.define('TrainingScenario', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Scenario Details
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  difficulty: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
    defaultValue: 'Beginner'
  },
  
  // Market Context
  instrument: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  marketConditions: {
    type: DataTypes.JSONB, // ATR, trend, volatility, time of day
    allowNull: false
  },
  
  // Scenario Setup
  chartImageUrl: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  setupDescription: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  setupType: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  
  // Expected Outcomes
  recommendedAction: {
    type: DataTypes.ENUM('Long', 'Short', 'No-Trade'),
    allowNull: false
  },
  entryPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  stopLoss: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  takeProfitTargets: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  
  // Psychology Focus
  psychologyFocus: {
    type: DataTypes.ARRAY(DataTypes.STRING), // What psychology aspects this tests
    allowNull: true
  },
  commonMistakes: {
    type: DataTypes.JSONB, // Common psychological mistakes
    allowNull: true
  },
  
  // Coaching Guidance
  coachingPrompts: {
    type: DataTypes.JSONB, // Structured coaching questions
    allowNull: true
  },
  learningObjectives: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  
  // Scenario Metadata
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'training_scenarios',
  timestamps: true,
  indexes: [
    { fields: ['difficulty'] },
    { fields: ['instrument'] },
    { fields: ['isActive'] },
    { fields: ['category'] },
    { fields: ['recommendedAction'] }
  ]
});

/**
 * Trade Plan Model
 * Structured trade plans with psychology integration
 */
const TradePlan = sequelize.define('TradePlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  
  // Plan Basics
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  instrument: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  direction: {
    type: DataTypes.ENUM('Long', 'Short'),
    allowNull: false
  },
  
  // Setup Description
  setupDescription: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  setupType: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  // Entry Criteria
  entryCriteria: {
    type: DataTypes.JSONB, // Array of required criteria
    allowNull: false
  },
  entryPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  entryTimeframe: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  
  // Risk Management
  stopLoss: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stopReasoning: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  takeProfitTargets: {
    type: DataTypes.JSONB, // Array of TP levels with reasoning
    allowNull: false
  },
  positionSize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  riskAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  
  // Invalidation
  invalidationCriteria: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  
  // Psychology Preparation
  psychologyNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  emotionalPreparation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  riskManagementMindset: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Plan Status
  status: {
    type: DataTypes.ENUM('Pending', 'Active', 'Executed', 'Cancelled', 'Invalidated'),
    defaultValue: 'Pending'
  },
  
  // Execution Tracking
  executedTradeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'trades',
      key: 'id'
    }
  },
  adherenceScore: {
    type: DataTypes.DECIMAL(3, 2), // 0.00 to 1.00
    allowNull: true
  },
  deviations: {
    type: DataTypes.JSONB, // Deviations from plan
    allowNull: true
  },
  
  // Plan Metadata
  chartImageUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'trade_plans',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['instrument'] },
    { fields: ['createdAt'] },
    { fields: ['executedTradeId'] },
    {
      fields: ['userId', 'status', 'createdAt'],
      name: 'user_plan_status_time_idx'
    }
  ]
});

/**
 * Conversation Model
 * Chat conversations with psychology coaching context
 */
const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  
  // Conversation Context
  title: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  mode: {
    type: DataTypes.ENUM('Trade-Analysis', 'Psychology-Coaching', 'General', 'Training'),
    defaultValue: 'General'
  },
  
  // Session Context
  sessionType: {
    type: DataTypes.ENUM('Pre-Market', 'Live-Trading', 'Post-Market', 'Review'),
    allowNull: true
  },
  marketState: {
    type: DataTypes.ENUM('Pre-Open', 'Open', 'Mid-Day', 'Close', 'After-Hours'),
    allowNull: true
  },
  
  // Content
  messages: {
    type: DataTypes.JSONB, // Array of message objects
    allowNull: false,
    defaultValue: []
  },
  
  // Related Data
  relatedTradeIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
    defaultValue: []
  },
  relatedPlanIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
    defaultValue: []
  },
  
  // Tags and Search
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  searchableContent: {
    type: DataTypes.TEXT, // Extracted searchable text
    allowNull: true
  },
  
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['mode'] },
    { fields: ['sessionType'] },
    { fields: ['isActive'] },
    { fields: ['createdAt'] },
    { fields: ['tags'], using: 'gin' },
    {
      fields: ['userId', 'mode', 'createdAt'],
      name: 'user_mode_time_idx'
    }
  ]
});

/**
 * Define Model Associations
 */

// User relationships
User.hasMany(Trade, { foreignKey: 'userId', as: 'trades' });
Trade.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(CoachingSession, { foreignKey: 'userId', as: 'coachingSessions' });
CoachingSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(PsychologyPattern, { foreignKey: 'userId', as: 'psychologyPatterns' });
PsychologyPattern.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(TradePlan, { foreignKey: 'userId', as: 'tradePlans' });
TradePlan.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Conversation, { foreignKey: 'userId', as: 'conversations' });
Conversation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Trade relationships
Trade.belongsTo(TradePlan, { foreignKey: 'tradePlanId', as: 'tradePlan' });
TradePlan.hasOne(Trade, { foreignKey: 'tradePlanId', as: 'executedTrade' });

Trade.belongsTo(TrainingScenario, { foreignKey: 'trainingScenarioId', as: 'trainingScenario' });
TrainingScenario.hasMany(Trade, { foreignKey: 'trainingScenarioId', as: 'completedTrades' });

// Psychology coaching relationships - using through tables for many-to-many
const CoachingSessionTrade = sequelize.define('CoachingSessionTrade', {
  coachingSessionId: {
    type: DataTypes.UUID,
    references: {
      model: CoachingSession,
      key: 'id'
    }
  },
  tradeId: {
    type: DataTypes.UUID,
    references: {
      model: Trade,
      key: 'id'
    }
  }
}, {
  tableName: 'coaching_session_trades',
  timestamps: false
});

CoachingSession.belongsToMany(Trade, { 
  through: CoachingSessionTrade, 
  foreignKey: 'coachingSessionId',
  as: 'relatedTrades'
});
Trade.belongsToMany(CoachingSession, { 
  through: CoachingSessionTrade, 
  foreignKey: 'tradeId',
  as: 'coachingSessions'
});

// Export models and relationships
export const tradingModels = {
  Trade,
  CoachingSession,
  PsychologyPattern,
  TrainingScenario,
  TradePlan,
  Conversation,
  CoachingSessionTrade
};

// Export utility functions
export const initializeTradingModels = async () => {
  try {
    // Sync all trading models
    await sequelize.sync({ alter: true });
    console.log('Trading models synchronized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize trading models:', error);
    throw error;
  }
};

export default tradingModels;