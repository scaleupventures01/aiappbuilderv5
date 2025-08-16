/**
 * AI Response Formatter - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.4-messages-table.md
 * Task: AI-MSG-006 - Response formatter with structured output for trade analysis
 * Created: 2025-08-14
 * 
 * Implements comprehensive response formatting system that structures AI outputs
 * into consistent, well-formatted responses for trade analysis, psychology coaching,
 * and general trading guidance with appropriate verdict display and metadata.
 */

// Response format types
const RESPONSE_FORMATS = {
  TRADE_ANALYSIS: 'trade-analysis',
  PSYCHOLOGY_COACHING: 'psychology-coaching',
  GENERAL_GUIDANCE: 'general-guidance',
  RISK_ASSESSMENT: 'risk-assessment',
  CHART_ANALYSIS: 'chart-analysis',
  ERROR_RESPONSE: 'error-response'
};

// Response components
const RESPONSE_COMPONENTS = {
  HEADER: 'header',
  VERDICT: 'verdict',
  ANALYSIS: 'analysis',
  PSYCHOLOGY: 'psychology',
  RECOMMENDATIONS: 'recommendations',
  WARNINGS: 'warnings',
  TECHNICAL_DETAILS: 'technical-details',
  FOOTER: 'footer',
  METADATA: 'metadata'
};

// Verdict display configurations
const VERDICT_DISPLAY = {
  diamond: {
    emoji: '💎',
    label: 'Diamond',
    description: 'Excellent Setup',
    color: '#00FF00',
    confidenceThreshold: 80
  },
  fire: {
    emoji: '🔥',
    label: 'Fire',
    description: 'Good Setup with Considerations',
    color: '#FFA500',
    confidenceThreshold: 50
  },
  skull: {
    emoji: '💀',
    label: 'Skull',
    description: 'Avoid This Setup',
    color: '#FF0000',
    confidenceThreshold: 0
  }
};

// Psychology coaching display configurations
const PSYCHOLOGY_DISPLAY = {
  confident: { emoji: '💪', color: '#00AA00' },
  anxious: { emoji: '😰', color: '#FFA500' },
  revenge: { emoji: '😡', color: '#FF4444' },
  disciplined: { emoji: '🎯', color: '#0066CC' },
  fearful: { emoji: '😨', color: '#FF6600' },
  greedy: { emoji: '🤑', color: '#FFD700' },
  impatient: { emoji: '⏰', color: '#FF8800' },
  focused: { emoji: '🔍', color: '#4444FF' },
  overwhelmed: { emoji: '🤯', color: '#BB66BB' },
  calm: { emoji: '🧘', color: '#66AA66' }
};

// Risk level display configurations
const RISK_DISPLAY = {
  low: { emoji: '✅', label: 'Low Risk', color: '#00AA00' },
  medium: { emoji: '⚠️', label: 'Medium Risk', color: '#FFA500' },
  high: { emoji: '❌', label: 'High Risk', color: '#FF4444' },
  critical: { emoji: '🚨', label: 'Critical Risk', color: '#CC0000' }
};

/**
 * Format trade analysis response with verdict and technical details
 * @param {Object} analysisData - Analysis results from AI processing
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted response structure
 */
function formatTradeAnalysis(analysisData, options = {}) {
  const {
    includeMetadata = true,
    includeConfidence = true,
    verboseMode = false,
    userPreferences = {}
  } = options;

  const formatted = {
    type: RESPONSE_FORMATS.TRADE_ANALYSIS,
    components: {},
    displayData: {},
    rawData: analysisData
  };

  // Format verdict section
  if (analysisData.verdict) {
    formatted.components[RESPONSE_COMPONENTS.VERDICT] = formatVerdict(
      analysisData.verdict,
      analysisData.confidence,
      { includeConfidence, verboseMode }
    );
  }

  // Format technical analysis section
  if (analysisData.technicalAnalysis || analysisData.reasoning) {
    formatted.components[RESPONSE_COMPONENTS.ANALYSIS] = formatTechnicalAnalysis(
      analysisData.technicalAnalysis || analysisData.reasoning,
      { verboseMode }
    );
  }

  // Format recommendations
  if (analysisData.recommendations || analysisData.reasoning?.recommendations) {
    formatted.components[RESPONSE_COMPONENTS.RECOMMENDATIONS] = formatRecommendations(
      analysisData.recommendations || analysisData.reasoning?.recommendations,
      analysisData.verdict
    );
  }

  // Format warnings and risk factors
  if (analysisData.warnings || analysisData.riskFactors) {
    formatted.components[RESPONSE_COMPONENTS.WARNINGS] = formatWarnings(
      analysisData.warnings || analysisData.riskFactors,
      analysisData.verdict
    );
  }

  // Format technical details
  if (verboseMode && analysisData.reasoning?.technicalFactors) {
    formatted.components[RESPONSE_COMPONENTS.TECHNICAL_DETAILS] = formatTechnicalDetails(
      analysisData.reasoning.technicalFactors
    );
  }

  // Add metadata
  if (includeMetadata) {
    formatted.components[RESPONSE_COMPONENTS.METADATA] = formatMetadata({
      aiModel: analysisData.aiModel,
      processingTime: analysisData.processingTime,
      tokensUsed: analysisData.tokensUsed,
      confidence: analysisData.confidence,
      timestamp: new Date().toISOString()
    });
  }

  return formatted;
}

