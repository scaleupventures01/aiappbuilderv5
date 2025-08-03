/**
 * ConfigurationManager.js
 * Centralized configuration management for Team Leader System v4.0
 * Eliminates duplicate JSON loading and provides consistent config access
 */

const fs = require('fs').promises;
const path = require('path');

class ConfigurationManager {
    static instance = null;
    
    constructor() {
        this.configs = new Map();
        this.configPaths = {
            models: '.teamleader/models.json',
            pricing: '.teamleader/pricing-cache.json',
            assignments: 'agents/configurations/model-assignments.json'
        };
        this.loaded = false;
    }
    
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }
    
    /**
     * Load all configuration files
     */
    async loadAllConfigs() {
        if (this.loaded) return;
        
        try {
            console.log('📋 Loading configuration files...');
            
            for (const [key, configPath] of Object.entries(this.configPaths)) {
                try {
                    const fullPath = path.join(process.cwd(), configPath);
                    const data = await fs.readFile(fullPath, 'utf8');
                    this.configs.set(key, JSON.parse(data));
                    console.log(`✅ Loaded ${key} configuration`);
                } catch (error) {
                    console.warn(`⚠️ Failed to load ${key} config: ${error.message}`);
                    this.configs.set(key, {});
                }
            }
            
            this.loaded = true;
            console.log('✅ All configurations loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load configurations:', error);
            throw error;
        }
    }
    
    /**
     * Get model assignments configuration
     */
    getModelAssignments() {
        return this.configs.get('assignments') || {};
    }
    
    /**
     * Get model configurations
     */
    getModelConfigs() {
        return this.configs.get('models') || {};
    }
    
    /**
     * Get pricing cache
     */
    getPricingCache() {
        return this.configs.get('pricing') || {};
    }
    
    /**
     * Get specific model configuration
     */
    getModelConfig(modelId) {
        const models = this.getModelConfigs();
        return models.models?.[modelId] || null;
    }
    
    /**
     * Get agent assignment for specific agent type
     */
    getAgentAssignment(agentType) {
        const assignments = this.getModelAssignments();
        return assignments.assignments?.[agentType] || null;
    }
    
    /**
     * Get pricing for specific model
     */
    getModelPricing(modelId) {
        const pricing = this.getPricingCache();
        return pricing.models?.[modelId] || null;
    }
    
    /**
     * Get fallback chain for model
     */
    getFallbackChain(modelId) {
        const models = this.getModelConfigs();
        return models.fallbacks?.[modelId] || [];
    }
    
    /**
     * Reload all configurations
     */
    async reload() {
        this.loaded = false;
        this.configs.clear();
        await this.loadAllConfigs();
    }
    
    /**
     * Get all available agent types
     */
    getAgentTypes() {
        const assignments = this.getModelAssignments();
        return Object.keys(assignments.assignments || {});
    }
    
    /**
     * Get all available model IDs
     */
    getModelIds() {
        const models = this.getModelConfigs();
        return Object.keys(models.models || {});
    }
    
    /**
     * Validate configuration integrity
     */
    validateConfigs() {
        const issues = [];
        
        // Check if all required configs are loaded
        for (const [key, config] of this.configs.entries()) {
            if (!config || Object.keys(config).length === 0) {
                issues.push(`Empty or missing ${key} configuration`);
            }
        }
        
        // Validate model assignments reference valid models
        const assignments = this.getModelAssignments();
        const models = this.getModelConfigs();
        
        for (const [agentType, assignment] of Object.entries(assignments.assignments || {})) {
            const allModels = [
                ...(assignment.optimized?.models || []),
                ...(assignment.fallback?.models || [])
            ];
            
            for (const modelId of allModels) {
                if (!models.models?.[modelId]) {
                    issues.push(`Agent ${agentType} references unknown model: ${modelId}`);
                }
            }
        }
        
        return {
            valid: issues.length === 0,
            issues
        };
    }
}

module.exports = ConfigurationManager; 