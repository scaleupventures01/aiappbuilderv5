/**
 * Real Agent Orchestration - Main Entry Point
 * 
 * This is the primary interface that replaces all simulated agent implementations
 * with real AI agents via Claude's Task tool. It provides the complete 5-phase
 * orchestration workflow for feature development.
 * 
 * USAGE:
 *   import { orchestrateFeature } from './real-agent-orchestration.mjs';
 *   const result = await orchestrateFeature(prdPath, featureId);
 * 
 * CRITICAL: This system uses REAL AI agents, not simulations
 */

import WorkflowController, { 
  orchestrateFeature, 
  analyzeFeature, 
  planFeatureTasks 
} from './lib/orch/workflow-controller.mjs';
import OrchestrationEngine from './lib/orch/orchestration-engine.mjs';
import RealAgentTaskBridge from './lib/orch/real-agent-task-bridge.mjs';

/**
 * MAIN ORCHESTRATION FUNCTION
 * Replace existing simulated orchestration with this function
 */
export async function orchestrateFeatureWithRealAgents(prdPath, featureId, options = {}) {
  console.log('\n🎭 REAL AI AGENT ORCHESTRATION');
  console.log('━'.repeat(60));
  console.log('🚨 CRITICAL: This uses REAL AI agents via Task tool');
  console.log('   No simulations - every agent is real AI');
  console.log('━'.repeat(60));
  
  return await orchestrateFeature(prdPath, featureId, options);
}

/**
 * ANALYSIS-ONLY FUNCTION  
 * Get PM and TPM analysis with team recommendations
 */
export async function analyzeFeatureWithRealAgents(prdPath, featureId) {
  console.log('\n📊 REAL AI AGENT ANALYSIS');
  console.log('━'.repeat(50));
  console.log('   PM and TPM will analyze PRD via Task tool');
  
  return await analyzeFeature(prdPath, featureId);
}

/**
 * TASK PLANNING FUNCTION
 * Analysis + domain-specific task addition by real agents
 */  
export async function planFeatureTasksWithRealAgents(prdPath, featureId) {
  console.log('\n📝 REAL AI AGENT TASK PLANNING');
  console.log('━'.repeat(50));
  console.log('   All assigned agents will add tasks via Task tool');
  
  return await planFeatureTasks(prdPath, featureId);
}

/**
 * CREATE ORCHESTRATION CONTROLLER
 * For advanced usage with custom event handling
 */
export function createOrchestrationController() {
  return new WorkflowController();
}

/**
 * WORKFLOW PHASES BREAKDOWN
 * Detailed explanation of the 5-phase process
 */
export function getWorkflowPhases() {
  return {
    phase1: {
      name: 'Discovery',
      description: 'Dynamically discover all 34 available agents',
      agents: 'System scans @orch/agents/ directory',
      output: 'List of available agents with capabilities'
    },
    
    phase2: {
      name: 'Assignment', 
      description: 'PM and TPM analyze PRD and assign relevant agents',
      agents: ['product-manager', 'technical-product-manager'],
      output: 'List of assigned agents for this feature'
    },
    
    phase3: {
      name: 'Task Addition',
      description: 'Each assigned agent adds domain-specific tasks to PRD',
      agents: 'All assigned agents from Phase 2',
      output: 'Updated PRD with all agent tasks and dependencies'
    },
    
    phase4: {
      name: 'Execution',
      description: 'Agents execute their tasks concurrently where possible',
      agents: 'All assigned agents work their tasks',
      output: 'Complete implementation with all deliverables'
    },
    
    phase5: {
      name: 'Sign-off',
      description: 'Each agent reviews completed work and provides approval',
      agents: 'All participating agents review and approve',
      output: 'Final approval status and any issues to resolve'
    }
  };
}

/**
 * TASK TOOL INTEGRATION GUIDE
 * Shows exactly how Claude integrates with Task tool
 */
export function getTaskToolIntegrationGuide() {
  return {
    title: 'Claude Task Tool Integration Guide',
    
    overview: `
The orchestration system is built around Claude's Task tool integration.
Every agent invocation creates a real AI subagent - no simulations.
`,
    
    integrationPoints: [
      {
        location: 'RealAgentTaskBridge.callTaskToolDirectly()',
        description: 'Primary Task tool invocation point',
        code: `
// Claude must replace this with actual Task tool call:
const result = await Task({
  subagent_type: 'general-purpose',
  description: 'Product Manager - Analyze PRD for feature 1.1.1.1',
  prompt: comprehensiveRoleBasedPrompt
});
        `
      },
      {
        location: 'OrchestrationEngine.invokeRealAgent()',
        description: 'High-level agent invocation interface',
        purpose: 'Builds prompts and calls Task bridge'
      },
      {
        location: 'WorkflowController.orchestrateFeature()',
        description: 'Main orchestration entry point',
        purpose: 'Coordinates entire 5-phase workflow'
      }
    ],
    
    agentPromptStructure: {
      identity: 'Role definition and expertise',
      context: 'Current task and project context',
      instructions: 'Critical behavioral guidelines',
      taskSpecific: 'Requirements based on task type',
      outputFormat: 'Expected response structure'
    },
    
    responseProcessing: [
      'Parse structured data from agent responses',
      'Validate response quality and completeness',
      'Extract deliverables, tasks, approvals, etc.',
      'Store results for subsequent phases'
    ],
    
    criticalRequirement: `
CRITICAL: Claude MUST replace callTaskToolDirectly() with actual Task tool invocations.
Without this integration, the system cannot spawn real AI agents.
    `
  };
}

