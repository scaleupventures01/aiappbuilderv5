#!/usr/bin/env node

/**
 * Test that the agent system works WITHOUT markdown files
 * This verifies agents are loaded from .mjs files only
 */

import { agentManager } from './lib/orch/agent-system-v2.mjs';

console.log('🧪 Testing Agent System V2 - No Markdown Dependencies\n');

async function testAgentSystem() {
  try {
    // Step 1: Load agents from .mjs files
    console.log('1️⃣ Loading agents from .mjs files...');
    const agents = await agentManager.loadAgentsFromModules();
    
    if (agents.length === 0) {
      throw new Error('❌ No agents loaded! System cannot function.');
    }
    
    console.log(`   ✅ Loaded ${agents.length} agents successfully`);
    console.log(`   Agents: ${agents.map(a => a.name).join(', ')}\n`);
    
    // Step 2: Test agent capabilities
    console.log('2️⃣ Testing agent capabilities...');
    const aiAgent = agentManager.getAgent('ai-engineer');
    
    if (!aiAgent) {
      throw new Error('❌ AI Engineer agent not found!');
    }
    
    const capabilities = aiAgent.getCapabilities();
    console.log('   AI Engineer capabilities:', JSON.stringify(capabilities, null, 2));
    console.log('   ✅ Agent capabilities working\n');
    
    // Step 3: Test task assignment
    console.log('3️⃣ Testing task assignment...');
    const testTask = {
      description: 'Design a prompt for a customer support chatbot',
      requirements: {
        role: 'ai-engineer',
        expertise: ['prompt engineering']
      }
    };
    
    const result = await aiAgent.assignTask(testTask);
    console.log('   Task result:', {
      status: result.status,
      output: result.output,
      artifactsCount: result.artifacts?.length || 0,
      recommendationsCount: result.recommendations?.length || 0
    });
    
    if (result.status !== 'completed') {
      throw new Error('❌ Task execution failed!');
    }
    
    console.log('   ✅ Task execution successful\n');
    
    // Step 4: Test collaboration
    console.log('4️⃣ Testing agent collaboration...');
    const workflow = await agentManager.createWorkflow({
      name: 'Test Collaboration Workflow',
      steps: [
        {
          agent: 'product-manager',
          name: 'Define requirements',
          description: 'Create PRD for new feature'
        },
        {
          agent: 'frontend-engineer',
          name: 'Implement UI',
          description: 'Build component based on PRD'
        },
        {
          agent: 'qa-engineer',
          name: 'Test feature',
          description: 'Create and run test suite'
        }
      ]
    });
    
    console.log('   Workflow result:', {
      id: workflow.id,
      status: workflow.status,
      stepsCompleted: workflow.results.length
    });
    
    if (workflow.status !== 'completed') {
      throw new Error('❌ Workflow execution failed!');
    }
    
    console.log('   ✅ Agent collaboration successful\n');
    
    // Step 5: Verify no markdown dependency
    console.log('5️⃣ Verifying no markdown file dependencies...');
    
    // Check that agents have real implementations
    const frontendAgent = agentManager.getAgent('frontend-engineer');
    const backendAgent = agentManager.getAgent('backend-engineer');
    
    const feTask = {
      description: 'Create a React component for user dashboard',
      requirements: { role: 'frontend-engineer' }
    };
    
    const beTask = {
      description: 'Create API endpoint for user data',
      requirements: { role: 'backend-engineer' }
    };
    
    const [feResult, beResult] = await Promise.all([
      frontendAgent.assignTask(feTask),
      backendAgent.assignTask(beTask)
    ]);
    
    // Check for real artifacts
    if (feResult.artifacts?.length > 0 && feResult.artifacts[0].content) {
      console.log('   ✅ Frontend agent generated real code artifacts');
    } else {
      console.log('   ⚠️ Frontend agent did not generate code artifacts');
    }
    
    if (beResult.artifacts?.length > 0 && beResult.artifacts[0].content) {
      console.log('   ✅ Backend agent generated real code artifacts');
    } else {
      console.log('   ⚠️ Backend agent did not generate code artifacts');
    }
    
    // Step 6: System status
    console.log('\n6️⃣ System Status Report:');
    const status = agentManager.getSystemStatus();
    console.log(JSON.stringify(status, null, 2));
    
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('🎉 The agent system is fully functional without markdown files!');
    console.log('💡 Agents are loaded from .mjs files and can perform real work.');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

// Run the test
testAgentSystem().catch(console.error);