/**
 * Format psychology coaching response
 * @param {Object} psychologyData - Psychology analysis results
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted psychology response
 */
function formatPsychologyCoaching(psychologyData, options = {}) {
  const {
    includeInsights = true,
    includeRecommendations = true,
    personalizedMode = true
  } = options;

  const formatted = {
    type: RESPONSE_FORMATS.PSYCHOLOGY_COACHING,
    components: {},
    displayData: {},
    rawData: psychologyData
  };

  // Format emotional state header
  if (psychologyData.emotionalState) {
    formatted.components[RESPONSE_COMPONENTS.HEADER] = formatEmotionalStateHeader(
      psychologyData.emotionalState,
      psychologyData.confidence
    );
  }

  // Format psychology patterns
  if (psychologyData.patternTags && psychologyData.patternTags.length > 0) {
    formatted.components[RESPONSE_COMPONENTS.PSYCHOLOGY] = formatPsychologyPatterns(
      psychologyData.patternTags,
      psychologyData.insights
    );
  }

  // Format coaching recommendations
  if (includeRecommendations && psychologyData.insights?.recommendations) {
    formatted.components[RESPONSE_COMPONENTS.RECOMMENDATIONS] = formatCoachingRecommendations(
      psychologyData.insights.recommendations,
      psychologyData.coachingType,
      personalizedMode
    );
  }

  // Format positive reinforcement
  if (psychologyData.insights?.positives) {
    formatted.components.positives = formatPositiveReinforcement(
      psychologyData.insights.positives
    );
  }

  // Format warnings
  if (psychologyData.insights?.warnings) {
    formatted.components[RESPONSE_COMPONENTS.WARNINGS] = formatPsychologyWarnings(
      psychologyData.insights.warnings,
      psychologyData.insights.riskLevel
    );
  }

  return formatted;
}

/**
 * Format general guidance response
 * @param {Object} guidanceData - General guidance data
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted guidance response
 */
function formatGeneralGuidance(guidanceData, options = {}) {
  const {
    includeContext = true,
    structuredFormat = true
  } = options;

  const formatted = {
    type: RESPONSE_FORMATS.GENERAL_GUIDANCE,
    components: {},
    displayData: {},
    rawData: guidanceData
  };

  // Format main content
  if (guidanceData.content) {
    formatted.components[RESPONSE_COMPONENTS.ANALYSIS] = {
      title: '📋 Analysis & Guidance',
      content: structuredFormat ? 
        formatStructuredContent(guidanceData.content) : 
        guidanceData.content
    };
  }

  // Format actionable items
  if (guidanceData.actionItems) {
    formatted.components[RESPONSE_COMPONENTS.RECOMMENDATIONS] = {
      title: '🎯 Action Items',
      items: guidanceData.actionItems.map(item => ({
        text: item,
        priority: 'medium'
      }))
    };
  }

  return formatted;
}

/**
 * Format chart analysis response
 * @param {Object} chartData - Chart analysis results
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted chart analysis response
 */
