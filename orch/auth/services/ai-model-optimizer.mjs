/**
 * AI Model Optimizer
 * Manages AI model selection, optimization, and performance tracking for different use cases
 */

import { logger } from '../lib/logger.mjs';
import { database } from '../lib/database.mjs';

export class AIModelOptimizer {
  constructor() {
    this.modelRegistry = this.initializeModelRegistry();
    this.performanceMetrics = new Map();
    this.optimizationRules = this.initializeOptimizationRules();
    this.costTracker = new Map();
  }

  /**
   * Initialize model registry with different AI models and their characteristics
   */
  initializeModelRegistry() {
    return {
      // Psychology Coaching Models
      'psychology-primary': {
        name: 'gpt-4-1106-preview',
        provider: 'openai',
        strengths: ['complex reasoning', 'empathy', 'context understanding'],
        cost: 0.00003, // per token
        maxTokens: 4096,
        latency: 'medium',
        useCase: 'psychology-coaching',
        qualityScore: 9.2
      },
      'psychology-fast': {
        name: 'gpt-3.5-turbo',
        provider: 'openai',
        strengths: ['speed', 'cost-effective', 'conversational'],
        cost: 0.000002,
        maxTokens: 4096,
        latency: 'low',
        useCase: 'psychology-coaching',
        qualityScore: 7.8
      },
      'psychology-deep': {
        name: 'claude-3-opus',
        provider: 'anthropic',
        strengths: ['deep analysis', 'nuanced understanding', 'safety'],
        cost: 0.000015,
        maxTokens: 4096,
        latency: 'medium',
        useCase: 'psychology-coaching',
        qualityScore: 9.5
      },

      // Trade Analysis Models
      'analysis-primary': {
        name: 'claude-3-opus',
        provider: 'anthropic',
        strengths: ['analytical thinking', 'technical analysis', 'structured output'],
        cost: 0.000015,
        maxTokens: 4096,
        latency: 'medium',
        useCase: 'trade-analysis',
        qualityScore: 9.3
      },
      'analysis-fast': {
        name: 'gpt-3.5-turbo',
        provider: 'openai',
        strengths: ['speed', 'pattern recognition', 'data analysis'],
        cost: 0.000002,
        maxTokens: 4096,
        latency: 'low',
        useCase: 'trade-analysis',
        qualityScore: 8.1
      },
      'analysis-specialized': {
        name: 'claude-3-sonnet',
        provider: 'anthropic',
        strengths: ['balanced analysis', 'cost-effective', 'reliable'],
        cost: 0.000003,
        maxTokens: 4096,
        latency: 'low-medium',
        useCase: 'trade-analysis',
        qualityScore: 8.7
      },

      // Training Scenario Models
      'training-interactive': {
        name: 'gpt-4-1106-preview',
        provider: 'openai',
        strengths: ['interactive coaching', 'adaptive responses', 'step-by-step guidance'],
        cost: 0.00003,
        maxTokens: 4096,
        latency: 'medium',
        useCase: 'training-guidance',
        qualityScore: 9.0
      },
      'training-evaluation': {
        name: 'claude-3-opus',
        provider: 'anthropic',
        strengths: ['detailed evaluation', 'objective assessment', 'comprehensive feedback'],
        cost: 0.000015,
        maxTokens: 4096,
        latency: 'medium',
        useCase: 'training-evaluation',
        qualityScore: 9.4
      },

      // Pattern Recognition Models
      'pattern-detection': {
        name: 'gpt-4-1106-preview',
        provider: 'openai',
        strengths: ['pattern recognition', 'data correlation', 'insight generation'],
        cost: 0.00003,
        maxTokens: 4096,
        latency: 'medium',
        useCase: 'pattern-analysis',
        qualityScore: 8.9
      },
      'pattern-classification': {
        name: 'claude-3-sonnet',
        provider: 'anthropic',
        strengths: ['classification accuracy', 'consistent output', 'structured analysis'],
        cost: 0.000003,
        maxTokens: 4096,
        latency: 'low-medium',
        useCase: 'pattern-analysis',
        qualityScore: 8.8
      },

      // General Chat Models
      'chat-general': {
        name: 'gpt-3.5-turbo',
        provider: 'openai',
        strengths: ['conversational', 'fast responses', 'general knowledge'],
        cost: 0.000002,
        maxTokens: 4096,
        latency: 'low',
        useCase: 'general-chat',
        qualityScore: 8.0
      },
      'chat-contextual': {
        name: 'claude-3-haiku',
        provider: 'anthropic',
        strengths: ['context awareness', 'safety', 'coherent responses'],
        cost: 0.00000025,
        maxTokens: 4096,
        latency: 'very-low',
        useCase: 'general-chat',
        qualityScore: 7.9
      }
    };
  }

