#!/usr/bin/env node

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, '../../');

console.log('='.repeat(60));
console.log('EXPRESS SERVER VALIDATION - PRD 1.1.2.1');
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

// Test 1: Server file exists and has key components
await check('Server File Structure', async () => {
  const serverPath = join(appRoot, 'server.js');
  const content = await fs.readFile(serverPath, 'utf8');
  
  if (!content.includes('express')) throw new Error('Express not found');
  if (!content.includes('Socket')) throw new Error('Socket.io not found');
  if (!content.includes('import')) throw new Error('ES modules not used');
  
  return { fileSize: content.length, hasExpress: true, hasSocketIO: true };
});

// Test 2: Environment configuration
await check('Environment Configuration', async () => {
  const configPath = join(appRoot, 'server/config/environment.js');
  const content = await fs.readFile(configPath, 'utf8');
  
  if (!content.includes('serverConfig')) throw new Error('Server config not found');
  if (!content.includes('validateEnvironment')) throw new Error('Validation function not found');
  
  return { configPresent: true };
});

// Test 3: WebSocket handler
await check('WebSocket Handler', async () => {
  const chatPath = join(appRoot, 'server/websocket/chat-handler.js');
  const content = await fs.readFile(chatPath, 'utf8');
  
  if (!content.includes('initializeChatHandlers')) throw new Error('Chat handlers not found');
  if (!content.includes('send_message')) throw new Error('Message handling not found');
  
  return { handlerPresent: true };
});

// Test 4: Middleware files
await check('Authentication Middleware', async () => {
  const authPath = join(appRoot, 'middleware/auth.js');
  const socketAuthPath = join(appRoot, 'server/middleware/socket-auth.js');
  
  try {
    await fs.access(authPath);
  } catch {
    throw new Error('Auth middleware not found');
  }
  
  try {
    await fs.access(socketAuthPath);
  } catch {
    throw new Error('Socket auth middleware not found');
  }
  
  return { authPresent: true, socketAuthPresent: true };
});

// Test 5: Error handling
await check('Error Handling', async () => {
  const errorPath = join(appRoot, 'server/middleware/error-handler.js');
  const content = await fs.readFile(errorPath, 'utf8');
  
  if (!content.includes('errorHandler')) throw new Error('Error handler function not found');
  
  return { errorHandlerPresent: true };
});

// Test 6: Rate limiting
await check('Rate Limiting', async () => {
  const ratePath = join(appRoot, 'server/middleware/rate-limit.js');
  const content = await fs.readFile(ratePath, 'utf8');
  
  if (!content.includes('tierBasedRateLimit')) throw new Error('Tier-based rate limiting not found');
  
  return { rateLimitingPresent: true };
});

// Test 7: Database connection
await check('Database Connection', async () => {
  const dbPath = join(appRoot, 'db/connection.js');
  await fs.access(dbPath);
  
  return { dbFilePresent: true };
});

// Test 8: Package dependencies
await check('Required Dependencies', async () => {
  const packagePath = join(appRoot, 'package.json');
  const pkg = JSON.parse(await fs.readFile(packagePath, 'utf8'));
  
  const required = ['express', 'socket.io', 'helmet', 'cors', 'express-rate-limit'];
  const missing = required.filter(dep => !pkg.dependencies[dep]);
  
  if (missing.length > 0) {
    throw new Error(`Missing dependencies: ${missing.join(', ')}`);
  }
  
  return { allDepsPresent: true, totalDeps: Object.keys(pkg.dependencies).length };
});

// Test 9: Health endpoints in server
await check('Health Endpoints', async () => {
  const serverPath = join(appRoot, 'server.js');
  const content = await fs.readFile(serverPath, 'utf8');
  
  if (!content.includes('/health')) throw new Error('Health endpoint not found');
  if (!content.includes('/health/db')) throw new Error('DB health endpoint not found');
  if (!content.includes('/health/websocket')) throw new Error('WebSocket health endpoint not found');
  
  return { healthEndpointsPresent: true };
});

// Test 10: Graceful shutdown
await check('Graceful Shutdown', async () => {
  const serverPath = join(appRoot, 'server.js');
  const content = await fs.readFile(serverPath, 'utf8');
  
  if (!content.includes('gracefulShutdown')) throw new Error('Graceful shutdown not found');
  if (!content.includes('SIGTERM')) throw new Error('SIGTERM handling not found');
  
  return { gracefulShutdownPresent: true };
});

// Final results
const total = results.passed + results.failed;
const passRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
const overallStatus = passRate >= 90 ? 'PASS' : 'FAIL';

console.log('\\n' + '='.repeat(40));
console.log('VALIDATION RESULTS');
console.log('='.repeat(40));
console.log(`Overall Status: ${overallStatus}`);
console.log(`Tests Passed: ${results.passed}/${total} (${passRate}%)`);
console.log(`Timestamp: ${results.timestamp}`);

// Save results
const timestamp = Date.now();
const resultsFile = join(__dirname, 'evidence', `validation-${timestamp}.json`);

await fs.mkdir(join(__dirname, 'evidence'), { recursive: true });
await fs.writeFile(resultsFile, JSON.stringify({
  ...results,
  total,
  passRate,
  overallStatus
}, null, 2));

console.log(`\\nResults saved to: ${resultsFile}`);

// Exit with appropriate code
process.exit(overallStatus === 'PASS' ? 0 : 1);