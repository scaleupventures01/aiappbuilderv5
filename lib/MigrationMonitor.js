// Migration Monitor
// Real-time migration tracking, quality assurance, and automated alerting

const CostReporter = require('./CostReporter');
const ModelSelector = require('./ModelSelectorIntegration');

class MigrationMonitor {
    constructor() {
        this.costReporter = new CostReporter();
        this.modelSelector = new ModelSelector();
        this.monitoringActive = false;
        this.alertThresholds = {
            costSpike: 50, // $50 increase
            fallbackRate: 20, // 20% fallback usage
            errorRate: 5, // 5% error rate
            qualityDrop: 0.1 // 10% quality drop
        };
        
        this.metrics = {
            baseline: null,
            current: null,
            history: []
        };
        
        this.alerts = [];
        this.callbacks = {
            onAlert: null,
            onPhaseComplete: null,
            onRollback: null
        };
    }
    
    /**
     * Start monitoring
     */
    async startMonitoring() {
        console.log('📊 Starting Migration Monitor...\n');
        
        this.monitoringActive = true;
        
        // Establish baseline if not exists
        if (!this.metrics.baseline) {
            await this.establishBaseline();
        }
        
        // Start monitoring intervals
        this.startMetricsCollection();
        this.startHealthChecks();
        this.startQualityMonitoring();
        
        console.log('✅ Migration monitoring started');
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        console.log('⏹️ Stopping Migration Monitor...\n');
        
        this.monitoringActive = false;
        
        // Clear intervals
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
        if (this.healthInterval) {
            clearInterval(this.healthInterval);
        }
        if (this.qualityInterval) {
            clearInterval(this.qualityInterval);
        }
        
        console.log('✅ Migration monitoring stopped');
    }
    
    /**
     * Establish baseline metrics
     */
    async establishBaseline() {
        console.log('📊 Establishing Baseline Metrics...\n');
        
        const baseline = {
            cost: await this.getCurrentCost(),
            fallbackRate: await this.getFallbackRate(),
            errorRate: await this.getErrorRate(),
            quality: await this.getQualityScore(),
            modelUsage: await this.getModelUsage(),
            timestamp: new Date().toISOString()
        };
        
        this.metrics.baseline = baseline;
        
        console.log('Baseline established:');
        console.log(`  Cost: $${baseline.cost}`);
        console.log(`  Fallback Rate: ${baseline.fallbackRate}%`);
        console.log(`  Error Rate: ${baseline.errorRate}%`);
        console.log(`  Quality Score: ${baseline.quality}`);
        
        return baseline;
    }
    
    /**
     * Start metrics collection
     */
    startMetricsCollection() {
        this.metricsInterval = setInterval(async () => {
            if (!this.monitoringActive) return;
            
            const current = {
                cost: await this.getCurrentCost(),
                fallbackRate: await this.getFallbackRate(),
                errorRate: await this.getErrorRate(),
                quality: await this.getQualityScore(),
                modelUsage: await this.getModelUsage(),
                timestamp: new Date().toISOString()
            };
            
            this.metrics.current = current;
            this.metrics.history.push(current);
            
            // Keep only last 100 entries
            if (this.metrics.history.length > 100) {
                this.metrics.history.shift();
            }
            
            // Check for alerts
            await this.checkAlerts();
            
        }, 60000); // Every minute
    }
    
    /**
     * Start health checks
     */
    startHealthChecks() {
        this.healthInterval = setInterval(async () => {
            if (!this.monitoringActive) return;
            
            await this.performHealthCheck();
            
        }, 300000); // Every 5 minutes
    }
    
    /**
     * Start quality monitoring
     */
    startQualityMonitoring() {
        this.qualityInterval = setInterval(async () => {
            if (!this.monitoringActive) return;
            
            await this.performQualityCheck();
            
        }, 180000); // Every 3 minutes
    }
    
    /**
     * Get current cost
     */
    async getCurrentCost() {
        try {
            const summary = this.costReporter.generateSummary();
            return parseFloat(summary.totalCost);
        } catch (error) {
            console.warn('Failed to get current cost:', error.message);
            return 0;
        }
    }
    
    /**
     * Get fallback rate
     */
    async getFallbackRate() {
        try {
            const metrics = this.costReporter.generateOptimizationMetrics();
            return parseFloat(metrics.fallbackUsage.percentage);
        } catch (error) {
            console.warn('Failed to get fallback rate:', error.message);
            return 0;
        }
    }
    
    /**
     * Get error rate
     */
    async getErrorRate() {
        // In a real implementation, this would track actual errors
        // For now, return a simulated value
        return Math.random() * 3; // 0-3%
    }
    
    /**
     * Get quality score
     */
    async getQualityScore() {
        // In a real implementation, this would measure output quality
        // For now, return a simulated value
        return Math.random() * 0.2 + 0.8; // 80-100%
    }
    
