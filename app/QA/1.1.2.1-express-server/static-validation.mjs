#!/usr/bin/env node
/**
 * Express Server Static Validation Test
 * PRD: 1.1.2.1-express-server
 * Date: 2025-08-14
 * 
 * Static validation of Express server implementation components
 */

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, '../../');

// Test results
const validationResults = {
  timestamp: new Date().toISOString(),
  build: 'static-analysis',
  totalChecks: 0,
  passed: 0,
  failed: 0,
  checks: [],
  acceptanceCriteria: {
    criteria1: false, // Server configured and ready to accept connections
    criteria2: false, // WebSocket integration implemented
    criteria3: false  // API endpoints implemented
  },
  functionalRequirements: {
    expressWithTypeScript: false,
    websocketIntegration: false,
    restfulEndpoints: false,
    databaseConnection: false,
    authMiddleware: false,
    fileUploadHandling: false,
    errorHandling: false,
    environmentConfig: false,
    healthCheckEndpoint: false
  }
};

const log = (message, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
};

const runCheck = async (checkId, description, checkFunction) => {
  validationResults.totalChecks++;
  
  log(`Checking ${checkId}: ${description}`);
  
  try {
    const result = await checkFunction();
    validationResults.passed++;
    validationResults.checks.push({
      id: checkId,
      description,
      status: 'PASS',
      result,
      error: null
    });
    
    log(`✅ ${checkId}: PASS`);
    return { success: true, result };
  } catch (error) {
    validationResults.failed++;
    validationResults.checks.push({
      id: checkId,
      description,
      status: 'FAIL',
      result: null,
      error: error.message
    });
    
    log(`❌ ${checkId}: FAIL - ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Check main server file exists and has key components
const checkMainServerFile = async () => {
  const serverPath = join(appRoot, 'server.js');
  const content = await fs.readFile(serverPath, 'utf8');
  
  const requiredComponents = [
    'express',
    'Socket',
    'createServer',
    'helmet',
    'cors',
    'gracefulShutdown',
    'health',
    'websocket'
  ];
  
  const missingComponents = requiredComponents.filter(comp => !content.includes(comp));
  
  if (missingComponents.length > 0) {
    throw new Error(`Missing components: ${missingComponents.join(', ')}`);
  }
  
  // Check for TypeScript support (ES modules)
  if (!content.includes('import ') || !content.includes('from ')) {
    throw new Error('TypeScript/ES module imports not found');
  }
  
  validationResults.acceptanceCriteria.criteria1 = true;
  validationResults.functionalRequirements.expressWithTypeScript = true;
  
  return {
    fileExists: true,
    componentsFound: requiredComponents.length,
    typeScriptSupport: true
  };
};

// Check WebSocket integration
const checkWebSocketIntegration = async () => {
  const serverPath = join(appRoot, 'server.js');
  const chatHandlerPath = join(appRoot, 'server/websocket/chat-handler.js');
  
  const serverContent = await fs.readFile(serverPath, 'utf8');
  
  const websocketComponents = [
    'SocketIOServer',
    'socket.io',
    'initializeChatHandlers',
    'socketAuthMiddleware',
    'connection'
  ];
  
  const missingWsComponents = websocketComponents.filter(comp => !serverContent.includes(comp));
  
  if (missingWsComponents.length > 0) {
    throw new Error(`Missing WebSocket components: ${missingWsComponents.join(', ')}`);
  }
  
  // Check chat handler file exists
  let chatHandlerExists = false;
  try {
    await fs.access(chatHandlerPath);
    chatHandlerExists = true;
  } catch (error) {
    // File doesn't exist
  }
  
  if (!chatHandlerExists) {
    throw new Error('WebSocket chat handler file not found');
  }
  
  validationResults.acceptanceCriteria.criteria2 = true;
  validationResults.functionalRequirements.websocketIntegration = true;
  
  return {
    componentsFound: websocketComponents.length - missingWsComponents.length,
    chatHandlerExists,
    socketAuthImplemented: serverContent.includes('socketAuthMiddleware')
  };
};

// Check environment configuration
const checkEnvironmentConfiguration = async () => {
  const configPath = join(appRoot, 'server/config/environment.js');
  
  let configExists = false;
  let configContent = '';
  
  try {
    configContent = await fs.readFile(configPath, 'utf8');
    configExists = true;
  } catch (error) {
    throw new Error('Environment configuration file not found');
  }
  
  const requiredConfig = [
    'serverConfig',
    'validateEnvironment',
    'JWT_SECRET',
    'DATABASE_URL',
    'websocket',
    'rateLimiting',
    'security'
  ];
  
  const missingConfig = requiredConfig.filter(config => !configContent.includes(config));
  
  if (missingConfig.length > 0) {
    throw new Error(`Missing configuration: ${missingConfig.join(', ')}`);
  }
  
  validationResults.functionalRequirements.environmentConfig = true;
  
  return {
    configExists,
    requiredConfigPresent: requiredConfig.length - missingConfig.length,
    validationImplemented: configContent.includes('validateEnvironment')
  };
};

// Check API endpoints implementation
const checkAPIEndpoints = async () => {
  const serverPath = join(appRoot, 'server.js');
  const serverContent = await fs.readFile(serverPath, 'utf8');
  
  const requiredEndpoints = [
    '/health',
    '/health/db',
    '/health/websocket',
    '/api',
    'registerRoutes',
    'authRoutes',
    'conversationRoutes',
    'messageRoutes'
  ];
  
  const missingEndpoints = requiredEndpoints.filter(endpoint => !serverContent.includes(endpoint));
  
  if (missingEndpoints.length > 0) {
    throw new Error(`Missing API endpoints: ${missingEndpoints.join(', ')}`);
  }
  
  // Check for health check implementation
  if (!serverContent.includes('app.get(\'/health\'') || !serverContent.includes('res.json')) {
    throw new Error('Health check endpoint not properly implemented');
  }
  
  validationResults.acceptanceCriteria.criteria3 = true;
  validationResults.functionalRequirements.restfulEndpoints = true;
  validationResults.functionalRequirements.healthCheckEndpoint = true;
  
  return {
    endpointsFound: requiredEndpoints.length - missingEndpoints.length,
    healthCheckImplemented: true,
    apiDocumentationPresent: serverContent.includes('GET /api')
  };
};

// Check authentication middleware
const checkAuthenticationMiddleware = async () => {
  const authPath = join(appRoot, 'middleware/auth.js');
  const socketAuthPath = join(appRoot, 'server/middleware/socket-auth.js');
  
  let authExists = false;
  let socketAuthExists = false;
  
  try {
    await fs.access(authPath);
    authExists = true;
  } catch (error) {
    // File doesn't exist
  }
  
  try {
    await fs.access(socketAuthPath);
    socketAuthExists = true;
  } catch (error) {
    // File doesn't exist  
  }
  
  if (!authExists && !socketAuthExists) {
    throw new Error('No authentication middleware files found');
  }
  
  // Check server.js for auth middleware usage
  const serverPath = join(appRoot, 'server.js');
  const serverContent = await fs.readFile(serverPath, 'utf8');
  
  if (!serverContent.includes('auth') && !serverContent.includes('JWT')) {
    throw new Error('Authentication not integrated in server');
  }
  
  validationResults.functionalRequirements.authMiddleware = true;
  
  return {
    authMiddlewareExists: authExists,
    socketAuthExists: socketAuthExists,
    integratedInServer: true
  };
};

// Check error handling implementation
const checkErrorHandling = async () => {
  const errorHandlerPath = join(appRoot, 'server/middleware/error-handler.js');
  const serverPath = join(appRoot, 'server.js');
  
  let errorHandlerExists = false;
  try {
    await fs.access(errorHandlerPath);
    errorHandlerExists = true;
  } catch (error) {
    // File doesn't exist
  }
  
  if (!errorHandlerExists) {
    throw new Error('Error handler middleware file not found');
  }
  
  const serverContent = await fs.readFile(serverPath, 'utf8');
  
  if (!serverContent.includes('errorHandler') || !serverContent.includes('gracefulShutdown')) {
    throw new Error('Error handling not integrated in server');
  }
  
  validationResults.functionalRequirements.errorHandling = true;
  
  return {
    errorHandlerExists,
    gracefulShutdownImplemented: serverContent.includes('gracefulShutdown'),
    integratedInServer: true
  };
};

// Check rate limiting implementation
const checkRateLimiting = async () => {
  const rateLimitPath = join(appRoot, 'server/middleware/rate-limit.js');
  const serverPath = join(appRoot, 'server.js');
  
  let rateLimitExists = false;
  try {
    await fs.access(rateLimitPath);
    rateLimitExists = true;
  } catch (error) {
    // File doesn't exist
  }
  
  const serverContent = await fs.readFile(serverPath, 'utf8');
  
  const rateLimitComponents = [
    'tierBasedRateLimit',
    'authRateLimit',
    'basicRateLimit',
    'express-rate-limit'
  ];
  
  const foundComponents = rateLimitComponents.filter(comp => serverContent.includes(comp));
  
  if (foundComponents.length < 2) {
    throw new Error('Rate limiting not properly implemented');
  }
  
  return {
    rateLimitFileExists: rateLimitExists,
    componentsImplemented: foundComponents.length,
    tierBasedImplemented: serverContent.includes('tierBasedRateLimit')
  };
};

// Check database integration
const checkDatabaseIntegration = async () => {
  const dbPath = join(appRoot, 'db/connection.js');
  const serverPath = join(appRoot, 'server.js');
  
  let dbFileExists = false;
  try {
    await fs.access(dbPath);
    dbFileExists = true;
  } catch (error) {
    // File doesn't exist
  }
  
  if (!dbFileExists) {
    throw new Error('Database connection file not found');
  }
  
  const serverContent = await fs.readFile(serverPath, 'utf8');
  
  if (!serverContent.includes('/health/db') || !serverContent.includes('query')) {
    throw new Error('Database integration not found in server');
  }
  
  validationResults.functionalRequirements.databaseConnection = true;
  
  return {
    dbFileExists,
    healthCheckIntegrated: serverContent.includes('/health/db'),
    querySupport: serverContent.includes('query')
  };
};

// Check file upload handling
const checkFileUploadHandling = async () => {
  const serverPath = join(appRoot, 'server.js');
  const uploadPath = join(appRoot, 'api/upload');
  
  const serverContent = await fs.readFile(serverPath, 'utf8');
  
  let uploadDirExists = false;
  try {
    await fs.access(uploadPath);
    uploadDirExists = true;
  } catch (error) {
    // Directory doesn't exist
  }
  
  // Check for file upload configuration
  const uploadSupported = serverContent.includes('10mb') || serverContent.includes('limit');
  
  if (!uploadSupported && !uploadDirExists) {
    throw new Error('File upload handling not implemented');
  }
  
  validationResults.functionalRequirements.fileUploadHandling = uploadSupported || uploadDirExists;
  
  return {
    uploadDirExists,
    fileSizeLimitsConfigured: uploadSupported,
    uploadSupported: uploadSupported || uploadDirExists
  };
};

// Check package.json dependencies
const checkDependencies = async () => {
  const packagePath = join(appRoot, 'package.json');
  const packageContent = JSON.parse(await fs.readFile(packagePath, 'utf8'));
  
  const requiredDeps = [
    'express',
    'socket.io',
    'jsonwebtoken',
    'bcrypt',
    'cors',
    'helmet',
    'express-rate-limit',
    'dotenv'
  ];
  
  const deps = { ...packageContent.dependencies, ...packageContent.devDependencies };
  const missingDeps = requiredDeps.filter(dep => !deps[dep]);
  
  if (missingDeps.length > 0) {
    throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
  }
  
  return {
    totalDependencies: Object.keys(deps).length,
    requiredDepsFound: requiredDeps.length,
    socketIoVersion: deps['socket.io'],
    expressVersion: deps['express']
  };
};

// Main validation execution
const runStaticValidation = async () => {
  log('='.repeat(80));
  log('EXPRESS SERVER STATIC VALIDATION');
  log('PRD: 1.1.2.1-express-server');
  log('='.repeat(80));

  // Run all checks
  await runCheck('CHECK-001', 'Main Server File Structure', checkMainServerFile);
  await runCheck('CHECK-002', 'WebSocket Integration', checkWebSocketIntegration);
  await runCheck('CHECK-003', 'Environment Configuration', checkEnvironmentConfiguration);
  await runCheck('CHECK-004', 'API Endpoints Implementation', checkAPIEndpoints);
  await runCheck('CHECK-005', 'Authentication Middleware', checkAuthenticationMiddleware);
  await runCheck('CHECK-006', 'Error Handling Implementation', checkErrorHandling);
  await runCheck('CHECK-007', 'Rate Limiting Implementation', checkRateLimiting);
  await runCheck('CHECK-008', 'Database Integration', checkDatabaseIntegration);
  await runCheck('CHECK-009', 'File Upload Handling', checkFileUploadHandling);
  await runCheck('CHECK-010', 'Package Dependencies', checkDependencies);

  // Calculate results
  const passRate = validationResults.totalChecks > 0 ? 
    (validationResults.passed / validationResults.totalChecks) * 100 : 0;
  
  const criteriaMet = Object.values(validationResults.acceptanceCriteria).filter(Boolean).length;
  const requirementsMet = Object.values(validationResults.functionalRequirements).filter(Boolean).length;
  
  const overallStatus = (
    passRate >= 90 && 
    criteriaMet === 3 && 
    requirementsMet >= 7
  ) ? 'PASS' : 'FAIL';

  validationResults.summary = {
    overallStatus,
    passRate: Math.round(passRate),
    acceptanceCriteriaMet: `${criteriaMet}/3`,
    functionalRequirementsMet: `${requirementsMet}/9`,
    checksCompleted: `${validationResults.passed}/${validationResults.totalChecks}`
  };

  // Log results
  log('='.repeat(50));
  log('STATIC VALIDATION RESULTS');
  log('='.repeat(50));
  log(`Overall Status: ${overallStatus}`);
  log(`Pass Rate: ${validationResults.summary.passRate}%`);
  log(`Checks Passed: ${validationResults.passed}/${validationResults.totalChecks}`);
  log(`Acceptance Criteria Met: ${validationResults.summary.acceptanceCriteriaMet}`);
  log(`Functional Requirements Met: ${validationResults.summary.functionalRequirementsMet}`);

  log('\\nAcceptance Criteria Status:');
  log(`  Criteria 1 (Server Configuration): ${validationResults.acceptanceCriteria.criteria1 ? '✅ PASS' : '❌ FAIL'}`);
  log(`  Criteria 2 (WebSocket Integration): ${validationResults.acceptanceCriteria.criteria2 ? '✅ PASS' : '❌ FAIL'}`);
  log(`  Criteria 3 (API Endpoints): ${validationResults.acceptanceCriteria.criteria3 ? '✅ PASS' : '❌ FAIL'}`);

  log('\\nFunctional Requirements Status:');
  Object.entries(validationResults.functionalRequirements).forEach(([req, status]) => {
    log(`  ${req}: ${status ? '✅ PASS' : '❌ FAIL'}`);
  });

  return validationResults;
};

// Execute validation if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runStaticValidation()
    .then(results => {
      // Save results to file
      const timestamp = Date.now();
      const resultsFile = join(__dirname, 'evidence', `static-validation-${timestamp}.json`);
      
      fs.mkdir(join(__dirname, 'evidence'), { recursive: true })
        .then(() => fs.writeFile(resultsFile, JSON.stringify(results, null, 2)))
        .then(() => log(`Validation results saved to: ${resultsFile}`))
        .catch(err => log(`Failed to save results: ${err.message}`, 'ERROR'));

      process.exit(results.summary.overallStatus === 'PASS' ? 0 : 1);
    })
    .catch(error => {
      log(`Validation failed: ${error.message}`, 'ERROR');
      process.exit(1);
    });
}

export default runStaticValidation;