/**
 * AI Verdict Classifier - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.4-messages-table.md
 * Task: AI-MSG-001 - AI verdict classifier with Diamond/Fire/Skull logic and confidence scoring
 * Created: 2025-08-14
 * 
 * Implements the AI verdict classification system that analyzes trading setups
 * and assigns Diamond (perfect), Fire (good with warnings), or Skull (avoid) verdicts
 * with confidence scoring algorithms based on technical analysis factors.
 */

// Verdict classification constants
const VERDICTS = {
  DIAMOND: 'diamond',  // Perfect setup, high confidence trade
  FIRE: 'fire',        // Good setup with warnings or considerations  
  SKULL: 'skull'       // Poor setup, avoid this trade
};

// Technical analysis weight factors for scoring
const SCORING_WEIGHTS = {
  trendAlignment: 0.25,      // Trend alignment with multiple timeframes
  supportResistance: 0.20,   // Key S/R levels
  volumeConfirmation: 0.15,  // Volume analysis
  riskReward: 0.15,          // Risk-to-reward ratio
  marketStructure: 0.10,     // Overall market structure
  momentum: 0.10,            // Momentum indicators
  fundamentals: 0.05         // Fundamental backdrop
};

// Confidence calculation thresholds
const CONFIDENCE_THRESHOLDS = {
  veryHigh: 90,    // 90-100%
  high: 75,        // 75-89%
  medium: 50,      // 50-74%
  low: 25,         // 25-49%
  veryLow: 0       // 0-24%
};

// Risk factors that can downgrade verdict
const RISK_FACTORS = {
  majorNews: -15,           // Major news events pending
  lowVolume: -10,           // Low volume environment
  choppy: -12,              // Choppy/sideways market
  overextended: -8,         // Overextended moves
  poorRiskReward: -20,      // Poor risk-to-reward ratio
  counterTrend: -15,        // Counter-trend setup
  weekendGap: -5,           // Weekend gap risk
  earnings: -10             // Earnings announcement
};

// Positive factors that can upgrade verdict
const POSITIVE_FACTORS = {
  perfectAlignment: 15,     // Perfect multi-timeframe alignment
  institutionalSupport: 12, // Institutional support/resistance
  highVolume: 8,           // High volume confirmation
  cleanBreakout: 10,       // Clean breakout/breakdown
  excellentRR: 15,         // Excellent risk-to-reward (>1:3)
  momentum: 8,             // Strong momentum confirmation
  catalystSupport: 10      // Positive catalyst support
};

/**
 * Analyze technical factors from trading chart or setup description
 * @param {Object} analysisData - Chart analysis data or text description
 * @returns {Object} Technical analysis scores
 */
function analyzeTechnicalFactors(analysisData) {
  const scores = {
    trendAlignment: 50,      // Default neutral score
    supportResistance: 50,
    volumeConfirmation: 50,
    riskReward: 50,
    marketStructure: 50,
    momentum: 50,
    fundamentals: 50
  };

  // If we have structured chart data
  if (analysisData.chartData) {
    return analyzeChartData(analysisData.chartData, scores);
  }

  // If we have text description, use NLP analysis
  if (analysisData.description) {
    return analyzeTextDescription(analysisData.description, scores);
  }

  return scores;
}

/**
 * Analyze structured chart data (for future GPT-4 Vision integration)
 * @param {Object} chartData - Structured chart analysis data
 * @param {Object} baseScores - Base technical scores
 * @returns {Object} Enhanced technical scores
 */
function analyzeChartData(chartData, baseScores) {
  const scores = { ...baseScores };

  // Trend alignment analysis
  if (chartData.trends) {
    const trendAlignment = calculateTrendAlignment(chartData.trends);
    scores.trendAlignment = Math.max(0, Math.min(100, trendAlignment));
  }

  // Support/Resistance analysis
  if (chartData.levels) {
    const srStrength = calculateSRStrength(chartData.levels);
    scores.supportResistance = Math.max(0, Math.min(100, srStrength));
  }

  // Volume analysis
  if (chartData.volume) {
    const volumeScore = calculateVolumeScore(chartData.volume);
    scores.volumeConfirmation = Math.max(0, Math.min(100, volumeScore));
  }

  // Risk-reward calculation
  if (chartData.entry && chartData.target && chartData.stop) {
    const rrRatio = (chartData.target - chartData.entry) / (chartData.entry - chartData.stop);
    scores.riskReward = calculateRiskRewardScore(rrRatio);
  }

  return scores;
}