function formatChartAnalysis(chartData, options = {}) {
  const {
    includeImageMetadata = true,
    detailedAnalysis = true
  } = options;

  const formatted = {
    type: RESPONSE_FORMATS.CHART_ANALYSIS,
    components: {},
    displayData: {},
    rawData: chartData
  };

  // Format chart overview
  formatted.components.overview = {
    title: '📊 Chart Analysis Overview',
    content: chartData.overview || 'Chart analysis completed'
  };

  // Format technical levels
  if (chartData.levels) {
    formatted.components.levels = formatTechnicalLevels(chartData.levels);
  }

  // Format patterns identified
  if (chartData.patterns) {
    formatted.components.patterns = formatChartPatterns(chartData.patterns);
  }

  // Format verdict if present
  if (chartData.verdict) {
    formatted.components[RESPONSE_COMPONENTS.VERDICT] = formatVerdict(
      chartData.verdict,
      chartData.confidence
    );
  }

  return formatted;
}

/**
 * Format error response
 * @param {Error} error - Error object
 * @param {Object} context - Error context
 * @returns {Object} Formatted error response
 */
function formatErrorResponse(error, context = {}) {
  return {
    type: RESPONSE_FORMATS.ERROR_RESPONSE,
    components: {
      error: {
        title: '❌ Processing Error',
        message: getDisplayErrorMessage(error.message),
        code: error.code || 'UNKNOWN_ERROR',
        context: context.userFriendly ? context : undefined
      }
    },
    displayData: {
      showRetry: true,
      severity: determinErrorSeverity(error)
    }
  };
}

/**
 * Format verdict display component
 * @param {string} verdict - Verdict value (diamond, fire, skull)
 * @param {number} confidence - Confidence score (0-100)
 * @param {Object} options - Display options
 * @returns {Object} Formatted verdict component
 */
function formatVerdict(verdict, confidence, options = {}) {
  const { includeConfidence = true, verboseMode = false } = options;
  
  const verdictConfig = VERDICT_DISPLAY[verdict];
  if (!verdictConfig) {
    return null;
  }

  const component = {
    title: `${verdictConfig.emoji} ${verdictConfig.label}`,
    description: verdictConfig.description,
    verdict,
    display: {
      emoji: verdictConfig.emoji,
      color: verdictConfig.color,
      label: verdictConfig.label
    }
  };

  if (includeConfidence && confidence !== undefined) {
    component.confidence = {
      score: confidence,
      level: getConfidenceLevel(confidence),
      display: formatConfidenceDisplay(confidence)
    };
  }

  if (verboseMode) {
    component.details = {
      threshold: verdictConfig.confidenceThreshold,
      description: getVerdictDescription(verdict, confidence)
    };
  }

  return component;
}

/**
 * Format technical analysis component
 * @param {Object} technicalData - Technical analysis data
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted technical analysis component
 */
function formatTechnicalAnalysis(technicalData, options = {}) {
  const { verboseMode = false } = options;

  const component = {
    title: '📈 Technical Analysis',
    sections: []
  };

  // Format different sections of technical analysis
  if (technicalData.summary) {
    component.sections.push({
      title: 'Summary',
      content: technicalData.summary,
      type: 'summary'
    });
  }

  if (technicalData.keyLevels) {
    component.sections.push({
      title: 'Key Levels',
      content: formatKeyLevels(technicalData.keyLevels),
      type: 'levels'
    });
  }

  if (technicalData.trendAnalysis) {
    component.sections.push({
      title: 'Trend Analysis',
      content: technicalData.trendAnalysis,
      type: 'trend'
    });
  }

  if (verboseMode && technicalData.technicalFactors) {
    component.sections.push({
      title: 'Technical Factors Breakdown',
      content: formatTechnicalFactorsBreakdown(technicalData.technicalFactors),
      type: 'breakdown'
    });
  }

  return component;
}

/**
 * Format recommendations component
 * @param {Array|string} recommendations - Recommendations data
 * @param {string} verdict - Associated verdict for context
 * @returns {Object} Formatted recommendations component
 */
function formatRecommendations(recommendations, verdict) {
  const component = {
    title: '💡 Recommendations',
    items: []
  };

  const recs = Array.isArray(recommendations) ? recommendations : [recommendations];
  
  recs.forEach((rec, index) => {
    component.items.push({
      text: rec,
      priority: index === 0 ? 'high' : 'medium',
      category: 'action',
      icon: getRecommendationIcon(rec, verdict)
    });
  });

  return component;
}

/**
 * Format warnings component
 * @param {Array|string} warnings - Warnings data
 * @param {string} verdict - Associated verdict for severity
 * @returns {Object} Formatted warnings component
 */
