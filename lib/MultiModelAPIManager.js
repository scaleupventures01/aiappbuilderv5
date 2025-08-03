// enhanced_multi_model_api_manager.js - Complete Multi-Model API Integration with Error Handling

/**
 * Enhanced Multi-Model API Manager for Team Leader System v4.0
 * Includes error handling, fallback mechanisms, and user approval for missing keys
 * Supports Anthropic (Claude), OpenAI (GPT), and Google (Gemini) models
 */

class EnhancedMultiModelAPIManager {
    constructor() {
        // API endpoints
        this.endpoints = {
            anthropic: "https://api.anthropic.com/v1/messages",
            openai: "https://api.openai.com/v1/chat/completions",
            google: "https://generativelanguage.googleapis.com/v1beta/models"
        };
        
        // Model configurations with fallback mappings
        this.modelConfigs = {
            // Anthropic Claude models (always available in Claude Code)
            "claude-3-opus-20240229": {
                provider: "anthropic",
                maxTokens: 4096,
                temperature: 0.7,
                tier: "premium",
                fallback: null // No fallback needed
            },
            "claude-3-sonnet-20240229": {
                provider: "anthropic",
                maxTokens: 4096,
                temperature: 0.7,
                tier: "balanced",
                fallback: null
            },
            "claude-3-haiku-20240307": {
                provider: "anthropic",
                maxTokens: 4096,
                temperature: 0.8,
                tier: "efficient",
                fallback: null
            },
            
            // OpenAI models (require API key)
            "gpt-4o": {
                provider: "openai",
                maxTokens: 4096,
                temperature: 0.7,
                tier: "balanced",
                fallback: "claude-3-sonnet-20240229"
            },
            "gpt-4o-mini": {
                provider: "openai",
                maxTokens: 4096,
                temperature: 0.8,
                tier: "efficient",
                fallback: "claude-3-haiku-20240307"
            },
            
            // Google models (require API key)
            "gemini-2.5-pro": {
                provider: "google",
                maxTokens: 4096,
                temperature: 0.7,
                tier: "balanced",
                fallback: "claude-3-sonnet-20240229"
            },
            "gemini-2.5-flash": {
                provider: "google",
                maxTokens: 4096,
                temperature: 0.8,
                tier: "efficient",
                fallback: "claude-3-haiku-20240307"
            },
            
            // Future models
            "o3": {
                provider: "anthropic",
                maxTokens: 8192,
                temperature: 0.5,
                tier: "ultra_premium",
                fallback: "claude-3-opus-20240229"
            }
        };
        
        // Track all active conversations
        this.conversations = new Map();
        
        // Track token usage for efficiency monitoring
        this.tokenUsage = new Map();
        
        // Rate limiting
        this.rateLimiter = new RateLimiter();
        
        // Key manager reference
        this.keyManager = null;
        
        // User approvals
        this.approvals = {
            proceedWithoutKeys: false,
            missingProviders: new Set()
        };
        
        // Cost analyzer
        this.costAnalyzer = new CostAnalyzer();
    }
    
    /**
     * Initialize and check for API keys
     */
    async initialize(keyManager) {
        this.keyManager = keyManager;
        
        console.log("\n🔍 Checking API configuration...");
        
        const keyStatus = await this.checkAPIKeys();
        
        if (!keyStatus.hasAllKeys) {
            // Show what's missing and get user approval
            await this.handleMissingKeys(keyStatus);
        } else {
            console.log("✅ All API providers configured!");
        }
        
        return keyStatus;
    }
    
    /**
     * Check which API keys are available
     */
    async checkAPIKeys() {
        const status = {
            openai: false,
            google: false,
            hasAllKeys: false,
            missingProviders: []
        };
        
        if (this.keyManager) {
            status.openai = this.keyManager.hasKey('openai');
            status.google = this.keyManager.hasKey('google');
        }
        
        if (!status.openai) status.missingProviders.push('openai');
        if (!status.google) status.missingProviders.push('google');
        
        status.hasAllKeys = status.openai && status.google;
        
        return status;
    }
    
