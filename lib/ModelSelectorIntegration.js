// model_selector_mcp_integration.js - Enhanced Model Selection with MCP Support

/**
 * Enhanced Model Selector with MCP Integration
 * Maintains all existing model selection logic while adding MCP execution support
 */

class EnhancedModelSelector {
    constructor() {
        this.models = {};
        this.fallbacks = {};
        this.usageStats = {};
        this.loadModels();
        this.initializeProperties();
    }
    
    /**
     * Load models from external models.json file
     */
    loadModels() {
        try {
            const fs = require('fs');
            const path = require('path');
            const modelsPath = path.join(__dirname, '..', '.teamleader', 'models.json');
            
            if (fs.existsSync(modelsPath)) {
                const modelsData = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));
                this.models = modelsData.models;
                this.fallbacks = modelsData.fallbacks;
                console.log(`✅ Loaded ${Object.keys(this.models).length} models from models.json`);
            } else {
                console.warn('⚠️  models.json not found, using default models');
                this.loadDefaultModels();
            }
        } catch (error) {
            console.error('❌ Error loading models.json:', error.message);
            console.log('📋 Falling back to default models');
            this.loadDefaultModels();
        }
    }
    
    /**
     * Load default models if models.json is not available
     */
    loadDefaultModels() {
        this.models = {
            // Default models as fallback
            "flash-lite": {
                id: "gemini-1.5-flash-8b",
                name: "Gemini 2.5 Flash-Lite",
                provider: "google",
                contextWindow: 1000000,
                costPerMillion: { input: 0.075, output: 0.3 },
                speed: "fastest",
                capabilities: ["text-generation", "high-volume", "basic-reasoning"]
            },
            "flash": {
                id: "gemini-1.5-flash",
                name: "Gemini 2.5 Flash",
                provider: "google",
                contextWindow: 1000000,
                costPerMillion: { input: 0.375, output: 1.5 },
                speed: "very_fast",
                capabilities: ["text-generation", "multimodal", "reasoning", "code-generation"]
            },
            "gpt-4-nano": {
                id: "gpt-4.1-nano",
                name: "GPT-4.1 nano",
                provider: "openai",
                contextWindow: 128000,
                costPerMillion: { input: 0.1, output: 0.4 },
                speed: "fastest",
                capabilities: ["text-generation", "basic-reasoning"]
            },
            "sonnet-4": {
                id: "claude-3-sonnet-20240229",
                name: "Claude Sonnet 4",
                provider: "anthropic",
                contextWindow: 200000,
                costPerMillion: { input: 3.0, output: 15.0 },
                speed: "fast",
                capabilities: ["text-generation", "reasoning", "code-generation"]
            }
        };
        
        this.fallbacks = {
            "flash-lite": ["flash", "gpt-4-nano", "sonnet-4"],
            "flash": ["gpt-4-nano", "sonnet-4"],
            "gpt-4-nano": ["flash-lite", "sonnet-4"],
            "sonnet-4": ["flash", "gpt-4-nano"]
        };
    }
    
    /**
     * Initialize role recommendations and other properties
     */
    initializeProperties() {
        // Role-based recommendations using new model names
        this.roleRecommendations = {
            "team-leader": {
                senior: { default: "opus-4", budget: "sonnet-4", legacy: "claude-37" },
                junior: { default: "sonnet-4", budget: "gemini-pro", legacy: "flash" }
            },
            "requirements-analyst": {
                senior: { default: "sonnet-4", budget: "gemini-pro", legacy: "claude-37" },
                junior: { default: "gemini-pro", budget: "flash", legacy: "flash-lite" }
            },
            "architect": {
                senior: { default: "opus-4", budget: "sonnet-4", legacy: "o3" },
                junior: { default: "sonnet-4", budget: "gpt-4o", legacy: "claude-37" }
            },
            "database-engineer": {
                senior: { default: "sonnet-4", budget: "gpt-4o", legacy: "claude-37" },
                junior: { default: "gpt-4o", budget: "gpt-4-mini", legacy: "flash-lite" }
            },
            "security-engineer": {
                senior: { default: "o3", budget: "opus-4", legacy: "sonnet-4" },
                junior: { default: "sonnet-4", budget: "gpt-4o", legacy: "claude-37" }
            },
            "design-lead": {
                senior: { default: "sonnet-4", budget: "gpt-4o", legacy: "claude-37" },
                junior: { default: "gpt-4o", budget: "gemini-pro", legacy: "flash" }
            },
            "content-strategist": {
                senior: { default: "gpt-4o", budget: "gemini-pro", legacy: "claude-37" },
                junior: { default: "flash", budget: "flash-lite", legacy: "gpt-4-nano" }
            },
            "ml-engineer": {
                senior: { default: "o3", budget: "opus-4", legacy: "sonnet-4" },
                junior: { default: "gpt-4-mini", budget: "flash", legacy: "flash-lite" }
            },
            "integration-architect": {
                senior: { default: "sonnet-4", budget: "gpt-4o", legacy: "claude-37" },
                junior: { default: "gemini-pro", budget: "flash", legacy: "flash-lite" }
            },
            "developer": {
                senior: { default: "opus-4", budget: "sonnet-4", legacy: "o3" },
                junior: { default: "sonnet-4", budget: "gemini-pro", legacy: "claude-37" }
            },
            "validator": {
                senior: { default: "sonnet-4", budget: "gpt-4o", legacy: "claude-37" },
                junior: { default: "gpt-4o", budget: "gpt-4-mini", legacy: "flash-lite" }
            }
        };
        
        // Complexity factors
        this.complexityFactors = {
            "simple_task": 0.5,
            "repetitive_task": 0.4,
            "content_creation": 0.6,
            "general_development": 1.0,
            "code_review": 1.2,
            "integration_design": 1.3,
            "complex_algorithm": 1.4,
            "security_review": 1.5,
            "architecture_decision": 1.6,
            "critical_path": 1.8
        };
        
        // Usage tracking
        this.usage = new Map();
    }
    
    /**
     * Main model selection method - remains unchanged
     */
    selectModel(params) {
        const {
            agentType,
            seniority = 'junior',
            taskComplexity = 'general',
            prioritizeSpeed = false,
            budgetMode = false,
            useLegacy = false
        } = params;
        
        // Get base recommendation
        const recommendations = this.roleRecommendations[agentType];
        if (!recommendations || !recommendations[seniority.toLowerCase()]) {
            return this.getDefaultModel(seniority, taskComplexity);
        }
        
        // Select recommendation tier
        let tier = 'default';
        if (useLegacy) tier = 'legacy';
        else if (budgetMode) tier = 'budget';
        
        let modelId = recommendations[seniority.toLowerCase()][tier];
        
        // Handle o3 fallback (since it's not yet available)
        if (modelId === 'o3' && !this.isModelAvailable('o3')) {
            modelId = 'opus-4';
        }
        
        // Adjust based on task complexity
        modelId = this.adjustForComplexity(modelId, taskComplexity);
        
        // Adjust for speed preference
        if (prioritizeSpeed) {
            modelId = this.adjustForSpeed(modelId);
        }
        
        // Get model details
        const model = this.models[modelId];
        
        // Track usage
        this.trackUsage(agentType, modelId);
        
        return {
            modelId,
            model,
            reasoning: this.explainSelection(agentType, seniority, taskComplexity, modelId)
        };
    }
    
    // All other methods remain the same...
    getDefaultModel(seniority, taskComplexity) {
        if (seniority === 'senior') {
            return taskComplexity === 'critical' ? 
                'opus-4' : 'sonnet-4';
        } else {
            return taskComplexity === 'simple' ? 
                'flash' : 'gemini-pro';
        }
    }
    
    adjustForComplexity(modelId, taskComplexity) {
        const complexityScore = this.complexityFactors[taskComplexity] || 1.0;
        
        if (complexityScore >= 1.4 && !this.isPremiumModel(modelId)) {
            return 'opus-4';
        }
        
        if (complexityScore <= 0.6 && this.isPremiumModel(modelId)) {
            return 'flash';
        }
        
        return modelId;
    }
    
    adjustForSpeed(modelId) {
        const speedMap = {
            'opus-4': 'sonnet-4',
            'sonnet-4': 'gemini-pro',
            'gpt-4o': 'gpt-4-mini',
            'gemini-pro': 'flash',
            'flash': 'flash-lite'
        };
        
        return speedMap[modelId] || modelId;
    }
    
    isPremiumModel(modelId) {
        const model = this.models[modelId];
        return model && (model.tier === 'premium' || model.tier === 'ultra_premium');
    }
    
    isModelAvailable(modelId) {
        return modelId !== 'o3';
    }
    
    explainSelection(agentType, seniority, taskComplexity, modelId) {
        const model = this.models[modelId];
        const reasons = [];
        
        reasons.push(`${seniority} ${agentType} typically uses ${model.tier} tier models`);
        
        if (taskComplexity === 'critical' || taskComplexity === 'architecture_decision') {
            reasons.push('Critical task requires highest quality model');
        } else if (taskComplexity === 'simple_task' || taskComplexity === 'repetitive_task') {
            reasons.push('Simple task allows for efficient model usage');
        }
        
        if (model.capabilities.includes('complex_reasoning')) {
            reasons.push('Selected for complex reasoning capabilities');
        }
        if (model.speed === 'fastest' || model.speed === 'very_fast') {
            reasons.push('Optimized for rapid response');
        }
        if (model.costPerMillion.input <= 1) {
            reasons.push('Cost-efficient for high-volume tasks');
        }
        
        return reasons.join('; ');
    }
    
    trackUsage(agentType, modelId) {
        const key = `${agentType}-${modelId}`;
        const current = this.usage.get(key) || 0;
        this.usage.set(key, current + 1);
    }
    
    getUsageStats() {
        const stats = {
            byAgent: {},
            byModel: {},
            total: 0
        };
        
        for (const [key, count] of this.usage) {
            const [agentType, modelId] = key.split('-');
            
            if (!stats.byAgent[agentType]) {
                stats.byAgent[agentType] = {};
            }
            stats.byAgent[agentType][modelId] = count;
            
            stats.byModel[modelId] = (stats.byModel[modelId] || 0) + count;
            stats.total += count;
        }
        
        return stats;
    }
    
    estimateCost(modelId, estimatedTokens) {
        const model = this.models[modelId];
        if (!model) return { error: 'Model not found' };
        
        const inputCost = (estimatedTokens.input / 1000000) * model.costPerMillion.input;
        const outputCost = (estimatedTokens.output / 1000000) * model.costPerMillion.output;
        
        return {
            model: model.name,
            inputCost,
            outputCost,
            totalCost: inputCost + outputCost,
            costPerMillion: model.costPerMillion
        };
    }
    
    getModelsWithCapability(capability) {
        return Object.entries(this.models)
            .filter(([_, model]) => model.capabilities.includes(capability))
            .map(([id, model]) => ({ id, ...model }));
    }
    
    compareModels(modelIds, criteria = ['quality', 'speed', 'cost']) {
        const comparison = {};
        
        for (const modelId of modelIds) {
            const model = this.models[modelId];
            if (!model) continue;
            
            comparison[modelId] = {
                name: model.name,
                scores: {}
            };
            
            if (criteria.includes('quality')) {
                const qualityMap = {
                    'exceptional': 1.0,
                    'highest': 0.9,
                    'very_high': 0.8,
                    'high': 0.7,
                    'good': 0.6,
                    'basic': 0.4
                };
                comparison[modelId].scores.quality = qualityMap[model.quality] || 0.5;
            }
            
            if (criteria.includes('speed')) {
                const speedMap = {
                    'fastest': 1.0,
                    'very_fast': 0.8,
                    'fast': 0.6,
                    'moderate': 0.4,
                    'slow': 0.2
                };
                comparison[modelId].scores.speed = speedMap[model.speed] || 0.5;
            }
            
            if (criteria.includes('cost')) {
                const avgCost = (model.costPerMillion.input + model.costPerMillion.output) / 2;
                comparison[modelId].scores.cost = 1 - Math.min(avgCost / 100, 1);
            }
        }
        
        return comparison;
    }
}

