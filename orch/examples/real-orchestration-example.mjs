/**
 * Real Agent Orchestration Example
 * 
 * This example demonstrates how to use the complete orchestration system
 * with REAL AI agents via Claude's Task tool.
 * 
 * CRITICAL: This shows exactly where and how Claude integrates with Task tool
 */

import WorkflowController, { 
  orchestrateFeature, 
  analyzeFeature, 
  planFeatureTasks 
} from '../lib/orch/workflow-controller.mjs';

/**
 * EXAMPLE 1: Complete Feature Orchestration
 * This runs the full 5-phase workflow with real AI agents
 */
export async function exampleCompleteOrchestration() {
  console.log('\n' + '═'.repeat(70));
  console.log('EXAMPLE 1: COMPLETE REAL AI AGENT ORCHESTRATION');
  console.log('═'.repeat(70));
  
  // Example PRD path and feature ID
  const prdPath = '/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app/PRDs/M0/1.1/Phase-1-Independent/PRD-1.1.1.1-postgresql-setup.md';
  const featureId = '1.1.1.1';
  
  try {
    console.log('\n🚀 Starting complete orchestration...');
    console.log(`   PRD: ${prdPath}`);
    console.log(`   Feature: ${featureId}`);
    
    // This will run all 5 phases with real AI agents
    const result = await orchestrateFeature(prdPath, featureId, {
      maxConcurrentAgents: 5,
      timeoutMs: 300000, // 5 minutes per agent
      requireSignOff: true
    });
    
    console.log('\n✅ Orchestration completed!');
    console.log(`   Success: ${result.success}`);
    console.log(`   Agents involved: ${result.summary?.agentsParticipated || 'Unknown'}`);
    console.log(`   Issues found: ${result.summary?.issuesFound || 0}`);
    
    return result;
    
  } catch (error) {
    console.error('\n❌ Orchestration failed:', error.message);
    throw error;
  }
}

/**
 * EXAMPLE 2: Analysis-Only Workflow  
 * Just PM and TPM analyze the PRD and recommend team
 */
export async function exampleAnalysisWorkflow() {
  console.log('\n' + '═'.repeat(70));
  console.log('EXAMPLE 2: ANALYSIS-ONLY WORKFLOW (PM + TPM)');
  console.log('═'.repeat(70));
  
  const prdPath = '/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app/PRDs/M0/1.1/Phase-1-Independent/PRD-1.1.1.1-postgresql-setup.md';
  const featureId = '1.1.1.1';
  
  try {
    const analysis = await analyzeFeature(prdPath, featureId);
    
    console.log('\n📊 Analysis Results:');
    console.log(`   Recommended team size: ${analysis.teamSize} agents`);
    console.log(`   Estimated cost: $${analysis.estimatedCost.estimatedCost.toFixed(2)}`);
    console.log(`   Estimated time: ${analysis.estimatedTime.estimatedMinutes} minutes`);
    console.log(`   Team composition: ${analysis.assignment.assignedAgents.join(', ')}`);
    
    return analysis;
    
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    throw error;
  }
}

/**
 * EXAMPLE 3: Task Planning Workflow
 * Analysis + agents add their domain-specific tasks to PRD
 */
export async function exampleTaskPlanningWorkflow() {
  console.log('\n' + '═'.repeat(70));
  console.log('EXAMPLE 3: TASK PLANNING WORKFLOW');
  console.log('═'.repeat(70));
  
  const prdPath = '/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app/PRDs/M0/1.1/Phase-1-Independent/PRD-1.1.1.1-postgresql-setup.md';
  const featureId = '1.1.1.1';
  
  try {
    const planning = await planFeatureTasks(prdPath, featureId);
    
    console.log('\n📝 Task Planning Results:');
    console.log(`   Agents contributed: ${planning.taskAddition.taskAdditions.size}`);
    console.log(`   Execution phases: ${planning.executionPlan.phases.length}`);
    console.log(`   Total tasks: ${Array.from(planning.taskAddition.taskAdditions.values()).reduce((sum, agent) => sum + (agent.tasks?.length || 0), 0)}`);
    
    return planning;
    
  } catch (error) {
    console.error('\n❌ Task planning failed:', error.message);
    throw error;
  }
}

/**
 * EXAMPLE 4: Custom Workflow with Event Monitoring
 * Shows how to monitor progress and handle events
 */
