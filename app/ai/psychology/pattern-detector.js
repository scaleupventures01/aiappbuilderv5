/**
 * Psychology Pattern Detector - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.4-messages-table.md
 * Task: AI-MSG-002 - Psychology pattern detection with emotional state recognition
 * Created: 2025-08-14
 * 
 * Implements advanced psychology pattern detection algorithms that analyze trader
 * messages, behavior patterns, and emotional states to provide targeted coaching
 * and identify psychological trading pitfalls and strengths.
 */

// Emotional states mapping from Message model
const EMOTIONAL_STATES = {
  CONFIDENT: 'confident',
  ANXIOUS: 'anxious', 
  REVENGE: 'revenge',
  DISCIPLINED: 'disciplined',
  FEARFUL: 'fearful',
  GREEDY: 'greedy',
  IMPATIENT: 'impatient',
  FOCUSED: 'focused',
  OVERWHELMED: 'overwhelmed',
  CALM: 'calm'
};

// Psychology pattern types from Message model
const PATTERN_TAGS = {
  // Negative patterns
  OVERTRADING: 'overtrading',
  REVENGE_TRADING: 'revenge_trading',
  FOMO: 'fomo',
  ANALYSIS_PARALYSIS: 'analysis_paralysis',
  RISK_AVERSION: 'risk_aversion',
  OVERCONFIDENCE: 'overconfidence',
  CONFIRMATION_BIAS: 'confirmation_bias',
  ANCHORING: 'anchoring',
  LOSS_AVERSION: 'loss_aversion',
  RECENCY_BIAS: 'recency_bias',
  DISCIPLINE_ISSUES: 'discipline_issues',
  EMOTIONAL_TRADING: 'emotional_trading',
  
  // Positive patterns
  PATTERN_RECOGNITION: 'pattern_recognition',
  GOOD_DISCIPLINE: 'good_discipline',
  PROPER_RISK_MANAGEMENT: 'proper_risk_management',
  PATIENT_EXECUTION: 'patient_execution',
  OBJECTIVE_ANALYSIS: 'objective_analysis'
};

// Coaching types from Message model
const COACHING_TYPES = {
  DISCIPLINE: 'discipline',
  RISK_MANAGEMENT: 'risk_management',
  EMOTIONAL_CONTROL: 'emotional_control',
  PATIENCE: 'patience',
  CONFIDENCE_BUILDING: 'confidence_building',
  FEAR_MANAGEMENT: 'fear_management'
};

// Keyword patterns for emotional state detection
const EMOTIONAL_KEYWORDS = {
  [EMOTIONAL_STATES.CONFIDENT]: [
    'confident', 'sure', 'certain', 'bullish', 'positive', 'strong conviction',
    'feel good about', 'this looks great', 'perfect setup', 'easy money'
  ],
  [EMOTIONAL_STATES.ANXIOUS]: [
    'nervous', 'worried', 'uncertain', 'unsure', 'what if', 'scared',
    'anxiety', 'second guessing', 'doubt', 'hesitant'
  ],
  [EMOTIONAL_STATES.REVENGE]: [
    'revenge', 'get back', 'make up for', 'recoup losses', 'need to win',
    'have to trade', 'angry', 'frustrated', 'market owes me'
  ],
  [EMOTIONAL_STATES.DISCIPLINED]: [
    'sticking to plan', 'following rules', 'disciplined', 'patient',
    'waiting for setup', 'risk management', 'systematic approach'
  ],
  [EMOTIONAL_STATES.FEARFUL]: [
    'afraid', 'scared', 'fear', 'terrified', 'what if it goes against me',
    'might lose', 'risk too much', 'paralyzed'
  ],
  [EMOTIONAL_STATES.GREEDY]: [
    'more', 'bigger position', 'all in', 'maximum leverage', 'cant miss this',
    'easy money', 'get rich', 'home run', 'moon'
  ],
  [EMOTIONAL_STATES.IMPATIENT]: [
    'taking anything', 'bored', 'need action', 'sitting on hands',
    'market is slow', 'waiting too long', 'force a trade'
  ],
  [EMOTIONAL_STATES.FOCUSED]: [
    'analysis shows', 'technical setup', 'plan execution', 'systematic',
    'objective view', 'clear structure', 'following process'
  ],
  [EMOTIONAL_STATES.OVERWHELMED]: [
    'too much information', 'confused', 'analysis paralysis', 'dont know',
    'overwhelming', 'too many signals', 'cant decide'
  ],
  [EMOTIONAL_STATES.CALM]: [
    'peaceful', 'relaxed', 'composed', 'centered', 'balanced approach',
    'clear mind', 'no rush', 'patient'
  ]
};

