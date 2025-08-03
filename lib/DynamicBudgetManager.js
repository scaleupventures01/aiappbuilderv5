/**
 * DynamicBudgetManager.js
 * Real-time budget tracking and dynamic allocation system
 * Provides intelligent budget management, cost prediction, and optimization
 */

const fs = require('fs').promises;
const path = require('path');

class DynamicBudgetManager {
    constructor(projectName = 'default-project') {
        this.projectName = projectName;
        this.projectPath = projectName;
        this.budgetPath = path.join(this.projectPath, 'budgets');
        
        // Budget configuration
        this.budgets = {
            total: 0,
            allocated: 0,
            spent: 0,
            remaining: 0,
            agents: new Map(),
            categories: new Map(),
            timeframes: new Map()
        };
        
        // Budget allocation strategies
        this.strategies = {
            equal: this.allocateEqual.bind(this),
            proportional: this.allocateProportional.bind(this),
            performance: this.allocateByPerformance.bind(this),
            priority: this.allocateByPriority.bind(this),
            adaptive: this.allocateAdaptive.bind(this)
        };
        
        // Cost tracking
        this.costHistory = new Map();
        this.spendingPatterns = new Map();
        this.costPredictions = new Map();
        
        // Budget alerts and notifications
        this.alerts = [];
        this.thresholds = {
            warning: 0.8, // 80% of budget
            critical: 0.95, // 95% of budget
            emergency: 0.99 // 99% of budget
        };
        
        // Real-time monitoring
        this.monitoringInterval = null;
        this.updateInterval = 30000; // 30 seconds
        
        // Optimization settings
        this.optimizationSettings = {
            autoReallocate: true,
            reallocationThreshold: 0.1, // 10% difference triggers reallocation
            maxReallocationsPerHour: 5,
            reallocationCooldown: 3600000 // 1 hour
        };
        
        // Reallocation tracking
        this.reallocationHistory = [];
        this.lastReallocation = 0;
        this.reallocationCount = 0;
        
        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.setTotalBudget = this.setTotalBudget.bind(this);
        this.allocateBudget = this.allocateBudget.bind(this);
        this.trackSpending = this.trackSpending.bind(this);
        this.getBudgetStatus = this.getBudgetStatus.bind(this);
        this.predictCosts = this.predictCosts.bind(this);
        this.optimizeBudget = this.optimizeBudget.bind(this);
        this.reallocateBudget = this.reallocateBudget.bind(this);
        this.setAlertThresholds = this.setAlertThresholds.bind(this);
        this.getSpendingReport = this.getSpendingReport.bind(this);
        this.exportBudgetData = this.exportBudgetData.bind(this);
    }
    
    /**
     * Initialize the dynamic budget manager
     */
    async initialize() {
        try {
            console.log('💰 Initializing Dynamic Budget Manager...');
            
            // Create budget directory structure
            await this.createBudgetStructure();
            
            // Load existing budget data
            await this.loadBudgetData();
            
            // Initialize real-time monitoring
            await this.startMonitoring();
            
            console.log('✅ Dynamic Budget Manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Dynamic Budget Manager:', error);
            return false;
        }
    }
    
