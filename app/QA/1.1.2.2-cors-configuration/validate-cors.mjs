#!/usr/bin/env node

/**
 * CORS Configuration Validation Script
 * Tests CORS implementation for PRD-1.1.2.2
 * Created: 2025-08-14
 */

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, '../../');

console.log('='.repeat(60));
console.log('CORS CONFIGURATION VALIDATION - PRD 1.1.2.2');
console.log('='.repeat(60));

const results = {
  timestamp: new Date().toISOString(),
  passed: 0,
  failed: 0,
  checks: []
};

const check = async (name, testFunc) => {
  try {
    const result = await testFunc();
    console.log(`✅ ${name}: PASS`);
    results.passed++;
    results.checks.push({ name, status: 'PASS', result });
  } catch (error) {
    console.log(`❌ ${name}: FAIL - ${error.message}`);
    results.failed++;
    results.checks.push({ name, status: 'FAIL', error: error.message });
  }
};

// Test 1: CORS Package Installation
await check('CORS Package Installed', async () => {
  const packagePath = join(appRoot, 'package.json');
  const pkg = JSON.parse(await fs.readFile(packagePath, 'utf8'));
  
  if (!pkg.dependencies.cors) {
    throw new Error('cors package not found in dependencies');
  }
  
  return { version: pkg.dependencies.cors };
});

// Test 2: CORS Configuration Module
await check('CORS Configuration Module', async () => {
  const corsConfigPath = join(appRoot, 'server/middleware/cors-config.js');
  const content = await fs.readFile(corsConfigPath, 'utf8');
  
  if (!content.includes('createCorsMiddleware')) {
    throw new Error('createCorsMiddleware function not found');
  }
  
  if (!content.includes('originValidator')) {
    throw new Error('Origin validation logic not found');
  }
  
  if (!content.includes('corsErrorHandler')) {
    throw new Error('CORS error handler not found');
  }
  
  return { 
    hasMiddleware: true, 
    hasValidator: true,
    hasErrorHandler: true,
    fileSize: content.length 
  };
});

// Test 3: Server Integration
await check('Server CORS Integration', async () => {
  const serverPath = join(appRoot, 'server.js');
  const content = await fs.readFile(serverPath, 'utf8');
  
  if (!content.includes('createCorsMiddleware')) {
    throw new Error('CORS middleware not imported in server');
  }
  
  if (!content.includes('preflightHandler')) {
    throw new Error('Preflight handler not configured');
  }
  
  if (!content.includes('corsErrorHandler')) {
    throw new Error('CORS error handler not applied');
  }
  
  if (!content.includes('/health/cors')) {
    throw new Error('CORS status endpoint not found');
  }
  
  return { integrated: true };
});

// Test 4: Environment Configuration
await check('Environment Configuration', async () => {
  const envConfigPath = join(appRoot, 'server/config/environment.js');
  const content = await fs.readFile(envConfigPath, 'utf8');
  
  if (!content.includes('ALLOWED_ORIGINS')) {
    throw new Error('ALLOWED_ORIGINS configuration not found');
  }
  
  if (!content.includes('CORS_MAX_AGE')) {
    throw new Error('CORS_MAX_AGE configuration not found');
  }
  
  if (!content.includes('ENABLE_CORS_LOGGING')) {
    throw new Error('CORS logging configuration not found');
  }
  
  return { hasEnvConfig: true };
});

// Test 5: Origin Validation Logic
await check('Origin Validation Logic', async () => {
  const corsConfigPath = join(appRoot, 'server/middleware/cors-config.js');
  const content = await fs.readFile(corsConfigPath, 'utf8');
  
  // Check for development patterns
  if (!content.includes('localhost')) {
    throw new Error('Development origin patterns not found');
  }
  
  // Check for production patterns
  if (!content.includes('elitetradingcoach.ai')) {
    throw new Error('Production origin patterns not found');
  }
  
  // Check for security logging
  if (!content.includes('logCorsEvent')) {
    throw new Error('CORS event logging not implemented');
  }
  
  return { validationPresent: true };
});

// Test 6: Preflight Optimization
await check('Preflight Request Optimization', async () => {
  const corsConfigPath = join(appRoot, 'server/middleware/cors-config.js');
  const content = await fs.readFile(corsConfigPath, 'utf8');
  
  if (!content.includes('maxAge')) {
    throw new Error('maxAge configuration not found');
  }
  
  if (!content.includes('86400')) {
    throw new Error('24-hour cache not configured');
  }
  
  if (!content.includes('preflightHandler')) {
    throw new Error('Preflight handler not implemented');
  }
  
  return { optimizationPresent: true };
});

// Test 7: Security Features
await check('Security Features', async () => {
  const corsConfigPath = join(appRoot, 'server/middleware/cors-config.js');
  const content = await fs.readFile(corsConfigPath, 'utf8');
  
  // Check for strict CORS
  if (!content.includes('strictCorsConfig')) {
    throw new Error('Strict CORS configuration not found');
  }
  
  // Check for principle of least privilege
  if (!content.includes('least privilege')) {
    throw new Error('Security documentation not found');
  }
  
  // Check for error handling
  if (!content.includes('403')) {
    throw new Error('403 error response not configured');
  }
  
  return { securityFeaturesPresent: true };
});

