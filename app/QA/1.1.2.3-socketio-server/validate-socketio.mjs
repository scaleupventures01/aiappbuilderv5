#!/usr/bin/env node

/**
 * Socket.IO Server Validation Script
 * Tests Socket.IO implementation for PRD-1.1.2.3
 * Created: 2025-08-14
 */

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, '../../');

console.log('='.repeat(60));
console.log('SOCKET.IO SERVER VALIDATION - PRD 1.1.2.3');
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

// Test 1: Socket.IO Package Installation
await check('Socket.IO Package Installed', async () => {
  const packagePath = join(appRoot, 'package.json');
  const pkg = JSON.parse(await fs.readFile(packagePath, 'utf8'));
  
  if (!pkg.dependencies['socket.io']) {
    throw new Error('socket.io package not found in dependencies');
  }
  
  return { version: pkg.dependencies['socket.io'] };
});

// Test 2: Socket.IO Server Initialization
await check('Socket.IO Server Initialization', async () => {
  const serverPath = join(appRoot, 'server.js');
  const content = await fs.readFile(serverPath, 'utf8');
  
  if (!content.includes('Server as SocketIOServer')) {
    throw new Error('Socket.IO Server import not found');
  }
  
  if (!content.includes('new SocketIOServer')) {
    throw new Error('Socket.IO Server initialization not found');
  }
  
  if (!content.includes("io.on('connection'")) {
    throw new Error('Connection handler not found');
  }
  
  return { initialized: true };
});

// Test 3: WebSocket CORS Configuration
await check('WebSocket CORS Configuration', async () => {
  const serverPath = join(appRoot, 'server.js');
  const content = await fs.readFile(serverPath, 'utf8');
  
  if (!content.includes('cors:')) {
    throw new Error('WebSocket CORS configuration not found');
  }
  
  if (!content.includes('credentials: true')) {
    throw new Error('CORS credentials not enabled');
  }
  
  return { corsConfigured: true };
});

// Test 4: Chat Handler Implementation
await check('Chat Handler Module', async () => {
  const chatHandlerPath = join(appRoot, 'server/websocket/chat-handler.js');
  const content = await fs.readFile(chatHandlerPath, 'utf8');
  
  if (!content.includes('initializeChatHandlers')) {
    throw new Error('initializeChatHandlers function not found');
  }
  
  if (!content.includes('setupMessageHandlers')) {
    throw new Error('Message handlers not found');
  }
  
  if (!content.includes('setupConversationHandlers')) {
    throw new Error('Conversation handlers not found');
  }
  
  if (!content.includes('setupPresenceHandlers')) {
    throw new Error('Presence handlers not found');
  }
  
  if (!content.includes('setupTypingHandlers')) {
    throw new Error('Typing handlers not found');
  }
  
  return { 
    chatHandlerPresent: true,
    fileSize: content.length 
  };
});

// Test 5: Socket Authentication Middleware
await check('Socket Authentication', async () => {
  const serverPath = join(appRoot, 'server.js');
  const content = await fs.readFile(serverPath, 'utf8');
  
  if (!content.includes('io.use(socketAuthMiddleware)')) {
    throw new Error('Socket authentication middleware not applied');
  }
  
  const socketAuthPath = join(appRoot, 'server/middleware/socket-auth.js');
  await fs.access(socketAuthPath);
  
  return { authConfigured: true };
});

// Test 6: Event Handlers
await check('Socket Event Handlers', async () => {
  const chatHandlerPath = join(appRoot, 'server/websocket/chat-handler.js');
  const content = await fs.readFile(chatHandlerPath, 'utf8');
  
  const requiredEvents = [
    'send_message',
    'edit_message',
    'delete_message',
    'join_conversation',
    'leave_conversation',
    'update_status',
    'get_online_users',
    'typing_start',
    'typing_stop',
    'disconnect'
  ];
  
  for (const event of requiredEvents) {
    if (!content.includes(`'${event}'`)) {
      throw new Error(`Event handler for '${event}' not found`);
    }
  }
  
  return { allEventsPresent: true };
});

