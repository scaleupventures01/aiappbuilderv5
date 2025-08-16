/**
 * AI Integration Module - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.4-messages-table.md
 * Task: AI Integration - Main orchestration module for all AI components
 * Created: 2025-08-14
 * 
 * This module orchestrates all AI components to provide comprehensive
 * trading analysis, psychology coaching, and chart analysis services.
 * It integrates verdict classification, psychology pattern detection,
 * model selection, response formatting, and prompt generation.
 */

import OpenAI from 'openai';
import { classifyTradingSetup } from './verdict/classifier.js';
import { analyzeTraderPsychology } from './psychology/pattern-detector.js';
import { selectOptimalModel } from './core/model-selector.js';
import { formatAiResponse, RESPONSE_FORMATS } from './formatting/response-formatter.js';
import { generateOptimalPrompt } from './prompts/trade-analysis-prompts.js';

// Initialize OpenAI client (with fallback for testing)
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  } else {
    console.warn('OpenAI API key not found - AI processing will use fallback mode');
  }
} catch (error) {
  console.warn('OpenAI initialization failed:', error.message);
}

// AI processing configuration
const AI_CONFIG = {
  maxRetries: 3,
  timeout: 30000, // 30 seconds
  defaultModel: 'claude-3.5-sonnet',
  costTracking: true,
  errorHandling: true
};

// Token usage tracking
const tokenTracker = {
  totalTokens: 0,
  totalCost: 0,
  requestCount: 0
};

/**
 * Main AI processing function that orchestrates all components
 * @param {Object} messageData - Message data from database
 * @param {Object} options - Processing options and user context
 * @returns {Promise<Object>} Complete AI analysis results
 */