    /**
     * Create budget directory structure
     */
    async createBudgetStructure() {
        const directories = [
            this.budgetPath,
            path.join(this.budgetPath, 'history'),
            path.join(this.budgetPath, 'reports'),
            path.join(this.budgetPath, 'alerts'),
            path.join(this.budgetPath, 'predictions')
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
     * Load existing budget data
     */
    async loadBudgetData() {
        try {
            // Load budget configuration
            const configPath = path.join(this.budgetPath, 'config.json');
            try {
                const data = await fs.readFile(configPath, 'utf8');
                const config = JSON.parse(data);
                
                this.budgets.total = config.total || 0;
                this.budgets.allocated = config.allocated || 0;
                this.budgets.spent = config.spent || 0;
                this.budgets.remaining = config.remaining || 0;
                
                // Load agent budgets
                if (config.agents) {
                    for (const [agentId, budget] of Object.entries(config.agents)) {
                        this.budgets.agents.set(agentId, budget);
                    }
                }
                
                // Load category budgets
                if (config.categories) {
                    for (const [category, budget] of Object.entries(config.categories)) {
                        this.budgets.categories.set(category, budget);
                    }
                }
                
                // Load timeframe budgets
                if (config.timeframes) {
                    for (const [timeframe, budget] of Object.entries(config.timeframes)) {
                        this.budgets.timeframes.set(timeframe, budget);
                    }
                }
                
                console.log(`💰 Loaded budget configuration: $${this.budgets.total} total budget`);
            } catch (error) {
                console.log('💰 No existing budget configuration found, starting fresh');
            }
            
            // Load cost history
            await this.loadCostHistory();
            
        } catch (error) {
            console.error('Failed to load budget data:', error);
        }
    }
    
    /**
     * Load cost history from files
     */
    async loadCostHistory() {
        try {
            const historyPath = path.join(this.budgetPath, 'history');
            const files = await fs.readdir(historyPath);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const data = await fs.readFile(path.join(historyPath, file), 'utf8');
                    const history = JSON.parse(data);
                    
                    for (const [key, costs] of Object.entries(history)) {
                        this.costHistory.set(key, costs);
                    }
                }
            }
            
            console.log(`💰 Loaded ${this.costHistory.size} cost history entries`);
        } catch (error) {
            console.log('💰 No existing cost history found');
        }
    }
    
    /**
     * Start real-time budget monitoring
     */
    async startMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        this.monitoringInterval = setInterval(async () => {
            await this.updateBudgetStatus();
        }, this.updateInterval);
        
