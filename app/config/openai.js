/**
 * OpenAI API Configuration and Client Setup
 * 
 * This module handles:
 * - Environment variable validation and parsing
 * - API key format validation and security
 * - OpenAI client instantiation with proper configuration
 * - Configuration error handling and logging
 * 
 * Security Features:
 * - API key masking in logs and error messages
 * - Secure credential validation
 * - Environment-based configuration management
 * 
 * @module config/openai
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Configuration validation and error handling
 */
class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Mask API key for logging (show only first 8 and last 4 characters)
 * @param {string} apiKey - The API key to mask
 * @returns {string} Masked API key
 */
function maskApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return '[INVALID_KEY]';
  }
  if (apiKey.length < 12) {
    return '[MASKED_KEY]';
  }
  return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
}

/**
 * Validate API key format (should start with 'sk-' and have proper length)
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} True if valid format
 */
function validateApiKeyFormat(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // OpenAI API keys start with 'sk-' and are typically 51 characters long
  if (!apiKey.startsWith('sk-')) {
    return false;
  }
  
  // Check minimum length (OpenAI keys are usually 51 chars)
  if (apiKey.length < 20) {
    return false;
  }
  
  return true;
}

/**
 * Parse and validate environment variables
 * @returns {object} Parsed and validated configuration
 */
function parseEnvironmentConfig() {
  const config = {};
  
  try {
    // Required: OpenAI API Key
    config.apiKey = process.env.OPENAI_API_KEY;
    if (!config.apiKey) {
      throw new ConfigurationError('OPENAI_API_KEY environment variable is required');
    }
    
    if (!validateApiKeyFormat(config.apiKey)) {
      throw new ConfigurationError(`Invalid OPENAI_API_KEY format. Expected format: sk-... but got: ${maskApiKey(config.apiKey)}`);
    }
    
    // Optional: Model configuration
    config.model = process.env.OPENAI_MODEL || 'gpt-5';
    config.fallbackModel = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o';
    
    // Optional: GPT-5 specific configuration
    config.reasoningEffort = process.env.OPENAI_REASONING_EFFORT || 'medium';
    config.speedMode = process.env.OPENAI_SPEED_MODE || 'balanced';
    
    // Optional: Token limits
    const maxTokens = process.env.OPENAI_MAX_TOKENS;
    config.maxTokens = maxTokens ? parseInt(maxTokens, 10) : 1000;
    if (isNaN(config.maxTokens) || config.maxTokens < 1) {
      throw new ConfigurationError(`Invalid OPENAI_MAX_TOKENS value: ${maxTokens}. Must be a positive integer.`);
    }
    
    // Optional: Timeout configuration
    const timeout = process.env.OPENAI_TIMEOUT;
    config.timeout = timeout ? parseInt(timeout, 10) : 30000;
    if (isNaN(config.timeout) || config.timeout < 1000) {
      throw new ConfigurationError(`Invalid OPENAI_TIMEOUT value: ${timeout}. Must be at least 1000ms.`);
    }
    
    // Optional: Rate limiting
    const rateLimitRPM = process.env.OPENAI_RATE_LIMIT_RPM;
    config.rateLimitRPM = rateLimitRPM ? parseInt(rateLimitRPM, 10) : 60;
    if (isNaN(config.rateLimitRPM) || config.rateLimitRPM < 1) {
      throw new ConfigurationError(`Invalid OPENAI_RATE_LIMIT_RPM value: ${rateLimitRPM}. Must be a positive integer.`);
    }
    
    // Optional: Max retries
    const maxRetries = process.env.OPENAI_MAX_RETRIES;
    config.maxRetries = maxRetries ? parseInt(maxRetries, 10) : 3;
    if (isNaN(config.maxRetries) || config.maxRetries < 0) {
      throw new ConfigurationError(`Invalid OPENAI_MAX_RETRIES value: ${maxRetries}. Must be a non-negative integer.`);
    }
    
    // Optional: Organization ID
    config.organization = process.env.OPENAI_ORGANIZATION || null;
    
    return config;
  } catch (error) {
    console.error('[OpenAI Config] Configuration parsing failed:', error.message);
    throw error;
  }
}

