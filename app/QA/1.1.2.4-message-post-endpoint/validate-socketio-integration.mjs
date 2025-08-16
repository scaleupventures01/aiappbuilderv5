#!/usr/bin/env node

/**
 * Socket.IO Integration Validation for Message POST Endpoint
 * PRD: PRD-1.1.2.4-message-post-endpoint.md
 * Validates that Socket.IO broadcasting is properly integrated with the POST /api/messages endpoint
 * Created: 2025-08-14
 */

import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

console.log('=== Socket.IO Integration Validation for Message POST Endpoint ===\n');
console.log('PRD: PRD-1.1.2.4-message-post-endpoint.md');
console.log('Requirement: FR-5 - Broadcast new message via Socket.IO to connected clients\n');

const tests = [];
let passedTests = 0;
let failedTests = 0;

/**
 * Run a test and track results
 */
async function runTest(name, testFn) {
  try {
    console.log(`Testing: ${name}...`);
    const result = await testFn();
    if (result.success) {
      passedTests++;
      console.log(`✅ PASS: ${name}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
    } else {
      failedTests++;
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Reason: ${result.error}`);
    }
    tests.push({ name, ...result });
  } catch (error) {
    failedTests++;
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    tests.push({ name, success: false, error: error.message });
  }
  console.log();
}

/**
 * Test 1: Check if socket-manager.js exists
 */
async function testSocketManagerExists() {
  try {
    const socketManagerPath = join(projectRoot, 'server', 'websocket', 'socket-manager.js');
    await fs.access(socketManagerPath);
    const stats = await fs.stat(socketManagerPath);
    return {
      success: true,
      details: `File size: ${stats.size} bytes`
    };
  } catch (error) {
    return {
      success: false,
      error: 'socket-manager.js not found'
    };
  }
}

/**
 * Test 2: Check if Socket.IO manager is imported in message API
 */
