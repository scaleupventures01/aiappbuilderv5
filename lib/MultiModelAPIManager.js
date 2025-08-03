// Enhanced Multi-Model API Manager with New Models Support
class MultiModelAPIManager {
    constructor() {
        this.providers = new Map();
        this.modelSelector = null; // Initialize lazily
        this.retryConfig = {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 10000,
            backoffFactor: 2
        };
        
        // Initialize providers
        this.initializeProviders();
    }
    
    /**
     * Initialize ModelSelector if not already done
     */
    initializeModelSelector() {
        if (!this.modelSelector) {
            const ModelSelector = require('./ModelSelectorIntegration');
            this.modelSelector = new ModelSelector();
        }
        return this.modelSelector;
    }
    
    /**
     * Initialize all model providers
     */
    async initializeProviders() {
        // Google (Gemini models)
        if (process.env.GOOGLE_API_KEY) {
            this.providers.set('google', {
                apiKey: process.env.GOOGLE_API_KEY,
                baseURL: 'https://generativelanguage.googleapis.com/v1beta',
                models: ['flash-lite', 'flash', 'gemini-pro'],
                initialized: true
            });
        }
        
        // OpenAI (GPT, o3, o4 models)
        if (process.env.OPENAI_API_KEY) {
            this.providers.set('openai', {
                apiKey: process.env.OPENAI_API_KEY,
                baseURL: 'https://api.openai.com/v1',
                models: ['gpt-4-nano', 'gpt-4-mini', 'gpt-4o', 'o3', 'o4-mini'],
                initialized: true
            });
        }
        
        // Anthropic (Claude models)
        if (process.env.ANTHROPIC_API_KEY) {
            this.providers.set('anthropic', {
                apiKey: process.env.ANTHROPIC_API_KEY,
                baseURL: 'https://api.anthropic.com/v1',
                models: ['claude-37', 'opus-4', 'sonnet-4'],
                initialized: true
            });
        }
        
        // DeepSeek
        if (process.env.DEEPSEEK_API_KEY) {
            this.providers.set('deepseek', {
                apiKey: process.env.DEEPSEEK_API_KEY,
                baseURL: 'https://api.deepseek.com/v1',
                models: ['deepseek-v3'],
                initialized: true
            });
        }
        
        console.log(`Initialized ${this.providers.size} providers`);
    }

    /**
     * Initialize the Multi-Model API Manager
     */
    async initialize(keyManager = null) {
        console.log("🤖 Initializing Multi-Model API Manager...");
        
        // Initialize providers
        await this.initializeProviders();
        
        // If keyManager is provided, sync keys
        if (keyManager) {
            console.log("🔄 Syncing API keys from KeyManager...");
            // This would sync keys from the keyManager if needed
        }
        
        console.log("✅ Multi-Model API Manager initialized");
        return true;
    }
    
    /**
     * Send completion request to appropriate provider
     */
    async complete(options) {
        const { model, messages, maxTokens = 4096, temperature = 0.7 } = options;
        
        // Get provider for model
        const provider = this.getProviderForModel(model);
        if (!provider) {
            throw new Error(`No provider available for model: ${model}`);
        }
        
        try {
            switch (provider.name) {
                case 'google':
                    return await this.completeGoogle(provider, model, messages, maxTokens, temperature);
                case 'openai':
                    return await this.completeOpenAI(provider, model, messages, maxTokens, temperature);
                case 'anthropic':
                    return await this.completeAnthropic(provider, model, messages, maxTokens, temperature);
                case 'deepseek':
                    return await this.completeDeepSeek(provider, model, messages, maxTokens, temperature);
                default:
                    throw new Error(`Unknown provider: ${provider.name}`);
            }
        } catch (error) {
            return await this.handleError(error, options);
        }
    }
    
    /**
     * Google Gemini completion
     */
    async completeGoogle(provider, model, messages, maxTokens, temperature) {
        const modelMap = {
            'flash-lite': 'gemini-1.5-flash-8b-latest',
            'flash': 'gemini-1.5-flash-latest',
            'gemini-pro': 'gemini-1.5-pro-latest'
        };
        
        const response = await fetch(`${provider.baseURL}/models/${modelMap[model]}:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': provider.apiKey
            },
            body: JSON.stringify({
                contents: this.convertToGeminiFormat(messages),
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature: temperature
                }
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Google API error: ${data.error?.message || response.statusText}`);
        }
        
