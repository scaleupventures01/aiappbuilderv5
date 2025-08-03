/**
 * PerformanceBenchmarkingDashboard.js
 * Real-time performance metrics visualization and benchmarking system
 * Provides comprehensive performance analysis, model comparison, and trend tracking
 */

const fs = require('fs').promises;
const path = require('path');

class PerformanceBenchmarkingDashboard {
    constructor(projectName = 'default-project') {
        this.projectName = projectName;
        this.projectPath = projectName;
        this.metricsPath = path.join(this.projectPath, 'metrics');
        this.benchmarksPath = path.join(this.projectPath, 'benchmarks');
        
        // Performance metrics storage
        this.metrics = {
            responseTimes: new Map(),
            tokenUsage: new Map(),
            costMetrics: new Map(),
            accuracyMetrics: new Map(),
            throughputMetrics: new Map(),
            errorRates: new Map()
        };
        
        // Benchmark configurations
        this.benchmarks = new Map();
        this.activeBenchmarks = new Set();
        
        // Real-time monitoring
        this.monitoringInterval = null;
        this.updateInterval = 5000; // 5 seconds
        
        // Performance thresholds
        this.thresholds = {
            responseTime: { warning: 2000, critical: 5000 },
            costPerToken: { warning: 0.002, critical: 0.005 },
            errorRate: { warning: 0.05, critical: 0.1 },
            throughput: { warning: 10, critical: 5 }
        };
        
        // Chart configurations
        this.chartConfigs = {
            responseTime: { type: 'line', color: '#4CAF50' },
            cost: { type: 'bar', color: '#FF9800' },
            accuracy: { type: 'line', color: '#2196F3' },
            throughput: { type: 'area', color: '#9C27B0' }
        };
        
        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.startMonitoring = this.startMonitoring.bind(this);
        this.stopMonitoring = this.stopMonitoring.bind(this);
        this.recordMetric = this.recordMetric.bind(this);
        this.getPerformanceReport = this.getPerformanceReport.bind(this);
        this.generateCharts = this.generateCharts.bind(this);
        this.compareModels = this.compareModels.bind(this);
        this.analyzeTrends = this.analyzeTrends.bind(this);
        this.setThresholds = this.setThresholds.bind(this);
        this.createBenchmark = this.createBenchmark.bind(this);
        this.runBenchmark = this.runBenchmark.bind(this);
        this.exportMetrics = this.exportMetrics.bind(this);
    }
    
    /**
     * Initialize the performance benchmarking dashboard
     */
    async initialize() {
        try {
            console.log('📊 Initializing Performance Benchmarking Dashboard...');
            
            // Create metrics directory structure
            await this.createMetricsStructure();
            
            // Load existing metrics and benchmarks
            await this.loadExistingData();
            
            // Initialize real-time monitoring
            await this.startMonitoring();
            
            console.log('✅ Performance Benchmarking Dashboard initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Performance Benchmarking Dashboard:', error);
            return false;
        }
    }
    
