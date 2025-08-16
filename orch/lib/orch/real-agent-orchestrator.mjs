#!/usr/bin/env node
/**
 * Real Agent Orchestrator - Uses actual AI agents via Task tool
 * This replaces ALL simulated agent behavior with real AI invocations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import { invokeRealAIAgent, initializeTaskBridge } from './task-tool-bridge.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Real Agent Orchestrator - Invokes actual AI agents via Task tool
 */
export class RealAgentOrchestrator {
  constructor() {
    this.agents = [];
    this.prdPath = null;
    this.featureId = null;
    this.assignedAgents = [];
    this.completedTasks = [];
    this.signOffs = [];
  }

  /**
   * Phase 1: Dynamic Agent Discovery
   */
  async discoverAgents() {
    console.log('\n📡 Phase 1: Discovering available agents...');
    
    const agentFiles = glob.sync('*.mjs', {
      cwd: path.join(__dirname, '../../agents'),
      absolute: false
    });
    
    // Filter out index.mjs and other non-agent files
    this.agents = agentFiles
      .filter(file => file !== 'index.mjs')
      .map(file => file.replace('.mjs', ''));
    
    console.log(`✅ Discovered ${this.agents.length} agents`);
    
    // Verify critical agents are present
    const criticalAgents = [
      'product-manager',
      'technical-product-manager', 
      'ai-safety-engineer',
      'privacy-engineer',
      'ciso',
      'security-architect'
    ];
    
    for (const agent of criticalAgents) {
      if (!this.agents.includes(agent)) {
        console.warn(`⚠️  Critical agent missing: ${agent}`);
      }
    }
    
    return this.agents;
  }

  /**
   * Phase 2: Agent Assignment via PM/TPM Analysis
   */
  async assignAgents(prdPath, featureId) {
    console.log('\n🎯 Phase 2: Assigning agents to feature...');
    this.prdPath = prdPath;
    this.featureId = featureId;
    
    // Read PRD content
    const prdContent = fs.readFileSync(prdPath, 'utf8');
    
    // Have Product Manager analyze and assign agents
    console.log('  📋 Product Manager analyzing PRD...');
    const pmAnalysis = await this.invokeRealAgent('product-manager', {
      task: 'analyze-and-assign',
      prompt: `As Product Manager, analyze this PRD and determine which agents from the following list should be assigned to work on this feature. Consider the technical requirements, user impact, and compliance needs.

Available agents: ${this.agents.join(', ')}

PRD Content:
${prdContent}

Respond with a JSON object containing:
{
  "assignedAgents": ["agent-name", ...],
  "reasoning": {
    "agent-name": "why this agent is needed",
    ...
  },
  "sequencing": [
    {"phase": 1, "agents": ["agent1", "agent2"], "reason": "can work in parallel"},
    {"phase": 2, "agents": ["agent3"], "reason": "depends on phase 1"}
  ]
}`
    });
    
    // Have Technical Product Manager provide technical perspective
    console.log('  🔧 Technical Product Manager analyzing requirements...');
    const tpmAnalysis = await this.invokeRealAgent('technical-product-manager', {
      task: 'technical-analysis',
      prompt: `As Technical Product Manager, review the Product Manager's agent assignment and provide technical perspective. Add any missing technical agents or adjust sequencing based on technical dependencies.

PM Analysis: ${JSON.stringify(pmAnalysis)}

PRD Content:
${prdContent}

Respond with a JSON object containing your recommended adjustments or confirmation.`
    });
    
    // Combine analyses
    this.assignedAgents = this.combineAgentAssignments(pmAnalysis, tpmAnalysis);
    console.log(`✅ Assigned ${this.assignedAgents.length} agents to feature`);
    
    return this.assignedAgents;
  }

  /**
   * Phase 3: Task Addition - Agents add their tasks to PRD
   */
  async addAgentTasks() {
    console.log('\n📝 Phase 3: Agents adding tasks to PRD...');
    
    const prdContent = fs.readFileSync(this.prdPath, 'utf8');
    const agentTasks = [];
    
    // Have each assigned agent add their tasks
    for (const agent of this.assignedAgents) {
      console.log(`  🤖 ${agent} adding domain-specific tasks...`);
      
      const tasks = await this.invokeRealAgent(agent, {
        task: 'add-tasks',
        prompt: `As ${agent}, review this PRD and add your domain-specific tasks that need to be completed for this feature. Include dependencies, deliverables, and acceptance criteria.

PRD Content:
${prdContent}

Current Tasks from other agents:
${JSON.stringify(agentTasks, null, 2)}

Respond with a JSON object containing:
{
  "tasks": [
    {
      "id": "unique-task-id",
      "agent": "${agent}",
      "description": "task description",
      "dependencies": ["other-task-ids"],
      "deliverables": ["specific deliverables"],
      "acceptanceCriteria": ["specific criteria"],
      "estimatedTime": "time estimate"
    }
  ]
}`
      });
      
      agentTasks.push(...tasks.tasks);
    }
    
    // Update PRD with all tasks
    await this.updatePRDWithTasks(agentTasks);
    console.log(`✅ Added ${agentTasks.length} tasks to PRD`);
    
    return agentTasks;
  }