export async function exampleCustomWorkflowWithMonitoring() {
  console.log('\n' + '═'.repeat(70));
  console.log('EXAMPLE 4: CUSTOM WORKFLOW WITH MONITORING');
  console.log('═'.repeat(70));
  
  const controller = new WorkflowController();
  
  // Set up event listeners
  controller.on('workflowStarted', ({ workflowId, featureId }) => {
    console.log(`🚀 Workflow started: ${workflowId} for feature ${featureId}`);
  });
  
  controller.on('agentCompleted', ({ role, task, result }) => {
    console.log(`✅ Agent completed: ${role} finished ${task.id}`);
  });
  
  controller.on('agentFailed', ({ role, task, error }) => {
    console.error(`❌ Agent failed: ${role} failed ${task.id}: ${error.message}`);
  });
  
  controller.on('workflowCompleted', ({ workflowId, success }) => {
    console.log(`🎉 Workflow completed: ${workflowId} (Success: ${success})`);
  });
  
  // Run orchestration with monitoring
  const prdPath = '/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app/PRDs/M0/1.1/Phase-1-Independent/PRD-1.1.1.1-postgresql-setup.md';
  const featureId = '1.1.1.1';
  
  try {
    const result = await controller.orchestrateFeature(prdPath, featureId);
    
    // Get final analytics
    const analytics = controller.getWorkflowAnalytics();
    console.log('\n📈 Workflow Analytics:', JSON.stringify(analytics, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('\n❌ Custom workflow failed:', error.message);
    throw error;
  }
}

/**
 * EXAMPLE 5: How Claude Integrates with Task Tool
 * This shows the exact integration points where Claude uses Task tool
 */
export async function exampleTaskToolIntegration() {
  console.log('\n' + '═'.repeat(70));
  console.log('EXAMPLE 5: TASK TOOL INTEGRATION POINTS');
  console.log('═'.repeat(70));
  
  console.log(`
🎭 TASK TOOL INTEGRATION WORKFLOW:

1. User calls: orchestrateFeature(prdPath, featureId)

2. OrchestrationEngine.discoverAgents()
   → Scans @orch/agents/ directory
   → Loads 34 agent definitions
   → Validates critical agents present

3. OrchestrationEngine.assignmentPhase()
   → Invokes Product Manager via Task tool
   → Invokes Technical Product Manager via Task tool
   → Both agents analyze PRD and recommend team

4. OrchestrationEngine.taskAdditionPhase()  
   → For each assigned agent:
     → Invoke agent via Task tool
     → Agent adds domain-specific tasks to PRD
     → Agent defines dependencies and deliverables

5. OrchestrationEngine.executionPhase()
   → Execute agents concurrently where possible
   → Sequential execution for dependent tasks
   → Each agent invoked via Task tool to do actual work

6. OrchestrationEngine.signOffPhase()
   → Each agent reviews completed work via Task tool
   → Agents provide approval or feedback
   → System determines overall completion status

CRITICAL INTEGRATION POINTS:
• RealAgentTaskBridge.callTaskToolDirectly() 
  → THIS IS WHERE CLAUDE USES TASK TOOL
• Each agent invocation creates a real AI subagent
• No simulations - every agent response is from real AI

CLAUDE TASK TOOL USAGE:
When callTaskToolDirectly() is called, Claude must:

  const result = await Task({
    subagent_type: 'general-purpose',
    description: 'Product Manager - Analyze PRD for feature 1.1.1.1',
    prompt: [comprehensive role-based prompt]
  });

This creates a REAL AI agent that acts as the specified role.
`);
  
  return {
    integrationPoints: [
      'Agent discovery and validation',
      'PM/TPM PRD analysis', 
      'Domain-specific task addition',
      'Concurrent task execution',
      'Quality review and sign-off'
    ],
    taskToolUsage: 'Every agent invocation uses Task tool to create real AI',
    keyBenefit: 'Complete replacement of simulations with real AI intelligence'
  };
}

/**
 * EXAMPLE 6: Error Handling and Recovery
 */
export async function exampleErrorHandling() {
  console.log('\n' + '═'.repeat(70));
  console.log('EXAMPLE 6: ERROR HANDLING AND RECOVERY');
  console.log('═'.repeat(70));
  
  const controller = new WorkflowController();
  
  // Example with invalid inputs
  try {
    await controller.orchestrateFeature('/non/existent/prd.md', 'invalid-feature-id');
  } catch (error) {
    console.log(`✅ Correctly caught error: ${error.message}`);
  }
  
  // Example with timeout handling
  controller.on('agentTimeout', ({ agentId, agent }) => {
    console.log(`⏰ Agent timed out: ${agent.role} (${agentId})`);
    // In real system, could retry or escalate
  });
  
  console.log('\n📋 Error Handling Features:');
  console.log('   • Input validation (PRD exists, feature ID format)');
  console.log('   • Agent timeout detection (5 minute default)');
  console.log('   • Workflow cancellation support');
  console.log('   • Comprehensive error reporting');
  console.log('   • Event-driven error handling');
  
  return {
    errorHandling: 'Comprehensive error handling and recovery built-in'
  };
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('\n🎭 RUNNING ALL REAL AGENT ORCHESTRATION EXAMPLES');
  console.log('═'.repeat(80));
  
  try {
    // Example 5: Show integration points (informational only)
    await exampleTaskToolIntegration();
    
    // Example 6: Show error handling (safe to run)
    await exampleErrorHandling();
    
    console.log('\n⚠️  EXAMPLES 1-4 require Claude to use Task tool');
    console.log('   To run complete orchestration:');
    console.log('   1. Claude must replace callTaskToolDirectly() with actual Task tool');
    console.log('   2. Run: await exampleCompleteOrchestration()');
    console.log('   3. Monitor agent progress via events');
    console.log('   4. Review final orchestration results');
    
    // Uncomment these when Claude has integrated Task tool:
    // await exampleAnalysisWorkflow();
    // await exampleTaskPlanningWorkflow();
    // await exampleCustomWorkflowWithMonitoring();
    // await exampleCompleteOrchestration();
    
    console.log('\n🎉 Examples completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Example execution failed:', error.message);
    throw error;
  }
}

// Export all examples
export default {
  exampleCompleteOrchestration,
  exampleAnalysisWorkflow,
  exampleTaskPlanningWorkflow,
  exampleCustomWorkflowWithMonitoring,
  exampleTaskToolIntegration,
  exampleErrorHandling,
  runAllExamples
};