/**
 * Analyze text description using keyword and pattern matching
 * @param {string} description - Trading setup text description
 * @param {Object} baseScores - Base technical scores
 * @returns {Object} Enhanced technical scores
 */
function analyzeTextDescription(description, baseScores) {
  const scores = { ...baseScores };
  const lowerDesc = description.toLowerCase();

  // Trend alignment keywords
  const trendPositive = ['uptrend', 'downtrend', 'aligned', 'confluence', 'multiple timeframe'];
  const trendNegative = ['choppy', 'sideways', 'conflicting', 'mixed signals'];
  
  scores.trendAlignment = adjustScoreByKeywords(scores.trendAlignment, lowerDesc, trendPositive, trendNegative);

  // Support/Resistance keywords
  const srPositive = ['strong support', 'key resistance', 'tested level', 'bounce', 'rejection'];
  const srNegative = ['weak level', 'no support', 'no resistance', 'fake level'];
  
  scores.supportResistance = adjustScoreByKeywords(scores.supportResistance, lowerDesc, srPositive, srNegative);

  // Volume keywords
  const volumePositive = ['high volume', 'volume confirmation', 'institutional volume', 'breakout volume'];
  const volumeNegative = ['low volume', 'no volume', 'poor volume', 'volume declining'];
  
  scores.volumeConfirmation = adjustScoreByKeywords(scores.volumeConfirmation, lowerDesc, volumePositive, volumeNegative);

  // Risk-reward keywords
  const rrPositive = ['great risk reward', '1:3', '1:4', 'excellent rr', 'tight stop'];
  const rrNegative = ['poor risk reward', 'wide stop', '1:1', 'break even'];
  
  scores.riskReward = adjustScoreByKeywords(scores.riskReward, lowerDesc, rrPositive, rrNegative);

  // Market structure keywords
  const structurePositive = ['higher highs', 'lower lows', 'clean structure', 'institutional order'];
  const structureNegative = ['messy structure', 'no clear direction', 'range bound'];
  
  scores.marketStructure = adjustScoreByKeywords(scores.marketStructure, lowerDesc, structurePositive, structureNegative);

  // Momentum keywords
  const momentumPositive = ['strong momentum', 'accelerating', 'momentum confirmation', 'rsi divergence'];
  const momentumNegative = ['weak momentum', 'momentum fading', 'divergence against'];
  
  scores.momentum = adjustScoreByKeywords(scores.momentum, lowerDesc, momentumPositive, momentumNegative);

  return scores;
}

/**
 * Adjust score based on positive and negative keywords
 * @param {number} baseScore - Base score (0-100)
 * @param {string} text - Text to analyze
 * @param {Array} positiveKeywords - Keywords that increase score
 * @param {Array} negativeKeywords - Keywords that decrease score
 * @returns {number} Adjusted score
 */
function adjustScoreByKeywords(baseScore, text, positiveKeywords, negativeKeywords) {
  let score = baseScore;
  
  positiveKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      score += 10; // Boost score for positive keywords
    }
  });

  negativeKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      score -= 15; // Penalize score for negative keywords
    }
  });

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate overall technical score from individual factor scores
 * @param {Object} scores - Individual technical factor scores
 * @returns {number} Overall weighted technical score (0-100)
 */
function calculateOverallScore(scores) {
  let weightedScore = 0;

  Object.entries(SCORING_WEIGHTS).forEach(([factor, weight]) => {
    if (scores[factor] !== undefined) {
      weightedScore += scores[factor] * weight;
    }
  });

  return Math.round(weightedScore);
}

/**
 * Apply risk and positive factor adjustments
 * @param {number} baseScore - Base technical score
 * @param {Array} riskFactors - Identified risk factors
 * @param {Array} positiveFactors - Identified positive factors
 * @returns {number} Adjusted score
 */
function applyFactorAdjustments(baseScore, riskFactors = [], positiveFactors = []) {
  let adjustedScore = baseScore;

  // Apply risk factor penalties
  riskFactors.forEach(factor => {
    if (RISK_FACTORS[factor]) {
      adjustedScore += RISK_FACTORS[factor];
    }
  });

  // Apply positive factor bonuses
  positiveFactors.forEach(factor => {
    if (POSITIVE_FACTORS[factor]) {
      adjustedScore += POSITIVE_FACTORS[factor];
    }
  });

  return Math.max(0, Math.min(100, adjustedScore));
}

