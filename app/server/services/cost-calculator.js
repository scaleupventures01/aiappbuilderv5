/**
 * Cost Calculator Service - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.6-gpt5-speed-selection.md
 * Description: Calculates costs for different speed modes and AI models
 * Created: 2025-08-15
 */

/**
 * Base pricing per 1K tokens (in USD)
 * These are example prices - adjust based on actual OpenAI pricing
 */
const MODEL_PRICING = {
  'gpt-5': {
    input: 0.01,   // $0.01 per 1K input tokens
    output: 0.03   // $0.03 per 1K output tokens
  },
  'gpt-4o': {
    input: 0.005,  // $0.005 per 1K input tokens
    output: 0.015  // $0.015 per 1K output tokens
  },
  'gpt-4': {
    input: 0.01,   // $0.01 per 1K input tokens
    output: 0.03   // $0.03 per 1K output tokens
  },
  'o1-preview': {
    input: 0.015,  // $0.015 per 1K input tokens
    output: 0.06   // $0.06 per 1K output tokens
  },
  'o1-mini': {
    input: 0.003,  // $0.003 per 1K input tokens
    output: 0.012  // $0.012 per 1K output tokens
  }
};

/**
 * Speed mode cost multipliers
 * Higher speed modes may use more computational resources
 */
const SPEED_MODE_MULTIPLIERS = {
  'super_fast': 0.8,    // 20% discount for fastest mode
  'fast': 0.9,          // 10% discount for fast mode
  'balanced': 1.0,      // Base price
  'high_accuracy': 1.3, // 30% premium for high accuracy
  'thorough': 1.3,      // Legacy - same as high_accuracy
  'maximum': 1.5        // Legacy - 50% premium for maximum depth
};

/**
 * Subscription tier multipliers
 * Different pricing for different subscription tiers
 */
const SUBSCRIPTION_MULTIPLIERS = {
  'free': 1.2,      // 20% markup for free tier
  'beta': 1.0,      // Base price for beta users
  'founder': 0.8,   // 20% discount for founders
  'pro': 0.9        // 10% discount for pro users
};

/**
 * Cost Calculator Class
 */
export class CostCalculator {
  /**
   * Calculate cost for an analysis
   * @param {Object} params - Calculation parameters
   * @param {string} params.model - AI model used
   * @param {number} params.inputTokens - Number of input tokens
   * @param {number} params.outputTokens - Number of output tokens
   * @param {string} params.speedMode - Speed mode used
   * @param {string} params.subscriptionTier - User's subscription tier
   * @returns {Object} Cost breakdown
   */
  static calculateCost({
    model,
    inputTokens = 0,
    outputTokens = 0,
    speedMode = 'balanced',
    subscriptionTier = 'free'
  }) {
    try {
      // Get model pricing
      const modelPricing = MODEL_PRICING[model];
      if (!modelPricing) {
        console.warn(`Unknown model pricing for: ${model}, using gpt-4o pricing`);
        model = 'gpt-4o';
      }

      const pricing = modelPricing || MODEL_PRICING['gpt-4o'];

      // Calculate base token costs
      const inputCost = (inputTokens / 1000) * pricing.input;
      const outputCost = (outputTokens / 1000) * pricing.output;
      const baseCost = inputCost + outputCost;

      // Apply speed mode multiplier
      const speedMultiplier = SPEED_MODE_MULTIPLIERS[speedMode] || 1.0;
      const costAfterSpeed = baseCost * speedMultiplier;

      // Apply subscription tier multiplier
      const subscriptionMultiplier = SUBSCRIPTION_MULTIPLIERS[subscriptionTier] || 1.0;
      const finalCost = costAfterSpeed * subscriptionMultiplier;

      return {
        model,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        speedMode,
        subscriptionTier,
        breakdown: {
          inputCost: parseFloat(inputCost.toFixed(6)),
          outputCost: parseFloat(outputCost.toFixed(6)),
          baseCost: parseFloat(baseCost.toFixed(6)),
          speedMultiplier,
          costAfterSpeed: parseFloat(costAfterSpeed.toFixed(6)),
          subscriptionMultiplier,
          finalCost: parseFloat(finalCost.toFixed(6))
        },
        finalCost: parseFloat(finalCost.toFixed(6))
      };
    } catch (error) {
      console.error('Cost calculation error:', error.message);
      return {
        model,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        speedMode,
        subscriptionTier,
        breakdown: {
          inputCost: 0,
          outputCost: 0,
          baseCost: 0,
          speedMultiplier: 1.0,
          costAfterSpeed: 0,
          subscriptionMultiplier: 1.0,
          finalCost: 0
        },
        finalCost: 0,
        error: error.message
      };
    }
  }

