/**
 * ModelManager.js
 * Centralized model management for Team Leader System v4.0
 * Resolves circular dependencies between ModelSelector and MultiModelAPIManager
 */

const ConfigurationManager = require('../config/ConfigurationManager');
const Logger = require('../utils/Logger');

class ModelManager {
    constructor() {
        this.configManager = ConfigurationManager.getInstance();
        this.logger = new Logger().child({ component: 'ModelManager' });
        
        // Lazy initialization of components
        this._modelSelector = null;
        this._apiManager = null;
        this._initialized = false;
    }
    
    /**
     * Initialize the model manager
     */
    async initialize() {
        if (this._initialized) return;
        
        try {
            this.logger.info('Initializing ModelManager...');
            
            // Load configurations
            await this.configManager.loadAllConfigs();
            
            // Validate configurations
            const validation = this.configManager.validateConfigs();
            if (!validation.valid) {
                this.logger.warn('Configuration validation issues:', { issues: validation.issues });
            }
            
            this._initialized = true;
            this.logger.info('ModelManager initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize ModelManager', error);
            throw error;
        }
    }
    
    /**
     * Get ModelSelector instance (lazy loaded)
     */
    get modelSelector() {
        if (!this._modelSelector) {
            const ModelSelector = require('../ModelSelectorIntegration');
            this._modelSelector = new ModelSelector();
            this.logger.debug('ModelSelector instance created');
        }
        return this._modelSelector;
    }
    
    /**
     * Get MultiModelAPIManager instance (lazy loaded)
     */
    get apiManager() {
        if (!this._apiManager) {
            const MultiModelAPIManager = require('../MultiModelAPIManager');
            this._apiManager = new MultiModelAPIManager();
            this.logger.debug('MultiModelAPIManager instance created');
        }
        return this._apiManager;
    }
    
    /**
     * Select model for agent
     */
    async selectModel(options) {
        await this.initialize();
        return this.modelSelector.selectModel(options);
    }
    
    /**
     * Send completion request
     */
    async complete(options) {
        await this.initialize();
        return this.apiManager.complete(options);
    }
    
    /**
     * Get model configuration
     */
    getModelConfig(modelId) {
        return this.configManager.getModelConfig(modelId);
    }
    
    /**
     * Get agent assignment
     */
    getAgentAssignment(agentType) {
        return this.configManager.getAgentAssignment(agentType);
    }
    
    /**
     * Get model pricing
     */
    getModelPricing(modelId) {
        return this.configManager.getModelPricing(modelId);
    }
    
    /**
     * Get all available models
     */
    getAvailableModels() {
        return this.configManager.getModelIds();
    }
    
    /**
     * Get all available agent types
     */
    getAvailableAgentTypes() {
        return this.configManager.getAgentTypes();
    }
    
    /**
     * Check if model is available
     */
    isModelAvailable(modelId) {
        const config = this.getModelConfig(modelId);
        return config !== null;
    }
    
    /**
     * Get fallback chain for model
     */
    getFallbackChain(modelId) {
        const config = this.getModelConfig(modelId);
        return config?.fallbacks || [];
    }
    
    /**
     * Estimate cost for model and tokens
     */
    estimateCost(modelId, inputTokens, outputTokens = 0) {
        const config = this.getModelConfig(modelId);
        if (!config) return 0;
        
        const inputCost = (inputTokens / 1000000) * config.costPerMillion.input;
        const outputCost = (outputTokens / 1000000) * config.costPerMillion.output;
        
        return inputCost + outputCost;
    }
    
    /**
     * Get cost comparison for agent type
     */
    getCostComparison(agentType) {
        const assignment = this.getAgentAssignment(agentType);
        if (!assignment) return null;
        
        const comparison = {
            agentType,
            optimized: {},
            fallback: {},
            recommendations: []
        };
        
        // Calculate optimized costs
        if (assignment.optimized) {
            comparison.optimized = this.calculateModelSetCosts(
                assignment.optimized.models,
                assignment.tokens
            );
        }
        
        // Calculate fallback costs
        if (assignment.fallback) {
            comparison.fallback = this.calculateModelSetCosts(
                assignment.fallback.models,
                assignment.tokens
            );
        }
        
        // Generate recommendations
        comparison.recommendations = this.generateCostRecommendations(comparison);
        
        return comparison;
    }
    
