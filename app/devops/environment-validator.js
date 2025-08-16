/**
 * Environment Configuration Validator
 * DevOps utility for validating all required environment variables
 * and deployment configurations for PRD 1.2.2
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Required environment variables for production deployment
 */
const REQUIRED_PRODUCTION_VARS = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CLOUDINARY_URL',
  'MAX_FILE_SIZE_MB',
  'ALLOWED_FILE_TYPES'
];

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_VARS = [
  'RATE_LIMIT_WINDOW',
  'RATE_LIMIT_MAX',
  'SECURITY_LEVEL',
  'LOG_LEVEL',
  'ENABLE_HEALTH_CHECKS',
  'ENABLE_METRICS',
  'SENTRY_DSN'
];

/**
 * Security-sensitive variables that should not be logged
 */
const SENSITIVE_VARS = [
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CLOUDINARY_URL',
  'DATABASE_URL'
];

/**
 * Validate individual environment variable
 */
function validateEnvVar(name, value, validations = {}) {
  const results = {
    name,
    value: SENSITIVE_VARS.includes(name) ? '***REDACTED***' : value,
    status: 'valid',
    issues: []
  };

  // Check if required
  if (!value && validations.required) {
    results.status = 'missing';
    results.issues.push('Required environment variable is missing');
    return results;
  }

  if (!value) {
    results.status = 'optional';
    return results;
  }

  // Validate specific patterns
  if (validations.pattern && !validations.pattern.test(value)) {
    results.status = 'invalid';
    results.issues.push(`Value does not match required pattern: ${validations.pattern}`);
  }

  // Validate numeric ranges
  if (validations.isNumeric) {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      results.status = 'invalid';
      results.issues.push('Value must be a number');
    } else {
      if (validations.min !== undefined && numValue < validations.min) {
        results.status = 'invalid';
        results.issues.push(`Value must be at least ${validations.min}`);
      }
      if (validations.max !== undefined && numValue > validations.max) {
        results.status = 'invalid';
        results.issues.push(`Value must be at most ${validations.max}`);
      }
    }
  }

  // Check for security issues
  if (name === 'JWT_SECRET' && value.length < 32) {
    results.status = 'insecure';
    results.issues.push('JWT secret should be at least 32 characters for security');
  }

  if (name === 'NODE_ENV' && !['development', 'staging', 'production'].includes(value)) {
    results.status = 'invalid';
    results.issues.push('NODE_ENV must be development, staging, or production');
  }

  return results;
}

/**
 * Validate Cloudinary configuration
 */
