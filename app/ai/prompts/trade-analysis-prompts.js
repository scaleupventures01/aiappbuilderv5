/**
 * Trade Analysis Prompts - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.4-messages-table.md
 * Task: AI-MSG-007 - Trade analysis prompts with context-aware templates
 * Created: 2025-08-14
 * 
 * Implements comprehensive prompt engineering templates for trade analysis,
 * chart analysis, psychology coaching, and risk assessment with context-aware
 * prompt generation that adapts to user experience level and market conditions.
 */

// Prompt template types
const PROMPT_TYPES = {
  TRADE_ANALYSIS: 'trade-analysis',
  CHART_ANALYSIS: 'chart-analysis',
  PSYCHOLOGY_COACHING: 'psychology-coaching',
  RISK_ASSESSMENT: 'risk-assessment',
  GENERAL_GUIDANCE: 'general-guidance',
  EDUCATION: 'education'
};

// User experience levels for context adaptation
const EXPERIENCE_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  PROFESSIONAL: 'professional'
};

// Market condition contexts
const MARKET_CONDITIONS = {
  TRENDING: 'trending',
  RANGING: 'ranging',
  VOLATILE: 'volatile',
  LOW_VOLUME: 'low-volume',
  HIGH_VOLUME: 'high-volume',
  NEWS_DRIVEN: 'news-driven'
};

// Analysis modes
const ANALYSIS_MODES = {
  TECHNICAL: 'technical',
  FUNDAMENTAL: 'fundamental',
  SENTIMENT: 'sentiment',
  RISK_FOCUSED: 'risk-focused',
  PSYCHOLOGY_FOCUSED: 'psychology-focused'
};

// Base system prompts for different AI models
const SYSTEM_PROMPTS = {
  BASE_TRADER_COACH: `You are an elite trading coach and technical analyst with 15+ years of experience in financial markets. You specialize in:

- Technical analysis and chart pattern recognition
- Risk management and position sizing
- Trading psychology and emotional discipline
- Market structure and institutional behavior
- Options and derivatives strategies

Your role is to provide actionable, educational guidance while maintaining strict risk management principles. Always prioritize capital preservation over profit maximization.

Communication Style:
- Clear, concise, and educational
- Use specific examples and concrete levels
- Acknowledge uncertainty and market risks
- Encourage disciplined trading practices
- Provide both technical and psychological insights`,

  PSYCHOLOGY_SPECIALIST: `You are a specialized trading psychology coach with expertise in behavioral finance and trader mental conditioning. Your focus areas include:

- Identifying and correcting cognitive biases
- Emotional regulation and discipline building
- Performance psychology and mindset optimization
- Habit formation and behavioral change
- Stress management and decision-making under pressure

Your approach is supportive but direct, helping traders recognize destructive patterns and develop winning mindsets. You understand that psychology is often the difference between successful and unsuccessful traders.`,

  TECHNICAL_ANALYST: `You are a professional technical analyst with deep expertise in:

- Chart patterns and price action analysis
- Support and resistance identification
- Trend analysis across multiple timeframes
- Volume analysis and market microstructure
- Risk/reward assessment and trade setup evaluation

You provide objective, data-driven analysis while clearly communicating probability-based outcomes. You always include specific entry, exit, and stop-loss levels when analyzing setups.`
};

// Context-aware prompt builders

/**
 * Build trade analysis prompt with context adaptation
 * @param {Object} params - Prompt parameters
 * @returns {Object} Complete prompt with system and user messages
 */
function buildTradeAnalysisPrompt(params) {
  const {
    userMessage,
    hasChart = false,
    experienceLevel = EXPERIENCE_LEVELS.INTERMEDIATE,
    marketCondition = MARKET_CONDITIONS.TRENDING,
    analysisMode = ANALYSIS_MODES.TECHNICAL,
    userHistory = {},
    riskProfile = 'moderate'
  } = params;

  const systemPrompt = getContextualSystemPrompt(PROMPT_TYPES.TRADE_ANALYSIS, {
    experienceLevel,
    marketCondition,
    analysisMode,
    hasChart
  });

  const userPrompt = buildContextualUserPrompt(userMessage, {
    experienceLevel,
    marketCondition,
    riskProfile,
    userHistory,
    hasChart
  });

  const analysisInstructions = getAnalysisInstructions(analysisMode, hasChart);

  return {
    system: systemPrompt,
    user: userPrompt,
    instructions: analysisInstructions,
    context: {
      experienceLevel,
      marketCondition,
      analysisMode,
      hasChart,
      riskProfile
    }
  };
}

