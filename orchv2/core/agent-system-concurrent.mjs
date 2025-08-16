/**
 * Enhanced Agent System with Concurrent Execution
 * Allows agents to work in parallel when possible
 */

import { Agent, AgentManager as BaseAgentManager } from './agent-system.mjs';

export { Agent };  // Re-export base Agent class

export class ConcurrentAgentManager extends BaseAgentManager {
  constructor() {
    super();
    this.maxConcurrent = 10;  // Maximum concurrent agents
    this.runningTasks = new Map();
  }

  /**
   * Create workflow with concurrent execution
   * Agents work in parallel when they don't depend on each other
   */
  async createWorkflow(workflowDef) {
    const workflow = {
      id: workflowDef.id || crypto.randomUUID(),
      name: workflowDef.name,
      steps: workflowDef.steps || [],
      status: 'running',
      results: [],
      startedAt: new Date().toISOString()
    };
    
    this.activeWorkflows.set(workflow.id, workflow);
    this.emit('workflow:started', workflow);
    
    try {
      // Group steps by dependencies
      const stepGroups = this.groupStepsByDependencies(workflow.steps);
      
      // Execute each group concurrently
      for (const group of stepGroups) {
        const groupResults = await this.executeStepsConcurrently(group, workflow);
        workflow.results.push(...groupResults);
      }
      
      workflow.status = 'completed';
      workflow.completedAt = new Date().toISOString();
      this.emit('workflow:completed', workflow);
      
      return workflow;
    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
      workflow.failedAt = new Date().toISOString();
      this.emit('workflow:failed', workflow);
      throw error;
    }
  }

  /**
   * Execute multiple steps concurrently
   */
  async executeStepsConcurrently(steps, workflow) {
    console.log(`\n🚀 Executing ${steps.length} agents in parallel...`);
    
    const promises = steps.map(async (step) => {
      const agent = this.getAgent(step.agent);
      if (!agent) {
        throw new Error(`Agent ${step.agent} not found for step ${step.name}`);
      }
      
      console.log(`   Starting: ${agent.name}`);
      
      const result = await agent.assignTask({
        description: step.description,
        requirements: step.requirements,
        context: {
          workflow: workflow.id,
          previousResults: workflow.results
        }
      });
      
      console.log(`   ✅ Completed: ${agent.name}`);
      this.emit('workflow:step:completed', { 
        workflow: workflow.id, 
        step: step.name, 
        result 
      });
      
      return { step, result };
    });
    
    // Wait for all agents in this group to complete
    const results = await Promise.all(promises);
    
    // Sort results to maintain order
    return results.sort((a, b) => {
      const indexA = steps.indexOf(a.step);
      const indexB = steps.indexOf(b.step);
      return indexA - indexB;
    }).map(r => r.result);
  }

  /**
   * Group steps by dependencies
   * Steps that don't depend on each other can run concurrently
   */
  groupStepsByDependencies(steps) {
    const groups = [];
    
    // Simple grouping by role type for now
    // Can be enhanced with actual dependency analysis
    const independentRoles = new Set([
      'frontend-engineer',
      'backend-engineer',
      'data-engineer',
      'devops-engineer'
    ]);
    
    const designRoles = new Set([
      'ux-ui-designer',
      'ux-researcher'
    ]);
    
    const qaRoles = new Set([
      'qa-engineer',
      'qa-automation-engineer'
    ]);
    
    // Group 1: Planning/Management (sequential)
    const planningSteps = steps.filter(s => 
      s.agent.includes('manager') || 
      s.agent.includes('vp') || 
      s.agent.includes('cto')
    );
    if (planningSteps.length > 0) groups.push(planningSteps);
    
    // Group 2: Design (parallel)
    const designSteps = steps.filter(s => designRoles.has(s.agent));
    if (designSteps.length > 0) groups.push(designSteps);
    
    // Group 3: Implementation (parallel)
    const implementationSteps = steps.filter(s => independentRoles.has(s.agent));
    if (implementationSteps.length > 0) groups.push(implementationSteps);
    
    // Group 4: QA/Testing (parallel after implementation)
    const qaSteps = steps.filter(s => qaRoles.has(s.agent));
    if (qaSteps.length > 0) groups.push(qaSteps);
    
    // Group 5: Everything else (sequential)
    const otherSteps = steps.filter(s => 
      !planningSteps.includes(s) &&
      !designSteps.includes(s) &&
      !implementationSteps.includes(s) &&
      !qaSteps.includes(s)
    );
    if (otherSteps.length > 0) groups.push(otherSteps);
    
    return groups;
  }

  /**
   * Assign multiple tasks concurrently
   */
  async assignTasksConcurrently(tasks) {
    console.log(`\n📋 Assigning ${tasks.length} tasks concurrently...`);
    
    const promises = tasks.map(async (task) => {
      const agent = this.findBestAgent(task.requirements || {});
      
      if (!agent) {
        console.log(`   ⏳ Queuing task: ${task.description}`);
        this.taskQueue.push(task);
        this.emit('task:queued', task);
        return null;
      }
      
      console.log(`   Assigning to ${agent.name}: ${task.description}`);
      return await agent.assignTask(task);
    });
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => r !== null);
    
    console.log(`   ✅ Completed ${successful.length}/${tasks.length} tasks`);
    return results;
  }

  /**
   * Coordinate feature with parallel execution
   */
  async coordinateFeature(featureId, requirements) {
    const workflow = {
      name: `Feature ${featureId}`,
      id: `feature-${featureId}`,
      steps: []
    };
    
    // Build steps based on requirements
    if (requirements.includes('ui')) {
      workflow.steps.push({
        agent: 'frontend-engineer',
        name: 'UI Implementation',
        description: `Implement UI for feature ${featureId}`
      });
      workflow.steps.push({
        agent: 'ux-ui-designer',
        name: 'UX Design',
        description: `Design UX for feature ${featureId}`
      });
    }
    
    if (requirements.includes('backend')) {
      workflow.steps.push({
        agent: 'backend-engineer',
        name: 'Backend Implementation',
        description: `Implement backend for feature ${featureId}`
      });
    }
    
    if (requirements.includes('data')) {
      workflow.steps.push({
        agent: 'data-engineer',
        name: 'Data Pipeline',
        description: `Setup data pipeline for feature ${featureId}`
      });
    }
    
    // QA always runs last
    workflow.steps.push({
      agent: 'qa-engineer',
      name: 'Quality Assurance',
      description: `Test feature ${featureId}`
    });
    
    // Execute with concurrent groups
    return await this.createWorkflow(workflow);
  }

  /**
   * Get concurrency status
   */
  getConcurrencyStatus() {
    const agents = Array.from(this.agents.values());
    const working = agents.filter(a => a.status === 'working');
    
    return {
      maxConcurrent: this.maxConcurrent,
      currentlyWorking: working.length,
      agentsWorking: working.map(a => a.name),
      queueLength: this.taskQueue.length,
      activeWorkflows: this.activeWorkflows.size
    };
  }
}

// Export singleton with concurrent capabilities
export const agentManager = new ConcurrentAgentManager();