function validateCloudinaryConfig() {
  const results = {
    section: 'Cloudinary Configuration',
    status: 'valid',
    issues: [],
    details: {}
  };

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  const folder = process.env.CLOUDINARY_FOLDER;

  // Check required Cloudinary credentials
  if (!cloudName) {
    results.status = 'error';
    results.issues.push('CLOUDINARY_CLOUD_NAME not configured');
  } else {
    results.details.cloudName = cloudName;
    
    // Check for demo/placeholder values
    if (cloudName === 'demo' || cloudName.includes('your-cloud-name')) {
      results.status = 'warning';
      results.issues.push('Using demo/placeholder cloud name - not suitable for production');
    }
  }

  if (!apiKey) {
    results.status = 'error';
    results.issues.push('CLOUDINARY_API_KEY not configured');
  } else {
    results.details.apiKey = apiKey.substring(0, 6) + '...';
    
    // Validate API key format (should be numeric)
    if (!/^\d+$/.test(apiKey)) {
      results.status = 'error';
      results.issues.push('CLOUDINARY_API_KEY appears to be invalid format (should be numeric)');
    }
    
    // Check for placeholder values
    if (apiKey.includes('your-api-key') || apiKey === '123456789012345') {
      results.status = 'warning';
      results.issues.push('Using placeholder API key - not suitable for production');
    }
  }

  if (!apiSecret) {
    results.status = 'error';
    results.issues.push('CLOUDINARY_API_SECRET not configured');
  } else {
    results.details.apiSecret = '***CONFIGURED***';
    
    // Validate API secret format (should be alphanumeric)
    if (!/^[A-Za-z0-9_-]+$/.test(apiSecret)) {
      results.status = 'error';
      results.issues.push('CLOUDINARY_API_SECRET appears to be invalid format');
    }
    
    // Check secret length (should be substantial)
    if (apiSecret.length < 20) {
      results.status = 'error';
      results.issues.push('CLOUDINARY_API_SECRET appears too short to be valid');
    }
    
    // Check for placeholder values
    if (apiSecret.includes('your-api-secret') || apiSecret.includes('demo-secret') || apiSecret.includes('test-secret')) {
      results.status = 'warning';
      results.issues.push('Using placeholder API secret - not suitable for production');
    }
  }

  // Validate CLOUDINARY_URL format
  if (!cloudinaryUrl) {
    results.status = 'error';
    results.issues.push('CLOUDINARY_URL not configured');
  } else {
    results.details.cloudinaryUrl = '***CONFIGURED***';
    
    // Validate CLOUDINARY_URL format (should be cloudinary://api_key:api_secret@cloud_name)
    const urlPattern = /^cloudinary:\/\/\d+:[A-Za-z0-9_-]+@[A-Za-z0-9_-]+$/;
    if (!urlPattern.test(cloudinaryUrl)) {
      results.status = 'error';
      results.issues.push('CLOUDINARY_URL format is invalid (should be cloudinary://api_key:api_secret@cloud_name)');
    } else {
      // Extract components from URL and verify they match individual env vars
      const urlMatch = cloudinaryUrl.match(/^cloudinary:\/\/(\d+):([A-Za-z0-9_-]+)@([A-Za-z0-9_-]+)$/);
      if (urlMatch) {
        const [, urlApiKey, urlApiSecret, urlCloudName] = urlMatch;
        
        // Check consistency with individual env vars
        if (apiKey && urlApiKey !== apiKey) {
          results.status = 'warning';
          results.issues.push('CLOUDINARY_URL API key does not match CLOUDINARY_API_KEY');
        }
        if (apiSecret && urlApiSecret !== apiSecret) {
          results.status = 'warning';
          results.issues.push('CLOUDINARY_URL API secret does not match CLOUDINARY_API_SECRET');
        }
        if (cloudName && urlCloudName !== cloudName) {
          results.status = 'warning';
          results.issues.push('CLOUDINARY_URL cloud name does not match CLOUDINARY_CLOUD_NAME');
        }
      }
    }
    
    // Check for placeholder values in URL
    if (cloudinaryUrl.includes('your-api-key') || cloudinaryUrl.includes('your-api-secret') || cloudinaryUrl.includes('your-cloud-name')) {
      results.status = 'warning';
      results.issues.push('Using placeholder values in CLOUDINARY_URL - not suitable for production');
    }
  }

  // Check optional but recommended configurations
  if (uploadPreset) {
    results.details.uploadPreset = uploadPreset;
    
    // Check for environment-specific presets
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production' && uploadPreset.includes('development')) {
      results.status = 'warning';
      results.issues.push('Using development upload preset in production environment');
    }
  } else {
    results.status = 'warning';
    results.issues.push('CLOUDINARY_UPLOAD_PRESET not configured - may limit upload functionality');
  }

  if (folder) {
    results.details.folder = folder;
  } else {
    results.status = 'warning';
    results.issues.push('CLOUDINARY_FOLDER not configured - uploads will not be organized');
  }

  // Check for connectivity (basic validation)
  const hasAllCredentials = cloudName && apiKey && apiSecret;
  if (hasAllCredentials) {
    results.details.connectivity = 'credentials available';
  } else {
    results.details.connectivity = 'credentials incomplete';
  }

  return results;
}

/**
 * Validate file upload configuration
 */
function validateFileUploadConfig() {
  const results = {
    section: 'File Upload Configuration',
    status: 'valid',
    issues: [],
    details: {}
  };

  const maxFileSize = process.env.MAX_FILE_SIZE_MB;
  const allowedTypes = process.env.ALLOWED_FILE_TYPES;

  // Validate file size limit
  if (maxFileSize) {
    const sizeNum = parseInt(maxFileSize, 10);
    results.details.maxFileSize = `${sizeNum}MB`;
    
    if (sizeNum > 50) {
      results.status = 'warning';
      results.issues.push('File size limit is quite high - consider performance impact');
    }
    
    if (sizeNum > 100) {
      results.status = 'error';
      results.issues.push('File size limit exceeds recommended maximum (100MB)');
    }
  } else {
    results.status = 'error';
    results.issues.push('MAX_FILE_SIZE_MB not configured');
  }

  // Validate allowed file types
  if (allowedTypes) {
    const types = allowedTypes.split(',').map(t => t.trim().toLowerCase());
    results.details.allowedTypes = types;
    
    // Check for security risks
    const riskyTypes = ['exe', 'bat', 'cmd', 'sh', 'js', 'html', 'php', 'jsp'];
    const foundRiskyTypes = types.filter(type => riskyTypes.includes(type));
    
    if (foundRiskyTypes.length > 0) {
      results.status = 'error';
      results.issues.push(`Security risk: Executable file types allowed: ${foundRiskyTypes.join(', ')}`);
    }
    
    // Ensure image types are present for trade analysis
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const hasImageTypes = imageTypes.some(type => types.includes(type));
    
    if (!hasImageTypes) {
      results.status = 'error';
      results.issues.push('No image file types configured - required for trade analysis');
    }
  } else {
    results.status = 'error';
    results.issues.push('ALLOWED_FILE_TYPES not configured');
  }

  return results;
}