  /**
   * Initialize optimization rules for model selection
   */
  initializeOptimizationRules() {
    return {
      // Quality-first optimization
      'quality-first': {
        priority: ['qualityScore', 'cost', 'latency'],
        weights: { quality: 0.7, cost: 0.2, latency: 0.1 },
        description: 'Prioritize response quality over cost and speed'
      },

      // Cost-effective optimization
      'cost-effective': {
        priority: ['cost', 'qualityScore', 'latency'],
        weights: { quality: 0.4, cost: 0.5, latency: 0.1 },
        description: 'Balance quality with cost considerations'
      },

      // Speed-optimized
      'speed-optimized': {
        priority: ['latency', 'qualityScore', 'cost'],
        weights: { quality: 0.3, cost: 0.2, latency: 0.5 },
        description: 'Prioritize response speed for real-time interactions'
      },

      // Balanced optimization
      'balanced': {
        priority: ['qualityScore', 'cost', 'latency'],
        weights: { quality: 0.5, cost: 0.3, latency: 0.2 },
        description: 'Balanced approach considering all factors'
      }
    };
  }

  /**
   * Select optimal AI model for a specific request
   */
  async selectOptimalModel(requestContext, options = {}) {
    try {
      const {
        useCase,
        priority = 'balanced', // 'quality-first', 'cost-effective', 'speed-optimized', 'balanced'
        userTier = 'standard', // 'basic', 'standard', 'premium'
        urgency = 'normal', // 'low', 'normal', 'high'
        complexityLevel = 'medium', // 'low', 'medium', 'high'
        budgetConstraints = null,
        qualityThreshold = 8.0,
        latencyRequirement = null
      } = options;

      // Get candidate models for the use case
      const candidateModels = this.getCandidateModels(useCase, userTier);

      // Apply filters based on requirements
      const filteredModels = this.applyModelFilters(candidateModels, {
        qualityThreshold,
        budgetConstraints,
        latencyRequirement,
        complexityLevel
      });

      // Score models based on optimization strategy
      const scoredModels = this.scoreModels(filteredModels, requestContext, priority, urgency);

      // Select the best model
      const selectedModel = this.selectBestModel(scoredModels, requestContext);

      // Update model performance tracking
      await this.trackModelSelection(selectedModel, requestContext, options);

      logger.info('Model selected', {
        useCase,
        selectedModel: selectedModel.name,
        priority,
        score: selectedModel.score,
        alternatives: scoredModels.slice(1, 3).map(m => ({ name: m.name, score: m.score }))
      });

      return {
        model: selectedModel,
        alternatives: scoredModels.slice(1, 3),
        selectionReason: this.generateSelectionReason(selectedModel, scoredModels, priority),
        optimizationMetrics: this.calculateOptimizationMetrics(selectedModel, requestContext)
      };

    } catch (error) {
      logger.error('Model selection failed', { requestContext, options, error: error.message });
      throw error;
    }
  }

