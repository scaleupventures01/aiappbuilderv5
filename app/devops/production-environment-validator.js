/**
 * Production Environment Validator
 * PRD Reference: PRD-1.2.10-openai-api-configuration.md
 * 
 * Comprehensive validation of production environment configuration
 * ensuring all requirements are met for secure production deployment.
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Production Environment Validation Configuration
 */
const validationConfig = {
  requiredEnvironmentVariables: {
    critical: [
      'NODE_ENV',
      'USE_MOCK_OPENAI',
      'OPENAI_API_KEY',
      'JWT_SECRET',
      'DATABASE_URL',
      'API_KEY'
    ],
    recommended: [
      'OPENAI_MODEL',
      'OPENAI_FALLBACK_MODEL',
      'OPENAI_MAX_TOKENS',
      'OPENAI_TIMEOUT',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'SENTRY_DSN'
    ]
  },
  
  productionValues: {
    'NODE_ENV': 'production',
    'USE_MOCK_OPENAI': 'false',
    'OPENAI_MOCK_ENABLED': 'false',
    'SECURITY_LEVEL': 'strict',
    'LOG_LEVEL': 'info',
    'ENABLE_REQUEST_LOGGING': 'false'
  },
  
  securityChecks: {
    minJWTSecretLength: 32,
    maxRateLimitPerWindow: 1000,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt'],
    dangerousFileTypes: ['exe', 'bat', 'sh', 'js', 'php', 'jsp', 'py', 'rb'],
    maxFileSizeMB: 20
  },
  
  requiredFiles: [
    'server.js',
    'package.json',
    'railway.json',
    'config/openai.js',
    'config/openai-production.js',
    'db/connection.js',
    '.env.production'
  ]
};

/**
 * Validation result structure
 */
class ValidationResult {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.environment = process.env.NODE_ENV || 'unknown';
    this.overall = 'unknown';
    this.readyForProduction = false;
    this.categories = {
      environment: { status: 'unknown', issues: [], warnings: [] },
      security: { status: 'unknown', issues: [], warnings: [] },
      files: { status: 'unknown', issues: [], warnings: [] },
      configuration: { status: 'unknown', issues: [], warnings: [] },
      api: { status: 'unknown', issues: [], warnings: [] }
    };
    this.summary = {
      totalChecks: 0,
      criticalIssues: 0,
      warnings: 0,
      score: 0
    };
  }
  
  addIssue(category, message, severity = 'error') {
    this.summary.totalChecks++;
    
    if (severity === 'error') {
      this.categories[category].issues.push(message);
      this.summary.criticalIssues++;
    } else {
      this.categories[category].warnings.push(message);
      this.summary.warnings++;
    }
  }
  
  setCategoryStatus(category, status) {
    this.categories[category].status = status;
  }
  
  finalize() {
    // Calculate overall status
    const hasIssues = this.summary.criticalIssues > 0;
    this.readyForProduction = !hasIssues;
    this.overall = hasIssues ? 'failed' : 'passed';
    
    // Calculate score
    const maxScore = this.summary.totalChecks;
    const actualScore = maxScore - this.summary.criticalIssues - (this.summary.warnings * 0.5);
    this.summary.score = Math.max(0, Math.round((actualScore / maxScore) * 100));
    
    // Set category statuses
    Object.keys(this.categories).forEach(category => {
      const cat = this.categories[category];
      if (cat.issues.length > 0) {
        cat.status = 'failed';
      } else if (cat.warnings.length > 0) {
        cat.status = 'warning';
      } else {
        cat.status = 'passed';
      }
    });
  }
}

/**
 * Environment Variable Validation
 */
function validateEnvironmentVariables(result) {
  console.log('🔍 Validating Environment Variables...');
  
  // Check critical variables
  validationConfig.requiredEnvironmentVariables.critical.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      result.addIssue('environment', `Critical environment variable missing: ${varName}`);
    } else if (value.includes('placeholder') || value.includes('your-') || value.includes('change-')) {
      result.addIssue('environment', `Environment variable contains placeholder value: ${varName}`);
    }
  });
  
  // Check recommended variables
  validationConfig.requiredEnvironmentVariables.recommended.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      result.addIssue('environment', `Recommended environment variable missing: ${varName}`, 'warning');
    }
  });
  
  // Validate specific production values
  Object.entries(validationConfig.productionValues).forEach(([varName, expectedValue]) => {
    const actualValue = process.env[varName];
    if (actualValue !== expectedValue) {
      result.addIssue('environment', 
        `${varName} should be "${expectedValue}" in production, got: "${actualValue}"`);
    }
  });
  
  console.log('✅ Environment variable validation completed');
}

/**
 * Security Configuration Validation
 */