/**
 * Validate database configuration
 */
function validateDatabaseConfig() {
  const results = {
    section: 'Database Configuration',
    status: 'valid',
    issues: [],
    details: {}
  };

  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    results.status = 'error';
    results.issues.push('DATABASE_URL not configured');
    return results;
  }

  // Parse database URL
  try {
    const url = new URL(dbUrl);
    results.details.protocol = url.protocol;
    results.details.host = url.hostname;
    results.details.port = url.port || '5432';
    results.details.database = url.pathname.slice(1);
    
    // Validate SSL for production
    if (process.env.NODE_ENV === 'production' && !url.searchParams.has('sslmode')) {
      results.status = 'warning';
      results.issues.push('SSL mode not explicitly configured for production database');
    }
    
    // Check for Railway-specific configuration
    if (url.hostname.includes('railway.app')) {
      results.details.provider = 'Railway';
      results.details.ssl = 'required';
    }
    
  } catch (error) {
    results.status = 'error';
    results.issues.push(`Invalid DATABASE_URL format: ${error.message}`);
  }

  return results;
}

/**
 * Validate OpenAI configuration
 */
function validateOpenAIConfig() {
  const results = {
    section: 'OpenAI Configuration',
    status: 'valid',
    issues: [],
    details: {}
  };

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4-vision-preview';
  const timeout = process.env.OPENAI_TIMEOUT || '30000';
  const mockEnabled = process.env.OPENAI_MOCK_ENABLED === 'true';

  if (!apiKey && !mockEnabled) {
    results.status = 'error';
    results.issues.push('OPENAI_API_KEY not configured and mock mode disabled');
  } else if (mockEnabled) {
    results.details.mode = 'mock';
    results.status = 'warning';
    results.issues.push('OpenAI mock mode enabled - not suitable for production');
  } else {
    results.details.mode = 'live';
    
    // Validate API key format
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      results.status = 'error';
      results.issues.push('OPENAI_API_KEY appears to be invalid format');
    }
  }

  results.details.model = model;
  results.details.timeout = `${timeout}ms`;

  // Check if vision model is configured for image analysis
  if (!model.includes('vision') && !model.includes('4o')) {
    results.status = 'warning';
    results.issues.push('Model may not support image analysis - consider gpt-4-vision-preview or gpt-4o');
  }

  return results;
}

/**
 * Main environment validation function
 */