  /**
   * Optimize model parameters for specific use case
   */
  async optimizeModelParameters(modelId, useCase, performanceData = {}) {
    try {
      const model = this.modelRegistry[modelId];
      if (!model) {
        throw new Error(`Model ${modelId} not found in registry`);
      }

      const currentPerformance = this.performanceMetrics.get(modelId) || this.getDefaultPerformance();
      
      // Analyze performance trends
      const performanceTrends = this.analyzePerformanceTrends(modelId, useCase);

      // Generate optimization recommendations
      const optimizations = this.generateOptimizationRecommendations(
        model,
        currentPerformance,
        performanceTrends,
        performanceData
      );

      // Calculate optimal parameters
      const optimizedParams = this.calculateOptimalParameters(model, optimizations, useCase);

      // Validate optimizations
      const validationResults = await this.validateOptimizations(modelId, optimizedParams);

      logger.info('Model parameters optimized', {
        modelId,
        useCase,
        optimizations: optimizations.length,
        expectedImprovement: validationResults.expectedImprovement
      });

      return {
        modelId,
        optimizedParams,
        optimizations,
        validationResults,
        implementationPlan: this.createImplementationPlan(optimizations)
      };

    } catch (error) {
      logger.error('Model parameter optimization failed', { modelId, useCase, error: error.message });
      throw error;
    }
  }

  /**
   * Track and analyze model performance
   */
  async trackModelPerformance(modelId, requestContext, responseData, userFeedback = null) {
    try {
      const performance = {
        modelId,
        useCase: requestContext.useCase,
        timestamp: new Date(),
        metrics: {
          latency: responseData.latency,
          tokenUsage: responseData.tokenUsage,
          cost: responseData.cost,
          qualityScore: this.calculateQualityScore(responseData, userFeedback),
          userSatisfaction: userFeedback?.satisfaction || null,
          effectivenessScore: this.calculateEffectivenessScore(responseData, requestContext)
        },
        context: {
          complexityLevel: requestContext.complexityLevel,
          urgency: requestContext.urgency,
          sessionType: requestContext.sessionType
        }
      };

      // Update performance metrics
      this.updatePerformanceMetrics(modelId, performance);

      // Check for performance anomalies
      const anomalies = this.detectPerformanceAnomalies(modelId, performance);

      // Update cost tracking
      this.updateCostTracking(modelId, performance.metrics.cost);

      // Trigger optimization if needed
      if (this.shouldTriggerOptimization(modelId, performance)) {
        await this.triggerAutomaticOptimization(modelId, requestContext.useCase);
      }

      return {
        performance,
        anomalies,
        optimizationTriggered: anomalies.length > 0,
        recommendations: this.generatePerformanceRecommendations(performance, anomalies)
      };

    } catch (error) {
      logger.error('Performance tracking failed', { modelId, error: error.message });
      throw error;
    }
  }

  /**
   * Get performance insights and recommendations
   */
  async getPerformanceInsights(options = {}) {
    try {
      const {
        timeframe = 30, // days
        useCase = null,
        modelIds = null,
        includeRecommendations = true
      } = options;

      // Gather performance data
      const performanceData = this.gatherPerformanceData(timeframe, useCase, modelIds);

      // Analyze trends and patterns
      const trendAnalysis = this.analyzeTrends(performanceData);

      // Generate insights
      const insights = this.generateInsights(performanceData, trendAnalysis);

      // Calculate ROI and efficiency metrics
      const efficiencyMetrics = this.calculateEfficiencyMetrics(performanceData);

      // Generate recommendations if requested
      const recommendations = includeRecommendations ? 
        this.generateSystemRecommendations(insights, efficiencyMetrics) : null;

      return {
        insights,
        trendAnalysis,
        efficiencyMetrics,
        recommendations,
        summary: this.generateInsightsSummary(insights, efficiencyMetrics)
      };

    } catch (error) {
      logger.error('Performance insights generation failed', { options, error: error.message });
      throw error;
    }
  }

  // Private helper methods

  getCandidateModels(useCase, userTier) {
    const useCaseModels = Object.entries(this.modelRegistry)
      .filter(([_, model]) => 
        model.useCase === useCase || 
        model.useCase.includes(useCase) ||
        useCase === 'general'
      );

    // Filter by user tier access
    return useCaseModels.filter(([_, model]) => 
      this.hasModelAccess(model, userTier)
    );
  }

