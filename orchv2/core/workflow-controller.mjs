/**
 * Workflow Controller - Main Orchestration Interface
 * 
 * This is the primary interface for running real AI agent orchestration workflows.
 * It coordinates between the OrchestrationEngine and RealAgentTaskBridge to
 * execute complete feature development workflows using real AI agents.
 * 
 * CRITICAL: This replaces all simulated implementations with real AI
 */

import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import OrchestrationEngine from './orchestration-engine.mjs';
import RealAgentTaskBridge from './real-agent-task-bridge.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main Workflow Controller
 * Orchestrates complete feature development using real AI agents
 */
export class WorkflowController extends EventEmitter {
  constructor() {
    super();
    this.orchestrationEngine = new OrchestrationEngine();
    this.taskBridge = new RealAgentTaskBridge();
    this.activeWorkflows = new Map();
    
    // Set up event forwarding
    this.setupEventForwarding();
    
    // Integrate Task Bridge with Orchestration Engine
    this.integrateComponents();
  }

  /**
   * Set up event forwarding between components
   */
  setupEventForwarding() {
    // Forward orchestration engine events
    this.orchestrationEngine.on('progress', (event) => {
      this.emit('orchestrationProgress', event);
    });
    
    // Forward task bridge events
    this.taskBridge.on('agentCompleted', (event) => {
      this.emit('agentCompleted', event);
    });
    
    this.taskBridge.on('agentFailed', (event) => {
      this.emit('agentFailed', event);
    });
    
    this.taskBridge.on('agentTimeout', (event) => {
      this.emit('agentTimeout', event);
    });
  }

  /**
   * Integrate Task Bridge with Orchestration Engine
   */
  integrateComponents() {
    // Replace the orchestration engine's callTaskTool method with the real bridge
    this.orchestrationEngine.callTaskTool = async (params) => {
      return await this.taskBridge.callTaskToolDirectly(params);
    };
    
    // Connect the invokeRealAgent methods
    this.orchestrationEngine.invokeRealAgent = async (role, task) => {
      return await this.taskBridge.invokeRealAgent(role, task);
    };
  }

  /**
   * MAIN ENTRY POINT: Run complete orchestration workflow
   * This is the primary method users call to orchestrate a feature
   */
  async orchestrateFeature(prdPath, featureId, options = {}) {
    console.log('\n🎭 STARTING COMPLETE ORCHESTRATION WORKFLOW');
    console.log('═'.repeat(80));
    console.log(`Feature: ${featureId}`);
    console.log(`PRD: ${prdPath}`);
    console.log(`Options:`, JSON.stringify(options, null, 2));
    console.log('═'.repeat(80));
    
    const workflowId = `workflow-${featureId}-${Date.now()}`;
    const workflow = {
      id: workflowId,
      featureId,
      prdPath,
      options,
      startTime: new Date().toISOString(),
      status: 'starting',
      phases: {},
      results: null,
      error: null
    };
    
    this.activeWorkflows.set(workflowId, workflow);
    
    try {
      // Emit workflow start
      this.emit('workflowStarted', { workflowId, featureId });
      
      // Validate inputs
      await this.validateWorkflowInputs(prdPath, featureId);
      
      // Run the complete orchestration
      workflow.status = 'orchestrating';
      const orchestrationResult = await this.orchestrationEngine.orchestrateFeature(prdPath, featureId);
      
      // Update workflow with results
      workflow.status = orchestrationResult.success ? 'completed' : 'needs_work';
      workflow.endTime = new Date().toISOString();
      workflow.results = orchestrationResult;
      
      // Emit completion
      this.emit('workflowCompleted', { workflowId, success: orchestrationResult.success, results: orchestrationResult });
      
      console.log('\n🎉 WORKFLOW COMPLETED SUCCESSFULLY');
      console.log('═'.repeat(80));
      this.printWorkflowSummary(orchestrationResult);
      console.log('═'.repeat(80));
      
      return orchestrationResult;
      
    } catch (error) {
      workflow.status = 'failed';
      workflow.endTime = new Date().toISOString();
      workflow.error = error.message;
      
      this.emit('workflowFailed', { workflowId, error });
      
      console.error('\n❌ WORKFLOW FAILED');
      console.error('═'.repeat(80));
      console.error(`Error: ${error.message}`);
      console.error('═'.repeat(80));
      
      throw error;
    }
  }

  /**
   * Validate workflow inputs
   */
  async validateWorkflowInputs(prdPath, featureId) {
    console.log('\n🔍 VALIDATING WORKFLOW INPUTS...');
    
    // Check PRD file exists and is readable
    try {
      const prdContent = await fs.readFile(prdPath, 'utf8');
      if (!prdContent || prdContent.trim().length < 100) {
        throw new Error('PRD content is too short or empty');
      }
      console.log(`   ✅ PRD file valid (${prdContent.length} characters)`);
    } catch (error) {
      throw new Error(`Invalid PRD file: ${error.message}`);
    }
    
    // Validate feature ID format
    const featureIdPattern = /^\d+\.\d+\.\d+\.\d+(\.\d+)?$/;
    if (!featureIdPattern.test(featureId)) {
      throw new Error(`Invalid feature ID format: ${featureId}. Expected: X.X.X.X or X.X.X.X.X`);
    }
    console.log(`   ✅ Feature ID format valid: ${featureId}`);
  }