  /**
   * Phase 4: Task Execution with concurrency and sequencing
   */
  async executeTasks(tasks) {
    console.log('\n⚡ Phase 4: Executing agent tasks...');
    
    // Build dependency graph
    const executionPhases = this.buildExecutionPhases(tasks);
    
    // Execute each phase
    for (let phaseNum = 0; phaseNum < executionPhases.length; phaseNum++) {
      const phase = executionPhases[phaseNum];
      console.log(`\n  🚀 Executing Phase ${phaseNum + 1} (${phase.length} tasks in parallel)...`);
      
      // Execute tasks in this phase concurrently
      const phasePromises = phase.map(task => this.executeAgentTask(task));
      const phaseResults = await Promise.all(phasePromises);
      
      this.completedTasks.push(...phaseResults);
      console.log(`  ✅ Phase ${phaseNum + 1} complete`);
    }
    
    console.log(`✅ All ${tasks.length} tasks executed`);
    return this.completedTasks;
  }

  /**
   * Phase 5: Sign-off and Completion
   */
  async getSignOffs() {
    console.log('\n✍️ Phase 5: Getting agent sign-offs...');
    
    const completedWork = this.completedTasks;
    
    for (const agent of this.assignedAgents) {
      console.log(`  📋 ${agent} reviewing completed work...`);
      
      const signOff = await this.invokeRealAgent(agent, {
        task: 'sign-off',
        prompt: `As ${agent}, review the completed work for feature ${this.featureId} and provide your sign-off.

Completed Tasks:
${JSON.stringify(completedWork, null, 2)}

Respond with a JSON object containing:
{
  "approved": true/false,
  "feedback": "detailed feedback",
  "issues": ["any issues found"],
  "recommendations": ["any recommendations"]
}`
      });
      
      this.signOffs.push({
        agent,
        ...signOff
      });
    }
    
    const allApproved = this.signOffs.every(s => s.approved);
    console.log(allApproved ? '✅ All agents signed off!' : '⚠️ Some agents have concerns');
    
    return this.signOffs;
  }

  /**
   * Invoke real AI agent via Task tool - USING TASK TOOL BRIDGE
   */
  async invokeRealAgent(agentName, { task, prompt }) {
    try {
      // Use the Task tool bridge to invoke real AI agents
      const result = await invokeRealAIAgent(agentName, task, prompt);
      return result;
      
    } catch (error) {
      console.error(`    ❌ Error invoking ${agentName}:`, error.message);
      
      // Fallback for critical analyze-and-assign task
      if (task === 'analyze-and-assign') {
        console.log(`    📋 Using default agent assignment as fallback`);
        return {
          assignedAgents: [
            'product-manager',
            'technical-product-manager',
            'backend-engineer',
            'frontend-engineer',
            'qa-engineer',
            'security-architect',
            'ai-safety-engineer',
            'privacy-engineer'
          ],
          reasoning: {
            'backend-engineer': 'Database and API implementation',
            'frontend-engineer': 'UI components',
            'qa-engineer': 'Testing and quality assurance',
            'security-architect': 'Security review',
            'ai-safety-engineer': 'AI safety considerations',
            'privacy-engineer': 'Privacy compliance'
          },
          sequencing: [
            { phase: 1, agents: ['backend-engineer'], reason: 'Database setup first' },
            { phase: 2, agents: ['frontend-engineer', 'qa-engineer'], reason: 'UI and testing' },
            { phase: 3, agents: ['security-architect', 'ai-safety-engineer', 'privacy-engineer'], reason: 'Review and compliance' }
          ]
        };
      }
      
      throw error;
    }
  }

  /**
   * Helper: Combine PM and TPM agent assignments
   */
  combineAgentAssignments(pmAnalysis, tpmAnalysis) {
    // In real implementation, intelligently combine both analyses
    // For now, use PM's assignment as base
    return pmAnalysis.assignedAgents || [
      'product-manager',
      'technical-product-manager',
      'backend-engineer',
      'frontend-engineer',
      'qa-engineer'
    ];
  }