function validateSecurityConfiguration(result) {
  console.log('🔒 Validating Security Configuration...');
  
  // JWT Secret validation
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    if (jwtSecret.length < validationConfig.securityChecks.minJWTSecretLength) {
      result.addIssue('security', 
        `JWT secret too short: ${jwtSecret.length} characters (minimum: ${validationConfig.securityChecks.minJWTSecretLength})`);
    }
    
    if (jwtSecret.includes('dev') || jwtSecret.includes('test') || jwtSecret === 'supersecret') {
      result.addIssue('security', 'JWT secret appears to be a development/test value');
    }
  }
  
  // OpenAI API Key validation
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    if (!openaiKey.startsWith('sk-')) {
      result.addIssue('security', 'OpenAI API key format invalid (should start with sk-)');
    }
    
    if (openaiKey.length < 20) {
      result.addIssue('security', 'OpenAI API key appears too short');
    }
    
    const testKeys = ['sk-test', 'sk-dev', 'sk-placeholder'];
    if (testKeys.some(testKey => openaiKey.includes(testKey))) {
      result.addIssue('security', 'OpenAI API key appears to be a test/placeholder value');
    }
  }
  
  // Rate limiting validation
  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '0');
  if (rateLimitMax > validationConfig.securityChecks.maxRateLimitPerWindow) {
    result.addIssue('security', 
      `Rate limit too high: ${rateLimitMax} (maximum recommended: ${validationConfig.securityChecks.maxRateLimitPerWindow})`);
  }
  
  // File upload security
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '').toLowerCase().split(',');
  const dangerousTypes = validationConfig.securityChecks.dangerousFileTypes;
  const foundDangerous = allowedTypes.filter(type => dangerousTypes.includes(type.trim()));
  
  if (foundDangerous.length > 0) {
    result.addIssue('security', `Dangerous file types allowed: ${foundDangerous.join(', ')}`);
  }
  
  // File size limits
  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE_MB || '0');
  if (maxFileSize > validationConfig.securityChecks.maxFileSizeMB) {
    result.addIssue('security', 
      `File size limit too high: ${maxFileSize}MB (maximum recommended: ${validationConfig.securityChecks.maxFileSizeMB}MB)`, 
      'warning');
  }
  
  console.log('✅ Security configuration validation completed');
}

/**
 * File Structure Validation
 */
function validateFileStructure(result) {
  console.log('📁 Validating File Structure...');
  
  const projectRoot = join(__dirname, '..');
  
  validationConfig.requiredFiles.forEach(filePath => {
    const fullPath = join(projectRoot, filePath);
    if (!existsSync(fullPath)) {
      result.addIssue('files', `Required file missing: ${filePath}`);
    }
  });
  
  // Check package.json structure
  const packagePath = join(projectRoot, 'package.json');
  if (existsSync(packagePath)) {
    try {
      const packageData = JSON.parse(readFileSync(packagePath, 'utf8'));
      
      if (!packageData.scripts || !packageData.scripts.start) {
        result.addIssue('files', 'package.json missing start script');
      }
      
      if (!packageData.engines || !packageData.engines.node) {
        result.addIssue('files', 'package.json missing Node.js engine specification', 'warning');
      }
      
      // Check for required dependencies
      const requiredDeps = ['express', 'openai', 'pg', 'jsonwebtoken'];
      const dependencies = packageData.dependencies || {};
      
      requiredDeps.forEach(dep => {
        if (!dependencies[dep]) {
          result.addIssue('files', `Required dependency missing: ${dep}`);
        }
      });
      
    } catch (error) {
      result.addIssue('files', `package.json parsing error: ${error.message}`);
    }
  }
  
  // Check Railway configuration
  const railwayPath = join(projectRoot, 'railway.json');
  if (existsSync(railwayPath)) {
    try {
      const railwayConfig = JSON.parse(readFileSync(railwayPath, 'utf8'));
      
      if (!railwayConfig.deploy) {
        result.addIssue('configuration', 'railway.json missing deploy configuration');
      }
      
      if (!railwayConfig.deploy?.healthcheckPath) {
        result.addIssue('configuration', 'railway.json missing health check path', 'warning');
      }
      
      // Check production environment configuration
      const prodEnv = railwayConfig.environments?.production;
      if (!prodEnv) {
        result.addIssue('configuration', 'railway.json missing production environment configuration');
      } else {
        // Check critical production variables
        const prodVars = prodEnv.variables || {};
        if (prodVars.USE_MOCK_OPENAI !== 'false') {
          result.addIssue('configuration', 'Railway production config allows mock mode');
        }
        
        if (prodVars.NODE_ENV !== 'production') {
          result.addIssue('configuration', 'Railway production config NODE_ENV not set to production');
        }
      }
      
    } catch (error) {
      result.addIssue('configuration', `railway.json parsing error: ${error.message}`);
    }
  }
  
  console.log('✅ File structure validation completed');
}

/**
 * API Configuration Validation
 */