  hasModelAccess(model, userTier) {
    const tierAccess = {
      'basic': ['chat-general', 'chat-contextual', 'psychology-fast', 'analysis-fast'],
      'standard': ['psychology-primary', 'analysis-specialized', 'training-interactive'],
      'premium': Object.keys(this.modelRegistry) // All models
    };

    const modelKey = Object.keys(this.modelRegistry).find(key => 
      this.modelRegistry[key].name === model.name
    );

    return tierAccess[userTier]?.includes(modelKey) || userTier === 'premium';
  }

  applyModelFilters(candidateModels, filters) {
    return candidateModels.filter(([_, model]) => {
      // Quality threshold filter
      if (filters.qualityThreshold && model.qualityScore < filters.qualityThreshold) {
        return false;
      }

      // Budget constraints filter
      if (filters.budgetConstraints && model.cost > filters.budgetConstraints) {
        return false;
      }

      // Latency requirement filter
      if (filters.latencyRequirement) {
        const latencyMap = { 'very-low': 1, 'low': 2, 'low-medium': 3, 'medium': 4, 'high': 5 };
        if (latencyMap[model.latency] > latencyMap[filters.latencyRequirement]) {
          return false;
        }
      }

      return true;
    });
  }

  scoreModels(models, requestContext, priority, urgency) {
    const optimizationRule = this.optimizationRules[priority];
    
    return models.map(([modelId, model]) => {
      const scores = {
        quality: model.qualityScore / 10, // Normalize to 0-1
        cost: 1 - (model.cost / 0.00005), // Normalize cost (lower is better)
        latency: this.normalizeLatencyScore(model.latency)
      };

      // Apply urgency adjustments
      if (urgency === 'high') {
        scores.latency *= 1.5; // Boost latency importance
      } else if (urgency === 'low') {
        scores.cost *= 1.3; // Boost cost importance
      }

      // Calculate weighted score
      const totalScore = 
        scores.quality * optimizationRule.weights.quality +
        scores.cost * optimizationRule.weights.cost +
        scores.latency * optimizationRule.weights.latency;

      return {
        modelId,
        ...model,
        scores,
        score: totalScore,
        rank: 0 // Will be set after sorting
      };
    }).sort((a, b) => b.score - a.score)
      .map((model, index) => ({ ...model, rank: index + 1 }));
  }

  normalizeLatencyScore(latency) {
    const latencyScores = {
      'very-low': 1.0,
      'low': 0.8,
      'low-medium': 0.6,
      'medium': 0.4,
      'high': 0.2
    };
    return latencyScores[latency] || 0.5;
  }

  selectBestModel(scoredModels, requestContext) {
    if (scoredModels.length === 0) {
      throw new Error('No suitable models found for the given criteria');
    }

    // Return the highest scored model
    return scoredModels[0];
  }

  generateSelectionReason(selectedModel, allModels, priority) {
    const reasons = [];
    
    if (selectedModel.rank === 1) {
      reasons.push(`Best overall score (${selectedModel.score.toFixed(3)}) for ${priority} optimization`);
    }

    if (selectedModel.scores.quality > 0.9) {
      reasons.push('High quality score for complex reasoning tasks');
    }

    if (selectedModel.scores.cost > 0.8) {
      reasons.push('Cost-effective choice for budget optimization');
    }

    if (selectedModel.scores.latency > 0.8) {
      reasons.push('Fast response time for real-time interactions');
    }

    return reasons.join('. ');
  }

  calculateOptimizationMetrics(selectedModel, requestContext) {
    return {
      qualityOptimization: selectedModel.scores.quality,
      costOptimization: selectedModel.scores.cost,
      latencyOptimization: selectedModel.scores.latency,
      overallOptimization: selectedModel.score,
      estimatedCost: this.estimateRequestCost(selectedModel, requestContext),
      estimatedLatency: this.estimateRequestLatency(selectedModel, requestContext)
    };
  }

