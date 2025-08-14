/**
 * Agent System V2 - Uses generated .mjs files as the execution layer
 * Markdown files are ONLY used for generation, never for runtime
 */

import { EventEmitter } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Base Agent class - Extended by generated agents
 */
export class Agent extends EventEmitter {
  constructor(config) {
    super();
    this.id = config.id || crypto.randomUUID();
    this.name = config.name;
    this.role = config.role;
    this.description = config.description;
    this.expertise = config.expertise || [];
    this.allowedTools = config.allowedTools || ['*'];
    this.status = 'idle';
    this.currentTask = null;
    this.taskHistory = [];
    this.metadata = config.metadata || {};
    this.agentManager = null; // Set by manager when registered
  }

  /**
   * Set the agent manager reference for collaboration
   */
  setManager(manager) {
    this.agentManager = manager;
  }

  /**
   * Request collaboration from another agent
   */
  async requestCollaboration(expertise, task) {
    if (!this.agentManager) {
      throw new Error('Agent not registered with manager');
    }
    
    return await this.agentManager.requestCollaboration(this, expertise, task);
  }

  /**
   * Share knowledge with other agents
   */
  async shareKnowledge(artifact) {
    if (!this.agentManager) {
      throw new Error('Agent not registered with manager');
    }
    
    return await this.agentManager.shareKnowledge(this, artifact);
  }

  /**
   * Assign a task to this agent - NO MARKDOWN RELOADING
   */
  async assignTask(task) {
    this.status = 'working';
    this.currentTask = {
      id: task.id || crypto.randomUUID(),
      description: task.description,
      requirements: task.requirements || [],
      assignedAt: new Date().toISOString(),
      context: task.context || {}
    };
    
    this.emit('task:assigned', this.currentTask);
    
    try {
      const result = await this.executeTask(this.currentTask);
      this.completeTask(result);
      return result;
    } catch (error) {
      this.failTask(error);
      throw error;
    }
  }

  /**
   * Execute the assigned task - MUST be overridden by generated agents
   */
  async executeTask(task) {
    throw new Error(`Agent ${this.name} must implement executeTask method`);
  }

  /**
   * Mark task as completed
   */
  completeTask(result) {
    if (this.currentTask) {
      this.currentTask.result = result;
      this.currentTask.completedAt = new Date().toISOString();
      this.taskHistory.push(this.currentTask);
      this.emit('task:completed', this.currentTask);
      this.currentTask = null;
      this.status = 'idle';
    }
  }

  /**
   * Mark task as failed
   */
  failTask(error) {
    if (this.currentTask) {
      this.currentTask.error = error;
      this.currentTask.failedAt = new Date().toISOString();
      this.taskHistory.push(this.currentTask);
      this.emit('task:failed', this.currentTask);
      this.currentTask = null;
      this.status = 'idle';
    }
  }

  /**
   * Get agent capabilities
   */
  getCapabilities() {
    return {
      role: this.role,
      expertise: this.expertise,
      allowedTools: this.allowedTools,
      status: this.status,
      currentTask: this.currentTask?.description
    };
  }

  /**
   * Collaborate with another agent through manager
   */
  async collaborateWith(agentName, message) {
    if (!this.agentManager) {
      throw new Error('Agent not registered with manager');
    }
    
    const otherAgent = this.agentManager.getAgent(agentName);
    if (!otherAgent) {
      throw new Error(`Agent ${agentName} not found`);
    }
    
    this.emit('collaboration:start', { with: agentName, message });
    
    const response = await otherAgent.receiveMessage({
      from: this.name,
      role: this.role,
      message,
      timestamp: new Date().toISOString()
    });
    
    this.emit('collaboration:end', { with: agentName, response });
    return response;
  }

  /**
   * Receive message from another agent
   */
  async receiveMessage(message) {
    this.emit('message:received', message);
    
    return {
      from: this.name,
      response: `Acknowledged: ${message.message}`,
      recommendations: await this.generateRecommendations(message),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate recommendations - Override in specialized agents
   */
  async generateRecommendations(context) {
    // Base implementation - specialized agents override this
    return [`Apply ${this.role} best practices`];
  }

  /**
   * Get agent status report
   */
  getStatusReport() {
    return {
      agent: this.name,
      role: this.role,
      status: this.status,
      currentTask: this.currentTask,
      tasksCompleted: this.taskHistory.filter(t => t.result).length,
      tasksFailed: this.taskHistory.filter(t => t.error).length,
      uptime: process.uptime(),
      lastActivity: this.taskHistory[this.taskHistory.length - 1]?.completedAt || 'Never'
    };
  }
}

/**
 * Agent Manager - Loads and orchestrates generated agent files
 */
export class AgentManager extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.taskQueue = [];
    this.activeWorkflows = new Map();
    this.agentModules = new Map(); // Cache imported modules
  }

  /**
   * Register an agent instance
   */
  registerAgent(agent) {
    agent.setManager(this); // Give agent reference to manager
    this.agents.set(agent.name, agent);
    
    // Forward agent events
    agent.on('task:completed', (task) => {
      this.emit('agent:task:completed', { agent: agent.name, task });
    });
    
    agent.on('task:failed', (task) => {
      this.emit('agent:task:failed', { agent: agent.name, task });
    });
    
    this.emit('agent:registered', agent.name);
    return agent;
  }