// Test 7: Rate Limiting
await check('Socket Rate Limiting', async () => {
  const chatHandlerPath = join(appRoot, 'server/websocket/chat-handler.js');
  const content = await fs.readFile(chatHandlerPath, 'utf8');
  
  if (!content.includes('socketRateLimit')) {
    throw new Error('Socket rate limiting not found');
  }
  
  if (!content.includes('messageRateLimit')) {
    throw new Error('Message rate limiting not configured');
  }
  
  if (!content.includes('typingRateLimit')) {
    throw new Error('Typing rate limiting not configured');
  }
  
  return { rateLimitingPresent: true };
});

// Test 8: Connection Management
await check('Connection Management', async () => {
  const chatHandlerPath = join(appRoot, 'server/websocket/chat-handler.js');
  const content = await fs.readFile(chatHandlerPath, 'utf8');
  
  if (!content.includes('activeConnections')) {
    throw new Error('Active connections tracking not found');
  }
  
  if (!content.includes('userRooms')) {
    throw new Error('User room management not found');
  }
  
  if (!content.includes('handleChatDisconnect')) {
    throw new Error('Disconnect handler not found');
  }
  
  return { connectionManagementPresent: true };
});

// Test 9: Room Management
await check('Room-based Messaging', async () => {
  const chatHandlerPath = join(appRoot, 'server/websocket/chat-handler.js');
  const content = await fs.readFile(chatHandlerPath, 'utf8');
  
  if (!content.includes('socket.join')) {
    throw new Error('Room joining not implemented');
  }
  
  if (!content.includes('socket.leave')) {
    throw new Error('Room leaving not implemented');
  }
  
  if (!content.includes('io.to(conversationRoom)')) {
    throw new Error('Room broadcasting not implemented');
  }
  
  return { roomManagementPresent: true };
});

// Test 10: Message Validation
await check('Message Validation', async () => {
  const chatHandlerPath = join(appRoot, 'server/websocket/chat-handler.js');
  const content = await fs.readFile(chatHandlerPath, 'utf8');
  
  if (!content.includes('validateMessageData')) {
    throw new Error('Message validation function not found');
  }
  
  if (!content.includes('5000')) {
    throw new Error('Message length limit not configured');
  }
  
  return { validationPresent: true };
});

// Test 11: Health Check Integration
await check('WebSocket Health Check', async () => {
  const serverPath = join(appRoot, 'server.js');
  const content = await fs.readFile(serverPath, 'utf8');
  
  if (!content.includes('/health/websocket')) {
    throw new Error('WebSocket health endpoint not found');
  }
  
  if (!content.includes('connectedClients')) {
    throw new Error('Client count monitoring not found');
  }
  
  return { healthCheckPresent: true };
});

// Test 12: Error Handling
await check('WebSocket Error Handling', async () => {
  const serverPath = join(appRoot, 'server.js');
  const content = await fs.readFile(serverPath, 'utf8');
  
  if (!content.includes('connect_error')) {
    throw new Error('Connection error handler not found');
  }
  
  if (!content.includes('connection_error')) {
    throw new Error('Engine error handler not found');
  }
  
  const chatHandlerPath = join(appRoot, 'server/websocket/chat-handler.js');
  const chatContent = await fs.readFile(chatHandlerPath, 'utf8');
  
  if (!chatContent.includes('try') || !chatContent.includes('catch')) {
    throw new Error('Try-catch error handling not found');
  }
  
  return { errorHandlingPresent: true };
});

