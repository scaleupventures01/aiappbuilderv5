/**
 * AI Model Selector - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.4-messages-table.md
 * Task: AI-MSG-004 - Model selector with logic for choosing appropriate AI model
 * Created: 2025-08-14
 * Updated: 2025-08-15 - Migrated to GPT-5
 * 
 * Implements intelligent model selection logic that chooses the most appropriate
 * AI model (GPT-5, GPT-3.5, Claude, etc.) based on message content type,
 * analysis requirements, cost considerations, and performance characteristics.
 */

// Available AI models with their capabilities and costs
const AI_MODELS = {
  GPT4: {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    capabilities: ['text', 'analysis', 'psychology', 'coaching'],
    costPer1kTokens: 0.03, // Input cost
    outputCostPer1kTokens: 0.06,
    maxTokens: 8192,
    contextWindow: 8192,
    strengths: ['general analysis', 'psychology coaching', 'text reasoning'],
    limitations: ['no image analysis', 'higher cost'],
    latency: 'medium'
  },
  GPT4_TURBO: {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo', 
    provider: 'openai',
    capabilities: ['text', 'analysis', 'psychology', 'coaching', 'long-context'],
    costPer1kTokens: 0.01, // Lower cost
    outputCostPer1kTokens: 0.03,
    maxTokens: 4096,
    contextWindow: 128000,
    strengths: ['cost-effective', 'large context', 'fast processing'],
    limitations: ['no image analysis'],
    latency: 'low'
  },
  GPT5: {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    capabilities: ['text', 'vision', 'chart-analysis', 'technical-analysis', 'advanced-reasoning'],
    costPer1kTokens: 0.015, // Estimated
    outputCostPer1kTokens: 0.04,
    maxTokens: 8192,
    contextWindow: 256000,
    imageCostPer: 0.005, // Per image - more efficient than GPT-4
    strengths: ['superior chart analysis', 'advanced pattern recognition', 'multi-modal reasoning', 'faster processing'],
    limitations: ['higher cost with images', 'complex setup'],
    latency: 'high'
  },
  CLAUDE_SONNET: {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    capabilities: ['text', 'analysis', 'psychology', 'coaching', 'reasoning'],
    costPer1kTokens: 0.003, // Very cost effective
    outputCostPer1kTokens: 0.015,
    maxTokens: 8192,
    contextWindow: 200000,
    strengths: ['excellent reasoning', 'psychology analysis', 'cost-effective', 'large context'],
    limitations: ['no image analysis'],
    latency: 'low'
  },
  CLAUDE_OPUS: {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    capabilities: ['text', 'analysis', 'psychology', 'coaching', 'complex-reasoning'],
    costPer1kTokens: 0.015,
    outputCostPer1kTokens: 0.075,
    maxTokens: 4096,
    contextWindow: 200000,
    strengths: ['superior reasoning', 'complex analysis', 'nuanced psychology'],
    limitations: ['higher cost', 'no image analysis'],
    latency: 'medium'
  }
};

// Message analysis types that influence model selection
const ANALYSIS_TYPES = {
  CHART_ANALYSIS: 'chart-analysis',
  TEXT_ANALYSIS: 'text-analysis',
  PSYCHOLOGY_COACHING: 'psychology-coaching',
  TECHNICAL_ANALYSIS: 'technical-analysis',
  RISK_ASSESSMENT: 'risk-assessment',
  PATTERN_RECOGNITION: 'pattern-recognition'
};

// Cost sensitivity levels
const COST_SENSITIVITY = {
  LOW: 'low',        // Performance over cost
  MEDIUM: 'medium',  // Balanced approach
  HIGH: 'high'       // Cost-sensitive
};

// Performance requirements
const PERFORMANCE_REQUIREMENTS = {
  SPEED: 'speed',           // Fast response needed
  ACCURACY: 'accuracy',     // High accuracy critical
  REASONING: 'reasoning',   // Complex reasoning required
  COST: 'cost'             // Cost optimization priority
};

/**
 * Analyze message content to determine analysis requirements
 * @param {Object} messageData - Message data including content and attachments
 * @returns {Object} Analysis requirements and content characteristics
 */
