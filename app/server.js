/**
 * Elite Trading Coach AI - Main Server
 * Express Server with Socket.io WebSocket support
 * Created: 2025-08-14
 * 
 * Features:
 * - Modular architecture with centralized configuration
 * - Socket.io WebSocket support for real-time chat
 * - Tier-based rate limiting
 * - Enhanced error handling and monitoring
 * - Graceful shutdown handling
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Import configuration and utilities
import { 
  serverConfig, 
  validateEnvironment, 
  isDevelopment 
} from './server/config/environment.js';

// Import middleware
import { securityHeaders } from './middleware/auth.js';
import { 
  basicRateLimit, 
  tierBasedRateLimit, 
  authRateLimit,
  rateLimitHeaders 
} from './server/middleware/rate-limit.js';
import { 
  setupErrorMonitoring
} from './server/middleware/error-handler.js';
import { 
  errorHandler, 
  notFoundHandler, 
  asyncHandler,
  validateMethod,
  MethodNotAllowedError
} from './middleware/error-handler.js';

// Import CORS configuration
import { 
  createCorsMiddleware, 
  createStrictCorsMiddleware,
  corsErrorHandler,
  preflightHandler,
  getCorsStatus 
} from './server/middleware/cors-config.js';

// Import WebSocket handlers
import { socketAuthMiddleware } from './server/middleware/socket-auth.js';
import initializeChatHandlers from './server/websocket/chat-handler.js';
import { setSocketIOInstance } from './server/websocket/socket-manager.js';

// Import route modules
import registerRoutes from './api/users/register.js';
import authRoutes from './api/auth/login.js';
import profileRoutes from './api/users/profile.js';
import speedPreferenceRoutes from './api/users/speed-preference.js';
import conversationRoutes from './api/conversations/index.js';
import messageRoutes from './api/messages/index.js';
import uploadRoutes from './api/routes/upload.js';
import uploadAnalyzeRoutes from './api/routes/upload-analyze.js';
import analyzeTradeRoutes from './api/analyze-trade.js';
import testAnalyzeTradeRoutes from './api/test-analyze-trade.js';
import speedAnalyticsRoutes from './api/analytics/speed.js';

/**
 * Initialize Express application
 */
const app = express();
const server = createServer(app);

/**
 * Initialize Socket.io server with enhanced CORS
 */
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      // Use the same origin validation logic as HTTP CORS
      const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : ['http://localhost:3000', 'http://localhost:5173'];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In development, allow any localhost origin
        if (process.env.NODE_ENV === 'development' && origin?.includes('localhost')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by WebSocket CORS'));
        }
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: serverConfig.websocket.pingTimeout,
  pingInterval: serverConfig.websocket.pingInterval,
  maxHttpBufferSize: serverConfig.websocket.maxHttpBufferSize,
  transports: serverConfig.websocket.transports
});

// Register Socket.IO instance with the manager for use across the application
setSocketIOInstance(io);

/**
 * Validate environment variables (async validation handled in background)
 */
validateEnvironment().catch(error => {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
});

/**
 * Setup error monitoring
 */
setupErrorMonitoring();

/**
 * Security middleware
 */
app.use(helmet(serverConfig.security.helmet));

/**
 * Preflight request optimization
 */
app.use(preflightHandler);

/**
 * CORS configuration with enhanced security
 */
app.use(createCorsMiddleware());

/**
 * CORS error handling
 */
app.use(corsErrorHandler);

/**
 * Body parsing middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/**
 * Custom security headers
 */
app.use(securityHeaders);

/**
 * Static file serving for development (SECURITY: Development only)
 */
if (isDevelopment) {
  console.log('🚨 DEVELOPMENT MODE: Static file serving enabled');
  
  // Serve static files from app directory with security restrictions
  app.use(express.static('.', {
    // Security: Restrict to specific file types for testing
    setHeaders: (res, path) => {
      // Only allow specific test files and safe content types
      if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.png') || path.endsWith('.jpg')) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      } else {
        // Block other file types
        res.status(403);
        return false;
      }
    },
    // Security: Prevent directory traversal
    dotfiles: 'deny',
    index: false,
    // Only serve files from current directory, prevent path traversal
    redirect: false
  }));
}

/**
 * Rate limiting headers
 */
app.use(rateLimitHeaders);

/**
 * Request logging middleware
 */
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const logInfo = `${timestamp} - ${req.method} ${req.path}`;
  const userInfo = req.user ? ` - User: ${req.user.id}` : ` - IP: ${req.ip}`;
  
  console.log(logInfo + userInfo);
  next();
});

