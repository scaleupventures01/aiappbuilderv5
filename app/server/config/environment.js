/**
 * Environment Configuration - Elite Trading Coach AI
 * Centralized configuration management for server environment variables
 * Created: 2025-08-14
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
const envPath = path.resolve(process.cwd(), envFile);

// Load base .env file first
config();

// Then load environment-specific file if it exists (will override base settings)
config({ path: envPath });

/**
 * Server configuration object
 */
export const serverConfig = {
  // Core server settings
  port: process.env.PORT || 3001,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Frontend integration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Security settings
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Database configuration
  databaseUrl: process.env.DATABASE_URL,
  databaseSslMode: process.env.DATABASE_SSL_MODE || 'require',
  
  // Rate limiting configuration
  rateLimiting: {
    // General API rate limits
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    
    // Tier-based limits
    tiers: {
      free: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 50,
        burstLimit: 10
      },
      premium: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 200,
        burstLimit: 30
      },
      enterprise: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 1000,
        burstLimit: 100
      }
    },
    
    // Auth specific limits
    auth: {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 5,
      lockoutDuration: 15 * 60 * 1000
    },
    
    // Message/chat limits
    messaging: {
      windowMs: 60 * 1000, // 1 minute
      maxMessages: 10,
      burstLimit: 3
    }
  },
  
  // WebSocket configuration
  websocket: {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT) || 60000,
    pingInterval: parseInt(process.env.WS_PING_INTERVAL) || 25000,
    maxHttpBufferSize: parseInt(process.env.WS_MAX_BUFFER_SIZE) || 1e6,
    transports: ['websocket', 'polling']
  },
  
  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(','),
    maxFiles: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 5
  },
  
  // Cloudinary configuration (if used)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  
  // Security headers configuration
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ['\'self\''],
          scriptSrc: [
            '\'self\'', 
            '\'unsafe-inline\'',
            '\'unsafe-eval\'', // Required for development and dynamic imports
            ...(process.env.NODE_ENV === 'development' ? ['blob:', 'data:'] : [])
          ],
          styleSrc: ['\'self\'', '\'unsafe-inline\'', 'data:'],
          imgSrc: ['\'self\'', 'data:', 'https:', 'blob:', 'res.cloudinary.com', 'cloudinary.com'],
          connectSrc: process.env.NODE_ENV === 'development' 
            ? ['\'self\'', 'http://localhost:*', 'ws://localhost:*', 'https://api.cloudinary.com', 'https://res.cloudinary.com'] 
            : ['\'self\'', 'https://api.cloudinary.com', 'https://res.cloudinary.com'],
          fontSrc: ['\'self\'', 'data:'],
          objectSrc: ['\'none\''],
          mediaSrc: ['\'self\'', 'blob:', 'data:', 'https://res.cloudinary.com'],
          frameSrc: ['\'none\''],
          childSrc: ['blob:', 'data:'],
          workerSrc: ['\'self\'', 'blob:', 'data:'],
          formAction: ['\'self\''],
          // SECURITY: Allow inline event handlers for development testing only
          // This enables upload test page functionality while maintaining security
          ...(process.env.NODE_ENV === 'development' && {
            scriptSrcAttr: ['\'unsafe-inline\'']
          })
        },
      },
      crossOriginEmbedderPolicy: false
    },
    
    cors: {
      // Dynamic origin configuration loaded from cors-config.js
      // This is a placeholder - actual config comes from cors-config module
      enabled: true,
      loggingEnabled: process.env.ENABLE_CORS_LOGGING === 'true',
      maxAge: parseInt(process.env.CORS_MAX_AGE) || 86400,
      // Environment-specific origins
      allowedOrigins: process.env.ALLOWED_ORIGINS || '',
      strictOrigins: process.env.STRICT_ALLOWED_ORIGINS || ''
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
    enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
    logFile: process.env.LOG_FILE || 'app.log'
  }
};

/**
 * Validates required environment variables
 */
export const validateEnvironment = async () => {
  const required = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate JWT secrets are strong enough
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }
  
  // Validate OpenAI configuration and detect conflicts
  try {
    validateOpenAIConfiguration();
  } catch (error) {
    console.error('❌ OpenAI Configuration Error:', error.message);
    throw error;
  }
  
  // Validate Cloudinary environment for upload functionality
  try {
    const cloudinaryResult = await validateCloudinaryEnvironment();
    console.log('✅ Upload functionality enabled - Cloudinary configured');
    console.log(`   • Configuration Method: ${cloudinaryResult.configMethod}`);
    console.log(`   • Cloud Name: ${cloudinaryResult.cloudName}`);
  } catch (error) {
    console.warn('⚠️  Upload functionality disabled:', error.message);
  }
  
  console.log('✅ Environment validation passed');
  return true;
};

