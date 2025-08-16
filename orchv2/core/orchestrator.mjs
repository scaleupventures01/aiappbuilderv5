/**
 * OrchV2 Main Orchestrator
 * Core orchestration engine optimized for Claude Code environment
 * Manages unlimited agents with multi-LLM support and HTML dashboard
 */

import { EventEmitter } from 'node:events';
import { ClaudeAdapter } from './claude-adapter.mjs';
import { DynamicAgentRegistry } from './agent-registry.mjs';
import { WorkflowEngine } from './workflow-engine.mjs';
import { DashboardServer } from '../dashboard/server.mjs';
import { MultiLLMRouter } from '../llm-router/router.mjs';
import { LearningSystem } from '../learning/learning-system.mjs';
import { SubAgentServices } from '../services/service-manager.mjs';

export class OrchV2Orchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      dashboardPort: config.dashboardPort || 8080,
      maxParallelAgents: config.maxParallelAgents || 100,
      enableLearning: config.enableLearning !== false,
      enableDashboard: config.enableDashboard !== false,
      claudeCodeOptimized: true,
      ...config
    };
    
    // Core components
    this.claudeAdapter = new ClaudeAdapter();
    this.agentRegistry = new DynamicAgentRegistry();
    this.workflowEngine = new WorkflowEngine(this);
    this.llmRouter = new MultiLLMRouter();
    this.learningSystem = new LearningSystem();
    this.services = new SubAgentServices(this);
    
    // Dashboard server
    this.dashboard = null;
    if (this.config.enableDashboard) {
      this.dashboard = new DashboardServer(this.config.dashboardPort);
    }
    
    // Execution state
    this.currentExecution = null;
    this.executionHistory = [];
    this.metrics = {
      totalExecutions: 0,
      successRate: 0,
      averageTime: 0,
      costSaved: 0,
      improvementRate: 0
    };
    
    this.initialize();
  }

  async initialize() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 OrchV2 Initializing                    ║