function analyzeMessageRequirements(messageData) {
  const requirements = {
    hasImages: false,
    analysisTypes: [],
    contentLength: 0,
    complexity: 'low',
    requiresVision: false,
    psychologyIndicators: false,
    technicalIndicators: false
  };

  // Check for image attachments
  if (messageData.image_url || messageData.image_filename) {
    requirements.hasImages = true;
    requirements.requiresVision = true;
    requirements.analysisTypes.push(ANALYSIS_TYPES.CHART_ANALYSIS);
  }

  // Analyze text content if present
  if (messageData.content) {
    const content = messageData.content.toLowerCase();
    requirements.contentLength = messageData.content.length;

    // Detect analysis type based on keywords
    if (isChartAnalysisRequest(content)) {
      requirements.analysisTypes.push(ANALYSIS_TYPES.TECHNICAL_ANALYSIS);
      if (!requirements.hasImages) {
        requirements.analysisTypes.push(ANALYSIS_TYPES.TEXT_ANALYSIS);
      }
    }

    if (isPsychologyAnalysisRequest(content)) {
      requirements.analysisTypes.push(ANALYSIS_TYPES.PSYCHOLOGY_COACHING);
      requirements.psychologyIndicators = true;
    }

    if (isRiskAssessmentRequest(content)) {
      requirements.analysisTypes.push(ANALYSIS_TYPES.RISK_ASSESSMENT);
    }

    // Determine complexity
    requirements.complexity = determineContentComplexity(content, messageData);
  }

  return requirements;
}

/**
 * Check if content requests chart analysis
 * @param {string} content - Lowercase message content
 * @returns {boolean} True if chart analysis is requested
 */
function isChartAnalysisRequest(content) {
  const chartKeywords = [
    'chart', 'technical analysis', 'support', 'resistance', 'breakout',
    'trend', 'pattern', 'fibonacci', 'moving average', 'rsi', 'macd',
    'candlestick', 'volume', 'price action'
  ];
  
  return chartKeywords.some(keyword => content.includes(keyword));
}

/**
 * Check if content requests psychology analysis
 * @param {string} content - Lowercase message content  
 * @returns {boolean} True if psychology analysis is requested
 */
function isPsychologyAnalysisRequest(content) {
  const psychKeywords = [
    'emotional', 'feeling', 'anxious', 'confident', 'fear', 'greedy',
    'discipline', 'psychology', 'mindset', 'revenge', 'overtrading',
    'fomo', 'coaching', 'mental', 'behavior'
  ];
  
  return psychKeywords.some(keyword => content.includes(keyword));
}

/**
 * Check if content requests risk assessment
 * @param {string} content - Lowercase message content
 * @returns {boolean} True if risk assessment is requested
 */
function isRiskAssessmentRequest(content) {
  const riskKeywords = [
    'risk', 'position size', 'stop loss', 'risk reward', 'risk management',
    'leverage', 'exposure', 'drawdown', 'portfolio', 'allocation'
  ];
  
  return riskKeywords.some(keyword => content.includes(keyword));
}

/**
 * Determine content complexity level
 * @param {string} content - Message content
 * @param {Object} messageData - Full message data
 * @returns {string} Complexity level (low, medium, high)
 */
function determineContentComplexity(content, messageData) {
  let complexity = 0;

  // Length factor
  if (content.length > 1000) complexity += 2;
  else if (content.length > 500) complexity += 1;

  // Multi-factor analysis
  const factors = ['chart', 'psychology', 'risk', 'technical', 'fundamental'];
  const foundFactors = factors.filter(factor => content.includes(factor));
  complexity += foundFactors.length;

  // Image adds complexity
  if (messageData.image_url) complexity += 2;

  // Multiple questions or requests
  const questions = (content.match(/\?/g) || []).length;
  if (questions > 2) complexity += 1;

  if (complexity >= 5) return 'high';
  if (complexity >= 2) return 'medium';
  return 'low';
}

/**
 * Calculate estimated cost for each model based on requirements
 * @param {Object} requirements - Analysis requirements
 * @param {Object} options - Cost calculation options
 * @returns {Object} Cost estimates for each model
 */