    /**
     * Get model usage
     */
    async getModelUsage() {
        try {
            const modelReport = this.costReporter.generateModelReport();
            return modelReport.reduce((acc, model) => {
                acc[model.model] = model.calls;
                return acc;
            }, {});
        } catch (error) {
            console.warn('Failed to get model usage:', error.message);
            return {};
        }
    }
    
    /**
     * Check for alerts
     */
    async checkAlerts() {
        if (!this.metrics.baseline || !this.metrics.current) return;
        
        const baseline = this.metrics.baseline;
        const current = this.metrics.current;
        
        const alerts = [];
        
        // Check cost spike
        const costIncrease = current.cost - baseline.cost;
        if (costIncrease > this.alertThresholds.costSpike) {
            alerts.push({
                type: 'COST_SPIKE',
                severity: 'HIGH',
                message: `Cost increased by $${costIncrease.toFixed(2)}`,
                details: {
                    baseline: baseline.cost,
                    current: current.cost,
                    increase: costIncrease
                }
            });
        }
        
        // Check fallback rate
        if (current.fallbackRate > this.alertThresholds.fallbackRate) {
            alerts.push({
                type: 'HIGH_FALLBACK_RATE',
                severity: 'MEDIUM',
                message: `Fallback rate is ${current.fallbackRate}%`,
                details: {
                    threshold: this.alertThresholds.fallbackRate,
                    current: current.fallbackRate
                }
            });
        }
        
        // Check error rate
        if (current.errorRate > this.alertThresholds.errorRate) {
            alerts.push({
                type: 'HIGH_ERROR_RATE',
                severity: 'HIGH',
                message: `Error rate is ${current.errorRate}%`,
                details: {
                    threshold: this.alertThresholds.errorRate,
                    current: current.errorRate
                }
            });
        }
        
        // Check quality drop
        const qualityDrop = baseline.quality - current.quality;
        if (qualityDrop > this.alertThresholds.qualityDrop) {
            alerts.push({
                type: 'QUALITY_DROP',
                severity: 'MEDIUM',
                message: `Quality dropped by ${(qualityDrop * 100).toFixed(1)}%`,
                details: {
                    baseline: baseline.quality,
                    current: current.quality,
                    drop: qualityDrop
                }
            });
        }
        
        // Process alerts
        for (const alert of alerts) {
            await this.processAlert(alert);
        }
    }
    
    /**
     * Process an alert
     */
    async processAlert(alert) {
        // Add to alerts list
        this.alerts.push({
            ...alert,
            timestamp: new Date().toISOString(),
            acknowledged: false
        });
        
        // Log alert
        console.log(`🚨 ${alert.severity} Alert: ${alert.message}`);
        
        // Call callback if set
        if (this.callbacks.onAlert) {
            await this.callbacks.onAlert(alert);
        }
        
        // Take automatic action for high severity alerts
        if (alert.severity === 'HIGH') {
            await this.handleHighSeverityAlert(alert);
        }
    }
    
    /**
     * Handle high severity alerts
     */
    async handleHighSeverityAlert(alert) {
        console.log(`🛡️ Handling high severity alert: ${alert.type}`);
        
        switch (alert.type) {
            case 'COST_SPIKE':
                await this.handleCostSpike(alert);
                break;
            case 'HIGH_ERROR_RATE':
                await this.handleHighErrorRate(alert);
                break;
            default:
                console.log(`No automatic handler for alert type: ${alert.type}`);
        }
    }
    
    /**
     * Handle cost spike
     */
    async handleCostSpike(alert) {
        console.log('💰 Handling cost spike...');
        
        // Check if we should trigger rollback
        const costIncrease = alert.details.increase;
        if (costIncrease > 100) { // $100 threshold
            console.log('🔄 Cost spike exceeds threshold, triggering rollback');
            
            if (this.callbacks.onRollback) {
                await this.callbacks.onRollback('cost_spike', alert);
            }
        } else {
            console.log('📊 Cost spike within acceptable range, monitoring continues');
        }
    }
    
    /**
     * Handle high error rate
     */
    async handleHighErrorRate(alert) {
        console.log('❌ Handling high error rate...');
        
        // Check if we should trigger rollback
        const errorRate = alert.details.current;
        if (errorRate > 10) { // 10% threshold
            console.log('🔄 Error rate exceeds threshold, triggering rollback');
            
            if (this.callbacks.onRollback) {
                await this.callbacks.onRollback('high_error_rate', alert);
            }
        } else {
            console.log('⚠️ Error rate elevated but within acceptable range');
        }
    }
    
