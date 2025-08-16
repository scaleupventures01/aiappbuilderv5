/**
 * Trade Analysis Service - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md
 * OpenAI integration for chart analysis with comprehensive error handling
 * Created: 2025-08-15
 */

import OpenAI from 'openai';
import { tradeAnalysisErrorHandler } from './trade-analysis-error-handler.js';
import { ExternalServiceError } from '../middleware/error-handler.js';
import { openaiClientWrapper } from './openai-client.js';
import { getConfig, mapSpeedModeToReasoningEffort, getSpeedModeConfig, validateSpeedMode } from '../../config/openai.js';
import { productionMetrics } from '../../services/production-metrics.js';

/**
 * Trade Analysis Service Class
 */
export class TradeAnalysisService {
  constructor() {
    this.openai = null;
    this.initialized = false;
    this.apiKey = null;
    this.requestTimeout = 30000; // 30 seconds
    this.maxTokens = 1000;
    this.config = null;
  }

  /**
   * Initialize OpenAI client with production mode enforcement
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.apiKey = process.env.OPENAI_API_KEY;
      this.config = getConfig();
      
      // Import production configuration
      const { enforceProdutionMode, productionValidator } = await import('../../config/openai-production.js');
      
      // Enforce production mode requirements
      enforceProdutionMode();
      
      // Check if we should use mock mode (only allowed in non-production)
      const useMockMode = process.env.USE_MOCK_OPENAI === 'true' || !this.isValidApiKey(this.apiKey);
      
      // CRITICAL: Block mock mode in production
      if (process.env.NODE_ENV === 'production' && useMockMode) {
        throw new ExternalServiceError('OpenAI', 
          'Mock mode is not allowed in production environment. ' +
          'Set USE_MOCK_OPENAI=false and provide a valid OpenAI API key.'
        );
      }
      
      if (useMockMode) {
        console.warn('[WARNING] Running in MOCK MODE - not production ready');
        console.warn('Set USE_MOCK_OPENAI=false and provide valid OpenAI API key for production');
        this.mockMode = true;
        this.initialized = true;
        return;
      }

      this.openai = new OpenAI({
        apiKey: this.apiKey,
        timeout: this.requestTimeout
      });

      this.mockMode = false;
      this.initialized = true;
      console.log(`✅ Trade Analysis Service initialized with OpenAI ${this.config.model} API`);
      console.log(`📊 Fallback model: ${this.config.fallbackModel}`);
      console.log(`⚡ Speed mode: ${this.config.speedMode} (reasoning_effort: ${mapSpeedModeToReasoningEffort(this.config.speedMode)})`);
      
      // Log production mode status
      if (productionValidator.isProductionMode()) {
        console.log('🚀 Production mode active - mock responses disabled');
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize Trade Analysis Service:', error.message);
      throw new ExternalServiceError('OpenAI', 'Failed to initialize AI service');
    }
  }

  /**
   * Ensure service is initialized
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new ExternalServiceError('OpenAI', 'AI service not initialized');
    }
  }

  /**
   * Analyze trade chart image with GPT-5 and reasoning_effort support
   * @param {string} imageUrl - URL or base64 data of the chart image
   * @param {string} description - Optional text description
   * @param {Object} options - Analysis options
   * @param {string} options.speedMode - Analysis speed mode: 'super_fast', 'fast', 'balanced', 'high_accuracy'
   * @param {string} options.forceModel - Force specific model (bypass fallback)
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeChart(imageUrl, description = '', options = {}) {
    this.ensureInitialized();

    const startTime = Date.now();
    const requestId = options.requestId || `req_${Date.now()}`;
    const userId = options.userId || null;

    // Set error handler context
    tradeAnalysisErrorHandler.setContext(requestId, userId, {
      endpoint: '/api/analyze-trade',
      imageUrl: imageUrl?.substring(0, 50) + '...',
      hasDescription: !!description,
      startTime
    });

    try {
      console.log(`🔍 Starting trade analysis for request ${requestId}`);

      // Prepare the analysis prompt with speed mode
      const actualSpeedMode = options.speedMode || this.config.speedMode || 'balanced';
      const systemPrompt = this.buildSystemPrompt(actualSpeedMode);
      const userPrompt = this.buildUserPrompt(description);

      // Prepare image content
      const imageContent = await this.prepareImageContent(imageUrl);

      // Call OpenAI Vision API
      const response = await this.callOpenAIVision(systemPrompt, userPrompt, imageContent, { ...options, description });

      // Parse and validate response
      const analysisResult = this.parseAnalysisResponse(response);

      // Calculate processing metrics
      const processingTime = Date.now() - startTime;
      const speedConfig = getSpeedModeConfig(actualSpeedMode);
      const reasoningEffortUsed = response.reasoning_effort || mapSpeedModeToReasoningEffort(actualSpeedMode);

      console.log(`✅ Trade analysis completed for request ${requestId} in ${processingTime}ms`);

      // Record production metrics for monitoring
      if (!this.mockMode) {
        productionMetrics.recordApiRequest({
          responseTime: processingTime,
          success: true,
          tokens: response.usage?.total_tokens || 0,
          cost: this.estimateRequestCost(response.usage),
          model: response.model || this.config.model
        });
      }

      return {
        success: true,
        data: {
          verdict: analysisResult.verdict,
          confidence: analysisResult.confidence,
          reasoning: analysisResult.reasoning,
          analysisMode: this.mockMode ? 'mock' : 'analysis',
          processingTime,
          modelUsed: response.model || (this.mockMode ? `${this.config.model}-mock` : this.config.model),
          fallbackUsed: response.fallbackUsed || false
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          model: this.mockMode ? `${this.config.model}-mock` : this.config.model,
          tokensUsed: response.usage?.total_tokens || 0,
          // Detailed token breakdown
          tokenUsage: response.usage ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens
          } : null,
          processingTime,
          mockMode: this.mockMode,
          // PRD 1.2.6 Speed Selection metadata
          speedMode: actualSpeedMode,
          reasoningEffort: reasoningEffortUsed,
          targetResponseTime: speedConfig.targetResponseTime,
          speedModeDisplayName: speedConfig.displayName,
          speedModeDescription: speedConfig.description,
          // Performance comparison
          speedPerformance: {
            actual: `${processingTime}ms`,
            target: speedConfig.targetResponseTime,
            withinTarget: this.isWithinTargetTime(processingTime, speedConfig.targetResponseTime)
          }
        }
      };

    } catch (error) {
      console.error(`❌ Trade analysis failed for request ${requestId}:`, error.message);
      
      const processingTime = Date.now() - startTime;
      
      // Record failed metrics for production monitoring
      if (!this.mockMode) {
        productionMetrics.recordApiRequest({
          responseTime: processingTime,
          success: false,
          tokens: 0,
          cost: 0,
          model: this.config.model
        });
      }
      
      // Handle error with retry logic
      const errorResponse = await tradeAnalysisErrorHandler.handleError(error, {
        requestId,
        userId,
        processingTime,
        canRetry: options.retryCount < 2
      });

      // If should retry, throw error to trigger retry
      if (errorResponse.shouldRetry) {
        error.retryCount = errorResponse.retryCount;
        throw error;
      }

      // Return formatted error response
      throw new ExternalServiceError('OpenAI', errorResponse.message);
    }
  }

  /**
   * Call OpenAI API with GPT-5 support, reasoning_effort, and fallback handling
   * @param {string} systemPrompt - System prompt
   * @param {string} userPrompt - User prompt
   * @param {Object} imageContent - Image content object
   * @param {Object} options - API options
   * @param {string} options.speedMode - Speed mode for reasoning effort
   * @returns {Promise<Object>} OpenAI response
   */
  async callOpenAIVision(systemPrompt, userPrompt, imageContent, options = {}) {
    // PRODUCTION SAFETY: Block mock mode in production environment
    if (process.env.NODE_ENV === 'production' && this.mockMode) {
      throw new ExternalServiceError('OpenAI',
        'Mock mode is blocked in production. Use real OpenAI API only.'
      );
    }
    
    // Check if we should use mock mode (only in non-production)
    if (this.mockMode) {
      console.log('[MOCK MODE] Generating mock response for AI analysis');
      return await this.generateMockResponse(imageContent, userPrompt, options.description, options.speedMode);
    }

    try {
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt
            },
            imageContent
          ]
        }
      ];

      // Determine speed mode and reasoning effort
      const actualSpeedMode = options.speedMode || this.config.speedMode || 'balanced';
      const speedConfig = getSpeedModeConfig(actualSpeedMode);
      
      // Validate speed mode
      if (!validateSpeedMode(actualSpeedMode)) {
        console.warn(`⚠️ Invalid speed mode '${actualSpeedMode}', falling back to 'balanced'`);
        options.speedMode = 'balanced';
      }

      // Prepare vision completion options
      const visionOptions = {
        max_tokens: this.maxTokens,
        temperature: 0.3, // Lower temperature for more consistent analysis
        model: options.forceModel || this.config.model,
        reasoning_effort: speedConfig.reasoningEffort
      };

      console.log(`🔬 Using model: ${visionOptions.model}`);
      console.log(`⚡ Speed mode: ${actualSpeedMode} (${speedConfig.displayName})`);
      console.log(`🧠 Reasoning effort: ${visionOptions.reasoning_effort}`);
      console.log(`🎯 Target response time: ${speedConfig.targetResponseTime}`);

      // Use the enhanced client wrapper with fallback support
      const response = await openaiClientWrapper.createVisionCompletion(messages, visionOptions);

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response from OpenAI API');
      }

      // Add reasoning effort to response for metadata tracking
      response.reasoning_effort = visionOptions.reasoning_effort;
      response.speedMode = actualSpeedMode;

      return response;

    } catch (error) {
      // Enhanced error handling with speed mode preservation
      console.error(`❌ OpenAI API error with speed mode '${options.speedMode}':`, error.message);
      
      // Transform OpenAI errors into our error types
      if (error.status === 429) {
        throw new Error('rate limit exceeded');
      } else if (error.status === 401) {
        throw new Error('authentication failed');
      } else if (error.status === 403) {
        throw new Error('insufficient credits');
      } else if (error.status >= 500) {
        throw new Error('OpenAI API unavailable');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('OpenAI API connection failed');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('request timeout');
      } else {
        throw error;
      }
    }
  }

  /**
   * Prepare image content for OpenAI API
   * @param {string} imageUrl - Image URL or base64 data
   * @returns {Promise<Object>} Image content object
   */
  async prepareImageContent(imageUrl) {
    try {
      // Handle different image input formats
      if (imageUrl.startsWith('data:image/')) {
        // Base64 image data
        return {
          type: 'image_url',
          image_url: {
            url: imageUrl,
            detail: 'high'
          }
        };
      } else if (imageUrl.startsWith('http')) {
        // URL image
        return {
          type: 'image_url',
          image_url: {
            url: imageUrl,
            detail: 'high'
          }
        };
      } else {
        throw new Error('invalid image format');
      }
    } catch (error) {
      throw new Error('failed to process image');
    }
  }

  /**
   * Build system prompt for trade analysis
   * @returns {string} System prompt
   */
  /**
   * Build system prompt for trade analysis with speed mode optimization
   * @param {string} speedMode - Speed mode for analysis depth
   * @returns {string} System prompt
   */
  buildSystemPrompt(speedMode = null) {
    const actualSpeedMode = speedMode || this.config?.speedMode || 'balanced';
    const speedConfig = getSpeedModeConfig(actualSpeedMode);
    
    const reasoningDepth = {
      'super_fast': 'Provide instant, decisive analysis focusing only on the most critical signals.',
      'fast': 'Provide quick, decisive analysis focusing on the most obvious signals.',
      'balanced': 'Provide thorough analysis considering multiple indicators.',
      'high_accuracy': 'Provide comprehensive analysis examining all available technical indicators and market context.',
      // Legacy support
      'thorough': 'Provide comprehensive analysis examining all available technical indicators and market context.',
      'maximum': 'Provide exhaustive analysis with deep reasoning about market dynamics, psychology, and risk factors.'
    };
    
    const wordLimits = {
      'super_fast': 'concise (max 50 words)',
      'fast': 'concise (max 100 words)',
      'balanced': 'informative (max 200 words)',
      'high_accuracy': 'detailed (max 300 words)',
      'thorough': 'detailed (max 300 words)',
      'maximum': 'detailed (max 300 words)'
    };
    
    return `You are an expert trading coach analyzing chart images. Your task is to provide trading recommendations based on technical analysis.

${reasoningDepth[actualSpeedMode] || reasoningDepth['balanced']}

Speed Mode: ${speedConfig.displayName} - ${speedConfig.description}
Target Response Time: ${speedConfig.targetResponseTime}

IMPORTANT: You must respond with a valid JSON object in this exact format:
{
  "verdict": "Diamond" | "Fire" | "Skull",
  "confidence": number (0-100),
  "reasoning": "detailed explanation of your analysis"
}

Verdict meanings:
- "Diamond": Strong buy signal with high probability of success
- "Fire": Neutral/caution - unclear signals or high risk
- "Skull": Strong sell signal or avoid trade

Analysis criteria:
1. Support and resistance levels
2. Chart patterns (triangles, flags, channels)
3. Volume indicators
4. Trend analysis
5. Risk/reward ratio
6. Market structure

Always provide confidence as an integer between 0-100 based on:
- Signal clarity and strength
- Multiple confirming indicators
- Risk factors present

Keep reasoning ${wordLimits[actualSpeedMode] || wordLimits['balanced']}.`;
  }

  /**
   * Build user prompt for trade analysis
   * @param {string} description - User description
   * @returns {string} User prompt
   */
  buildUserPrompt(description) {
    let prompt = `Please analyze this trading chart and provide your recommendation.`;
    
    if (description && description.trim()) {
      prompt += ` The user provided this context: "${description.trim()}"`;
    }
    
    prompt += `

Focus on:
- Overall trend direction
- Key support/resistance levels  
- Entry and exit points
- Risk assessment
- Probability of success

Respond with only the JSON object as specified.`;

    return prompt;
  }

  /**
   * Parse and validate OpenAI response
   * @param {Object} response - OpenAI API response
   * @returns {Object} Parsed analysis result
   */
  parseAnalysisResponse(response) {
    try {
      const content = response.choices[0].message.content;
      
      // Try to extract JSON from response
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysisData = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!analysisData.verdict || !analysisData.confidence || !analysisData.reasoning) {
        throw new Error('Missing required fields in analysis response');
      }

      // Validate verdict values
      const validVerdicts = ['Diamond', 'Fire', 'Skull'];
      if (!validVerdicts.includes(analysisData.verdict)) {
        throw new Error(`Invalid verdict: ${analysisData.verdict}`);
      }

      // Validate confidence range
      const confidence = parseInt(analysisData.confidence);
      if (isNaN(confidence) || confidence < 0 || confidence > 100) {
        throw new Error(`Invalid confidence score: ${analysisData.confidence}`);
      }

      // Validate reasoning length
      if (!analysisData.reasoning || analysisData.reasoning.length < 10) {
        throw new Error('Reasoning too short or missing');
      }

      return {
        verdict: analysisData.verdict,
        confidence: confidence,
        reasoning: analysisData.reasoning.trim()
      };

    } catch (error) {
      console.error('Failed to parse analysis response:', error.message);
      throw new Error('AI processing failed');
    }
  }

  /**
   * Super fast analysis with minimal reasoning effort
   * @param {string} imageUrl - URL or base64 data of the chart image
   * @param {string} description - Optional text description
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Analysis results
   */
  async superFastAnalysis(imageUrl, description = '', options = {}) {
    return await this.analyzeChart(imageUrl, description, { 
      ...options, 
      speedMode: 'super_fast' 
    });
  }

  /**
   * Quick analysis with fast reasoning (low reasoning_effort)
   * @param {string} imageUrl - URL or base64 data of the chart image
   * @param {string} description - Optional text description
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Analysis results
   */
  async quickAnalysis(imageUrl, description = '', options = {}) {
    return await this.analyzeChart(imageUrl, description, { 
      ...options, 
      speedMode: 'fast' 
    });
  }

  /**
   * High accuracy analysis with comprehensive reasoning
   * @param {string} imageUrl - URL or base64 data of the chart image
   * @param {string} description - Optional text description
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Analysis results
   */
  async highAccuracyAnalysis(imageUrl, description = '', options = {}) {
    return await this.analyzeChart(imageUrl, description, { 
      ...options, 
      speedMode: 'high_accuracy' 
    });
  }

  /**
   * Thorough analysis with high reasoning (high reasoning_effort) - Legacy method
   * @param {string} imageUrl - URL or base64 data of the chart image
   * @param {string} description - Optional text description
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Analysis results
   */
  async thoroughAnalysis(imageUrl, description = '', options = {}) {
    console.warn('⚠️ thoroughAnalysis is deprecated, use highAccuracyAnalysis instead');
    return await this.analyzeChart(imageUrl, description, { 
      ...options, 
      speedMode: 'thorough' 
    });
  }

  /**
   * Maximum depth analysis with highest reasoning effort - Legacy method
   * @param {string} imageUrl - URL or base64 data of the chart image
   * @param {string} description - Optional text description
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Analysis results
   */
  async maximumAnalysis(imageUrl, description = '', options = {}) {
    console.warn('⚠️ maximumAnalysis is deprecated, use highAccuracyAnalysis instead');
    return await this.analyzeChart(imageUrl, description, { 
      ...options, 
      speedMode: 'maximum' 
    });
  }

  /**
   * Retry analysis with exponential backoff
   * @param {Function} analysisFunction - Function to retry
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<any>} Analysis result
   */
  async retryWithBackoff(analysisFunction, maxRetries = 2) {
    return await tradeAnalysisErrorHandler.retryRequest(analysisFunction, { maxRetries });
  }

  /**
   * Health check for the service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      this.ensureInitialized();
      
      // Simple API test (just check if we can create a client)
      const testResponse = await this.openai.models.list();
      
      return {
        status: 'healthy',
        initialized: this.initialized,
        hasApiKey: !!this.apiKey,
        modelsAvailable: testResponse.data?.length > 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        initialized: this.initialized,
        hasApiKey: !!this.apiKey,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get service configuration
   * @returns {Object} Service configuration
   */
  getConfiguration() {
    return {
      initialized: this.initialized,
      requestTimeout: this.requestTimeout,
      maxTokens: this.maxTokens,
      hasApiKey: !!this.apiKey,
      mockMode: this.mockMode,
      model: this.config?.model || 'gpt-5',
      fallbackModel: this.config?.fallbackModel || 'gpt-4o',
      speedMode: this.config?.speedMode || 'balanced',
      reasoningEffort: this.config?.reasoningEffort || 'medium'
    };
  }

  /**
   * Validate OpenAI API key format
   * @param {string} apiKey - API key to validate
   * @returns {boolean} True if valid format
   */
  isValidApiKey(apiKey) {
    return apiKey && 
           apiKey !== 'your-openai-api-key-here' && 
           apiKey !== 'sk-dev-api-key-here' && 
           apiKey.startsWith('sk-') && 
           apiKey.length > 20;
  }

  /**
   * Check if processing time is within target range
   * @param {number} actualTime - Actual processing time in ms
   * @param {string} targetRange - Target time range (e.g., '1-3 seconds')
   * @returns {boolean} True if within target
   */
  isWithinTargetTime(actualTime, targetRange) {
    try {
      const match = targetRange.match(/(\d+)-(\d+)\s*seconds?/);
      if (!match) return false;
      
      const minSeconds = parseInt(match[1]);
      const maxSeconds = parseInt(match[2]);
      const actualSeconds = actualTime / 1000;
      
      return actualSeconds >= minSeconds && actualSeconds <= maxSeconds;
    } catch (error) {
      return false;
    }
  }

  /**
   * Estimate request cost based on token usage
   * @param {Object} usage - Token usage object from OpenAI response
   * @returns {number} Estimated cost in USD
   */
  estimateRequestCost(usage) {
    if (!usage) return 0;
    
    // OpenAI pricing (rough estimates, may need updating)
    const pricing = {
      'gpt-5': { input: 0.005, output: 0.015 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4-vision-preview': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 }
    };
    
    const modelPricing = pricing[this.config?.model] || pricing['gpt-4o'];
    const inputCost = (usage.prompt_tokens / 1000) * modelPricing.input;
    const outputCost = (usage.completion_tokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Generate mock response for testing/development
   * @param {Object} imageContent - Image content object
   * @param {string} prompt - User prompt
   * @param {string} description - Original user description
   * @param {string} speedMode - Speed mode for simulation
   * @returns {Promise<Object>} Mock OpenAI response
   */
  async generateMockResponse(imageContent, prompt, description = '', speedMode = 'balanced') {
    // Simulate processing delay based on speed mode
    const speedConfig = getSpeedModeConfig(speedMode);
    const baseDelay = {
      'super_fast': 500,  // 0.5-1.5 seconds
      'fast': 1000,       // 1-2 seconds
      'balanced': 2000,   // 2-4 seconds
      'high_accuracy': 4000, // 4-8 seconds
      'thorough': 4000,   // Legacy
      'maximum': 6000     // Legacy
    };
    
    const delay = (baseDelay[speedMode] || baseDelay['balanced']) + Math.random() * 1000;
    
    return new Promise(resolve => {
      setTimeout(() => {
        const mockResponses = [
          {
            choices: [{
              message: {
                content: JSON.stringify({
                  verdict: "Diamond",
                  confidence: 85,
                  reasoning: "Strong upward trend with volume confirmation and clean breakout pattern. Support level at current price range with resistance at 15% above current levels."
                })
              }
            }],
            usage: { total_tokens: 0 },
            model: `${this.config?.model || 'gpt-5'}-mock`,
            reasoning_effort: speedConfig.reasoningEffort,
            speedMode: speedMode
          },
          {
            choices: [{
              message: {
                content: JSON.stringify({
                  verdict: "Skull",
                  confidence: 78,
                  reasoning: "Clear downward momentum with resistance rejection and declining volume. Multiple failed attempts to break key resistance levels."
                })
              }
            }],
            usage: { total_tokens: 0 },
            model: `${this.config?.model || 'gpt-5'}-mock`,
            reasoning_effort: speedConfig.reasoningEffort,
            speedMode: speedMode
          },
          {
            choices: [{
              message: {
                content: JSON.stringify({
                  verdict: "Fire",
                  confidence: 62,
                  reasoning: "Mixed signals present - opportunity exists but requires careful risk management. Consolidation pattern suggests potential breakout in either direction."
                })
              }
            }],
            usage: { total_tokens: 0 },
            model: `${this.config?.model || 'gpt-5'}-mock`,
            reasoning_effort: speedConfig.reasoningEffort,
            speedMode: speedMode
          }
        ];
        
        // Simple selection logic based on description content only (ignore template prompt)
        let selectedResponse;
        const descriptionLower = description.toLowerCase();
        
        // Count bullish vs bearish signals  
        const bullishKeywords = ['bull', 'strong breakout', 'moving up', 'rise', 'gain', 'bullish'];
        const bearishKeywords = ['bear', 'down', 'weak', 'fail', 'drop', 'decline', 'bearish'];
        
        let bullishScore = bullishKeywords.reduce((score, keyword) => {
          return score + (descriptionLower.includes(keyword) ? 1 : 0);
        }, 0);
        
        let bearishScore = bearishKeywords.reduce((score, keyword) => {
          return score + (descriptionLower.includes(keyword) ? 1 : 0);
        }, 0);
        
        if (bullishScore > bearishScore && bullishScore > 0) {
          selectedResponse = mockResponses[0]; // Diamond
        } else if (bearishScore > bullishScore && bearishScore > 0) {
          selectedResponse = mockResponses[1]; // Skull
        } else {
          // Random selection for neutral/no hints or tied scores
          selectedResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        }
        
        resolve(selectedResponse);
      }, delay);
    });
  }
}

/**
 * Global service instance
 */
export const tradeAnalysisService = new TradeAnalysisService();

// Auto-initialize if API key is available
if (process.env.OPENAI_API_KEY) {
  tradeAnalysisService.initialize().catch(error => {
    console.error('Failed to auto-initialize Trade Analysis Service:', error.message);
  });
}

export default TradeAnalysisService;