    /**
     * Handle missing API keys with user interaction
     */
    async handleMissingKeys(keyStatus) {
        // Calculate cost impact
        const costImpact = this.costAnalyzer.analyzeMissingKeyImpact(keyStatus);
        
        console.log(`
⚠️  MISSING API KEYS DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Status:
${keyStatus.openai ? '✅' : '❌'} OpenAI (GPT-4o) - Content & validation tasks
${keyStatus.google ? '✅' : '❌'} Google AI (Gemini) - Junior agents (70% cost savings)

Without these keys, ALL agents will use Claude models.
`);
        
        // Show cost impact
        this.costAnalyzer.showCostWarning(costImpact);
        
        console.log(`
Your Options:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Add missing keys now:
   ${!keyStatus.openai ? "await system.setKey('openai', 'sk-...')" : ''}
   ${!keyStatus.google ? "await system.setKey('google', '...')" : ''}

2. Proceed with Claude-only (requires confirmation):
   await system.proceedWithoutKeys()

3. Exit setup:
   system.exit()

What would you like to do?
`);
        
        // Store missing providers for later reference
        this.approvals.missingProviders = new Set(keyStatus.missingProviders);
    }
    
    /**
     * User confirms proceeding without keys
     */
    async proceedWithoutKeys() {
        console.log(`
⚠️  FINAL CONFIRMATION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are about to proceed WITHOUT external API keys.

This means:
• ALL agents will use Claude models
• Estimated cost: 3-5x higher than with all keys
• Best quality but most expensive option
• You can add keys later to optimize

To confirm, type exactly:
await system.confirmHighCostMode()

To go back and add keys:
await system.addKeysNow()
`);
    }
    
    /**
     * User confirms high cost mode
     */
    async confirmHighCostMode() {
        this.approvals.proceedWithoutKeys = true;
        
        console.log(`
✅ Confirmed: Proceeding in Claude-only mode

Important notes:
• You can add API keys anytime with: await system.setKey(provider, key)
• The dashboard will show cost optimization opportunities
• Run 'await system.showSavings()' to see potential savings

Continuing with setup...
`);
        
        return true;
    }
    
    /**
     * Create a new sub-agent with appropriate API based on model
     */
    async createSubAgent(agent, task) {
        try {
            // Check if model is available or needs fallback
            const { availableModel, fallbackUsed, reason } = await this.getAvailableModel(agent.model);
            
            if (fallbackUsed) {
                console.warn(`⚠️ ${agent.name}: ${reason}`);
                console.log(`   Using ${availableModel} instead of ${agent.model}`);
                
                agent.originalModel = agent.model;
                agent.model = availableModel;
                agent.fallbackUsed = true;
                agent.fallbackReason = reason;
            }
            
            // Get model configuration
            const modelConfig = this.modelConfigs[agent.model] || this.modelConfigs["claude-3-sonnet-20240229"];
            const provider = modelConfig.provider;
            
            // Build the appropriate request based on provider
            let response;
            switch (provider) {
                case "anthropic":
                    response = await this.createAnthropicAgent(agent, task, modelConfig);
                    break;
                case "openai":
                    response = await this.createOpenAIAgentSafe(agent, task, modelConfig);
                    break;
                case "google":
                    response = await this.createGoogleAgentSafe(agent, task, modelConfig);
                    break;
                default:
                    throw new Error(`Unknown provider: ${provider}`);
            }
            
            // Track the conversation
            this.trackConversation(agent, response);
            
            // Update token usage
            this.updateTokenUsage(agent, response);
            
            // Calculate efficiency
            const efficiency = this.calculateEfficiency(response);
            
            return {
                success: true,
                agentId: agent.id,
                conversationId: response.conversationId,
                response: response.content,
                efficiency: efficiency,
                tokenUsage: response.usage,
                fallbackUsed: fallbackUsed,
                modelUsed: agent.model
            };
            
        } catch (error) {
            console.error(`Error creating sub-agent: ${error.message}`);
            return {
                success: false,
                error: error.message,
                agentId: agent.id
            };
        }
    }
    
