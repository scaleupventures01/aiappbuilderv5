#!/usr/bin/env node

/**
 * Test ALL agents to verify they work
 */

import { agentManager } from './lib/orch/agent-system.mjs';

console.log('\n🔍 TESTING ALL AGENTS\n');
console.log('=' .repeat(70));

async function testAllAgents() {
  // Load all agents
  console.log('Loading all team agents...\n');
  const agents = await agentManager.loadTeamAgents();
  
  console.log(`Total agents loaded: ${agents.length}\n`);
  console.log('=' .repeat(70));
  
  // Test each agent
  const testResults = [];
  
  for (const agent of agents) {
    console.log(`\nTesting: ${agent.name}`);
    console.log('-'.repeat(40));
    
    try {
      // Assign a role-specific task
      const taskDescription = getTaskForRole(agent.role);
      
      console.log(`  Role: ${agent.role}`);
      console.log(`  Status: ${agent.status}`);
      console.log(`  Task: "${taskDescription}"`);
      
      const result = await agent.assignTask({
        description: taskDescription,
        requirements: { role: agent.role }
      });
      
      console.log(`  ✅ Result: ${result.status}`);
      console.log(`  Output: ${result.output.substring(0, 100)}...`);
      
      testResults.push({
        agent: agent.name,
        status: 'PASSED',
        tasksCompleted: agent.taskHistory.length
      });
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      testResults.push({
        agent: agent.name,
        status: 'FAILED',
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(70));
  console.log('\n📊 TEST SUMMARY\n');
  
  const passed = testResults.filter(r => r.status === 'PASSED').length;
  const failed = testResults.filter(r => r.status === 'FAILED').length;
  
  console.log(`Total Agents Tested: ${testResults.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed Agents:');
    testResults.filter(r => r.status === 'FAILED').forEach(r => {
      console.log(`  - ${r.agent}: ${r.error}`);
    });
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log(passed === testResults.length ? 
    '\n🎉 ALL AGENTS WORKING CORRECTLY!\n' : 
    '\n⚠️ Some agents need attention\n');
}

function getTaskForRole(role) {
  const tasks = {
    'ai-engineer': 'Design prompt for trading decision support',
    'ai-product-manager': 'Define AI feature requirements for risk analysis',
    'backend-engineer': 'Create API for trade execution',
    'chief-ai-officer': 'Review AI strategy for trading platform',
    'cto': 'Evaluate technology stack for scalability',
    'data-analyst': 'Analyze trading patterns and generate report',
    'data-engineer': 'Build data pipeline for market data ingestion',
    'data-scientist': 'Create predictive model for market trends',
    'devops-engineer': 'Setup CI/CD pipeline for deployment',
    'frontend-engineer': 'Build trading dashboard UI',
    'full-stack-engineer': 'Implement end-to-end trading feature',
    'machine-learning-engineer': 'Train model for trade signal generation',
    'ml-research-scientist': 'Research new algorithms for market prediction',
    'mlops-engineer': 'Deploy ML models to production',
    'product-manager': 'Create PRD for new trading feature',
    'qa-automation-engineer': 'Write automated tests for trading API',
    'qa-engineer': 'Test trading platform functionality',
    'site-reliability-engineer': 'Ensure trading platform uptime',
    'staff-engineer': 'Design system architecture for trading platform',
    'technical-product-manager': 'Define technical requirements for API',
    'ux-researcher': 'Conduct user research on trading workflows',
    'ux-ui-designer': 'Design intuitive trading interface',
    'vp-engineering': 'Plan engineering roadmap for Q1',
    'vp-product': 'Define product vision for trading platform'
  };
  
  return tasks[role] || `Perform ${role} responsibilities`;
}

testAllAgents().catch(console.error);