function validateAPIConfiguration(result) {
  console.log('🔌 Validating API Configuration...');
  
  const projectRoot = join(__dirname, '..');
  
  // Check OpenAI configuration
  const openaiConfigPath = join(projectRoot, 'config/openai.js');
  const openaiProdConfigPath = join(projectRoot, 'config/openai-production.js');
  
  if (!existsSync(openaiConfigPath)) {
    result.addIssue('api', 'OpenAI configuration file missing');
  }
  
  if (!existsSync(openaiProdConfigPath)) {
    result.addIssue('api', 'OpenAI production configuration file missing');
  }
  
  // Check middleware files
  const middlewareFiles = [
    'server/middleware/error-handler.js',
    'server/middleware/cors-config.js',
    'middleware/uploadValidation.js'
  ];
  
  middlewareFiles.forEach(file => {
    const fullPath = join(projectRoot, file);
    if (!existsSync(fullPath)) {
      result.addIssue('api', `Middleware file missing: ${file}`, 'warning');
    }
  });
  
  // Check API endpoints
  const serverPath = join(projectRoot, 'server.js');
  if (existsSync(serverPath)) {
    try {
      const serverContent = readFileSync(serverPath, 'utf8');
      
      const requiredEndpoints = [
        '/api/health',
        '/api/health/openai',
        '/api/analyze-trade',
        '/api/upload'
      ];
      
      requiredEndpoints.forEach(endpoint => {
        if (!serverContent.includes(endpoint)) {
          result.addIssue('api', `API endpoint missing: ${endpoint}`, 'warning');
        }
      });
      
    } catch (error) {
      result.addIssue('api', `Error reading server.js: ${error.message}`);
    }
  }
  
  console.log('✅ API configuration validation completed');
}

/**
 * Run comprehensive production environment validation
 */
async function validateProductionEnvironment() {
  console.log('🚀 Production Environment Validation');
  console.log('PRD Reference: PRD-1.2.10-openai-api-configuration.md');
  console.log('=' + '='.repeat(60));
  
  const result = new ValidationResult();
  
  try {
    // Run all validation categories
    validateEnvironmentVariables(result);
    validateSecurityConfiguration(result);
    validateFileStructure(result);
    validateAPIConfiguration(result);
    
    // Finalize results
    result.finalize();
    
    // Display results
    console.log('\n' + '=' + '='.repeat(60));
    console.log('📊 Validation Results');
    console.log('=' + '='.repeat(60));
    
    // Category results
    Object.entries(result.categories).forEach(([category, data]) => {
      const statusIcon = data.status === 'passed' ? '✅' : 
                        data.status === 'warning' ? '⚠️' : '❌';
      console.log(`${statusIcon} ${category.toUpperCase()}: ${data.status}`);
      
      if (data.issues.length > 0) {
        data.issues.forEach(issue => console.log(`   ❌ ${issue}`));
      }
      
      if (data.warnings.length > 0) {
        data.warnings.forEach(warning => console.log(`   ⚠️ ${warning}`));
      }
    });
    
    // Overall summary
    console.log('\n' + '=' + '='.repeat(60));
    console.log('📋 Summary');
    console.log('=' + '='.repeat(60));
    console.log(`Environment: ${result.environment}`);
    console.log(`Total Checks: ${result.summary.totalChecks}`);
    console.log(`Critical Issues: ${result.summary.criticalIssues}`);
    console.log(`Warnings: ${result.summary.warnings}`);
    console.log(`Validation Score: ${result.summary.score}%`);
    
    if (result.readyForProduction) {
      console.log('\n✅ ENVIRONMENT READY FOR PRODUCTION');
      if (result.summary.warnings > 0) {
        console.log(`⚠️ ${result.summary.warnings} warnings detected - review recommended`);
      }
    } else {
      console.log('\n❌ ENVIRONMENT NOT READY FOR PRODUCTION');
      console.log(`Fix ${result.summary.criticalIssues} critical issues before deployment`);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Validation failed with error:', error);
    result.addIssue('configuration', `Validation error: ${error.message}`);
    result.finalize();
    return result;
  }
}

/**
 * Save validation results
 */
async function saveValidationResults(result) {
  try {
    const fs = await import('fs/promises');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsPath = join(__dirname, `production-environment-validation-${timestamp}.json`);
    
    await fs.writeFile(resultsPath, JSON.stringify(result, null, 2));
    console.log(`\n📄 Validation results saved to: ${resultsPath}`);
  } catch (error) {
    console.error('❌ Failed to save validation results:', error.message);
  }
}

// Export functions
export {
  validateProductionEnvironment,
  saveValidationResults,
  ValidationResult,
  validationConfig
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const result = await validateProductionEnvironment();
      await saveValidationResults(result);
      
      process.exit(result.readyForProduction ? 0 : 1);
    } catch (error) {
      console.error('❌ Production environment validation failed:', error);
      process.exit(1);
    }
  })();
}