export async function processMessage(messageData, options = {}) {
  const startTime = Date.now();
  
  try {
    const {
      userContext = {},
      includeVerdictClassification = true,
      includePsychologyAnalysis = true,
      includeFormatting = true,
      modelSelectionOptions = {},
      costSensitive = false
    } = options;

    console.log(`Starting AI processing for message ${messageData.id}`);

    // Step 1: Select optimal AI model
    const modelSelection = await selectOptimalModel(messageData, {
      costSensitivity: costSensitive ? 'high' : 'medium',
      ...modelSelectionOptions
    });

    console.log(`Selected model: ${modelSelection.selectedModel} (confidence: ${modelSelection.confidence}%)`);

    // Step 2: Generate optimal prompt
    const promptData = await generateOptimalPrompt(messageData, userContext);

    console.log(`Generated ${promptData.promptType} prompt with ${promptData.analysisMode} focus`);

    // Step 3: Execute AI analysis
    const aiResponse = await executeAiAnalysis(
      modelSelection.selectedModel,
      promptData,
      messageData.image_url
    );

    // Step 4: Process verdict classification if requested
    let verdictResults = null;
    if (includeVerdictClassification) {
      try {
        verdictResults = await classifyTradingSetup({
          description: messageData.content,
          chartData: messageData.image_url ? { hasChart: true } : null
        }, {
          includeReasoning: true,
          riskFactors: extractRiskFactors(messageData.content),
          positiveFactors: extractPositiveFactors(messageData.content)
        });

        console.log(`Verdict classified: ${verdictResults.verdict} (${verdictResults.confidence}% confidence)`);
      } catch (error) {
        console.error('Verdict classification failed:', error);
        verdictResults = { error: error.message };
      }
    }

    // Step 5: Process psychology analysis if requested
    let psychologyResults = null;
    if (includePsychologyAnalysis) {
      try {
        psychologyResults = await analyzeTraderPsychology(messageData, {
          includeHistoricalTrends: userContext.includeHistory || false,
          historicalMessages: userContext.historicalMessages || []
        });

        console.log(`Psychology analyzed: ${psychologyResults.emotionalState || 'Unknown'} state, ${psychologyResults.patternTags?.length || 0} patterns`);
      } catch (error) {
        console.error('Psychology analysis failed:', error);
        psychologyResults = { error: error.message };
      }
    }

    // Step 6: Combine and structure results
    const combinedResults = combineAnalysisResults({
      aiResponse,
      verdictResults,
      psychologyResults,
      modelSelection,
      promptData,
      processingTime: Date.now() - startTime
    });

    // Step 7: Format response if requested
    let formattedResponse = combinedResults;
    if (includeFormatting) {
      try {
        const responseType = determineResponseType(promptData.promptType, verdictResults, psychologyResults);
        formattedResponse = await formatAiResponse(combinedResults, responseType, {
          includeDisplayText: true,
          displayOptions: {
            includeEmojis: true,
            includeMetadata: options.includeMetadata !== false,
            format: 'markdown'
          }
        });

        console.log(`Response formatted as ${responseType}`);
      } catch (error) {
        console.error('Response formatting failed:', error);
        formattedResponse.formattingError = error.message;
      }
    }

    // Step 8: Track usage and costs
    trackUsageMetrics({
      modelUsed: modelSelection.selectedModel,
      tokensUsed: aiResponse.usage?.total_tokens || 0,
      costIncurred: modelSelection.estimatedCost,
      processingTime: Date.now() - startTime,
      success: true
    });

    console.log(`AI processing completed successfully in ${Date.now() - startTime}ms`);

    return {
      success: true,
      results: formattedResponse,
      metadata: {
        processingTime: Date.now() - startTime,
        modelUsed: modelSelection.selectedModel,
        tokensUsed: aiResponse.usage?.total_tokens || 0,
        estimatedCost: modelSelection.estimatedCost,
        promptType: promptData.promptType,
        analysisMode: promptData.analysisMode
      }
    };

  } catch (error) {
    console.error('AI processing failed:', error);
    
    // Track failed processing
    trackUsageMetrics({
      modelUsed: options.fallbackModel || AI_CONFIG.defaultModel,
      tokensUsed: 0,
      costIncurred: 0,
      processingTime: Date.now() - startTime,
      success: false,
      error: error.message
    });

    return {
      success: false,
      error: error.message,
      fallbackResponse: await generateFallbackResponse(messageData, error),
      metadata: {
        processingTime: Date.now() - startTime,
        error: error.message
      }
    };
  }
}

/**
 * Execute AI analysis using selected model and prompt
 * @param {string} modelId - Selected AI model ID
 * @param {Object} promptData - Generated prompt data
 * @param {string} imageUrl - Optional image URL for vision models
 * @returns {Promise<Object>} AI response
 */
async function executeAiAnalysis(modelId, promptData, imageUrl = null) {
  const startTime = Date.now();
  
  try {
    // Handle different AI providers
    if (modelId.startsWith('gpt-')) {
      return await executeOpenAiAnalysis(modelId, promptData, imageUrl);
    } else if (modelId.startsWith('claude-')) {
      // For now, fall back to OpenAI - Claude integration would be added later
      console.log('Claude model requested but not implemented, falling back to GPT-4');
      return await executeOpenAiAnalysis('gpt-4', promptData, imageUrl);
    } else {
      throw new Error(`Unsupported model: ${modelId}`);
    }
  } catch (error) {
    console.error('AI execution error:', error);
    throw error;
  }
}

/**
 * Execute OpenAI analysis
 * @param {string} modelId - OpenAI model ID
 * @param {Object} promptData - Prompt data
 * @param {string} imageUrl - Optional image URL
 * @returns {Promise<Object>} OpenAI response
 */