/**
 * Build chart analysis prompt for GPT-5
 * @param {Object} params - Chart analysis parameters
 * @returns {Object} Chart-specific prompt with vision instructions
 */
function buildChartAnalysisPrompt(params) {
  const {
    userMessage,
    imageUrl,
    timeframe,
    symbol,
    experienceLevel = EXPERIENCE_LEVELS.INTERMEDIATE,
    focusAreas = ['support', 'resistance', 'patterns']
  } = params;

  const systemPrompt = `${SYSTEM_PROMPTS.TECHNICAL_ANALYST}

CHART ANALYSIS INSTRUCTIONS:
You will analyze a trading chart image. Follow this systematic approach:

1. **Overall Market Structure**
   - Identify the primary trend (up/down/sideways)
   - Note any significant market structure levels
   - Assess overall momentum and volatility

2. **Key Levels Identification**
   - Mark important support and resistance levels
   - Identify psychological levels (round numbers)
   - Note any confluence zones

3. **Pattern Recognition**
   - Identify any chart patterns (triangles, flags, head & shoulders, etc.)
   - Note candlestick patterns and significance
   - Assess pattern quality and completion status

4. **Technical Indicators**
   - Analyze any visible indicators (RSI, MACD, moving averages)
   - Comment on momentum and trend strength
   - Note any divergences or confluences

5. **Trading Setup Assessment**
   - Provide a clear verdict: Diamond 💎 (excellent), Fire 🔥 (good with caveats), or Skull 💀 (avoid)
   - Include specific entry, stop loss, and target levels
   - Calculate risk/reward ratio
   - Assess probability of success

6. **Risk Considerations**
   - Highlight any risk factors or concerns
   - Consider market timing and session factors
   - Note any upcoming events that might impact the trade

Adapt your analysis complexity to the user's experience level: ${experienceLevel}.`;

  const userPrompt = `Please analyze this ${timeframe} chart for ${symbol || 'the instrument'}.

User's message: "${userMessage}"

Focus areas: ${focusAreas.join(', ')}

Please provide:
- Clear verdict with confidence level
- Specific levels for entry, stop, and targets
- Risk/reward assessment
- Key factors supporting your analysis
- Any warnings or special considerations

${getExperienceLevelGuidance(experienceLevel)}`;

  return {
    system: systemPrompt,
    user: userPrompt,
    imageUrl,
    instructions: getChartAnalysisInstructions(),
    context: {
      hasChart: true,
      timeframe,
      symbol,
      experienceLevel,
      focusAreas
    }
  };
}

/**
 * Build psychology coaching prompt
 * @param {Object} params - Psychology coaching parameters
 * @returns {Object} Psychology-focused prompt
 */
function buildPsychologyCoachingPrompt(params) {
  const {
    userMessage,
    emotionalState,
    patternHistory = [],
    experienceLevel = EXPERIENCE_LEVELS.INTERMEDIATE,
    coachingStyle = 'supportive'
  } = params;

  const systemPrompt = `${SYSTEM_PROMPTS.PSYCHOLOGY_SPECIALIST}

PSYCHOLOGY COACHING CONTEXT:
- User's current emotional state: ${emotionalState || 'Unknown'}
- Experience level: ${experienceLevel}
- Coaching style: ${coachingStyle}
- Historical patterns: ${patternHistory.length > 0 ? patternHistory.join(', ') : 'None identified yet'}

COACHING APPROACH:
1. **Pattern Recognition**: Identify psychological patterns in the user's message
2. **Root Cause Analysis**: Understand underlying emotional drivers
3. **Actionable Guidance**: Provide specific, implementable strategies
4. **Positive Reinforcement**: Acknowledge good habits and decisions
5. **Risk Mitigation**: Address any high-risk psychological states

${getCoachingStyleInstructions(coachingStyle)}

Always provide:
- Identified emotional state and confidence level
- Psychology pattern tags
- Coaching type recommendation
- Specific action items
- Long-term development suggestions`;

  const userPrompt = `TRADER PSYCHOLOGY ANALYSIS NEEDED:

User's message: "${userMessage}"

Please analyze this message for:
- Emotional state and psychology patterns
- Potential risks or red flags
- Coaching recommendations
- Action items for improvement

${emotionalState ? `Note: User appears to be in a ${emotionalState} state currently.` : ''}

Provide supportive but honest feedback that helps build better trading discipline and emotional control.`;

  return {
    system: systemPrompt,
    user: userPrompt,
    instructions: getPsychologyAnalysisInstructions(),
    context: {
      emotionalState,
      patternHistory,
      experienceLevel,
      coachingStyle
    }
  };
}

