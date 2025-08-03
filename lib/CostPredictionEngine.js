/**
 * CostPredictionEngine.js
 * Machine learning-based cost forecasting and optimization system
 * Provides advanced cost prediction, usage pattern analysis, and optimization recommendations
 */

const fs = require('fs').promises;
const path = require('path');

class CostPredictionEngine {
    constructor(projectName = 'default-project') {
        this.projectName = projectName;
        this.projectPath = projectName;
        this.predictionPath = path.join(this.projectPath, 'predictions');
        
        // Prediction models
        this.models = {
            linear: this.linearRegression.bind(this),
            exponential: this.exponentialSmoothing.bind(this),
            movingAverage: this.movingAverage.bind(this),
            seasonal: this.seasonalDecomposition.bind(this),
            neural: this.neuralNetwork.bind(this)
        };
        
        // Historical data storage
        this.costHistory = new Map();
        this.usagePatterns = new Map();
        this.seasonalData = new Map();
        
        // Prediction configurations
        this.predictionConfig = {
            defaultModel: 'exponential',
            confidenceLevel: 0.95,
            forecastHorizon: 30, // days
            minDataPoints: 10,
            updateInterval: 3600000 // 1 hour
        };
        
        // Model performance tracking
        this.modelPerformance = new Map();
        this.predictionAccuracy = new Map();
        
        // Optimization settings
        this.optimizationSettings = {
            autoOptimize: true,
            optimizationThreshold: 0.1,
            maxOptimizationsPerDay: 3
        };
        
        // Real-time monitoring
        this.monitoringInterval = null;
        
        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.trainModel = this.trainModel.bind(this);
        this.predictCosts = this.predictCosts.bind(this);
        this.analyzeUsagePatterns = this.analyzeUsagePatterns.bind(this);
        this.generateProjections = this.generateProjections.bind(this);
        this.optimizeCosts = this.optimizeCosts.bind(this);
        this.evaluateModel = this.evaluateModel.bind(this);
        this.getPredictionReport = this.getPredictionReport.bind(this);
        this.exportPredictions = this.exportPredictions.bind(this);
    }
    
    /**
     * Initialize the cost prediction engine
     */
    async initialize() {
        try {
            console.log('🔮 Initializing Cost Prediction Engine...');
            
            // Create prediction directory structure
            await this.createPredictionStructure();
            
            // Load historical data
            await this.loadHistoricalData();
            
            // Initialize models
            await this.initializeModels();
            
            // Start monitoring
            await this.startMonitoring();
            
            console.log('✅ Cost Prediction Engine initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Cost Prediction Engine:', error);
            return false;
        }
    }
    
    /**
     * Create prediction directory structure
     */
    async createPredictionStructure() {
        const directories = [
            this.predictionPath,
            path.join(this.predictionPath, 'models'),
            path.join(this.predictionPath, 'data'),
            path.join(this.predictionPath, 'reports'),
            path.join(this.predictionPath, 'optimizations')
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
     * Load historical cost data
     */
    async loadHistoricalData() {
        try {
            const dataPath = path.join(this.predictionPath, 'data');
            const files = await fs.readdir(dataPath);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const data = await fs.readFile(path.join(dataPath, file), 'utf8');
                    const history = JSON.parse(data);
                    
                    for (const [key, costs] of Object.entries(history)) {
                        this.costHistory.set(key, costs);
                    }
                }
            }
            
            console.log(`📊 Loaded ${this.costHistory.size} cost history entries`);
        } catch (error) {
            console.log('📊 No existing cost history found');
        }
    }
    
    /**
     * Initialize prediction models
     */
    async initializeModels() {
        try {
            // Load model configurations
            const configPath = path.join(this.predictionPath, 'models', 'config.json');
            try {
                const data = await fs.readFile(configPath, 'utf8');
                const config = JSON.parse(data);
                
                // Update prediction config with saved settings
                this.predictionConfig = { ...this.predictionConfig, ...config };
                
                console.log('🔮 Model configurations loaded');
            } catch (error) {
                console.log('🔮 Using default model configurations');
            }
            
            // Initialize model performance tracking
            for (const modelName of Object.keys(this.models)) {
                this.modelPerformance.set(modelName, {
                    accuracy: 0,
                    predictions: 0,
                    lastUpdated: Date.now()
                });
            }
            
        } catch (error) {
            console.error('Failed to initialize models:', error);
        }
    }
    
    /**
     * Start real-time monitoring
     */
    async startMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        this.monitoringInterval = setInterval(async () => {
            await this.updatePredictions();
        }, this.predictionConfig.updateInterval);
        