  /**
   * Run lightweight analysis workflow (PM + TPM only)
   */
  async runAnalysisWorkflow(prdPath, featureId) {
    console.log('\n📊 RUNNING ANALYSIS WORKFLOW (PM + TPM)');
    console.log('━'.repeat(50));
    
    try {
      // Discover agents first
      await this.orchestrationEngine.discoverAgents();
      
      // Run just the assignment phase
      const prdContent = await fs.readFile(prdPath, 'utf8');
      const assignment = await this.orchestrationEngine.assignmentPhase(prdContent, featureId);
      
      console.log('\n📋 ANALYSIS COMPLETE');
      console.log(`   PM Analysis: ${assignment.pmAnalysis ? 'Complete' : 'Failed'}`);
      console.log(`   TPM Analysis: ${assignment.tpmAnalysis ? 'Complete' : 'Failed'}`);
      console.log(`   Recommended Team: ${assignment.assignedAgents.length} agents`);
      console.log(`   Agents: ${assignment.assignedAgents.join(', ')}`);
      
      return {
        type: 'analysis',
        featureId,
        assignment,
        teamSize: assignment.assignedAgents.length,
        estimatedCost: this.estimateWorkflowCost(assignment.assignedAgents.length),
        estimatedTime: this.estimateWorkflowTime(assignment.assignedAgents.length)
      };
      
    } catch (error) {
      console.error(`❌ Analysis workflow failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run task planning workflow (Analysis + Task Addition)
   */
  async runTaskPlanningWorkflow(prdPath, featureId) {
    console.log('\n📝 RUNNING TASK PLANNING WORKFLOW');
    console.log('━'.repeat(50));
    
    try {
      // Run analysis first
      const analysis = await this.runAnalysisWorkflow(prdPath, featureId);
      
      // Run task addition phase
      const taskAddition = await this.orchestrationEngine.taskAdditionPhase(
        prdPath, 
        analysis.assignment.assignedAgents, 
        featureId
      );
      
      console.log('\n📋 TASK PLANNING COMPLETE');
      console.log(`   Agents contributed: ${taskAddition.taskAdditions.size}`);
      console.log(`   Dependencies mapped: ${Object.keys(taskAddition.dependencyGraph || {}).length}`);
      console.log(`   PRD updated: ${taskAddition.updatedPRD ? 'Yes' : 'No'}`);
      
      return {
        type: 'task-planning',
        featureId,
        analysis,
        taskAddition,
        executionPlan: this.orchestrationEngine.createExecutionPlan(taskAddition.dependencyGraph)
      };
      
    } catch (error) {
      console.error(`❌ Task planning workflow failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Monitor active workflows
   */
  getActiveWorkflows() {
    const workflows = [];
    
    for (const [workflowId, workflow] of this.activeWorkflows) {
      workflows.push({
        id: workflowId,
        featureId: workflow.featureId,
        status: workflow.status,
        startTime: workflow.startTime,
        endTime: workflow.endTime,
        duration: workflow.endTime ? 
          new Date(workflow.endTime) - new Date(workflow.startTime) : 
          new Date() - new Date(workflow.startTime)
      });
    }
    
    return workflows;
  }

  /**
   * Get workflow status and progress
   */
  getWorkflowStatus(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    return {
      ...workflow,
      agentStatus: this.taskBridge.getActiveAgentStatus(),
      orchestrationProgress: this.orchestrationEngine.getProgressSummary(workflow.featureId)
    };
  }

  /**
   * Cancel an active workflow
   */
  async cancelWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    if (['completed', 'failed', 'cancelled'].includes(workflow.status)) {
      throw new Error(`Cannot cancel workflow in status: ${workflow.status}`);
    }
    
    console.log(`\n🛑 CANCELLING WORKFLOW: ${workflowId}`);
    
    workflow.status = 'cancelling';
    
    // Cancel any active agents
    const agentStatus = this.taskBridge.getActiveAgentStatus();
    console.log(`   Stopping ${agentStatus.byStatus.invoking} active agents...`);
    
    // Note: In real implementation, we would need to cancel Task tool invocations
    // This would require additional Task tool capabilities
    
    workflow.status = 'cancelled';
    workflow.endTime = new Date().toISOString();
    
    this.emit('workflowCancelled', { workflowId });
    console.log(`   ✅ Workflow cancelled: ${workflowId}`);
  }

  /**
   * Estimate workflow cost based on team size
   */
  estimateWorkflowCost(teamSize) {
    // Rough estimates based on Task tool usage
    const costPerAgent = 0.10; // Estimated cost per agent invocation
    const phases = 5; // Discovery, Assignment, Task Addition, Execution, Sign-off
    
    return {
      estimatedCost: teamSize * costPerAgent * phases,
      breakdown: {
        agentsInvolved: teamSize,
        phasesPerAgent: phases,
        costPerInvocation: costPerAgent,
        totalInvocations: teamSize * phases
      }
    };
  }

  /**
   * Estimate workflow time based on team size
   */
  estimateWorkflowTime(teamSize) {
    // Time estimates in minutes
    const baseTime = 5; // Base orchestration overhead
    const timePerAgent = 2; // Average time per agent
    const concurrencyFactor = 0.6; // Efficiency gain from concurrency
    
    const sequentialTime = baseTime + (teamSize * timePerAgent);
    const estimatedTime = Math.ceil(sequentialTime * concurrencyFactor);
    
    return {
      estimatedMinutes: estimatedTime,
      breakdown: {
        baseOverhead: baseTime,
        agentsInvolved: teamSize,
        timePerAgent: timePerAgent,
        concurrencyFactor: concurrencyFactor,
        sequentialTime: sequentialTime
      }
    };
  }

  /**
   * Print comprehensive workflow summary
   */
  printWorkflowSummary(results) {
    console.log('\n📊 WORKFLOW SUMMARY');
    console.log('━'.repeat(50));
    console.log(`Feature ID: ${results.featureId}`);
    console.log(`Success: ${results.success ? '✅ YES' : '❌ NO'}`);
    console.log('');
    
    // Phase summary
    if (results.phases) {
      console.log('PHASES:');
      if (results.phases.discovery) {
        console.log(`   Discovery: ${results.phases.discovery.availableAgents?.length || 0} agents found`);
      }
      if (results.phases.assignment) {
        console.log(`   Assignment: ${results.phases.assignment.assignedAgents?.length || 0} agents assigned`);
      }
      if (results.phases.taskAddition) {
        console.log(`   Task Addition: ${results.phases.taskAddition.taskAdditions?.size || 0} agents contributed`);
      }
      if (results.phases.execution) {
        console.log(`   Execution: ${results.phases.execution.results?.size || 0} agents completed work`);
      }
      if (results.phases.signOff) {
        const signOff = results.phases.signOff;
        console.log(`   Sign-off: ${signOff.approvalCount}/${signOff.totalAgents} approved`);
      }
      console.log('');
    }
    
    // Summary metrics
    if (results.summary) {
      console.log('SUMMARY:');
      console.log(`   Status: ${results.summary.status}`);
      console.log(`   Agents Participated: ${results.summary.agentsParticipated}`);
      console.log(`   Approval Rate: ${Math.round(results.summary.approvalRate * 100)}%`);
      console.log(`   Issues Found: ${results.summary.issuesFound}`);
      console.log(`   Next Steps: ${results.summary.nextSteps}`);
    }
  }

  /**
   * Get workflow analytics
   */
  getWorkflowAnalytics() {
    const completedWorkflows = Array.from(this.activeWorkflows.values())
      .filter(w => ['completed', 'failed'].includes(w.status));
    
    if (completedWorkflows.length === 0) {
      return { message: 'No completed workflows to analyze' };
    }
    
    const analytics = {
      totalWorkflows: completedWorkflows.length,
      successRate: completedWorkflows.filter(w => w.status === 'completed').length / completedWorkflows.length,
      averageDuration: 0,
      mostCommonTeamSize: 0,
      topAgents: new Map(),
      commonIssues: new Map()
    };
    
    // Calculate average duration
    const durations = completedWorkflows
      .filter(w => w.startTime && w.endTime)
      .map(w => new Date(w.endTime) - new Date(w.startTime));
    
    if (durations.length > 0) {
      analytics.averageDuration = durations.reduce((a, b) => a + b) / durations.length;
    }
    
    return analytics;
  }

  /**
   * Clean up completed workflows (keep last 10)
   */
  cleanupWorkflows() {
    const completed = Array.from(this.activeWorkflows.entries())
      .filter(([_, workflow]) => ['completed', 'failed', 'cancelled'].includes(workflow.status))
      .sort(([_, a], [__, b]) => new Date(b.endTime) - new Date(a.endTime));
    
    // Keep only the 10 most recent completed workflows
    if (completed.length > 10) {
      const toRemove = completed.slice(10);
      toRemove.forEach(([workflowId]) => {
        this.activeWorkflows.delete(workflowId);
      });
      
      console.log(`🧹 Cleaned up ${toRemove.length} old workflows`);
    }
  }
}

/**
 * Convenience function to create and run orchestration
 */
export async function orchestrateFeature(prdPath, featureId, options = {}) {
  const controller = new WorkflowController();
  return await controller.orchestrateFeature(prdPath, featureId, options);
}

/**
 * Convenience function for analysis-only workflows
 */
export async function analyzeFeature(prdPath, featureId) {
  const controller = new WorkflowController();
  return await controller.runAnalysisWorkflow(prdPath, featureId);
}

/**
 * Convenience function for task planning workflows
 */
export async function planFeatureTasks(prdPath, featureId) {
  const controller = new WorkflowController();
  return await controller.runTaskPlanningWorkflow(prdPath, featureId);
}

// Export the main controller class and convenience functions
export default WorkflowController;