/**
 * Build risk assessment prompt
 * @param {Object} params - Risk assessment parameters  
 * @returns {Object} Risk-focused prompt
 */
function buildRiskAssessmentPrompt(params) {
  const {
    userMessage,
    portfolioSize,
    riskPerTrade,
    currentPositions = [],
    experienceLevel = EXPERIENCE_LEVELS.INTERMEDIATE
  } = params;

  const systemPrompt = `You are a professional risk management specialist with expertise in:
- Position sizing and portfolio allocation
- Risk/reward optimization
- Drawdown management and capital preservation
- Portfolio correlation and diversification
- Stress testing and scenario analysis

RISK ASSESSMENT FRAMEWORK:
1. **Position Sizing Analysis**
   - Evaluate proposed position size against account
   - Calculate risk as percentage of portfolio
   - Assess correlation with existing positions

2. **Risk/Reward Evaluation**
   - Calculate potential risk/reward ratios
   - Evaluate probability-weighted outcomes
   - Consider worst-case scenarios

3. **Portfolio Impact Assessment**
   - Analyze correlation with current positions
   - Evaluate total portfolio exposure
   - Consider concentration risks

4. **Recommendations**
   - Optimal position sizing
   - Risk mitigation strategies  
   - Portfolio adjustments needed

Current Context:
- Portfolio size: ${portfolioSize || 'Not specified'}
- Risk per trade target: ${riskPerTrade || 'Not specified'}
- Current positions: ${currentPositions.length} active trades
- Experience level: ${experienceLevel}`;

  const userPrompt = `RISK ASSESSMENT REQUEST:

"${userMessage}"

Portfolio Context:
- Account size: ${portfolioSize || 'Please specify'}
- Risk tolerance: ${riskPerTrade || 'Please specify'} per trade
- Current positions: ${currentPositions.length > 0 ? currentPositions.join(', ') : 'None'}

Please provide:
- Risk assessment of the proposed trade/strategy
- Optimal position sizing recommendations  
- Portfolio correlation analysis
- Risk mitigation suggestions
- Overall risk score and reasoning

Focus on capital preservation while optimizing for long-term growth.`;

  return {
    system: systemPrompt,
    user: userPrompt,
    instructions: getRiskAssessmentInstructions(),
    context: {
      portfolioSize,
      riskPerTrade,
      currentPositions,
      experienceLevel
    }
  };
}

/**
 * Get contextual system prompt based on analysis type
 * @param {string} promptType - Type of analysis prompt
 * @param {Object} context - Analysis context
 * @returns {string} Contextual system prompt
 */
function getContextualSystemPrompt(promptType, context) {
  let basePrompt = SYSTEM_PROMPTS.BASE_TRADER_COACH;
  
  // Add specific instructions based on context
  if (context.hasChart) {
    basePrompt += `\n\nCHART ANALYSIS CAPABILITY:
You will be provided with chart images. Analyze them systematically and provide specific levels and actionable insights.`;
  }

  if (context.experienceLevel === EXPERIENCE_LEVELS.BEGINNER) {
    basePrompt += `\n\nBEGINNER FOCUS:
- Use simple, educational language
- Explain technical terms and concepts
- Emphasize risk management fundamentals
- Provide step-by-step guidance`;
  } else if (context.experienceLevel === EXPERIENCE_LEVELS.ADVANCED) {
    basePrompt += `\n\nADVANCED FOCUS:
- Provide sophisticated analysis
- Include complex strategies and nuances
- Assume knowledge of advanced concepts
- Focus on edge cases and market inefficiencies`;
  }

  if (context.marketCondition) {
    basePrompt += `\n\nMARKET CONDITION: ${context.marketCondition.toUpperCase()}
Adapt your analysis and recommendations to current market conditions.`;
  }

  return basePrompt;
}