  /**
   * Estimate cost before analysis
   * @param {Object} params - Estimation parameters
   * @param {string} params.model - AI model to use
   * @param {number} params.estimatedTokens - Estimated total tokens
   * @param {string} params.speedMode - Speed mode to use
   * @param {string} params.subscriptionTier - User's subscription tier
   * @returns {Object} Cost estimate
   */
  static estimateCost({
    model = 'gpt-5',
    estimatedTokens = 1000,
    speedMode = 'balanced',
    subscriptionTier = 'free'
  }) {
    // Assume roughly 80% input tokens, 20% output tokens for estimation
    const estimatedInputTokens = Math.floor(estimatedTokens * 0.8);
    const estimatedOutputTokens = Math.floor(estimatedTokens * 0.2);

    return this.calculateCost({
      model,
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      speedMode,
      subscriptionTier
    });
  }

  /**
   * Get speed mode multiplier
   * @param {string} speedMode - Speed mode
   * @returns {number} Cost multiplier
   */
  static getSpeedModeMultiplier(speedMode) {
    return SPEED_MODE_MULTIPLIERS[speedMode] || 1.0;
  }

  /**
   * Get subscription tier multiplier
   * @param {string} subscriptionTier - Subscription tier
   * @returns {number} Cost multiplier
   */
  static getSubscriptionMultiplier(subscriptionTier) {
    return SUBSCRIPTION_MULTIPLIERS[subscriptionTier] || 1.0;
  }

  /**
   * Get model pricing information
   * @param {string} model - AI model
   * @returns {Object} Pricing information
   */
  static getModelPricing(model) {
    return MODEL_PRICING[model] || MODEL_PRICING['gpt-4o'];
  }

  /**
   * Get all available pricing information
   * @returns {Object} Complete pricing data
   */
  static getAllPricing() {
    return {
      models: MODEL_PRICING,
      speedModes: SPEED_MODE_MULTIPLIERS,
      subscriptionTiers: SUBSCRIPTION_MULTIPLIERS
    };
  }

  /**
   * Calculate monthly cost estimates for different usage patterns
   * @param {Object} params - Usage parameters
   * @param {number} params.analysesPerDay - Number of analyses per day
   * @param {number} params.avgTokensPerAnalysis - Average tokens per analysis
   * @param {string} params.model - Primary model used
   * @param {string} params.speedMode - Primary speed mode used
   * @param {string} params.subscriptionTier - User's subscription tier
   * @returns {Object} Monthly cost estimate
   */
  static calculateMonthlyCost({
    analysesPerDay = 10,
    avgTokensPerAnalysis = 1000,
    model = 'gpt-5',
    speedMode = 'balanced',
    subscriptionTier = 'free'
  }) {
    const dailyCost = this.estimateCost({
      model,
      estimatedTokens: avgTokensPerAnalysis,
      speedMode,
      subscriptionTier
    });

    const totalDailyCost = dailyCost.finalCost * analysesPerDay;
    const monthlyCost = totalDailyCost * 30; // Assume 30 days

    return {
      analysesPerDay,
      avgTokensPerAnalysis,
      model,
      speedMode,
      subscriptionTier,
      costPerAnalysis: dailyCost.finalCost,
      dailyCost: parseFloat(totalDailyCost.toFixed(4)),
      monthlyCost: parseFloat(monthlyCost.toFixed(2)),
      totalMonthlyAnalyses: analysesPerDay * 30,
      costBreakdown: dailyCost.breakdown
    };
  }
}

export default CostCalculator;