  /**
   * Load agents from generated .mjs files - NOT from markdown!
   */
  async loadAgentsFromModules() {
    console.log('Loading agents from generated .mjs files...');
    
    const agentsDir = path.join(__dirname, '../../agents');
    
    if (!fs.existsSync(agentsDir)) {
      throw new Error(`Agents directory not found: ${agentsDir}. Run generate-agents.mjs first!`);
    }
    
    const files = fs.readdirSync(agentsDir).filter(f => 
      f.endsWith('.mjs') && 
      f !== 'index.mjs'
    );
    
    console.log(`Found ${files.length} agent modules to load`);
    
    for (const file of files) {
      const agentName = file.replace('.mjs', '');
      
      try {
        // Dynamically import the agent module
        const modulePath = path.join(agentsDir, file);
        const agentModule = await import(modulePath);
        
        // Find the agent class (should be the first export or match the name)
        const AgentClass = Object.values(agentModule).find(
          exp => exp.prototype instanceof Agent || exp.name.includes('Agent')
        );
        
        if (AgentClass) {
          // Create instance of the specialized agent
          const agent = new AgentClass();
          this.registerAgent(agent);
          this.agentModules.set(agentName, AgentClass);
          console.log(`  ✓ Loaded ${agentName} agent`);
        } else {
          console.warn(`  ⚠ No valid agent class found in ${file}`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to load ${file}: ${error.message}`);
      }
    }
    
    console.log(`Successfully loaded ${this.agents.size} agents`);
    return Array.from(this.agents.values());
  }

  /**
   * Request collaboration between agents
   */
  async requestCollaboration(requestingAgent, expertise, task) {
    console.log(`\n🤝 ${requestingAgent.name} requesting collaboration for: ${task.description || task}`);
    
    // Find best agent for the expertise
    const helperAgent = this.findBestAgent({
      expertise: Array.isArray(expertise) ? expertise : [expertise],
      excludeAgents: [requestingAgent.name]
    });
    
    if (!helperAgent) {
      throw new Error(`No agent available with expertise: ${expertise}`);
    }
    
    console.log(`  → Assigning to ${helperAgent.name}`);
    
    // Create collaboration workflow
    const workflow = await this.createWorkflow({
      name: `${requestingAgent.name} → ${helperAgent.name} collaboration`,
      id: `collab-${Date.now()}`,
      steps: [{
        agent: helperAgent.name,
        name: 'Collaborative Task',
        description: task.description || task,
        requirements: { 
          expertise,
          collaborationWith: requestingAgent.name,
          context: task.context
        }
      }]
    });
    
    return workflow.results[0];
  }

  /**
   * Share knowledge between agents
   */
  async shareKnowledge(agent, artifact) {
    const shared = {
      ...artifact,
      sharedBy: agent.name,
      sharedAt: new Date().toISOString(),
      id: `knowledge-${Date.now()}`
    };
    
    // Broadcast to all agents
    for (const [name, otherAgent] of this.agents) {
      if (name !== agent.name) {
        otherAgent.emit('knowledge:shared', shared);
      }
    }
    
    this.emit('knowledge:shared', shared);
    return shared.id;
  }

  /**
   * Get agent by role/name
   */
  getAgent(role) {
    return this.agents.get(role);
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Find best agent for a task
   */
  findBestAgent(requirements) {
    const availableAgents = Array.from(this.agents.values())
      .filter(a => {
        // Exclude specified agents
        if (requirements.excludeAgents?.includes(a.name)) return false;
        // Only idle agents
        return a.status === 'idle';
      });
    
    if (requirements.role) {
      const specific = availableAgents.find(a => a.role === requirements.role);
      if (specific) return specific;
    }
    
    if (requirements.expertise) {
      const matches = availableAgents.filter(a => 
        requirements.expertise.some(req => 
          a.expertise.some(exp => exp.toLowerCase().includes(req.toLowerCase()))
        )
      );
      if (matches.length > 0) return matches[0];
    }
    
    return availableAgents[0];
  }

  /**
   * Assign task to best available agent
   */
  async assignTask(task) {
    const agent = this.findBestAgent(task.requirements || {});
    
    if (!agent) {
      this.taskQueue.push(task);
      this.emit('task:queued', task);
      return null;
    }
    
    return await agent.assignTask(task);
  }

  /**
   * Create a workflow with multiple agents
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
      for (const step of workflow.steps) {
        const agent = this.getAgent(step.agent);
        if (!agent) {
          throw new Error(`Agent ${step.agent} not found for step ${step.name}`);
        }
        
        const result = await agent.assignTask({
          description: step.description,
          requirements: step.requirements,
          context: {
            workflow: workflow.id,
            previousResults: workflow.results
          }
        });
        
        workflow.results.push(result);
        this.emit('workflow:step:completed', { workflow: workflow.id, step: step.name, result });
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
   * Get system status
   */
  getSystemStatus() {
    const agents = Array.from(this.agents.values());
    
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'working').length,
      idleAgents: agents.filter(a => a.status === 'idle').length,
      queuedTasks: this.taskQueue.length,
      activeWorkflows: this.activeWorkflows.size,
      agents: agents.map(a => a.getStatusReport())
    };
  }
}

// Export singleton manager
export const agentManager = new AgentManager();