function formatWarnings(warnings, verdict) {
  const component = {
    title: '⚠️ Important Considerations',
    items: []
  };

  const warns = Array.isArray(warnings) ? warnings : [warnings];
  
  warns.forEach(warning => {
    component.items.push({
      text: warning,
      severity: getWarningSeverity(warning, verdict),
      icon: getWarningIcon(warning)
    });
  });

  return component;
}

/**
 * Format psychology patterns component
 * @param {Array} patterns - Psychology pattern tags
 * @param {Object} insights - Psychology insights
 * @returns {Object} Formatted psychology patterns component
 */
function formatPsychologyPatterns(patterns, insights) {
  const component = {
    title: '🧠 Psychology Patterns Detected',
    patterns: [],
    riskLevel: insights?.riskLevel || 'low'
  };

  patterns.forEach(pattern => {
    const patternDisplay = formatSinglePattern(pattern);
    if (patternDisplay) {
      component.patterns.push(patternDisplay);
    }
  });

  // Add risk level display
  component.riskDisplay = RISK_DISPLAY[component.riskLevel] || RISK_DISPLAY.low;

  return component;
}

/**
 * Format coaching recommendations component
 * @param {Array} recommendations - Coaching recommendations
 * @param {string} coachingType - Type of coaching needed
 * @param {boolean} personalizedMode - Whether to personalize recommendations
 * @returns {Object} Formatted coaching recommendations component
 */
function formatCoachingRecommendations(recommendations, coachingType, personalizedMode) {
  const component = {
    title: `🎯 ${formatCoachingTypeTitle(coachingType)} Coaching`,
    recommendations: [],
    coachingType
  };

  recommendations.forEach((rec, index) => {
    component.recommendations.push({
      text: personalizedMode ? personalizeRecommendation(rec) : rec,
      priority: index < 2 ? 'high' : 'medium',
      category: coachingType,
      actionable: true
    });
  });

  return component;
}

/**
 * Format metadata component
 * @param {Object} metadata - Response metadata
 * @returns {Object} Formatted metadata component
 */
function formatMetadata(metadata) {
  return {
    aiModel: metadata.aiModel,
    processingTime: metadata.processingTime,
    tokensUsed: metadata.tokensUsed,
    confidence: metadata.confidence,
    timestamp: metadata.timestamp,
    version: '1.0.0'
  };
}

/**
 * Convert formatted response to display text
 * @param {Object} formattedResponse - Formatted response object
 * @param {Object} options - Display options
 * @returns {string} Display-ready text
 */
export function formatResponseForDisplay(formattedResponse, options = {}) {
  const {
    includeEmojis = true,
    includeMetadata = false,
    maxLength = null,
    format = 'markdown' // 'markdown' or 'plain'
  } = options;

  let displayText = '';
  const components = formattedResponse.components;

  // Header/Verdict
  if (components.verdict) {
    const verdict = components.verdict;
    displayText += formatVerdictForDisplay(verdict, { includeEmojis, format });
    displayText += '\n\n';
  }

  if (components.header) {
    displayText += formatHeaderForDisplay(components.header, { includeEmojis, format });
    displayText += '\n\n';
  }

  // Main analysis
  if (components.analysis) {
    displayText += formatAnalysisForDisplay(components.analysis, { format });
    displayText += '\n\n';
  }

  // Psychology
  if (components.psychology) {
    displayText += formatPsychologyForDisplay(components.psychology, { includeEmojis, format });
    displayText += '\n\n';
  }

  // Recommendations
  if (components.recommendations) {
    displayText += formatRecommendationsForDisplay(components.recommendations, { includeEmojis, format });
    displayText += '\n\n';
  }

  // Warnings
  if (components.warnings) {
    displayText += formatWarningsForDisplay(components.warnings, { includeEmojis, format });
    displayText += '\n\n';
  }

  // Technical details (if verbose)
  if (components.technicalDetails) {
    displayText += formatTechnicalDetailsForDisplay(components.technicalDetails, { format });
    displayText += '\n\n';
  }

  // Metadata (if requested)
  if (includeMetadata && components.metadata) {
    displayText += formatMetadataForDisplay(components.metadata);
  }

  // Trim and apply length limit
  displayText = displayText.trim();
  if (maxLength && displayText.length > maxLength) {
    displayText = displayText.substring(0, maxLength - 3) + '...';
  }

  return displayText;
}

/**
 * Main response formatting function
 * @param {Object} aiResponse - Raw AI response data
 * @param {string} responseType - Type of response to format
 * @param {Object} options - Formatting options
 * @returns {Promise<Object>} Formatted response ready for display
 */
