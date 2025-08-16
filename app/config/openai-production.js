/**
 * OpenAI Production Mode Configuration
 * PRD Reference: PRD-1.2.10-openai-api-configuration.md
 * 
 * This module handles production mode validation and configuration
 * ensuring mock mode is properly disabled in production environments.
 * 
 * Features:
 * - Production mode detection and validation
 * - API key format validation for production
 * - Mock mode enforcement controls
 * - Production health check functionality
 * - Performance metrics tracking
 * 
 * @module config/openai-production
 */

import { openaiClient, maskApiKey, getConfig } from './openai.js';
import { openaiClientWrapper } from '../services/openai-client.js';

/**
 * Production configuration validation error
 */
class ProductionConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProductionConfigError';
  }
}

/**
 * Production mode detection and validation
 */
class ProductionModeValidator {
  constructor() {
    this.config = null;
    this.validationResults = null;
  }

  /**
   * Determine if we're in production mode
   * @returns {boolean} True if production mode is active
   */
  isProductionMode() {
    const useMock = process.env.USE_MOCK_OPENAI;
    const apiKey = process.env.OPENAI_API_KEY;
    const nodeEnv = process.env.NODE_ENV;
    
    // Explicit mock mode setting takes precedence
    if (useMock === 'true') {
      console.log('🔧 Mock mode explicitly enabled via USE_MOCK_OPENAI=true');
      return false;
    }
    
    // Production environment requires explicit production mode
    if (nodeEnv === 'production' && useMock !== 'false') {
      throw new ProductionConfigError(
        'Production environment requires USE_MOCK_OPENAI=false. ' +
        'Mock mode is not allowed in production.'
      );
    }
    
    // Validate API key for production mode
    if (useMock === 'false' && !this.isValidProductionApiKey(apiKey)) {
      throw new ProductionConfigError(
        'Production mode requires a valid OpenAI API key. ' +
        `Current key: ${maskApiKey(apiKey)}`
      );
    }
    
    const isProduction = useMock === 'false' && this.isValidProductionApiKey(apiKey);
    
    if (isProduction) {
      console.log('🚀 Production mode active - using real OpenAI API');
      console.log(`🔑 API Key: ${maskApiKey(apiKey)}`);
    }
    
    return isProduction;
  }

  /**
   * Validate OpenAI API key for production use
   * @param {string} apiKey - API key to validate
   * @returns {boolean} True if valid for production
   */
  isValidProductionApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // Check for development/test placeholder keys
    const invalidKeys = [
      'your-openai-api-key-here',
      'sk-dev-api-key-here',
      'sk-test-key',
      'sk-placeholder'
    ];
    
    if (invalidKeys.includes(apiKey)) {
      return false;
    }
    
    // OpenAI API keys must start with 'sk-' and have sufficient length
    if (!apiKey.startsWith('sk-')) {
      return false;
    }
    
    // Modern OpenAI keys are typically 51 characters
    if (apiKey.length < 20) {
      return false;
    }
    
    return true;
  }

  /**
   * Validate complete production environment
   * @returns {Object} Validation results
   */
  validateProductionEnvironment() {
    const results = {
      valid: true,
      mode: 'unknown',
      issues: [],
      warnings: [],
      config: {}
    };

    try {
      // Check basic environment
      const nodeEnv = process.env.NODE_ENV;
      const useMock = process.env.USE_MOCK_OPENAI;
      const apiKey = process.env.OPENAI_API_KEY;

      results.config = {
        nodeEnv,
        useMockOpenAI: useMock,
        hasApiKey: !!apiKey,
        apiKeyMasked: maskApiKey(apiKey)
      };

      // Validate production mode configuration
      if (nodeEnv === 'production') {
        if (useMock !== 'false') {
          results.valid = false;
          results.issues.push(
            `Production environment requires USE_MOCK_OPENAI=false, got: ${useMock}`
          );
        }

        if (!this.isValidProductionApiKey(apiKey)) {
          results.valid = false;
          results.issues.push(
            'Production environment requires a valid OpenAI API key'
          );
        }
      }

      // Determine final mode
      if (this.isProductionMode()) {
        results.mode = 'production';
      } else if (useMock === 'true' || !this.isValidProductionApiKey(apiKey)) {
        results.mode = 'mock';
        if (nodeEnv === 'production') {
          results.warnings.push('Mock mode active in production environment');
        }
      } else {
        results.mode = 'development';
      }

      // Check for configuration conflicts
      if (process.env.OPENAI_MOCK_ENABLED === 'true' && useMock === 'false') {
        results.warnings.push(
          'Conflicting settings: OPENAI_MOCK_ENABLED=true but USE_MOCK_OPENAI=false'
        );
      }

      this.validationResults = results;
      return results;

    } catch (error) {
      results.valid = false;
      results.issues.push(error.message);
      results.mode = 'error';
      return results;
    }
  }

  /**
   * Get current validation results
   * @returns {Object|null} Last validation results
   */
  getValidationResults() {
    return this.validationResults;
  }
}

/**
 * Production API key validation with live testing
 * @param {string} apiKey - API key to validate
 * @returns {Promise<Object>} Validation results
 */
