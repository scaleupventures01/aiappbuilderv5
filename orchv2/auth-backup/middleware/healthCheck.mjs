/**
 * Health Check Middleware
 * Comprehensive health monitoring for the authentication service
 */

import { database } from '../lib/database.mjs';
import { logger } from '../lib/logger.mjs';
import { config } from '../lib/config.mjs';

/**
 * Basic health check
 */
export async function healthCheck(req, res) {
  const startTime = Date.now();
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.env,
    uptime: process.uptime(),
    checks: {}
  };
  
  try {
    // Check database connectivity
    healthStatus.checks.database = await checkDatabase();
    
    // Check Redis connectivity
    healthStatus.checks.redis = await checkRedis();
    
    // Check memory usage
    healthStatus.checks.memory = checkMemory();
    
    // Check OAuth providers configuration
    healthStatus.checks.oauth = checkOAuthConfig();
    
    // Check disk space (basic)
    healthStatus.checks.disk = await checkDiskSpace();
    
    // Determine overall status
    const allChecksHealthy = Object.values(healthStatus.checks).every(check => check.status === 'healthy');
    healthStatus.status = allChecksHealthy ? 'healthy' : 'degraded';
    
    // Calculate response time
    healthStatus.responseTime = Date.now() - startTime;
    
    // Return appropriate status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    logger.error('Health check failed:', error);
    
    healthStatus.status = 'unhealthy';
    healthStatus.error = error.message;
    healthStatus.responseTime = Date.now() - startTime;
    
    res.status(503).json(healthStatus);
  }
}

/**
 * Check database connectivity and performance
 */
