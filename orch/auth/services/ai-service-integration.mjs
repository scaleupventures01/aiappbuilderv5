/**
 * AI Service Integration
 * Provides unified AI service integration for psychology coaching, trade analysis, and training
 */

import { logger } from '../lib/logger.mjs';
import AIPromptTemplates from './ai-prompt-templates.mjs';
import { PsychologyCoachingService } from './psychology-coaching-service.mjs';
import { TrainingAICoach } from './training-ai-coach.mjs';
import { AIPerformanceAnalyzer } from './ai-performance-analyzer.mjs';
import { AIPatternRecognition } from './ai-pattern-recognition.mjs';

export class AIServiceIntegration {
  constructor() {
    this.psychologyService = new PsychologyCoachingService();
    this.trainingCoach = new TrainingAICoach();
    this.performanceAnalyzer = new AIPerformanceAnalyzer();
    this.patternRecognition = new AIPatternRecognition();
    
    // AI service configuration
    this.aiConfig = {
      primaryModel: 'gpt-4-1106-preview', // For complex reasoning and coaching
      fastModel: 'gpt-3.5-turbo', // For quick responses and simple tasks
      analysisModel: 'claude-3-opus', // For deep analysis tasks
      maxTokens: {
        coaching: 1500,
        analysis: 2000,
        training: 1200,
        quick: 800
      },
      temperature: {
        coaching: 0.7, // More creative for coaching
        analysis: 0.3, // More factual for analysis
        training: 0.5, // Balanced for training
        patterns: 0.2  // Very factual for pattern recognition
      }
    };
  }