    /**
     * Get available model with fallback logic
     */
    async getAvailableModel(requestedModel) {
        const modelConfig = this.modelConfigs[requestedModel];
        
        if (!modelConfig) {
            return {
                availableModel: "claude-3-sonnet-20240229",
                fallbackUsed: true,
                reason: "Unknown model requested"
            };
        }
        
        // Claude models are always available
        if (modelConfig.provider === 'anthropic') {
            return {
                availableModel: requestedModel,
                fallbackUsed: false,
                reason: null
            };
        }
        
        // Check if we have the key for external providers
        const hasKey = this.keyManager && this.keyManager.hasKey(modelConfig.provider);
        
        if (!hasKey) {
            // Check if user approved proceeding without this key
            if (!this.approvals.proceedWithoutKeys && this.approvals.missingProviders.has(modelConfig.provider)) {
                throw new Error(`${modelConfig.provider} API key required. Run 'await system.setKey("${modelConfig.provider}", "your-key")' or 'await system.proceedWithoutKeys()'`);
            }
            
            return {
                availableModel: modelConfig.fallback,
                fallbackUsed: true,
                reason: `${modelConfig.provider} API key not configured`
            };
        }
        
        return {
            availableModel: requestedModel,
            fallbackUsed: false,
            reason: null
        };
    }
    
    /**
     * Safe wrapper for OpenAI API calls
     */
    async createOpenAIAgentSafe(agent, task, modelConfig) {
        try {
            const key = this.keyManager?.getKey('openai');
            if (!key) {
                return this.fallbackToClaudeAgent(agent, task, 'openai');
            }
            
            return await this.createOpenAIAgent(agent, task, modelConfig, key);
        } catch (error) {
            console.error(`OpenAI API error: ${error.message}`);
            return this.fallbackToClaudeAgent(agent, task, 'openai');
        }
    }
    
    /**
     * Safe wrapper for Google API calls
     */
    async createGoogleAgentSafe(agent, task, modelConfig) {
        try {
            const key = this.keyManager?.getKey('google');
            if (!key) {
                return this.fallbackToClaudeAgent(agent, task, 'google');
            }
            
            return await this.createGoogleAgent(agent, task, modelConfig, key);
        } catch (error) {
            console.error(`Google API error: ${error.message}`);
            return this.fallbackToClaudeAgent(agent, task, 'google');
        }
    }
    
    /**
     * Fallback to Claude when external API fails
     */
    async fallbackToClaudeAgent(agent, task, failedProvider) {
        console.log(`   Falling back to Claude due to ${failedProvider} unavailability`);
        
        const fallbackModel = this.modelConfigs[agent.model].fallback;
        const fallbackConfig = this.modelConfigs[fallbackModel];
        
        agent.fallbackUsed = true;
        agent.originalModel = agent.model;
        agent.model = fallbackModel;
        
        return await this.createAnthropicAgent(agent, task, fallbackConfig);
    }
    
    /**
     * Create an Anthropic (Claude) agent
     */
    async createAnthropicAgent(agent, task, modelConfig) {
        await this.rateLimiter.checkLimit('anthropic');
        
        const messages = [{
            role: "user",
            content: this.buildAgentActivationMessage(agent, task)
        }];
        
        const requestBody = {
            model: agent.model,
            messages: messages,
            system: agent.systemPrompt,
            max_tokens: modelConfig.maxTokens,
            temperature: modelConfig.temperature,
            metadata: {
                user_id: agent.id
            }
        };
        
        const response = await fetch(this.endpoints.anthropic, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
            conversationId: this.generateConversationId(agent),
            provider: 'anthropic',
            model: agent.model,
            content: data.content[0].text,
            usage: data.usage,
            raw: data
        };
    }
    