  /**
   * Helper: Update PRD file with agent tasks
   */
  async updatePRDWithTasks(tasks) {
    let prdContent = fs.readFileSync(this.prdPath, 'utf8');
    
    // Find or create execution plan section
    const executionPlanSection = `
## Agent-Generated Execution Plan

| Task ID | Agent | Description | Dependencies | Deliverables | Status |
|---------|-------|-------------|--------------|--------------|--------|
${tasks.map(t => `| ${t.id} | ${t.agent} | ${t.description} | ${t.dependencies.join(', ') || 'None'} | ${t.deliverables.join(', ')} | Pending |`).join('\n')}
`;
    
    // Insert before sign-off section if it exists
    if (prdContent.includes('## 10. Sign-off')) {
      prdContent = prdContent.replace('## 10. Sign-off', executionPlanSection + '\n## 10. Sign-off');
    } else {
      prdContent += '\n' + executionPlanSection;
    }
    
    fs.writeFileSync(this.prdPath, prdContent);
  }

  /**
   * Helper: Build execution phases based on dependencies
   */
  buildExecutionPhases(tasks) {
    const phases = [];
    const completed = new Set();
    const remaining = [...tasks];
    
    while (remaining.length > 0) {
      const phase = [];
      
      for (const task of remaining) {
        // Check if all dependencies are completed
        const depsCompleted = task.dependencies.every(dep => completed.has(dep));
        
        if (depsCompleted) {
          phase.push(task);
        }
      }
      
      if (phase.length === 0 && remaining.length > 0) {
        console.warn('⚠️ Circular dependency detected, executing remaining tasks');
        phases.push(remaining);
        break;
      }
      
      // Mark phase tasks as completed
      phase.forEach(t => {
        completed.add(t.id);
        remaining.splice(remaining.indexOf(t), 1);
      });
      
      phases.push(phase);
    }
    
    return phases;
  }

  /**
   * Helper: Execute a single agent task
   */
  async executeAgentTask(task) {
    console.log(`    🔨 ${task.agent} executing: ${task.description}`);
    
    const result = await this.invokeRealAgent(task.agent, {
      task: 'execute-task',
      prompt: `Execute the following task as ${task.agent}:

Task: ${JSON.stringify(task, null, 2)}

Provide actual implementation, code, or deliverables as specified.`
    });
    
    return {
      task,
      result,
      completedAt: new Date().toISOString()
    };
  }
}

/**
 * Main orchestration function - replaces simulated workflow
 */
export async function orchestrateWithRealAgents(prdPath, featureId) {
  // Initialize Task tool bridge
  const hasRealAgents = initializeTaskBridge();
  
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║            🚀 REAL AI AGENT ORCHESTRATION SYSTEM              ║
║                                                                ║
║  ${hasRealAgents ? 'Using ACTUAL AI agents via Task tool        ' : 'Task tool unavailable - Using simulations   '}       ║
║  Each agent provides ${hasRealAgents ? 'REAL' : 'SIMULATED'} intelligence and implementation  ║
╚════════════════════════════════════════════════════════════════╝
`);

  const orchestrator = new RealAgentOrchestrator();
  
  try {
    // Phase 1: Discovery
    const availableAgents = await orchestrator.discoverAgents();
    console.log(`Available agents: ${availableAgents.join(', ')}`);
    
    // Phase 2: Assignment
    const assignedAgents = await orchestrator.assignAgents(prdPath, featureId);
    console.log(`Assigned agents: ${assignedAgents.join(', ')}`);
    
    // Phase 3: Task Addition
    const tasks = await orchestrator.addAgentTasks();
    console.log(`Total tasks: ${tasks.length}`);
    
    // Phase 4: Execution
    const completedTasks = await orchestrator.executeTasks(tasks);
    console.log(`Completed tasks: ${completedTasks.length}`);
    
    // Phase 5: Sign-off
    const signOffs = await orchestrator.getSignOffs();
    const approved = signOffs.every(s => s.approved);
    
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    ✅ ORCHESTRATION COMPLETE                   ║
║                                                                ║
║  Status: ${approved ? 'APPROVED BY ALL AGENTS' : 'NEEDS REVISION'}${' '.repeat(46 - (approved ? 21 : 14))}║
║  Tasks Completed: ${completedTasks.length}${' '.repeat(45 - completedTasks.length.toString().length)}║
║  Agents Involved: ${assignedAgents.length}${' '.repeat(45 - assignedAgents.length.toString().length)}║
╚════════════════════════════════════════════════════════════════╝
`);
    
    return {
      success: approved,
      agents: assignedAgents,
      tasks: completedTasks,
      signOffs: signOffs
    };
    
  } catch (error) {
    console.error('❌ Orchestration failed:', error);
    throw error;
  }
}

// Export for use in orch-start.mjs
export default { orchestrateWithRealAgents, RealAgentOrchestrator };