async function validateEnvironment() {
  console.log('🔍 DevOps Environment Validation Starting...\n');
  
  const validation = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    overall_status: 'valid',
    sections: [],
    summary: {
      total_vars: 0,
      required_missing: 0,
      invalid_configs: 0,
      security_issues: 0,
      warnings: 0
    }
  };

  // Validate required environment variables
  console.log('📋 Validating Required Environment Variables...');
  const envVarResults = [];
  
  for (const varName of REQUIRED_PRODUCTION_VARS) {
    const result = validateEnvVar(varName, process.env[varName], { required: true });
    envVarResults.push(result);
    validation.summary.total_vars++;
    
    if (result.status === 'missing') {
      validation.summary.required_missing++;
      validation.overall_status = 'error';
    } else if (result.status === 'invalid') {
      validation.summary.invalid_configs++;
      validation.overall_status = 'error';
    } else if (result.status === 'insecure') {
      validation.summary.security_issues++;
      validation.overall_status = 'warning';
    }
  }

  // Check recommended variables
  for (const varName of RECOMMENDED_VARS) {
    const result = validateEnvVar(varName, process.env[varName], { required: false });
    envVarResults.push(result);
    validation.summary.total_vars++;
    
    if (result.status === 'optional' && process.env.NODE_ENV === 'production') {
      validation.summary.warnings++;
    }
  }

  validation.sections.push({
    name: 'Environment Variables',
    status: validation.overall_status,
    variables: envVarResults
  });

  // Validate specific configurations
  console.log('🗄️  Validating Database Configuration...');
  const dbValidation = validateDatabaseConfig();
  validation.sections.push(dbValidation);
  
  if (dbValidation.status === 'error') {
    validation.overall_status = 'error';
  } else if (dbValidation.status === 'warning') {
    validation.summary.warnings++;
  }

  console.log('🤖 Validating OpenAI Configuration...');
  const openaiValidation = validateOpenAIConfig();
  validation.sections.push(openaiValidation);
  
  if (openaiValidation.status === 'error') {
    validation.overall_status = 'error';
  } else if (openaiValidation.status === 'warning') {
    validation.summary.warnings++;
  }

  console.log('☁️  Validating Cloudinary Configuration...');
  const cloudinaryValidation = validateCloudinaryConfig();
  validation.sections.push(cloudinaryValidation);
  
  if (cloudinaryValidation.status === 'error') {
    validation.overall_status = 'error';
  } else if (cloudinaryValidation.status === 'warning') {
    validation.summary.warnings++;
  }

  console.log('📁 Validating File Upload Configuration...');
  const uploadValidation = validateFileUploadConfig();
  validation.sections.push(uploadValidation);
  
  if (uploadValidation.status === 'error') {
    validation.overall_status = 'error';
  } else if (uploadValidation.status === 'warning') {
    validation.summary.warnings++;
  }

  return validation;
}

/**
 * Generate validation report
 */
function generateReport(validation) {
  console.log('\n📊 Environment Validation Report');
  console.log('===============================');
  console.log(`Environment: ${validation.environment}`);
  console.log(`Timestamp: ${validation.timestamp}`);
  console.log(`Overall Status: ${validation.overall_status.toUpperCase()}`);
  console.log(`\nSummary:`);
  console.log(`- Total Variables: ${validation.summary.total_vars}`);
  console.log(`- Missing Required: ${validation.summary.required_missing}`);
  console.log(`- Invalid Configs: ${validation.summary.invalid_configs}`);
  console.log(`- Security Issues: ${validation.summary.security_issues}`);
  console.log(`- Warnings: ${validation.summary.warnings}`);

  for (const section of validation.sections) {
    console.log(`\n📋 ${section.section || section.name}`);
    console.log(`Status: ${(section.status || 'unknown').toUpperCase()}`);
    
    if (section.issues && section.issues.length > 0) {
      console.log('Issues:');
      for (const issue of section.issues) {
        console.log(`  ❌ ${issue}`);
      }
    }
    
    if (section.details) {
      console.log('Details:');
      for (const [key, value] of Object.entries(section.details)) {
        console.log(`  📝 ${key}: ${value}`);
      }
    }
    
    if (section.variables) {
      const missingVars = section.variables.filter(v => v.status === 'missing');
      const invalidVars = section.variables.filter(v => v.status === 'invalid');
      
      if (missingVars.length > 0) {
        console.log('Missing Variables:');
        for (const variable of missingVars) {
          console.log(`  ❌ ${variable.name}`);
        }
      }
      
      if (invalidVars.length > 0) {
        console.log('Invalid Variables:');
        for (const variable of invalidVars) {
          console.log(`  ⚠️  ${variable.name}: ${variable.issues.join(', ')}`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  
  return validation.overall_status === 'valid' || validation.overall_status === 'warning';
}

/**
 * Export validation functionality
 */
export {
  validateEnvironment,
  generateReport,
  validateEnvVar,
  validateCloudinaryConfig,
  validateFileUploadConfig,
  validateDatabaseConfig,
  validateOpenAIConfig
};

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const validation = await validateEnvironment();
      const success = generateReport(validation);
      
      // Save validation report
      const reportPath = join(__dirname, `../devops/validation-report-${Date.now()}.json`);
      const fs = await import('fs/promises');
      await fs.writeFile(reportPath, JSON.stringify(validation, null, 2));
      console.log(`\n📄 Full report saved to: ${reportPath}`);
      
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('❌ Environment validation failed:', error);
      process.exit(1);
    }
  })();
}