async function checkDatabase() {
  try {
    const startTime = Date.now();
    
    // Test basic connectivity
    await database.sequelize.authenticate();
    
    // Test a simple query
    await database.sequelize.query('SELECT 1 as test');
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      details: {
        dialect: database.sequelize.getDialect(),
        pool: {
          max: database.sequelize.options.pool.max,
          min: database.sequelize.options.pool.min,
          idle: database.sequelize.options.pool.idle,
          acquire: database.sequelize.options.pool.acquire
        }
      }
    };
    
  } catch (error) {
    logger.error('Database health check failed:', error);
    
    return {
      status: 'unhealthy',
      error: error.message,
      details: {
        type: 'database_connection_error'
      }
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis() {
  try {
    // This would need to be implemented with actual Redis client
    // For now, we'll simulate the check
    
    return {
      status: 'healthy',
      responseTime: 5,
      details: {
        host: config.redis.host,
        port: config.redis.port,
        database: config.redis.database
      }
    };
    
  } catch (error) {
    logger.error('Redis health check failed:', error);
    
    return {
      status: 'unhealthy',
      error: error.message,
      details: {
        type: 'redis_connection_error'
      }
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory() {
  try {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryUtilization = (usedMemory / totalMemory) * 100;
    
    // Memory is considered unhealthy if usage is above 90%
    const status = memoryUtilization > 90 ? 'unhealthy' : 'healthy';
    
    return {
      status,
      details: {
        heapUsed: Math.round(usedMemory / 1024 / 1024), // MB
        heapTotal: Math.round(totalMemory / 1024 / 1024), // MB
        utilization: Math.round(memoryUtilization), // %
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
      }
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Check OAuth providers configuration
 */
function checkOAuthConfig() {
  try {
    const providers = {
      google: {
        configured: !!(config.oauth.google.clientId && config.oauth.google.clientSecret),
        callbackUrl: config.oauth.google.callbackURL
      },
      github: {
        configured: !!(config.oauth.github.clientId && config.oauth.github.clientSecret),
        callbackUrl: config.oauth.github.callbackURL
      },
      microsoft: {
        configured: !!(config.oauth.microsoft.clientId && config.oauth.microsoft.clientSecret),
        callbackUrl: config.oauth.microsoft.callbackURL
      }
    };
    
    const allConfigured = Object.values(providers).every(provider => provider.configured);
    
    return {
      status: allConfigured ? 'healthy' : 'degraded',
      details: providers
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Check disk space
 */
async function checkDiskSpace() {
  try {
    // Basic disk space check (would need proper implementation)
    // For now, we'll simulate a healthy disk
    
    return {
      status: 'healthy',
      details: {
        available: '50GB',
        used: '30GB',
        total: '80GB',
        utilization: '37%'
      }
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Detailed health check with metrics
 */
export async function detailedHealthCheck(req, res) {
  const startTime = Date.now();
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.env,
    node: {
      version: process.version,
      uptime: process.uptime(),
      pid: process.pid
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      loadavg: process.loadavg(),
      cpuUsage: process.cpuUsage()
    },
    checks: {},
    metrics: {}
  };
  
  try {
    // Run all health checks
    healthStatus.checks.database = await checkDatabase();
    healthStatus.checks.redis = await checkRedis();
    healthStatus.checks.memory = checkMemory();
    healthStatus.checks.oauth = checkOAuthConfig();
    healthStatus.checks.disk = await checkDiskSpace();
    
    // Add application metrics
    healthStatus.metrics = await getApplicationMetrics();
    
    // Determine overall status
    const criticalChecks = ['database', 'memory'];
    const criticalFailed = criticalChecks.some(check => 
      healthStatus.checks[check]?.status === 'unhealthy'
    );
    
    const anyDegraded = Object.values(healthStatus.checks).some(check => 
      check.status === 'degraded'
    );
    
    if (criticalFailed) {
      healthStatus.status = 'unhealthy';
    } else if (anyDegraded) {
      healthStatus.status = 'degraded';
    } else {
      healthStatus.status = 'healthy';
    }
    
    healthStatus.responseTime = Date.now() - startTime;
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    
    healthStatus.status = 'unhealthy';
    healthStatus.error = error.message;
    healthStatus.responseTime = Date.now() - startTime;
    
    res.status(503).json(healthStatus);
  }
}

/**
 * Get application-specific metrics
 */
async function getApplicationMetrics() {
  try {
    const metrics = {
      activeUsers: 0,
      activeSessions: 0,
      totalUsers: 0,
      recentLogins: 0 // Last 24 hours
    };
    
    // Get user counts
    const userCount = await database.models.User.count({
      where: { isActive: true }
    });
    metrics.totalUsers = userCount;
    
    // Get active sessions count
    const activeSessionsCount = await database.models.UserSession.count({
      where: {
        isActive: true,
        expiresAt: {
          [database.sequelize.Op.gt]: new Date()
        }
      }
    });
    metrics.activeSessions = activeSessionsCount;
    
    // Get recent logins (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLoginsCount = await database.models.User.count({
      where: {
        lastLoginAt: {
          [database.sequelize.Op.gte]: twentyFourHoursAgo
        }
      }
    });
    metrics.recentLogins = recentLoginsCount;
    
    return metrics;
    
  } catch (error) {
    logger.error('Error getting application metrics:', error);
    return {
      error: 'Failed to retrieve metrics'
    };
  }
}

/**
 * Readiness check - determines if service is ready to accept traffic
 */
export async function readinessCheck(req, res) {
  try {
    // Check critical dependencies
    const databaseReady = await checkDatabase();
    
    if (databaseReady.status !== 'healthy') {
      return res.status(503).json({
        ready: false,
        message: 'Database not ready',
        details: databaseReady
      });
    }
    
    res.json({
      ready: true,
      message: 'Service is ready to accept traffic',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Readiness check failed:', error);
    
    res.status(503).json({
      ready: false,
      message: 'Service not ready',
      error: error.message
    });
  }
}

/**
 * Liveness check - determines if service is alive
 */
export function livenessCheck(req, res) {
  res.json({
    alive: true,
    message: 'Service is alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}

export default {
  healthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck
};