/**
 * Build contextual user prompt with relevant details
 * @param {string} userMessage - Original user message
 * @param {Object} context - User and market context
 * @returns {string} Enhanced user prompt
 */
function buildContextualUserPrompt(userMessage, context) {
  let prompt = `TRADING ANALYSIS REQUEST:\n\n"${userMessage}"\n\n`;

  // Add context information
  const contextInfo = [];
  
  if (context.experienceLevel) {
    contextInfo.push(`Experience Level: ${context.experienceLevel}`);
  }
  
  if (context.riskProfile) {
    contextInfo.push(`Risk Profile: ${context.riskProfile}`);
  }
  
  if (context.marketCondition) {
    contextInfo.push(`Market Condition: ${context.marketCondition}`);
  }

  if (contextInfo.length > 0) {
    prompt += `Context: ${contextInfo.join(' | ')}\n\n`;
  }

  // Add user history insights if available
  if (context.userHistory && Object.keys(context.userHistory).length > 0) {
    prompt += `User History Insights:\n`;
    if (context.userHistory.commonPatterns) {
      prompt += `- Common patterns: ${context.userHistory.commonPatterns.join(', ')}\n`;
    }
    if (context.userHistory.riskTendencies) {
      prompt += `- Risk tendencies: ${context.userHistory.riskTendencies}\n`;
    }
    prompt += '\n';
  }

  return prompt;
}

/**
 * Get analysis-specific instructions
 * @param {string} analysisMode - Mode of analysis
 * @param {boolean} hasChart - Whether chart is included
 * @returns {string} Analysis instructions
 */
function getAnalysisInstructions(analysisMode, hasChart) {
  let instructions = `RESPONSE REQUIREMENTS:\n`;
  
  if (hasChart) {
    instructions += `- Analyze the provided chart systematically\n`;
    instructions += `- Provide specific entry, stop, and target levels\n`;
  }
  
  instructions += `- Assign a clear verdict: Diamond 💎, Fire 🔥, or Skull 💀\n`;
  instructions += `- Include confidence level (0-100%)\n`;
  instructions += `- Provide specific actionable recommendations\n`;
  instructions += `- Highlight key risks and considerations\n`;
  
  switch (analysisMode) {
    case ANALYSIS_MODES.TECHNICAL:
      instructions += `- Focus on technical factors and chart patterns\n`;
      instructions += `- Include momentum and trend analysis\n`;
      break;
    case ANALYSIS_MODES.PSYCHOLOGY_FOCUSED:
      instructions += `- Analyze psychological factors and trader mindset\n`;
      instructions += `- Identify emotional patterns and biases\n`;
      break;
    case ANALYSIS_MODES.RISK_FOCUSED:
      instructions += `- Emphasize risk management and position sizing\n`;
      instructions += `- Calculate risk/reward ratios\n`;
      break;
  }

  return instructions;
}

/**
 * Get experience-level specific guidance
 * @param {string} experienceLevel - User's experience level
 * @returns {string} Level-appropriate guidance
 */
function getExperienceLevelGuidance(experienceLevel) {
  switch (experienceLevel) {
    case EXPERIENCE_LEVELS.BEGINNER:
      return `Please explain technical terms and provide educational context. Focus on fundamentals and risk management.`;
    case EXPERIENCE_LEVELS.INTERMEDIATE:
      return `Provide moderate complexity analysis with some educational elements. Balance technical detail with clarity.`;
    case EXPERIENCE_LEVELS.ADVANCED:
      return `Provide sophisticated analysis with advanced concepts. Include edge cases and market nuances.`;
    case EXPERIENCE_LEVELS.PROFESSIONAL:
      return `Provide institutional-level analysis with maximum technical depth and professional insights.`;
    default:
      return `Provide balanced analysis suitable for intermediate traders.`;
  }
}

/**
 * Get coaching style specific instructions
 * @param {string} coachingStyle - Preferred coaching approach
 * @returns {string} Style-specific instructions
 */
function getCoachingStyleInstructions(coachingStyle) {
  switch (coachingStyle) {
    case 'supportive':
      return `Use an encouraging, supportive tone while being honest about issues. Focus on positive reinforcement and gradual improvement.`;
    case 'direct':
      return `Be direct and straightforward. Call out problems clearly but provide constructive solutions.`;
    case 'analytical':
      return `Take a data-driven, objective approach. Focus on patterns and measurable behaviors.`;
    default:
      return `Use a balanced approach that is both supportive and honest.`;
  }
}

