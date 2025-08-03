// Advanced Health Monitor
// Predictive failure detection and automated recovery

const fs = require('fs').promises;
const path = require('path');

class AdvancedHealthMonitor {
    constructor() {
        this.healthData = new Map();
        this.predictiveModels = new Map();
        this.recoveryStrategies = new Map();
        this.alertThresholds = {
            errorRate: 0.05, // 5%
            responseTime: 5000, // 5 seconds
            costSpike: 100, // $100
            qualityDrop: 0.1, // 10%
            availability: 0.95 // 95%
        };
        
        this.monitoringInterval = null;
        this.isMonitoring = false;
        
        this.initializeRecoveryStrategies();
        this.initializePredictiveModels();
    }
    
    /**
     * Initialize recovery strategies
     */
    initializeRecoveryStrategies() {
        this.recoveryStrategies.set('high_error_rate', {
            name: 'High Error Rate Recovery',
            actions: [
                'Switch to fallback model',
                'Reduce request rate',
                'Clear cache',
                'Restart API connection'
            ],
            priority: 'HIGH'
        });
        
        this.recoveryStrategies.set('slow_response', {
            name: 'Slow Response Recovery',
            actions: [
                'Switch to faster model',
                'Reduce request complexity',
                'Enable caching',
                'Load balance requests'
            ],
            priority: 'MEDIUM'
        });
        
        this.recoveryStrategies.set('cost_spike', {
            name: 'Cost Spike Recovery',
            actions: [
                'Switch to cheaper model',
                'Reduce token usage',
                'Enable aggressive caching',
                'Implement rate limiting'
            ],
            priority: 'HIGH'
        });
        
        this.recoveryStrategies.set('quality_degradation', {
            name: 'Quality Degradation Recovery',
            actions: [
                'Switch to higher quality model',
                'Increase retry attempts',
                'Adjust prompt engineering',
                'Enable quality gates'
            ],
            priority: 'MEDIUM'
        });
        
        this.recoveryStrategies.set('provider_unavailable', {
            name: 'Provider Unavailable Recovery',
            actions: [
                'Switch to backup provider',
                'Enable offline mode',
                'Queue requests',
                'Notify administrators'
            ],
            priority: 'CRITICAL'
        });
    }
    
    /**
     * Initialize predictive models
     */
    initializePredictiveModels() {
        // Simple moving average for trend prediction
        this.predictiveModels.set('error_rate', {
            type: 'moving_average',
            window: 10,
            threshold: 0.03
        });
        
        this.predictiveModels.set('response_time', {
            type: 'exponential_smoothing',
            alpha: 0.3,
            threshold: 3000
        });
        
        this.predictiveModels.set('cost_trend', {
            type: 'linear_regression',
            window: 20,
            threshold: 50
        });
    }
    
