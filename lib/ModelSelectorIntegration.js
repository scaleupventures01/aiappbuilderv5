// Model Selection Integration for Team Leader System - UPDATED
const ConfigurationManager = require('./config/ConfigurationManager');
const Logger = require('./utils/Logger');

class ModelSelector {
    constructor() {
        this.configManager = ConfigurationManager.getInstance();
        this.logger = new Logger().child({ component: 'ModelSelector' });
        
        this.usage = new Map();
        this.availability = new Map();
        
        this.initialize();
    }
    
    /**
     * Initialize the model selector
     */
    async initialize() {
        try {
            await this.configManager.loadAllConfigs();
            
            // Initialize all models as available
            const modelIds = this.configManager.getModelIds();
            modelIds.forEach(modelId => {
                this.availability.set(modelId, true);
            });
            
            this.logger.info('ModelSelector initialized', { modelCount: modelIds.length });
        } catch (error) {
            this.logger.error('Failed to initialize ModelSelector', error);
            throw error;
        }
    }
    
    /**
     * Select the best model for an agent based on type and current conditions
     */
    selectModel(options) {
        const {
            agentType,
            taskComplexity = 'medium',
            prioritizeSpeed = false,
            budgetMode = false,
            useFallback = false
        } = options;
        
        // Get assignment for this agent type
        const assignment = this.configManager.getAgentAssignment(agentType);
        if (!assignment) {
            this.logger.warn(`No assignment found for agent type: ${agentType}`);
            return this.getDefaultModel();
        }
        
        // Choose between optimized and fallback models
        const modelSet = useFallback ? assignment.fallback : assignment.optimized;
        
        // Select model based on ratio
        const modelId = this.selectByRatio(modelSet.models, modelSet.ratio, agentType);
        
        // Check availability and get fallback if needed
        const finalModelId = this.ensureAvailability(modelId, agentType);
        
        const model = this.configManager.getModelConfig(finalModelId);
        
        return {
            modelId: finalModelId,
            model: model,
            reasoning: this.generateReasoning(finalModelId, model, agentType, assignment),
            costEstimate: this.estimateCost(finalModelId, assignment.tokens)
        };
    }
    
    /**
     * Select model based on configured ratio
     */
    selectByRatio(models, ratios, agentType) {
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < models.length; i++) {
            cumulative += ratios[i];
            if (random <= cumulative) {
                return models[i];
            }
        }
        
        return models[0]; // Default to first model
    }
    
    /**
     * Ensure selected model is available, otherwise use fallback
     */
    ensureAvailability(modelId, agentType) {
        if (this.availability.get(modelId)) {
            return modelId;
        }
        
        // Get fallback chain
        const fallbacks = this.configManager.getFallbackChain(modelId);
        
        for (const fallbackId of fallbacks) {
            if (this.availability.get(fallbackId)) {
                this.logger.info(`Using fallback ${fallbackId} for ${modelId} (${agentType})`);
                return fallbackId;
            }
        }
        
        // Last resort - use Sonnet 4
        this.logger.warn(`All fallbacks exhausted for ${modelId}, using Sonnet 4`);
        return 'sonnet-4';
    }
    
    /**
     * Generate reasoning for model selection
     */
    generateReasoning(modelId, model, agentType, assignment) {
        const reasons = [];
        
        reasons.push(`Selected ${model.name} for ${assignment.name} tasks`);
        
        if (assignment.complexity === 'high' && model.capabilities.includes('complex-reasoning')) {
            reasons.push('Model has complex reasoning capabilities for high-complexity tasks');
        }
        
        if (assignment.tokens > 1000000 && model.contextWindow >= 1000000) {
            reasons.push('Large context window supports high token volume');
        }
        
        const costPer1M = assignment.optimized.costPer1M;
        if (costPer1M < 10) {
            reasons.push(`Cost-optimized at $${costPer1M} per 1M tokens`);
        }
        
        if (model.speed === 'fastest' || model.speed === 'very_fast') {
            reasons.push('Fast processing for rapid iteration');
        }
        
        return reasons.join('; ');
    }
    
    /**
     * Update model availability based on API status
     */
    updateAvailability(modelId, isAvailable) {
        this.availability.set(modelId, isAvailable);
        this.logger.info(`Model ${modelId} availability updated to: ${isAvailable}`);
    }
    
    /**
     * Estimate cost for a task
     */
    estimateCost(modelId, estimatedTokens) {
        const model = this.configManager.getModelConfig(modelId);
        if (!model) {
            this.logger.warn(`Unknown model: ${modelId}`);
            return { error: 'Model not found' };
        }
        
        // Use rough 60/40 split for input/output
        const inputTokens = estimatedTokens * 0.6;
        const outputTokens = estimatedTokens * 0.4;
        
        const inputCost = (inputTokens / 1000000) * model.costPerMillion.input;
        const outputCost = (outputTokens / 1000000) * model.costPerMillion.output;
        
        return {
            model: model.name,
            inputCost,
            outputCost,
            totalCost: inputCost + outputCost,
            costPerMillion: model.costPerMillion
        };
    }
    
    /**
     * Get cost comparison between optimized and fallback
     */
    getCostComparison(agentType) {
        const assignment = this.configManager.getAgentAssignment(agentType);
        if (!assignment) return null;
        
        return {
            agentType: assignment.name,
            optimizedCost: assignment.optimized.costPer1M,
            fallbackCost: assignment.fallback.costPer1M,
            savings: assignment.fallback.costPer1M - assignment.optimized.costPer1M,
            savingsPercent: ((assignment.fallback.costPer1M - assignment.optimized.costPer1M) / assignment.fallback.costPer1M * 100).toFixed(1)
        };
    }
    
    /**
     * Get overall cost summary
     */
    getCostSummary() {
        const assignments = this.configManager.getModelAssignments();
        const totals = assignments.totals || {};
        
        return {
            optimizedTotal: `$${totals.optimized?.totalCost || 0}`,
            fallbackTotal: `$${totals.fallback?.totalCost || 0}`,
            totalSavings: `$${totals.savings?.amount || 0}`,
            savingsPercentage: `${totals.savings?.percentage || 0}%`,
            tokensProcessed: (totals.optimized?.totalTokens || 0).toLocaleString()
        };
    }
    
    /**
     * Get default model for unknown agent types
     */
    getDefaultModel() {
        return {
            modelId: 'sonnet-4',
            model: this.configManager.getModelConfig('sonnet-4'),
            reasoning: 'Default model for unspecified agent type',
            costEstimate: this.estimateCost('sonnet-4', 100000)
        };
    }
}

module.exports = ModelSelector;