function calculateModelCosts(requirements, options = {}) {
  const {
    estimatedInputTokens = 500,
    estimatedOutputTokens = 300,
    imageCount = 0
  } = options;

  const costs = {};

  Object.entries(AI_MODELS).forEach(([modelKey, model]) => {
    let cost = 0;
    
    // Text processing costs
    cost += (estimatedInputTokens / 1000) * model.costPer1kTokens;
    cost += (estimatedOutputTokens / 1000) * model.outputCostPer1kTokens;
    
    // Image processing costs (if applicable)
    if (imageCount > 0 && model.imageCostPer) {
      cost += imageCount * model.imageCostPer;
    } else if (imageCount > 0 && !model.capabilities.includes('vision')) {
      // Cannot process images
      cost = Infinity;
    }

    costs[modelKey] = {
      estimatedCost: cost,
      currency: 'USD',
      breakdown: {
        inputTokens: (estimatedInputTokens / 1000) * model.costPer1kTokens,
        outputTokens: (estimatedOutputTokens / 1000) * model.outputCostPer1kTokens,
        images: imageCount > 0 && model.imageCostPer ? imageCount * model.imageCostPer : 0
      }
    };
  });

  return costs;
}

/**
 * Score models based on capability match
 * @param {Object} requirements - Analysis requirements
 * @returns {Object} Capability scores for each model
 */
function scoreModelCapabilities(requirements) {
  const scores = {};

  Object.entries(AI_MODELS).forEach(([modelKey, model]) => {
    let score = 0;

    // Vision requirement
    if (requirements.requiresVision) {
      if (model.capabilities.includes('vision')) {
        score += 30;
      } else {
        score -= 50; // Heavy penalty for missing required capability
      }
    }

    // Analysis type matching
    requirements.analysisTypes.forEach(analysisType => {
      switch (analysisType) {
        case ANALYSIS_TYPES.CHART_ANALYSIS:
          if (model.capabilities.includes('vision')) score += 25;
          break;
        case ANALYSIS_TYPES.PSYCHOLOGY_COACHING:
          if (model.capabilities.includes('psychology')) score += 20;
          if (model.provider === 'anthropic') score += 10; // Claude excels at psychology
          break;
        case ANALYSIS_TYPES.TECHNICAL_ANALYSIS:
          if (model.capabilities.includes('analysis')) score += 15;
          break;
        case ANALYSIS_TYPES.RISK_ASSESSMENT:
          if (model.capabilities.includes('reasoning')) score += 15;
          break;
      }
    });

    // Content length considerations
    if (requirements.contentLength > 5000) {
      if (model.contextWindow > 50000) score += 10;
    }

    // Complexity matching
    if (requirements.complexity === 'high') {
      if (model.id.includes('opus') || model.id.includes('gpt-5') || model.id.includes('gpt-4')) score += 10;
    }

    scores[modelKey] = Math.max(0, score);
  });

  return scores;
}

/**
 * Apply selection preferences based on user settings and context
 * @param {Object} scores - Current model scores
 * @param {Object} costs - Model cost estimates
 * @param {Object} preferences - User preferences
 * @returns {Object} Adjusted scores with preferences applied
 */