// Pattern detection keywords and phrases
const PATTERN_KEYWORDS = {
  [PATTERN_TAGS.OVERTRADING]: [
    'took 10 trades', 'trading all day', 'cant stop', 'every setup',
    'nonstop trading', 'scalping everything', 'too many positions'
  ],
  [PATTERN_TAGS.REVENGE_TRADING]: [
    'lost money so', 'making it back', 'revenge trade', 'double down',
    'market owes me', 'get even', 'angry at market'
  ],
  [PATTERN_TAGS.FOMO]: [
    'fear of missing out', 'jumping in', 'cant miss this', 'everyone making money',
    'late entry', 'chasing', 'already moved but'
  ],
  [PATTERN_TAGS.ANALYSIS_PARALYSIS]: [
    'too much analysis', 'overthinking', 'paralyzed', 'cant decide',
    'need more confirmation', 'waiting for perfect', 'analysis forever'
  ],
  [PATTERN_TAGS.OVERCONFIDENCE]: [
    'cant lose', 'easy money', 'always right', 'market genius',
    'foolproof strategy', 'guaranteed winner', 'never wrong'
  ],
  [PATTERN_TAGS.LOSS_AVERSION]: [
    'hate losing', 'holding losers', 'cant take loss', 'break even',
    'move stop to break even', 'afraid of red', 'losers running'
  ],
  [PATTERN_TAGS.DISCIPLINE_ISSUES]: [
    'broke my rules', 'shouldnt have', 'ignore stop loss', 'position too big',
    'didnt follow plan', 'emotional decision', 'no discipline'
  ],
  [PATTERN_TAGS.GOOD_DISCIPLINE]: [
    'following plan', 'stuck to rules', 'proper position size', 'risk managed',
    'systematic approach', 'patient execution', 'process driven'
  ],
  [PATTERN_TAGS.PROPER_RISK_MANAGEMENT]: [
    'risk reward', 'position sizing', 'stop loss', '1% risk',
    'calculated risk', 'risk management', 'proper stops'
  ]
};

// Behavioral pattern sequences that indicate specific psychology issues
const BEHAVIORAL_SEQUENCES = {
  revengeTradingCycle: [
    'loss', 'angry', 'bigger position', 'loss',
    'frustrated', 'all in', 'blown account'
  ],
  overconfidenceCycle: [
    'winning streak', 'easy money', 'bigger size',
    'market genius', 'big loss', 'reality check'
  ],
  fearCycle: [
    'big loss', 'scared', 'small position', 'missed opportunity',
    'regret', 'scared', 'analysis paralysis'
  ]
};

/**
 * Analyze text content for emotional indicators
 * @param {string} content - Message content to analyze
 * @returns {Object} Emotional analysis results
 */
function analyzeEmotionalContent(content) {
  const lowerContent = content.toLowerCase();
  const emotionalScores = {};
  
  // Initialize scores
  Object.values(EMOTIONAL_STATES).forEach(state => {
    emotionalScores[state] = 0;
  });

  // Check for emotional keywords
  Object.entries(EMOTIONAL_KEYWORDS).forEach(([emotion, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        emotionalScores[emotion] += 1;
      }
    });
  });

  // Apply contextual modifiers
  const modifiers = analyzeContextualModifiers(lowerContent);
  Object.entries(modifiers).forEach(([emotion, modifier]) => {
    if (emotionalScores[emotion] !== undefined) {
      emotionalScores[emotion] += modifier;
    }
  });

  return emotionalScores;
}

