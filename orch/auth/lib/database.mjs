/**
 * Database Configuration and Models
 * Sequelize setup with User, Session, and OAuth Token models
 */

import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config.mjs';
import { logger, logDatabaseEvent } from './logger.mjs';

/**
 * Initialize Sequelize connection
 */
const sequelize = new Sequelize(config.database.url, {
  host: config.database.host,
  port: config.database.port,
  dialect: config.database.dialect,
  logging: config.database.logging,
  pool: config.database.pool,
  ssl: config.database.ssl,
  dialectOptions: config.env === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  hooks: {
    beforeCreate: (instance, options) => {
      logDatabaseEvent('beforeCreate', instance.constructor.tableName, {
        modelName: instance.constructor.name
      });
    },
    afterCreate: (instance, options) => {
      logDatabaseEvent('afterCreate', instance.constructor.tableName, {
        modelName: instance.constructor.name,
        id: instance.id
      });
    },
    beforeUpdate: (instance, options) => {
      logDatabaseEvent('beforeUpdate', instance.constructor.tableName, {
        modelName: instance.constructor.name,
        id: instance.id,
        changed: instance.changed()
      });
    },
    afterUpdate: (instance, options) => {
      logDatabaseEvent('afterUpdate', instance.constructor.tableName, {
        modelName: instance.constructor.name,
        id: instance.id
      });
    },
    beforeDestroy: (instance, options) => {
      logDatabaseEvent('beforeDestroy', instance.constructor.tableName, {
        modelName: instance.constructor.name,
        id: instance.id
      });
    }
  }
});

/**
 * User Model
 * Stores user information from OAuth providers
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  profilePicture: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  locale: {
    type: DataTypes.STRING(5),
    allowNull: true,
    defaultValue: 'en-US'
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'UTC'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginIP: {
    type: DataTypes.STRING,
    allowNull: true
  },
  loginCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['lastLoginAt']
    }
  ],
  hooks: {
    beforeCreate: async (user) => {
      user.id = user.id || uuidv4();
      user.isVerified = true; // OAuth users are considered verified
    },
    beforeUpdate: async (user) => {
      if (user.changed('email')) {
        // Log email changes for security audit
        logger.info('User email changed', {
          userId: user.id,
          oldEmail: user._previousDataValues.email,
          newEmail: user.email
        });
      }
    }
  }
});

/**
 * OAuth Provider Model
 * Stores OAuth provider information for each user
 */
const OAuthProvider = sequelize.define('OAuthProvider', {
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
  provider: {
    type: DataTypes.ENUM('google', 'github', 'microsoft'),
    allowNull: false
  },
  providerId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  profileData: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tokenExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  scope: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
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
  tableName: 'oauth_providers',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['provider', 'providerId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['provider']
    },
    {
      fields: ['email']
    }
  ],
  hooks: {
    beforeCreate: async (oauthProvider) => {
      oauthProvider.id = oauthProvider.id || uuidv4();
    },
    beforeSave: async (oauthProvider) => {
      // Encrypt tokens before saving
      if (oauthProvider.changed('accessToken') && oauthProvider.accessToken) {
        // In a real implementation, you'd encrypt these tokens
        // For now, we'll just mark that they should be encrypted
        logger.debug('OAuth token updated', {
          userId: oauthProvider.userId,
          provider: oauthProvider.provider,
          tokenLength: oauthProvider.accessToken.length
        });
      }
    }
  }
});

/**
 * User Session Model
 * Tracks active user sessions
 */
const UserSession = sequelize.define('UserSession', {
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
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deviceInfo: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  location: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
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
  tableName: 'user_sessions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['sessionId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['expiresAt']
    },
    {
      fields: ['lastActivityAt']
    }
  ],
  hooks: {
    beforeCreate: async (session) => {
      session.id = session.id || uuidv4();
      session.expiresAt = session.expiresAt || new Date(Date.now() + config.session.maxAge);
    }
  }
});

/**
 * Refresh Token Model
 * Stores refresh tokens for JWT authentication
 */
const RefreshToken = sequelize.define('RefreshToken', {
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
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  jwtId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  deviceInfo: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  lastUsedAt: {
    type: DataTypes.DATE,
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
  tableName: 'refresh_tokens',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['token']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['jwtId']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['expiresAt']
    }
  ],
  hooks: {
    beforeCreate: async (refreshToken) => {
      refreshToken.id = refreshToken.id || uuidv4();
    }
  }
});

/**
 * Security Event Model
 * Logs security-related events for audit trail
 */
const SecurityEvent = sequelize.define('SecurityEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  event: {
    type: DataTypes.STRING,
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'security_events',
  timestamps: false,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['event']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['resolved']
    }
  ]
});

/**
 * Define Model Associations
 */
User.hasMany(OAuthProvider, { foreignKey: 'userId', as: 'oauthProviders' });
OAuthProvider.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserSession, { foreignKey: 'userId', as: 'sessions' });
UserSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(SecurityEvent, { foreignKey: 'userId', as: 'securityEvents' });
SecurityEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/**
 * User Model Methods
 */
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  // Remove sensitive fields from JSON output
  delete values.createdAt;
  delete values.updatedAt;
  return values;
};

User.prototype.updateLastLogin = async function(ipAddress) {
  this.lastLoginAt = new Date();
  this.lastLoginIP = ipAddress;
  this.loginCount = (this.loginCount || 0) + 1;
  await this.save();
};

User.prototype.getActiveSessions = async function() {
  return await UserSession.findAll({
    where: {
      userId: this.id,
      isActive: true,
      expiresAt: {
        [Sequelize.Op.gt]: new Date()
      }
    },
    order: [['lastActivityAt', 'DESC']]
  });
};