║                                                              ║
║  Claude Code Optimized Orchestration System v2.0            ║
╚══════════════════════════════════════════════════════════════╝
`);

    try {
      // Initialize core components
      await this.agentRegistry.discoverAgents();
      await this.llmRouter.initialize();
      await this.services.initialize();
      
      // Start dashboard if enabled
      if (this.dashboard) {
        await this.dashboard.start();
        console.log(`📊 Dashboard running at http://localhost:${this.config.dashboardPort}`);
        console.log(`   Navigate to see real-time orchestration progress`);
      }
      
      // Load learning data if available
      if (this.config.enableLearning) {
        await this.learningSystem.loadHistoricalData();
      }
      
      // Display initialization summary
      this.displayInitSummary();
      
      this.emit('initialized');
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  displayInitSummary() {
    const agentCount = this.agentRegistry.getAgentCount();
    const teamCount = this.agentRegistry.getTeamCount();
    const llmCount = this.llmRouter.getAvailableLLMs().length;
    
    console.log(`
📊 System Status:
├── Agents Discovered: ${agentCount} agents in ${teamCount} teams
├── LLMs Available: ${llmCount} models configured
├── Services: 5 sub-agent services ready
├── Dashboard: ${this.config.enableDashboard ? 'Active' : 'Disabled'}
├── Learning: ${this.config.enableLearning ? 'Enabled' : 'Disabled'}
└── Environment: Claude Code Optimized
`);
  }

  /**
   * Main orchestration entry point
   * @param {Object} request - Orchestration request
   * @returns {Object} Execution result with full tracking
   */
  async orchestrate(request) {
    const executionId = this.generateExecutionId();
    
    this.currentExecution = {
      id: executionId,
      request,
      startTime: Date.now(),
      status: 'initializing',
      phases: [],
      agents: new Map(),
      costs: { total: 0, byLLM: {}, byAgent: {} },
      metrics: {},
      errors: []
    };
    
    // Notify dashboard of new execution
    if (this.dashboard) {
      this.dashboard.broadcastUpdate({
        type: 'execution:start',
        execution: this.currentExecution
      });
    }
    
    try {
      // Pre-execution learning optimization
      if (this.config.enableLearning) {
        const optimizations = await this.learningSystem.suggestOptimizations(request);
        this.applyOptimizations(optimizations);
      }
      
      // Execute workflow through workflow engine
      const result = await this.workflowEngine.execute(request, {
        onPhaseStart: (phase) => this.handlePhaseStart(phase),
        onPhaseComplete: (phase, result) => this.handlePhaseComplete(phase, result),
        onAgentStart: (agent, task) => this.handleAgentStart(agent, task),
        onAgentComplete: (agent, result) => this.handleAgentComplete(agent, result)
      });
      
      // Post-execution learning
      if (this.config.enableLearning) {
        await this.learningSystem.learn(this.currentExecution);
      }
      
      // Finalize execution
      this.currentExecution.endTime = Date.now();
      this.currentExecution.duration = this.currentExecution.endTime - this.currentExecution.startTime;
      this.currentExecution.status = 'completed';
      this.currentExecution.result = result;
      
      // Update metrics
      this.updateMetrics(this.currentExecution);
      
      // Store in history
      this.executionHistory.push(this.currentExecution);
      
      // Final dashboard update
      if (this.dashboard) {
        this.dashboard.broadcastUpdate({
          type: 'execution:complete',
          execution: this.currentExecution
        });
      }
      
      return {
        success: true,
        executionId,
        result,
        metrics: this.currentExecution.metrics,
        costs: this.currentExecution.costs,
        duration: this.currentExecution.duration
      };
      
    } catch (error) {
      console.error(`❌ Orchestration failed: ${error.message}`);
      
      this.currentExecution.status = 'failed';
      this.currentExecution.error = error.message;
      
      if (this.dashboard) {
        this.dashboard.broadcastUpdate({
          type: 'execution:failed',
          execution: this.currentExecution,
          error: error.message
        });
      }
      
      throw error;
    }
  }

  /**
   * Handle phase start
   */
  handlePhaseStart(phase) {
    console.log(`\n🎯 Starting Phase: ${phase.name}`);
    
    this.currentExecution.phases.push({
      name: phase.name,
      startTime: Date.now(),
      status: 'running',
      agents: []
    });
    
    if (this.dashboard) {
      this.dashboard.broadcastUpdate({
        type: 'phase:start',
        executionId: this.currentExecution.id,
        phase: phase.name
      });
    }
  }

  /**
   * Handle phase completion
   */
  handlePhaseComplete(phase, result) {
    console.log(`✅ Phase Complete: ${phase.name}`);
    
    const currentPhase = this.currentExecution.phases[this.currentExecution.phases.length - 1];
    currentPhase.endTime = Date.now();
    currentPhase.duration = currentPhase.endTime - currentPhase.startTime;
    currentPhase.status = 'completed';
    currentPhase.result = result;
    
    if (this.dashboard) {
      this.dashboard.broadcastUpdate({
        type: 'phase:complete',
        executionId: this.currentExecution.id,
        phase: phase.name,
        duration: currentPhase.duration
      });
    }
  }

  /**
   * Handle agent start with LLM assignment
   */
  async handleAgentStart(agent, task) {
    // Assign optimal LLM for this agent/task
    const llmAssignment = await this.llmRouter.assignLLM(agent, task);
    
    console.log(`  🤖 ${agent} starting (LLM: ${llmAssignment.model})`);
    
    this.currentExecution.agents.set(agent, {
      startTime: Date.now(),
      status: 'running',
      llm: llmAssignment.model,
      estimatedCost: llmAssignment.estimatedCost,
      task
    });
    
    if (this.dashboard) {
      this.dashboard.broadcastUpdate({
        type: 'agent:start',
        executionId: this.currentExecution.id,
        agent,
        llm: llmAssignment.model,
        task: task.description
      });
    }
    
    return llmAssignment;
  }

  /**
   * Handle agent completion with cost tracking
   */
  handleAgentComplete(agent, result) {
    const agentData = this.currentExecution.agents.get(agent);
    agentData.endTime = Date.now();
    agentData.duration = agentData.endTime - agentData.startTime;
    agentData.status = 'completed';
    agentData.result = result;
    
    // Track costs
    const cost = this.llmRouter.calculateCost(agentData.llm, result.tokensUsed);
    agentData.actualCost = cost;
    
    this.currentExecution.costs.total += cost;
    this.currentExecution.costs.byLLM[agentData.llm] = 
      (this.currentExecution.costs.byLLM[agentData.llm] || 0) + cost;
    this.currentExecution.costs.byAgent[agent] = cost;
    
    console.log(`  ✅ ${agent} complete (Cost: $${cost.toFixed(4)})`);
    
    if (this.dashboard) {
      this.dashboard.broadcastUpdate({
        type: 'agent:complete',
        executionId: this.currentExecution.id,
        agent,
        duration: agentData.duration,
        cost
      });
    }
  }

  /**
   * Apply learning-based optimizations
   */
  applyOptimizations(optimizations) {
    if (optimizations.agentSelection) {
      // Optimize which agents to use
      this.workflowEngine.setAgentFilter(optimizations.agentSelection);
    }
    
    if (optimizations.llmOverrides) {
      // Override LLM assignments for specific agents
      this.llmRouter.applyOverrides(optimizations.llmOverrides);
    }
    
    if (optimizations.parallelization) {
      // Adjust parallelization strategy
      this.workflowEngine.setParallelization(optimizations.parallelization);
    }
    
    console.log(`🧠 Applied ${Object.keys(optimizations).length} optimizations from learning system`);
  }

  /**
   * Update system metrics
   */
  updateMetrics(execution) {
    this.metrics.totalExecutions++;
    
    if (execution.status === 'completed') {
      this.metrics.successRate = 
        ((this.metrics.successRate * (this.metrics.totalExecutions - 1)) + 1) / 
        this.metrics.totalExecutions;
    }
    
    this.metrics.averageTime = 
      ((this.metrics.averageTime * (this.metrics.totalExecutions - 1)) + execution.duration) / 
      this.metrics.totalExecutions;
    
    // Calculate cost savings vs using most expensive LLM for all
    const maxCost = this.llmRouter.calculateMaxCost(execution);
    const savings = maxCost - execution.costs.total;
    this.metrics.costSaved += savings;
    
    // Calculate improvement rate
    if (this.executionHistory.length > 1) {
      const previous = this.executionHistory[this.executionHistory.length - 2];
      const improvement = (previous.duration - execution.duration) / previous.duration;
      this.metrics.improvementRate = improvement * 100;
    }
  }

  /**
   * Generate unique execution ID
   */
  generateExecutionId() {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      agentCount: this.agentRegistry.getAgentCount(),
      teamCount: this.agentRegistry.getTeamCount(),
      llmCount: this.llmRouter.getAvailableLLMs().length,
      executionHistory: this.executionHistory.length
    };
  }

  /**
   * Shutdown orchestrator
   */
  async shutdown() {
    console.log('\n🛑 Shutting down OrchV2...');
    
    if (this.dashboard) {
      await this.dashboard.stop();
    }
    
    await this.services.shutdown();
    await this.learningSystem.save();
    
    console.log('✅ OrchV2 shutdown complete');
  }
}

// Export for use
export default OrchV2Orchestrator;