/**
 * MCP Client for LLM connections
 * Handles connections to MCP servers like LiteLLM, mcp-use, etc.
 */
class MCPClient {
    constructor(config = {}) {
        this.config = {
            serverUrl: config.serverUrl || 'http://localhost:4000',
            serverType: config.serverType || 'litellm', // litellm, mcp-use, ultimate-mcp, etc.
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 3,
            headers: config.headers || {},
            ...config
        };
        
        this.connected = false;
        this.connectionError = null;
    }
    
    /**
     * Connect to MCP server
     */
    async connect() {
        try {
            console.log(`🔌 Connecting to MCP server at ${this.config.serverUrl}...`);
            
            // Test connection based on server type
            const testEndpoint = this.getTestEndpoint();
            const response = await fetch(`${this.config.serverUrl}${testEndpoint}`, {
                method: 'GET',
                headers: this.config.headers
            });
            
            if (response.ok) {
                this.connected = true;
                console.log('✅ MCP server connected successfully');
                return true;
            } else {
                throw new Error(`MCP server returned ${response.status}`);
            }
        } catch (error) {
            this.connected = false;
            this.connectionError = error;
            console.error('❌ MCP connection failed:', error.message);
            return false;
        }
    }
    
    /**
     * Get test endpoint based on server type
     */
    getTestEndpoint() {
        const endpoints = {
            'litellm': '/health',
            'mcp-use': '/status',
            'ultimate-mcp': '/api/health',
            'default': '/health'
        };
        
        return endpoints[this.config.serverType] || endpoints.default;
    }
    