/**
 * Validates OpenAI configuration and detects conflicts
 */
export const validateOpenAIConfiguration = () => {
  console.log('\n🔍 OpenAI Configuration Validation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const envOverride = process.env.USE_MOCK_OPENAI;
  const useMockMode = envOverride === 'true' || process.env.USE_MOCK_OPENAI === 'true';
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  const apiKeyMasked = hasApiKey ? 
    process.env.OPENAI_API_KEY.substring(0, 8) + '...' + process.env.OPENAI_API_KEY.slice(-4) : 
    'Not configured';
  
  // Log current configuration
  console.log(`📋 Current Configuration:`);
  console.log(`   • OpenAI API Key: ${apiKeyMasked}`);
  console.log(`   • USE_MOCK_OPENAI: ${envOverride || 'undefined'}`);
  console.log(`   • OPENAI_MOCK_ENABLED: ${process.env.OPENAI_MOCK_ENABLED || 'undefined'}`);
  console.log(`   • Final Mode: ${useMockMode ? 'MOCK' : 'PRODUCTION'}`);
  console.log(`   • Model: ${process.env.OPENAI_MODEL || 'gpt-5'}`);
  console.log(`   • Fallback Model: ${process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o'}`);
  
  // Check for configuration conflicts
  const issues = [];
  
  // Check for conflicting mock settings
  if (process.env.OPENAI_MOCK_ENABLED === 'true' && process.env.USE_MOCK_OPENAI === 'false') {
    issues.push('Conflicting mock mode settings: OPENAI_MOCK_ENABLED=true but USE_MOCK_OPENAI=false');
  }
  
  // Check for missing API key in production mode
  if (!hasApiKey && !useMockMode) {
    issues.push('OpenAI API key not configured but mock mode is disabled');
  }
  
  // Check API key format if provided
  if (hasApiKey) {
    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
      issues.push('OpenAI API key format appears invalid (should start with "sk-")');
    }
    if (process.env.OPENAI_API_KEY.length < 40) {
      issues.push('OpenAI API key appears too short (may be truncated)');
    }
  }
  
  // Check for environment override vs file conflicts
  const envVarOverride = process.env.USE_MOCK_OPENAI;
  if (envVarOverride !== undefined) {
    console.log(`⚠️  Environment variable override detected: USE_MOCK_OPENAI=${envVarOverride}`);
    console.log(`   This will override any .env file settings.`);
  }
  
  // Log configuration status
  if (issues.length === 0) {
    console.log(`✅ Configuration Status: ${useMockMode ? 'MOCK MODE' : 'PRODUCTION MODE'}`);
    if (useMockMode) {
      console.log('   ℹ️  Using mock responses for development/testing');
    } else {
      console.log('   ℹ️  Using real OpenAI API for production analysis');
    }
  } else {
    console.log('❌ Configuration Issues Found:');
    issues.forEach(issue => console.log(`   • ${issue}`));
    throw new Error(`OpenAI configuration has ${issues.length} issue(s). Please fix before starting.`);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  return true;
};

/**
 * Validates Cloudinary environment variables for upload functionality
 */
export const validateCloudinaryEnvironment = async () => {
  console.log('\n🔍 Cloudinary Configuration Validation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Check for CLOUDINARY_URL first (preferred method)
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  
  // Check for individual environment variables (fallback method)
  const requiredCloudinary = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];
  
  let cloudName, apiKey, apiSecret;
  let configMethod = 'unknown';
  
  if (cloudinaryUrl) {
    console.log('📋 Using CLOUDINARY_URL configuration method');
    configMethod = 'CLOUDINARY_URL';
    
    // Parse CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
    try {
      const url = new URL(cloudinaryUrl);
      cloudName = url.hostname;
      apiKey = url.username;
      apiSecret = url.password;
      
      if (!cloudName || !apiKey || !apiSecret) {
        throw new Error('CLOUDINARY_URL format is invalid. Expected: cloudinary://api_key:api_secret@cloud_name');
      }
      
      console.log(`   • Cloud Name: ${cloudName}`);
      console.log(`   • API Key: ${apiKey.substring(0, 6)}...${apiKey.slice(-4)}`);
      console.log(`   • API Secret: ${apiSecret.substring(0, 6)}...${apiSecret.slice(-4)}`);
      
    } catch (error) {
      throw new Error(`Invalid CLOUDINARY_URL format: ${error.message}`);
    }
  } else {
    console.log('📋 Using individual environment variables configuration method');
    configMethod = 'individual_vars';
    
    const missingCloudinary = requiredCloudinary.filter(key => !process.env[key]);
    
    if (missingCloudinary.length > 0) {
      throw new Error(`Missing required Cloudinary environment variables: ${missingCloudinary.join(', ')}. Upload functionality will be disabled.`);
    }
    
    cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    apiKey = process.env.CLOUDINARY_API_KEY;
    apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    console.log(`   • Cloud Name: ${cloudName}`);
    console.log(`   • API Key: ${apiKey.substring(0, 6)}...${apiKey.slice(-4)}`);
    console.log(`   • API Secret: ${apiSecret.substring(0, 6)}...${apiSecret.slice(-4)}`);
  }
  
  // Validate Cloudinary cloud name format
  if (cloudName && !/^[a-zA-Z0-9_-]+$/.test(cloudName)) {
    throw new Error('CLOUDINARY_CLOUD_NAME contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed.');
  }
  
  // Validate API key format (should be numeric)
  if (apiKey && !/^\d+$/.test(apiKey)) {
    throw new Error('CLOUDINARY_API_KEY should contain only numeric characters.');
  }
  
  // Validate API secret length (should be at least 24 characters)
  if (apiSecret && apiSecret.length < 24) {
    throw new Error('CLOUDINARY_API_SECRET appears to be too short. Check your Cloudinary credentials.');
  }
  
  // Test actual connectivity to Cloudinary
  console.log('🔌 Testing Cloudinary connectivity...');
  try {
    const { v2: cloudinary } = await import('cloudinary');
    
    // Configure Cloudinary with the validated credentials
    if (cloudinaryUrl) {
      cloudinary.config({
        cloudinary_url: cloudinaryUrl
      });
    } else {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
      });
    }
    
    // Test connectivity with ping
    const pingResult = await cloudinary.api.ping();
    
    if (pingResult && pingResult.status === 'ok') {
      console.log('✅ Cloudinary connectivity test successful');
      console.log(`   • Response Status: ${pingResult.status}`);
      console.log(`   • Configuration Method: ${configMethod}`);
    } else {
      throw new Error('Cloudinary ping returned unexpected response');
    }
    
  } catch (error) {
    const maskedError = error.message.replace(
      new RegExp(apiSecret, 'g'), 
      apiSecret.substring(0, 6) + '...[MASKED]'
    ).replace(
      new RegExp(apiKey, 'g'), 
      apiKey.substring(0, 6) + '...[MASKED]'
    );
    
    throw new Error(`Cloudinary connectivity test failed: ${maskedError}`);
  }
  
  console.log('✅ Cloudinary environment validation passed');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return {
    success: true,
    cloudName,
    configMethod,
    apiKeyMasked: `${apiKey.substring(0, 6)}...${apiKey.slice(-4)}`,
    apiSecretMasked: `${apiSecret.substring(0, 6)}...${apiSecret.slice(-4)}`
  };
};