User.prototype.revokeAllSessions = async function() {
  await UserSession.update(
    { isActive: false },
    { where: { userId: this.id, isActive: true } }
  );
  
  await RefreshToken.update(
    { isActive: false },
    { where: { userId: this.id, isActive: true } }
  );
};

/**
 * OAuthProvider Model Methods
 */
OAuthProvider.prototype.updateTokens = async function(accessToken, refreshToken, expiresIn) {
  this.accessToken = accessToken;
  this.refreshToken = refreshToken;
  this.tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
  this.lastUsedAt = new Date();
  await this.save();
};

OAuthProvider.prototype.isTokenExpired = function() {
  return this.tokenExpiresAt ? new Date() > this.tokenExpiresAt : false;
};

/**
 * UserSession Model Methods
 */
UserSession.prototype.updateActivity = async function() {
  this.lastActivityAt = new Date();
  await this.save();
};

UserSession.prototype.isExpired = function() {
  return new Date() > this.expiresAt;
};

/**
 * RefreshToken Model Methods
 */
RefreshToken.prototype.isExpired = function() {
  return new Date() > this.expiresAt;
};

RefreshToken.prototype.markUsed = async function() {
  this.lastUsedAt = new Date();
  await this.save();
};

/**
 * Database utility functions
 */
export const database = {
  sequelize,
  models: {
    User,
    OAuthProvider,
    UserSession,
    RefreshToken,
    SecurityEvent
  },
  
  /**
   * Initialize database connection and sync models
   */
  async initialize() {
    try {
      // Test connection
      await sequelize.authenticate();
      logger.info('Database connection established successfully');
      
      // Sync models in development/test
      if (config.env !== 'production') {
        await sequelize.sync({ force: false, alter: true });
        logger.info('Database models synchronized');
      }
      
      return true;
    } catch (error) {
      logger.error('Unable to connect to database:', error);
      throw error;
    }
  },
  
  /**
   * Create or update user from OAuth profile
   */
  async findOrCreateUser(provider, profile) {
    const transaction = await sequelize.transaction();
    
    try {
      // Find existing OAuth provider record
      let oauthProvider = await OAuthProvider.findOne({
        where: {
          provider: provider,
          providerId: profile.id
        },
        include: [{ model: User, as: 'user' }],
        transaction
      });
      
      let user;
      
      if (oauthProvider) {
        // Update existing user
        user = oauthProvider.user;
        
        // Update OAuth provider data
        await oauthProvider.update({
          email: profile.emails[0].value,
          displayName: profile.displayName,
          profileData: profile._json,
          lastUsedAt: new Date()
        }, { transaction });
        
        // Update user data if needed
        const updateData = {
          email: profile.emails[0].value,
          displayName: profile.displayName
        };
        
        if (profile.name) {
          updateData.firstName = profile.name.givenName;
          updateData.lastName = profile.name.familyName;
        }
        
        if (profile.photos && profile.photos.length > 0) {
          updateData.profilePicture = profile.photos[0].value;
        }
        
        await user.update(updateData, { transaction });
        
      } else {
        // Check if user exists with same email
        user = await User.findOne({
          where: { email: profile.emails[0].value },
          transaction
        });
        
        if (!user) {
          // Create new user
          const userData = {
            email: profile.emails[0].value,
            displayName: profile.displayName,
            isVerified: true
          };
          
          if (profile.name) {
            userData.firstName = profile.name.givenName;
            userData.lastName = profile.name.familyName;
          }
          
          if (profile.photos && profile.photos.length > 0) {
            userData.profilePicture = profile.photos[0].value;
          }
          
          user = await User.create(userData, { transaction });
        }
        
        // Create OAuth provider record
        oauthProvider = await OAuthProvider.create({
          userId: user.id,
          provider: provider,
          providerId: profile.id,
          email: profile.emails[0].value,
          displayName: profile.displayName,
          profileData: profile._json
        }, { transaction });
      }
      
      await transaction.commit();
      
      // Reload user with associations
      return await User.findByPk(user.id, {
        include: [
          { model: OAuthProvider, as: 'oauthProviders' },
          { model: UserSession, as: 'sessions', where: { isActive: true }, required: false }
        ]
      });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  
  /**
   * Clean up expired sessions and tokens
   */
  async cleanupExpired() {
    const now = new Date();
    
    try {
      // Clean up expired sessions
      const expiredSessions = await UserSession.destroy({
        where: {
          expiresAt: {
            [Sequelize.Op.lt]: now
          }
        }
      });
      
      // Clean up expired refresh tokens
      const expiredTokens = await RefreshToken.destroy({
        where: {
          expiresAt: {
            [Sequelize.Op.lt]: now
          }
        }
      });
      
      logger.info('Cleanup completed', {
        expiredSessions,
        expiredTokens
      });
      
      return { expiredSessions, expiredTokens };
    } catch (error) {
      logger.error('Cleanup error:', error);
      throw error;
    }
  },
  
  /**
   * Close database connection
   */
  async close() {
    await sequelize.close();
    logger.info('Database connection closed');
  }
};

// Import and initialize trading models
import { tradingModels, initializeTradingModels } from './trading-models.mjs';

// Extend database with trading models
database.tradingModels = tradingModels;

// Update initialize function to include trading models
const originalInitialize = database.initialize;
database.initialize = async function() {
  try {
    // Call original initialize
    await originalInitialize.call(this);
    
    // Initialize trading models
    await initializeTradingModels();
    
    logger.info('All database models initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize database models:', error);
    throw error;
  }
};

export { User, OAuthProvider, UserSession, RefreshToken, SecurityEvent, tradingModels };
export default database;