    /**
     * Perform health check
     */
    async performHealthCheck() {
        console.log('🏥 Performing health check...');
        
        try {
            // Check provider health
            const MultiModelAPIManager = require('./MultiModelAPIManager');
            const apiManager = new MultiModelAPIManager();
            const health = await apiManager.checkProviderHealth();
            
            // Check for unhealthy providers
            const unhealthyProviders = Object.entries(health).filter(
                ([_, status]) => !status.available
            );
            
            if (unhealthyProviders.length > 0) {
                console.log('⚠️ Unhealthy providers detected:');
                unhealthyProviders.forEach(([provider, status]) => {
                    console.log(`  - ${provider}: ${status.available ? 'Healthy' : 'Unhealthy'}`);
                });
            } else {
                console.log('✅ All providers healthy');
            }
            
        } catch (error) {
            console.error('Health check failed:', error.message);
        }
    }
    
    /**
     * Perform quality check
     */
    async performQualityCheck() {
        console.log('🎯 Performing quality check...');
        
        try {
            // In a real implementation, this would:
            // 1. Sample recent outputs
            // 2. Compare with baseline quality
            // 3. Check for degradation patterns
            
            const currentQuality = await this.getQualityScore();
            const baselineQuality = this.metrics.baseline?.quality || 0.95;
            
            const qualityDrop = baselineQuality - currentQuality;
            
            if (qualityDrop > 0.05) { // 5% drop
                console.log(`⚠️ Quality degradation detected: ${(qualityDrop * 100).toFixed(1)}% drop`);
            } else {
                console.log('✅ Quality maintained');
            }
            
        } catch (error) {
            console.error('Quality check failed:', error.message);
        }
    }
    
    /**
     * Get migration status
     */
    getStatus() {
        return {
            monitoring: this.monitoringActive,
            baseline: this.metrics.baseline,
            current: this.metrics.current,
            alerts: this.alerts.filter(a => !a.acknowledged),
            history: this.metrics.history.length
        };
    }
    
    /**
     * Get migration metrics
     */
    getMetrics() {
        return this.metrics;
    }
    
    /**
     * Get alerts
     */
    getAlerts() {
        return this.alerts;
    }
    
    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.timestamp === alertId);
        if (alert) {
            alert.acknowledged = true;
            console.log(`✅ Alert acknowledged: ${alert.message}`);
        }
    }
    
    /**
     * Set alert callback
     */
    onAlert(callback) {
        this.callbacks.onAlert = callback;
    }
    
    /**
     * Set phase complete callback
     */
    onPhaseComplete(callback) {
        this.callbacks.onPhaseComplete = callback;
    }
    
    /**
     * Set rollback callback
     */
    onRollback(callback) {
        this.callbacks.onRollback = callback;
    }
    
    /**
     * Generate monitoring report
     */
    generateReport() {
        if (!this.metrics.baseline || !this.metrics.current) {
            return 'No baseline or current metrics available';
        }
        
        const baseline = this.metrics.baseline;
        const current = this.metrics.current;
        
        const costChange = ((current.cost - baseline.cost) / baseline.cost * 100).toFixed(1);
        const fallbackChange = (current.fallbackRate - baseline.fallbackRate).toFixed(1);
        const qualityChange = ((current.quality - baseline.quality) / baseline.quality * 100).toFixed(1);
        
        return `
# 📊 Migration Monitoring Report

## 📈 Metrics Comparison

| Metric | Baseline | Current | Change |
|--------|----------|---------|--------|
| Cost | $${baseline.cost} | $${current.cost} | ${costChange}% |
| Fallback Rate | ${baseline.fallbackRate}% | ${current.fallbackRate}% | ${fallbackChange}% |
| Error Rate | ${baseline.errorRate}% | ${current.errorRate}% | ${(current.errorRate - baseline.errorRate).toFixed(1)}% |
| Quality | ${(baseline.quality * 100).toFixed(1)}% | ${(current.quality * 100).toFixed(1)}% | ${qualityChange}% |

## 🚨 Active Alerts

${this.alerts.filter(a => !a.acknowledged).map(alert => 
`- **${alert.severity}**: ${alert.message} (${new Date(alert.timestamp).toLocaleString()})`
).join('\n')}

## 📊 Monitoring Status

- **Active**: ${this.monitoringActive ? 'Yes' : 'No'}
- **History Points**: ${this.metrics.history.length}
- **Last Update**: ${current.timestamp}

## 🎯 Recommendations

${this.generateRecommendations()}
        `;
    }
    
    /**
     * Generate recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.metrics.current && this.metrics.baseline) {
            const current = this.metrics.current;
            const baseline = this.metrics.baseline;
            
            if (current.fallbackRate > 15) {
                recommendations.push('Review API key configuration and rate limits');
            }
            
            if (current.cost > baseline.cost * 1.5) {
                recommendations.push('Investigate cost increase and optimize model usage');
            }
            
            if (current.quality < baseline.quality * 0.9) {
                recommendations.push('Check model performance and consider adjustments');
            }
        }
        
        if (recommendations.length === 0) {
            recommendations.push('All metrics within acceptable ranges');
        }
        
        return recommendations.map(rec => `- ${rec}`).join('\n');
    }
}

module.exports = MigrationMonitor; 