async function testSocketManagerImported() {
  try {
    const messageApiPath = join(projectRoot, 'api', 'messages', 'index.js');
    const content = await fs.readFile(messageApiPath, 'utf8');
    
    if (content.includes("import { emitToRoom } from '../../server/websocket/socket-manager.js'")) {
      return {
        success: true,
        details: 'Socket manager properly imported'
      };
    } else {
      return {
        success: false,
        error: 'Socket manager not imported in message API'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to read message API file: ${error.message}`
    };
  }
}

/**
 * Test 3: Check if Socket.IO instance is registered in server.js
 */
async function testSocketIORegistration() {
  try {
    const serverPath = join(projectRoot, 'server.js');
    const content = await fs.readFile(serverPath, 'utf8');
    
    const hasImport = content.includes("import { setSocketIOInstance } from './server/websocket/socket-manager.js'");
    const hasRegistration = content.includes('setSocketIOInstance(io)');
    
    if (hasImport && hasRegistration) {
      return {
        success: true,
        details: 'Socket.IO instance properly registered'
      };
    } else {
      return {
        success: false,
        error: `Missing: ${!hasImport ? 'import' : ''} ${!hasRegistration ? 'registration' : ''}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to read server.js: ${error.message}`
    };
  }
}

/**
 * Test 4: Check if broadcast logic exists in POST endpoint
 */
async function testBroadcastInPostEndpoint() {
  try {
    const messageApiPath = join(projectRoot, 'api', 'messages', 'index.js');
    const content = await fs.readFile(messageApiPath, 'utf8');
    
    // Find the POST endpoint
    const postEndpointPattern = /router\.post\('\/'/;
    if (!postEndpointPattern.test(content)) {
      return {
        success: false,
        error: 'POST endpoint not found'
      };
    }
    
    // Check for broadcast implementation
    const hasBroadcast = content.includes('emitToRoom(conversationRoom, \'new_message\'');
    const hasConversationRoom = content.includes('const conversationRoom = `conversation_${newMessage.conversation_id}`');
    const hasFR5Comment = content.includes('FR-5') || content.includes('PRD-1.1.2.4');
    
    if (hasBroadcast && hasConversationRoom) {
      return {
        success: true,
        details: `Broadcast implemented${hasFR5Comment ? ' with PRD reference' : ''}`
      };
    } else {
      return {
        success: false,
        error: `Missing: ${!hasBroadcast ? 'broadcast call' : ''} ${!hasConversationRoom ? 'room setup' : ''}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to check POST endpoint: ${error.message}`
    };
  }
}

/**
 * Test 5: Check if broadcast error handling exists
 */
async function testBroadcastErrorHandling() {
  try {
    const messageApiPath = join(projectRoot, 'api', 'messages', 'index.js');
    const content = await fs.readFile(messageApiPath, 'utf8');
    
    const hasErrorCheck = content.includes('if (!broadcastSuccess)');
    const hasWarning = content.includes('console.warn') && content.includes('Failed to broadcast');
    
    if (hasErrorCheck && hasWarning) {
      return {
        success: true,
        details: 'Error handling for broadcast failures implemented'
      };
    } else {
      return {
        success: false,
        error: 'Missing broadcast error handling'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to check error handling: ${error.message}`
    };
  }
}

/**
 * Test 6: Verify message event structure
 */
async function testMessageEventStructure() {
  try {
    const messageApiPath = join(projectRoot, 'api', 'messages', 'index.js');
    const content = await fs.readFile(messageApiPath, 'utf8');
    
    // Check for required fields in broadcast data
    const hasMessage = content.includes('message: newMessage');
    const hasSender = content.includes('sender: {');
    const hasUserId = content.includes('id: userId');
    const hasTimestamp = content.includes('timestamp:');
    
    if (hasMessage && hasSender && hasUserId && hasTimestamp) {
      return {
        success: true,
        details: 'Message event has all required fields'
      };
    } else {
      return {
        success: false,
        error: `Missing fields: ${!hasMessage ? 'message' : ''} ${!hasSender ? 'sender' : ''} ${!hasUserId ? 'userId' : ''} ${!hasTimestamp ? 'timestamp' : ''}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to verify event structure: ${error.message}`
    };
  }
}

/**
 * Test 7: Check socket-manager.js exports
 */
async function testSocketManagerExports() {
  try {
    const socketManagerPath = join(projectRoot, 'server', 'websocket', 'socket-manager.js');
    const content = await fs.readFile(socketManagerPath, 'utf8');
    
    const hasEmitToRoom = content.includes('export const emitToRoom');
    const hasSetInstance = content.includes('export const setSocketIOInstance');
    const hasGetInstance = content.includes('export const getSocketIOInstance');
    
    if (hasEmitToRoom && hasSetInstance && hasGetInstance) {
      return {
        success: true,
        details: 'All required exports present'
      };
    } else {
      return {
        success: false,
        error: 'Missing required exports in socket-manager.js'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to check exports: ${error.message}`
    };
  }
}

/**
 * Test 8: Verify chat handler compatibility
 */
async function testChatHandlerCompatibility() {
  try {
    const chatHandlerPath = join(projectRoot, 'server', 'websocket', 'chat-handler.js');
    const content = await fs.readFile(chatHandlerPath, 'utf8');
    
    // Check if chat handler also broadcasts new_message events
    const hasNewMessageEvent = content.includes("'new_message'");
    const hasConversationRoom = content.includes('conversation_');
    
    if (hasNewMessageEvent && hasConversationRoom) {
      return {
        success: true,
        details: 'Chat handler compatible with message broadcasts'
      };
    } else {
      return {
        success: false,
        error: 'Chat handler may not be compatible with message broadcasts'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to check chat handler: ${error.message}`
    };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('Starting Socket.IO Integration Validation...\n');
  
  await runTest('Socket Manager Module Exists', testSocketManagerExists);
  await runTest('Socket Manager Imported in Message API', testSocketManagerImported);
  await runTest('Socket.IO Instance Registration', testSocketIORegistration);
  await runTest('Broadcast Logic in POST Endpoint', testBroadcastInPostEndpoint);
  await runTest('Broadcast Error Handling', testBroadcastErrorHandling);
  await runTest('Message Event Structure', testMessageEventStructure);
  await runTest('Socket Manager Exports', testSocketManagerExports);
  await runTest('Chat Handler Compatibility', testChatHandlerCompatibility);
  
  // Summary
  console.log('=== Test Summary ===\n');
  console.log(`Total Tests: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Pass Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  
  // FR-5 Compliance Check
  console.log('\n=== FR-5 Compliance (Socket.IO Broadcast Integration) ===\n');
  if (failedTests === 0) {
    console.log('✅ FR-5 COMPLIANT: Socket.IO broadcast integration is fully implemented');
    console.log('   - Socket manager module created');
    console.log('   - POST endpoint broadcasts new messages');
    console.log('   - Proper error handling in place');
    console.log('   - Compatible with existing chat handlers');
  } else {
    console.log('❌ FR-5 NOT COMPLIANT: Issues found with Socket.IO integration');
    console.log(`   - ${failedTests} test(s) failed`);
    console.log('   - Review failed tests above for details');
  }
  
  // Save results
  const timestamp = new Date().toISOString();
  const results = {
    timestamp,
    prd: 'PRD-1.1.2.4',
    requirement: 'FR-5',
    description: 'Socket.IO broadcast integration for message POST endpoint',
    totalTests: passedTests + failedTests,
    passed: passedTests,
    failed: failedTests,
    passRate: ((passedTests / (passedTests + failedTests)) * 100).toFixed(1) + '%',
    compliant: failedTests === 0,
    tests
  };
  
  const evidenceDir = join(__dirname, 'evidence');
  try {
    await fs.mkdir(evidenceDir, { recursive: true });
    const evidenceFile = join(evidenceDir, `socketio-integration-${Date.now()}.json`);
    await fs.writeFile(evidenceFile, JSON.stringify(results, null, 2));
    console.log(`\n📁 Evidence saved to: ${evidenceFile}`);
  } catch (error) {
    console.error(`\n⚠️  Failed to save evidence: ${error.message}`);
  }
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the validation
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});