function applySelectionPreferences(scores, costs, preferences = {}) {
  const {
    costSensitivity = COST_SENSITIVITY.MEDIUM,
    performanceRequirement = PERFORMANCE_REQUIREMENTS.ACCURACY,
    preferredProvider = null,
    maxCostPerQuery = null
  } = preferences;

  const adjustedScores = { ...scores };

  Object.entries(adjustedScores).forEach(([modelKey, score]) => {
    const model = AI_MODELS[modelKey];
    const cost = costs[modelKey]?.estimatedCost || 0;

    // Apply cost sensitivity adjustments
    if (costSensitivity === COST_SENSITIVITY.HIGH) {
      // Heavy penalty for expensive models
      if (cost > 0.1) adjustedScores[modelKey] -= 20;
      if (cost > 0.05) adjustedScores[modelKey] -= 10;
      // Bonus for cheap models
      if (cost < 0.02) adjustedScores[modelKey] += 15;
    } else if (costSensitivity === COST_SENSITIVITY.LOW) {
      // Bonus for premium models regardless of cost
      if (model.id.includes('opus') || model.id === 'gpt-5' || model.id === 'gpt-4') {
        adjustedScores[modelKey] += 10;
      }
    }

    // Apply performance requirement adjustments
    switch (performanceRequirement) {
      case PERFORMANCE_REQUIREMENTS.SPEED:
        if (model.latency === 'low') adjustedScores[modelKey] += 15;
        if (model.latency === 'high') adjustedScores[modelKey] -= 10;
        break;
      case PERFORMANCE_REQUIREMENTS.ACCURACY:
        if (model.id.includes('opus') || model.id === 'gpt-5' || model.id === 'gpt-4') {
          adjustedScores[modelKey] += 10;
        }
        break;
      case PERFORMANCE_REQUIREMENTS.REASONING:
        if (model.capabilities.includes('complex-reasoning')) {
          adjustedScores[modelKey] += 15;
        }
        break;
    }

    // Apply provider preference
    if (preferredProvider && model.provider === preferredProvider) {
      adjustedScores[modelKey] += 10;
    }

    // Apply cost ceiling
    if (maxCostPerQuery && cost > maxCostPerQuery) {
      adjustedScores[modelKey] = -1; // Eliminate from consideration
    }
  });

  return adjustedScores;
}

/**
 * Select the best AI model based on message requirements and preferences
 * @param {Object} messageData - Message data to analyze
 * @param {Object} options - Selection options and preferences
 * @returns {Promise<Object>} Selected model information and reasoning
 */
export async function selectOptimalModel(messageData, options = {}) {
  try {
    const {
      costSensitivity = COST_SENSITIVITY.MEDIUM,
      performanceRequirement = PERFORMANCE_REQUIREMENTS.ACCURACY,
      preferredProvider = null,
      maxCostPerQuery = null,
      includeReasoning = true,
      fallbackModel = 'claude-3.5-sonnet'
    } = options;

    // Analyze message requirements
    const requirements = analyzeMessageRequirements(messageData);

    // Estimate token usage
    const estimatedInputTokens = Math.max(500, (messageData.content?.length || 0) * 0.75);
    const estimatedOutputTokens = requirements.complexity === 'high' ? 800 : 
                                   requirements.complexity === 'medium' ? 500 : 300;
    const imageCount = messageData.image_url ? 1 : 0;

    // Calculate costs for each model
    const modelCosts = calculateModelCosts(requirements, {
      estimatedInputTokens,
      estimatedOutputTokens,
      imageCount
    });

    // Score models based on capabilities
    let capabilityScores = scoreModelCapabilities(requirements);

    // Apply user preferences
    const preferences = {
      costSensitivity,
      performanceRequirement,
      preferredProvider,
      maxCostPerQuery
    };

    const finalScores = applySelectionPreferences(capabilityScores, modelCosts, preferences);

    // Find the best model
    const rankedModels = Object.entries(finalScores)
      .filter(([_, score]) => score >= 0) // Remove eliminated models
      .sort(([, a], [, b]) => b - a);

    if (rankedModels.length === 0) {
      // No models meet requirements, use fallback
      const selectedModel = AI_MODELS[fallbackModel] || AI_MODELS.CLAUDE_SONNET;
      return {
        selectedModel: selectedModel.id,
        modelInfo: selectedModel,
        confidence: 0,
        reasoning: 'Fallback model selected - no models met all requirements',
        requirements,
        estimatedCost: modelCosts[fallbackModel]?.estimatedCost || 0.01
      };
    }

    const [selectedModelKey, score] = rankedModels[0];
    const selectedModel = AI_MODELS[selectedModelKey];

    const result = {
      selectedModel: selectedModel.id,
      modelInfo: selectedModel,
      confidence: Math.min(100, Math.max(0, score + 50)), // Convert to 0-100 scale
      estimatedCost: modelCosts[selectedModelKey].estimatedCost,
      costBreakdown: modelCosts[selectedModelKey].breakdown,
      requirements
    };

    // Add detailed reasoning if requested
    if (includeReasoning) {
      result.reasoning = generateSelectionReasoning(
        requirements,
        selectedModel,
        rankedModels,
        preferences,
        score
      );
    }

    return result;

  } catch (error) {
    console.error('Model Selection Error:', error);
    // Return safe fallback
    return {
      selectedModel: 'claude-3.5-sonnet',
      modelInfo: AI_MODELS.CLAUDE_SONNET,
      confidence: 50,
      reasoning: `Error during selection: ${error.message}. Using fallback model.`,
      estimatedCost: 0.01,
      error: error.message
    };
  }
}

