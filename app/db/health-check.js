const { testConnection, closePool } = require('./connection');

/**
 * Database health check utility
 * Used by Railway health checks and monitoring
 */

const performHealthCheck = async () => {
  console.log('🔍 Starting database health check...');
  
  try {
    const startTime = Date.now();
    const isConnected = await testConnection();
    const duration = Date.now() - startTime;
    
    if (isConnected) {
      console.log(`✅ Database health check passed in ${duration}ms`);
      return {
        status: 'healthy',
        database: {
          connected: true,
          response_time_ms: duration,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      console.log(`❌ Database health check failed after ${duration}ms`);
      return {
        status: 'unhealthy',
        database: {
          connected: false,
          response_time_ms: duration,
          timestamp: new Date().toISOString(),
          error: 'Connection failed'
        }
      };
    }
  } catch (error) {
    console.error('❌ Database health check error:', error.message);
    return {
      status: 'unhealthy',
      database: {
        connected: false,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    };
  }
};

// Express middleware for health checks
const healthCheckMiddleware = async (req, res) => {
  try {
    const healthResult = await performHealthCheck();
    
    const statusCode = healthResult.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      service: 'elite-trading-coach-ai',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      ...healthResult
    });
  } catch (error) {
    console.error('Health check middleware error:', error);
    res.status(503).json({
      service: 'elite-trading-coach-ai',
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    await closePool();
    console.log('✅ Database connections closed');
    
    console.log('👋 Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Command line usage
if (require.main === module) {
  (async () => {
    const result = await performHealthCheck();
    console.log('\n📊 Health Check Result:', JSON.stringify(result, null, 2));
    
    await closePool();
    process.exit(result.status === 'healthy' ? 0 : 1);
  })();
}

module.exports = {
  performHealthCheck,
  healthCheckMiddleware,
  gracefulShutdown
};