        console.log('🔄 Cost prediction monitoring started');
    }
    
    /**
     * Train a prediction model
     */
    async trainModel(modelType, data, options = {}) {
        try {
            console.log(`🔮 Training ${modelType} model...`);
            
            const model = this.models[modelType];
            if (!model) {
                throw new Error(`Unknown model type: ${modelType}`);
            }
            
            // Prepare training data
            const trainingData = this.prepareTrainingData(data);
            
            // Train the model
            const trainedModel = await model(trainingData, options);
            
            // Save trained model
            await this.saveModel(modelType, trainedModel);
            
            // Update model performance
            const performance = this.modelPerformance.get(modelType);
            performance.lastUpdated = Date.now();
            this.modelPerformance.set(modelType, performance);
            
            console.log(`✅ ${modelType} model trained successfully`);
            return trainedModel;
        } catch (error) {
            console.error(`Failed to train ${modelType} model:`, error);
            return null;
        }
    }
    
    /**
     * Predict costs using specified model
     */
    async predictCosts(entity, modelType = null, horizon = null) {
        try {
            const model = modelType || this.predictionConfig.defaultModel;
            const forecastDays = horizon || this.predictionConfig.forecastHorizon;
            
            console.log(`🔮 Predicting costs for ${entity} using ${model} model...`);
            
            // Get historical data for entity
            const historicalData = this.costHistory.get(entity) || [];
            
            if (historicalData.length < this.predictionConfig.minDataPoints) {
                throw new Error(`Insufficient data for ${entity}: ${historicalData.length} points`);
            }
            
            // Prepare data for prediction
            const preparedData = this.preparePredictionData(historicalData);
            
            // Make prediction
            const prediction = await this.models[model](preparedData, { horizon: forecastDays });
            
            // Calculate confidence intervals
            const confidence = this.calculateConfidenceIntervals(prediction, historicalData);
            
            // Store prediction
            const predictionResult = {
                entity,
                model,
                timestamp: Date.now(),
                horizon: forecastDays,
                prediction,
                confidence,
                historicalData: historicalData.slice(-30) // Last 30 data points
            };
            
            await this.savePrediction(predictionResult);
            
            console.log(`✅ Cost prediction completed for ${entity}`);
            return predictionResult;
        } catch (error) {
            console.error(`Failed to predict costs for ${entity}:`, error);
            return null;
        }
    }
    
    /**
     * Analyze usage patterns
     */
    async analyzeUsagePatterns(entity, timeRange = '90d') {
        try {
            console.log(`📊 Analyzing usage patterns for ${entity}...`);
            
            const historicalData = this.costHistory.get(entity) || [];
            const endTime = Date.now();
            const startTime = endTime - this.getTimeRangeMs(timeRange);
            
            const filteredData = historicalData.filter(record => 
                record.timestamp >= startTime && record.timestamp <= endTime
            );
            
            if (filteredData.length === 0) {
                throw new Error(`No data available for ${entity} in specified time range`);
            }
            
            const patterns = {
                entity,
                timeRange,
                timestamp: Date.now(),
                daily: this.analyzeDailyPatterns(filteredData),
                weekly: this.analyzeWeeklyPatterns(filteredData),
                monthly: this.analyzeMonthlyPatterns(filteredData),
                seasonal: this.analyzeSeasonalPatterns(filteredData),
                trends: this.analyzeTrends(filteredData),
                anomalies: this.detectAnomalies(filteredData)
            };
            
            // Store patterns
            this.usagePatterns.set(entity, patterns);
            await this.saveUsagePatterns(entity, patterns);
            
            console.log(`✅ Usage pattern analysis completed for ${entity}`);
            return patterns;
        } catch (error) {
            console.error(`Failed to analyze usage patterns for ${entity}:`, error);
            return null;
        }
    }
    
    /**
     * Generate budget projections
     */
    async generateProjections(budget, timeRange = '30d') {
        try {
            console.log('💰 Generating budget projections...');
            
            const projections = {
                timestamp: Date.now(),
                timeRange,
                budget,
                projections: {},
                scenarios: {},
                recommendations: []
            };
            
            // Generate projections for each entity
            for (const [entity, entityBudget] of Object.entries(budget.agents || {})) {
                const prediction = await this.predictCosts(entity, null, this.getDaysFromRange(timeRange));
                
                if (prediction) {
                    projections.projections[entity] = {
                        currentBudget: entityBudget.allocated,
                        predictedCost: prediction.prediction.total,
                        variance: prediction.prediction.total - entityBudget.allocated,
                        confidence: prediction.confidence.overall,
                        risk: this.calculateRisk(prediction, entityBudget)
                    };
                }
            }
            
            // Generate scenario analysis
            projections.scenarios = this.generateScenarios(projections.projections, budget);
            
            // Generate recommendations
            projections.recommendations = this.generateProjectionRecommendations(projections);
            
            // Save projections
            await this.saveProjections(projections);
            
            console.log('✅ Budget projections generated');
            return projections;
        } catch (error) {
            console.error('Failed to generate budget projections:', error);
            return null;
        }
    }
    
    /**
     * Optimize costs based on predictions
     */
    async optimizeCosts(budget, optimizationType = 'automatic') {
        try {
            console.log('🔧 Starting cost optimization...');
            
            const optimization = {
                timestamp: Date.now(),
                type: optimizationType,
                originalBudget: JSON.parse(JSON.stringify(budget)),
                optimizations: [],
                savings: 0,
                recommendations: []
            };
            
            // Get current predictions
            const projections = await this.generateProjections(budget);
            
            if (!projections) {
                throw new Error('Failed to generate projections for optimization');
            }
            
            // Apply optimization strategies
            switch (optimizationType) {
                case 'automatic':
                    optimization.optimizations = await this.automaticOptimization(projections, budget);
                    break;
                case 'conservative':
                    optimization.optimizations = await this.conservativeOptimization(projections, budget);
                    break;
                case 'aggressive':
                    optimization.optimizations = await this.aggressiveOptimization(projections, budget);
                    break;
                default:
                    throw new Error(`Unknown optimization type: ${optimizationType}`);
            }
            
            // Calculate total savings
            optimization.savings = optimization.optimizations.reduce((sum, opt) => sum + opt.savings, 0);
            
            // Generate recommendations
            optimization.recommendations = this.generateOptimizationRecommendations(optimization);
            
            // Save optimization
            await this.saveOptimization(optimization);
            
            console.log(`✅ Cost optimization completed: $${optimization.savings.toFixed(2)} potential savings`);
            return optimization;
        } catch (error) {
            console.error('Failed to optimize costs:', error);
            return null;
        }
    }
    
    /**
     * Evaluate model performance
     */
    async evaluateModel(modelType, testData) {
        try {
            console.log(`📈 Evaluating ${modelType} model performance...`);
            
            const predictions = [];
            const actuals = [];
            
            // Generate predictions for test data
            for (const dataPoint of testData) {
                const prediction = await this.models[modelType](dataPoint.input, { horizon: 1 });
                predictions.push(prediction.total);
                actuals.push(dataPoint.actual);
            }
            
            // Calculate performance metrics
            const metrics = {
                mae: this.calculateMAE(predictions, actuals),
                mape: this.calculateMAPE(predictions, actuals),
                rmse: this.calculateRMSE(predictions, actuals),
                accuracy: this.calculateAccuracy(predictions, actuals)
            };
            
            // Update model performance
            const performance = this.modelPerformance.get(modelType);
            performance.accuracy = metrics.accuracy;
            performance.predictions += predictions.length;
            performance.lastUpdated = Date.now();
            this.modelPerformance.set(modelType, performance);
            
            console.log(`✅ ${modelType} model evaluation completed`);
            return metrics;
        } catch (error) {
            console.error(`Failed to evaluate ${modelType} model:`, error);
            return null;
        }
    }
    
    /**
     * Get comprehensive prediction report
     */
    async getPredictionReport(timeRange = '30d', format = 'json') {
        try {
            const report = {
                timestamp: Date.now(),
                timeRange,
                summary: {},
                predictions: {},
                patterns: {},
                recommendations: []
            };
            
            // Generate predictions for all entities
            const entities = Array.from(this.costHistory.keys());
            
            for (const entity of entities) {
                const prediction = await this.predictCosts(entity, null, this.getDaysFromRange(timeRange));
                if (prediction) {
                    report.predictions[entity] = prediction;
                }
                
                const patterns = await this.analyzeUsagePatterns(entity, timeRange);
                if (patterns) {
                    report.patterns[entity] = patterns;
                }
            }
            
            // Generate summary
            report.summary = this.generatePredictionSummary(report.predictions);
            
            // Generate recommendations
            report.recommendations = this.generateReportRecommendations(report);
            
            // Export if requested
            if (format !== 'json') {
                return await this.exportPredictionReport(report, format);
            }
            
            return report;
        } catch (error) {
            console.error('Failed to generate prediction report:', error);
            return null;
        }
    }
    
    /**
     * Export predictions to various formats
     */
    async exportPredictions(format = 'json', timeRange = '30d') {
        try {
            const report = await this.getPredictionReport(timeRange, 'json');
            
            if (!report) return null;
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            switch (format.toLowerCase()) {
                case 'json':
                    const jsonPath = path.join(this.predictionPath, `predictions_${timestamp}.json`);
                    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
                    return jsonPath;
                    
                case 'csv':
                    const csvPath = path.join(this.predictionPath, `predictions_${timestamp}.csv`);
                    const csvData = this.convertPredictionsToCSV(report);
                    await fs.writeFile(csvPath, csvData);
                    return csvPath;
                    
                case 'html':
                    const htmlPath = path.join(this.predictionPath, `predictions_${timestamp}.html`);
                    const htmlData = this.convertPredictionsToHTML(report);
                    await fs.writeFile(htmlPath, htmlData);
                    return htmlPath;
                    
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            console.error('Failed to export predictions:', error);
            return null;
        }
    }
    
    // Prediction Models
    
    /**
     * Linear regression model
     */
    async linearRegression(data, options = {}) {
        const { x, y } = this.extractXY(data);
        
        // Calculate linear regression parameters
        const n = x.length;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Generate predictions
        const horizon = options.horizon || 30;
        const predictions = [];
        
        for (let i = 1; i <= horizon; i++) {
            const prediction = slope * (x[x.length - 1] + i) + intercept;
            predictions.push(Math.max(0, prediction));
        }
        
        return {
            model: 'linear',
            parameters: { slope, intercept },
            predictions,
            total: predictions.reduce((sum, val) => sum + val, 0),
            daily: predictions
        };
    }
    
    /**
     * Exponential smoothing model
     */
    async exponentialSmoothing(data, options = {}) {
        const alpha = options.alpha || 0.3;
        const values = data.map(d => d.value);
        
        // Initialize with first value
        let smoothed = values[0];
        const predictions = [];
        
        // Apply exponential smoothing
        for (let i = 1; i < values.length; i++) {
            smoothed = alpha * values[i] + (1 - alpha) * smoothed;
        }
        
        // Generate future predictions
        const horizon = options.horizon || 30;
        for (let i = 0; i < horizon; i++) {
            predictions.push(Math.max(0, smoothed));
        }
        
        return {
            model: 'exponential',
            parameters: { alpha, lastSmoothed: smoothed },
            predictions,
            total: predictions.reduce((sum, val) => sum + val, 0),
            daily: predictions
        };
    }
    
    /**
     * Moving average model
     */
    async movingAverage(data, options = {}) {
        const window = options.window || 7;
        const values = data.map(d => d.value);
        
        // Calculate moving average
        const movingAvg = [];
        for (let i = window - 1; i < values.length; i++) {
            const sum = values.slice(i - window + 1, i + 1).reduce((s, v) => s + v, 0);
            movingAvg.push(sum / window);
        }
        
        // Use last moving average for predictions
        const lastAvg = movingAvg[movingAvg.length - 1];
        const horizon = options.horizon || 30;
        const predictions = Array(horizon).fill(Math.max(0, lastAvg));
        
        return {
            model: 'movingAverage',
            parameters: { window, lastAverage: lastAvg },
            predictions,
            total: predictions.reduce((sum, val) => sum + val, 0),
            daily: predictions
        };
    }
    
    /**
     * Seasonal decomposition model
     */
    async seasonalDecomposition(data, options = {}) {
        const period = options.period || 7; // Weekly seasonality
        const values = data.map(d => d.value);
        
        // Calculate seasonal components
        const seasonal = this.calculateSeasonalComponents(values, period);
        
        // Calculate trend
        const trend = this.calculateTrend(values);
        
        // Generate predictions
        const horizon = options.horizon || 30;
        const predictions = [];
        
        for (let i = 0; i < horizon; i++) {
            const seasonalIndex = (values.length + i) % period;
            const seasonalComponent = seasonal[seasonalIndex] || 1;
            const trendComponent = trend + (i * 0.01); // Simple trend continuation
            const prediction = Math.max(0, trendComponent * seasonalComponent);
            predictions.push(prediction);
        }
        
        return {
            model: 'seasonal',
            parameters: { period, seasonal, trend },
            predictions,
            total: predictions.reduce((sum, val) => sum + val, 0),
            daily: predictions
        };
    }
    
    /**
     * Neural network model (simplified)
     */
    async neuralNetwork(data, options = {}) {
        // Simplified neural network implementation
        // In a real implementation, this would use a proper ML library
        
        const values = data.map(d => d.value);
        const horizon = options.horizon || 30;
        
        // Simple pattern recognition
        const patterns = this.identifyPatterns(values);
        const predictions = this.generateNeuralPredictions(patterns, horizon);
        
        return {
            model: 'neural',
            parameters: { patterns },
            predictions,
            total: predictions.reduce((sum, val) => sum + val, 0),
            daily: predictions
        };
    }
    
    // Utility methods
    
    prepareTrainingData(data) {
        return data.map((record, index) => ({
            input: { day: index, value: record.value },
            output: record.value
        }));
    }
    
    preparePredictionData(data) {
        return data.map((record, index) => ({
            day: index,
            value: record.value,
            timestamp: record.timestamp
        }));
    }
    
    calculateConfidenceIntervals(prediction, historicalData) {
        const variance = this.calculateVariance(historicalData.map(d => d.value));
        const stdDev = Math.sqrt(variance);
        
        return {
            overall: Math.max(0.1, Math.min(0.9, 1 - (stdDev / prediction.total))),
            daily: prediction.daily.map(val => Math.max(0.1, Math.min(0.9, 1 - (stdDev / val))))
        };
    }
    
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    }
    
    extractXY(data) {
        const x = data.map((d, i) => i);
        const y = data.map(d => d.value);
        return { x, y };
    }
    
    calculateSeasonalComponents(values, period) {
        const seasonal = Array(period).fill(0);
        const counts = Array(period).fill(0);
        
        for (let i = 0; i < values.length; i++) {
            const index = i % period;
            seasonal[index] += values[i];
            counts[index]++;
        }
        
        return seasonal.map((sum, i) => sum / counts[i]);
    }
    
    calculateTrend(values) {
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
        const sumXX = values.reduce((sum, val, i) => sum + i * i, 0);
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }
    
    identifyPatterns(values) {
        // Simple pattern identification
        return {
            trend: this.calculateTrend(values),
            volatility: this.calculateVariance(values),
            seasonality: this.detectSeasonality(values)
        };
    }
    
    generateNeuralPredictions(patterns, horizon) {
        const predictions = [];
        let currentValue = patterns.trend;
        
        for (let i = 0; i < horizon; i++) {
            const prediction = Math.max(0, currentValue + (patterns.trend * 0.1));
            predictions.push(prediction);
            currentValue = prediction;
        }
        
        return predictions;
    }
    
    detectSeasonality(values) {
        // Simple seasonality detection
        return values.length > 7 ? 7 : 1;
    }
    
    calculateMAE(predictions, actuals) {
        return predictions.reduce((sum, pred, i) => sum + Math.abs(pred - actuals[i]), 0) / predictions.length;
    }
    
    calculateMAPE(predictions, actuals) {
        return predictions.reduce((sum, pred, i) => {
            const actual = actuals[i];
            return sum + (actual > 0 ? Math.abs((pred - actual) / actual) : 0);
        }, 0) / predictions.length * 100;
    }
    
    calculateRMSE(predictions, actuals) {
        const mse = predictions.reduce((sum, pred, i) => sum + Math.pow(pred - actuals[i], 2), 0) / predictions.length;
        return Math.sqrt(mse);
    }
    
    calculateAccuracy(predictions, actuals) {
        const errors = predictions.map((pred, i) => Math.abs(pred - actuals[i]));
        const maxError = Math.max(...actuals);
        return Math.max(0, 1 - (errors.reduce((sum, err) => sum + err, 0) / predictions.length) / maxError);
    }
    
    getTimeRangeMs(timeRange) {
        const ranges = {
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000
        };
        return ranges[timeRange] || ranges['30d'];
    }
    
    getDaysFromRange(timeRange) {
        const days = {
            '7d': 7,
            '30d': 30,
            '90d': 90
        };
        return days[timeRange] || 30;
    }
    
    // Additional utility methods would be implemented here...
    // (analyzeDailyPatterns, analyzeWeeklyPatterns, etc.)
    
    async saveModel(modelType, model) {
        try {
            const modelPath = path.join(this.predictionPath, 'models', `${modelType}.json`);
            await fs.writeFile(modelPath, JSON.stringify(model, null, 2));
        } catch (error) {
            console.error('Failed to save model:', error);
        }
    }
    
    async savePrediction(prediction) {
        try {
            const predictionPath = path.join(this.predictionPath, `prediction_${prediction.entity}_${Date.now()}.json`);
            await fs.writeFile(predictionPath, JSON.stringify(prediction, null, 2));
        } catch (error) {
            console.error('Failed to save prediction:', error);
        }
    }
    
    async updatePredictions() {
        // Update predictions periodically
        console.log('🔄 Updating cost predictions...');
    }
}

module.exports = CostPredictionEngine; 