async function executeOpenAiAnalysis(modelId, promptData, imageUrl = null) {
  // Check if OpenAI client is available
  if (!openai) {
    throw new Error('OpenAI client not available - missing API key');
  }

  const messages = [
    {
      role: 'system',
      content: promptData.system
    },
    {
      role: 'user',
      content: imageUrl ? [
        { type: 'text', text: promptData.user },
        { type: 'image_url', image_url: { url: imageUrl } }
      ] : promptData.user
    }
  ];

  const requestConfig = {
    model: modelId.includes('vision') ? 'gpt-4-vision-preview' : modelId,
    messages,
    max_tokens: 1000,
    temperature: 0.7,
    response_format: { type: 'text' }
  };

  const response = await openai.chat.completions.create(requestConfig);
  
  return {
    content: response.choices[0].message.content,
    usage: response.usage,
    model: response.model,
    timestamp: new Date().toISOString()
  };
}

/**
 * Combine all analysis results into a structured response
 * @param {Object} components - All analysis components
 * @returns {Object} Combined results
 */
function combineAnalysisResults({
  aiResponse,
  verdictResults,
  psychologyResults,
  modelSelection,
  promptData,
  processingTime
}) {
  const combined = {
    // Core AI response
    content: aiResponse.content,
    aiModel: modelSelection.selectedModel,
    
    // Analysis results
    verdict: verdictResults?.verdict || null,
    confidence: verdictResults?.confidence || null,
    reasoning: verdictResults?.reasoning || null,
    
    // Psychology analysis
    emotionalState: psychologyResults?.emotionalState || null,
    coachingType: psychologyResults?.coachingType || null,
    patternTags: psychologyResults?.patternTags || [],
    psychologyInsights: psychologyResults?.insights || null,
    
    // Technical metadata
    processingTimeMs: processingTime,
    tokensUsed: aiResponse.usage?.total_tokens || 0,
    estimatedCost: modelSelection.estimatedCost,
    promptType: promptData.promptType,
    analysisMode: promptData.analysisMode,
    
    // Raw components for debugging
    _raw: {
      aiResponse,
      verdictResults,
      psychologyResults,
      modelSelection: {
        selectedModel: modelSelection.selectedModel,
        confidence: modelSelection.confidence,
        reasoning: modelSelection.reasoning
      }
    }
  };

  return combined;
}

/**
 * Determine response type for formatting
 * @param {string} promptType - Original prompt type
 * @param {Object} verdictResults - Verdict classification results
 * @param {Object} psychologyResults - Psychology analysis results
 * @returns {string} Response format type
 */
function determineResponseType(promptType, verdictResults, psychologyResults) {
  // Psychology-focused response
  if (psychologyResults && psychologyResults.emotionalState && 
      psychologyResults.patternTags && psychologyResults.patternTags.length > 0) {
    return RESPONSE_FORMATS.PSYCHOLOGY_COACHING;
  }
  
  // Trade analysis with verdict
  if (verdictResults && verdictResults.verdict) {
    return RESPONSE_FORMATS.TRADE_ANALYSIS;
  }
  
  // Chart analysis
  if (promptType === 'chart-analysis') {
    return RESPONSE_FORMATS.CHART_ANALYSIS;
  }
  
  // Default to general guidance
  return RESPONSE_FORMATS.GENERAL_GUIDANCE;
}

/**
 * Extract risk factors from message content
 * @param {string} content - Message content
 * @returns {Array} Identified risk factors
 */
function extractRiskFactors(content) {
  const riskFactors = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('news') || lowerContent.includes('earnings')) {
    riskFactors.push('majorNews');
  }
  
  if (lowerContent.includes('low volume') || lowerContent.includes('thin')) {
    riskFactors.push('lowVolume');
  }
  
  if (lowerContent.includes('choppy') || lowerContent.includes('sideways')) {
    riskFactors.push('choppy');
  }
  
  if (lowerContent.includes('extended') || lowerContent.includes('overbought')) {
    riskFactors.push('overextended');
  }
  
  return riskFactors;
}

/**
 * Extract positive factors from message content
 * @param {string} content - Message content
 * @returns {Array} Identified positive factors
 */