        console.log('🔄 Real-time budget monitoring started');
    }
    
    /**
     * Stop real-time budget monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('⏹️ Real-time budget monitoring stopped');
        }
    }
    
    /**
     * Set total budget for the project
     */
    async setTotalBudget(amount, currency = 'USD') {
        try {
            this.budgets.total = amount;
            this.budgets.remaining = amount - this.budgets.spent;
            
            // Save budget configuration
            await this.saveBudgetConfig();
            
            console.log(`💰 Total budget set to $${amount} ${currency}`);
            return true;
        } catch (error) {
            console.error('Failed to set total budget:', error);
            return false;
        }
    }
    
    /**
     * Allocate budget using specified strategy
     */
    async allocateBudget(agents, strategy = 'equal', options = {}) {
        try {
            console.log(`💰 Allocating budget using ${strategy} strategy...`);
            
            const allocationFunction = this.strategies[strategy];
            if (!allocationFunction) {
                throw new Error(`Unknown allocation strategy: ${strategy}`);
            }
            
            const allocations = await allocationFunction(agents, options);
            
            // Apply allocations
            for (const [agentId, amount] of Object.entries(allocations)) {
                this.budgets.agents.set(agentId, {
                    allocated: amount,
                    spent: 0,
                    remaining: amount,
                    lastAllocation: Date.now()
                });
            }
            
            // Update total allocated amount
            this.budgets.allocated = Object.values(allocations).reduce((sum, amount) => sum + amount, 0);
            
            // Save budget configuration
            await this.saveBudgetConfig();
            
            console.log(`✅ Budget allocated: $${this.budgets.allocated} total`);
            return allocations;
        } catch (error) {
            console.error('Failed to allocate budget:', error);
            return null;
        }
    }
    
    /**
     * Equal allocation strategy
     */
    async allocateEqual(agents, options = {}) {
        const availableBudget = this.budgets.total - this.budgets.spent;
        const amountPerAgent = availableBudget / agents.length;
        
        const allocations = {};
        for (const agent of agents) {
            allocations[agent] = amountPerAgent;
        }
        
        return allocations;
    }
    
    /**
     * Proportional allocation strategy
     */
    async allocateProportional(agents, options = {}) {
        const weights = options.weights || {};
        const availableBudget = this.budgets.total - this.budgets.spent;
        
        // Calculate total weight
        const totalWeight = agents.reduce((sum, agent) => sum + (weights[agent] || 1), 0);
        
        const allocations = {};
        for (const agent of agents) {
            const weight = weights[agent] || 1;
            allocations[agent] = (weight / totalWeight) * availableBudget;
        }
        
        return allocations;
    }
    
    /**
     * Performance-based allocation strategy
     */
    async allocateByPerformance(agents, options = {}) {
        const performanceData = options.performanceData || {};
        const availableBudget = this.budgets.total - this.budgets.spent;
        
        // Calculate performance scores
        const scores = {};
        let totalScore = 0;
        
        for (const agent of agents) {
            const performance = performanceData[agent] || { accuracy: 0.5, efficiency: 0.5, cost: 0.5 };
            const score = (performance.accuracy + performance.efficiency + (1 - performance.cost)) / 3;
            scores[agent] = score;
            totalScore += score;
        }
        
        // Allocate based on performance scores
        const allocations = {};
        for (const agent of agents) {
            const score = scores[agent];
            allocations[agent] = (score / totalScore) * availableBudget;
        }
        
        return allocations;
    }
    
    /**
     * Priority-based allocation strategy
     */
    async allocateByPriority(agents, options = {}) {
        const priorities = options.priorities || {};
        const availableBudget = this.budgets.total - this.budgets.spent;
        
        // Sort agents by priority (higher priority = lower number)
        const sortedAgents = agents.sort((a, b) => {
            const priorityA = priorities[a] || 999;
            const priorityB = priorities[b] || 999;
            return priorityA - priorityB;
        });
        
        // Allocate budget with priority weighting
        const allocations = {};
        let remainingBudget = availableBudget;
        
        for (let i = 0; i < sortedAgents.length; i++) {
            const agent = sortedAgents[i];
            const priority = priorities[agent] || 999;
            const weight = 1 / (priority + 1); // Higher priority gets more budget
            
            const allocation = Math.min(remainingBudget * weight, remainingBudget / (sortedAgents.length - i));
            allocations[agent] = allocation;
            remainingBudget -= allocation;
        }
        
        return allocations;
    }
    
    /**
     * Adaptive allocation strategy
     */
    async allocateAdaptive(agents, options = {}) {
        const availableBudget = this.budgets.total - this.budgets.spent;
        
        // Get historical performance data
        const performanceData = await this.getHistoricalPerformance(agents);
        
        // Calculate adaptive weights based on recent performance
        const weights = {};
        let totalWeight = 0;
        
        for (const agent of agents) {
            const performance = performanceData[agent] || { success: 0.5, efficiency: 0.5, cost: 0.5 };
            
            // Adaptive weight calculation
            const successWeight = performance.success * 2;
            const efficiencyWeight = performance.efficiency * 1.5;
            const costWeight = (1 - performance.cost) * 1.2;
            
            const weight = successWeight + efficiencyWeight + costWeight;
            weights[agent] = weight;
            totalWeight += weight;
        }
        
        // Allocate based on adaptive weights
        const allocations = {};
        for (const agent of agents) {
            const weight = weights[agent];
            allocations[agent] = (weight / totalWeight) * availableBudget;
        }
        
        return allocations;
    }
    
    /**
     * Track spending for an agent or category
     */
    async trackSpending(agentId, amount, category = 'general', metadata = {}) {
        try {
            const timestamp = Date.now();
            
            // Update agent spending
            if (this.budgets.agents.has(agentId)) {
                const agentBudget = this.budgets.agents.get(agentId);
                agentBudget.spent += amount;
                agentBudget.remaining = Math.max(0, agentBudget.allocated - agentBudget.spent);
                this.budgets.agents.set(agentId, agentBudget);
            }
            
            // Update category spending
            if (this.budgets.categories.has(category)) {
                const categoryBudget = this.budgets.categories.get(category);
                categoryBudget.spent += amount;
                categoryBudget.remaining = Math.max(0, categoryBudget.allocated - categoryBudget.spent);
                this.budgets.categories.set(category, categoryBudget);
            }
            
            // Update total spending
            this.budgets.spent += amount;
            this.budgets.remaining = Math.max(0, this.budgets.total - this.budgets.spent);
            
            // Record spending history
            const spendingRecord = {
                timestamp,
                agentId,
                amount,
                category,
                metadata
            };
            
            // Store in cost history
            const historyKey = `${agentId}_${category}`;
            if (!this.costHistory.has(historyKey)) {
                this.costHistory.set(historyKey, []);
            }
            this.costHistory.get(historyKey).push(spendingRecord);
            
            // Check budget thresholds and trigger alerts
            await this.checkBudgetThresholds();
            
            // Save budget configuration
            await this.saveBudgetConfig();
            
            // Save spending record
            await this.saveSpendingRecord(spendingRecord);
            
            console.log(`💰 Tracked spending: $${amount} for ${agentId} (${category})`);
            return spendingRecord;
        } catch (error) {
            console.error('Failed to track spending:', error);
            return null;
        }
    }
    
    /**
     * Check budget thresholds and trigger alerts
     */
    async checkBudgetThresholds() {
        const spentRatio = this.budgets.spent / this.budgets.total;
        
        if (spentRatio >= this.thresholds.emergency) {
            await this.triggerAlert('emergency', 'Budget nearly exhausted', {
                spent: this.budgets.spent,
                total: this.budgets.total,
                ratio: spentRatio
            });
        } else if (spentRatio >= this.thresholds.critical) {
            await this.triggerAlert('critical', 'Budget critical level reached', {
                spent: this.budgets.spent,
                total: this.budgets.total,
                ratio: spentRatio
            });
        } else if (spentRatio >= this.thresholds.warning) {
            await this.triggerAlert('warning', 'Budget warning level reached', {
                spent: this.budgets.spent,
                total: this.budgets.total,
                ratio: spentRatio
            });
        }
        
        // Check individual agent budgets
        for (const [agentId, budget] of this.budgets.agents.entries()) {
            const agentRatio = budget.spent / budget.allocated;
            
            if (agentRatio >= this.thresholds.critical) {
                await this.triggerAlert('critical', `Agent ${agentId} budget critical`, {
                    agentId,
                    spent: budget.spent,
                    allocated: budget.allocated,
                    ratio: agentRatio
                });
            }
        }
    }
    
    /**
     * Trigger budget alert
     */
    async triggerAlert(level, message, data) {
        const alert = {
            level,
            message,
            data,
            timestamp: Date.now()
        };
        
        this.alerts.push(alert);
        
        console.log(`🚨 Budget Alert (${level.toUpperCase()}): ${message}`);
        
        // Save alert
        await this.saveAlert(alert);
        
        return alert;
    }
    
    /**
     * Get current budget status
     */
    getBudgetStatus() {
        return {
            total: this.budgets.total,
            allocated: this.budgets.allocated,
            spent: this.budgets.spent,
            remaining: this.budgets.remaining,
            utilization: this.budgets.total > 0 ? (this.budgets.spent / this.budgets.total) * 100 : 0,
            agents: Object.fromEntries(this.budgets.agents),
            categories: Object.fromEntries(this.budgets.categories),
            timeframes: Object.fromEntries(this.budgets.timeframes),
            alerts: this.alerts.slice(-10), // Last 10 alerts
            lastUpdated: Date.now()
        };
    }
    
    /**
     * Predict future costs based on historical data
     */
    async predictCosts(timeframe = '7d', agents = null) {
        try {
            const predictions = {
                timeframe,
                timestamp: Date.now(),
                predictions: {},
                confidence: {},
                recommendations: []
            };
            
            // Get historical spending data
            const historicalData = await this.getHistoricalSpending(timeframe);
            
            // Predict costs for each agent/category
            const entities = agents || Array.from(this.budgets.agents.keys());
            
            for (const entity of entities) {
                const entityData = historicalData[entity] || [];
                
                if (entityData.length > 0) {
                    // Calculate daily average spending
                    const totalSpent = entityData.reduce((sum, record) => sum + record.amount, 0);
                    const days = (Date.now() - entityData[0].timestamp) / (1000 * 60 * 60 * 24);
                    const dailyAverage = totalSpent / Math.max(days, 1);
                    
                    // Predict future spending
                    const timeframes = {
                        '1d': 1,
                        '7d': 7,
                        '30d': 30,
                        '90d': 90
                    };
                    
                    const targetDays = timeframes[timeframe] || 7;
                    const predictedAmount = dailyAverage * targetDays;
                    
                    predictions.predictions[entity] = {
                        dailyAverage,
                        predictedAmount,
                        historicalTotal: totalSpent,
                        dataPoints: entityData.length
                    };
                    
                    // Calculate confidence based on data consistency
                    const variance = this.calculateSpendingVariance(entityData);
                    predictions.confidence[entity] = Math.max(0.1, 1 - variance);
                }
            }
            
            // Generate recommendations
            predictions.recommendations = this.generateCostRecommendations(predictions);
            
            // Save predictions
            await this.savePredictions(predictions);
            
            return predictions;
        } catch (error) {
            console.error('Failed to predict costs:', error);
            return null;
        }
    }
    
    /**
     * Optimize budget allocation automatically
     */
    async optimizeBudget() {
        try {
            if (!this.optimizationSettings.autoReallocate) {
                console.log('💰 Auto-reallocation is disabled');
                return false;
            }
            
            // Check reallocation cooldown
            const timeSinceLastReallocation = Date.now() - this.lastReallocation;
            if (timeSinceLastReallocation < this.optimizationSettings.reallocationCooldown) {
                console.log('💰 Reallocation on cooldown');
                return false;
            }
            
            // Check reallocation limit
            if (this.reallocationCount >= this.optimizationSettings.maxReallocationsPerHour) {
                console.log('💰 Reallocation limit reached');
                return false;
            }
            
            console.log('💰 Starting budget optimization...');
            
            // Get current performance data
            const performanceData = await this.getCurrentPerformance();
            
            // Identify underperforming and overperforming agents
            const agents = Array.from(this.budgets.agents.keys());
            const reallocationNeeded = [];
            
            for (const agent of agents) {
                const budget = this.budgets.agents.get(agent);
                const performance = performanceData[agent] || { efficiency: 0.5 };
                
                const utilization = budget.spent / budget.allocated;
                const efficiency = performance.efficiency;
                
                // Check if reallocation is needed
                const efficiencyGap = Math.abs(utilization - efficiency);
                if (efficiencyGap > this.optimizationSettings.reallocationThreshold) {
                    reallocationNeeded.push({
                        agent,
                        currentBudget: budget.allocated,
                        utilization,
                        efficiency,
                        gap: efficiencyGap
                    });
                }
            }
            
            if (reallocationNeeded.length === 0) {
                console.log('💰 No reallocation needed');
                return false;
            }
            
            // Perform reallocation
            const reallocation = await this.performReallocation(reallocationNeeded);
            
            // Update tracking
            this.lastReallocation = Date.now();
            this.reallocationCount++;
            this.reallocationHistory.push(reallocation);
            
            console.log(`✅ Budget optimization completed: ${reallocation.changes.length} changes made`);
            return reallocation;
        } catch (error) {
            console.error('Failed to optimize budget:', error);
            return false;
        }
    }
    
    /**
     * Perform budget reallocation
     */
    async performReallocation(reallocationNeeded) {
        const reallocation = {
            timestamp: Date.now(),
            changes: [],
            totalReallocated: 0
        };
        
        // Sort by efficiency gap (largest first)
        reallocationNeeded.sort((a, b) => b.gap - a.gap);
        
        // Calculate total budget to reallocate
        let totalToReallocate = 0;
        for (const item of reallocationNeeded) {
            const currentBudget = this.budgets.agents.get(item.agent).allocated;
            const optimalBudget = currentBudget * (item.efficiency / item.utilization);
            const reallocationAmount = Math.abs(currentBudget - optimalBudget);
            totalToReallocate += reallocationAmount;
        }
        
        // Perform reallocation
        for (const item of reallocationNeeded) {
            const currentBudget = this.budgets.agents.get(item.agent).allocated;
            const optimalBudget = currentBudget * (item.efficiency / item.utilization);
            const newBudget = Math.max(0, optimalBudget);
            
            const change = {
                agent: item.agent,
                oldBudget: currentBudget,
                newBudget: newBudget,
                change: newBudget - currentBudget,
                reason: `Efficiency optimization (${item.efficiency.toFixed(2)} vs ${item.utilization.toFixed(2)})`
            };
            
            // Update agent budget
            const agentBudget = this.budgets.agents.get(item.agent);
            agentBudget.allocated = newBudget;
            agentBudget.remaining = Math.max(0, newBudget - agentBudget.spent);
            this.budgets.agents.set(item.agent, agentBudget);
            
            reallocation.changes.push(change);
            reallocation.totalReallocated += Math.abs(change.change);
        }
        
        // Update total allocated amount
        this.budgets.allocated = Array.from(this.budgets.agents.values())
            .reduce((sum, budget) => sum + budget.allocated, 0);
        
        // Save budget configuration
        await this.saveBudgetConfig();
        
        return reallocation;
    }
    
    /**
     * Set alert thresholds
     */
    setAlertThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
        console.log('💰 Budget alert thresholds updated');
    }
    
    /**
     * Get comprehensive spending report
     */
    async getSpendingReport(timeRange = '30d', format = 'json') {
        try {
            const report = {
                timestamp: Date.now(),
                timeRange,
                summary: {},
                details: {},
                trends: {},
                recommendations: []
            };
            
            // Get spending data for the time range
            const spendingData = await this.getHistoricalSpending(timeRange);
            
            // Generate summary
            report.summary = this.generateSpendingSummary(spendingData);
            
            // Generate detailed breakdown
            report.details = this.generateSpendingDetails(spendingData);
            
            // Generate trends
            report.trends = await this.generateSpendingTrends(spendingData);
            
            // Generate recommendations
            report.recommendations = this.generateSpendingRecommendations(report);
            
            // Export if requested
            if (format !== 'json') {
                return await this.exportSpendingReport(report, format);
            }
            
            return report;
        } catch (error) {
            console.error('Failed to generate spending report:', error);
            return null;
        }
    }
    
    /**
     * Export budget data
     */
    async exportBudgetData(format = 'json') {
        try {
            const data = {
                budget: this.getBudgetStatus(),
                history: Object.fromEntries(this.costHistory),
                predictions: this.costPredictions,
                alerts: this.alerts,
                reallocations: this.reallocationHistory
            };
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            switch (format.toLowerCase()) {
                case 'json':
                    const jsonPath = path.join(this.budgetPath, `export_${timestamp}.json`);
                    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
                    return jsonPath;
                    
                case 'csv':
                    const csvPath = path.join(this.budgetPath, `export_${timestamp}.csv`);
                    const csvData = this.convertBudgetToCSV(data);
                    await fs.writeFile(csvPath, csvData);
                    return csvPath;
                    
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            console.error('Failed to export budget data:', error);
            return null;
        }
    }
    
    // Utility methods
    
    async updateBudgetStatus() {
        try {
            // Update remaining amounts
            this.budgets.remaining = Math.max(0, this.budgets.total - this.budgets.spent);
            
            for (const [agentId, budget] of this.budgets.agents.entries()) {
                budget.remaining = Math.max(0, budget.allocated - budget.spent);
                this.budgets.agents.set(agentId, budget);
            }
            
            // Save current status
            await this.saveBudgetConfig();
            
        } catch (error) {
            console.error('Failed to update budget status:', error);
        }
    }
    
    async saveBudgetConfig() {
        try {
            const config = {
                total: this.budgets.total,
                allocated: this.budgets.allocated,
                spent: this.budgets.spent,
                remaining: this.budgets.remaining,
                agents: Object.fromEntries(this.budgets.agents),
                categories: Object.fromEntries(this.budgets.categories),
                timeframes: Object.fromEntries(this.budgets.timeframes),
                lastUpdated: Date.now()
            };
            
            const configPath = path.join(this.budgetPath, 'config.json');
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('Failed to save budget config:', error);
        }
    }
    
    async saveSpendingRecord(record) {
        try {
            const date = new Date(record.timestamp);
            const dateStr = date.toISOString().split('T')[0];
            const historyPath = path.join(this.budgetPath, 'history', `${dateStr}.json`);
            
            let history = {};
            try {
                const data = await fs.readFile(historyPath, 'utf8');
                history = JSON.parse(data);
            } catch (error) {
                // File doesn't exist, start with empty object
            }
            
            const key = `${record.agentId}_${record.category}`;
            if (!history[key]) {
                history[key] = [];
            }
            
            history[key].push(record);
            
            await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
        } catch (error) {
            console.error('Failed to save spending record:', error);
        }
    }
    
    async saveAlert(alert) {
        try {
            const alertsPath = path.join(this.budgetPath, 'alerts', `alerts_${Date.now()}.json`);
            await fs.writeFile(alertsPath, JSON.stringify(alert, null, 2));
        } catch (error) {
            console.error('Failed to save alert:', error);
        }
    }
    
    async savePredictions(predictions) {
        try {
            const predictionsPath = path.join(this.budgetPath, 'predictions', `predictions_${Date.now()}.json`);
            await fs.writeFile(predictionsPath, JSON.stringify(predictions, null, 2));
        } catch (error) {
            console.error('Failed to save predictions:', error);
        }
    }
    
    async getHistoricalSpending(timeRange) {
        const spendingData = {};
        const endTime = Date.now();
        const startTime = endTime - this.getTimeRangeMs(timeRange);
        
        // Collect spending data from history files
        for (const [key, records] of this.costHistory.entries()) {
            const filteredRecords = records.filter(record => 
                record.timestamp >= startTime && record.timestamp <= endTime
            );
            
            if (filteredRecords.length > 0) {
                spendingData[key] = filteredRecords;
            }
        }
        
        return spendingData;
    }
    
    async getHistoricalPerformance(agents) {
        // This would typically integrate with the performance monitoring system
        // For now, return simulated performance data
        const performance = {};
        
        for (const agent of agents) {
            performance[agent] = {
                success: 0.7 + Math.random() * 0.3,
                efficiency: 0.6 + Math.random() * 0.4,
                cost: 0.3 + Math.random() * 0.4
            };
        }
        
        return performance;
    }
    
    async getCurrentPerformance() {
        // This would integrate with real performance monitoring
        // For now, return simulated data
        const performance = {};
        
        for (const [agentId] of this.budgets.agents.entries()) {
            performance[agentId] = {
                efficiency: 0.5 + Math.random() * 0.5,
                success: 0.6 + Math.random() * 0.4,
                cost: 0.2 + Math.random() * 0.6
            };
        }
        
        return performance;
    }
    
    calculateSpendingVariance(spendingData) {
        if (spendingData.length < 2) return 0;
        
        const amounts = spendingData.map(record => record.amount);
        const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
        
        return variance / (mean * mean); // Coefficient of variation
    }
    
    generateCostRecommendations(predictions) {
        const recommendations = [];
        
        for (const [entity, prediction] of Object.entries(predictions.predictions)) {
            const confidence = predictions.confidence[entity];
            
            if (confidence < 0.5) {
                recommendations.push({
                    type: 'data',
                    entity,
                    message: `Low confidence in predictions for ${entity}`,
                    suggestion: 'Collect more spending data for better predictions'
                });
            }
            
            if (prediction.predictedAmount > prediction.historicalTotal * 2) {
                recommendations.push({
                    type: 'spending',
                    entity,
                    message: `Predicted spending increase for ${entity}`,
                    suggestion: 'Review spending patterns and consider budget adjustments'
                });
            }
        }
        
        return recommendations;
    }
    
    generateSpendingSummary(spendingData) {
        const summary = {
            totalSpent: 0,
            totalTransactions: 0,
            byAgent: {},
            byCategory: {},
            averageTransaction: 0
        };
        
        for (const [key, records] of Object.entries(spendingData)) {
            const [agentId, category] = key.split('_');
            const total = records.reduce((sum, record) => sum + record.amount, 0);
            
            summary.totalSpent += total;
            summary.totalTransactions += records.length;
            
            if (!summary.byAgent[agentId]) {
                summary.byAgent[agentId] = { total: 0, transactions: 0 };
            }
            summary.byAgent[agentId].total += total;
            summary.byAgent[agentId].transactions += records.length;
            
            if (!summary.byCategory[category]) {
                summary.byCategory[category] = { total: 0, transactions: 0 };
            }
            summary.byCategory[category].total += total;
            summary.byCategory[category].transactions += records.length;
        }
        
        summary.averageTransaction = summary.totalTransactions > 0 ? 
            summary.totalSpent / summary.totalTransactions : 0;
        
        return summary;
    }
    
    generateSpendingDetails(spendingData) {
        return {
            dailyBreakdown: this.generateDailyBreakdown(spendingData),
            agentBreakdown: this.generateAgentBreakdown(spendingData),
            categoryBreakdown: this.generateCategoryBreakdown(spendingData)
        };
    }
    
    async generateSpendingTrends(spendingData) {
        // Generate spending trends over time
        const trends = {
            daily: {},
            weekly: {},
            monthly: {}
        };
        
        // This would implement trend analysis logic
        // For now, return basic structure
        
        return trends;
    }
    
    generateSpendingRecommendations(report) {
        const recommendations = [];
        
        // Analyze spending patterns and generate recommendations
        const summary = report.summary;
        
        if (summary.averageTransaction > 100) {
            recommendations.push({
                type: 'cost',
                priority: 'medium',
                message: 'High average transaction cost detected',
                suggestion: 'Review large transactions and consider cost optimization'
            });
        }
        
        // Add more recommendation logic based on spending patterns
        
        return recommendations;
    }
    
    async exportSpendingReport(report, format) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        switch (format.toLowerCase()) {
            case 'csv':
                const csvPath = path.join(this.budgetPath, 'reports', `spending_${timestamp}.csv`);
                const csvData = this.convertSpendingToCSV(report);
                await fs.writeFile(csvPath, csvData);
                return csvPath;
                
            case 'html':
                const htmlPath = path.join(this.budgetPath, 'reports', `spending_${timestamp}.html`);
                const htmlData = this.convertSpendingToHTML(report);
                await fs.writeFile(htmlPath, htmlData);
                return htmlPath;
                
            default:
                return report;
        }
    }
    
    getTimeRangeMs(timeRange) {
        const ranges = {
            '1d': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000
        };
        
        return ranges[timeRange] || ranges['30d'];
    }
    
    convertBudgetToCSV(data) {
        let csv = 'Type,Agent,Allocated,Spent,Remaining,Utilization\n';
        
        // Add agent budgets
        for (const [agentId, budget] of Object.entries(data.budget.agents)) {
            const utilization = budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0;
            csv += `Agent,${agentId},${budget.allocated},${budget.spent},${budget.remaining},${utilization.toFixed(2)}%\n`;
        }
        
        return csv;
    }
    
    convertSpendingToCSV(report) {
        let csv = 'Agent,Category,Amount,Timestamp\n';
        
        for (const [key, records] of Object.entries(report.details)) {
            for (const record of records) {
                csv += `${record.agentId},${record.category},${record.amount},${new Date(record.timestamp).toISOString()}\n`;
            }
        }
        
        return csv;
    }
    
    convertSpendingToHTML(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Spending Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Spending Report</h1>
    <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
    
    <h2>Summary</h2>
    <p>Total Spent: $${report.summary.totalSpent.toFixed(2)}</p>
    <p>Total Transactions: ${report.summary.totalTransactions}</p>
    <p>Average Transaction: $${report.summary.averageTransaction.toFixed(2)}</p>
</body>
</html>`;
    }
    
    generateDailyBreakdown(spendingData) {
        // Generate daily spending breakdown
        return {};
    }
    
    generateAgentBreakdown(spendingData) {
        // Generate agent spending breakdown
        return {};
    }
    
    generateCategoryBreakdown(spendingData) {
        // Generate category spending breakdown
        return {};
    }
}

module.exports = DynamicBudgetManager; 