/**
 * Validate model availability and configuration
 * @param {string} model - The model name to validate
 * @returns {boolean} True if model is supported
 */
function validateModelConfig(model) {
  const supportedModels = [
    'gpt-5',
    'o1-preview',
    'o1-mini',
    'gpt-4',
    'gpt-4-turbo',
    'gpt-4-vision-preview',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-3.5-turbo'
  ];
  
  if (!supportedModels.includes(model)) {
    console.warn(`[OpenAI Config] Warning: Model '${model}' not in supported list. Proceeding anyway.`);
  }
  
  return true;
}

/**
 * Create and configure OpenAI client instance
 * @param {object} config - Configuration object
 * @returns {OpenAI} Configured OpenAI client
 */
function createOpenAIClient(config) {
  try {
    console.log(`[OpenAI Config] Initializing OpenAI client with model: ${config.model}`);
    console.log(`[OpenAI Config] API key: ${maskApiKey(config.apiKey)}`);
    console.log(`[OpenAI Config] Timeout: ${config.timeout}ms, Max retries: ${config.maxRetries}`);
    
    const clientConfig = {
      apiKey: config.apiKey,
      timeout: config.timeout,
      maxRetries: config.maxRetries,
      defaultHeaders: {
        'User-Agent': 'Elite-Trading-Coach-AI/1.0'
      }
    };
    
    // Add organization if provided
    if (config.organization) {
      clientConfig.organization = config.organization;
      console.log(`[OpenAI Config] Organization: ${config.organization}`);
    }
    
    const client = new OpenAI(clientConfig);
    
    console.log('[OpenAI Config] OpenAI client initialized successfully');
    return client;
  } catch (error) {
    console.error('[OpenAI Config] Failed to create OpenAI client:', error.message);
    throw new ConfigurationError(`Failed to initialize OpenAI client: ${error.message}`);
  }
}

// Parse configuration
let openaiConfig;
let openaiClient;

try {
  console.log('[OpenAI Config] Loading OpenAI configuration...');
  openaiConfig = parseEnvironmentConfig();
  
  // Validate model configuration
  validateModelConfig(openaiConfig.model);
  
  // Create OpenAI client
  openaiClient = createOpenAIClient(openaiConfig);
  
  console.log('[OpenAI Config] OpenAI configuration loaded successfully');
  console.log(`[OpenAI Config] Model: ${openaiConfig.model}`);
  console.log(`[OpenAI Config] Max tokens: ${openaiConfig.maxTokens}`);
  console.log(`[OpenAI Config] Rate limit: ${openaiConfig.rateLimitRPM} requests/minute`);
  
} catch (error) {
  console.error('[OpenAI Config] Critical configuration error:', error.message);
  throw error;
}

/**
 * Speed modes configuration with reasoning effort mapping
 * PRD 1.2.6 Speed Selection Features
 */
const SPEED_MODES = {
  super_fast: {
    name: 'super_fast',
    displayName: 'Super Fast',
    reasoningEffort: 'low',
    description: 'Minimal reasoning for instant results',
    targetResponseTime: '1-3 seconds'
  },
  fast: {
    name: 'fast',
    displayName: 'Fast',
    reasoningEffort: 'low',
    description: 'Quick analysis with basic reasoning',
    targetResponseTime: '3-8 seconds'
  },
  balanced: {
    name: 'balanced',
    displayName: 'Balanced',
    reasoningEffort: 'medium',
    description: 'Moderate reasoning for balanced speed and accuracy',
    targetResponseTime: '8-15 seconds'
  },
  high_accuracy: {
    name: 'high_accuracy',
    displayName: 'High Accuracy',
    reasoningEffort: 'high',
    description: 'Deep reasoning for maximum accuracy',
    targetResponseTime: '15-30 seconds'
  },
  // Legacy support for existing speed modes
  thorough: {
    name: 'thorough',
    displayName: 'Thorough (Legacy)',
    reasoningEffort: 'high',
    description: 'Legacy thorough mode - use high_accuracy instead',
    targetResponseTime: '15-30 seconds'
  },
  maximum: {
    name: 'maximum',
    displayName: 'Maximum (Legacy)',
    reasoningEffort: 'high',
    description: 'Legacy maximum mode - use high_accuracy instead',
    targetResponseTime: '15-30 seconds'
  }
};

