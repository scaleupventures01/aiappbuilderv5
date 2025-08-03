// lib/APIKeyManager.js - API Key Management for Team Leader System v4.0

/**
 * APIKeyManager - Secure API key management
 * Handles storage, validation, and retrieval of API keys
 */

class APIKeyManager {
    constructor() {
        this.keys = new Map();
        this.validated = new Map();
        this.providers = {
            openai: {
                name: 'OpenAI',
                envVar: 'OPENAI_API_KEY',
                validateFormat: (key) => key.startsWith('sk-') && key.length > 20,
                models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']
            },
            google: {
                name: 'Google AI',
                envVar: 'GOOGLE_API_KEY',
                validateFormat: (key) => key.length > 20,
                models: ['gemini-2.0-flash-thinking-exp', 'gemini-2.5-flash', 'gemini-2.5-pro']
            },
            anthropic: {
                name: 'Anthropic',
                envVar: 'ANTHROPIC_API_KEY',
                validateFormat: (key) => key.startsWith('sk-ant-') && key.length > 20,
                models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
            }
        };
        
        // Try to load from environment or stored config
        this.loadFromEnvironment();
    }
    
    /**
     * Load API keys from environment variables
     */
    loadFromEnvironment() {
        // In browser environment, check if keys were passed via config
        if (typeof process !== 'undefined' && process.env) {
            for (const [provider, config] of Object.entries(this.providers)) {
                const key = process.env[config.envVar];
                if (key) {
                    this.setKey(provider, key, true);
                }
            }
        }
    }

    /**
     * Initialize the API Key Manager
     */
    async initialize() {
        console.log("🔑 Initializing API Key Manager...");
        this.loadFromEnvironment();
        
        // Validate keys if any are loaded
        const configuredProviders = this.getConfiguredProviders();
        if (configuredProviders.length > 0) {
            console.log(`✅ Found ${configuredProviders.length} configured providers`);
            for (const provider of configuredProviders) {
                console.log(`✅ ${provider} API key configured`);
            }
        } else {
            console.log("⚠️  No API keys found in environment variables");
        }
        
        return true;
    }
    
    /**
     * Set an API key
     */
    async setKey(provider, key, skipValidation = false) {
        if (!this.providers[provider]) {
            throw new Error(`Unknown provider: ${provider}`);
        }
        
        // Basic format validation
        if (!skipValidation && !this.providers[provider].validateFormat(key)) {
            throw new Error(`Invalid ${provider} API key format`);
        }
        
        this.keys.set(provider, key);
        this.validated.set(provider, skipValidation);
        
        console.log(`✅ ${this.providers[provider].name} API key configured`);
        
        return true;
    }
    
    /**
     * Get an API key
     */
    getKey(provider) {
        return this.keys.get(provider);
    }
    
    /**
     * Check if a provider has a key
     */
    hasKey(provider) {
        return this.keys.has(provider);
    }
    
    /**
     * Get all configured providers
     */
    getConfiguredProviders() {
        return Array.from(this.keys.keys());
    }
    
    /**
     * Validate all keys (test with actual API calls)
     */
    async validateKeys() {
        const results = {};
        
        for (const [provider, key] of this.keys.entries()) {
            if (this.validated.get(provider)) {
                results[provider] = { valid: true, skipped: true };
                continue;
            }
            
            try {
                results[provider] = await this.testKey(provider, key);
            } catch (error) {
                results[provider] = { valid: false, error: error.message };
            }
        }
        
        return results;
    }
    
    /**
     * Test a specific API key
     */
    async testKey(provider, key) {
        // Implementation would make a test API call
        // For now, just validate format
        const valid = this.providers[provider].validateFormat(key);
        return { valid, tested: new Date().toISOString() };
    }
    
    /**
     * Get available models for configured providers
     */
    getAvailableModels() {
        const models = [];
        
        for (const provider of this.keys.keys()) {
            const providerModels = this.providers[provider].models;
            models.push(...providerModels.map(model => ({
                provider,
                model,
                available: true
            })));
        }
        
        return models;
    }
    
    /**
     * Export configuration (without sensitive keys)
     */
    exportConfig() {
        const config = {
            providers: {},
            validated: {}
        };
        
        for (const provider of this.keys.keys()) {
            config.providers[provider] = {
                configured: true,
                validated: this.validated.get(provider),
                keyLength: this.keys.get(provider).length
            };
        }
        
        return config;
    }
    
    /**
     * Clear all keys
     */
    clearKeys() {
        this.keys.clear();
        this.validated.clear();
        console.log("🔑 All API keys cleared");
    }
}

/**
 * APIKeyIntegration - Integrates APIKeyManager with MultiModelAPIManager
 */
class APIKeyIntegration {
    constructor(keyManager, apiManager) {
        this.keyManager = keyManager;
        this.apiManager = apiManager;
    }
    
    /**
     * Sync keys from KeyManager to APIManager
     */
    syncKeys() {
        const providers = this.keyManager.getConfiguredProviders();
        let synced = 0;
        
        for (const provider of providers) {
            const key = this.keyManager.getKey(provider);
            
            switch(provider) {
                case 'openai':
                    this.apiManager.setOpenAIKey(key);
                    synced++;
                    break;
                case 'google':
                    this.apiManager.setGoogleKey(key);
                    synced++;
                    break;
                case 'anthropic':
                    // Claude keys are handled differently in Claude Code
                    if (typeof window === 'undefined') {
                        // Node.js environment
                        this.apiManager.setAnthropicKey(key);
                        synced++;
                    }
                    break;
            }
        }
        
        console.log(`🔄 Synced ${synced} API keys to APIManager`);
        return synced;
    }
    
    /**
     * Get recommended model based on available keys
     */
    getRecommendedModel(requirements = {}) {
        const available = this.keyManager.getAvailableModels();
        
        // Sort by cost efficiency
        const rankings = {
            'gemini-2.5-flash': 1,
            'gpt-3.5-turbo': 2,
            'claude-3-haiku': 3,
            'gemini-2.5-pro': 4,
            'gpt-4o': 5,
            'claude-3-sonnet': 6,
            'claude-3-opus': 7
        };
        
        available.sort((a, b) => {
            const rankA = rankings[a.model] || 99;
            const rankB = rankings[b.model] || 99;
            return rankA - rankB;
        });
        
        // Return first available or null
        return available.length > 0 ? available[0] : null;
    }
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIKeyManager;
}

// Make available globally in browser environment
if (typeof window !== 'undefined') {
    window.APIKeyManager = APIKeyManager;
    window.APIKeyIntegration = APIKeyIntegration;
}