/**
 * Enhanced Trade Analysis Service - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.3-gpt4-vision-integration-service.md
 * Fully integrated service with image processing, monitoring, cost tracking, and circuit breaker
 * Created: 2025-08-15
 */

import OpenAI from 'openai';
import { tradeAnalysisErrorHandler } from './trade-analysis-error-handler.js';
import { ExternalServiceError } from '../middleware/error-handler.js';
import { imagePreprocessingService } from './image-preprocessing-service.js';
import { imageProcessingPipeline } from './image-processing-pipeline.js';
import { costTrackingService } from './cost-tracking-service.js';
import { gptVisionCircuitBreaker } from './circuit-breaker-service.js';
import { gptVisionMonitoring } from './monitoring-service.js';

/**
 * Enhanced Trade Analysis Service Class
 * Integrates all backend services for comprehensive GPT-4 Vision analysis
 */
export class EnhancedTradeAnalysisService {
  constructor() {
    this.openai = null;
    this.initialized = false;
    this.apiKey = null;
    this.requestTimeout = 30000; // 30 seconds
    this.maxTokens = 1000;
    this.mockMode = false;
    
    // Service integrations
    this.imageProcessor = imagePreprocessingService;
    this.imagePipeline = imageProcessingPipeline;
    this.costTracker = costTrackingService;
    this.circuitBreaker = gptVisionCircuitBreaker;
    this.monitor = gptVisionMonitoring;
    
    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for integrated services
   */
  setupEventListeners() {
    // Circuit breaker alerts
    this.circuitBreaker.on('circuitOpen', (data) => {
      this.monitor.log('critical', 'Circuit breaker opened - API calls suspended', data);
    });

    this.circuitBreaker.on('circuitClose', (data) => {
      this.monitor.log('info', 'Circuit breaker closed - API calls resumed', data);
    });

    // Cost tracking alerts  
    this.costTracker.onBudgetAlert((alert) => {
      this.monitor.log('warn', 'Budget alert triggered', alert);
    });
  }

  /**
   * Initialize OpenAI client with enhanced features
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.apiKey = process.env.OPENAI_API_KEY;
      
      // Check if we should use mock mode
      const useMockMode = process.env.USE_MOCK_OPENAI === 'true' || !this.isValidApiKey(this.apiKey);
      
      if (useMockMode) {
        this.monitor.log('warn', 'Running in MOCK MODE - not production ready');
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
      
      this.monitor.log('info', 'Enhanced Trade Analysis Service initialized with production OpenAI API', {
        mockMode: this.mockMode,
        timeout: this.requestTimeout,
        maxTokens: this.maxTokens
      });
      
    } catch (error) {
      this.monitor.log('error', 'Failed to initialize Enhanced Trade Analysis Service', { error: error.message });
      throw new ExternalServiceError('OpenAI', 'Failed to initialize AI service');
    }
  }

  /**
   * Analyze trade chart image with full backend integration
   * @param {Buffer|string} imageInput - Image buffer or base64 data
   * @param {Object} fileMetadata - Original file metadata
   * @param {string} description - Optional text description
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeChartWithImageProcessing(imageInput, fileMetadata, description = '', options = {}) {
    this.ensureInitialized();

    const requestId = options.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = options.userId || null;

    // Start monitoring
    const trackingContext = this.monitor.trackRequestStart(requestId, {
      endpoint: '/api/analyze-trade',
      userId,
      model: 'gpt-4-vision-preview',
      hasImage: true,
      retryCount: options.retryCount || 0,
      clientIP: options.clientIP,
      userAgent: options.userAgent
    });

    try {
      // Check budget permissions
      const budgetPermission = this.costTracker.checkRequestPermission(userId);
      if (!budgetPermission.allowed) {
        throw new ExternalServiceError('BudgetLimit', budgetPermission.reason);
      }

      this.monitor.log('info', `Starting enhanced trade analysis for request ${requestId}`, {
        userId,
        hasDescription: !!description,
        budgetStatus: budgetPermission.budgetStatus
      });

      // Step 1: Process image through pipeline
      let imageBuffer;
      if (Buffer.isBuffer(imageInput)) {
        imageBuffer = imageInput;
      } else if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
        // Convert base64 data URL to buffer
        const base64Data = imageInput.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        throw new Error('Invalid image input format');
      }

      this.monitor.log('debug', `Processing image through pipeline for request ${requestId}`, {
        imageSize: imageBuffer.length,
        originalFilename: fileMetadata.originalname
      });

      const imageProcessingResult = await this.imagePipeline.processImage(
        imageBuffer, 
        fileMetadata, 
        {
          createThumbnail: true,
          quality: 85,
          ...options.imageProcessing
        }
      );

      if (!imageProcessingResult.success) {
        throw new Error(`Image processing failed: ${imageProcessingResult.errors[0]?.error}`);
      }

      // Step 2: Prepare analysis prompts
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(description);
      const imageContent = await this.prepareImageContent(imageProcessingResult.data.processedImage.dataUrl);

      // Step 3: Execute GPT-4 Vision API call with circuit breaker protection
      const apiResponse = await this.circuitBreaker.execute(async () => {
        return await this.callOpenAIVision(systemPrompt, userPrompt, imageContent, {
          ...options,
          description,
          requestId
        });
      }, {
        requestId,
        userId,
        endpoint: '/api/analyze-trade',
        model: 'gpt-4-vision-preview'
      });

      // Step 4: Parse and validate response
      const analysisResult = this.parseAnalysisResponse(apiResponse);

      // Step 5: Track costs and usage
      const costTracking = this.costTracker.trackUsage({
        requestId,
        userId,
        model: 'gpt-4-vision-preview',
        usage: apiResponse.usage || { total_tokens: 0 },
        hasImage: true,
        imageDetail: 'high',
        processingTime: Date.now() - trackingContext.startTime
      });

      // Step 6: Compile comprehensive result
      const comprehensiveResult = {
        success: true,
        data: {
          verdict: analysisResult.verdict,
          confidence: analysisResult.confidence,
          reasoning: analysisResult.reasoning,
          analysisMode: this.mockMode ? 'mock' : 'production',
          processingTime: Date.now() - trackingContext.startTime
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          model: this.mockMode ? 'gpt-4-vision-preview-mock' : 'gpt-4-vision-preview',
          tokensUsed: apiResponse.usage?.total_tokens || 0,
          cost: costTracking.cost,
          mockMode: this.mockMode,
          imageProcessing: {
            originalSize: imageProcessingResult.metadata.originalFile.size || imageBuffer.length,
            processedSize: imageProcessingResult.data.processedImage.fileSize?.processed || 0,
            compressionRatio: imageProcessingResult.data.processingMetrics?.compressionAchieved || 0,
            qualityScore: imageProcessingResult.data.qualityScore || 85,
            processingTime: imageProcessingResult.metadata.totalTime || 0,
            pipelineId: imageProcessingResult.pipelineId
          },
          circuitBreakerStatus: this.circuitBreaker.getStatus().state,
          budgetStatus: budgetPermission.budgetStatus
        },
        thumbnail: imageProcessingResult.data.thumbnail
      };

      // Complete monitoring tracking
      this.monitor.trackRequestEnd(requestId, {
        success: true,
        tokensUsed: apiResponse.usage?.total_tokens || 0,
        cost: costTracking.cost.totalCost
      });

      this.monitor.log('info', `Enhanced trade analysis completed successfully for request ${requestId}`, {
        processingTime: comprehensiveResult.data.processingTime,
        verdict: analysisResult.verdict,
        confidence: analysisResult.confidence,
        cost: costTracking.cost.totalCost,
        circuitBreakerState: this.circuitBreaker.getStatus().state
      });

      return comprehensiveResult;

    } catch (error) {
      // Track error in monitoring
      this.monitor.trackError(error, {
        requestId,
        userId,
        endpoint: '/api/analyze-trade'
      });

      // Complete monitoring tracking with error
      this.monitor.trackRequestEnd(requestId, {
        success: false,
        error: error.message
      });

      this.monitor.log('error', `Enhanced trade analysis failed for request ${requestId}`, {
        error: error.message,
        userId,
        processingTime: Date.now() - trackingContext.startTime
      });

      // Handle error through error handler
      const errorResponse = await tradeAnalysisErrorHandler.handleError(error, {
        requestId,
        userId,
        processingTime: Date.now() - trackingContext.startTime,
        canRetry: (options.retryCount || 0) < 2
      });

      // If should retry, throw error to trigger retry
      if (errorResponse.shouldRetry) {
        this.monitor.trackRequestRetry(requestId, (options.retryCount || 0) + 1, error.message);
        error.retryCount = errorResponse.retryCount;
        throw error;
      }

      // Return formatted error response
      throw new ExternalServiceError('TradeAnalysis', errorResponse.message);
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async analyzeChart(imageUrl, description = '', options = {}) {
    // Convert imageUrl to buffer if needed for enhanced processing
    let imageBuffer;
    let fileMetadata = {
      originalname: 'chart-image.jpg',
      mimetype: 'image/jpeg',
      size: 0
    };

    if (typeof imageUrl === 'string' && imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
      fileMetadata.size = imageBuffer.length;
      
      // Detect format from data URL
      const formatMatch = imageUrl.match(/data:image\/([a-zA-Z]*);base64,/);
      if (formatMatch) {
        fileMetadata.mimetype = `image/${formatMatch[1]}`;
        fileMetadata.originalname = `chart-image.${formatMatch[1]}`;
      }
    } else {
      // Fallback to legacy behavior for URL inputs
      return this.legacyAnalyzeChart(imageUrl, description, options);
    }

    return this.analyzeChartWithImageProcessing(imageBuffer, fileMetadata, description, options);
  }

  /**
   * Legacy analyze chart method (without image processing pipeline)
   */
  async legacyAnalyzeChart(imageUrl, description = '', options = {}) {
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
      this.monitor.log('info', `Starting legacy trade analysis for request ${requestId}`, {
        userId,
        hasDescription: !!description
      });

      // Prepare the analysis prompt
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(description);

      // Prepare image content
      const imageContent = await this.prepareImageContent(imageUrl);

      // Call OpenAI Vision API
      const response = await this.callOpenAIVision(systemPrompt, userPrompt, imageContent, { ...options, description });

      // Parse and validate response
      const analysisResult = this.parseAnalysisResponse(response);

      // Calculate processing metrics
      const processingTime = Date.now() - startTime;

      this.monitor.log('info', `Legacy trade analysis completed for request ${requestId}`, {
        processingTime,
        verdict: analysisResult.verdict,
        confidence: analysisResult.confidence
      });

      return {
        success: true,
        data: {
          verdict: analysisResult.verdict,
          confidence: analysisResult.confidence,
          reasoning: analysisResult.reasoning,
          analysisMode: this.mockMode ? 'mock' : 'analysis',
          processingTime
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          model: this.mockMode ? 'gpt-4-vision-preview-mock' : 'gpt-4-vision-preview',
          tokensUsed: response.usage?.total_tokens || 0,
          processingTime,
          mockMode: this.mockMode
        }
      };

    } catch (error) {
      this.monitor.log('error', `Legacy trade analysis failed for request ${requestId}`, {
        error: error.message,
        userId,
        processingTime: Date.now() - startTime
      });

      // Handle error through error handler
      const errorResponse = await tradeAnalysisErrorHandler.handleError(error, {
        requestId,
        userId,
        processingTime: Date.now() - startTime,
        canRetry: (options.retryCount || 0) < 2
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
   * Call OpenAI Vision API with enhanced error handling and monitoring
   */
  async callOpenAIVision(systemPrompt, userPrompt, imageContent, options = {}) {
    // Check if we should use mock mode
    if (this.mockMode) {
      this.monitor.log('debug', 'Generating mock response for GPT-4 Vision analysis', {
        requestId: options.requestId
      });
      return await this.generateMockResponse(imageContent, userPrompt, options.description);
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

      this.monitor.log('debug', 'Calling OpenAI GPT-4 Vision API', {
        requestId: options.requestId,
        model: 'gpt-4-vision-preview',
        maxTokens: this.maxTokens
      });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages,
        max_tokens: this.maxTokens,
        temperature: 0.3, // Lower temperature for more consistent analysis
        timeout: this.requestTimeout
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response from OpenAI API');
      }

      this.monitor.log('debug', 'OpenAI API response received successfully', {
        requestId: options.requestId,
        tokensUsed: response.usage?.total_tokens || 0,
        choices: response.choices.length
      });

      return response;

    } catch (error) {
      this.monitor.log('error', 'OpenAI API call failed', {
        requestId: options.requestId,
        error: error.message,
        statusCode: error.status
      });

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
   */
  buildSystemPrompt() {
    return `You are an expert trading coach analyzing chart images. Your task is to provide trading recommendations based on technical analysis.

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

Keep reasoning concise but informative (max 200 words).`;
  }

  /**
   * Build user prompt for trade analysis
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
      this.monitor.log('error', 'Failed to parse analysis response', { error: error.message });
      throw new Error('AI processing failed');
    }
  }

  /**
   * Generate mock response for testing/development
   */
  async generateMockResponse(imageContent, prompt, description = '') {
    // Simulate processing delay (1-2 seconds)
    const delay = Math.random() * 1000 + 1000;
    
    return new Promise(resolve => {
      setTimeout(() => {
        const mockResponses = [
          {
            choices: [{
              message: {
                content: JSON.stringify({
                  verdict: "Diamond",
                  confidence: 85,
                  reasoning: "Strong upward trend with volume confirmation and clean breakout pattern. Support level at current price range with resistance at 15% above current levels. Risk/reward ratio favorable with clear entry point identified."
                })
              }
            }],
            usage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
          },
          {
            choices: [{
              message: {
                content: JSON.stringify({
                  verdict: "Skull",
                  confidence: 78,
                  reasoning: "Clear downward momentum with resistance rejection and declining volume. Multiple failed attempts to break key resistance levels. Bearish divergence present in momentum indicators."
                })
              }
            }],
            usage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
          },
          {
            choices: [{
              message: {
                content: JSON.stringify({
                  verdict: "Fire",
                  confidence: 62,
                  reasoning: "Mixed signals present - opportunity exists but requires careful risk management. Consolidation pattern suggests potential breakout in either direction. Volume analysis inconclusive."
                })
              }
            }],
            usage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
          }
        ];
        
        // Simple selection logic based on description content
        let selectedResponse;
        const descriptionLower = description.toLowerCase();
        
        // Count bullish vs bearish signals  
        const bullishKeywords = ['bull', 'strong breakout', 'moving up', 'rise', 'gain', 'bullish', 'diamond'];
        const bearishKeywords = ['bear', 'down', 'weak', 'fail', 'drop', 'decline', 'bearish', 'skull'];
        
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

  /**
   * Health check for the enhanced service
   */
  async healthCheck() {
    try {
      this.ensureInitialized();
      
      const healthData = {
        status: 'healthy',
        initialized: this.initialized,
        mockMode: this.mockMode,
        hasApiKey: !!this.apiKey,
        timestamp: new Date().toISOString(),
        services: {
          imageProcessing: this.imageProcessor ? 'available' : 'unavailable',
          imagePipeline: this.imagePipeline ? 'available' : 'unavailable',
          costTracking: this.costTracker ? 'available' : 'unavailable',
          circuitBreaker: {
            status: this.circuitBreaker.getStatus().state,
            health: this.circuitBreaker.getStatus().health
          },
          monitoring: this.monitor ? 'available' : 'unavailable'
        }
      };
      
      // Test OpenAI connection if not in mock mode
      if (!this.mockMode && this.openai) {
        try {
          await this.openai.models.list();
          healthData.openaiConnection = 'connected';
        } catch (error) {
          healthData.openaiConnection = 'disconnected';
          healthData.status = 'degraded';
          healthData.openaiError = error.message;
        }
      }

      return healthData;
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        initialized: this.initialized,
        mockMode: this.mockMode,
        hasApiKey: !!this.apiKey,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get comprehensive service configuration and statistics
   */
  getEnhancedConfiguration() {
    const baseConfig = {
      initialized: this.initialized,
      mockMode: this.mockMode,
      requestTimeout: this.requestTimeout,
      maxTokens: this.maxTokens,
      hasApiKey: !!this.apiKey
    };

    // Add integrated service configurations
    return {
      service: baseConfig,
      imageProcessing: this.imageProcessor?.getProcessingStats() || null,
      imagePipeline: this.imagePipeline?.getProcessingStatistics() || null,
      costTracking: this.costTracker?.getUsageStatistics() || null,
      circuitBreaker: this.circuitBreaker?.getStatus() || null,
      monitoring: this.monitor?.getMonitoringReport() || null
    };
  }

  /**
   * Ensure service is initialized
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new ExternalServiceError('OpenAI', 'Enhanced AI service not initialized');
    }
  }

  /**
   * Validate OpenAI API key format
   */
  isValidApiKey(apiKey) {
    return apiKey && 
           apiKey !== 'your-openai-api-key-here' && 
           apiKey !== 'sk-dev-api-key-here' && 
           apiKey.startsWith('sk-') && 
           apiKey.length > 20;
  }
}

/**
 * Global enhanced service instance
 */
export const enhancedTradeAnalysisService = new EnhancedTradeAnalysisService();

// Auto-initialize if API key is available
if (process.env.OPENAI_API_KEY) {
  enhancedTradeAnalysisService.initialize().catch(error => {
    console.error('Failed to auto-initialize Enhanced Trade Analysis Service:', error.message);
  });
}

export default EnhancedTradeAnalysisService;