/**
 * Determine verdict based on final score
 * @param {number} score - Final confidence score (0-100)
 * @returns {string} Verdict (diamond, fire, skull)
 */
function determineVerdict(score) {
  if (score >= 80) {
    return VERDICTS.DIAMOND;
  } else if (score >= 50) {
    return VERDICTS.FIRE;
  } else {
    return VERDICTS.SKULL;
  }
}

/**
 * Generate confidence level description
 * @param {number} score - Confidence score (0-100)
 * @returns {string} Confidence level description
 */
function getConfidenceLevel(score) {
  if (score >= CONFIDENCE_THRESHOLDS.veryHigh) return 'Very High';
  if (score >= CONFIDENCE_THRESHOLDS.high) return 'High';
  if (score >= CONFIDENCE_THRESHOLDS.medium) return 'Medium';
  if (score >= CONFIDENCE_THRESHOLDS.low) return 'Low';
  return 'Very Low';
}

/**
 * Generate detailed reasoning for the verdict
 * @param {Object} scores - Individual technical factor scores
 * @param {number} finalScore - Final confidence score
 * @param {string} verdict - Determined verdict
 * @param {Array} riskFactors - Applied risk factors
 * @param {Array} positiveFactors - Applied positive factors
 * @returns {Object} Detailed reasoning breakdown
 */
function generateReasoning(scores, finalScore, verdict, riskFactors = [], positiveFactors = []) {
  const reasoning = {
    verdict,
    confidence: finalScore,
    confidenceLevel: getConfidenceLevel(finalScore),
    technicalFactors: {},
    riskFactors,
    positiveFactors,
    summary: ''
  };

  // Add technical factor breakdown
  Object.entries(scores).forEach(([factor, score]) => {
    reasoning.technicalFactors[factor] = {
      score: Math.round(score),
      weight: SCORING_WEIGHTS[factor],
      contribution: Math.round(score * SCORING_WEIGHTS[factor])
    };
  });

  // Generate summary based on verdict
  switch (verdict) {
    case VERDICTS.DIAMOND:
      reasoning.summary = `Strong technical setup with ${getConfidenceLevel(finalScore).toLowerCase()} confidence. Multiple factors align favorably for this trade opportunity.`;
      break;
    case VERDICTS.FIRE:
      reasoning.summary = `Decent setup with some considerations. ${getConfidenceLevel(finalScore)} confidence with moderate risk factors to monitor.`;
      break;
    case VERDICTS.SKULL:
      reasoning.summary = `Poor setup with significant risk factors. ${getConfidenceLevel(finalScore).toLowerCase()} confidence suggests avoiding this trade.`;
      break;
  }

  return reasoning;
}

/**
 * Main classification function - analyze trading setup and return verdict with confidence
 * @param {Object} setupData - Trading setup data (description, chart data, context)
 * @param {Object} options - Classification options
 * @returns {Promise<Object>} Classification result with verdict, confidence, and reasoning
 */
export async function classifyTradingSetup(setupData, options = {}) {
  try {
    const {
      includeReasoning = true,
      riskFactors = [],
      positiveFactors = [],
      marketContext = {}
    } = options;

    // Validate input
    if (!setupData || (!setupData.description && !setupData.chartData)) {
      throw new Error('Setup data with description or chart data is required');
    }

    // Analyze technical factors
    const technicalScores = analyzeTechnicalFactors(setupData);

    // Calculate base technical score
    const baseScore = calculateOverallScore(technicalScores);

    // Apply risk and positive factor adjustments
    const finalScore = applyFactorAdjustments(baseScore, riskFactors, positiveFactors);

    // Determine verdict
    const verdict = determineVerdict(finalScore);

    // Prepare result
    const result = {
      verdict,
      confidence: finalScore,
      confidenceLevel: getConfidenceLevel(finalScore),
      timestamp: new Date().toISOString()
    };

    // Add detailed reasoning if requested
    if (includeReasoning) {
      result.reasoning = generateReasoning(
        technicalScores, 
        finalScore, 
        verdict, 
        riskFactors, 
        positiveFactors
      );
    }

    return result;

  } catch (error) {
    console.error('AI Verdict Classification Error:', error);
    throw new Error(`Classification failed: ${error.message}`);
  }
}

/**
 * Batch classify multiple trading setups
 * @param {Array} setupsData - Array of trading setup data
 * @param {Object} options - Classification options
 * @returns {Promise<Array>} Array of classification results
 */