/**
 * Health check endpoints
 */
app.get('/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Elite Trading Coach AI API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: serverConfig.nodeEnv,
    websocket: {
      status: 'active',
      connectedClients: io.sockets.sockets.size
    }
  });
}));

app.get('/health/db', asyncHandler(async (req, res) => {
  const { query } = await import('./db/connection.js');
  const result = await query('SELECT NOW() as current_time, version() as db_version');
      
  res.json({
    success: true,
    message: 'Database connection healthy',
    data: {
      current_time: result.rows[0].current_time,
      db_version: result.rows[0].db_version,
      connected: true
    }
  });
}));

/**
 * WebSocket health check
 */
app.get('/health/websocket', (req, res) => {
  res.json({
    success: true,
    message: 'WebSocket server healthy',
    data: {
      connectedClients: io.sockets.sockets.size,
      uptime: process.uptime(),
      status: 'active'
    }
  });
});

/**
 * Upload functionality health check
 */
app.get('/health/upload', asyncHandler(async (req, res) => {
  try {
    const { validateUploadsTable } = await import('./db/validate-uploads-table.js');
    const { validateCloudinaryEnvironment, isUploadEnabled } = await import('./server/config/environment.js');
    const { uploadService } = await import('./services/uploadService.js');

    const healthCheck = {
      success: true,
      message: 'Upload system health check',
      data: {
        timestamp: new Date().toISOString(),
        components: {}
      }
    };

    // Check uploads table
    try {
      await validateUploadsTable();
      healthCheck.data.components.database = {
        status: 'healthy',
        message: 'uploads table exists and is properly configured'
      };
    } catch (error) {
      healthCheck.data.components.database = {
        status: 'error',
        message: error.message
      };
      healthCheck.success = false;
    }

    // Check Cloudinary configuration
    try {
      validateCloudinaryEnvironment();
      healthCheck.data.components.cloudinary = {
        status: 'healthy',
        message: 'Cloudinary environment variables configured',
        configured: uploadService.isConfigured
      };
    } catch (error) {
      healthCheck.data.components.cloudinary = {
        status: 'error',
        message: error.message,
        configured: false
      };
      healthCheck.success = false;
    }

    // Check overall upload functionality
    const uploadEnabled = await isUploadEnabled();
    healthCheck.data.components.uploadService = {
      status: uploadEnabled ? 'healthy' : 'disabled',
      message: uploadEnabled ? 'Upload functionality is enabled' : 'Upload functionality is disabled due to configuration issues'
    };

    // Set appropriate status code
    const statusCode = healthCheck.success ? 200 : 503;
    
    res.status(statusCode).json(healthCheck);

  } catch (error) {
    console.error('Upload health check error:', error);
    res.status(503).json({
      success: false,
      message: 'Upload health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * OpenAI API health check
 */
app.get('/health/openai', asyncHandler(async (req, res) => {
  try {
    const { tradeAnalysisService } = await import('./server/services/trade-analysis-service.js');
    
    // Check if service is available
    let healthStatus;
    try {
      healthStatus = await tradeAnalysisService.healthCheck();
    } catch (error) {
      healthStatus = {
        status: 'error',
        error: error.message,
        initialized: false
      };
    }

    // Check environment variable presence
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const useMock = process.env.USE_MOCK_OPENAI === 'true';

    const healthCheck = {
      success: healthStatus.status === 'healthy' || useMock,
      message: useMock ? 'OpenAI service running in mock mode' : 
               healthStatus.status === 'healthy' ? 'OpenAI service is operational' : 
               'OpenAI service is not available',
      data: {
        status: useMock ? 'mock_mode' : healthStatus.status,
        initialized: healthStatus.initialized,
        hasApiKey,
        useMockMode: useMock,
        timestamp: new Date().toISOString(),
        ...(healthStatus.error && { error: healthStatus.error })
      }
    };

    const statusCode = (healthStatus.status === 'healthy' || useMock) ? 200 : 503;
    res.status(statusCode).json(healthCheck);
    
  } catch (error) {
    console.error('OpenAI health check error:', error);
    res.status(503).json({
      success: false,
      message: 'OpenAI health check failed',
      data: {
        status: 'error',
        error: error.message,
        hasApiKey: !!process.env.OPENAI_API_KEY,
        useMockMode: process.env.USE_MOCK_OPENAI === 'true',
        timestamp: new Date().toISOString()
      }
    });
  }
}));

/**
 * Production OpenAI API health check - PRD 1.2.10
 * Comprehensive production mode validation and monitoring
 */
app.get('/api/health/openai/production', asyncHandler(async (req, res) => {
  try {
    const { productionHealthCheck } = await import('./config/openai-production.js');
    
    // Perform comprehensive production health check
    const healthStatus = await productionHealthCheck();
    
    // Determine response status code
    let statusCode = 200;
    if (healthStatus.status === 'unhealthy' || healthStatus.status === 'error') {
      statusCode = 503;
    } else if (healthStatus.mode === 'mock' && process.env.NODE_ENV === 'production') {
      statusCode = 503; // Mock mode in production is unhealthy
    }
    
    // Add production-specific metadata
    const response = {
      success: statusCode === 200,
      message: healthStatus.status === 'healthy' ? 
        'Production OpenAI API is operational' : 
        'Production OpenAI API has issues',
      ...healthStatus
    };
    
    res.status(statusCode).json(response);
    
  } catch (error) {
    console.error('Production OpenAI health check error:', error);
    res.status(503).json({
      success: false,
      status: 'error',
      mode: 'unknown',
      message: 'Production health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * Production performance metrics endpoint - PRD 1.2.10
 * Provides detailed performance metrics for production monitoring
 */
app.get('/api/metrics/openai/production', asyncHandler(async (req, res) => {
  try {
    const { productionMetrics } = await import('./services/production-metrics.js');
    
    // Get comprehensive performance metrics
    const metrics = productionMetrics.getPerformanceSummary();
    const targetCompliance = productionMetrics.checkPerformanceTargets();
    
    const response = {
      success: true,
      message: 'Production OpenAI performance metrics',
      data: {
        ...metrics,
        targetCompliance,
        healthStatus: targetCompliance.overall ? 'healthy' : 'degraded'
      }
    };
    
    // Return appropriate status code based on performance
    const statusCode = targetCompliance.overall ? 200 : 503;
    res.status(statusCode).json(response);
    
  } catch (error) {
    console.error('Production metrics error:', error);
    res.status(503).json({
      success: false,
      message: 'Production metrics unavailable',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * Production mode status reporting endpoint - PRD 1.2.10
 * Comprehensive status report for production mode validation
 */
app.get('/api/status/openai/production', asyncHandler(async (req, res) => {
  try {
    const { productionHealthCheck } = await import('./config/openai-production.js');
    const { productionMetrics } = await import('./services/production-metrics.js');
    
    // Get health check and metrics
    const healthStatus = await productionHealthCheck();
    const performanceMetrics = productionMetrics.getPerformanceSummary();
    const targetCompliance = productionMetrics.checkPerformanceTargets();
    
    const response = {
      success: healthStatus.status === 'healthy' && targetCompliance.overall,
      message: 'Production OpenAI status report',
      data: {
        health: healthStatus,
        performance: performanceMetrics,
        compliance: targetCompliance,
        overallStatus: (healthStatus.status === 'healthy' && targetCompliance.overall) ? 'operational' : 'degraded',
        recommendations: []
      }
    };
    
    // Add recommendations based on status
    if (!targetCompliance.responseTime) {
      response.data.recommendations.push('Response time exceeds target - consider optimizing prompts or upgrading API plan');
    }
    if (!targetCompliance.successRate) {
      response.data.recommendations.push('Success rate below target - check API connectivity and error handling');
    }
    if (!targetCompliance.cost) {
      response.data.recommendations.push('Cost exceeds daily target - monitor usage and consider rate limiting');
    }
    if (healthStatus.mode === 'mock' && process.env.NODE_ENV === 'production') {
      response.data.recommendations.push('CRITICAL: Mock mode active in production - configure valid OpenAI API key');
    }
    
    const statusCode = response.success ? 200 : 503;
    res.status(statusCode).json(response);
    
  } catch (error) {
    console.error('Production status error:', error);
    res.status(503).json({
      success: false,
      message: 'Production status check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * API Routes with appropriate rate limiting
 */

// Authentication routes (stricter rate limiting)
app.use('/api/users', authRateLimit, registerRoutes);
app.use('/api/auth', authRateLimit, authRoutes);

// General API routes (tier-based rate limiting) 
app.use('/api/users/profile', tierBasedRateLimit, profileRoutes);
app.use('/api/users/speed-preference', tierBasedRateLimit, speedPreferenceRoutes);
app.use('/api/conversations', tierBasedRateLimit, conversationRoutes);
app.use('/api/messages', tierBasedRateLimit, messageRoutes);

// Analytics routes
app.use('/api/analytics/speed', tierBasedRateLimit, speedAnalyticsRoutes);

// Upload routes
app.use('/api/upload', tierBasedRateLimit, uploadRoutes);

// Unified upload-analyze routes
app.use('/api/upload-analyze', tierBasedRateLimit, uploadAnalyzeRoutes);

// Trade analysis routes (with specific rate limiting)
app.use('/api/analyze-trade', analyzeTradeRoutes);

// Test trade analysis routes (no authentication for testing)
app.use('/api/test-analyze-trade', testAnalyzeTradeRoutes);

/**
 * CRITICAL DEMO FIX ENDPOINTS
 * These endpoints were missing and causing 405/404 errors in the demo
 */

/**
 * POST /generate-test-token
 * Generate a test JWT token for demo/testing purposes
 */
app.post('/generate-test-token', asyncHandler(async (req, res) => {
  try {
    const { generateAccessToken } = await import('./utils/jwt.js');
    
    // Create a test user object compatible with demos
    const testUser = {
      id: '896a9378-15ff-43ac-825a-0c1e84ba5c6b',
      email: 'test@example.com',
      username: 'testuser',
      subscription_tier: 'founder'
    };

    // Generate token using the proper utility
    const token = generateAccessToken(testUser);

    console.log('Generated test JWT token for demo:', {
      userId: testUser.id,
      email: testUser.email,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Test token generated successfully',
      data: {
        token: token,
        user: testUser,
        expires_in: '4h',
        token_type: 'Bearer'
      }
    });

  } catch (error) {
    console.error('Test token generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate test token',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * System Status Endpoint - Comprehensive Configuration Overview
 */
app.get('/api/system/status', asyncHandler(async (req, res) => {
  try {
    // Check environment variable configurations
    const envOverride = process.env.USE_MOCK_OPENAI;
    const envFileValue = process.env.USE_MOCK_OPENAI; // This comes from .env file after being overridden
    const hasMockOverride = envOverride !== undefined;
    const useMockMode = envOverride === 'true' || process.env.USE_MOCK_OPENAI === 'true';
    
    // Check OpenAI service status
    let openAIStatus;
    try {
      const { tradeAnalysisService } = await import('./server/services/trade-analysis-service.js');
      openAIStatus = await tradeAnalysisService.healthCheck();
    } catch (error) {
      openAIStatus = {
        status: 'error',
        error: error.message,
        initialized: false
      };
    }

    // Configuration validation
    const configIssues = [];
    
    // Check for API key configuration
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const apiKeyMasked = process.env.OPENAI_API_KEY ? 
      process.env.OPENAI_API_KEY.substring(0, 8) + '...' + process.env.OPENAI_API_KEY.slice(-4) : 
      'Not configured';

    if (!hasApiKey && !useMockMode) {
      configIssues.push('OpenAI API key not configured but mock mode is disabled');
    }

    // Check for configuration conflicts
    if (process.env.OPENAI_MOCK_ENABLED === 'true' && process.env.USE_MOCK_OPENAI === 'false') {
      configIssues.push('Conflicting mock mode settings: OPENAI_MOCK_ENABLED=true but USE_MOCK_OPENAI=false');
    }

    const systemStatus = {
      success: true,
      message: 'System configuration and status overview',
      timestamp: new Date().toISOString(),
      data: {
        environment: {
          nodeEnv: process.env.NODE_ENV,
          port: process.env.PORT || serverConfig.port,
          debug: process.env.DEBUG === 'true'
        },
        openai: {
          mode: useMockMode ? 'mock' : 'production',
          api_key_configured: hasApiKey,
          api_key_masked: apiKeyMasked,
          model: process.env.OPENAI_MODEL || 'gpt-5',
          fallback_model: process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o',
          service_status: openAIStatus.status,
          service_initialized: openAIStatus.initialized,
          ...(openAIStatus.error && { service_error: openAIStatus.error })
        },
        configuration: {
          source: 'environment + .env file',
          mock_mode_override: {
            has_env_override: hasMockOverride,
            env_override_value: envOverride,
            final_mock_mode: useMockMode
          },
          issues: configIssues
        },
        connectivity: {
          database: 'checking...',
          websocket: {
            status: 'active',
            connected_clients: io.sockets.sockets.size
          },
          frontend_url: process.env.FRONTEND_URL || serverConfig.frontendUrl
        }
      }
    };

    // Quick database connectivity check
    try {
      const { query } = await import('./db/connection.js');
      await query('SELECT 1');
      systemStatus.data.connectivity.database = 'connected';
    } catch (error) {
      systemStatus.data.connectivity.database = `error: ${error.message}`;
      systemStatus.success = false;
    }

    // Set appropriate status code based on issues
    const statusCode = (configIssues.length === 0 && systemStatus.success) ? 200 : 503;
    
    res.status(statusCode).json(systemStatus);

  } catch (error) {
    console.error('System status check error:', error);
    res.status(503).json({
      success: false,
      message: 'System status check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * CORS status endpoint for monitoring
 */
app.get('/health/cors', (req, res) => {
  res.json({
    success: true,
    message: 'CORS configuration status',
    data: getCorsStatus()
  });
});

/**
 * API documentation endpoint
 */
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Elite Trading Coach AI API',
    version: '1.0.0',
    features: {
      websocket: 'Real-time chat and messaging',
      rate_limiting: 'Tier-based rate limiting',
      authentication: 'JWT with refresh tokens',
      error_handling: 'Enhanced error monitoring',
      cors: 'Advanced CORS with environment-specific configuration'
    },
    endpoints: {
      authentication: {
        'POST /api/users/register': 'Register new user account',
        'GET /api/users/check-availability': 'Check email/username availability',
        'POST /api/users/password-strength': 'Check password strength',
        'POST /api/auth/login': 'User login with JWT tokens',
        'POST /api/auth/refresh': 'Refresh access token',
        'POST /api/auth/logout': 'User logout',
        'GET /api/auth/me': 'Get current user info',
        'POST /api/auth/verify-token': 'Verify token validity',
        'GET /api/auth/validate': 'Validate token (demo-compatible alias for verify-token)'
      },
      testing: {
        'POST /generate-test-token': 'Generate test JWT token for demo/testing purposes'
      },
      profile: {
        'GET /api/users/profile': 'Get current user profile',
        'GET /api/users/profile/:userId': 'Get specific user profile',
        'PUT /api/users/profile': 'Update current user profile',
        'PUT /api/users/profile/:userId': 'Update specific user profile',
        'PUT /api/users/profile/:userId/password': 'Update user password',
        'DELETE /api/users/profile/:userId': 'Delete user account'
      },
      speed_preferences: {
        'GET /api/users/speed-preference': 'Get user speed preference',
        'PUT /api/users/speed-preference': 'Update user speed preference',
        'GET /api/users/speed-preference/options': 'Get available speed preference options'
      },
      conversations: {
        'POST /api/conversations': 'Create new conversation',
        'GET /api/conversations': 'List user conversations',
        'GET /api/conversations/:id': 'Get conversation details',
        'PUT /api/conversations/:id': 'Update conversation',
        'DELETE /api/conversations/:id': 'Delete conversation',
        'POST /api/conversations/:id/archive': 'Archive conversation',
        'POST /api/conversations/:id/restore': 'Restore conversation',
        'GET /api/conversations/search': 'Search conversations',
        'GET /api/conversations/stats': 'Get conversation statistics'
      },
      messages: {
        'POST /api/messages': 'Create new message',
        'GET /api/messages/:id': 'Get message details',
        'PUT /api/messages/:id': 'Update message',
        'DELETE /api/messages/:id': 'Delete message',
        'GET /api/messages/conversation/:id': 'Get conversation messages',
        'GET /api/messages/search': 'Full-text search messages',
        'GET /api/messages/:id/thread': 'Get message thread',
        'GET /api/messages/:id/children': 'Get child messages',
        'GET /api/messages/verdict/:verdict': 'Get messages by AI verdict',
        'GET /api/messages/psychology': 'Get psychology messages',
        'GET /api/messages/stats': 'Get message statistics'
      },
      analytics: {
        'GET /api/analytics/speed': 'Get user speed analytics',
        'GET /api/analytics/speed/summary': 'Get speed analytics summary',
        'GET /api/analytics/speed/performance': 'Get speed performance metrics'
      },
      system: {
        'GET /health': 'API health check',
        'GET /health/db': 'Database health check',
        'GET /health/websocket': 'WebSocket health check',
        'GET /health/upload': 'Upload system health check',
        'GET /health/openai': 'OpenAI API health check',
        'GET /api/health/openai/production': 'Production OpenAI API health check with comprehensive validation',
        'GET /api/metrics/openai/production': 'Production OpenAI performance metrics and monitoring',
        'GET /api/status/openai/production': 'Production mode status reporting with compliance validation',
        'GET /health/cors': 'CORS configuration status',
        'GET /api/system/status': 'Comprehensive system configuration and status overview',
        'GET /api': 'API documentation'
      },
      websocket: {
        events: {
          'send_message': 'Send new message to conversation',
          'edit_message': 'Edit existing message',
          'delete_message': 'Delete message',
          'join_conversation': 'Join conversation room',
          'leave_conversation': 'Leave conversation room',
          'typing_start': 'User started typing',
          'typing_stop': 'User stopped typing',
          'update_status': 'Update user online status',
          'get_online_users': 'Get list of online users'
        }
      }
    },
    security: {
      authentication: 'JWT Bearer tokens required for most endpoints',
      rate_limiting: 'Tier-based rate limiting (free/premium/enterprise)',
      websocket_auth: 'JWT authentication required for WebSocket connections',
      cors: 'Configured for frontend integration',
      headers: 'Security headers applied to all responses',
      validation: 'Input validation on all endpoints'
    }
  });
});


/**
 * WebSocket Authentication and Event Handling
 */
io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  console.log(`✅ WebSocket connected: User ${socket.userId} (${socket.userEmail})`);
  
  // Initialize chat handlers for this socket
  initializeChatHandlers(socket, io);
  
  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });
  
  // Basic socket events
  socket.on('ping', (callback) => {
    if (callback) callback('pong');
  });
  
  socket.emit('connected', {
    success: true,
    message: 'WebSocket connection established',
    userId: socket.userId,
    timestamp: new Date().toISOString()
  });
});

/**
 * WebSocket error handling
 */
io.engine.on('connection_error', (error) => {
  console.error('Socket.io connection error:', error);
});

/**
 * Global method validation for specific routes
 */
app.all('/health', validateMethod(['GET']));
app.all('/health/*', validateMethod(['GET']));
app.all('/api', validateMethod(['GET']));

/**
 * 404 handler for unmatched routes
 */
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return notFoundHandler(req, res);
  }
  // For non-API routes, return standard JSON error response
  const error = new MethodNotAllowedError(req.method, ['GET']);
  if (req.method !== 'GET') {
    return next(error);
  }
  
  // Return 404 for non-API GET requests
  notFoundHandler(req, res);
});

/**
 * Global error handler
 */
app.use(errorHandler);

/**
 * Graceful shutdown handling
 */
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ HTTP server closed');
    
    // Close Socket.io server
    io.close((err) => {
      if (err) {
        console.error('❌ Error closing WebSocket server:', err);
        process.exit(1);
      }
      
      console.log('✅ WebSocket server closed');
      
      // Close database connections
      import('./db/connection.js').then(({ close }) => {
        if (close) {
          close().then(() => {
            console.log('✅ Database connections closed');
            console.log('✅ Graceful shutdown complete');
            process.exit(0);
          }).catch((err) => {
            console.error('❌ Error closing database:', err);
            process.exit(1);
          });
        } else {
          console.log('✅ Graceful shutdown complete');
          process.exit(0);
        }
      });
    });
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions (already handled in error monitoring)
process.on('uncaughtException', (error) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

/**
 * Start server
 */
if (serverConfig.nodeEnv !== 'test') {
  server.listen(serverConfig.port, serverConfig.host, () => {
    console.log(`
🚀 Elite Trading Coach AI Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 HTTP Server: http://${serverConfig.host}:${serverConfig.port}
🔌 WebSocket Server: ws://${serverConfig.host}:${serverConfig.port}
🌍 Environment: ${serverConfig.nodeEnv}
🔒 CORS Origin: ${serverConfig.frontendUrl}
📊 Health Check: http://${serverConfig.host}:${serverConfig.port}/health
🔌 WebSocket Health: http://${serverConfig.host}:${serverConfig.port}/health/websocket
📚 API Docs: http://${serverConfig.host}:${serverConfig.port}/api
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Features Active:
   • Real-time WebSocket communication
   • Tier-based rate limiting
   • Enhanced error handling
   • JWT authentication
   • Database integration
   • Graceful shutdown handling
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
  });
}

/**
 * Export for testing
 */
export default app;
export { io, server };