/**
 * Check if upload functionality should be enabled
 */
export const isUploadEnabled = async () => {
  try {
    await validateCloudinaryEnvironment();
    return true;
  } catch (error) {
    console.warn('⚠️  Upload functionality disabled:', error.message);
    return false;
  }
};

/**
 * Development mode check
 */
export const isDevelopment = () => serverConfig.nodeEnv === 'development';

/**
 * Production mode check
 */
export const isProduction = () => serverConfig.nodeEnv === 'production';

/**
 * Test mode check
 */
export const isTest = () => serverConfig.nodeEnv === 'test';

/**
 * Get current OpenAI configuration status
 */
export const getOpenAIConfig = () => {
  const useMockMode = process.env.USE_MOCK_OPENAI === 'true';
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  
  return {
    mode: useMockMode ? 'mock' : 'production',
    hasApiKey,
    apiKeyMasked: hasApiKey ? 
      process.env.OPENAI_API_KEY.substring(0, 8) + '...' + process.env.OPENAI_API_KEY.slice(-4) : 
      'Not configured',
    model: process.env.OPENAI_MODEL || 'gpt-5',
    fallbackModel: process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o',
    useMockOpenAI: process.env.USE_MOCK_OPENAI,
    openAIMockEnabled: process.env.OPENAI_MOCK_ENABLED
  };
};

export default serverConfig;