export async function classifyMultipleSetups(setupsData, options = {}) {
  try {
    const results = [];
    
    for (const setupData of setupsData) {
      const result = await classifyTradingSetup(setupData, options);
      results.push({
        id: setupData.id || results.length,
        ...result
      });
    }

    return results;
  } catch (error) {
    console.error('Batch Classification Error:', error);
    throw new Error(`Batch classification failed: ${error.message}`);
  }
}

/**
 * Get verdict statistics and analytics
 * @param {Array} verdicts - Array of past verdicts with outcomes
 * @returns {Object} Verdict accuracy and performance statistics
 */
export function getVerdictAnalytics(verdicts = []) {
  const analytics = {
    totalVerdicts: verdicts.length,
    verdictCounts: {
      diamond: 0,
      fire: 0,
      skull: 0
    },
    averageConfidence: 0,
    accuracyRates: {
      diamond: { correct: 0, total: 0, rate: 0 },
      fire: { correct: 0, total: 0, rate: 0 },
      skull: { correct: 0, total: 0, rate: 0 }
    },
    confidenceBands: {
      veryHigh: { correct: 0, total: 0, rate: 0 },
      high: { correct: 0, total: 0, rate: 0 },
      medium: { correct: 0, total: 0, rate: 0 },
      low: { correct: 0, total: 0, rate: 0 },
      veryLow: { correct: 0, total: 0, rate: 0 }
    }
  };

  if (verdicts.length === 0) return analytics;

  let totalConfidence = 0;

  verdicts.forEach(verdict => {
    // Count verdicts
    if (analytics.verdictCounts[verdict.verdict] !== undefined) {
      analytics.verdictCounts[verdict.verdict]++;
    }

    // Sum confidence for average
    totalConfidence += verdict.confidence;

    // Track accuracy if outcome is provided
    if (verdict.outcome !== undefined) {
      const wasCorrect = verdict.outcome === 'successful';
      
      // Verdict-based accuracy
      if (analytics.accuracyRates[verdict.verdict]) {
        analytics.accuracyRates[verdict.verdict].total++;
        if (wasCorrect) {
          analytics.accuracyRates[verdict.verdict].correct++;
        }
      }

      // Confidence-based accuracy
      const confidenceLevel = getConfidenceLevel(verdict.confidence).toLowerCase().replace(' ', '');
      if (analytics.confidenceBands[confidenceLevel]) {
        analytics.confidenceBands[confidenceLevel].total++;
        if (wasCorrect) {
          analytics.confidenceBands[confidenceLevel].correct++;
        }
      }
    }
  });

  // Calculate average confidence
  analytics.averageConfidence = Math.round(totalConfidence / verdicts.length);

  // Calculate accuracy rates
  Object.keys(analytics.accuracyRates).forEach(verdict => {
    const accuracy = analytics.accuracyRates[verdict];
    accuracy.rate = accuracy.total > 0 ? Math.round((accuracy.correct / accuracy.total) * 100) : 0;
  });

  Object.keys(analytics.confidenceBands).forEach(band => {
    const confidence = analytics.confidenceBands[band];
    confidence.rate = confidence.total > 0 ? Math.round((confidence.correct / confidence.total) * 100) : 0;
  });

  return analytics;
}

// Helper functions for chart data analysis (placeholders for future GPT-4 Vision integration)

function calculateTrendAlignment(trends) {
  // Placeholder for trend alignment calculation
  // Would analyze multiple timeframe trends for confluence
  return 70; // Default score
}

function calculateSRStrength(levels) {
  // Placeholder for support/resistance strength calculation
  // Would analyze how well levels have held historically
  return 65; // Default score
}

function calculateVolumeScore(volume) {
  // Placeholder for volume analysis
  // Would compare current volume to historical averages
  return 60; // Default score
}

function calculateRiskRewardScore(rrRatio) {
  // Convert risk-reward ratio to score (0-100)
  if (rrRatio >= 3) return 90;      // 1:3 or better
  if (rrRatio >= 2) return 75;      // 1:2
  if (rrRatio >= 1.5) return 60;    // 1:1.5
  if (rrRatio >= 1) return 40;      // 1:1
  return 20;                        // Less than 1:1
}

// Export constants for external use
export { VERDICTS, SCORING_WEIGHTS, CONFIDENCE_THRESHOLDS };