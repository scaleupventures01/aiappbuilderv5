#!/usr/bin/env node

/**
 * Test script for security workflow integration
 * Tests the new security roles and workflow gates
 */

import { runDefaultWorkflow, orchestrateTeam } from './lib/orch/workflow-runner.mjs';
import { agentManager } from './lib/orch/agent-system-concurrent.mjs';

console.log('🔒 Testing Security Workflow Integration\n');
console.log('='.repeat(50));

async function testSecurityWorkflow() {
  try {
    // Test 1: Load all agents including new security roles
    console.log('\n📋 Test 1: Loading all agents including security roles...');
    await agentManager.loadTeamAgents(true);
    
    const agents = agentManager.getAllAgents();
    const securityAgents = agents.filter(a => 
      ['ciso', 'security-architect', 'application-security-engineer', 
       'devsecops-engineer', 'privacy-engineer', 'ai-safety-engineer'].includes(a.name)
    );
    
    console.log(`✅ Loaded ${agents.length} total agents`);
    console.log(`🔐 Found ${securityAgents.length} security agents:`, 
      securityAgents.map(a => a.name).join(', '));
    
    // Test 2: Run workflow with security gates
    console.log('\n📋 Test 2: Running workflow with security gates...');
    const workflowResult = await runDefaultWorkflow(false, {
      doItFully: true,
      autonomous: false,
      featureId: '1.1.1.1.7.5' // Feature with security requirements
    });
    
    console.log('Quality Gates:', workflowResult.qualityGates);
    const securityGate = workflowResult.qualityGates.details.find(g => g.name === 'Security Review');
    const privacyGate = workflowResult.qualityGates.details.find(g => g.name === 'Privacy Compliance');
    
    console.log(`✅ Security Review: ${securityGate?.status || 'NOT FOUND'}`);
    console.log(`✅ Privacy Compliance: ${privacyGate?.status || 'NOT FOUND'}`);
    
    // Test 3: Orchestrate team with security roles
    console.log('\n📋 Test 3: Orchestrating team with automatic security role assignment...');
    const orchestration = await orchestrateTeam('1.1.1.1.7.5'); // Security-heavy feature
    
    console.log(`📊 Feature ID: ${orchestration.featureId}`);
    console.log(`👥 Assigned Agents: ${orchestration.agents.length}`);
    console.log(`🔐 Security Roles:`, 
      orchestration.agents.filter(a => 
        a.includes('security') || a.includes('ciso') || a.includes('privacy')
      ).join(', ')
    );
    
    // Test 4: Check specific security agent capabilities
    console.log('\n📋 Test 4: Testing security agent capabilities...');
    const cisoAgent = agentManager.getAgent('ciso');
    if (cisoAgent) {
      const capabilities = cisoAgent.getCapabilities();
      console.log('CISO Agent Capabilities:', {
        name: capabilities.name,
        specializations: capabilities.specializations,
        tools: capabilities.tools
      });
      
      // Test task execution
      const testTask = {
        id: 'test-security-1',
        description: 'Perform risk assessment for payment processing feature',
        requirements: { role: 'ciso' }
      };
      
      const canHandle = cisoAgent.canHandleTask(testTask);
      console.log(`✅ CISO can handle security task: ${canHandle}`);
    }
    
    // Test 5: Verify workflow includes all new roles
    console.log('\n📋 Test 5: Verifying all new roles are integrated...');
    const newRoles = [
      'ciso', 'security-architect', 'application-security-engineer',
      'devsecops-engineer', 'privacy-engineer', 'ai-safety-engineer',
      'implementation-owner', 'business-analyst', 'project-manager'
    ];
    
    const missingRoles = [];
    for (const role of newRoles) {
      const agent = agentManager.getAgent(role);
      if (!agent) {
        missingRoles.push(role);
      }
    }
    
    if (missingRoles.length === 0) {
      console.log('✅ All new roles successfully integrated!');
    } else {
      console.log(`⚠️ Missing roles: ${missingRoles.join(', ')}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary:');
    console.log(`- Security agents loaded: ${securityAgents.length > 0 ? '✅' : '❌'}`);
    console.log(`- Security gates active: ${securityGate ? '✅' : '❌'}`);
    console.log(`- Privacy checks active: ${privacyGate ? '✅' : '❌'}`);
    console.log(`- Team orchestration works: ${orchestration.agents.length > 0 ? '✅' : '❌'}`);
    console.log(`- All new roles integrated: ${missingRoles.length === 0 ? '✅' : '❌'}`);
    
    console.log('\n✨ Security workflow integration test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testSecurityWorkflow().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});