/**
 * Generate detailed reasoning for model selection
 * @param {Object} requirements - Analysis requirements
 * @param {Object} selectedModel - Selected model info
 * @param {Array} rankedModels - All models ranked by score
 * @param {Object} preferences - User preferences
 * @param {number} score - Final score for selected model
 * @returns {Object} Detailed selection reasoning
 */
function generateSelectionReasoning(requirements, selectedModel, rankedModels, preferences, score) {
  const reasoning = {
    primaryFactors: [],
    considerations: [],
    alternatives: [],
    tradeoffs: []
  };

  // Primary selection factors
  if (requirements.requiresVision) {
    reasoning.primaryFactors.push('Vision capability required for chart analysis');
  }

  if (requirements.psychologyIndicators) {
    reasoning.primaryFactors.push('Psychology analysis capability needed');
  }

  if (requirements.complexity === 'high') {
    reasoning.primaryFactors.push('High complexity analysis requires advanced reasoning');
  }

  // Cost considerations
  if (preferences.costSensitivity === COST_SENSITIVITY.HIGH) {
    reasoning.considerations.push('Cost optimization prioritized');
  }

  // Performance considerations
  if (preferences.performanceRequirement === PERFORMANCE_REQUIREMENTS.SPEED) {
    reasoning.considerations.push('Response speed prioritized');
  }

  // Alternatives
  const topAlternatives = rankedModels.slice(1, 3);
  topAlternatives.forEach(([modelKey, altScore]) => {
    const altModel = AI_MODELS[modelKey];
    reasoning.alternatives.push({
      model: altModel.name,
      score: altScore,
      reason: `Alternative with ${altModel.strengths.join(', ')}`
    });
  });

  // Tradeoffs
  if (selectedModel.limitations) {
    reasoning.tradeoffs = selectedModel.limitations.map(limitation => 
      `Accepting ${limitation} for optimal capability match`
    );
  }

  return reasoning;
}

/**
 * Get model recommendations for different use cases
 * @returns {Object} Model recommendations by use case
 */
export function getModelRecommendations() {
  return {
    chartAnalysis: {
      primary: AI_MODELS.GPT5,
      alternative: AI_MODELS.GPT4_TURBO,
      reasoning: 'Vision capability essential for chart analysis'
    },
    psychologyCoaching: {
      primary: AI_MODELS.CLAUDE_SONNET,
      alternative: AI_MODELS.CLAUDE_OPUS,
      reasoning: 'Claude models excel at psychological analysis and coaching'
    },
    costOptimized: {
      primary: AI_MODELS.CLAUDE_SONNET,
      alternative: AI_MODELS.GPT4_TURBO,
      reasoning: 'Best performance-to-cost ratio for general analysis'
    },
    complexReasoning: {
      primary: AI_MODELS.CLAUDE_OPUS,
      alternative: AI_MODELS.GPT4,
      reasoning: 'Superior reasoning capabilities for complex analysis'
    },
    fastResponse: {
      primary: AI_MODELS.GPT4_TURBO,
      alternative: AI_MODELS.CLAUDE_SONNET,
      reasoning: 'Optimized for low latency responses'
    }
  };
}

/**
 * Validate model availability and configuration
 * @param {string} modelId - Model ID to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateModelAvailability(modelId) {
  try {
    const model = Object.values(AI_MODELS).find(m => m.id === modelId);
    
    if (!model) {
      return {
        available: false,
        error: 'Model not found in supported models list'
      };
    }

    // Here you would typically make an API call to check model availability
    // For now, we'll assume all models are available
    return {
      available: true,
      model: model,
      latency: model.latency,
      capabilities: model.capabilities
    };

  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

// Export constants and models for external use
export {
  AI_MODELS,
  ANALYSIS_TYPES,
  COST_SENSITIVITY,
  PERFORMANCE_REQUIREMENTS
};