        return {
            content: data.candidates[0].content.parts[0].text,
            usage: {
                inputTokens: data.usageMetadata?.promptTokenCount || 0,
                outputTokens: data.usageMetadata?.candidatesTokenCount || 0
            },
            model: model
        };
    }
    
    /**
     * OpenAI completion (including o3, o4-mini)
     */
    async completeOpenAI(provider, model, messages, maxTokens, temperature) {
        const modelMap = {
            'gpt-4-nano': 'gpt-4.1-nano',
            'gpt-4-mini': 'gpt-4.1-mini',
            'gpt-4o': 'gpt-4o',
            'o3': 'o3-2025',
            'o4-mini': 'o4-mini'
        };
        
        const response = await fetch(`${provider.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`
            },
            body: JSON.stringify({
                model: modelMap[model],
                messages: messages,
                max_tokens: maxTokens,
                temperature: temperature
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${data.error?.message || response.statusText}`);
        }
        
        return {
            content: data.choices[0].message.content,
            usage: {
                inputTokens: data.usage.prompt_tokens,
                outputTokens: data.usage.completion_tokens
            },
            model: model
        };
    }
    
    /**
     * Anthropic completion
     */
    async completeAnthropic(provider, model, messages, maxTokens, temperature) {
        const modelMap = {
            'claude-37': 'claude-3-7-sonnet-20250219',
            'opus-4': 'claude-opus-4-20250514',
            'sonnet-4': 'claude-sonnet-4-20250514'
        };
        
        // Extract system message and filter out system messages from the messages array
        let systemMessage = '';
        const filteredMessages = messages.filter(msg => {
            if (msg.role === 'system') {
                systemMessage = msg.content;
                return false;
            }
            return true;
        });
        
        const requestBody = {
            model: modelMap[model],
            messages: filteredMessages,
            max_tokens: maxTokens,
            temperature: temperature
        };
        
        // Add system message if present
        if (systemMessage) {
            requestBody.system = systemMessage;
        }
        
        const response = await fetch(`${provider.baseURL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': provider.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Anthropic API error: ${data.error?.message || response.statusText}`);
        }
        
        return {
            content: data.content[0].text,
            usage: {
                inputTokens: data.usage.input_tokens,
                outputTokens: data.usage.output_tokens
            },
            model: model
        };
    }
    
    /**
     * DeepSeek completion
     */
    async completeDeepSeek(provider, model, messages, maxTokens, temperature) {
        const response = await fetch(`${provider.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                max_tokens: maxTokens,
                temperature: temperature,
                frequency_penalty: 0,
                presence_penalty: 0
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${data.error?.message || response.statusText}`);
        }
        
        return {
            content: data.choices[0].message.content,
            usage: {
                inputTokens: data.usage.prompt_tokens,
                outputTokens: data.usage.completion_tokens
            },
            model: model
        };
    }
    
    /**
     * Convert messages to Gemini format
     */
    convertToGeminiFormat(messages) {
        return messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
    }
    
    /**
     * Get provider for a specific model
     */
    getProviderForModel(modelId) {
        try {
            // Get model configuration directly from ConfigurationManager
            const ConfigurationManager = require('./config/ConfigurationManager');
            const configManager = ConfigurationManager.getInstance();
            
            const modelConfig = configManager.getModelConfig(modelId);
            if (!modelConfig) {
                console.warn(`Model ${modelId} not found in configuration`);
                return null;
            }
            
            const provider = this.providers.get(modelConfig.provider);
            if (!provider || !provider.initialized) {
                console.warn(`Provider ${modelConfig.provider} not available for model ${modelId}`);
                return null;
            }
            
            return {
                name: modelConfig.provider,
                ...provider
            };
        } catch (error) {
            console.error(`Error getting provider for model ${modelId}:`, error);
            return null;
        }
    }
    
    /**
     * Handle API errors with retry and fallback
     */
    async handleError(error, originalOptions, retryCount = 0) {
        console.error(`API Error: ${error.message}`);
        
        // Check if we should retry
        if (retryCount < this.retryConfig.maxRetries && this.isRetryableError(error)) {
            const delay = Math.min(
                this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffFactor, retryCount),
                this.retryConfig.maxDelay
            );
            
            console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1}/${this.retryConfig.maxRetries})`);
            await this.sleep(delay);
            
            return await this.complete(originalOptions, retryCount + 1);
        }
        
        // Try fallback model
        try {
            const ConfigurationManager = require('./config/ConfigurationManager');
            const configManager = ConfigurationManager.getInstance();
            const fallbacks = configManager.getFallbackChain(originalOptions.model);
            
            if (fallbacks && fallbacks.length > 0) {
                for (const fallbackModel of fallbacks) {
                    try {
                        console.log(`Trying fallback model: ${fallbackModel}`);
                        return await this.complete({
                            ...originalOptions,
                            model: fallbackModel
                        });
                    } catch (fallbackError) {
                        console.error(`Fallback ${fallbackModel} also failed: ${fallbackError.message}`);
                    }
                }
            }
        } catch (fallbackError) {
            console.error(`Error accessing fallback chain: ${fallbackError.message}`);
        }
        
        // All retries and fallbacks exhausted
        throw error;
    }
    
    /**
     * Check if error is retryable
     */
    isRetryableError(error) {
        const retryableStatuses = [429, 500, 502, 503, 504];
        const retryableMessages = ['rate limit', 'timeout', 'temporarily unavailable'];
        
        return retryableStatuses.includes(error.status) ||
               retryableMessages.some(msg => error.message.toLowerCase().includes(msg));
    }
    
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Check provider availability
     */
    async checkProviderHealth() {
        const health = {};
        
        for (const [name, provider] of this.providers) {
            health[name] = {
                initialized: provider.initialized,
                models: provider.models,
                available: await this.testProvider(name)
            };
        }
        
        return health;
    }
    
    /**
     * Test if provider is responding
     */
    async testProvider(providerName) {
        try {
            const testModels = {
                'google': 'flash-lite',
                'openai': 'gpt-4-mini',
                'anthropic': 'sonnet-4',
                'deepseek': 'deepseek-v3'
            };
            
            const model = testModels[providerName];
            if (!model) return false;
            
            await this.complete({
                model: model,
                messages: [{ role: 'user', content: 'Hi' }],
                maxTokens: 10
            });
            
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = MultiModelAPIManager;