/**
 * Analyze contextual modifiers that amplify or dampen emotions
 * @param {string} content - Lowercase message content
 * @returns {Object} Emotional modifiers
 */
function analyzeContextualModifiers(content) {
  const modifiers = {};

  // Intensity amplifiers
  const intensifiers = ['very', 'extremely', 'really', 'so', 'totally', 'completely'];
  const hasIntensifier = intensifiers.some(word => content.includes(word));

  // Negation patterns
  const negations = ["don't", "not", "never", "no", "cant", "wont"];
  const hasNegation = negations.some(word => content.includes(word));

  // Question patterns (indicate uncertainty)
  const hasQuestions = content.includes('?') || content.includes('what if') || 
                      content.includes('should i') || content.includes('do you think');

  // Apply modifiers
  if (hasIntensifier) {
    modifiers[EMOTIONAL_STATES.ANXIOUS] = (modifiers[EMOTIONAL_STATES.ANXIOUS] || 0) + 0.5;
    modifiers[EMOTIONAL_STATES.CONFIDENT] = (modifiers[EMOTIONAL_STATES.CONFIDENT] || 0) + 0.5;
  }

  if (hasNegation) {
    modifiers[EMOTIONAL_STATES.FEARFUL] = (modifiers[EMOTIONAL_STATES.FEARFUL] || 0) + 0.3;
  }

  if (hasQuestions) {
    modifiers[EMOTIONAL_STATES.ANXIOUS] = (modifiers[EMOTIONAL_STATES.ANXIOUS] || 0) + 0.4;
    modifiers[EMOTIONAL_STATES.OVERWHELMED] = (modifiers[EMOTIONAL_STATES.OVERWHELMED] || 0) + 0.3;
  }

  return modifiers;
}

/**
 * Detect psychology patterns in message content
 * @param {string} content - Message content to analyze
 * @returns {Array} Detected pattern tags
 */
function detectPsychologyPatterns(content) {
  const lowerContent = content.toLowerCase();
  const detectedPatterns = new Set();

  // Check for pattern keywords
  Object.entries(PATTERN_KEYWORDS).forEach(([pattern, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        detectedPatterns.add(pattern);
      }
    });
  });

  // Check for complex patterns requiring multiple conditions
  detectedPatterns.add(...detectComplexPatterns(lowerContent));

  return Array.from(detectedPatterns);
}

/**
 * Detect complex patterns that require multiple conditions
 * @param {string} content - Lowercase message content
 * @returns {Array} Complex patterns detected
 */
function detectComplexPatterns(content) {
  const patterns = [];

  // FOMO pattern: late entry + chasing + price movement mentions
  if ((content.includes('late') || content.includes('chasing') || content.includes('already moved')) &&
      (content.includes('cant miss') || content.includes('everyone making') || content.includes('fomo'))) {
    patterns.push(PATTERN_TAGS.FOMO);
  }

  // Overtrading pattern: frequency + volume indicators
  if ((content.includes('all day') || content.includes('every') || content.includes('nonstop')) &&
      (content.includes('trade') || content.includes('position') || content.includes('scalp'))) {
    patterns.push(PATTERN_TAGS.OVERTRADING);
  }

  // Risk management pattern: specific risk metrics
  if ((content.includes('risk reward') || content.includes('1%') || content.includes('position size')) &&
      (content.includes('stop') || content.includes('risk') || content.includes('management'))) {
    patterns.push(PATTERN_TAGS.PROPER_RISK_MANAGEMENT);
  }

  // Analysis paralysis: too much + analysis/thinking/waiting
  if ((content.includes('too much') || content.includes('overthinking') || content.includes('paralyzed')) &&
      (content.includes('analysis') || content.includes('thinking') || content.includes('decide'))) {
    patterns.push(PATTERN_TAGS.ANALYSIS_PARALYSIS);
  }

  return patterns;
}