    /**
     * Create metrics directory structure
     */
    async createMetricsStructure() {
        const directories = [
            this.metricsPath,
            this.benchmarksPath,
            path.join(this.metricsPath, 'realtime'),
            path.join(this.metricsPath, 'historical'),
            path.join(this.metricsPath, 'charts'),
            path.join(this.benchmarksPath, 'configs'),
            path.join(this.benchmarksPath, 'results')
        ];
        
        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                // Directory might already exist
            }
        }
    }
    
    /**
     * Load existing metrics and benchmark data
     */
    async loadExistingData() {
        try {
            // Load historical metrics
            const historicalFiles = await fs.readdir(path.join(this.metricsPath, 'historical'));
            for (const file of historicalFiles) {
                if (file.endsWith('.json')) {
                    const data = await fs.readFile(path.join(this.metricsPath, 'historical', file), 'utf8');
                    const metrics = JSON.parse(data);
                    this.loadMetricsFromFile(metrics);
                }
            }
            
            // Load benchmark configurations
            const benchmarkFiles = await fs.readdir(path.join(this.benchmarksPath, 'configs'));
            for (const file of benchmarkFiles) {
                if (file.endsWith('.json')) {
                    const data = await fs.readFile(path.join(this.benchmarksPath, 'configs', file), 'utf8');
                    const benchmark = JSON.parse(data);
                    this.benchmarks.set(benchmark.id, benchmark);
                }
            }
            
            console.log(`📈 Loaded ${this.metrics.responseTimes.size} metric sets and ${this.benchmarks.size} benchmarks`);
        } catch (error) {
            console.log('📈 No existing metrics data found, starting fresh');
        }
    }
    
    /**
     * Start real-time performance monitoring
     */
    async startMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        this.monitoringInterval = setInterval(async () => {
            await this.updateRealTimeMetrics();
        }, this.updateInterval);
        
        console.log('🔄 Real-time performance monitoring started');
    }
    
    /**
     * Stop real-time performance monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('⏹️ Real-time performance monitoring stopped');
        }
    }
    
    /**
     * Record a performance metric
     */
    recordMetric(type, modelId, value, metadata = {}) {
        const timestamp = Date.now();
        const metricKey = `${modelId}_${type}`;
        
        if (!this.metrics[type]) {
            this.metrics[type] = new Map();
        }
        
        if (!this.metrics[type].has(metricKey)) {
            this.metrics[type].set(metricKey, []);
        }
        
        const metricData = {
            timestamp,
            value,
            modelId,
            ...metadata
        };
        
        this.metrics[type].get(metricKey).push(metricData);
        
        // Keep only last 1000 entries per metric
        if (this.metrics[type].get(metricKey).length > 1000) {
            this.metrics[type].set(metricKey, 
                this.metrics[type].get(metricKey).slice(-1000)
            );
        }
        
        // Check thresholds and trigger alerts
        this.checkThresholds(type, modelId, value);
        
        return metricData;
    }
    
    /**
     * Check performance thresholds and trigger alerts
     */
    checkThresholds(type, modelId, value) {
        const threshold = this.thresholds[type];
        if (!threshold) return;
        
        if (value >= threshold.critical) {
            this.triggerAlert('critical', type, modelId, value, threshold.critical);
        } else if (value >= threshold.warning) {
            this.triggerAlert('warning', type, modelId, value, threshold.warning);
        }
    }
    
    /**
     * Trigger performance alert
     */
    triggerAlert(level, type, modelId, value, threshold) {
        const alert = {
            level,
            type,
            modelId,
            value,
            threshold,
            timestamp: Date.now(),
            message: `${level.toUpperCase()}: ${type} for ${modelId} exceeded threshold (${value} > ${threshold})`
        };
        
        console.log(`🚨 ${alert.message}`);
        
        // Store alert
        this.storeAlert(alert);
    }
    
    /**
     * Store performance alert
     */
    async storeAlert(alert) {
        try {
            const alertsPath = path.join(this.metricsPath, 'alerts.json');
            let alerts = [];
            
            try {
                const data = await fs.readFile(alertsPath, 'utf8');
                alerts = JSON.parse(data);
            } catch (error) {
                // File doesn't exist, start with empty array
            }
            
            alerts.push(alert);
            
            // Keep only last 100 alerts
            if (alerts.length > 100) {
                alerts = alerts.slice(-100);
            }
            
            await fs.writeFile(alertsPath, JSON.stringify(alerts, null, 2));
        } catch (error) {
            console.error('Failed to store alert:', error);
        }
    }
    
    /**
     * Update real-time metrics
     */
    async updateRealTimeMetrics() {
        try {
            const realtimeData = {
                timestamp: Date.now(),
                metrics: {}
            };
            
            // Aggregate current metrics
            for (const [type, metricMap] of Object.entries(this.metrics)) {
                realtimeData.metrics[type] = {};
                
                for (const [key, values] of metricMap.entries()) {
                    if (values.length > 0) {
                        const recentValues = values.slice(-10); // Last 10 values
                        const avg = recentValues.reduce((sum, v) => sum + v.value, 0) / recentValues.length;
                        const min = Math.min(...recentValues.map(v => v.value));
                        const max = Math.max(...recentValues.map(v => v.value));
                        
                        realtimeData.metrics[type][key] = {
                            average: avg,
                            min,
                            max,
                            count: recentValues.length
                        };
                    }
                }
            }
            
            // Save real-time data
            const realtimePath = path.join(this.metricsPath, 'realtime', 'current.json');
            await fs.writeFile(realtimePath, JSON.stringify(realtimeData, null, 2));
            
        } catch (error) {
            console.error('Failed to update real-time metrics:', error);
        }
    }
    
    /**
     * Get comprehensive performance report
     */
    async getPerformanceReport(timeRange = '24h', models = null) {
        try {
            const report = {
                timestamp: Date.now(),
                timeRange,
                summary: {},
                details: {},
                recommendations: []
            };
            
            // Calculate time boundaries
            const now = Date.now();
            const timeRanges = {
                '1h': 60 * 60 * 1000,
                '6h': 6 * 60 * 60 * 1000,
                '24h': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000
            };
            
            const startTime = now - (timeRanges[timeRange] || timeRanges['24h']);
            
            // Generate summary statistics
            for (const [type, metricMap] of Object.entries(this.metrics)) {
                report.summary[type] = {};
                
                for (const [key, values] of metricMap.entries()) {
                    const modelId = key.split('_')[0];
                    
                    if (models && !models.includes(modelId)) continue;
                    
                    const filteredValues = values.filter(v => v.timestamp >= startTime);
                    
                    if (filteredValues.length > 0) {
                        const values_only = filteredValues.map(v => v.value);
                        const avg = values_only.reduce((sum, v) => sum + v, 0) / values_only.length;
                        const min = Math.min(...values_only);
                        const max = Math.max(...values_only);
                        const median = this.calculateMedian(values_only);
                        
                        report.summary[type][key] = {
                            average: avg,
                            min,
                            max,
                            median,
                            count: filteredValues.length,
                            trend: this.calculateTrend(filteredValues)
                        };
                    }
                }
            }
            
            // Generate detailed breakdown
            report.details = await this.generateDetailedBreakdown(startTime, models);
            
            // Generate recommendations
            report.recommendations = this.generateRecommendations(report.summary);
            
            return report;
        } catch (error) {
            console.error('Failed to generate performance report:', error);
            return null;
        }
    }
    
    /**
     * Generate detailed performance breakdown
     */
    async generateDetailedBreakdown(startTime, models) {
        const breakdown = {
            byModel: {},
            byTime: {},
            byMetric: {}
        };
        
        // Group by model
        for (const [type, metricMap] of Object.entries(this.metrics)) {
            for (const [key, values] of metricMap.entries()) {
                const modelId = key.split('_')[0];
                
                if (models && !models.includes(modelId)) continue;
                
                const filteredValues = values.filter(v => v.timestamp >= startTime);
                
                if (!breakdown.byModel[modelId]) {
                    breakdown.byModel[modelId] = {};
                }
                
                if (!breakdown.byModel[modelId][type]) {
                    breakdown.byModel[modelId][type] = [];
                }
                
                breakdown.byModel[modelId][type].push(...filteredValues);
            }
        }
        
        // Group by time intervals
        const intervals = this.createTimeIntervals(startTime, Date.now());
        for (const interval of intervals) {
            breakdown.byTime[interval.label] = {};
            
            for (const [type, metricMap] of Object.entries(this.metrics)) {
                breakdown.byTime[interval.label][type] = {};
                
                for (const [key, values] of metricMap.entries()) {
                    const modelId = key.split('_')[0];
                    const filteredValues = values.filter(v => 
                        v.timestamp >= interval.start && v.timestamp <= interval.end
                    );
                    
                    if (filteredValues.length > 0) {
                        breakdown.byTime[interval.label][type][modelId] = {
                            count: filteredValues.length,
                            average: filteredValues.reduce((sum, v) => sum + v.value, 0) / filteredValues.length
                        };
                    }
                }
            }
        }
        
        return breakdown;
    }
    
    /**
     * Generate performance recommendations
     */
    generateRecommendations(summary) {
        const recommendations = [];
        
        // Analyze response times
        if (summary.responseTimes) {
            for (const [key, data] of Object.entries(summary.responseTimes)) {
                if (data.average > this.thresholds.responseTime.warning) {
                    recommendations.push({
                        type: 'performance',
                        priority: data.average > this.thresholds.responseTime.critical ? 'high' : 'medium',
                        message: `Consider optimizing ${key} - average response time ${data.average}ms exceeds warning threshold`,
                        suggestion: 'Review model configuration or consider using a faster model'
                    });
                }
            }
        }
        
        // Analyze costs
        if (summary.costMetrics) {
            for (const [key, data] of Object.entries(summary.costMetrics)) {
                if (data.average > this.thresholds.costPerToken.warning) {
                    recommendations.push({
                        type: 'cost',
                        priority: data.average > this.thresholds.costPerToken.critical ? 'high' : 'medium',
                        message: `High cost detected for ${key} - average ${data.average} per token`,
                        suggestion: 'Consider using a more cost-effective model or optimizing prompts'
                    });
                }
            }
        }
        
        // Analyze error rates
        if (summary.errorRates) {
            for (const [key, data] of Object.entries(summary.errorRates)) {
                if (data.average > this.thresholds.errorRate.warning) {
                    recommendations.push({
                        type: 'reliability',
                        priority: data.average > this.thresholds.errorRate.critical ? 'high' : 'medium',
                        message: `High error rate for ${key} - ${(data.average * 100).toFixed(2)}%`,
                        suggestion: 'Investigate API issues or consider fallback models'
                    });
                }
            }
        }
        
        return recommendations;
    }
    
    /**
     * Generate performance charts
     */
    async generateCharts(chartType = 'all', timeRange = '24h') {
        try {
            const charts = {};
            
            if (chartType === 'all' || chartType === 'responseTime') {
                charts.responseTime = await this.generateResponseTimeChart(timeRange);
            }
            
            if (chartType === 'all' || chartType === 'cost') {
                charts.cost = await this.generateCostChart(timeRange);
            }
            
            if (chartType === 'all' || chartType === 'accuracy') {
                charts.accuracy = await this.generateAccuracyChart(timeRange);
            }
            
            if (chartType === 'all' || chartType === 'throughput') {
                charts.throughput = await this.generateThroughputChart(timeRange);
            }
            
            // Save charts
            const chartsPath = path.join(this.metricsPath, 'charts', `charts_${Date.now()}.json`);
            await fs.writeFile(chartsPath, JSON.stringify(charts, null, 2));
            
            return charts;
        } catch (error) {
            console.error('Failed to generate charts:', error);
            return null;
        }
    }
    
    /**
     * Generate response time chart data
     */
    async generateResponseTimeChart(timeRange) {
        const report = await this.getPerformanceReport(timeRange);
        const chartData = {
            type: 'line',
            title: 'Response Time Trends',
            labels: [],
            datasets: []
        };
        
        if (report && report.details.byTime) {
            const models = new Set();
            
            // Collect all models
            for (const timeData of Object.values(report.details.byTime)) {
                if (timeData.responseTimes) {
                    Object.keys(timeData.responseTimes).forEach(model => models.add(model));
                }
            }
            
            // Create datasets for each model
            for (const model of models) {
                const dataset = {
                    label: model,
                    data: [],
                    borderColor: this.getModelColor(model),
                    fill: false
                };
                
                for (const [timeLabel, timeData] of Object.entries(report.details.byTime)) {
                    if (timeData.responseTimes && timeData.responseTimes[model]) {
                        dataset.data.push(timeData.responseTimes[model].average);
                    } else {
                        dataset.data.push(null);
                    }
                }
                
                chartData.datasets.push(dataset);
            }
            
            chartData.labels = Object.keys(report.details.byTime);
        }
        
        return chartData;
    }
    
    /**
     * Generate cost chart data
     */
    async generateCostChart(timeRange) {
        const report = await this.getPerformanceReport(timeRange);
        const chartData = {
            type: 'bar',
            title: 'Cost Analysis',
            labels: [],
            datasets: []
        };
        
        if (report && report.summary.costMetrics) {
            const models = Object.keys(report.summary.costMetrics);
            chartData.labels = models;
            
            const dataset = {
                label: 'Average Cost per Token',
                data: models.map(model => {
                    const key = Object.keys(report.summary.costMetrics).find(k => k.startsWith(model));
                    return key ? report.summary.costMetrics[key].average : 0;
                }),
                backgroundColor: models.map(model => this.getModelColor(model))
            };
            
            chartData.datasets.push(dataset);
        }
        
        return chartData;
    }
    
    /**
     * Generate accuracy chart data
     */
    async generateAccuracyChart(timeRange) {
        const report = await this.getPerformanceReport(timeRange);
        const chartData = {
            type: 'line',
            title: 'Accuracy Trends',
            labels: [],
            datasets: []
        };
        
        if (report && report.details.byTime) {
            const models = new Set();
            
            // Collect all models
            for (const timeData of Object.values(report.details.byTime)) {
                if (timeData.accuracyMetrics) {
                    Object.keys(timeData.accuracyMetrics).forEach(model => models.add(model));
                }
            }
            
            // Create datasets for each model
            for (const model of models) {
                const dataset = {
                    label: model,
                    data: [],
                    borderColor: this.getModelColor(model),
                    fill: false
                };
                
                for (const [timeLabel, timeData] of Object.entries(report.details.byTime)) {
                    if (timeData.accuracyMetrics && timeData.accuracyMetrics[model]) {
                        dataset.data.push(timeData.accuracyMetrics[model].average);
                    } else {
                        dataset.data.push(null);
                    }
                }
                
                chartData.datasets.push(dataset);
            }
            
            chartData.labels = Object.keys(report.details.byTime);
        }
        
        return chartData;
    }
    
    /**
     * Generate throughput chart data
     */
    async generateThroughputChart(timeRange) {
        const report = await this.getPerformanceReport(timeRange);
        const chartData = {
            type: 'area',
            title: 'Throughput Analysis',
            labels: [],
            datasets: []
        };
        
        if (report && report.details.byTime) {
            const models = new Set();
            
            // Collect all models
            for (const timeData of Object.values(report.details.byTime)) {
                if (timeData.throughputMetrics) {
                    Object.keys(timeData.throughputMetrics).forEach(model => models.add(model));
                }
            }
            
            // Create datasets for each model
            for (const model of models) {
                const dataset = {
                    label: model,
                    data: [],
                    backgroundColor: this.getModelColor(model) + '40',
                    borderColor: this.getModelColor(model),
                    fill: true
                };
                
                for (const [timeLabel, timeData] of Object.entries(report.details.byTime)) {
                    if (timeData.throughputMetrics && timeData.throughputMetrics[model]) {
                        dataset.data.push(timeData.throughputMetrics[model].average);
                    } else {
                        dataset.data.push(0);
                    }
                }
                
                chartData.datasets.push(dataset);
            }
            
            chartData.labels = Object.keys(report.details.byTime);
        }
        
        return chartData;
    }
    
    /**
     * Compare models performance
     */
    async compareModels(models, metrics = ['responseTime', 'cost', 'accuracy', 'throughput']) {
        try {
            const comparison = {
                timestamp: Date.now(),
                models,
                metrics: {},
                rankings: {},
                recommendations: []
            };
            
            const report = await this.getPerformanceReport('24h', models);
            
            if (!report) return null;
            
            // Compare each metric
            for (const metric of metrics) {
                comparison.metrics[metric] = {};
                
                for (const model of models) {
                    const key = Object.keys(report.summary[metric] || {}).find(k => k.startsWith(model));
                    if (key) {
                        comparison.metrics[metric][model] = report.summary[metric][key];
                    }
                }
            }
            
            // Generate rankings
            for (const metric of metrics) {
                if (comparison.metrics[metric]) {
                    const sorted = Object.entries(comparison.metrics[metric])
                        .sort(([,a], [,b]) => {
                            // Lower is better for response time and cost
                            if (metric === 'responseTime' || metric === 'cost') {
                                return a.average - b.average;
                            }
                            // Higher is better for accuracy and throughput
                            return b.average - a.average;
                        });
                    
                    comparison.rankings[metric] = sorted.map(([model, data], index) => ({
                        rank: index + 1,
                        model,
                        value: data.average,
                        performance: this.getPerformanceLevel(data.average, metric)
                    }));
                }
            }
            
            // Generate recommendations
            comparison.recommendations = this.generateModelRecommendations(comparison);
            
            return comparison;
        } catch (error) {
            console.error('Failed to compare models:', error);
            return null;
        }
    }
    
    /**
     * Analyze performance trends
     */
    async analyzeTrends(modelId, timeRange = '7d') {
        try {
            const trends = {
                modelId,
                timeRange,
                timestamp: Date.now(),
                trends: {},
                predictions: {},
                insights: []
            };
            
            const report = await this.getPerformanceReport(timeRange, [modelId]);
            
            if (!report) return null;
            
            // Analyze trends for each metric
            for (const [metricType, metricData] of Object.entries(report.summary)) {
                const modelKey = Object.keys(metricData).find(k => k.startsWith(modelId));
                if (modelKey) {
                    const data = metricData[modelKey];
                    trends.trends[metricType] = {
                        current: data.average,
                        trend: data.trend,
                        change: this.calculateChange(data),
                        stability: this.calculateStability(data)
                    };
                }
            }
            
            // Generate predictions
            trends.predictions = this.generatePredictions(trends.trends);
            
            // Generate insights
            trends.insights = this.generateInsights(trends.trends, trends.predictions);
            
            return trends;
        } catch (error) {
            console.error('Failed to analyze trends:', error);
            return null;
        }
    }
    
    /**
     * Set performance thresholds
     */
    setThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
        console.log('📊 Performance thresholds updated');
    }
    
    /**
     * Create a new benchmark
     */
    async createBenchmark(config) {
        try {
            const benchmark = {
                id: `benchmark_${Date.now()}`,
                name: config.name,
                description: config.description,
                models: config.models || [],
                metrics: config.metrics || ['responseTime', 'cost', 'accuracy'],
                duration: config.duration || 300000, // 5 minutes
                load: config.load || { requestsPerSecond: 1 },
                createdAt: Date.now(),
                status: 'created'
            };
            
            this.benchmarks.set(benchmark.id, benchmark);
            
            // Save benchmark configuration
            const configPath = path.join(this.benchmarksPath, 'configs', `${benchmark.id}.json`);
            await fs.writeFile(configPath, JSON.stringify(benchmark, null, 2));
            
            console.log(`📊 Created benchmark: ${benchmark.name} (${benchmark.id})`);
            return benchmark;
        } catch (error) {
            console.error('Failed to create benchmark:', error);
            return null;
        }
    }
    
    /**
     * Run a benchmark
     */
    async runBenchmark(benchmarkId) {
        try {
            const benchmark = this.benchmarks.get(benchmarkId);
            if (!benchmark) {
                throw new Error(`Benchmark ${benchmarkId} not found`);
            }
            
            console.log(`🚀 Starting benchmark: ${benchmark.name}`);
            
            benchmark.status = 'running';
            benchmark.startedAt = Date.now();
            this.activeBenchmarks.add(benchmarkId);
            
            // Run benchmark logic here
            // This would typically involve making actual API calls
            // For now, we'll simulate the benchmark
            
            const results = await this.simulateBenchmark(benchmark);
            
            benchmark.status = 'completed';
            benchmark.completedAt = Date.now();
            benchmark.results = results;
            this.activeBenchmarks.delete(benchmarkId);
            
            // Save results
            const resultsPath = path.join(this.benchmarksPath, 'results', `${benchmarkId}.json`);
            await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
            
            console.log(`✅ Benchmark completed: ${benchmark.name}`);
            return results;
        } catch (error) {
            console.error('Failed to run benchmark:', error);
            return null;
        }
    }
    
    /**
     * Simulate benchmark execution
     */
    async simulateBenchmark(benchmark) {
        const results = {
            benchmarkId: benchmark.id,
            timestamp: Date.now(),
            duration: benchmark.duration,
            models: {},
            summary: {}
        };
        
        // Simulate metrics for each model
        for (const model of benchmark.models) {
            results.models[model] = {};
            
            for (const metric of benchmark.metrics) {
                const simulatedData = this.generateSimulatedMetrics(metric, benchmark.duration);
                results.models[model][metric] = simulatedData;
            }
        }
        
        // Generate summary
        results.summary = this.generateBenchmarkSummary(results.models);
        
        return results;
    }
    
    /**
     * Export metrics to various formats
     */
    async exportMetrics(format = 'json', timeRange = '24h') {
        try {
            const report = await this.getPerformanceReport(timeRange);
            
            if (!report) return null;
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            switch (format.toLowerCase()) {
                case 'json':
                    const jsonPath = path.join(this.metricsPath, `export_${timestamp}.json`);
                    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
                    return jsonPath;
                    
                case 'csv':
                    const csvPath = path.join(this.metricsPath, `export_${timestamp}.csv`);
                    const csvData = this.convertToCSV(report);
                    await fs.writeFile(csvPath, csvData);
                    return csvPath;
                    
                case 'html':
                    const htmlPath = path.join(this.metricsPath, `export_${timestamp}.html`);
                    const htmlData = this.convertToHTML(report);
                    await fs.writeFile(htmlPath, htmlData);
                    return htmlPath;
                    
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            console.error('Failed to export metrics:', error);
            return null;
        }
    }
    
    // Utility methods
    
    calculateMedian(values) {
        const sorted = values.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? 
            (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }
    
    calculateTrend(values) {
        if (values.length < 2) return 'stable';
        
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, v) => sum + v.value, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, v) => sum + v.value, 0) / secondHalf.length;
        
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        if (change > 10) return 'increasing';
        if (change < -10) return 'decreasing';
        return 'stable';
    }
    
    calculateChange(data) {
        // Calculate percentage change over time
        return data.trend === 'stable' ? 0 : 
               data.trend === 'increasing' ? 15 : -15;
    }
    
    calculateStability(data) {
        // Calculate coefficient of variation
        const values = data.values || [];
        if (values.length === 0) return 0;
        
        const mean = values.reduce((sum, v) => sum + v.value, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v.value - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        return mean > 0 ? (stdDev / mean) * 100 : 0;
    }
    
    createTimeIntervals(startTime, endTime) {
        const intervals = [];
        const intervalSize = (endTime - startTime) / 10; // 10 intervals
        
        for (let i = 0; i < 10; i++) {
            const start = startTime + (i * intervalSize);
            const end = start + intervalSize;
            intervals.push({
                start,
                end,
                label: new Date(start).toLocaleTimeString()
            });
        }
        
        return intervals;
    }
    
    getModelColor(modelId) {
        const colors = [
            '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
            '#00BCD4', '#FF5722', '#795548', '#607D8B', '#E91E63'
        ];
        
        const index = modelId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    }
    
    getPerformanceLevel(value, metric) {
        const thresholds = this.thresholds[metric];
        if (!thresholds) return 'unknown';
        
        if (value <= thresholds.warning) return 'excellent';
        if (value <= thresholds.critical) return 'good';
        return 'poor';
    }
    
    generateModelRecommendations(comparison) {
        const recommendations = [];
        
        // Find best performing models
        for (const [metric, rankings] of Object.entries(comparison.rankings)) {
            if (rankings.length > 0) {
                const best = rankings[0];
                const worst = rankings[rankings.length - 1];
                
                recommendations.push({
                    type: 'performance',
                    metric,
                    message: `${best.model} performs best in ${metric} (${best.value.toFixed(2)})`,
                    suggestion: `Consider using ${best.model} for ${metric}-sensitive tasks`
                });
                
                if (worst.value > best.value * 1.5) {
                    recommendations.push({
                        type: 'optimization',
                        metric,
                        message: `${worst.model} significantly underperforms in ${metric}`,
                        suggestion: `Investigate ${worst.model} configuration or consider alternatives`
                    });
                }
            }
        }
        
        return recommendations;
    }
    
    generatePredictions(trends) {
        const predictions = {};
        
        for (const [metric, trend] of Object.entries(trends)) {
            const change = trend.change || 0;
            const current = trend.current || 0;
            
            // Simple linear prediction
            predictions[metric] = {
                nextHour: current * (1 + change / 100),
                nextDay: current * (1 + (change * 24) / 100),
                nextWeek: current * (1 + (change * 168) / 100)
            };
        }
        
        return predictions;
    }
    
    generateInsights(trends, predictions) {
        const insights = [];
        
        for (const [metric, trend] of Object.entries(trends)) {
            if (trend.trend === 'increasing' && trend.change > 20) {
                insights.push({
                    type: 'warning',
                    metric,
                    message: `${metric} is increasing rapidly (${trend.change.toFixed(1)}% change)`,
                    impact: 'high'
                });
            }
            
            if (trend.stability > 50) {
                insights.push({
                    type: 'info',
                    metric,
                    message: `${metric} shows high variability (${trend.stability.toFixed(1)}% CV)`,
                    impact: 'medium'
                });
            }
        }
        
        return insights;
    }
    
    generateSimulatedMetrics(metric, duration) {
        const dataPoints = Math.floor(duration / 1000); // 1 second intervals
        const data = [];
        
        for (let i = 0; i < dataPoints; i++) {
            let value;
            
            switch (metric) {
                case 'responseTime':
                    value = 1000 + Math.random() * 2000; // 1-3 seconds
                    break;
                case 'cost':
                    value = 0.001 + Math.random() * 0.004; // $0.001-0.005 per token
                    break;
                case 'accuracy':
                    value = 0.8 + Math.random() * 0.2; // 80-100% accuracy
                    break;
                case 'throughput':
                    value = 5 + Math.random() * 15; // 5-20 requests per second
                    break;
                default:
                    value = Math.random() * 100;
            }
            
            data.push({
                timestamp: Date.now() + (i * 1000),
                value
            });
        }
        
        return data;
    }
    
    generateBenchmarkSummary(models) {
        const summary = {
            totalModels: Object.keys(models).length,
            totalMetrics: 0,
            averagePerformance: {}
        };
        
        for (const [model, modelData] of Object.entries(models)) {
            for (const [metric, metricData] of Object.entries(modelData)) {
                summary.totalMetrics++;
                
                if (!summary.averagePerformance[metric]) {
                    summary.averagePerformance[metric] = [];
                }
                
                const avg = metricData.reduce((sum, d) => sum + d.value, 0) / metricData.length;
                summary.averagePerformance[metric].push(avg);
            }
        }
        
        // Calculate overall averages
        for (const [metric, values] of Object.entries(summary.averagePerformance)) {
            summary.averagePerformance[metric] = values.reduce((sum, v) => sum + v, 0) / values.length;
        }
        
        return summary;
    }
    
    convertToCSV(report) {
        let csv = 'Metric,Model,Average,Min,Max,Count,Trend\n';
        
        for (const [metricType, metricData] of Object.entries(report.summary)) {
            for (const [key, data] of Object.entries(metricData)) {
                const modelId = key.split('_')[0];
                csv += `${metricType},${modelId},${data.average},${data.min},${data.max},${data.count},${data.trend}\n`;
            }
        }
        
        return csv;
    }
    
    convertToHTML(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .warning { color: orange; }
        .critical { color: red; }
    </style>
</head>
<body>
    <h1>Performance Report</h1>
    <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
    
    <h2>Summary</h2>
    <table>
        <tr><th>Metric</th><th>Model</th><th>Average</th><th>Min</th><th>Max</th><th>Count</th><th>Trend</th></tr>
        ${Object.entries(report.summary).map(([metricType, metricData]) =>
            Object.entries(metricData).map(([key, data]) => {
                const modelId = key.split('_')[0];
                return `<tr>
                    <td>${metricType}</td>
                    <td>${modelId}</td>
                    <td>${data.average.toFixed(2)}</td>
                    <td>${data.min.toFixed(2)}</td>
                    <td>${data.max.toFixed(2)}</td>
                    <td>${data.count}</td>
                    <td>${data.trend}</td>
                </tr>`;
            }).join('')
        ).join('')}
    </table>
    
    <h2>Recommendations</h2>
    <ul>
        ${report.recommendations.map(rec => 
            `<li class="${rec.priority}">${rec.message}</li>`
        ).join('')}
    </ul>
</body>
</html>`;
    }
    
    loadMetricsFromFile(metrics) {
        // Load metrics from saved file
        for (const [type, data] of Object.entries(metrics)) {
            if (this.metrics[type]) {
                for (const [key, values] of Object.entries(data)) {
                    this.metrics[type].set(key, values);
                }
            }
        }
    }
}

module.exports = PerformanceBenchmarkingDashboard; 