/**
 * Get chart analysis specific instructions
 * @returns {string} Chart analysis instructions
 */
function getChartAnalysisInstructions() {
  return `CHART ANALYSIS METHODOLOGY:
1. Identify overall trend and market structure
2. Mark key support and resistance levels  
3. Analyze patterns and formations
4. Assess momentum and volume
5. Provide specific trade levels
6. Calculate risk/reward ratios
7. Assign verdict with confidence level`;
}

/**
 * Get psychology analysis instructions
 * @returns {string} Psychology analysis instructions
 */
function getPsychologyAnalysisInstructions() {
  return `PSYCHOLOGY ANALYSIS METHODOLOGY:
1. Identify emotional state and triggers
2. Detect behavioral patterns and biases
3. Assess risk level of psychological state
4. Provide coaching type recommendation
5. Give specific action items
6. Include positive reinforcement where appropriate
7. Suggest long-term development strategies`;
}

/**
 * Get risk assessment instructions
 * @returns {string} Risk assessment instructions
 */
function getRiskAssessmentInstructions() {
  return `RISK ASSESSMENT METHODOLOGY:
1. Calculate position size based on risk parameters
2. Evaluate risk/reward ratios
3. Assess correlation with existing positions
4. Consider worst-case scenarios
5. Provide portfolio impact analysis
6. Recommend risk mitigation strategies
7. Give overall risk score and reasoning`;
}

/**
 * Generate dynamic prompt based on message analysis
 * @param {Object} messageData - Message data to analyze
 * @param {Object} userContext - User context and preferences
 * @returns {Promise<Object>} Optimized prompt for the message type
 */
export async function generateOptimalPrompt(messageData, userContext = {}) {
  try {
    // Analyze message to determine best prompt type
    const promptType = determinePromptType(messageData);
    const analysisMode = determineAnalysisMode(messageData);
    
    const promptParams = {
      userMessage: messageData.content,
      hasChart: !!(messageData.image_url || messageData.image_filename),
      experienceLevel: userContext.experienceLevel || EXPERIENCE_LEVELS.INTERMEDIATE,
      marketCondition: userContext.marketCondition || MARKET_CONDITIONS.TRENDING,
      analysisMode: analysisMode,
      userHistory: userContext.history || {},
      riskProfile: userContext.riskProfile || 'moderate'
    };

    let prompt;
    
    switch (promptType) {
      case PROMPT_TYPES.CHART_ANALYSIS:
        prompt = buildChartAnalysisPrompt({
          ...promptParams,
          imageUrl: messageData.image_url,
          timeframe: extractTimeframe(messageData.content),
          symbol: extractSymbol(messageData.content)
        });
        break;
        
      case PROMPT_TYPES.PSYCHOLOGY_COACHING:
        prompt = buildPsychologyCoachingPrompt({
          ...promptParams,
          emotionalState: messageData.emotional_state,
          patternHistory: userContext.psychologyPatterns || []
        });
        break;
        
      case PROMPT_TYPES.RISK_ASSESSMENT:
        prompt = buildRiskAssessmentPrompt({
          ...promptParams,
          portfolioSize: userContext.portfolioSize,
          riskPerTrade: userContext.riskPerTrade,
          currentPositions: userContext.currentPositions || []
        });
        break;
        
      default:
        prompt = buildTradeAnalysisPrompt(promptParams);
        break;
    }

    return {
      promptType,
      analysisMode,
      ...prompt
    };

  } catch (error) {
    console.error('Prompt Generation Error:', error);
    
    // Return fallback prompt
    return buildTradeAnalysisPrompt({
      userMessage: messageData.content || 'Please analyze this trading situation.',
      hasChart: !!(messageData.image_url || messageData.image_filename)
    });
  }
}

/**
 * Determine the best prompt type based on message content
 * @param {Object} messageData - Message data to analyze
 * @returns {string} Optimal prompt type
 */