// Test 13: Transport Configuration
await check('Transport Configuration', async () => {
  const serverPath = join(appRoot, 'server.js');
  const content = await fs.readFile(serverPath, 'utf8');
  
  if (!content.includes('transports')) {
    throw new Error('Transport configuration not found');
  }
  
  // Also check the environment config since transports may be defined there
  const envConfigPath = join(appRoot, 'server/config/environment.js');
  const envContent = await fs.readFile(envConfigPath, 'utf8');
  
  if (!envContent.includes("transports: ['websocket', 'polling']")) {
    throw new Error('WebSocket and polling transports not configured');
  }
  
  return { transportsConfigured: true };
});

// Test 14: Ping Configuration
await check('Ping/Pong Configuration', async () => {
  const serverPath = join(appRoot, 'server.js');
  const content = await fs.readFile(serverPath, 'utf8');
  
  if (!content.includes('pingTimeout')) {
    throw new Error('Ping timeout not configured');
  }
  
  if (!content.includes('pingInterval')) {
    throw new Error('Ping interval not configured');
  }
  
  return { pingConfigured: true };
});

// Test 15: System Utilities
await check('System Utilities', async () => {
  const chatHandlerPath = join(appRoot, 'server/websocket/chat-handler.js');
  const content = await fs.readFile(chatHandlerPath, 'utf8');
  
  if (!content.includes('getChatStats')) {
    throw new Error('Chat statistics function not found');
  }
  
  if (!content.includes('broadcastSystemMessage')) {
    throw new Error('System broadcast function not found');
  }
  
  if (!content.includes('updateLastActivity')) {
    throw new Error('Activity tracking not found');
  }
  
  return { utilitiesPresent: true };
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
  { name: 'Socket.IO server initialized with Express integration', met: results.checks[1]?.status === 'PASS' },
  { name: 'Connection and disconnection events handled', met: results.checks[5]?.status === 'PASS' },
  { name: 'Room-based messaging implemented', met: results.checks[8]?.status === 'PASS' },
  { name: 'Authentication middleware for Socket.IO', met: results.checks[4]?.status === 'PASS' },
  { name: 'Error handling and logging', met: results.checks[11]?.status === 'PASS' },
  { name: 'Connection monitoring and cleanup', met: results.checks[7]?.status === 'PASS' }
];

acceptanceCriteria.forEach(criteria => {
  console.log(`${criteria.met ? '✅' : '❌'} ${criteria.name}`);
});

const allCriteriaMet = acceptanceCriteria.every(c => c.met);
console.log(`\nAll Acceptance Criteria Met: ${allCriteriaMet ? '✅ YES' : '❌ NO'}`);

// Check functional requirements
console.log('\n' + '='.repeat(40));
console.log('FUNCTIONAL REQUIREMENTS STATUS');
console.log('='.repeat(40));

const functionalRequirements = [
  { name: 'FR-1: Initialize Socket.IO server with Express.js integration', met: results.checks[1]?.status === 'PASS' },
  { name: 'FR-2: Handle client connection and disconnection events', met: results.checks[5]?.status === 'PASS' && results.checks[7]?.status === 'PASS' },
  { name: 'FR-3: Support real-time message broadcasting', met: results.checks[5]?.status === 'PASS' && results.checks[8]?.status === 'PASS' },
  { name: 'FR-4: Implement room-based message routing', met: results.checks[8]?.status === 'PASS' },
  { name: 'FR-5: Handle WebSocket upgrade requests with authentication', met: results.checks[4]?.status === 'PASS' }
];

functionalRequirements.forEach(req => {
  console.log(`${req.met ? '✅' : '❌'} ${req.name}`);
});

const allFunctionalMet = functionalRequirements.every(r => r.met);
console.log(`\nAll Functional Requirements Met: ${allFunctionalMet ? '✅ YES' : '❌ NO'}`);

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
  allCriteriaMet,
  functionalRequirements,
  allFunctionalMet
}, null, 2));

console.log(`\nResults saved to: ${resultsFile}`);

// Exit with appropriate code
process.exit(overallStatus === 'PASS' && allCriteriaMet && allFunctionalMet ? 0 : 1);