export async function formatAiResponse(aiResponse, responseType, options = {}) {
  try {
    let formatted;

    switch (responseType) {
      case RESPONSE_FORMATS.TRADE_ANALYSIS:
        formatted = formatTradeAnalysis(aiResponse, options);
        break;
      case RESPONSE_FORMATS.PSYCHOLOGY_COACHING:
        formatted = formatPsychologyCoaching(aiResponse, options);
        break;
      case RESPONSE_FORMATS.CHART_ANALYSIS:
        formatted = formatChartAnalysis(aiResponse, options);
        break;
      case RESPONSE_FORMATS.GENERAL_GUIDANCE:
        formatted = formatGeneralGuidance(aiResponse, options);
        break;
      default:
        formatted = formatGeneralGuidance(aiResponse, options);
        break;
    }

    // Add display text if requested
    if (options.includeDisplayText) {
      formatted.displayText = formatResponseForDisplay(formatted, options.displayOptions);
    }

    return formatted;

  } catch (error) {
    console.error('Response Formatting Error:', error);
    return formatErrorResponse(error, { 
      responseType, 
      userFriendly: true 
    });
  }
}

// Helper functions for display formatting

function getConfidenceLevel(confidence) {
  if (confidence >= 90) return 'Very High';
  if (confidence >= 75) return 'High';
  if (confidence >= 50) return 'Medium';
  if (confidence >= 25) return 'Low';
  return 'Very Low';
}

function formatConfidenceDisplay(confidence) {
  const bars = Math.round(confidence / 20);
  return '█'.repeat(bars) + '░'.repeat(5 - bars) + ` ${confidence}%`;
}

function getVerdictDescription(verdict, confidence) {
  const base = VERDICT_DISPLAY[verdict]?.description || '';
  return `${base} (${confidence}% confidence)`;
}

function formatCoachingTypeTitle(coachingType) {
  return coachingType ? 
    coachingType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') : 
    'General';
}

function personalizeRecommendation(recommendation) {
  // Add personalization prefixes to make recommendations more engaging
  const prefixes = [
    'Consider ',
    'Try ',
    'You might ',
    'It could help to ',
    'Focus on '
  ];
  
  const hasPrefix = prefixes.some(prefix => 
    recommendation.toLowerCase().startsWith(prefix.toLowerCase())
  );
  
  return hasPrefix ? recommendation : `Consider ${recommendation.toLowerCase()}`;
}

function getRecommendationIcon(recommendation, verdict) {
  if (recommendation.toLowerCase().includes('stop')) return '🛑';
  if (recommendation.toLowerCase().includes('risk')) return '⚖️';
  if (recommendation.toLowerCase().includes('profit')) return '💰';
  if (verdict === 'diamond') return '💎';
  if (verdict === 'fire') return '🔥';
  return '💡';
}

function getWarningIcon(warning) {
  if (warning.toLowerCase().includes('risk')) return '⚠️';
  if (warning.toLowerCase().includes('loss')) return '📉';
  if (warning.toLowerCase().includes('market')) return '🌊';
  return '⚠️';
}

function getWarningSeverity(warning, verdict) {
  if (verdict === 'skull') return 'high';
  if (warning.toLowerCase().includes('high risk')) return 'high';
  if (warning.toLowerCase().includes('caution')) return 'medium';
  return 'medium';
}

function formatSinglePattern(pattern) {
  const patternNames = {
    overtrading: { name: 'Overtrading', emoji: '🔄', severity: 'high' },
    revenge_trading: { name: 'Revenge Trading', emoji: '😡', severity: 'high' },
    fomo: { name: 'Fear of Missing Out', emoji: '😱', severity: 'medium' },
    analysis_paralysis: { name: 'Analysis Paralysis', emoji: '🤔', severity: 'medium' },
    good_discipline: { name: 'Good Discipline', emoji: '✅', severity: 'positive' },
    proper_risk_management: { name: 'Proper Risk Management', emoji: '🎯', severity: 'positive' }
  };

  const config = patternNames[pattern];
  return config ? {
    pattern,
    name: config.name,
    emoji: config.emoji,
    severity: config.severity
  } : null;
}

