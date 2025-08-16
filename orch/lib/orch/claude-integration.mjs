/**
 * Claude Integration Module
 * Makes "orch workflow" commands work seamlessly in Claude's interface
 * 
 * This module bridges the gap between Claude's natural language processing
 * and the multi-PRD orchestration system
 */

import { MultiPRDOrchestrator } from './multi-prd-orchestrator.mjs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ClaudeIntegration {
  /**
   * Patterns that indicate a workflow command
   */
  static WORKFLOW_PATTERNS = [
    /^orch\s+workflow\s+(.+)$/i,
    /^workflow\s+(.+)$/i,
    /^run\s+(.+)\s+(?:then|and then|followed by|after)\s+(.+)/i,
    /^execute\s+(.+)\s+(?:sequentially|in parallel|together)/i,
    /^orchestrate\s+(.+)/i
  ];

  /**
   * Check if user input is a workflow command
   */
  static shouldTriggerOrchestrator(userMessage) {
    const message = userMessage.toLowerCase().trim();
    
    // Quick checks for workflow keywords
    const workflowKeywords = [
      'orch workflow',
      'workflow run',
      'workflow execute',
      'orchestrate'
    ];
    
    // Check for workflow keywords
    if (workflowKeywords.some(keyword => message.includes(keyword))) {
      return true;
    }
    
    // Check for sequential/parallel execution patterns
    const executionPatterns = [
      /run\s+\d+\.\d+.*(?:then|after|followed by)\s+\d+\.\d+/i,
      /execute\s+\d+\.\d+.*(?:and|with|together)\s+\d+\.\d+/i,
      /start\s+(?:prd[-\s]*)?\d+\.\d+.*(?:then|and)/i
    ];
    
    return executionPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Extract workflow description from user message
   */
  static extractWorkflowDescription(userMessage) {
    let description = userMessage.trim();
    
    // Remove common prefixes
    const prefixesToRemove = [
      /^orch\s+workflow\s+/i,
      /^workflow\s+/i,
      /^orchestrate\s+/i,
      /^execute\s+/i
    ];
    
    for (const prefix of prefixesToRemove) {
      description = description.replace(prefix, '');
    }
    
    return description;
  }

  /**
   * Handle workflow command from Claude
   * This is the main entry point for Claude to execute workflows
   */
  static async handleWorkflowCommand(userMessage, options = {}) {
    console.log('🤖 Claude Integration: Processing workflow command');
    
    // Check if this is actually a workflow command
    if (!this.shouldTriggerOrchestrator(userMessage)) {
      console.log('❌ Not a workflow command, letting Claude handle manually');
      return null;
    }
    
    // Extract the workflow description
    const workflowDescription = this.extractWorkflowDescription(userMessage);
    console.log(`📝 Workflow description: "${workflowDescription}"`);
    
    // Execute using the actual orchestrator
    try {
      console.log('🚀 Triggering Multi-PRD Orchestrator...');
      
      const orchestrator = new MultiPRDOrchestrator();
      const result = await orchestrator.executeWorkflow(workflowDescription, {
        autoConfirm: options.autoConfirm !== undefined ? options.autoConfirm : false,
        claudeInvoked: true,
        ...options
      });
      
      console.log('✅ Workflow completed via orchestrator');
      return result;
      
    } catch (error) {
      console.error('❌ Workflow execution failed:', error.message);
      return {
        success: false,
        error: error.message,
        claudeHandled: false
      };
    }
  }

  /**
   * Execute workflow via CLI (alternative approach)
   * This spawns the actual orch command as a subprocess
   */
  static async executeViaOrchCLI(workflowDescription, options = {}) {
    return new Promise((resolve, reject) => {
      const orchPath = path.resolve(__dirname, '../../orch');
      const args = ['workflow', workflowDescription];
      
      console.log(`🎯 Executing: orch ${args.join(' ')}`);
      
      const orchProcess = spawn(orchPath, args, {
        cwd: path.resolve(__dirname, '../../..'),
        env: { ...process.env, FORCE_COLOR: '1' },
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      orchProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text);
      });
      
      orchProcess.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        console.error(text);
      });
      
      // Handle interactive prompt
      if (options.autoConfirm) {
        setTimeout(() => {
          orchProcess.stdin.write('y\n');
        }, 1000);
      }
      
      orchProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output,
            executionMethod: 'cli'
          });
        } else {
          reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
        }
      });
      
      orchProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Validate workflow before execution
   */
  static async validateWorkflow(workflowDescription) {
    const orchestrator = new MultiPRDOrchestrator();
    const workflow = await orchestrator.parser.parseWorkflowDescription(workflowDescription);
    
    return {
      valid: workflow.validationErrors.length === 0,
      errors: workflow.validationErrors,
      stages: workflow.stages,
      prdCount: workflow.prdCount,
      estimatedTime: workflow.estimatedTime
    };
  }

  /**
   * Get execution plan without running
   */
  static async getExecutionPlan(workflowDescription) {
    const orchestrator = new MultiPRDOrchestrator();
    const workflow = await orchestrator.parser.parseWorkflowDescription(workflowDescription);
    const confirmation = orchestrator.parser.generateConfirmation(workflow);
    
    return {
      plan: confirmation,
      workflow
    };
  }

  /**
   * Claude should call this to check if a command is a workflow
   * and get instructions on how to handle it
   */
  static analyzeCommand(userMessage) {
    const isWorkflow = this.shouldTriggerOrchestrator(userMessage);
    
    if (!isWorkflow) {
      return {
        isWorkflowCommand: false,
        instruction: 'Handle normally'
      };
    }
    
    return {
      isWorkflowCommand: true,
      workflowDescription: this.extractWorkflowDescription(userMessage),
      instruction: 'Use ClaudeIntegration.handleWorkflowCommand() to execute',
      example: `
        // Claude should execute:
        const result = await ClaudeIntegration.handleWorkflowCommand(
          "${userMessage}",
          { autoConfirm: true } // or false to show confirmation
        );
      `
    };
  }
}

// Export for use in Claude's context
export default ClaudeIntegration;

/**
 * INSTRUCTIONS FOR CLAUDE:
 * 
 * When a user types a workflow command like:
 * - "orch workflow run 1.1.3.3 and then 1.1.3.4"
 * - "workflow execute 1.1.2.5 then 1.1.2.6"
 * - "run 1.1.1.2, 1.1.1.3 in parallel then 1.1.1.4"
 * 
 * You should:
 * 1. Import this module
 * 2. Call ClaudeIntegration.handleWorkflowCommand(userMessage)
 * 3. The orchestrator will handle everything else
 * 
 * DO NOT manually implement PRDs or call "orch start" directly!
 * Let the multi-PRD orchestrator handle the workflow.
 */