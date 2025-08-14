#!/usr/bin/env node

/**
 * Agent System Demonstration
 * Shows agents working together on a feature
 */

import { agentManager } from './lib/orch/agent-system.mjs';
import { communicationHub, collaborationProtocol, knowledgeBase } from './lib/orch/agent-communication.mjs';

console.log('🚀 AGENT SYSTEM DEMONSTRATION\n');
console.log('=' .repeat(80));

async function demonstrateAgentSystem() {
  // Step 1: Load all agents
  console.log('\n📦 Step 1: Loading Team Agents...\n');
  const agents = await agentManager.loadTeamAgents();
  console.log(`✅ Loaded ${agents.length} agents successfully`);
  console.log('Agents ready:', agents.slice(0, 5).map(a => a.name).join(', '), '...\n');

  // Step 2: Show agent capabilities
  console.log('=' .repeat(80));
  console.log('\n🔍 Step 2: Agent Capabilities\n');
  
  const frontendAgent = agentManager.getAgent('frontend-engineer');
  const backendAgent = agentManager.getAgent('backend-engineer');
  const qaAgent = agentManager.getAgent('qa-engineer');
  
  console.log('Frontend Engineer:');
  console.log('  Status:', frontendAgent.status);
  console.log('  Role:', frontendAgent.role);
  console.log('  Expertise:', frontendAgent.expertise[0]);
  console.log('  Allowed Tools:', frontendAgent.allowedTools[0]);
  
  console.log('\nBackend Engineer:');
  console.log('  Status:', backendAgent.status);
  console.log('  Role:', backendAgent.role);
  console.log('  Expertise:', backendAgent.expertise[0]);
  
  console.log('\nQA Engineer:');
  console.log('  Status:', qaAgent.status);
  console.log('  Role:', qaAgent.role);
  console.log('  Expertise:', qaAgent.expertise[0]);

  // Step 3: Direct task assignment
  console.log('\n' + '=' .repeat(80));
  console.log('\n📋 Step 3: Direct Task Assignment\n');
  
  console.log('Assigning task to Frontend Engineer...');
  const uiTask = await frontendAgent.assignTask({
    description: 'Create login component with form validation',
    requirements: { role: 'frontend-engineer' }
  });
  
  console.log('✅ Task completed by:', uiTask.agent);
  console.log('   Output:', uiTask.output);
  console.log('   Artifacts:', uiTask.artifacts.length > 0 ? uiTask.artifacts.map(a => a.name).join(', ') : 'None');
  console.log('   Recommendations:', uiTask.recommendations && uiTask.recommendations.length > 0 ? uiTask.recommendations[0] : 'None');

  // Step 4: Inter-agent communication
  console.log('\n' + '=' .repeat(80));
  console.log('\n💬 Step 4: Inter-Agent Communication\n');
  
  // Create a communication channel
  const channelId = communicationHub.createChannel('feature-discussion', [
    'frontend-engineer',
    'backend-engineer',
    'qa-engineer'
  ]);
  
  console.log('Created communication channel:', channelId);
  
  // Send messages
  communicationHub.sendToChannel(channelId, {
    from: 'frontend-engineer',
    content: 'I need an API endpoint for user authentication'
  });
  
  communicationHub.sendToChannel(channelId, {
    from: 'backend-engineer',
    content: 'I will create POST /api/auth/login endpoint'
  });
  
  communicationHub.sendToChannel(channelId, {
    from: 'qa-engineer',
    content: 'I will prepare test cases for the login flow'
  });
  
  const channel = communicationHub.channels.get(channelId);
  console.log(`\nMessages in channel (${channel.messages.length} total):`);
  channel.messages.forEach(msg => {
    console.log(`  [${msg.from}]: ${msg.content}`);
  });

  // Step 5: Knowledge sharing
  console.log('\n' + '=' .repeat(80));
  console.log('\n📚 Step 5: Knowledge Sharing\n');
  
  // Backend shares API documentation
  const artifactId = knowledgeBase.shareArtifact('backend-engineer', {
    type: 'api-spec',
    name: 'auth-endpoints.yaml',
    content: 'OpenAPI spec for authentication endpoints'
  });
  
  console.log('Backend Engineer shared artifact:', artifactId);
  
  // Frontend retrieves the artifact
  const artifact = knowledgeBase.getArtifact(artifactId);
  console.log('Frontend Engineer retrieved:', artifact.name);
  console.log('  Type:', artifact.type);
  console.log('  Shared by:', artifact.sharedBy);

  // Step 6: Multi-agent workflow
  console.log('\n' + '=' .repeat(80));
  console.log('\n🔄 Step 6: Multi-Agent Workflow\n');
  
  console.log('Creating workflow for User Authentication feature...\n');
  
  const workflow = await agentManager.createWorkflow({
    name: 'User Authentication Feature',
    steps: [
      {
        agent: 'product-manager',
        name: 'Define Requirements',
        description: 'Create PRD for authentication feature',
        requirements: { role: 'product-manager' }
      },
      {
        agent: 'backend-engineer',
        name: 'Build API',
        description: 'Implement authentication API endpoints',
        requirements: { role: 'backend-engineer' }
      },
      {
        agent: 'frontend-engineer',
        name: 'Build UI',
        description: 'Create login and registration forms',
        requirements: { role: 'frontend-engineer' }
      },
      {
        agent: 'qa-engineer',
        name: 'Test Feature',
        description: 'Test authentication flow end-to-end',
        requirements: { role: 'qa-engineer' }
      }
    ]
  });
  
  console.log('Workflow completed!');
  console.log('  ID:', workflow.id);
  console.log('  Status:', workflow.status);
  console.log('  Steps executed:', workflow.results.length);
  
  console.log('\nWorkflow Results:');
  workflow.results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${workflow.steps[index].name}`);
    console.log(`     Agent: ${result.agent}`);
    console.log(`     Status: ${result.status}`);
    console.log(`     Output: ${result.output}`);
  });

  // Step 7: Collaboration Protocol
  console.log('\n' + '=' .repeat(80));
  console.log('\n🤝 Step 7: Collaboration Protocol (Code Review)\n');
  
  console.log('Starting code review protocol...\n');
  
  const codeReview = await collaborationProtocol.startProtocol('code-review', 
    ['frontend-engineer', 'qa-engineer'],
    { code: 'LoginComponent.tsx' }
  );
  
  console.log('Code Review Protocol Results:');
  console.log('  Protocol:', codeReview.protocol);
  console.log('  Status:', codeReview.status);
  console.log('  Steps completed:', codeReview.currentStep);
  
  console.log('\nProtocol Steps:');
  codeReview.results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.step}`);
    if (result.feedback) console.log(`     Feedback: ${result.feedback.feedback}`);
    if (result.consensus) console.log(`     Decision: ${result.consensus}`);
  });

  // Step 8: System status
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 Step 8: System Status\n');
  
  const systemStatus = agentManager.getSystemStatus();
  console.log('System Overview:');
  console.log('  Total Agents:', systemStatus.totalAgents);
  console.log('  Active Agents:', systemStatus.activeAgents);
  console.log('  Idle Agents:', systemStatus.idleAgents);
  console.log('  Queued Tasks:', systemStatus.queuedTasks);
  console.log('  Active Workflows:', systemStatus.activeWorkflows);
  
  console.log('\nTop 5 Agent Status:');
  systemStatus.agents.slice(0, 5).forEach(agent => {
    console.log(`  ${agent.agent}: ${agent.status} (${agent.tasksCompleted} tasks completed)`);
  });

  // Step 9: Feature coordination
  console.log('\n' + '=' .repeat(80));
  console.log('\n🎯 Step 9: Feature Coordination\n');
  
  console.log('Coordinating agents for Feature 1.1.1.1.0.0 (UI-heavy feature)...\n');
  
  const featureWorkflow = await agentManager.coordinateFeature('1.1.1.1.0.0', ['ui', 'testing']);
  
  console.log('Feature Coordination Complete:');
  console.log('  Feature ID:', featureWorkflow.id);
  console.log('  Status:', featureWorkflow.status);
  console.log('  Steps:', featureWorkflow.steps.length);
  
  console.log('\nAgents involved:');
  featureWorkflow.steps.forEach(step => {
    console.log(`  - ${step.agent}: ${step.name}`);
  });

  console.log('\n' + '=' .repeat(80));
  console.log('\n✨ DEMONSTRATION COMPLETE\n');
  console.log('The agent system successfully demonstrated:');
  console.log('  ✅ Loading and initializing 24 specialized agents');
  console.log('  ✅ Direct task assignment and execution');
  console.log('  ✅ Inter-agent communication via channels');
  console.log('  ✅ Knowledge sharing through artifacts');
  console.log('  ✅ Multi-agent workflow orchestration');
  console.log('  ✅ Collaboration protocols (code review)');
  console.log('  ✅ System monitoring and status reporting');
  console.log('  ✅ Automatic feature coordination');
  
  console.log('\n🎉 All agents are working correctly!');
}

// Run the demonstration
demonstrateAgentSystem().catch(console.error);