    /**
     * Calculate costs for a set of models
     */
    calculateModelSetCosts(models, tokens) {
        const costs = models.map(modelId => {
            const cost = this.estimateCost(modelId, tokens.input, tokens.output);
            const config = this.getModelConfig(modelId);
            
            return {
                modelId,
                modelName: config?.name || modelId,
                cost,
                costPerToken: cost / (tokens.input + tokens.output),
                speed: config?.speed || 'medium'
            };
        });
        
        return {
            models: costs,
            totalCost: costs.reduce((sum, model) => sum + model.cost, 0),
            averageCost: costs.reduce((sum, model) => sum + model.cost, 0) / costs.length
        };
    }
    
    /**
     * Generate cost optimization recommendations
     */
    generateCostRecommendations(comparison) {
        const recommendations = [];
        
        if (comparison.optimized && comparison.fallback) {
            const costDiff = comparison.fallback.totalCost - comparison.optimized.totalCost;
            const savingsPercent = (costDiff / comparison.fallback.totalCost) * 100;
            
            if (savingsPercent > 20) {
                recommendations.push({
                    type: 'cost_savings',
                    message: `Using optimized models can save ${savingsPercent.toFixed(1)}% on costs`,
                    impact: 'high',
                    action: 'Use optimized model set'
                });
            }
        }
        
        // Find cheapest model
        const allModels = [
            ...(comparison.optimized?.models || []),
            ...(comparison.fallback?.models || [])
        ];
        
        if (allModels.length > 0) {
            const cheapest = allModels.reduce((min, model) => 
                model.cost < min.cost ? model : min
            );
            
            recommendations.push({
                type: 'cost_optimization',
                message: `${cheapest.modelName} is the most cost-effective option`,
                impact: 'medium',
                action: `Consider using ${cheapest.modelId} for cost-sensitive tasks`
            });
        }
        
        return recommendations;
    }
    
    /**
     * Validate model selection
     */
    validateModelSelection(modelId, agentType) {
        const assignment = this.getAgentAssignment(agentType);
        if (!assignment) {
            return { valid: false, reason: `No assignment found for agent type: ${agentType}` };
        }
        
        const allModels = [
            ...(assignment.optimized?.models || []),
            ...(assignment.fallback?.models || [])
        ];
        
        if (!allModels.includes(modelId)) {
            return { 
                valid: false, 
                reason: `Model ${modelId} not assigned to agent type ${agentType}` 
            };
        }
        
        const config = this.getModelConfig(modelId);
        if (!config) {
            return { valid: false, reason: `Model ${modelId} not found in configuration` };
        }
        
        return { valid: true };
    }
    
    /**
     * Get system health status
     */
    async getHealthStatus() {
        await this.initialize();
        
        const status = {
            initialized: this._initialized,
            configValid: false,
            modelSelector: false,
            apiManager: false,
            issues: []
        };
        
        try {
            // Check configuration
            const validation = this.configManager.validateConfigs();
            status.configValid = validation.valid;
            if (!validation.valid) {
                status.issues.push(...validation.issues);
            }
            
            // Check model selector
            try {
                const testSelection = this.modelSelector.selectModel({ agentType: 'requirements' });
                status.modelSelector = true;
            } catch (error) {
                status.issues.push(`ModelSelector error: ${error.message}`);
            }
            
            // Check API manager
            try {
                await this.apiManager.checkProviderHealth();
                status.apiManager = true;
            } catch (error) {
                status.issues.push(`API Manager error: ${error.message}`);
            }
            
        } catch (error) {
            status.issues.push(`Health check error: ${error.message}`);
        }
        
        return status;
    }
    
    /**
     * Reload configurations
     */
    async reload() {
        this.logger.info('Reloading configurations...');
        await this.configManager.reload();
        this.logger.info('Configurations reloaded successfully');
    }
}

// Create singleton instance
const modelManager = new ModelManager();

module.exports = ModelManager;
module.exports.default = modelManager; 