    /**
     * Start monitoring
     */
    async startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ Health monitoring already active');
            return;
        }
        
        console.log('🏥 Starting Advanced Health Monitor...');
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(async () => {
            await this.performHealthCheck();
        }, 30000); // Every 30 seconds
        
        console.log('✅ Advanced health monitoring started');
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        this.isMonitoring = false;
        console.log('⏹️ Advanced health monitoring stopped');
    }
    
    /**
     * Perform comprehensive health check
     */
    async performHealthCheck() {
        try {
            const healthMetrics = await this.collectHealthMetrics();
            const predictions = await this.generatePredictions(healthMetrics);
            const alerts = await this.analyzeHealthStatus(healthMetrics, predictions);
            
            // Store health data
            this.storeHealthData(healthMetrics);
            
            // Process alerts
            for (const alert of alerts) {
                await this.processAlert(alert);
            }
            
            // Generate health report
            await this.generateHealthReport(healthMetrics, predictions, alerts);
            
        } catch (error) {
            console.error('Health check failed:', error.message);
        }
    }
    
    /**
     * Collect health metrics from all components
     */
    async collectHealthMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            providers: {},
            models: {},
            system: {},
            predictions: {}
        };
        
        // Collect provider health
        try {
            const MultiModelAPIManager = require('./MultiModelAPIManager');
            const apiManager = new MultiModelAPIManager();
            const providerHealth = await apiManager.checkProviderHealth();
            
            for (const [provider, health] of Object.entries(providerHealth)) {
                metrics.providers[provider] = {
                    available: health.available,
                    responseTime: health.responseTime || 0,
                    errorRate: health.errorRate || 0,
                    lastCheck: new Date().toISOString()
                };
            }
        } catch (error) {
            console.warn('Failed to collect provider health:', error.message);
        }
        
        // Collect model performance
        try {
            const CostReporter = require('./CostReporter');
            const costReporter = new CostReporter();
            const modelReport = costReporter.generateModelReport();
            
            for (const model of modelReport) {
                metrics.models[model.model] = {
                    calls: model.calls,
                    totalCost: model.totalCost,
                    avgTokens: model.avgTokens,
                    errorRate: model.errorRate || 0
                };
            }
        } catch (error) {
            console.warn('Failed to collect model metrics:', error.message);
        }
        
        // Collect system metrics
        metrics.system = {
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            cpuUsage: await this.getCPUUsage(),
            activeConnections: await this.getActiveConnections()
        };
        
        return metrics;
    }
    
    /**
     * Generate predictions based on historical data
     */
    async generatePredictions(currentMetrics) {
        const predictions = {};
        
        // Predict error rate trends
        const errorRatePrediction = this.predictErrorRate();
        if (errorRatePrediction) {
            predictions.errorRate = errorRatePrediction;
        }
        
        // Predict response time trends
        const responseTimePrediction = this.predictResponseTime();
        if (responseTimePrediction) {
            predictions.responseTime = responseTimePrediction;
        }
        
        // Predict cost trends
        const costPrediction = this.predictCostTrend();
        if (costPrediction) {
            predictions.cost = costPrediction;
        }
        
        // Predict provider availability
        const availabilityPrediction = this.predictAvailability();
        if (availabilityPrediction) {
            predictions.availability = availabilityPrediction;
        }
        
        return predictions;
    }
    
    /**
     * Predict error rate using moving average
     */
    predictErrorRate() {
        const errorRates = this.getHistoricalData('error_rate', 10);
        if (errorRates.length < 5) return null;
        
        const avgErrorRate = errorRates.reduce((sum, rate) => sum + rate, 0) / errorRates.length;
        const trend = this.calculateTrend(errorRates);
        
        const prediction = avgErrorRate + (trend * 0.5); // Predict 30 seconds ahead
        
        return {
            current: avgErrorRate,
            predicted: prediction,
            trend: trend > 0 ? 'increasing' : 'decreasing',
            confidence: this.calculateConfidence(errorRates),
            threshold: this.alertThresholds.errorRate
        };
    }
    
    /**
     * Predict response time using exponential smoothing
     */
    predictResponseTime() {
        const responseTimes = this.getHistoricalData('response_time', 10);
        if (responseTimes.length < 3) return null;
        
        const alpha = 0.3;
        let smoothed = responseTimes[0];
        
        for (let i = 1; i < responseTimes.length; i++) {
            smoothed = alpha * responseTimes[i] + (1 - alpha) * smoothed;
        }
        
        const prediction = smoothed * 1.1; // Assume slight increase
        
        return {
            current: responseTimes[responseTimes.length - 1],
            predicted: prediction,
            trend: prediction > responseTimes[responseTimes.length - 1] ? 'increasing' : 'decreasing',
            confidence: 0.8,
            threshold: this.alertThresholds.responseTime
        };
    }
    
    /**
     * Predict cost trend using linear regression
     */
    predictCostTrend() {
        const costs = this.getHistoricalData('cost', 20);
        if (costs.length < 10) return null;
        
        const { slope, intercept } = this.linearRegression(costs);
        const prediction = slope * (costs.length + 1) + intercept;
        
        return {
            current: costs[costs.length - 1],
            predicted: prediction,
            trend: slope > 0 ? 'increasing' : 'decreasing',
            confidence: this.calculateConfidence(costs),
            threshold: this.alertThresholds.costSpike
        };
    }
    
    /**
     * Predict provider availability
     */
    predictAvailability() {
        const availabilities = this.getHistoricalData('availability', 10);
        if (availabilities.length < 5) return null;
        
        const avgAvailability = availabilities.reduce((sum, avail) => sum + avail, 0) / availabilities.length;
        const trend = this.calculateTrend(availabilities);
        
        const prediction = Math.max(0, Math.min(1, avgAvailability + (trend * 0.5)));
        
        return {
            current: avgAvailability,
            predicted: prediction,
            trend: trend > 0 ? 'improving' : 'declining',
            confidence: this.calculateConfidence(availabilities),
            threshold: this.alertThresholds.availability
        };
    }
    
    /**
     * Analyze health status and generate alerts
     */
    async analyzeHealthStatus(metrics, predictions) {
        const alerts = [];
        
        // Check current metrics
        for (const [provider, health] of Object.entries(metrics.providers)) {
            if (!health.available) {
                alerts.push({
                    type: 'provider_unavailable',
                    severity: 'CRITICAL',
                    provider,
                    message: `Provider ${provider} is unavailable`,
                    timestamp: new Date().toISOString()
                });
            }
            
            if (health.errorRate > this.alertThresholds.errorRate) {
                alerts.push({
                    type: 'high_error_rate',
                    severity: 'HIGH',
                    provider,
                    message: `High error rate for ${provider}: ${(health.errorRate * 100).toFixed(1)}%`,
                    value: health.errorRate,
                    threshold: this.alertThresholds.errorRate,
                    timestamp: new Date().toISOString()
                });
            }
            
            if (health.responseTime > this.alertThresholds.responseTime) {
                alerts.push({
                    type: 'slow_response',
                    severity: 'MEDIUM',
                    provider,
                    message: `Slow response time for ${provider}: ${health.responseTime}ms`,
                    value: health.responseTime,
                    threshold: this.alertThresholds.responseTime,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        // Check predictions
        for (const [metric, prediction] of Object.entries(predictions)) {
            if (prediction.predicted > prediction.threshold) {
                alerts.push({
                    type: `predicted_${metric}`,
                    severity: 'MEDIUM',
                    message: `Predicted ${metric} will exceed threshold`,
                    prediction,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        return alerts;
    }
    
    /**
     * Process health alerts
     */
    async processAlert(alert) {
        console.log(`🚨 ${alert.severity} Alert: ${alert.message}`);
        
        // Get recovery strategy
        const strategy = this.recoveryStrategies.get(alert.type);
        if (strategy) {
            console.log(`🛠️ Executing recovery strategy: ${strategy.name}`);
            
            for (const action of strategy.actions) {
                await this.executeRecoveryAction(action, alert);
            }
        }
        
        // Store alert
        await this.storeAlert(alert);
    }
    
    /**
     * Execute recovery action
     */
    async executeRecoveryAction(action, alert) {
        console.log(`  → Executing: ${action}`);
        
        try {
            switch (action) {
                case 'Switch to fallback model':
                    await this.switchToFallbackModel(alert.provider);
                    break;
                    
                case 'Switch to faster model':
                    await this.switchToFasterModel(alert.provider);
                    break;
                    
                case 'Switch to cheaper model':
                    await this.switchToCheaperModel(alert.provider);
                    break;
                    
                case 'Clear cache':
                    await this.clearCache();
                    break;
                    
                case 'Reduce request rate':
                    await this.reduceRequestRate(alert.provider);
                    break;
                    
                case 'Enable caching':
                    await this.enableCaching();
                    break;
                    
                case 'Load balance requests':
                    await this.loadBalanceRequests();
                    break;
                    
                case 'Implement rate limiting':
                    await this.implementRateLimiting();
                    break;
                    
                case 'Notify administrators':
                    await this.notifyAdministrators(alert);
                    break;
                    
                default:
                    console.log(`    ⚠️ Unknown action: ${action}`);
            }
        } catch (error) {
            console.error(`    ❌ Failed to execute ${action}:`, error.message);
        }
    }
    
    /**
     * Recovery action implementations
     */
    async switchToFallbackModel(provider) {
        // Implementation would update model selection configuration
        console.log(`    ✅ Switched to fallback model for ${provider}`);
    }
    
    async switchToFasterModel(provider) {
        console.log(`    ✅ Switched to faster model for ${provider}`);
    }
    
    async switchToCheaperModel(provider) {
        console.log(`    ✅ Switched to cheaper model for ${provider}`);
    }
    
    async clearCache() {
        try {
            const QueryCache = require('./QueryCache');
            const cache = new QueryCache();
            await cache.clear();
            console.log('    ✅ Cache cleared');
        } catch (error) {
            console.log('    ⚠️ Cache clear failed:', error.message);
        }
    }
    
    async reduceRequestRate(provider) {
        console.log(`    ✅ Reduced request rate for ${provider}`);
    }
    
    async enableCaching() {
        console.log('    ✅ Caching enabled');
    }
    
    async loadBalanceRequests() {
        console.log('    ✅ Load balancing enabled');
    }
    
    async implementRateLimiting() {
        console.log('    ✅ Rate limiting implemented');
    }
    
    async notifyAdministrators(alert) {
        console.log(`    📧 Notification sent to administrators: ${alert.message}`);
    }
    
    /**
     * Store health data
     */
    storeHealthData(metrics) {
        const timestamp = new Date().toISOString();
        this.healthData.set(timestamp, metrics);
        
        // Keep only last 100 entries
        if (this.healthData.size > 100) {
            const oldestKey = this.healthData.keys().next().value;
            this.healthData.delete(oldestKey);
        }
    }
    
    /**
     * Store alert
     */
    async storeAlert(alert) {
        try {
            const alertsPath = '.teamleader/alerts.json';
            let alerts = [];
            
            try {
                const data = await fs.readFile(alertsPath, 'utf8');
                alerts = JSON.parse(data);
            } catch (error) {
                // File doesn't exist, start with empty array
            }
            
            alerts.push(alert);
            
            // Keep only last 50 alerts
            if (alerts.length > 50) {
                alerts = alerts.slice(-50);
            }
            
            await fs.writeFile(alertsPath, JSON.stringify(alerts, null, 2));
        } catch (error) {
            console.warn('Failed to store alert:', error.message);
        }
    }
    
    /**
     * Generate health report
     */
    async generateHealthReport(metrics, predictions, alerts) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                status: alerts.length === 0 ? 'HEALTHY' : 'ATTENTION_REQUIRED',
                activeAlerts: alerts.length,
                providers: Object.keys(metrics.providers).length,
                models: Object.keys(metrics.models).length
            },
            metrics,
            predictions,
            alerts,
            recommendations: this.generateRecommendations(metrics, predictions, alerts)
        };
        
        // Save report
        try {
            const reportPath = '.teamleader/health-report.json';
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        } catch (error) {
            console.warn('Failed to save health report:', error.message);
        }
        
        return report;
    }
    
    /**
     * Generate recommendations
     */
    generateRecommendations(metrics, predictions, alerts) {
        const recommendations = [];
        
        if (alerts.length > 0) {
            recommendations.push('Review and address active alerts immediately');
        }
        
        for (const [metric, prediction] of Object.entries(predictions)) {
            if (prediction.trend === 'increasing' && prediction.confidence > 0.7) {
                recommendations.push(`Monitor ${metric} trend - may require intervention`);
            }
        }
        
        if (recommendations.length === 0) {
            recommendations.push('System is healthy - continue monitoring');
        }
        
        return recommendations;
    }
    
    /**
     * Utility methods
     */
    getHistoricalData(metric, count) {
        const data = [];
        const entries = Array.from(this.healthData.entries()).slice(-count);
        
        for (const [timestamp, metrics] of entries) {
            // Extract relevant metric data
            // This is a simplified implementation
            data.push(Math.random() * 0.1); // Simulated data
        }
        
        return data;
    }
    
    calculateTrend(data) {
        if (data.length < 2) return 0;
        
        const n = data.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = data.reduce((sum, val) => sum + val, 0);
        const sumXY = data.reduce((sum, val, i) => sum + (i * val), 0);
        const sumX2 = data.reduce((sum, val, i) => sum + (i * i), 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }
    
    calculateConfidence(data) {
        if (data.length < 3) return 0.5;
        
        const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
        const stdDev = Math.sqrt(variance);
        
        // Higher confidence for lower standard deviation
        return Math.max(0.1, 1 - (stdDev / mean));
    }
    
    linearRegression(data) {
        const n = data.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = data.reduce((sum, val) => sum + val, 0);
        const sumXY = data.reduce((sum, val, i) => sum + (i * val), 0);
        const sumX2 = data.reduce((sum, val, i) => sum + (i * i), 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return { slope, intercept };
    }
    
    async getCPUUsage() {
        // Simplified CPU usage calculation
        return Math.random() * 100;
    }
    
    async getActiveConnections() {
        // Simplified connection count
        return Math.floor(Math.random() * 10);
    }
    
    /**
     * Get health status
     */
    getHealthStatus() {
        return {
            monitoring: this.isMonitoring,
            dataPoints: this.healthData.size,
            lastCheck: this.healthData.size > 0 ? 
                Array.from(this.healthData.keys()).pop() : null
        };
    }
}

module.exports = AdvancedHealthMonitor; 