async function validateProductionApiKey(apiKey) {
  const startTime = Date.now();
  
  if (!apiKey || !apiKey.startsWith('sk-')) {
    return {
      valid: false,
      error: 'Invalid API key format - must start with sk-',
      status: 400,
      responseTime: Date.now() - startTime
    };
  }
  
  try {
    console.log('[Production Config] Testing API key connectivity...');
    
    // Create a test client for validation
    const OpenAI = (await import('openai')).default;
    const testClient = new OpenAI({ 
      apiKey,
      timeout: 10000 // 10 second timeout for validation
    });
    
    // Test with a minimal request
    const response = await testClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Test' }],
      max_tokens: 1
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      valid: true,
      model: response.model,
      usage: response.usage,
      responseTime,
      status: 200
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('[Production Config] API key validation failed:', error.message);
    
    return {
      valid: false,
      error: error.message,
      status: error.status || 500,
      responseTime
    };
  }
}

/**
 * Production mode activation and configuration
 * @returns {Promise<Object>} Activation results
 */
async function activateProductionMode() {
  console.log('🚀 Activating OpenAI Production Mode...');
  
  const validator = new ProductionModeValidator();
  const validation = validator.validateProductionEnvironment();
  
  if (!validation.valid) {
    throw new ProductionConfigError(
      `Production mode activation failed: ${validation.issues.join(', ')}`
    );
  }
  
  if (validation.mode !== 'production') {
    throw new ProductionConfigError(
      `Cannot activate production mode. Current mode: ${validation.mode}`
    );
  }
  
  // Validate API key connectivity
  const apiValidation = await validateProductionApiKey(process.env.OPENAI_API_KEY);
  if (!apiValidation.valid) {
    throw new ProductionConfigError(
      `API key validation failed: ${apiValidation.error}`
    );
  }
  
  const config = getConfig();
  
  console.log('✅ Production mode activated successfully');
  console.log(`✅ API Key: ${maskApiKey(process.env.OPENAI_API_KEY)}`);
  console.log(`✅ Model: ${config.model}`);
  console.log(`✅ Fallback Model: ${config.fallbackModel}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ API Response Time: ${apiValidation.responseTime}ms`);
  
  return {
    mode: 'production',
    apiKeyValid: true,
    mockMode: false,
    config: {
      model: config.model,
      fallbackModel: config.fallbackModel,
      apiKeyMasked: maskApiKey(process.env.OPENAI_API_KEY),
      responseTime: apiValidation.responseTime
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Production health check with comprehensive status
 * @returns {Promise<Object>} Health check results
 */
async function productionHealthCheck() {
  const startTime = Date.now();
  const validator = new ProductionModeValidator();
  
  try {
    // Validate environment configuration
    const envValidation = validator.validateProductionEnvironment();
    
    // Test API connectivity if in production mode
    let apiStatus = null;
    if (envValidation.mode === 'production') {
      apiStatus = await validateProductionApiKey(process.env.OPENAI_API_KEY);
    }
    
    // Get usage statistics from client wrapper
    const usageStats = openaiClientWrapper.getUsageStats();
    const rateLimitStatus = openaiClientWrapper.getRateLimitStatus();
    
    // Calculate cost estimation
    const config = getConfig();
    const estimatedCost = (usageStats.totalTokensUsed / 1000) * 0.01; // Rough estimate
    
    const healthData = {
      status: envValidation.valid && (apiStatus?.valid !== false) ? 'healthy' : 'unhealthy',
      mode: envValidation.mode,
      mockMode: envValidation.mode === 'mock',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        useMockOpenAI: process.env.USE_MOCK_OPENAI,
        hasApiKey: !!process.env.OPENAI_API_KEY
      },
      configuration: {
        model: config.model,
        fallbackModel: config.fallbackModel,
        maxTokens: config.maxTokens,
        timeout: config.timeout,
        rateLimitRPM: config.rateLimitRPM
      },
      validation: envValidation,
      apiConnectivity: apiStatus,
      usage: {
        totalRequests: usageStats.totalRequests,
        successfulRequests: usageStats.successfulRequests,
        failedRequests: usageStats.failedRequests,
        totalTokensUsed: usageStats.totalTokensUsed,
        estimatedCost: parseFloat(estimatedCost.toFixed(4)),
        averageResponseTime: Math.round(usageStats.averageResponseTime),
        lastRequestTime: usageStats.lastRequestTime
      },
      rateLimit: {
        remaining: rateLimitStatus.remaining,
        circuitBreakerState: rateLimitStatus.circuitBreakerState
      }
    };
    
    return healthData;
    
  } catch (error) {
    return {
      status: 'error',
      mode: 'unknown',
      mockMode: null,
      error: error.message,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Remove mock response logic from production paths
 * This function ensures mock responses are never used in production
 */
function enforceProdutionMode() {
  const validator = new ProductionModeValidator();
  
  if (process.env.NODE_ENV === 'production') {
    if (!validator.isProductionMode()) {
      throw new ProductionConfigError(
        'Mock mode is not allowed in production environment. ' +
        'Set USE_MOCK_OPENAI=false and provide a valid OpenAI API key.'
      );
    }
  }
}

// Global validator instance
const productionValidator = new ProductionModeValidator();

// Export functions and classes
export {
  ProductionModeValidator,
  ProductionConfigError,
  productionValidator,
  validateProductionApiKey,
  activateProductionMode,
  productionHealthCheck,
  enforceProdutionMode
};

export default {
  ProductionModeValidator,
  ProductionConfigError,
  validator: productionValidator,
  validateProductionApiKey,
  activateProductionMode,
  productionHealthCheck,
  enforceProdutionMode
};