  /**
   * Enhanced psychology coaching with AI integration
   */
  async enhancedPsychologyCoaching(userId, sessionData, options = {}) {
    try {
      const {
        useAdvancedModel = true,
        includePatternAnalysis = true,
        generateFollowUpQuestions = true,
        contextDepth = 'comprehensive'
      } = options;

      // Build comprehensive coaching context
      const coachingContext = await this.buildCoachingContext(userId, sessionData, contextDepth);

      // Run pattern analysis if requested
      let patternInsights = null;
      if (includePatternAnalysis) {
        patternInsights = await this.patternRecognition.analyzeAndUpdatePatterns(userId, {
          analysisWindow: 14,
          includeCoachingFeedback: true
        });
      }

      // Generate AI coaching prompt with full context
      const prompt = AIPromptTemplates.buildPsychologyCoachingPrompt({
        ...coachingContext,
        patternInsights: patternInsights?.patternsIdentified || []
      });

      // Select appropriate AI model and parameters
      const modelConfig = {
        model: useAdvancedModel ? this.aiConfig.primaryModel : this.aiConfig.fastModel,
        maxTokens: this.aiConfig.maxTokens.coaching,
        temperature: this.aiConfig.temperature.coaching
      };

      // Generate AI response
      const aiResponse = await this.generateAIResponse(prompt, modelConfig, 'psychology-coaching');

      // Process and enhance AI response
      const enhancedResponse = await this.enhanceCoachingResponse(aiResponse, coachingContext, patternInsights);

      // Generate follow-up questions if requested
      let followUpQuestions = null;
      if (generateFollowUpQuestions) {
        followUpQuestions = await this.generateFollowUpQuestions(enhancedResponse, coachingContext);
      }

      // Create coaching session with enhanced data
      const sessionResult = await this.psychologyService.createCoachingSession(userId, {
        ...sessionData,
        aiResponse: enhancedResponse.content,
        aiInsights: enhancedResponse.insights,
        patternUpdates: patternInsights,
        followUpQuestions
      });

      // Track AI usage for optimization
      await this.trackAIUsage('psychology-coaching', modelConfig, prompt.length, enhancedResponse.content.length);

      logger.info('Enhanced psychology coaching completed', {
        userId,
        sessionType: sessionData.sessionType,
        modelUsed: modelConfig.model,
        patternsAnalyzed: patternInsights?.patternsIdentified?.length || 0,
        responseLength: enhancedResponse.content.length
      });

      return {
        sessionResult,
        enhancedResponse,
        patternInsights,
        followUpQuestions,
        coachingMetadata: {
          modelUsed: modelConfig.model,
          contextDepth,
          processingTime: Date.now() - coachingContext.startTime
        }
      };

    } catch (error) {
      logger.error('Enhanced psychology coaching failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * AI-powered trade analysis integration
   */
  async enhancedTradeAnalysis(userId, analysisRequest, options = {}) {
    try {
      const {
        analysisType = 'comprehensive',
        includeChartAnalysis = false,
        generateRecommendations = true,
        compareToBaselines = true
      } = options;

      // Prepare trade analysis context
      const analysisContext = await this.buildTradeAnalysisContext(userId, analysisRequest);

      // Perform comprehensive analysis
      const analysisResults = await this.performanceAnalyzer.performComprehensiveAnalysis(userId, {
        analysisType,
        timeframe: analysisRequest.timeframe || 30,
        generateRecommendations
      });

      // Generate AI-powered insights
      const aiInsights = await this.generateTradeAnalysisInsights(analysisResults, analysisContext, {
        includeChartAnalysis,
        compareToBaselines
      });

      // Enhance with pattern correlations
      const patternCorrelations = await this.findPatternCorrelations(analysisResults, userId);

      // Generate actionable recommendations
      const actionableRecommendations = await this.generateActionableRecommendations(
        analysisResults,
        aiInsights,
        patternCorrelations
      );

      return {
        analysisResults,
        aiInsights,
        patternCorrelations,
        actionableRecommendations,
        analysisMetadata: {
          analysisType,
          modelUsed: this.aiConfig.analysisModel,
          contextFactors: Object.keys(analysisContext).length
        }
      };

    } catch (error) {
      logger.error('Enhanced trade analysis failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Training scenario AI integration
   */
  async enhancedTrainingGuidance(userId, scenarioId, currentStep, options = {}) {
    try {
      const {
        adaptiveGuidance = true,
        personalizedCoaching = true,
        progressTracking = true
      } = options;

      // Get personalized guidance from training coach
      const guidanceResult = await this.trainingCoach.provideScenarioGuidance(userId, scenarioId, currentStep, options);

      // Enhance with adaptive AI responses
      if (adaptiveGuidance) {
        guidanceResult.adaptiveEnhancements = await this.enhanceTrainingGuidance(
          guidanceResult,
          userId,
          scenarioId
        );
      }

      // Add personalized coaching elements
      if (personalizedCoaching) {
        guidanceResult.personalizedElements = await this.addPersonalizedTrainingElements(
          guidanceResult,
          userId
        );
      }

      // Update progress tracking
      if (progressTracking) {
        guidanceResult.progressUpdate = await this.updateTrainingProgress(
          userId,
          scenarioId,
          currentStep,
          guidanceResult
        );
      }

      return guidanceResult;

    } catch (error) {
      logger.error('Enhanced training guidance failed', { userId, scenarioId, currentStep, error: error.message });
      throw error;
    }
  }

  /**
   * Chat integration with trade-aware AI
   */
  async processTradeAwareChat(userId, messageData, options = {}) {
    try {
      const {
        mode = 'General',
        useTradeContext = true,
        generateCoachingInsights = false,
        adaptToUserStyle = true
      } = options;

      // Build chat context with trade awareness
      const chatContext = await this.buildChatContext(userId, messageData, useTradeContext);

      // Select appropriate AI model based on message complexity
      const modelConfig = this.selectChatModel(messageData.message, mode);

      // Generate context-aware response
      const aiResponse = await this.generateContextAwareResponse(
        messageData,
        chatContext,
        modelConfig,
        mode
      );

      // Enhance response with coaching insights if requested
      if (generateCoachingInsights && mode === 'Psychology-Coaching') {
        aiResponse.coachingInsights = await this.extractCoachingInsights(aiResponse, chatContext);
      }

      // Adapt response to user's communication style
      if (adaptToUserStyle) {
        aiResponse.content = await this.adaptResponseToUserStyle(aiResponse.content, userId);
      }

      // Process through chat integration service
      const chatResult = await this.processChatMessage(userId, {
        ...messageData,
        aiEnhancedResponse: aiResponse
      });

      return {
        chatResult,
        aiResponse,
        chatContext,
        processingMetadata: {
          modelUsed: modelConfig.model,
          mode,
          contextFactors: Object.keys(chatContext).length
        }
      };

    } catch (error) {
      logger.error('Trade-aware chat processing failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Real-time performance monitoring with AI alerts
   */
  async setupRealTimeMonitoring(userId, options = {}) {
    try {
      const {
        alertThresholds = {},
        monitoringFrequency = 'medium', // low, medium, high
        aiInsightGeneration = true
      } = options;

      // Setup performance monitoring
      const monitoringConfig = await this.configurePerformanceMonitoring(userId, alertThresholds);

      // Initialize AI-powered alerts
      const alertSystem = await this.initializeAIAlertSystem(userId, monitoringConfig);

      // Setup pattern detection monitoring
      const patternMonitoring = await this.setupPatternMonitoring(userId, monitoringFrequency);

      if (aiInsightGeneration) {
        // Setup real-time insight generation
        await this.setupRealTimeInsightGeneration(userId, monitoringConfig);
      }

      return {
        monitoringConfig,
        alertSystem,
        patternMonitoring,
        status: 'active'
      };

    } catch (error) {
      logger.error('Real-time monitoring setup failed', { userId, error: error.message });
      throw error;
    }
  }

  // Private helper methods

  async buildCoachingContext(userId, sessionData, contextDepth) {
    const startTime = Date.now();
    
    // Get comprehensive context based on depth setting
    const contextOptions = {
      includeTradeHistory: true,
      includeCoachingHistory: true,
      includePsychologyPatterns: true,
      includePerformanceMetrics: true,
      includePlanAdherence: true,
      tradeHistoryDays: contextDepth === 'comprehensive' ? 30 : 14,
      coachingHistoryDays: contextDepth === 'comprehensive' ? 14 : 7,
      maxTrades: contextDepth === 'comprehensive' ? 50 : 25,
      maxCoachingSessions: contextDepth === 'comprehensive' ? 20 : 10
    };

    const context = await this.psychologyService.buildPerformanceContext(userId, contextOptions.tradeHistoryDays);
    
    return {
      ...context,
      sessionData,
      contextDepth,
      startTime
    };
  }

  async generateAIResponse(prompt, modelConfig, responseType) {
    try {
      // This would integrate with your chosen AI service (OpenAI, Anthropic, etc.)
      // For now, return a structured response that demonstrates the integration pattern
      
      const response = {
        content: `[AI Response generated using ${modelConfig.model} for ${responseType}]\n\nBased on the comprehensive context provided, here's my analysis and coaching response:\n\n${this.generatePlaceholderResponse(responseType)}`,
        model: modelConfig.model,
        tokens: {
          prompt: this.estimateTokens(prompt),
          completion: modelConfig.maxTokens
        },
        metadata: {
          temperature: modelConfig.temperature,
          responseType,
          generatedAt: new Date()
        }
      };

      return response;

    } catch (error) {
      logger.error('AI response generation failed', { modelConfig, responseType, error: error.message });
      throw error;
    }
  }

  async enhanceCoachingResponse(aiResponse, coachingContext, patternInsights) {
    const enhanced = {
      content: aiResponse.content,
      insights: [],
      emotionalAssessment: null,
      riskManagementFocus: null,
      disciplineCoaching: null,
      nextSteps: []
    };

    // Extract specific insights from AI response
    enhanced.insights = this.extractResponseInsights(aiResponse.content);

    // Add pattern-based insights
    if (patternInsights?.patternsIdentified?.length > 0) {
      enhanced.patternBasedCoaching = this.generatePatternBasedCoaching(patternInsights.patternsIdentified);
    }

    // Generate emotional assessment
    enhanced.emotionalAssessment = this.assessEmotionalState(coachingContext);

    // Add risk management focus if needed
    enhanced.riskManagementFocus = this.generateRiskFocus(coachingContext);

    return enhanced;
  }

  async generateFollowUpQuestions(enhancedResponse, coachingContext) {
    const questions = [];

    // Generate context-appropriate follow-up questions
    if (coachingContext.sessionData.sessionType === 'Post-Market') {
      questions.push("What specific aspect of today's trading would you like to explore further?");
      questions.push("How did your emotional state change throughout the trading session?");
    }

    if (coachingContext.performanceContext?.comparison?.recommendations?.length > 0) {
      questions.push("Which of these improvement areas feels most urgent to you right now?");
    }

    return questions.slice(0, 3); // Limit to 3 questions
  }

  selectChatModel(message, mode) {
    const messageLength = message.length;
    const complexity = this.assessMessageComplexity(message);

    if (mode === 'Psychology-Coaching' || complexity === 'high' || messageLength > 500) {
      return {
        model: this.aiConfig.primaryModel,
        maxTokens: this.aiConfig.maxTokens.coaching,
        temperature: this.aiConfig.temperature.coaching
      };
    } else if (mode === 'Trade-Analysis') {
      return {
        model: this.aiConfig.analysisModel,
        maxTokens: this.aiConfig.maxTokens.analysis,
        temperature: this.aiConfig.temperature.analysis
      };
    } else {
      return {
        model: this.aiConfig.fastModel,
        maxTokens: this.aiConfig.maxTokens.quick,
        temperature: this.aiConfig.temperature.coaching
      };
    }
  }

  async generateContextAwareResponse(messageData, chatContext, modelConfig, mode) {
    let prompt;

    switch (mode) {
      case 'Psychology-Coaching':
        prompt = AIPromptTemplates.buildPsychologyCoachingPrompt({
          userMessage: messageData.message,
          ...chatContext
        });
        break;
      case 'Trade-Analysis':
        prompt = AIPromptTemplates.buildTradeAnalysisPrompt({
          tradeData: messageData.relatedTrades?.[0] || {},
          chartImageUrl: messageData.chartImageUrl,
          analysisType: 'comprehensive',
          ...chatContext
        });
        break;
      default:
        prompt = this.buildGeneralChatPrompt(messageData, chatContext);
    }

    return await this.generateAIResponse(prompt, modelConfig, mode);
  }

  async trackAIUsage(usageType, modelConfig, promptTokens, responseTokens) {
    const usage = {
      type: usageType,
      model: modelConfig.model,
      tokens: {
        prompt: promptTokens,
        response: responseTokens,
        total: promptTokens + responseTokens
      },
      timestamp: new Date(),
      cost: this.estimateCost(modelConfig.model, promptTokens + responseTokens)
    };

    logger.info('AI usage tracked', usage);

    // Store usage data for optimization and billing
    // This would integrate with your usage tracking system
  }

  generatePlaceholderResponse(responseType) {
    const responses = {
      'psychology-coaching': 'I can see from your recent trading data that you\'ve been performing well in your training scenarios with a 68% win rate, but your real trading shows some deviation from your plans. Let\'s focus on bridging that gap...',
      'trade-analysis': 'Looking at this trade setup and your historical performance with similar patterns, I notice several key factors that could impact the outcome...',
      'training-guidance': 'In this training scenario, the key learning objective is to develop patience with entry timing. Let me guide you through the analysis...'
    };

    return responses[responseType] || 'I understand your question and will provide guidance based on your trading context and performance data.';
  }

  estimateTokens(text) {
    // Simple estimation - would use proper tokenizer in production
    return Math.ceil(text.length / 4);
  }

  estimateCost(model, tokens) {
    // Simple cost estimation - would use actual pricing in production
    const costs = {
      'gpt-4-1106-preview': 0.00003 * tokens,
      'gpt-3.5-turbo': 0.000002 * tokens,
      'claude-3-opus': 0.000015 * tokens
    };
    return costs[model] || 0;
  }

  assessMessageComplexity(message) {
    if (message.includes('psychology') || message.includes('emotion') || message.includes('pattern')) {
      return 'high';
    }
    if (message.includes('trade') || message.includes('analysis') || message.includes('setup')) {
      return 'medium';
    }
    return 'low';
  }

  extractResponseInsights(responseContent) {
    // Extract key insights from AI response
    return [];
  }

  generatePatternBasedCoaching(patterns) {
    // Generate coaching based on identified patterns
    return patterns.map(pattern => ({
      pattern: pattern.patternName,
      coaching: `Focus on addressing ${pattern.patternName} through ${pattern.coachingRecommendations?.[0] || 'targeted practice'}`
    }));
  }

  assessEmotionalState(coachingContext) {
    // Assess current emotional state from context
    return {
      current: 'stable',
      trends: [],
      recommendations: []
    };
  }

  generateRiskFocus(coachingContext) {
    // Generate risk management focus areas
    return {
      primaryFocus: 'position sizing',
      recommendations: []
    };
  }
}

export default AIServiceIntegration;