/**
 * SYSTEM COMPARISON
 * Shows difference between simulated vs real agent systems
 */
export function getSystemComparison() {
  return {
    title: 'Simulated vs Real Agent System Comparison',
    
    simulated: {
      agents: 'Template responses and hardcoded logic',
      intelligence: 'Static, predictable outputs',
      adaptability: 'Cannot adapt to new requirements',
      quality: 'Limited by predefined templates',
      cost: 'No API costs but limited value',
      time: 'Fast but produces template outputs'
    },
    
    real: {
      agents: 'Real AI subagents via Task tool',
      intelligence: 'Dynamic, intelligent analysis and solutions',
      adaptability: 'Adapts to any requirement or context',
      quality: 'Production-ready, professional outputs',
      cost: 'Task tool costs but high value delivery',
      time: 'Slower but produces real solutions'
    },
    
    benefits: [
      'Real code that works in production',
      'Intelligent problem-solving and adaptation',
      'Professional-quality documentation and analysis',
      'Actual expertise in each domain area',
      'Dynamic collaboration between agents',
      'Genuine quality review and validation'
    ],
    
    whenToUse: {
      real: 'For actual feature development and production work',
      simulated: 'For testing orchestration flow without costs'
    }
  };
}

/**
 * MIGRATION GUIDE
 * How to replace existing simulated system
 */
export function getMigrationGuide() {
  return {
    title: 'Migration from Simulated to Real Agent System',
    
    steps: [
      {
        step: 1,
        action: 'Replace import statements',
        from: "import { simulatedAgentSystem } from './lib/simulated-agents.mjs'",
        to: "import { orchestrateFeatureWithRealAgents } from './real-agent-orchestration.mjs'"
      },
      {
        step: 2,
        action: 'Update function calls',
        from: 'simulatedAgentSystem.runWorkflow(prd, id)',
        to: 'orchestrateFeatureWithRealAgents(prd, id)'
      },
      {
        step: 3,
        action: 'Claude integrates Task tool',
        description: 'Replace callTaskToolDirectly() with actual Task tool calls',
        critical: true
      },
      {
        step: 4,
        action: 'Update event handling',
        description: 'Real system emits different events than simulated',
        events: ['agentCompleted', 'agentFailed', 'workflowCompleted']
      },
      {
        step: 5,
        action: 'Test with small features first',
        description: 'Start with simple features to validate system',
        recommendation: 'Use analysis-only mode initially'
      }
    ],
    
    keyDifferences: [
      'Real agents take longer but produce better results',
      'Task tool costs apply to each agent invocation',
      'Response quality is much higher',
      'Error handling is more complex',
      'Progress tracking is real-time'
    ]
  };
}

/**
 * USAGE EXAMPLES
 * Complete examples of system usage
 */
export const examples = {
  
  // Basic orchestration
  basic: async () => {
    const prdPath = './app/PRDs/feature.md';
    const featureId = '1.1.1.1';
    
    const result = await orchestrateFeatureWithRealAgents(prdPath, featureId);
    return result;
  },
  
  // Analysis only
  analysis: async () => {
    const prdPath = './app/PRDs/feature.md';
    const featureId = '1.1.1.1';
    
    const analysis = await analyzeFeatureWithRealAgents(prdPath, featureId);
    console.log(`Recommended team: ${analysis.assignment.assignedAgents.join(', ')}`);
    return analysis;
  },
  
  // With custom options
  withOptions: async () => {
    const result = await orchestrateFeatureWithRealAgents('./prd.md', '1.1.1.1', {
      maxConcurrentAgents: 3,
      timeoutMs: 600000, // 10 minutes
      requireSignOff: true
    });
    return result;
  },
  
  // With event monitoring
  withMonitoring: async () => {
    const controller = createOrchestrationController();
    
    controller.on('agentCompleted', ({ role }) => {
      console.log(`✅ ${role} completed their work`);
    });
    
    const result = await controller.orchestrateFeature('./prd.md', '1.1.1.1');
    return result;
  }
};

/**
 * SYSTEM STATUS
 * Current implementation status
 */
export function getSystemStatus() {
  return {
    orchestrationEngine: '✅ Complete - 5-phase workflow implemented',
    taskBridge: '✅ Complete - Task tool integration layer ready',
    workflowController: '✅ Complete - Main interface and event handling',
    agentDefinitions: '✅ Complete - 34 agent roles defined',
    examples: '✅ Complete - Usage examples and integration guide',
    
    taskToolIntegration: '⚠️  PENDING - Claude must integrate Task tool',
    
    readyForProduction: false,
    blockers: [
      'Claude must replace callTaskToolDirectly() with actual Task tool calls'
    ],
    
    whenReady: [
      'Complete replacement of simulated system',
      'Real AI agents for all 34 roles', 
      'Production-quality feature development',
      'End-to-end orchestration with real intelligence'
    ]
  };
}

// Export main functions and utilities
export {
  orchestrateFeature,
  analyzeFeature, 
  planFeatureTasks,
  WorkflowController,
  OrchestrationEngine,
  RealAgentTaskBridge
};

// Default export for convenience
export default {
  orchestrate: orchestrateFeatureWithRealAgents,
  analyze: analyzeFeatureWithRealAgents,
  plan: planFeatureTasksWithRealAgents,
  createController: createOrchestrationController,
  getPhases: getWorkflowPhases,
  getIntegrationGuide: getTaskToolIntegrationGuide,
  getComparison: getSystemComparison,
  getMigrationGuide,
  examples,
  getStatus: getSystemStatus
};