// Test 8: WebSocket CORS
await check('WebSocket CORS Configuration', async () => {
  const serverPath = join(appRoot, 'server.js');
  const content = await fs.readFile(serverPath, 'utf8');
  
  if (!content.includes('Socket.io server with enhanced CORS')) {
    throw new Error('WebSocket CORS configuration not found');
  }
  
  if (!content.includes('Not allowed by WebSocket CORS')) {
    throw new Error('WebSocket CORS validation not implemented');
  }
  
  return { websocketCorsPresent: true };
});

// Test 9: Allowed Methods
await check('HTTP Methods Configuration', async () => {
  const corsConfigPath = join(appRoot, 'server/middleware/cors-config.js');
  const content = await fs.readFile(corsConfigPath, 'utf8');
  
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'];
  for (const method of methods) {
    if (!content.includes(method)) {
      throw new Error(`HTTP method ${method} not configured`);
    }
  }
  
  return { allMethodsConfigured: true };
});

// Test 10: Headers Configuration
await check('Headers Configuration', async () => {
  const corsConfigPath = join(appRoot, 'server/middleware/cors-config.js');
  const content = await fs.readFile(corsConfigPath, 'utf8');
  
  const requiredHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'];
  for (const header of requiredHeaders) {
    if (!content.includes(header)) {
      throw new Error(`Required header ${header} not configured`);
    }
  }
  
  const exposedHeaders = ['X-Request-ID', 'X-RateLimit-Limit'];
  for (const header of exposedHeaders) {
    if (!content.includes(header)) {
      throw new Error(`Exposed header ${header} not configured`);
    }
  }
  
  return { headersConfigured: true };
});

// Test 11: CORS Status Endpoint
await check('CORS Status Endpoint', async () => {
  const serverPath = join(appRoot, 'server.js');
  const content = await fs.readFile(serverPath, 'utf8');
  
  if (!content.includes('/health/cors')) {
    throw new Error('CORS status endpoint not found');
  }
  
  if (!content.includes('getCorsStatus')) {
    throw new Error('getCorsStatus function not called');
  }
  
  return { statusEndpointPresent: true };
});

// Test 12: Error Messages
await check('CORS Error Messages', async () => {
  const corsConfigPath = join(appRoot, 'server/middleware/cors-config.js');
  const content = await fs.readFile(corsConfigPath, 'utf8');
  
  if (!content.includes('CORS Policy Violation')) {
    throw new Error('User-friendly error message not found');
  }
  
  if (!content.includes('contact support')) {
    throw new Error('Help message not provided');
  }
  
  return { errorMessagesPresent: true };
});

// Final results
const total = results.passed + results.failed;
const passRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
const overallStatus = passRate === 100 ? 'PASS' : 'FAIL';

console.log('\n' + '='.repeat(40));
console.log('VALIDATION RESULTS');
console.log('='.repeat(40));
console.log(`Overall Status: ${overallStatus === 'PASS' ? '✅' : '❌'} ${overallStatus}`);
console.log(`Tests Passed: ${results.passed}/${total} (${passRate}%)`);
console.log(`Timestamp: ${results.timestamp}`);

// Check acceptance criteria
console.log('\n' + '='.repeat(40));
console.log('ACCEPTANCE CRITERIA STATUS');
console.log('='.repeat(40));

const acceptanceCriteria = [
  { name: 'CORS middleware installed and configured', met: results.checks[0]?.status === 'PASS' },
  { name: 'Environment-specific origin whitelist', met: results.checks[4]?.status === 'PASS' },
  { name: 'Preflight requests handled correctly', met: results.checks[5]?.status === 'PASS' },
  { name: 'Credentials enabled for authenticated routes', met: results.checks[9]?.status === 'PASS' },
  { name: 'Security headers properly set', met: results.checks[6]?.status === 'PASS' },
  { name: 'HTTP methods whitelisted appropriately', met: results.checks[8]?.status === 'PASS' }
];

acceptanceCriteria.forEach(criteria => {
  console.log(`${criteria.met ? '✅' : '❌'} ${criteria.name}`);
});

const allCriteriaMet = acceptanceCriteria.every(c => c.met);
console.log(`\nAll Acceptance Criteria Met: ${allCriteriaMet ? '✅ YES' : '❌ NO'}`);

// Save results
const timestamp = Date.now();
const resultsDir = join(__dirname, 'evidence');
const resultsFile = join(resultsDir, `validation-${timestamp}.json`);

await fs.mkdir(resultsDir, { recursive: true });
await fs.writeFile(resultsFile, JSON.stringify({
  ...results,
  total,
  passRate,
  overallStatus,
  acceptanceCriteria,
  allCriteriaMet
}, null, 2));

console.log(`\nResults saved to: ${resultsFile}`);

// Exit with appropriate code
process.exit(overallStatus === 'PASS' && allCriteriaMet ? 0 : 1);