function determinePromptType(messageData) {
  const content = (messageData.content || '').toLowerCase();
  
  // Check for chart analysis
  if (messageData.image_url || messageData.image_filename || 
      content.includes('chart') || content.includes('technical analysis')) {
    return PROMPT_TYPES.CHART_ANALYSIS;
  }
  
  // Check for psychology coaching
  const psychologyKeywords = [
    'emotional', 'feeling', 'anxious', 'confident', 'fear', 'discipline',
    'psychology', 'mindset', 'revenge', 'overtrading', 'fomo', 'stressed'
  ];
  
  if (psychologyKeywords.some(keyword => content.includes(keyword))) {
    return PROMPT_TYPES.PSYCHOLOGY_COACHING;
  }
  
  // Check for risk assessment
  const riskKeywords = [
    'position size', 'risk', 'portfolio', 'allocation', 'drawdown',
    'risk management', 'stop loss', 'risk reward'
  ];
  
  if (riskKeywords.some(keyword => content.includes(keyword))) {
    return PROMPT_TYPES.RISK_ASSESSMENT;
  }
  
  return PROMPT_TYPES.TRADE_ANALYSIS;
}

/**
 * Determine analysis mode based on message content
 * @param {Object} messageData - Message data to analyze
 * @returns {string} Analysis mode
 */
function determineAnalysisMode(messageData) {
  const content = (messageData.content || '').toLowerCase();
  
  if (content.includes('psychology') || content.includes('emotional') || 
      content.includes('mindset')) {
    return ANALYSIS_MODES.PSYCHOLOGY_FOCUSED;
  }
  
  if (content.includes('risk') || content.includes('position size') || 
      content.includes('portfolio')) {
    return ANALYSIS_MODES.RISK_FOCUSED;
  }
  
  return ANALYSIS_MODES.TECHNICAL;
}

/**
 * Extract timeframe from message content
 * @param {string} content - Message content
 * @returns {string|null} Extracted timeframe
 */
function extractTimeframe(content) {
  const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', 'd1', 'daily', 'weekly', 'monthly'];
  const lowerContent = content.toLowerCase();
  
  for (const tf of timeframes) {
    if (lowerContent.includes(tf)) {
      return tf;
    }
  }
  
  return null;
}

/**
 * Extract symbol/ticker from message content
 * @param {string} content - Message content
 * @returns {string|null} Extracted symbol
 */
function extractSymbol(content) {
  // Common symbol patterns
  const symbolPatterns = [
    /\b[A-Z]{1,5}USD\b/g,  // EURUSD, GBPUSD
    /\b[A-Z]{3,5}\b/g,     // BTC, ETH, AAPL
    /\$[A-Z]{1,5}\b/g      // $AAPL, $TSLA
  ];
  
  for (const pattern of symbolPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].replace('$', '');
    }
  }
  
  return null;
}

/**
 * Create specialized prompts for specific trading scenarios
 * @param {string} scenario - Trading scenario type
 * @param {Object} params - Scenario-specific parameters
 * @returns {Object} Specialized prompt
 */
export function createScenarioPrompt(scenario, params = {}) {
  const scenarioPrompts = {
    breakout: {
      focus: 'Breakout analysis and momentum confirmation',
      instructions: 'Analyze breakout potential, volume confirmation, and false breakout risks'
    },
    reversal: {
      focus: 'Reversal pattern identification and confirmation',
      instructions: 'Identify reversal signals, assess strength, and evaluate continuation risks'
    },
    trending: {
      focus: 'Trend following and pullback opportunities',
      instructions: 'Analyze trend strength, identify pullback entries, and assess trend exhaustion'
    },
    ranging: {
      focus: 'Range trading and breakout preparation',
      instructions: 'Identify range boundaries, assess breakout potential, and evaluate range continuation'
    }
  };

  const scenarioConfig = scenarioPrompts[scenario];
  if (!scenarioConfig) {
    return buildTradeAnalysisPrompt(params);
  }

  return buildTradeAnalysisPrompt({
    ...params,
    analysisMode: ANALYSIS_MODES.TECHNICAL,
    specialInstructions: `SCENARIO FOCUS: ${scenarioConfig.focus}

${scenarioConfig.instructions}

Provide scenario-specific analysis with:
- Key levels and confirmation signals
- Entry and exit strategies
- Risk factors specific to this scenario
- Probability assessment for success`
  });
}

// Export constants and utilities
export {
  PROMPT_TYPES,
  EXPERIENCE_LEVELS,
  MARKET_CONDITIONS,
  ANALYSIS_MODES,
  buildTradeAnalysisPrompt,
  buildChartAnalysisPrompt,
  buildPsychologyCoachingPrompt,
  buildRiskAssessmentPrompt
};