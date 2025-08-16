/**
 * Service Health Monitoring System
 * DevOps tool for comprehensive application monitoring
 * PRD 1.2.2 Implementation
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { performance } from 'perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Health check metrics collection
 */
class HealthMetrics {
  constructor() {
    this.metrics = {
      database: { status: 'unknown', responseTime: 0, errors: 0 },
      openai: { status: 'unknown', responseTime: 0, errors: 0 },
      fileUpload: { status: 'unknown', responseTime: 0, errors: 0 },
      server: { status: 'unknown', uptime: 0, memory: 0, cpu: 0 },
      lastCheck: null,
      totalChecks: 0,
      failedChecks: 0
    };
    this.alerts = [];
    this.history = [];
  }

  /**
   * Record a health check result
   */
  recordCheck(service, status, responseTime = 0, metadata = {}) {
    const now = new Date().toISOString();
    
    this.metrics[service] = {
      status,
      responseTime,
      lastCheck: now,
      ...metadata
    };

    this.metrics.totalChecks++;
    if (status !== 'healthy') {
      this.metrics.failedChecks++;
    }

    // Store in history (keep last 100)
    this.history.push({
      timestamp: now,
      service,
      status,
      responseTime,
      metadata
    });

    if (this.history.length > 100) {
      this.history.shift();
    }

    // Generate alerts for critical issues
    if (status === 'unhealthy') {
      this.generateAlert('CRITICAL', `${service} service is unhealthy`, metadata);
    } else if (status === 'degraded') {
      this.generateAlert('WARNING', `${service} service is degraded`, metadata);
    }
  }

  /**
   * Generate alert
   */
  generateAlert(level, message, metadata = {}) {
    const alert = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.alerts.push(alert);
    console.log(`🚨 [${level}] ${message}`);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }
  }

  /**
   * Get overall system health
   */
  getOverallHealth() {
    const services = ['database', 'openai', 'fileUpload', 'server'];
    const statuses = services.map(service => this.metrics[service].status);
    
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    } else if (statuses.includes('degraded')) {
      return 'degraded';
    } else if (statuses.every(status => status === 'healthy')) {
      return 'healthy';
    } else {
      return 'unknown';
    }
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    return {
      overall: this.getOverallHealth(),
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      memory: `${Math.round(memory.rss / 1024 / 1024)}MB`,
      totalChecks: this.metrics.totalChecks,
      successRate: this.metrics.totalChecks > 0 
        ? Math.round(((this.metrics.totalChecks - this.metrics.failedChecks) / this.metrics.totalChecks) * 100)
        : 0,
      services: {
        database: this.metrics.database,
        openai: this.metrics.openai,
        fileUpload: this.metrics.fileUpload,
        server: this.metrics.server
      },
      recentAlerts: this.alerts.slice(-5)
    };
  }
}

// Global metrics instance
const healthMetrics = new HealthMetrics();

/**
 * Database health check
 */
async function checkDatabaseHealth() {
  const startTime = performance.now();
  let status = 'healthy';
  let metadata = {};

  try {
    // Import database connection dynamically
    const { testConnection } = await import('../db/connection.js');
    
    const isConnected = await testConnection();
    const responseTime = Math.round(performance.now() - startTime);
    
    if (isConnected) {
      status = 'healthy';
      metadata = { connected: true, responseTime };
    } else {
      status = 'unhealthy';
      metadata = { connected: false, error: 'Connection failed' };
    }

    healthMetrics.recordCheck('database', status, responseTime, metadata);
    return { status, responseTime, metadata };

  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    status = 'unhealthy';
    metadata = { error: error.message };
    
    healthMetrics.recordCheck('database', status, responseTime, metadata);
    return { status, responseTime, metadata };
  }
}

/**
 * OpenAI service health check
 */
async function checkOpenAIHealth() {
  const startTime = performance.now();
  let status = 'healthy';
  let metadata = {};

  try {
    // Check if OpenAI health check middleware exists
    const { checkHealth } = await import('../middleware/openai-health.js');
    
    const result = await checkHealth(false); // Force fresh check
    const responseTime = Math.round(performance.now() - startTime);
    
    status = result.status;
    metadata = {
      model: result.config?.model,
      responseTime: result.responseTime,
      mockMode: process.env.OPENAI_MOCK_ENABLED === 'true'
    };

    healthMetrics.recordCheck('openai', status, responseTime, metadata);
    return { status, responseTime, metadata };

  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    status = 'unhealthy';
    metadata = { error: error.message };
    
    healthMetrics.recordCheck('openai', status, responseTime, metadata);
    return { status, responseTime, metadata };
  }
}

/**
 * File upload service health check
 */
async function checkFileUploadHealth() {
  const startTime = performance.now();
  let status = 'healthy';
  let metadata = {};

  try {
    // Check upload configuration
    const maxSize = process.env.MAX_FILE_SIZE_MB;
    const allowedTypes = process.env.ALLOWED_FILE_TYPES;
    
    if (!maxSize || !allowedTypes) {
      status = 'unhealthy';
      metadata = { error: 'Upload configuration missing' };
    } else {
      // Check if upload service files exist
      const fs = await import('fs/promises');
      
      try {
        await fs.access('../middleware/uploadValidation.js');
        await fs.access('../services/uploadService.js');
        
        status = 'healthy';
        metadata = {
          maxFileSize: `${maxSize}MB`,
          allowedTypes: allowedTypes.split(',').length,
          configComplete: true
        };
      } catch (fileError) {
        status = 'degraded';
        metadata = { 
          error: 'Upload service files missing or inaccessible',
          maxFileSize: `${maxSize}MB`,
          allowedTypes: allowedTypes.split(',').length
        };
      }
    }

    const responseTime = Math.round(performance.now() - startTime);
    healthMetrics.recordCheck('fileUpload', status, responseTime, metadata);
    return { status, responseTime, metadata };

  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    status = 'unhealthy';
    metadata = { error: error.message };
    
    healthMetrics.recordCheck('fileUpload', status, responseTime, metadata);
    return { status, responseTime, metadata };
  }
}