/**
 * Determine primary emotional state from scores
 * @param {Object} emotionalScores - Emotion scores from analysis
 * @returns {string|null} Primary emotional state
 */
function determinePrimaryEmotion(emotionalScores) {
  const emotions = Object.entries(emotionalScores)
    .filter(([emotion, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);

  return emotions.length > 0 ? emotions[0][0] : null;
}

/**
 * Suggest appropriate coaching type based on detected patterns and emotions
 * @param {Array} patterns - Detected psychology patterns
 * @param {string} primaryEmotion - Primary emotional state
 * @returns {string|null} Recommended coaching type
 */
function suggestCoachingType(patterns, primaryEmotion) {
  // Priority-based coaching recommendations
  
  // High priority: Risk and discipline issues
  if (patterns.includes(PATTERN_TAGS.OVERTRADING) || 
      patterns.includes(PATTERN_TAGS.DISCIPLINE_ISSUES)) {
    return COACHING_TYPES.DISCIPLINE;
  }

  if (patterns.includes(PATTERN_TAGS.REVENGE_TRADING)) {
    return COACHING_TYPES.EMOTIONAL_CONTROL;
  }

  // Risk management needs
  if (patterns.includes(PATTERN_TAGS.OVERCONFIDENCE) ||
      patterns.includes(PATTERN_TAGS.RISK_AVERSION)) {
    return COACHING_TYPES.RISK_MANAGEMENT;
  }

  // Emotional state-based coaching
  switch (primaryEmotion) {
    case EMOTIONAL_STATES.FEARFUL:
    case EMOTIONAL_STATES.ANXIOUS:
      return COACHING_TYPES.FEAR_MANAGEMENT;
      
    case EMOTIONAL_STATES.IMPATIENT:
    case EMOTIONAL_STATES.OVERWHELMED:
      return COACHING_TYPES.PATIENCE;
      
    case EMOTIONAL_STATES.REVENGE:
    case EMOTIONAL_STATES.GREEDY:
      return COACHING_TYPES.EMOTIONAL_CONTROL;
      
    default:
      if (patterns.includes(PATTERN_TAGS.ANALYSIS_PARALYSIS)) {
        return COACHING_TYPES.CONFIDENCE_BUILDING;
      }
      return COACHING_TYPES.DISCIPLINE; // Default
  }
}

/**
 * Generate psychology insights and recommendations
 * @param {Array} patterns - Detected patterns
 * @param {string} primaryEmotion - Primary emotional state  
 * @param {string} coachingType - Recommended coaching type
 * @returns {Object} Psychology insights and recommendations
 */
function generatePsychologyInsights(patterns, primaryEmotion, coachingType) {
  const insights = {
    primaryEmotion,
    coachingType,
    detectedPatterns: patterns,
    riskLevel: calculateRiskLevel(patterns),
    recommendations: [],
    warnings: [],
    positives: []
  };

  // Generate specific recommendations based on patterns
  patterns.forEach(pattern => {
    switch (pattern) {
      case PATTERN_TAGS.OVERTRADING:
        insights.warnings.push('Overtrading detected - may lead to increased losses and poor decision making');
        insights.recommendations.push('Limit trades per day, focus on quality over quantity');
        break;
        
      case PATTERN_TAGS.REVENGE_TRADING:
        insights.warnings.push('Revenge trading pattern identified - high risk of emotional decisions');
        insights.recommendations.push('Take a break after losses, never increase size when angry');
        break;
        
      case PATTERN_TAGS.FOMO:
        insights.warnings.push('Fear of missing out affecting entry decisions');
        insights.recommendations.push('Wait for proper setups, missing trades is better than bad trades');
        break;
        
      case PATTERN_TAGS.PROPER_RISK_MANAGEMENT:
        insights.positives.push('Good risk management practices identified');
        break;
        
      case PATTERN_TAGS.GOOD_DISCIPLINE:
        insights.positives.push('Disciplined trading approach noted');
        break;
    }
  });

  // Add emotional state-specific recommendations
  addEmotionalRecommendations(insights, primaryEmotion);

  return insights;
}

/**
 * Add emotional state-specific recommendations
 * @param {Object} insights - Psychology insights object to modify
 * @param {string} emotion - Primary emotional state
 */
function addEmotionalRecommendations(insights, emotion) {
  switch (emotion) {
    case EMOTIONAL_STATES.ANXIOUS:
      insights.recommendations.push('Practice relaxation techniques, reduce position sizes when anxious');
      break;
    case EMOTIONAL_STATES.OVERCONFIDENT:
      insights.warnings.push('Overconfidence can lead to increased risk taking');
      insights.recommendations.push('Maintain humility, stick to risk management rules');
      break;
    case EMOTIONAL_STATES.FEARFUL:
      insights.recommendations.push('Start with smaller positions, build confidence gradually');
      break;
    case EMOTIONAL_STATES.IMPATIENT:
      insights.recommendations.push('Practice patience, quality setups require waiting');
      break;
  }
}

/**
 * Calculate overall psychological risk level
 * @param {Array} patterns - Detected psychology patterns
 * @returns {string} Risk level (low, medium, high, critical)
 */
function calculateRiskLevel(patterns) {
  const highRiskPatterns = [
    PATTERN_TAGS.REVENGE_TRADING,
    PATTERN_TAGS.OVERTRADING, 
    PATTERN_TAGS.DISCIPLINE_ISSUES,
    PATTERN_TAGS.OVERCONFIDENCE
  ];

  const mediumRiskPatterns = [
    PATTERN_TAGS.FOMO,
    PATTERN_TAGS.ANALYSIS_PARALYSIS,
    PATTERN_TAGS.EMOTIONAL_TRADING
  ];

  const highRiskCount = patterns.filter(p => highRiskPatterns.includes(p)).length;
  const mediumRiskCount = patterns.filter(p => mediumRiskPatterns.includes(p)).length;

  if (highRiskCount >= 2) return 'critical';
  if (highRiskCount >= 1) return 'high';
  if (mediumRiskCount >= 2) return 'medium';
  if (mediumRiskCount >= 1) return 'low';
  return 'low';
}

/**
 * Analyze historical pattern trends
 * @param {Array} historicalMessages - Array of past messages with psychology data
 * @returns {Object} Pattern trend analysis
 */
function analyzePatternTrends(historicalMessages) {
  if (!historicalMessages || historicalMessages.length === 0) {
    return { trends: {}, recommendations: [] };
  }

  const patternCounts = {};
  const emotionCounts = {};
  const timeline = [];

  historicalMessages.forEach(msg => {
    // Count patterns
    if (msg.pattern_tags) {
      msg.pattern_tags.forEach(pattern => {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      });
    }

    // Count emotions
    if (msg.emotional_state) {
      emotionCounts[msg.emotional_state] = (emotionCounts[msg.emotional_state] || 0) + 1;
    }

    // Timeline tracking
    timeline.push({
      date: msg.created_at,
      emotion: msg.emotional_state,
      patterns: msg.pattern_tags || []
    });
  });

  return {
    patternFrequency: patternCounts,
    emotionFrequency: emotionCounts,
    timeline,
    improvementTrends: identifyImprovementTrends(timeline),
    recommendations: generateTrendRecommendations(patternCounts, emotionCounts)
  };
}

/**
 * Identify improvement or deterioration trends
 * @param {Array} timeline - Chronological psychology data
 * @returns {Object} Trend analysis
 */
function identifyImprovementTrends(timeline) {
  // Implementation would analyze patterns over time
  // For now, return basic structure
  return {
    improving: [],
    declining: [],
    stable: []
  };
}

/**
 * Generate recommendations based on historical trends
 * @param {Object} patternCounts - Pattern frequency counts
 * @param {Object} emotionCounts - Emotion frequency counts
 * @returns {Array} Trend-based recommendations
 */
function generateTrendRecommendations(patternCounts, emotionCounts) {
  const recommendations = [];

  // Check for recurring negative patterns
  const negativePatterns = [
    PATTERN_TAGS.OVERTRADING,
    PATTERN_TAGS.REVENGE_TRADING,
    PATTERN_TAGS.FOMO,
    PATTERN_TAGS.DISCIPLINE_ISSUES
  ];

  negativePatterns.forEach(pattern => {
    if (patternCounts[pattern] > 2) {
      recommendations.push(`Recurring ${pattern.replace('_', ' ')} pattern detected - consider focused coaching in this area`);
    }
  });

  return recommendations;
}

/**
 * Main psychology analysis function
 * @param {Object} messageData - Message data to analyze
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Complete psychology analysis result
 */
export async function analyzeTraderPsychology(messageData, options = {}) {
  try {
    const {
      includeHistoricalTrends = false,
      historicalMessages = [],
      includeInsights = true
    } = options;

    // Validate input
    if (!messageData || !messageData.content) {
      throw new Error('Message content is required for psychology analysis');
    }

    const content = messageData.content;

    // Analyze emotional content
    const emotionalScores = analyzeEmotionalContent(content);
    const primaryEmotion = determinePrimaryEmotion(emotionalScores);

    // Detect psychology patterns
    const detectedPatterns = detectPsychologyPatterns(content);

    // Suggest coaching type
    const coachingType = suggestCoachingType(detectedPatterns, primaryEmotion);

    // Prepare result
    const result = {
      emotionalState: primaryEmotion,
      coachingType,
      patternTags: detectedPatterns,
      emotionalScores,
      confidence: calculateAnalysisConfidence(emotionalScores, detectedPatterns),
      timestamp: new Date().toISOString()
    };

    // Add detailed insights if requested
    if (includeInsights) {
      result.insights = generatePsychologyInsights(detectedPatterns, primaryEmotion, coachingType);
    }

    // Add historical trend analysis if requested
    if (includeHistoricalTrends && historicalMessages.length > 0) {
      result.trends = analyzePatternTrends(historicalMessages);
    }

    return result;

  } catch (error) {
    console.error('Psychology Analysis Error:', error);
    throw new Error(`Psychology analysis failed: ${error.message}`);
  }
}

/**
 * Calculate confidence in psychology analysis
 * @param {Object} emotionalScores - Emotional analysis scores
 * @param {Array} patterns - Detected patterns
 * @returns {number} Confidence score (0-100)
 */
function calculateAnalysisConfidence(emotionalScores, patterns) {
  let confidence = 50; // Base confidence

  // Higher confidence with clear emotional indicators
  const maxEmotionScore = Math.max(...Object.values(emotionalScores));
  confidence += Math.min(30, maxEmotionScore * 10);

  // Higher confidence with clear patterns
  confidence += Math.min(20, patterns.length * 5);

  return Math.min(100, Math.max(0, Math.round(confidence)));
}

/**
 * Batch analyze multiple messages for psychology patterns
 * @param {Array} messages - Array of message data
 * @param {Object} options - Analysis options
 * @returns {Promise<Array>} Array of psychology analysis results
 */
export async function batchAnalyzePsychology(messages, options = {}) {
  try {
    const results = [];
    
    for (const message of messages) {
      const result = await analyzeTraderPsychology(message, options);
      results.push({
        messageId: message.id,
        ...result
      });
    }

    return results;
  } catch (error) {
    console.error('Batch Psychology Analysis Error:', error);
    throw new Error(`Batch psychology analysis failed: ${error.message}`);
  }
}

// Export constants for external use
export {
  EMOTIONAL_STATES,
  PATTERN_TAGS,
  COACHING_TYPES,
  EMOTIONAL_KEYWORDS,
  PATTERN_KEYWORDS
};