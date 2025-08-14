/**
 * Configuration Management
 * Centralized configuration with environment variable validation and defaults
 */

import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

/**
 * Configuration Schema for Validation
 */
const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3001),
  
  // Database Configuration
  DATABASE_URL: Joi.string().uri().required(),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_SSL: Joi.boolean().default(false),
  
  // Redis Configuration
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DATABASE: Joi.number().min(0).max(15).default(0),
  
  // Session Configuration
  SESSION_SECRET: Joi.string().min(32).required(),
  SESSION_NAME: Joi.string().default('orch.sid'),
  SESSION_MAX_AGE: Joi.number().default(24 * 60 * 60 * 1000), // 24 hours
  
  // JWT Configuration
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  
  // OAuth Provider Configuration
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GITHUB_CLIENT_ID: Joi.string().required(),
  GITHUB_CLIENT_SECRET: Joi.string().required(),
  MICROSOFT_CLIENT_ID: Joi.string().required(),
  MICROSOFT_CLIENT_SECRET: Joi.string().required(),
  
  // Server Configuration
  BASE_URL: Joi.string().uri().default('http://localhost:3001'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000,http://localhost:3001'),
  
  // Security Configuration
  BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(12),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  BODY_LIMIT: Joi.string().default('10mb'),
  SERVER_TIMEOUT: Joi.number().default(30000),
  
  // Logging Configuration
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE: Joi.string().default('logs/auth.log'),
  
  // Feature Flags
  ENABLE_CSRF: Joi.boolean().default(true),
  ENABLE_RATE_LIMITING: Joi.boolean().default(true),
  ENABLE_REQUEST_LOGGING: Joi.boolean().default(true),
}).unknown();

/**
 * Validate and parse environment variables
 */
const { error, value: envVars } = configSchema.validate(process.env);

if (error) {
  throw new Error(`Configuration validation error: ${error.message}`);
}

/**
 * Exported configuration object
 */
export const config = {
  env: envVars.NODE_ENV,
  
  server: {
    port: envVars.PORT,
    baseUrl: envVars.BASE_URL,
    frontendUrl: envVars.FRONTEND_URL,
    bodyLimit: envVars.BODY_LIMIT,
    timeout: envVars.SERVER_TIMEOUT
  },
  
  database: {
    url: envVars.DATABASE_URL,
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    database: envVars.DB_NAME,
    username: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    ssl: envVars.DB_SSL,
    dialect: 'postgres',
    logging: envVars.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD || undefined,
    database: envVars.REDIS_DATABASE
  },
  
  session: {
    secret: envVars.SESSION_SECRET,
    name: envVars.SESSION_NAME,
    maxAge: envVars.SESSION_MAX_AGE
  },
  
  jwt: {
    access: {
      secret: envVars.JWT_ACCESS_SECRET,
      expiresIn: envVars.JWT_ACCESS_EXPIRES_IN
    },
    refresh: {
      secret: envVars.JWT_REFRESH_SECRET,
      expiresIn: envVars.JWT_REFRESH_EXPIRES_IN
    }
  },
  
  oauth: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackURL: `${envVars.BASE_URL}/api/auth/google/callback`,
      scope: ['profile', 'email']
    },
    github: {
      clientId: envVars.GITHUB_CLIENT_ID,
      clientSecret: envVars.GITHUB_CLIENT_SECRET,
      callbackURL: `${envVars.BASE_URL}/api/auth/github/callback`,
      scope: ['user:email']
    },
    microsoft: {
      clientId: envVars.MICROSOFT_CLIENT_ID,
      clientSecret: envVars.MICROSOFT_CLIENT_SECRET,
      callbackURL: `${envVars.BASE_URL}/api/auth/microsoft/callback`,
      scope: ['profile', 'email'],
      tenant: 'common' // Support personal and work accounts
    }
  },
  
  cors: {
    allowedOrigins: envVars.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  },
  
  security: {
    bcryptRounds: envVars.BCRYPT_ROUNDS,
    rateLimiting: {
      enabled: envVars.ENABLE_RATE_LIMITING,
      windowMs: envVars.RATE_LIMIT_WINDOW_MS,
      maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS
    },
    csrf: {
      enabled: envVars.ENABLE_CSRF
    }
  },
  
  logging: {
    level: envVars.LOG_LEVEL,
    file: envVars.LOG_FILE,
    requestLogging: envVars.ENABLE_REQUEST_LOGGING
  }
};

/**
 * Configuration validation at startup
 */
export function validateConfig() {
  const requiredSecrets = [
    'SESSION_SECRET',
    'JWT_ACCESS_SECRET', 
    'JWT_REFRESH_SECRET'
  ];
  
  const requiredOAuthConfig = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GITHUB_CLIENT_ID', 
    'GITHUB_CLIENT_SECRET',
    'MICROSOFT_CLIENT_ID',
    'MICROSOFT_CLIENT_SECRET'
  ];
  
  const requiredDbConfig = [
    'DATABASE_URL',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];
  
  // Check required secrets
  for (const secret of requiredSecrets) {
    if (!process.env[secret]) {
      throw new Error(`Missing required environment variable: ${secret}`);
    }
    
    if (process.env[secret].length < 32) {
      throw new Error(`${secret} must be at least 32 characters long for security`);
    }
  }
  
  // Check OAuth configuration
  for (const oauthVar of requiredOAuthConfig) {
    if (!process.env[oauthVar]) {
      throw new Error(`Missing OAuth configuration: ${oauthVar}`);
    }
  }
  
  // Check database configuration
  for (const dbVar of requiredDbConfig) {
    if (!process.env[dbVar]) {
      throw new Error(`Missing database configuration: ${dbVar}`);
    }
  }
  
  // Validate URLs
  try {
    new URL(config.server.baseUrl);
    new URL(config.server.frontendUrl);
  } catch (error) {
    throw new Error('Invalid URL configuration: BASE_URL and FRONTEND_URL must be valid URLs');
  }
  
  // Production-specific validations
  if (config.env === 'production') {
    if (!config.server.baseUrl.startsWith('https://')) {
      throw new Error('BASE_URL must use HTTPS in production');
    }
    
    if (!config.server.frontendUrl.startsWith('https://')) {
      throw new Error('FRONTEND_URL must use HTTPS in production');
    }
    
    if (config.security.bcryptRounds < 12) {
      throw new Error('BCRYPT_ROUNDS should be at least 12 in production');
    }
  }
  
  return true;
}

/**
 * Get configuration for specific environment
 */
export function getEnvironmentConfig() {
  const baseConfig = { ...config };
  
  switch (config.env) {
    case 'test':
      return {
        ...baseConfig,
        database: {
          ...baseConfig.database,
          database: `${baseConfig.database.database}_test`
        },
        logging: {
          ...baseConfig.logging,
          level: 'error'
        }
      };
      
    case 'development':
      return {
        ...baseConfig,
        logging: {
          ...baseConfig.logging,
          level: 'debug'
        }
      };
      
    case 'production':
      return {
        ...baseConfig,
        logging: {
          ...baseConfig.logging,
          level: 'warn'
        }
      };
      
    default:
      return baseConfig;
  }
}

// Validate configuration on import
validateConfig();