    /**
     * Make a completion request through MCP
     */
    async complete(params) {
        if (!this.connected) {
            throw new Error('MCP client not connected');
        }
        
        const { model, messages, maxTokens = 4000, temperature = 0.7 } = params;
        
        try {
            const endpoint = this.getCompletionEndpoint();
            const payload = this.buildPayload(model, messages, maxTokens, temperature);
            
            const response = await fetch(`${this.config.serverUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.headers
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`MCP request failed: ${response.status}`);
            }
            
            const data = await response.json();
            return this.parseResponse(data);
            
        } catch (error) {
            console.error('MCP completion error:', error);
            throw error;
        }
    }
    
    /**
     * Get completion endpoint based on server type
     */
    getCompletionEndpoint() {
        const endpoints = {
            'litellm': '/chat/completions',
            'mcp-use': '/v1/chat/completions',
            'ultimate-mcp': '/api/chat',
            'default': '/v1/messages'
        };
        
        return endpoints[this.config.serverType] || endpoints.default;
    }
    
    /**
     * Build request payload based on server type
     */
    buildPayload(model, messages, maxTokens, temperature) {
        // Most MCP servers follow OpenAI format
        const basePayload = {
            model,
            messages,
            max_tokens: maxTokens,
            temperature
        };
        
        // Server-specific adjustments
        if (this.config.serverType === 'ultimate-mcp') {
            return {
                ...basePayload,
                stream: false,
                top_p: 0.9
            };
        }
        
        return basePayload;
    }
    
    /**
     * Parse response based on server type
     */
    parseResponse(data) {
        // Most follow OpenAI format
        if (data.choices && data.choices[0]) {
            return {
                content: data.choices[0].message.content,
                usage: data.usage,
                model: data.model
            };
        }
        
        // Fallback for non-standard responses
        return {
            content: data.content || data.text || data.response,
            usage: data.usage || {},
            model: data.model
        };
    }
}

/**
 * Enhanced Model Selector Integration with MCP Support
 */
class ModelSelectorIntegration {
    constructor(mcpConfig = {}) {
        this.selector = new EnhancedModelSelector();
        this.mcpClient = null;
        this.mcpConfig = {
            enabled: true,
            fallbackToDirect: true,
            logUsage: true,
            ...mcpConfig
        };
        
        // Direct API managers (fallback)
        this.apiManagers = {};
    }
    
    /**
     * Initialize MCP connection
     */
    async initializeMCP(config = {}) {
        if (!this.mcpConfig.enabled) {
            console.log('MCP is disabled in configuration');
            return false;
        }
        
        try {
            this.mcpClient = new MCPClient({
                ...this.mcpConfig,
                ...config
            });
            
            const connected = await this.mcpClient.connect();
            
            if (!connected && !this.mcpConfig.fallbackToDirect) {
                throw new Error('MCP connection required but failed');
            }
            
            return connected;
        } catch (error) {
            console.error('MCP initialization error:', error);
            
            if (this.mcpConfig.fallbackToDirect) {
                console.log('Falling back to direct API calls');
                return false;
            }
            
            throw error;
        }
    }
    
    /**
     * Create agent with optimal model selection and MCP support
     */
    async createAgentWithOptimalModel(config, task = null) {
        // Extract agent type from ID
        const agentType = this.extractAgentType(config.id);
        
        // Determine task complexity
        const taskComplexity = this.assessTaskComplexity(task);
        
        // Select optimal model using existing logic
        const modelSelection = this.selector.selectModel({
            agentType,
            seniority: config.seniority,
            taskComplexity,
            prioritizeSpeed: config.prioritizeSpeed || false,
            budgetMode: config.budgetMode || false,
            useLegacy: config.useLegacy || false
        });
        
        // Create agent with selected model
        const agent = {
            id: config.id,
            name: config.name,
            role: config.role,
            seniority: config.seniority,
            team: config.team,
            model: modelSelection.modelId,
            modelInfo: modelSelection.model,
            modelReasoning: modelSelection.reasoning,
            status: "inactive",
            workspace: `${config.projectName}/agents/workspaces/${config.id}`,
            currentTask: null,
            tokenUsage: { input: 0, output: 0 },
            efficiencyRatio: 0,
            // MCP configuration
            useMCP: this.mcpClient?.connected && this.mcpConfig.enabled,
            mcpFallback: this.mcpConfig.fallbackToDirect
        };
        
        // Load the agent's prompt
        const prompt = await this.loadAgentPrompt(config.id, config.seniority);
        agent.systemPrompt = prompt;
        
        // Add completion method
        agent.complete = async (messages, options = {}) => {
            return this.executeCompletion(agent, messages, options);
        };
        
        console.log(`Agent ${config.name} created with model: ${modelSelection.model.name}`);
        console.log(`MCP: ${agent.useMCP ? 'Enabled' : 'Disabled (using direct API)'}`);
        console.log(`Reasoning: ${modelSelection.reasoning}`);
        
        return agent;
    }
    
    /**
     * Execute completion request through MCP or direct API
     */
    async executeCompletion(agent, messages, options = {}) {
        const completionParams = {
            model: agent.model,
            messages: [
                { role: 'system', content: agent.systemPrompt },
                ...messages
            ],
            maxTokens: options.maxTokens || 4000,
            temperature: options.temperature || 0.7
        };
        
        try {
            let result;
            
            // Try MCP first if enabled and connected
            if (agent.useMCP && this.mcpClient?.connected) {
                try {
                    result = await this.mcpClient.complete(completionParams);
                    result.method = 'mcp';
                } catch (mcpError) {
                    console.error('MCP completion failed:', mcpError);
                    
                    if (!agent.mcpFallback) {
                        throw mcpError;
                    }
                    
                    // Fall back to direct API
                    console.log('Falling back to direct API call');
                    result = await this.directAPICall(completionParams);
                    result.method = 'direct';
                }
            } else {
                // Use direct API
                result = await this.directAPICall(completionParams);
                result.method = 'direct';
            }
            
            // Track usage
            if (this.mcpConfig.logUsage && result.usage) {
                agent.tokenUsage.input += result.usage.prompt_tokens || 0;
                agent.tokenUsage.output += result.usage.completion_tokens || 0;
            }
            
            return result;
            
        } catch (error) {
            console.error(`Completion error for agent ${agent.name}:`, error);
            throw error;
        }
    }
    
    /**
     * Direct API call fallback (placeholder - integrate with your existing API managers)
     */
    async directAPICall(params) {
        // This would integrate with your existing MultiModelAPIManager
        // For now, it's a placeholder
        console.log('Direct API call:', params.model);
        
        // You would replace this with actual API calls
        // e.g., using your MultiModelAPIManager
        throw new Error('Direct API calls not implemented. Please configure MCP or implement direct API integration.');
    }
    
    /**
     * Extract agent type from agent ID
     */
    extractAgentType(agentId) {
        const typeMap = {
            'team-leader': 'team-leader',
            'requirements-analyst': 'requirements-analyst',
            'architect': 'architect',
            'database': 'database-engineer',
            'dba': 'database-engineer',
            'security': 'security-engineer',
            'design-lead': 'design-lead',
            'wireframe': 'wireframe-designer',
            'ux-designer': 'ux-designer',
            'ui-designer': 'ui-designer',
            'content-strategist': 'content-strategist',
            'copywriter': 'marketing-copywriter',
            'ux-writer': 'ux-writer',
            'ml-engineer': 'ml-engineer',
            'integration': 'integration-architect',
            'developer': 'developer',
            'validator': 'validator'
        };
        
        for (const [key, type] of Object.entries(typeMap)) {
            if (agentId.includes(key)) {
                return type;
            }
        }
        
        return 'developer'; // Default
    }
    
    /**
     * Assess task complexity
     */
    assessTaskComplexity(task) {
        if (!task) return 'general_development';
        
        const taskTitle = task.title?.toLowerCase() || '';
        const taskDescription = task.description?.toLowerCase() || '';
        const combined = `${taskTitle} ${taskDescription}`;
        
        if (combined.includes('architecture') || combined.includes('system design')) {
            return 'architecture_decision';
        }
        if (combined.includes('security') || combined.includes('threat')) {
            return 'security_review';
        }
        if (combined.includes('critical') || combined.includes('urgent')) {
            return 'critical_path';
        }
        if (combined.includes('algorithm') || combined.includes('optimization')) {
            return 'complex_algorithm';
        }
        if (combined.includes('integration') || combined.includes('api')) {
            return 'integration_design';
        }
        if (combined.includes('review') || combined.includes('refactor')) {
            return 'code_review';
        }
        if (combined.includes('content') || combined.includes('copy')) {
            return 'content_creation';
        }
        if (combined.includes('simple') || combined.includes('basic')) {
            return 'simple_task';
        }
        if (combined.includes('update') || combined.includes('fix')) {
            return 'repetitive_task';
        }
        
        return 'general_development';
    }
    
    /**
     * Load agent prompt (placeholder)
     */
    async loadAgentPrompt(agentId, seniority) {
        // This would integrate with your AgentPromptLibrary
        return `You are a ${seniority} ${agentId} agent. Follow your role guidelines and complete tasks efficiently.`;
    }
    
    /**
     * Get MCP connection status
     */
    getMCPStatus() {
        return {
            enabled: this.mcpConfig.enabled,
            connected: this.mcpClient?.connected || false,
            serverUrl: this.mcpClient?.config.serverUrl || 'Not configured',
            serverType: this.mcpClient?.config.serverType || 'Not configured',
            fallbackEnabled: this.mcpConfig.fallbackToDirect,
            error: this.mcpClient?.connectionError?.message || null
        };
    }
    
    /**
     * Update MCP configuration
     */
    updateMCPConfig(newConfig) {
        this.mcpConfig = {
            ...this.mcpConfig,
            ...newConfig
        };
        
        console.log('MCP configuration updated:', this.mcpConfig);
    }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        EnhancedModelSelector, 
        ModelSelectorIntegration,
        MCPClient
    };
}

// Make available globally in browser/Claude Code
if (typeof window !== 'undefined') {
    window.EnhancedModelSelector = EnhancedModelSelector;
    window.ModelSelectorIntegration = ModelSelectorIntegration;
    window.MCPClient = MCPClient;
}

// Usage example
console.log("Enhanced Model Selector with MCP Integration loaded!");
console.log("\nExample usage:");
console.log("// Initialize with MCP");
console.log("const integration = new ModelSelectorIntegration({");
console.log("  serverUrl: 'http://localhost:4000',");
console.log("  serverType: 'litellm',");
console.log("  enabled: true,");
console.log("  fallbackToDirect: true");
console.log("});");
console.log("");
console.log("// Connect to MCP server");
console.log("await integration.initializeMCP();");
console.log("");
console.log("// Create agent with MCP support");
console.log("const agent = await integration.createAgentWithOptimalModel({");
console.log("  id: 'senior-architect',");
console.log("  name: 'Senior Architect',");
console.log("  seniority: 'senior',");
console.log("  team: 'architecture'");
console.log("});");
console.log("");
console.log("// Use agent with automatic MCP/direct routing");
console.log("const response = await agent.complete([");
console.log("  { role: 'user', content: 'Design a scalable architecture' }");
console.log("]);");