/**
 * Server health check
 */
async function checkServerHealth() {
  const startTime = performance.now();
  let status = 'healthy';
  
  try {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    const responseTime = Math.round(performance.now() - startTime);
    
    // Check memory usage (alert if over 500MB)
    const memoryMB = memory.rss / 1024 / 1024;
    if (memoryMB > 500) {
      status = 'degraded';
    }
    
    // Check if server has been running for a reasonable time
    if (uptime < 10) {
      status = 'degraded'; // Recently started
    }

    const metadata = {
      memory: `${Math.round(memoryMB)}MB`,
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      nodeVersion: process.version,
      platform: process.platform
    };

    healthMetrics.recordCheck('server', status, responseTime, metadata);
    return { status, responseTime, metadata };

  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    status = 'unhealthy';
    const metadata = { error: error.message };
    
    healthMetrics.recordCheck('server', status, responseTime, metadata);
    return { status, responseTime, metadata };
  }
}

/**
 * Comprehensive health check
 */
async function performComprehensiveHealthCheck() {
  console.log('🏥 Starting comprehensive health check...\n');
  
  const checks = await Promise.allSettled([
    checkDatabaseHealth(),
    checkOpenAIHealth(), 
    checkFileUploadHealth(),
    checkServerHealth()
  ]);

  const results = {
    timestamp: new Date().toISOString(),
    overall: healthMetrics.getOverallHealth(),
    checks: {
      database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'error', error: checks[0].reason },
      openai: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'error', error: checks[1].reason },
      fileUpload: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'error', error: checks[2].reason },
      server: checks[3].status === 'fulfilled' ? checks[3].value : { status: 'error', error: checks[3].reason }
    },
    summary: healthMetrics.getSummary()
  };

  return results;
}

/**
 * Express middleware for health endpoint
 */
function healthCheckEndpoint(req, res) {
  (async () => {
    try {
      const healthData = await performComprehensiveHealthCheck();
      const httpStatus = healthData.overall === 'unhealthy' ? 503 : 200;
      
      res.status(httpStatus).json({
        service: 'elite-trading-coach-ai',
        version: process.env.npm_package_version || '1.2.2',
        environment: process.env.NODE_ENV || 'development',
        ...healthData
      });
    } catch (error) {
      res.status(500).json({
        service: 'elite-trading-coach-ai',
        status: 'error',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  })();
}

/**
 * Start continuous monitoring
 */
function startMonitoring(intervalMs = 60000) {
  console.log(`🔄 Starting health monitoring (interval: ${intervalMs}ms)`);
  
  // Initial check
  performComprehensiveHealthCheck();
  
  // Set up interval
  const interval = setInterval(async () => {
    try {
      await performComprehensiveHealthCheck();
    } catch (error) {
      console.error('❌ Health check error:', error.message);
    }
  }, intervalMs);

  // Return function to stop monitoring
  return () => {
    clearInterval(interval);
    console.log('⏹️  Health monitoring stopped');
  };
}

/**
 * Generate monitoring report
 */
function generateMonitoringReport() {
  const summary = healthMetrics.getSummary();
  
  console.log('\n📊 Service Health Monitoring Report');
  console.log('==================================');
  console.log(`Overall Status: ${summary.overall.toUpperCase()}`);
  console.log(`System Uptime: ${summary.uptime}`);
  console.log(`Memory Usage: ${summary.memory}`);
  console.log(`Total Checks: ${summary.totalChecks}`);
  console.log(`Success Rate: ${summary.successRate}%`);
  
  console.log('\n📋 Service Status:');
  for (const [service, data] of Object.entries(summary.services)) {
    const statusIcon = data.status === 'healthy' ? '✅' : data.status === 'degraded' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${service}: ${data.status.toUpperCase()} (${data.responseTime || 0}ms)`);
  }
  
  if (summary.recentAlerts.length > 0) {
    console.log('\n🚨 Recent Alerts:');
    for (const alert of summary.recentAlerts) {
      console.log(`[${alert.level}] ${alert.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  return summary;
}

// Export monitoring functions
export {
  healthMetrics,
  performComprehensiveHealthCheck,
  healthCheckEndpoint,
  startMonitoring,
  generateMonitoringReport,
  checkDatabaseHealth,
  checkOpenAIHealth,
  checkFileUploadHealth,
  checkServerHealth
};

// Run health check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const results = await performComprehensiveHealthCheck();
      const report = generateMonitoringReport();
      
      // Save report
      const fs = await import('fs/promises');
      const reportPath = join(__dirname, `../devops/health-report-${Date.now()}.json`);
      await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
      console.log(`\n📄 Health report saved to: ${reportPath}`);
      
      process.exit(results.overall === 'unhealthy' ? 1 : 0);
    } catch (error) {
      console.error('❌ Health monitoring failed:', error);
      process.exit(1);
    }
  })();
}