function getDisplayErrorMessage(errorMessage) {
  // Convert technical error messages to user-friendly messages
  const errorMap = {
    'Model not available': 'AI service is temporarily unavailable. Please try again.',
    'Rate limit exceeded': 'Too many requests. Please wait a moment and try again.',
    'Invalid input': 'Please check your message and try again.',
    'Network error': 'Connection issue. Please check your internet and retry.'
  };

  return errorMap[errorMessage] || 'An error occurred processing your request. Please try again.';
}

function determinErrorSeverity(error) {
  if (error.message?.includes('rate limit')) return 'medium';
  if (error.message?.includes('network')) return 'high';
  return 'medium';
}

// Display formatting helper functions
function formatVerdictForDisplay(verdict, options) {
  const { includeEmojis, format } = options;
  const emoji = includeEmojis ? verdict.display.emoji + ' ' : '';
  
  if (format === 'markdown') {
    let text = `## ${emoji}${verdict.display.label} - ${verdict.description}\n`;
    if (verdict.confidence) {
      text += `**Confidence:** ${verdict.confidence.display}\n`;
    }
    return text;
  }
  
  return `${emoji}${verdict.display.label} - ${verdict.description}`;
}

function formatHeaderForDisplay(header, options) {
  const { includeEmojis, format } = options;
  
  if (format === 'markdown') {
    return `## ${header.title}\n${header.content || ''}`;
  }
  
  return `${header.title}\n${header.content || ''}`;
}

function formatAnalysisForDisplay(analysis, options) {
  const { format } = options;
  
  if (format === 'markdown') {
    let text = `## ${analysis.title}\n`;
    if (analysis.sections) {
      analysis.sections.forEach(section => {
        text += `### ${section.title}\n${section.content}\n\n`;
      });
    } else if (analysis.content) {
      text += `${analysis.content}\n`;
    }
    return text;
  }
  
  return analysis.content || analysis.sections?.map(s => s.content).join('\n') || '';
}

function formatRecommendationsForDisplay(recommendations, options) {
  const { includeEmojis, format } = options;
  const icon = includeEmojis ? '💡 ' : '';
  
  if (format === 'markdown') {
    let text = `## ${icon}${recommendations.title}\n`;
    recommendations.items.forEach(item => {
      const bullet = includeEmojis ? `${item.icon || '•'}` : '•';
      text += `${bullet} ${item.text}\n`;
    });
    return text;
  }
  
  return recommendations.items.map(item => `• ${item.text}`).join('\n');
}

function formatWarningsForDisplay(warnings, options) {
  const { includeEmojis, format } = options;
  const icon = includeEmojis ? '⚠️ ' : '';
  
  if (format === 'markdown') {
    let text = `## ${icon}${warnings.title}\n`;
    warnings.items.forEach(item => {
      const bullet = includeEmojis ? `${item.icon || '⚠️'}` : '•';
      text += `${bullet} ${item.text}\n`;
    });
    return text;
  }
  
  return warnings.items.map(item => `• ${item.text}`).join('\n');
}

function formatPsychologyForDisplay(psychology, options) {
  const { includeEmojis, format } = options;
  const icon = includeEmojis ? '🧠 ' : '';
  
  if (format === 'markdown') {
    let text = `## ${icon}${psychology.title}\n`;
    
    if (psychology.patterns) {
      psychology.patterns.forEach(pattern => {
        const emoji = includeEmojis ? `${pattern.emoji} ` : '';
        text += `${emoji}**${pattern.name}** (${pattern.severity})\n`;
      });
    }
    
    if (psychology.riskDisplay && includeEmojis) {
      text += `\n**Risk Level:** ${psychology.riskDisplay.emoji} ${psychology.riskDisplay.label}\n`;
    }
    
    return text;
  }
  
  return psychology.patterns?.map(p => `${p.name} (${p.severity})`).join(', ') || '';
}

function formatTechnicalDetailsForDisplay(details, options) {
  const { format } = options;
  
  if (format === 'markdown') {
    return `## 🔍 Technical Details\n${details.content || 'Technical analysis breakdown available.'}`;
  }
  
  return details.content || 'Technical analysis breakdown available.';
}

function formatMetadataForDisplay(metadata) {
  return `\n---\n*Processed by ${metadata.aiModel} | ${metadata.processingTime}ms | ${metadata.tokensUsed} tokens*`;
}

// Export constants for external use
export {
  RESPONSE_FORMATS,
  RESPONSE_COMPONENTS,
  VERDICT_DISPLAY,
  PSYCHOLOGY_DISPLAY,
  RISK_DISPLAY
};