/**
 * Map speed mode to reasoning effort parameter
 * @param {string} speedMode - Speed mode setting
 * @returns {string} Reasoning effort value
 */
function mapSpeedModeToReasoningEffort(speedMode) {
  const speedConfig = SPEED_MODES[speedMode];
  if (speedConfig) {
    return speedConfig.reasoningEffort;
  }
  
  // Fallback for unknown speed modes
  console.warn(`[OpenAI Config] Unknown speed mode: ${speedMode}, defaulting to 'medium' reasoning effort`);
  return 'medium';
}

/**
 * Get speed mode configuration
 * @param {string} speedMode - Speed mode setting
 * @returns {object} Speed mode configuration object
 */
function getSpeedModeConfig(speedMode) {
  return SPEED_MODES[speedMode] || SPEED_MODES.balanced;
}

/**
 * Get all available speed modes
 * @returns {object} All speed mode configurations
 */
function getAllSpeedModes() {
  return SPEED_MODES;
}

/**
 * Validate speed mode
 * @param {string} speedMode - Speed mode to validate
 * @returns {boolean} True if speed mode is valid
 */
function validateSpeedMode(speedMode) {
  return Object.keys(SPEED_MODES).includes(speedMode);
}

/**
 * Validate reasoning effort parameter
 * @param {string} reasoningEffort - Reasoning effort value
 * @returns {boolean} True if valid
 */
function validateReasoningEffort(reasoningEffort) {
  const validEfforts = ['low', 'medium', 'high'];
  return validEfforts.includes(reasoningEffort);
}

/**
 * Get configuration object (without sensitive data)
 * @returns {object} Configuration object with masked sensitive data
 */
function getConfig() {
  return {
    model: openaiConfig.model,
    fallbackModel: openaiConfig.fallbackModel,
    maxTokens: openaiConfig.maxTokens,
    timeout: openaiConfig.timeout,
    rateLimitRPM: openaiConfig.rateLimitRPM,
    maxRetries: openaiConfig.maxRetries,
    organization: openaiConfig.organization,
    reasoningEffort: openaiConfig.reasoningEffort,
    speedMode: openaiConfig.speedMode,
    apiKey: maskApiKey(openaiConfig.apiKey)
  };
}

/**
 * Test basic API connectivity (for health checks)
 * @returns {Promise<boolean>} True if API is accessible
 */
async function testApiConnectivity() {
  try {
    console.log('[OpenAI Config] Testing API connectivity...');
    
    // Use a minimal request to test connectivity
    const response = await openaiClient.models.list();
    
    if (response && response.data) {
      console.log('[OpenAI Config] API connectivity test passed');
      return true;
    } else {
      console.warn('[OpenAI Config] API connectivity test failed: Invalid response');
      return false;
    }
  } catch (error) {
    console.error('[OpenAI Config] API connectivity test failed:', error.message);
    return false;
  }
}

// Export configuration and client
export {
  openaiConfig,
  openaiClient,
  getConfig,
  maskApiKey,
  validateApiKeyFormat,
  testApiConnectivity,
  mapSpeedModeToReasoningEffort,
  validateReasoningEffort,
  getSpeedModeConfig,
  getAllSpeedModes,
  validateSpeedMode,
  SPEED_MODES,
  ConfigurationError
};

export default {
  config: openaiConfig,
  client: openaiClient,
  getConfig,
  maskApiKey,
  validateApiKeyFormat,
  testApiConnectivity,
  mapSpeedModeToReasoningEffort,
  validateReasoningEffort,
  getSpeedModeConfig,
  getAllSpeedModes,
  validateSpeedMode,
  SPEED_MODES,
  ConfigurationError
};