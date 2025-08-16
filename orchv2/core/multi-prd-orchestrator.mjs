/**
 * Multi-PRD Orchestrator
 * Orchestrates execution of multiple PRDs with dependency management,
 * parallel execution, and comprehensive progress tracking
 */

import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';
import { NaturalLanguageWorkflowParser } from './nl-workflow-parser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

export class MultiPRDOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.parser = new NaturalLanguageWorkflowParser();
    this.activeProcesses = new Map();
    this.stageResults = new Map();
    this.progressTrackers = new Map();
    this.startTime = null;
    this.workflow = null;
  }

  /**
   * Main entry point - execute workflow from natural language description
   */
  async executeWorkflow(workflowDescription, options = {}) {
    console.log(`\n${colors.bright}🚀 Multi-PRD Workflow Orchestrator${colors.reset}`);
    console.log('═'.repeat(60));

    try {
      // Parse natural language description
      console.log('\n📝 Parsing workflow description...');
      this.workflow = await this.parser.parseWorkflowDescription(workflowDescription);

      if (this.workflow.validationErrors.length > 0) {
        console.error(`${colors.red}❌ Workflow validation failed:${colors.reset}`);
        this.workflow.validationErrors.forEach(error => {
          console.error(`   ${error}`);
        });
        return { success: false, errors: this.workflow.validationErrors };
      }

      // Show confirmation prompt
      const confirmationPrompt = this.parser.generateConfirmation(this.workflow);
      console.log('\n' + confirmationPrompt);

      // Get user confirmation
      const userResponse = await this.getUserConfirmation(options.autoConfirm);

      if (userResponse === 'n') {
        console.log(`${colors.yellow}⚠️  Workflow cancelled by user${colors.reset}`);
        return { success: false, cancelled: true };
      }

      if (userResponse === 'dry-run') {
        return await this.executeDryRun();
      }

      // Execute the workflow
      this.startTime = Date.now();
      const result = await this.executeStages();

      // Generate final report
      const report = this.generateFinalReport(result);
      console.log('\n' + report);

      return result;

    } catch (error) {
      console.error(`${colors.red}❌ Workflow execution failed: ${error.message}${colors.reset}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user confirmation for workflow execution
   */
  async getUserConfirmation(autoConfirm = false) {
    if (autoConfirm) {
      return 'y';
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      rl.question('', (answer) => {
        rl.close();
        const response = answer.toLowerCase().trim();
        if (['y', 'yes', 'n', 'no', 'dry-run'].includes(response)) {
          resolve(response.startsWith('y') ? 'y' : response.startsWith('n') ? 'n' : 'dry-run');
        } else {
          console.log('Please enter y, n, or dry-run');
          resolve(this.getUserConfirmation());
        }
      });
    });
  }

  /**
   * Execute dry run - show what would be executed without running
   */
  async executeDryRun() {
    console.log(`\n${colors.cyan}🔍 DRY RUN MODE${colors.reset}`);
    console.log('═'.repeat(60));

    const plan = this.parser.generateDryRunPlan(this.workflow);

    console.log('\n📋 Execution Plan:');
    plan.stages.forEach(stage => {
      console.log(`\n${colors.bright}${stage.id}:${colors.reset}`);
      console.log(`  Start time: T+${stage.startTime} minutes`);
      console.log(`  Tasks:`);
      stage.tasks.forEach(task => {
        console.log(`    - ${task.command}`);
        console.log(`      Duration: ${task.estimatedDuration} minutes`);
      });
      console.log(`  End time: T+${stage.endTime} minutes`);
    });

    console.log(`\n${colors.bright}Total estimated time: ${plan.totalDuration} minutes${colors.reset}`);

    return {
      success: true,
      dryRun: true,
      plan
    };
  }

  /**
   * Execute all workflow stages
   */
  async executeStages() {
    const results = {
      success: true,
      stages: [],
      totalDuration: 0,
      completedPRDs: [],
      failedPRDs: []
    };

    console.log(`\n${colors.cyan}🤖 Starting Full Agent Orchestration${colors.reset}`);
    console.log(`Each PRD will be reviewed by agents who will add tasks before execution\n`);

    for (const stage of this.workflow.stages) {
      console.log(`\n${colors.bright}📌 ${stage.name} - Starting${colors.reset}`);
      console.log('─'.repeat(50));
      
      if (stage.parallel && stage.prds.length > 1) {
        console.log(`🚀 Executing ${stage.prds.length} PRDs in parallel`);
        console.log(`   Each PRD will have agents review and add tasks independently`);
      } else {
        console.log(`📝 Executing PRD sequentially`);
      }

      const stageResult = await this.executeStage(stage);
      results.stages.push(stageResult);

      if (!stageResult.success) {
        console.error(`${colors.red}❌ ${stage.name} failed - blocking dependent stages${colors.reset}`);
        results.success = false;
        break; // Block on failure as requested
      }

      results.completedPRDs.push(...stageResult.completedPRDs);
      console.log(`${colors.green}✅ ${stage.name} completed successfully${colors.reset}`);
    }

    results.totalDuration = (Date.now() - this.startTime) / 1000 / 60; // in minutes
    return results;
  }

  /**
   * Execute a single stage (parallel or sequential PRDs)
   */
  async executeStage(stage) {
    const stageResult = {
      stageId: stage.id,
      stageName: stage.name,
      success: true,
      completedPRDs: [],
      failedPRDs: [],
      duration: 0,
      logs: []
    };

    const stageStartTime = Date.now();

    if (stage.parallel) {
      // Execute PRDs in parallel
      const promises = stage.prds.map(prdId => 
        this.executePRD(prdId, stage)
      );

      // Monitor progress while waiting
      this.startProgressMonitoring(stage.prds);

      try {
        const results = await Promise.all(promises);
        results.forEach((result, index) => {
          if (result.success) {
            stageResult.completedPRDs.push(stage.prds[index]);
          } else {
            stageResult.failedPRDs.push(stage.prds[index]);
            stageResult.success = false;
          }
          stageResult.logs.push(result);
        });
      } catch (error) {
        stageResult.success = false;
        stageResult.error = error.message;
      }

      this.stopProgressMonitoring();

    } else {
      // Execute PRDs sequentially
      for (const prdId of stage.prds) {
        console.log(`\n  🔄 Executing PRD-${prdId}...`);
        
        const result = await this.executePRD(prdId, stage);
        
        if (result.success) {
          stageResult.completedPRDs.push(prdId);
          console.log(`  ${colors.green}✓${colors.reset} PRD-${prdId} completed`);
        } else {
          stageResult.failedPRDs.push(prdId);
          stageResult.success = false;
          console.error(`  ${colors.red}✗${colors.reset} PRD-${prdId} failed`);
          break; // Stop on first failure in sequential mode
        }
        
        stageResult.logs.push(result);
      }
    }

    stageResult.duration = (Date.now() - stageStartTime) / 1000 / 60; // in minutes
    this.stageResults.set(stage.id, stageResult);

    return stageResult;
  }

  /**
   * Execute a single PRD using orch start with full agent orchestration
   */
  async executePRD(prdId, stage) {
    return new Promise((resolve) => {
      const result = {
        prdId,
        success: false,
        output: [],
        error: null,
        duration: 0,
        agentsInvoked: []
      };

      const startTime = Date.now();

      // Resolve actual PRD file path
      const prdPath = this.resolvePRDPath(prdId);
      if (!prdPath) {
        result.error = `PRD path not found for ${prdId}`;
        resolve(result);
        return;
      }

      console.log(`  📄 Starting orchestration for: ${prdPath}`);
      console.log(`  🤖 Agents will review PRD and add tasks...`);

      // Use the actual orch start command with PRD path
      // This triggers the full flow: agents review -> add tasks -> execute
      const orchExecutable = path.resolve(__dirname, '../../orch');
      const args = ['start', prdPath];
      
      // CRITICAL FIX: Spawn from project root, not orch directory
      // This ensures PRD paths are resolved correctly
      const projectRoot = path.resolve(__dirname, '../../..');
      
      // Add timeout handling
      const AGENT_TIMEOUT = 300000; // 5 minutes per PRD
      let timeoutHandle;
      
      const orchProcess = spawn(orchExecutable, args, {
        cwd: projectRoot,
        env: { ...process.env, FORCE_COLOR: '1' }
      });
      
      // Set timeout for long-running processes
      timeoutHandle = setTimeout(() => {
        console.error(`  ${colors.red}⚠️  Timeout: PRD-${prdId} exceeded ${AGENT_TIMEOUT/1000}s limit${colors.reset}`);
        orchProcess.kill('SIGTERM');
        result.error = `Process timeout after ${AGENT_TIMEOUT/1000} seconds`;
        result.success = false;
      }, AGENT_TIMEOUT);

      // Track the process
      this.activeProcesses.set(prdId, orchProcess);
      this.progressTrackers.set(prdId, {
        progress: 0,
        status: 'starting',
        agentsCompleted: 0,
        totalAgents: 0
      });

      // Capture output
      orchProcess.stdout.on('data', (data) => {
        const output = data.toString();
        result.output.push(output);
        
        // Parse progress from output
        this.updateProgressFromOutput(prdId, output);
        
        // Emit progress event
        this.emit('prdProgress', {
          prdId,
          stage: stage.id,
          output
        });
      });

      orchProcess.stderr.on('data', (data) => {
        const error = data.toString();
        result.output.push(`ERROR: ${error}`);
        
        this.emit('prdError', {
          prdId,
          stage: stage.id,
          error
        });
      });

      orchProcess.on('close', (code) => {
        // Clear timeout on process completion
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        
        result.duration = (Date.now() - startTime) / 1000 / 60; // in minutes
        result.success = code === 0;
        
        if (code !== 0 && !result.error) {
          result.error = `Process exited with code ${code}`;
        }

        // Clean up tracking
        this.activeProcesses.delete(prdId);
        this.progressTrackers.delete(prdId);

        resolve(result);
      });

      orchProcess.on('error', (error) => {
        // Clear timeout on error
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        
        result.error = error.message;
        result.success = false;
        
        // Clean up tracking
        this.activeProcesses.delete(prdId);
        this.progressTrackers.delete(prdId);
        
        resolve(result);
      });
    });
  }

  /**
   * Resolve PRD file path - finds actual PRD file
   */
  resolvePRDPath(prdId) {
    const appRoot = path.resolve(__dirname, '../../../app');
    
    // Map of known PRD locations based on ID patterns
    const prdMappings = {
      '1.1.2.1': 'app/PRDs/M0/1.1/Phase-3A-Backend-API/PRD-1.1.2.1-express-server.md',
      '1.1.2.2': 'app/PRDs/M0/1.1/Phase-3A-Backend-API/PRD-1.1.2.2-cors-configuration.md',
      '1.1.2.3': 'app/PRDs/M0/1.1/Phase-3A-Backend-API/PRD-1.1.2.3-socketio-server.md',
      '1.1.2.4': 'app/PRDs/M0/1.1/Phase-3A-Backend-API/PRD-1.1.2.4-message-post-endpoint.md',
      '1.1.2.5': 'app/PRDs/M0/1.1/Phase-3A-Backend-API/PRD-1.1.2.5-message-get-endpoint.md',
      '1.1.2.6': 'app/PRDs/M0/1.1/Phase-3A-Backend-API/PRD-1.1.2.6-socket-message-handler.md',
      '1.1.2.7': 'app/PRDs/M0/1.1/Phase-3A-Backend-API/PRD-1.1.2.7-socket-broadcast.md',
      '1.1.1.2': 'app/PRDs/M0/1.1/Phase-1-Independent/PRD-1.1.1.2-users-table.md',
      '1.1.1.3': 'app/PRDs/M0/1.1/Phase-2-Database-Schema/PRD-1.1.1.3-conversations-table.md',
      '1.1.1.4': 'app/PRDs/M0/1.1/Phase-2-Database-Schema/PRD-1.1.1.4-messages-table.md',
      '1.1.3.1': 'app/PRDs/M0/1.1/Phase-1-Independent/PRD-1.1.3.1-react-vite-setup.md',
      '1.1.5.1': 'app/PRDs/M0/1.1/Phase-1-Independent/PRD-1.1.5.1-cloudinary-setup.md'
    };

    // Check if we have a known mapping
    if (prdMappings[prdId]) {
      const fullPath = path.join(appRoot, prdMappings[prdId].replace('app/', ''));
      
      // Validate that the file actually exists
      if (!fs.existsSync(fullPath)) {
        console.warn(`PRD file not found: ${fullPath}`);
        return null;
      }
      
      // Return the path relative to project root (what orch start expects)
      return prdMappings[prdId];
    }

    // Try to construct path based on ID pattern and check if file exists
    const phases = [
      'app/PRDs/M0/1.1/Phase-3A-Backend-API',
      'app/PRDs/M0/1.1/Phase-2-Database-Schema', 
      'app/PRDs/M0/1.1/Phase-1-Independent'
    ];
    
    for (const phase of phases) {
      const pattern = `${phase}/PRD-${prdId}-*.md`;
      const fullPattern = path.join(path.resolve(__dirname, '../../..'), pattern);
      
      try {
        // Try to find matching files
        const glob = require('glob');
        const matches = glob.sync(fullPattern);
        if (matches.length > 0) {
          const projectRoot = path.resolve(__dirname, '../../..');
          return path.relative(projectRoot, matches[0]);
        }
      } catch (error) {
        // Glob not available, continue
      }
    }
    
    // Return null if not found
    return null;
  }

  /**
   * Update progress tracking from process output
   */
  updateProgressFromOutput(prdId, output) {
    const tracker = this.progressTrackers.get(prdId);
    if (!tracker) return;

    // Parse actual orch start output indicators
    if (output.includes('Starting ORCH Orchestration System')) {
      tracker.progress = 5;
      tracker.status = 'initializing';
    } else if (output.includes('Invoking 33 AI agents') || output.includes('Invoking') && output.includes('agents')) {
      tracker.progress = 10;
      tracker.status = 'invoking agents';
    } else if (output.includes('agents to review')) {
      tracker.progress = 20;
      tracker.status = 'agents reviewing PRD';
    } else if (output.includes('adding tasks to PRD')) {
      tracker.progress = 30;
      tracker.status = 'agents adding tasks';
    } else if (output.includes('PHASE 1: DISCOVERY')) {
      tracker.progress = 10;
      tracker.status = 'discovering agents';
    } else if (output.includes('PHASE 2: INTELLIGENT AGENT ASSIGNMENT')) {
      tracker.progress = 25;
      tracker.status = 'assigning agents';
    } else if (output.includes('PHASE 3: TASK ADDITION')) {
      tracker.progress = 40;
      tracker.status = 'agents adding tasks to PRD';
    } else if (output.includes('PHASE 4: IMPLEMENTATION')) {
      tracker.progress = 60;
      tracker.status = 'implementing';
    } else if (output.includes('PHASE 5: REVIEW')) {
      tracker.progress = 80;
      tracker.status = 'reviewing';
    } else if (output.includes('✅') && output.includes('completed')) {
      tracker.agentsCompleted++;
      tracker.progress = Math.min(95, 60 + (tracker.agentsCompleted * 3));
    } else if (output.includes('WORKFLOW COMPLETED SUCCESSFULLY')) {
      tracker.progress = 100;
      tracker.status = 'completed';
    } else if (output.includes('Excellence Standard Summary')) {
      tracker.progress = 95;
      tracker.status = 'finalizing';
    }
  }

  /**
   * Start progress monitoring for parallel execution
   */
  startProgressMonitoring(prdIds) {
    this.progressInterval = setInterval(() => {
      this.displayProgress(prdIds);
    }, 2000); // Update every 2 seconds
  }

  /**
   * Stop progress monitoring
   */
  stopProgressMonitoring() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Display progress bars for parallel PRDs
   */
  displayProgress(prdIds) {
    // Clear previous lines
    process.stdout.write('\x1b[2K\x1b[G'); // Clear line and return to start
    
    prdIds.forEach((prdId, index) => {
      const tracker = this.progressTrackers.get(prdId) || { progress: 0, status: 'pending' };
      const progressBar = this.createProgressBar(tracker.progress);
      
      if (index > 0) {
        process.stdout.write('\x1b[1A'); // Move up one line
      }
      
      process.stdout.write('\x1b[2K\x1b[G'); // Clear line
      console.log(`  [${prdId}] ${progressBar} ${tracker.progress}% | ${tracker.status}`);
    });
  }

  /**
   * Create visual progress bar
   */
  createProgressBar(progress) {
    const barLength = 20;
    const filled = Math.floor((progress / 100) * barLength);
    const empty = barLength - filled;
    
    const filledBar = '█'.repeat(filled);
    const emptyBar = '░'.repeat(empty);
    
    return `${colors.green}${filledBar}${colors.reset}${emptyBar}`;
  }

  /**
   * Generate final execution report
   */
  generateFinalReport(result) {
    const lines = [];
    
    lines.push('═'.repeat(60));
    lines.push(`${colors.bright}📊 WORKFLOW EXECUTION REPORT${colors.reset}`);
    lines.push('═'.repeat(60));
    
    lines.push(`\nStatus: ${result.success ? `${colors.green}SUCCESS${colors.reset}` : `${colors.red}FAILED${colors.reset}`}`);
    lines.push(`Duration: ${result.totalDuration.toFixed(1)} minutes`);
    lines.push(`Completed PRDs: ${result.completedPRDs.length}`);
    lines.push(`Failed PRDs: ${result.failedPRDs.length}`);
    
    if (result.completedPRDs.length > 0) {
      lines.push(`\n${colors.green}✅ Completed:${colors.reset}`);
      result.completedPRDs.forEach(prd => {
        lines.push(`   - PRD-${prd}`);
      });
    }
    
    if (result.failedPRDs.length > 0) {
      lines.push(`\n${colors.red}❌ Failed:${colors.reset}`);
      result.failedPRDs.forEach(prd => {
        lines.push(`   - PRD-${prd}`);
      });
    }
    
    lines.push('\n' + '═'.repeat(60));
    
    return lines.join('\n');
  }

  /**
   * Handle cross-PRD dependencies and alerts
   */
  async checkCrossPRDDependencies(prdId, changes) {
    // Analyze if changes in one PRD affect others
    const affectedPRDs = [];
    
    // Check for shared resources, database schemas, API contracts, etc.
    if (changes.includes('database') || changes.includes('schema')) {
      // Alert about potential database conflicts
      affectedPRDs.push(...this.findPRDsUsingDatabase());
    }
    
    if (changes.includes('api') || changes.includes('endpoint')) {
      // Alert about API changes
      affectedPRDs.push(...this.findPRDsUsingAPI());
    }
    
    if (affectedPRDs.length > 0) {
      console.log(`\n${colors.yellow}⚠️  CROSS-PRD ALERT:${colors.reset}`);
      console.log(`Changes in PRD-${prdId} may affect:`);
      affectedPRDs.forEach(prd => {
        console.log(`   - ${prd}`);
      });
      console.log('Please review these PRDs for compatibility.\n');
      
      this.emit('crossPRDAlert', {
        sourcePRD: prdId,
        affectedPRDs,
        changes
      });
    }
  }

  /**
   * Find PRDs that use database (stub - would analyze PRD content)
   */
  findPRDsUsingDatabase() {
    // In real implementation, would analyze PRD dependencies
    return this.workflow ? this.workflow.stages.flatMap(s => s.prds) : [];
  }

  /**
   * Find PRDs that use API (stub - would analyze PRD content)
   */
  findPRDsUsingAPI() {
    // In real implementation, would analyze PRD dependencies
    return this.workflow ? this.workflow.stages.flatMap(s => s.prds) : [];
  }

  /**
   * Cancel workflow execution
   */
  async cancelWorkflow() {
    console.log(`\n${colors.yellow}⚠️  Cancelling workflow...${colors.reset}`);
    
    // Kill all active processes
    for (const [prdId, process] of this.activeProcesses) {
      console.log(`  Stopping PRD-${prdId}...`);
      process.kill('SIGTERM');
    }
    
    this.stopProgressMonitoring();
    this.activeProcesses.clear();
    this.progressTrackers.clear();
    
    console.log(`${colors.yellow}Workflow cancelled${colors.reset}`);
  }
}

// Export singleton instance
export const multiPRDOrchestrator = new MultiPRDOrchestrator();