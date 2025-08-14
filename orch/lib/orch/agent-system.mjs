import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'node:events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Base Agent class for all team member agents
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
  }

  /**
   * Initialize agent from role definition file
   */
  static fromRoleFile(roleFile) {
    const content = fs.readFileSync(roleFile, 'utf8');
    const lines = content.split('\n');
    
    // Parse frontmatter
    let inFrontmatter = false;
    let frontmatter = {};
    let bodyStartIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true;
        } else {
          bodyStartIndex = i + 1;
          break;
        }
      } else if (inFrontmatter) {
        const match = lines[i].match(/^(\w+):\s*(.*)$/);
        if (match) {
          const [, key, value] = match;
          frontmatter[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    }
    
    // Extract expertise from body
    const body = lines.slice(bodyStartIndex).join('\n');
    const expertiseMatch = body.match(/Expertise:\s*([^\n]+)/);
    const expertise = expertiseMatch ? expertiseMatch[1].split(',').map(e => e.trim()) : [];
    
    return new Agent({
      name: frontmatter.name || path.basename(roleFile, '.md'),
      role: frontmatter.name || path.basename(roleFile, '.md'),
      description: frontmatter.description || '',
      allowedTools: frontmatter['allowed-tools'] ? JSON.parse(frontmatter['allowed-tools']) : ['*'],
      expertise,
      metadata: {
        source: roleFile,
        frontmatter,
        roleDefinition: body
      }
    });
  }

  /**
   * Assign a task to this agent
   */
  async assignTask(task) {
    // Reload role definition from markdown file if it exists
    if (this.metadata?.source) {
      const teamDir = path.join(__dirname, '../..', 'team');
      const roleFile = path.join(teamDir, `${this.role}.md`);
      
      if (fs.existsSync(roleFile)) {
        const content = fs.readFileSync(roleFile, 'utf8');
        const lines = content.split('\n');
        
        // Re-parse the role definition to get latest changes
        const body = lines.join('\n');
        this.metadata.roleDefinition = body;
        
        // Update expertise if changed
        const expertiseMatch = body.match(/Expertise:\s*([^\n]+)/);
        if (expertiseMatch) {
          this.expertise = expertiseMatch[1].split(',').map(e => e.trim());
        }
      }
    }
    
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
   * Execute the assigned task (override in subclasses)
   */
  async executeTask(task) {
    // Simulate task execution
    this.emit('task:progress', { task: task.id, progress: 0.5 });
    
    // In a real implementation, this would:
    // 1. Parse task requirements
    // 2. Use allowed tools to complete the task
    // 3. Apply role-specific expertise
    // 4. Return structured results
    
    return {
      taskId: task.id,
      agent: this.name,
      status: 'completed',
      output: `Task "${task.description}" completed by ${this.role}`,
      artifacts: [],
      completedAt: new Date().toISOString()
    };
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
   * Collaborate with another agent
   */
  async collaborateWith(otherAgent, message) {
    this.emit('collaboration:start', { with: otherAgent.name, message });
    
    // Exchange information
    const response = await otherAgent.receiveMessage({
      from: this.name,
      role: this.role,
      message,
      timestamp: new Date().toISOString()
    });
    
    this.emit('collaboration:end', { with: otherAgent.name, response });
    return response;
  }

  /**
   * Receive message from another agent
   */
  async receiveMessage(message) {
    this.emit('message:received', message);
    
    // Process message based on role expertise
    return {
      from: this.name,
      response: `Acknowledged: ${message.message}`,
      recommendations: this.generateRecommendations(message),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate recommendations based on expertise
   */
  generateRecommendations(context) {
    // Override in specialized agents
    return [];
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
 * Agent Manager for orchestrating multiple agents
 */
export class AgentManager extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.taskQueue = [];
    this.activeWorkflows = new Map();
  }

  /**
   * Register an agent
   */
  registerAgent(agent) {
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
   * Load all agents from team directory
   */
  async loadTeamAgents(forceReload = false) {
    // Clear existing agents if force reload
    if (forceReload && this.agents.size > 0) {
      console.log('Force reloading all agents from markdown files...');
      this.agents.clear();
    }
    
    const teamDir = path.join(__dirname, '../../team');
    const files = fs.readdirSync(teamDir).filter(f => 
      f.endsWith('.md') && 
      !f.startsWith('_') && 
      f !== 'rca-10-whys-prompt.md'
    );
    
    for (const file of files) {
      const roleFile = path.join(teamDir, file);
      // ALWAYS read from markdown files directly - no caching
      const agent = Agent.fromRoleFile(roleFile);
      this.registerAgent(agent);
    }
    
    return Array.from(this.agents.values());
  }
  
  /**
   * Reload a specific agent from its markdown file
   */
  async reloadAgent(agentName) {
    const teamDir = path.join(__dirname, '../../team');
    const roleFile = path.join(teamDir, `${agentName}.md`);
    
    if (fs.existsSync(roleFile)) {
      const agent = Agent.fromRoleFile(roleFile);
      this.registerAgent(agent); // Overwrites existing
      console.log(`Reloaded agent: ${agentName}`);
      return agent;
    }
    
    throw new Error(`Agent role file not found: ${agentName}.md`);
  }

  /**
   * Get agent by role
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
  findBestAgent(taskRequirements) {
    const availableAgents = Array.from(this.agents.values())
      .filter(a => a.status === 'idle');
    
    if (taskRequirements.role) {
      const specific = availableAgents.find(a => a.role === taskRequirements.role);
      if (specific) return specific;
    }
    
    // Match by expertise
    if (taskRequirements.expertise) {
      const matches = availableAgents.filter(a => 
        taskRequirements.expertise.some(req => 
          a.expertise.some(exp => exp.toLowerCase().includes(req.toLowerCase()))
        )
      );
      if (matches.length > 0) return matches[0];
    }
    
    // Return any available agent
    return availableAgents[0];
  }

  /**
   * Assign task to best available agent
   */
  async assignTask(task) {
    const agent = this.findBestAgent(task.requirements || {});
    
    if (!agent) {
      // Queue task if no agent available
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
   * Process queued tasks
   */
  async processQueue() {
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue[0];
      const result = await this.assignTask(task);
      
      if (result) {
        this.taskQueue.shift();
      } else {
        break; // No agents available
      }
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

  /**
   * Coordinate agents for a feature
   */
  async coordinateFeature(featureId, requirements) {
    const workflow = {
      name: `Feature ${featureId}`,
      id: `feature-${featureId}`,
      steps: []
    };
    
    // Determine required agents based on feature type
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
    
    // Always include QA
    workflow.steps.push({
      agent: 'qa-engineer',
      name: 'Quality Assurance',
      description: `Test feature ${featureId}`
    });
    
    return await this.createWorkflow(workflow);
  }
}

// Export singleton manager
export const agentManager = new AgentManager();