function extractPositiveFactors(content) {
  const positiveFactors = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('confluence') || lowerContent.includes('aligned')) {
    positiveFactors.push('perfectAlignment');
  }
  
  if (lowerContent.includes('institutional') || lowerContent.includes('strong level')) {
    positiveFactors.push('institutionalSupport');
  }
  
  if (lowerContent.includes('high volume') || lowerContent.includes('volume surge')) {
    positiveFactors.push('highVolume');
  }
  
  if (lowerContent.includes('clean break') || lowerContent.includes('clear break')) {
    positiveFactors.push('cleanBreakout');
  }
  
  return positiveFactors;
}

/**
 * Track usage metrics for analytics and billing
 * @param {Object} metrics - Usage metrics
 */
function trackUsageMetrics(metrics) {
  tokenTracker.totalTokens += metrics.tokensUsed;
  tokenTracker.totalCost += metrics.costIncurred;
  tokenTracker.requestCount += 1;
  
  console.log(`Usage tracked: ${metrics.tokensUsed} tokens, $${metrics.costIncurred.toFixed(4)} cost`);
  
  // Here you could store metrics to database or send to analytics service
}

/**
 * Generate fallback response when AI processing fails
 * @param {Object} messageData - Original message data
 * @param {Error} error - Processing error
 * @returns {Promise<Object>} Fallback response
 */
async function generateFallbackResponse(messageData, error) {
  try {
    // Simple rule-based fallback
    const hasChart = !!(messageData.image_url || messageData.image_filename);
    
    if (hasChart) {
      return {
        type: 'fallback',
        content: `I'm having trouble analyzing your chart right now due to a technical issue. Please try uploading the chart again or describe your trading setup in text so I can provide analysis.`,
        suggestions: [
          'Try describing your setup in text',
          'Re-upload the chart image',
          'Ask about general trading principles'
        ]
      };
    } else {
      return {
        type: 'fallback', 
        content: `I'm experiencing a temporary issue processing your message. I can still help with general trading questions or if you provide more specific details about your trading setup.`,
        suggestions: [
          'Ask about risk management',
          'Request trading psychology tips',
          'Share more details about your setup'
        ]
      };
    }
  } catch (fallbackError) {
    console.error('Fallback generation failed:', fallbackError);
    return {
      type: 'error',
      content: 'I apologize, but I\'m temporarily unable to process your request. Please try again in a moment.'
    };
  }
}

/**
 * Get AI processing statistics
 * @returns {Object} Processing statistics
 */
export function getAiStats() {
  return {
    totalRequests: tokenTracker.requestCount,
    totalTokens: tokenTracker.totalTokens,
    totalCost: tokenTracker.totalCost,
    averageTokensPerRequest: tokenTracker.requestCount > 0 ? 
      Math.round(tokenTracker.totalTokens / tokenTracker.requestCount) : 0,
    averageCostPerRequest: tokenTracker.requestCount > 0 ? 
      (tokenTracker.totalCost / tokenTracker.requestCount).toFixed(4) : '0.0000'
  };
}

/**
 * Health check for AI services
 * @returns {Promise<Object>} Health status
 */
export async function healthCheck() {
  try {
    const services = {
      verdict_classifier: 'loaded',
      psychology_detector: 'loaded', 
      model_selector: 'loaded',
      response_formatter: 'loaded',
      prompt_generator: 'loaded'
    };

    // Test OpenAI connection if available
    if (openai) {
      try {
        const testResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5
        });
        services.openai = 'connected';
      } catch (openaiError) {
        services.openai = `error: ${openaiError.message}`;
      }
    } else {
      services.openai = 'not_configured';
    }

    const allServicesHealthy = Object.values(services).every(status => 
      status === 'loaded' || status === 'connected'
    );

    return {
      status: allServicesHealthy ? 'healthy' : 'partial',
      services,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      lastCheck: new Date().toISOString()
    };
  }
}

// Export main processing function and utilities
export {
  processMessage as default,
  AI_CONFIG,
  tokenTracker
};