    /**
     * Create an OpenAI agent with API key
     */
    async createOpenAIAgent(agent, task, modelConfig, apiKey) {
        await this.rateLimiter.checkLimit('openai');
        
        const messages = [
            {
                role: "system",
                content: agent.systemPrompt
            },
            {
                role: "user",
                content: this.buildAgentActivationMessage(agent, task)
            }
        ];
        
        const requestBody = {
            model: agent.model,
            messages: messages,
            max_tokens: modelConfig.maxTokens,
            temperature: modelConfig.temperature,
            user: agent.id
        };
        
        const response = await fetch(this.endpoints.openai, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
            conversationId: this.generateConversationId(agent),
            provider: 'openai',
            model: agent.model,
            content: data.choices[0].message.content,
            usage: data.usage,
            raw: data
        };
    }
    
    /**
     * Create a Google agent with API key
     */
    async createGoogleAgent(agent, task, modelConfig, apiKey) {
        await this.rateLimiter.checkLimit('google');
        
        const prompt = `${agent.systemPrompt}\n\n${this.buildAgentActivationMessage(agent, task)}`;
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: modelConfig.temperature,
                maxOutputTokens: modelConfig.maxTokens,
            }
        };
        
        const endpoint = `${this.endpoints.google}/${agent.model}:generateContent?key=${apiKey}`;
        
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Google API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        const usage = {
            prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
            completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
            total_tokens: data.usageMetadata?.totalTokenCount || 0
        };
        
        return {
            conversationId: this.generateConversationId(agent),
            provider: 'google',
            model: agent.model,
            content: data.candidates[0].content.parts[0].text,
            usage: usage,
            raw: data
        };
    }
    
    /**
     * Add a key during runtime
     */
    async addKeyDuringRuntime(provider, key) {
        if (!this.keyManager) {
            throw new Error("Key manager not initialized");
        }
        
        console.log(`\n🔑 Adding ${provider} key...`);
        
        try {
            await this.keyManager.setKey(provider, key);
            
            // Remove from missing providers
            this.approvals.missingProviders.delete(provider);
            
            // Find agents that could be optimized
            const optimizable = this.findOptimizableAgents(provider);
            
            if (optimizable.length > 0) {
                const savings = this.calculatePotentialSavings(optimizable);
                
                console.log(`
✅ ${provider} key added successfully!

Found ${optimizable.length} agents that can be optimized:
${optimizable.map(a => `  • ${a.name}: ${a.currentModel} → ${a.optimalModel}`).join('\n')}

Potential savings: $${savings.toFixed(2)} per run

Would you like to optimize these agents?
Run: await system.optimizeAgents("${provider}")
`);
            } else {
                console.log(`✅ ${provider} key added. New agents will use optimal models.`);
            }
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to add key: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Find agents that could use newly available models
     */
    findOptimizableAgents(provider) {
        const optimizable = [];
        
        for (const [agentId, conversation] of this.conversations) {
            const agent = conversation.agent;
            if (agent.fallbackUsed && agent.originalModel) {
                const originalConfig = this.modelConfigs[agent.originalModel];
                if (originalConfig && originalConfig.provider === provider) {
                    optimizable.push({
                        id: agentId,
                        name: agent.name,
                        currentModel: agent.model,
                        optimalModel: agent.originalModel
                    });
                }
            }
        }
        
        return optimizable;
    }
    
    /**
     * Calculate potential savings from optimization
     */
    calculatePotentialSavings(optimizableAgents) {
        let savings = 0;
        
        for (const agent of optimizableAgents) {
            const currentCost = this.getModelCost(agent.currentModel);
            const optimalCost = this.getModelCost(agent.optimalModel);
            const usage = this.tokenUsage.get(agent.id) || { totalInputTokens: 0, totalOutputTokens: 0 };
            
            const currentTotal = (usage.totalInputTokens * currentCost.input + usage.totalOutputTokens * currentCost.output) / 1000000;
            const optimalTotal = (usage.totalInputTokens * optimalCost.input + usage.totalOutputTokens * optimalCost.output) / 1000000;
            
            savings += (currentTotal - optimalTotal);
        }
        
        return savings;
    }
    
    /**
     * Get model cost per million tokens
     */
    getModelCost(model) {
        const costs = {
            "claude-3-opus-20240229": { input: 15, output: 75 },
            "claude-3-sonnet-20240229": { input: 3, output: 15 },
            "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
            "gpt-4o": { input: 5, output: 15 },
            "gpt-4o-mini": { input: 0.15, output: 0.6 },
            "gemini-2.5-pro": { input: 0.5, output: 1.5 },
            "gemini-2.5-flash": { input: 0.075, output: 0.3 }
        };
        
        return costs[model] || costs["claude-3-sonnet-20240229"];
    }
    
    /**
     * Build the activation message for an agent
     */
    buildAgentActivationMessage(agent, task) {
        return `You are being activated as ${agent.name}.

Your first task:
${task ? task.description : "Await further instructions"}

Begin by creating a PLAN for your work following your PLAN Mode instructions.

Remember your efficiency mandate and communication protocols.`;
    }
    
    /**
     * Generate a unique conversation ID
     */
    generateConversationId(agent) {
        return `${agent.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Track conversation for future interactions
     */
    trackConversation(agent, response) {
        this.conversations.set(agent.id, {
            conversationId: response.conversationId,
            agent: agent,
            provider: response.provider,
            messages: [
                {
                    role: "assistant",
                    content: response.content
                }
            ],
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        });
    }
    
    /**
     * Update token usage tracking
     */
    updateTokenUsage(agent, response) {
        if (!this.tokenUsage.has(agent.id)) {
            this.tokenUsage.set(agent.id, {
                totalInputTokens: 0,
                totalOutputTokens: 0,
                totalCost: 0,
                conversations: 0
            });
        }
        
        const usage = this.tokenUsage.get(agent.id);
        usage.totalInputTokens += response.usage?.prompt_tokens || 0;
        usage.totalOutputTokens += response.usage?.completion_tokens || 0;
        usage.conversations += 1;
        
        // Calculate cost based on model
        usage.totalCost += this.calculateCost(agent.model, response.usage);
    }
    
    /**
     * Calculate efficiency ratio
     */
    calculateEfficiency(response) {
        const inputTokens = response.usage?.prompt_tokens || 1;
        const outputTokens = response.usage?.completion_tokens || 0;
        return outputTokens / inputTokens;
    }
    
    /**
     * Calculate cost based on model and usage
     */
    calculateCost(model, usage) {
        if (!usage) return 0;
        
        const modelCost = this.getModelCost(model);
        const inputCost = (usage.prompt_tokens / 1000000) * modelCost.input;
        const outputCost = (usage.completion_tokens / 1000000) * modelCost.output;
        
        return inputCost + outputCost;
    }
    
    /**
     * Show potential savings report
     */
    async showSavings() {
        const keyStatus = await this.checkAPIKeys();
        const missingProviders = keyStatus.missingProviders;
        
        if (missingProviders.length === 0) {
            console.log("✅ All API keys configured! You're already optimizing costs.");
            return;
        }
        
        console.log(`
💰 POTENTIAL SAVINGS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Missing API Keys:
${missingProviders.map(p => `  ❌ ${p}`).join('\n')}

Current Usage:
`);
        
        let totalCurrentCost = 0;
        let totalOptimalCost = 0;
        
        for (const [agentId, usage] of this.tokenUsage) {
            const agent = this.conversations.get(agentId)?.agent;
            if (agent && agent.fallbackUsed) {
                const currentCost = usage.totalCost;
                const optimalCost = this.calculateCost(agent.originalModel, {
                    prompt_tokens: usage.totalInputTokens,
                    completion_tokens: usage.totalOutputTokens
                });
                
                totalCurrentCost += currentCost;
                totalOptimalCost += optimalCost;
                
                console.log(`  ${agent.name}:`);
                console.log(`    Current: $${currentCost.toFixed(4)} (${agent.model})`);
                console.log(`    Optimal: $${optimalCost.toFixed(4)} (${agent.originalModel})`);
                console.log(`    Savings: $${(currentCost - optimalCost).toFixed(4)}`);
            }
        }
        
        if (totalCurrentCost > 0) {
            const totalSavings = totalCurrentCost - totalOptimalCost;
            const savingsPercent = (totalSavings / totalCurrentCost * 100).toFixed(1);
            
            console.log(`
Total Potential Savings:
  Current cost:  $${totalCurrentCost.toFixed(2)}
  Optimal cost:  $${totalOptimalCost.toFixed(2)}
  You could save: $${totalSavings.toFixed(2)} (${savingsPercent}%)

Add missing keys to realize these savings:
${missingProviders.map(p => `  await system.setKey("${p}", "your-key-here")`).join('\n')}
`);
        }
    }
}

/**
 * Cost Analyzer Helper Class
 */
class CostAnalyzer {
    analyzeMissingKeyImpact(keyStatus) {
        // Rough estimates based on typical usage
        const typicalAgents = {
            seniors: 10,
            juniors: 20
        };
        
        const costsPerMillion = {
            claude_senior: 15,  // Claude Sonnet
            claude_junior: 3,   // Claude Haiku
            optimal_senior: 5,  // GPT-4o
            optimal_junior: 0.075  // Gemini Flash
        };
        
        const tokensPerAgent = 50000; // Average per agent per run
        
        // Calculate with optimal keys
        const withKeys = 
            (typicalAgents.seniors * tokensPerAgent * costsPerMillion.optimal_senior / 1000000) +
            (typicalAgents.juniors * tokensPerAgent * costsPerMillion.optimal_junior / 1000000);
        
        // Calculate Claude-only
        const withoutKeys = 
            (typicalAgents.seniors * tokensPerAgent * costsPerMillion.claude_senior / 1000000) +
            (typicalAgents.juniors * tokensPerAgent * costsPerMillion.claude_junior / 1000000);
        
        return {
            withKeys: withKeys.toFixed(2),
            withoutKeys: withoutKeys.toFixed(2),
            increase: Math.round((withoutKeys / withKeys - 1) * 100),
            savingsLost: (withoutKeys - withKeys).toFixed(2)
        };
    }
    
    showCostWarning(impact) {
        console.log(`
💰 COST IMPACT ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Estimated cost per run:
  With all keys:    $${impact.withKeys}
  Claude only:      $${impact.withoutKeys}
  
Cost increase:      ${impact.increase}%
Additional cost:    $${impact.savingsLost} per run

This primarily affects junior agents:
  • With keys: Use Gemini Flash at $0.075/1M tokens
  • Without: Use Claude Haiku at $3/1M tokens
  • That's 40x more expensive for junior tasks!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
    }
}

/**
 * Rate limiter to prevent API throttling
 */
class RateLimiter {
    constructor() {
        this.limits = {
            anthropic: { requests: 1000, window: 60000 },
            openai: { requests: 500, window: 60000 },
            google: { requests: 300, window: 60000 }
        };
        
        this.requests = {
            anthropic: [],
            openai: [],
            google: []
        };
    }
    
    async checkLimit(provider) {
        const now = Date.now();
        const limit = this.limits[provider];
        const providerRequests = this.requests[provider];
        
        // Remove old requests outside the window
        this.requests[provider] = providerRequests.filter(
            timestamp => now - timestamp < limit.window
        );
        
        // Check if we're at the limit
        if (this.requests[provider].length >= limit.requests) {
            const oldestRequest = this.requests[provider][0];
            const waitTime = limit.window - (now - oldestRequest);
            
            console.log(`Rate limit reached for ${provider}. Waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Add this request
        this.requests[provider].push(now);
    }
}

// Export for use in Team Leader System
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedMultiModelAPIManager;
}

// Make available globally in browser/Claude Code
if (typeof window !== 'undefined') {
    window.EnhancedMultiModelAPIManager = EnhancedMultiModelAPIManager;
}

// Usage example
console.log("Enhanced Multi-Model API Manager loaded!");
console.log("\nKey features:");
console.log("- Automatic fallback to Claude when keys missing");
console.log("- User approval required for high-cost mode");
console.log("- Runtime key addition with optimization");
console.log("- Cost analysis and savings reports");
console.log("\nInitialize with: const apiManager = new EnhancedMultiModelAPIManager();");
console.log("Then: await apiManager.initialize(keyManager);");
