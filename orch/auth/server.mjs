#!/usr/bin/env node
/**
 * OAuth Authentication Server
 * Production-ready authentication system with Google, GitHub, and Microsoft OAuth providers
 * Includes session management, refresh tokens, and comprehensive security features
 */

import express from 'express';
import session from 'express-session';
import passport from 'passport';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { createClient } from 'redis';
import ConnectRedis from 'connect-redis';
import dotenv from 'dotenv';

import { logger } from './lib/logger.mjs';
import { config } from './lib/config.mjs';
import { database } from './lib/database.mjs';
import { errorHandler } from './middleware/errorHandler.mjs';
import { requestLogger } from './middleware/requestLogger.mjs';
import { csrfProtection } from './middleware/csrf.mjs';
import { initializePassport } from './lib/passport-config.mjs';
import authRoutes from './routes/auth.mjs';
import userRoutes from './routes/users.mjs';
import tradingRoutes from './routes/trading.mjs';
import { healthCheck } from './middleware/healthCheck.mjs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.server.port || 3001;

/**
 * Security Middleware Configuration
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimiting.windowMs,
  max: config.security.rateLimiting.maxRequests,
  message: {
    error: 'Too many requests from this IP',
    retryAfter: Math.ceil(config.security.rateLimiting.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(config.security.rateLimiting.windowMs / 1000)
    });
  }
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 auth attempts per window
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts',
    retryAfter: 900
  }
});

app.use('/api/auth', authLimiter);
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: config.server.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.server.bodyLimit }));
app.use(cookieParser());

// Request logging
app.use(requestLogger);

/**
 * Session Configuration with Redis
 */
const redisClient = createClient({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.database
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis session store');
});

await redisClient.connect();

const RedisStore = ConnectRedis(session);

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: config.session.secret,
  name: config.session.name,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: config.env === 'production',
    httpOnly: true,
    maxAge: config.session.maxAge,
    sameSite: config.env === 'production' ? 'strict' : 'lax'
  }
}));

/**
 * Passport Initialization
 */
app.use(passport.initialize());
app.use(passport.session());
await initializePassport();

/**
 * CSRF Protection (applied after session middleware)
 */
app.use(csrfProtection);

/**
 * Health Check Endpoint
 */
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trading', tradingRoutes);

/**
 * Root endpoint with API information
 */
app.get('/', (req, res) => {
  res.json({
    name: 'ORCH Authentication API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      health: '/health',
      auth: {
        google: '/api/auth/google',
        github: '/api/auth/github',
        microsoft: '/api/auth/microsoft',
        logout: '/api/auth/logout',
        refresh: '/api/auth/refresh',
        profile: '/api/auth/profile'
      },
      users: {
        profile: '/api/users/profile',
        sessions: '/api/users/sessions'
      }
    },
    documentation: '/api/docs'
  });
});

/**
 * API Documentation endpoint
 */
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'ORCH Authentication API Documentation',
    version: '1.0.0',
    description: 'OAuth 2.0 authentication with Google, GitHub, and Microsoft',
    security: {
      csrf: 'CSRF tokens required for state-changing operations',
      rateLimit: 'Rate limiting applied to all endpoints',
      session: 'Secure session management with Redis storage'
    },
    authentication: {
      providers: ['Google', 'GitHub', 'Microsoft'],
      flow: 'OAuth 2.0 Authorization Code flow',
      tokens: 'JWT access tokens with refresh token support',
      sessions: 'Server-side session management'
    },
    endpoints: [
      {
        method: 'GET',
        path: '/api/auth/google',
        description: 'Initiate Google OAuth flow'
      },
      {
        method: 'GET',
        path: '/api/auth/github',
        description: 'Initiate GitHub OAuth flow'
      },
      {
        method: 'GET',
        path: '/api/auth/microsoft',
        description: 'Initiate Microsoft OAuth flow'
      },
      {
        method: 'POST',
        path: '/api/auth/logout',
        description: 'Logout user and invalidate session'
      },
      {
        method: 'POST',
        path: '/api/auth/refresh',
        description: 'Refresh access token using refresh token'
      },
      {
        method: 'GET',
        path: '/api/auth/profile',
        description: 'Get authenticated user profile'
      }
    ]
  });
});

/**
 * 404 Handler
 */
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    suggestions: [
      'Check the API documentation at /api/docs',
      'Ensure you\'re using the correct HTTP method',
      'Verify the endpoint URL is correct'
    ]
  });
});

/**
 * Global Error Handler
 */
app.use(errorHandler);

/**
 * Graceful Shutdown Handlers
 */
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close Redis connection
    await redisClient.disconnect();
    logger.info('Redis connection closed');
    
    // Close database connection
    if (database.sequelize) {
      await database.sequelize.close();
      logger.info('Database connection closed');
    }
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Unhandled Error Handlers
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    reason,
    promise,
    stack: reason instanceof Error ? reason.stack : undefined
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack
  });
  
  // Perform graceful shutdown on uncaught exception
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

/**
 * Start Server
 */
async function startServer() {
  try {
    // Initialize database
    await database.initialize();
    logger.info('Database initialized successfully');
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Authentication server running on port ${PORT}`, {
        port: PORT,
        environment: config.env,
        nodeVersion: process.version,
        providers: ['Google', 'GitHub', 'Microsoft']
      });
      
      logger.info('Available OAuth providers:', {
        google: !!config.oauth.google.clientId,
        github: !!config.oauth.github.clientId,
        microsoft: !!config.oauth.microsoft.clientId
      });
      
      logger.info('Server endpoints available:', {
        health: `http://localhost:${PORT}/health`,
        docs: `http://localhost:${PORT}/api/docs`,
        auth: `http://localhost:${PORT}/api/auth`
      });
    });
    
    // Set server timeout
    server.timeout = config.server.timeout;
    
    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { app, startServer };