  updatePerformanceMetrics(modelId, performance) {
    if (!this.performanceMetrics.has(modelId)) {
      this.performanceMetrics.set(modelId, {
        totalRequests: 0,
        averageLatency: 0,
        averageQuality: 0,
        totalCost: 0,
        successRate: 0,
        history: []
      });
    }

    const metrics = this.performanceMetrics.get(modelId);
    metrics.totalRequests++;
    metrics.averageLatency = this.updateRunningAverage(metrics.averageLatency, performance.metrics.latency, metrics.totalRequests);
    metrics.averageQuality = this.updateRunningAverage(metrics.averageQuality, performance.metrics.qualityScore, metrics.totalRequests);
    metrics.totalCost += performance.metrics.cost;
    metrics.history.push(performance);

    // Keep only last 1000 records
    if (metrics.history.length > 1000) {
      metrics.history = metrics.history.slice(-1000);
    }
  }

  updateRunningAverage(currentAverage, newValue, count) {
    return ((currentAverage * (count - 1)) + newValue) / count;
  }

  detectPerformanceAnomalies(modelId, performance) {
    const anomalies = [];
    const metrics = this.performanceMetrics.get(modelId);
    
    if (!metrics || metrics.totalRequests < 10) {
      return anomalies; // Need more data
    }

    // Check for latency anomalies
    if (performance.metrics.latency > metrics.averageLatency * 2) {
      anomalies.push({
        type: 'high-latency',
        severity: 'warning',
        value: performance.metrics.latency,
        expected: metrics.averageLatency
      });
    }

    // Check for quality drops
    if (performance.metrics.qualityScore < metrics.averageQuality - 1.0) {
      anomalies.push({
        type: 'quality-drop',
        severity: 'warning',
        value: performance.metrics.qualityScore,
        expected: metrics.averageQuality
      });
    }

    return anomalies;
  }

  shouldTriggerOptimization(modelId, performance) {
    const metrics = this.performanceMetrics.get(modelId);
    
    // Trigger optimization if we have enough data and performance is degrading
    return metrics && 
           metrics.totalRequests > 50 && 
           (performance.metrics.qualityScore < metrics.averageQuality - 0.5 ||
            performance.metrics.latency > metrics.averageLatency * 1.5);
  }

  estimateRequestCost(model, requestContext) {
    const estimatedTokens = this.estimateTokenUsage(requestContext);
    return model.cost * estimatedTokens;
  }

  estimateRequestLatency(model, requestContext) {
    const baseLatencies = {
      'very-low': 200,
      'low': 500,
      'low-medium': 800,
      'medium': 1200,
      'high': 2000
    };
    
    const complexityMultiplier = {
      'low': 0.8,
      'medium': 1.0,
      'high': 1.4
    };

    return baseLatencies[model.latency] * complexityMultiplier[requestContext.complexityLevel || 'medium'];
  }

  estimateTokenUsage(requestContext) {
    const baseTokens = {
      'psychology-coaching': 1200,
      'trade-analysis': 800,
      'training-guidance': 1000,
      'pattern-analysis': 600,
      'general-chat': 400
    };

    const complexityMultiplier = {
      'low': 0.7,
      'medium': 1.0,
      'high': 1.5
    };

    return baseTokens[requestContext.useCase] * complexityMultiplier[requestContext.complexityLevel || 'medium'];
  }

  getDefaultPerformance() {
    return {
      totalRequests: 0,
      averageLatency: 0,
      averageQuality: 0,
      totalCost: 0,
      successRate: 0,
      history: []
    };
  }

  calculateQualityScore(responseData, userFeedback) {
    // Calculate quality score based on response data and user feedback
    let score = 8.0; // Base score

    if (userFeedback?.satisfaction) {
      score = userFeedback.satisfaction * 2; // Convert 5-point scale to 10-point
    }

    // Adjust based on response characteristics
    if (responseData.coherence) score += 1;
    if (responseData.relevance) score += 1;
    if (responseData.actionability) score += 0.5;

    return Math.min(score, 10);
  }

  calculateEffectivenessScore(responseData, requestContext) {
    // Calculate how effective the response was for the specific context
    return 8.0; // Placeholder implementation
  }
}

export default AIModelOptimizer;