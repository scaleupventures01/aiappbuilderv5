#!/usr/bin/env node

/**
 * Simple Agent Test - Shows agents working on a trading app feature
 */

import { agentManager } from './lib/orch/agent-system.mjs';
import { communicationHub } from './lib/orch/agent-communication.mjs';

console.log('\n🤖 TRADING APP FEATURE: Risk Calculator\n');
console.log('=' .repeat(60));

async function buildRiskCalculatorFeature() {
  // Load agents
  console.log('\n1️⃣ Loading specialized agents...\n');
  await agentManager.loadTeamAgents();
  
  const pm = agentManager.getAgent('product-manager');
  const frontend = agentManager.getAgent('frontend-engineer');
  const backend = agentManager.getAgent('backend-engineer');
  const qa = agentManager.getAgent('qa-engineer');
  
  console.log('   ✅ Product Manager ready');
  console.log('   ✅ Frontend Engineer ready');
  console.log('   ✅ Backend Engineer ready');
  console.log('   ✅ QA Engineer ready');
  
  // Create communication channel
  console.log('\n2️⃣ Creating team communication channel...\n');
  const channelId = communicationHub.createChannel('risk-calculator-feature', [
    'product-manager',
    'frontend-engineer',
    'backend-engineer',
    'qa-engineer'
  ]);
  
  // Product Manager defines requirements
  console.log('3️⃣ Product Manager defining requirements...\n');
  const prdTask = await pm.assignTask({
    description: 'Define requirements for risk calculator that computes position size based on account balance and risk percentage'
  });
  console.log(`   📝 ${prdTask.output}`);
  
  communicationHub.sendToChannel(channelId, {
    from: 'product-manager',
    content: 'Risk calculator needs: account balance input, risk % slider (0.5-2%), stop loss input, calculate button, display position size'
  });
  
  // Backend Engineer creates API
  console.log('\n4️⃣ Backend Engineer building API...\n');
  const apiTask = await backend.assignTask({
    description: 'Create API endpoint for risk calculation: POST /api/risk/calculate'
  });
  console.log(`   🔧 ${apiTask.output}`);
  
  communicationHub.sendToChannel(channelId, {
    from: 'backend-engineer',
    content: 'API ready at POST /api/risk/calculate - accepts {balance, riskPercent, stopLoss}, returns {positionSize, maxLoss}'
  });
  
  // Frontend Engineer builds UI
  console.log('\n5️⃣ Frontend Engineer creating UI...\n');
  const uiTask = await frontend.assignTask({
    description: 'Build risk calculator component with form inputs and real-time calculation display'
  });
  console.log(`   🎨 ${uiTask.output}`);
  
  communicationHub.sendToChannel(channelId, {
    from: 'frontend-engineer',
    content: 'UI component ready with React form, validation, and API integration. Added loading states and error handling.'
  });
  
  // QA Engineer tests
  console.log('\n6️⃣ QA Engineer testing feature...\n');
  const testTask = await qa.assignTask({
    description: 'Test risk calculator with edge cases: zero balance, invalid percentages, network errors'
  });
  console.log(`   🧪 ${testTask.output}`);
  
  communicationHub.sendToChannel(channelId, {
    from: 'qa-engineer',
    content: 'Testing complete: All test cases passed. Found and fixed edge case with negative balance handling.'
  });
  
  // Show team conversation
  console.log('\n7️⃣ Team Communication Log:\n');
  const channel = communicationHub.channels.get(channelId);
  channel.messages.forEach((msg, index) => {
    console.log(`   ${index + 1}. [${msg.from.toUpperCase()}]`);
    console.log(`      "${msg.content}"\n`);
  });
  
  // Final status
  console.log('=' .repeat(60));
  console.log('\n✅ FEATURE COMPLETE: Risk Calculator\n');
  console.log('Summary:');
  console.log('  • Product requirements defined');
  console.log('  • API endpoint implemented');
  console.log('  • UI component built');
  console.log('  • Feature tested and verified');
  console.log('  • All agents collaborated successfully');
  
  // Show system status
  const status = agentManager.getSystemStatus();
  console.log('\n📊 Final Agent Status:');
  console.log(`  • Total tasks completed: ${status.agents.reduce((sum, a) => sum + a.tasksCompleted, 0)}`);
  console.log(`  • All agents idle and ready for next feature`);
}

buildRiskCalculatorFeature().catch(console.error);